//! Application Configuration
//!
//! Loads and validates configuration from environment variables.

use serde::Deserialize;
use std::env;

/// Application settings
#[derive(Debug, Clone, Deserialize)]
pub struct Settings {
    pub server: ServerSettings,
    pub database: DatabaseSettings,
    pub jwt: JwtSettings,
    pub cors: CorsSettings,
}

/// Server configuration
#[derive(Debug, Clone, Deserialize)]
pub struct ServerSettings {
    pub host: String,
    pub port: u16,
}

/// Database configuration
#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseSettings {
    pub url: String,
    pub max_connections: u32,
}

/// JWT configuration
#[derive(Debug, Clone, Deserialize)]
pub struct JwtSettings {
    pub secret: String,
    pub access_expiry_secs: u64,
    pub refresh_expiry_secs: u64,
}

/// CORS configuration
#[derive(Debug, Clone, Deserialize)]
pub struct CorsSettings {
    pub origins: Vec<String>,
}

impl Settings {
    /// Load settings from environment variables
    pub fn load() -> anyhow::Result<Self> {
        Ok(Self {
            server: ServerSettings {
                host: env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
                port: env::var("PORT")
                    .unwrap_or_else(|_| "3001".to_string())
                    .parse()?,
            },
            database: DatabaseSettings {
                url: env::var("DATABASE_URL")
                    .map_err(|_| anyhow::anyhow!("DATABASE_URL must be set"))?,
                max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()?,
            },
            jwt: JwtSettings {
                secret: env::var("JWT_SECRET")
                    .unwrap_or_else(|_| "dev-secret-change-in-production".to_string()),
                access_expiry_secs: env::var("JWT_ACCESS_EXPIRY")
                    .unwrap_or_else(|_| "900".to_string()) // 15 minutes
                    .parse()?,
                refresh_expiry_secs: env::var("JWT_REFRESH_EXPIRY")
                    .unwrap_or_else(|_| "604800".to_string()) // 7 days
                    .parse()?,
            },
            cors: CorsSettings {
                origins: env::var("CORS_ORIGINS")
                    .unwrap_or_else(|_| "http://localhost:5173,tauri://localhost".to_string())
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
            },
        })
    }
}
