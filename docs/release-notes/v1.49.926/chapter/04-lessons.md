# v1.49.926 — Lessons

No new manifest lesson ID this ship. The work is the **4th instance** of an already-ESTABLISHED pattern and **reinforces** several codified disciplines against fresh, ground-truth-verified instances. Manifest stays at 150 lessons.

## Reinforced (no new lesson ID)

- **#10439 (CLI manual + substrate auto-emit duality) — completed for the first duality threshold.** A calibratable threshold's loop is structurally incomplete until BOTH write callers ship. `token_budget.warn_at_percent` was the *original* `#10439` example (read + CLI at v803) yet sat with only one write-caller for ~123 ships, while its three siblings each got their substrate. This ship closes the duality for the lesson's own founding case.
- **#10453 (substrate→calibration end-to-end test) — 4th instance.** The e2e mirrors the v856/v894/v898 skeleton: temp dir, fire-and-forget wait via `setTimeout(50ms)` (`#10454`), count + order-INDEPENDENT net-polarity, missing-file + malformed-line tolerance, both polarities from one outcome-driven surface. Confirms the pattern holds beyond the 3-instance bar.
- **#10452 (substrate-wrapper) — outcome-driven sub-variant, 4th instance.** Like v893 ceiling, the kind is derived from the comparison (outcome-driven) rather than a fixed default (v891 retention). Adds a *two-reading* refinement: the substrate models the follow-up reading, not the trigger — a legitimate shape variation surfaced and documented, not forced into the single-reading mirror.
- **#10425 (math-check polarity before the assertion).** Hand-derived: raising `warn_at_percent` reduces warn-fire frequency, so `responsive` → +1 favors LOWER (warn earlier), `ignored` → −1 favors RAISE. The non-inverted family (same as ceiling/retention; opposite to predictive). Encoded once in `eventKindToValue`, not re-derived in the substrate.
- **#10427 (verify against ground truth, not the artifact's self-report).** The `verify-overdue-scan.mjs` scanner reported warn `COVERED`; the COVERED verdict rested on a ground-truth entry that `git log` proved a misattribution (v798 = registry stub, v799 = audit-log ship — neither a substrate/e2e). A static-analysis tool's own manifest data can mask the very debt the tool exists to surface; the disconfirming evidence came from the real commits, not the scanner.

## Candidate for a future codify ship (not promoted this ship)

- **"Static-analysis ground-truth manifests can mask debt; cross-check the COVERED verdict against git."** This is a fresh instance of the `#10427` silent-vs-loud family specific to hand-curated ground-truth in observability tools (the `verify-overdue-scan.mjs` v798/v799 entry). If a second instance surfaces (e.g. another scanner whose curated manifest drifts from reality), it is worth promoting to a numbered lesson in the static-analysis-tool-discipline domain. Next free operational ID: **#10464**.

## Cross-refs

#10439 (CLI+substrate duality — completed for warn), #10453 (substrate→calibration e2e — 4th instance), #10452 (substrate-wrapper — outcome-driven, two-reading sub-variant), #10425 (math-check polarity), #10437 (fire-and-forget observability swallow), #10427 (verify against ground truth; the masked-debt catch), #10456 (exact-N assertions in the e2e), #10463 (the organic-green streak this ship advances).
