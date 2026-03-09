# v1.38 — SSH Agent Security

**Shipped:** 2026-02-26
**Phases:** 367-374 (8 phases) | **Plans:** 16 | **Commits:** 39 | **Requirements:** 70 | **Tests:** 260 | **LOC:** ~11.3K

SSH-based agent security architecture for GSD-OS using OS-level sandboxing (bubblewrap/Seatbelt) and a credential proxy to structurally prevent credential exposure, even under successful prompt injection.

### Key Features

**Security Foundation Types (Phase 367):**
- 5 Zod schemas + 5 serde structs with TS-Rust JSON round-trip parity
- .planning/security/ directory initialization
- 52 type tests

**OS-Level Sandbox Configurator (Phase 368):**
- bubblewrap/Seatbelt platform detection
- Per-agent profiles for 4 agent types (exec/verify/scout/main)
- SSH key/credential directory denial
- Escape prevention (nsenter/unshare/chroot/proc)

**Zero-Knowledge Credential Proxy (Phase 369):**
- SecretString with zeroize-on-drop
- Unix socket server (mode 0600)
- Domain allowlist (deny-by-default)
- API key injection without credential material entering sandbox
- GNOME Keyring/macOS Keychain native credential stores

**CVE-Informed Staging Scanner (Phase 370):**
- 8 pattern detectors (SEC-001 through SEC-008)
- Covers settings.json hooks, API redirect, hook injection, MCP risk, sandbox escape, SSH key references, credential exfiltration, base64 obfuscation
- Agent-proof quarantine (no release mechanism in code)

**Per-Agent Worktree Isolation (Phase 371):**
- Git worktrees with scoped sandbox profiles
- Cross-agent read denial verified programmatically
- INTEG read-across with read-only access
- WorktreeCreate hook auto-generates sandbox profiles

**Security Dashboard (Phase 372):**
- Shield indicator visible at all 5 magic levels
- 4 shield states (secure/attention/breach-blocked/inactive)
- Critical events bypass magic filter
- Event timeline, full operations view at level 5

**Bootstrap Phase 0 (Phase 373):**
- Security infrastructure online before Claude connects
- 6-step boot sequence: SSH key check, sandbox install, profile generation, proxy start, verification, LED activation
- Hard-stop if verification fails

**E2E Integration (Phase 374):**
- SecurityState in Tauri managed state, 7 Tauri commands
- IPC event routing, TypeScript barrel
- 80 cross-cutting tests (17 safety-critical + 63 core/integration)
- Full regression clean (16,273 total tests)

## Retrospective

### What Worked
- **OS-level sandboxing (bubblewrap/Seatbelt) is structural, not advisory.** Per-agent profiles for 4 agent types with SSH key/credential directory denial and escape prevention (nsenter/unshare/chroot/proc) means security doesn't depend on the agent following rules -- the OS enforces the boundary.
- **Zero-knowledge credential proxy with SecretString zeroize-on-drop.** API keys are injected into sandboxes through a Unix socket (mode 0600) without credential material ever entering the sandbox memory space. The agent gets authenticated access; it never sees the credentials. This defeats prompt injection that tries to extract credentials.
- **CVE-informed staging scanner with agent-proof quarantine.** 8 pattern detectors (SEC-001 through SEC-008) covering settings.json hooks, API redirect, hook injection, MCP risk, sandbox escape, SSH keys, credential exfiltration, and base64 obfuscation. The quarantine has no release mechanism in code -- that's the right design for agent-proof security.
- **Bootstrap Phase 0 ensures security infrastructure is online before Claude connects.** The 6-step boot sequence with hard-stop on verification failure means there's no window where the agent runs without security. Security is a precondition, not a service that starts alongside other services.

### What Could Be Better
- **Platform-specific sandbox implementations (bubblewrap on Linux, Seatbelt on macOS) double the testing surface.** Each platform needs its own verification. Cross-platform parity requires testing on both, not just detecting the platform and generating the config.
- **80 cross-cutting tests (17 safety-critical + 63 core/integration) is adequate but the safety-to-total ratio could be higher.** For a security-focused release, 17/80 (21%) safety-critical tests is reasonable, but the 8 CVE-informed patterns each deserve dedicated adversarial testing beyond pattern matching.

## Lessons Learned

1. **Agent security requires structural prevention, not behavioral trust.** Prompt injection can make an agent do anything the agent is capable of doing. The only reliable security is removing capabilities (sandbox) and removing secrets (credential proxy) from the agent's environment entirely.
2. **Worktree isolation creates natural security boundaries for multi-agent systems.** Per-agent git worktrees with scoped sandbox profiles mean agents can't read each other's work. INTEG gets read-only access across worktrees. This maps the security model to the git model cleanly.
3. **A 6-step boot sequence with hard-stop is better than a graceful degradation mode for security infrastructure.** If security fails to initialize, the correct response is to not start -- not to start in a degraded mode that an attacker could exploit.

---
