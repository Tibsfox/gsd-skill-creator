# v1.49.1031 — Summary

## The ship

Audit §10 ship 5 (operator-triggered "ship 5"). The generative QA machinery
that sustained the v988–v1026 NASA cadence — previously 19 untracked,
clone-drifting scripts under gitignored `.planning/` — is promoted into a
committed `tools/workflows/` library of three generic, parametrized
Workflow-runtime skeletons, pinned by an 18-assertion drift-guard and
documented canonically. The two guards that clone-chains kept losing — the
ANCHOR-LEAK guard (3/11 review clones) and the rotation-vs-continuation
prompt flip (one untracked handoff paragraph) — are now committed invariants,
and review/audit agents are read-only Explore for the first time. The NASA
discipline doc is refreshed out of its ~120-ship staleness, folding audit
Lead A (#10408 superseded for catalog-clone rewrites by DECOMPOSE-build).

## What shipped

- `tools/workflows/content-adversarial-review.mjs` — 4-auditor + synthesis
  judge content review; mode `rotation|continuation`; ANCHOR-LEAK guard
  always-on; Explore-pinned; 3-way verdict; judge fail-safe; args-borne
  payload (#10406).
- `tools/workflows/decompose-build.mjs` — canonical 8-task DECOMPOSE-build;
  ANCHORS guard + mode flip REQUIRED args; SHARED contract committed.
- `tools/workflows/audit-harness.mjs` — multi-wave retrospective-audit
  topology with refuters over every fresh-claim wave, completeness critic,
  budget-gated gap-fill, in-workflow synthesis.
- `tests/integration/workflows-library-discipline.test.ts` — drift-guard in
  the root vitest project (gate + every CI leg).
- Docs: new `docs/workflows-library.md`; `docs/nasa-mission-authoring-
  discipline.md` resume-era refresh + §0 + Lead A fold; NASA per-ship T14
  appendix in `docs/T14-SHIP-SEQUENCE.md`; #10408 supersession annotation in
  `docs/sub-agent-dispatch-discipline.md`.

## Verification

Pre-edit evidence fleet `wf_28691c0e` (4 read-only agents) verified
clone-consensus invariants across all 17 ancestor clones + integration
constraints. Full `npx vitest run` 35,932 passed / 0 failed. Step P v2
adversarial review on the diff + attestation `--mode full` (results in
99-context). Pre-tag-gate 22/22 at T14.

## Engine state

NASA degree 1.217 (unchanged — core ship), counter-cadence 29, manifest 152,
thresholds 8. Predecessor v1.49.1030 (`d93c1deab`).
