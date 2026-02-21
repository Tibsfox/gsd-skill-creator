/**
 * Validation tests for .chipset/chipset.yaml configuration file.
 *
 * Reads the YAML file from disk and validates it against the Chipset module's
 * Zod schemas and DEN_STAFF_POSITIONS constants. Covers CHIP-01 through CHIP-05
 * requirements: core structure, skill requirements, activation triggers,
 * token budgets, and observability configuration.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  parseChipsetConfig,
  DEN_STAFF_POSITIONS,
} from './chipset.js';

// ============================================================================
// YAML loading helper
// ============================================================================

/** Parsed YAML data from .chipset/chipset.yaml */
let yamlData: Record<string, unknown>;

/** Core fields extracted for ChipsetConfigSchema validation */
let coreConfig: Record<string, unknown>;

beforeAll(async () => {
  const jsYaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
  const filePath = join(process.cwd(), '.chipset', 'chipset.yaml');
  const content = await readFile(filePath, 'utf-8');
  yamlData = jsYaml.load(content) as Record<string, unknown>;

  // Extract core fields that ChipsetConfigSchema validates
  const positions = (yamlData.positions as Array<Record<string, unknown>>).map((p) => ({
    id: p.id,
    role: p.role,
    context: p.context,
    tokenBudget: p.tokenBudget,
    lifecycle: p.lifecycle,
    activationTrigger: p.activationTrigger,
  }));

  coreConfig = {
    name: yamlData.name,
    version: yamlData.version,
    positions,
    topology: yamlData.topology,
    totalBudget: yamlData.totalBudget,
  };
});

// ============================================================================
// Group 1: Chipset YAML Core Validation (CHIP-01)
// ============================================================================

describe('Chipset YAML Core Validation (CHIP-01)', () => {
  it('core fields parse through ChipsetConfigSchema without error', () => {
    expect(() => parseChipsetConfig(coreConfig)).not.toThrow();
  });

  it('positions match DEN_STAFF_POSITIONS for all 10 agents', () => {
    const parsed = parseChipsetConfig(coreConfig);

    for (const expected of DEN_STAFF_POSITIONS) {
      const actual = parsed.positions.find((p) => p.id === expected.id);
      expect(actual, `position ${expected.id} must exist`).toBeDefined();
      expect(actual!.role).toBe(expected.role);
      expect(actual!.context).toBe(expected.context);
      expect(actual!.tokenBudget).toBe(expected.tokenBudget);
      expect(actual!.lifecycle).toBe(expected.lifecycle);
      expect(actual!.activationTrigger).toBe(expected.activationTrigger);
    }
  });

  it('name is den-v1.28 and version is 1.0.0', () => {
    expect(yamlData.name).toBe('den-v1.28');
    expect(yamlData.version).toBe('1.0.0');
  });
});

// ============================================================================
// Group 2: Skill Requirements (CHIP-02)
// ============================================================================

describe('Skill Requirements (CHIP-02)', () => {
  it('every position has required and recommended skill lists', () => {
    const positions = yamlData.positions as Array<Record<string, unknown>>;

    for (const pos of positions) {
      const skills = pos.skillRequirements as Record<string, unknown>;
      expect(skills, `${pos.id} must have skillRequirements`).toBeDefined();

      const required = skills.required as string[];
      const recommended = skills.recommended as string[];
      expect(Array.isArray(required), `${pos.id} must have required array`).toBe(true);
      expect(required.length, `${pos.id} must have at least 1 required skill`).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(recommended), `${pos.id} must have recommended array`).toBe(true);
    }
  });

  it('coordinator requires workflow-orchestration and conflict-resolution', () => {
    const positions = yamlData.positions as Array<Record<string, unknown>>;
    const coord = positions.find((p) => p.id === 'coordinator');
    const skills = coord!.skillRequirements as Record<string, string[]>;

    expect(skills.required).toContain('workflow-orchestration');
    expect(skills.required).toContain('conflict-resolution');
  });
});

// ============================================================================
// Group 3: Activation Triggers (CHIP-03)
// ============================================================================

const KNOWN_TRIGGERS = new Set([
  'session_start',
  'on_phase_enter',
  'on_verification',
  'on_phase_exit',
  'on_error',
  'on_execution',
]);

