/**
 * @file Pacing check function behavioral tests
 * @description Verifies checkSessionBudget and checkContextDepth produce correct
 *              PacingResult objects with appropriate status and advisory messages.
 */
import { describe, expect, it } from 'vitest';
import { checkSessionBudget, checkContextDepth } from '../../../src/core/validation/pacing-gate/pacing-checks.js';
import type { PacingConfig, PacingResult } from '../../../src/core/validation/pacing-gate/pacing-types.js';
import { DEFAULT_PACING_CONFIG } from '../../../src/core/validation/pacing-gate/pacing-types.js';

describe('checkSessionBudget', () => {
  const config = DEFAULT_PACING_CONFIG; // maxSubversionsPerSession: 5

  it('should return pass when subversionsCompleted is within budget', () => {
    const result = checkSessionBudget(config, 'session-1', 3);
    expect(result.status).toBe('pass');
    expect(result.advisories).toEqual([]);
  });

  it('should return pass at exact boundary (subversionsCompleted === maxSubversionsPerSession)', () => {
    const result = checkSessionBudget(config, 'session-2', 5);
    expect(result.status).toBe('pass');
    expect(result.advisories).toEqual([]);
  });

  it('should return warn when subversionsCompleted exceeds budget', () => {
    const result = checkSessionBudget(config, 'session-3', 6);
    expect(result.status).toBe('warn');
  });

  it('should include advisory message with actual and budget values when exceeding', () => {
    const result = checkSessionBudget(config, 'session-4', 8);
    expect(result.advisories).toHaveLength(1);
    expect(result.advisories[0]).toContain('8');
    expect(result.advisories[0]).toContain('5');
    expect(result.advisories[0]).toMatch(/session budget exceeded/i);
  });

  it('should populate budgetMax from config', () => {
    const result = checkSessionBudget(config, 'session-5', 2);
    expect(result.budgetMax).toBe(5);
  });

  it('should set contextWindowsUsed to 0 (not relevant to this check)', () => {
    const result = checkSessionBudget(config, 'session-6', 2);
    expect(result.contextWindowsUsed).toBe(0);
  });

  it('should set depthMinimum from config', () => {
    const result = checkSessionBudget(config, 'session-7', 2);
    expect(result.depthMinimum).toBe(config.minContextWindowsPerSubversion);
  });

  it('should set sessionId from input', () => {
    const result = checkSessionBudget(config, 'my-unique-session', 1);
    expect(result.sessionId).toBe('my-unique-session');
  });

  it('should set subversionsCompleted from input', () => {
    const result = checkSessionBudget(config, 'session-8', 4);
    expect(result.subversionsCompleted).toBe(4);
  });

  it('should produce a valid ISO timestamp', () => {
    const result = checkSessionBudget(config, 'session-9', 1);
    expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it('should return pass with empty advisories when within budget', () => {
    const result = checkSessionBudget(config, 'session-10', 0);
    expect(result.status).toBe('pass');
    expect(result.advisories).toEqual([]);
  });

  it('should return a well-formed PacingResult object with all fields', () => {
    const result = checkSessionBudget(config, 'session-11', 3);
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('sessionId');
    expect(result).toHaveProperty('subversionsCompleted');
    expect(result).toHaveProperty('budgetMax');
    expect(result).toHaveProperty('contextWindowsUsed');
    expect(result).toHaveProperty('depthMinimum');
    expect(result).toHaveProperty('advisories');
    expect(result).toHaveProperty('timestamp');
  });

  it('should produce different results for different configs (not a constant function)', () => {
    const strictConfig: PacingConfig = {
      ...config,
      maxSubversionsPerSession: 2,
    };
    const resultDefault = checkSessionBudget(config, 's', 3);
    const resultStrict = checkSessionBudget(strictConfig, 's', 3);
    expect(resultDefault.status).toBe('pass');
    expect(resultStrict.status).toBe('warn');
  });

  it('should return pass when 0 subversions completed', () => {
    const result = checkSessionBudget(config, 'session-zero', 0);
    expect(result.status).toBe('pass');
  });
});

describe('checkContextDepth', () => {
  const config = DEFAULT_PACING_CONFIG; // minContextWindowsPerSubversion: 2

  it('should return pass when contextWindowsUsed meets minimum', () => {
    const result = checkContextDepth(config, 'session-1', 'v1.50.14', 3);
    expect(result.status).toBe('pass');
    expect(result.advisories).toEqual([]);
  });

  it('should return pass at exact boundary (contextWindowsUsed === minContextWindowsPerSubversion)', () => {
    const result = checkContextDepth(config, 'session-2', 'v1.50.15', 2);
    expect(result.status).toBe('pass');
    expect(result.advisories).toEqual([]);
  });

  it('should return warn when contextWindowsUsed is below minimum', () => {
    const result = checkContextDepth(config, 'session-3', 'v1.50.16', 1);
    expect(result.status).toBe('warn');
  });

  it('should include advisory message with actual depth and minimum when insufficient', () => {
    const result = checkContextDepth(config, 'session-4', 'v1.50.17', 1);
    expect(result.advisories).toHaveLength(1);
    expect(result.advisories[0]).toContain('1');
    expect(result.advisories[0]).toContain('2');
    expect(result.advisories[0]).toContain('v1.50.17');
    expect(result.advisories[0]).toMatch(/context depth insufficient/i);
  });

  it('should populate depthMinimum from config', () => {
    const result = checkContextDepth(config, 'session-5', 'v1.50.18', 3);
    expect(result.depthMinimum).toBe(2);
  });

  it('should set subversionsCompleted to 0 (not relevant to this check)', () => {
    const result = checkContextDepth(config, 'session-6', 'v1.50.19', 3);
    expect(result.subversionsCompleted).toBe(0);
  });

  it('should set budgetMax from config', () => {
    const result = checkContextDepth(config, 'session-7', 'v1.50.20', 3);
    expect(result.budgetMax).toBe(config.maxSubversionsPerSession);
  });

  it('should set sessionId from input', () => {
    const result = checkContextDepth(config, 'unique-session-id', 'v1.50.21', 3);
    expect(result.sessionId).toBe('unique-session-id');
  });

  it('should set contextWindowsUsed from input', () => {
    const result = checkContextDepth(config, 'session-8', 'v1.50.22', 7);
    expect(result.contextWindowsUsed).toBe(7);
  });

  it('should produce a valid ISO timestamp', () => {
    const result = checkContextDepth(config, 'session-9', 'v1.50.23', 3);
    expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it('should return a well-formed PacingResult object with all fields', () => {
    const result = checkContextDepth(config, 'session-10', 'v1.50.24', 3);
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('sessionId');
    expect(result).toHaveProperty('subversionsCompleted');
    expect(result).toHaveProperty('budgetMax');
    expect(result).toHaveProperty('contextWindowsUsed');
    expect(result).toHaveProperty('depthMinimum');
    expect(result).toHaveProperty('advisories');
    expect(result).toHaveProperty('timestamp');
  });

  it('should produce different results for different configs (not a constant function)', () => {
    const deepConfig: PacingConfig = {
      ...config,
      minContextWindowsPerSubversion: 5,
    };
    const resultDefault = checkContextDepth(config, 's', 'v1', 3);
    const resultDeep = checkContextDepth(deepConfig, 's', 'v1', 3);
    expect(resultDefault.status).toBe('pass');
    expect(resultDeep.status).toBe('warn');
  });

  it('should warn when 0 context windows used and minimum > 0', () => {
    const result = checkContextDepth(config, 'session-zero', 'v1.50.25', 0);
    expect(result.status).toBe('warn');
    expect(result.advisories).toHaveLength(1);
  });
});
