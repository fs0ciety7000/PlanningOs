//! Request DTOs

use chrono::NaiveDate;
use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

/// Login request
#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 8))]
    pub password: String,
}

/// Create user request
#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 8))]
    pub password: String,
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
    #[validate(length(min = 1, max = 100))]
    pub last_name: String,
    pub matricule: Option<String>,
    pub role_id: Option<Uuid>,
    pub cn_entitlement: Option<i32>,
    pub jc_entitlement: Option<i32>,
}

/// Update user request
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(length(min = 1, max = 100))]
    pub first_name: Option<String>,
    #[validate(length(min = 1, max = 100))]
    pub last_name: Option<String>,
    pub matricule: Option<String>,
    pub phone: Option<String>,
    pub cn_entitlement: Option<i32>,
    pub jc_entitlement: Option<i32>,
    pub is_active: Option<bool>,
}

/// Create shift type request
#[derive(Debug, Deserialize, Validate)]
pub struct CreateShiftTypeRequest {
    #[validate(length(min = 1, max = 20))]
    pub code: String,
    pub description: Option<String>,
    pub category: String,
    #[validate(length(equal = 6))]
    pub color_hex: String,
    pub duration_hours: f64,
    pub night_hours: f64,
    pub is_countable: Option<bool>,
    pub requires_recovery: Option<bool>,
}

/// Create schedule request
#[derive(Debug, Deserialize)]
pub struct CreateScheduleRequest {
    pub user_id: Uuid,
    pub date: NaiveDate,
    pub shift_type_id: Option<Uuid>,
    pub notes: Option<String>,
}

/// Bulk schedule update request
#[derive(Debug, Deserialize)]
pub struct BulkScheduleRequest {
    pub schedules: Vec<CreateScheduleRequest>,
}

/// Planning matrix query params
#[derive(Debug, Deserialize)]
pub struct PlanningMatrixQuery {
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub user_ids: Option<String>, // Comma-separated UUIDs
}

/// Create holiday request
#[derive(Debug, Deserialize)]
pub struct CreateHolidayRequest {
    pub date: NaiveDate,
    pub name: String,
    pub is_moveable: Option<bool>,
}

/// Generate periods/holidays request
#[derive(Debug, Deserialize)]
pub struct GenerateForYearRequest {
    pub year: i32,
}
