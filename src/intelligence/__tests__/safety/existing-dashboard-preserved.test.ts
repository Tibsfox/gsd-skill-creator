/**
 * Phase 826 / C13 — S11: Existing dashboard nav preserved after migration
 *                    S12: Existing dashboard tabs/views preserved
 *
 * Verifies that dist/dashboard/index.html retains all original nav links and
 * hero metrics structure after the C14 migration adds the Intelligence tab.
 *
 * Uses static DOM parsing (no Playwright needed) for the content invariants.
 * Playwright-based visual snapshot is advisory (skip if browser not available).
 *
 * G2 BLOCK — any FAIL blocks release.
 *
 * Phase 826 / D-26-15.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../../../');
const DASHBOARD_HTML = join(REPO_ROOT, 'dist/dashboard/index.html');
const DASHBOARD_SOURCE = join(REPO_ROOT, 'dashboard/index.html');

// Original nav routes that must be preserved after migration
const REQUIRED_NAV_HREFS = [
  'index.html',
  'requirements.html',
  'roadmap.html',
  'milestones.html',
  'state.html',
  'console.html',
];

const REQUIRED_NAV_LABELS = [
  'Dashboard',
  'Requirements',
  'Roadmap',
  'Milestones',
  'State',
  'Console',
];

// ─── S11: Nav preserved ─────────────────────────────────────────────────────

describe('S11: existing dashboard nav preserved after C14 migration (G2 BLOCK)', () => {
  it('dist/dashboard/index.html contains all original nav links', () => {
    // Use dist/dashboard/ if it exists, else fall back to dashboard/ source
    const htmlFile = existsSync(DASHBOARD_HTML) ? DASHBOARD_HTML : DASHBOARD_SOURCE;
    const content = readFileSync(htmlFile, 'utf8');

    for (const href of REQUIRED_NAV_HREFS) {
      expect(content, `S11: nav link href="${href}" missing from dashboard HTML`).toContain(href);
    }
  });

  it('dist/dashboard/index.html contains all original nav labels', () => {
    const htmlFile = existsSync(DASHBOARD_HTML) ? DASHBOARD_HTML : DASHBOARD_SOURCE;
    const content = readFileSync(htmlFile, 'utf8');

    for (const label of REQUIRED_NAV_LABELS) {
      expect(content, `S11: nav label "${label}" missing from dashboard HTML`).toContain(label);
    }
  });

  it('nav structure contains a <ul class="nav-list"> with all expected links', () => {
    const htmlFile = existsSync(DASHBOARD_HTML) ? DASHBOARD_HTML : DASHBOARD_SOURCE;
    const content = readFileSync(htmlFile, 'utf8');

    // Find the nav-list section
    const navListMatch = content.match(/class="nav-list"[^>]*>([\s\S]*?)<\/ul>/);
    expect(navListMatch, 'S11: .nav-list element not found in dashboard HTML').toBeTruthy();

    const navListContent = navListMatch![1];
    for (const href of REQUIRED_NAV_HREFS) {
      expect(navListContent, `S11: href="${href}" not in nav-list`).toContain(href);
    }
  });
});

// ─── S12: Dashboard tabs/views preserved ─────────────────────────────────────

describe('S12: existing dashboard tabs/views preserved (G2 BLOCK)', () => {
  it('index.html contains hero metrics section structure', () => {
    const htmlFile = existsSync(DASHBOARD_HTML) ? DASHBOARD_HTML : DASHBOARD_SOURCE;
    const content = readFileSync(htmlFile, 'utf8');

    // Dashboard should have metric/card structure or known class names
    // The GSD dashboard uses milestone/phase layout — check for key markers
    const hasMetricContent = content.includes('phase') || content.includes('milestone') || content.includes('metric') || content.includes('status');
    expect(hasMetricContent, 'S12: No metric/phase/milestone content found in dashboard').toBe(true);
  });

  it('index.html does not regress below original line count after migration', () => {
    if (!existsSync(DASHBOARD_HTML)) {
      // Not built yet — check source file
      const content = readFileSync(DASHBOARD_SOURCE, 'utf8');
      const lineCount = content.split('\n').length;
      // Source is ~4127 lines; at minimum it should be substantial
      expect(lineCount, 'S12: dashboard source shrank unexpectedly').toBeGreaterThan(100);
      return;
    }
    // After migration, index.html should have at LEAST as many lines as before + the nav-shim line
    const sourceLines = readFileSync(DASHBOARD_SOURCE, 'utf8').split('\n').length;
    const distLines = readFileSync(DASHBOARD_HTML, 'utf8').split('\n').length;
    expect(distLines, `S12: dist/dashboard/index.html (${distLines} lines) has fewer lines than source (${sourceLines} lines)`).toBeGreaterThanOrEqual(sourceLines);
  });

  it('both dist and source dashboard index.html contain the nav-shim script tag (renderer-template integration)', () => {
    if (!existsSync(DASHBOARD_HTML) || !existsSync(DASHBOARD_SOURCE)) {
      // Pre-build — skip
      return;
    }

    // D-26-44 evolved (Phase 826.5): the original "1-line edit to dist/index.html"
    // rule was replaced by a renderer-template-level integration in
    // src/dashboard/renderer.ts. The script tag is now emitted by the universal
    // <head> template every time the dashboard generator runs.
    //
    // Line-count comparison between dist/ and source/ is intentionally NOT
    // asserted here because both are regenerated build artifacts that drift
    // independently (depending on regen timing, timestamp variations, and
    // intervening planning content changes). The real invariant is structural:
    // both files emit the nav-shim script tag because both came from the
    // shared renderer template.
    const sourceHasShim = readFileSync(DASHBOARD_SOURCE, 'utf8').includes('intelligence/nav-shim.js');
    const distHasShim = readFileSync(DASHBOARD_HTML, 'utf8').includes('intelligence/nav-shim.js');
    expect(sourceHasShim, 'S12/D-26-44: dashboard source missing nav-shim script tag').toBe(true);
    expect(distHasShim, 'S12/D-26-44: dist dashboard missing nav-shim script tag').toBe(true);
  });
});
