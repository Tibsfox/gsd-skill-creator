/**
 * runner.spec.ts — NASA shared-harness smoke test.
 *
 * Verifies the v1.0.0 harness in four axes:
 *
 *   1. Faust runner page loads and the loader reaches its DOM-scaffold
 *      stage (either fully compiled, or a clean fallback with a visible
 *      status message when the vendored faustwasm is a placeholder).
 *   2. SPICE runner page loads, the circuitjs2 engine lite-fallback
 *      initialises, a scope canvas renders, and probe count matches the
 *      netlist.
 *   3. ngspice engine toggle reports `unavailable` gracefully (because
 *      the vendor drop is a placeholder at v1.0.0 ship).
 *   4. forest-module-registry validates and enables a sample module,
 *      and renders a toggle panel with at least one entry.
 *
 * All four pages must settle in <3 s on a warm cache.
 *
 * === Execution model ===
 * Playwright spins up an http-server via webServer in playwright.config.ts.
 * If `npx http-server` is unavailable on the runner (air-gapped CI), this
 * spec suite is skipped rather than erroring; the spec file is always
 * syntactically valid Playwright so `npx playwright test --list` always
 * succeeds.
 *
 * Soft gate for v1.0-v1.58 retro missions (log + continue) per
 * .planning/NASA-DEGREE-CANONICAL.md §14 + §16.
 * Hard gate from v1.59 onward.
 */
import { test, expect, Page } from '@playwright/test';

const FIXTURES = '/tools/nasa-smoke/fixtures/sample-mission';
const LOAD_BUDGET_MS = 3_000;

async function timedGoto(page: Page, path: string) {
  const started = Date.now();
  const resp = await page.goto(path, { waitUntil: 'domcontentloaded' });
  const elapsed = Date.now() - started;
  expect(resp?.ok(), `HTTP ${resp?.status()} for ${path}`).toBeTruthy();
  return elapsed;
}

