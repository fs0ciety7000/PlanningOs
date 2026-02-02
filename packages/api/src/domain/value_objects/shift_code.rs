//! ShiftCode Value Object
//!
//! Validated shift/prestation code.
//! Based on LISTE_PRESTATIONS and LISTE_REPOS from generate.py

use serde::{Deserialize, Serialize};
use std::fmt;

/// Known prestation codes (from generate.py LISTE_PRESTATIONS)
pub const PRESTATIONS: &[&str] = &[
    "101", "102", "111", "112", "121", "6101", "6102", "6111", "6112", "6121", "7101", "7102",
    "7111", "7112", "7121", "X_AM", "X_PM", "X_10", "AG",
];

/// Known repos codes (from generate.py LISTE_REPOS)
pub const REPOS: &[&str] = &["CN", "JC", "RH", "CH", "RR", "CV", "ZM"];

/// Codes with 8h night credit
pub const CODES_NUIT_8H: &[&str] = &["121", "6121", "7121"];

/// Codes with 2h night credit
pub const CODES_NUIT_2H: &[&str] = &[
    "101", "102", "6101", "6102", "7101", "7102", "111", "112", "6111", "6112", "7111", "7112",
    "X_AM", "X_PM",
];

/// Holiday work indicator codes (7xxx prefix)
pub const CODES_FERIE: &[&str] = &["7101", "7102", "7111", "7112", "7121"];

/// Validated shift code
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ShiftCode(String);

impl ShiftCode {
    /// Create a new shift code (validates against known codes)
    pub fn new(code: impl Into<String>) -> Result<Self, ShiftCodeError> {
        let code = code.into().to_uppercase();

        // Validate against known codes
        if Self::is_valid_code(&code) {
            Ok(Self(code))
        } else {
            Err(ShiftCodeError::Unknown(code))
        }
    }

    /// Create without validation (for custom codes from DB)
    pub fn new_unchecked(code: impl Into<String>) -> Self {
        Self(code.into().to_uppercase())
    }

    /// Check if a code is in the known lists
    pub fn is_valid_code(code: &str) -> bool {
        PRESTATIONS.contains(&code) || REPOS.contains(&code)
    }

    /// Check if this is a prestation code
    pub fn is_prestation(&self) -> bool {
        PRESTATIONS.contains(&self.0.as_str())
    }

    /// Check if this is a repos code
    pub fn is_repos(&self) -> bool {
        REPOS.contains(&self.0.as_str())
    }

    /// Check if this is a full night code (8h)
    pub fn is_full_night(&self) -> bool {
        CODES_NUIT_8H.contains(&self.0.as_str())
    }

    /// Check if this is a partial night code (2h)
    pub fn is_partial_night(&self) -> bool {
        CODES_NUIT_2H.contains(&self.0.as_str())
    }

    /// Check if this is a holiday work code
    pub fn is_holiday_code(&self) -> bool {
        CODES_FERIE.contains(&self.0.as_str())
    }

    /// Check if this is a strike code
    pub fn is_strike(&self) -> bool {
        self.0 == "AG"
    }

    /// Get night hours for this code
    pub fn night_hours(&self) -> f64 {
        if self.is_full_night() {
            8.0
        } else if self.is_partial_night() {
            2.0
        } else {
            0.0
        }
    }

    /// Get the inner string value
    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// Convert to owned String
    pub fn into_inner(self) -> String {
        self.0
    }
}

impl fmt::Display for ShiftCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<ShiftCode> for String {
    fn from(code: ShiftCode) -> Self {
        code.0
    }
}

/// Shift code validation error
#[derive(Debug, Clone, PartialEq)]
pub enum ShiftCodeError {
    /// Code is not in the known list
    Unknown(String),
}

impl fmt::Display for ShiftCodeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ShiftCodeError::Unknown(code) => write!(f, "Unknown shift code: {}", code),
        }
    }
}

impl std::error::Error for ShiftCodeError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_codes() {
        assert!(ShiftCode::new("101").is_ok());
        assert!(ShiftCode::new("CN").is_ok());
        assert!(ShiftCode::new("121").is_ok());
    }

    #[test]
    fn test_invalid_code() {
        assert!(ShiftCode::new("INVALID").is_err());
    }

    #[test]
    fn test_night_hours() {
        assert_eq!(ShiftCode::new("121").unwrap().night_hours(), 8.0);
        assert_eq!(ShiftCode::new("101").unwrap().night_hours(), 2.0);
        assert_eq!(ShiftCode::new("AG").unwrap().night_hours(), 0.0);
        assert_eq!(ShiftCode::new("RH").unwrap().night_hours(), 0.0);
    }

    #[test]
    fn test_holiday_codes() {
        assert!(ShiftCode::new("7101").unwrap().is_holiday_code());
        assert!(!ShiftCode::new("101").unwrap().is_holiday_code());
    }
}
