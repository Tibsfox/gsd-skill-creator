//! Staging Intake -- File watcher pipeline for incoming content.
//!
//! # Safety Invariants
//!
//! - NO code is EVER executed from intake files. Files are classified, validated,
//!   and scanned, but never run, eval'd, or interpreted.
//!
//! - Files are moved atomically via rename. If rename fails (cross-device),
//!   a copy-then-delete fallback is used.
//!
//! - Zip extraction validates entry names for path traversal before extracting.
//!   Entries with `..` in the name are rejected.
//!
//! # Pipeline
//!
//! 1. validate_format (extension check)
//! 2. move_to_processing (atomic rename)
//! 3. If zip: extract_zip (with path traversal prevention)
//! 4. HygieneChecker::check_file (YAML tags, traversal, instructions)
//! 5. run_security_scan (CVE-informed patterns)
//! 6. route_result (to processed/ or quarantine/)

use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use super::hygiene::{HygieneChecker, HygieneStatus};
use super::pipeline::run_security_scan;
use super::security_scanner::ScanVerdict;

// ============================================================================
// Types
// ============================================================================

/// Content type classification based on file extension and structure.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ContentType {
    /// Zip archive containing mission pack files
    MissionPack,
    /// Markdown document (vision, requirements, etc.)
    VisionDoc,
    /// Skill definition file
    Skill,
    /// JSON blueprint/configuration
    Blueprint,
    /// Unknown content type
    Unknown,
}

/// Result of processing a file through the intake pipeline.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntakeResult {
    /// Original filename
    pub file_name: String,
    /// Classified content type
    pub content_type: ContentType,
    /// Final destination path after routing
    pub destination: PathBuf,
    /// Hygiene check result
    pub hygiene_status: HygieneStatus,
    /// Unique notification identifier
    pub notification_id: String,
}

/// Errors that can occur during intake processing.
#[derive(Debug, thiserror::Error)]
pub enum IntakeError {
    #[error("Invalid format: {extension} not allowed (only .md, .json, .zip)")]
    InvalidFormat { extension: String },
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Zip error: {0}")]
    Zip(String),
}

/// Directory paths for the intake pipeline stages.
pub struct IntakeDirs {
    /// Incoming files land here
    pub intake: PathBuf,
    /// Files being actively processed
    pub processing: PathBuf,
    /// Clean files after validation
    pub processed: PathBuf,
    /// Dangerous files quarantined here
    pub quarantine: PathBuf,
}

// ============================================================================
// Functions
// ============================================================================

/// Validate that a file has an allowed extension (.md, .json, .zip).
pub fn validate_format(path: &Path) -> Result<(), IntakeError> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    match ext {
        "md" | "json" | "zip" => Ok(()),
        other => Err(IntakeError::InvalidFormat {
            extension: other.to_string(),
        }),
    }
}

/// Classify content type based on file extension.
pub fn classify_content(path: &Path) -> ContentType {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    match ext {
        "zip" => ContentType::MissionPack,
        "md" => ContentType::VisionDoc,
        "json" => ContentType::Blueprint,
        _ => ContentType::Unknown,
    }
}

/// Move a file atomically from its current location to the processing directory.
///
/// Creates the processing directory if it doesn't exist.
/// Uses rename for atomicity; falls back to copy+delete on cross-device moves.
pub fn move_to_processing(path: &Path, processing_dir: &Path) -> Result<PathBuf, IntakeError> {
    fs::create_dir_all(processing_dir)?;

    let file_name = path
        .file_name()
        .ok_or_else(|| IntakeError::Io(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "no filename",
        )))?;

    let dest = processing_dir.join(file_name);

    // Try atomic rename first
    match fs::rename(path, &dest) {
        Ok(()) => Ok(dest),
        Err(_) => {
            // Cross-device fallback: copy then delete
            fs::copy(path, &dest)?;
            fs::remove_file(path)?;
            Ok(dest)
        }
    }
}

/// Extract a zip archive to the destination directory.
///
/// Validates each entry name for path traversal (rejects entries containing `..`).
/// Returns the list of extracted file paths.
///
/// SAFETY: Never executes extracted files.
pub fn extract_zip(zip_path: &Path, dest_dir: &Path) -> Result<Vec<PathBuf>, IntakeError> {
    let file = fs::File::open(zip_path).map_err(IntakeError::Io)?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| IntakeError::Zip(e.to_string()))?;

    let mut extracted_paths = Vec::new();

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| IntakeError::Zip(e.to_string()))?;
        let entry_name = entry.name().to_string();

        // Path traversal prevention: reject entries with ..
        if entry_name.contains("..") {
            return Err(IntakeError::Zip(format!(
                "path traversal in zip entry: {}",
                entry_name
            )));
        }

        let out_path = dest_dir.join(&entry_name);

        if entry.is_dir() {
            fs::create_dir_all(&out_path)?;
        } else {
            // Create parent directories if needed
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent)?;
            }

            let mut out_file = fs::File::create(&out_path)?;
            let mut buf = Vec::new();
            entry.read_to_end(&mut buf).map_err(|e| IntakeError::Zip(e.to_string()))?;
            std::io::Write::write_all(&mut out_file, &buf)?;
            extracted_paths.push(out_path);
        }
    }

    Ok(extracted_paths)
}

