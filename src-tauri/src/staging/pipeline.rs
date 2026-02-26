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
/// Quarantined content never generates pending tasks -- callers must check
/// `result.verdict` before proceeding. Only `ScanVerdict::Clean` content
/// should be forwarded to the orchestrator.
///
/// Safety: This function NEVER releases quarantined content. No method exists
/// to release quarantine from code -- only user interaction via dashboard or CLI.
pub fn run_security_scan(_content_root: &Path) -> StagingPipelineResult {
    todo!("implement in 370-02 Task 1 (GREEN phase)")
}
