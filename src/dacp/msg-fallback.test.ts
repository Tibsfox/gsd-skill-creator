/**
 * Tests for DACP backward-compatible .msg fallback generation.
 *
 * @module dacp/msg-fallback.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { bundleToMsgContent, generateMsgFallback } from './msg-fallback.js';
import { createBundle } from './bundle.js';
import type { CreateBundleOptions } from './bundle.js';
import type { BundleManifest } from './types.js';
import { decodeMessage } from '../den/encoder.js';

// ============================================================================
// Test helpers
// ============================================================================

function makeManifest(overrides: Partial<BundleManifest> = {}): BundleManifest {
  return {
    version: '1.0.0',
    fidelity_level: 1,
    source_agent: 'planner',
    target_agent: 'executor',
    opcode: 'EXEC',
    intent_summary: 'Execute the test plan',
    human_origin: {
      vision_doc: '.planning/PROJECT.md',
      planning_phase: '447',
      user_directive: 'Build bundle format',
    },
    data_manifest: {},
    code_manifest: {},
    assembly_rationale: {
      level_justification: 'Simple data handoff',
      skills_used: [],
      generated_artifacts: [],
      reused_artifacts: [],
    },
    provenance: {
      assembled_by: 'dacp-assembler',
      assembled_at: '2026-02-27T12:00:00Z',
      skill_versions: {},
    },
    ...overrides,
  };
}

function makeOptions(tmpDir: string, overrides: Partial<CreateBundleOptions> = {}): CreateBundleOptions {
  return {
    outputDir: tmpDir,
    priority: 4,
    opcode: 'EXEC',
    sourceAgent: 'planner',
    targetAgent: 'executor',
    manifest: makeManifest(),
    intentMarkdown: '# Test Intent\n\nExecute the test plan.',
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('DACP .msg Fallback', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dacp-msgfb-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // bundleToMsgContent
  // --------------------------------------------------------------------------

  describe('bundleToMsgContent', () => {
    it('produces valid BusMessage with correct header fields', () => {
      const manifest = makeManifest();
      const msg = bundleToMsgContent(manifest, '# Intent');

      expect(msg.header.src).toBe('planner');
      expect(msg.header.dst).toBe('executor');
      expect(msg.header.priority).toBe(4); // default
      expect(msg.header.length).toBe(msg.payload.length);
    });

    it('maps DACP EXEC to Den EXEC', () => {
      const manifest = makeManifest({ opcode: 'EXEC' });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.header.opcode).toBe('EXEC');
    });

    it('maps DACP VERIFY to Den CMP', () => {
      const manifest = makeManifest({ opcode: 'VERIFY' });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.header.opcode).toBe('CMP');
    });

    it('maps DACP RESEARCH to Den QUERY', () => {
      const manifest = makeManifest({ opcode: 'RESEARCH' });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.header.opcode).toBe('QUERY');
    });

    it('maps DACP QUESTION to Den QUERY', () => {
      const manifest = makeManifest({ opcode: 'QUESTION' });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.header.opcode).toBe('QUERY');
    });

    it('maps DACP REPORT to Den STATUS', () => {
      const manifest = makeManifest({ opcode: 'REPORT' });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.header.opcode).toBe('STATUS');
    });

    it('maps DACP ALERT to Den STATUS', () => {
      const manifest = makeManifest({ opcode: 'ALERT' });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.header.opcode).toBe('STATUS');
    });

    it('maps DACP TRANSFORM to Den SEND', () => {
      const manifest = makeManifest({ opcode: 'TRANSFORM' });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.header.opcode).toBe('SEND');
    });

    it('maps DACP CONFIG to Den SEND', () => {
      const manifest = makeManifest({ opcode: 'CONFIG' });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.header.opcode).toBe('SEND');
    });

    it('maps DACP PATCH to Den MOV', () => {
      const manifest = makeManifest({ opcode: 'PATCH' });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.header.opcode).toBe('MOV');
    });

    it('payload starts with [DACP:L{N}] marker line', () => {
      const manifest = makeManifest({ fidelity_level: 2 });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.payload[0]).toBe('[DACP:L2]');
    });

    it('payload includes intent summary on second line', () => {
      const manifest = makeManifest({ intent_summary: 'Custom summary' });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.payload[1]).toBe('Custom summary');
    });

    it('payload includes separator on third line', () => {
      const msg = bundleToMsgContent(makeManifest(), '# Intent');
      expect(msg.payload[2]).toBe('---');
    });

    it('short intents are included in full without truncation', () => {
      const shortIntent = 'Short intent text';
      const msg = bundleToMsgContent(makeManifest(), shortIntent);
      const intentPart = msg.payload.slice(3).join('\n');
      expect(intentPart).toBe(shortIntent);
      expect(intentPart).not.toContain('[truncated');
    });

    it('truncates intent at 500 chars with truncation notice', () => {
      const longIntent = 'A'.repeat(600);
      const msg = bundleToMsgContent(makeManifest(), longIntent);
      const intentPart = msg.payload.slice(3).join('\n');
      expect(intentPart.length).toBeLessThan(600);
      expect(intentPart).toContain('... [truncated, see .bundle/]');
    });

    it('allows priority override', () => {
      const msg = bundleToMsgContent(makeManifest(), '# Intent', 1);
      expect(msg.header.priority).toBe(1);
    });

    it('maps unknown agent names to coordinator', () => {
      const manifest = makeManifest({
        source_agent: 'custom-agent',
        target_agent: 'another-agent',
      });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.header.src).toBe('coordinator');
      expect(msg.header.dst).toBe('coordinator');
    });

    it('preserves valid Den agent IDs', () => {
      const manifest = makeManifest({
        source_agent: 'verifier',
        target_agent: 'sentinel',
      });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.header.src).toBe('verifier');
      expect(msg.header.dst).toBe('sentinel');
    });

    it('uses provenance timestamp for header', () => {
      const manifest = makeManifest({
        provenance: {
          assembled_by: 'test',
          assembled_at: '2026-02-27T14:30:45Z',
          skill_versions: {},
        },
      });
      const msg = bundleToMsgContent(manifest, '# Intent');
      expect(msg.header.timestamp).toBe('20260227-143045');
    });
  });

  // --------------------------------------------------------------------------
  // generateMsgFallback
  // --------------------------------------------------------------------------

  describe('generateMsgFallback', () => {
    it('creates .msg file alongside bundle directory', async () => {
      const bundlePath = await createBundle(makeOptions(tmpDir));
      const msgPath = await generateMsgFallback(bundlePath);

      expect(msgPath).toMatch(/\.msg$/);

      // The .msg file should be in the same parent dir as the bundle
      const parentEntries = await readdir(tmpDir);
      const msgFiles = parentEntries.filter((e) => e.endsWith('.msg'));
      expect(msgFiles.length).toBe(1);
    });

    it('.msg filename follows {timestamp}-{opcode}-{src}-{dst}.msg convention', async () => {
      const bundlePath = await createBundle(makeOptions(tmpDir));
      const msgPath = await generateMsgFallback(bundlePath);

      const filename = msgPath.split('/').pop()!;
      expect(filename).toMatch(/^\d{8}-\d{6}-[A-Z]+-[a-z]+-[a-z]+\.msg$/);
    });

    it('generated .msg file is decodable by Den decodeMessage', async () => {
      const bundlePath = await createBundle(makeOptions(tmpDir));
      const msgPath = await generateMsgFallback(bundlePath);

      const content = await readFile(msgPath, 'utf8');
      const decoded = decodeMessage(content);

      expect(decoded.header.opcode).toBe('EXEC');
      expect(decoded.header.src).toBe('planner');
      expect(decoded.header.dst).toBe('executor');
      expect(decoded.payload[0]).toBe('[DACP:L1]');
    });

    it('respects outputDir option', async () => {
      const bundlePath = await createBundle(makeOptions(tmpDir));
      const outputDir = join(tmpDir, 'output');
      const { mkdir } = await import('node:fs/promises');
      await mkdir(outputDir, { recursive: true });

      const msgPath = await generateMsgFallback(bundlePath, outputDir);
      expect(msgPath).toContain('output');

      const outputEntries = await readdir(outputDir);
      expect(outputEntries.some((e) => e.endsWith('.msg'))).toBe(true);
    });

    it('round-trip: create bundle -> generate fallback -> decode .msg -> verify fields', async () => {
      const manifest = makeManifest({
        fidelity_level: 3,
        opcode: 'VERIFY',
        intent_summary: 'Verify phase completion',
        source_agent: 'executor',
        target_agent: 'verifier',
      });
      const intentMd = '# Verification\n\nCheck all success criteria are met.';

      const bundlePath = await createBundle(
        makeOptions(tmpDir, {
          manifest,
          intentMarkdown: intentMd,
          opcode: 'VERIFY',
          sourceAgent: 'executor',
          targetAgent: 'verifier',
        }),
      );

      const msgPath = await generateMsgFallback(bundlePath);
      const content = await readFile(msgPath, 'utf8');
      const decoded = decodeMessage(content);

      // Verify header mapping
      expect(decoded.header.opcode).toBe('CMP'); // VERIFY -> CMP
      expect(decoded.header.src).toBe('executor');
      expect(decoded.header.dst).toBe('verifier');

      // Verify payload
      expect(decoded.payload[0]).toBe('[DACP:L3]');
      expect(decoded.payload[1]).toBe('Verify phase completion');
      expect(decoded.payload[2]).toBe('---');
      // Intent content preserved
      const intentPart = decoded.payload.slice(3).join('\n');
      expect(intentPart).toContain('# Verification');
      expect(intentPart).toContain('Check all success criteria are met.');
    });
  });
});
