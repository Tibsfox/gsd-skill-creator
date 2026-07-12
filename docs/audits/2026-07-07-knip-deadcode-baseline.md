# QUAL-4 — Dead-code detector (knip) + baseline (2026-07-07)

Closes **QUAL-4** from the 2026-07-06 improvement workplan (§3 Tier-2, §4.5). Adds `knip`
as the toolchain's missing dead-code / unused-export / unused-dependency detector — the
systemic root fix for the drift that let `read-settings.ts` reach 0 adopters and
`src/dogfood/` grow to 66 unwired files before anyone noticed.

Captured at `dev` HEAD `05b9d6ec3` (pre-commit for this change).

## What shipped

- `knip@^6.25.0` as a devDependency.
- `knip.ts` — a dynamic config whose parked-island ignore-list is **derived from
  `tools/adoption-scan.allowlist.json`**, the same source of truth the adoption scanner
  uses. Park a module there (with a reason) and both detectors exclude it automatically —
  the two can never drift apart.
- Three npm scripts:
  | Script | What it reports |
  |--------|-----------------|
  | `npm run deadcode` | High-signal: unused **files**, **dependencies**, **binaries**, **unlisted**, **duplicates**. Excludes the export/type bulk. |
  | `npm run deadcode:all` | Everything, including the full unused-export/-type surface. |
  | `npm run deadcode:exports` | Only the unused-export/-type surface. |

  All three pass `--no-exit-code` (report-only, **non-blocking**) and `--no-config-hints`.

## Baseline snapshot (HEAD `05b9d6ec3`)

`npm run deadcode`:

| Category | Count | Notes |
|----------|-------|-------|
| Unused files | **64** | 60 are unreferenced `index.ts` barrels (library public-API surface — benign); **4** are genuine dead-code candidates (below). |
| Unused dependencies | **1** | `@mapbox/vector-tile` |
| Unused devDependencies | **1** | `@types/diff` |

`npm run deadcode:all` additionally reports **1,886 unused exports** and **1,847 unused
exported types**. That volume is the honest shape of a 152-module research monorepo whose
dominant theme (per the 2026-07-06 audit) is *dormancy* — a large written-but-unconsumed
public surface. It is informational, not an actionable to-do list, which is why it sits
behind `deadcode:all`/`deadcode:exports` rather than the default report.

### The 4 genuine dead-file candidates (not acted on here)

| File | Disposition |
|------|-------------|
| `src/hooks/session-start.ts` | **INT-4.** Session-observation hook, never registered by either installer. Its only "references" in `src/chipset/` are lifecycle event-name string literals, not imports. Decide: wire via the install manifest, or delete (superseded by `tools/session-retro/observe.mjs`). |
| `src/hooks/session-end.ts` | **INT-4.** Same as above. |
| `src/branches/lifecycle-adapter.ts` | No importers. Decide wire-or-delete. |
| `src/scan-arxiv/dedup-cli.ts` | A CLI entry (`dedup-cli`) with no importer — intentionally invoked, not imported. Either register it as an entry in `knip.ts` (if it is a real command) or delete if superseded. |

### The 2 dependency findings (not acted on here)

- `@mapbox/vector-tile` — no code usage anywhere in `src/`, `tools/`, `scripts/`, `www/`,
  `apps/`, or `desktop/` (only a mention in `src/atlas/spatial/UPSTREAM-WIRING.md`, a
  wiring-plan doc). Either it is staged for planned vector-tile decoding in
  `src/atlas/spatial` and should be wired, or it is removable. Confirm intent before
  removing.
- `@types/diff` — redundant: `diff@^8` ships its own type declarations. Safe to remove.

## Verified false-positives (suppressed in `knip.ts` — do not re-flag)

Each of these was checked before being suppressed, so future readers should not re-litigate:

- **`react`, `react-dom`, `@types/react`, `@types/react-dom`** — consumed by
  `apps/the-space-between-engine/` and `desktop/` (their own package.json), which are
  excluded from the root scan.
- **`mysql2`** — imported by `tools/build-constellation/snapshot-mysql.mjs`, outside
  knip's `src/**` scope.
- **`flatgeobuf`** — reached via a dynamic subpath import cast to string in
  `src/atlas/spatial/flatgeobuf-export.ts` (`import('flatgeobuf/dist/...' as string)`),
  which defeats static resolution; confirmed reachable through its test.
- **External binaries** (`pdftotext`, `lean`, `lake`, `awk`, `claude`, `wetty`, `tmux`,
  `python3`, `which`, `skill-creator`) — real CLIs invoked at runtime / in tests, not npm
  packages.
- **Test fixtures + harness** (`src/**/__tests__/**/fixtures/**`, `src/**/fixtures/**`,
  `src/**/__tests__/_harness/**`) — intentionally-standalone sample trees the analyzer
  suites read as data or spawn as subprocesses.
- **28 parked research islands** — derived from `tools/adoption-scan.allowlist.json`
  (dogfood, the control-theory island, substrate references, content packs, etc.).

## Status & promotion path

This is a **non-blocking report** — it is *not* wired into `pre-tag-gate` or CI. To promote
it to a gate once the baseline is clean:

1. Resolve the 4 genuine dead files + the 2 dependency findings (wire or delete each).
2. Change `npm run deadcode` to drop `--no-exit-code` (so it exits non-zero on findings).
3. Add it as a step in `tools/pre-tag-gate.sh`.

Keep the export/type surface (`deadcode:all`) out of the gate — pruning ~3,700 library
exports one by one is not a release blocker.

## Maintenance

To park a new module so **both** the adoption scanner and knip stop flagging it, add one
entry (with a `reason`) to `tools/adoption-scan.allowlist.json`. `knip.ts` reads that file
at config-load time; no knip-side change is needed.

## Update 2026-07-12 — barrel-ignore + ceiling ratchet

The "promote it to a gate" plan above is now partly shipped, as a **ratchet** rather than a
hard `--no-exit-code` flip (matches the module-reachability orphan-ledger discipline, which
the repo chose over a pre-tag-gate WARN step to avoid the ci-gate-enum / bypass-vocab
surface).

- **Barrel-ignore in `knip.ts`.** Added `'src/*/**/index.ts'` to `ignore` — the 60
  unreferenced nested `index.ts` barrels are library public-API re-export surface, not dead
  code. This does **not** match the top-level entry `src/index.ts`. The meaningful count
  drops from **66 → 6**: `src/branches/lifecycle-adapter.ts`,
  `src/hooks/session-{start,end}.ts`, `src/scan-arxiv/dedup-cli.ts`, `@mapbox/vector-tile`,
  `@types/diff`.
- **`tools/check-deadcode-ceiling.mjs`** — computes the meaningful count (unused files +
  deps + devDeps) and exits non-zero when it exceeds `SC_DEADCODE_CEILING` (default
  `DEFAULT_CEILING = 6`). `npm run deadcode:ceiling` runs it.
- **`tools/__tests__/check-deadcode-ceiling.test.mjs`** — a BLOCKING tools-suite test
  (`vitest.tools.config.mjs`, so it runs in pre-tag-gate step `tools-suite` + CI) that
  asserts `count <= 6`. A new dead file/dep fails it, forcing a wire-or-delete decision.

The ceiling only ratchets DOWN. To lock in a reduction (e.g. remove `@types/diff` — `diff@8`
ships its own types; register or delete `src/scan-arxiv/dedup-cli.ts`; decide the two
session-hook files), lower `DEFAULT_CEILING` in the same commit that removes the finding.
The export/type surface (`deadcode:all`) stays out of the gate.
