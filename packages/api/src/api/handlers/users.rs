//! User Management Handlers

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::infrastructure::{auth::password::hash_password, AppState};

#[derive(Serialize)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
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

/// List users
pub async fn list(
    State(state): State<AppState>,
) -> Result<Json<Vec<UserResponse>>, (StatusCode, Json<ErrorResponse>)> {
    let users: Vec<UserRow> = sqlx::query_as(
        r#"
        SELECT
            u.id, u.organization_id, u.role_id, u.email,
            u.first_name, u.last_name, u.matricule, u.avatar_url, u.phone,
            u.cn_entitlement, u.jc_entitlement, u.cn_carryover, u.jc_carryover,
            u.is_active,
            r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.last_name, u.first_name
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Database error: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                code: "DATABASE_ERROR".to_string(),
                message: "Failed to fetch users".to_string(),
            }),
        )
    })?;

    let users: Vec<UserResponse> = users
        .into_iter()
        .map(|u| UserResponse {
            id: u.id,
            organization_id: u.organization_id,
            role_id: u.role_id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            matricule: u.matricule,
            avatar_url: u.avatar_url,
            phone: u.phone,
            cn_entitlement: u.cn_entitlement,
            jc_entitlement: u.jc_entitlement,
            cn_carryover: u.cn_carryover,
            jc_carryover: u.jc_carryover,
            is_active: u.is_active,
            role: u.role_name.unwrap_or_else(|| "agent".to_string()),
        })
        .collect();

    Ok(Json(users))
}

/// Get user by ID
pub async fn get(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<UserResponse>, (StatusCode, Json<ErrorResponse>)> {
    let user: Option<UserRow> = sqlx::query_as(
        r#"
        SELECT
            u.id, u.organization_id, u.role_id, u.email,
            u.first_name, u.last_name, u.matricule, u.avatar_url, u.phone,
            u.cn_entitlement, u.jc_entitlement, u.cn_carryover, u.jc_carryover,
            u.is_active,
            r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Database error: {:?}", e);
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
                code: "NOT_FOUND".to_string(),
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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateUserRequest {
    pub organization_id: Option<Uuid>,
    pub role_id: Option<Uuid>,
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub matricule: Option<String>,
    pub phone: Option<String>,
}

/// Create user
pub async fn create(
    State(state): State<AppState>,
    Json(body): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<UserResponse>), (StatusCode, Json<ErrorResponse>)> {
    // Hash password
    let password_hash = hash_password(&body.password).map_err(|e| {
        tracing::error!("Password hashing error: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                code: "HASH_ERROR".to_string(),
                message: "Failed to hash password".to_string(),
            }),
        )
    })?;

    // Get default organization if not provided
    let org_id = if let Some(id) = body.organization_id {
        id
    } else {
        // Get first organization
        let org: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM organizations LIMIT 1")
            .fetch_optional(&state.db)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        code: "DATABASE_ERROR".to_string(),
                        message: "Failed to fetch organization".to_string(),
                    }),
                )
            })?;

        org.ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    code: "NO_ORGANIZATION".to_string(),
                    message: "No organization exists. Create one first.".to_string(),
                }),
            )
        })?
        .0
    };

    // Get default role if not provided (agent role)
    let role_id = if let Some(id) = body.role_id {
        Some(id)
    } else {
        let role: Option<(Uuid,)> = sqlx::query_as(
            "SELECT id FROM roles WHERE organization_id = $1 AND name = 'agent' LIMIT 1",
        )
        .bind(org_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    code: "DATABASE_ERROR".to_string(),
                    message: "Failed to fetch role".to_string(),
                }),
            )
        })?;
        role.map(|r| r.0)
    };

    // Insert user
    let user: UserRow = sqlx::query_as(
        r#"
        INSERT INTO users (organization_id, role_id, email, password_hash, first_name, last_name, matricule, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
            id, organization_id, role_id, email,
            first_name, last_name, matricule, avatar_url, phone,
            cn_entitlement, jc_entitlement, cn_carryover, jc_carryover,
            is_active,
            (SELECT name FROM roles WHERE id = role_id) as role_name
        "#,
    )
    .bind(org_id)
    .bind(role_id)
    .bind(&body.email)
    .bind(&password_hash)
    .bind(&body.first_name)
    .bind(&body.last_name)
    .bind(&body.matricule)
    .bind(&body.phone)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Database error creating user: {:?}", e);
        if e.to_string().contains("duplicate key") {
            (
                StatusCode::CONFLICT,
                Json(ErrorResponse {
                    code: "DUPLICATE_EMAIL".to_string(),
                    message: "A user with this email already exists".to_string(),
                }),
            )
        } else {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    code: "DATABASE_ERROR".to_string(),
                    message: "Failed to create user".to_string(),
                }),
            )
        }
    })?;

    Ok((
        StatusCode::CREATED,
        Json(UserResponse {
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
        }),
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserRequest {
    pub role_id: Option<Uuid>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub matricule: Option<String>,
    pub phone: Option<String>,
    pub is_active: Option<bool>,
}

/// Update user
pub async fn update(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateUserRequest>,
) -> Result<Json<UserResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Build dynamic update query
    let mut updates = Vec::new();
    let mut param_idx = 2; // $1 is the user id

    if body.role_id.is_some() {
        updates.push(format!("role_id = ${}", param_idx));
        param_idx += 1;
    }
    if body.email.is_some() {
        updates.push(format!("email = ${}", param_idx));
        param_idx += 1;
    }
    if body.password.is_some() {
        updates.push(format!("password_hash = ${}", param_idx));
        param_idx += 1;
    }
    if body.first_name.is_some() {
        updates.push(format!("first_name = ${}", param_idx));
        param_idx += 1;
    }
    if body.last_name.is_some() {
        updates.push(format!("last_name = ${}", param_idx));
        param_idx += 1;
    }
    if body.matricule.is_some() {
        updates.push(format!("matricule = ${}", param_idx));
        param_idx += 1;
    }
    if body.phone.is_some() {
        updates.push(format!("phone = ${}", param_idx));
        param_idx += 1;
    }
    if body.is_active.is_some() {
        updates.push(format!("is_active = ${}", param_idx));
    }

    if updates.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                code: "NO_UPDATES".to_string(),
                message: "No fields to update".to_string(),
            }),
        ));
    }

    let query = format!(
        r#"
        UPDATE users SET {}
        WHERE id = $1
        RETURNING
            id, organization_id, role_id, email,
            first_name, last_name, matricule, avatar_url, phone,
            cn_entitlement, jc_entitlement, cn_carryover, jc_carryover,
            is_active,
            (SELECT name FROM roles WHERE id = users.role_id) as role_name
        "#,
        updates.join(", ")
    );

    let mut query_builder = sqlx::query_as::<_, UserRow>(&query).bind(id);

    if let Some(role_id) = body.role_id {
        query_builder = query_builder.bind(role_id);
    }
    if let Some(ref email) = body.email {
        query_builder = query_builder.bind(email);
    }
    if let Some(ref password) = body.password {
        let hash = hash_password(password).map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    code: "HASH_ERROR".to_string(),
                    message: "Failed to hash password".to_string(),
                }),
            )
        })?;
        query_builder = query_builder.bind(hash);
    }
    if let Some(ref first_name) = body.first_name {
        query_builder = query_builder.bind(first_name);
    }
    if let Some(ref last_name) = body.last_name {
        query_builder = query_builder.bind(last_name);
    }
    if let Some(ref matricule) = body.matricule {
        query_builder = query_builder.bind(matricule);
    }
    if let Some(ref phone) = body.phone {
        query_builder = query_builder.bind(phone);
    }
    if let Some(is_active) = body.is_active {
        query_builder = query_builder.bind(is_active);
    }

    let user: UserRow = query_builder
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Database error updating user: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    code: "DATABASE_ERROR".to_string(),
                    message: "Failed to update user".to_string(),
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

