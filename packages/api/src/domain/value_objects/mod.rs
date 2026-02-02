//! Domain Value Objects
//!
//! Immutable objects defined by their attributes rather than identity.

pub mod color;
pub mod night_hours;
pub mod shift_code;

pub use color::Color;
pub use night_hours::NightHoursCategory;
pub use shift_code::ShiftCode;
