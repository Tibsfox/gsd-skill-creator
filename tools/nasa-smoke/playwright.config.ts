/**
 * playwright.config.ts — NASA shared-harness smoke test.
 *
 * Static-serves the repo root so the harness at
 *   www/tibsfox/com/Research/NASA/_harness/v1.0.0/*
 * is reachable at
 *   http://localhost:{PORT}/www/tibsfox/com/Research/NASA/_harness/v1.0.0/*
 * and fixtures at
 *   http://localhost:{PORT}/tools/nasa-smoke/fixtures/sample-mission/*
 *
 * Uses `npx http-server` via npm-exec so we do NOT add http-server as a
 * project dependency -- @playwright/test is the only new devDep. If
 * http-server is not on the local PATH, the test runner skips gracefully
 * (see runner.spec.ts test.describe.skip behaviour).
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.NASA_SMOKE_PORT || 4321);

export default defineConfig({
  testDir: '.',
  testMatch: /runner\.spec\.ts$/,
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
    // Serve from two-levels up (repo root) so absolute paths like
    // /www/tibsfox/com/... resolve.
    command:
      `npx --yes http-server ../.. -p ${PORT} -a 127.0.0.1 -c-1 --cors --silent`,
    url: `http://localhost:${PORT}/tools/nasa-smoke/fixtures/sample-mission/audio/sample-synth.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
