//! Holiday Calculator Service
//!
//! Calculates fixed and moveable holidays using the Computus algorithm.
//! Based on the logic from generate.py: calculer_paques()

use chrono::NaiveDate;

/// Holiday info
#[derive(Debug, Clone)]
pub struct Holiday {
    pub date: NaiveDate,
    pub name: String,
    pub is_moveable: bool,
}

/// Holiday calculator using Computus algorithm for Easter
pub struct HolidayCalculator;

impl HolidayCalculator {
    /// Calculate Easter Sunday using the Computus algorithm
    ///
    /// This implements the Anonymous Gregorian algorithm.
    /// Source: generate.py calculer_paques()
    pub fn calculate_easter(year: i32) -> NaiveDate {
        let a = year % 19;
        let b = year / 100;
        let c = year % 100;
        let d = b / 4;
        let e = b % 4;
        let f = (b + 8) / 25;
        let g = (b - f + 1) / 3;
        let h = (19 * a + b - d - g + 15) % 30;
        let i = c / 4;
        let k = c % 4;
        let l = (32 + 2 * e + 2 * i - h - k) % 7;
        let m = (a + 11 * h + 22 * l) / 451;
        let month = (h + l - 7 * m + 114) / 31;
        let day = ((h + l - 7 * m + 114) % 31) + 1;

        NaiveDate::from_ymd_opt(year, month as u32, day as u32)
            .expect("Invalid Easter date calculation")
    }

    /// Calculate all Belgian holidays for a given year
    ///
    /// Fixed holidays:
    /// - Nouvel An (Jan 1)
    /// - Fête du Travail (May 1)
    /// - Fête Nationale (Jul 21)
    /// - Assomption (Aug 15)
    /// - Toussaint (Nov 1)
    /// - Armistice (Nov 11)
    /// - Noël (Dec 25)
    ///
    /// Easter-derived holidays:
    /// - Lundi de Pâques (Easter + 1)
    /// - Ascension (Easter + 39)
    /// - Lundi de Pentecôte (Easter + 50)
    pub fn calculate_holidays(year: i32) -> Vec<Holiday> {
        let easter = Self::calculate_easter(year);
        let mut holidays = Vec::new();

        // Fixed holidays
        holidays.push(Holiday {
            date: NaiveDate::from_ymd_opt(year, 1, 1).unwrap(),
            name: "Nouvel An".to_string(),
            is_moveable: false,
        });

        holidays.push(Holiday {
            date: NaiveDate::from_ymd_opt(year, 5, 1).unwrap(),
            name: "Fête du Travail".to_string(),
            is_moveable: false,
        });

        holidays.push(Holiday {
            date: NaiveDate::from_ymd_opt(year, 7, 21).unwrap(),
            name: "Fête Nationale".to_string(),
            is_moveable: false,
        });

        holidays.push(Holiday {
            date: NaiveDate::from_ymd_opt(year, 8, 15).unwrap(),
            name: "Assomption".to_string(),
            is_moveable: false,
        });

        holidays.push(Holiday {
            date: NaiveDate::from_ymd_opt(year, 11, 1).unwrap(),
            name: "Toussaint".to_string(),
            is_moveable: false,
        });

        holidays.push(Holiday {
            date: NaiveDate::from_ymd_opt(year, 11, 11).unwrap(),
            name: "Armistice".to_string(),
            is_moveable: false,
        });

        holidays.push(Holiday {
            date: NaiveDate::from_ymd_opt(year, 12, 25).unwrap(),
            name: "Noël".to_string(),
            is_moveable: false,
        });

        // Easter-derived holidays
        holidays.push(Holiday {
            date: easter + chrono::Duration::days(1),
            name: "Lundi de Pâques".to_string(),
            is_moveable: true,
        });

        holidays.push(Holiday {
            date: easter + chrono::Duration::days(39),
            name: "Ascension".to_string(),
            is_moveable: true,
        });

        holidays.push(Holiday {
            date: easter + chrono::Duration::days(50),
            name: "Lundi de Pentecôte".to_string(),
            is_moveable: true,
        });

        // Sort by date
        holidays.sort_by_key(|h| h.date);

        holidays
    }

    /// Check if a date is a holiday
    pub fn is_holiday(date: NaiveDate, holidays: &[Holiday]) -> bool {
        holidays.iter().any(|h| h.date == date)
    }

    /// Get holiday name for a date (if any)
    pub fn get_holiday_name(date: NaiveDate, holidays: &[Holiday]) -> Option<&str> {
        holidays
            .iter()
            .find(|h| h.date == date)
            .map(|h| h.name.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_easter_2026() {
        // Easter 2026 falls on April 5
        let easter = HolidayCalculator::calculate_easter(2026);
        assert_eq!(easter, NaiveDate::from_ymd_opt(2026, 4, 5).unwrap());
    }

    #[test]
    fn test_easter_various_years() {
        // Known Easter dates for verification
        assert_eq!(
            HolidayCalculator::calculate_easter(2024),
            NaiveDate::from_ymd_opt(2024, 3, 31).unwrap()
        );
        assert_eq!(
            HolidayCalculator::calculate_easter(2025),
            NaiveDate::from_ymd_opt(2025, 4, 20).unwrap()
        );
    }

    #[test]
    fn test_holidays_2026() {
        let holidays = HolidayCalculator::calculate_holidays(2026);

        // Should have 10 holidays
        assert_eq!(holidays.len(), 10);

        // Check Lundi de Pâques (Easter + 1 = April 6, 2026)
        let easter_monday = holidays.iter().find(|h| h.name == "Lundi de Pâques");
        assert!(easter_monday.is_some());
        assert_eq!(
            easter_monday.unwrap().date,
            NaiveDate::from_ymd_opt(2026, 4, 6).unwrap()
        );
    }
}
