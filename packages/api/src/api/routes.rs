//! API Routes
//!
//! Route definitions for the API.

use axum::{
    routing::{delete, get, patch, post},
    Router,
};

use crate::AppState;

use super::handlers;

/// Build all API v1 routes
pub fn api_routes() -> Router<AppState> {
    Router::new()
        // Auth routes
        .nest("/auth", auth_routes())
        // User routes
        .nest("/users", user_routes())
        // Shift type routes
        .nest("/shift-types", shift_type_routes())
        // Period routes
        .nest("/periods", period_routes())
        // Schedule routes
        .nest("/schedules", schedule_routes())
        // Statistics routes
        .nest("/statistics", statistics_routes())
        // Holiday routes
        .nest("/holidays", holiday_routes())
}

/// Authentication routes
fn auth_routes() -> Router<AppState> {
    Router::new()
        .route("/login", post(handlers::auth::login))
        .route("/logout", post(handlers::auth::logout))
        .route("/refresh", post(handlers::auth::refresh))
        .route("/me", get(handlers::auth::me))
}

/// User management routes
fn user_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(handlers::users::list).post(handlers::users::create))
        .route(
            "/:id",
            get(handlers::users::get)
                .patch(handlers::users::update)
                .delete(handlers::users::delete),
        )
        .route("/:id/balance", get(handlers::users::balance))
}

/// Shift type management routes
fn shift_type_routes() -> Router<AppState> {
    Router::new()
        .route(
            "/",
            get(handlers::shift_types::list).post(handlers::shift_types::create),
        )
        .route(
            "/:id",
            get(handlers::shift_types::get)
                .patch(handlers::shift_types::update)
                .delete(handlers::shift_types::delete),
        )
}

/// Period routes
fn period_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(handlers::periods::list))
        .route("/:id", get(handlers::periods::get))
        .route("/:id/balances", get(handlers::periods::balances))
        .route("/generate", post(handlers::periods::generate))
}

/// Schedule routes
fn schedule_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(handlers::schedules::list).post(handlers::schedules::create))
        .route("/matrix", get(handlers::schedules::matrix))
        .route("/bulk", post(handlers::schedules::bulk_update))
        .route(
            "/:id",
            get(handlers::schedules::get)
                .patch(handlers::schedules::update)
                .delete(handlers::schedules::delete),
        )
}

/// Statistics routes
fn statistics_routes() -> Router<AppState> {
    Router::new()
        .route("/dashboard", get(handlers::statistics::dashboard))
        .route("/period/:id", get(handlers::statistics::period))
        .route("/user/:id", get(handlers::statistics::user))
}

/// Holiday routes
fn holiday_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(handlers::holidays::list).post(handlers::holidays::create))
        .route("/:id", delete(handlers::holidays::delete))
        .route("/generate", post(handlers::holidays::generate))
}
