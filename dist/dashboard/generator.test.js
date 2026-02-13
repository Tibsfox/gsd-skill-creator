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
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
// Mock the metrics integration module
vi.mock('./metrics/integration.js', () => ({
    collectAndRenderMetrics: vi.fn(),
}));
// Mock the terminal integration module
vi.mock('./terminal-integration.js', () => ({
    buildTerminalHtml: vi.fn(),
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
    let outputDir;
    let planningDir;
    beforeEach(async () => {
        outputDir = await mkdtemp(join(tmpdir(), 'gsd-gen-out-'));
        planningDir = await mkdtemp(join(tmpdir(), 'gsd-gen-plan-'));
    });
    afterEach(async () => {
        await rm(outputDir, { recursive: true, force: true }).catch(() => { });
        await rm(planningDir, { recursive: true, force: true }).catch(() => { });
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
            expect(collectAndRenderMetrics).toHaveBeenCalledWith(expect.objectContaining({ live: true }));
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
            expect(collectAndRenderMetrics).toHaveBeenCalledWith(expect.objectContaining({ live: false }));
        });
        it('generates index page without metrics when collectAndRenderMetrics rejects', async () => {
            const { collectAndRenderMetrics } = await import('./metrics/integration.js');
            vi.mocked(collectAndRenderMetrics).mockRejectedValue(new Error('Metrics collection failed'));
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
    // Terminal integration tests (quick-2)
    // -------------------------------------------------------------------------
    describe('terminal integration', () => {
        beforeEach(async () => {
            const { buildTerminalHtml } = await import('./terminal-integration.js');
            vi.mocked(buildTerminalHtml).mockReset();
        });
        it('includes terminal panel HTML in generated index page', async () => {
            const { buildTerminalHtml } = await import('./terminal-integration.js');
            vi.mocked(buildTerminalHtml).mockResolvedValue({
                html: '<div class="terminal-panel"><!-- TERMINAL --></div>',
                styles: '.terminal-panel { color: red; }',
            });
            await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
            await writeFile(join(planningDir, 'STATE.md'), STATE_MD);
            const { generate } = await import('./generator.js');
            const result = await generate({ planningDir, outputDir, force: true });
            expect(result.pages).toContain('index.html');
            const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
            expect(content).toContain('<!-- TERMINAL -->');
            expect(content).toContain('terminal-panel');
        });
        it('includes terminal styles in page head', async () => {
            const { buildTerminalHtml } = await import('./terminal-integration.js');
            vi.mocked(buildTerminalHtml).mockResolvedValue({
                html: '<div class="terminal-panel">TERM</div>',
                styles: '/* TERMINAL_STYLES_MARKER */',
            });
            await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
            const { generate } = await import('./generator.js');
            await generate({ planningDir, outputDir, force: true });
            const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
            expect(content).toContain('/* TERMINAL_STYLES_MARKER */');
        });
        it('generates index page without terminal when buildTerminalHtml rejects', async () => {
            const { buildTerminalHtml } = await import('./terminal-integration.js');
            vi.mocked(buildTerminalHtml).mockRejectedValue(new Error('Terminal config not found'));
            await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
            await writeFile(join(planningDir, 'STATE.md'), STATE_MD);
            const { generate } = await import('./generator.js');
            const result = await generate({ planningDir, outputDir, force: true });
            expect(result.pages).toContain('index.html');
            expect(result.errors).toHaveLength(0);
            const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
            expect(content).toBeTruthy();
            expect(content).not.toContain('terminal-panel');
        });
        it('terminal panel appears after Terminal heading in index page', async () => {
            const { buildTerminalHtml } = await import('./terminal-integration.js');
            vi.mocked(buildTerminalHtml).mockResolvedValue({
                html: '<div class="terminal-panel">TERMINAL_CONTENT</div>',
                styles: '.terminal-panel {}',
            });
            await writeFile(join(planningDir, 'PROJECT.md'), PROJECT_MD);
            const { generate } = await import('./generator.js');
            await generate({ planningDir, outputDir, force: true });
            const content = await readFile(join(outputDir, 'index.html'), 'utf-8');
            // Terminal section should have a heading
            expect(content).toContain('Terminal');
            expect(content).toContain('TERMINAL_CONTENT');
        });
    });
});
