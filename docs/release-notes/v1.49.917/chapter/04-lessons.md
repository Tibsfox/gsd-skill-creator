# v1.49.917 — Lessons

## Lesson #10462 — Describe the pattern, never quote the literal

**Context.** The release-history publisher runs a hard leak-scan over every published chapter. Its effective patterns combine committed base patterns with operator-private patterns loaded from a gitignored local file, so the scan is operator-machine-specific: a fresh CI checkout sees only the base patterns. Two failure modes recur whenever leak-scan or security-hardening work is *documented*:

1. **The control's own documentation re-trips it.** A retrospective that quotes a scan *pattern* verbatim matches that pattern and is hard-blocked, even though it contains no real secret.
2. **The recursion trap.** Documenting the fix for (1) by enumerating the private *values* the control guards embeds those values into published content — a genuine leak the scanner correctly blocks.

**Rule.** Describe the pattern, never quote the literal. Refer to a pattern by name or shape ("the base private-path pattern", "the credential-var form") — never paste the regex source, never paste the private value.

**Allowlist-vs-scrub decision rule.**
- The doc legitimately quotes a *pattern* (for self-referential documentation) → add a narrow allowlist entry keyed on the exact version + file + pattern, with a reason. Never widen to a global pattern exemption.
- The content embeds a genuinely-private *value* → scrub the value. Never allowlist a secret into published output; the allowlist is for pattern-quoting docs only.

**Cross-refs.** Pairs the loud surface (the leak-scan gate, #10427 silent-vs-loud) with the authoring discipline that keeps it from firing on its own documentation; sibling of #10461 (gate-enforce every runnable surface + drift-guard). Home: the security-hygiene skill.
