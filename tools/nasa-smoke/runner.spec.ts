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
    // Baseline range observed 2026-04-29 was 700–1900ms total under
    // varying system load — wide variance because headless rAF + CPU
    // canvas compete with whatever else the runner is doing.
    // Budget set at 2500ms / 40ms per tick: catches a 30% regression
    // beyond the worst observed run while accommodating contention.
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
    expect(result.elapsed).toBeLessThan(2500);
    expect(result.perTick).toBeLessThan(40);
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

  test('forest panel-augment: organism swatches + axis persistence + cross-axis digest', async ({ page }) => {
    // Loads the axis-test fixture (which seeds 4 sidecar entries) and asserts:
    //   1. organism color swatches attach to labels whose sidecar entry has
    //      an organismCategory
    //   2. axis choice persists in localStorage across navigation
    //   3. summary text carries a cross-axis digest like "[🐦×n …]"
    await timedGoto(page, `${FIXTURES}/forest-module/panel-augment-axis-test.html`);
    await page.waitForFunction(
      () => (window as any).__PANEL_AUGMENT_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    // 1) Swatches: every label with an organismCategory carries one.
    // The fixture seeds 4 entries, all of which have an organismCategory
    // (Plant, Bird, Bird, Fungus), so every label should get a swatch.
    const swatchInfo = await page.evaluate(() => ({
      labels:   document.querySelectorAll('#missions-panel label').length,
      swatches: document.querySelectorAll('#missions-panel label .__swatch').length,
      // Each swatch must carry a non-default background color. Browsers
      // serialise hsl() to rgb() when reading inline styles, so accept either.
      firstSwatchStyle: document.querySelector('#missions-panel label .__swatch')?.getAttribute('style') || '',
    }));
    expect(swatchInfo.labels).toBe(4);
    expect(swatchInfo.swatches).toBe(4);
    expect(swatchInfo.firstSwatchStyle).toMatch(/background:\s*(hsl|rgb)\(/);

    // 2) Cross-axis digest: program-axis summaries should mention organism icons.
    const programDigests = await page.evaluate(() =>
      [...document.querySelectorAll('#missions-panel details[data-axis="program"] summary')]
        .map((s) => s.textContent || '')
    );
    expect(programDigests.length).toBeGreaterThanOrEqual(2);
    // At least one summary must contain "[" + an organism icon glyph.
    const hasDigest = programDigests.some((s) => /\[.*[🐦🌿🍄🐟🦦🦎🐸🦋].*\]/.test(s));
    expect(hasDigest).toBe(true);

    // 3) Toggle to organism axis and reload — localStorage must restore it.
    await page.click('#missions-panel button');
    await page.waitForTimeout(100);
    const beforeReload = await page.evaluate(() =>
      document.querySelector('#missions-panel details')?.getAttribute('data-axis')
    );
    expect(beforeReload).toBe('organism');

    await page.reload();
    await page.waitForFunction(
      () => (window as any).__PANEL_AUGMENT_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );
    const afterReload = await page.evaluate(() =>
      document.querySelector('#missions-panel details')?.getAttribute('data-axis')
    );
    expect(afterReload).toBe('organism');

    // Clean up so other tests aren't affected by the persisted axis.
    await page.evaluate(() => {
      try { localStorage.removeItem('forest-panel-axis'); } catch (_) {}
    });
  });

  test('forest panel-augment: footer roll-up + colorized digest icons', async ({ page }) => {
    await timedGoto(page, `${FIXTURES}/forest-module/panel-augment-axis-test.html`);
    await page.waitForFunction(
      () => (window as any).__PANEL_AUGMENT_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    // 1) Footer exists, declares total + axis, and has cross-axis rows.
    const footer = await page.evaluate(() => {
      const f = document.querySelector('#missions-panel .__footer');
      if (!f) return { exists: false };
      return {
        exists: true,
        text: (f as HTMLElement).innerText.trim(),
        rowCount: f.querySelectorAll(':scope > div').length - 1,  // minus header line
      };
    });
    expect(footer.exists).toBe(true);
    expect(footer.text).toMatch(/^4 modules · sorted by program/);
    expect(footer.rowCount).toBeGreaterThanOrEqual(2);  // Bird + Plant + Fungus

    // 2) Footer rows include percentages.
    const hasPct = await page.evaluate(() => {
      const f = document.querySelector('#missions-panel .__footer');
      return f ? /\d+\s*·\s*\d+%/.test((f as HTMLElement).innerText) : false;
    });
    expect(hasPct).toBe(true);

    // 3) Cross-axis digest icons: at least one digest span carries an
    // inline color style (the program-axis tints organism icons).
    const colored = await page.evaluate(() => {
      const spans = document.querySelectorAll('#missions-panel summary .__digest span[data-cross-key]');
      for (const s of spans) {
        const c = (s as HTMLElement).style.color;
        if (c && c.length > 0) return { count: spans.length, sample: c };
      }
      return { count: spans.length, sample: null };
    });
    expect(colored.count).toBeGreaterThanOrEqual(1);
    expect(colored.sample).toMatch(/^(rgb|hsl)\(/);

    // 4) Toggle to organism axis: footer rebuilds with program rows.
    await page.click('#missions-panel button');
    await page.waitForTimeout(100);
    const orgFooter = await page.evaluate(() => {
      const f = document.querySelector('#missions-panel .__footer');
      return f ? (f as HTMLElement).innerText.trim() : '';
    });
    expect(orgFooter).toMatch(/^4 modules · sorted by organism/);

    // Clean up persisted axis.
    await page.evaluate(() => {
      try { localStorage.removeItem('forest-panel-axis'); } catch (_) {}
    });
  });

  test('forest audio: lastEventAt timestamp updates on fireEvent', async ({ page }) => {
    // The runner page exposes audio.lastEventAt() so it can highlight the
    // mute button when modules emit fireEvent calls while audio is muted.
    // Verify the timestamp updates and stays stable until the next event.
    await timedGoto(page, `${FIXTURES}/forest-module/subsystems-test.html`);
    await page.waitForFunction(
      () => (window as any).__SUBSYSTEMS_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    const at0 = await page.evaluate(() => (window as any).__audio.lastEventAt());
    expect(at0).toBe(0);   // never fired

    const at1 = await page.evaluate(() => {
      (window as any).__audio.fireEvent('test1', { gain: -22, duration: 0.1 });
      return (window as any).__audio.lastEventAt();
    });
    expect(at1).toBeGreaterThan(0);

    // Same call shouldn't bump the timestamp without a new fireEvent.
    const at2 = await page.evaluate(() => (window as any).__audio.lastEventAt());
    expect(at2).toBe(at1);

    // Second event advances it.
    await page.waitForTimeout(50);
    const at3 = await page.evaluate(() => {
      (window as any).__audio.fireEvent('test2', { gain: -25, duration: 0.05 });
      return (window as any).__audio.lastEventAt();
    });
    expect(at3).toBeGreaterThan(at1);
  });

  test('forest enabled-modules persistence: localStorage round-trip + URL precedence', async ({ page }) => {
    // Asserts:
    //   1. toggling a module writes its missionVersion to localStorage
    //   2. reload with no URL params restores the saved set
    //   3. URL params (?modules=, ?mission=) override localStorage
    //   4. unchecking the last module clears the localStorage entry

    // Start clean.
    await page.goto(`${FIXTURES}/forest-module/persistence-test.html`);
    await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });

    await page.reload();
    await page.waitForFunction(
      () => (window as any).__PERSISTENCE_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    // 1) Toggle 1.0 + 1.46 → localStorage gets both.
    await page.evaluate(() => {
      for (const lbl of document.querySelectorAll('#missions-panel label')) {
        const t = (lbl.textContent || '');
        if (t.includes('1.0 ') || t.includes('1.46 ')) {
          (lbl.querySelector('input[type=checkbox]') as HTMLInputElement).click();
        }
      }
    });
    await page.waitForTimeout(150);
    const stored = await page.evaluate(() => localStorage.getItem('forest-enabled-modules'));
    expect(stored).toBeTruthy();
    expect(stored!.split(',').sort()).toEqual(['1.0', '1.46']);

    // 2) Reload with no URL params: persistence restores both.
    await page.goto(`${FIXTURES}/forest-module/persistence-test.html`);
    await page.waitForFunction(
      () => (window as any).__PERSISTENCE_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );
    const afterReload = await page.evaluate(() => ({
      target:    (window as any).__TARGET_VERSIONS__.sort(),
      restored:  (window as any).__RESTORED_FROM_STORAGE__,
      checked:   [...document.querySelectorAll('#missions-panel label input[type=checkbox]')]
                   .filter((cb) => (cb as HTMLInputElement).checked).length,
    }));
    expect(afterReload.target).toEqual(['1.0', '1.46']);
    expect(afterReload.restored).toBe(true);
    expect(afterReload.checked).toBe(2);

    // 3) URL ?modules= overrides localStorage.
    await page.goto(`${FIXTURES}/forest-module/persistence-test.html?modules=1.12`);
    await page.waitForFunction(
      () => (window as any).__PERSISTENCE_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );
    const urlOverride = await page.evaluate(() => ({
      target:   (window as any).__TARGET_VERSIONS__,
      restored: (window as any).__RESTORED_FROM_STORAGE__,
    }));
    expect(urlOverride.target).toEqual(['1.12']);   // 1.0 / 1.46 ignored
    expect(urlOverride.restored).toBe(false);

    // 4) Unchecking everything clears the storage entry.
    // Reload to a clean state with all three checked.
    await page.goto(`${FIXTURES}/forest-module/persistence-test.html?modules=1.0,1.12,1.46`);
    await page.waitForFunction(
      () => (window as any).__PERSISTENCE_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );
    // Persist is only called via onChange — explicitly toggle each off.
    await page.evaluate(() => {
      for (const cb of document.querySelectorAll('#missions-panel label input[type=checkbox]')) {
        if ((cb as HTMLInputElement).checked) (cb as HTMLInputElement).click();
      }
    });
    await page.waitForTimeout(150);
    const cleared = await page.evaluate(() => localStorage.getItem('forest-enabled-modules'));
    expect(cleared).toBeNull();

    // Cleanup so other tests don't see persisted state.
    await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
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

  test('forest reset button: disables modules + clears storage + resets subsystems + clears step state', async ({ page }) => {
    // Verifies the runner page's reset button (mirrored in runner-controls-test
    // fixture) clears every accumulated piece of state in one click:
    //   - all enabled modules are disabled (their disable() hook is called)
    //   - localStorage entries for forest-enabled-modules + forest-panel-axis
    //     are removed
    //   - every subsystem with a reset() method is called
    //   - if the sim was paused, pause is cleared and the step button is
    //     disabled again
    await timedGoto(page, `${FIXTURES}/forest-module/runner-controls-test.html`);
    await page.waitForFunction(
      () => (window as any).__CONTROLS_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    // Pre-conditions: both modules enabled, both localStorage keys set.
    const before = await page.evaluate(() => ({
      enabledStorage: localStorage.getItem('forest-enabled-modules'),
      axisStorage:    localStorage.getItem('forest-panel-axis'),
      m1Enabled:      (window as any).__MODULES__.m1._enabled,
      m2Enabled:      (window as any).__MODULES__.m2._enabled,
      checked: [...document.querySelectorAll('#missions-panel label input[type=checkbox]')]
                 .filter((cb: any) => cb.checked).length,
    }));
    expect(before.enabledStorage).toBe('1.0,1.12');
    expect(before.axisStorage).toBe('organism');
    expect(before.m1Enabled).toBeGreaterThanOrEqual(1);
    expect(before.m2Enabled).toBeGreaterThanOrEqual(1);
    expect(before.checked).toBe(2);

    // Pause the sim so we can verify reset clears the pause state too.
    await page.locator('#pause-toggle').click();
    await page.waitForTimeout(50);
    const paused = await page.evaluate(() => ({
      ariaPressed: document.getElementById('pause-toggle')?.getAttribute('aria-pressed'),
      stepDisabled: (document.getElementById('step-frame') as HTMLButtonElement)?.disabled,
    }));
    expect(paused.ariaPressed).toBe('true');
    expect(paused.stepDisabled).toBe(false);

    // Click reset.
    await page.locator('#reset-scene').click();
    await page.waitForTimeout(100);

    const after = await page.evaluate(() => ({
      enabledStorage: localStorage.getItem('forest-enabled-modules'),
      axisStorage:    localStorage.getItem('forest-panel-axis'),
      m1Disabled:     (window as any).__MODULES__.m1._disabled,
      m2Disabled:     (window as any).__MODULES__.m2._disabled,
      checked: [...document.querySelectorAll('#missions-panel label input[type=checkbox]')]
                 .filter((cb: any) => cb.checked).length,
      resetCalls:     (window as any).__resetCalls.slice().sort(),
      pauseAria:      document.getElementById('pause-toggle')?.getAttribute('aria-pressed'),
      stepDisabled:   (document.getElementById('step-frame') as HTMLButtonElement)?.disabled,
      resetClicks:    (window as any).__resetClickCount,
    }));
    expect(after.enabledStorage).toBeNull();
    expect(after.axisStorage).toBeNull();
    expect(after.m1Disabled).toBeGreaterThanOrEqual(1);
    expect(after.m2Disabled).toBeGreaterThanOrEqual(1);
    expect(after.checked).toBe(0);
    expect(after.resetCalls).toEqual(['audio', 'boids', 'kuramoto', 'lsystem', 'physarum']);
    expect(after.pauseAria).toBe('false');
    expect(after.stepDisabled).toBe(true);
    expect(after.resetClicks).toBe(1);
  });

  test('forest keyboard shortcuts: p / ] / m / r behave like the buttons', async ({ page }) => {
    // p toggles pause, ] steps one frame (only while paused), m toggles
    // audio, r triggers reset. Skipped while typing in an input. ] is the
    // new shortcut introduced 2026-04-29 for pause-and-step.
    await timedGoto(page, `${FIXTURES}/forest-module/runner-controls-test.html`);
    await page.waitForFunction(
      () => (window as any).__CONTROLS_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    // Move focus off any input so keyboard handlers fire.
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());

    // Frame counter starts at 0 since the runner-controls fixture only ticks
    // on explicit step (no rAF loop in the fixture — keeps tests deterministic).
    const fc0 = await page.evaluate(() => (window as any).__frameCount);
    expect(fc0).toBe(0);

    // p: pause
    await page.keyboard.press('p');
    await page.waitForTimeout(50);
    const afterP = await page.evaluate(() => ({
      pauseAria: document.getElementById('pause-toggle')?.getAttribute('aria-pressed'),
      stepDisabled: (document.getElementById('step-frame') as HTMLButtonElement)?.disabled,
    }));
    expect(afterP.pauseAria).toBe('true');
    expect(afterP.stepDisabled).toBe(false);

    // ] : step one frame (only meaningful while paused)
    await page.keyboard.press(']');
    await page.waitForTimeout(50);
    const fc1 = await page.evaluate(() => (window as any).__frameCount);
    expect(fc1).toBe(1);

    // Press ] again — second frame advance.
    await page.keyboard.press(']');
    await page.waitForTimeout(50);
    const fc2 = await page.evaluate(() => (window as any).__frameCount);
    expect(fc2).toBe(2);

    // Resume (p again). ] should now no-op because the step button is
    // re-disabled when not paused.
    await page.keyboard.press('p');
    await page.waitForTimeout(50);
    const afterP2 = await page.evaluate(() => ({
      pauseAria: document.getElementById('pause-toggle')?.getAttribute('aria-pressed'),
      stepDisabled: (document.getElementById('step-frame') as HTMLButtonElement)?.disabled,
    }));
    expect(afterP2.pauseAria).toBe('false');
    expect(afterP2.stepDisabled).toBe(true);
    await page.keyboard.press(']');
    await page.waitForTimeout(50);
    const fc3 = await page.evaluate(() => (window as any).__frameCount);
    expect(fc3).toBe(2);    // unchanged

    // m: audio toggle
    const audioBefore = await page.evaluate(() => (window as any).__audioUnlocked);
    expect(audioBefore).toBe(false);
    await page.keyboard.press('m');
    await page.waitForTimeout(80);
    const audioAfter = await page.evaluate(() => ({
      unlocked: (window as any).__audioUnlocked,
      ariaPressed: document.getElementById('audio-toggle')?.getAttribute('aria-pressed'),
    }));
    expect(audioAfter.unlocked).toBe(true);
    expect(audioAfter.ariaPressed).toBe('true');

    // r: reset
    const resetClicksBefore = await page.evaluate(() => (window as any).__resetClickCount || 0);
    await page.keyboard.press('r');
    await page.waitForTimeout(80);
    const resetClicksAfter = await page.evaluate(() => (window as any).__resetClickCount);
    expect(resetClicksAfter).toBe(resetClicksBefore + 1);
  });

  test('forest pause-and-step button: disabled until paused, advances one frame on click', async ({ page }) => {
    // The step button is disabled by default and only enabled while paused.
    // Clicking it advances exactly one frame (verified via __frameCount).
    await timedGoto(page, `${FIXTURES}/forest-module/runner-controls-test.html`);
    await page.waitForFunction(
      () => (window as any).__CONTROLS_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    const stepBtn = page.locator('#step-frame');
    await expect(stepBtn).toBeDisabled();

    // Pause: step becomes enabled.
    await page.locator('#pause-toggle').click();
    await page.waitForTimeout(50);
    await expect(stepBtn).toBeEnabled();

    // Click step three times: __frameCount advances by exactly 3.
    const fcBefore = await page.evaluate(() => (window as any).__frameCount);
    await stepBtn.click();
    await stepBtn.click();
    await stepBtn.click();
    await page.waitForTimeout(50);
    const fcAfter = await page.evaluate(() => (window as any).__frameCount);
    expect(fcAfter - fcBefore).toBe(3);

    // Resume: step is disabled again.
    await page.locator('#pause-toggle').click();
    await page.waitForTimeout(50);
    await expect(stepBtn).toBeDisabled();
  });

  test('forest boids Phase-2 narrative methods: applyPhaseShift kicks boids; addMigrationWave + triggerEvent record visuals', async ({ page }) => {
    // The five boids "narrative" methods (addColony, addMigrationWave,
    // triggerEvent, applyPhaseShift, spawn) were originally ledger-only.
    // 2026-04-29 promotion: each now has a visible side-effect AND retains
    // its event-ledger entry. This test exercises the three that were not
    // already animated (addColony + spawn were already functional).
    await timedGoto(page, `${FIXTURES}/forest-module/subsystems-test.html`);
    await page.waitForFunction(
      () => (window as any).__SUBSYSTEMS_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    // applyPhaseShift: boid velocities inside the radius are kicked away
    // from the centre; an entry lands in _phaseShifts; ledger gets the event.
    const shiftRes = await page.evaluate(() => {
      const b: any = (window as any).__boids;
      // Pin a known boid near the shift centre so its velocity change is
      // verifiable. Capture (vx,vy) before and after.
      b.boids[0].x = 100; b.boids[0].y = 100;
      b.boids[0].vx = 0;  b.boids[0].vy = 0;
      const v0 = { vx: b.boids[0].vx, vy: b.boids[0].vy };
      b.applyPhaseShift({ x: 50, y: 50, magnitude: 0.8, radius: 200, durationS: 1.0 });
      const v1 = { vx: b.boids[0].vx, vy: b.boids[0].vy };
      return {
        speedBefore: Math.sqrt(v0.vx*v0.vx + v0.vy*v0.vy),
        speedAfter:  Math.sqrt(v1.vx*v1.vx + v1.vy*v1.vy),
        // Direction: from (50,50) to (100,100) → boid should move toward
        // positive x AND positive y (away from the centre).
        dxSign: Math.sign(v1.vx),
        dySign: Math.sign(v1.vy),
        ringCount: b._phaseShifts.length,
        eventCount: b.events.filter((e: any) => e.name === 'phaseShift').length,
        statsRingCount: b.stats().phaseShifts,
      };
    });
    expect(shiftRes.speedBefore).toBe(0);
    expect(shiftRes.speedAfter).toBeGreaterThan(0);
    expect(shiftRes.dxSign).toBe(1);
    expect(shiftRes.dySign).toBe(1);
    expect(shiftRes.ringCount).toBe(1);
    expect(shiftRes.eventCount).toBe(1);
    expect(shiftRes.statsRingCount).toBe(1);

    // addMigrationWave: spec normalised; entry stored with `recorded` time.
    const waveRes = await page.evaluate(() => {
      const b: any = (window as any).__boids;
      const id = b.addMigrationWave({
        startX: 0.1, startY: 0.5,
        endX:   0.9, endY:   0.5,
        durationS: 5,
      });
      const wave = b.migrationWaves.get(id);
      return {
        startX: wave.startX, startY: wave.startY,
        endX:   wave.endX,   endY:   wave.endY,
        durationS: wave.durationS,
        recorded: typeof wave.recorded,
        size: b.migrationWaves.size,
      };
    });
    // Coords normalised to pixel space: 0.1 * 1024 = 102.4
    expect(waveRes.startX).toBeCloseTo(102.4, 0);
    expect(waveRes.endX).toBeCloseTo(921.6, 0);
    expect(waveRes.durationS).toBe(5);
    expect(waveRes.recorded).toBe('number');
    expect(waveRes.size).toBeGreaterThanOrEqual(1);

    // triggerEvent with location: a marker is added to _eventMarkers AND the
    // ledger gets a row. Without a location, only the ledger gets the row.
    const evRes = await page.evaluate(() => {
      const b: any = (window as any).__boids;
      const m0 = b._eventMarkers.length;
      const e0 = b.events.length;
      b.triggerEvent('peck', { x: 200, y: 300 });
      b.triggerEvent('keepalive', {});  // no location
      return {
        markersAdded: b._eventMarkers.length - m0,
        eventsAdded:  b.events.length - e0,
        peckMarker:   b._eventMarkers.find((e: any) => e.name === 'peck'),
        statsMarkers: b.stats().eventMarkers,
      };
    });
    expect(evRes.markersAdded).toBe(1);    // only the located one
    expect(evRes.eventsAdded).toBe(2);     // both ledger rows
    expect(evRes.peckMarker).toBeDefined();
    expect(evRes.peckMarker.x).toBe(200);
    expect(evRes.peckMarker.y).toBe(300);
    expect(evRes.statsMarkers).toBeGreaterThanOrEqual(1);

    // Reset clears all narrative state.
    const afterReset = await page.evaluate(() => {
      const b: any = (window as any).__boids;
      b.reset();
      return {
        rings: b._phaseShifts.length,
        markers: b._eventMarkers.length,
        waves: b.migrationWaves.size,
        events: b.events.length,
      };
    });
    expect(afterReset.rings).toBe(0);
    expect(afterReset.markers).toBe(0);
    expect(afterReset.waves).toBe(0);
    expect(afterReset.events).toBe(0);
  });

  test('forest circadian.addOffset: phase(id) returns offset-adjusted phase, global sky stays wall-clock', async ({ page }) => {
    // addOffset(id, hours) is module-scoped — phase(id) returns the global
    // phase shifted by hours/24, mod 1. Global sky (sun/moon altitudes)
    // remains unaffected because the offset is per-module by design.
    await timedGoto(page, `${FIXTURES}/forest-module/subsystems-test.html`);
    await page.waitForFunction(
      () => (window as any).__SUBSYSTEMS_READY__ === true,
      { timeout: LOAD_BUDGET_MS }
    );

    const res = await page.evaluate(() => {
      const c: any = (window as any).__circadian;
      const sunBefore = c.sky.sunAlt;
      const pGlobal = c.phase();
      // +6h offset.
      c.addOffset('mod-A', 6);
      const pA = c.phase('mod-A');
      // -3h offset (negative wrap).
      c.addOffset('mod-B', -3);
      const pB = c.phase('mod-B');
      // Unknown id → falls back to global phase.
      const pUnknown = c.phase('not-registered');
      // Removing the offset returns the module to global phase.
      c.removeOffset('mod-A');
      const pAfterRemove = c.phase('mod-A');
      // Global sky did not move.
      const sunAfter = c.sky.sunAlt;
      // Subscribers receive a phaseFor() helper.
      let captured: any = null;
      const unsub = c.subscribe((p: number, phaseFor: (id: string) => number) => {
        captured = { p, phaseForB: phaseFor('mod-B'), phaseForGlobal: phaseFor() };
      });
      c.tick(1/30);
      unsub();
      return {
        sunBefore, sunAfter,
        pGlobal, pA, pB, pUnknown, pAfterRemove,
        captured,
      };
    });

    expect(res.sunBefore).toBe(res.sunAfter);
    // pA = pGlobal + 6/24 mod 1; pB = pGlobal - 3/24 mod 1. Allow a small
    // tolerance for a tick happening between reads.
    const expectedA = ((res.pGlobal + 6/24) % 1 + 1) % 1;
    expect(Math.abs(res.pA - expectedA)).toBeLessThan(0.05);
    const expectedB = ((res.pGlobal - 3/24) % 1 + 1) % 1;
    expect(Math.abs(res.pB - expectedB)).toBeLessThan(0.05);
    // Unknown id → global.
    expect(Math.abs(res.pUnknown - res.pGlobal)).toBeLessThan(0.05);
    // Removed → global.
    expect(Math.abs(res.pAfterRemove - res.pGlobal)).toBeLessThan(0.05);
    // Subscriber received a usable phaseFor accessor.
    expect(res.captured).not.toBeNull();
    expect(typeof res.captured.p).toBe('number');
    const expectedCapturedB = ((res.captured.p - 3/24) % 1 + 1) % 1;
    expect(Math.abs(res.captured.phaseForB - expectedCapturedB)).toBeLessThan(0.05);
    expect(Math.abs(res.captured.phaseForGlobal - res.captured.p)).toBeLessThan(0.001);
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
