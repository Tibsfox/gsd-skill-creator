# Retrospective — v1.13

## What Worked

- **The dual-track architecture (bash gsd-stack + TypeScript chipset) assigns each language to its strength.** Bash handles session management, tmux interaction, and process lifecycle where shell scripting excels. TypeScript handles the Amiga-inspired coprocessor architecture where type safety and structured data matter.
- **The Amiga chipset metaphor (Agnus/Denise/Paula/Gary) maps cleanly to agent coordination domains.** Context management, output rendering, I/O operations, and bus coordination are the four fundamental concerns of multi-agent systems. Naming them after Amiga chips makes the architecture memorable and the responsibilities clear.
- **541 bash tests + 516 TypeScript tests + 12 integration tests = 1,069 total tests.** This is the most heavily tested release so far, justified by the two-track complexity and the integration layer that bridges them.
- **Four replay modes (analyze, step, run, feed) make recordings useful for different purposes.** Analysis for retrospectives, stepping for debugging, run for benchmarking, feed for creating playbooks. Each mode serves a distinct workflow.

## What Could Be Better

- **14 phases is the largest phase count in any release to date.** The dual-track architecture explains part of this (7 phases per track + integration), but the scope suggests that gsd-stack and chipset could have been separate releases.
- **Pipeline list format with WAIT/MOVE/SKIP instructions introduces a new DSL.** Users now need to learn a custom instruction format on top of YAML frontmatter, markdown skills, and CLI commands. The instruction set is well-designed, but it's another layer of abstraction.
- **The 14-metric computation engine in the recording system is feature-dense.** 14 metrics with display and `--compare` for side-by-side diffs is powerful but may be more granularity than most sessions need.

## Lessons Learned

1. **Session lifecycle is infrastructure, not a feature.** Start, pause, resume, stop, save, list, watch -- these operations make sessions first-class entities with lifecycle management. Without them, sessions are ephemeral and unreproducible.
2. **Integration bridges (StackBridge, SessionEventBridge, PopStackAwareness) are the hardest code to write.** The 12 integration tests exist because the bridge between bash process lifecycle and TypeScript Pipeline execution is where assumptions from both sides collide.
3. **The Exec kernel's prioritized round-robin scheduler (60% phase-critical, 15% workflow, 10% background, 10% pattern detection) encodes resource allocation policy.** The percentages are design decisions about what matters most during execution.
4. **Observation-to-list compilation with Jaccard feedback closes the learning loop for Pipeline execution.** The system observes execution patterns, compiles them into Pipeline lists, tracks accuracy with Jaccard scores, and refines. This is the v1.0 learning loop applied to execution scheduling.

---