/// Route an intake result to its final destination (processed/ or quarantine/).
///
/// - Quarantine: file moved to quarantine/ with explanation file alongside.
/// - Clean/Advisory: file moved to processed/.
pub fn route_result(
    result: &IntakeResult,
    source_path: &Path,
    processed_dir: &Path,
    quarantine_dir: &Path,
) -> Result<PathBuf, IntakeError> {
    let file_name = source_path
        .file_name()
        .ok_or_else(|| IntakeError::Io(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "no filename",
        )))?;

    match &result.hygiene_status {
        HygieneStatus::Quarantine { reason, detail } => {
            fs::create_dir_all(quarantine_dir)?;
            let dest = quarantine_dir.join(file_name);

            // Move file to quarantine
            match fs::rename(source_path, &dest) {
                Ok(()) => {}
                Err(_) => {
                    fs::copy(source_path, &dest)?;
                    fs::remove_file(source_path)?;
                }
            }

            // Write explanation file alongside
            let reason_file_name = format!("{}.quarantine-reason.txt", file_name.to_string_lossy());
            let reason_path = quarantine_dir.join(reason_file_name);
            fs::write(
                &reason_path,
                format!("Quarantine Reason: {}\nDetail: {}\nNotification ID: {}\n",
                    reason, detail, result.notification_id),
            )?;

            Ok(dest)
        }
        _ => {
            // Clean or Advisory: move to processed/
            fs::create_dir_all(processed_dir)?;
            let dest = processed_dir.join(file_name);

            match fs::rename(source_path, &dest) {
                Ok(()) => {}
                Err(_) => {
                    fs::copy(source_path, &dest)?;
                    fs::remove_file(source_path)?;
                }
            }

            Ok(dest)
        }
    }
}

/// Process a single file through the full intake pipeline.
///
/// Pipeline: validate -> move -> (extract if zip) -> hygiene check -> security scan -> route.
///
/// SAFETY: No code is ever executed from intake files at any point.
pub fn process_intake(path: &Path, dirs: &IntakeDirs) -> Result<IntakeResult, IntakeError> {
    // 1. Validate format
    validate_format(path)?;

    // 2. Move to processing
    let proc_path = move_to_processing(path, &dirs.processing)?;

    // 3. If zip, extract and validate contents
    let check_path = if proc_path.extension().and_then(|e| e.to_str()) == Some("zip") {
        let temp_dir = dirs.processing.join(format!("_extract_{}", Uuid::new_v4()));
        fs::create_dir_all(&temp_dir)?;
        let _extracted = extract_zip(&proc_path, &temp_dir)?;
        // For hygiene checking, we check the extracted contents directory
        temp_dir
    } else {
        proc_path.clone()
    };

    // 4. Hygiene check
    let checker = HygieneChecker::new();
    let hygiene_status = if check_path.is_dir() {
        // Check all files in extracted directory
        let mut worst_status = HygieneStatus::Clean;
        if let Ok(entries) = fs::read_dir(&check_path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                if entry_path.is_file() {
                    let status = checker.check_file(&entry_path);
                    worst_status = worse_status(worst_status, status);
                }
            }
        }
        worst_status
    } else {
        checker.check_file(&check_path)
    };

    // 5. Security scan (on file's parent directory or extracted dir)
    let scan_dir = if check_path.is_dir() {
        check_path.clone()
    } else {
        check_path.parent().unwrap_or(&check_path).to_path_buf()
    };
    let security_result = run_security_scan(&scan_dir);

    // 6. Combine hygiene status with security scan verdict
    let final_status = match &security_result.verdict {
        ScanVerdict::Quarantine(findings) => {
            let detail = findings
                .iter()
                .map(|f| format!("{}: {}", f.id, f.description))
                .collect::<Vec<_>>()
                .join("; ");
            HygieneStatus::Quarantine {
                reason: "Security scan quarantine".to_string(),
                detail,
            }
        }
        ScanVerdict::Flagged(_) => {
            // Security flagged but not quarantined -- keep hygiene status
            // (hygiene quarantine still takes precedence)
            match &hygiene_status {
                HygieneStatus::Quarantine { .. } => hygiene_status.clone(),
                _ => hygiene_status.clone(),
            }
        }
        ScanVerdict::Clean => hygiene_status.clone(),
    };

    // Use worse of hygiene and security
    let combined_status = worse_status(hygiene_status, final_status);

    // 7. Classify content type
    let content_type = classify_content(&proc_path);

    // 8. Build IntakeResult
    let notification_id = Uuid::new_v4().to_string();
    let file_name = proc_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let mut result = IntakeResult {
        file_name,
        content_type,
        destination: PathBuf::new(), // Will be set by route_result
        hygiene_status: combined_status,
        notification_id,
    };

    // 9. Route result
    let final_dest = route_result(&result, &proc_path, &dirs.processed, &dirs.quarantine)?;
    result.destination = final_dest;

    Ok(result)
}

/// Skeleton function for filesystem watcher integration.
///
/// Watches `dirs.intake` for new files and calls `process_intake` on each.
/// Full wiring happens in Phase 383 integration.
pub fn start_watching_intake(
    _dirs: IntakeDirs,
    _shutdown_rx: std::sync::mpsc::Receiver<()>,
) -> Result<(), IntakeError> {
    // Thin wrapper: watch dirs.intake, on file create call process_intake
    // Implementation uses notify crate pattern from src-tauri/src/watcher.rs
    // Full wiring happens in Phase 383 integration
    todo!("Wired in 383-integration")
}

// ============================================================================
// Internal helpers
// ============================================================================

/// Return the worse of two HygieneStatus values.
/// Priority: Quarantine > Advisory > Clean.
fn worse_status(a: HygieneStatus, b: HygieneStatus) -> HygieneStatus {
    match (&a, &b) {
        (HygieneStatus::Quarantine { .. }, _) => a,
        (_, HygieneStatus::Quarantine { .. }) => b,
        (HygieneStatus::Advisory { .. }, _) => a,
        (_, HygieneStatus::Advisory { .. }) => b,
        _ => a,
    }
}
