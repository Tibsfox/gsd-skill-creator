# Chain Link: v1.38 Security Hardening

**Chain position:** 41 of 50
**Milestone:** v1.50.54
**Type:** REVIEW
**Score:** 4.56/5.0

---

## Score Trend

```
Pos  Ver      Score  Δ      Commits  Files
 34  v1.30    4.50   +0.06       51    35
 35  v1.31    4.41   -0.09       31   103
 36  v1.32    4.53   +0.12       46    64
 37  v1.33    4.28   -0.25       64   138
 38  v1.34    3.94   -0.34       16   124
 39  v1.35    4.50   +0.56       81   107
 40  v1.36+37 4.44   -0.06       53   115
 41  v1.38    4.56   +0.12       39    69
rolling: 4.410 | chain: 4.283 | floor: 3.32 | ceiling: 4.56
```

## What Was Built

A comprehensive security hardening layer spanning 8 phases (367-374) across Rust + TypeScript + Bash. The system implements defense in depth: cross-language type parity, OS-level sandboxing, credential proxy isolation, security scanning, agent isolation via git worktrees, Phase 0 bootstrap orchestration, dashboard visualization, and Tauri IPC integration. 39 commits, 69 files, +11311 lines.

### Cross-Language Type System (Phase 367, 5 commits)

- **Rust serde types (types.rs, 318 lines):** 7 enums (`EventSeverity`, `EventSource`, `AgentType`, `CredentialType`, `CredentialSource`, `SecurityStatus`, `ShieldState`) and 7 structs (`DomainCredential`, `Filesystem`, `Network`, `SandboxProfile`, `SecurityEvent`, `ProxyConfig`, `AgentIsolationState`). Serde rename attributes ensure JSON field name parity with TypeScript.
- **TypeScript Zod schemas (security.ts):** Mirror schemas with runtime validation. `ProxyConfigSchema` enforces `log_credentials: false` via Zod refinement, matching the Rust custom deserializer.
- **Cross-language verification (refactor commit):** JSON parity test infrastructure confirming Rust serialization matches TypeScript schema expectations.
- **Security invariant: ProxyConfig.log_credentials** — Custom `Deserialize` implementation on the Rust side ignores any input value and always produces `false`. The TypeScript Zod schema independently rejects `true`. Defense in depth: even if one layer is bypassed, the other enforces the invariant.

### Sandbox Configurator (Phase 368, 4 commits)

- **Platform detection (sandbox.rs):** `detect_platform()` returns `SandboxPlatform::Linux` (bubblewrap path + version), `MacOS` (sandbox-exec availability check), or `Unsupported`. Per-distro install guidance via `MissingDependency`.
- **Profile generation:** Per-agent-type sandbox profiles — EXEC (worktree-only write, proxied network), VERIFY (read-only, no network), SCOUT (research write, expanded domains), MAIN (project-wide, deny credential directories).
- **Escape hardening:** `--die-with-parent`, `--cap-drop ALL`, `--unshare-pid`, PID namespace isolation. No `nsenter`, `unshare`, or `chroot` possible inside sandbox.
- **Verification script (verify-sandbox.sh):** 5 verification tests run INSIDE the sandbox: SSH key inaccessibility, write containment, network blocking, proxy connectivity (warning-only), nsenter escape prevention.

### Credential Proxy (Phase 369, 4 commits)

- **SecretString (proxy.rs):** Zero-on-drop credential wrapper using `zeroize` crate. No `Display` impl, no `Clone`. `expose()` is `pub(crate)` only — key material never leaves the process boundary through any public API.
- **CredentialProxy core:** Domain allowlist (deny-by-default, exact match only), credential injection via header manipulation without returning values, socket path with mode 0600.
- **ProxyServer (proxy_server.rs):** Async concurrent request handling via `Arc<RwLock<CredentialProxy>>`. Each request acquires a read lock — no write contention between agents. Credential-free logging: `LogEntry` struct deliberately omits authorization, x-api-key, cookie, and body fields.
- **Health endpoint:** `ProxyHealthStatus` with uptime, request counts, blocked counts, active domains. No credential information in health responses.
- **Response header stripping:** Auth-related headers stripped from responses before returning to agents.

