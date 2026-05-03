/**
 * playwright.config.ts — intelligence.html dashboard smoke (#10222 v1.49.598).
 *
 * Spins up `node scripts/serve-dashboard.mjs --port 3030` as the webServer
 * and runs intelligence-html-smoke.spec.ts against it.
 *
 * Soft gate at v1.49.598 ship; promote to hard gate at v1.49.599+ if soak holds.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.INTELLIGENCE_SMOKE_PORT || 3030);

export default defineConfig({
  testDir: '.',
  testMatch: /intelligence-html-smoke\.spec\.ts$/,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    video: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `node ../../scripts/serve-dashboard.mjs --port ${PORT}`,
    url: `http://localhost:${PORT}/intelligence.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
