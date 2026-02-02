//! PlanningOS API Server
//!
//! Entry point for the Rust backend API using Axum framework.
//! Implements Hexagonal Architecture (Ports & Adapters).

use std::net::SocketAddr;
use std::sync::Arc;

use axum::Router;
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod api;
mod application;
mod domain;
mod infrastructure;

use crate::infrastructure::config::Settings;
use crate::infrastructure::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "planningos_api=debug,tower_http=debug,sqlx=warn".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    dotenvy::dotenv().ok();
    let settings = Settings::load()?;
    let settings = Arc::new(settings);

    tracing::info!(
        "Starting PlanningOS API v{}",
        env!("CARGO_PKG_VERSION")
    );

    // Database connection pool
    let db = PgPoolOptions::new()
        .max_connections(settings.database.max_connections)
        .connect(&settings.database.url)
        .await?;

    // Run migrations
    tracing::info!("Running database migrations...");
    sqlx::migrate!("../db/src/migrations")
        .run(&db)
        .await?;
    tracing::info!("Migrations completed successfully");

    // Build application state
    let state = AppState::new(db, settings.clone());

    // Build router
    let app = build_router(state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], settings.server.port));
    tracing::info!("Listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

/// Build the application router with all routes and middleware
fn build_router(state: AppState) -> Router {
    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        // Health check
        .route("/health", axum::routing::get(api::handlers::health::health_check))
        // API v1 routes
        .nest("/api/v1", api::routes::api_routes())
        // Middleware
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        // State
        .with_state(state)
}
