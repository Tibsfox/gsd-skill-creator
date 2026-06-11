---
title: "v1.49.1029 — WARN-to-BLOCK Promotions: 22-Step Gate, Ship-Review v2, Readiness Reporter"
version: v1.49.1029
date: 2026-06-10
cadence_advances: [consume, verify]
summary: >
  Ship 3 of AUDIT-2026-06-09: the promotion debt gets paid. Gate steps 20 (adoption-freshness) and
  21 (trip-vocab) flip from WARN-only to default-BLOCK on K=30 evidence (64 consecutive baselines;
  57 consecutive clean NASA pages); T14 step P (adversarial ship review) is promoted ADVISORY to
  REQUIRED, enforced by a new deterministic gate step 22 that validates a per-ship attestation
  artifact (the gate grows 21 to 22 steps). Every promotion ships with its auditable K-record: a new
  warn-promotion readiness reporter computes all three evidence streaks deterministically. The
  committed adversarial-ship-review workflow gains the NASA judge IP (cross-lens synthesis judge
  with independent re-read, 3-way verdict enum, exception allow-lists). En route, the reporter's
  first live run caught its own counting bug — a missing word boundary matched "step passes" and
  inflated the step-P evidence count — fixed with regression pins and an honest all-time model.
tags: [gate, promotion, ship-review, attestation, readiness-reporter, audit-ship-3]
---

# v1.49.1029 — WARN-to-BLOCK Promotions: 22-Step Gate, Ship-Review v2, Readiness Reporter

**Shipped:** 2026-06-10

One-line: the three staged QA mechanisms with accrued evidence are promoted to enforcement —
steps 20/21 default-BLOCK, step P REQUIRED with a deterministic attestation gate step 22 — each
with its K=30 readiness record, plus the ship-review workflow upgraded with the NASA judge IP.

## Why this ship

