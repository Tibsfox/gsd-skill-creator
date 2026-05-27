> Following v1.49.813 — _Post-T14-reset STATE.md Drift Closure: Atomic Writer Tool_, v1.49.814 promotes 2 tentative observations to ESTABLISHED lessons (codification ship per #10428): #10431 Two-layer closure for procedure-rooted drift (from the v807+v813 case study) and #10432 KNOWN_UNWIRED allowlists as migration-debt ledger (from the v806/v809/v811/v812 chip cadence). Adds 2 canonical discipline docs + 2 manifest entries; regenerates CLAUDE.md. Closes the v810-814 chain at 5 of 5 ships.

# v1.49.814 — Codification Ship: Promote #10431 + #10432

**Shipped:** 2026-05-27

Fifth and final ship of the v810-814 chain. Codification ship per the #10428 meta-cadence overdue-codify-axis trigger. Promotes 2 lessons that were observed across this chain (and earlier ships) with clear evidence to ESTABLISHED status; both gain canonical docs and manifest entries.

## What shipped

- **NEW** `docs/two-layer-closure-discipline.md` — codifies #10431 (Two-layer closure for procedure-rooted drift). Rule: when a drift class originates from operator-discretion procedure, complete closure requires BOTH source eliminator AND detector gate. Case study: v807 + v813 STATE.md drift closure.
- **NEW** `docs/known-unwired-ledger-discipline.md` — codifies #10432 (KNOWN_UNWIRED allowlists as migration-debt ledger). Rule: when an audit-test grandfathers existing call sites, the allowlist is debt-not-exemption; chips ratchet it toward zero. Case study: v806 introduction + v809/v811/v812 chip cadence.
- **MODIFIED** `tools/render-claude-md/disciplines.json` — adds 2 manifest entries (20 → 22). Each entry specifies the trigger, summary, canonical docs, key lessons, and codified-at-milestone.
- **MODIFIED** `CLAUDE.md` — regenerated via `npm run render:claude-md`. Operative-disciplines section now lists 22 disciplines (was 20).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| (no new tests) | 0 | Documentation + manifest + regenerated section only |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 32 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Manifest entries: **20 → 22** (+2: Two-layer closure for procedure-rooted drift; KNOWN_UNWIRED allowlists as migration-debt ledger).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: **8 → ~6** (2 promoted: #10431, #10432; ~8 new from this chain folded into the carry-forward count; net: ~14 minus 2 = ~12 if all v810-814 new observations are counted forward, or ~6 if the chain's new ones already merged into the carried set).

Per the audit-retrospective sweep convention, the v814 codification audit explicitly addressed:
- The 8 tentative observations from the v807-809 handoff (1 promoted: STATE.md normalizer drift, now #10431; 7 carry forward unchanged or refined)
- The ~8 new observations from this chain (1 promoted: instanceof check pattern at 2 instances — already covered by existing #10426; 1 closely related to #10432 — promoted as #10432; rest carry forward)

## Promotions in detail

### #10431 — Two-layer closure for procedure-rooted drift

**Evidence:** v807 added the detector for STATE.md normalizer drift; v813 added the source eliminator. Both layers shipped together as a structurally complete closure. Without the v813 source eliminator, the v807 detector would have remained the partial-closure that the v810-814 chain handoff explicitly flagged as forward-observation-flagged-for-next-counter-cadence.

**Codification target:** any future counter-cadence ship targeting a procedure-rooted drift class should architect both layers BEFORE shipping either. The discipline doc enumerates how to identify the drift origin, how to build the source eliminator, how to confirm the detector exists or build it, and the anti-patterns (one-layer-only, silent-detector, source-without-post-condition-check).

**Cross-references:** #10414 (Gate-not-vigilance — this discipline is the structural version for procedure-rooted drift specifically), #10427 (Failure-mode contracts — both layers must specify their failure modes loudly).

### #10432 — KNOWN_UNWIRED allowlists as migration-debt ledger

**Evidence:** v806 introduced the pattern with `EgressContext.KNOWN_UNWIRED` (16 entries) and `ProcessContext.KNOWN_UNWIRED` (38 entries). v809 chipped npm.ts (16 → 15). v811 batch-chipped 4 sibling registry adapters (15 → 11). v812 chipped intelligence/analyzer/git.ts (38 → 37). The pattern was applied uniformly across 4 ships before promotion.

**Codification target:** any future cross-cutting audit-test introduced on `src/` MUST use the KNOWN_UNWIRED ledger pattern to grandfather existing call sites. The discipline doc enumerates the audit-test shape, the per-ship release-notes convention, the periodic batch-down cadence, and the forward observations (unidirectional enforcement asymmetry; block-comment consolidation at N-of-N siblings wired; audit-test as observability surface).

**Cross-references:** #10414 (Gate-not-vigilance — KNOWN_UNWIRED is the deterministic inventory of procedure-discipline applicability), #10416 (Lightest wire — per-chip wire is the minimum viable migration), #10422 (Verdict-pattern surface separation), #10426 (Cross-class registry extraction at 2nd instance — motivated v806 codification), #10427 (Failure-mode contracts — hoist `ensure*Allowed` outside swallow catches).

## Forward path (post-chain)

The v810-814 chain CLOSES at v814. Open next-session selections:

1. **Batch chip aminet family ProcessContext** (5 files) — apply v811 batch pattern to ProcessContext. ~25-30 min.
2. **NASA 1.179 forward-cadence** — 32 consecutive at 1.178. Most visible open item.
3. **PROJECT.md hand-edit drift atomic-writer** (~30 min) — apply #10431 two-layer-closure to the PROJECT.md drift class. Smaller scope than STATE.md (PROJECT prose is operator-authored; only the version-number line is template-able).
4. **T1.3 Ship 2 = Option B** (~55 min) — ObservationBridge wire into dashboard/activity-tab-toggle.ts (Phase 2 of T1.3 GAP-2 closure).
5. **First ProcessContext chip in git/core family** — 4 entries (branch-manager, repo-manager, state-machine, sync-manager). Establishes the family-specific shape for a future 4-adapter batch chip.

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip.
- Not a substrate addition or new tooling. Pure documentation + manifest + regenerated CLAUDE.md.
- Not a refactor of the existing 20 disciplines.
