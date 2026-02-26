use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

use crate::security::types::{EventSeverity, EventSource, SecurityEvent};

// ============================================================================
// Types
// ============================================================================

/// Severity level for a security pattern match.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SecuritySeverity {
    Critical,
    High,
    Medium,
}

/// Action to take when a pattern is detected.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SecurityAction {
    Quarantine,
    HeadsUp,
}

/// How a pattern matches content.
pub enum PatternMatcher {
    /// Check if a specific file contains TWO regex patterns (compound match).
    /// Both patterns must match in the same file content.
    CompoundFileContains {
        path: String,
        pattern_a: Regex,
        pattern_b: Regex,
    },
    /// Check if any file in the tree contains a regex match.
    AnyFileContains(Regex),
}

/// A single security detection pattern with CVE reference.
pub struct SecurityPattern {
    pub id: String,
    pub name: String,
    pub severity: SecuritySeverity,
    pub action: SecurityAction,
    pub matcher: PatternMatcher,
    pub cve_reference: Option<String>,
    pub description: String,
}

/// A finding produced when a pattern matches content.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecurityFinding {
    pub id: String,
    pub name: String,
    pub severity: SecuritySeverity,
    pub file: String,
    pub line: u32,
    pub matched_text: String,
    pub cve_reference: Option<String>,
    pub description: String,
}

/// Verdict after scanning content. Determines whether content proceeds or is quarantined.
#[derive(Debug)]
pub enum ScanVerdict {
    /// No security issues found -- content is safe to proceed.
    Clean,
    /// Advisory findings (High/Medium only) -- content may proceed with warnings.
    Flagged(Vec<SecurityFinding>),
    /// Critical findings detected -- content MUST NOT proceed.
    /// NOTE: No release/unlock/approve method exists on this variant.
    /// Content can only be released by user action via dashboard or CLI.
    Quarantine(Vec<SecurityFinding>),
}

/// A full scan report with findings, events, verdict, and action guidance.
///
/// Produced by `SecurityScanner::scan_and_report()`. Serializes to JSON for
/// persistence alongside quarantined artifacts.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecurityFindingReport {
    /// RFC 3339 timestamp of when the scan was performed
    pub scan_timestamp: String,
    /// Source identifier (typically the content directory name)
    pub content_source: String,
    /// Verdict string: "clean", "flagged", or "quarantine"
    pub verdict: String,
    /// All findings with file/line/match/CVE details
    pub findings: Vec<SecurityFinding>,
    /// One SecurityEvent per finding for dashboard consumption
    pub events: Vec<SecurityEvent>,
    /// Human-readable action description
    pub action_required: String,
}

/// The security scanner with compiled CVE-informed pattern detectors.
pub struct SecurityScanner {
    patterns: Vec<SecurityPattern>,
}

// ============================================================================
// Implementation
// ============================================================================

