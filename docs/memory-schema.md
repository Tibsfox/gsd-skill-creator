# Memory Schema

Contract for the project's auto-memory corpus and the survey scorer that filters it before each turn.

> **Status:** Draft v1, lands with milestone v1.49.576 (OOPS-GSD Implementation, component C3).
> **Closes:** OGA-024 (half-life metadata), OGA-025 (9-type taxonomy), OGA-026 (standing-rules separation), OGA-006 (survey scorer), OGA-023 (BLOCK — token-budget waste).
> **Authority:** OOPS-05 (Memory Survey Pattern Notes) — see `.planning/missions/oops-gsd-alignment/m4/evidence/`.

## 1. Surfaces

This project has two memory surfaces:

| Surface | Path | Tracked in repo? | Loaded how? |
|---|---|---|---|
| **In-repo schema + tooling** (this work) | `STANDING-RULES.md`, `docs/memory-schema.md`, `src/memory/survey-scorer.ts`, `scripts/memory-migrate-*.mjs` | Yes | Imported by tests + future SessionStart integration |
| **Out-of-repo memory corpus** (the user's auto-memory) | `~/.claude/projects/<encoded-path>/memory/` | No (gitignored by Claude Code) | Loaded by Claude Code's session-start; ~70 files |

The migration scripts run against surface 2 (the user's corpus); the schema and scorer live in surface 1 (this repo). The user's MEMORY.md may carry Fox Companies IP and personal context — **never grep it into committed test fixtures**. Synthetic fixtures only.

## 2. Load order

```
SessionStart
  ├── 1. CLAUDE.md (project)        — always loaded, never scored
  ├── 2. STANDING-RULES.md          — always loaded, never scored, NEVER shed
  └── 3. MEMORY.md + per-file corpus — SCORED by src/memory/survey-scorer.ts
                                       Entries with type: pinned-rule pass through
                                       Entries below threshold are shed for this turn
```

`STANDING-RULES.md` is the canonical home for entries that must never be shed. The scorer's pinned-rule passthrough is a backstop: if any MEMORY.md entry is mis-classified or mis-located, marking it `type: pinned-rule` in frontmatter still preserves it.

## 3. Frontmatter schema

After C3.P3 migration, every memory file in the user's corpus carries this frontmatter:

```yaml
---
name: <stable identifier; matches filename without extension>
description: <one line summary>
type: project | feedback | decision | reference | user | pinned-rule | observation | tactic | question
half_life: infinite | 6mo | 1mo | 1wk | transient
last_accessed: 2026-04-25T12:00:00Z
confidence: 0.95
---
<body markdown>
```

### 3.1 `type` (the 9-type taxonomy, OOPS-05-P04)

| Type | Meaning | Default `half_life` |
|---|---|---|
| `project` | Active project state — current milestones, in-flight work, branch tips | `1mo` |
| `feedback` | User preference, repeated correction, behavioural rule | `6mo` |
| `decision` | Architectural choice with rationale (mini-ADR) | `6mo` |
| `reference` | Stable lookup (credentials path, endpoint, file location) | `infinite` |
| `user` | Identity / personal context about the user | `infinite` |
| `pinned-rule` | Hard rule that bypasses scoring — see STANDING-RULES.md | `infinite` |
| `observation` | Empirical finding from a session (benchmark, surprise, telemetry) | `1mo` |
| `tactic` | Reusable technique (commands, code patterns, debugging recipes) | `6mo` |
| `question` | Open question awaiting an answer | `1wk` |

The classifier (in `scripts/memory-migrate-taxonomy.mjs`) infers the type from filename prefix (`project_`, `feedback_`, `user_`), explicit markers in body (`HARD RULE`, `STANDING RULE`, `ABSOLUTE`), and structural heuristics. Manual override always wins; the classifier is conservative.

### 3.2 `half_life` (decay policy, OOPS-05-P03)

| Value | Half-life in days | Use |
|---|---|---|
| `infinite` | ∞ (never decays) | Standing rules, identity, stable references |
| `6mo` | ~180 | Decisions, feedback, tactics |
| `1mo` | ~30 | Active project state, recent observations |
| `1wk` | ~7 | Current session, open questions |
| `transient` | ~1 | One-off scratch notes |

`age_days = (now - last_accessed) / 1 day`
`decay = 0.5 ^ (age_days / half_life_days)`
For `infinite`, `decay = 1.0` always.

### 3.3 `last_accessed`

ISO-8601 timestamp. Migration script (`scripts/memory-migrate-half-life.mjs`) backfills from git mtime on first run; Claude Code updates the field whenever the entry is loaded into a turn (future integration).

### 3.4 `confidence`

Float in `[0, 1]`. Default `0.95` for human-authored entries; lower values are reserved for entries that were auto-extracted and have not been corroborated. The scorer multiplies the relevance contribution by `confidence`.

## 4. Survey scoring

```
score(entry) = relevance(context, entry) × half_life_decay(age, half_life) × confidence
```

- `relevance` is keyword-overlap normalized to `[0, 1]` (see `src/memory/survey-scorer.ts` for the exact formula).
- `half_life_decay` is the exponential decay above.
- Pinned-rule entries bypass the formula and always score `1.0`.

Entries with score `< threshold` (default `0.3`) are shed for the turn. The scorer emits a decision-trace ledger entry per shed (planned integration with `src/traces/`).

### 4.1 Performance budget

- Scorer ≤ 50ms per scoring run on a 70-file corpus.
- The scorer must not regress the SessionStart latency benchmark established by C1 (median ≤ 50ms; total session-start budget ≤ 200ms).

### 4.2 Correctness budget

- CF-B-023-1: 5-fixture mean reduction ratio ≤ 0.6 (≥40% token reduction over the always-load baseline).
- CF-B-023-2: pinned-rule entries are NEVER shed (regression test enforced).
- CF-H-006: scorer logic edge cases (empty corpus, all-pinned corpus, no-match context, threshold boundary).

## 5. Migration

Two scripts ship in C3.P2 + C3.P3:

| Script | Adds | Idempotent |
|---|---|---|
| `scripts/memory-migrate-half-life.mjs` | `half_life`, `last_accessed`, `confidence` frontmatter fields | Yes — re-running leaves correct frontmatter alone |
| `scripts/memory-migrate-taxonomy.mjs` | `type` field per 9-type taxonomy | Yes — explicit `type:` is preserved |

Run order: half-life first (gives the migration timestamp baseline), then taxonomy. Both scripts default to dry-run; pass `--write` to mutate files. Both accept `--dir <path>` so they can run against a synthetic test corpus or the live user-memory directory.

## 6. Out-of-scope for this milestone

- Live integration of the scorer with the SessionStart hook is wired by C1 + C5 in later waves of v1.49.576; C3 ships the scorer + tests + migration tooling but leaves the actual user-memory rewrite as an operational follow-on. The user runs the migration scripts when ready.
- Decision-trace ledger emission is stubbed; full integration with `src/traces/` lands in C5.
- The `last_accessed` write-back (updating the field whenever a memory loads) is a Claude Code SessionStart concern, not a scorer concern.
