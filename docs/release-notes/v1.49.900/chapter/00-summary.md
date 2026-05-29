# v1.49.900 — Seventh LoaderContext Chip: `orchestrator/lifecycle/artifact-scanner.ts`

**Released:** 2026-05-29

## Why this ship

KNOWN_UNWIRED Loader ledger had 9 entries post-v897 (v898 + v899 were verify-axis + codify ships, no chip-down). Per #10444 size-ascending discipline, the unique-smallest entry was `artifact-scanner.ts` at 176 LOC. The next candidates were `keystore.ts` (179 LOC, already ProcessContext-wired at v861 — LoaderContext is a separate, future chip with the existsSync-in-resolveKeystoreBin shape) and `state-reader.ts` (190 LOC, class with 3 fs-op methods — not a clean class-stored hoist-at-top per #10455, would need a different sub-variant). artifact-scanner.ts is a clean module-function with N=1 readdir site, fitting the base hoist-at-top sub-variant per #10448.

## What's in this ship

- **`src/orchestrator/lifecycle/artifact-scanner.ts`** UPDATED:
  - `ctx?: LoaderContext` added as optional 3rd parameter on `scanPhaseArtifacts(phasesDir, phaseDirectory, ctx?)`. Non-breaking — the single production caller `lifecycle-coordinator.ts:91` passes 2 args and continues to work as legacy-permissive.
  - `LOADER_SOURCE = 'orchestrator/lifecycle/artifact-scanner'` constant.
  - `ensureAllowed(ctx, LOADER_SOURCE, 'read-dir', fullPath)` hoisted at top of `scanPhaseArtifacts` BEFORE the try/catch that swallows the missing-directory case (per #10442 — `LoaderContextDenied` must propagate, not be masked by the missing-directory tolerance).
- **`src/orchestrator/lifecycle/artifact-scanner.test.ts`** UPDATED:
  - New `LoaderContext chokepoint integration (v1.49.900)` describe block with 5 tests:
    - Emits exactly one audit record when ctx is provided.
    - Throws `LoaderContextDenied` when phase dir is not in allowList — denial propagates ABOVE the ENOENT swallow (#10442 invariant test).
    - Legacy permissive mode when ctx is undefined.
    - Admits phase dir via prefix-pattern (trailing slash) in allowList.
    - Audit-record-count: emits exactly N records under N invocations (#10456 module-function direct-call variant — fourth context for the test pattern alongside v892 two-site outer-loop, v896 derived-method ripple, v897 mixed read/write derived methods).
- **`src/security/loader-context-audit.test.ts`** UPDATED:
  - `KNOWN_UNWIRED` set: `'src/orchestrator/lifecycle/artifact-scanner.ts'` removed (9 → 8 entries).
  - Chip-down note added with v1.49.900 + module-function-form identifier.

## Wire shape

**Hoist-at-top, module-function.** Optional `ctx?: LoaderContext` as 3rd parameter (after the two existing path params). Threaded per-call through the function signature — this is the base form of #10448 hoist-at-top, distinct from the class-stored sub-variant (v890/v896/v897 — promoted to ESTABLISHED at v899). Prior LoaderContext module-function instances: v887 (`console/reader.ts`) + v889 (`intelligence/atlas-indexer/file-walker.ts`). v900 is the third module-function instance.

**N=1 readdir site.** Per #10445, N drives wire shape; N=1 forces single hoist-at-top regardless of LOC band. Matches v887/v889 plus the v872 ProcessContext analog (`cli/commands/pic2html.ts`).

**#10442 hoist-above-ENOENT-swallow.** The readdir is inside `try { } catch { return emptyArtifacts(phaseDirectory); }` — the catch silently absorbs missing-directory. The chokepoint gate must run BEFORE this try, otherwise `LoaderContextDenied` would be absorbed by the missing-directory tolerance and the security denial would silently become "empty artifacts." The hoist-above-swallow assertion is exercised explicitly by the "denial propagates ABOVE ENOENT swallow" test.

## What this ship is

- A forward-cadence security-chokepoint chip per #10432 ratchet-ledger discipline.
- A third module-function hoist-at-top instance (after v887 + v889) — reinforces the already-ESTABLISHED base sub-variant.
- KNOWN_UNWIRED Loader 9 → 8.

## What this ship is not

- Not a counter-cadence ship (engine state UNCHANGED except KNOWN_UNWIRED).
- Not a substrate auto-emit or new threshold wire (verify-axis remains 7 of 7 COVERED + 0 PENDING-TEST from v898).
- Not a NASA degree advance (still 1.178; 118 consecutive ships at margin record).
- Not a new sub-variant emission — v900 is base hoist-at-top, no new wire shape introduced.

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **118 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 9.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 98 (UNCHANGED).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
**KNOWN_UNWIRED Loader 9 → 8** (-1 via this chip).
Wired calibratable thresholds 7 of 7 (UNCHANGED); verify-axis 7 COVERED + 0 PENDING-TEST (UNCHANGED from v898).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `src/orchestrator/lifecycle/artifact-scanner.ts` (UPDATED)
- `src/orchestrator/lifecycle/artifact-scanner.test.ts` (UPDATED — 5 new tests in `LoaderContext chokepoint integration (v1.49.900)` block)
- `src/security/loader-context-audit.test.ts` (UPDATED — KNOWN_UNWIRED 9 → 8 + chip-down note)
- `docs/release-notes/v1.49.900/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — v900 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.899 → 1.49.900)
