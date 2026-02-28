/**
 * TDD test suite for the GSD Den Verifier agent.
 *
 * Tests verification gates, verdicts, bus message reporting,
 * JSONL logging, Verifier class wrapper, and factory.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  VerifierConfigSchema,
  VerificationGateSchema,
  VerdictSchema,
  VerificationResultSchema,
  VerifierEntrySchema,
  createVerificationGates,
  runGate,
  renderVerdict,
  reportVerdict,
  appendVerifierEntry,
  readVerifierLog,
  Verifier,
  createVerifier,
} from './verifier.js';
import type { VerificationGate, VerifierConfig } from './verifier.js';
import { initBus } from './bus.js';
import { decodeMessage } from './encoder.js';
import { BusConfigSchema } from './types.js';

// ============================================================================
// Test helpers
// ============================================================================

let tempDir: string;
let busDir: string;
let logPath: string;
let busConfig: ReturnType<typeof BusConfigSchema.parse>;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'verifier-test-'));
  busDir = join(tempDir, 'bus');
  logPath = join(tempDir, 'logs', 'verifier.jsonl');
  busConfig = BusConfigSchema.parse({ busDir });
  await initBus(busConfig);
});

// ============================================================================
// Schema validation
// ============================================================================

describe('VerifierConfigSchema', () => {
  it('parses valid config with defaults', () => {
    const config = VerifierConfigSchema.parse({ busConfig });
    expect(config.logPath).toBe('.planning/den/logs/verifier.jsonl');
    expect(config.agentId).toBe('verifier');
    expect(config.busConfig).toEqual(busConfig);
  });

  it('accepts custom logPath and agentId', () => {
    const config = VerifierConfigSchema.parse({
      busConfig,
      logPath: '/tmp/custom.jsonl',
      agentId: 'verifier',
    });
    expect(config.logPath).toBe('/tmp/custom.jsonl');
  });

  it('applies defaults when busConfig provided as any', () => {
    // busConfig is z.any() (same pattern as coordinator.ts), so {} is accepted
    const config = VerifierConfigSchema.parse({ busConfig: {} });
    expect(config.logPath).toBe('.planning/den/logs/verifier.jsonl');
    expect(config.agentId).toBe('verifier');
  });
});

describe('VerificationGateSchema', () => {
  it('parses a valid gate', () => {
    const gate = VerificationGateSchema.parse({
      name: 'tests-pass',
      description: 'Pre-existing test suite passes',
      status: 'pass',
      detail: 'All 306 tests passed',
      severity: 'blocking',
    });
    expect(gate.name).toBe('tests-pass');
    expect(gate.status).toBe('pass');
    expect(gate.severity).toBe('blocking');
  });

  it('rejects invalid status', () => {
    expect(() => VerificationGateSchema.parse({
      name: 'tests-pass',
      description: 'desc',
      status: 'invalid',
      detail: '',
      severity: 'blocking',
    })).toThrow();
  });

  it('rejects invalid severity', () => {
    expect(() => VerificationGateSchema.parse({
      name: 'tests-pass',
      description: 'desc',
      status: 'pass',
      detail: '',
      severity: 'critical',
    })).toThrow();
  });
});

describe('VerdictSchema', () => {
  it('parses a PASS verdict', () => {
    const verdict = VerdictSchema.parse({
      result: 'PASS',
      gates: [],
      phase: '258',
      plan: '02',
      artifacts: ['src/den/verifier.ts'],
      gitSha: 'abc123f',
      recommendation: null,
    });
    expect(verdict.result).toBe('PASS');
    expect(verdict.recommendation).toBeNull();
  });

  it('parses a FAIL verdict with recommendation', () => {
    const verdict = VerdictSchema.parse({
      result: 'FAIL',
      gates: [],
      phase: '258',
      plan: '02',
      artifacts: [],
      gitSha: 'def456g',
      recommendation: 'Fix failing tests before proceeding',
    });
    expect(verdict.result).toBe('FAIL');
    expect(verdict.recommendation).toBe('Fix failing tests before proceeding');
  });

  it('rejects invalid result value', () => {
    expect(() => VerdictSchema.parse({
      result: 'MAYBE',
      gates: [],
      phase: '258',
      plan: '02',
      artifacts: [],
      gitSha: 'x',
      recommendation: null,
    })).toThrow();
  });
});

describe('VerificationResultSchema', () => {
  it('parses a verification result', () => {
    const result = VerificationResultSchema.parse({
      verdict: {
        result: 'PASS',
        gates: [],
        phase: '258',
        plan: '02',
        artifacts: [],
        gitSha: 'abc',
        recommendation: null,
      },
      sentToCoordinator: true,
    });
    expect(result.sentToCoordinator).toBe(true);
  });
});

describe('VerifierEntrySchema', () => {
  it('parses a valid entry', () => {
    const entry = VerifierEntrySchema.parse({
      timestamp: '20260220-134500',
      type: 'verification-start',
      phase: '258',
      plan: '02',
      detail: { task: 'initial-check' },
    });
    expect(entry.type).toBe('verification-start');
  });

  it('rejects invalid type', () => {
    expect(() => VerifierEntrySchema.parse({
      timestamp: '20260220-134500',
      type: 'unknown-type',
      phase: '258',
      plan: '02',
      detail: {},
    })).toThrow();
  });
});

// ============================================================================
// createVerificationGates
// ============================================================================

describe('createVerificationGates', () => {
  it('returns 4 gates', () => {
    const gates = createVerificationGates();
    expect(gates).toHaveLength(4);
  });

  it('all gates have status skip and empty detail', () => {
    const gates = createVerificationGates();
    for (const gate of gates) {
      expect(gate.status).toBe('skip');
      expect(gate.detail).toBe('');
    }
  });

  it('has correct gate names', () => {
    const gates = createVerificationGates();
    const names = gates.map((g) => g.name);
    expect(names).toEqual([
      'tests-pass',
      'new-coverage',
      'code-review',
      'artifact-integrity',
    ]);
  });

  it('has correct severities', () => {
    const gates = createVerificationGates();
    const severities = gates.map((g) => g.severity);
    expect(severities).toEqual([
      'blocking',
      'warning',
      'blocking',
      'blocking',
    ]);
  });

  it('all gates validate through VerificationGateSchema', () => {
    const gates = createVerificationGates();
    for (const gate of gates) {
      expect(() => VerificationGateSchema.parse(gate)).not.toThrow();
    }
  });
});

// ============================================================================
// runGate
// ============================================================================

describe('runGate', () => {
  it('updates gate to pass with checker detail', async () => {
    const gate = createVerificationGates()[0]; // tests-pass
    const result = await runGate(gate, async () => ({
      status: 'pass' as const,
      detail: 'All 306 tests passed',
    }));
    expect(result.status).toBe('pass');
    expect(result.detail).toBe('All 306 tests passed');
    expect(result.name).toBe('tests-pass');
  });

  it('updates gate to fail with checker detail', async () => {
    const gate = createVerificationGates()[0];
    const result = await runGate(gate, async () => ({
      status: 'fail' as const,
      detail: '3 tests failed',
    }));
    expect(result.status).toBe('fail');
    expect(result.detail).toBe('3 tests failed');
  });

  it('sets gate to fail when checker throws', async () => {
    const gate = createVerificationGates()[0];
    const result = await runGate(gate, async () => {
      throw new Error('Test runner crashed');
    });
    expect(result.status).toBe('fail');
    expect(result.detail).toBe('Test runner crashed');
  });

  it('preserves gate name and severity through run', async () => {
    const gate = createVerificationGates()[1]; // new-coverage (warning)
    const result = await runGate(gate, async () => ({
      status: 'pass' as const,
      detail: '92% coverage',
    }));
    expect(result.name).toBe('new-coverage');
    expect(result.severity).toBe('warning');
    expect(result.description).toBe(gate.description);
  });
});

// ============================================================================
// renderVerdict
// ============================================================================

describe('renderVerdict', () => {
  it('returns PASS when all gates pass', () => {
    const gates: VerificationGate[] = createVerificationGates().map((g) => ({
      ...g,
      status: 'pass',
      detail: 'ok',
    }));
    const verdict = renderVerdict(gates, '258', '02', ['verifier.ts'], 'abc123');
    expect(verdict.result).toBe('PASS');
    expect(verdict.recommendation).toBeNull();
    expect(verdict.gates).toHaveLength(4);
    expect(verdict.phase).toBe('258');
    expect(verdict.plan).toBe('02');
    expect(verdict.artifacts).toEqual(['verifier.ts']);
    expect(verdict.gitSha).toBe('abc123');
  });

  it('returns FAIL when a blocking gate fails', () => {
    const gates: VerificationGate[] = createVerificationGates().map((g) => ({
      ...g,
      status: g.name === 'tests-pass' ? 'fail' : 'pass',
      detail: g.name === 'tests-pass' ? '3 tests failed: fix tests' : 'ok',
    }));
    const verdict = renderVerdict(gates, '258', '02', [], 'def456');
    expect(verdict.result).toBe('FAIL');
    expect(verdict.recommendation).toBe('3 tests failed: fix tests');
  });

  it('returns PASS when only warning gates fail', () => {
    const gates: VerificationGate[] = createVerificationGates().map((g) => ({
      ...g,
      status: g.severity === 'warning' ? 'fail' : 'pass',
      detail: g.severity === 'warning' ? 'low coverage' : 'ok',
    }));
    const verdict = renderVerdict(gates, '258', '02', [], 'ghi789');
    expect(verdict.result).toBe('PASS');
    expect(verdict.recommendation).toBeNull();
  });

  it('recommendation is from first failing blocking gate', () => {
    const gates: VerificationGate[] = createVerificationGates().map((g) => ({
      ...g,
      status: g.severity === 'blocking' ? 'fail' : 'pass',
      detail: g.name === 'tests-pass' ? 'test failure detail' :
        g.name === 'code-review' ? 'review failure detail' :
          g.name === 'artifact-integrity' ? 'artifact failure detail' : 'ok',
    }));
    const verdict = renderVerdict(gates, '258', '02', [], 'jkl012');
    expect(verdict.result).toBe('FAIL');
    // First blocking gate is tests-pass
    expect(verdict.recommendation).toBe('test failure detail');
  });

  it('includes all gates in the verdict regardless of status', () => {
    const gates: VerificationGate[] = createVerificationGates().map((g) => ({
      ...g,
      status: 'skip',
      detail: '',
    }));
    const verdict = renderVerdict(gates, '258', '02', [], 'mno345');
    // Skipped blocking gates don't trigger FAIL (only 'fail' status does)
    expect(verdict.result).toBe('PASS');
    expect(verdict.gates).toHaveLength(4);
  });
});

// ============================================================================
// reportVerdict
// ============================================================================

describe('reportVerdict', () => {
  it('sends CMP message to coordinator for PASS verdict', async () => {
    const config: VerifierConfig = VerifierConfigSchema.parse({
      busConfig,
      logPath,
      agentId: 'verifier',
    });

    const gates = createVerificationGates().map((g) => ({
      ...g, status: 'pass' as const, detail: 'ok',
    }));
    const verdict = renderVerdict(gates, '258', '02', ['verifier.ts'], 'abc123');

    const result = await reportVerdict(config, verdict);
    expect(result.sentToCoordinator).toBe(true);
    expect(result.verdict).toEqual(verdict);

    // Verify the message was actually written to priority-2
    const files = await readdir(join(busDir, 'priority-2'));
    expect(files.filter((f) => f.endsWith('.msg'))).toHaveLength(1);

    // Decode and verify message content
    const msgContent = await readFile(join(busDir, 'priority-2', files[0]), 'utf-8');
    const msg = decodeMessage(msgContent);
    expect(msg.header.opcode).toBe('CMP');
    expect(msg.header.priority).toBe(2);
    expect(msg.header.src).toBe('verifier');
    expect(msg.header.dst).toBe('coordinator');
    expect(msg.payload[0]).toBe('RESULT:PASS');
    expect(msg.payload[1]).toBe('GATES:4/4');
  });

  it('sends CMP message with FAIL details', async () => {
    const config: VerifierConfig = VerifierConfigSchema.parse({
      busConfig,
      logPath,
      agentId: 'verifier',
    });

    const gates = createVerificationGates().map((g) => ({
      ...g,
      status: (g.name === 'tests-pass' ? 'fail' : 'pass') as 'pass' | 'fail',
      detail: g.name === 'tests-pass' ? '3 tests failed' : 'ok',
    }));
    const verdict = renderVerdict(gates, '258', '02', [], 'def456');

    const result = await reportVerdict(config, verdict);
    expect(result.sentToCoordinator).toBe(true);

    const files = await readdir(join(busDir, 'priority-2'));
    const msgContent = await readFile(join(busDir, 'priority-2', files[0]), 'utf-8');
    const msg = decodeMessage(msgContent);
    expect(msg.payload[0]).toBe('RESULT:FAIL');
    expect(msg.payload[1]).toBe('GATES:3/4');
    // Failing gate details
    expect(msg.payload).toEqual(expect.arrayContaining([
      expect.stringContaining('GATE_FAILED:tests-pass'),
    ]));
    expect(msg.payload).toEqual(expect.arrayContaining([
      expect.stringContaining('DETAIL:3 tests failed'),
    ]));
    expect(msg.payload).toEqual(expect.arrayContaining([
      expect.stringContaining('SEVERITY:blocking'),
    ]));
    expect(msg.payload).toEqual(expect.arrayContaining([
      expect.stringContaining('RECOMMENDATION:3 tests failed'),
    ]));
  });
});

// ============================================================================
// JSONL round-trip
// ============================================================================

describe('JSONL round-trip', () => {
  it('appendVerifierEntry + readVerifierLog round-trips entries', async () => {
    const entry = {
      timestamp: '20260220-134500',
      type: 'verification-start' as const,
      phase: '258',
      plan: '02',
      detail: { task: 'initial-check', count: 4 },
    };

    await appendVerifierEntry(logPath, entry);
    await appendVerifierEntry(logPath, {
      ...entry,
      type: 'gate-result',
      detail: { gate: 'tests-pass', status: 'pass' },
    });

    const entries = await readVerifierLog(logPath);
    expect(entries).toHaveLength(2);
    expect(entries[0].type).toBe('verification-start');
    expect(entries[1].type).toBe('gate-result');
    expect(entries[0].detail).toEqual({ task: 'initial-check', count: 4 });
  });

  it('readVerifierLog returns empty array for missing file', async () => {
    const entries = await readVerifierLog(join(tempDir, 'nonexistent.jsonl'));
    expect(entries).toEqual([]);
  });
});

// ============================================================================
// Verifier class
// ============================================================================

describe('Verifier class', () => {
  it('createGates delegates to createVerificationGates', () => {
    const verifier = new Verifier(VerifierConfigSchema.parse({
      busConfig,
      logPath,
    }));
    const gates = verifier.createGates();
    expect(gates).toHaveLength(4);
    expect(gates[0].name).toBe('tests-pass');
  });

  it('runGate delegates to stateless runGate', async () => {
    const verifier = new Verifier(VerifierConfigSchema.parse({
      busConfig,
      logPath,
    }));
    const gate = verifier.createGates()[0];
    const result = await verifier.runGate(gate, async () => ({
      status: 'pass' as const,
      detail: 'passed',
    }));
    expect(result.status).toBe('pass');
  });

  it('renderVerdict delegates to stateless renderVerdict', () => {
    const verifier = new Verifier(VerifierConfigSchema.parse({
      busConfig,
      logPath,
    }));
    const gates = verifier.createGates().map((g) => ({
      ...g, status: 'pass' as const, detail: 'ok',
    }));
    const verdict = verifier.renderVerdict(gates, '258', '02', [], 'sha');
    expect(verdict.result).toBe('PASS');
  });

  it('reportVerdict delegates to stateless reportVerdict', async () => {
    const verifier = new Verifier(VerifierConfigSchema.parse({
      busConfig,
      logPath,
    }));
    const gates = verifier.createGates().map((g) => ({
      ...g, status: 'pass' as const, detail: 'ok',
    }));
    const verdict = verifier.renderVerdict(gates, '258', '02', [], 'sha');
    const result = await verifier.reportVerdict(verdict);
    expect(result.sentToCoordinator).toBe(true);
  });

  it('appendEntry and getLog delegate to JSONL functions', async () => {
    const verifier = new Verifier(VerifierConfigSchema.parse({
      busConfig,
      logPath,
    }));
    await verifier.appendEntry({
      timestamp: '20260220-134500',
      type: 'verdict',
      phase: '258',
      plan: '02',
      detail: { result: 'PASS' },
    });
    const entries = await verifier.getLog();
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('verdict');
  });
});

// ============================================================================
// createVerifier factory
// ============================================================================

describe('createVerifier', () => {
  it('creates an initialized Verifier with defaults', () => {
    const verifier = createVerifier({ busConfig });
    expect(verifier).toBeInstanceOf(Verifier);
  });

  it('accepts custom config', () => {
    const verifier = createVerifier({
      busConfig,
      logPath: '/tmp/custom.jsonl',
      agentId: 'verifier',
    });
    expect(verifier).toBeInstanceOf(Verifier);
  });

  it('creates a Verifier that can run full pipeline', async () => {
    const verifier = createVerifier({ busConfig, logPath });
    const gates = verifier.createGates();
    const ranGates = await Promise.all(
      gates.map((g) =>
        verifier.runGate(g, async () => ({
          status: 'pass' as const,
          detail: 'ok',
        })),
      ),
    );
    const verdict = verifier.renderVerdict(ranGates, '258', '02', ['verifier.ts'], 'sha');
    expect(verdict.result).toBe('PASS');
    const result = await verifier.reportVerdict(verdict);
    expect(result.sentToCoordinator).toBe(true);
  });
});
