# The Disk Never Lies

> **Domain:** Autonomous Agent Architecture
> **Module:** 1 -- Core Architecture and State Machine
> **Through-line:** *The only thing that crosses session boundaries is files on disk.* GSD-2 builds its entire autonomous operation on this single constraint. Every design decision follows from it.

---

## Table of Contents

1. [The Iron Rule](#1-the-iron-rule)
2. [The Three-Tier Hierarchy](#2-the-three-tier-hierarchy)
3. [The Execution Loop](#3-the-execution-loop)
4. [The State Machine Topology](#4-the-state-machine-topology)
5. [Crash Recovery Protocol](#5-crash-recovery-protocol)
6. [Stuck Detection and Timeout Supervision](#6-stuck-detection-and-timeout-supervision)
7. [The .gsd/ Directory as Chip RAM](#7-the-gsd-directory-as-chip-ram)
8. [Comparative Analysis: GSD-2 vs Tibsfox GSD](#8-comparative-analysis-gsd-2-vs-tibsfox-gsd)
9. [Cross-References](#9-cross-references)
10. [Sources](#10-sources)

---

## 1. The Iron Rule

GSD-2's most important architectural decision is stated clearly in the documentation and deserves restatement without softening:

**A task must fit in one 200k-token context window. If it cannot, it is two tasks.**

This is not a guideline or a best practice. It is the boundary condition that makes everything else work. Fresh context windows are only meaningful if the unit of work always fits within them. If a task can grow to require two context windows, the entire architecture of fresh-context-per-task collapses.

The iron rule is not a limitation. It is the mechanism that eliminates context rot. Context rot -- the non-linear degradation in output quality that occurs when an LLM accumulates state across a multi-hour session -- is the fundamental problem GSD-2 was built to solve. The iron rule solves it structurally.

Compare: an architect who says "every load-bearing wall must be rated for 150% of its calculated load" is not being pessimistic. They are eliminating structural failure modes by design.

---

## 2. The Three-Tier Hierarchy

GSD-2 organizes work into a strict three-tier hierarchy:

| Tier | Unit | Scale | Definition |
|------|------|-------|------------|
| 1 | Milestone | 4-10 slices | A shippable version. Requires user approval at roadmap stage. |
| 2 | Slice | 1-7 tasks | One demoable vertical capability. Has its own git branch. |
| 3 | Task | 1 context window | Iron rule: fits in one 200k-token window. |

**Milestone:** The largest unit of work -- equivalent to a major software release or a research deliverable. A milestone is the answer to the question "what are we building?" It is not approved by the LLM. It is approved by the user. This is a structural constraint on autonomy: the system cannot create or modify milestones without human sign-off.

**Slice:** The atomic unit of demoability. A slice must be completable in 1-7 tasks, and the result must be demonstrable to a human. Each slice lives on its own git branch (`gsd/M001/S01`) and is squash-merged to main when complete. The slice is the unit of risk management: if a slice goes wrong, the branch is abandoned and work starts fresh.

**Task:** The atomic unit of LLM execution. One task = one fresh context window = one focused dispatch prompt. No task accumulates context from previous tasks. Each task receives exactly what it needs to know, pre-inlined from disk, and produces exactly what it needs to produce.

---

## 3. The Execution Loop

Each slice flows through five phases automatically, without human intervention:

| Phase | Artifact Produced | Execution Model |
|-------|------------------|----------------|
| Research | M001-RESEARCH.md | Scout agent surveys codebase and ecosystem |
| Plan | S01-PLAN.md | Decomposes slice into tasks with must-haves |
| Execute | T0N-SUMMARY.md (per task) | One fresh session per task; all context pre-inlined |
| Complete | S01-UAT.md | UAT script derived from slice outcomes; squash merge |
| Reassess | Updated ROADMAP.md | Checks if roadmap still makes sense; reorders if needed |

The sequence is enforced by the state machine -- not by instruction to the LLM, but by the structure of what is available to read at each phase. During Research, only the roadmap and project context are available. During Execute, the task plan, prior summaries, and research findings are available. The LLM cannot skip phases by reading ahead because the artifacts of later phases do not exist yet.

**The Reassess phase is underrated.** After every slice completes, GSD-2 reviews whether the original roadmap still makes sense. A research finding might reveal that two planned slices can be merged, or that an assumed dependency doesn't exist, or that the problem is different from the roadmap description. Reassess prevents the machine from executing a plan that the last slice proved was wrong.

---

## 4. The State Machine Topology

Auto mode is driven entirely by files in `.gsd/`. The state machine algorithm:

```
loop:
  1. Read STATE.md → determine current unit and phase
  2. Check lock file → if locked, was it abandoned?
  3. Pre-inline context:
     - Task plan (T0N-PLAN.md)
     - Prior task summaries (T0N-SUMMARY.md)
     - Slice plan (S0N-PLAN.md)
     - Research findings (M001-RESEARCH.md)
     - Decisions register (DECISIONS.md)
     - Project context (PROJECT.md)
  4. Create fresh Pi SDK agent session
  5. Inject pre-inlined dispatch prompt
  6. Wait for expected artifact to appear on disk
  7. Read disk state again → advance phase/unit
  8. goto 1
```

**No in-memory state survives session boundaries.** The loop is stateless between iterations. The only persistence is files. This means:
- The state machine can be interrupted at any step and resumed without loss
- A new operator can understand the full system state by reading `.gsd/`
- The LLM cannot accumulate assumptions across sessions (each session is genuinely fresh)

---

## 5. Crash Recovery Protocol

When a long agent session dies mid-task, all in-flight context is lost. GSD-2's recovery protocol:

**Lock file:** A lock file (`STATE.lock`) is written at session start with the current unit identifier. The lock is released when the expected artifact is written to disk.

**If the lock survives a crash:**
1. Next `/gsd auto` detects the orphaned lock
2. Reads every tool call that made it to disk (partial SUMMARY, partial code writes)
3. Synthesizes a recovery briefing from surviving disk state
4. Dispatches a fresh session with the recovery briefing pre-inlined
5. Resumes from the last confirmed disk artifact

**What is recoverable vs. not:**

| Artifact Written to Disk | Recoverable |
|--------------------------|-------------|
| Complete SUMMARY.md | Yes -- full context |
| Partial SUMMARY.md | Yes -- last complete section |
| Code files written | Yes -- if write completed |
| Code files partially written | Depends on file integrity |
| In-memory tool call results | No -- session-local only |
| LLM's reasoning chain | No -- never persisted |

**The design principle:** Never hold state in memory that you cannot afford to lose. If it matters, write it to disk immediately. GSD-2's discipline of writing artifacts to disk before advancing state is what makes crash recovery possible at all.

---

## 6. Stuck Detection and Timeout Supervision

Stuck detection prevents infinite retry loops that would burn budget without producing output.

**Stuck detection rule:**
1. If the same unit dispatches twice without producing the expected artifact
2. GSD-2 retries once with a deep diagnostic prompt ("What is preventing artifact production?")
3. If the diagnostic retry fails, auto mode stops and reports the exact file it expected
4. No further automatic retries

**Why this matters:** An LLM that fails to produce an artifact may be stuck because of a genuine problem (missing dependency, ambiguous specification) or a transient failure (model error, timeout). One automatic retry with diagnosis covers the transient case. Human intervention is required for the genuine problem case -- and the precise "expected file not found" report tells the human exactly where to look.

**Timeout supervision hierarchy:**

| Timeout | Default | Action |
|---------|---------|--------|
| Soft timeout | 20 min | Warns LLM to finalize; nudges toward durable output ("wrap up and write your artifacts") |
| Idle watchdog | 10 min | Detects stalls (no tool calls, no output progression); sends continuation prompt |
| Hard timeout | 30 min | Pauses auto mode; reports last known state; requires human review |

The cascade is important: soft timeout gives the LLM time to finish gracefully. Idle watchdog catches sessions where the LLM has stopped responding. Hard timeout prevents indefinite blocking.

---

## 7. The .gsd/ Directory as Chip RAM

The analogy to the Amiga's chip RAM is not decorative. In the Amiga architecture, chip RAM was memory accessible to both the CPU and the custom chips (Agnus, Denise, Paula). Chip RAM was the shared bus -- the place where context lived that all parties could read.

In GSD-2, `.gsd/` is chip RAM:
- The LLM reads it (via pre-inlined context in dispatch prompts)
- The state machine reads and writes it (driving the execution loop)
- The human reads it (to understand system state)
- Future sessions read it (via pre-inlining)

The 10 managed artifact types in `.gsd/`:

| Artifact | Role |
|----------|------|
| `PROJECT.md` | Living project description |
| `DECISIONS.md` | Append-only architectural decision register |
| `STATE.md` | Quick-glance dashboard; always read first |
| `M001-ROADMAP.md` | Milestone plan with slice checkboxes |
| `M001-CONTEXT.md` | User decisions from the discuss phase |
| `M001-RESEARCH.md` | Codebase and ecosystem research |
| `S01-PLAN.md` | Slice task decomposition with must-haves |
| `T01-PLAN.md` | Individual task plan with verification criteria |
| `T01-SUMMARY.md` | What happened: YAML frontmatter + narrative |
| `S01-UAT.md` | Human test script from slice outcomes |

Every artifact has a defined role. Nothing lives in `.gsd/` without a reason. The directory is designed for both machine readability (the state machine parses frontmatter) and human readability (the narratives tell the story).

---

## 8. Comparative Analysis: GSD-2 vs Tibsfox GSD

Both systems share the Amiga Principle -- architectural leverage over computational brute force. They solve overlapping problems with complementary approaches:

| Design Decision | GSD-2 Approach | Tibsfox GSD Approach |
|----------------|----------------|---------------------|
| Unit of work | Task = 1 context window (iron rule) | Wave = N parallel subagents, fresh contexts |
| State persistence | Files in `.gsd/` (disk-driven) | STATE.md, PLAN files (disk-driven) |
| Context management | Pre-inline at dispatch | Mission package pre-loaded |
| Context rot prevention | Fresh 200k per task (programmatic) | Fresh subagents per wave (architectural) |
| Skill/learning layer | skill\_discovery: auto/suggest/off | Full skill-creator pipeline |
| Crash recovery | Lock file + forensics | Resume from checkpoint |
| Human touch points | Milestone approval + UAT | Checkpoint human-verify |
| Provider flexibility | 20+ providers (Pi SDK) | Anthropic-native (Claude Code) |

**The space between:** GSD-2 has no system that promotes patterns into reusable intelligence across sessions. skill\_discovery finds files; it does not learn from sessions. Tibsfox's skill-creator is that system. Understanding where GSD-2 stops is understanding exactly where the integration begins.

---

## 9. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | System architecture patterns; disk-driven state management |
| [MPC](../MPC/index.html) | Math engine architecture; chip-level execution parallels |
| [CMH](../CMH/index.html) | Distributed orchestration; multi-node state machines |
| [WAL](../WAL/index.html) | Systematic methodology; structured creative process |
| [BCM](../BCM/index.html) | Engineering principles; iron rules in structural design |
| [BRC](../BRC/index.html) | CEDAR chipset mapping to GSD-2 execution roles |

---

## 10. Sources

1. [GSD-2 README](https://github.com/gsd-build/GSD-2) -- Primary architectural documentation
2. [Pi SDK (pi-mono)](https://github.com/badlogic/pi-mono) -- Underlying agent harness documentation
3. [GSD v1 (get-shit-done)](https://github.com/gsd-build/get-shit-done) -- Original prompt framework
4. [DeepWiki / GSD docs](https://deepwiki.com/gsd-build) -- Community analysis
5. [NPM: gsd-pi](https://npmjs.com/package/gsd-pi) -- Published package metadata
