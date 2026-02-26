//! Orchestrator Notifier -- Writes JSON notifications to inbox/pending/.
//!
//! When intake processing completes, the orchestrator must be notified with
//! a structured JSON message containing content type, location, hygiene status,
//! and estimated scope so it can act on new work.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use super::hygiene::HygieneStatus;
use super::intake::{ContentType, IntakeResult};

// ============================================================================
// Types
// ============================================================================

/// Estimated scope for a mission intake notification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EstimatedScope {
    /// Number of execution waves
    pub waves: u32,
    /// Estimated token usage
    pub estimated_tokens: u64,
    /// Number of parallel execution tracks
    pub parallel_tracks: u32,
}

/// Payload section of an orchestrator notification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationPayload {
    /// Content type string: "mission-pack", "vision-doc", "skill", "blueprint", "unknown"
    pub content_type: String,
    /// Path to the processed content
    pub location: String,
    /// Manifest file within content (for mission packs)
    pub manifest: Option<String>,
    /// Number of files in the content
    pub file_count: u32,
    /// Hygiene status string: "clean", "flagged", "quarantine"
    pub hygiene_status: String,
    /// Hygiene report text (null when clean)
    pub hygiene_report: Option<String>,
    /// Estimated execution scope (null when unknown)
    pub estimated_scope: Option<EstimatedScope>,
}

/// Full orchestrator notification matching the component spec schema.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrchestratorNotification {
    /// Unique notification ID: "intake-YYYYMMDD-shortUUID"
    pub id: String,
    /// Notification type: always "mission-intake"
    #[serde(rename = "type")]
    pub type_name: String,
    /// RFC 3339 timestamp
    pub timestamp: String,
    /// Source identifier: always "staging-intake-bridge"
    pub source: String,
    /// Notification payload with content details
    pub payload: NotificationPayload,
    /// Priority level: "normal", "high", "urgent"
    pub priority: String,
    /// Action for the orchestrator: "new-milestone", "review-skill", etc.
    pub action: String,
}

// ============================================================================
// OrchestratorNotifier
// ============================================================================

/// Notifier that writes JSON notifications to the orchestrator inbox.
pub struct OrchestratorNotifier {
    inbox_path: PathBuf,
}

impl OrchestratorNotifier {
    /// Create a new notifier writing to the specified inbox path.
    pub fn new(inbox_path: PathBuf) -> Self {
        OrchestratorNotifier { inbox_path }
    }

    /// Write a notification for new work detected by the intake pipeline.
    ///
    /// Returns the path of the written JSON file.
    pub fn notify_new_work(&self, result: &IntakeResult) -> Result<PathBuf, std::io::Error> {
        // Create inbox directory if needed
        fs::create_dir_all(&self.inbox_path)?;

        // Generate notification ID
        let date_str = date_today();
        let short_uuid = &Uuid::new_v4().to_string()[..8];
        let notification_id = format!("intake-{}-{}", date_str, short_uuid);

        // Map content type to string
        let content_type_str = match &result.content_type {
            ContentType::MissionPack => "mission-pack",
            ContentType::VisionDoc => "vision-doc",
            ContentType::Skill => "skill",
            ContentType::Blueprint => "blueprint",
            ContentType::Unknown => "unknown",
        };

        // Map hygiene status to string
        let hygiene_status_str = match &result.hygiene_status {
            HygieneStatus::Clean => "clean",
            HygieneStatus::Advisory { .. } => "flagged",
            HygieneStatus::Quarantine { .. } => "quarantine",
        };

        // Map hygiene status to report
        let hygiene_report = match &result.hygiene_status {
            HygieneStatus::Clean => None,
            HygieneStatus::Advisory { issues } => Some(issues.join("; ")),
            HygieneStatus::Quarantine { reason, detail } => {
                Some(format!("{}: {}", reason, detail))
            }
        };

        // Map content type to action
        let action = match &result.content_type {
            ContentType::MissionPack => "new-milestone",
            ContentType::VisionDoc => "review-vision",
            ContentType::Skill => "review-skill",
            ContentType::Blueprint => "review-blueprint",
            ContentType::Unknown => "review",
        };

        let notification = OrchestratorNotification {
            id: notification_id.clone(),
            type_name: "mission-intake".to_string(),
            timestamp: timestamp_now(),
            source: "staging-intake-bridge".to_string(),
            payload: NotificationPayload {
                content_type: content_type_str.to_string(),
                location: result.destination.to_string_lossy().to_string(),
                manifest: None,
                file_count: 1,
                hygiene_status: hygiene_status_str.to_string(),
                hygiene_report,
                estimated_scope: None,
            },
            priority: "normal".to_string(),
            action: action.to_string(),
        };

        // Serialize and write
        let json = serde_json::to_string_pretty(&notification)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;

        let file_path = self.inbox_path.join(format!("{}.json", notification_id));
        fs::write(&file_path, json)?;

        Ok(file_path)
    }
}

// ============================================================================
// Internal helpers
// ============================================================================

/// Produce an RFC 3339 timestamp string using std::time::SystemTime.
fn timestamp_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();

    let days = secs / 86400;
    let time_of_day = secs % 86400;
    let hours = time_of_day / 3600;
    let minutes = (time_of_day % 3600) / 60;
    let seconds = time_of_day % 60;

    let mut y = 1970i64;
    let mut remaining_days = days as i64;

    loop {
        let days_in_year = if is_leap_year(y) { 366 } else { 365 };
        if remaining_days < days_in_year {
            break;
        }
        remaining_days -= days_in_year;
        y += 1;
    }

    let month_days = if is_leap_year(y) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };

    let mut m = 0usize;
    for (i, &days_in_month) in month_days.iter().enumerate() {
        if remaining_days < days_in_month as i64 {
            m = i;
            break;
        }
        remaining_days -= days_in_month as i64;
    }

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        y,
        m + 1,
        remaining_days + 1,
        hours,
        minutes,
        seconds
    )
}

/// Produce a YYYYMMDD date string for notification IDs.
fn date_today() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();
    let days = secs / 86400;

    let mut y = 1970i64;
    let mut remaining_days = days as i64;

    loop {
        let days_in_year = if is_leap_year(y) { 366 } else { 365 };
        if remaining_days < days_in_year {
            break;
        }
        remaining_days -= days_in_year;
        y += 1;
    }

    let month_days = if is_leap_year(y) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };

    let mut m = 0usize;
    for (i, &days_in_month) in month_days.iter().enumerate() {
        if remaining_days < days_in_month as i64 {
            m = i;
            break;
        }
        remaining_days -= days_in_month as i64;
    }

    format!("{:04}{:02}{:02}", y, m + 1, remaining_days + 1)
}

fn is_leap_year(y: i64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}
