# Security Policy

gsd-skill-creator is a local developer tool that runs on your machine as part of your Claude Code workflow. It does not expose network services, accept remote connections, or process untrusted input from external users. Its security scope is limited to protecting the local filesystem, ensuring the integrity of observation data, and preventing generated skills from containing dangerous content.

## Supported Versions

Only the latest released version of gsd-skill-creator receives security updates. If you are running an older version, please upgrade before reporting issues.

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |
| Older   | No        |

## Vulnerability Reporting

If you discover a security vulnerability in gsd-skill-creator, please report it responsibly.

**Preferred method:** Open a [GitHub Security Advisory](https://github.com/Tibsfox/gsd-skill-creator/security/advisories/new) on this repository. This allows private discussion before public disclosure.

**What to include in your report:**

- A clear description of the vulnerability
- Steps to reproduce the issue
- Your assessment of the impact (what an attacker could achieve)
- The affected version(s)
- Any suggested fix, if you have one

**Response timeline:**

- Acknowledgment within 7 days of report
- Initial assessment within 14 days
- Fix or mitigation within 30 days for confirmed vulnerabilities

**Important:** There is no bug bounty program for this project. Reports are appreciated and credited, but not compensated.

## Threat Model

gsd-skill-creator's threat model covers six security domains. Each domain addresses specific attack vectors relevant to a local skill management tool that reads user files, parses YAML frontmatter, stores observation data, generates executable skill content, and manages inheritance relationships.

### 1. Input Validation and Sanitization

**Threats addressed:**

- **Path traversal attacks** on skill and agent names. A malicious skill name containing `../`, `..\\`, `/`, `\`, or null bytes could escape the `.claude/skills/` directory and read or write arbitrary files on the local filesystem.
- **YAML deserialization attacks** via dangerous tags in skill frontmatter. Tags like `!!js/function`, `!!js/undefined`, and custom type constructors can execute arbitrary code during YAML parsing.
- **Schema bypass** where syntactically valid YAML contains unexpected types, missing fields, or extra properties that downstream code does not handle safely.
- **Prompt injection** in team inbox messages where crafted content attempts to override agent instructions, extract system prompts, or hijack agent behavior.
- **Configuration manipulation** where out-of-range configuration values (e.g., extremely low activation thresholds) degrade security posture.

**Controls implemented:**

- `validateSafeName()` and `assertSafePath()` in `src/validation/path-safety.ts` reject path traversal sequences at every entry point (create, load, delete, export) and verify resolved paths remain within expected base directories.
- `safeParseFrontmatter()` in `src/validation/yaml-safety.ts` wraps gray-matter with dangerous tag rejection. All YAML parsing flows through this function, which returns a discriminated union result type for ergonomic error handling.
- Zod schemas validate all parsed frontmatter before any field is accessed. Two-layer defense: YAML safety first, then schema validation.
- `sanitizeMessageText()` in `src/teams/message-safety.ts` detects and neutralizes 13 prompt injection patterns across three categories (role-override, instruction-hijack, prompt-extraction). `truncateMessageText()` enforces a 10,000 character default limit.
- `validateConfig()` in `src/config/config-validator.ts` checks 16 configuration fields against a registry of type, range, enum, and security constraints. The `skill-creator config validate` CLI command provides user-facing validation.

**Requirements satisfied:** VAL-01 through VAL-08 (Phases 71, 72, 76, 77)

### 2. Data Integrity and Retention

**Threats addressed:**

- **Observation tampering** where JSONL files storing session patterns are modified outside of skill-creator, potentially injecting false patterns that influence skill suggestions.
- **Data corruption** from malformed JSONL entries that silently propagate through the pattern detection pipeline.
- **Resource exhaustion** from runaway observation recording that fills disk space or degrades performance.
- **Stale data accumulation** where expired observations are never physically removed, only logically superseded.

**Controls implemented:**

- SHA-256 checksums on observation entries via `computeChecksum()`, `verifyChecksum()`, and `createChecksummedEntry()` in `src/safety/jsonl-safety.ts`. Tampered entries (modified content with mismatched checksum) are detected on read.
- Schema validation of JSONL entries via `validateJsonlEntry()` rejects malformed entries with logged warnings instead of silent corruption.
- `ObservationRateLimiter` in `src/safety/rate-limiter.ts` enforces per-session and per-hour caps on observation recording.
- `detectAnomalies()` in `src/safety/jsonl-safety.ts` flags duplicate timestamps, impossible durations, and duration mismatches.
- `JsonlCompactor` in `src/safety/jsonl-compactor.ts` physically rewrites JSONL files, removing expired entries via atomic write safety.
- `skill-creator purge` CLI command provides manual JSONL cleanup with `--dry-run`, `--max-age`, and `--patterns-dir` options.

**Requirements satisfied:** INT-01 through INT-06 (Phase 73)

### 3. Information Security

**Threats addressed:**

- **Cross-project data leakage** where the discovery scanner reads files from projects outside the intended scope.
- **Secret exposure** where API keys, tokens, passwords, or private keys found during discovery scanning are included in skill content or observation data.
- **Dangerous command generation** where generated skills contain recursive deletes, piped downloads, sudo invocations, or credential manipulation commands.
- **Over-permissive tool access** where generated skills grant broader tool access than their scope requires.

**Controls implemented:**

- `validateProjectAccess()` in `src/safety/discovery-safety.ts` enforces project allowlist/blocklist configuration for the corpus scanner. Blocklist always wins over allowlist.
- `redactSecrets()` in `src/safety/discovery-safety.ts` detects and redacts 10 named secret patterns (API keys, tokens, passwords, private keys) from all extracted user prompts. Wired into `session-parser.ts`.
- `scanForDangerousCommands()` in `src/safety/generation-safety.ts` maintains a deny list of 11 dangerous command patterns. Avoids false positives on common safe commands (e.g., `rm -rf node_modules`).
- `inferAllowedTools()` provides narrow tool subsets per candidate type, capped at 7 tools per skill.
- `sanitizeGeneratedContent()` replaces dangerous lines with HTML comment warnings.
- Discovery scanner supports `--dry-run` mode and `--allow` flags via the `discover` CLI command.

**Requirements satisfied:** SEC-01 through SEC-07 (Phase 74)

### 4. Learning Safety

**Threats addressed:**

- **Gradual skill corruption** where a series of small refinements cumulatively transforms a skill far beyond its original purpose, potentially introducing unsafe behavior.
- **Contradictory feedback** where opposing corrections ("always use X" followed by "never use X") are silently averaged rather than flagged, producing incoherent skills.
- **Opaque evolution** where skill changes happen without an audit trail, making it impossible to understand how a skill reached its current state.

**Controls implemented:**

- `DriftTracker` in `src/learning-loop/drift-tracker.ts` computes cumulative content drift from the original skill via version history and word-level diffing. A 60% total drift threshold is enforced in `RefinementEngine.applyRefinement()` with both pre-check and post-check gates.
- `ContradictionDetector` in `src/learning-loop/contradiction-detector.ts` identifies reversal contradictions in feedback corrections via normalized pair comparison.
- `skill-creator audit <skill>` CLI command displays current state, version history, cumulative drift percentage, and detected contradictions.

**Requirements satisfied:** LRN-01 through LRN-04 (Phase 75)

### 5. Access Control and Monitoring

**Threats addressed:**

- **Unexpected file modifications** where files in `.claude/skills/` or `.claude/agents/` are changed outside of skill-creator (manual edits, other tools, or malicious processes).
- **Unaudited changes** where skill and agent modifications happen without a record of when, what, and why.
- **Circular inheritance** where skill `extends` chains form cycles that cause infinite loops during resolution.
- **Deep inheritance** where excessively long inheritance chains create fragile, hard-to-understand skill behavior.
- **State corruption** from concurrent CLI operations writing to the same files simultaneously.
- **Resource abuse** from expensive operations (discovery, corpus scanning) being run in rapid succession.

**Controls implemented:**

- `IntegrityMonitor` in `src/safety/integrity-monitor.ts` maintains SHA-256 snapshots of skill and agent directories. The check cycle detects modifications not recorded in the audit log.
- `AuditLogger` in `src/safety/audit-logger.ts` provides append-only JSONL logging with Zod validation on read, timestamp and operation filters, and a 24-hour audit window.
- `InheritanceValidator` in `src/validation/inheritance-validator.ts` detects circular dependencies and enforces a depth limit of 3 levels. Impact warnings are generated when modifying widely-depended-on skills.
- `DependencyGraph` in `src/core/dependency-graph.ts` provides `getDependents()`, `getDepth()`, and `getAllDependents()` for transitive impact analysis.
- `skill-creator impact <skill>` CLI command shows direct and transitive dependents with human and JSON output modes.
- `FileLock` in `src/safety/file-lock.ts` uses `O_EXCL` atomic file creation with PID tracking and stale lock cleanup to prevent concurrent corruption.
- `OperationCooldown` in `src/safety/operation-cooldown.ts` enforces configurable per-operation cooldown periods with atomic state persistence.

**Requirements satisfied:** ACL-01 through ACL-08 (Phases 78, 79)

### 6. Operational Hardening

**Threats addressed:**

- **Session crashes** caused by bugs in observation hooks that propagate uncaught exceptions into the Claude Code runtime.
- **Unsafe hooks** that modify environment variables, call `process.exit()`, use `eval()` or `Function()` constructors, or mutate global state.
- **Accidental destructive operations** where orchestrator commands like `execute-phase` or `complete-milestone` run without user confirmation.
- **Unauditable routing** where the orchestrator's intent classification decisions cannot be reviewed after the fact.

**Controls implemented:**

- `withErrorBoundary()` in `src/orchestrator/hook-error-boundary.ts` wraps async hooks with catch-all error handling and `Promise.race` timeout protection. Hooks never re-throw -- errors are caught, logged, and the session continues.
- `validateHook()` in `src/orchestrator/hook-validator.ts` rejects hooks containing `process.env` mutation, `process.exit`, `eval`, `Function` constructor, and global state modification patterns.
- `evaluateConfirmationGate()` in `src/orchestrator/confirmation-gate.ts` adds mode-aware confirmation for destructive operations. In YOLO mode, gates are bypassed; in standard mode, user confirmation is required.
- `ClassificationLogger` in `src/orchestrator/classification-logger.ts` provides JSONL audit trail for all intent classifications, including confidence scores and selected commands.

**Requirements satisfied:** DOC-03 through DOC-06 (Phase 80)

## Security Boundaries

### In Scope

The following areas are within gsd-skill-creator's security responsibility:

- **Local filesystem operations:** All file reads and writes use sanitized paths. Skill and agent names are validated against traversal attacks. Resolved paths are verified against expected base directories.
- **Skill and agent content safety:** Generated content is scanned for dangerous commands. Allowed-tools restrictions are enforced. Prompt injection patterns in team messages are sanitized.
- **Observation data integrity:** JSONL entries are checksummed, schema-validated, and rate-limited. Compaction and purge provide data lifecycle management.
- **Learning loop bounds:** Cumulative drift tracking prevents gradual corruption. Contradictory feedback is flagged. All refinements require user confirmation.
- **Operational safety:** Hooks cannot crash sessions. Concurrent operations are locked. Expensive operations have cooldowns.

### Out of Scope

The following areas are explicitly outside gsd-skill-creator's security scope:

| Area | Reason |
|------|--------|
| Network security (TLS, auth tokens) | MCP server runs locally on stdio; no network exposure |
| Authentication and RBAC | Single-user local tool; filesystem permissions are sufficient |
| Runtime sandboxing of skill execution | Delegated to Claude Code's built-in permission model |
| Encrypted storage at rest | Not applicable to a local development tool |
| Automated vulnerability patching | `npm audit` flags issues; human decides remediation |

## Dependencies

This project uses `npm audit` in its CI pipeline to detect known vulnerabilities in dependencies. The CI build fails when HIGH or CRITICAL level vulnerabilities are found in the dependency tree.

To check the current dependency status locally:

```bash
npm audit
```

To see only high-severity issues:

```bash
npm audit --audit-level=high
```

Refer to `package.json` for the current dependency list. Direct dependencies include gray-matter (YAML parsing), zod (schema validation), diff (content comparison), and picocolors (CLI output), among others.
