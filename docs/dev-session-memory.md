# Dev-Session Memory — the dev-domain path into the Knowledge Spine

Dev coding sessions enter the memory corpus through a **dev-domain** path that is
deliberately separate from the education (learner/pack/mastery) path.

## Why a separate path

The education pipeline (`src/knowledge/observation-types.ts` →
`LearningPatternDetector` → `MemorySink`) is built around `LearnerObservation`,
whose every kind hard-requires `learnerId`, `packId`, a curriculum locator, and —
for the richest kinds — a 0–100 `score` and a rubric level. A Claude Code dev
session has **none** of these. Forcing dev-session events onto that schema would
fabricate the entire mastery axis and emit misleading *"Learners follow module
sequence…"* memories. (Full analysis:
`.planning/HANDOFF-2026-07-13-learner-observation-producer-decision.md`.)

So dev sessions are **NOT** routed through `LearningPatternDetector` or
`ObservationEmitter`. They use the dev-domain sibling instead.

## The dev-domain path

```
.planning/sessions/current.jsonl          ┐
.planning/sessions/current.tool-trace.jsonl├─▶ dev-observation-source ─▶ DevSessionObservation[]
(optional session summary)                 ┘
                                              │
                                              ▼
                                       DevPatternDetector  (recurring friction,
                                              │             correction clusters,
                                              ▼             recurring gaps, tool
                                        DevMemorySink        sequences — occurrence
                                              │              counts, no score/rubric)
                                              ▼
                                MemoryService.store  → 'episodic' / 'feedback' records
                                                        (NEVER 'lesson')
```

Modules (all under `src/knowledge/`, exported from the knowledge barrel):
`dev-observation-types.ts`, `dev-observation-source.ts`, `dev-pattern-detector.ts`,
`dev-memory-sink.ts`, `dev-memory-run.ts`.

Guarantees:
- **Honesty boundary** — `DevSessionObservationSchema` members are `.strict()`, so
  a record carrying an education field fails to validate.
- **No fabrication** — every field has a real dev referent; memories carry dev
  vocabulary only.
- **Hard boundary** — the sink only ever calls `MemoryService.store`; it never
  writes a skill, agent, or any other on-disk artifact.
- **Corrections are QUARANTINE-gated** — correction-cluster patterns are not
  written unless `--include-corrections` is passed (item-7 no-auto-attribution).

## Running it (opt-in)

Nothing runs this by default. Invoke it explicitly:

```bash
# Dry run — print the candidate memories, touch no storage:
skill-creator flywheel dev-memory

# Persist into the memory corpus:
skill-creator flywheel dev-memory --execute

# Options:
#   --include-corrections   also write correction memories (QUARANTINE-gated)
#   --sessions-dir <d>      session-streams dir (default .planning/sessions)
#   --memory-dir <d>        memory dir for --execute (default .)
#   --min-recurrence <n>    detector recurrence threshold (default 2)
```

Programmatically, call `runDevMemory({ sessionsDir, sessionId, repo, writer })`
with any `PatternMemoryWriter` (a real `MemoryService`, or a collector for a
dry run).
