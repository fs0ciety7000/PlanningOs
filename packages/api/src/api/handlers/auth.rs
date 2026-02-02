//! Authentication Handlers

use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::infrastructure::{
    auth::{jwt::JwtService, password::verify_password},
    AppState,
};

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
    pub user: UserResponse,
}

#[derive(Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct UserResponse {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub role_id: Option<Uuid>,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub matricule: Option<String>,
    pub avatar_url: Option<String>,
    pub phone: Option<String>,
    pub cn_entitlement: i32,
    pub jc_entitlement: i32,
    pub cn_carryover: i32,
    pub jc_carryover: i32,
    pub is_active: bool,
    #[sqlx(skip)]
    pub role: String,
}

#[derive(FromRow)]
struct UserRow {
    id: Uuid,
    organization_id: Uuid,
    role_id: Option<Uuid>,
    email: String,
    password_hash: String,
    first_name: String,
    last_name: String,
    matricule: Option<String>,
    avatar_url: Option<String>,
    phone: Option<String>,
    cn_entitlement: i32,
    jc_entitlement: i32,
    cn_carryover: i32,
    jc_carryover: i32,
    is_active: bool,
    role_name: Option<String>,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
}

/// Login handler
pub async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Find user by email with role
    let user: Option<UserRow> = sqlx::query_as(
        r#"
        SELECT
            u.id, u.organization_id, u.role_id, u.email, u.password_hash,
            u.first_name, u.last_name, u.matricule, u.avatar_url, u.phone,
            u.cn_entitlement, u.jc_entitlement, u.cn_carryover, u.jc_carryover,
            u.is_active,
            r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.email = $1 AND u.is_active = true
        "#,
    )
    .bind(&body.email)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Database error during login: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                code: "DATABASE_ERROR".to_string(),
                message: "An error occurred during login".to_string(),
            }),
        )
    })?;

    let user = user.ok_or_else(|| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                code: "INVALID_CREDENTIALS".to_string(),
                message: "Invalid email or password".to_string(),
            }),
        )
    })?;

    // Verify password
    let is_valid = verify_password(&body.password, &user.password_hash).map_err(|e| {
        tracing::error!("Password verification error: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                code: "AUTH_ERROR".to_string(),
                message: "Authentication failed".to_string(),
            }),
        )
    })?;

    if !is_valid {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                code: "INVALID_CREDENTIALS".to_string(),
                message: "Invalid email or password".to_string(),
            }),
        ));
    }

    // Generate JWT tokens
    let jwt_service = JwtService::new(
        &state.settings.jwt.secret,
        state.settings.jwt.access_expiry_secs,
        state.settings.jwt.refresh_expiry_secs,
    );

    let role_name = user.role_name.clone().unwrap_or_else(|| "agent".to_string());
    let tokens = jwt_service
        .create_tokens(user.id, user.organization_id, &role_name)
        .map_err(|e| {
            tracing::error!("Token creation error: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    code: "TOKEN_ERROR".to_string(),
                    message: "Failed to create authentication tokens".to_string(),
                }),
            )
        })?;

    // Update last login
    let _ = sqlx::query("UPDATE users SET last_login_at = NOW() WHERE id = $1")
        .bind(user.id)
        .execute(&state.db)
        .await;

    Ok(Json(LoginResponse {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        user: UserResponse {
            id: user.id,
            organization_id: user.organization_id,
            role_id: user.role_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            matricule: user.matricule,
            avatar_url: user.avatar_url,
            phone: user.phone,
            cn_entitlement: user.cn_entitlement,
            jc_entitlement: user.jc_entitlement,
            cn_carryover: user.cn_carryover,
            jc_carryover: user.jc_carryover,
            is_active: user.is_active,
            role: role_name,
        },
    }))
}

#[derive(Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RefreshResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

/// Refresh token handler
pub async fn refresh(
    State(state): State<AppState>,
    Json(body): Json<RefreshRequest>,
) -> Result<Json<RefreshResponse>, (StatusCode, Json<ErrorResponse>)> {
    let jwt_service = JwtService::new(
        &state.settings.jwt.secret,
        state.settings.jwt.access_expiry_secs,
        state.settings.jwt.refresh_expiry_secs,
    );

    // Validate refresh token
    let claims = jwt_service.validate_refresh_token(&body.refresh_token).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                code: "INVALID_TOKEN".to_string(),
                message: "Invalid or expired refresh token".to_string(),
            }),
        )
    })?;

    // Get user role from database
    let role: Option<(String,)> = sqlx::query_as(
        "SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                code: "DATABASE_ERROR".to_string(),
                message: "Failed to fetch user".to_string(),
            }),
        )
    })?;

    let role_name = role.map(|r| r.0).unwrap_or_else(|| "agent".to_string());

    // Create new tokens
    let tokens = jwt_service
        .create_tokens(claims.sub, claims.org, &role_name)
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    code: "TOKEN_ERROR".to_string(),
                    message: "Failed to create tokens".to_string(),
                }),
            )
        })?;

    Ok(Json(RefreshResponse {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
    }))
}

/// Logout handler
pub async fn logout(State(_state): State<AppState>) -> StatusCode {
    // For stateless JWT, logout is handled client-side by deleting tokens
    // Optionally, we could blacklist the token here
    StatusCode::OK
}

/// Get current user handler
pub async fn me(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
) -> Result<Json<UserResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Extract token from Authorization header
    let auth_header = headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    code: "MISSING_TOKEN".to_string(),
                    message: "Authorization header required".to_string(),
                }),
            )
        })?;

    let token = auth_header.strip_prefix("Bearer ").ok_or_else(|| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                code: "INVALID_TOKEN".to_string(),
                message: "Invalid authorization header format".to_string(),
            }),
        )
    })?;

    let jwt_service = JwtService::new(
        &state.settings.jwt.secret,
        state.settings.jwt.access_expiry_secs,
        state.settings.jwt.refresh_expiry_secs,
    );

    let claims = jwt_service.validate_access_token(token).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                code: "INVALID_TOKEN".to_string(),
                message: "Invalid or expired token".to_string(),
            }),
        )
    })?;

    // Fetch user from database
    let user: Option<UserRow> = sqlx::query_as(
        r#"
        SELECT
            u.id, u.organization_id, u.role_id, u.email, u.password_hash,
            u.first_name, u.last_name, u.matricule, u.avatar_url, u.phone,
            u.cn_entitlement, u.jc_entitlement, u.cn_carryover, u.jc_carryover,
            u.is_active,
            r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
        "#,
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                code: "DATABASE_ERROR".to_string(),
                message: "Failed to fetch user".to_string(),
            }),
        )
    })?;

    let user = user.ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                code: "USER_NOT_FOUND".to_string(),
                message: "User not found".to_string(),
            }),
        )
    })?;

    Ok(Json(UserResponse {
        id: user.id,
        organization_id: user.organization_id,
        role_id: user.role_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        matricule: user.matricule,
        avatar_url: user.avatar_url,
        phone: user.phone,
        cn_entitlement: user.cn_entitlement,
        jc_entitlement: user.jc_entitlement,
        cn_carryover: user.cn_carryover,
        jc_carryover: user.jc_carryover,
        is_active: user.is_active,
        role: user.role_name.unwrap_or_else(|| "agent".to_string()),
    }))
}
