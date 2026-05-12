# 00 — Summary: v1.49.640 Housekeeping Cluster #7

**Released:** 2026-05-12
**Type:** counter-cadence operational-debt cleanup (NOT a NASA degree)
**Predecessor:** v1.49.638 → v1.49.639 → **v1.49.640** (8th counter-cadence in chain)

## TL;DR

v1.49.640 closes the CF-7 npm audit malware advisory chain (gsd-pi removed as phantom dep) and codifies Lesson #10199's closure-verification gate as a standing discipline artifact (`docs/MISSION-PACKAGE-DISCIPLINE.md`). Engine state UNCHANGED. Counter-cadence chain extends to 8. 4 commits between v1.49.639 ship and v1.49.640 ship.

## Headline outcomes

- **CF-7 CLOSED via hybrid path (b)+(d).** `npm audit --audit-level=high` exit 0. 302 packages removed (673 → 375). 30,503 vitest pass.
- **Lesson #10199 codified.** `docs/MISSION-PACKAGE-DISCIPLINE.md` (NEW) + `docs/test-discipline/cf-closure-verification-templates.md` (NEW) + sibling cross-ref in `docs/SUBSTRATE-PROBE-DISCIPLINE.md`. Forward-applicability: future N+k clusters get the closure-verification gate by default rather than ad-hoc.
- **CF-8 routed via option (b)** — continue counter-cadence. STS-7 Sally Ride / Challenger NASA degree deferred to v1.49.641+.
- **CF-9 carried forward unchanged** to Cluster #8 as CF-11.
- **Post-ship refresh absorbed.** v1.49.639 working-tree state (dashboard + RH) landed as first commit of session at `65d47b72e`.
- **12 new meta-test invariants** in `tests/integration/v1-49-640-meta-test.test.ts` covering all closed components + CF routing decisions + counter-cadence state.

## Commits on dev (since v1.49.639 ship)

| SHA | Subject | Notes |
|---|---|---|
| `65d47b72e` | chore(release): post-ship refresh — RH+dashboard for v1.49.639 | W3 Stage 0 absorption |
| `19b89620d` | chore(deps): npm audit fix + remove unused gsd-pi to close CF-7 | C1 hybrid (b)+(d) |
| `33df8ec0c` | docs(test-discipline): codify Lesson #10199 closure-verification gate | C2 doc artifacts |
| `da1ef38e1` | test(v1-49-640): integration meta-test for cluster #7 closures | W3 Stage 2 meta-test |
| (T14) | chore(release): v1.49.640 housekeeping cluster #7 | W3 Stage 6 ship |

5 commits at ship (4 already landed + 1 ship commit).

## What this milestone is NOT

- **Not a NASA degree.** Engine state UNCHANGED (CF-8 routed to defer).
- **Not a forward-cadence resume.** Counter-cadence chain extends to 8.
- **Not a code refactor.** All changes are deps-removal + doc-additions + test-additions; zero src/ code patches.
- **Not Phase-2 cartridge work.** CF-9 carried forward unchanged.

## Mission package vs reality (scope-change disclosure)

The mission package anticipated CF-7 as a single clean path (b/c/d/e) decision at ~30min wall-clock. Reality: ~40min including a mid-component pivot from path (b) to hybrid (b)+(d) plus two hidden-transitive recovery cycles (fast-xml-parser, yaml). The closure-verification gate (Lesson #10199 applied to self) worked as designed — caught CF-7 was real before C1 spawned, and stayed in the routing loop during the pivot.

Two unanticipated forward-applicability findings emerged:

1. **Phantom-dependency pattern** — `npm audit fix` non-breaking can't remove deps not declared in `package.json`. The fix requires removing the parent declaration, not the transitive.
2. **Hidden-transitive guard** — removing a phantom dep can break tests that relied on its transitive subtree. Pre-flight grep for src/ imports satisfied by the subtree catches this before vitest verify time.

Both became candidate Lessons #10203 + #10204 in `chapter/04-lessons.md`. The hidden-transitive guard was added to `cf-closure-verification-templates.md` as a forward-improvement pattern.

## See also

- `01-overview.md` — full narrative + scope change disclosure
- `02-walkthrough.md` — per-component implementation walkthrough
- `03-retrospective.md` — what worked / burned cycles / forward-improvement
- `04-lessons.md` — Lessons #10199 apply-to-self + #10203 + #10204
- `05-carry-forward.md` — CF-10 / CF-11 / CF-12 routed to Cluster #8
- `99-context.md` — cross-refs + T14 ship-pipeline trace
