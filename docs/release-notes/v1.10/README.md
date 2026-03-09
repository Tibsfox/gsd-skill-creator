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

## Retrospective

### What Worked
- **16 findings across 6 security domains is a thorough audit scope.** Input validation, data integrity, information security, learning safety, access control, and operational safety cover the full attack surface of an adaptive learning system.
- **No new user features -- every change hardens existing code.** This discipline is rare and valuable. The temptation to sneak in features during a security release is strong; resisting it keeps the release focused and auditable.
- **Cumulative drift tracking with 60% threshold prevents gradual skill corruption.** Individual 20% refinements (from v1.0) compound over time. The drift tracker catches the aggregate effect that per-refinement limits don't.
- **Hook error boundaries prevent bugs from crashing Claude Code sessions.** A broken hook should log and continue, not terminate the user's session. This is the operational safety philosophy: the system should degrade gracefully.

### What Could Be Better
- **11 phases for security hardening suggests security wasn't deeply integrated during v1.0-v1.9.** A dedicated security release is necessary, but many of these protections (path traversal, YAML deserialization safety, prompt injection patterns) should have been in place earlier.
- **The dangerous bash command deny list is inherently incomplete.** Listing specific dangerous commands (recursive deletes, sudo, piped downloads) is a blocklist approach -- new dangerous patterns will need to be added as they're discovered.

## Lessons Learned

1. **Learning safety is a distinct security domain.** Traditional security (input validation, access control) protects the system from external threats. Learning safety protects the system from itself -- from accumulating contradictory feedback or drifting beyond recognition.
2. **Prompt injection defense (13 patterns) must be applied at the team message level.** Inter-agent communication is an injection vector because messages from one agent become prompts for another. The team boundary is the security boundary.
3. **SHA-256 checksums on JSONL entries give tamper detection for free.** The append-only pattern from v1.0 provides ordering; the checksums from v1.10 provide integrity. Together they form a lightweight audit log.

---
