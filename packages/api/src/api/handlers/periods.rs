//! Period Handlers

use axum::{extract::State, http::StatusCode};

use crate::infrastructure::AppState;

pub async fn list(State(_state): State<AppState>) -> StatusCode {
    StatusCode::NOT_IMPLEMENTED
}

pub async fn get(State(_state): State<AppState>) -> StatusCode {
    StatusCode::NOT_IMPLEMENTED
}

pub async fn balances(State(_state): State<AppState>) -> StatusCode {
    StatusCode::NOT_IMPLEMENTED
}

pub async fn generate(State(_state): State<AppState>) -> StatusCode {
    StatusCode::NOT_IMPLEMENTED
}
