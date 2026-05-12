# v1.49.641 — Housekeeping Cluster #8

**Released:** 2026-05-12 (pending operator G3 authorization)
**Type:** counter-cadence housekeeping cluster (NOT a NASA degree)
**Predecessor:** v1.49.640 (Housekeeping Cluster #7)
**Source vision:** v1.49.640 carry-forward chapter (`docs/release-notes/v1.49.640/chapter/05-carry-forward.md`) — 3-item Cluster #8 inventory
**Engine state:** UNCHANGED (CF-10 routed decision-deferred again; no NASA / MUS / ELC / SPS / TRS forward-cadence content)

## Summary

v1.49.641 is the **ninth counter-cadence cleanup milestone** in the engine chain (preceded by v1.49.585 / .634 / .635 / .636 / .637 / .638 / .639 / .640). It closes 2 of 3 carry-forwards from Cluster #7 and demonstrates Lesson #10199 §1.4 (re-framing review) catching a 5-cluster framing error in action:

- **C1 (CF-11) — Phase-2 cartridge shape families RETIRED via §1.4 re-framing review.** Probes confirmed the original framing was wrong: the 7 "unfit chipsets" aren't loaded at runtime; the migration target `department-adapter` is only referenced by the `cartridge migrate` CLI subcommand; nothing enforces migration; one of the 7 (math-coprocessor) was already promoted out to `coprocessors/math/`. 5-cluster carry-forward retired; future cartridge work re-scopes as a new concern if/when needed. Documented at `.planning/c0-cf11-reframing-review.md`.

- **C2 (CF-12) — `scripts/closure-verify-cf.mjs` codifies Lesson #10199 W0 gate as executable tool.** Five probe types (npm-audit, file-snapshot, upstream-version, test-marker, hidden-transitive-guard) covering the four CF shape categories from `cf-closure-verification-templates.md` plus the Lesson #10204 pre-flight guard. Each probe writes a structured record to `.planning/c0-<CF-id>-closure-verification-record.md`. 9 invariant tests at `tests/__tests__/closure-verify-cf.test.ts`. Commit `6c2dafdfa`.

- **CF-10 — Forward-cadence engine resumption deferred again.** STS-7 Sally Ride / Challenger candidate routes forward to v1.49.642+. Counter-cadence chain extends to 9 — strongest precedent in this codebase.

- **W3 post-ship refresh.** v1.49.640 working-tree changes (dashboard + RH) absorbed at `8c35f4832`. 3rd consecutive cluster applying the absorb-on-open pattern.

- **W3 integration meta-test.** 8 invariants at `tests/integration/v1-49-641-meta-test.test.ts`. Commit `cfd3ddcf6`.

## Scope-change disclosure

CF-11 was originally framed as Phase-2 cartridge migration work. The §1.4 re-framing review (Lesson #10199 forward-applicability) discovered the framing was wrong before any code work happened — saving the cluster from another iteration on a stale framing. This is the FIRST application of §1.4 since the discipline was codified at v1.49.640 C2. The discipline worked exactly as designed: a 5-cluster carry produced no closure → review the framing → discover the framing was wrong → retire rather than iterate.

CF-12 was originally framed as 3 forward-improvements (closure-verify tool + hidden-transitive guard automation + vitest reporter research). C2 implementation combined (a) + (b) into a single tool (the hidden-transitive guard is now `--probe hidden-transitive-guard`). (c) vitest reporter became a documentation note in `cf-closure-verification-templates.md` recommending `tap-flat` reporter for background runs.

## Test counts at ship

- TS integration tests added: +17 across C2 + meta-test
  - C2 closure-verify-cf invariant tests: +9 (covers all 5 probe types + usage)
  - Meta-test: +8 (some skip-guarded for environment portability)
- Source changes: 0 in src/; new tooling at scripts/closure-verify-cf.mjs
- Doc additions: 0 NEW files; edits to MISSION-PACKAGE-DISCIPLINE.md §1.7 + cf-closure-verification-templates.md

**CF-11 RETIRED via re-framing review. CF-12 CLOSED via tool implementation. Engine state UNCHANGED.**

## Carry-forward to v1.49.642 (Cluster #9 inventory)

2 carry-forwards routed (down from Cluster #8's 3):

- **CF-13 (LOW, decision-deferred):** Forward-cadence engine resumption — STS-7 Sally Ride / Challenger NASA degree. Routes forward unchanged from CF-10. May activate at v1.49.642 W0.
- **CF-14 (LOW, forward-improvement candidate):** Per-CF probe spec format (YAML at `.planning/cf-probes/<CF-id>.yaml`) so each CF carries its own probe spec rather than relying on operator to know which probe type matches. Mentioned in MISSION-PACKAGE-DISCIPLINE.md §1.7 as discretionary.

CF-11 ELIMINATED from the carry-forward stream. The CF inventory shrunk from 3 → 2.

## See also

- `chapter/00-summary.md` — narrative summary
- `chapter/01-overview.md` — full narrative + §1.4 re-framing review as cluster's identity
- `chapter/02-walkthrough.md` — per-component walkthrough with commit anchors + invariants
- `chapter/03-retrospective.md` — what worked / forward improvements
- `chapter/04-lessons.md` — Lesson #10199 §1.4 first apply-to-self + Lesson #10204 codified in tool
- `chapter/05-carry-forward.md` — Cluster #9 inventory (CF-13, CF-14)
- `chapter/99-context.md` — cross-references + predecessor pointer + T14 sequence link
- `scripts/closure-verify-cf.mjs` — NEW closure-verification probe runner (CF-12 deliverable)
- `.planning/c0-cf11-reframing-review.md` — NEW canonical §1.4 application example (gitignored)