### Security Scanner (Phase 370, 4 commits)

- **8 CVE-informed pattern detectors:** SEC-001 (hook override, CVE-2025-59536), SEC-002 (ANTHROPIC_BASE_URL redirect, CVE-2026-21852), SEC-003 (hook injection via curl/wget/nc), SEC-004 (MCP server risk), SEC-005 (sandbox escape via nsenter/unshare/chroot), SEC-006 (SSH key reference), SEC-007 (credential exfiltration), SEC-008 (base64 obfuscation).
- **Three-verdict system:** `Clean` (proceed), `Flagged` (advisory warnings, proceed), `Quarantine` (halt, user-only release). Critical invariant: `ScanVerdict::Quarantine` carries NO release mechanism. No Tauri command, IPC event, or agent action can programmatically release quarantine.
- **Scanner isolation:** Runs outside the agent sandbox (needs pre-sandbox read access). Never executes, evaluates, or interprets content — read-only pattern matching.
- **Finding reports:** Full `SecurityFindingReport` with timestamp, findings, verdict, and pipeline integration events.
- **Test fixtures:** 10 fixture directories with realistic attack patterns for each SEC pattern, plus a clean baseline.

### Agent Isolation Manager (Phase 371, 4 commits)

- **AgentIsolationManager (agent_isolation.rs, 500 lines):** Per-agent git worktree creation via `git worktree add`. Private `.planning/` subtree per agent (inbox, outbox, observations) as message bus. Shared `.agents/shared/` directory for cross-agent results.
- **create_agent:** Generates sequential IDs (exec-001, exec-002), creates worktree, creates .planning subtree, generates scoped sandbox profile, writes `.sandbox-profile.json` to worktree root, emits SecurityEvent.
- **destroy_agent:** Copies outbox to shared results, `git worktree remove --force` (with fs fallback), removes from active agents, emits event.
- **verify_isolation:** Cross-checks that neither agent's `write_dirs` contains the other's worktree path. Returns false for unknown agents (fail-closed).
- **INTEG (Main) agent:** Gets write access to project root plus all active agent worktree paths. This is the only agent type that can read across worktrees — correct for integration testing.
- **Worktree hook handling:** `WorktreeCreate` generates profile, `WorktreeRemove` cleans up, `TaskCompleted` copies outbox to shared results.

### Security Dashboard (Phase 372, 4 commits)

- **Shield indicator (SecurityPanel.ts, 356 lines):** 4 shield states (secure/attention/breach-blocked/inactive) with CSS class mapping. ALWAYS renders at all magic levels — never hidden. Magic level controls detail: L1 = icon only, L2 = icon + status, L3+ = icon + status + sandbox/proxy indicators.
- **Critical event bypass:** `shouldBypassMagicFilter()` — blocked and critical events update the shield regardless of magic level setting.
- **Shield pulse animation:** CSS class applied on state transitions for visual feedback.
- **Full operations view (magic level 5):** Event stream, sandbox profiles, proxy logs, quarantine contents. Progressive disclosure through magic levels.
- **Blocked request log:** Severity-colored entries with domain, agent ID, reason, timestamp.
- **Agent isolation status panel:** Per-agent display with worktree path and isolation state.
- **Proxy health display:** Status, uptime, request metrics, blocked count, active domains, latency.
- **10 IPC event constants:** `SECURITY_IPC_EVENTS` covering sandbox, escape, proxy, quarantine, and agent lifecycle events.

### Phase 0 Bootstrap (Phase 373, 4 commits)

- **bootstrap-phase0.sh (313 lines):** 6-step security activation sequence running BEFORE Claude Code connects:
  1. Platform detection + dependency checks (bubblewrap on Linux, Seatbelt on macOS)
  2. SSH key verification with ed25519 generation offer
  3. Sandbox profile generation via external script
  4. Credential proxy startup with domain allowlist initialization and health check loop (10 retries * 0.5s)
  5. Sandbox activation with verification — NO BYPASS on failure (`exit 1`)
  6. Security LED status.json + IPC event emission
