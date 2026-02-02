//! Color Value Object
//!
//! Represents a hex color for shift types.

use serde::{Deserialize, Serialize};
use std::fmt;

/// Default colors from generate.py COLORS dict
pub mod defaults {
    pub const C_101: &str = "FFD9E6";
    pub const C_102: &str = "FFE6F0";
    pub const C_111: &str = "D9E6FF";
    pub const C_112: &str = "E6F0FF";
    pub const C_121: &str = "FFE6CC";
    pub const C_X_AM: &str = "D9F2D9";
    pub const C_X_PM: &str = "D9F2D9";
    pub const C_X_10: &str = "E6D9FF";
    pub const C_AG: &str = "FF4444";
    pub const C_CN: &str = "FFFFCC";
    pub const C_JC: &str = "FFFFCC";
    pub const C_RH: &str = "CCCCCC";
    pub const C_CH: &str = "D5D5D5";
    pub const C_RR: &str = "C9C9C9";
    pub const C_CV: &str = "96D1CC";
    pub const C_ZM: &str = "F0F0F0";
}

/// Validated hex color (6 characters, no #)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Color(String);

impl Color {
    /// Create a new color from hex string
    /// Accepts formats: "FFD9E6", "#FFD9E6"
    pub fn new(hex: impl Into<String>) -> Result<Self, ColorError> {
        let hex = hex.into();
        let hex = hex.trim_start_matches('#').to_uppercase();

        // Validate format
        if hex.len() != 6 {
            return Err(ColorError::InvalidLength(hex.len()));
        }

        // Validate hex characters
        if !hex.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err(ColorError::InvalidCharacters);
        }

        Ok(Self(hex))
    }

    /// Create without validation
    pub fn new_unchecked(hex: impl Into<String>) -> Self {
        let hex = hex.into().trim_start_matches('#').to_uppercase();
        Self(hex)
    }

    /// Get the hex value without #
    pub fn hex(&self) -> &str {
        &self.0
    }

    /// Get the CSS color with #
    pub fn css(&self) -> String {
        format!("#{}", self.0)
    }

    /// Get RGB values
    pub fn rgb(&self) -> (u8, u8, u8) {
        let r = u8::from_str_radix(&self.0[0..2], 16).unwrap_or(0);
        let g = u8::from_str_radix(&self.0[2..4], 16).unwrap_or(0);
        let b = u8::from_str_radix(&self.0[4..6], 16).unwrap_or(0);
        (r, g, b)
    }

    /// Check if color is "light" (for text contrast)
    pub fn is_light(&self) -> bool {
        let (r, g, b) = self.rgb();
        // Using relative luminance formula
        let luminance = 0.299 * r as f64 + 0.587 * g as f64 + 0.114 * b as f64;
        luminance > 186.0
    }

    /// Get recommended text color (black or white)
    pub fn text_color(&self) -> &'static str {
        if self.is_light() {
            "#000000"
        } else {
            "#FFFFFF"
        }
    }

    /// Get default color for a shift code
    pub fn for_shift_code(code: &str) -> Self {
        let hex = match code {
            "101" | "6101" | "7101" => defaults::C_101,
            "102" | "6102" | "7102" => defaults::C_102,
            "111" | "6111" | "7111" => defaults::C_111,
            "112" | "6112" | "7112" => defaults::C_112,
            "121" | "6121" | "7121" => defaults::C_121,
            "X_AM" => defaults::C_X_AM,
            "X_PM" => defaults::C_X_PM,
            "X_10" => defaults::C_X_10,
            "AG" => defaults::C_AG,
            "CN" => defaults::C_CN,
            "JC" => defaults::C_JC,
            "RH" => defaults::C_RH,
            "CH" => defaults::C_CH,
            "RR" => defaults::C_RR,
            "CV" => defaults::C_CV,
            "ZM" => defaults::C_ZM,
            _ => "FFFFFF",
        };
        Self(hex.to_string())
    }
}

impl Default for Color {
    fn default() -> Self {
        Self("FFFFFF".to_string())
    }
}

impl fmt::Display for Color {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "#{}", self.0)
    }
}

impl From<Color> for String {
    fn from(color: Color) -> Self {
        color.0
    }
}

/// Color validation error
#[derive(Debug, Clone, PartialEq)]
pub enum ColorError {
    InvalidLength(usize),
    InvalidCharacters,
}

impl fmt::Display for ColorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ColorError::InvalidLength(len) => {
                write!(f, "Invalid color length: {} (expected 6)", len)
            }
            ColorError::InvalidCharacters => write!(f, "Color contains invalid characters"),
        }
    }
}

impl std::error::Error for ColorError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_colors() {
        assert!(Color::new("FFD9E6").is_ok());
        assert!(Color::new("#FFD9E6").is_ok());
        assert!(Color::new("ffd9e6").is_ok());
    }

    #[test]
    fn test_invalid_colors() {
        assert!(Color::new("FFF").is_err());
        assert!(Color::new("GGGGGG").is_err());
    }

    #[test]
    fn test_rgb() {
        let color = Color::new("FF8040").unwrap();
        assert_eq!(color.rgb(), (255, 128, 64));
    }

    #[test]
    fn test_light_detection() {
        assert!(Color::new("FFFFFF").unwrap().is_light());
        assert!(!Color::new("000000").unwrap().is_light());
        assert!(!Color::new("FF4444").unwrap().is_light()); // AG color
    }

    #[test]
    fn test_default_colors() {
        assert_eq!(Color::for_shift_code("AG").hex(), "FF4444");
        assert_eq!(Color::for_shift_code("CV").hex(), "96D1CC");
    }
}
