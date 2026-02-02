//! Holiday Handlers

use axum::{extract::State, http::StatusCode};

use crate::AppState;

pub async fn list(State(_state): State<AppState>) -> StatusCode {
    StatusCode::NOT_IMPLEMENTED
}

pub async fn create(State(_state): State<AppState>) -> StatusCode {
    StatusCode::NOT_IMPLEMENTED
}

pub async fn delete(State(_state): State<AppState>) -> StatusCode {
    StatusCode::NOT_IMPLEMENTED
}

pub async fn generate(State(_state): State<AppState>) -> StatusCode {
    StatusCode::NOT_IMPLEMENTED
}
