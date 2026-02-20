/**
 * Tests for the Den Work Intake procedure.
 *
 * Verifies: HygieneCheck schema validation, IntakeResult schema validation,
 * IntakeConfig schema validation, runHygieneChecks (empty, short, no-structure,
 * valid), processIntake (valid + invalid), notifyPlanner bus message, notifyRelay
 * bus message, Intake class wrapper, and createIntake factory.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  IntakeConfigSchema,
  IntakeResultSchema,
  HygieneCheckSchema,
  processIntake,
  runHygieneChecks,
  notifyPlanner,
  notifyRelay,
  Intake,
  createIntake,
} from './intake.js';
import { initBus } from './bus.js';
import type { BusConfig } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

/** Create a temp directory and return a BusConfig pointing to it */
async function makeTempConfig(): Promise<{ config: BusConfig; tmpDir: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'den-intake-test-'));
  const busDir = join(dir, 'bus');
  const config: BusConfig = {
    busDir,
    maxQueueDepth: 100,
    deliveryTimeoutMs: 5000,
    deadLetterRetentionDays: 3,
    archiveMaxMessages: 100,
    archiveMaxAgeDays: 7,
  };
  return { config, tmpDir: dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

/** Valid vision text that passes all hygiene checks */
const VALID_VISION = `## Phase 1: Foundation
- Build the core module
- Set up testing infrastructure
- Configure the bus system

## Phase 2: Integration
- Wire up the agents
- Test end-to-end flow
`;

// ============================================================================
// HygieneCheckSchema
// ============================================================================

describe('HygieneCheckSchema', () => {
  it('validates a passing hygiene check', () => {
    const check = HygieneCheckSchema.parse({
      passed: true,
      checks: [
        { name: 'non-empty', passed: true, reason: 'Document has content' },
        { name: 'minimum-length', passed: true, reason: 'Sufficient length' },
        { name: 'has-structure', passed: true, reason: 'Document has structure' },
      ],
    });
    expect(check.passed).toBe(true);
    expect(check.checks).toHaveLength(3);
  });

  it('validates a failing hygiene check', () => {
    const check = HygieneCheckSchema.parse({
      passed: false,
      checks: [
        { name: 'non-empty', passed: false, reason: 'Vision document is empty' },
      ],
    });
    expect(check.passed).toBe(false);
  });
});

// ============================================================================
// IntakeResultSchema
// ============================================================================

describe('IntakeResultSchema', () => {
  it('validates a successful intake result', () => {
    const result = IntakeResultSchema.parse({
      timestamp: '20260220-130000',
      visionLength: 200,
      hygieneResult: {
        passed: true,
        checks: [{ name: 'non-empty', passed: true, reason: 'ok' }],
      },
      plannerNotified: true,
      relayNotified: true,
      plannerMessagePath: '/some/path.msg',
      relayMessagePath: '/some/other.msg',
    });
    expect(result.plannerNotified).toBe(true);
    expect(result.relayNotified).toBe(true);
  });

  it('validates a failed intake result (no notifications)', () => {
    const result = IntakeResultSchema.parse({
      timestamp: '20260220-130000',
      visionLength: 0,
      hygieneResult: {
        passed: false,
        checks: [{ name: 'non-empty', passed: false, reason: 'empty' }],
      },
      plannerNotified: false,
      relayNotified: false,
    });
    expect(result.plannerNotified).toBe(false);
    expect(result.plannerMessagePath).toBeUndefined();
  });
});

// ============================================================================
// IntakeConfigSchema
// ============================================================================

describe('IntakeConfigSchema', () => {
  it('validates a valid config', () => {
    const config = IntakeConfigSchema.parse({ busConfig: { busDir: '/tmp' } });
    expect(config.busConfig).toBeDefined();
  });
});

// ============================================================================
// runHygieneChecks
// ============================================================================

describe('runHygieneChecks', () => {
  it('fails on empty string', () => {
    const result = runHygieneChecks('');
    expect(result.passed).toBe(false);
    const nonEmpty = result.checks.find((c) => c.name === 'non-empty');
    expect(nonEmpty?.passed).toBe(false);
    expect(nonEmpty?.reason).toBe('Vision document is empty');
  });

  it('fails on whitespace-only string', () => {
    const result = runHygieneChecks('   \n  \t  ');
    expect(result.passed).toBe(false);
    const nonEmpty = result.checks.find((c) => c.name === 'non-empty');
    expect(nonEmpty?.passed).toBe(false);
  });

  it('fails on too-short string', () => {
    const result = runHygieneChecks('short');
    expect(result.passed).toBe(false);
    const minLength = result.checks.find((c) => c.name === 'minimum-length');
    expect(minLength?.passed).toBe(false);
    expect(minLength?.reason).toBe('Vision too short (min 50 chars)');
  });

  it('fails on long string without structure', () => {
    const result = runHygieneChecks('a'.repeat(60));
    expect(result.passed).toBe(false);
    // non-empty passes
    expect(result.checks.find((c) => c.name === 'non-empty')?.passed).toBe(true);
    // minimum-length passes
    expect(result.checks.find((c) => c.name === 'minimum-length')?.passed).toBe(true);
    // has-structure fails
    const structure = result.checks.find((c) => c.name === 'has-structure');
    expect(structure?.passed).toBe(false);
    expect(structure?.reason).toBe('No structural elements found');
  });

  it('passes with heading and sufficient length', () => {
    const text = '## Phase 1\n- Build the thing\n' + 'x'.repeat(50);
    const result = runHygieneChecks(text);
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it('passes with bullet-only structure', () => {
    const text = 'Here is a plan with bullets that is long enough for the check\n- First item\n- Second item';
    const result = runHygieneChecks(text);
    expect(result.passed).toBe(true);
  });

  it('passes with numbered-list structure', () => {
    const text = 'Here is a plan with numbered items for the structural check\n1. First step\n2. Second step';
    const result = runHygieneChecks(text);
    expect(result.passed).toBe(true);
  });

  it('always returns exactly 3 checks', () => {
    const result = runHygieneChecks('');
    expect(result.checks).toHaveLength(3);
  });
});

// ============================================================================
// notifyPlanner
// ============================================================================

describe('notifyPlanner', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const temp = await makeTempConfig();
    config = temp.config;
    cleanup = temp.cleanup;
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('sends EXEC message to planner on priority 3', async () => {
    const visionText = 'Build a system with ## Phase 1\n- Task A\n- Task B\n' + 'x'.repeat(100);
    const path = await notifyPlanner(config, visionText);

    // Message file was created
    expect(path).toContain('priority-3');
    expect(path).toContain('.msg');

    // File exists and contains expected content
    const content = await readFile(path, 'utf-8');
    expect(content).toContain('EXEC');
    expect(content).toContain('coordinator');
    expect(content).toContain('planner');
    expect(content).toContain('ACTION:decompose');
    expect(content).toContain('VISION_LENGTH:');
    expect(content).toContain('PREVIEW:');
  });

  it('returns a valid message file path', async () => {
    const path = await notifyPlanner(config, 'some vision text');
    expect(path.endsWith('.msg')).toBe(true);
  });
});

// ============================================================================
// notifyRelay
// ============================================================================

describe('notifyRelay', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const temp = await makeTempConfig();
    config = temp.config;
    cleanup = temp.cleanup;
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('sends STATUS message to relay on priority 6', async () => {
    const path = await notifyRelay(config, 500);

    expect(path).toContain('priority-6');
    expect(path).toContain('.msg');

    const content = await readFile(path, 'utf-8');
    expect(content).toContain('STATUS');
    expect(content).toContain('coordinator');
    expect(content).toContain('relay');
    expect(content).toContain('INTAKE:new_work_received');
    expect(content).toContain('VISION_LENGTH:500');
  });

  it('returns a valid message file path', async () => {
    const path = await notifyRelay(config, 250);
    expect(path.endsWith('.msg')).toBe(true);
  });
});

// ============================================================================
// processIntake
// ============================================================================

describe('processIntake', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const temp = await makeTempConfig();
    config = temp.config;
    cleanup = temp.cleanup;
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('notifies planner and relay on valid vision', async () => {
    const result = await processIntake(config, VALID_VISION);

    expect(result.hygieneResult.passed).toBe(true);
    expect(result.plannerNotified).toBe(true);
    expect(result.relayNotified).toBe(true);
    expect(result.plannerMessagePath).toBeDefined();
    expect(result.relayMessagePath).toBeDefined();
    expect(result.visionLength).toBe(VALID_VISION.length);
    expect(result.timestamp).toBeTruthy();
  });

  it('skips notifications on empty vision', async () => {
    const result = await processIntake(config, '');

    expect(result.hygieneResult.passed).toBe(false);
    expect(result.plannerNotified).toBe(false);
    expect(result.relayNotified).toBe(false);
    expect(result.plannerMessagePath).toBeUndefined();
    expect(result.relayMessagePath).toBeUndefined();
  });

  it('skips notifications on short vision', async () => {
    const result = await processIntake(config, 'too short');

    expect(result.hygieneResult.passed).toBe(false);
    expect(result.plannerNotified).toBe(false);
    expect(result.relayNotified).toBe(false);
  });

  it('records correct visionLength', async () => {
    const text = '## Heading\n- bullet\n' + 'y'.repeat(100);
    const result = await processIntake(config, text);
    expect(result.visionLength).toBe(text.length);
  });
});

// ============================================================================
// Intake class
// ============================================================================

describe('Intake class', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const temp = await makeTempConfig();
    config = temp.config;
    cleanup = temp.cleanup;
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('wraps processIntake with config', async () => {
    const intake = new Intake({ busConfig: config });
    const result = await intake.process(VALID_VISION);

    expect(result.plannerNotified).toBe(true);
    expect(result.relayNotified).toBe(true);
  });

  it('wraps runHygieneChecks', () => {
    const intake = new Intake({ busConfig: config });
    const result = intake.checkHygiene('');

    expect(result.passed).toBe(false);
  });

  it('validates config through Zod', () => {
    expect(() => new Intake({ busConfig: config })).not.toThrow();
  });
});

// ============================================================================
// createIntake factory
// ============================================================================

describe('createIntake', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const temp = await makeTempConfig();
    config = temp.config;
    cleanup = temp.cleanup;
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('returns an initialized Intake instance', () => {
    const intake = createIntake({ busConfig: config });
    expect(intake).toBeInstanceOf(Intake);
  });

  it('produced instance processes intake correctly', async () => {
    const intake = createIntake({ busConfig: config });
    const result = await intake.process(VALID_VISION);
    expect(result.plannerNotified).toBe(true);
  });
});
