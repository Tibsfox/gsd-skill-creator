use regex::Regex;
use serde::{Deserialize, Serialize};
use std::path::Path;

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
    /// Check if a file exists at this relative path
    FileExists(String),
    /// Check if a specific file contains a regex match
    FileContains { path: String, pattern: Regex },
    /// Check if any file in the tree contains a regex match
    AnyFileContains(Regex),
    /// Check for a command pattern (alias for AnyFileContains in practice)
    CommandPattern(Regex),
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
    /// No security issues found -- content is safe to proceed
    Clean,
    /// Advisory findings (High/Medium only) -- content may proceed with warnings
    Flagged(Vec<SecurityFinding>),
    /// Critical findings detected -- content MUST NOT proceed
    /// NOTE: No release/unlock/approve method exists on this variant.
    /// Content can only be released by user action via dashboard or CLI.
    Quarantine(Vec<SecurityFinding>),
}

/// The security scanner with compiled CVE-informed pattern detectors.
pub struct SecurityScanner {
    patterns: Vec<SecurityPattern>,
}

impl SecurityScanner {
    /// Construct a new SecurityScanner with all 8 CVE-informed patterns.
    pub fn new() -> Self {
        todo!("implement in Task 2 (GREEN phase)")
    }

    /// Scan a content directory for security pattern matches.
    pub fn scan(&self, _content_root: &Path) -> Vec<SecurityFinding> {
        todo!("implement in Task 2 (GREEN phase)")
    }

    /// Classify findings into a verdict.
    pub fn classify(&self, _findings: &[SecurityFinding]) -> ScanVerdict {
        todo!("implement in Task 2 (GREEN phase)")
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
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
}
