//! Quota Validator Service
//!
//! Validates period quotas according to business rules:
//! - 4 CH (Congé Habituel) per period
//! - 4 RH (Repos Hebdomadaire) per period
//! - 1 CV (Congé Vieillesse) per period
//! - RR required for each holiday worked
//! - Maximum 160 hours per period

use crate::domain::entities::period::PeriodBalance;

/// Validation error types
#[derive(Debug, Clone, PartialEq)]
pub enum QuotaError {
    /// Hours exceeded limit
    HoursExceeded { actual: f64, max: f64 },
    /// Missing recovery day for holiday work
    MissingRecoveryDay { holidays_worked: i32, rr_count: i32 },
}

/// Validation warning types (soft constraints)
#[derive(Debug, Clone, PartialEq)]
pub enum QuotaWarning {
    /// CH count doesn't match expected
    ChCountMismatch { actual: i32, expected: i32 },
    /// RH count doesn't match expected
    RhCountMismatch { actual: i32, expected: i32 },
    /// CV count doesn't match expected
    CvCountMismatch { actual: i32, expected: i32 },
}

/// Validation result
#[derive(Debug, Clone)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub errors: Vec<QuotaError>,
    pub warnings: Vec<QuotaWarning>,
}

impl ValidationResult {
    /// Check if there are any blocking errors
    pub fn has_errors(&self) -> bool {
        !self.errors.is_empty()
    }

    /// Check if there are any warnings
    pub fn has_warnings(&self) -> bool {
        !self.warnings.is_empty()
    }

    /// Get all error messages
    pub fn error_messages(&self) -> Vec<String> {
        self.errors
            .iter()
            .map(|e| match e {
                QuotaError::HoursExceeded { actual, max } => {
                    format!("Heures: {:.1}/{} (dépassement)", actual, max)
                }
                QuotaError::MissingRecoveryDay {
                    holidays_worked,
                    rr_count,
                } => {
                    format!(
                        "RR manquant: {} férié(s) travaillé(s), {} RR planifié(s)",
                        holidays_worked, rr_count
                    )
                }
            })
            .collect()
    }

    /// Get all warning messages
    pub fn warning_messages(&self) -> Vec<String> {
        self.warnings
            .iter()
            .map(|w| match w {
                QuotaWarning::ChCountMismatch { actual, expected } => {
                    format!("CH: {}/{} (Congé Habituel)", actual, expected)
                }
                QuotaWarning::RhCountMismatch { actual, expected } => {
                    format!("RH: {}/{} (Repos Hebdomadaire)", actual, expected)
                }
                QuotaWarning::CvCountMismatch { actual, expected } => {
                    format!("CV: {}/{} (Congé Vieillesse)", actual, expected)
                }
            })
            .collect()
    }

    /// Get combined status string
    pub fn status(&self) -> &'static str {
        if self.errors.is_empty() && self.warnings.is_empty() {
            "✓ OK"
        } else if !self.errors.is_empty() {
            "✗ ERREUR"
        } else {
            "⚠ ATTENTION"
        }
    }
}

/// Quota validator service
pub struct QuotaValidator {
    /// Expected CH count per period
    pub expected_ch: i32,
    /// Expected RH count per period
    pub expected_rh: i32,
    /// Expected CV count per period
    pub expected_cv: i32,
    /// Maximum hours per period
    pub max_hours: f64,
}

impl Default for QuotaValidator {
    fn default() -> Self {
        Self {
            expected_ch: PeriodBalance::EXPECTED_CH,
            expected_rh: PeriodBalance::EXPECTED_RH,
            expected_cv: PeriodBalance::EXPECTED_CV,
            max_hours: PeriodBalance::MAX_HOURS,
        }
    }
}

impl QuotaValidator {
    /// Create with default values
    pub fn new() -> Self {
        Self::default()
    }

    /// Validate a period balance
    pub fn validate(&self, balance: &PeriodBalance) -> ValidationResult {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();

        // Hard constraint: hours must not exceed max
        if balance.total_hours > self.max_hours {
            errors.push(QuotaError::HoursExceeded {
                actual: balance.total_hours,
                max: self.max_hours,
            });
        }

        // Hard constraint: RR must cover holidays worked
        if balance.holidays_worked > 0 && balance.rr_count < balance.holidays_worked {
            errors.push(QuotaError::MissingRecoveryDay {
                holidays_worked: balance.holidays_worked,
                rr_count: balance.rr_count,
            });
        }

        // Soft constraint: CH should be expected count
        if balance.ch_count != self.expected_ch {
            warnings.push(QuotaWarning::ChCountMismatch {
                actual: balance.ch_count,
                expected: self.expected_ch,
            });
        }

        // Soft constraint: RH should be expected count
        if balance.rh_count != self.expected_rh {
            warnings.push(QuotaWarning::RhCountMismatch {
                actual: balance.rh_count,
                expected: self.expected_rh,
            });
        }

        // Soft constraint: CV should be expected count
        if balance.cv_count != self.expected_cv {
            warnings.push(QuotaWarning::CvCountMismatch {
                actual: balance.cv_count,
                expected: self.expected_cv,
            });
        }

        ValidationResult {
            is_valid: errors.is_empty(),
            errors,
            warnings,
        }
    }

    /// Quick check if balance is valid (no errors)
    pub fn is_valid(&self, balance: &PeriodBalance) -> bool {
        self.validate(balance).is_valid
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use uuid::Uuid;

    fn create_test_balance(
        ch: i32,
        rh: i32,
        cv: i32,
        rr: i32,
        hours: f64,
        holidays_worked: i32,
    ) -> PeriodBalance {
        PeriodBalance {
            id: Uuid::new_v4(),
            period_id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            total_hours: hours,
            night_hours: 0.0,
            ch_count: ch,
            rh_count: rh,
            cv_count: cv,
            rr_count: rr,
            cn_count: 0,
            jc_count: 0,
            holidays_worked,
            is_valid: false,
            validation_errors: vec![],
            calculated_at: Utc::now(),
        }
    }

    #[test]
    fn test_valid_balance() {
        let validator = QuotaValidator::new();
        let balance = create_test_balance(4, 4, 1, 0, 160.0, 0);
        let result = validator.validate(&balance);

        assert!(result.is_valid);
        assert!(result.errors.is_empty());
        assert!(result.warnings.is_empty());
    }

    #[test]
    fn test_hours_exceeded() {
        let validator = QuotaValidator::new();
        let balance = create_test_balance(4, 4, 1, 0, 168.0, 0);
        let result = validator.validate(&balance);

        assert!(!result.is_valid);
        assert!(matches!(
            result.errors[0],
            QuotaError::HoursExceeded { .. }
        ));
    }

    #[test]
    fn test_missing_recovery() {
        let validator = QuotaValidator::new();
        let balance = create_test_balance(4, 4, 1, 0, 160.0, 2);
        let result = validator.validate(&balance);

        assert!(!result.is_valid);
        assert!(matches!(
            result.errors[0],
            QuotaError::MissingRecoveryDay { .. }
        ));
    }

    #[test]
    fn test_quota_warnings() {
        let validator = QuotaValidator::new();
        let balance = create_test_balance(3, 5, 0, 0, 160.0, 0);
        let result = validator.validate(&balance);

        assert!(result.is_valid); // Warnings don't make it invalid
        assert_eq!(result.warnings.len(), 3);
    }
}
