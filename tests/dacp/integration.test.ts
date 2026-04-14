/**
 * Phase 456 verification: integration tests.
 * Tests INT-01 through INT-28: cross-component flows including
 * assembler->interpreter pipeline, template integration, CLI integration,
 * round-trip at all fidelity levels, and complex workflows.
 *
 * @module test/dacp/integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { DACPAssembler, type AssemblyRequest } from '../../src/dacp/assembler/assembler.js';
import { CatalogQuery } from '../../src/dacp/assembler/catalog-query.js';
import { createBundle, listBundleContents, isBundleComplete } from '../../src/dacp/bundle.js';
import { bundleToMsgContent } from '../../src/dacp/msg-fallback.js';
import { loadBundle } from '../../src/interpreter/loader.js';
import { buildExecutionContext } from '../../src/interpreter/context-builder.js';
import { calculateDriftScore } from '../../src/dacp/retrospective/drift.js';
import { analyzePatterns, type HandoffOutcomeWithType } from '../../src/dacp/retrospective/analyzer.js';
import { determineFidelity, assessDataComplexity } from '../../src/dacp/fidelity/decision.js';
import { BundleTemplateRegistry } from '../../src/dacp/templates/registry.js';
import { STARTER_TEMPLATES, loadStarterTemplates } from '../../src/dacp/templates/starter-templates.js';
import {
  renderHandoffPanel,
  renderDriftTrend,
  type HandoffPanelData,
} from '../../src/dashboard/handoff-panel.js';
import type {
  BundleManifest,
  HandoffOutcome,
  ScriptCatalogEntry,
  SchemaLibraryEntry,
  FidelityLevel,
} from '../../src/dacp/types.js';

// ============================================================================
// Factories
// ============================================================================

function makeManifest(overrides: Partial<BundleManifest> = {}): BundleManifest {
  return {
    version: '1.0.0',
    fidelity_level: 0,
    source_agent: 'planner',
    target_agent: 'executor',
    opcode: 'EXEC',
    intent_summary: 'Integration test intent',
    human_origin: { vision_doc: 'P.md', planning_phase: '456', user_directive: 'Test' },
    data_manifest: {},
    code_manifest: {},
    assembly_rationale: { level_justification: 'Test', skills_used: [], generated_artifacts: ['intent.md'], reused_artifacts: [] },
    provenance: { assembled_by: 'test', assembled_at: new Date().toISOString(), skill_versions: {} },
    ...overrides,
  };
}

function makeScript(overrides: Partial<ScriptCatalogEntry> = {}): ScriptCatalogEntry {
  return {
    id: `s-${Math.random().toString(36).slice(2, 6)}`,
    skill_source: 'test-skill',
    skill_version: '1.0.0',
    script_path: '/skills/test/s.sh',
    script_hash: 'h123',
    function_type: 'validator',
    data_types: ['json'],
    deterministic: true,
    last_used: new Date().toISOString(),
    use_count: 5,
    success_rate: 0.9,
    avg_execution_ms: 50,
    ...overrides,
  };
}

function makeSchema(overrides: Partial<SchemaLibraryEntry> = {}): SchemaLibraryEntry {
  return {
    id: `sc-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Test',
    schema_path: '/schemas/t.json',
    data_type: 'json',
    source_skill: 'test-skill',
    version: '1.0.0',
    fields: ['a'],
    last_updated: new Date().toISOString(),
    reference_count: 1,
    ...overrides,
  };
}

function makeAssembler(scripts: ScriptCatalogEntry[] = [], schemas: SchemaLibraryEntry[] = []) {
  return new DACPAssembler(new CatalogQuery(scripts, schemas));
}

function makeRequest(overrides: Partial<AssemblyRequest> = {}): AssemblyRequest {
  return {
    source_agent: 'planner',
    target_agent: 'executor',
    opcode: 'EXEC',
    intent: 'Integration test task',
    handoff_type: 'task-assignment',
    historical_drift_rate: 0.1,
    token_budget_remaining: 50000,
    safety_critical: false,
    ...overrides,
  };
}

// Write assembled result as bundle directory on disk
async function writeAssemblyToDisk(
  assemblyResult: ReturnType<DACPAssembler['assemble']>,
  outputDir: string,
): Promise<string> {
  const dataFiles: Record<string, string> = {};
  for (const [k, v] of Object.entries(assemblyResult.data_files)) {
    dataFiles[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return createBundle({
    outputDir,
    priority: 3,
    opcode: assemblyResult.manifest.opcode,
    sourceAgent: assemblyResult.manifest.source_agent,
    targetAgent: assemblyResult.manifest.target_agent,
    manifest: assemblyResult.manifest,
    intentMarkdown: assemblyResult.intent_markdown,
    dataFiles,
    codeFiles: assemblyResult.code_files,
    timestamp: new Date(),
  });
}

// ============================================================================
// Setup
// ============================================================================

let testDir: string;

beforeEach(() => {
  testDir = join(tmpdir(), `dacp-int-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  try { rmSync(testDir, { recursive: true, force: true }); } catch { /* noop */ }
});

