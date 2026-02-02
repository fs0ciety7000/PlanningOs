//! Repository Ports
//!
//! Trait definitions for data access.

use async_trait::async_trait;
use chrono::NaiveDate;
use uuid::Uuid;

use crate::domain::entities::{Period, Schedule, ShiftType, User};

/// Result type for repository operations
pub type RepoResult<T> = Result<T, RepositoryError>;

/// Repository error types
#[derive(Debug, thiserror::Error)]
pub enum RepositoryError {
    #[error("Entity not found: {0}")]
    NotFound(String),

    #[error("Duplicate entry: {0}")]
    Duplicate(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Validation error: {0}")]
    Validation(String),
}

/// User repository port
#[async_trait]
pub trait UserRepository: Send + Sync {
    /// Find user by ID
    async fn find_by_id(&self, id: Uuid) -> RepoResult<Option<User>>;

    /// Find user by email
    async fn find_by_email(&self, org_id: Uuid, email: &str) -> RepoResult<Option<User>>;

    /// Find all users in organization
    async fn find_all(&self, org_id: Uuid) -> RepoResult<Vec<User>>;

    /// Find active users in organization
    async fn find_active(&self, org_id: Uuid) -> RepoResult<Vec<User>>;

    /// Create new user
    async fn create(&self, user: &User) -> RepoResult<User>;

    /// Update user
    async fn update(&self, user: &User) -> RepoResult<User>;

    /// Delete user (soft delete)
    async fn delete(&self, id: Uuid) -> RepoResult<()>;
}

/// Schedule repository port
#[async_trait]
pub trait ScheduleRepository: Send + Sync {
    /// Find schedule by ID
    async fn find_by_id(&self, id: Uuid) -> RepoResult<Option<Schedule>>;

    /// Find schedule for user on date
    async fn find_by_user_date(&self, user_id: Uuid, date: NaiveDate) -> RepoResult<Option<Schedule>>;

    /// Find all schedules for user in date range
    async fn find_by_user_range(
        &self,
        user_id: Uuid,
        start: NaiveDate,
        end: NaiveDate,
    ) -> RepoResult<Vec<Schedule>>;

    /// Find all schedules for organization in date range
    async fn find_by_org_range(
        &self,
        org_id: Uuid,
        start: NaiveDate,
        end: NaiveDate,
    ) -> RepoResult<Vec<Schedule>>;

    /// Create or update schedule
    async fn upsert(&self, schedule: &Schedule) -> RepoResult<Schedule>;

    /// Bulk upsert schedules
    async fn bulk_upsert(&self, schedules: &[Schedule]) -> RepoResult<Vec<Schedule>>;

    /// Delete schedule
    async fn delete(&self, id: Uuid) -> RepoResult<()>;
}

/// ShiftType repository port
#[async_trait]
pub trait ShiftTypeRepository: Send + Sync {
    /// Find shift type by ID
    async fn find_by_id(&self, id: Uuid) -> RepoResult<Option<ShiftType>>;

    /// Find shift type by code
    async fn find_by_code(&self, org_id: Uuid, code: &str) -> RepoResult<Option<ShiftType>>;

    /// Find all shift types in organization
    async fn find_all(&self, org_id: Uuid) -> RepoResult<Vec<ShiftType>>;

    /// Find active shift types
    async fn find_active(&self, org_id: Uuid) -> RepoResult<Vec<ShiftType>>;

    /// Create shift type
    async fn create(&self, shift_type: &ShiftType) -> RepoResult<ShiftType>;

    /// Update shift type
    async fn update(&self, shift_type: &ShiftType) -> RepoResult<ShiftType>;

    /// Delete shift type (soft delete)
    async fn delete(&self, id: Uuid) -> RepoResult<()>;
}

/// Period repository port
#[async_trait]
pub trait PeriodRepository: Send + Sync {
    /// Find period by ID
    async fn find_by_id(&self, id: Uuid) -> RepoResult<Option<Period>>;

    /// Find period containing date
    async fn find_by_date(&self, org_id: Uuid, date: NaiveDate) -> RepoResult<Option<Period>>;

    /// Find all periods for year
    async fn find_by_year(&self, org_id: Uuid, year: i32) -> RepoResult<Vec<Period>>;

    /// Create period
    async fn create(&self, period: &Period) -> RepoResult<Period>;

    /// Generate periods for year
    async fn generate_for_year(&self, org_id: Uuid, year: i32) -> RepoResult<Vec<Period>>;
}
