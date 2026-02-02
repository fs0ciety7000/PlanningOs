//! Application State
//!
//! Shared state across all handlers and middleware.

use std::sync::Arc;

use crate::infrastructure::config::Settings;

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    /// Database connection pool
    pub db: sqlx::PgPool,
    /// Application settings
    pub settings: Arc<Settings>,
}

impl AppState {
    /// Create a new AppState
    pub fn new(db: sqlx::PgPool, settings: Arc<Settings>) -> Self {
        Self { db, settings }
    }
}
