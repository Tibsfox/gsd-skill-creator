# v1.10 — Security Hardening

**Shipped:** 2026-02-12
**Phases:** 71-81 (11 phases) | **Plans:** 24 | **Requirements:** 39

Addressed all 16 findings from a comprehensive security audit across 6 security domains. No new user features -- every change hardens existing code.

### Security Domains

**1. Input Validation (Phases 71-72):**
- Path traversal prevention with `validateSafeName` + `assertSafePath` wired into SkillStore, AgentGenerator, TeamStore
- YAML safe deserialization rejecting dangerous tags (`!!js/function`, etc.) with Zod schema validation at all read sites

**2. Data Integrity (Phase 73):**
- SHA-256 checksums on JSONL entries for tamper detection
- Schema validation, rate limiting, anomaly detection
- Periodic compaction and `skill-creator purge` CLI command

**3. Information Security (Phase 74):**
- Secret redaction (API keys, tokens, passwords)
- Project allowlist/blocklist for cross-project scanning
- Structural-only results (never raw conversation content)
- Dangerous bash command deny list (recursive deletes, sudo, piped downloads)

**4. Learning Safety (Phase 75):**
- Cumulative drift tracking with 60% threshold
- Contradictory feedback detection and flagging
- `skill-creator audit <skill>` shows diff between original and current state

**5. Access Control (Phases 76-79):**
- Team message sanitization against 13 prompt injection patterns
- Config range validation with security-aware field registry
- Inheritance chain validation (depth limits, circular dependency detection)
- File integrity monitoring, audit logging, concurrency locks, operation cooldowns

**6. Operational Safety (Phases 80-81):**
- Hook error boundaries (bugs don't crash Claude Code sessions)
- Orchestrator confirmation gates for destructive operations
- Classification audit logging for auditability
- SECURITY.md with threat model and GitHub Actions CI with `npm audit`

---
