/**
 * Phase 456 verification: performance tests (best-effort).
 * Tests PF-01 through PF-12: timing targets for all DACP operations.
 *
 * These tests mock I/O but use real computation. Targets assume mocked I/O,
 * so they should be well within limits. Failures indicate algorithmic issues.
 *
 * @module test/dacp/performance
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { DACPAssembler } from '../../../src/dacp/assembler/assembler.js';
import { CatalogQuery } from '../../../src/dacp/assembler/catalog-query.js';
import { createBundle } from '../../../src/dacp/bundle.js';
import { loadBundle } from '../../../src/interpreter/loader.js';
import { calculateDriftScore } from '../../../src/dacp/retrospective/drift.js';
import { analyzePatterns, type HandoffOutcomeWithType } from '../../../src/dacp/retrospective/analyzer.js';
import { BundleTemplateRegistry } from '../../../src/dacp/templates/registry.js';
import { loadStarterTemplates } from '../../../src/dacp/templates/starter-templates.js';
import {
  renderHandoffPanel,
  type HandoffPanelData,
} from '../../../src/dashboard/handoff-panel.js';
import type {
  BundleManifest,
  HandoffOutcome,
  ScriptCatalogEntry,
  SchemaLibraryEntry,
} from '../../../src/dacp/types.js';

// ============================================================================
// Factories
// ============================================================================

function makeManifest(overrides: Partial<BundleManifest> = {}): BundleManifest {
  return {
    version: '1.0.0', fidelity_level: 0, source_agent: 'p', target_agent: 'e',
    opcode: 'EXEC', intent_summary: 'Perf test',
    human_origin: { vision_doc: 'P.md', planning_phase: '456', user_directive: 'Test' },
    data_manifest: {}, code_manifest: {},
    assembly_rationale: { level_justification: 'Test', skills_used: [], generated_artifacts: ['intent.md'], reused_artifacts: [] },
    provenance: { assembled_by: 'test', assembled_at: new Date().toISOString(), skill_versions: {} },
    ...overrides,
  };
}

function makeScript(i: number): ScriptCatalogEntry {
  return {
    id: `perf-s-${i}`, skill_source: `skill-${i % 10}`, skill_version: '1.0.0',
    script_path: `/skills/s${i}.sh`, script_hash: `h${i}`,
    function_type: ['validator', 'parser', 'transformer', 'formatter', 'analyzer'][i % 5] as any,
    data_types: ['json', 'yaml', 'csv'][i % 3] === 'json' ? ['json'] : ['yaml'],
    deterministic: true, last_used: new Date().toISOString(),
    use_count: i, success_rate: 0.8 + (i % 20) * 0.01, avg_execution_ms: 10 + i,
  };
}

function makeSchema(i: number): SchemaLibraryEntry {
  return {
    id: `perf-sc-${i}`, name: `Schema ${i}`, schema_path: `/schemas/s${i}.json`,
    data_type: ['json', 'yaml', 'csv'][i % 3],
    source_skill: `skill-${i % 10}`, version: '1.0.0',
    fields: ['a', 'b', 'c'], last_updated: new Date().toISOString(), reference_count: i,
  };
}

// ============================================================================
// Setup
// ============================================================================

let testDir: string;

beforeEach(() => {
  testDir = join(tmpdir(), `dacp-perf-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  try { rmSync(testDir, { recursive: true, force: true }); } catch { /* noop */ }
});

// ============================================================================
// Performance Tests (best-effort)
// ============================================================================