describe('Activation Triggers (CHIP-03)', () => {
  it('each position has an activationTrigger matching known trigger set', () => {
    const positions = yamlData.positions as Array<Record<string, unknown>>;

    for (const pos of positions) {
      const trigger = pos.activationTrigger as string;
      expect(KNOWN_TRIGGERS.has(trigger), `${pos.id} trigger "${trigger}" must be in known set`).toBe(true);
    }
  });

  it('persistent positions use session_start trigger', () => {
    const positions = yamlData.positions as Array<Record<string, unknown>>;
    const persistentIds = ['coordinator', 'relay', 'monitor', 'dispatcher'];

    for (const id of persistentIds) {
      const pos = positions.find((p) => p.id === id);
      expect(pos!.lifecycle).toBe('persistent');
      expect(pos!.activationTrigger).toBe('session_start');
    }
  });

  it('task positions use appropriate lifecycle triggers', () => {
    const positions = yamlData.positions as Array<Record<string, unknown>>;

    const expectations: Record<string, string> = {
      planner: 'on_phase_enter',
      configurator: 'on_phase_enter',
      verifier: 'on_verification',
      chronicler: 'on_phase_exit',
      sentinel: 'on_error',
      executor: 'on_execution',
    };

    for (const [id, expectedTrigger] of Object.entries(expectations)) {
      const pos = positions.find((p) => p.id === id);
      expect(pos!.lifecycle).toBe('task');
      expect(pos!.activationTrigger).toBe(expectedTrigger);
    }
  });
});

// ============================================================================
// Group 4: Token Budgets (CHIP-04)
// ============================================================================

describe('Token Budgets (CHIP-04)', () => {
  it('individual token budgets match CHIP-04 spec', () => {
    const positions = yamlData.positions as Array<Record<string, unknown>>;

    const expectedBudgets: Record<string, number> = {
      coordinator: 0.08,
      relay: 0.05,
      planner: 0.06,
      configurator: 0.05,
      monitor: 0.03,
      dispatcher: 0.03,
      verifier: 0.06,
      chronicler: 0.04,
      sentinel: 0.04,
      executor: 0.15,
    };

    for (const [id, expectedBudget] of Object.entries(expectedBudgets)) {
      const pos = positions.find((p) => p.id === id);
      expect(pos!.tokenBudget, `${id} budget`).toBe(expectedBudget);
    }
  });

  it('totalBudget equals sum of individual budgets (0.59)', () => {
    const positions = yamlData.positions as Array<Record<string, unknown>>;
    const sum = positions.reduce((s, p) => s + (p.tokenBudget as number), 0);

    // Use toBeCloseTo for floating point precision
    expect(sum).toBeCloseTo(0.59, 10);
    expect(yamlData.totalBudget).toBe(0.59);
  });
});

// ============================================================================
// Group 5: Observability (CHIP-05)
// ============================================================================

describe('Observability (CHIP-05)', () => {
  it('dashboard refresh interval is 3000ms', () => {
    const obs = yamlData.observability as Record<string, unknown>;
    const dashboard = obs.dashboard as Record<string, unknown>;
    expect(dashboard.refreshIntervalMs).toBe(3000);
  });

  it('logging format is jsonl with 7-day retention', () => {
    const obs = yamlData.observability as Record<string, unknown>;
    const logging = obs.logging as Record<string, unknown>;
    expect(logging.format).toBe('jsonl');
    expect(logging.retentionDays).toBe(7);
  });

  it('bus monitoring has warning and critical thresholds', () => {
    const obs = yamlData.observability as Record<string, unknown>;
    const bus = obs.busMonitoring as Record<string, unknown>;
    const thresholds = bus.alertThresholds as Record<string, number>;

    expect(thresholds.queueDepthWarning).toBe(50);
    expect(thresholds.queueDepthCritical).toBe(80);
    expect(thresholds.deadLetterWarning).toBe(5);
    expect(thresholds.deadLetterCritical).toBe(10);
    expect(thresholds.oldestUnackedWarningMs).toBe(3000);
    expect(thresholds.oldestUnackedCriticalMs).toBe(5000);
  });
});