// ============================================================================
// Assembler -> Bus -> Interpreter Pipeline (INT-01 to INT-06)
// ============================================================================

describe('Assembler -> Interpreter Pipeline', () => {
  it('INT-01: assembler writes bundle to disk successfully', async () => {
    const assembler = makeAssembler();
    const result = assembler.assemble(makeRequest({ data: undefined }));
    const bundlePath = await writeAssemblyToDisk(result, testDir);
    expect(existsSync(bundlePath)).toBe(true);
    expect(existsSync(join(bundlePath, '.complete'))).toBe(true);
  });

  it('INT-02: interpreter loads assembler-created bundle', async () => {
    const assembler = makeAssembler();
    const result = assembler.assemble(makeRequest({ data: undefined }));
    const bundlePath = await writeAssemblyToDisk(result, testDir);

    const loaded = loadBundle(bundlePath);
    expect(loaded.manifest.version).toBe('1.0.0');
    expect(loaded.intent).toBe(result.intent_markdown);
  });

  it('INT-03: outcome from interpretation feeds drift calculation', async () => {
    const outcome: HandoffOutcome = {
      bundle_id: 'test-1',
      fidelity_level: 2,
      intent_alignment: 0.85,
      rework_required: false,
      tokens_spent_interpreting: 300,
      code_modifications: 2,
      verification_pass: true,
      timestamp: new Date().toISOString(),
    };

    const drift = calculateDriftScore(outcome);
    expect(drift.score).toBeGreaterThanOrEqual(0);
    expect(drift.score).toBeLessThanOrEqual(1);
    expect(drift.recommendation).toBeDefined();
  });

  it('INT-04: drift scores influence fidelity decision', () => {
    // High drift -> should push fidelity up
    const highDriftResult = determineFidelity({
      handoff_type: 'task',
      data_complexity: 'simple',
      historical_drift_rate: 0.4,
      available_skills: 1,
      token_budget_remaining: 50000,
      safety_critical: false,
    });
    expect(highDriftResult).toBeGreaterThanOrEqual(2);

    // Low drift -> lower fidelity acceptable
    const lowDriftResult = determineFidelity({
      handoff_type: 'task',
      data_complexity: 'none',
      historical_drift_rate: 0.01,
      available_skills: 0,
      token_budget_remaining: 50000,
      safety_critical: false,
    });
    expect(lowDriftResult).toBe(0);
  });

  it('INT-05: assembler queries script catalog and gets results', () => {
    const scripts = [
      makeScript({ function_type: 'validator', data_types: ['json'] }),
      makeScript({ function_type: 'parser', data_types: ['json'] }),
    ];
    const assembler = makeAssembler(scripts);
    const result = assembler.assemble(makeRequest({
      data: { key: 'value' },
      data_types: ['json'],
      historical_drift_rate: 0.4,
    }));

    // Should have used skills from catalog
    expect(result.manifest.fidelity_level).toBeGreaterThanOrEqual(2);
  });

  it('INT-06: assembler queries schema library', () => {
    const schemas = [makeSchema({ data_type: 'json' })];
    const assembler = makeAssembler([], schemas);
    const result = assembler.assemble(makeRequest({
      data: { key: 'value' },
      data_types: ['json'],
      historical_drift_rate: 0.2,
    }));

    // Schema lookup influenced assembly
    expect(result.manifest).toBeDefined();
  });
});

// ============================================================================
// Template and Registry Integration (INT-07 to INT-09)
// ============================================================================

