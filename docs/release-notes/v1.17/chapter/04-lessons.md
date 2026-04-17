# Lessons — v1.17

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Three-path clarity routing reduces decision fatigue.**
   clear/gaps/confused as intake routing means the system self-selects its processing depth. Clear items fast-track, confused items get research. No single path handles everything.
   _⚙ Status: `investigate` · lesson #89_

2. **Append-only audit logs are non-negotiable for staging systems.**
   The queue's append-only audit log means every state transition is traceable. When something goes wrong in a 7-state machine, you need the full history.
   _🤖 Status: `applied` (applied in `v1.24`) · lesson #90 · needs review_
   > LLM reasoning: v1.24 GSD Conformance Audit & Hardening extends audit-log discipline to staging conformance.

3. **Crash recovery with resumable state is essential for multi-step intake.**
   The smart intake flow's crash recovery means a browser crash or session timeout doesn't lose partially-completed intake work. This is especially important for the resource analysis step which does real computation.
---
   _🤖 Status: `applied` (applied in `v1.46`) · lesson #91 · needs review_
   > LLM reasoning: v1.46 adds append-only JSONL logger with rollback/recovery for pipeline state, matching resumable-state pattern.

4. **Two state machines in one release.**
   The staging pipeline (5 states) and the queue (7 states) are both introduced here. The interaction between them -- when does a staged item enter the queue? -- could be clearer in the release notes.
   _🤖 Status: `investigate` · lesson #92 · needs review_
   > LLM reasoning: v1.46 upstream intelligence pipeline doesn't address staging/queue state machine interaction clarity.

5. **11 hygiene patterns is a starting set.**
   The pattern categories (injection, obfuscation, unsafe config) cover the obvious cases, but the real test is how easily new patterns can be added as novel attack vectors emerge.
   _🤖 Status: `investigate` · lesson #93 · needs review_
   > LLM reasoning: v1.42 git workflow skill is unrelated to hygiene pattern extensibility.