- **Helper functions (phase0-helpers.sh):** `phase0_log`, `phase0_warn`, `phase0_error` all respect magic level. `phase0_prompt` auto-accepts at level 1. `check_command` provides per-distro install guidance (apt/dnf/brew).
- **LED/magic output hardening:** Summary output scales with magic level (1=silent through 5=full diagnostic).
- **Remote Control support:** SSH agent forwarding detection and socket verification for remote sessions.

### TypeScript Barrel + Tauri Integration (Phase 374, 6 commits)

- **Security barrel (src/security/index.ts):** Single import point consolidating types, schemas, dashboard components, and IPC constants. Clean re-exports from `types/security.ts` and `components/SecurityPanel.ts`.
- **IPC event constants:** Backend-emitted events (`SHIELD_UPDATE`, `BREACH_BLOCKED`, `AGENT_CREATED`, `AGENT_DESTROYED`) separate from panel-consumed events.
- **Tauri command constants:** `SECURITY_COMMANDS` with 7 named commands for frontend `invoke()` calls.
- **SecurityState:** Tauri managed state with `Mutex<SecurityState>` — proxy status, sandbox verification, active agents map, recent events ring buffer (100 capacity).
- **7 Tauri commands (commands/security.rs):** `security_get_status`, `security_release_quarantine`, `sandbox_verify_full`, `proxy_health`, `agent_create`, `agent_destroy`, `agent_verify_isolation`. All async, all use `Mutex<SecurityState>`.
- **emit_critical_security_event:** Internal helper (not a Tauri command) that emits `breach-blocked` IPC event and updates shield state. Critical events bypass the magic filter on the frontend.
- **80 security tests across 10 test files:** 133 total test cases covering type schemas, filesystem operations, agent isolation, bootstrap, dashboard rendering, integration flows, proxy behavior, safety-critical invariants, sandbox enforcement, and staging scanner patterns.

## Dimension Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Architecture | 4.5 | Defense in depth across 4 languages (Rust, TypeScript, Bash, GLSL-adjacent CSS). Clear separation: scanner runs outside sandbox, proxy runs outside sandbox, agents run inside sandbox. Tauri IPC bridges Rust backend to TS frontend cleanly |
| Code Quality | 4.5 | SecretString with zeroize is textbook credential handling. Custom deserializer enforcing log_credentials=false is defense in depth. ProxyServer read-lock concurrency prevents contention. Scanner never executes content. Quarantine has no release mechanism by construction |
| Testing | 4.5 | 133 test cases across 10 files. Safety-critical tests (SC-01..SC-14) actually run inside bwrap sandboxes to verify real isolation. Fixture-based scanner tests with 10 attack pattern directories. TDD commit pattern (16 test-first commits). Platform-aware skipIf for bwrap tests |
| Documentation | 4.0 | Exhaustive doc comments on all Rust types explaining security invariants. SecurityPanel types have JSDoc. Security scanner has CVE references. Bootstrap script has step-by-step comments with BST- references. No standalone security architecture document |
| Integration | 4.5 | Full stack wiring: Rust types serialize → Tauri IPC → TypeScript Zod validates → Dashboard renders. Bootstrap script orchestrates 6 subsystems. SecurityState managed state bridges all 7 commands. IPC events flow from backend to frontend panel |
| P6 Composition | 4.5 | 8-phase layered security pipeline: types → sandbox → proxy → scanner → isolation → dashboard → bootstrap → integration. Each phase builds on types from the prior phase. Phase 0 bootstrap composes all subsystems into a single activation sequence |
| P7 Security | 5.0 | The standout dimension. SecretString zeroes memory. Deny-by-default allowlists. Quarantine is irrevocable by agents. Sandbox verification with no bypass. Die-with-parent prevents orphan processes. Credential-free logging by construction (not by configuration). Cross-language invariant enforcement. 8 CVE-informed detection patterns |
| P11 Forward-only | 5.0 | 0 fix commits across 39 total. Every commit is test() or feat() or chore(). Clean TDD: 16 test commits establish contracts, 19 feat commits implement them, 2 refactor commits harden invariants, 2 chore commits |

