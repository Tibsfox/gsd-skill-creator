//! Conversation history persistence to JSON files.
//!
//! Phase 376 -- API Client
//!
//! Saves conversations to .planning/conversations/ as JSON files with
//! the format: session-YYYYMMDD-HHMMSS.json. Each record contains
//! the conversation ID, model, messages, and cumulative token usage.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

use crate::api::client::Message;

// ============================================================================
// Serializable types
// ============================================================================

/// Token usage statistics for a conversation.
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct TokenUsage {
    pub total_input: u32,
    pub total_output: u32,
}

/// A serialized message in conversation history.
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct SerializedMessage {
    pub role: String,
    pub content: String,
}

/// Persistent conversation record matching the component spec JSON format.
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct ConversationRecord {
    pub id: String,
    pub started_at: String,
    pub model: String,
    pub messages: Vec<SerializedMessage>,
    pub token_usage: TokenUsage,
}

// ============================================================================
// ConversationHistory
// ============================================================================

/// In-memory conversation history that can be persisted to JSON.
pub struct ConversationHistory {
    record: ConversationRecord,
}

impl ConversationHistory {
    /// Create a new empty conversation history.
    pub fn new(id: String, model: String) -> Self {
        let started_at = Self::now_iso8601();
        Self {
            record: ConversationRecord {
                id,
                started_at,
                model,
                messages: Vec::new(),
                token_usage: TokenUsage {
                    total_input: 0,
                    total_output: 0,
                },
            },
        }
    }

    /// Append a message to the conversation history.
    pub fn add_message(&mut self, message: &Message) {
        self.record.messages.push(SerializedMessage {
            role: message.role.clone(),
            content: message.content.clone(),
        });
    }

    /// Update cumulative token usage (additive).
    pub fn update_usage(&mut self, input_tokens: u32, output_tokens: u32) {
        self.record.token_usage.total_input += input_tokens;
        self.record.token_usage.total_output += output_tokens;
    }

    /// Get the message list.
    pub fn messages(&self) -> &[SerializedMessage] {
        &self.record.messages
    }

    /// Get cumulative input tokens.
    pub fn total_input_tokens(&self) -> u32 {
        self.record.token_usage.total_input
    }

    /// Get cumulative output tokens.
    pub fn total_output_tokens(&self) -> u32 {
        self.record.token_usage.total_output
    }

    /// Get the inner record for serialization.
    pub fn record(&self) -> &ConversationRecord {
        &self.record
    }

    /// Save a conversation record to a JSON file in the given directory.
    ///
    /// Creates the directory if needed. Filename format: session-YYYYMMDD-HHMMSS.json
    pub fn save(record: &ConversationRecord, dir: &Path) -> Result<PathBuf, std::io::Error> {
        std::fs::create_dir_all(dir)?;
        let filename = Self::filename_from_timestamp(&record.started_at);
        let path = dir.join(filename);
        let json = serde_json::to_string_pretty(record)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;
        std::fs::write(&path, json)?;
        Ok(path)
    }

    /// Load a conversation record from a JSON file.
    pub fn load(path: &Path) -> Result<ConversationRecord, std::io::Error> {
        let content = std::fs::read_to_string(path)?;
        let record: ConversationRecord = serde_json::from_str(&content)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;
        Ok(record)
    }

    /// List all conversation JSON files in a directory, sorted by modification time
    /// (most recent first). Returns empty vec if directory does not exist.
    pub fn list(dir: &Path) -> Result<Vec<PathBuf>, std::io::Error> {
        if !dir.exists() {
            return Ok(Vec::new());
        }
        let mut entries: Vec<(PathBuf, std::time::SystemTime)> = Vec::new();
        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("json") {
                let modified = entry.metadata()?.modified()?;
                entries.push((path, modified));
            }
        }
        // Sort by modification time, most recent first
        entries.sort_by(|a, b| b.1.cmp(&a.1));
        Ok(entries.into_iter().map(|(p, _)| p).collect())
    }

    // ========================================================================
    // Internal helpers
    // ========================================================================

    /// Generate an ISO 8601 timestamp from the current system time.
    fn now_iso8601() -> String {
        use std::time::{SystemTime, UNIX_EPOCH};
        let secs = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        Self::secs_to_iso8601(secs)
    }

    /// Convert UNIX seconds to ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
    fn secs_to_iso8601(secs: u64) -> String {
        let total_days = secs / 86400;
        let day_secs = secs % 86400;
        let hours = day_secs / 3600;
        let minutes = (day_secs % 3600) / 60;
        let seconds = day_secs % 60;

        // Days since 1970-01-01 to year/month/day
        let (year, month, day) = Self::days_to_date(total_days);
        format!(
            "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
            year, month, day, hours, minutes, seconds
        )
    }

    /// Convert days since epoch to (year, month, day).
    fn days_to_date(days: u64) -> (u64, u64, u64) {
        // Simplified calendar computation
        let mut remaining = days as i64;
        let mut year: u64 = 1970;

        loop {
            let days_in_year = if Self::is_leap(year) { 366 } else { 365 };
            if remaining < days_in_year {
                break;
            }
            remaining -= days_in_year;
            year += 1;
        }

        let months: [i64; 12] = if Self::is_leap(year) {
            [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        } else {
            [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        };

        let mut month: u64 = 1;
        for &days_in_month in &months {
            if remaining < days_in_month {
                break;
            }
            remaining -= days_in_month;
            month += 1;
        }

        (year, month, remaining as u64 + 1)
    }

    fn is_leap(year: u64) -> bool {
        (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
    }

    /// Generate a filename from a started_at timestamp.
    /// Input: "2026-02-26T14:30:00Z" -> "session-20260226-143000.json"
    fn filename_from_timestamp(started_at: &str) -> String {
        let clean: String = started_at
            .chars()
            .filter(|c| c.is_ascii_digit())
            .collect();
        // Take first 14 digits (YYYYMMDDHHMMSS) if available
        let ts = if clean.len() >= 14 {
            &clean[..14]
        } else {
            &clean
        };
        format!("session-{}-{}.json", &ts[..8], &ts[8..])
    }
}
