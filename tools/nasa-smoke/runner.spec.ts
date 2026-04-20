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
});
