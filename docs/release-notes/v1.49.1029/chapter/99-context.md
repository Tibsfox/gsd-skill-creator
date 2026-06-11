---
title: "Context"
chapter: 99-context
version: v1.49.1029
date: 2026-06-10
summary: "Where v1.49.1029 sits in the larger arc."
tags: [context, gate, promotion, audit-ship-3]
---

# v1.49.1029 — Context

## Milestone metadata

- **Version:** v1.49.1029
- **Type:** `feat(gate)` — WARN-to-BLOCK Promotions: 22-Step Gate, Ship-Review v2, Readiness Reporter
- **Predecessor:** v1.49.1028 (`0779decc8`) — Deploy-Layer Fix (audit §10 ship 2)
- **NASA degree:** 1.217 (unchanged — code ship)
- **Counter-cadence count:** 29 (unchanged)

## Where this sits

Ship 3 of the AUDIT-2026-06-09 §10 queue (operator: "ship 3"), after the loop-outcome ship (v1027)
and the deploy-layer fix (v1028). It executes the audit's §9 N-B lever — "promotion triggers are
the new actuators" — by paying down the staged-promotion debt on all three mechanisms at once:
gate step 20 (staged WARN-only at v965), gate step 21 (staged at v983), and T14 step P (staged
ADVISORY at v968, whose gate-attestation rung was explicitly deferred to "its own ship": this is
that ship, including the 21→22 denominator renormalization that deferral cited). It also closes
the §4b judge-IP half of the 1-vs-19 workflow asymmetry for the SHIP-review side (the content-review
generic skeleton remains §10 ship 5). Remaining audit queue: ship 4 (Rust ACL reconciliation),
ship 5 (tools/workflows/ library + NASA discipline-doc refresh), then the strategic tail.

## Execution shape

Design pass `.planning/SHIP-v1.49.1029-DESIGN.md` → 2 parallel gsd-executor dispatches with
disjoint file ownership (A: readiness reporter + tests, 40 tool uses; B: gate promotions + step 22
+ attestation helper + docs, 72 tool uses across 2 commits) → main-context integration (ship-review
v2 + discipline pins + doc v2 sections + the reporter regex/model fix) → full vitest → first v2
adversarial review dogfooded on this ship's own diff (base v1.49.1028) → first attestation → gate
22/22. Commits: `5fc87cbe7` (steps 20/21 BLOCK), `7193a5feb` (reporter), `5bbbe8b42` (step 22 +
renorm), `a45474a4b` (reporter fix), `5cc526514` (ship-review v2).

## Step P review (dogfood, first v2 run)

Run on the full ship diff with `{ base: 'v1.49.1028' }` — results recorded here after the run at
T14: see the Verification section of README.md for the fix-now/optional/rejected counts.

## Files changed

14 files, +2,533 / −225: `tools/gate/warn-promotion-readiness.mjs` (+681, new) + its 768-line test
file; `tools/pre-tag-gate.sh` (promotions + step 22 + denominator renorm); `tools/pre-tag-gate.test.sh`;
`tools/ship-review/write-attestation.mjs` (+297, new) + its node:test file (+205);
`tools/ship-review/adversarial-ship-review.mjs` (v2 judge);
`tests/integration/adversarial-ship-review-discipline.test.ts` (5→9 workflow pins + doc pins);
`tests/integration/pre-tag-gate-self-consistency.test.ts` (denominator 22 + exit-26 pins);
`tools/render-claude-md/env-vars.json`; `docs/T14-SHIP-SEQUENCE.md` (step P REQUIRED);
`docs/adversarial-ship-review.md` (promotion + v2 sections); `vitest.tools.config.mjs` (include).

## Engine state at close

NASA degree **1.217**, counter-cadence **29**, manifest **152**, calibratable thresholds **8** —
all unchanged (code ship). cadence_advances: `[consume, verify]`.
