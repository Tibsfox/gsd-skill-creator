/**
 * @file Lessons-learned chain validation behavioral tests
 * @description Tests validateChainIntegrity and validateForwardReference functions
 *              for chain integrity validation and forward reference enforcement.
 */
import { describe, expect, it } from 'vitest';
import { validateChainIntegrity, validateForwardReference } from '../../../src/tools/commands/lessons-chain/chain-validation.js';
import { DEFAULT_CHAIN_CONFIG } from '../../../src/tools/commands/lessons-chain/chain-types.js';
import type { ChainConfig } from '../../../src/tools/commands/lessons-chain/chain-types.js';

describe('validateChainIntegrity', () => {
  const baseParams = {
    config: DEFAULT_CHAIN_CONFIG,
    milestoneId: 'v1.50.15',
    priorMilestoneId: 'v1.50.14',
    priorLessonsPath: '.planning/v1.50.14/lessons-learned.md',
    priorLessonsExists: true,
    currentMilestoneContent: 'This milestone builds on lessons from .planning/v1.50.14/lessons-learned.md',
    chainPosition: 2,
    totalInSeries: 50,
  };

  it('should return valid=true and status=intact when prior lessons exist and are referenced', () => {
    const result = validateChainIntegrity(baseParams);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('intact');
    expect(result.priorLessonsFound).toBe(true);
    expect(result.priorLessonsPath).toBe('.planning/v1.50.14/lessons-learned.md');
    expect(result.errors).toEqual([]);
  });

  it('should return valid=false and status=broken when prior lessons do not exist', () => {
    const result = validateChainIntegrity({
      ...baseParams,
      priorLessonsExists: false,
    });
    expect(result.valid).toBe(false);
    expect(result.status).toBe('broken');
    expect(result.priorLessonsFound).toBe(false);
    expect(result.priorLessonsPath).toBe('');
  });

  it('should return valid=false and status=broken when prior lessons exist but are not referenced', () => {
    const result = validateChainIntegrity({
      ...baseParams,
      currentMilestoneContent: 'This milestone has no references at all.',
    });
    expect(result.valid).toBe(false);
    expect(result.status).toBe('broken');
    expect(result.priorLessonsFound).toBe(true);
    expect(result.priorLessonsPath).toBe('.planning/v1.50.14/lessons-learned.md');
  });

  it('should return valid=true and status=incomplete when enforcement disabled and prior lessons missing', () => {
    const disabledConfig: ChainConfig = {
      ...DEFAULT_CHAIN_CONFIG,
      requiresPriorLessons: false,
    };
    const result = validateChainIntegrity({
      ...baseParams,
      config: disabledConfig,
      priorLessonsExists: false,
    });
    expect(result.valid).toBe(true);
    expect(result.status).toBe('incomplete');
    expect(result.errors).toEqual([]);
  });

  it('should populate priorLessonsPath when found, empty string when not', () => {
    const found = validateChainIntegrity(baseParams);
    expect(found.priorLessonsPath).toBe('.planning/v1.50.14/lessons-learned.md');

    const notFound = validateChainIntegrity({
      ...baseParams,
      priorLessonsExists: false,
    });
    expect(notFound.priorLessonsPath).toBe('');
  });

  it('should populate errors with human-readable message when prior lessons not found', () => {
    const result = validateChainIntegrity({
      ...baseParams,
      priorLessonsExists: false,
    });
    expect(result.errors).toContain(
      'Prior lessons-learned document not found: .planning/v1.50.14/lessons-learned.md'
    );
  });

  it('should populate errors with reference-missing message when prior lessons exist but unreferenced', () => {
    const result = validateChainIntegrity({
      ...baseParams,
      currentMilestoneContent: 'No references here.',
    });
    expect(result.errors).toContain(
      'Current milestone v1.50.15 does not reference prior lessons-learned from v1.50.14'
    );
  });

  it('should have empty errors when validation passes', () => {
    const result = validateChainIntegrity(baseParams);
    expect(result.errors).toEqual([]);
  });

  it('should pass through chainPosition and totalInSeries', () => {
    const result = validateChainIntegrity(baseParams);
    expect(result.chainPosition).toBe(2);
    expect(result.totalInSeries).toBe(50);
  });

  it('should default forwardReferenceFound to false and forwardReferencePath to empty', () => {
    const result = validateChainIntegrity(baseParams);
    expect(result.forwardReferenceFound).toBe(false);
    expect(result.forwardReferencePath).toBe('');
  });

  it('should return valid=true and status=intact for first milestone (chainPosition=1) even without prior lessons', () => {
    const result = validateChainIntegrity({
      ...baseParams,
      chainPosition: 1,
      priorLessonsExists: false,
    });
    expect(result.valid).toBe(true);
    expect(result.status).toBe('intact');
    expect(result.errors).toEqual([]);
  });

  // Adversarial: different configs produce different results
  it('should produce different results for same inputs with different config', () => {
    const enforcedResult = validateChainIntegrity({
      ...baseParams,
      priorLessonsExists: false,
      config: { ...DEFAULT_CHAIN_CONFIG, requiresPriorLessons: true },
    });
    const relaxedResult = validateChainIntegrity({
      ...baseParams,
      priorLessonsExists: false,
      config: { ...DEFAULT_CHAIN_CONFIG, requiresPriorLessons: false },
    });
    expect(enforcedResult.valid).not.toBe(relaxedResult.valid);
    expect(enforcedResult.status).not.toBe(relaxedResult.status);
  });

  // Adversarial: empty content always fails reference check
  it('should fail reference check when currentMilestoneContent is empty and prior lessons exist', () => {
    const result = validateChainIntegrity({
      ...baseParams,
      currentMilestoneContent: '',
    });
    expect(result.valid).toBe(false);
    expect(result.status).toBe('broken');
  });

  // Adversarial: reference by priorMilestoneId also matches
  it('should pass when currentMilestoneContent references priorMilestoneId instead of path', () => {
    const result = validateChainIntegrity({
      ...baseParams,
      currentMilestoneContent: 'Building on v1.50.14 lessons.',
    });
    expect(result.valid).toBe(true);
    expect(result.status).toBe('intact');
  });

  it('should produce well-formed ChainIntegrity with all fields populated', () => {
    const result = validateChainIntegrity(baseParams);
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('priorLessonsFound');
    expect(result).toHaveProperty('priorLessonsPath');
    expect(result).toHaveProperty('forwardReferenceFound');
    expect(result).toHaveProperty('forwardReferencePath');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('chainPosition');
    expect(result).toHaveProperty('totalInSeries');
  });
});

