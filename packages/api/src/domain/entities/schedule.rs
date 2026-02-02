//! Schedule Entity
//!
//! Represents a single day assignment for a user.
//! One entry per user per day in the planning matrix.

use chrono::{DateTime, Datelike, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Schedule entry (one shift per user per day)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Schedule {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub user_id: Uuid,
    pub shift_type_id: Option<Uuid>,
    pub period_id: Option<Uuid>,

    pub date: NaiveDate,
    pub is_holiday: bool,
    pub notes: Option<String>,

    // Audit
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Schedule {
    /// Check if schedule has an assigned shift
    pub fn has_shift(&self) -> bool {
        self.shift_type_id.is_some()
    }

    /// Check if this is a weekend day
    pub fn is_weekend(&self) -> bool {
        let weekday = self.date.weekday();
        matches!(weekday, chrono::Weekday::Sat | chrono::Weekday::Sun)
    }
}

/// Schedule for creation/update
#[derive(Debug, Clone, Deserialize)]
pub struct CreateSchedule {
    pub user_id: Uuid,
    pub shift_type_id: Option<Uuid>,
    pub date: NaiveDate,
    pub notes: Option<String>,
}

/// Bulk schedule update (for drag & drop operations)
#[derive(Debug, Clone, Deserialize)]
pub struct BulkScheduleUpdate {
    pub schedules: Vec<CreateSchedule>,
}

/// Schedule with expanded relations (for API response)
#[derive(Debug, Clone, Serialize)]
pub struct ScheduleWithDetails {
    pub id: Uuid,
    pub user_id: Uuid,
    pub date: NaiveDate,
    pub is_holiday: bool,
    pub notes: Option<String>,

    // Expanded shift type
    pub shift_code: Option<String>,
    pub shift_description: Option<String>,
    pub shift_color: Option<String>,
    pub duration_hours: Option<f64>,
    pub night_hours: Option<f64>,

    // Period info
    pub period_number: Option<i32>,
}

/// Planning matrix row (user with their schedules)
#[derive(Debug, Clone, Serialize)]
pub struct PlanningMatrixRow {
    pub user_id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub matricule: Option<String>,
    /// Map of date -> shift_code
    pub schedules: std::collections::HashMap<NaiveDate, ScheduleCell>,
}

/// Single cell in the planning matrix
#[derive(Debug, Clone, Serialize)]
pub struct ScheduleCell {
    pub schedule_id: Option<Uuid>,
    pub shift_code: Option<String>,
    pub color_hex: Option<String>,
    pub is_holiday: bool,
    pub is_weekend: bool,
}

impl ScheduleCell {
    /// Create an empty cell
    pub fn empty(date: NaiveDate, is_holiday: bool) -> Self {
        let weekday = date.weekday();
        Self {
            schedule_id: None,
            shift_code: None,
            color_hex: None,
            is_holiday,
            is_weekend: matches!(weekday, chrono::Weekday::Sat | chrono::Weekday::Sun),
        }
    }
}