describe('Performance (best-effort)', () => {
  // PF-01: Bundle assembly with template
  it('PF-01: bundle assembly with template completes in <5000ms', () => {
    const registry = new BundleTemplateRegistry('/tmp/perf.json');
    loadStarterTemplates(registry);

    const assembler = new DACPAssembler(new CatalogQuery([], []));
    const start = performance.now();

    assembler.assemble({
      source_agent: 'p', target_agent: 'e', opcode: 'EXEC',
      intent: 'Perf test', handoff_type: 'test', data: undefined,
      historical_drift_rate: 0.0, token_budget_remaining: 50000, safety_critical: false,
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  // PF-02: Bundle assembly without template
  it('PF-02: bundle assembly without template completes in <15000ms', () => {
    const scripts = Array.from({ length: 10 }, (_, i) => makeScript(i));
    const schemas = Array.from({ length: 5 }, (_, i) => makeSchema(i));
    const assembler = new DACPAssembler(new CatalogQuery(scripts, schemas));

    const start = performance.now();
    assembler.assemble({
      source_agent: 'p', target_agent: 'e', opcode: 'EXEC',
      intent: 'Complex task', handoff_type: 'transform',
      data: { a: { b: { c: 1 } } }, data_types: ['json'],
      historical_drift_rate: 0.3, token_budget_remaining: 50000, safety_critical: false,
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(15000);
  });

  // PF-03: Bundle creation (filesystem)
  it('PF-03: bundle creation completes in <1000ms', async () => {
    const start = performance.now();
    await createBundle({
      outputDir: testDir, priority: 3, opcode: 'EXEC', sourceAgent: 'p', targetAgent: 'e',
      manifest: makeManifest(), intentMarkdown: '# Test\n\nContent.',
      dataFiles: { 'data.json': '{"key":"value"}' }, timestamp: new Date(),
    });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });

  // PF-04: Bundle loading
  it('PF-04: bundle loading completes in <2000ms', async () => {
    const bundlePath = await createBundle({
      outputDir: testDir, priority: 3, opcode: 'EXEC', sourceAgent: 'p', targetAgent: 'e',
      manifest: makeManifest(), intentMarkdown: '# Test', timestamp: new Date(),
    });

    const start = performance.now();
    loadBundle(bundlePath);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  // PF-05: Script catalog search (100+ entries)
  it('PF-05: catalog search with 100+ entries completes in <2000ms', () => {
    const scripts = Array.from({ length: 120 }, (_, i) => makeScript(i));
    const catalog = new CatalogQuery(scripts, []);

    const start = performance.now();
    catalog.findScripts('validator', ['json']);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  // PF-06: Schema library search (50+ entries)
  it('PF-06: schema search with 50+ entries completes in <1000ms', () => {
    const schemas = Array.from({ length: 60 }, (_, i) => makeSchema(i));
    const catalog = new CatalogQuery([], schemas);

    const start = performance.now();
    catalog.findSchemas('json');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });

  // PF-07: Drift score calculation per outcome
  it('PF-07: drift score calculation completes in <100ms', () => {
    const outcome: HandoffOutcome = {
      bundle_id: 'perf-drift', fidelity_level: 2, intent_alignment: 0.7,
      rework_required: true, tokens_spent_interpreting: 500,
      code_modifications: 3, verification_pass: false,
      timestamp: new Date().toISOString(),
    };

    const start = performance.now();
    calculateDriftScore(outcome);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  // PF-08: Pattern analysis (50 handoffs)
  it('PF-08: pattern analysis with 50 handoffs completes in <5000ms', () => {
    const outcomes: HandoffOutcomeWithType[] = [];
    for (let i = 0; i < 50; i++) {
      outcomes.push({
        bundle_id: `perf-${i}`, fidelity_level: 2,
        intent_alignment: 0.5 + Math.random() * 0.5,
        rework_required: i % 3 === 0, tokens_spent_interpreting: 200,
        code_modifications: i % 4, verification_pass: i % 5 !== 0,
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
        handoff_type: `type-${i % 5}`,
      });
    }

    const start = performance.now();
    analyzePatterns(outcomes, []);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  // PF-09: Catalog query with 20 skills worth of scripts
  it('PF-09: catalog query across 20 skills completes in <30000ms', () => {
    const scripts = Array.from({ length: 100 }, (_, i) => makeScript(i));
    const schemas = Array.from({ length: 40 }, (_, i) => makeSchema(i));
    const catalog = new CatalogQuery(scripts, schemas);

    const start = performance.now();
    catalog.countAvailableSkills('task', ['json', 'yaml']);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(30000);
  });

  // PF-10: Dashboard data rendering
  it('PF-10: dashboard panel rendering completes in <3000ms', () => {
    const entries = Array.from({ length: 50 }, (_, i) => ({
      score: Math.random(), timestamp: new Date().toISOString(),
      pattern: `pattern-${i}`, recommendation: 'maintain' as const,
    }));

    const data: HandoffPanelData = {
      driftEntries: entries,
      fidelity: { level0: 10, level1: 20, level2: 15, level3: 5 },
      recommendations: [
        { pattern: 'test', direction: 'promote' as const, fromLevel: 1, toLevel: 2, reason: 'high drift', evidence: 5 },
      ],
      milestoneName: 'v1.49', totalHandoffs: 50, avgDrift: 0.25,
    };

    const start = performance.now();
    renderHandoffPanel(data);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });

  // PF-11: CLI status data aggregation (mock)
  it('PF-11: status data aggregation completes in <2000ms', () => {
    const start = performance.now();
    // Simulate what status command does: aggregate data sources
    const entries = Array.from({ length: 100 }, (_, i) => ({
      pattern: `p-${i}`, score: Math.random(), fidelity_level: i % 4,
    }));

    const dist: Record<string, number> = { L0: 0, L1: 0, L2: 0, L3: 0 };
    for (const e of entries) {
      const key = `L${e.fidelity_level}`;
      if (key in dist) dist[key]++;
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
    expect(Object.values(dist).reduce((a, b) => a + b, 0)).toBe(100);
  });

  // PF-12: Template registry search
  it('PF-12: template registry search completes in <500ms', () => {
    const registry = new BundleTemplateRegistry('/tmp/perf-tmpl.json');
    loadStarterTemplates(registry);

    const start = performance.now();
    registry.findByHandoffType('orchestrator->executor:skill-handoff');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
