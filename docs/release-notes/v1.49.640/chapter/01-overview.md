# 01 — Overview: v1.49.640 Housekeeping Cluster #7

## Why this milestone exists

v1.49.639 shipped at `a3e189433` on 2026-05-12 with 6/6 components closed (the longest-running CF-1 5-cluster journey retired via skip-guard recognition) and produced a remarkably small carry-forward inventory: **3 items**, the smallest in the 7-cluster chain.

Of those 3, only **CF-7** (npm audit Security Audit job failure) was HIGH priority. CF-8 (forward-cadence resumption) was decision-deferred. CF-9 (Phase-2 cartridge shape families) was abstract continued-carry with no expected work.

v1.49.640's natural shape: pure CF-7 closure + Lesson #10199 codification + ship. **No forward-cadence engine advancement.** **No NASA degree.** **Cluster #7 of the counter-cadence chain.**

## What "done" looked like at mission entry

The mission package framed 5 closure paths for CF-7 (a retire / b non-breaking / c force / d replace / e whitelist), gated on a W0 closure-verification probe per Lesson #10199's discipline. Per mission spec:

- **(a) retire** — feasible only if `npm audit` clean at W0 entry
- **(b) non-breaking** — operator-preferred lowest-risk active fix
- **(c) force** — gsd-pi 2.10.10 downgrade; introduces breaking change in transitive
- **(d) replace** — remove gsd-pi entirely
- **(e) whitelist** — suppress advisory; keep gsd-pi

C2 was a pure doc-codification component: write `docs/MISSION-PACKAGE-DISCIPLINE.md` (or extend `SUBSTRATE-PROBE-DISCIPLINE.md` §3) per the Lesson #10199 specification.

W3 was the standard ship pipeline plus post-ship refresh absorption.

## What "done" actually looked like at mission exit

### CF-7: hybrid path (b)+(d) instead of pure path (b)

The mission package didn't formally enumerate a "hybrid path" option, though paths (b) and (d) were both listed separately. Reality required combining them mid-execution:

1. **W0 probe** — `npm audit --audit-level=high --json` returned exit 1 with 4 advisories (2 critical + 2 moderate). CF-7 confirmed `still-real`. Path (a) retire ruled out.

2. **Operator decision via AskUserQuestion** — chose path (b).

3. **Path (b) dry-run** — `npm audit fix --dry-run` proposed gsd-pi 2.62→2.82, removal of 19 transitive deps. Looked safe.

4. **Path (b) apply** — `npm audit fix` executed. 19 packages removed, 3 changed. **But:** post-fix audit still showed 3 vulnerabilities (2 critical + 1 moderate). gsd-pi 2.82.0 still pulls in @mistralai/mistralai as transitive.

5. **Investigation** — `grep -rn "gsd-pi" src/ desktop/ src-tauri/ tools/` returned **zero source-level imports**. `package.json` scripts have zero gsd-pi invocations. `bin` entries have none. Only 2 comment-level references in hook files.

6. **Source of gsd-pi declaration** — `git log -S '"gsd-pi"' -- package.json` returned commit `1964b4011` `chore(deps): add gsd-pi ^2.62.0 for GSD-2 integration` with empty body. Planned integration; never wired into source.

7. **Operator pivot via second AskUserQuestion** — three options surfaced: (b)+(d) hybrid keep partial fix + remove gsd-pi, pure (e) whitelist, pure (c) force. Operator chose hybrid (b)+(d).

8. **Path (d) overlay** — removed `"gsd-pi": "^2.62.0"` from `package.json` dependencies. `npm install` cascaded: removed 202 packages, audited 371, **found 0 vulnerabilities**.

