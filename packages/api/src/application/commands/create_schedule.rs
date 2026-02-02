//! Create/Update Schedule Command
//!
//! Handles schedule creation and updates with validation.

use chrono::NaiveDate;
use uuid::Uuid;

use crate::domain::entities::schedule::CreateSchedule;

/// Command to create or update a schedule entry
#[derive(Debug, Clone)]
pub struct CreateScheduleCommand {
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub entries: Vec<CreateSchedule>,
}

/// Result of schedule creation
#[derive(Debug)]
pub struct CreateScheduleResult {
    pub created: usize,
    pub updated: usize,
    pub errors: Vec<ScheduleError>,
}

/// Schedule creation error
#[derive(Debug)]
pub struct ScheduleError {
    pub user_id: Uuid,
    pub date: NaiveDate,
    pub message: String,
}

impl CreateScheduleCommand {
    /// Create a single schedule entry command
    pub fn single(
        organization_id: Uuid,
        created_by: Uuid,
        user_id: Uuid,
        date: NaiveDate,
        shift_type_id: Option<Uuid>,
    ) -> Self {
        Self {
            organization_id,
            created_by,
            entries: vec![CreateSchedule {
                user_id,
                shift_type_id,
                date,
                notes: None,
            }],
        }
    }

    /// Create a bulk schedule command
    pub fn bulk(organization_id: Uuid, created_by: Uuid, entries: Vec<CreateSchedule>) -> Self {
        Self {
            organization_id,
            created_by,
            entries,
        }
    }
}
