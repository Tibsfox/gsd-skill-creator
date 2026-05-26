# v1.49.784 — Codification: 8 Lessons from v781-v783 → 3 New Operative Disciplines

**Released:** 2026-05-26
**Type:** forward-cadence discipline-codification milestone (NOT a NASA degree advance, NOT counter-cadence)
**Predecessor:** v1.49.783 — STATE.md Normalizer Fix
**Engine state:** UNCHANGED (NASA degree sustains at 1.177)
**Wedge:** Path D (~45min wedge) from the v782+v783 handoffs — codify the 8 queued lesson candidates

## Summary

A focused codification ship closing the 8-lesson candidate backlog accumulated across the v780-v783 Tier E architecture series and the v783 deferred-maintenance wedge. Last codification was at v1.49.654 — 7+ ships ago.

Three new domain entries land in `tools/render-claude-md/disciplines.json`, each backed by a new canonical doc in `docs/`:

| Domain | Lessons | Canonical doc |
|---|---|---|
| Ledger-driven work | #10409–#10413 (5) | `docs/ledger-driven-work-discipline.md` |
| Architecture-retrofit patterns | #10414, #10416 (2) | `docs/architecture-retrofit-patterns.md` |
| Deferred-maintenance escalation | #10415 (1) | `docs/deferred-maintenance-discipline.md` |

Eight formal lesson IDs are emitted at this ship, formalizing the candidate IDs from prior ships:

| Formal ID | Candidate | Discipline |
|---|---|---|
| #10409 | L781-1 | Ledger-driven work |
| #10410 | L781-2 | Ledger-driven work |
| #10411 | L781-3 | Ledger-driven work |
| #10412 | L782-1 | Ledger-driven work |
| #10413 | L782-2 | Ledger-driven work |
| #10414 | L782-3 | Architecture-retrofit patterns |
| #10415 | L783-1 | Deferred-maintenance escalation |
| #10416 | L783-2 | Architecture-retrofit patterns |

## What was codified

### Ledger-driven work (5 lessons)

Three consecutive Tier E architecture ships (v780, v781, v782) each spent ~15min on pre-execution recon and each time the REVIEW ledger's framing flipped materially. v783 confirmed the pattern by skipping recon for a small deferred-maintenance fix — still beneficial. The cluster:

- **#10409 / #10412** — Recon-first as default, not optional. Per-file inspection precedes per-file code.
- **#10413** — Audit rules classify by BEHAVIOR (e.g. `import.*node:fs` presence), not by filename pattern.
- **#10411** — Interface-conformance audits report a 3-way verdict (ALREADY CONFORMS / SHOULD CONFORM / INTENTIONALLY DIFFERENT). The third verdict prevents future re-flagging.
- **#10410** — REVIEW ledger fields distinguish filename-collisions (rename-scale) from class-name-collisions (merge-scale). The two are independent failure modes with ~10× fix-size delta.

### Architecture-retrofit patterns (2 lessons)

- **#10414** — Optional `ctx?` parameter for chokepoint retrofit. Three states emerge: undefined→legacy permissive; defaultLoaderContext()→audit-only; restricted→enforced. Zero call-site churn at existing sites; incremental opt-in. Validated at v782 LoaderContext (11 modules / ~200 sites).
- **#10416** — Tolerant generators (skip-the-line over `UNKNOWN`/`TODO`/placeholder sentinels) for round-trip safety. Placeholders pollute output, break round-trip, mask the schema gap. Exception: emit the default for fields with load-bearing defaults. Validated at v783 STATE.md normalizer fix.

### Deferred-maintenance escalation (1 lesson)

- **#10415** — Close escalated wedges within 1-2 milestones. The cost of deferral is silent test drift + workaround documentation, not the eventual fix. At v783, a 45-min wedge closed a normalizer bug that had been load-bearing for ~5 months — the fix was small; the accumulated workaround documentation in operator memory was the actual cost.

## Files changed

### New (3 canonical docs + 5 release-notes)

- `docs/ledger-driven-work-discipline.md` — new (87 lines)
- `docs/architecture-retrofit-patterns.md` — new (66 lines)
- `docs/deferred-maintenance-discipline.md` — new (52 lines)
- `docs/release-notes/v1.49.784/README.md` + `chapter/*` — this set

### Modified (1)

- `tools/render-claude-md/disciplines.json` — manifest entries 10 → 13 (+3 domains), manifest lessons 49 → 57 (+8 IDs).

CLAUDE.md regenerated via `npm run render:claude-md` (gitignored — local only).

## Test counts

- **render-claude-md unit tests:** 21/21 passing.
- **discipline-coverage report:** manifest entries 10 → 13; manifest lessons 49 → 57. The 8 new formal IDs land in v784's own 04-lessons.md release notes (covered at next coverage run).
- **Pre-tag-gate:** TO-FILL after gate run.

## What this ship is

- A focused discipline-codification ship — 3 new domain entries, 3 new canonical docs, 8 formal lesson IDs.
- A demonstration of the meta-discipline: the 8-lesson backlog itself was an escalated deferred-maintenance item (per #10415); closing it within the next-ship window honors the discipline it codifies.

## What this ship is not

- Not a NASA degree advance. Engine state unchanged at 1.177.
- Not a counter-cadence ship. Counter-cadence count stays at 5.
- Not a code refactor. Tools and source code unchanged beyond the manifest update; only docs added.

## Next session pickup

- **Path A — NASA 1.178 forward-cadence.** With the 3-ship architecture series (v780-v782) + 1-ship deferred-maintenance (v783) + 1-ship codification (v784) complete, the engine-state-advance cadence has been deferred for 7 consecutive ships at NASA 1.177. Default-recommended next: INTERSTELLAR-BOUNDARY axis obs#2 candidates (IBEX 2008, Wind 1994, Voyager 1/2 interstellar, Pioneer 10/11 interstellar, Cassini INCA 2009, FAST 1996, DE-1 1981).
- **Path C — risk-tier re-sweep at ~v789.** Deferred per cadence (currently +7 milestones from sweep).

Operator picks per-ship.
