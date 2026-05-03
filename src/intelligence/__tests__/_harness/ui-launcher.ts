/**
 * Test harness: UI launcher (Playwright headless wrapper).
 *
 * Phase 826 / C13 / D-26-41.
 *
 * NOTE: Playwright UI tests (S11/S12/I18) require a built dashboard and a
 * running server. These tests are authored for completeness and skip gracefully
 * when the Playwright browser binary is not installed (CI without `npx playwright install`).
 *
 * Usage:
 *   import { launchTestUI } from './_harness/ui-launcher.js';
 *   const ui = await launchTestUI({ htmlPath: '/abs/path/to/index.html' });
 *   await ui.page.click('...');
 *   await ui.close();
 */

export interface UIHandle {
  /** The Playwright Page object. */
  page: import('@playwright/test').Page;
  /** Browser instance; close with ui.close(). */
  close(): Promise<void>;
}

export interface UILaunchOptions {
  /** Absolute path to the HTML file to load (file:// URL). */
  htmlPath: string;
  /** Viewport dimensions. Default: 1280×800. */
  viewport?: { width: number; height: number };
}

/**
 * Launch a headless Chromium page loading the given HTML file.
 *
 * Skips gracefully (returns null) when @playwright/test is not available or
 * when `CI_SKIP_PLAYWRIGHT=1` env var is set.
 */
export async function launchTestUI(opts: UILaunchOptions): Promise<UIHandle | null> {
  if (process.env['CI_SKIP_PLAYWRIGHT'] === '1') {
    return null;
  }
  let chromium: import('@playwright/test').BrowserType;
  try {
    const pw = await import('@playwright/test');
    chromium = pw.chromium;
  } catch {
    // playwright not installed
    return null;
  }

  let browser: import('@playwright/test').Browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    // Binary not installed
    return null;
  }

  const context = await browser.newContext({
    viewport: opts.viewport ?? { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  const fileUrl = `file://${opts.htmlPath}`;
  await page.goto(fileUrl);

  return {
    page,
    async close() {
      await browser.close();
    },
  };
}
