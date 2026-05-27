# v1.49.824 — Context

## Provenance

This ship was selected as the first ship of the v824-826 chain (Codify → git/core batch → T1.3 Ship 3) based on operator selection from the v816-823 chain handoff's "Highest-ROI next ship candidates" list (items 2, 3, 4).

Codify ship rationale:
- #10428 meta-cadence specifies ~7-10 ships per codify cadence.
- Last codify ship: v1.49.814 (Promote #10431 + #10432).
- Ships since last codify: 10 (v815, v816, v817, v818, v819, v820, v821, v822, v823, v824) — at the upper bound.
- Tentative observations accumulated: ~13-16 (per v823 handoff).
- 2 observations at clean 2-instance threshold per #10426 rule.

## What this ship promotes

| Tentative observation | Instance 1 | Instance 2 | Promoted to | New lesson ID |
|---|---|---|---|---|
| Internal-helper pattern for chokepoint wiring | v1.49.809 intel/analyzer/git.ts (execGit) | v1.49.820 git/core/branch-manager.ts (execGit) | docs/security-chokepoints.md § Internal-helper pattern | #10433 |
| Ratchet-ledger pattern beyond chokepoints | v1.49.806 chokepoint KNOWN_UNWIRED | v1.49.821+v822 discipline-coverage ceiling | docs/known-unwired-ledger-discipline.md § Generalization beyond chokepoints | #10434 |

## Discipline-extension vs new-domain choice

This ship EXTENDS 2 existing disciplines rather than creating NEW domains. The decision tree was:

1. **Does the observation fit naturally under an existing domain?**
   - #10433 (internal-helper pattern) — YES, naturally under "Security chokepoints" (it's a tactic for HOW to wire chokepoints).
   - #10434 (ratchet-ledger generalization) — YES, naturally under "KNOWN_UNWIRED allowlists" (it's the GENERALIZATION of that exact pattern).

2. **Would creating a new domain improve discoverability?**
   - For #10433 — operators looking for chip-ship guidance would look under Security chokepoints first. A separate "Wiring tactics" domain would split the discoverability surface.
   - For #10434 — operators reaching for the ratchet-ledger shape would either know the original chokepoint pattern OR be designing a new invariant. In both cases, the KNOWN_UNWIRED discipline doc is the natural starting point.

3. **Conclusion:** Extension is cheaper AND keeps discoverability concentrated.

Manifest entry count stays at 22. Total lessons in manifest grows by 2 (75 → 77).

## What was deferred

- **Codification-ship pattern** (5 instances) — meta-pattern. Arguably implicit in #10428 meta-cadence discipline. Defer unless a naming benefit clearly emerges.
- **Chokepoint pattern** (4 instances) — already covered by #10414 + #10426 + Security chokepoints discipline. No separate promotion needed.
- **Cross-rootdir wire pattern** (1 strong instance from v823) — wait for 2nd instance per #10426 rule. Don't break the rule even when the pattern feels well-shaped.

## Verification trail

- Pre-edit: manifest entries 22, lessons in manifest 75, UNCODIFIED 39.
- Post-edit: manifest entries 22, lessons in manifest 77, UNCODIFIED 39.
- CLAUDE.md regenerated; both new lessons render in the respective domain entries.
- `python3 -c "import json; json.load(...)"` validates JSON.
- `npm run build` clean (no source changes).
- Pre-tag-gate run pending T14 sequence.

## Forward path

- v825 (next): git/core 3-file batch ProcessContext. Forward-tests #10433 at family-batch scale (3 files; predicted ~3 × ~14 LOC = ~42 LOC total).
- v826 (chain end): T1.3 Ship 3 = Option A (gnn-predictor wire into a skill-activation call site).

## References

- v816-823 chain handoff: `.planning/HANDOFF-2026-05-27-v1.49.816-823-chain-8-ships-shipped.md`
- Previous codify ship: v1.49.814 (`docs/release-notes/v1.49.814/`)
- Manifest: `tools/render-claude-md/disciplines.json`
- Render tool: `tools/render-claude-md.mjs`
- Discipline-coverage check: `tools/check-discipline-coverage.mjs`
