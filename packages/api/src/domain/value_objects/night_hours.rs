//! NightHours Value Object
//!
//! Represents night hours calculation category.

use serde::{Deserialize, Serialize};

/// Night hours category based on shift code
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum NightHoursCategory {
    /// Full night shift: 8 hours (121, 6121, 7121)
    Full,
    /// Partial night: 2 hours (standard/intermediate codes)
    Partial,
    /// No night hours (rest, special codes)
    None,
}

impl NightHoursCategory {
    /// Create from shift code
    pub fn from_code(code: &str) -> Self {
        match code {
            "121" | "6121" | "7121" => Self::Full,
            "101" | "102" | "6101" | "6102" | "7101" | "7102" | "111" | "112" | "6111" | "6112"
            | "7111" | "7112" | "X_AM" | "X_PM" => Self::Partial,
            _ => Self::None,
        }
    }

    /// Get hours value
    pub fn hours(&self) -> f64 {
        match self {
            Self::Full => 8.0,
            Self::Partial => 2.0,
            Self::None => 0.0,
        }
    }

    /// Check if this category has any night hours
    pub fn has_night_hours(&self) -> bool {
        !matches!(self, Self::None)
    }
}

impl Default for NightHoursCategory {
    fn default() -> Self {
        Self::None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_categories() {
        assert_eq!(NightHoursCategory::from_code("121"), NightHoursCategory::Full);
        assert_eq!(
            NightHoursCategory::from_code("101"),
            NightHoursCategory::Partial
        );
        assert_eq!(NightHoursCategory::from_code("AG"), NightHoursCategory::None);
        assert_eq!(NightHoursCategory::from_code("RH"), NightHoursCategory::None);
    }

    #[test]
    fn test_hours() {
        assert_eq!(NightHoursCategory::Full.hours(), 8.0);
        assert_eq!(NightHoursCategory::Partial.hours(), 2.0);
        assert_eq!(NightHoursCategory::None.hours(), 0.0);
    }
}
