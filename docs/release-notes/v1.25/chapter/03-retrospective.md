# Retrospective — v1.25

## What Worked

- **Making implicit dependencies explicit.** 20 nodes, 48 typed edges (requires/enhances/extends/conflicts), and a Mermaid-rendered DAG -- this is the first time the entire ecosystem's dependency structure was visible in one place. The 4-hop critical path analysis reveals bottlenecks that were previously invisible.
- **EventDispatcher specification as ecosystem-wide standard.** Adopting AMIGA EventEnvelope as the canonical event format and designing a single-inotify watcher with fan-out to 6 subscribers solves the "multiple watchers competing for inotify budget" problem before it becomes a production issue. The 1,020 watch budget (25% of 4,096 target) shows resource discipline.
- **4-tier dependency philosophy with enforcement.** Core (zero deps), Middleware (lean npm), Platform (native), Educational (inherits) -- with ready-to-paste ESLint 9+ flat config for import boundary enforcement. Philosophy without enforcement is aspiration; this release ships both.

## What Could Be Better

- **10,558 lines of specification with no implementation.** This release is entirely analytical -- 17 spec documents, zero code changes. The value is real (ecosystem clarity), but the gap between specification and enforcement means these specs could drift if not actively maintained.
- **99 known-issues cross-referenced but categorization may not age well.** The 51 aspirational, 26 environment-dependent, 9 permanent, 13 resolved breakdown is a snapshot. Without a process to re-evaluate periodically, the categories become stale.

## Lessons Learned

1. **Dependency DAGs should be built early, not as a catch-up exercise.** At 20 nodes and 48 edges, the ecosystem is already complex enough that manual dependency tracking is unreliable. Building this DAG earlier would have informed build sequencing decisions throughout v1.16-v1.24.
2. **inotify budget is a real constraint on Linux systems.** The 9-factor rationale for inotify over fanotify and the per-subscriber allocation model show that filesystem watching at scale requires explicit resource planning, not just "add a watcher."
3. **Partial-build compatibility matrices enable incremental adoption.** The 3-state degradation tables (full/degraded/unavailable) and 3-tier capability probe protocol mean users can run subsets of the system without everything installed. This is essential for a project of this size.

---
