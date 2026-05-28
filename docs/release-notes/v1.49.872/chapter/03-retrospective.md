# v1.49.872 — Retrospective

**Wall-clock:** ~15-18 min from v871 ship close to release-notes draft complete. Slightly above the v870-v871 chip mean (~13 min) because pic2html had no pre-existing test file — I authored the first test surface for the file (~5 min on the fake-PNG fixture pattern + 2 test cases).

## What went as expected

- **Hoist-at-top pattern applied cleanly.** Single-spawn-site file → single ensureProcessAllowed at the top of the spawn-containing function. No try/catch around the spawn, so no #10427 re-throw discipline needed.
- **Fake-PNG fixture pattern.** Wrote 2 test cases using a 4-byte non-PNG file with .png extension. The wire check fires synchronously inside loadImage before python3 is invoked — the test doesn't need a real image.
- **Cross-audit gate ran automatically.** Pre-tag-gate step 18/18 fired without operator invocation. Process count dropped 4 → 3.
- **#10444 catalog band-prediction held.** 311 LOC is in the mid-LOC band (#10444 predicts hoist-at-top / hoist-outside-Promise / closure-capture); pic2html chose hoist-at-top because it has only N=1 spawn site (LOC alone underdetermines the shape; spawn-site count is the other axis).

## What surprised me (mildly)

- **The pythonScript refactor was load-bearing for audit fidelity.** The original code had the python source inline in the execSync call (`execSync(\`python3 -c "<python source>"\`)`). For the hoist's argv to match the actual spawn argv, I refactored the python source into a local const so both the hoist and the spawn reference the same string. Without the refactor, future edits to the python source would silently drift between what the audit records and what actually runs.

## What went wrong

- Nothing significant this ship. The wire was structurally minimal (single-site hoist + 1 const extraction + 2 test cases). Test file creation added ~5 min over a no-test-file chip would have taken (skipping per-file tests for a single-spawn wire was an option but the test pattern reuses cleanly for future chips so the investment pays off).

## Future-improvement candidates surfaced this ship

### Audit-fidelity refactor for inline shell-script literals

**Surface ship:** v1.49.872 (pythonScript const extraction).

When a file has an inline string literal passed to execSync/spawn, the hoist's argv parameter needs to reference the same string. If the literal is inlined twice (once in the hoist, once in the spawn), future edits can drift silently. The fix: refactor the literal into a local const so both references share one source.

The pattern emerged at v870 (version-manager) where the `command` parameter to the helper threaded through both the hoist and execAsync — no drift possible because both consumed the same parameter. At v872, the inline python source needed manual extraction.

**Below threshold (1 instance).** Carry as forward-observation. A 2nd chip with an inline shell-script literal would promote this to a refinement of #10444 — possibly suggesting a sub-pattern "audit-fidelity: extract inline literals to a const if hoist + spawn reference them separately".

### Wire-shape selection by spawn-site count, not LOC band

**Surface ship:** v1.49.872 (recon during shape selection).

The #10444 catalog uses LOC bands to predict wire shape: small → hoist-at-top, mid → hoist-outside-Promise / closure-capture, larger → internal-helper, etc. v872 at 311 LOC structurally matches "mid-band" (predicting hoist-outside-Promise or closure-capture) but chose hoist-at-top because N=1 spawn site.

The more precise prediction rule: **spawn-site count is the primary axis; LOC is the secondary axis** (correlated with site count but not deterministic). A small-LOC file with N=5 spawn sites would want internal-helper; a large-LOC file with N=1 site would want hoist-at-top.

Below-threshold observation (1 instance of explicit recognition). A 2nd chip where the LOC band predicts one shape but the spawn-site count predicts another would promote this refinement to #10444.

## Verdict on scope

Chip ship at ~15-18 min — slightly above the v870-v871 mean but justified by the new test-file creation. Track 4 progress: 3/6 chips closed (50% through Process cluster). Cross-audit gate continues to catch correctness automatically.

The fake-PNG fixture pattern is a reusable contribution — any future single-spawn chip can use the same pattern to write a focused wire test without needing real data fixtures. Codification candidate at future codify ship.
