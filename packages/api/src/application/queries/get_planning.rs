//! Get Planning Query
//!
//! Retrieves planning matrix data for display.

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Query parameters for planning matrix
#[derive(Debug, Clone, Deserialize)]
pub struct GetPlanningQuery {
    pub organization_id: Uuid,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    /// Optional filter by user IDs
    pub user_ids: Option<Vec<Uuid>>,
    /// Optional filter by period
    pub period_id: Option<Uuid>,
}

/// Planning matrix response
#[derive(Debug, Clone, Serialize)]
pub struct PlanningMatrixResponse {
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub period_info: Option<PeriodInfo>,
    pub agents: Vec<AgentRow>,
    pub holidays: Vec<HolidayInfo>,
}

/// Period information
#[derive(Debug, Clone, Serialize)]
pub struct PeriodInfo {
    pub id: Uuid,
    pub number: i32,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
}

/// Agent row in the matrix
#[derive(Debug, Clone, Serialize)]
pub struct AgentRow {
    pub user_id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub matricule: Option<String>,
    /// Map of date (ISO format) to cell data
    pub cells: Vec<CellData>,
}

/// Cell data for a single day
#[derive(Debug, Clone, Serialize)]
pub struct CellData {
    pub date: NaiveDate,
    pub schedule_id: Option<Uuid>,
    pub shift_code: Option<String>,
    pub color_hex: Option<String>,
    pub is_holiday: bool,
    pub is_weekend: bool,
    pub day_of_week: u8,
}

/// Holiday information
#[derive(Debug, Clone, Serialize)]
pub struct HolidayInfo {
    pub date: NaiveDate,
    pub name: String,
}

impl GetPlanningQuery {
    /// Create query for a specific month
    pub fn for_month(organization_id: Uuid, year: i32, month: u32) -> Self {
        let start = NaiveDate::from_ymd_opt(year, month, 1).unwrap();
        let end = if month == 12 {
            NaiveDate::from_ymd_opt(year + 1, 1, 1).unwrap()
        } else {
            NaiveDate::from_ymd_opt(year, month + 1, 1).unwrap()
        } - chrono::Duration::days(1);

        Self {
            organization_id,
            start_date: start,
            end_date: end,
            user_ids: None,
            period_id: None,
        }
    }

    /// Create query for a specific period
    pub fn for_period(organization_id: Uuid, period_id: Uuid, start: NaiveDate, end: NaiveDate) -> Self {
        Self {
            organization_id,
            start_date: start,
            end_date: end,
            user_ids: None,
            period_id: Some(period_id),
        }
    }
}
