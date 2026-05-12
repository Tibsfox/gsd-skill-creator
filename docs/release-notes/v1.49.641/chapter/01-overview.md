# 01 — Overview: v1.49.641 Housekeeping Cluster #8

## Why this milestone exists

v1.49.640 shipped at `b5bd8fbf3` on 2026-05-12 closing CF-7 (Security Audit) and codifying Lesson #10199's closure-verification gate at `docs/MISSION-PACKAGE-DISCIPLINE.md`. Its carry-forward chapter routed 3 items to Cluster #8:

- **CF-10 (LOW, decision-deferred):** forward-cadence engine resumption (STS-7 candidate)
- **CF-11 (LOW, continued):** Phase-2 cartridge shape families, with an explicit instruction to apply Lesson #10199 §1.4 re-framing review at W0 (5-cluster carry threshold reached)
- **CF-12 (LOW, discretionary):** forward-improvement tooling — `closure-verify-cf.mjs` + hidden-transitive guard automation + vitest reporter improvement

User direction for v1.49.641: take on CF-11 and CF-12. CF-10 stays deferred.

The cluster's natural shape: **apply the discipline to itself**. CF-11 is the §1.4 review's first canonical application; CF-12 codifies the gate as automation. The cluster validates that the closure-verification machinery works — both as a process and as a tool.

## What "done" looked like at mission entry

The C0 W0 plan was straightforward:

1. **CF-11:** run §1.4 re-framing review. Surface alternative framings (precondition vs behavior, install vs runtime, shape-category vs root-mechanism). If the framing is found wrong, retire; if right, scope the work. The plan was open about which outcome would emerge.
2. **CF-12:** implement `scripts/closure-verify-cf.mjs` codifying the four CF shape categories from `cf-closure-verification-templates.md` plus the hidden-transitive guard from Lesson #10204.

W3 ship pipeline: standard 8-file release-notes + meta-test + T14 atomic.

## What "done" actually looked like at mission exit

### CF-11: framing error confirmed; CF retired

The §1.4 review surfaced 4 strong signals that the original framing was wrong:

| Probe | Finding |
|---|---|
| Q1: "Could 'unfit chipsets need migration' be wrong?" | YES — chipsets aren't loaded by runtime `loadCartridge`; no enforcement |
| Q2: "Has the cartridge architecture moved?" | YES — math-coprocessor promoted out to `coprocessors/math/` on 2026-04-19; trajectory is "promote canonical chipsets out" not "migrate within" |
| Q3: "Are the legacy chipsets actually USED?" | YES at reference level (108+ refs for math-coprocessor) but no at LOAD level (zero `loadCartridge` callsites on legacy paths) |
| Q4: "Is this 'shape-category vs root-mechanism' framing error?" | YES — original framing categorized by shape family A/B/C/D; root mechanism was "no enforcement requires migration" |

Verdict: **CF-11 retired**. The 5-cluster carry-forward thread terminates. Future cartridge work re-scopes as a new concern if/when desired.

Documented at `.planning/c0-cf11-reframing-review.md` as the canonical §1.4 application example.

### CF-12: 5 probe types in `scripts/closure-verify-cf.mjs`

The original Cluster #8 spec called out 3 forward-improvements:

1. `scripts/closure-verify-cf.mjs` automation tool
2. Hidden-transitive guard automation
3. Vitest reporter improvement

C2 implementation **combined (1) and (2)** into a single tool. The hidden-transitive guard became a probe type (`hidden-transitive-guard <package>`) alongside the four CF shape categories (`npm-audit`, `file-snapshot`, `upstream-version`, `test-marker`). This kept the tool surface small while addressing both improvements.

(3) Vitest reporter became a documentation note in `cf-closure-verification-templates.md` recommending `--reporter=tap-flat` for background runs (avoids the `| tail -10` buffering pattern that hid in-progress state during v1.49.640 C1 cycles).