/// Delete user
pub async fn delete(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    let result = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Database error deleting user: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    code: "DATABASE_ERROR".to_string(),
                    message: "Failed to delete user".to_string(),
                }),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                code: "NOT_FOUND".to_string(),
                message: "User not found".to_string(),
            }),
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserBalanceResponse {
    pub user_id: Uuid,
    pub cn_total: i32,
    pub cn_used: i32,
    pub cn_remaining: i32,
    pub jc_total: i32,
    pub jc_used: i32,
    pub jc_remaining: i32,
}

/// Get user balance
pub async fn balance(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<UserBalanceResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Get user entitlements
    let user: Option<(i32, i32, i32, i32)> = sqlx::query_as(
        "SELECT cn_entitlement, jc_entitlement, cn_carryover, jc_carryover FROM users WHERE id = $1",
    )
    .bind(id)
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

    let (cn_entitlement, jc_entitlement, cn_carryover, jc_carryover) = user.ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                code: "NOT_FOUND".to_string(),
                message: "User not found".to_string(),
            }),
        )
    })?;

    // Count used CN and JC from schedules
    let cn_used: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)
        FROM schedules s
        JOIN shift_types st ON s.shift_type_id = st.id
        WHERE s.user_id = $1 AND st.code = 'CN'
        AND EXTRACT(YEAR FROM s.date) = EXTRACT(YEAR FROM CURRENT_DATE)
        "#,
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                code: "DATABASE_ERROR".to_string(),
                message: "Failed to calculate balance".to_string(),
            }),
        )
    })?;

    let jc_used: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)
        FROM schedules s
        JOIN shift_types st ON s.shift_type_id = st.id
        WHERE s.user_id = $1 AND st.code = 'JC'
        AND EXTRACT(YEAR FROM s.date) = EXTRACT(YEAR FROM CURRENT_DATE)
        "#,
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                code: "DATABASE_ERROR".to_string(),
                message: "Failed to calculate balance".to_string(),
            }),
        )
    })?;

    let cn_total = cn_entitlement + cn_carryover;
    let jc_total = jc_entitlement + jc_carryover;

    Ok(Json(UserBalanceResponse {
        user_id: id,
        cn_total,
        cn_used: cn_used.0 as i32,
        cn_remaining: cn_total - cn_used.0 as i32,
        jc_total,
        jc_used: jc_used.0 as i32,
        jc_remaining: jc_total - jc_used.0 as i32,
    }))
}