describe('validateForwardReference', () => {
  const baseParams = {
    config: DEFAULT_CHAIN_CONFIG,
    currentMilestoneId: 'v1.50.15',
    currentLessonsPath: '.planning/v1.50.15/lessons-learned.md',
    nextPlanContent: 'This plan references .planning/v1.50.15/lessons-learned.md for continuity.',
    nextPlanPath: '.planning/v1.50.16/plan.md',
    chainPosition: 3,
    totalInSeries: 50,
  };

  it('should return forwardReferenceFound=true when nextPlanContent references currentLessonsPath', () => {
    const result = validateForwardReference(baseParams);
    expect(result.forwardReferenceFound).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('intact');
  });

  it('should return forwardReferenceFound=false when nextPlanContent has no reference', () => {
    const result = validateForwardReference({
      ...baseParams,
      nextPlanContent: 'This plan has no references.',
    });
    expect(result.forwardReferenceFound).toBe(false);
    expect(result.valid).toBe(false);
    expect(result.status).toBe('broken');
  });

  it('should populate forwardReferencePath with nextPlanPath when reference found', () => {
    const result = validateForwardReference(baseParams);
    expect(result.forwardReferencePath).toBe('.planning/v1.50.16/plan.md');
  });

  it('should have empty forwardReferencePath when reference not found', () => {
    const result = validateForwardReference({
      ...baseParams,
      nextPlanContent: 'No ref.',
    });
    expect(result.forwardReferencePath).toBe('');
  });

  it('should add error when reference not found and feedForwardEnforced=true', () => {
    const result = validateForwardReference({
      ...baseParams,
      nextPlanContent: 'No ref.',
    });
    expect(result.errors).toContain(
      'Next milestone plan does not reference lessons-learned from v1.50.15'
    );
  });

  it('should return status=incomplete when reference not found and feedForwardEnforced=false', () => {
    const relaxedConfig: ChainConfig = {
      ...DEFAULT_CHAIN_CONFIG,
      feedForwardEnforced: false,
    };
    const result = validateForwardReference({
      ...baseParams,
      config: relaxedConfig,
      nextPlanContent: 'No ref.',
    });
    expect(result.valid).toBe(true);
    expect(result.status).toBe('incomplete');
    expect(result.errors).toEqual([]);
  });

  it('should return valid=true and status=intact for last milestone (chainPosition=totalInSeries)', () => {
    const result = validateForwardReference({
      ...baseParams,
      chainPosition: 50,
      totalInSeries: 50,
      nextPlanContent: '', // no next plan content for last milestone
    });
    expect(result.valid).toBe(true);
    expect(result.status).toBe('intact');
    expect(result.errors).toEqual([]);
  });

  it('should default priorLessonsFound and priorLessonsPath', () => {
    const result = validateForwardReference(baseParams);
    expect(result.priorLessonsFound).toBe(false);
    expect(result.priorLessonsPath).toBe('');
  });

  // Adversarial: different feedForwardEnforced values produce different results
  it('should produce different results for same inputs with different feedForwardEnforced', () => {
    const enforcedResult = validateForwardReference({
      ...baseParams,
      nextPlanContent: 'No ref.',
      config: { ...DEFAULT_CHAIN_CONFIG, feedForwardEnforced: true },
    });
    const relaxedResult = validateForwardReference({
      ...baseParams,
      nextPlanContent: 'No ref.',
      config: { ...DEFAULT_CHAIN_CONFIG, feedForwardEnforced: false },
    });
    expect(enforcedResult.valid).not.toBe(relaxedResult.valid);
    expect(enforcedResult.status).not.toBe(relaxedResult.status);
  });

  // Adversarial: empty nextPlanContent fails when enforcement enabled
  it('should fail when nextPlanContent is empty and enforcement enabled', () => {
    const result = validateForwardReference({
      ...baseParams,
      nextPlanContent: '',
      chainPosition: 3, // not last
    });
    expect(result.valid).toBe(false);
    expect(result.status).toBe('broken');
  });

  // Reference by milestoneId also matches
  it('should pass when nextPlanContent references currentMilestoneId instead of path', () => {
    const result = validateForwardReference({
      ...baseParams,
      nextPlanContent: 'This plan builds on v1.50.15 review findings.',
    });
    expect(result.forwardReferenceFound).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('intact');
  });

  it('should produce well-formed ChainIntegrity with all fields populated', () => {
    const result = validateForwardReference(baseParams);
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('priorLessonsFound');
    expect(result).toHaveProperty('priorLessonsPath');
    expect(result).toHaveProperty('forwardReferenceFound');
    expect(result).toHaveProperty('forwardReferencePath');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('chainPosition');
    expect(result).toHaveProperty('totalInSeries');
  });
});
