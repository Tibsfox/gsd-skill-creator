# Lessons — v1.13

7 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Session lifecycle is infrastructure, not a feature.**
   Start, pause, resume, stop, save, list, watch -- these operations make sessions first-class entities with lifecycle management. Without them, sessions are ephemeral and unreproducible.
   _🤖 Status: `applied` (applied in `v1.32`) · lesson #69 · needs review_
   > LLM reasoning: v1.32 Brainstorm Session Support treats sessions as first-class entities with lifecycle, directly addressing the lesson.

2. **Integration bridges (StackBridge, SessionEventBridge, PopStackAwareness) are the hardest code to write.**
   The 12 integration tests exist because the bridge between bash process lifecycle and TypeScript Pipeline execution is where assumptions from both sides collide.
   _🤖 Status: `applied` (applied in `v1.41`) · lesson #70 · needs review_
   > LLM reasoning: v1.41 'Claude Code Integration Reliability' directly hardens the integration-bridge layer the lesson calls out.

3. **The Exec kernel's prioritized round-robin scheduler (60% phase-critical, 15% workflow, 10% background, 10% pattern detection) encodes resource allocation policy.**
   The percentages are design decisions about what matters most during execution.
   _⚙ Status: `applied` (applied in `v1.42`) · lesson #71_

4. **Observation-to-list compilation with Jaccard feedback closes the learning loop for Pipeline execution.**
   The system observes execution patterns, compiles them into Pipeline lists, tracks accuracy with Jaccard scores, and refines. This is the v1.0 learning loop applied to execution scheduling.
---
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #72_

5. **14 phases is the largest phase count in any release to date.**
   The dual-track architecture explains part of this (7 phases per track + integration), but the scope suggests that gsd-stack and chipset could have been separate releases.
   _🤖 Status: `investigate` · lesson #73 · needs review_
   > LLM reasoning: v1.46 Upstream Intelligence Pack is unrelated to the dual-track phase-count scope concern from v1.13.

6. **Pipeline list format with WAIT/MOVE/SKIP instructions introduces a new DSL.**
   Users now need to learn a custom instruction format on top of YAML frontmatter, markdown skills, and CLI commands. The instruction set is well-designed, but it's another layer of abstraction.
   _🤖 Status: `investigate` · lesson #74 · needs review_
   > LLM reasoning: v1.14 Promotion Pipeline snippet doesn't show the DSL being simplified or replaced.

7. **The 14-metric computation engine in the recording system is feature-dense.**
   14 metrics with display and `--compare` for side-by-side diffs is powerful but may be more granularity than most sessions need.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #75_