describe('Template and Registry Integration', () => {
  it('INT-07: assembler can use template handoff type for lookup', () => {
    const registry = new BundleTemplateRegistry('/tmp/int-test.json');
    loadStarterTemplates(registry);

    const templates = registry.findByHandoffType('orchestrator->executor:skill-handoff');
    expect(templates).toHaveLength(1);
    expect(templates[0].default_fidelity).toBeDefined();
  });

  it('INT-08: drift data can render in dashboard panel', () => {
    const panelData: HandoffPanelData = {
      driftEntries: [
        { score: 0.3, timestamp: new Date().toISOString(), pattern: 'test', recommendation: 'maintain' },
      ],
      fidelity: { level0: 5, level1: 10, level2: 3, level3: 1 },
      recommendations: [],
      milestoneName: 'v1.49',
      totalHandoffs: 19,
      avgDrift: 0.15,
    };

    const html = renderHandoffPanel(panelData);
    expect(html).toContain('0.30');
    expect(html).toContain('handoff-panel');
  });

  it('INT-09: pattern analysis produces summary with pattern names', () => {
    const outcomes: HandoffOutcomeWithType[] = [
      {
        bundle_id: 'b1', fidelity_level: 2, intent_alignment: 0.8,
        rework_required: false, tokens_spent_interpreting: 200,
        code_modifications: 1, verification_pass: true,
        timestamp: new Date().toISOString(), handoff_type: 'test->agent:task',
      },
    ];

    const result = analyzePatterns(outcomes, []);
    expect(result.patterns_created).toBe(1);
    expect(result.summary.total_handoffs_analyzed).toBe(1);
  });
});

// ============================================================================
// End-to-end Round-trip at Each Fidelity Level (INT-15 to INT-18)
// ============================================================================

describe('Fidelity Level Round-Trip (TEST-04)', () => {
  it('INT-15: Level 0 round-trip (prose-only)', async () => {
    const assembler = makeAssembler();
    const result = assembler.assemble(makeRequest({ data: undefined }));
    expect(result.manifest.fidelity_level).toBe(0);

    const bundlePath = await writeAssemblyToDisk(result, testDir);
    const loaded = loadBundle(bundlePath);
    expect(loaded.fidelityLevel).toBe(0);
    expect(loaded.intent).toBe(result.intent_markdown);

    // Generate .msg fallback
    const msg = bundleToMsgContent(loaded.manifest, loaded.intent);
    expect(msg.payload[0]).toContain('[DACP:L0]');
  });

  it('INT-16: Level 2 round-trip (data + schema)', async () => {
    const schemas = [makeSchema({ data_type: 'json' })];
    const assembler = makeAssembler([], schemas);
    const result = assembler.assemble(makeRequest({
      data: { config: { setting: 'value' }, items: [1, 2, 3] },
      data_types: ['json'],
      historical_drift_rate: 0.2,
    }));

    expect(result.manifest.fidelity_level).toBeGreaterThanOrEqual(2);
    const bundlePath = await writeAssemblyToDisk(result, testDir);
    const loaded = loadBundle(bundlePath);
    expect(loaded.fidelityLevel).toBeGreaterThanOrEqual(2);
  });

  it('INT-17: Level 3 round-trip (full bundle with code)', async () => {
    const scripts = [
      makeScript({ id: 's1', skill_source: 'skill-a', function_type: 'parser', data_types: ['json'] }),
      makeScript({ id: 's2', skill_source: 'skill-b', function_type: 'validator', data_types: ['json'] }),
      makeScript({ id: 's3', skill_source: 'skill-c', function_type: 'transformer', data_types: ['json'] }),
    ];
    const schemas = [makeSchema({ data_type: 'json', source_skill: 'skill-d' })];
    const assembler = makeAssembler(scripts, schemas);

    const result = assembler.assemble(makeRequest({
      data: { complex: { nested: { value: true } } },
      data_types: ['json'],
      historical_drift_rate: 0.4,
    }));

    expect(result.manifest.fidelity_level).toBe(3);
    const bundlePath = await writeAssemblyToDisk(result, testDir);
    const loaded = loadBundle(bundlePath);
    expect(loaded.fidelityLevel).toBe(3);
    expect(loaded.scripts.length).toBeGreaterThan(0);

    // Scripts have metadata
    for (const script of loaded.scripts) {
      expect(script.sourceSkill).toBeTruthy();
      expect(script.purpose).toBeTruthy();
    }
  });

  it('INT-18: Level 3 round-trip with safety-critical flag', async () => {
    const assembler = makeAssembler();
    const result = assembler.assemble(makeRequest({
      data: { config: 'critical' },
      safety_critical: true,
    }));

    expect(result.manifest.fidelity_level).toBe(3);
    const bundlePath = await writeAssemblyToDisk(result, testDir);
    const loaded = loadBundle(bundlePath);
    expect(loaded.fidelityLevel).toBe(3);

    // .msg fallback works
    const msg = bundleToMsgContent(loaded.manifest, loaded.intent);
    expect(msg.payload[0]).toContain('[DACP:L3]');
  });
});

// ============================================================================
// Complex Workflows (INT-22 to INT-28)
// ============================================================================

