//! Domain Services
//!
//! Pure business logic services without external dependencies.

pub mod holiday_calculator;
pub mod period_calculator;
pub mod quota_validator;

pub use holiday_calculator::HolidayCalculator;
pub use period_calculator::PeriodCalculator;
pub use quota_validator::QuotaValidator;
