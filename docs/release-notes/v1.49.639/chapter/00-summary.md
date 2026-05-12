# 00 — Summary: v1.49.639 Housekeeping Cluster #6

## What shipped

**6 components closed + integration meta-test + 5+1 release-notes.**

Counter-cadence operational-debt cluster — 7th in the engine chain (.585 / .634 / .635 / .636 / .637 / .638 / **THIS**). All 6 carry-forwards routed from v1.49.638 are CLOSED. Engine state UNCHANGED.

## The 6 closures at a glance

| CF | Component | Mechanism | Outcome |
|---|---|---|---|
| CF-1 | C1 self-mod-guard CI diagnostic | Path A in-hook tracing | CLOSED via informative null result + recognition of pre-existing skip-guard |
| CF-2 | C1 paired diagnostic substrate | TRACE instrumentation | CLOSED — produced definitive null signal; reverted post-finding |
| CF-3 | C5 Lesson #10197 promotion | 3-branch decision tree | CLOSED with disconfirmation (Branch ii); lesson stays as regular |
| CF-4 | C2 audit-method correction | Discipline doc §2.4 + inventory | CLOSED via codification of grep adjacency-check requirement |
| CF-5 | C3 pr-review-gate retirement | Project-aware conversion (operator override) | CLOSED via whitelist (gsd-build/gsd-2/gsd-pi only) |
| CF-6 | C4 source-side ORDER-BY tiebreakers | 3 surgical patches | CLOSED via option (a) land per W0 design |

## The headline finding

**CF-1 was already resolved before v1.49.639 began.** The 5-cluster carry-forward chain (v1.49.634 → .635 → .636 → .637 → .638) framed the issue as "self-mod-guard CI install gap"; investigation at v1.49.639 C1 revealed:

1. The hook is gitignored in CI by design (`.gitignore:9` excludes all of `.claude/`)
2. The 2 originally-failing tests use `it.runIf(HOOK_AVAILABLE)` skip-guard pattern
3. In CI, `HOOK_AVAILABLE` is false; tests gracefully skip
4. CI shows 30,285/30,285 PASS; ZERO TRACE markers (hook not invoked at all)

The 6th-defer escalation rule was pre-authorized but not invoked — its premise (5 prior defers without closure) was wrong. CF-1 had been closed via skip-guard pattern; the carry-forward channel had simply not been updated.

This is the kind of multi-cluster framing-error pattern that surfaces as a forward lesson candidate at chapter 04-lessons.md.

## Engine state baseline

| Substrate | v1.49.638 | v1.49.639 | Delta |
|---|---|---|---|
| NASA degree | 108 | 108 | 0 (counter-cadence) |
| MUS pack | 108 | 108 | 0 |
| ELC degree | 108 | 108 | 0 |
| SPS index | #105 | #105 | 0 |
| TRS pack | pack-30 | pack-30 | 0 |
| Last degree-advancing | v1.49.631 | v1.49.631 | unchanged |

Forward-cadence engine resumption candidate: STS-7 Sally Ride / Challenger at v1.49.640+.

## Test surface delta

- **Net new TS tests:** +13 (C2 ×4, C3 ×2, C4 ×2, meta-test ×7; one C2 test overlaps in surface with meta-test)
- **Net new Rust tests:** 0
- **Net new tools tests:** 0
- **Source patches:** 3 ORDER-BY tiebreakers in `src/intelligence/kb/store.ts` (lines 301/871/916)
- **Doc revisions:** `docs/SUBSTRATE-PROBE-DISCIPLINE.md` (+§2.4); `docs/test-discipline/audit-method-corrections.md` NEW
- **Hook revert:** TRACE instrumentation removed from `project-claude/hooks/self-mod-guard.js` post-finding
- **User-level config edit:** `~/.claude/hooks/pr-review-gate.sh` project-aware whitelist (OUTSIDE this repo; tracked via `.planning/pr-review-gate-conversion-record.md`)

Vitest total at ship: ≥30,290 (baseline 30,285 + meta-test +7 - some test-count adjustments).

## Activation profile (actual vs spec)

| Phase | Spec mode | Actual | Notes |
|---|---|---|---|
| W0 | ~7-10k | ~12k | Substrate probes surfaced 2 spec corrections (C3 USER-LEVEL substrate; C4 line-numbers) |
| W1A (C1) | ~50k | ~30k | Faster than spec — finding was a definitive null, not requiring multi-iteration debugging |
| W1B (C2+C3) | ~20k | ~25k | C3 added project-aware design + invariant test beyond original retire-only spec |
| W1C (C4) | ~15-30k | ~12k | Bounded scope (3 sites, not 7); fast |
| W2 (C5) | ~8k | ~5k | Mechanical 3-branch decision; operator routed |
| W3 (C6) | ~50k | (in progress) | Meta-test + release-notes |
| **Total** | **~150-170k** | **~85k + W3** | Likely ~135k at ship |

## What's next at C6

- ✓ Integration meta-test (7 invariants; PASS locally; commit `fd47bb63e`)
- → 5+1 release-notes (this milestone's chapter — IN PROGRESS)
- → Pre-tag-gate composite verify
- → T13 quality-bar verdict
- → Operator G3 authorization (T14 atomic ship)

## See also

- `01-overview.md` — full narrative + scope-change disclosure
- `02-walkthrough.md` — per-component walkthrough with commit anchors
- `03-retrospective.md` — what worked / cycles burned / forward lessons
- `04-lessons.md` — forward lessons #10199+ + Lesson #10197 disconfirmation note
- `05-carry-forward.md` — Cluster #7 inventory (CF-7 through CF-9)
- `99-context.md` — cross-references and pointers