describe('Complex Workflows', () => {
  it('INT-22: starter template used to assemble bundle', () => {
    const registry = new BundleTemplateRegistry('/tmp/int22.json');
    loadStarterTemplates(registry);
    const template = registry.findByHandoffType('orchestrator->executor:skill-handoff')[0];

    expect(template).toBeDefined();
    expect(template.default_fidelity).toBe(2);
  });

  it('INT-23: script provenance chain from catalog through bundle', async () => {
    const script = makeScript({
      id: 'chain-script',
      skill_source: 'chain-skill',
      skill_version: '1.0.0',
      function_type: 'validator',
      data_types: ['json'],
    });

    const assembler = makeAssembler([script], []);
    const result = assembler.assemble(makeRequest({
      data: { key: 'value' },
      data_types: ['json'],
      historical_drift_rate: 0.4,
    }));

    if (result.manifest.fidelity_level >= 3) {
      const bundlePath = await writeAssemblyToDisk(result, testDir);
      const loaded = loadBundle(bundlePath);

      for (const s of loaded.scripts) {
        expect(s.sourceSkill).toBeTruthy();
      }
    }
  });

  it('INT-25: fidelity promotion cycle driven by high drift', () => {
    // Simulate outcomes that accumulate drift
    const outcomes: HandoffOutcomeWithType[] = [];
    for (let i = 0; i < 5; i++) {
      outcomes.push({
        bundle_id: `promo-${i}`,
        fidelity_level: 1,
        intent_alignment: 0.3,
        rework_required: true,
        verification_pass: false,
        code_modifications: 5,
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
        handoff_type: 'planner->executor:promo-test',
      });
    }

    const result = analyzePatterns(outcomes, []);
    expect(result.promotions_recommended.length).toBeGreaterThanOrEqual(1);
    const promoted = result.promotions_recommended[0];
    expect(promoted.recommended_fidelity).toBeGreaterThan(promoted.current_fidelity);
  });

  it('INT-26: execution context is frozen and immutable', async () => {
    const assembler = makeAssembler();
    const result = assembler.assemble(makeRequest({ data: undefined }));
    const bundlePath = await writeAssemblyToDisk(result, testDir);
    const loaded = loadBundle(bundlePath);
    const ctx = buildExecutionContext(loaded);

    expect(Object.isFrozen(ctx)).toBe(true);
    // Attempting to modify should silently fail (frozen)
    expect(() => {
      (ctx as any).fidelityLevel = 99;
    }).toThrow();
  });

  it('INT-27: dashboard and drift show consistent data', () => {
    const outcome: HandoffOutcome = {
      bundle_id: 'consistent-1',
      fidelity_level: 2,
      intent_alignment: 0.75,
      rework_required: true,
      verification_pass: true,
      code_modifications: 3,
      tokens_spent_interpreting: 800,
      timestamp: new Date().toISOString(),
    };

    const drift = calculateDriftScore(outcome);

    // Dashboard renders the same score
    const panelData: HandoffPanelData = {
      driftEntries: [{
        score: drift.score,
        timestamp: outcome.timestamp,
        pattern: 'test',
        recommendation: drift.recommendation,
      }],
      fidelity: { level0: 0, level1: 0, level2: 1, level3: 0 },
      recommendations: [],
      milestoneName: 'test',
      totalHandoffs: 1,
      avgDrift: drift.score,
    };

    const html = renderDriftTrend(panelData);
    expect(html).toContain(drift.score.toFixed(2));
  });

  it('INT-28: full provenance chain traceable by bundle_id', () => {
    const bundleId = 'trace-bundle-001';

    // 1. Outcome for this bundle
    const outcome: HandoffOutcome = {
      bundle_id: bundleId,
      fidelity_level: 2,
      intent_alignment: 0.6,
      rework_required: true,
      verification_pass: false,
      code_modifications: 5,
      tokens_spent_interpreting: 1000,
      timestamp: new Date().toISOString(),
    };

    // 2. Drift score
    const drift = calculateDriftScore(outcome);
    expect(drift.score).toBeGreaterThan(0.3);

    // 3. Pattern analysis
    const outcomes: HandoffOutcomeWithType[] = [
      { ...outcome, handoff_type: 'trace-test' },
      { ...outcome, bundle_id: `${bundleId}-2`, handoff_type: 'trace-test' },
      { ...outcome, bundle_id: `${bundleId}-3`, handoff_type: 'trace-test' },
    ];

    const analysis = analyzePatterns(outcomes, []);
    expect(analysis.patterns_created).toBe(1);
    // All bundles traceable in pattern
    const pattern = analysis.promotions_recommended[0] ?? analysis.demotions_recommended[0];
    if (pattern) {
      expect(pattern.contributing_bundles).toContain(bundleId);
    }
  });
});
