//! ShiftType Entity
//!
//! Represents a configurable prestation or repos type.
//! Derived from generate.py: LISTE_PRESTATIONS + LISTE_REPOS

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Shift category (from generate.py logic)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "shift_category", rename_all = "lowercase")]
pub enum ShiftCategory {
    /// Standard shifts: 101, 102, 6101, 6102, 7101, 7102
    Standard,
    /// Intermediate shifts: 111, 112, 6111, 6112, 7111, 7112
    Intermediate,
    /// Night shifts: 121, 6121, 7121 (8h night credit)
    Night,
    /// Partial shifts: X_AM, X_PM
    Partial,
    /// Special shifts: X_10, AG
    Special,
    /// Rest days: RH, CH, RR, ZM (0h duration)
    Rest,
    /// Leave days: CN, JC, CV
    Leave,
}

impl ShiftCategory {
    /// Check if this category counts toward hour quota
    pub fn is_countable(&self) -> bool {
        !matches!(self, ShiftCategory::Rest)
    }
}

/// Shift type entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShiftType {
    pub id: Uuid,
    pub organization_id: Uuid,

    // Identity
    pub code: String,
    pub description: Option<String>,
    pub category: ShiftCategory,

    // Visual
    pub color_hex: String,
    pub icon: Option<String>,

    // Hour calculations
    pub duration_hours: f64,
    pub night_hours: f64,

    // Behavior flags
    pub is_countable: bool,
    pub requires_recovery: bool,
    pub is_holiday_indicator: bool,
    pub is_rest_day: bool,

    // Display
    pub display_order: i32,
    pub is_active: bool,

    // Timestamps
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl ShiftType {
    /// Get the CSS color with # prefix
    pub fn css_color(&self) -> String {
        format!("#{}", self.color_hex)
    }

    /// Check if this is a night shift (8h night credit)
    pub fn is_full_night(&self) -> bool {
        matches!(self.category, ShiftCategory::Night)
    }

    /// Check if this is a 7xxx holiday code
    pub fn is_holiday_work(&self) -> bool {
        self.is_holiday_indicator || self.code.starts_with('7')
    }

    /// Get night hours based on category (from generate.py)
    /// - Night codes (121, 6121, 7121): 8h
    /// - Standard/Intermediate: 2h
    /// - Others: 0h
    pub fn calculated_night_hours(&self) -> f64 {
        match self.category {
            ShiftCategory::Night => 8.0,
            ShiftCategory::Standard | ShiftCategory::Intermediate | ShiftCategory::Partial => 2.0,
            _ => 0.0,
        }
    }
}

/// ShiftType for creation
#[derive(Debug, Clone, Deserialize)]
pub struct CreateShiftType {
    pub organization_id: Uuid,
    pub code: String,
    pub description: Option<String>,
    pub category: ShiftCategory,
    pub color_hex: String,
    pub icon: Option<String>,
    pub duration_hours: f64,
    pub night_hours: f64,
    pub is_countable: Option<bool>,
    pub requires_recovery: Option<bool>,
    pub is_holiday_indicator: Option<bool>,
    pub display_order: Option<i32>,
}

/// ShiftType update payload
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateShiftType {
    pub description: Option<String>,
    pub color_hex: Option<String>,
    pub icon: Option<String>,
    pub duration_hours: Option<f64>,
    pub night_hours: Option<f64>,
    pub is_countable: Option<bool>,
    pub requires_recovery: Option<bool>,
    pub display_order: Option<i32>,
    pub is_active: Option<bool>,
}
