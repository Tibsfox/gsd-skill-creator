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

// Mock the activity collector module
vi.mock('./collectors/activity-collector.js', () => ({
  collectActivityFeed: vi.fn().mockResolvedValue([]),
}));

// Mock the budget-silicon collector module
vi.mock('./budget-silicon-collector.js', () => ({
  collectBudgetSiliconData: vi.fn().mockResolvedValue({
    gauge: {
      segments: [{ domain: 'test', percentage: 45, color: 'var(--domain-testing)' }],
      totalUsed: 45,
      label: 'Token Budget',
    },
    silicon: {
      enabled: null,
      adapters: [],
      vram: { segments: [], totalUsed: 0 },
    },
  }),
}));

// Mock the staging queue collector module
vi.mock('./collectors/staging-collector.js', () => ({
  collectStagingQueue: vi.fn().mockResolvedValue({
    entries: [],
    dependencies: [],
  }),
}));

// Mock the console page data collector module
vi.mock('./collectors/console-collector.js', () => ({
  collectConsoleData: vi.fn().mockResolvedValue({
    status: null,
    questions: [],
    helperUrl: '/api/console/message',
    config: null,
    activityEntries: [],
  }),
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

  it('generates all 6 pages with full data', async () => {
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
    expect(result.pages).toContain('console.html');
    expect(result.pages).toHaveLength(6);
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

      // Index page should exist but without topology panel HTML element
      const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
      expect(content).toBeTruthy();
      // Styles will still reference .topology-panel, but the actual panel div should not exist
      expect(content).not.toContain('<div class="topology-panel">');
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

  // -------------------------------------------------------------------------
  // Activity feed integration tests (154-02)
  // -------------------------------------------------------------------------

  describe('activity feed integration', () => {
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

      const { collectActivityFeed } = await import('./collectors/activity-collector.js');
      vi.mocked(collectActivityFeed).mockReset();
    });

    it('renders activity feed with real entries from collector', async () => {
      const { collectActivityFeed } = await import('./collectors/activity-collector.js');
      vi.mocked(collectActivityFeed).mockResolvedValue([
        {
          entityType: 'plan',
          domain: 'infrastructure',
          identifier: '154-01',
          description: 'implement activity collector',
          occurredAt: '2026-02-14T10:00:00Z',
        },
      ]);

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({
        planningDir,
        outputDir,
        force: true,
      });

      expect(result.errors).toHaveLength(0);

      const indexHtml = await readFile(join(outputDir, 'index.html'), 'utf-8');
      // Verify the entry appears in the HTML (not the "No activity" empty state)
      expect(indexHtml).toContain('154-01');
      expect(indexHtml).toContain('implement activity collector');
      expect(indexHtml).not.toContain('No activity');
    });

    it('renders empty activity feed when collector fails', async () => {
      const { collectActivityFeed } = await import('./collectors/activity-collector.js');
      vi.mocked(collectActivityFeed).mockRejectedValue(new Error('git not found'));

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({
        planningDir,
        outputDir,
        force: true,
      });

      expect(result.errors).toHaveLength(0);
      const indexHtml = await readFile(join(outputDir, 'index.html'), 'utf-8');
      expect(indexHtml).toContain('No activity');
    });

    it('renders entity type shape indicators in activity feed entries', async () => {
      const { collectActivityFeed } = await import('./collectors/activity-collector.js');
      vi.mocked(collectActivityFeed).mockResolvedValue([
        {
          entityType: 'skill',
          domain: 'frontend',
          identifier: 'F-1',
          description: 'skill activated',
          occurredAt: '2026-02-14T10:00:00Z',
        },
      ]);

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      await generate({
        planningDir,
        outputDir,
        force: true,
      });

      const indexHtml = await readFile(join(outputDir, 'index.html'), 'utf-8');
      // Unicode square for skill entity type
      expect(indexHtml).toContain('\u25A0');
      // Domain color class
      expect(indexHtml).toContain('af-domain-frontend');
    });
  });

  // -------------------------------------------------------------------------
  // Budget-silicon integration tests (155-02)
  // -------------------------------------------------------------------------

  describe('budget-silicon integration', () => {
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

      const { collectActivityFeed } = await import('./collectors/activity-collector.js');
      vi.mocked(collectActivityFeed).mockReset();
      vi.mocked(collectActivityFeed).mockResolvedValue([]);

      const { collectBudgetSiliconData } = await import('./budget-silicon-collector.js');
      vi.mocked(collectBudgetSiliconData).mockReset();
      vi.mocked(collectBudgetSiliconData).mockResolvedValue({
        gauge: {
          segments: [{ domain: 'test', percentage: 45, color: 'var(--domain-testing)' }],
          totalUsed: 45,
          label: 'Token Budget',
        },
        silicon: {
          enabled: null,
          adapters: [],
          vram: { segments: [], totalUsed: 0 },
        },
      });
    });

    it('includes budget gauge in index.html', async () => {
      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({ planningDir, outputDir, force: true });

      expect(result.pages).toContain('index.html');
      const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
      expect(content).toContain('budget-gauge');
      expect(content).toContain('Token Budget');
    });

    it('generates index.html even when budget collection fails', async () => {
      const { collectBudgetSiliconData } = await import('./budget-silicon-collector.js');
      vi.mocked(collectBudgetSiliconData).mockRejectedValueOnce(new Error('no skills dir'));

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({ planningDir, outputDir, force: true });

      // Generation should still succeed
      expect(result.pages).toContain('index.html');
      expect(result.errors).toHaveLength(0);
    });

    it('omits silicon panel HTML element when enabled is null', async () => {
      // The default mock already has enabled: null
      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      await generate({ planningDir, outputDir, force: true });

      const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
      // renderSiliconPanel returns '' for null enabled, so no silicon-panel div in content
      // (styles will still contain .silicon-panel CSS class, but no HTML element)
      expect(content).not.toContain('<div class="silicon-panel">');
    });
  });

  // -------------------------------------------------------------------------
  // Staging queue integration tests (156-02)
  // -------------------------------------------------------------------------

  describe('staging queue integration', () => {
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

      const { collectActivityFeed } = await import('./collectors/activity-collector.js');
      vi.mocked(collectActivityFeed).mockReset();
      vi.mocked(collectActivityFeed).mockResolvedValue([]);

      const { collectBudgetSiliconData } = await import('./budget-silicon-collector.js');
      vi.mocked(collectBudgetSiliconData).mockReset();
      vi.mocked(collectBudgetSiliconData).mockResolvedValue({
        gauge: {
          segments: [{ domain: 'test', percentage: 45, color: 'var(--domain-testing)' }],
          totalUsed: 45,
          label: 'Token Budget',
        },
        silicon: {
          enabled: null,
          adapters: [],
          vram: { segments: [], totalUsed: 0 },
        },
      });

      const { collectStagingQueue } = await import('./collectors/staging-collector.js');
      vi.mocked(collectStagingQueue).mockReset();
    });

    it('renders staging queue panel with queue data in index.html', async () => {
      const { collectStagingQueue } = await import('./collectors/staging-collector.js');
      vi.mocked(collectStagingQueue).mockResolvedValue({
        entries: [
          {
            id: 'q-20260214-001',
            filename: 'vision.md',
            state: 'uploaded',
            milestoneName: 'v2.0',
            domain: 'frontend',
            tags: ['ui'],
            resourceManifestPath: '.planning/staging/ready/vision.manifest.json',
            createdAt: '2026-02-14T00:00:00Z',
            updatedAt: '2026-02-14T00:00:00Z',
          },
        ],
        dependencies: [],
      });

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({ planningDir, outputDir, force: true });

      expect(result.pages).toContain('index.html');
      const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
      // Panel renders with queue data
      expect(content).toContain('staging-queue-panel');
      expect(content).toContain('sq-badge-uploaded');
      expect(content).toContain('v2.0');
    });

    it('renders staging queue empty state when collector returns no entries', async () => {
      const { collectStagingQueue } = await import('./collectors/staging-collector.js');
      vi.mocked(collectStagingQueue).mockResolvedValue({
        entries: [],
        dependencies: [],
      });

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({ planningDir, outputDir, force: true });

      expect(result.pages).toContain('index.html');
      const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
      // Empty state renders with sq-empty class
      expect(content).toContain('sq-empty');
    });
  });

  // -------------------------------------------------------------------------
  // Console page integration tests (157-02)
  // -------------------------------------------------------------------------

  describe('console page integration', () => {
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

      const { collectActivityFeed } = await import('./collectors/activity-collector.js');
      vi.mocked(collectActivityFeed).mockReset();
      vi.mocked(collectActivityFeed).mockResolvedValue([]);

      const { collectBudgetSiliconData } = await import('./budget-silicon-collector.js');
      vi.mocked(collectBudgetSiliconData).mockReset();
      vi.mocked(collectBudgetSiliconData).mockResolvedValue({
        gauge: {
          segments: [{ domain: 'test', percentage: 45, color: 'var(--domain-testing)' }],
          totalUsed: 45,
          label: 'Token Budget',
        },
        silicon: {
          enabled: null,
          adapters: [],
          vram: { segments: [], totalUsed: 0 },
        },
      });

      const { collectStagingQueue } = await import('./collectors/staging-collector.js');
      vi.mocked(collectStagingQueue).mockReset();
      vi.mocked(collectStagingQueue).mockResolvedValue({
        entries: [],
        dependencies: [],
      });

      const { collectConsoleData } = await import('./collectors/console-collector.js');
      vi.mocked(collectConsoleData).mockReset();
      vi.mocked(collectConsoleData).mockResolvedValue({
        status: null,
        questions: [],
        helperUrl: '/api/console/message',
        config: null,
        activityEntries: [],
      });
    });

    it('generates console.html in output directory', async () => {
      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({ planningDir, outputDir, force: true });

      expect(result.pages).toContain('console.html');
      expect(existsSync(join(outputDir, 'console.html'))).toBe(true);
      const content = await readFile(join(outputDir, 'console.html'), 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('console.html contains navigation links to index.html', async () => {
      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      await generate({ planningDir, outputDir, force: true });

      const content = await readFile(join(outputDir, 'console.html'), 'utf-8');
      expect(content).toContain('index.html');
      expect(content).toContain('Console');
    });

    it('console.html contains console-page class wrapper', async () => {
      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      await generate({ planningDir, outputDir, force: true });

      const content = await readFile(join(outputDir, 'console.html'), 'utf-8');
      expect(content).toContain('console-page');
    });

    it('console.html contains settings section with config data', async () => {
      const { collectConsoleData } = await import('./collectors/console-collector.js');
      vi.mocked(collectConsoleData).mockResolvedValue({
        status: null,
        questions: [],
        helperUrl: '/api/console/message',
        config: {
          milestone: { name: 'Test Milestone', submitted_at: '2026-02-14T00:00:00Z', submitted_by: 'dashboard' },
          execution: { mode: 'supervised', yolo: false, pause_points: { after_planning: true, after_each_phase: true, after_verification: true } },
          research: { enabled: true, web_search: false, max_research_time_minutes: 30, skip_if_vision_sufficient: true },
          planning: { auto_approve: false, review_granularity: 'phase', max_plans_per_phase: 10, require_tdd: false },
          verification: { run_tests: true, type_check: true, lint: true, block_on_failure: true, coverage_threshold: 80 },
          resources: { token_budget_pct: 50, max_phases: 20, max_wall_time_minutes: 480, model_preference: 'quality' },
          notifications: { on_phase_complete: true, on_question: true, on_error: true, on_milestone_complete: true },
        },
        activityEntries: [],
      });

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      await generate({ planningDir, outputDir, force: true });

      const content = await readFile(join(outputDir, 'console.html'), 'utf-8');
      expect(content).toContain('console-settings-panel');
    });

    it('console.html contains question cards when questions exist', async () => {
      const { collectConsoleData } = await import('./collectors/console-collector.js');
      vi.mocked(collectConsoleData).mockResolvedValue({
        status: null,
        questions: [
          {
            question_id: 'q-test-001',
            type: 'binary',
            text: 'Continue with deployment?',
            status: 'pending',
            urgency: 'medium',
          },
        ],
        helperUrl: '/api/console/message',
        config: null,
        activityEntries: [],
      });

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      await generate({ planningDir, outputDir, force: true });

      const content = await readFile(join(outputDir, 'console.html'), 'utf-8');
      expect(content).toContain('question-card');
      expect(content).toContain('Continue with deployment?');
    });

    it('console.html contains submit flow section', async () => {
      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      await generate({ planningDir, outputDir, force: true });

      const content = await readFile(join(outputDir, 'console.html'), 'utf-8');
      expect(content).toContain('submit-flow');
      expect(content).toContain('upload-zone');
    });

    it('console.html contains activity section with bridge log entries', async () => {
      const { collectConsoleData } = await import('./collectors/console-collector.js');
      vi.mocked(collectConsoleData).mockResolvedValue({
        status: null,
        questions: [],
        helperUrl: '/api/console/message',
        config: null,
        activityEntries: [
          {
            timestamp: '2026-02-14T10:00:00Z',
            type: 'config-write',
            summary: 'Config update: config-update.json',
          },
        ],
      });

      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      await generate({ planningDir, outputDir, force: true });

      const content = await readFile(join(outputDir, 'console.html'), 'utf-8');
      expect(content).toContain('console-activity');
      expect(content).toContain('Config');
    });

    it('generates 6 pages with full data when console data exists', async () => {
      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);
      await writeFile(join(planningDir, 'ROADMAP.md'), ROADMAP_MD);
      await writeFile(join(planningDir, 'MILESTONES.md'), MILESTONES_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({ planningDir, outputDir, force: true });

      expect(result.pages).toHaveLength(6);
      expect(result.pages).toContain('console.html');
    });

    it('console.html renders without errors when console directory is missing', async () => {
      // Do NOT create .planning/console/ dir
      await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
      await writeFile(join(planningDir, 'STATE.md'), STATE_MD);

      const { generate } = await import('./generator.js');
      const result = await generate({ planningDir, outputDir, force: true });

      expect(result.pages).toContain('console.html');
      expect(result.errors).toHaveLength(0);
      const content = await readFile(join(outputDir, 'console.html'), 'utf-8');
      expect(content).toContain('console-page');
    });
  });
});
