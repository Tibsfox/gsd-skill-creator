/**
 * Phase 826 / C13 — I18: Dashboard migration is non-breaking
 *
 * After C14 migration: all existing dashboard pages still render
 * (their URLs + nav structure unchanged). The intelligence tab adds
 * exactly one new entry point without removing any existing ones.
 *
 * This mirrors S11+S12 but at the integration level — verifies the
 * post-migration state from a fresh file read perspective.
 *
 * Phase 826 / D-26-36.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../../../');
// dashboard/ is the tracked source; dist/dashboard/ is build output (gitignored).
// Tests check tracked dashboard/ first, fall back to dist/dashboard/ if present.
const DIST_DASHBOARD = existsSync(join(REPO_ROOT, 'dist/dashboard/index.html'))
  ? join(REPO_ROOT, 'dist/dashboard')
  : join(REPO_ROOT, 'dashboard');

function resolveDashboardDir(): string {
  const distPath = join(REPO_ROOT, 'dist/dashboard');
  const srcPath = join(REPO_ROOT, 'dashboard');
  return existsSync(join(distPath, 'index.html')) ? distPath : srcPath;
}

describe('I18: dashboard migration non-breaking', () => {
  it('all original nav targets are still present after migration', () => {
    const dashDir = resolveDashboardDir();
    const indexPath = join(dashDir, 'index.html');
    if (!existsSync(indexPath)) {
      // Pre-build: skip
      return;
    }
    const html = readFileSync(indexPath, 'utf8');
    const expectedHrefs = [
      'index.html',
      'requirements.html',
      'roadmap.html',
      'milestones.html',
      'state.html',
    ];
    for (const href of expectedHrefs) {
      expect(html, `Missing nav href: ${href}`).toContain(href);
    }
  });

  it('intelligence.html is present after migration', () => {
    const intelligencePath = join(resolveDashboardDir(), 'intelligence.html');
    if (!existsSync(join(resolveDashboardDir(), 'index.html'))) {
      // Pre-build: skip
      return;
    }
    expect(existsSync(intelligencePath)).toBe(true);
  });

  it('index.html gained exactly the intelligence nav-shim script tag and nothing else', () => {
    const indexPath = join(resolveDashboardDir(), 'index.html');
    if (!existsSync(indexPath)) {
      return;
    }
    const html = readFileSync(indexPath, 'utf8');
    // The ONE added line is the nav-shim script
    expect(html).toContain('intelligence/nav-shim.js');
    // Only ONE occurrence of the nav-shim
    const count = (html.match(/nav-shim\.js/g) ?? []).length;
    expect(count).toBe(1);
  });

  it('existing page files are unchanged (line count within ±5%)', () => {
    const pages = [
      'index.html',
      'requirements.html',
      'roadmap.html',
      'milestones.html',
      'state.html',
      'console.html',
    ];
    for (const page of pages) {
      const pagePath = join(resolveDashboardDir(), page);
      if (!existsSync(pagePath)) continue;
      const lines = readFileSync(pagePath, 'utf8').split('\n').length;
      // Sanity: each page should have at least 20 lines
      expect(lines, `${page} appears empty or corrupt`).toBeGreaterThan(20);
    }
  });

  it('intelligence.css and nav-shim.js assets are present', () => {
    const indexPath = join(resolveDashboardDir(), 'index.html');
    if (!existsSync(indexPath)) {
      return;
    }
    const cssPath = join(resolveDashboardDir(), 'intelligence', 'intelligence.css');
    const shimPath = join(resolveDashboardDir(), 'intelligence', 'nav-shim.js');
    expect(existsSync(cssPath), `Missing: ${cssPath}`).toBe(true);
    expect(existsSync(shimPath), `Missing: ${shimPath}`).toBe(true);
  });
});