Each probe writes a structured record to `.planning/c0-<CF-id>-closure-verification-record.md` with consistent sections: probed_at timestamp, probe_command, exit_code, STATUS (one of `still-real` / `resolved-upstream` / `inconclusive`), advisories or snapshot data, and a routing decision. The format matches the manual records used at v1.49.640 W0.

9 invariant tests at `tests/__tests__/closure-verify-cf.test.ts` cover:
- Usage + help exit codes
- npm-audit probe records (structure + status accuracy)
- file-snapshot probe (present + absent target handling)
- hidden-transitive-guard probe (clean direct dep + missing package handling)

## Scope-change disclosure

Two minor mid-execution refinements:

1. **CF-11 retirement happened at W0 probe time, not C1 implementation.** The §1.4 review was supposed to inform whether C1 should be authored. The review's clear "framing error" verdict meant C1 was never authored — the W0 work IS the cluster's contribution to CF-11. This is exactly the intended behavior of Lesson #10199 (don't manufacture work for already-closed or wrongly-framed CFs).

2. **CF-12 sub-improvements (a)+(b) merged.** The spec listed `closure-verify-cf.mjs` and "hidden-transitive guard automation" as separate items. Reality: the guard fits naturally as a probe type within the same tool. Treating them as one deliverable kept the tool API coherent and the test surface manageable.

Neither is a discipline regression — both are sensible mid-execution refinements informed by W0 findings.

## Why this shape (counter-cadence continued; lean scope)

The counter-cadence pattern continues producing durable substrate. v1.49.641 reinforces:

- **Lesson #10199 §1.4 catches framing errors prospectively.** The discipline's first application closed a 5-cluster carry without any code work. The cost-of-not-doing-it would have been another iteration on the wrong framing (~30-60min spec work + execution scoping).

- **Discipline-as-code completes the lesson lifecycle.** Lesson #10199 emitted v1.49.639 → codified as discipline doc v1.49.640 → codified as automation v1.49.641. Three clusters, three abstraction-level transitions. The discipline now travels with the codebase rather than living in a lesson chapter.

- **9th counter-cadence cleanup is the strongest precedent.** Future clusters can absorb operational debt and ship cleanly without engine state advance.

- **Smaller CF inventory than predecessor.** Cluster #7 routed 3 CFs; Cluster #9 will receive 2 CFs. The chain is shrinking as the carry-forward channel matures.

## Activation profile (actual vs spec)

| Phase | Spec mode (estimated) | Actual |
|---|---|---|
| W0 (probes + §1.4 review) | ~5k tokens | ~5k (probes were fast; §1.4 review was structured) |
| W1A (C1 — CF-11) | (would have been ~15-30k if implemented) | ~0 (retired at W0) |
| W1B (C2 — CF-12 tool) | ~15-20k | ~18k (tool authoring + 9 tests + doc updates) |
| W3 (ship) | ~40-50k | ~25k (this chapter set; smaller because narrative is leaner) |
| Total | ~60-100k | ~48k (well below band; §1.4 retirement saved ~20k) |

Wall-clock: ~1.5h actual vs spec's anticipated ~2-3h. The §1.4 retirement of CF-11 saved ~30-45min of would-be migration work.

## Forward implications

After v1.49.641 ships:

- CF-11 ELIMINATED from carry-forward stream. The chain's longest-running multi-cluster CF (alongside the now-retired CF-1 v1.49.634 chain) is closed.
- `scripts/closure-verify-cf.mjs` available for any future cluster's W0 probes. The discipline-as-code arrives.
- §1.4 re-framing review has a canonical apply-to-self example for future cluster authors.
- Counter-cadence chain at 9. Forward-cadence resumption candidate (STS-7) routes forward as CF-13.
- Cluster #9 inventory shrinks to 2 CFs.
- Post-ship refresh absorption pattern validated for 3rd consecutive cluster.
- STORY-gate auto-fire validated for 4th consecutive ship.