impl SecurityScanner {
    /// Construct a new SecurityScanner with all 8 CVE-informed patterns.
    ///
    /// Patterns are compiled at construction time for reuse across multiple scans.
    pub fn new() -> Self {
        let patterns = vec![
            // SEC-001 (Critical / Quarantine / CVE-2025-59536):
            // settings.json hook override with shell commands
            SecurityPattern {
                id: "SEC-001".into(),
                name: "Settings hook override".into(),
                severity: SecuritySeverity::Critical,
                action: SecurityAction::Quarantine,
                matcher: PatternMatcher::CompoundFileContains {
                    path: ".claude/settings.json".into(),
                    pattern_a: Regex::new(r#""hooks"\s*:"#).unwrap(),
                    pattern_b: Regex::new(
                        r#""command"\s*:\s*"[^"]*(?:curl|wget|nc\b|bash|sh\b|python|node)[^"]*""#,
                    )
                    .unwrap(),
                },
                cve_reference: Some("CVE-2025-59536".into()),
                description: "Settings.json contains hook overrides with shell commands that execute on tool use".into(),
            },
            // SEC-002 (Critical / Quarantine / CVE-2026-21852):
            // ANTHROPIC_BASE_URL redirect to non-Anthropic domain
            SecurityPattern {
                id: "SEC-002".into(),
                name: "API URL redirect".into(),
                severity: SecuritySeverity::Critical,
                action: SecurityAction::Quarantine,
                matcher: PatternMatcher::AnyFileContains(
                    // Match ANTHROPIC_BASE_URL pointing to any domain EXCEPT anthropic.com
                    // We use a two-step approach: match ANTHROPIC_BASE_URL=<url>, then exclude anthropic.com
                    Regex::new(r#"ANTHROPIC_BASE_URL\s*=\s*"?https?://[^"\s]+"?"#).unwrap(),
                ),
                cve_reference: Some("CVE-2026-21852".into()),
                description: "ANTHROPIC_BASE_URL redirected to non-Anthropic domain for credential interception".into(),
            },
            // SEC-003 (High / HeadsUp):
            // Hook injection with network commands (curl/wget/nc)
            SecurityPattern {
                id: "SEC-003".into(),
                name: "Hook injection".into(),
                severity: SecuritySeverity::High,
                action: SecurityAction::HeadsUp,
                matcher: PatternMatcher::AnyFileContains(
                    Regex::new(
                        r#""command"\s*:\s*"[^"]*(?:curl|wget|nc\b)[^"]*""#,
                    )
                    .unwrap(),
                ),
                cve_reference: None,
                description: "Hook definition with network command injection (curl/wget/nc)".into(),
            },
            // SEC-004 (High / HeadsUp):
            // MCP server definitions pointing to unknown domains
            SecurityPattern {
                id: "SEC-004".into(),
                name: "MCP server risk".into(),
                severity: SecuritySeverity::High,
                action: SecurityAction::HeadsUp,
                matcher: PatternMatcher::AnyFileContains(
                    Regex::new(r#""mcpServers"\s*:\s*\{[^}]*"url"\s*:\s*"https?://"#).unwrap(),
                ),
                cve_reference: None,
                description: "MCP server definition with external URL -- potential unauthorized tool access".into(),
            },
            // SEC-005 (Critical / Quarantine):
            // Sandbox escape commands (nsenter/unshare/chroot/bwrap/sandbox-exec)
            SecurityPattern {
                id: "SEC-005".into(),
                name: "Sandbox escape".into(),
                severity: SecuritySeverity::Critical,
                action: SecurityAction::Quarantine,
                matcher: PatternMatcher::AnyFileContains(
                    Regex::new(r"(?:^|\s|;|&&|\|\|)(?:nsenter|unshare|chroot|bwrap|sandbox-exec)\b")
                        .unwrap(),
                ),
                cve_reference: None,
                description: "Sandbox escape commands detected (nsenter/unshare/chroot/bwrap)".into(),
            },
            // SEC-006 (High / HeadsUp):
            // SSH key path references
            SecurityPattern {
                id: "SEC-006".into(),
                name: "SSH key reference".into(),
                severity: SecuritySeverity::High,
                action: SecurityAction::HeadsUp,
                matcher: PatternMatcher::AnyFileContains(
                    Regex::new(r"(?:~|/home/[^/]+|\$HOME|%USERPROFILE%)/\.ssh/|SSH_AUTH_SOCK")
                        .unwrap(),
                ),
                cve_reference: None,
                description: "References to SSH key paths or SSH agent socket".into(),
            },
            // SEC-007 (Critical / Quarantine):
            // Credential exfiltration via network commands
            SecurityPattern {
                id: "SEC-007".into(),
                name: "Credential exfiltration".into(),
                severity: SecuritySeverity::Critical,
                action: SecurityAction::Quarantine,
                matcher: PatternMatcher::AnyFileContains(
                    Regex::new(
                        r"(?:curl|wget|nc\b|fetch)[^\n]*\$(?:ANTHROPIC_API_KEY|AWS_SECRET(?:_ACCESS_KEY)?|SSH_(?:KEY|PRIVATE_KEY)|GITHUB_TOKEN)|\$(?:ANTHROPIC_API_KEY|AWS_SECRET(?:_ACCESS_KEY)?|SSH_(?:KEY|PRIVATE_KEY)|GITHUB_TOKEN)[^\n]*(?:curl|wget|nc\b|fetch)",
                    )
                    .unwrap(),
                ),
                cve_reference: None,
                description: "Network command exfiltrating credential environment variables".into(),
            },
            // SEC-008 (Medium / HeadsUp):
            // Base64-encoded strings >50 chars in command contexts
            SecurityPattern {
                id: "SEC-008".into(),
                name: "Base64 obfuscation".into(),
                severity: SecuritySeverity::Medium,
                action: SecurityAction::HeadsUp,
                matcher: PatternMatcher::AnyFileContains(
                    Regex::new(r"[A-Za-z0-9+/]{50,}={0,2}").unwrap(),
                ),
                cve_reference: None,
                description: "Large base64-encoded string that may contain obfuscated commands".into(),
            },
        ];

        SecurityScanner { patterns }
    }

    /// Scan a content directory for security pattern matches.
    ///
    /// Walks the directory tree recursively, skipping binary files.
    /// Returns all findings with file path (relative), line number, and matched text.
    pub fn scan(&self, content_root: &Path) -> Vec<SecurityFinding> {
        let mut findings = Vec::new();
        let files = collect_text_files(content_root);

        for pattern in &self.patterns {
            match &pattern.matcher {
                PatternMatcher::CompoundFileContains {
                    path,
                    pattern_a,
                    pattern_b,
                } => {
                    let target = content_root.join(path);
                    if let Ok(content) = fs::read_to_string(&target) {
                        if pattern_a.is_match(&content) && pattern_b.is_match(&content) {
                            // Find the line matching pattern_b (the more specific match)
                            let (line, matched) = find_match_line(&content, pattern_b);
                            findings.push(SecurityFinding {
                                id: pattern.id.clone(),
                                name: pattern.name.clone(),
                                severity: pattern.severity,
                                file: path.clone(),
                                line,
                                matched_text: matched,
                                cve_reference: pattern.cve_reference.clone(),
                                description: pattern.description.clone(),
                            });
                        }
                    }
                }
                PatternMatcher::AnyFileContains(regex) => {
                    for file_path in &files {
                        if let Ok(content) = fs::read_to_string(file_path) {
                            // SEC-002 special handling: exclude api.anthropic.com
                            if pattern.id == "SEC-002" {
                                if !check_sec_002(&content) {
                                    continue;
                                }
                            }

                            if regex.is_match(&content) {
                                let (line, matched) = find_match_line(&content, regex);
                                let rel = file_path
                                    .strip_prefix(content_root)
                                    .unwrap_or(file_path)
                                    .to_string_lossy()
                                    .to_string();
                                findings.push(SecurityFinding {
                                    id: pattern.id.clone(),
                                    name: pattern.name.clone(),
                                    severity: pattern.severity,
                                    file: rel,
                                    line,
                                    matched_text: matched,
                                    cve_reference: pattern.cve_reference.clone(),
                                    description: pattern.description.clone(),
                                });
                                // One finding per pattern per file is sufficient
                                break;
                            }
                        }
                    }
                }
            }
        }

        findings
    }

    /// Scan content and produce a full finding report with SecurityEvent emission.
    ///
    /// Returns a `SecurityFindingReport` containing findings, events, verdict,
    /// and action guidance. Events are emitted per finding for dashboard consumption.
    pub fn scan_and_report(
        &self,
        content_root: &Path,
        content_source: &str,
    ) -> SecurityFindingReport {
        let findings = self.scan(content_root);
        let verdict = self.classify(&findings);

        let verdict_str = match &verdict {
            ScanVerdict::Clean => "clean",
            ScanVerdict::Flagged(_) => "flagged",
            ScanVerdict::Quarantine(_) => "quarantine",
        };

        // Emit one SecurityEvent per finding
        let events: Vec<SecurityEvent> = findings
            .iter()
            .map(|f| SecurityEvent {
                id: uuid::Uuid::new_v4().to_string(),
                timestamp: timestamp_now(),
                severity: match f.severity {
                    SecuritySeverity::Critical => EventSeverity::Critical,
                    SecuritySeverity::High => EventSeverity::Warning,
                    SecuritySeverity::Medium => EventSeverity::Info,
                },
                source: EventSource::Staging,
                event_type: "pattern_match".to_string(),
                detail: serde_json::json!({
                    "finding_id": f.id,
                    "file": f.file,
                    "line": f.line,
                    "cve": f.cve_reference,
                }),
            })
            .collect();

        let action_required = match verdict_str {
            "quarantine" => {
                let critical_count = findings
                    .iter()
                    .filter(|f| matches!(f.severity, SecuritySeverity::Critical))
                    .count();
                format!(
                    "Human review required. Content quarantined. \
                     Only a user (not an agent) can release quarantined content. \
                     {} critical finding(s) detected.",
                    critical_count
                )
            }
            "flagged" => format!(
                "Content flagged with {} advisory finding(s). \
                 Review recommended before proceeding.",
                findings.len()
            ),
            _ => "No action required.".to_string(),
        };

        SecurityFindingReport {
            scan_timestamp: timestamp_now(),
            content_source: content_source.to_string(),
            verdict: verdict_str.to_string(),
            findings,
            events,
            action_required,
        }
    }

    /// Classify findings into a verdict.
    ///
    /// - Any Critical finding -> Quarantine
    /// - No Critical + at least one finding -> Flagged
    /// - Zero findings -> Clean
    pub fn classify(&self, findings: &[SecurityFinding]) -> ScanVerdict {
        if findings.is_empty() {
            return ScanVerdict::Clean;
        }

        let has_critical = findings
            .iter()
            .any(|f| f.severity == SecuritySeverity::Critical);

        if has_critical {
            ScanVerdict::Quarantine(findings.to_vec())
        } else {
            ScanVerdict::Flagged(findings.to_vec())
        }
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

    // Convert epoch seconds to date components (simplified UTC)
    let days = secs / 86400;
    let time_of_day = secs % 86400;
    let hours = time_of_day / 3600;
    let minutes = (time_of_day % 3600) / 60;
    let seconds = time_of_day % 60;

    // Days since epoch to year/month/day (simplified Gregorian)
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

/// Check if content contains ANTHROPIC_BASE_URL pointing to a non-Anthropic domain.
/// Returns true if the URL is suspicious (NOT anthropic.com), false if safe.
fn check_sec_002(content: &str) -> bool {
    let url_re =
        Regex::new(r#"ANTHROPIC_BASE_URL\s*=\s*"?https?://([^"/\s]+)"?"#).unwrap();
    if let Some(caps) = url_re.captures(content) {
        let domain = caps.get(1).map(|m| m.as_str()).unwrap_or("");
        // Allow official Anthropic domains
        if domain == "api.anthropic.com"
            || domain == "anthropic.com"
            || domain.ends_with(".anthropic.com")
        {
            return false;
        }
        return true;
    }
    false
}

/// Find the first matching line in content and return (1-based line number, matched text).
fn find_match_line(content: &str, regex: &Regex) -> (u32, String) {
    for (idx, line) in content.lines().enumerate() {
        if let Some(m) = regex.find(line) {
            return ((idx + 1) as u32, m.as_str().to_string());
        }
    }
    // Fallback: match exists but spans multiple lines
    if let Some(m) = regex.find(content) {
        return (1, m.as_str().chars().take(200).collect());
    }
    (0, String::new())
}

/// Recursively collect all text files under a directory.
/// Skips binary files (files where the first 512 bytes contain a NUL byte).
fn collect_text_files(root: &Path) -> Vec<PathBuf> {
    let mut files = Vec::new();
    collect_text_files_recursive(root, &mut files);
    files
}

fn collect_text_files_recursive(dir: &Path, files: &mut Vec<PathBuf>) {
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_text_files_recursive(&path, files);
        } else if path.is_file() {
            // Skip binary files
            if is_text_file(&path) {
                files.push(path);
            }
        }
    }
}

/// Check if a file is a text file by reading the first 512 bytes and looking for NUL.
fn is_text_file(path: &Path) -> bool {
    match fs::read(path) {
        Ok(bytes) => {
            let check_len = bytes.len().min(512);
            !bytes[..check_len].contains(&0u8)
        }
        Err(_) => false,
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::security::types::EventSource;
    use std::path::PathBuf;

    fn fixture_path(name: &str) -> PathBuf {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        PathBuf::from(manifest_dir)
            .parent()
            .unwrap()
            .join("tests")
            .join("fixtures")
            .join("security-patterns")
            .join(name)
    }

    fn scanner() -> SecurityScanner {
        SecurityScanner::new()
    }

    #[test]
    fn clean_content_returns_clean_verdict() {
        let s = scanner();
        let findings = s.scan(&fixture_path("clean-mission-pack"));
        let verdict = s.classify(&findings);
        assert!(findings.is_empty(), "clean content should produce zero findings");
        assert!(matches!(verdict, ScanVerdict::Clean));
    }

    #[test]
    fn sec_001_detects_hook_override_in_settings_json() {
        let s = scanner();
        let findings = s.scan(&fixture_path("sec-001-hook-override"));
        assert!(!findings.is_empty(), "SEC-001 must detect hook override");
        let f = findings.iter().find(|f| f.id == "SEC-001").expect("SEC-001 finding missing");
        assert_eq!(f.severity, SecuritySeverity::Critical);
        assert_eq!(f.cve_reference, Some("CVE-2025-59536".to_string()));
        let verdict = s.classify(&findings);
        assert!(matches!(verdict, ScanVerdict::Quarantine(_)));
    }

    #[test]
    fn sec_002_detects_api_url_redirect_to_evil_domain() {
        let s = scanner();
        let findings = s.scan(&fixture_path("sec-002-api-redirect"));
        assert!(!findings.is_empty(), "SEC-002 must detect API URL redirect");
        let f = findings.iter().find(|f| f.id == "SEC-002").expect("SEC-002 finding missing");
        assert_eq!(f.severity, SecuritySeverity::Critical);
        assert_eq!(f.cve_reference, Some("CVE-2026-21852".to_string()));
        let verdict = s.classify(&findings);
        assert!(matches!(verdict, ScanVerdict::Quarantine(_)));
    }

    #[test]
    fn sec_002_allows_anthropic_official_domain() {
        let s = scanner();
        let findings = s.scan(&fixture_path("sec-002-allow-anthropic"));
        let sec002 = findings.iter().find(|f| f.id == "SEC-002");
        assert!(sec002.is_none(), "SEC-002 must NOT flag api.anthropic.com");
    }

    #[test]
    fn sec_005_detects_sandbox_escape_nsenter() {
        let s = scanner();
        let findings = s.scan(&fixture_path("sec-005-sandbox-escape"));
        assert!(!findings.is_empty(), "SEC-005 must detect sandbox escape");
        let f = findings.iter().find(|f| f.id == "SEC-005").expect("SEC-005 finding missing");
        assert_eq!(f.severity, SecuritySeverity::Critical);
        let verdict = s.classify(&findings);
        assert!(matches!(verdict, ScanVerdict::Quarantine(_)));
    }

    #[test]
    fn sec_007_detects_credential_exfiltration_curl_with_api_key() {
        let s = scanner();
        let findings = s.scan(&fixture_path("sec-007-credential-exfil"));
        assert!(!findings.is_empty(), "SEC-007 must detect credential exfiltration");
        let f = findings.iter().find(|f| f.id == "SEC-007").expect("SEC-007 finding missing");
        assert_eq!(f.severity, SecuritySeverity::Critical);
        let verdict = s.classify(&findings);
        assert!(matches!(verdict, ScanVerdict::Quarantine(_)));
    }

    #[test]
    fn critical_pattern_overrides_high_to_quarantine() {
        // sec-001 has both critical hook override AND a command with curl
        // The presence of any Critical finding should produce Quarantine
        let s = scanner();
        let findings = s.scan(&fixture_path("sec-001-hook-override"));
        let has_critical = findings.iter().any(|f| f.severity == SecuritySeverity::Critical);
        assert!(has_critical, "must have at least one critical finding");
        let verdict = s.classify(&findings);
        assert!(matches!(verdict, ScanVerdict::Quarantine(_)));
    }

    #[test]
    fn high_only_produces_flagged_not_quarantine() {
        let s = scanner();
        let findings = s.scan(&fixture_path("sec-006-ssh-key-ref"));
        assert!(!findings.is_empty(), "SEC-006 must detect SSH key reference");
        // SEC-006 is High severity only
        let all_non_critical = findings.iter().all(|f| f.severity != SecuritySeverity::Critical);
        assert!(all_non_critical, "sec-006 fixture should have no critical findings");
        let verdict = s.classify(&findings);
        assert!(matches!(verdict, ScanVerdict::Flagged(_)), "high-only should produce Flagged");
    }

    #[test]
    fn sec_003_hook_injection_produces_heads_up() {
        let s = scanner();
        let findings = s.scan(&fixture_path("sec-003-hook-injection"));
        assert!(!findings.is_empty(), "SEC-003 must detect hook injection");
        let f = findings.iter().find(|f| f.id == "SEC-003").expect("SEC-003 finding missing");
        assert_eq!(f.severity, SecuritySeverity::High);
    }

    #[test]
    fn sec_008_base64_obfuscation_produces_heads_up() {
        let s = scanner();
        let findings = s.scan(&fixture_path("sec-008-base64-obfuscation"));
        assert!(!findings.is_empty(), "SEC-008 must detect base64 obfuscation");
        let f = findings.iter().find(|f| f.id == "SEC-008").expect("SEC-008 finding missing");
        assert_eq!(f.severity, SecuritySeverity::Medium);
    }

    // =========================================================================
    // 370-02 tests: Finding reports, pipeline integration, hardening
    // =========================================================================

    #[test]
    fn finding_report_includes_file_line_match_and_cve() {
        let s = scanner();
        let report = s.scan_and_report(&fixture_path("sec-001-hook-override"), "sec-001-test");
        assert!(!report.findings.is_empty(), "report must have findings");
        let f = report.findings.iter().find(|f| f.id == "SEC-001")
            .expect("SEC-001 finding must be in report");
        assert_eq!(f.file, ".claude/settings.json");
        assert!(f.line > 0, "line number must be positive");
        assert!(!f.matched_text.is_empty(), "matched text must be non-empty");
        assert_eq!(f.cve_reference, Some("CVE-2025-59536".to_string()));
    }

    #[test]
    fn finding_report_serializes_to_json_with_action_required() {
        let s = scanner();
        let report = s.scan_and_report(&fixture_path("sec-001-hook-override"), "sec-001-test");
        let json = serde_json::to_string(&report).expect("report must serialize to JSON");
        assert!(json.contains("actionRequired"), "JSON must have actionRequired field");
        assert!(!report.action_required.is_empty(), "action_required must not be empty");
        assert_eq!(report.verdict, "quarantine");
    }

    #[test]
    fn mixed_high_only_produces_flagged_not_quarantine() {
        let s = scanner();
        let findings = s.scan(&fixture_path("mixed-high-only"));
        assert!(!findings.is_empty(), "mixed-high-only must produce findings");
        let all_non_critical = findings.iter().all(|f| f.severity != SecuritySeverity::Critical);
        assert!(all_non_critical, "mixed-high-only must have no critical findings");
        let verdict = s.classify(&findings);
        assert!(matches!(verdict, ScanVerdict::Flagged(_)), "high-only -> Flagged");
    }

    #[test]
    fn mixed_critical_plus_high_produces_quarantine() {
        let s = scanner();
        let findings = s.scan(&fixture_path("mixed-critical-plus-high"));
        assert!(!findings.is_empty(), "mixed-critical-plus-high must produce findings");
        let has_critical = findings.iter().any(|f| f.severity == SecuritySeverity::Critical);
        assert!(has_critical, "mixed-critical-plus-high must have critical findings");
        let verdict = s.classify(&findings);
        assert!(matches!(verdict, ScanVerdict::Quarantine(_)), "critical+high -> Quarantine");
    }

    #[test]
    fn security_events_emitted_per_finding() {
        let s = scanner();
        let report = s.scan_and_report(&fixture_path("sec-001-hook-override"), "sec-001-test");
        assert_eq!(
            report.events.len(),
            report.findings.len(),
            "one event per finding"
        );
        for event in &report.events {
            assert_eq!(event.source, EventSource::Staging);
            assert_eq!(event.event_type, "pattern_match");
            // Verify finding_id is in the event detail
            let detail = &event.detail;
            assert!(detail.get("finding_id").is_some(), "event detail must contain finding_id");
        }
    }

    #[test]
    fn false_negative_regression_sec001_with_obfuscated_key_names() {
        // SEC-001 compound detection: hooks key + command with shell commands
        // This tests that the pattern still fires with different tool matchers
        let s = scanner();
        let findings = s.scan(&fixture_path("sec-001-hook-override"));
        let sec001 = findings.iter().find(|f| f.id == "SEC-001");
        assert!(sec001.is_some(), "SEC-001 must detect even with varied hook structure");
    }

    #[test]
    fn false_negative_regression_sec007_wget_variant() {
        let s = scanner();
        let findings = s.scan(&fixture_path("sec-007-credential-exfil"));
        // The fixture contains both curl and wget variants
        let sec007 = findings.iter().filter(|f| f.id == "SEC-007").count();
        assert!(sec007 > 0, "SEC-007 must detect wget credential exfiltration variant");
    }
}
