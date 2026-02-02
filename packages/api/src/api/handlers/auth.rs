//! Authentication Handlers

use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};

use crate::AppState;

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

/// Login handler
pub async fn login(
    State(_state): State<AppState>,
    Json(_body): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    // TODO: Implement actual login
    Err(StatusCode::NOT_IMPLEMENTED)
}

/// Logout handler
pub async fn logout(State(_state): State<AppState>) -> StatusCode {
    // TODO: Implement logout
    StatusCode::NOT_IMPLEMENTED
}

/// Refresh token handler
pub async fn refresh(State(_state): State<AppState>) -> StatusCode {
    // TODO: Implement refresh
    StatusCode::NOT_IMPLEMENTED
}

/// Get current user handler
pub async fn me(State(_state): State<AppState>) -> StatusCode {
    // TODO: Implement me
    StatusCode::NOT_IMPLEMENTED
}
