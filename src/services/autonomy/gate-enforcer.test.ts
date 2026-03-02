/**
 * Tests for gate enforcement engine.
 *
 * Covers:
 * - checkArtifact: missing file, below size threshold, missing required content,
 *   passing all checks, optional content checks
 * - enforceGates: collects all results, blocking vs non-blocking,
 *   path pattern expansion, applies_when filtering, empty gates
 */

import { describe, it, expect, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkArtifact, enforceGates, expandPathPattern } from './gate-enforcer.js';
import type { GateDefinition, GateType } from './types.js';
import type { GateConfig } from './schema-validation.js';

// ============================================================================
// Test fixtures
// ============================================================================

let tempDir: string;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

function createTempDir(): string {
  tempDir = join(tmpdir(), `gate-enforcer-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return tempDir;
}

function makeDefinition(overrides: Partial<GateDefinition> = {}): GateDefinition {
  return {
    name: 'test-gate',
    description: 'Test gate definition',
    path_pattern: 'test.md',
    min_size_bytes: 10,
    blocking: true,
    content_checks: [],
    ...overrides,
  };
}

function makeConfig(gateType: GateType, gates: GateDefinition[]): GateConfig {
  return {
    version: '1.0',
    milestone: 'v1.53',
    milestone_type: 'implementation',
    gates: {
      per_subversion: gateType === 'per_subversion' ? gates : [],
      checkpoint: gateType === 'checkpoint' ? gates : [],
      half_transition: gateType === 'half_transition' ? gates : [],
      graduation: gateType === 'graduation' ? gates : [],
      summary: gateType === 'summary' ? gates : [],
    },
  };
}

// ============================================================================
// expandPathPattern tests
// ============================================================================

describe('expandPathPattern', () => {
  it('should expand known placeholders', () => {
    const result = expandPathPattern('{milestone}/notes/{subversion}.md', {
      milestone: 'v1.53',
      subversion: '05',
    });
    expect(result).toBe('v1.53/notes/05.md');
  });

  it('should leave unknown placeholders as-is', () => {
    const result = expandPathPattern('{milestone}/{unknown}.md', {
      milestone: 'v1.53',
    });
    expect(result).toBe('v1.53/{unknown}.md');
  });

  it('should handle empty context', () => {
    const result = expandPathPattern('{milestone}.md', {});
    expect(result).toBe('{milestone}.md');
  });
});

// ============================================================================
// checkArtifact tests
// ============================================================================

describe('checkArtifact', () => {
  it('should return failure for missing file with specific error message', async () => {
    const dir = createTempDir();
    await mkdir(dir, { recursive: true });
    const def = makeDefinition({ path_pattern: 'nonexistent.md' });

    const result = await checkArtifact(def, dir);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('Missing artifact');
    expect(result.message).toContain('nonexistent.md');
    expect(result.details).toBeDefined();
    expect(result.details![0]).toContain('File not found');
  });

  it('should return failure for file below size threshold', async () => {
    const dir = createTempDir();
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'small.md'), 'hi', 'utf-8');
    const def = makeDefinition({
      path_pattern: 'small.md',
      min_size_bytes: 100,
    });

    const result = await checkArtifact(def, dir);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('too small');
    expect(result.details).toBeDefined();
    expect(result.details![0]).toMatch(/Size \d+ bytes < minimum 100 bytes/);
  });

  it('should return failure for file missing required content section', async () => {
    const dir = createTempDir();
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'test.md'), 'Some content without a heading\nMore lines here to meet size', 'utf-8');
    const def = makeDefinition({
      path_pattern: 'test.md',
      min_size_bytes: 10,
      content_checks: [
        { pattern: '^# ', required: true, description: 'Must have a heading' },
      ],
    });

    const result = await checkArtifact(def, dir);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('missing required content');
    expect(result.details).toBeDefined();
    expect(result.details![0]).toContain('Required section missing: Must have a heading');
  });

  it('should return success for file passing all checks', async () => {
    const dir = createTempDir();
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, 'good.md'),
      '# My Heading\n\nSome substantial content here with findings and observations.\nMore content to meet size requirements.',
      'utf-8',
    );
    const def = makeDefinition({
      path_pattern: 'good.md',
      min_size_bytes: 10,
      content_checks: [
        { pattern: '^# ', required: true, description: 'Must have a heading' },
        { pattern: 'findings', required: true, description: 'Must have findings' },
      ],
    });

    const result = await checkArtifact(def, dir);

    expect(result.passed).toBe(true);
    expect(result.message).toContain('passed all checks');
  });

  it('should not fail on optional content check miss', async () => {
    const dir = createTempDir();
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'test.md'), '# Heading\nContent here', 'utf-8');
    const def = makeDefinition({
      path_pattern: 'test.md',
      min_size_bytes: 5,
      content_checks: [
        { pattern: '^# ', required: true, description: 'Must have heading' },
        { pattern: 'optional-thing', required: false, description: 'Nice to have' },
      ],
    });

    const result = await checkArtifact(def, dir);

    expect(result.passed).toBe(true);
  });

  it('should expand path pattern with context', async () => {
    const dir = createTempDir();
    await mkdir(join(dir, 'notes'), { recursive: true });
    await writeFile(join(dir, 'notes', '05.md'), '# Note 05\nContent here with enough text', 'utf-8');
    const def = makeDefinition({
      path_pattern: 'notes/{subversion}.md',
      min_size_bytes: 5,
    });

    const result = await checkArtifact(def, dir, { subversion: '05' });

    expect(result.passed).toBe(true);
    expect(result.checked_path).toContain('05.md');
  });
});

// ============================================================================
// enforceGates tests
// ============================================================================

describe('enforceGates', () => {
  it('should collect all results without short-circuiting', async () => {
    const dir = createTempDir();
    await mkdir(dir, { recursive: true });
    // Create one file that exists but is too small, and reference two missing files
    await writeFile(join(dir, 'small.md'), 'x', 'utf-8');

    const config = makeConfig('per_subversion', [
      makeDefinition({ name: 'gate-1', path_pattern: 'missing1.md' }),
      makeDefinition({ name: 'gate-2', path_pattern: 'missing2.md' }),
      makeDefinition({ name: 'gate-3', path_pattern: 'small.md', min_size_bytes: 100 }),
    ]);

    const result = await enforceGates(config, 'per_subversion', dir);

    expect(result.passed).toBe(false);
    expect(result.results).toHaveLength(3);
    expect(result.blocking_failures).toHaveLength(3);
  });

  it('should separate blocking failures from warnings', async () => {
    const dir = createTempDir();
    await mkdir(dir, { recursive: true });

    const config = makeConfig('per_subversion', [
      makeDefinition({ name: 'blocking-gate', path_pattern: 'missing.md', blocking: true }),
      makeDefinition({ name: 'warning-gate', path_pattern: 'also-missing.md', blocking: false }),
    ]);

    const result = await enforceGates(config, 'per_subversion', dir);

    expect(result.passed).toBe(false);
    expect(result.blocking_failures).toHaveLength(1);
    expect(result.blocking_failures[0].gate_name).toBe('blocking-gate');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].gate_name).toBe('warning-gate');
  });

  it('should pass when only non-blocking gates fail', async () => {
    const dir = createTempDir();
    await mkdir(dir, { recursive: true });

    const config = makeConfig('per_subversion', [
      makeDefinition({ name: 'advisory-gate', path_pattern: 'missing.md', blocking: false }),
    ]);

    const result = await enforceGates(config, 'per_subversion', dir);

    expect(result.passed).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.blocking_failures).toHaveLength(0);
  });

  it('should expand path patterns with context', async () => {
    const dir = createTempDir();
    await mkdir(join(dir, 'v1.53'), { recursive: true });
    await writeFile(join(dir, 'v1.53', 'note.md'), '# Note\nContent here sufficient', 'utf-8');

    const config = makeConfig('per_subversion', [
      makeDefinition({
        name: 'versioned-gate',
        path_pattern: '{milestone}/note.md',
        min_size_bytes: 5,
      }),
    ]);

    const result = await enforceGates(config, 'per_subversion', dir, { milestone: 'v1.53' });

    expect(result.passed).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].passed).toBe(true);
  });

  it('should skip gates when applies_when condition is not met', async () => {
    const dir = createTempDir();
    await mkdir(dir, { recursive: true });

    const config = makeConfig('per_subversion', [
      makeDefinition({
        name: 'conditional-gate',
        path_pattern: 'missing.md',
        applies_when: 'has_source_changes',
      }),
    ]);

    // No context key 'has_source_changes' provided → gate skipped
    const result = await enforceGates(config, 'per_subversion', dir, {});

    expect(result.passed).toBe(true);
    expect(result.results).toHaveLength(0);
  });

  it('should apply gates when applies_when condition IS met', async () => {
    const dir = createTempDir();
    await mkdir(dir, { recursive: true });

    const config = makeConfig('per_subversion', [
      makeDefinition({
        name: 'conditional-gate',
        path_pattern: 'missing.md',
        applies_when: 'has_source_changes',
      }),
    ]);

    const result = await enforceGates(config, 'per_subversion', dir, {
      has_source_changes: 'true',
    });

    expect(result.passed).toBe(false);
    expect(result.results).toHaveLength(1);
  });

  it('should return passed with empty results for empty gates array', async () => {
    const dir = createTempDir();
    await mkdir(dir, { recursive: true });

    const config = makeConfig('checkpoint', []);

    const result = await enforceGates(config, 'checkpoint', dir);

    expect(result.passed).toBe(true);
    expect(result.results).toHaveLength(0);
    expect(result.blocking_failures).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should set correct gate_type on results', async () => {
    const dir = createTempDir();
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'test.md'), '# Test\nContent for checkpoint gate', 'utf-8');

    const config = makeConfig('checkpoint', [
      makeDefinition({ name: 'cp-gate', path_pattern: 'test.md', min_size_bytes: 5 }),
    ]);

    const result = await enforceGates(config, 'checkpoint', dir);

    expect(result.results[0].gate_type).toBe('checkpoint');
  });
});

// ============================================================================
// Summary gate type tests (RC-11)
// ============================================================================

describe('summary gate type', () => {
  it('should pass when valid SUMMARY.md exists in phase directory', async () => {
    const dir = createTempDir();
    const phaseDir = join(dir, '.planning', 'phases', '508-rc-closure-foundation');
    await mkdir(phaseDir, { recursive: true });

    // Create a valid SUMMARY.md with required content
    const summaryContent = [
      '# Phase 508 Plan 01: Watchdog Summary',
      '',
      '## Completed Tasks',
      '',
      'Created the watchdog timer module with commit abc1234.',
      'Modified the autonomy engine to wire in the watchdog.',
      '',
      '## Accomplishments',
      '',
      'Task 1 completed successfully.',
    ].join('\n');
    await writeFile(join(phaseDir, '508-01-SUMMARY.md'), summaryContent, 'utf-8');

    const config = makeConfig('summary', [
      makeDefinition({
        name: 'summary-md',
        description: 'SUMMARY.md verification at phase completion (RC-11 fix)',
        path_pattern: '.planning/phases/{phase_dir}/508-01-SUMMARY.md',
        min_size_bytes: 100,
        blocking: true,
        content_checks: [
          { pattern: '^#\\s+', required: true, description: 'Must have at least one heading' },
          { pattern: '([Aa]ccomplishment|[Cc]ompleted|[Cc]reated|[Mm]odified)', required: true, description: 'Must describe accomplishments' },
          { pattern: '([Cc]ommit|[Tt]ask)', required: true, description: 'Must reference commits or tasks' },
        ],
      }),
    ]);

    const result = await enforceGates(config, 'summary', dir, {
      phase_dir: '508-rc-closure-foundation',
    });

    expect(result.passed).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].passed).toBe(true);
    expect(result.results[0].gate_type).toBe('summary');
  });

  it('should fail when SUMMARY.md is missing from phase directory', async () => {
    const dir = createTempDir();
    const phaseDir = join(dir, '.planning', 'phases', '508-rc-closure-foundation');
    await mkdir(phaseDir, { recursive: true });
    // No SUMMARY.md created

    const config = makeConfig('summary', [
      makeDefinition({
        name: 'summary-md',
        description: 'SUMMARY.md verification at phase completion (RC-11 fix)',
        path_pattern: '.planning/phases/{phase_dir}/508-01-SUMMARY.md',
        min_size_bytes: 500,
        blocking: true,
        content_checks: [
          { pattern: '^#\\s+', required: true },
          { pattern: '([Aa]ccomplishment|[Cc]ompleted|[Cc]reated|[Mm]odified)', required: true },
          { pattern: '([Cc]ommit|[Tt]ask)', required: true },
        ],
      }),
    ]);

    const result = await enforceGates(config, 'summary', dir, {
      phase_dir: '508-rc-closure-foundation',
    });

    expect(result.passed).toBe(false);
    expect(result.blocking_failures).toHaveLength(1);
    expect(result.blocking_failures[0].gate_name).toBe('summary-md');
    expect(result.blocking_failures[0].message).toContain('Missing artifact');
  });

  it('should fail when SUMMARY.md is too small (below 500 bytes)', async () => {
    const dir = createTempDir();
    const phaseDir = join(dir, '.planning', 'phases', '508-rc-closure-foundation');
    await mkdir(phaseDir, { recursive: true });

    // Create a tiny SUMMARY.md that is below the 500-byte threshold
    await writeFile(join(phaseDir, '508-01-SUMMARY.md'), '# Summary\nToo short.', 'utf-8');

    const config = makeConfig('summary', [
      makeDefinition({
        name: 'summary-md',
        description: 'SUMMARY.md verification at phase completion (RC-11 fix)',
        path_pattern: '.planning/phases/{phase_dir}/508-01-SUMMARY.md',
        min_size_bytes: 500,
        blocking: true,
        content_checks: [
          { pattern: '^#\\s+', required: true },
          { pattern: '([Aa]ccomplishment|[Cc]ompleted|[Cc]reated|[Mm]odified)', required: true },
          { pattern: '([Cc]ommit|[Tt]ask)', required: true },
        ],
      }),
    ]);

    const result = await enforceGates(config, 'summary', dir, {
      phase_dir: '508-rc-closure-foundation',
    });

    expect(result.passed).toBe(false);
    expect(result.blocking_failures).toHaveLength(1);
    expect(result.blocking_failures[0].message).toContain('too small');
  });
});
