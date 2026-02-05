/**
 * Tests for ConflictFormatter.
 *
 * Tests all three output formats: text, quiet, and JSON.
 */

import { describe, it, expect } from 'vitest';
import { ConflictFormatter } from './conflict-formatter.js';
import type { ConflictPair, ConflictResult } from '../types/conflicts.js';

// Strip ANSI codes for easier string assertions
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// Helper to create a conflict pair
function createConflictPair(
  overrides: Partial<ConflictPair> = {}
): ConflictPair {
  return {
    skillA: 'skill-a',
    skillB: 'skill-b',
    similarity: 0.88,
    severity: 'medium',
    overlappingTerms: ['api', 'endpoint'],
    descriptionA: 'Description of skill A',
    descriptionB: 'Description of skill B',
    ...overrides,
  };
}

// Helper to create a conflict result
function createConflictResult(
  overrides: Partial<ConflictResult> = {}
): ConflictResult {
  return {
    conflicts: [],
    skillCount: 5,
    pairsAnalyzed: 10,
    threshold: 0.85,
    analysisMethod: 'model',
    ...overrides,
  };
}

describe('ConflictFormatter', () => {
  const formatter = new ConflictFormatter();

  describe('formatText', () => {
    it('shows confirmation when no conflicts detected', () => {
      const result = createConflictResult({ skillCount: 7 });

      const output = stripAnsi(formatter.formatText(result));

      expect(output).toBe('No conflicts detected among 7 skills');
    });

    it('groups high severity conflicts under HIGH CONFLICT header', () => {
      const result = createConflictResult({
        conflicts: [
          createConflictPair({
            skillA: 'auth-manager',
            skillB: 'login-handler',
            similarity: 0.92,
            severity: 'high',
          }),
        ],
      });

      const output = stripAnsi(formatter.formatText(result));

      expect(output).toContain('HIGH CONFLICT');
      expect(output).toContain('auth-manager');
      expect(output).toContain('login-handler');
      expect(output).toContain('92%');
    });

    it('groups medium severity conflicts under MEDIUM CONFLICT header', () => {
      const result = createConflictResult({
        conflicts: [
          createConflictPair({
            skillA: 'api-helper',
            skillB: 'rest-client',
            similarity: 0.87,
            severity: 'medium',
          }),
        ],
      });

      const output = stripAnsi(formatter.formatText(result));

      expect(output).toContain('MEDIUM CONFLICT');
      expect(output).toContain('api-helper');
      expect(output).toContain('rest-client');
      expect(output).toContain('87%');
    });

    it('shows HIGH section before MEDIUM section with mixed severities', () => {
      const result = createConflictResult({
        conflicts: [
          createConflictPair({
            skillA: 'medium-a',
            skillB: 'medium-b',
            severity: 'medium',
          }),
          createConflictPair({
            skillA: 'high-a',
            skillB: 'high-b',
            severity: 'high',
          }),
        ],
      });

      const output = stripAnsi(formatter.formatText(result));

      const highIndex = output.indexOf('HIGH CONFLICT');
      const mediumIndex = output.indexOf('MEDIUM CONFLICT');

      expect(highIndex).toBeLessThan(mediumIndex);
    });

    it('does NOT show threshold when default value (0.85)', () => {
      const result = createConflictResult({
        conflicts: [createConflictPair()],
        threshold: 0.85,
      });

      const output = stripAnsi(formatter.formatText(result));

      expect(output).not.toContain('Threshold:');
    });

    it('shows threshold when showThreshold option is true', () => {
      const result = createConflictResult({
        conflicts: [createConflictPair()],
        threshold: 0.9,
      });

      const output = stripAnsi(
        formatter.formatText(result, { showThreshold: true })
      );

      expect(output).toContain('Threshold: 0.9');
    });

    it('truncates long descriptions at 80 chars with ...', () => {
      const longDescription =
        'This is a very long description that exceeds eighty characters and should be truncated with ellipsis';
      const result = createConflictResult({
        conflicts: [createConflictPair({ descriptionA: longDescription })],
      });

      const output = stripAnsi(formatter.formatText(result));
      const lines = output.split('\n');

      // Find the line with description A
      const descLineA = lines.find((l) => l.includes('A:'));
      expect(descLineA).toBeDefined();
      expect(descLineA!.length).toBeLessThanOrEqual(100); // "  A: " + 80 chars + some slack
      expect(descLineA).toContain('...');
    });

    it('shows analysis method at bottom', () => {
      const resultModel = createConflictResult({
        conflicts: [createConflictPair()],
        analysisMethod: 'model',
      });

      const resultHeuristic = createConflictResult({
        conflicts: [createConflictPair()],
        analysisMethod: 'heuristic',
      });

      const outputModel = stripAnsi(formatter.formatText(resultModel));
      const outputHeuristic = stripAnsi(formatter.formatText(resultHeuristic));

      expect(outputModel).toContain('Analysis: model');
      expect(outputHeuristic).toContain('Analysis: heuristic (fallback)');
    });

    it('shows overlapping terms when present', () => {
      const result = createConflictResult({
        conflicts: [
          createConflictPair({
            overlappingTerms: ['api', 'endpoint', 'validation'],
          }),
        ],
      });

      const output = stripAnsi(formatter.formatText(result));

      expect(output).toContain('Common terms: api, endpoint, validation');
    });
  });

  describe('formatQuiet', () => {
    it('returns CSV-like format for each conflict', () => {
      const result = createConflictResult({
        conflicts: [
          createConflictPair({
            skillA: 'skill-a',
            skillB: 'skill-b',
            similarity: 0.92,
            severity: 'high',
          }),
        ],
      });

      const output = formatter.formatQuiet(result);

      expect(output).toBe('skill-a,skill-b,0.92,high');
    });

    it('returns one line per conflict', () => {
      const result = createConflictResult({
        conflicts: [
          createConflictPair({
            skillA: 'skill-a',
            skillB: 'skill-b',
            similarity: 0.92,
            severity: 'high',
          }),
          createConflictPair({
            skillA: 'skill-c',
            skillB: 'skill-d',
            similarity: 0.87,
            severity: 'medium',
          }),
        ],
      });

      const output = formatter.formatQuiet(result);
      const lines = output.split('\n');

      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('skill-a,skill-b,0.92,high');
      expect(lines[1]).toBe('skill-c,skill-d,0.87,medium');
    });

    it('returns empty string for no conflicts', () => {
      const result = createConflictResult({ conflicts: [] });

      const output = formatter.formatQuiet(result);

      expect(output).toBe('');
    });

    it('has no headers or extra text', () => {
      const result = createConflictResult({
        conflicts: [createConflictPair()],
      });

      const output = formatter.formatQuiet(result);

      expect(output).not.toContain('HIGH');
      expect(output).not.toContain('MEDIUM');
      expect(output).not.toContain('CONFLICT');
      expect(output).not.toContain('Similarity');
      expect(output).not.toContain('Analysis');
    });
  });

  describe('formatJson', () => {
    it('returns valid JSON', () => {
      const result = createConflictResult({
        conflicts: [createConflictPair()],
      });

      const output = formatter.formatJson(result);
      const parsed = JSON.parse(output);

      expect(parsed).toBeDefined();
      expect(parsed.conflicts).toBeInstanceOf(Array);
    });

    it('contains all ConflictResult fields', () => {
      const result = createConflictResult({
        conflicts: [createConflictPair()],
        skillCount: 10,
        pairsAnalyzed: 45,
        threshold: 0.9,
        analysisMethod: 'heuristic',
      });

      const output = formatter.formatJson(result);
      const parsed = JSON.parse(output);

      expect(parsed.skillCount).toBe(10);
      expect(parsed.pairsAnalyzed).toBe(45);
      expect(parsed.threshold).toBe(0.9);
      expect(parsed.analysisMethod).toBe('heuristic');
      expect(parsed.conflicts).toHaveLength(1);
      expect(parsed.conflicts[0].skillA).toBe('skill-a');
    });

    it('is pretty-printed with newlines', () => {
      const result = createConflictResult({
        conflicts: [createConflictPair()],
      });

      const output = formatter.formatJson(result);

      expect(output).toContain('\n');
      expect(output).toMatch(/^\{\n/); // Starts with {\n
      expect(output).toMatch(/\n\}$/); // Ends with \n}
    });
  });
});
