> Following v1.49.868 — _Codification Ship: Promote #10444 (Size-Ascending Chip-Pick Reveals Wire-Shape Diversity) + Refine #10443 (Continuous-Verification Mode)_, v1.49.869 is the **second ship of the v868-v882 follow-on campaign**. Integrates the v857 cross-audit tool as `pre-tag-gate.sh` step 18/18, promoting the v868-codified continuous-verification discipline from operator-invoked to a deterministic gate. Adds a meta-test (`tests/integration/v1-49-869-meta-test.test.ts`) verifying the gate is correctly wired.

# v1.49.869 — Pre-tag-gate Integration: Cross-Audit Tool as Step 18/18 (Deterministic Gate)

**Shipped:** 2026-05-28

Promotes the v1.49.868-codified continuous-verification mode (refinement of Lesson #10443) from operator-invoked to a deterministic pre-tag-gate step. The cross-audit tool (`tools/security/check-stale-known-unwired.mjs`, shipped at v857) ran clean across 10 consecutive chip ships (v858-v867) with 1 self-bug-fix at instance 10; the operational discipline is now codified as gate-not-vigilance.

## What shipped

- **MODIFIED** `tools/pre-tag-gate.sh`:
  - Added new `# ----- step 18/18: KNOWN_UNWIRED stale-entry cross-audit (v1.49.869) -----` block between the existing step 17/17 (PROJECT.md drift check) and the final summary message.
  - The new step invokes `node tools/security/check-stale-known-unwired.mjs`; exit 0 = clean; non-zero = stale entry surfaced → ship blocked.
  - BLOCKER by default. Override via `SC_PRE_TAG_GATE_BYPASS=stale-known-unwired` (emergency only — fix the stale entry).
  - Updated final summary from `all 17 checks PASS` to `all 18 checks PASS`.
- **NEW** `tests/integration/v1-49-869-meta-test.test.ts` — 3 test cases:
  - C1: pre-tag-gate.sh exposes step 18/18 with documented label + tool invocation + bypass env-var + exit-20 + diagnose command.
  - C2: final summary reports "all 18 checks PASS" (was "all 17 checks PASS" pre-v869).
  - C3: step 18 cross-audit appears after step 17 PROJECT.md drift check (textual order verification).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tests/integration/v1-49-869-meta-test.test.ts` | NEW; +3 cases | Verifies the new gate step is wired + final summary count updated + step ordering preserved |

The existing `tests/security/check-stale-known-unwired.test.ts` (6 cases, ships at v857) continues to verify the cross-audit tool's behavior. Pre-tag-gate's invocation is a shell-level wrapper — no additional test surface required for the integration itself beyond the meta-test.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **87 consecutive ships at 1.178**; was 86 entering this ship).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23 → 23** (UNCHANGED — gate-step addition is wiring, not a new discipline).
Lessons in manifest (unique): **85 → 85** (UNCHANGED — this ship operationalizes #10443 codification from v868, not a new lesson).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
KNOWN_UNWIRED Process: **6** (UNCHANGED). Egress: **6** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
Operational axes: **4** (UNCHANGED; gate-integration is operationalization of existing #10443 codification at v868).

Pre-tag-gate step count: **17 → 18** (+1: KNOWN_UNWIRED stale-entry cross-audit).

## What this ship is not

- Not a NASA degree advance (still 1.178; now 87 consecutive ships).
- Not a chokepoint chip (KNOWN_UNWIRED Process + Egress UNCHANGED at 6 each).
- Not a new discipline domain (manifest stays at 23 entries; gate-step is wiring).
- Not a new lesson promotion (#10443 was refined at v868; this ship operationalizes that refinement).
- Not a counter-cadence ship (counter-cadence count unchanged at 6).

## Verification

- `bash tools/pre-tag-gate.sh` → 18/18 PASS (this ship's pre-tag-gate run exercises step 18 against itself).
- `node tools/security/check-stale-known-unwired.mjs` → exit 0 (clean against current allowlists; ProcessContext entryCount 6, EgressContext entryCount 6).
- `npx vitest run tests/integration/v1-49-869-meta-test.test.ts` → 3/3 PASS.
- `node tools/check-discipline-coverage.mjs` → 23 manifest entries / 85 lessons / 39 UNCODIFIED ≤ 41 ceiling.

## Forward path post-v869

Remaining v868-v882 campaign:
- **v1.49.870-875** — Process singleton chips ×6 (size-ascending: version-manager → workflows/contribute → pic2html → gates/pre-flight → learn/acquirer → harness-integrity). Each chip will now run the cross-audit tool as part of pre-tag-gate step 18 — automatic instead of operator-invoked.
- **v1.49.876-881** — Egress singleton chips ×6 (size-ascending: package-fetcher → index-fetcher → anthropic-chip → http-client → skill-installer → ipc).
- **v1.49.882** — Verify-overdue forecast scan tool.

Other open items (carry-forward from v867 handoff):
- **NASA 1.179 forward-cadence** — strong-default standalone if the campaign pauses; 87 consecutive ships at 1.178 entering this ship (will be 88 at v869 close).
- **T2.1 v1.50 unblock-or-archive decision** (operator-bounded).
