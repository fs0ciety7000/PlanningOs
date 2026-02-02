//! Tauri Commands
//!
//! IPC commands for the desktop application.

/// Greet command (example)
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to PlanningOS.", name)
}

/// Get application version
#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
