//! Period Entity
//!
//! Represents a 28-day period (P1-P13).
//! 13 periods × 28 days = 364 days per year.

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Period entity (P1-P13)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Period {
    pub id: Uuid,
    pub organization_id: Uuid,

    pub year: i32,
    /// Period number (1-13)
    pub number: i32,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    /// Maximum hours for this period (default: 160)
    pub hour_quota: i32,

    pub created_at: DateTime<Utc>,
}

impl Period {
    /// Get period label (e.g., "P1", "P2")
    pub fn label(&self) -> String {
        format!("P{}", self.number)
    }

    /// Get duration in days (always 28)
    pub fn duration_days(&self) -> i64 {
        (self.end_date - self.start_date).num_days() + 1
    }

    /// Check if a date falls within this period
    pub fn contains_date(&self, date: NaiveDate) -> bool {
        date >= self.start_date && date <= self.end_date
    }

    /// Check if period spans two months
    pub fn is_cross_month(&self) -> bool {
        self.start_date.month() != self.end_date.month()
    }

    /// Get the month(s) this period covers
    pub fn months(&self) -> Vec<u32> {
        if self.is_cross_month() {
            vec![self.start_date.month(), self.end_date.month()]
        } else {
            vec![self.start_date.month()]
        }
    }
}

/// Period balance/statistics for a user within a period
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeriodBalance {
    pub id: Uuid,
    pub period_id: Uuid,
    pub user_id: Uuid,

    // Hour calculations
    pub total_hours: f64,
    pub night_hours: f64,

    // Quota counts
    pub ch_count: i32,
    pub rh_count: i32,
    pub cv_count: i32,
    pub rr_count: i32,
    pub cn_count: i32,
    pub jc_count: i32,

    // Holiday tracking
    pub holidays_worked: i32,

    // Validation
    pub is_valid: bool,
    pub validation_errors: Vec<String>,

    pub calculated_at: DateTime<Utc>,
}

impl PeriodBalance {
    /// Expected CH count per period
    pub const EXPECTED_CH: i32 = 4;
    /// Expected RH count per period
    pub const EXPECTED_RH: i32 = 4;
    /// Expected CV count per period
    pub const EXPECTED_CV: i32 = 1;
    /// Maximum hours per period
    pub const MAX_HOURS: f64 = 160.0;

    /// Validate the period balance against quotas
    pub fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();

        // CH must be 4
        if self.ch_count != Self::EXPECTED_CH {
            errors.push(format!(
                "CH: {}/{} (Congé Habituel)",
                self.ch_count, Self::EXPECTED_CH
            ));
        }

        // RH must be 4
        if self.rh_count != Self::EXPECTED_RH {
            errors.push(format!(
                "RH: {}/{} (Repos Hebdomadaire)",
                self.rh_count, Self::EXPECTED_RH
            ));
        }

        // CV must be 1
        if self.cv_count != Self::EXPECTED_CV {
            errors.push(format!(
                "CV: {}/{} (Congé Vieillesse)",
                self.cv_count, Self::EXPECTED_CV
            ));
        }

        // RR must match holidays worked
        if self.holidays_worked > 0 && self.rr_count < self.holidays_worked {
            errors.push(format!(
                "RR manquant: {} férié(s) travaillé(s), {} RR planifié(s)",
                self.holidays_worked, self.rr_count
            ));
        }

        // Hours must not exceed quota
        if self.total_hours > Self::MAX_HOURS {
            errors.push(format!(
                "Heures: {:.1}/{} (dépassement)",
                self.total_hours, Self::MAX_HOURS
            ));
        }

        errors
    }
}
