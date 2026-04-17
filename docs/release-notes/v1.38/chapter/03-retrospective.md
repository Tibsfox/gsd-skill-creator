# Retrospective — v1.38

## What Worked

- **OS-level sandboxing (bubblewrap/Seatbelt) is structural, not advisory.** Per-agent profiles for 4 agent types with SSH key/credential directory denial and escape prevention (nsenter/unshare/chroot/proc) means security doesn't depend on the agent following rules -- the OS enforces the boundary.
- **Zero-knowledge credential proxy with SecretString zeroize-on-drop.** API keys are injected into sandboxes through a Unix socket (mode 0600) without credential material ever entering the sandbox memory space. The agent gets authenticated access; it never sees the credentials. This defeats prompt injection that tries to extract credentials.
- **CVE-informed staging scanner with agent-proof quarantine.** 8 pattern detectors (SEC-001 through SEC-008) covering settings.json hooks, API redirect, hook injection, MCP risk, sandbox escape, SSH keys, credential exfiltration, and base64 obfuscation. The quarantine has no release mechanism in code -- that's the right design for agent-proof security.
- **Bootstrap Phase 0 ensures security infrastructure is online before Claude connects.** The 6-step boot sequence with hard-stop on verification failure means there's no window where the agent runs without security. Security is a precondition, not a service that starts alongside other services.

## What Could Be Better

- **Platform-specific sandbox implementations (bubblewrap on Linux, Seatbelt on macOS) double the testing surface.** Each platform needs its own verification. Cross-platform parity requires testing on both, not just detecting the platform and generating the config.
- **80 cross-cutting tests (17 safety-critical + 63 core/integration) is adequate but the safety-to-total ratio could be higher.** For a security-focused release, 17/80 (21%) safety-critical tests is reasonable, but the 8 CVE-informed patterns each deserve dedicated adversarial testing beyond pattern matching.

## Lessons Learned

1. **Agent security requires structural prevention, not behavioral trust.** Prompt injection can make an agent do anything the agent is capable of doing. The only reliable security is removing capabilities (sandbox) and removing secrets (credential proxy) from the agent's environment entirely.
2. **Worktree isolation creates natural security boundaries for multi-agent systems.** Per-agent git worktrees with scoped sandbox profiles mean agents can't read each other's work. INTEG gets read-only access across worktrees. This maps the security model to the git model cleanly.
3. **A 6-step boot sequence with hard-stop is better than a graceful degradation mode for security infrastructure.** If security fails to initialize, the correct response is to not start -- not to start in a degraded mode that an attacker could exploit.

---
