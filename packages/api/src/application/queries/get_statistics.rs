//! Get Statistics Query
//!
//! Retrieves aggregated statistics for dashboard.

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Query for period statistics
#[derive(Debug, Clone, Deserialize)]
pub struct GetPeriodStatisticsQuery {
    pub organization_id: Uuid,
    pub period_id: Uuid,
    pub user_id: Option<Uuid>,
}

/// Period statistics response
#[derive(Debug, Clone, Serialize)]
pub struct PeriodStatisticsResponse {
    pub period_number: i32,
    pub total_agents: i32,
    pub compliant_agents: i32,
    pub compliance_rate: f64,
    pub total_hours: f64,
    pub total_night_hours: f64,
    pub shift_distribution: Vec<ShiftCount>,
    pub validation_issues: Vec<ValidationIssue>,
}

/// Count of shifts by type
#[derive(Debug, Clone, Serialize)]
pub struct ShiftCount {
    pub code: String,
    pub description: Option<String>,
    pub count: i32,
    pub hours: f64,
    pub night_hours: f64,
}

/// Validation issue summary
#[derive(Debug, Clone, Serialize)]
pub struct ValidationIssue {
    pub user_id: Uuid,
    pub user_name: String,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// Query for user balance/leave statistics
#[derive(Debug, Clone, Deserialize)]
pub struct GetUserBalanceQuery {
    pub user_id: Uuid,
    pub year: Option<i32>,
}

/// User balance response
#[derive(Debug, Clone, Serialize)]
pub struct UserBalanceResponse {
    pub user_id: Uuid,
    pub year: i32,
    /// CN (Congé Normalisé) balance
    pub cn: LeaveBalance,
    /// JC (Jour Chômé) balance
    pub jc: LeaveBalance,
    /// Summary by period
    pub periods: Vec<PeriodSummary>,
}

/// Leave balance details
#[derive(Debug, Clone, Serialize)]
pub struct LeaveBalance {
    /// Annual entitlement
    pub entitlement: i32,
    /// Carried over from previous year
    pub carryover: i32,
    /// Total available
    pub total: i32,
    /// Used so far
    pub used: i32,
    /// Remaining
    pub remaining: i32,
}

/// Summary for a single period
#[derive(Debug, Clone, Serialize)]
pub struct PeriodSummary {
    pub period_id: Uuid,
    pub period_number: i32,
    pub total_hours: f64,
    pub night_hours: f64,
    pub ch_count: i32,
    pub rh_count: i32,
    pub cv_count: i32,
    pub is_valid: bool,
}
