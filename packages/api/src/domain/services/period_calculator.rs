//! Period Calculator Service
//!
//! Calculates the 13 periods (P1-P13) for any given year.
//! Based on the logic from generate.py: calculer_periodes_dynamiques()

use chrono::{Datelike, Duration, NaiveDate};

/// Configuration for period calculation
#[derive(Debug, Clone)]
pub struct PeriodConfig {
    /// Anchor date (default: 2026-01-12)
    pub anchor_date: NaiveDate,
    /// Days per period (default: 28)
    pub days_per_period: i64,
    /// Number of periods per year (default: 13)
    pub periods_per_year: u8,
}

impl Default for PeriodConfig {
    fn default() -> Self {
        Self {
            anchor_date: NaiveDate::from_ymd_opt(2026, 1, 12).unwrap(),
            days_per_period: 28,
            periods_per_year: 13,
        }
    }
}

/// Calculated period info
#[derive(Debug, Clone)]
pub struct CalculatedPeriod {
    pub number: u8,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub hour_quota: i32,
}

/// Period calculator service
pub struct PeriodCalculator {
    config: PeriodConfig,
}

impl PeriodCalculator {
    /// Create with default configuration
    pub fn new() -> Self {
        Self {
            config: PeriodConfig::default(),
        }
    }

    /// Create with custom configuration
    pub fn with_config(config: PeriodConfig) -> Self {
        Self { config }
    }

    /// Create with custom anchor date
    pub fn with_anchor(anchor_date: NaiveDate) -> Self {
        Self {
            config: PeriodConfig {
                anchor_date,
                ..Default::default()
            },
        }
    }

    /// Calculate all 13 periods for a given year
    ///
    /// # Algorithm (from generate.py)
    /// 1. Calculate delta years from anchor (2026)
    /// 2. Start date = anchor + (364 * delta_years)
    /// 3. Each period = 28 days starting from start_date
    pub fn calculate_periods(&self, year: i32) -> Vec<CalculatedPeriod> {
        let anchor_year = self.config.anchor_date.year();
        let delta_years = year - anchor_year;

        // Calculate start of target year (364 days per year cycle)
        let year_start = self.config.anchor_date + Duration::days(364 * delta_years as i64);

        (1..=self.config.periods_per_year)
            .map(|i| {
                let period_start =
                    year_start + Duration::days(self.config.days_per_period * (i as i64 - 1));
                let period_end = period_start + Duration::days(self.config.days_per_period - 1);

                CalculatedPeriod {
                    number: i,
                    start_date: period_start,
                    end_date: period_end,
                    hour_quota: 160, // 20 workdays × 8h
                }
            })
            .collect()
    }

    /// Find which period contains a specific date
    pub fn get_period_for_date(&self, date: NaiveDate) -> Option<CalculatedPeriod> {
        // Determine the year to search
        let year = date.year();

        // Check current year and adjacent years (for boundary cases)
        for check_year in [year, year - 1, year + 1] {
            let periods = self.calculate_periods(check_year);
            if let Some(period) = periods
                .into_iter()
                .find(|p| date >= p.start_date && date <= p.end_date)
            {
                return Some(period);
            }
        }

        None
    }

    /// Get all dates in a period
    pub fn get_period_dates(&self, period: &CalculatedPeriod) -> Vec<NaiveDate> {
        let mut dates = Vec::new();
        let mut current = period.start_date;

        while current <= period.end_date {
            dates.push(current);
            current += Duration::days(1);
        }

        dates
    }

    /// Check if a period spans two calendar months
    pub fn is_cross_month(&self, period: &CalculatedPeriod) -> bool {
        period.start_date.month() != period.end_date.month()
    }
}

impl Default for PeriodCalculator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_periods_2026() {
        let calculator = PeriodCalculator::new();
        let periods = calculator.calculate_periods(2026);

        assert_eq!(periods.len(), 13);

        // P1 should start on anchor date
        assert_eq!(
            periods[0].start_date,
            NaiveDate::from_ymd_opt(2026, 1, 12).unwrap()
        );

        // Each period is 28 days
        for period in &periods {
            assert_eq!(
                (period.end_date - period.start_date).num_days(),
                27 // 0-indexed difference
            );
        }
    }

    #[test]
    fn test_period_for_date() {
        let calculator = PeriodCalculator::new();

        // Test anchor date (should be P1)
        let date = NaiveDate::from_ymd_opt(2026, 1, 12).unwrap();
        let period = calculator.get_period_for_date(date).unwrap();
        assert_eq!(period.number, 1);

        // Test end of P1 (28 days later - 1)
        let date = NaiveDate::from_ymd_opt(2026, 2, 8).unwrap();
        let period = calculator.get_period_for_date(date).unwrap();
        assert_eq!(period.number, 1);
    }
}
