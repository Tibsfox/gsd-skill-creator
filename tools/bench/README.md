# tools/bench — performance regression infrastructure

**Authored:** v1.49.653 L-05 (CONCERNS §20).
**Harness:** `vitest bench` (no new dependency on top of the existing Vitest 4.x test infra).

## What's here

| File | Purpose |
|---|---|
| `baseline.json` | Committed source-of-truth — the most-recently-accepted set of benchmark numbers. Regenerated via `--update-baseline` after a manual review. |
| `check.mjs` | Compares `last-run.json` against `baseline.json` and reports regressions. |
| `last-run.json` | **Gitignored.** Per-run output written by `vitest bench`. |

Benchmark suites live alongside the code they exercise, under `src/<area>/__benches__/<name>.bench.ts`.

## Workflow

```bash
# 1. Run all benches
npm run bench

# 2. Compare against baseline
npm run bench:check                     # human-readable
npm run bench:check -- --json           # machine-readable
npm run bench:check -- --strict         # exit 1 on regression > 15%
npm run bench:check -- --threshold 0.10 # tighten to 10%

# 3. After verifying that a change in numbers is acceptable
#    (e.g. you intentionally made something slower for clarity),
#    accept the new baseline:
node tools/bench/check.mjs --update-baseline
```

## Initial bench suites

| Bench | What it measures |
|---|---|
| `src/citations/extractor/__benches__/doi-detector.bench.ts` | `detectDois()` regex throughput on small / medium / large synthetic text |
| `src/citations/extractor/__benches__/parser.bench.ts` | `extractCitations()` end-to-end pipeline (section split + bib parse + inline patterns + DOI + URL + dedup) |

Each bench produces three size variants (small / medium / large) so you can spot whether a regression is constant-factor or growing with input size.

## Run-to-run variance

Bench numbers vary ±5-15% between runs depending on machine load. The default 15% regression threshold is calibrated to absorb this without false alarms. If you need tighter sensitivity, use `--threshold 0.10` and run benches on a quiet machine.

`baseline.json` should be updated:
- After an intentional perf change (improvement or accepted slowdown).
- Periodically to absorb run-to-run drift.
- Never silently — review the diff first, then commit baseline.json with a `perf(...)` commit.

## Adding a new bench

1. Create `src/<area>/__benches__/<name>.bench.ts`:
   ```ts
   import { bench, describe } from 'vitest';
   import { hotFn } from '../module.js';

   describe('<area> :: hotFn', () => {
     bench('small input', () => { hotFn(buildSmall()); });
     bench('large input', () => { hotFn(buildLarge()); });
   });
   ```
2. Run `npm run bench` to capture initial numbers.
3. Run `node tools/bench/check.mjs --update-baseline` to add them to the baseline.
4. Commit `baseline.json` (and the new bench file).

## Not wired into pre-tag-gate

Bench runs take ~5-10 seconds per suite. With the gate already at 5+ minutes per ship, adding the bench step on every tag would add friction with low signal (regressions are rare and run-to-run noise is high).

The recommended cadence is:
- Before merging a perf-affecting branch.
- Once per N-cluster window (e.g. at counter-cadence milestones).
- Ad-hoc whenever you notice slowdown.

If you want it gated, add a manual `npm run bench:check -- --strict` to your local pre-tag flow.
