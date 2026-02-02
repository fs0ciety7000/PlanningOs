//! User Entity
//!
//! Represents a system user (Admin, Planner, or Agent).

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// User roles in the system
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    Planner,
    Agent,
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserRole::Admin => write!(f, "admin"),
            UserRole::Planner => write!(f, "planner"),
            UserRole::Agent => write!(f, "agent"),
        }
    }
}

/// User entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub role_id: Option<Uuid>,

    // Auth
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,

    // Profile
    pub first_name: String,
    pub last_name: String,
    pub matricule: Option<String>,
    pub avatar_url: Option<String>,
    pub phone: Option<String>,

    // Leave entitlements
    pub cn_entitlement: i32,
    pub jc_entitlement: i32,
    pub cn_carryover: i32,
    pub jc_carryover: i32,

    // Status
    pub is_active: bool,
    pub email_verified_at: Option<DateTime<Utc>>,
    pub last_login_at: Option<DateTime<Utc>>,

    // Timestamps
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl User {
    /// Get full name
    pub fn full_name(&self) -> String {
        format!("{} {}", self.first_name, self.last_name)
    }

    /// Calculate total CN entitlement including carryover
    pub fn total_cn_entitlement(&self) -> i32 {
        self.cn_entitlement + self.cn_carryover
    }

    /// Calculate total JC entitlement including carryover
    pub fn total_jc_entitlement(&self) -> i32 {
        self.jc_entitlement + self.jc_carryover
    }

    /// Check if user is verified
    pub fn is_verified(&self) -> bool {
        self.email_verified_at.is_some()
    }
}

/// User for creation (without ID and timestamps)
#[derive(Debug, Clone, Deserialize)]
pub struct CreateUser {
    pub organization_id: Uuid,
    pub role_id: Option<Uuid>,
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub matricule: Option<String>,
    pub cn_entitlement: Option<i32>,
    pub jc_entitlement: Option<i32>,
}

/// User update payload
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateUser {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub matricule: Option<String>,
    pub phone: Option<String>,
    pub cn_entitlement: Option<i32>,
    pub jc_entitlement: Option<i32>,
    pub cn_carryover: Option<i32>,
    pub jc_carryover: Option<i32>,
    pub is_active: Option<bool>,
}
