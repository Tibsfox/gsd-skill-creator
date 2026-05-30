# Summary — v1.49.915

- **Version:** `v1.49.915`
- **Shipped:** 2026-05-30
- **Branch:** dev → main
- **Type:** counter-cadence flake-audit + latent-bug-fix ship (counter-cadence #16)

## What shipped

Two maintenance workstreams the operator selected from the v1.49.914 handoff: flake-audit the `atlas-deps-audit` intermittent (handoff option 3), and continue carry-forward promotion of the #10448 sub-variant candidates (handoff option 4). The first resolved to a false alarm masking a real latent defect; the second to a verified no-op.

## The "flake" was a false alarm — that masked a real bug

During v914 ship verification, `atlas-deps-audit: FAIL — 1 violation(s)` appeared in the tools-suite console and was recorded (handoff) as an intermittent failure in `atlas-index-cli.test.mjs`. The investigation found:

- That string **cannot** originate from `atlas-index-cli.test.mjs` (it has no reference to `atlas-deps-audit`). It is *expected stderr* from the **passing** negative-path cases of `atlas-deps-audit.test.mjs` — Case 2 (`some-unknown-package-xyz`) and Case 5 (`lodash`) deliberately introduce a bad import, run `--strict`, and assert exit 1 + the `FAIL` message. The handoff mis-attributed it (reporter proximity is not provenance, and the v914 session had heavy output buffering).
- Three full tools-suite runs were green (663/663). There is no genuine intermittent failure.
- The leak happens because `runAudit`'s `execSync` had no `stdio` option, so the child's stderr was echoed to the parent terminal *and* captured into `err.stderr`. **Fix:** add `stdio: ['ignore','pipe','pipe']` — the assertions still read `err.stderr`, but the console no longer shows the benign `FAIL` line. A passing test should never print `FAIL`.

## The real latent defect (stale policy allowlist)

Independently, the live audit (`node tools/atlas-deps-audit.mjs`) reported **1 genuine `CROSS_TREE_VIOLATION`**: `src/atlas/spatial/pmtiles-reader.ts:45` imports `../../security/loader-context.js` — the legitimate v1.49.905 LoaderContext security-chokepoint wire. The audit's `CROSS_TREE_ALLOW_PATTERNS` (authored v1.49.607 under ADR-0003) predates the v1.49.782+ chokepoint campaign and never allowlisted it. ADR-0003 §Decision explicitly permits atlas imports that resolve to "an existing repo-root primitive in `src/*` outside atlas" (category b) — the security chokepoint is exactly that. **Fix:** allowlist `loader-context.js`. The real audit now reports 0 violations across 112 files.

The pmtiles-reader chokepoint wire itself was correct; only the audit's allowlist was stale. No `src/` change.

## The root gap: an audit nothing gate-ran

ADR-0003 §Verification names `node tools/atlas-deps-audit.mjs --strict` as its acceptance test, but nothing wired it into `pre-tag-gate.sh` or CI after v607 — so the allowlist could rot silently, which it did. **Fix:** a new live-tree **Case 6** in `atlas-deps-audit.test.mjs` scans the real `src/atlas` + `desktop/intelligence/atlas` surfaces and asserts 0 violations, with a failure message pointing at the allowlist + ADR. Because the tools vitest suite became gate+CI-enforced at v913/v914, Case 6 makes the ADR acceptance test enforced at both reaches — the lightest closure that avoids a new `pre-tag-gate.sh` step. A future un-allowlisted cross-tree import (e.g. an egress/process chokepoint reaching atlas) or a new external atlas dep now fails loudly here.

## #10461 reaches its 3-instance bar

The defect is a clean third instance of #10461 — *"a test/observability surface ran nowhere enforced and silently rotted; gate-enforce it and pair the gate with a drift-guard."* v913 was the tools vitest suite; v914 the node:test files; v915 is the `atlas-deps-audit` policy tool, whose allowlist rotted because nothing ran it, fixed by the same remediation shape (gate-enforce the surface; the live-tree test is its drift-guard). The 3-instance bar is now MET. This is a maintenance ship, not a codify ship, so #10461 is recorded at 3 instances but **not** promoted into the manifest — codification is deferred to an operator-authorized codify ship (see 04-lessons + 99-context).

## #10448 promotion: verified no-op

Adversarially confirmed: every #10448 sub-variant at the 3-instance bar is already codified (#10448 v883, #10455 v899, #10459 v910). The five open carry-forward candidates (module-singleton v881; sync two-site v903; class-instance multi-method read-side v904; module-function mixed v905; sync multi-site same-path v906) each sit at 1 instance, and the LoaderContext ledger that would supply more instances is drained (0/0/0). Nothing is promotable; the standing forward-option is unchanged.

## Two real CI reds, surfaced and fixed (tools-suite CI-hardening)

Running the v915 pre-tag-gate revealed origin/dev's CI was already red — not from this ship's changes, but from tools-tests exposed by v914 wiring the tools suite into CI without verifying CI-safety. Fixing the first uncovered a second:

1. **mus-smoke gitignored-template dependency.** `tools/mus-smoke/__tests__/build-template-instruction.test.mjs` reads `.planning/templates/MUS-PHASE-C-BUILD-TEMPLATE.md`, which is **gitignored**: present locally, ENOENT on a fresh CI checkout. Authored (v1.49.585) when `tools/` was outside vitest scope; v913's `vitest.tools.config.mjs` + v914's CI-wiring activated it as 4 failing tests in CI. **Fixed** with `describe.skipIf(!existsSync(TEMPLATE_PATH))` per Lesson #10182 — verified present → 4 pass, absent → 4 skip / 0 fail.

2. **chapter.mjs import-time `main()` (missing entrypoint guard).** With (1) fixed, the next CI run surfaced an unhandled `process.exit(2)` from `tools/release-history/chapter.mjs`. The module called `main()` unconditionally at top level, so importing `writeChapterIdempotent` from it (in `chapter-idempotent.test.mjs`) ran `main()` — which queries PG. In CI (no PG) the empty release set throws `undefined.version`; because `main()` is fire-and-forget, its async `process.exit(2)` landed on whichever vitest file was running, failing the run non-deterministically. **Fixed** with the standard ESM entrypoint guard so `main()` runs only when chapter.mjs is the direct CLI (the rh-refresh pipeline spawns it that way), never on import. Verified: importing chapter.mjs no longer runs `main()` (exports intact); chapter-idempotent 6/6; tools suite 664 / 0 errors. An audit confirmed chapter.mjs was the **only** test-imported tool module with an unguarded `main()`.

Both reds are the same theme as the flake-audit — v913/v914's tools-suite enforcement surfacing tests that weren't CI-robust — and both had to be fixed for the v915 CI-on-dev gate to go green.

## Verification

- `node tools/atlas-deps-audit.mjs --json` → 0 violations, 112 files, exit 0.
- `atlas-deps-audit.test.mjs` → 6/6 pass; the benign `FAIL` console line is gone (3 → 0 occurrences).
- Tools suite (`npx vitest run --config vitest.tools.config.mjs`) → 664 passing locally (+1 over v914's 663 = Case 6); in CI the 4 mus-smoke tests skip cleanly (0 fail) where they previously errored.
- Main suite unchanged at 35,562 (no `src/` change).
- #10461 3rd-instance + #10448 no-op verdicts both adversarially verified against the canonical docs + manifest (disciplines.json, architecture-retrofit-patterns.md, v910–v914 lessons).

## Engine state

NASA degree unchanged at **1.178** (133 consecutive ships). Counter-cadence count 15 → 16. No manifest codification; #10461 advances 2-instance → 3-instance (bar met; codification deferred). UNCODIFIED 0 / PARTIAL 0 and KNOWN_UNWIRED 0/0/0 all unchanged. Pre-tag-gate executable step count unchanged at 20 (enforcement rides in the tools vitest suite via Case 6). Tools suite 663 → 664; main suite 35,562 unchanged.
