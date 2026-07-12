//! v1.49.636 C1 — Panic-hook redaction for keystore-adjacent logging.
//!
//! Registered once at `lib.rs::run` via `panic_hook::install()`. The hook
//! captures the panic message, redacts known secret-bearing patterns
//! (`passphrase=`, `secret=`, base64-like blobs ≥32 chars), and writes
//! the redacted form to stderr.
//!
//! Tauri's own command-panic catcher independently returns a generic
//! "command panicked" string to the desktop; this hook addresses ONLY
//! the LOGGED panic text. See `.planning/c1-tauri-wiring-design.md` §3.c.

use regex::Regex;
use std::sync::OnceLock;

static REDACT_PATTERNS: OnceLock<Vec<Regex>> = OnceLock::new();

fn redact_patterns() -> &'static [Regex] {
    REDACT_PATTERNS.get_or_init(|| {
        vec![
            // key=value-style secrets (case-insensitive on the key).
            Regex::new(r"(?i)(passphrase|password|secret|api[_-]?key|token)\s*[=:]\s*\S+")
                .expect("compile passphrase-key regex"),
            // Bare base64-like blobs of >= 32 chars. Conservative — may
            // redact legitimate hashes/paths but the log site is panic-
            // adjacent so over-redaction is safer than leak.
            Regex::new(r"[A-Za-z0-9+/=]{32,}").expect("compile base64-blob regex"),
        ]
    })
}

/// Redact secret-bearing substrings from a panic message.
pub fn redact_panic_message(msg: &str) -> String {
    let mut out = msg.to_string();
    for re in redact_patterns() {
        out = re.replace_all(&out, "<redacted>").into_owned();
    }
    out
}

/// Install the global panic hook. Idempotent — calling multiple times
/// replaces the prior hook. Production callers invoke once at
/// `lib.rs::run`.
pub fn install() {
    std::panic::set_hook(Box::new(|info| {
        let msg = info
            .payload()
            .downcast_ref::<&str>()
            .map(|s| (*s).to_string())
            .or_else(|| info.payload().downcast_ref::<String>().cloned())
            .unwrap_or_else(|| "panic with non-string payload".to_string());

        let location = info
            .location()
            .map(|l| format!("{}:{}", l.file(), l.line()))
            .unwrap_or_else(|| "<unknown location>".to_string());

        eprintln!(
            "[panic redacted] at {}: {}",
            location,
            redact_panic_message(&msg)
        );
    }));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redact_passphrase_key_value_form() {
        let input = "failed: passphrase=hunter2 boom";
        let out = redact_panic_message(input);
        assert!(!out.contains("hunter2"), "passphrase value leaked: {}", out);
        assert!(
            out.contains("<redacted>"),
            "expected redaction marker: {}",
            out
        );
    }

    #[test]
    fn redact_uppercase_secret_key_value_form() {
        let input = "ERROR: SECRET: aZbXc9YbX1cZbXc9YbX1 done";
        let out = redact_panic_message(input);
        assert!(
            !out.contains("aZbXc9YbX1cZbXc9YbX1"),
            "secret leaked: {}",
            out
        );
    }

    #[test]
    fn redact_base64_like_blob() {
        let blob = "QUJDRA==QUJDRA==QUJDRA==QUJDRA==QUJDRA==";
        let input = format!("rust panic dump: {}", blob);
        let out = redact_panic_message(&input);
        assert!(!out.contains(blob), "blob leaked: {}", out);
    }

    #[test]
    fn redact_leaves_short_alphanumeric_intact() {
        let input = "panic at line 12: foo bar baz";
        let out = redact_panic_message(input);
        assert_eq!(out, input, "short content should not be redacted: {}", out);
    }

    #[test]
    fn install_does_not_panic() {
        // Sanity — registering the hook should not itself panic. We do
        // NOT call panic!() here to trigger the hook because the hook
        // replaces the default panic-print and would deadlock the test
        // runner; the redaction unit tests above exercise the redactor.
        super::install();
    }
}
