# v1.49.977 — Lessons

No new manifest lesson promoted. This is a forward audit-plan ship; the engine
(NASA degree 1.178, counter-cadence 29, manifest 152) is unchanged. The reusable
insights from this ship are recorded in durable artifacts — `docs/SHELFWARE-VERDICTS.md`
(the reachability-dimension section) and `docs/learning-substrate-parked.md` (the
reachability-v2 verdict) — rather than as a manifest lesson.

## Applied (existing lessons)

- **#10461 (gate-enforce + drift-guard pairing).** The reachability computation is a
  runnable surface; it is drift-guarded by `tools/__tests__/adoption-scan.test.mjs`
  (Layer-1 hermetic units T17–T22) + `tests/integration/learning-substrate-parked.test.ts`
  (the island verdict, run against the live scanner). Both live in existing suites, so
  no new pre-tag-gate step lands and the denominator stays 20 (avoids the 20→21 bump
  this lesson cautions against).
- **#10450 (anti-vacuous drift-guards).** The integration guard includes a non-trivial
  oracle (genuinely production-reachable modules — `cli`, `embeddings`, `storage`,
  `validation` — must report `true`) so the island-unreachable assertions cannot pass
  vacuously, and asserts the field is present and boolean on every record.
- **Recon-first + verify-the-output discipline.** Premises were confirmed by a
  read-only recon before coding; the file-level BFS output was then verified against
  the live code, which refined the plan's premise (`ace` is statically reachable).
  Shipping the honest verdict rather than fudging the tool to match the plan.
- **Adversarial step-P, adjudicated by evidence.** The lone MAJOR finding was a false
  positive resolved against the actual gate wiring, not the verdict label.

## Process notes

- A reachability drift-guard that reads the committed baseline would hit a ship-order
  chicken-and-egg (pre-tag-gate runs before the baseline refresh). Running the scanner
  *live* in the guard makes it ordering-independent and more anti-vacuous.
- For a shelfware/reachability tool, "production root" should mean *shipped artifacts*
  (npm package + registered hooks + desktop/Tauri app), not the npm package boundary
  alone — excluding the shipped desktop app produces false-positive shelfware on live
  desktop modules. Dev/CI tooling (`tools/`, `scripts/`) is correctly excluded.
