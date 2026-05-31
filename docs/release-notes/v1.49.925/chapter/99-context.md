# v1.49.925 — Context

## Milestone metadata

- **Version:** v1.49.925
- **Type:** Counter-cadence (operationalization)
- **Predecessor:** v1.49.924
- **NASA degree:** 1.178 (unchanged — 140 consecutive ships)
- **Counter-cadence count:** 20

## Files changed

- `tools/ci/macos-flip-readiness.mjs` — **new.** The flip-readiness checker: organic-churn predicate (`classifyChurn`) + consecutive-green streak (`computeReadiness`) + live `gh`/`git` wiring with `--runs-file` injection for tests + `--json`/`--n`/`--limit`/`--root` flags + advisory exit codes (0/1/2).
- `tools/ci/__tests__/macos-flip-readiness.test.mjs` — **new.** 26 tests: pure-function units (churn classification incl. the `package*.json`-inert + `src-tauri/`-not-`src/` regressions; streak semantics) + spawnSync CLI integration (READY/NOT-READY/indeterminate, `--n` integer guard, `windowExhausted`, symlink invocation, the real-v924-history regression).
- `vitest.tools.config.mjs` — registered the new test in the explicit include list (the `check-tools-test-coverage.mjs` drift-guard + pre-tag-gate tools-suite step require it).
- `docs/static-analysis-tool-discipline.md` — #10463 section: new "Operationalizing the flip gate" subsection + Validation paragraph update (NOT READY 1/3 + the package*.json ground-truth catch) + a "When this discipline kicks in" bullet.
- `tools/render-claude-md/disciplines.json` — Static-analysis domain: #10463 `summary` + `trigger` extended with the checker pointer (no new lesson; lessons stay 150).
- `CLAUDE.md` — regenerated disciplines section (gitignored generated artifact; render `--check` clean).
- `.github/workflows/ci.yml` — comment pointer to the checker (the `continue-on-error` line is unchanged — no behavior change).
- `tests/integration/ci-matrix-parity.test.ts` — comment pointer to the checker (all 9 assertions unchanged).
- `docs/release-notes/v1.49.925/` — milestone notes (README + 00/03/04/99 chapters).

## Test posture

- Tools suite: 724 (+26 — the new checker tests; registered + drift-guard green)
- Main suite: `ci-matrix-parity.test.ts` 9/9 (comment-only edit)
- Discipline-coverage gate: UNCODIFIED 0 / PARTIAL 0 (manifest 150 lessons)

## Engine state at close

- NASA degree 1.178 (140 consecutive ships)
- Counter-cadence count 20
- Manifest: 24 domains, 150 lessons
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0

## Carry-forward

- **Load-bearing flip of the macOS matrix leg** (v924 carry-forward #1) remains open — now instrumented: `node tools/ci/macos-flip-readiness.mjs` reports the streak (currently NOT READY 1/3). Flip when READY; the flip MUST update `tests/integration/ci-matrix-parity.test.ts` (the drift-guard pins the staged `continue-on-error` line).
- Older opens (unchanged): Rust-in-CI; a real `coprocessor:` skill consumer; the `algebrus.eigen` Python error.
