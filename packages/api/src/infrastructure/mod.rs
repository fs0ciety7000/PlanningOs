//! Infrastructure Layer
//!
//! External adapters and implementations.

pub mod auth;
pub mod config;
pub mod persistence;
pub mod state;

// Re-export commonly used types
pub use state::AppState;
