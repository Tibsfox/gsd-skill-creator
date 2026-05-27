> Following v1.49.823 — _T1.3 Ship 2: ObservationBridge Wire (Cross-Rootdir Interface Pattern)_, v1.49.824 promotes 2 tentative observations to ESTABLISHED lessons (codification ship per #10428 ~7-10-ship cadence; first codify ship since v814, 10 ships ago). Extends two existing disciplines with new lessons + canonical-doc sections rather than introducing new domains. Lessons #10433 + #10434 land.

# v1.49.824 — Codification Ship: Promote #10433 + #10434

**Shipped:** 2026-05-27

First ship of the v824-826 chain. Codification ship per #10428 meta-cadence — overdue by 10 ships (last codify ship was v814; cadence rule is ~7-10 ships). Promotes 2 tentative observations that reached 2-instance threshold per #10426 cross-class-registry-extraction rule.

## What shipped

- **MODIFIED** `docs/security-chokepoints.md` — adds "Internal-helper pattern for `ctx?` threading (Lesson #10433)" section between "How to migrate" and "Anti-patterns". Includes the case-study table (v809 intel/analyzer/git + v820 git/core/branch-manager), the implication for batch-chip planning, and the promotion-threshold note. Updates Cross-references to include #10433.
- **MODIFIED** `docs/known-unwired-ledger-discipline.md` — adds "Generalization beyond chokepoints (Lesson #10434)" section under "Forward observations". Includes side-by-side comparison table (chokepoint KNOWN_UNWIRED at v806 vs discipline-coverage ceiling at v821+v822), the "when to reach for this generalization" criteria, and the anti-generalization cases.
- **MODIFIED** `tools/render-claude-md/disciplines.json`:
  - Security chokepoints entry: append `#10433` to key_lessons (`#10414, #10426, #10427` → `#10414, #10426, #10427, #10433`); extend summary with internal-helper pattern note; append v1.49.824 codification record to codified_at_milestone.
  - KNOWN_UNWIRED entry: append `#10434` to key_lessons (`#10432` → `#10432, #10434`); extend summary with generalization-beyond-chokepoints note; append v1.49.824 codification record to codified_at_milestone.
- **MODIFIED** `CLAUDE.md` — regenerated via `npm run render:claude-md`. Operative-disciplines section now references #10433 + #10434 in their respective domain entries.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| (no new tests) | 0 | Documentation + manifest + regenerated section only |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **42 consecutive ships at 1.178**). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — extensions to existing entries, not new domains).
Total lessons referenced in manifest: **75 → 77** (+2: #10433, #10434).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~13-16 → ~11-14 (2 promoted; rest carry forward).
Wired calibratable thresholds: **5 of 6** (UNCHANGED).
KNOWN_UNWIRED Process: **31** (UNCHANGED — chip work continues in v825).

## Promotions in detail

### #10433 — Internal-helper pattern for `ctx?` threading

**Evidence (2 instances, 2nd-instance threshold per #10426):**

- **v1.49.809** wired `src/intelligence/analyzer/git.ts` via its existing `execGit` internal helper. The helper accepts `ctx?: ProcessContext`; all 4 public functions that spawn-via-helper threaded `ctx?` down. Total wire cost: ~14 LOC delta + audit-test allowlist edit.
- **v1.49.820** wired `src/git/core/branch-manager.ts` via the SAME shape — internal `execGit` helper accepting `ctx?`, 4 public functions threading down, 10 call-site updates. Total wire cost: ~14 LOC delta.

The shape is structurally identical across the 2 instances despite different domains (analyzer vs core git). The reusability signal — same wire pattern, same LOC delta, same audit-test edit shape — meets the #10426 cross-class-registry-extraction threshold.

**Codification target:** any future batch-chip planning should audit candidate files for an internal helper BEFORE sizing the batch. Files with helpers fit naturally into a batch (~1 LOC × N callsites); files without need a full single-file ship (~N LOC × N callsites). v825 git/core 3-file batch (next ship in this chain) is a forward test of this discipline.

**Cross-references:** #10414 (Optional `ctx?` parameter as the cheapest retrofit), #10416 (Lightest wire), #10426 (Cross-class registry extraction at 2nd instance — the threshold rule cited for promotion), #10432 (KNOWN_UNWIRED ledger — the per-chip update target).

### #10434 — Ratchet-ledger pattern (KNOWN_UNWIRED generalization beyond chokepoints)

**Evidence (2 instances, 2nd-instance threshold per #10426):**

- **v1.49.806** introduced the KNOWN_UNWIRED pattern with `EgressContext.KNOWN_UNWIRED` (16 entries) and `ProcessContext.KNOWN_UNWIRED` (38 entries). Ratchet mechanism via per-chip-ship release-notes `N → N-K`. Asymptote-to-zero discipline.
- **v1.49.821 + v1.49.822** introduced the discipline-coverage ceiling — `SC_DISCIPLINE_COVERAGE_CEILING` env var defaulting to 41 (current UNCODIFIED count 39 + 2-entry buffer). Same shape: current-state count, ceiling threshold, per-codify-ship ratchet, default-BLOCK with operator-visible opt-out.

The structural pattern — ledger of out-of-conformance entries, ratchet via per-ship reductions, default-BLOCK with explicit opt-out — is reusable beyond chokepoints. v821+v822 confirms it works for any cross-cutting observability+enforcement surface where:

1. The current state has N out-of-conformance entries.
2. Each entry is independently chip-able toward conformance.
3. Operator-driven ratchet replaces a single-step migration.

**Codification target:** future cross-cutting invariants enforced against a mature codebase should reach for the ratchet-ledger shape (this generalization) over either (a) strict gates that fail until 100% conformance OR (b) social rules that drift. The discipline doc enumerates the per-axis decision (chokepoint vs ceiling) and the anti-generalization cases.

**Cross-references:** #10414 (Gate-not-vigilance — the ratchet-ledger is gate-as-data realized for cross-cutting work), #10422 (Verdict-pattern surface separation — observability surface and decision surface remain separate), #10426 (Cross-class registry extraction at 2nd instance — the threshold rule cited for promotion), #10428 (Meta-cadence — the codify axis is the trigger for promoting tentative observations once 2nd-instance threshold is hit), #10432 (KNOWN_UNWIRED ledger — the parent discipline this extends).

## Tentative observations carried forward (post-v824)

The handoff listed ~13-16 carried-forward observations at chain-start. After 2 promotions:

**Promoted in v824:**
- Internal-helper pattern for chokepoint wiring → #10433
- KNOWN_UNWIRED-style ledger generalization → #10434

**Carried forward eligible for next codify ship (3 still tracked):**
- codification-ship pattern at 5 instances (meta-pattern; arguably already implicit in #10428)
- chokepoint pattern at 4 instances (already partially covered by #10414 + #10426; may not need separate promotion)
- cross-rootdir wire pattern (1 strong instance from v823; wait for 2nd instance per #10426)

**Carried forward below threshold (~8-10 individual observations):**
- The v816-823 chain's per-ship tentative observations (most reaffirm existing patterns; tracked in §Lesson backlog of the chain handoff)

Next codify ship expected at ~v832-834 per #10428 ~7-10-ship cadence (assuming chain proceeds with consume/calibrate ships through then).

## What this ship is not

- Not a chokepoint chip (KNOWN_UNWIRED Process unchanged at 31).
- Not a NASA degree advance (still 1.178; now 42 consecutive ships at 1.178).
- Not a new discipline domain (manifest stays at 22 entries — extensions to existing entries only).
- Not a runtime test of #10433 (v825 is the first forward-test — git/core 3-file batch will demonstrate the internal-helper pattern at family-batch scale).

## Verification

- `python3 -c "import json; json.load(open('tools/render-claude-md/disciplines.json'))"` → JSON OK.
- `npm run render:claude-md` → CLAUDE.md updated cleanly; new lessons render in the appropriate domain entries.
- `npm run build` → clean (no source changes, but build was run to confirm no incidental breakage).
- `node tools/check-discipline-coverage.mjs` → 22 manifest entries / 77 lessons / 69 COVERED / 8 PARTIAL / 39 UNCODIFIED (unchanged; new lessons render as COVERED on next release-notes scan).
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling 39 ≤ 41 PASS).

## Forward path post-v824 (chain continues)

The v824-826 chain continues:

1. **v825** — git/core 3-file batch ProcessContext (repo-manager + state-machine + sync-manager). Forward-tests #10433 at family-batch scale. Brings Process KNOWN_UNWIRED 31 → 28.
2. **v826** — T1.3 Ship 3 = Option A (gnn-predictor wire into a skill-activation call site). Closes a different branch of T1.3 GAP-2 substrate-to-consumer wiring.

After the chain closes (~v826), forward-path options remain unchanged from the v823 handoff: NASA 1.179, further git/core or dogfood/scribe chips, T1.3 application-boundary wire, T2.1 v1.50 decision.
