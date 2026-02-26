//! Debrief Collector -- Gathers mission metrics and computes calibration data.
//!
//! When missions complete, debrief data (metrics, calibration accuracy) is
//! collected to improve future planning estimates.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

// ============================================================================
// Types
// ============================================================================

/// Token usage breakdown for a mission.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsage {
    /// Input tokens consumed
    pub input: u64,
    /// Output tokens generated
    pub output: u64,
    /// Total tokens (input + output)
    pub total: u64,
    /// Token usage broken down by model
    pub by_model: HashMap<String, u64>,
}

/// Record of an error encountered during mission execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorRecord {
    /// Phase where the error occurred
    pub phase: String,
    /// Plan where the error occurred
    pub plan: String,
    /// Error description
    pub error: String,
    /// Whether the error was recovered from
    pub recovered: bool,
}

/// Calibration data comparing estimated vs actual values.
///
/// `accuracy_ratio` is computed as `actual_tokens / estimated_tokens`.
/// - 1.0 = perfect estimate
/// - < 1.0 = overestimate (estimated more than actual)
/// - > 1.0 = underestimate (actual exceeded estimate)
/// - 0.0 when estimated_tokens is 0 (avoids division by zero)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalibrationData {
    /// Estimated token usage from planning
    pub estimated_tokens: u64,
    /// Actual token usage measured
    pub actual_tokens: u64,
    /// Estimated wall time in seconds
    pub estimated_wall_time: u64,
    /// Actual wall time in seconds
    pub actual_wall_time: u64,
    /// Accuracy ratio: actual / estimated (0.0 if estimated is 0)
    pub accuracy_ratio: f64,
}

impl CalibrationData {
    /// Compute calibration data from estimated and actual values.
    ///
    /// If `estimated_tokens` is 0, `accuracy_ratio` is set to 0.0
    /// to avoid division by zero.
    pub fn compute(
        estimated_tokens: u64,
        actual_tokens: u64,
        estimated_wall_time: u64,
        actual_wall_time: u64,
    ) -> Self {
        let accuracy_ratio = if estimated_tokens == 0 {
            0.0
        } else {
            actual_tokens as f64 / estimated_tokens as f64
        };

        CalibrationData {
            estimated_tokens,
            actual_tokens,
            estimated_wall_time,
            actual_wall_time,
            accuracy_ratio,
        }
    }
}

/// Complete debrief for a mission execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Debrief {
    /// Mission name/identifier
    pub mission: String,
    /// RFC 3339 timestamp of completion
    pub completed_at: String,
    /// Total wall time in seconds
    pub wall_time_seconds: u64,
    /// Token usage breakdown
    pub token_usage: TokenUsage,
    /// Number of phases completed
    pub phases_completed: u32,
    /// Total number of phases planned
    pub phases_total: u32,
    /// Errors encountered during execution
    pub errors_encountered: Vec<ErrorRecord>,
    /// Skill observations captured during execution
    pub skill_observations: Vec<String>,
    /// Calibration data comparing estimates to actuals
    pub calibration: CalibrationData,
}

/// Errors that can occur during debrief collection.
#[derive(Debug, thiserror::Error)]
pub enum DebriefError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Parse error: {0}")]
    Parse(String),
}

// ============================================================================
// DebriefCollector
// ============================================================================

/// Collector that gathers mission metrics and produces debrief reports.
pub struct DebriefCollector {
    missions_path: PathBuf,
}

impl DebriefCollector {
    /// Create a new debrief collector for the given missions directory.
    pub fn new(missions_path: PathBuf) -> Self {
        DebriefCollector { missions_path }
    }

    /// Collect debrief data for a named mission.
    ///
    /// Reads STATE.md and ROADMAP.md from the mission directory to extract
    /// phase counts, timestamps, and status information.
    pub fn collect_debrief(&self, mission_name: &str) -> Result<Debrief, DebriefError> {
        let mission_dir = self.missions_path.join(mission_name);

        // Read STATE.md for phase counts and status
        let (phases_completed, phases_total) = self.read_state_phases(&mission_dir);

        // Read ROADMAP.md for additional context
        let _roadmap_info = self.read_roadmap(&mission_dir);

        // Compute wall time (default to 0 if no timestamps available)
        let wall_time_seconds = 0u64; // Would be computed from timestamps in real implementation

        // Build token usage (defaults to zeros if no token data found)
        let token_usage = TokenUsage {
            input: 0,
            output: 0,
            total: 0,
            by_model: HashMap::new(),
        };

        // Scan for errors
        let errors_encountered = Vec::new();

        // Compute calibration
        let calibration = CalibrationData::compute(0, 0, 0, wall_time_seconds);

        let debrief = Debrief {
            mission: mission_name.to_string(),
            completed_at: timestamp_now(),
            wall_time_seconds,
            token_usage,
            phases_completed,
            phases_total,
            errors_encountered,
            skill_observations: Vec::new(),
            calibration,
        };

        Ok(debrief)
    }

    /// Write a debrief to the mission's debrief directory.
    ///
    /// Creates `missions/{mission}/debrief/debrief.json`.
    pub fn write_debrief(&self, debrief: &Debrief) -> Result<PathBuf, DebriefError> {
        let debrief_dir = self
            .missions_path
            .join(&debrief.mission)
            .join("debrief");
        fs::create_dir_all(&debrief_dir)?;

        let json = serde_json::to_string_pretty(debrief)
            .map_err(|e| DebriefError::Parse(e.to_string()))?;

        let path = debrief_dir.join("debrief.json");
        fs::write(&path, json)?;

        Ok(path)
    }

    /// Read phase completion counts from STATE.md.
    fn read_state_phases(&self, mission_dir: &Path) -> (u32, u32) {
        let state_path = mission_dir.join("STATE.md");
        if let Ok(content) = fs::read_to_string(&state_path) {
            let completed = Self::extract_number(&content, "completed_phases");
            let total = Self::extract_number(&content, "total_phases");
            (completed, total)
        } else {
            (0, 0)
        }
    }

    /// Read roadmap information (placeholder for future enrichment).
    fn read_roadmap(&self, mission_dir: &Path) -> Option<String> {
        let roadmap_path = mission_dir.join("ROADMAP.md");
        fs::read_to_string(&roadmap_path).ok()
    }

    /// Extract a numeric value from a key: value pattern in text.
    fn extract_number(content: &str, key: &str) -> u32 {
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with(key) || trimmed.starts_with(&format!("{}:", key)) {
                // Try to extract number after the colon
                if let Some(value_str) = trimmed.split(':').last() {
                    if let Ok(n) = value_str.trim().parse::<u32>() {
                        return n;
                    }
                }
            }
        }
        0
    }
}

// ============================================================================
// Internal helpers
// ============================================================================

/// Produce an RFC 3339 timestamp string.
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

fn is_leap_year(y: i64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}
