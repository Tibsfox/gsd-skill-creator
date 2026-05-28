# v1.49.856 — Lessons

## Tentative observations (below promotion threshold)

### Verify-ship pair within one campaign

**Instances: 1 (v848-v856 campaign with v854 + v856 verify ships)**

**Observation:** The v848-v856 campaign included TWO verify-overdue ships (v854 for v843 mesh family + v856 for v846 substrate-auto-emit). Both #10438 applications fit within one campaign cluster — the discipline is reproducible, not just possible. Cluster-internal verify cadence demonstrates that verify-overdue gaps can productively batch when ≥2 exist at campaign-open.

**Why below threshold:** First instance of an explicitly-clustered verify-ship pair. The v829 + v832 instances that originally evidenced #10438 were in separate campaigns; v854 + v856 are the first within-one-campaign pair.

**Promotion gate:** 2nd instance of a campaign cluster including ≥2 verify-overdue ships.

**Likely classification:** Refinement of #10438 (verify-axis) — possibly a campaign-planning sub-rule: "When campaign-open has ≥2 verify-overdue items, batch them within the same campaign cluster rather than serializing across campaigns."

## Carried-forward codification-ready

- **Stale-entry detection inverse-audit tool** (v834 + v852, 2 instances) — UNCHANGED, codification-ready for next codify ship (likely ~v860-867 per #10428 codify cadence).

## No promotions this ship

v856 is verify-ship scope; not codification scope. The new observation is below threshold; the carried codification-ready observation is held for the next codify ship.

## Campaign-close cross-references

**v848-v856 campaign tentative-observation summary** (all carried-forward 1-instance candidates from across the campaign):

- Help-coverage drift as a tracked metric (v848, 1 instance)
- Command docstrings as one-liner source-of-truth (v848, 1 instance)
- `defaultProcessContext(sink)` signature gotcha (v849, 1 instance)
- Chip-release-notes scaffolding script (v850, 1 instance; reinforced v851 — not codified)
- DI-executor + tokenized-argv variant not exercised in chip campaign (v853, 1 instance)
- Real-git temp-repo integration-test pattern (v854, 1 instance)
- Forward-flag back-reference pattern (v855, 1 instance)
- Verify-ship pair within one campaign (v856, 1 instance — this ship)

**Codification-ready (2-instance threshold met):**
- Stale-entry detection inverse-audit tool (v834 + v852)

**Next codify ship candidate window:** ~v860-v867 per #10428 codify cadence (7-10 ships per codify). The single eligible candidate (stale-entry inverse-audit) plus any new 2nd-instance observations accumulating between v857-v863 set the codify scope.
