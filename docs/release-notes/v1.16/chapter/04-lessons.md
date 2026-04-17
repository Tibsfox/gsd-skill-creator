# Lessons — v1.16

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Message bus over direct coupling.**
   The inbox/outbox filesystem pattern decouples the browser dashboard from GSD execution completely. Either side can be replaced without touching the other -- a design that pays dividends in later releases.
   _⚙ Status: `investigate` · lesson #84_

2. **Audit logging should be default for write operations.**
   JSONL audit logging of all writes through the HTTP helper is low-cost insurance. This becomes the pattern for every subsequent write path in the system.
   _🤖 Status: `investigate` · lesson #85 · needs review_
   > LLM reasoning: v1.45 static site generator is unrelated to write-path audit logging patterns.

3. **Configuration forms need structured schemas.**
   The 7-section milestone configuration form with Zod validation means malformed input is caught at the boundary, not downstream in execution.
---
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #86_

4. **275 tests across 18 files is lean for 6 phases.**
   Given the security surface (path traversal prevention, write bridge), the HTTP helper endpoint especially could use deeper adversarial testing.
   _🤖 Status: `applied` (applied in `v1.42`) · lesson #87 · needs review_
   > LLM reasoning: v1.42 adds @vitest/coverage-v8 coverage reporting, directly addressing test-depth gap.

5. **Bidirectional control surface adds operational complexity.**
   The dashboard was read-only before; now it writes to the filesystem. The security boundary (path traversal prevention, subdirectory allowlist) is correct, but the attack surface expanded significantly in one release.
   _⚙ Status: `investigate` · lesson #88_
