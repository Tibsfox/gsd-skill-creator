/**
 * Phase 456 verification: SAFETY-CRITICAL mandatory-pass tests.
 * Tests SC-01 through SC-08: zero tolerance, binary pass/fail.
 *
 * MANDATORY: Every test in this file MUST pass. Any failure is a blocker.
 *
 * @module test/dacp/safety-critical
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { loadBundle } from '../../src/interpreter/loader.js';
import { buildExecutionContext } from '../../src/interpreter/context-builder.js';
import { validateProvenance } from '../../src/interpreter/provenance-guard.js';
import {
  analyzePatterns,
  PROMOTION_THRESHOLD,
  DEMOTION_THRESHOLD,
  type HandoffOutcomeWithType,
} from '../../src/dacp/retrospective/analyzer.js';
import { createBundle, isBundleComplete, MAX_DATA_SIZE, MAX_SCRIPT_SIZE } from '../../src/dacp/bundle.js';
import { DACPAssembler } from '../../src/dacp/assembler/assembler.js';
import { CatalogQuery } from '../../src/dacp/assembler/catalog-query.js';
import type { BundleManifest, HandoffPattern, FidelityLevel } from '../../src/dacp/types.js';

// ============================================================================
// Factories
// ============================================================================

function makeManifest(overrides: Partial<BundleManifest> = {}): BundleManifest {
  return {
    version: '1.0.0',
    fidelity_level: 2,
    source_agent: 'planner',
    target_agent: 'executor',
    opcode: 'EXEC',
    intent_summary: 'Safety test intent',
    human_origin: {
      vision_doc: 'PROJECT.md',
      planning_phase: '456',
      user_directive: 'Safety test',
    },
    data_manifest: {},
    code_manifest: {},
    assembly_rationale: {
      level_justification: 'Test',
      skills_used: [],
      generated_artifacts: ['intent.md'],
      reused_artifacts: [],
    },
    provenance: {
      assembled_by: 'test',
      assembled_at: new Date().toISOString(),
      skill_versions: {},
    },
    ...overrides,
  };
}

function createBundleDir(
  basePath: string,
  manifest: BundleManifest,
  options: {
    addComplete?: boolean;
    codeFiles?: Record<string, string>;
  } = {},
): string {
  const bundlePath = join(basePath, 'safety-test.bundle');
  mkdirSync(bundlePath, { recursive: true });
  mkdirSync(join(bundlePath, 'data'), { recursive: true });
  mkdirSync(join(bundlePath, 'code'), { recursive: true });

  writeFileSync(join(bundlePath, 'manifest.json'), JSON.stringify(manifest, null, 2));
  writeFileSync(join(bundlePath, 'intent.md'), '# Safety Test\n\nCritical test.');

  if (options.codeFiles) {
    for (const [name, content] of Object.entries(options.codeFiles)) {
      writeFileSync(join(bundlePath, 'code', name), content);
    }
  }

  if (options.addComplete !== false) {
    writeFileSync(join(bundlePath, '.complete'), '');
  }

  return bundlePath;
}

// ============================================================================
// Setup
// ============================================================================

let testDir: string;

beforeEach(() => {
  testDir = join(tmpdir(), `dacp-safety-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Best effort cleanup
  }
});

// ============================================================================
// SAFETY-CRITICAL Tests (mandatory pass)
// ============================================================================

describe('SAFETY-CRITICAL (mandatory pass)', () => {
  // SC-01: No auto-execute
  it('SC-01: interpreter NEVER auto-executes scripts — scripts are data-only references', () => {
    const manifest = makeManifest({
      fidelity_level: 3,
      code_manifest: {
        'dangerous.sh': {
          purpose: 'Could be dangerous',
          language: 'bash',
          source_skill: 'test-skill',
          deterministic: true,
        },
      },
      provenance: {
        assembled_by: 'test',
        assembled_at: new Date().toISOString(),
        skill_versions: { 'test-skill': '1.0.0' },
      },
    });

    const bundlePath = createBundleDir(testDir, manifest, {
      codeFiles: { 'dangerous.sh': '#!/bin/bash\nrm -rf /' },
    });

    const loaded = loadBundle(bundlePath);
    const ctx = buildExecutionContext(loaded);

    // Scripts are frozen plain objects with NO callable methods
    for (const scriptRef of ctx.scriptReferences) {
      expect(Object.isFrozen(scriptRef)).toBe(true);
      // Verify no function properties exist
      for (const value of Object.values(scriptRef)) {
        expect(typeof value).not.toBe('function');
      }
    }
    // Context itself is frozen
    expect(Object.isFrozen(ctx)).toBe(true);
  });

  // SC-02: Backward compatibility — .msg fallback must exist for DACP removal
  it('SC-02: bundleToMsgContent produces valid BusMessage from manifest', async () => {
    const { bundleToMsgContent } = await import('../../src/dacp/msg-fallback.js');
    const manifest = makeManifest({ fidelity_level: 2 });
    const intent = '# Test Intent\n\nHandoff description.';

    const msg = bundleToMsgContent(manifest, intent);

    // .msg payload includes DACP marker
    expect(msg.payload[0]).toContain('[DACP:L2]');
    // .msg payload includes intent summary
    expect(msg.payload[1]).toContain('Safety test intent');
    // Header maps correctly
    expect(msg.header.opcode).toBeDefined();
    expect(msg.header.src).toBeDefined();
    expect(msg.header.dst).toBeDefined();
  });

  // SC-03: Cooldown enforcement
  it('SC-03: promotion within 7-day cooldown returns null recommendation', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const pattern: HandoffPattern = {
      id: 'test-pattern',
      type: 'planner->executor:task',
      source_agent_type: 'planner',
      target_agent_type: 'executor',
      opcode: 'EXEC',
      observed_count: 10,
      avg_drift_score: 0.4,
      max_drift_score: 0.6,
      current_fidelity: 2,
      recommended_fidelity: 2,
      last_observed: new Date().toISOString(),
      promotion_history: [
        { from: 1, to: 2, reason: 'High drift', timestamp: threeDaysAgo.toISOString() },
      ],
      contributing_bundles: [],
    };

    // Create high-drift outcomes that would normally trigger promotion
    const outcomes: HandoffOutcomeWithType[] = [];
    for (let i = 0; i < 5; i++) {
      outcomes.push({
        bundle_id: `b-${i}`,
        fidelity_level: 2,
        intent_alignment: 0.2,
        rework_required: true,
        verification_pass: false,
        code_modifications: 8,
        timestamp: new Date().toISOString(),
        handoff_type: 'planner->executor:task',
      });
    }

    const result = analyzePatterns(outcomes, [pattern]);
    // Cooldown blocks promotion
    expect(result.promotions_recommended).toHaveLength(0);
  });

  // SC-04: Bundle size limits enforced
  it('SC-04: oversized data (60KB) rejected, valid (49KB) accepted', async () => {
    const largeData = 'x'.repeat(60 * 1024);
    const validData = 'y'.repeat(49 * 1024);

    // 60KB should be rejected
    await expect(
      createBundle({
        outputDir: testDir,
        priority: 3,
        opcode: 'EXEC',
        sourceAgent: 'test',
        targetAgent: 'test',
        manifest: makeManifest(),
        intentMarkdown: '# Test',
        dataFiles: { 'large.json': largeData },
        timestamp: new Date(),
      }),
    ).rejects.toThrow(/exceeds.*byte limit/i);

    // 49KB should be accepted
    const bundlePath = await createBundle({
      outputDir: testDir,
      priority: 3,
      opcode: 'EXEC',
      sourceAgent: 'test',
      targetAgent: 'test2',
      manifest: makeManifest(),
      intentMarkdown: '# Test',
      dataFiles: { 'valid.json': validData },
      timestamp: new Date(),
    });
    expect(existsSync(bundlePath)).toBe(true);
  });

  // SC-05: Script provenance mandatory
  it('SC-05: script without source_skill is rejected by interpreter', () => {
    const manifest = makeManifest({
      fidelity_level: 3,
      code_manifest: {
        'unprovenanced.sh': {
          purpose: 'test',
          language: 'bash',
          source_skill: '', // Empty provenance!
          deterministic: true,
        },
      },
    });

    const bundlePath = createBundleDir(testDir, manifest, {
      codeFiles: { 'unprovenanced.sh': '#!/bin/bash\necho test' },
    });

    // Default config has requireProvenance=true
    expect(() => loadBundle(bundlePath)).toThrow(/provenance/i);
  });

  // SC-06: No personal data in templates
  it('SC-06: starter templates contain no user-specific content', async () => {
    const { STARTER_TEMPLATES } = await import('../../src/dacp/templates/starter-templates.js');

    const personalDataPatterns = [
      /\/home\/\w+/,           // Home directory paths
      /\/Users\/\w+/,          // macOS home paths
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/, // Email addresses
      /C:\\Users\\\w+/,        // Windows home paths
    ];

    for (const template of STARTER_TEMPLATES) {
      const serialized = JSON.stringify(template);
      for (const pattern of personalDataPatterns) {
        expect(pattern.test(serialized)).toBe(false);
      }
    }
  });

  // SC-07: Atomic bundle write — incomplete bundle not treated as valid
  it('SC-07: bundle without .complete marker is rejected', () => {
    const manifest = makeManifest();
    const bundlePath = createBundleDir(testDir, manifest, { addComplete: false });

    expect(() => loadBundle(bundlePath)).toThrow(/incomplete|.complete/i);
  });

  // SC-08: Graceful degradation — empty skill library produces Level 0
  it('SC-08: assembler with empty catalog produces prose-only bundle, no crash', () => {
    const catalog = new CatalogQuery([], []);
    const assembler = new DACPAssembler(catalog);

    const result = assembler.assemble({
      source_agent: 'planner',
      target_agent: 'executor',
      opcode: 'EXEC',
      intent: 'Complex task requiring scaffold',
      data: undefined, // no data -> Level 0
      handoff_type: 'complex-handoff',
      historical_drift_rate: 0.0,
      token_budget_remaining: 50000,
      safety_critical: false,
    });

    // Should gracefully fall to Level 0 (no data = none complexity)
    expect(result.manifest.fidelity_level).toBe(0);
    expect(result.intent_markdown).toBeDefined();
    // No crash, no undefined access
    expect(result.manifest.version).toBe('1.0.0');
  });
});