AUDIT-2026-06-09 §10 ship 3 (operator: "ship 3"). The audit's §9 N-B lever: "promotion triggers are
the new actuators" — the project builds staged gates but skips the promotion criterion (lead G:
"promote after K clean ships" with K never defined despite the evidence accruing). Three mechanisms
were stuck at the staged rung: gate step 20 (WARN-only since v965), gate step 21 (WARN-only since
v983), T14 step P (ADVISORY since v968, its gate-enforcement rung explicitly deferred to "its own
ship"). Plus §4b: the committed `adversarial-ship-review.mjs` lacked the judge IP carried by the 11
untracked NASA review clones. Design pass: `.planning/SHIP-v1.49.1029-DESIGN.md`.

**K = 30** for all three (one full `SC_ADOPTION_BASELINE_MAX_DRIFT` window of consecutive clean
evidence; 10x the CI-flip trilogy's N=3 because a gate BLOCK stops a ship, a CI leg only stops a
push). Evidence verified live before promoting:

- **Step 20:** 64 consecutive per-ship baselines (`docs/ADOPTION-BASELINE-v*.json`, v965–v1028).
- **Step 21:** full 218-page corpus sweep — every TRIP-RISK page is degree <= 1.160 (pre-regime);
  degrees 1.161–1.217 are 57 consecutive clean, covering every ship under the v983 gate. The step
  only checks the CURRENT degree's page, so promotion has zero false-positive exposure.
- **Step P:** 55 distinct release versions all-time document the review (20 within v968+; the
  v986–v1026 NASA band ran the content-review variant recorded in untracked mission artifacts, so
  the committed-notes proxy under-counts — it can only defer readiness, never advance it) + the
  caught-defect ledger (v965: 3 BLOCKERs; v966: 1 MAJOR; 11/35 F4; v982; v1027: 1 BLOCKER + 1
  MAJOR; v1028: 1 MAJOR).

## What shipped

- **Readiness reporter (`7193a5feb`, fixed in `a45474a4b`).** New
  `tools/gate/warn-promotion-readiness.mjs`: three deterministic evidence models
  (adoption-freshness consecutive-baseline tail; trip-vocab tail-first bounded page sweep;
  ship-review all-time release-notes mention count with in-range sub-count), K=30 default,
  `--json`, fixture-injectable for headless tests, lifecycle-aware via `PROMOTION-MARKER` greps so
  post-promotion guidance flips to revert instructions (#10427). Live verdict: READY on all three
  (64/30, 30/30, 55/30). 61 vitest tests.
- **Steps 20/21 promoted (`5fc87cbe7`).** Stale-baseline and trip-risk VERDICTS (tool exit 1) now
  BLOCK by default (exits 23/25); tool malfunction (exit 2) stays WARN on both steps — a broken
  tool is not a content verdict. Bypass tokens unchanged; the now-meaningless REQUIRE escalation
  branches removed; `PROMOTION-MARKER` comments record K, evidence, and the reporter command.
- **Step P promoted + gate step 22 (`5bbbe8b42`).** New `tools/ship-review/write-attestation.mjs`
  writes `.planning/ship-review/last-attestation.json` (reviewedHead, mode full|scaled|content,
  counts, notes) and validates it in `--check` mode: parses + required fields, reviewedHead is an
  ancestor of HEAD, reviewedHead is NOT an ancestor of the newest tag (a stale prior-ship
  attestation BLOCKs). Gate step 22/22 `ship-review-attestation` (exit 26) shells out to `--check`;
  SKIPs on clean-CI checkouts (no `.planning/STATE.md`, same discriminator as step 21). Denominator
  renormalized 21→22 across the gate (~113 lines), self-consistency test updated, bypass vocab +
  env-vars.json extended, T14 step P header now REQUIRED as of v1.49.1029. 13 node:test tests.
- **Ship-review v2 (`5cc526514`).** The committed workflow gains the NASA judge IP: a cross-lens
  synthesis Judge phase that dedupes findings across lenses, independently re-reads every cited
  location (anti-hallucination), applies `STANDING_EXCEPTIONS` + `args.exceptions` allow-lists
  (known-correct steady states, stated positively), and classifies survivors with the 3-way verdict
  enum `real-fix-now | real-minor-optional | rejected-false-positive`. The judge cannot resurrect
  refuter-rejected findings; a dead judge fails safe (all confirmed treated as fix-now). Findings
  carry enum severity + confidence. Discipline drift-guard extended 5→9 workflow pins + doc pins.
- **Reporter counting bug caught live (`a45474a4b`).** The reporter's first real run inflated the
  step-P count to 59: `/step P/i` without a trailing word boundary matches "**step p**asses",
  present in ~39 NASA release-note dirs. Fixed with `\b` + negative regression pins, plus the
  honest all-time evidence model (55 all-time / 20 in-range, NASA-band under-count disclosed) and
  space-form CLI flag support (`--step ship-review` had silently fallen back to `all`).

## Verification

- Full `npx vitest run` green (see 99-context for counts and the known timing-flake disposition).
- Targeted suites: reporter 61/61; write-attestation 13/13 (node:test); self-consistency +
  bypass-vocab-parity + discipline 31/31; `bash tools/pre-tag-gate.test.sh` 19/19;
  `node tools/check-tools-test-coverage.mjs` exit 0.
- Adversarial ship review (T14 step P — first run of the v2 workflow, dogfooding its own ship):
  results recorded in 99-context; the FIRST attestation written by the new helper; gate 22/22 PASS
  including the born-BLOCK step 22 validating it.
- Trip-vocab corpus sweep: 218 pages, 184 PASS / 34 TRIP-RISK (all <= 1.160, pre-regime) / 0 errors.

## Engine state

- NASA degree: **1.217** (unchanged — code ship).
- Counter-cadence: **29** (unchanged).
- Manifest lessons: **152** (unchanged).
- Calibratable thresholds: **8** (unchanged).
- cadence_advances: `[consume, verify]`.
