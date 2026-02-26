//! Hygiene Checker -- Content safety scanner for staging intake.
//!
//! # Safety Invariants
//!
//! - The checker is READ-ONLY: it inspects content but NEVER executes, evaluates,
//!   or interprets it. No eval, no shell expansion, no dynamic loading.
//!
//! - Public API surface is exactly two methods: `check(&str)` and `check_file(&Path)`.
//!   No methods exist that execute, run, or interpret content.
//!
//! - Quarantine-worthy findings: YAML code execution tags, path traversal patterns.
//! - Advisory-only findings: embedded instruction patterns (prompt injection attempts).

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

// ============================================================================
// Types
// ============================================================================

/// Hygiene status after content inspection.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum HygieneStatus {
    /// Content is clean -- no hygiene issues detected.
    Clean,
    /// Advisory issues found -- content may proceed with warnings.
    Advisory { issues: Vec<String> },
    /// Content must be quarantined -- dangerous patterns detected.
    Quarantine { reason: String, detail: String },
}

// ============================================================================
// HygieneChecker
// ============================================================================

/// Content hygiene checker with compiled regex patterns.
///
/// Scans content for:
/// - YAML code execution tags (!!python/object, !!ruby/object, !!js/function, etc.)
/// - Path traversal patterns (../, ..\, URL-encoded variants)
/// - Embedded instruction patterns (prompt injection attempts)
///
/// SAFETY: This struct has exactly TWO public methods: `check` and `check_file`.
/// No methods exist that execute, evaluate, run, or interpret content.
pub struct HygieneChecker {
    yaml_exec_re: Regex,
    path_traversal_re: Regex,
    embedded_instr_re: Regex,
}

impl HygieneChecker {
    /// Construct a new HygieneChecker with compiled regex patterns.
    pub fn new() -> Self {
        HygieneChecker {
            // YAML code execution tags that allow arbitrary code execution
            yaml_exec_re: Regex::new(r"!!(python|ruby|js|perl|lua|java)/").unwrap(),
            // Path traversal: ../, ..\, URL-encoded variants
            path_traversal_re: Regex::new(r"(?:\.\./|\.\.\\|\.\.%2[fF]|\.\.%5[cC])").unwrap(),
            // Prompt injection patterns (advisory only, not quarantine)
            embedded_instr_re: Regex::new(
                r"(?i)(ignore\s+(?:previous|all|prior)\s+instructions|your\s+system\s+prompt|you\s+are\s+now|disregard\s+(?:all|your)\s+(?:previous\s+)?instructions)",
            )
            .unwrap(),
        }
    }

    /// Check content string for hygiene issues.
    ///
    /// Priority: Quarantine > Advisory > Clean.
    /// - YAML code execution tags -> Quarantine
    /// - Path traversal patterns -> Quarantine
    /// - Embedded instructions -> Advisory (NOT quarantine)
    /// - Nothing found -> Clean
    pub fn check(&self, content: &str) -> HygieneStatus {
        // 1. Check YAML code execution FIRST -- quarantine-worthy
        if let Some(m) = self.yaml_exec_re.find(content) {
            return HygieneStatus::Quarantine {
                reason: "YAML code execution tag detected".to_string(),
                detail: m.as_str().to_string(),
            };
        }

        // 2. Check path traversal -- quarantine-worthy
        if let Some(m) = self.path_traversal_re.find(content) {
            return HygieneStatus::Quarantine {
                reason: "path traversal pattern detected".to_string(),
                detail: m.as_str().to_string(),
            };
        }

        // 3. Check embedded instructions -- advisory only
        if let Some(m) = self.embedded_instr_re.find(content) {
            return HygieneStatus::Advisory {
                issues: vec![format!("Embedded instruction detected: {}", m.as_str())],
            };
        }

        // 4. Nothing found
        HygieneStatus::Clean
    }

    /// Check a file for hygiene issues.
    ///
    /// Reads the file content and delegates to `check()`.
    /// If the file cannot be read (e.g., binary file), returns `Clean`
    /// since binary files are not text-scannable.
    pub fn check_file(&self, path: &Path) -> HygieneStatus {
        match fs::read_to_string(path) {
            Ok(content) => self.check(&content),
            Err(_) => HygieneStatus::Clean, // Binary files are not text-scannable
        }
    }
}
