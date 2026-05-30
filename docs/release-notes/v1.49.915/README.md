# v1.49.915 — Counter-Cadence Tools-Suite Hygiene: atlas-deps-audit Flake-Audit (De-Noise + Stale-Allowlist Fix + Live-Tree Enforcement) + Tools-Suite CI-Hardening (mus-smoke skip-guard + chapter.mjs entrypoint guard) — #10461 3rd Instance

**Released:** 2026-05-30

Counter-cadence tools-suite-hygiene ship (counter-cadence #16) — operator-selected (via AskUserQuestion) two maintenance workstreams from the v1.49.914 handoff: **flake-audit the `atlas-deps-audit` intermittent** (handoff option 3) and **continue carry-forward promotion of the #10448 sub-variant candidates** (handoff option 4). The flake-audit resolved to a false alarm that masked a real latent defect; the #10448 audit resolved to a verified no-op. Shipping the ship also surfaced **two real CI reds on dev** — both pre-existing, both exposed by v914 wiring the tools suite into CI without verifying the suite was CI-*safe* — which had to be fixed for the v915 CI-on-dev gate to go green.

- **The "flake" was a false alarm.** The `atlas-deps-audit: FAIL — 1 violation(s)` line seen during the v914 ship was *expected stderr* from the **passing** negative-path cases (Case 2/5) of `tools/__tests__/atlas-deps-audit.test.mjs`, mis-attributed to the adjacent `atlas-index-cli.test.mjs` in a tool-channel-degraded session. No genuine intermittent failure exists (3 full-suite runs green). **De-noised:** `runAudit`'s `execSync` gains `stdio: ['ignore','pipe','pipe']` so the expected stderr is captured for assertions but no longer echoed to the vitest console — the false alarm cannot recur.
- **The investigation surfaced a genuine latent defect.** The live audit (`node tools/atlas-deps-audit.mjs`) reported 1 real `CROSS_TREE_VIOLATION`: `src/atlas/spatial/pmtiles-reader.ts:45` imports `../../security/loader-context.js` — the legitimate, committed (v1.49.905) LoaderContext security-chokepoint wire. The audit's `CROSS_TREE_ALLOW_PATTERNS` allowlist (authored v1.49.607, ADR-0003) predates the v1.49.782+ chokepoint campaign and never permitted it. **Fixed:** allowlisted `loader-context.js` per ADR-0003 category (b) ("an existing repo-root primitive in `src/*` outside atlas"). Real audit now reports 0 violations.
- **The root gap: the audit was never gate-wired.** ADR-0003 §Verification names `node tools/atlas-deps-audit.mjs --strict` as the acceptance test, but nothing ran it after v607 — so the allowlist rotted silently. **Closed:** a new **live-tree Case 6** in `atlas-deps-audit.test.mjs` scans the real atlas surface and asserts 0 violations, wiring the ADR-0003 acceptance test into the gate+CI-enforced tools vitest suite (the lightest enforcement that avoids touching `pre-tag-gate.sh`). A future un-allowlisted cross-tree import or new external atlas dep now fails loudly here.
- **#10461 reaches its 3-instance bar.** The atlas-deps-audit defect is a clean third instance of #10461's promotion criterion — *"a test/observability surface ran nowhere enforced and silently rotted."* (v913 = tools vitest suite; v914 = node:test files; v915 = the atlas-deps-audit policy tool, whose allowlist rotted because nothing gate-ran it.) The bar is now MET — but this is a maintenance ship, **not** a codify ship: #10461 stays a candidate, the manifest is unchanged, and codification is deferred to an operator-authorized codify ship (forward-path option 1).
- **#10448 promotion: verified no-op.** Every #10448 sub-variant at the 3-instance bar is already codified (#10448 v883, #10455 v899, #10459 v910). All 5 open carry-forward candidates sit at 1 instance each; the LoaderContext ledger that feeds them is drained (0/0/0). Nothing promotable — the standing "continue carry-forward promotion" forward-option remains correct and unchanged.
- **Two real CI reds fixed (tools-suite CI-hardening).** Running the v915 pre-tag-gate surfaced that origin/dev's CI was red — and fixing the first uncovered a second:
  1. **mus-smoke gitignored-template dependency.** `tools/mus-smoke/__tests__/build-template-instruction.test.mjs` reads `.planning/templates/MUS-PHASE-C-BUILD-TEMPLATE.md` — **gitignored** (present locally, ENOENT on a fresh CI checkout). **Fixed** with `describe.skipIf(!existsSync(TEMPLATE_PATH))` per Lesson #10182 (meta-test skip-guards against gitignored runtime artifacts): runs fully when present (local), skips cleanly when absent (CI).
  2. **chapter.mjs import-time `main()` (missing entrypoint guard).** `tools/release-history/chapter.mjs` called `main()` unconditionally at top level, so `import { writeChapterIdempotent } from './chapter.mjs'` (in `chapter-idempotent.test.mjs`) ran `main()` as a side effect — which queries PG. In CI (no PG) the empty release set throws `undefined.version`; because `main()` is fire-and-forget, its async `process.exit(2)` lands on whichever vitest file is running and fails the run non-deterministically (vitest blamed `chapter-idempotent.test.mjs`, but the error originated elsewhere). **Fixed** with the standard ESM entrypoint guard `if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()` — `main()` runs only when chapter.mjs is the direct CLI (the rh-refresh pipeline spawns it that way), never on import. (Entrypoint-guard discipline; cf. the `src/cli.ts` main()-at-module-load fix.)
  - An audit confirmed chapter.mjs was the **only** test-imported tool module with an unguarded `main()` (all other test-imported modules already guard; the other unguarded modules are never imported by tests). Both reds are the same family as the flake-audit: v913/v914's tools-suite enforcement surfacing tests that weren't CI-robust.

Counter-cadence count: 15 → 16. Tools suite **663 → 664** (+1: live-tree Case 6). Main suite **35,562 UNCHANGED** (no `src/` change). No manifest codification — #10461 advances 2-instance → **3-instance (bar met, awaiting codify ship)**. UNCODIFIED 0 / PARTIAL 0 UNCHANGED. KNOWN_UNWIRED Process/Egress/Loader UNCHANGED at 0/0/0. NASA degree UNCHANGED at 1.178 (**133 consecutive ships**).

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons (none codified; #10461 reaches its 3-instance bar)
- [99-context.md](chapter/99-context.md) — provenance + forward path

## What this ship is

- A counter-cadence flake-audit + latent-bug-fix ship (#16), per the #10430 finer-grained ~5-ship maintenance cadence.
- The closure of the v914-flagged atlas-deps-audit "flake": a false alarm de-noised, plus a real stale-allowlist defect fixed and locked by a live-tree regression test.
- The materialization of #10461's third instance — recorded, bar met, codification deferred to an operator-authorized codify ship.

## What this ship is not

- Not a codify ship — no `tools/render-claude-md/disciplines.json` change, no new manifest lessons, CLAUDE.md unchanged. #10461 stays a candidate (now at 3 instances / bar met).
- Not a chokepoint chip (all three Tier-E ledgers remain at KNOWN_UNWIRED 0).
- Not a NASA degree advance (still 1.178; 133 consecutive ships at the margin record).
- Not a production-behavior change to any shipped `src/` module: the only `src/`-adjacent fix is an allowlist entry in a `tools/` static-analysis script (the pmtiles-reader chokepoint wire itself was already correct).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **133 consecutive ships**; pressure-margin record extended by 1).
**Counter-cadence count: 15 → 16** (+1).
**Manifest entries: 24** (UNCHANGED); **lessons in manifest: 147** (UNCHANGED — no codification this ship).
**Discipline-coverage: UNCODIFIED 0 / PARTIAL 0** (both UNCHANGED).
KNOWN_UNWIRED Process / Egress / Loader UNCHANGED at 0 / 0 / 0.
Wired calibratable thresholds 7 of 7 (UNCHANGED); verify-axis 7 COVERED + 0 PENDING-TEST (UNCHANGED).
Pre-tag-gate executable step count: **20** (UNCHANGED — enforcement rides in the tools vitest suite via Case 6, not a new gate step).
Vitest main suite: **35,562** (UNCHANGED). Tools suite (`vitest.tools.config.mjs`): **663 → 664** (+1: live-tree Case 6).
Candidate **#10461: 2-instance → 3-instance (bar MET; codification deferred to operator-authorized codify ship).**

## Files touched

- `tools/atlas-deps-audit.mjs` (UPDATED — `CROSS_TREE_ALLOW_PATTERNS` allowlists `loader-context.js`; docstring extended)
- `tools/__tests__/atlas-deps-audit.test.mjs` (UPDATED — `runAudit` stderr de-noise + NEW live-tree Case 6 + header)
- `tools/mus-smoke/__tests__/build-template-instruction.test.mjs` (UPDATED — `describe.skipIf` skip-guard for the gitignored template; CI-red fix per #10182)
- `tools/release-history/chapter.mjs` (UPDATED — ESM entrypoint guard so `main()` runs only as CLI, not on import; CI-red fix)
- `docs/test-discipline/flake-audit-2026-05-30.md` (NEW — flake-audit record)
- `docs/release-notes/v1.49.915/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — v915 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.914 → 1.49.915)
