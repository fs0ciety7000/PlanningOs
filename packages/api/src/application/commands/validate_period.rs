//! Validate Period Command
//!
//! Triggers validation of period quotas for a user.

use uuid::Uuid;

use crate::domain::entities::period::PeriodBalance;
use crate::domain::services::quota_validator::{QuotaValidator, ValidationResult};

/// Command to validate a period for a user
#[derive(Debug, Clone)]
pub struct ValidatePeriodCommand {
    pub period_id: Uuid,
    pub user_id: Uuid,
}

/// Handler for period validation
pub struct ValidatePeriodHandler {
    validator: QuotaValidator,
}

impl ValidatePeriodHandler {
    pub fn new() -> Self {
        Self {
            validator: QuotaValidator::new(),
        }
    }

    /// Execute validation on a pre-calculated balance
    pub fn execute(&self, balance: &PeriodBalance) -> ValidationResult {
        self.validator.validate(balance)
    }
}

impl Default for ValidatePeriodHandler {
    fn default() -> Self {
        Self::new()
    }
}