**Combined: 4.56/5.0**

## Key Technical Details

**Defense in Depth — ProxyConfig.log_credentials:** This single boolean demonstrates the security philosophy. On the Rust side, a custom `Deserialize` implementation ignores any input value and forces `false`. On the TypeScript side, the Zod schema independently rejects `true`. On the proxy server side, the `LogEntry` struct doesn't even have credential fields — it's structurally impossible to log credentials. Three independent layers, any one of which is sufficient.

**SecretString Design:** No `Display`, no `Clone`, `expose()` is `pub(crate)` only. The `Drop` implementation calls `zeroize()` to overwrite the heap allocation. This is the correct pattern from the `secrecy`/`zeroize` ecosystem. The proxy never returns credential values through any public method — injection happens by writing directly into request headers within the crate boundary.

**Quarantine Irrevocability:** `ScanVerdict::Quarantine` is a Rust enum variant with no associated methods for release. The only release path is the `security_release_quarantine` Tauri command, which is callable only from the desktop frontend (agents cannot invoke Tauri commands). This is security by construction, not by policy.

**Phase 0 Sequencing:** The bootstrap runs BEFORE Claude Code connects. Step 0.5 (sandbox verification) has NO BYPASS — `exit 1` on failure. This is correct: a failed sandbox means agents would run uncontained. The 6-step sequence ensures each security layer is active and verified before any agent process starts.

**Sandbox Verification Inside the Sandbox:** The verify-sandbox.sh script runs INSIDE bwrap to confirm isolation properties are actually enforced. The safety-critical tests (SC-01, SC-02, SC-06, SC-07) also run inside real bwrap sandboxes using `describe.skipIf(!hasBwrap)`. This tests the actual enforcement, not just the configuration.

## Pattern Observations

**P7 security (NEW CEILING)** — This is the strongest security implementation in the chain. Defense in depth at every layer: type system prevents misuse (SecretString), construction prevents bypass (Quarantine), sequencing prevents gaps (Phase 0), verification confirms enforcement (in-sandbox tests). The 8 CVE-informed patterns show real-world threat awareness, not theoretical security.

**P6 composition** — The 8-phase layered architecture mirrors the OS trilogy's process management pipeline but applied to security. Each phase builds on the prior: types enable sandbox profiles, sandbox profiles enable isolation, isolation enables proxy routing, scanner gates content before it enters the pipeline. Phase 0 bootstrap is the composition point that activates all layers in sequence.

**P11 forward-only** — Perfect 0/39 fix ratio continues the trend from v1.36+37 (0/53). This is the 5th consecutive version with 0 fix commits. TDD discipline is clearly embedded in the development process.

**Cross-language parity** — Rust serde types match TypeScript Zod schemas with JSON as the interchange format. The cross-language verification test infrastructure confirms parity. This is critical for Tauri IPC correctness — type mismatches between backend and frontend would silently corrupt security state.

**New ceiling established:** 4.56 edges past the previous ceiling of 4.55 (Muse BUILD at chain position 24). The security domain naturally scores higher because it has a dedicated dimension (P7) that consistently hits 5.0, and the defense-in-depth architecture rewards both P6 composition and code quality.

## Chain Context

Position 41 is 82% through the 50-link chain. The score (4.56) sets a new ceiling, narrowly surpassing 4.55 (Muse BUILD). Rolling average rises to 4.410 from 4.380. Chain average rises to 4.283.

The security hardening version represents the project operationalizing the OS trilogy's concepts (I/O, Memory, Process from positions 30-32) into actual security infrastructure. Where the hypervisor defined process lifecycle, v1.38 implements the containment, isolation, and verification that makes multi-agent execution safe. This is the "kernel security module" to the hypervisor's "process scheduler."

---

*Reviewed at chain position 41/50. v1.38: 39 commits, 69 files, +11311 lines.*
