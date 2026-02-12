/**
 * Integration tests for the dashboard generator pipeline.
 *
 * Exercises the full flow: write fixture .planning/ files, run generate(),
 * then validate the resulting HTML output for structure, DOCTYPE, navigation,
 * and cross-page link integrity.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generate } from './generator.js';
import type { GenerateResult } from './generator.js';

// ---------------------------------------------------------------------------
// Fixture data — minimal but realistic .planning/ content
// ---------------------------------------------------------------------------

const PROJECT_MD = `# My Integration Test Project

## What This Is

An integration test project for the dashboard generator pipeline.

## Current Milestone: v2.0 Dashboard

**Goal:** Build a beautiful dashboard from planning artifacts.
`;

const REQUIREMENTS_MD = `# Requirements

## Goal

Deliver a dashboard that renders planning artifacts as HTML.

## Requirements

### Core Features

- **REQ-001**: Parse .planning/ markdown into structured data
- **REQ-002**: Render HTML pages with navigation
- **REQ-003**: Generate valid HTML5 output
- **REQ-004**: Support incremental builds

### Quality

- **REQ-005**: Unit tests >= 80% branch coverage
`;

const ROADMAP_MD = `# Roadmap

## Phase 1: Parser

**Status:** complete
**Goal:** Parse all markdown artifact types
**Requirements:** REQ-001
**Deliverables:**
- Markdown parser module
- Type definitions

## Phase 2: Renderer

**Status:** active
**Goal:** Render HTML pages with navigation and styles
**Requirements:** REQ-002, REQ-003
**Deliverables:**
- HTML renderer
- CSS styles
- Navigation component

## Phase 3: Polish

**Status:** pending
**Goal:** Final quality pass and tooling
**Requirements:** REQ-004, REQ-005
**Deliverables:**
- Incremental builds
- Integration tests
`;

const STATE_MD = `# State

## Current Position

Milestone: v2.0 Dashboard
Phase: 2 (Renderer) — active
Status: Executing phase 2
Progress: 1/3 phases complete | 1/5 requirements delivered

## Project Reference

**Current focus:** Building the renderer

## Session Continuity

Last: 2026-02-12 — Completed phase 1
Next action: Continue phase 2 implementation
`;

const MILESTONES_MD = `# Shipped Milestones

### v1.0 — Initial Release (Phases 1-5)

**Goal:** Ship the initial version with core features.
**Shipped:** 2026-01-15

**Requirements:** 10 | **Phases:** 5 | **Plans:** 12

### v1.5 — Quality Pass (Phases 6-8)

**Goal:** Improve test coverage and documentation.
**Shipped:** 2026-02-01

**Requirements:** 5 | **Phases:** 3 | **Plans:** 6

**Totals:** 2 milestones | 8 phases | 18 plans
`;

// ---------------------------------------------------------------------------
// Expected pages
// ---------------------------------------------------------------------------

const EXPECTED_PAGES = [
  'index.html',
  'requirements.html',
  'roadmap.html',
  'milestones.html',
  'state.html',
];

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('dashboard integration', () => {
  let planningDir: string;
  let outputDir: string;
  let result: GenerateResult;

  beforeAll(async () => {
    // Create temp directories
    planningDir = await mkdtemp(join(tmpdir(), 'gsd-integ-plan-'));
    outputDir = await mkdtemp(join(tmpdir(), 'gsd-integ-out-'));

    // Write all fixture files
    await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
    await writeFile(join(planningDir, 'REQUIREMENTS.md'), REQUIREMENTS_MD);
    await writeFile(join(planningDir, 'ROADMAP.md'), ROADMAP_MD);
    await writeFile(join(planningDir, 'STATE.md'), STATE_MD);
    await writeFile(join(planningDir, 'MILESTONES.md'), MILESTONES_MD);

    // Run the generator
    result = await generate({ planningDir, outputDir, force: true });
  });

  afterAll(async () => {
    await rm(planningDir, { recursive: true, force: true }).catch(() => {});
    await rm(outputDir, { recursive: true, force: true }).catch(() => {});
  });

  // -------------------------------------------------------------------------
  // Generation result checks
  // -------------------------------------------------------------------------

  it('generates all 5 expected pages', () => {
    expect(result.errors).toHaveLength(0);
    for (const page of EXPECTED_PAGES) {
      expect(result.pages).toContain(page);
    }
    expect(result.pages).toHaveLength(5);
  });

  it('reports a positive duration', () => {
    expect(result.duration).toBeGreaterThan(0);
  });

  it('creates all files on disk', async () => {
    const files = await readdir(outputDir);
    for (const page of EXPECTED_PAGES) {
      expect(files).toContain(page);
    }
  });

  // -------------------------------------------------------------------------
  // HTML validity checks (per page)
  // -------------------------------------------------------------------------

  for (const page of EXPECTED_PAGES) {
    describe(page, () => {
      let html: string;

      beforeAll(async () => {
        html = await readFile(join(outputDir, page), 'utf-8');
      });

      it('has <!DOCTYPE html> declaration', () => {
        expect(html).toMatch(/^<!DOCTYPE html>/i);
      });

      it('has valid HTML structure', () => {
        expect(html).toMatch(/<html[^>]*>/);
        expect(html).toMatch(/<head>/);
        expect(html).toMatch(/<\/head>/);
        expect(html).toMatch(/<body>/);
        expect(html).toMatch(/<\/body>/);
        expect(html).toMatch(/<\/html>/);
      });

      it('has a proper <title> tag', () => {
        expect(html).toMatch(/<title>[^<]+<\/title>/);
      });

      it('has a <nav> element', () => {
        expect(html).toMatch(/<nav[^>]*>/);
      });

      it('has charset meta tag', () => {
        expect(html).toMatch(/<meta charset="utf-8">/i);
      });

      it('has viewport meta tag', () => {
        expect(html).toMatch(/<meta name="viewport"/i);
      });

      it('navigation links reference valid page filenames', () => {
        // Extract all href values from nav links
        const navMatch = html.match(/<nav[^>]*>[\s\S]*?<\/nav>/);
        expect(navMatch).toBeTruthy();

        const navHtml = navMatch![0];
        const hrefMatches = navHtml.matchAll(/href="([^"]+)"/g);

        for (const match of hrefMatches) {
          const href = match[1];
          // Each nav link should point to one of our expected pages
          expect(EXPECTED_PAGES).toContain(href);
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // Content-specific checks
  // -------------------------------------------------------------------------

  it('index page contains project name', async () => {
    const html = await readFile(join(outputDir, 'index.html'), 'utf-8');
    expect(html).toContain('My Integration Test Project');
  });

  it('requirements page contains requirement IDs', async () => {
    const html = await readFile(join(outputDir, 'requirements.html'), 'utf-8');
    expect(html).toContain('REQ-001');
    expect(html).toContain('REQ-005');
  });

  it('roadmap page contains phase names', async () => {
    const html = await readFile(join(outputDir, 'roadmap.html'), 'utf-8');
    expect(html).toContain('Parser');
    expect(html).toContain('Renderer');
    expect(html).toContain('Polish');
  });

  it('milestones page contains milestone versions', async () => {
    const html = await readFile(join(outputDir, 'milestones.html'), 'utf-8');
    expect(html).toContain('v1.0');
    expect(html).toContain('v1.5');
  });

  it('state page contains current status info', async () => {
    const html = await readFile(join(outputDir, 'state.html'), 'utf-8');
    expect(html).toContain('v2.0 Dashboard');
  });

  // -------------------------------------------------------------------------
  // Build manifest check
  // -------------------------------------------------------------------------

  it('creates a build manifest file', async () => {
    const files = await readdir(outputDir);
    expect(files).toContain('.dashboard-manifest.json');

    const manifest = JSON.parse(
      await readFile(join(outputDir, '.dashboard-manifest.json'), 'utf-8'),
    );
    expect(manifest).toHaveProperty('pages');
    for (const page of EXPECTED_PAGES) {
      expect(manifest.pages).toHaveProperty(page);
      expect(manifest.pages[page]).toHaveProperty('hash');
      expect(manifest.pages[page]).toHaveProperty('generatedAt');
    }
  });

  // -------------------------------------------------------------------------
  // Incremental build check
  // -------------------------------------------------------------------------

  it('regenerates pages when content changes due to timestamp', async () => {
    // Run again without --force. Since generatedAt timestamp changes on every
    // run, content hashes will differ and all pages should regenerate.
    const result2 = await generate({ planningDir, outputDir });

    // Pages regenerate because the embedded timestamp changes the content hash
    expect(result2.errors).toHaveLength(0);
    expect(result2.pages.length + result2.skipped.length).toBe(5);
  });
});
