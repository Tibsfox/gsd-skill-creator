/**
 * intelligence-html-smoke.spec.ts — Playwright smoke test for intelligence.html
 *
 * Closes CF-PLAYWRIGHT (#10222 carryover from v1.49.597).
 *
 * Authored at v1.49.598 W3 (Phase 832.1) per ROADMAP.md spec:
 *   "Author tests/intelligence/intelligence-html-smoke.spec.ts (Playwright) that
 *    opens http://localhost:3030/intelligence.html against the actual
 *    serve-dashboard.mjs, waits for the bundle to load and mount, and asserts
 *    >=1 expected DOM element appears."
 *
 * Why this exists: v1.49.597 ship-pipeline manual smoke surfaced that the
 * intelligence.html dashboard tab was not covered by automated end-to-end
 * verification. A regression in serve-dashboard.mjs OR the dashboard generator
 * pipeline could break intelligence.html silently; only manual operator smoke
 * would catch it. This Playwright spec adds the missing automated coverage.
 *
 * Execution model: this spec runs via `playwright test --config=tests/intelligence/playwright.config.ts`
 * (separate Playwright config from `tools/nasa-smoke/playwright.config.ts`). The
 * webServer block spins up `node scripts/serve-dashboard.mjs --port 3030` as a
 * webServer prerequisite; if the port is already in use, Playwright will reuse
 * the existing server (`reuseExistingServer: true` in non-CI mode).
 *
 * Soft gate at v1.49.598 ship; hard gate from v1.49.599 onward (operator decides
 * at v599 ship pipeline based on stability soak).
 */
import { test, expect } from '@playwright/test';

const SMOKE_BUDGET_MS = 5_000;

test.describe('intelligence.html dashboard smoke', () => {
  test('intelligence.html loads and mounts intelligence-root within 5s', async ({ page }) => {
    const started = Date.now();
    const resp = await page.goto('/intelligence.html', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - started;

    expect(resp?.ok(), `HTTP ${resp?.status()} for /intelligence.html`).toBeTruthy();
    expect(elapsed).toBeLessThan(SMOKE_BUDGET_MS);

    // Assert >=1 expected DOM element appears (per ROADMAP 832.1 spec)
    // The intelligence-root div is the canonical mount point for the
    // intelligence dashboard subsystem (per v1.49.597 C00-C04 + C08-C09 work).
    const root = page.locator('#intelligence-root');
    await expect(root).toBeVisible({ timeout: SMOKE_BUDGET_MS });

    // Verify the static-mode banner element exists (browser-tab mode contract)
    const banner = page.locator('#intelligence-static-mode-banner');
    await expect(banner).toBeAttached();

    // Verify the page-wrapper layout is present (top-level structural contract)
    const pageWrapper = page.locator('.page-wrapper');
    await expect(pageWrapper).toBeVisible();
  });

  test('intelligence.html navigation references all 7 dashboard tabs', async ({ page }) => {
    await page.goto('/intelligence.html');

    // The intelligence.html navigation list should reference all 7 dashboard
    // tabs (Dashboard, Requirements, Roadmap, Milestones, State, Console,
    // Intelligence). Smoke-level assertion: nav-list exists with >=7 nav-link items.
    const navList = page.locator('ul.nav-list');
    await expect(navList).toBeVisible();

    const navLinks = navList.locator('li a.nav-link');
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(7);

    // The Intelligence tab should be marked active on this page
    const activeLink = navList.locator('a.nav-link.active');
    await expect(activeLink).toHaveText(/Intelligence/);
  });
});
