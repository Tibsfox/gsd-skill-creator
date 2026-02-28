/**
 * Tests for the hygiene report generator.
 *
 * Verifies trust-based filtering, importance mapping, critical pattern
 * flagging, coherence finding integration, and summary computation.
 *
 * @module staging/hygiene/report.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateHygieneReport,
  type HygieneReport,
  type ReportFinding,
  type ImportanceLevel,
} from './report.js';
import type { HygieneFinding } from './types.js';
import type { CoherenceResult } from './scope-coherence.js';
import type { FamiliarityTier } from './trust-types.js';

// ── Test helpers ────────────────────────────────────────────────────

function makeFinding(overrides: Partial<HygieneFinding> = {}): HygieneFinding {
  return {
    patternId: 'test-pattern',
    category: 'embedded-instructions',
    severity: 'high',
    message: 'Test finding message',
    ...overrides,
  };
}

function makeCoherenceResult(overrides: Partial<CoherenceResult> = {}): CoherenceResult {
  return {
    isCoherent: false,
    findings: [
      {
        tool: 'Bash',
        severity: 'high',
        reason: 'Tool "Bash" not consistent with declared purpose.',
      },
    ],
    riskLevel: 'high',
    ...overrides,
  };
}

// ── Trust-based filtering ───────────────────────────────────────────

describe('generateHygieneReport', () => {
  describe('trust-based filtering', () => {
    it('filters out findings for Home tier (findings empty, filtered=true, totalFindings > 0)', () => {
      const findings = [makeFinding(), makeFinding({ patternId: 'another' })];
      const report = generateHygieneReport({ findings, tier: 'home' });

      expect(report.tier).toBe('home');
      expect(report.filtered).toBe(true);
      expect(report.totalFindings).toBe(2);
      expect(report.findings).toEqual([]);
    });

    it('filters out findings for Neighborhood tier', () => {
      const findings = [makeFinding()];
      const report = generateHygieneReport({ findings, tier: 'neighborhood' });

      expect(report.tier).toBe('neighborhood');
      expect(report.filtered).toBe(true);
      expect(report.totalFindings).toBe(1);
      expect(report.findings).toEqual([]);
    });

    it('surfaces findings for Town tier (filtered=false)', () => {
      const findings = [makeFinding()];
      const report = generateHygieneReport({ findings, tier: 'town' });

      expect(report.tier).toBe('town');
      expect(report.filtered).toBe(false);
      expect(report.findings.length).toBe(1);
    });

    it('surfaces findings for Stranger tier (filtered=false)', () => {
      const findings = [makeFinding()];
      const report = generateHygieneReport({ findings, tier: 'stranger' });

      expect(report.tier).toBe('stranger');
      expect(report.filtered).toBe(false);
      expect(report.findings.length).toBe(1);
    });
  });

  // ── Empty findings ──────────────────────────────────────────────

  describe('empty findings', () => {
    it('produces clean report for any tier with no findings', () => {
      const tiers: FamiliarityTier[] = ['home', 'neighborhood', 'town', 'stranger'];

      for (const tier of tiers) {
        const report = generateHygieneReport({ findings: [], tier });
        expect(report.totalFindings).toBe(0);
        expect(report.findings).toEqual([]);
        expect(report.overallRisk).toBe('clean');
      }
    });
  });

  // ── Importance mapping ──────────────────────────────────────────

  describe('importance mapping', () => {
    it('maps critical severity to critical importance', () => {
      const report = generateHygieneReport({
        findings: [makeFinding({ severity: 'critical' })],
        tier: 'stranger',
      });
      expect(report.findings[0].importance).toBe('critical');
    });

    it('maps high severity to warning importance', () => {
      const report = generateHygieneReport({
        findings: [makeFinding({ severity: 'high' })],
        tier: 'stranger',
      });
      expect(report.findings[0].importance).toBe('warning');
    });

    it('maps medium severity to notice importance', () => {
      const report = generateHygieneReport({
        findings: [makeFinding({ severity: 'medium' })],
        tier: 'stranger',
      });
      expect(report.findings[0].importance).toBe('notice');
    });

    it('maps low severity to info importance', () => {
      const report = generateHygieneReport({
        findings: [makeFinding({ severity: 'low' })],
        tier: 'stranger',
      });
      expect(report.findings[0].importance).toBe('info');
    });

    it('maps info severity to info importance', () => {
      const report = generateHygieneReport({
        findings: [makeFinding({ severity: 'info' })],
        tier: 'stranger',
      });
      expect(report.findings[0].importance).toBe('info');
    });
  });

  // ── Critical patterns ───────────────────────────────────────────

  describe('critical patterns', () => {
    const criticalIds = [
      'yaml-code-execution',
      'path-traversal',
      'ignore-previous',
      'system-prompt-override',
      'chat-template-delimiters',
    ];

    for (const id of criticalIds) {
      it(`marks ${id} as isCritical=true`, () => {
        const report = generateHygieneReport({
          findings: [makeFinding({ patternId: id })],
          tier: 'stranger',
        });
        expect(report.findings[0].isCritical).toBe(true);
      });
    }

    it('marks non-critical patterns as isCritical=false', () => {
      const nonCriticalIds = [
        'env-var-exposure',
        'suspicious-base64',
        'role-reassignment',
        'zero-width-characters',
        'rtl-override',
        'yaml-merge-key-bomb',
      ];

      for (const id of nonCriticalIds) {
        const report = generateHygieneReport({
          findings: [makeFinding({ patternId: id })],
          tier: 'stranger',
        });
        expect(report.findings[0].isCritical).toBe(false);
      }
    });
  });

  // ── Report finding fields ───────────────────────────────────────

  describe('report finding fields', () => {
    it('sets source to pattern for pattern scan findings', () => {
      const report = generateHygieneReport({
        findings: [makeFinding()],
        tier: 'town',
      });
      expect(report.findings[0].source).toBe('pattern');
    });

    it('includes line number when available', () => {
      const report = generateHygieneReport({
        findings: [makeFinding({ line: 42 })],
        tier: 'town',
      });
      expect(report.findings[0].line).toBe(42);
    });

    it('includes match text when available', () => {
      const report = generateHygieneReport({
        findings: [makeFinding({ match: 'ignore previous instructions' })],
        tier: 'town',
      });
      expect(report.findings[0].match).toBe('ignore previous instructions');
    });

    it('generates a title from the finding message', () => {
      const report = generateHygieneReport({
        findings: [makeFinding({ message: 'Found prompt injection at line 5' })],
        tier: 'town',
      });
      expect(report.findings[0].title).toBe('Found prompt injection at line 5');
    });

    it('generates a description with context', () => {
      const report = generateHygieneReport({
        findings: [makeFinding({ patternId: 'ignore-previous', message: 'Found injection' })],
        tier: 'town',
      });
      expect(report.findings[0].description).toBeTruthy();
      expect(typeof report.findings[0].description).toBe('string');
    });

    it('generates a suggestion based on category', () => {
      const embeddedReport = generateHygieneReport({
        findings: [makeFinding({ category: 'embedded-instructions' })],
        tier: 'town',
      });
      expect(embeddedReport.findings[0].suggestion).toContain('prompt injection');

      const hiddenReport = generateHygieneReport({
        findings: [makeFinding({ category: 'hidden-content' })],
        tier: 'town',
      });
      expect(hiddenReport.findings[0].suggestion).toContain('obfuscated');

      const configReport = generateHygieneReport({
        findings: [makeFinding({ category: 'config-safety' })],
        tier: 'town',
      });
      expect(configReport.findings[0].suggestion).toContain('configuration');
    });
  });

  // ── Coherence findings ──────────────────────────────────────────

  describe('coherence findings', () => {
    it('includes coherence findings when provided', () => {
      const coherence = makeCoherenceResult();
      const report = generateHygieneReport({
        findings: [],
        coherence,
        tier: 'stranger',
      });

      expect(report.findings.length).toBe(1);
      expect(report.findings[0].source).toBe('coherence');
      expect(report.findings[0].id).toBe('Bash');
    });

    it('sets isCritical=false for coherence findings', () => {
      const coherence = makeCoherenceResult();
      const report = generateHygieneReport({
        findings: [],
        coherence,
        tier: 'stranger',
      });

      expect(report.findings[0].isCritical).toBe(false);
    });

    it('counts coherence findings in totalFindings', () => {
      const coherence = makeCoherenceResult();
      const report = generateHygieneReport({
        findings: [makeFinding()],
        coherence,
        tier: 'stranger',
      });

      expect(report.totalFindings).toBe(2);
    });

    it('filters coherence findings for Home/Neighborhood tiers', () => {
      const coherence = makeCoherenceResult();
      const report = generateHygieneReport({
        findings: [],
        coherence,
        tier: 'home',
      });

      expect(report.totalFindings).toBe(1);
      expect(report.findings).toEqual([]);
      expect(report.filtered).toBe(true);
    });

    it('skips coherence findings when coherence is undefined', () => {
      const report = generateHygieneReport({
        findings: [makeFinding()],
        tier: 'town',
      });

      expect(report.findings.length).toBe(1);
      expect(report.findings[0].source).toBe('pattern');
    });

    it('skips coherence findings when coherence has empty findings', () => {
      const coherence: CoherenceResult = {
        isCoherent: true,
        findings: [],
        riskLevel: 'info',
      };
      const report = generateHygieneReport({
        findings: [],
        coherence,
        tier: 'stranger',
      });

      expect(report.findings).toEqual([]);
      expect(report.totalFindings).toBe(0);
    });
  });

  // ── Summary counts ──────────────────────────────────────────────

  describe('summary counts', () => {
    it('computes correct counts by importance level', () => {
      const findings: HygieneFinding[] = [
        makeFinding({ severity: 'critical', patternId: 'a' }),
        makeFinding({ severity: 'high', patternId: 'b' }),
        makeFinding({ severity: 'high', patternId: 'c' }),
        makeFinding({ severity: 'medium', patternId: 'd' }),
        makeFinding({ severity: 'low', patternId: 'e' }),
      ];
      const report = generateHygieneReport({ findings, tier: 'stranger' });

      expect(report.summary.critical).toBe(1);
      expect(report.summary.warning).toBe(2);
      expect(report.summary.notice).toBe(1);
      expect(report.summary.info).toBe(1);
    });

    it('zeroes out counts for filtered tiers', () => {
      const findings = [
        makeFinding({ severity: 'critical' }),
        makeFinding({ severity: 'high', patternId: 'b' }),
      ];
      const report = generateHygieneReport({ findings, tier: 'home' });

      expect(report.summary.critical).toBe(0);
      expect(report.summary.warning).toBe(0);
      expect(report.summary.notice).toBe(0);
      expect(report.summary.info).toBe(0);
    });
  });

  // ── Overall risk ────────────────────────────────────────────────

  describe('overallRisk', () => {
    it('returns clean when no findings surfaced', () => {
      const report = generateHygieneReport({ findings: [], tier: 'stranger' });
      expect(report.overallRisk).toBe('clean');
    });

    it('returns clean for filtered tiers even with findings', () => {
      const report = generateHygieneReport({
        findings: [makeFinding({ severity: 'critical' })],
        tier: 'home',
      });
      expect(report.overallRisk).toBe('clean');
    });

    it('reflects highest importance among surfaced findings', () => {
      const findings: HygieneFinding[] = [
        makeFinding({ severity: 'medium', patternId: 'a' }),
        makeFinding({ severity: 'critical', patternId: 'b' }),
        makeFinding({ severity: 'low', patternId: 'c' }),
      ];
      const report = generateHygieneReport({ findings, tier: 'stranger' });
      expect(report.overallRisk).toBe('critical');
    });

    it('returns warning when highest is high severity', () => {
      const findings: HygieneFinding[] = [
        makeFinding({ severity: 'high', patternId: 'a' }),
        makeFinding({ severity: 'low', patternId: 'b' }),
      ];
      const report = generateHygieneReport({ findings, tier: 'town' });
      expect(report.overallRisk).toBe('warning');
    });
  });

  // ── Timestamp ───────────────────────────────────────────────────

  describe('generatedAt', () => {
    it('is a valid ISO 8601 timestamp', () => {
      const report = generateHygieneReport({ findings: [], tier: 'stranger' });
      const parsed = new Date(report.generatedAt);
      expect(parsed.toISOString()).toBe(report.generatedAt);
    });
  });
});
