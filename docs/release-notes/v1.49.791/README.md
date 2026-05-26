# v1.49.791 — Shelfware Verdict 2 + 3: ALLOWLIST `tonnetz` + `wasserstein-hebbian`

**Released:** 2026-05-26
**Type:** forward-cadence audit-driven Tier 1 ship 5/N (NOT a NASA degree advance, NOT counter-cadence)
**Predecessor:** v1.49.790 — Codification: 7 Lessons from v785-v789 → 2 New Operative Disciplines
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** Path B from the v790 handoff — second shelfware verdict

## Summary

Continues the T1.2 shelfware-closure loop after the v789 first verdict and the v790 codification ship. Emits two ALLOWLISTED verdicts in a single ship — `tonnetz` + `wasserstein-hebbian` — both substrate-level reference implementations the operator preserves as substrate despite zero production callers. The Math Foundations Refresh (v1.49.572) candidate cluster shrinks from 5 open to 3 open.

This is the FIRST ship to apply the operative disciplines codified at v790 — both the Shelfware verdict patterns (#10422 surface separation; #10423 lightest wire) AND the recon-first default (#10412 catching a handoff framing flip). The v790 handoff recommended `tonnetz` RETIRE as "cleanest"; ~5 minutes of recon on the module docstring + the SHELFWARE-VERDICTS.md candidate notes flipped that to ALLOWLIST.

## Deliverables

| Path | Status | Notes |
|---|---|---|
| `tools/adoption-scan.allowlist.json` | MODIFIED | +2 entries: `tonnetz` (substrate for SoPS surface; arXiv:2604.19960) + `wasserstein-hebbian` (companion to `docs/substrate-references/wasserstein-hebbian.md`; arXiv:2604.16052) |
| `docs/SHELFWARE-VERDICTS.md` | MODIFIED | +2 verdict rows (ALLOWLISTED × 2); 3 entries trimmed from the open-candidates roster (tonnetz + wasserstein-hebbian now in verdicts table; coherent-functors / hourglass-persistence / koopman-memory remain open) |
| `.planning/PROJECT.md` | MODIFIED | Active milestone + Latest shipped release + Last updated advanced to v791 |

## What changed

- **`tonnetz` flips test-only → living (allowlisted).** Reasoning row in `tools/adoption-scan.allowlist.json`: substrate-level reference implementation per arXiv:2604.19960 (Boland 2026, MATH-20 Phase 752); SoPS mapping (360 species × 360 musicians on the shared unit circle) is itself the substrate for an operator-filtered research-cadence surface; the module is the durable backing for that surface. Default-OFF + G6 standard CAPCOM preservation invariants intact.
- **`wasserstein-hebbian` flips test-only → living (allowlisted).** Reasoning row: substrate-level runtime backing for the canonical reader's reference at `docs/substrate-references/wasserstein-hebbian.md`. Advisory-only audit-finding emitter; CAPCOM retains gate authority.
- **The SHELFWARE-VERDICTS open-candidate roster shrinks from 5 to 3.** Three modules remain — `coherent-functors` (candidate WIRED when T1.3 College of Knowledge consumer engine ships), `hourglass-persistence` (candidate WIRED when skill-DAG instrumentation reaches that surface), `koopman-memory` (operator decision pending: ALLOWLISTED reference impl OR WIRED long-context activation path).
- **The verdict ledger gains 2 new ALLOWLISTED rows.** First emissions of the ALLOWLISTED verdict type in the ledger (v789 was WIRED; no RETIRED verdicts yet).

## Verification

- `node tools/adoption-scan.mjs --json` → `tonnetz` + `wasserstein-hebbian` both report `allowlisted: true` (the scanner record annotation) alongside the raw call-site state.
- `node tools/adoption-scan.mjs --shelfware-threshold 1` → tonnetz and wasserstein-hebbian no longer flagged (allowlist exempts them from the threshold check).
- `bash tools/pre-tag-gate.sh` → TO-FILL after gate run.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED from v789). Counter-cadence count UNCHANGED at 5. v791 is forward-cadence audit-driven.

## Audit roadmap status

This is **Tier 1 ship 5/N** of the AUDIT-2026-05-26 work (cumulative: v785 PROJECT.md normalizer + v786 module-scanner + v787 dashboard/automation/allowlist + v789 first shelfware verdict + v790 codification + v791 second + third shelfware verdicts).

**Verdict ledger growth:** 1 row (v789) → 3 rows (v791). All three carry distinct semantic weight (WIRED × 1, ALLOWLISTED × 2). Open candidates: 5 (v789) → 3 (v791).

**Remaining Tier 1:** T1.1 (bounded-learning calibration loop, 4-6 ships); T1.3 (College of Knowledge consumer engine, 3-5 ships).

**Remaining Strengthening Levers:** S3 (codify meta-cadence); S4 (public surface separation); S6 (self-evidence loop for security disciplines); S7 (counter-cadence cadence).
