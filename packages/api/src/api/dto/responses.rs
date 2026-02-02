//! Response DTOs

use chrono::{DateTime, NaiveDate, Utc};
use serde::Serialize;
use uuid::Uuid;

/// Generic API response wrapper
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<ApiError>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(error: ApiError) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            error: Some(error),
        }
    }
}

/// API error details
#[derive(Debug, Serialize)]
pub struct ApiError {
    pub code: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

/// Paginated response
#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub items: Vec<T>,
    pub total: i64,
    pub page: i32,
    pub per_page: i32,
    pub total_pages: i32,
}

/// User response
#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub matricule: Option<String>,
    pub role: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

/// Shift type response
#[derive(Debug, Serialize)]
pub struct ShiftTypeResponse {
    pub id: Uuid,
    pub code: String,
    pub description: Option<String>,
    pub category: String,
    pub color_hex: String,
    pub duration_hours: f64,
    pub night_hours: f64,
    pub is_countable: bool,
    pub is_active: bool,
}

/// Period response
#[derive(Debug, Serialize)]
pub struct PeriodResponse {
    pub id: Uuid,
    pub number: i32,
    pub year: i32,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub hour_quota: i32,
}

/// Schedule response
#[derive(Debug, Serialize)]
pub struct ScheduleResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub date: NaiveDate,
    pub shift_code: Option<String>,
    pub shift_color: Option<String>,
    pub is_holiday: bool,
    pub notes: Option<String>,
}

/// Planning matrix cell
#[derive(Debug, Serialize)]
pub struct MatrixCell {
    pub date: NaiveDate,
    pub schedule_id: Option<Uuid>,
    pub shift_code: Option<String>,
    pub color_hex: Option<String>,
    pub is_holiday: bool,
    pub is_weekend: bool,
}

/// Planning matrix row (agent)
#[derive(Debug, Serialize)]
pub struct MatrixRow {
    pub user_id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub matricule: Option<String>,
    pub cells: Vec<MatrixCell>,
}

/// Planning matrix response
#[derive(Debug, Serialize)]
pub struct PlanningMatrixResponse {
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub period: Option<PeriodResponse>,
    pub agents: Vec<MatrixRow>,
    pub holidays: Vec<HolidayResponse>,
}

/// Holiday response
#[derive(Debug, Serialize)]
pub struct HolidayResponse {
    pub id: Uuid,
    pub date: NaiveDate,
    pub name: String,
    pub is_moveable: bool,
}

/// User balance response
#[derive(Debug, Serialize)]
pub struct UserBalanceResponse {
    pub cn_total: i32,
    pub cn_used: i32,
    pub cn_remaining: i32,
    pub jc_total: i32,
    pub jc_used: i32,
    pub jc_remaining: i32,
}

/// Validation status response
#[derive(Debug, Serialize)]
pub struct ValidationStatusResponse {
    pub period_id: Uuid,
    pub user_id: Uuid,
    pub is_valid: bool,
    pub total_hours: f64,
    pub ch_count: i32,
    pub rh_count: i32,
    pub cv_count: i32,
    pub rr_count: i32,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}
