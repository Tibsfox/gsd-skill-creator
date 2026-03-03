/**
 * @file Chain report formatter behavioral tests
 * @description Tests formatChainReport for producing human-readable advisory reports
 *              from ChainValidationResult objects.
 */
import { describe, expect, it } from 'vitest';
import { formatChainReport } from '../../../src/tools/commands/lessons-chain/chain-report.js';
import type { ChainValidationResult } from '../../../src/tools/commands/lessons-chain/chain-runner.js';

function makeIntactResult(): ChainValidationResult {
  return {
    chainIntegrity: {
      valid: true,
      status: 'intact',
      priorLessonsFound: true,
      priorLessonsPath: '.planning/v1.50.14/lessons-learned.md',
      forwardReferenceFound: true,
      forwardReferencePath: '.planning/v1.50.16/plan.md',
      errors: [],
      chainPosition: 3,
      totalInSeries: 50,
    },
    catalog: {
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      entries: [],
      promotedPatterns: [],
      totalLessons: 5,
      uniquePatterns: 3,
    },
    overallStatus: 'intact',
    errors: [],
    timestamp: '2026-03-03T23:00:00.000Z',
  };
}

function makeBrokenResult(): ChainValidationResult {
  return {
    chainIntegrity: {
      valid: false,
      status: 'broken',
      priorLessonsFound: false,
      priorLessonsPath: '',
      forwardReferenceFound: false,
      forwardReferencePath: '',
      errors: [
        'Prior lessons-learned document not found: .planning/v1.50.14/lessons-learned.md',
        'Next milestone plan does not reference lessons-learned from v1.50.15',
      ],
      chainPosition: 3,
      totalInSeries: 50,
    },
    catalog: {
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      entries: [],
      promotedPatterns: [],
      totalLessons: 0,
      uniquePatterns: 0,
    },
    overallStatus: 'broken',
    errors: [
      'Prior lessons-learned document not found: .planning/v1.50.14/lessons-learned.md',
      'Next milestone plan does not reference lessons-learned from v1.50.15',
    ],
    timestamp: '2026-03-03T23:00:00.000Z',
  };
}

function makeIncompleteResult(): ChainValidationResult {
  return {
    chainIntegrity: {
      valid: true,
      status: 'incomplete',
      priorLessonsFound: false,
      priorLessonsPath: '',
      forwardReferenceFound: false,
      forwardReferencePath: '',
      errors: [],
      chainPosition: 3,
      totalInSeries: 50,
    },
    catalog: {
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      entries: [],
      promotedPatterns: [],
      totalLessons: 2,
      uniquePatterns: 1,
    },
    overallStatus: 'incomplete',
    errors: [],
    timestamp: '2026-03-03T23:00:00.000Z',
  };
}

describe('formatChainReport', () => {
  it('should include header "Lessons-Learned Chain Advisory Report"', () => {
    const report = formatChainReport(makeIntactResult());
    expect(report).toContain('Lessons-Learned Chain Advisory Report');
  });

  it('should show [PASS] for chain integrity when valid', () => {
    const report = formatChainReport(makeIntactResult());
    expect(report).toContain('[PASS] Chain Integrity');
  });

  it('should show [FAIL] for chain integrity when not valid', () => {
    const report = formatChainReport(makeBrokenResult());
    expect(report).toContain('[FAIL] Chain Integrity');
  });

  it('should include priorLessonsPath when found', () => {
    const report = formatChainReport(makeIntactResult());
    expect(report).toContain('.planning/v1.50.14/lessons-learned.md');
  });

  it('should show "not found" when prior lessons missing', () => {
    const report = formatChainReport(makeBrokenResult());
    expect(report).toContain('Prior lessons: not found');
  });

  it('should show [PASS] for forward reference when found', () => {
    const report = formatChainReport(makeIntactResult());
    expect(report).toContain('[PASS] Forward Reference');
  });

  it('should show [FAIL] for forward reference when not found', () => {
    const report = formatChainReport(makeBrokenResult());
    expect(report).toContain('[FAIL] Forward Reference');
  });

  it('should include forwardReferencePath when found', () => {
    const report = formatChainReport(makeIntactResult());
    expect(report).toContain('.planning/v1.50.16/plan.md');
  });

  it('should show catalog summary with total lessons and unique patterns', () => {
    const report = formatChainReport(makeIntactResult());
    expect(report).toContain('Total lessons: 5');
    expect(report).toContain('Unique patterns: 3');
  });

  it('should show "None" for promoted patterns when empty', () => {
    const report = formatChainReport(makeIntactResult());
    expect(report).toContain('None');
  });

  it('should list promoted pattern ids when present', () => {
    const result = makeIntactResult();
    result.catalog.promotedPatterns = ['L1', 'L3'];
    const report = formatChainReport(result);
    expect(report).toContain('2 pattern(s) flagged for codification');
    expect(report).toContain('- L1');
    expect(report).toContain('- L3');
  });

  it('should include errors section when errors exist', () => {
    const report = formatChainReport(makeBrokenResult());
    expect(report).toContain('Errors');
    expect(report).toContain('Prior lessons-learned document not found');
    expect(report).toContain('Next milestone plan does not reference');
  });

  it('should show INTACT overall summary for intact chain', () => {
    const report = formatChainReport(makeIntactResult());
    expect(report).toContain('Overall: INTACT - Lessons-learned chain is healthy');
  });

  it('should show BROKEN overall summary for broken chain', () => {
    const report = formatChainReport(makeBrokenResult());
    expect(report).toContain('Overall: BROKEN - Chain integrity issues detected');
  });

  it('should show INCOMPLETE overall summary for incomplete chain', () => {
    const report = formatChainReport(makeIncompleteResult());
    expect(report).toContain('Overall: INCOMPLETE - Chain exists but has gaps');
  });

  it('should include chain position information', () => {
    const report = formatChainReport(makeIntactResult());
    expect(report).toContain('Position: 3 of 50 in series');
  });

  it('should include all sections regardless of result status', () => {
    const report = formatChainReport(makeIntactResult());
    expect(report).toContain('Chain Integrity');
    expect(report).toContain('Forward Reference');
    expect(report).toContain('Catalog Summary');
    expect(report).toContain('Promoted Patterns');
  });

  // Adversarial: intact and broken produce different output
  it('should produce different output for intact vs broken results', () => {
    const intactReport = formatChainReport(makeIntactResult());
    const brokenReport = formatChainReport(makeBrokenResult());
    expect(intactReport).not.toBe(brokenReport);
    expect(intactReport).toContain('INTACT');
    expect(brokenReport).toContain('BROKEN');
  });
});
