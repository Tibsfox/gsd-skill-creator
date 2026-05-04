# v1.49.596 — Retrospective: Carryover Lessons Applied + New Lessons

## Carryover lessons applied at v1.49.596

### #10221 — Dev/main sync second-instance test → THIRD-INSTANCE VERIFICATION

Applied at v1.49.596 W4 ship pipeline at every main-merge boundary:
- Boundary 1 (after initial dev→main ship merge): ff-only sync executed; drift = 0 verified
- Boundary 2 (after post-ship RH refresh main merge): ff-only sync executed; drift = 0 verified

**Three-instance soak now complete** (v1.49.594 first + v1.49.595 second + v1.49.596 third all maintained zero-drift across both main-merge boundaries each = 6 consecutive boundary verifications). **PROMOTION TO ESTABLISHED at v1.49.596 close** — discipline upgrades from "third-instance test" to canonical ship-pipeline step. Pre-push hook (advisory at v1.49.594 W0) + 3-line ff-only sync (canonical) + drift verification at session close are the 3 components of the established practice.

### #10222 — Cross-link STRICT mode (BLOCKER cutover at v1.49.595)

Active at v1.49.596 ship. NASA 1.77 hit 13/13 cross-link coverage at first run under STRICT mode. Gate held cleanly. No follow-on hardening needed; pattern remains ESTABLISHED.

### #10215 + #10223 + #10228 — Three-tier recovery hierarchy

Inventory action closed at v1.49.596 W0.4. W2-build-agent-prompt.md now codifies tier 1 continuation-dispatch / tier 2 main-context inline-Edit / tier 3 ScheduleWakeup-deferred resume + recovery decision tree + per-tier success metrics. v1.49.596 ship did NOT trigger any tier-1/2/3 recovery (all W2 dispatches completed normally; no rate-limits encountered). Pattern remains documented but not freshly soaked at v1.49.596.

### #10227 — Composite-pass second-soak deferred to v1.49.596 W0

Done at v1.49.596 W0.2. Pattern replicated for 3rd consecutive soak: NASA helps density-variance; MUS+ELC stay WARN under low-lines. Confirmed #10225 trailing-median refinement is the path forward. Decision: implement #10225 at v1.49.597 W0 (deferred from v1.49.596 due to scope; not blocking ship).

### #10229 — Wave-N word count correlates with source-record citation density

Carried forward from v1.49.595 Wave 2c finding (38,798 words / 121% target / cross-pack citation density driven by ≥5 records per pack). v1.49.596 Wave 3 was an aggregation pass (master-index + part-bundles + coverage-report), not a synthesis wave; correlation framing applies to Wave 2 / 4 / etc. synthesis cycles, not Wave 3 aggregation. Reanalyze at v1.49.597+ if synthesis-wave depth correlation surfaces.

## New lessons emitted at v1.49.596

See `04-lessons.md` for full text. Summary:
- **#10221 PROMOTED to ESTABLISHED** — three-instance soak complete; canonical ship-pipeline step
- **#10230 candidate** — M0 substrate closure cadence (10-milestone arc; per TRS-EXECUTION-MAP.md committed cadence; M0/M1/M2/M3/M4/M5 phase boundaries map cleanly to milestone groups)
- **#10231 candidate** — Iconic-mission depth-recovery pattern (W2 builds at iconic missions outperform predecessors via heightened content density; MUS 1.77 117.6% lines vs MUS 1.76 81% lines = 36-point depth recovery; suggests Tier-2 inline-recovery WARN findings normalize at next iconic-mission iteration without intervention)
- **#10232 candidate** — Cross-track structural-pair INSIDE-window discovery (McCartney INSIDE +6 days of Apollo 13 launch is the first INSIDE-narrow-window MUS pick since v1.74 Apollo 10 era; #10198 fallback rule applied 7 of 8 v1.7N instances; INSIDE-window is the rare case worth flagging for cadence calibration)

## What worked well

- **Pre-staged W0 work parallelism** — composite-pass observation + recovery-pattern documentation done in parallel with mission scaffold before any sub-agent dispatch saved ~10 min wall-clock
- **MISSION-BRIEF.md correction loop** — W1a dossier caught 5 HIGH-tier brief errors in MISSION-BRIEF.md (not just downstream errors); inline correction propagated to W2 build agents prevented downstream propagation
- **G0 single-call multi-question** — 4 G0 decisions in single AskUserQuestion saved 2-3 round-trips
- **W1bc + W2-NASA parallel dispatch** — TRS Wave 3 + NASA build ran concurrently saving ~30 min sequential time

## What ran longer than expected

- **W2-NASA WARN at 88% lines / 85% bytes** — below 95% PASS threshold but above 80% BLOCKER. Acceptable for ship per #10194 fallback. Iconic-mission depth-recovery pattern (#10231) suggests next NASA degree at v1.49.597 may rebound to PASS without intervention.

## Token budget consumed

| Wave | Estimated | Actual | Variance |
|---|---|---|---|
| W0 (mission scaffold + composite-pass + pack-10 + W2 template) | ~30K | ~35K | +17% |
| W1a (Apollo 13 dossier) | ~140K | ~105K | -25% |
| W1bc (TRS M0 Wave 3) | ~120K | ~46K | -62% (read-heavy aggregation) |
| W2 NASA + MUS + ELC | ~330K | ~333K | 0% |
| W3 (catalog updates) | ~10K | ~5K | -50% |
| **Total** | ~630K | ~524K | **-17%** |

W1a + W1bc came in significantly under estimate (read-heavy work; less generation than synthesis waves). Net under-budget for the milestone.
