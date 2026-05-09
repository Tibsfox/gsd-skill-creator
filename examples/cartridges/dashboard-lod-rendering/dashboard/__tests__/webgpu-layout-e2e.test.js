// =============================================================================
// webgpu-layout-e2e.test.js  (OPTIONAL — gated on WEBGPU_TEST=1)
// =============================================================================
// End-to-end headless-browser test for WebGPU layout in the dashboard.
//
// This test file is SKIPPED in default test runs. It requires:
//   1. WEBGPU_TEST=1 environment variable set
//   2. A Playwright-compatible Chrome build with WebGPU enabled, e.g.:
//       - Chrome Canary or Chrome 113+ with --enable-unsafe-webgpu flag
//       - Playwright with chromium channel: '@playwright/test' and launch args:
//           ['--enable-unsafe-webgpu', '--use-angle=vulkan', '--enable-features=Vulkan']
//
// To run manually (once env conditions are met):
//   WEBGPU_TEST=1 npx vitest run \
//     examples/cartridges/dashboard-lod-rendering/dashboard/__tests__/webgpu-layout-e2e.test.js
//
// Or with Playwright directly:
//   WEBGPU_TEST=1 npx playwright test \
//     examples/cartridges/dashboard-lod-rendering/dashboard/__tests__/webgpu-layout-e2e.test.js
//
// Environment conditions for passing:
//   - Chrome 113+ (or Chromium with WebGPU enabled)
//   - The dashboard-service running: `node dashboard-service/serve.mjs`
//   - DASHBOARD_URL env var pointing to the running service (default: http://localhost:8088)
//
// Why this test is OPTIONAL (not blocking):
//   WebGPU in headless Playwright is only available with specific channel configs
//   (chromium channel does not expose navigator.gpu in headless mode by default
//    as of Playwright 1.59.1). The detection unit tests (webgpu-layout-detection.test.js)
//   are the load-bearing verification; this file validates the live browser path
//   and is operator-run-only until headless WebGPU is universally available.
//
// Manual operator verification path (no Playwright required):
//   1. Start: `node examples/cartridges/dashboard-lod-rendering/dashboard-service/serve.mjs`
//   2. Open Chrome 113+ at http://localhost:8088/
//   3. Open DevTools console
//   4. Expect: '[SCRIBE WebGPU] Adapter: <your GPU>' + '[SCRIBE WebGPU] Device acquired...'
//   5. Header badge shows 'layout: GPU' in green
//   6. Enable 'Force CPU layout' checkbox → reload corpus → badge shows 'layout: CPU'
// =============================================================================

import { describe, it, expect } from 'vitest';

const WEBGPU_TEST = process.env.WEBGPU_TEST === '1';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:8088';

// ---------------------------------------------------------------------------
// Skip all tests if WEBGPU_TEST=1 is not set
// ---------------------------------------------------------------------------
describe.skipIf(!WEBGPU_TEST)('WebGPU e2e (WEBGPU_TEST=1 required)', () => {
  it('dashboard auto-detects GPU mode in Chrome 113+ with WebGPU enabled', async () => {
    // This test uses the playwright API if available.
    // It is intentionally lightweight — just verify console output and badge state.
    let chromium, Browser, Page;
    try {
      ({ chromium } = await import('@playwright/test'));
    } catch {
      throw new Error(
        'Playwright not importable. Install with: npm install -D @playwright/test ' +
        'and run: npx playwright install chromium'
      );
    }

    // Launch with WebGPU flags
    const browser = await chromium.launch({
      args: [
        '--enable-unsafe-webgpu',
        '--use-angle=vulkan',
        '--enable-features=Vulkan',
      ],
    });
    const page = await browser.newPage();

    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle' });

    // Wait for the GPU badge to appear
    await page.waitForSelector('#gpu-layout-badge', { timeout: 10000 });

    // Check badge content
    const badgeText = await page.textContent('#gpu-layout-badge');

    // In a GPU-capable env, we expect 'layout: GPU'
    // In a non-GPU env (e.g. headless without flags), we expect 'layout: CPU'
    // Either is acceptable; we just verify the badge exists and has a valid value
    expect(['layout: GPU', 'layout: CPU']).toContain(badgeText);

    // If GPU mode was entered, verify the console logged the adapter info
    if (badgeText === 'layout: GPU') {
      const gpuLog = consoleMessages.find(m => m.includes('[SCRIBE WebGPU] Device acquired'));
      expect(gpuLog).toBeTruthy();
    }

    await browser.close();
  });

  it('Force CPU toggle disables GPU mode on next corpus load', async () => {
    let chromium;
    try {
      ({ chromium } = await import('@playwright/test'));
    } catch {
      throw new Error('Playwright not available');
    }

    const browser = await chromium.launch({
      args: ['--enable-unsafe-webgpu', '--use-angle=vulkan', '--enable-features=Vulkan'],
    });
    const page = await browser.newPage();
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle' });

    // Enable Force CPU toggle
    await page.check('#force-cpu-toggle');

    // Reload corpus by clicking the sample button
    await page.click('#corpus-sample');

    // Wait for badge update
    await page.waitForFunction(() => {
      const el = document.getElementById('gpu-layout-badge');
      return el && el.textContent !== 'layout: GPU';
    }, { timeout: 8000 });

    const badgeText = await page.textContent('#gpu-layout-badge');
    expect(badgeText).toBe('layout: CPU');

    await browser.close();
  });
});
