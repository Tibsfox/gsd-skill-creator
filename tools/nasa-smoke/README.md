# tools/nasa-smoke

Playwright smoke test for the NASA Mission Series **shared harness v1.0.0**.
See `.planning/NASA-DEGREE-CANONICAL.md` §14 and §16 for the canonical spec.

## What it verifies

- Faust runner (`_harness/v1.0.0/faust-loader.js`) reaches its DOM-scaffold
  stage on a sample `.dsp` patch. Either compiles end-to-end (when
  `faustwasm/` is vendored) or returns a clear error about the
  placeholder drop.
- SPICE runner (`_harness/v1.0.0/spice-loader.js`) parses a sample `.cir`
  netlist, renders a scope canvas, and defaults to the `circuitjs2`
  engine per the spec.
- The engine-toggle button reports `ngspice-wasm: unavailable` gracefully
  when its vendor drop is a placeholder.
- `forest-module-registry.js` validates + enables + renders a toggle
  panel for a sample `ForestModule`.
- All three pages load in under 3 s.

Soft gate for v1.0–v1.58 retro missions (log + continue). Hard gate from
v1.59 onward.

## Running

```bash
cd tools/nasa-smoke
npx playwright test               # run all tests
npx playwright test --headed      # watch the browser
npx playwright test --ui          # interactive UI mode
```

The Playwright config in `playwright.config.ts` spins up an `http-server`
on `localhost:4321` (override with `NASA_SMOKE_PORT`) rooted at the
repo-top so the harness files at `www/tibsfox/com/Research/NASA/_harness/`
and the fixtures at `tools/nasa-smoke/fixtures/sample-mission/` are both
reachable.

## First-time setup

From the repo root:

```bash
npm install -D @playwright/test      # single devDep addition
npx playwright install chromium      # ~150 MB download, single browser
```

### If Playwright install fails (sandbox / network blocked)

If `npm install -D @playwright/test` is blocked by the execution
sandbox, the spec file is still syntactically valid Playwright code.
Parse-only validation works via a dry-run:

```bash
# Without @playwright/test installed:
npx --yes -p typescript tsc --noEmit --allowJs tools/nasa-smoke/runner.spec.ts \
  --types --skipLibCheck 2>&1 | head -40
```

Once network access is restored, rerun the install commands above.

### If `npx http-server` is blocked

The `webServer` block in `playwright.config.ts` uses `npx http-server`
without adding it as a dep (so it stays under the one-new-devDep budget).
If the npx fetch is blocked, serve the repo root with any static server
of your choice:

```bash
# Example: Python 3
python3 -m http.server 4321

# Then run against the live server:
NASA_SMOKE_PORT=4321 npx playwright test
```

## Fixtures

```
fixtures/sample-mission/
  audio/sample-synth.dsp       -- minimal Faust (sine + vol + mute)
  audio/sample-synth.html      -- loader test page for Faust
  simulations/spice/sample.cir -- minimal RC lowpass, 1 Hz pulse
  simulations/spice/sample.html-- loader test page for SPICE
  forest-module/sample.js      -- sample ForestModule (no-op, trackable)
  forest-module/registry-test.html -- registry exercise page
```

The fixtures are deliberately tiny; real NASA mission artefacts at
`www/tibsfox/com/Research/NASA/1.XX/artifacts/` are never touched by
this suite.

## Exit codes

- `0` — all tests pass (hard gate passes).
- `1` — test failures. From v1.59 onward this blocks a mission ship;
  v1.0–v1.58 retro missions log and continue.
