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

## Auto-invoke at session end (opt-in, default OFF)

A `SessionEnd` hook (`.claude/hooks/dev-memory-session-end.cjs`, source in
`project-claude/hooks/`) can run the miner automatically when a Claude Code
session ends — including when the operator never runs `observe.mjs end` (e.g.
context death), so session memory is still captured. It only acts when an
observation session is active (`current.meta.json` present) and is **default
OFF**; enabling it is the explicit opt-in.

Enable via the env var `SC_DEV_MEMORY_ON_END` **or** the
`.claude/gsd-skill-creator.json` flag `"devMemoryOnEnd"`:

| value | behavior |
| --- | --- |
| `off` (default) | no-op |
| `dry` / `1` / `true` / `on` | write candidates to `.planning/sessions/dev-memory-candidates.json` — **no corpus write** |
| `execute` | persist into the memory corpus (`--execute`) |

Extra env: `SC_DEV_MEMORY_INCLUDE_CORRECTIONS=1` (adds `--include-corrections`),
`SC_DEV_MEMORY_DIR` (memory dir for `execute`). The hook is best-effort — it
never fails session end. Install/refresh it with `node project-claude/install.cjs`
(hooks merge non-destructively; run `npm run render:claude-md` if you used
`--force`).
