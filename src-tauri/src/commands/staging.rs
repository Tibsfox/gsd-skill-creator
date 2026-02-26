//! Tauri commands for staging intake operations.
//!
//! Exposes manual intake trigger, debrief query, and quarantine listing
//! to the frontend via Tauri's invoke system.

use std::path::PathBuf;
use tauri::command;

use crate::staging::debrief::DebriefCollector;
use crate::staging::intake::{process_intake, IntakeDirs};
use crate::staging::notify::OrchestratorNotifier;

/// Manually trigger intake processing for a single file.
///
/// Processes the file through the full intake pipeline (validate, hygiene,
/// security scan, route) and notifies the orchestrator.
///
/// Returns the notification ID on success.
#[command]
pub fn staging_trigger_intake(file_path: String) -> Result<String, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err(format!("File not found: {}", file_path));
    }

    // Build IntakeDirs from .planning/staging/ convention
    let staging_root = PathBuf::from(".planning/staging");
    let dirs = IntakeDirs {
        intake: staging_root.join("intake"),
        processing: staging_root.join("processing"),
        processed: staging_root.join("processed"),
        quarantine: staging_root.join("quarantine"),
    };

    // Process through intake pipeline
    let result = process_intake(&path, &dirs).map_err(|e| e.to_string())?;

    // Notify orchestrator
    let inbox = PathBuf::from(".planning/console/inbox/pending");
    let notifier = OrchestratorNotifier::new(inbox);
    notifier
        .notify_new_work(&result)
        .map_err(|e| e.to_string())?;

    Ok(result.notification_id)
}

/// Collect and return debrief data for a named mission.
///
/// Returns the debrief as a JSON string.
#[command]
pub fn staging_get_debrief(mission_name: String) -> Result<String, String> {
    let missions_path = PathBuf::from(".planning/missions");
    let collector = DebriefCollector::new(missions_path);

    let debrief = collector
        .collect_debrief(&mission_name)
        .map_err(|e| e.to_string())?;

    serde_json::to_string_pretty(&debrief).map_err(|e| e.to_string())
}

/// List files currently in the quarantine directory.
///
/// Returns a list of quarantined file names.
#[command]
pub fn staging_list_quarantine() -> Result<Vec<String>, String> {
    let quarantine_dir = PathBuf::from(".planning/staging/quarantine");

    if !quarantine_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = std::fs::read_dir(&quarantine_dir).map_err(|e| e.to_string())?;

    let mut files = Vec::new();
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        // Skip reason files, only list actual quarantined content
        if !name.ends_with(".quarantine-reason.txt") {
            files.push(name);
        }
    }

    Ok(files)
}
