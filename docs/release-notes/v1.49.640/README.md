# v1.49.640 — Housekeeping Cluster #7

**Released:** 2026-05-12 (pending operator G3 authorization)
**Type:** counter-cadence housekeeping cluster (NOT a NASA degree)
**Predecessor:** v1.49.639 (Housekeeping Cluster #6)
**Mission package:** `.planning/missions/v1-49-640-housekeeping-cluster-7/`
**Source vision:** v1.49.639 carry-forward chapter (`docs/release-notes/v1.49.639/chapter/05-carry-forward.md`) — 3-item Cluster #7 inventory + Lesson #10199 closure-verification gate
**Engine state:** UNCHANGED (CF-8 routed via option (b) continue counter-cadence; no NASA / MUS / ELC / SPS / TRS forward-cadence content)

## Summary

v1.49.640 is the **eighth counter-cadence cleanup milestone** in the engine chain (preceded by v1.49.585 / .634 / .635 / .636 / .637 / .638 / .639). It absorbs the v1.49.639 carry-forward chapter by **closing CF-7 (HIGH)** and **codifying Lesson #10199** as a standing discipline artifact:

- **C0 W0 (Lesson #10199 first application).** Mechanical closure-verification probes ran BEFORE component-spec finalization. CF-7 probe (`npm audit --audit-level=high --json`) returned `still-real` — 4 advisories surfaced (2 critical + 2 moderate). CF-9 probe (`cartridge-migration-phase2.md` content snapshot) returned `unchanged`. CF-8 routing decision routed via operator AskUserQuestion at W0 close.

- **C1 (CF-7) — Security Audit closure via hybrid path (b)+(d).** Initial operator decision was path (b) `npm audit fix` non-breaking. Execution revealed path (b) cleared only 1 of 4 advisories (gsd-pi 2.62→2.82 upgrade kept the @mistralai/mistralai transitive). Source-level investigation found gsd-pi is a **phantom dependency** — declared in `package.json` for "GSD-2 integration" planning but never actually wired into source. Operator pivoted to hybrid (b)+(d): keep path (b) cleanup + remove `gsd-pi` from `package.json`. Two hidden transitives (`fast-xml-parser`, `yaml`) surfaced during vitest verification and were declared as direct deps. Final state: 0 vulnerabilities; 30,503 tests pass; net 302 packages removed (673 → 375). Commit `19b89620d`.

- **C2 (Lesson #10199) — Closure-verification gate codified.** New `docs/MISSION-PACKAGE-DISCIPLINE.md` authored as sibling to `SUBSTRATE-PROBE-DISCIPLINE.md` (one abstraction layer up). Sections: pattern statement, source-incident reference (v1.49.634-638 5-cluster chain), mechanical W0 step, re-framing review for chains ≥4 clusters, apply-to-self template, Bayesian discipline note, future tooling support direction. Companion file `docs/test-discipline/cf-closure-verification-templates.md` with 4 probe templates (tool-output, test-marker, config-state, upstream-spec) + hidden-transitive guard pattern. Sibling cross-reference added in `docs/SUBSTRATE-PROBE-DISCIPLINE.md`. Commit `33df8ec0c`.

- **CF-8 — Forward-cadence engine resumption decision: option (b) continue counter-cadence.** Operator decision at W0 close. STS-7 Sally Ride / Challenger NASA degree candidate deferred to v1.49.641+. Engine state remains at NASA 108 / MUS 1.108 / ELC 1.108 / SPS #105 / TRS pack-30. Counter-cadence chain extends to 8 — strongest precedent in this codebase.

- **CF-9 — Phase-2 cartridge shape families: carried forward to Cluster #8 unchanged.** `.planning/cartridge-migration-phase2.md` content snapshot matched predecessor; no work this milestone.

- **W3 post-ship refresh absorption.** Pre-ship working-tree changes from v1.49.639 (`dashboard/index.html` + `docs/RELEASE-HISTORY.md`) landed as first commit of v1.49.640 session at `65d47b72e`. This continues the post-ship-absorb-on-open pattern established at v1.49.638→.639.

- **W3 integration meta-test.** `tests/integration/v1-49-640-meta-test.test.ts` with 12 assertions verifying C1 package.json state + C1 closure records + C2 doc + C2 templates + C2 cross-ref + CF-8 decision + CF-9 record + counter-cadence engine state. Skip-guard pattern per Lesson #10180 for gitignored / user-level paths. Commit `da1ef38e1`.

## Scope-change disclosure

The original mission package framed CF-7 as a straightforward path-routing decision (a/b/c/d/e). Actual execution required a **mid-component pivot**: the operator chose path (b) at W0; execution revealed path (b) only partial; investigation surfaced that the root dep (gsd-pi) was a phantom; operator pivoted to hybrid (b)+(d). This is honest disclosure: the iterative-discovery pattern worked, but it cost ~40min of wall-clock vs the spec's anticipated 30min for a clean path (b).

Two unanticipated direct-dep additions (fast-xml-parser, yaml) also surfaced — both were hidden transitives via the gsd-pi chain that source code in src/ actually imported directly. The hidden-transitive guard pattern was added to `cf-closure-verification-templates.md` as a forward-improvement for future path-d-style root-dep removals.

See `chapter/01-overview.md` "Scope change disclosure" for the full rationale and `chapter/03-retrospective.md` for the hybrid-recovery pattern as a forward lesson candidate.

## Test counts at ship

- TS integration tests added: +12 (v1.49.640 meta-test)
  - C1 invariant tests: +4 (package.json state, closure records)
  - C2 invariant tests: +5 (discipline doc, templates, cross-ref)
  - CF-8 / CF-9 / counter-cadence: +3
- Source changes: 0 (no src/ patches; C1 was a deps-only change)
- Dep changes:
  - REMOVED: `gsd-pi ^2.62.0` (phantom dep; never imported)
  - ADDED: `fast-xml-parser ^5.8.0` (hidden transitive; 3 src/ files import directly)
  - ADDED: `yaml ^<x.x.x>` (hidden transitive; 6 src/ files import directly)
- Doc additions: `docs/MISSION-PACKAGE-DISCIPLINE.md` (NEW); `docs/test-discipline/cf-closure-verification-templates.md` (NEW)
- Doc edits: `docs/SUBSTRATE-PROBE-DISCIPLINE.md` (+sibling cross-ref); `docs/RELEASE-HISTORY.md` (post-ship refresh for v1.49.639); `dashboard/index.html` (post-ship refresh)

CF-7 CLOSED. Lesson #10199 codified. Engine state UNCHANGED.

## Carry-forward to v1.49.641 (Cluster #8 inventory)

3 carry-forwards routed to Cluster #8 (same count as Cluster #7):

- **CF-10 (LOW, decision-deferred):** Forward-cadence engine resumption — STS-7 Sally Ride / Challenger NASA degree candidate. Routes forward from CF-8. May activate at v1.49.641 W0 if operator chooses to end the counter-cadence chain.
- **CF-11 (LOW, continued):** Phase-2 cartridge shape families. Continues CF-9 unchanged. No work expected.
- **CF-12 (LOW, forward-improvement candidate):** `scripts/closure-verify-cf.mjs` tooling (per `MISSION-PACKAGE-DISCIPLINE.md` §1.7) and hidden-transitive guard automation (per `cf-closure-verification-templates.md`). Discretionary; not blocking.

See `chapter/05-carry-forward.md` for the canonical inventory.

## See also

- `chapter/00-summary.md` — narrative summary
- `chapter/01-overview.md` — milestone narrative + scope-change disclosure + why
- `chapter/02-walkthrough.md` — per-component walkthrough with commit anchors + invariants
- `chapter/03-retrospective.md` — what worked / what could be better / operator W0 decision trail
- `chapter/04-lessons.md` — forward lessons emitted (Lessons #10203, #10204) + Lesson #10199 first apply-to-self confirmation
- `chapter/05-carry-forward.md` — Cluster #8 inventory (CF-10 through CF-12)
- `chapter/99-context.md` — cross-references + predecessor pointer + T14 sequence link
- `docs/MISSION-PACKAGE-DISCIPLINE.md` — NEW closure-verification gate discipline doc (Lesson #10199 codified)
- `docs/test-discipline/cf-closure-verification-templates.md` — NEW companion probe templates catalogue
