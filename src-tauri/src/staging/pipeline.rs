use std::path::Path;

use super::{SecurityFindingReport, SecurityScanner, ScanVerdict};

/// Result of running the security scan in the staging pipeline.
pub struct StagingPipelineResult {
    /// The scan verdict (Clean, Flagged, or Quarantine)
    pub verdict: ScanVerdict,
    /// Full report when content is flagged or quarantined; None when clean
    pub report: Option<SecurityFindingReport>,
}

/// Run security scan as part of the staging pipeline.
///
/// Pipeline position: AFTER hygiene checks, BEFORE orchestrator notification.
///
/// The caller is responsible for NOT forwarding quarantined content to the orchestrator.
/// Typical usage:
///
/// ```ignore
/// let result = run_security_scan(&content_path);
/// match result.verdict {
///     ScanVerdict::Clean => forward_to_orchestrator(content_path),
///     ScanVerdict::Flagged(findings) => forward_with_advisory(content_path, findings),
///     ScanVerdict::Quarantine(_) => { /* do NOT forward -- log, notify user, stop */ }
/// }
/// ```
///
/// Safety: This function NEVER releases quarantined content. No method exists
/// to release quarantine from code -- only user interaction via dashboard or CLI.
pub fn run_security_scan(content_root: &Path) -> StagingPipelineResult {
    let scanner = SecurityScanner::new();
    let content_source = content_root
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let report = scanner.scan_and_report(content_root, &content_source);
    let verdict = scanner.classify(&report.findings);

    let report_opt = match &verdict {
        ScanVerdict::Clean => None,
        _ => Some(report),
    };

    StagingPipelineResult {
        verdict,
        report: report_opt,
    }
}
