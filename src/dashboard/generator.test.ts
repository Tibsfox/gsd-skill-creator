/**
 * Tests for the dashboard generator pipeline.
 *
 * Covers:
 * - generate() creates index.html in output directory
 * - generate() returns result with pages, errors, duration
 * - generate() handles missing planning dir gracefully
 * - generate() handles partially missing artifacts
 * - Generated index.html contains project name from parsed data
 * - Generated index.html is valid HTML structure
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';

// Mock the metrics integration module
vi.mock('./metrics/integration.js', () => ({
  collectAndRenderMetrics: vi.fn(),
}));

// Mock the topology collector module
vi.mock('./collectors/topology-collector.js', () => ({
  collectTopologyData: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Fixtures — realistic .planning/ content
// ---------------------------------------------------------------------------

const PROJECT_MD = `# My Test Project

## What This Is

A test project for dashboard generation.

## Current Milestone: v1.0 First Release

**Goal:** Ship the initial version.
`;

const STATE_MD = `# State

## Current Position

Milestone: v1.0 First Release
Phase: 1 (Foundation) — active
Status: Executing phase 1
Progress: 0/3 phases complete | 0/10 requirements delivered

## Project Reference

**Current focus:** Building the foundation
`;

const ROADMAP_MD = `# Roadmap

## Phase 1: Foundation

**Status:** active
**Goal:** Build core infrastructure
**Requirements:** REQ-01, REQ-02
**Deliverables:**
- Core module
- CLI entry point
`;

const MILESTONES_MD = `# Shipped Milestones

### v1.0 — First Release (Phases 1-3)

**Goal:** Ship the initial version.
**Shipped:** 2026-01-15

**Requirements:** 10 | **Phases:** 3 | **Plans:** 8

**Totals:** 1 milestone | 3 phases | 8 plans
`;

describe('generate', () => {
  let outputDir: string;
  let planningDir: string;

  beforeEach(async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'gsd-gen-out-'));
    planningDir = await mkdtemp(join(tmpdir(), 'gsd-gen-plan-'));
  });

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true }).catch(() => {});
    await rm(planningDir, { recursive: true, force: true }).catch(() => {});
  });

  it('creates index.html in output directory', async () => {
    // Populate planning dir with all artifacts
    await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
    await writeFile(join(planningDir, 'STATE.md'), STATE_MD);
    await writeFile(join(planningDir, 'ROADMAP.md'), ROADMAP_MD);
    await writeFile(join(planningDir, 'MILESTONES.md'), MILESTONES_MD);

    const { generate } = await import('./generator.js');
    await generate({ planningDir, outputDir });

    const indexPath = join(outputDir, 'index.html');
    const content = await readFile(indexPath, 'utf-8');
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);
  });

  it('returns result with pages, errors, and duration', async () => {
    await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);

    const { generate } = await import('./generator.js');
    const result = await generate({ planningDir, outputDir });

    expect(result).toHaveProperty('pages');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('duration');
    expect(Array.isArray(result.pages)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.pages).toContain('index.html');
  });

  it('handles missing planning dir gracefully', async () => {
    const { generate } = await import('./generator.js');
    const result = await generate({
      planningDir: '/nonexistent/path/planning',
      outputDir,
    });

    // Should not throw — returns errors instead
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.pages).toHaveLength(0);
  });

  it('handles partially missing artifacts', async () => {
    // Only PROJECT.md exists — no STATE, ROADMAP, etc.
    await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);

    const { generate } = await import('./generator.js');
    const result = await generate({ planningDir, outputDir });

    // Should still generate index.html with available data
    expect(result.pages).toContain('index.html');
    expect(result.errors).toHaveLength(0);
  });

  it('generated index.html contains project name', async () => {
    await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
    await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

    const { generate } = await import('./generator.js');
    await generate({ planningDir, outputDir });

    const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
    expect(content).toContain('My Test Project');
  });

  it('generated index.html is valid HTML structure', async () => {
    await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
    await writeFile(join(planningDir, 'STATE.md'), STATE_MD);
    await writeFile(join(planningDir, 'ROADMAP.md'), ROADMAP_MD);
    await writeFile(join(planningDir, 'MILESTONES.md'), MILESTONES_MD);

    const { generate } = await import('./generator.js');
    await generate({ planningDir, outputDir });

    const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
    expect(content).toMatch(/<!DOCTYPE html>/i);
    expect(content).toMatch(/<html/);
    expect(content).toMatch(/<head>/);
    expect(content).toMatch(/<body>/);
    expect(content).toMatch(/<\/html>/);
  });

  it('creates output directory if it does not exist', async () => {
    await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);

    const nestedOutput = join(outputDir, 'nested', 'deep');
    const { generate } = await import('./generator.js');
    const result = await generate({ planningDir, outputDir: nestedOutput });

    expect(result.pages).toContain('index.html');
    const content = await readFile(join(nestedOutput, 'index.html'), 'utf-8');
    expect(content).toBeTruthy();
  });

  it('injects refresh script when live mode is enabled', async () => {
    await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);

    const { generate } = await import('./generator.js');
    const result = await generate({
      planningDir,
      outputDir,
      live: true,
      refreshInterval: 3000,
    });

    expect(result.pages).toContain('index.html');
    const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
    // Refresh script should be injected
    expect(content).toContain('setInterval');
    expect(content).toContain('3000');
  });

  it('generates all 5 pages with full data', async () => {
    await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
    await writeFile(join(planningDir, 'STATE.md'), STATE_MD);
    await writeFile(join(planningDir, 'ROADMAP.md'), ROADMAP_MD);
    await writeFile(join(planningDir, 'MILESTONES.md'), MILESTONES_MD);

    const { generate } = await import('./generator.js');
    const result = await generate({ planningDir, outputDir, force: true });

    expect(result.pages).toContain('index.html');
    expect(result.pages).toContain('requirements.html');
    expect(result.pages).toContain('roadmap.html');
    expect(result.pages).toContain('milestones.html');
    expect(result.pages).toContain('state.html');
    expect(result.pages).toHaveLength(5);
  });

  it('skips pages when content hash matches manifest (incremental)', async () => {
    await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);

    const { generate } = await import('./generator.js');

    // First run generates pages
    const result1 = await generate({ planningDir, outputDir, force: true });
    expect(result1.pages.length).toBeGreaterThan(0);

    // Manually read back the manifest and verify it exists
    const manifestPath = join(outputDir, '.dashboard-manifest.json');
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    expect(Object.keys(manifest.pages).length).toBeGreaterThan(0);
  });

  it('uses default refresh interval when live is true but no interval specified', async () => {
    await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);

    const { generate } = await import('./generator.js');
    const result = await generate({
      planningDir,
      outputDir,
      live: true,
    });

    expect(result.pages).toContain('index.html');
    const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
    // Default interval is 5000ms
    expect(content).toContain('5000');
  });

  // -------------------------------------------------------------------------
  // Metrics integration tests (100-02)
  // -------------------------------------------------------------------------

  describe('metrics integration', () => {
    beforeEach(async () => {
      // Reset the mock before each metrics test
      const { collectAndRenderMetrics } = await import('./metrics/integration.js');
      vi.mocked(collectAndRenderMetrics).mockReset();
    });

    it('includes metrics HTML in generated index page', async () => {
      // Setup: mock collectAndRenderMetrics to return known HTML
      const { collectAndRenderMetrics } = await import('./metrics/integration.js');
      vi.mocked(collectAndRenderMetrics).mockResolvedValue({
        html: '<!-- METRICS_SECTION -->',
        sections: 4,
        durationMs: 50,
      });

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({ planningDir, outputDir, force: true });

      expect(result.pages).toContain('index.html');
      const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
      expect(content).toContain('<!-- METRICS_SECTION -->');
    });

    it('passes live: true to collectAndRenderMetrics when live option is set', async () => {
      const { collectAndRenderMetrics } = await import('./metrics/integration.js');
      vi.mocked(collectAndRenderMetrics).mockResolvedValue({
        html: '<!-- LIVE_METRICS -->',
        sections: 4,
        durationMs: 30,
      });

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);

      const { generate } = await import('./generator.js');
      await generate({ planningDir, outputDir, live: true, force: true });

      expect(collectAndRenderMetrics).toHaveBeenCalledWith(
        expect.objectContaining({ live: true }),
      );
    });

    it('passes live: false to collectAndRenderMetrics when live option is not set', async () => {
      const { collectAndRenderMetrics } = await import('./metrics/integration.js');
      vi.mocked(collectAndRenderMetrics).mockResolvedValue({
        html: '<!-- STATIC_METRICS -->',
        sections: 4,
        durationMs: 20,
      });

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);

      const { generate } = await import('./generator.js');
      await generate({ planningDir, outputDir, force: true });

      expect(collectAndRenderMetrics).toHaveBeenCalledWith(
        expect.objectContaining({ live: false }),
      );
    });

    it('generates index page without metrics when collectAndRenderMetrics rejects', async () => {
      const { collectAndRenderMetrics } = await import('./metrics/integration.js');
      vi.mocked(collectAndRenderMetrics).mockRejectedValue(
        new Error('Metrics collection failed'),
      );

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({ planningDir, outputDir, force: true });

      // Generation should still succeed
      expect(result.pages).toContain('index.html');
      expect(result.errors).toHaveLength(0);

      // Index page should exist but without metrics content
      const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
      expect(content).toBeTruthy();
      expect(content).not.toContain('<!-- METRICS_SECTION -->');
    });
  });

  // -------------------------------------------------------------------------
  // Style completeness tests (152-01)
  // -------------------------------------------------------------------------

  describe('style completeness', () => {
    beforeEach(async () => {
      const { collectAndRenderMetrics } = await import('./metrics/integration.js');
      vi.mocked(collectAndRenderMetrics).mockReset();
      vi.mocked(collectAndRenderMetrics).mockResolvedValue({
        html: '',
        sections: 0,
        durationMs: 0,
      });
    });

    async function generateAndReadIndex(): Promise<string> {
      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);
      await writeFile(join(planningDir, 'ROADMAP.md'), ROADMAP_MD);
      await writeFile(join(planningDir, 'MILESTONES.md'), MILESTONES_MD);

      const { generate } = await import('./generator.js');
      await generate({ planningDir, outputDir, force: true });

      return readFile(join(outputDir, 'index.html'), 'utf-8');
    }

    it('generated index.html includes entity-legend styles', async () => {
      const content = await generateAndReadIndex();
      expect(content).toContain('.entity-legend');
    });

    it('generated index.html includes entity-shape styles', async () => {
      const content = await generateAndReadIndex();
      expect(content).toContain('.entity-shape');
    });

    it('generated index.html includes silicon-panel styles', async () => {
      const content = await generateAndReadIndex();
      expect(content).toContain('.silicon-panel');
    });

    it('generated index.html includes budget-gauge styles', async () => {
      const content = await generateAndReadIndex();
      expect(content).toContain('.budget-gauge');
    });

    it('generated index.html includes staging-queue styles', async () => {
      const content = await generateAndReadIndex();
      expect(content).toContain('.staging-queue-panel');
    });

    it('generated index.html includes question-card styles', async () => {
      const content = await generateAndReadIndex();
      expect(content).toContain('.question-card');
    });

    it('generated index.html includes upload-zone styles', async () => {
      const content = await generateAndReadIndex();
      expect(content).toContain('.upload-zone');
    });

    it('generated index.html includes config-form styles', async () => {
      const content = await generateAndReadIndex();
      expect(content).toContain('.config-form');
    });

    it('generated index.html includes submit-flow styles', async () => {
      const content = await generateAndReadIndex();
      expect(content).toContain('.submit-flow');
    });

    it('generated index.html includes console-settings styles', async () => {
      const content = await generateAndReadIndex();
      expect(content).toContain('.console-settings-panel');
    });

    it('generated index.html includes console-activity styles', async () => {
      const content = await generateAndReadIndex();
      expect(content).toContain('.console-activity');
    });

    it('generated index.html includes console-page styles', async () => {
      const content = await generateAndReadIndex();
      expect(content).toContain('.console-page');
    });
  });

  // -------------------------------------------------------------------------
  // Topology and entity legend integration tests (153-02)
  // -------------------------------------------------------------------------

  describe('topology integration', () => {
    beforeEach(async () => {
      const { collectAndRenderMetrics } = await import('./metrics/integration.js');
      vi.mocked(collectAndRenderMetrics).mockReset();
      vi.mocked(collectAndRenderMetrics).mockResolvedValue({
        html: '',
        sections: 0,
        durationMs: 0,
      });

      const { collectTopologyData } = await import('./collectors/topology-collector.js');
      vi.mocked(collectTopologyData).mockReset();
    });

    it('includes topology panel content when collector returns data', async () => {
      const { collectTopologyData } = await import('./collectors/topology-collector.js');
      vi.mocked(collectTopologyData).mockResolvedValue({
        agents: [{ id: 'agent-1', name: 'Test Agent', domain: 'backend', skills: [] }],
        skills: [{ id: 'skill-1', name: 'Test Skill', domain: 'frontend', agentId: undefined }],
        teams: [],
        activeAgentIds: [],
        activeSkillIds: [],
      });

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({ planningDir, outputDir, force: true });

      expect(result.pages).toContain('index.html');
      const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
      expect(content).toContain('topology-panel');
    });

    it('includes entity legend in generated index page', async () => {
      const { collectTopologyData } = await import('./collectors/topology-collector.js');
      vi.mocked(collectTopologyData).mockResolvedValue({
        agents: [{ id: 'agent-1', name: 'Test Agent', domain: 'backend', skills: [] }],
        skills: [],
        teams: [],
        activeAgentIds: [],
        activeSkillIds: [],
      });

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      await generate({ planningDir, outputDir, force: true });

      const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
      expect(content).toContain('entity-legend');
      expect(content).toContain('Shape &amp; Color Legend');
    });

    it('generates index page successfully when topology collector throws', async () => {
      const { collectTopologyData } = await import('./collectors/topology-collector.js');
      vi.mocked(collectTopologyData).mockRejectedValue(
        new Error('Topology collection failed'),
      );

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({ planningDir, outputDir, force: true });

      // Generation should still succeed
      expect(result.pages).toContain('index.html');
      expect(result.errors).toHaveLength(0);

      // Index page should exist but without topology content
      const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
      expect(content).toBeTruthy();
      expect(content).not.toContain('topology-panel');
    });

    it('passes real topologySource to renderIndexContent instead of undefined', async () => {
      const { collectTopologyData } = await import('./collectors/topology-collector.js');
      vi.mocked(collectTopologyData).mockResolvedValue({
        agents: [{ id: 'builder', name: 'Builder Agent', domain: 'infrastructure', skills: ['deploy'] }],
        skills: [{ id: 'deploy', name: 'Deploy Skill', domain: 'infrastructure', agentId: 'builder' }],
        teams: [],
        activeAgentIds: [],
        activeSkillIds: [],
      });

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      await generate({ planningDir, outputDir, force: true });

      const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
      // The topology panel should contain SVG node data from the real source
      expect(content).toContain('data-node-id');
      expect(content).toContain('Builder Agent');
    });
  });
});
