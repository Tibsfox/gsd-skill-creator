# Retrospective — v1.49.791

## Carryover lessons applied

This ship is the FIRST forward application of two operative-discipline domains codified at v790 plus a direct re-validation of the recon-first discipline:

- **Lesson #10412 — Recon-first as default.** Applied at session start. The v790 handoff recommended `tonnetz` RETIRE as "cleanest first verdict"; ~5 minutes of recon on the tonnetz docstring + the SHELFWARE-VERDICTS.md candidate notes flipped that recommendation to ALLOWLIST. The handoff's "RETIRE cleanest" claim treated SoPS as a downstream consumer that could be filtered out; the on-disk docstring frames SoPS mapping as the substrate purpose itself. Classic recon-flips-framing case — fourth consecutive application of the pattern since v784 codification.
- **Lesson #10422 — Verdict-pattern surface separation is load-bearing.** Applied: the verdict ship touches three surfaces independently. The allowlist file (`tools/adoption-scan.allowlist.json`) is the observability annotation; the verdict ledger (`docs/SHELFWARE-VERDICTS.md`) is the decision surface; the source modules (`src/tonnetz/`, `src/wasserstein-hebbian/`) are byte-untouched. Each surface evolves independently of the others.
- **Lesson #10423 — Lightest wire that satisfies the verdict.** Applied: ALLOWLISTED is the lightest possible verdict — 2 lines per module in JSON + 2 rows in markdown + 0 code changes. No alternative wire was considered because the verdict type itself is the lightest decision.

## What Worked

- **Recon caught the handoff framing flip before any code was written.** ~5 min of source-code + SHELFWARE-VERDICTS.md re-read surfaced that the v789 handoff's recommendation didn't match the on-disk state. The handoff said "RETIRE cleanest"; the SHELFWARE-VERDICTS.md candidate roster itself hedges "ALLOWLISTED OR RETIRED (if the substrate is itself filtered out)." Per the docstring, the substrate is not filtered out. Recon-first is now on its 4th consecutive validation since v784 codification.
- **Batching 2 verdicts in 1 ship matched the verdict-pattern discipline.** v791 closes 2 candidates with shared provenance (both Math Foundations Refresh v572 cluster) and shared decision shape (both ALLOWLIST, both substrate-level reference implementations). The Shelfware verdict patterns discipline (#10422 surface separation) explicitly sanctions independent evolution of verdict policy — batching is the operator's policy lever.
- **First-try allowlist + adoption-scan integration.** The 2 new allowlist entries flipped both modules to `allowlisted: true` on the next scan, exactly as the verdict-types table predicts. No iteration.
- **Asked the operator before destructive verdict.** The v789-handoff recommendation included RETIRE which is irreversible (code deletion). Stopped + surfaced the recon discrepancy + asked operator to pick the verdict scope via AskUserQuestion. Authorization for ALLOWLIST × 2 was explicit before any file was written.
- **Codified-discipline forward application.** v790 codified the disciplines yesterday; v791 applies them today. Closes the codification → application loop tighter than the historical baseline (v784 codification → ?? application interval was longer).

## What Could Be Better

- **Ran `adoption-report:refresh` BEFORE `bump-version`.** Hit the v789-handoff forward-preventive #4 directly: "Adoption-baseline filename uses CURRENT package.json version — so `npm run adoption-report:refresh` MUST run AFTER `bump-version`, not before." The committed v1.49.790 baseline was overwritten with v1.49.791-state. Recovered via `git checkout HEAD -- docs/ADOPTION-BASELINE-v1.49.790.*`. Lost ~30s. The fact that the v789 handoff specifically called this out + the v790 ship explicitly noted "run AFTER bump" in the lesson candidate text + I still tripped it suggests the warning surface needs to migrate from prose-in-handoff to either (a) a CLI flag refusal (`--force` required to overwrite committed baseline) or (b) a pre-tag-gate step that detects the drift. Lesson #10424 candidate.
- **No source-code modification means no test step.** vitest didn't need to run. The verdict ship is allowlist + verdict-ledger + release-notes only. That's correct for ALLOWLIST verdicts but felt unusually weightless after the v789 WIRE verdict's 22-test suite + the v790 codification's 2 canonical-doc authoring step.
- **The SHELFWARE-VERDICTS open-candidate roster carries handoff bias.** The original roster (authored v789) baked in the "RETIRE cleanest" framing for tonnetz. That bias would have been load-bearing for the next operator if they had followed the recommendation without recon. After this ship's correction, the remaining 3-candidate roster still has biases that recon may flip — flag for next verdict-ship's recon pass.

## Surprises

- **Wall-clock came in well under estimate.** Estimated ~30-45 min (per v789 handoff for tonnetz alone); actual ~15-20 min for BOTH modules. The verdict-ship cost scales sub-linearly with the number of verdicts when they're the same type and share provenance.
- **The verdict ledger now has 3 entries (1 WIRED + 2 ALLOWLISTED) but ZERO RETIRED.** That's likely the natural distribution for substrate-heavy codebases: most "shelfware" candidates turn out to be intentional substrate, not actual abandoned code. RETIRE may be a rare verdict — interesting forward signal for the verdict-pattern.
- **`adoption-scan.mjs` raw status field doesn't reflect allowlist.** The scanner output reports `status: test-only` + `allowlisted: true` rather than `status: living (allowlisted)`. The SHELFWARE-VERDICTS.md verdict-types table promises "Status flips test-only → living (allowlisted)" — there's a presentation gap between the contract and the raw scanner output. Not a bug per se (the `allowlisted: true` annotation IS the flip), but the dashboard/refresh tools may need to compose `${status} (${allowlisted ? 'allowlisted' : ''})` for the contract to hold visually.

## Lessons applied at v1.49.791 (from v1.49.790 and earlier)

- **#10412** (recon-first) — applied + validated again. 4th consecutive application since v784 codification.
- **#10417-#10421** (Static-analysis tool authoring) — N/A this ship; no CLI authoring.
- **#10422** (Verdict-pattern surface separation) — applied: 3 surfaces touched independently.
- **#10423** (Lightest wire that satisfies the verdict) — applied: ALLOWLIST is the lightest possible verdict.

## Lesson candidate emitted this ship

- **#10424 candidate** — Adoption-baseline filename uses current package.json version; `adoption-report:refresh` MUST run AFTER bump or it overwrites the committed predecessor baseline. v789 handoff documented this in prose; v790 lesson candidate text noted the forward improvement; this ship tripped it AGAIN despite both warnings. The prose-in-handoff signaling is insufficient — needs migration to either a `--force` flag refusal or a pre-tag-gate detection step.

## Open lessons watchlist (apply at next opportunity)

- **#10422–#10423** (Shelfware verdict patterns) — apply at the next shelfware verdict ship (T1.2 ship 5).
- **#10412** (recon-first) — apply at the next handoff pickup.
- **#10424 candidate** (adoption-refresh-after-bump) — apply at every adoption-refresh invocation; consider migrating to a deterministic gate.
