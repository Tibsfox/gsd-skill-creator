# Lessons — v1.38

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Agent security requires structural prevention, not behavioral trust.**
   Prompt injection can make an agent do anything the agent is capable of doing. The only reliable security is removing capabilities (sandbox) and removing secrets (credential proxy) from the agent's environment entirely.
   _🤖 Status: `investigate` · lesson #203 · needs review_
   > LLM reasoning: Agent-ready static site adds discovery files, not sandbox/credential-proxy structural controls.

2. **Worktree isolation creates natural security boundaries for multi-agent systems.**
   Per-agent git worktrees with scoped sandbox profiles mean agents can't read each other's work. INTEG gets read-only access across worktrees. This maps the security model to the git model cleanly.
   _🤖 Status: `investigate` · lesson #204 · needs review_
   > LLM reasoning: Bio-physics sensing is unrelated to worktree isolation or multi-agent security boundaries.

3. **A 6-step boot sequence with hard-stop is better than a graceful degradation mode for security infrastructure.**
   If security fails to initialize, the correct response is to not start -- not to start in a degraded mode that an attacker could exploit.
---
   _⚙ Status: `applied` (applied in `v1.49.7`) · lesson #205_

4. **Platform-specific sandbox implementations (bubblewrap on Linux, Seatbelt on macOS) double the testing surface.**
   Each platform needs its own verification. Cross-platform parity requires testing on both, not just detecting the platform and generating the config.
   _🤖 Status: `applied` (applied in `v1.49.6`) · lesson #206 · needs review_
   > LLM reasoning: macOS compatibility and dependency hardening directly addresses per-platform verification beyond config generation.

5. **80 cross-cutting tests (17 safety-critical + 63 core/integration) is adequate but the safety-to-total ratio could be higher.**
   For a security-focused release, 17/80 (21%) safety-critical tests is reasonable, but the 8 CVE-informed patterns each deserve dedicated adversarial testing beyond pattern matching.
   _⚙ Status: `applied` (applied in `v1.42`) · lesson #207_
