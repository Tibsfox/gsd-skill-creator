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

---
