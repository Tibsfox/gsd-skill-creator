# Lessons — v1.10

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Learning safety is a distinct security domain.**
   Traditional security (input validation, access control) protects the system from external threats. Learning safety protects the system from itself -- from accumulating contradictory feedback or drifting beyond recognition.
   _🤖 Status: `investigate` · lesson #49 · needs review_
   > LLM reasoning: Complex Plane Learning Framework snippet is too vague to confirm it addresses learning-safety as a distinct security domain.

2. **Prompt injection defense (13 patterns) must be applied at the team message level.**
   Inter-agent communication is an injection vector because messages from one agent become prompts for another. The team boundary is the security boundary.
   _🤖 Status: `investigate` · lesson #50 · needs review_
   > LLM reasoning: GSD-OS Bootstrap & READY Prompt snippet doesn't clearly address team-message-level injection defense.

3. **SHA-256 checksums on JSONL entries give tamper detection for free.**
   The append-only pattern from v1.0 provides ordering; the checksums from v1.10 provide integrity. Together they form a lightweight audit log.
---
   _🤖 Status: `investigate` · lesson #51 · needs review_
   > LLM reasoning: PyDMD dogfood content is unrelated to JSONL checksum audit logging.

4. **11 phases for security hardening suggests security wasn't deeply integrated during v1.0-v1.9.**
   A dedicated security release is necessary, but many of these protections (path traversal, YAML deserialization safety, prompt injection patterns) should have been in place earlier.
   _🤖 Status: `applied` (applied in `v1.24`) · lesson #52 · needs review_
   > LLM reasoning: GSD Conformance Audit & Hardening is a direct follow-on hardening pass addressing the integration-gap lesson.

5. **The dangerous bash command deny list is inherently incomplete.**
   Listing specific dangerous commands (recursive deletes, sudo, piped downloads) is a blocklist approach -- new dangerous patterns will need to be added as they're discovered.
   _🤖 Status: `investigate` · lesson #53 · needs review_
   > LLM reasoning: v1.42 git workflow skill doesn't address bash deny list completeness.
