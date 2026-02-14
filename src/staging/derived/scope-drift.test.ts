/**
 * Tests for scope drift detector.
 *
 * Validates that skill scope extraction, observed scope aggregation,
 * and drift detection work correctly to identify when skills have
 * been generalized beyond what observations support.
 *
 * @module staging/derived/scope-drift.test
 */

import { describe, it, expect } from 'vitest';
import {
  extractSkillScope,
  extractObservedScope,
  detectScopeDrift,
} from './scope-drift.js';
import type { SessionScopeData } from './scope-drift.js';
import type { ScopeDriftFinding } from './types.js';

describe('extractSkillScope', () => {
  it('extracts scope from description keywords', () => {
    const result = extractSkillScope(
      'Workflow for running Docker and Kubernetes commands',
      [],
      [],
      [],
    );
    expect(result).toContain('docker');
    expect(result).toContain('kubernetes');
    // Common words should be filtered out
    expect(result).not.toContain('workflow');
    expect(result).not.toContain('for');
    expect(result).not.toContain('running');
    expect(result).not.toContain('commands');
    expect(result).not.toContain('and');
  });

  it('extracts scope from trigger intents', () => {
    const result = extractSkillScope(
      '',
      ['running prisma migrate', 'database migration'],
      [],
      [],
    );
    expect(result).toContain('prisma');
    expect(result).toContain('migrate');
    expect(result).toContain('database');
    expect(result).toContain('migration');
  });

  it('extracts scope from trigger files', () => {
    const result = extractSkillScope(
      '',
      [],
      ['*.prisma', 'src/db/**'],
      [],
    );
    expect(result).toContain('prisma');
    expect(result).toContain('db');
  });

  it('extracts scope from body headings', () => {
    const result = extractSkillScope(
      '',
      [],
      [],
      ['Docker Setup', 'Kubernetes Config', 'Testing'],
    );
    expect(result).toContain('docker');
    expect(result).toContain('kubernetes');
    expect(result).toContain('testing');
    // Common heading words should be filtered out
    expect(result).not.toContain('setup');
    expect(result).not.toContain('config');
  });

  it('deduplicates scope items', () => {
    const result = extractSkillScope(
      'Docker container management',
      ['docker build'],
      [],
      [],
    );
    const dockerCount = result.filter(item => item === 'docker').length;
    expect(dockerCount).toBe(1);
  });
});

describe('extractObservedScope', () => {
  it('extracts observed scope from session data', () => {
    const sessions: SessionScopeData[] = [
      {
        topCommands: ['npm test', 'npx vitest'],
        topFiles: ['src/utils.ts', 'vitest.config.ts'],
        topTools: ['Bash', 'Read'],
      },
    ];
    const result = extractObservedScope(sessions);
    expect(result).toContain('npm');
    expect(result).toContain('test');
    expect(result).toContain('vitest');
    expect(result).toContain('utils');
    expect(result).toContain('bash');
    expect(result).toContain('read');
  });

  it('aggregates across multiple sessions', () => {
    const sessions: SessionScopeData[] = [
      {
        topCommands: ['docker build'],
        topFiles: [],
        topTools: [],
      },
      {
        topCommands: ['docker push'],
        topFiles: [],
        topTools: [],
      },
    ];
    const result = extractObservedScope(sessions);
    expect(result).toContain('docker');
    expect(result).toContain('build');
    expect(result).toContain('push');
  });
});

describe('detectScopeDrift', () => {
  it('returns empty array when skill scope matches observed scope', () => {
    const result = detectScopeDrift(
      ['docker', 'kubernetes'],
      ['docker', 'kubernetes', 'helm'],
    );
    expect(result).toEqual([]);
  });

  it('detects drift when skill scope exceeds observations', () => {
    const result = detectScopeDrift(
      ['docker', 'kubernetes', 'terraform', 'ansible'],
      ['docker', 'kubernetes'],
    );
    expect(result).toHaveLength(1);
    const finding = result[0] as ScopeDriftFinding;
    expect(finding.type).toBe('scope-drift');
    expect(finding.driftRatio).toBe(0.5);
    expect(finding.skillScope).toEqual(['docker', 'kubernetes', 'terraform', 'ansible']);
    expect(finding.observedScope).toEqual(['docker', 'kubernetes']);
  });

  it('severity is critical when drift ratio > 0.5', () => {
    // 4 items, 3 not observed => 0.75
    const result = detectScopeDrift(
      ['docker', 'kubernetes', 'terraform', 'ansible'],
      ['docker'],
    );
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('critical');
  });

  it('severity is warning when drift ratio 0.3-0.5', () => {
    // 10 items, 4 not observed => 0.4
    const result = detectScopeDrift(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
      ['a', 'b', 'c', 'd', 'e', 'f'],
    );
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('warning');
  });

  it('severity is info when drift ratio < 0.3', () => {
    // 10 items, 2 not observed => 0.2
    const result = detectScopeDrift(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    );
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('info');
  });

  it('narrow skill with broad observations returns no findings', () => {
    const result = detectScopeDrift(
      ['npm'],
      ['npm', 'node', 'vitest', 'eslint', 'typescript'],
    );
    expect(result).toEqual([]);
  });

  it('scope comparison is case-insensitive', () => {
    const result = detectScopeDrift(
      ['Docker'],
      ['docker'],
    );
    expect(result).toEqual([]);
  });
});