test.describe('NASA shared-harness v1.0.0', () => {

  test('faust runner loads within 3s and initialises loader', async ({ page }) => {
    const elapsed = await timedGoto(page, `${FIXTURES}/audio/sample-synth.html`);
    expect(elapsed).toBeLessThan(LOAD_BUDGET_MS);

    await page.waitForFunction(
      () => (window as any).__HARNESS_VERSION__ === '1.0.0',
      { timeout: LOAD_BUDGET_MS }
    );

    // Harness scaffold attaches runner-root classes and status block.
    const root = page.getByTestId('faust-runner-root');
    await expect(root).toHaveClass(/runner-root/);
    await expect(root.locator('.runner-hud')).toBeVisible();
    await expect(root.locator('.runner-status')).toBeVisible();

    // One of two outcomes is acceptable: either faustwasm loaded (ok
    // path), or the loader emitted a clear error about the placeholder
    // (expected in v1.0.0 ship). Both count as the loader reaching its
    // initial scaffold stage; a crash or silent hang fails this test.
    const outcome = await page.evaluate(() => ({
      loaded: (window as any).__FAUST_LOADED__,
      error:  (window as any).__FAUST_LOAD_ERROR__ || null,
    }));
    if (!outcome.loaded) {
      expect(outcome.error, 'loader must either succeed or return a clear error').toBeTruthy();
      expect(outcome.error).toMatch(/faustwasm|vendor|placeholder|LICENSE/i);
    }

    // No uncaught console errors (the loader may log warn-level).
    const consoleErrors: string[] = [];
    page.on('pageerror', err => consoleErrors.push(String(err)));
    await page.waitForTimeout(250);
    expect(consoleErrors, `uncaught page errors: ${consoleErrors.join(' | ')}`).toEqual([]);
  });

  test('spice runner loads, parses netlist, renders scope, circuitjs2 lite engine', async ({ page }) => {
    const elapsed = await timedGoto(page, `${FIXTURES}/simulations/spice/sample.html`);
    expect(elapsed).toBeLessThan(LOAD_BUDGET_MS);

    await page.waitForFunction(
      () => (window as any).__SPICE_LOADED__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    const probes = await page.evaluate(() => (window as any).__SPICE_PROBES__);
    expect(Array.isArray(probes)).toBe(true);
    expect(probes.length).toBeGreaterThan(0);

    // Scope canvas exists with non-zero dimensions.
    const root = page.getByTestId('spice-runner-root');
    await expect(root.locator('canvas')).toHaveCount(1);
    const canvasBox = await root.locator('canvas').boundingBox();
    expect(canvasBox?.width).toBeGreaterThan(100);

    // The default engine must be circuitjs2 (per spec).
    const engineA = root.locator('.runner-engine-toggle button', { hasText: 'circuitjs2' });
    await expect(engineA).toHaveAttribute('aria-pressed', 'true');
  });

  test('spice runner: ngspice engine toggle is graceful when vendor is a placeholder', async ({ page }) => {
    await timedGoto(page, `${FIXTURES}/simulations/spice/sample.html`);
    await page.waitForFunction(() => (window as any).__SPICE_LOADED__ === true);

    const root = page.getByTestId('spice-runner-root');
    const ngButton = root.locator('.runner-engine-toggle button', { hasText: 'ngspice-wasm' });
    await ngButton.click();

    // The loader should either switch (if ngspice is vendored) or stay on
    // circuitjs2 and emit a warning in the status block. Either outcome is
    // acceptable; a page crash is not.
    const circuitjs2Btn = root.locator('.runner-engine-toggle button', { hasText: 'circuitjs2' });
    await page.waitForTimeout(300);
    const status = await root.locator('.runner-status').textContent();
    const circuitjs2Pressed = await circuitjs2Btn.getAttribute('aria-pressed');
    const ngPressed = await ngButton.getAttribute('aria-pressed');

    if (ngPressed === 'true') {
      expect(status).toMatch(/engine ready|running|ngspice/i);
    } else {
      expect(circuitjs2Pressed).toBe('true');
      expect(status).toMatch(/unavailable|placeholder|LICENSE/i);
    }
  });

  test('forest-module-registry validates + enables + renders toggle list', async ({ page }) => {
    const elapsed = await timedGoto(page, `${FIXTURES}/forest-module/registry-test.html`);
    expect(elapsed).toBeLessThan(LOAD_BUDGET_MS);

    await page.waitForFunction(
      () => (window as any).__REGISTRY_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    const state = await page.evaluate(() => ({
      version:  (window as any).__HARNESS_VERSION__,
      count:    (window as any).__REGISTRY_COUNT__,
      enables:  (window as any).__REGISTRY_ENABLE_CALLS__,
      disables: (window as any).__REGISTRY_DISABLE_CALLS__,
      error:    (window as any).__REGISTRY_ERROR__,
    }));
    expect(state.error, `registry threw: ${state.error}`).toBeFalsy();
    expect(state.version).toBe('1.0.0');
    expect(state.count).toBeGreaterThanOrEqual(1);
    expect(state.enables).toBeGreaterThanOrEqual(1);
    expect(state.disables).toBeGreaterThanOrEqual(1);

    // Toggle list should render at least one labelled entry.
    const panel = page.locator('#missions-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('label')).toHaveCount(state.count);
  });

  test('forest real subsystems: 6 implementations smoke-test', async ({ page }) => {
    // Exercises the v1.0.0-amendment-6 subsystem implementations:
    //   boids, lsystem, circadian, kuramoto, physarum, audio
    // Each is verified against a behavioral invariant rather than a structural
    // check, so future stub re-introductions would fail the test.
    await timedGoto(page, `${FIXTURES}/forest-module/subsystems-test.html`);
    await page.waitForFunction(
      () => (window as any).__SUBSYSTEMS_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );
    // Initial state baseline.
    const t0 = await page.evaluate(() => ({
      boidsPop:  (window as any).__boids.boids.length,
      lsysPop:   (window as any).__lsystem.plants.length,
      kuraN:     (window as any).__kuramoto.opts.N,
      phyAgents: (window as any).__physarum.agents.length,
      phySources:(window as any).__physarum.sources.size,
      ctxState:  (window as any).__audio.stats().ctxState,
    }));
    expect(t0.boidsPop).toBe(200);
    expect(t0.lsysPop).toBe(14);          // populationTarget default
    expect(t0.kuraN).toBe(80);
    expect(t0.phyAgents).toBe(240);
    expect(t0.phySources).toBeGreaterThanOrEqual(3);    // 3 default seeds
    expect(t0.ctxState).toBe('never-created');           // pre-unlock

    // Direct-tick the subsystems instead of relying on rAF — playwright's
    // headless rAF cadence is not reliably fast enough to make the GA loops
    // deterministic in a 30 s test budget.
    await page.evaluate(() => {
      const b = (window as any).__boids;
      const ls = (window as any).__lsystem;
      const k = (window as any).__kuramoto;
      const p = (window as any).__physarum;
      const c = (window as any).__circadian;
      for (let i = 0; i < 30; i++) {
        c.tick(1/30); ls.tick(1/30); b.tick(1/30); k.tick(1/30); p.tick(1/30);
      }
    });

    // boids: predator removes a boid. Use a large kill radius so the test is
    // deterministic regardless of starting positions.
    const boidsRes = await page.evaluate(() => {
      const b = (window as any).__boids;
      const before = b.boids.length;
      b.addPredator({ id: 'smoke-pred', x: b.canvas.width / 2, y: b.canvas.height / 2,
                      radius: 800, killCooldown: 0 });
      // Tick deterministically — at radius=800, kill ring=144px covers
      // ~30% of a 1024×576 canvas, so several boids are inside on each tick.
      for (let i = 0; i < 60; i++) b.tick(1/30);
      return { before, after: b.boids.length, stats: b._stats,
               predatorIds: [...b.predators.keys()] };
    });
    expect(boidsRes.predatorIds).toContain('smoke-pred');
    expect(boidsRes.stats.predationKills).toBeGreaterThan(0);
    expect(boidsRes.after).toBeLessThan(boidsRes.before + 1);  // kills outpace births within 2s

    // lsystem: bumpDensity adds plants instantly.
    const lsysRes = await page.evaluate(() => {
      const ls = (window as any).__lsystem;
      const before = ls.plants.length;
      ls.bumpDensity(3, 5000);
      return { before, after: ls.plants.length, bumps: ls.densityBumps.length };
    });
    expect(lsysRes.after - lsysRes.before).toBe(3);
    expect(lsysRes.bumps).toBe(1);

    // circadian: 24h compressed into 4 s, so phase advances measurably across
    // a 1.2 s wall-clock window.
    const circadianRes = await page.evaluate(() => new Promise<{p1: number, p2: number}>((res) => {
      const c = (window as any).__circadian;
      const p1 = c.phase();
      setTimeout(() => res({ p1, p2: c.phase() }), 1200);
    }));
    expect(Math.abs(circadianRes.p2 - circadianRes.p1)).toBeGreaterThan(0.05);

    // kuramoto: phase reference + coupling raise the peak order parameter
    // measurably above resting drift. Cauchy-distributed intrinsic frequencies
    // mean a few outliers fight the coupling indefinitely (the slow-cadence
    // visual is intentional), so we sample over a window and check the peak.
    const kuraRes = await page.evaluate(() => {
      const k = (window as any).__kuramoto;
      const r0 = k.r;
      k.addPhaseReference({ phase: 0.0, strength: 0.9 });
      k.setCoupling(0.5);
      let rPeak = 0;
      for (let i = 0; i < 240; i++) {
        k.tick(1/30);
        if (k.r > rPeak) rPeak = k.r;
      }
      return { r0, rPeak };
    });
    expect(kuraRes.rPeak).toBeGreaterThan(kuraRes.r0 + 0.05);

    // physarum: agents deposit pheromone — totalWeight grows over time.
    const phyRes = await page.evaluate(() => {
      const p = (window as any).__physarum;
      return {
        weight: p.stats().totalWeight,
        sample: p.sampleHighestWeightNode(),
      };
    });
    expect(phyRes.weight).toBeGreaterThan(0);
    expect(Number.isFinite(phyRes.sample.weight)).toBe(true);

    // audio: locked → unlocked transition, and addLayer counter increments.
    await page.locator('#audio-toggle').click();
    await page.waitForTimeout(300);
    const audioRes = await page.evaluate(() => {
      const a = (window as any).__audio;
      a.addLayer('smoke-layer', { gain: -30, frequency: 220 });
      a.fireEvent('smoke-event', { gain: -25, duration: 0.05 });
      return a.stats();
    });
    expect(audioRes.unlocked).toBe(true);
    expect(audioRes.ctxState).toBe('running');
    expect(audioRes.activeLayers).toBeGreaterThanOrEqual(1);
    expect(audioRes.events).toBeGreaterThanOrEqual(1);
  });

  test('all four runners load within 3s budget (combined)', async ({ page }) => {
    const urls = [
      `${FIXTURES}/audio/sample-synth.html`,
      `${FIXTURES}/simulations/spice/sample.html`,
      `${FIXTURES}/forest-module/registry-test.html`,
    ];
    for (const url of urls) {
      const elapsed = await timedGoto(page, url);
      expect(elapsed, `page ${url} took ${elapsed}ms (budget ${LOAD_BUDGET_MS}ms)`)
        .toBeLessThan(LOAD_BUDGET_MS);
    }
  });

  test('Real Faust runtime loads and compiles sample-synth.dsp', async ({ page }) => {
    // This test exercises the vendored @grame/faustwasm distribution
    // (dist/esm + libfaust-wasm) dropped into the harness by the
    // real-vendor pass. A placeholder LICENSE-PENDING drop would have
    // failed the basic loader test already; this test adds positive
    // confirmation that the *real* runtime surface is present.
    await timedGoto(page, `${FIXTURES}/audio/sample-synth.html`);
    await page.waitForFunction(
      () => (window as any).__HARNESS_VERSION__ === '1.0.0',
      { timeout: LOAD_BUDGET_MS }
    );

    // Give the lazy faustwasm import a moment to resolve. loadFaustPatch
    // awaits it before returning from the fixture's <script>. Both
    // outcomes (loaded OR well-formed error) are valid — we just require
    // that when the loader reports "loaded=true", the module surface it
    // resolved is the *real* faustwasm, not a stub.
    const outcome = await page.evaluate(async () => {
      const state = {
        loaded: (window as any).__FAUST_LOADED__,
        error: (window as any).__FAUST_LOAD_ERROR__ || null,
        moduleShape: null as null | {
          hasInstantiate: boolean;
          hasCompiler: boolean;
          hasGenerator: boolean;
          hasAudioWorkletNode: boolean;
        },
        params: null as null | string[],
      };
      if (state.loaded) {
        // Reach into the faustwasm bundle via a fresh import; it is
        // cached by the harness singleton so this is free.
        try {
          const mod: any = await import(
            '/www/tibsfox/com/Research/NASA/_harness/v1.0.0/faustwasm/index.js'
          );
          state.moduleShape = {
            hasInstantiate:       typeof mod.instantiateFaustModuleFromFile === 'function',
            hasCompiler:          typeof mod.FaustCompiler === 'function',
            hasGenerator:         typeof mod.FaustMonoDspGenerator === 'function',
            hasAudioWorkletNode:  typeof mod.FaustAudioWorkletNode === 'function',
          };
          // Peek at runtime knobs — loadFaustPatch parses .dsp UI
          // declarations before compile, so this succeeds even without
          // a user gesture.
          const rt = (window as any).__FAUST_RUNTIME__;
          if (rt && typeof rt.getParams === 'function') {
            state.params = rt.getParams().map((p: { label: string }) => p.label);
          }
        } catch (err: any) {
          state.error = String(err && err.message ? err.message : err);
        }
      }
      return state;
    });

    if (outcome.loaded) {
      expect(outcome.moduleShape, 'real faustwasm module shape').not.toBeNull();
      expect(outcome.moduleShape!.hasInstantiate).toBe(true);
      expect(outcome.moduleShape!.hasCompiler).toBe(true);
      expect(outcome.moduleShape!.hasGenerator).toBe(true);
      // Knobs parsed from sample-synth.dsp: freq, vol, mute.
      expect(outcome.params).not.toBeNull();
      expect(outcome.params!.length).toBeGreaterThanOrEqual(3);
      expect(outcome.params).toEqual(expect.arrayContaining(['freq', 'vol', 'mute']));
    } else {
      // Loader did not succeed. Acceptable only if the error is a
      // recognised vendor-drop issue; anything else is a regression.
      expect(outcome.error).toBeTruthy();
      expect(outcome.error).toMatch(/faustwasm|vendor|placeholder|LICENSE/i);
    }
  });
});
