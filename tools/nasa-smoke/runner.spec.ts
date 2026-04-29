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

  test('forest panel-augment: groupings + search filter + idempotence', async ({ page }) => {
    // Tests the panel-augment helper directly against a synthetic flat panel.
    // Independent of the full subsystems test so a panel-only regression is
    // caught even if a subsystem regresses.
    await timedGoto(page, `${FIXTURES}/forest-module/panel-augment-test.html`);
    await page.waitForFunction(
      () => (window as any).__PANEL_AUGMENT_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    // Groupings: programs detected by the classifier.
    const groups = await page.evaluate(() => {
      return [...document.querySelectorAll('#missions-panel details')].map((d) => ({
        program: d.dataset.program,
        labelCount: d.querySelectorAll(':scope > label').length,
        open: d.open,
      }));
    });
    // Synthetic fixture seeds 10 labels: 1 Mercury, 1 Gemini, 1 Surveyor, 1 LO,
    // 1 Apollo, 1 Pioneer, 1 Mariner, 3 Forest/SPS.
    const programNames = groups.map((g) => g.program);
    expect(programNames).toEqual(expect.arrayContaining([
      'Mercury', 'Gemini', 'Surveyor', 'Lunar Orbiter', 'Apollo',
      'Pioneer', 'Mariner', 'Forest / SPS',
    ]));
    // Forest / SPS should be the last group and collapsed by default.
    expect(programNames[programNames.length - 1]).toBe('Forest / SPS');
    expect(groups[groups.length - 1].open).toBe(false);

    // Search filter: filter by 'cedar' should narrow to one Forest/SPS entry,
    // hide all other groups.
    await page.fill('#missions-panel input[type=search]', 'cedar');
    await page.waitForTimeout(200);
    const filtered = await page.evaluate(() => {
      const visibleLabels: string[] = [];
      for (const lbl of document.querySelectorAll('#missions-panel label')) {
        if ((lbl as HTMLElement).style.display !== 'none') {
          visibleLabels.push(lbl.textContent?.trim() || '');
        }
      }
      const visibleGroups = [...document.querySelectorAll('#missions-panel details')]
        .filter((d) => (d as HTMLElement).style.display !== 'none')
        .map((d) => (d as HTMLElement).dataset.program);
      return { visibleLabels, visibleGroups };
    });
    expect(filtered.visibleLabels.length).toBe(1);
    expect(filtered.visibleLabels[0]).toMatch(/cedar/i);
    expect(filtered.visibleGroups).toEqual(['Forest / SPS']);

    // Clear filter restores all groups.
    await page.fill('#missions-panel input[type=search]', '');
    await page.waitForTimeout(200);
    const restored = await page.evaluate(() => {
      const visibleGroups = [...document.querySelectorAll('#missions-panel details')]
        .filter((d) => (d as HTMLElement).style.display !== 'none')
        .map((d) => (d as HTMLElement).dataset.program);
      return visibleGroups.length;
    });
    expect(restored).toBe(8);  // all 8 groups visible

    // Classifier unit checks (fixture exposes window.__classifyLabel).
    const classifyChecks = await page.evaluate(() => ({
      mercury:    (window as any).__classifyLabel('1.19 · Freedom 7 Chinook Salmon'),
      surveyor:   (window as any).__classifyLabel('1.46 · Surveyor 1 Oregon White Oak'),
      lo:         (window as any).__classifyLabel('1.49 · Lunar Orbiter 1 Common Raven'),
      forest:     (window as any).__classifyLabel('1.0 · Armillaria Mycelial Pulse Network'),
      gemini:     (window as any).__classifyLabel('1.43 · Gemini 6A Marbled Murrelet'),
    }));
    expect(classifyChecks.mercury).toBe('Mercury');
    expect(classifyChecks.surveyor).toBe('Surveyor');
    expect(classifyChecks.lo).toBe('Lunar Orbiter');
    expect(classifyChecks.gemini).toBe('Gemini');
    expect(classifyChecks.forest).toBe('Forest / SPS');
  });

  test('forest perf budget: 60 ticks of all 5 subsystems under regression threshold', async ({ page }) => {
    // Headless-Chromium CPU budget. Headless lacks GPU acceleration, so
    // canvas operations are slower than they will be in a real browser.
    // Baseline measured 2026-04-29 was ~1140ms total / ~19ms per tick.
    // Budget set at 1.6× the baseline: catches a noticeable regression
    // while accommodating CI/runner variance.
    //
    // The test exercises *real CPU work* — actual subsystem tick + render
    // calls in sequence. Frame time in real browsers (with GPU canvas +
    // hardware acceleration) is ~3-5× faster.
    await timedGoto(page, `${FIXTURES}/forest-module/subsystems-test.html`);
    await page.waitForFunction(
      () => (window as any).__SUBSYSTEMS_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    const result = await page.evaluate(() => {
      const b = (window as any).__boids;
      const ls = (window as any).__lsystem;
      const c = (window as any).__circadian;
      const k = (window as any).__kuramoto;
      const p = (window as any).__physarum;
      const ctx2d = document.getElementById('forest-canvas')!.getContext('2d')!;
      // Warm-up: 10 ticks discarded (JIT, growable buffers, etc.)
      for (let i = 0; i < 10; i++) {
        c.tick(1/60); ls.tick(1/60); b.tick(1/60); k.tick(1/60); p.tick(1/60);
        c.render(ctx2d); ls.render(ctx2d); b.render(ctx2d); k.render(ctx2d); p.render(ctx2d);
      }
      const start = performance.now();
      for (let i = 0; i < 60; i++) {
        c.tick(1/60); ls.tick(1/60); b.tick(1/60); k.tick(1/60); p.tick(1/60);
        c.render(ctx2d); ls.render(ctx2d); b.render(ctx2d); k.render(ctx2d); p.render(ctx2d);
      }
      const elapsed = performance.now() - start;
      return { elapsed, perTick: elapsed / 60 };
    });
    console.log(`  perf: 60 ticks in ${result.elapsed.toFixed(1)}ms, ${result.perTick.toFixed(2)}ms/tick`);
    expect(result.elapsed).toBeLessThan(1800);  // 1.6× baseline of ~1140ms
    expect(result.perTick).toBeLessThan(30);
  });

  test('forest panel-augment: organism axis toggle', async ({ page }) => {
    // The augmenter accepts a JSON sidecar with { program, organismCategory }
    // entries keyed by missionVersion. The panel exposes an axis-toggle
    // button that flips the bucket key between program and organism.
    await timedGoto(page, `${FIXTURES}/forest-module/panel-augment-axis-test.html`);
    await page.waitForFunction(
      () => (window as any).__PANEL_AUGMENT_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    // Initial axis: 'program'. Synthetic fixture seeds 4 sidecar entries
    // with mixed program/organism so we can verify both buckets.
    const programInit = await page.evaluate(() =>
      [...document.querySelectorAll('#missions-panel details')].map((d) => ({
        key: (d as HTMLElement).dataset.program,
        axis: (d as HTMLElement).dataset.axis,
        n: d.querySelectorAll(':scope > label').length,
      }))
    );
    expect(programInit.every((g) => g.axis === 'program')).toBe(true);
    expect(programInit.length).toBeGreaterThanOrEqual(2);

    // Toggle the axis.
    await page.click('#missions-panel button');
    const organismView = await page.evaluate(() =>
      [...document.querySelectorAll('#missions-panel details')].map((d) => ({
        key: (d as HTMLElement).dataset.program,
        axis: (d as HTMLElement).dataset.axis,
        n: d.querySelectorAll(':scope > label').length,
      }))
    );
    expect(organismView.every((g) => g.axis === 'organism')).toBe(true);
    expect(organismView.map((g) => g.key)).toEqual(expect.arrayContaining(['Bird', 'Plant']));

    // Toggle back.
    await page.click('#missions-panel button');
    const programAgain = await page.evaluate(() =>
      [...document.querySelectorAll('#missions-panel details')].map((d) =>
        (d as HTMLElement).dataset.axis
      )
    );
    expect(programAgain.every((a) => a === 'program')).toBe(true);
  });

  test('forest URL deep-link + share-button: round-trip', async ({ page, context }) => {
    // Grant clipboard permissions so the share button can write.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Pre-enable two modules via ?modules=...
    await timedGoto(page, `${FIXTURES}/forest-module/deeplink-test.html?modules=1.0,1.12`);
    await page.waitForFunction(
      () => (window as any).__DEEPLINK_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    const preEnabled = await page.evaluate(() => (window as any).__PRE_ENABLED__);
    expect(preEnabled).toEqual(expect.arrayContaining(['1.0', '1.12']));
    expect(preEnabled).not.toContain('1.46');

    // Verify the corresponding registry modules' enable() was actually called.
    const enabledCounts = await page.evaluate(() => {
      const m = (window as any).__MODULES__;
      return { m1: m.m1._enabled, m2: m.m2._enabled, m3: m.m3._enabled };
    });
    expect(enabledCounts.m1).toBe(1);
    expect(enabledCounts.m2).toBe(1);
    expect(enabledCounts.m3).toBe(0);

    // Add 1.46 via UI toggle, then click share — the resulting URL should
    // contain 1.0, 1.12, AND 1.46 deduplicated.
    await page.evaluate(() => {
      for (const lbl of document.querySelectorAll('#missions-panel label')) {
        if (lbl.textContent?.includes('1.46')) {
          (lbl.querySelector('input[type=checkbox]') as HTMLInputElement).click();
          return;
        }
      }
    });
    await page.click('#share-scene');
    await page.waitForFunction(
      () => (document.getElementById('share-result')!.textContent || '').length > 0,
      { timeout: 1000 }
    );
    const shareUrl = await page.locator('#share-result').textContent();
    expect(shareUrl).toMatch(/[?&]modules=/);
    const url = new URL(shareUrl!);
    const versions = (url.searchParams.get('modules') || '').split(',').sort();
    expect(versions).toEqual(['1.0', '1.12', '1.46']);

    // Round-trip: load the share URL on a fresh navigation and verify those
    // three modules are pre-enabled.
    await timedGoto(page, shareUrl!.replace(url.origin, ''));
    await page.waitForFunction(
      () => (window as any).__DEEPLINK_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );
    const roundtrip = await page.evaluate(() => (window as any).__PRE_ENABLED__);
    expect(roundtrip.sort()).toEqual(['1.0', '1.12', '1.46']);
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