9. **Vitest sanity check** — 14 test files FAILED with `Cannot find package 'fast-xml-parser'`. The package was a hidden transitive via gsd-pi → @smithy/* chain; used directly in 3 src/ files.

10. **First hidden-transitive recovery** — `npm install fast-xml-parser --save` (added at ^5.8.0). Re-ran vitest: 10 test files still failing.

11. **Second probe** — `npx vitest run src/cli/commands/cartridge.test.ts` revealed `Cannot find package 'yaml'`. `grep` found 6 src/ files import `yaml` directly. Another hidden transitive.

12. **Second hidden-transitive recovery** — `npm install yaml --save`. Re-ran full vitest: **30,503 tests pass, 0 failures**.

13. **Commit at `19b89620d`** — single combined commit per operator's hybrid (b)+(d) decision rationale. Body cites both the hybrid path and the two hidden-transitive recoveries.

**Wall-clock:** ~40min vs spec's anticipated 30min for clean path (b). Acceptable.

### C2: NEW file over §3 extension

Mission spec's default was "extend `SUBSTRATE-PROBE-DISCIPLINE.md` §3". Sonnet pre-decision criterion: extend if doc is broadly scoped; NEW file if narrowly scoped. Inspection of SUBSTRATE-PROBE-DISCIPLINE.md revealed it is narrowly scoped to substrate-shape probes (one abstraction layer below CF-chain framing-error gates).

**NEW file** chosen: `docs/MISSION-PACKAGE-DISCIPLINE.md`. The two docs are siblings at different abstraction levels.

C2 also produced the companion file `docs/test-discipline/cf-closure-verification-templates.md` (4 probe templates + hidden-transitive guard from C1 experience). Added sibling cross-reference back in `SUBSTRATE-PROBE-DISCIPLINE.md`.

Meta-test was authored at C3 W3 Stage 2 (after C2 doc landed), not as part of C2 itself. This matched v1.49.639's pattern.

### CF-8: operator chose (b) continue counter-cadence

At W0 close, operator AskUserQuestion routed via option (b). STS-7 Sally Ride / Challenger NASA degree deferred to v1.49.641+. Counter-cadence chain extends to 8 — strongest precedent in this codebase.

### CF-9: continued-carry with no work

`.planning/cartridge-migration-phase2.md` snapshot matched predecessor's content. Routed forward to Cluster #8 as CF-11.

## Scope-change disclosure

Two material deviations from the mission package spec:

**1. CF-7 hybrid path required mid-component pivot.** The mission package enumerated paths (a) through (e) as discrete options. Reality required combining (b) and (d). The closure-verification gate at W0 worked as designed — caught CF-7 was still real before C1 dispatched — but the gate didn't anticipate that the "fix" pathway could be partial. This becomes Lesson #10203 candidate: "Phantom dependencies — `npm audit fix` non-breaking can't remove deps not declared in `package.json`; remove the source dep instead."

**2. Hidden-transitive recovery cycles cost ~10min total.** Removing gsd-pi broke 14 test files via `fast-xml-parser`; adding it broke 10 more via `yaml`. Both were hidden transitives used directly in src/. This becomes Lesson #10204 candidate: "Hidden transitives can be load-bearing — pre-flight grep for src/ imports satisfied by the subtree catches this before vitest verify time."

Both lessons are forward-applicability extensions of Lesson #10199 (closure-verification gate) and #10180 (substrate audits underestimate scope). They are codified in `chapter/04-lessons.md`.

## Why this shape (counter-cadence continued)

The counter-cadence pattern continues producing durable substrate. v1.49.640 reinforces:

- **Closure-verification gate works as a first-line defense.** CF-7 was confirmed `still-real` at W0; the gate didn't falsely retire CF-7.
- **Mid-component pivots are recoverable when operator-routing is fast.** Two AskUserQuestion checkpoints during C1 enabled a clean hybrid path without scope creep.
- **Phantom-dependency pattern is generalized in mission-pipeline tooling.** The hidden-transitive guard pattern documented in `cf-closure-verification-templates.md` makes the C1 experience reusable.
- **8th counter-cadence cleanup is the strongest precedent.** Future clusters can absorb operational debt without engine state advance and produce clean ship outcomes.

## Activation profile (actual vs spec)

| Phase | Spec mode | Actual |
|---|---|---|
| W0 | ~7k tokens | ~5k (probes were fast; CF-8 routing was a single AskUserQuestion) |
| W1A (C1) | ~20-50k | ~30k (mid-component pivot + 2 hidden-transitive recoveries) |
| W1B (C2) | ~15k | ~14k (doc authoring + companion file) |
| W3 (C3) | ~50k | (this milestone's W3 ship + meta-test + release-notes) |
| Total | ~90-120k | ~115k (within band) |

Wall-clock: ~2.5h actual vs spec's ~2-4h band. Mid-band, mainly driven by the C1 pivot + hidden-transitive recoveries.

## Forward implications

After v1.49.640 ships:

- CI Security Audit job GREEN. Supply-chain risk surface area reduced.
- Closure-verification gate codified as standing discipline. Future N+k cluster carry-forward chains get the gate by default.
- Counter-cadence chain at 8. Forward-cadence resumption candidate (STS-7) carried forward unchanged.
- Two new candidate Lessons (#10203 phantom-dep, #10204 hidden-transitive) added to the lesson ledger.
- Post-ship refresh absorption pattern validated for 2nd consecutive cluster (v1.49.638→.639, .639→.640).
- STORY-gate auto-fire validated for 3rd consecutive ship (v1.49.638 C5 fix proven durable).
