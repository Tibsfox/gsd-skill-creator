# v1.49.824 — Lessons

## Promoted to ESTABLISHED in this ship

### #10433 — Internal-helper pattern for `ctx?` threading

When migrating a file with many side-effecting call sites to a chokepoint (LoaderContext / EgressContext / ProcessContext), look for an existing internal helper that wraps the side-effecting op. Thread `ctx?: <Context>` through the helper for a 1-LOC delta regardless of how many public functions call the helper. Files without a helper need N `ensure*Allowed` hoists at N call sites.

**Trigger:** Authoring a chip ship (single-file or batch); auditing batch-chip candidates before sizing the batch.

**Evidence:** v1.49.809 intel/analyzer/git.ts (`execGit` helper) + v1.49.820 git/core/branch-manager.ts (`execGit` helper); both ~14 LOC delta total.

**Discipline location:** `docs/security-chokepoints.md` § Internal-helper pattern.

**Manifest:** Added to Security chokepoints entry key_lessons.

### #10434 — Ratchet-ledger pattern (KNOWN_UNWIRED generalization)

The KNOWN_UNWIRED shape (named, visible, ratcheted ledger of out-of-conformance entries with default-BLOCK and per-ship `N → N-K` ratchet) generalizes beyond chokepoints to any cross-cutting observability+enforcement surface where:

1. Current state has N enumerated out-of-conformance entries.
2. Each entry is independently chip-able toward conformance.
3. Operator-driven ratchet replaces a single-step migration.

**Trigger:** Designing a NEW cross-cutting invariant enforcement gate; deciding between "strict gate that fails until 100% conformance" vs "social rule that drifts" vs "ratchet-ledger".

**Evidence:** v1.49.806 chokepoint KNOWN_UNWIRED (38 + 16 entries) + v1.49.821/v1.49.822 discipline-coverage ceiling (UNCODIFIED count = 39, ceiling 41); same shape across 2 instances.

**Discipline location:** `docs/known-unwired-ledger-discipline.md` § Generalization beyond chokepoints.

**Manifest:** Added to KNOWN_UNWIRED allowlists as migration-debt ledger entry key_lessons.

## New lesson candidates (0)

No new lesson candidates opened this ship — codification ships consolidate existing observations rather than generating new ones.

## Tentative observations carried forward

### Eligible for next codify ship (3 still tracked at 2+ instances)

| Observation | Instances | Notes |
|---|---|---|
| Codification-ship pattern | 5 | Meta-pattern; arguably already implicit in #10428 meta-cadence discipline. Defer separate promotion unless naming benefit clearly emerges. |
| Chokepoint pattern | 4 | Already covered by #10414 (optional ctx? param) + #10426 (cross-class registry at 2nd instance) + Security chokepoints discipline. Defer separate promotion. |
| Cross-rootdir wire pattern | 1 strong | From v1.49.823 ObservationBridge wire. Wait for 2nd instance per #10426. |

### Below 2-instance threshold (~11-14 individual observations from v816-823 chain)

Tracked in the chain handoff §Lesson backlog. Most are reaffirmations or per-ship refinements of existing patterns; few are independent new observations.

## Cadence observation

This is the first codify ship since v1.49.814 (10 ships ago). The #10428 meta-cadence rule specifies ~7-10 forward ships per codify cadence — this ship is at the UPPER bound. The 10-ship gap is acceptable but indicates the codify cadence drifted slightly toward "consume" axis during the v816-823 chain (T2.3 wedge closures + T2.2 audit close + chip work were all consume-axis ships).

Forward expectation: next codify ship at ~v832-834 if the v824-826 chain proceeds and the next planning cycle stays consume-heavy.
