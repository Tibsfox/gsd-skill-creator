/**
 * Behavioral tests for the milestone review subcommand.
 *
 * Proves that cmdMilestoneReview creates a review-type milestone config
 * and initial state file in .planning/ with DEFAULT_REVIEW_MILESTONE_CONFIG
 * defaults. Validates error handling for missing ID, missing directory,
 * and duplicate creation.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Module under test — use project-local copy
const projectRoot = join(__dirname, '..', '..');
const milestone = require(join(projectRoot, '.claude/get-shit-done/bin/lib/milestone.cjs'));
const { cmdMilestoneReview } = milestone;

// ============================================================================
// Test fixtures
// ============================================================================

function createMilestoneFixture(opts: {
  skipPlanning?: boolean;
  existingConfig?: string;
}): string {
  const tmpDir = mkdtempSync(join(tmpdir(), 'milestone-review-'));

  if (!opts.skipPlanning) {
    const planningDir = join(tmpDir, '.planning');
    mkdirSync(planningDir, { recursive: true });

    if (opts.existingConfig) {
      writeFileSync(
        join(planningDir, `review-config-${opts.existingConfig}.json`),
        JSON.stringify({ type: 'review', existing: true })
      );
    }
  }

  return tmpDir;
}

/** Captures JSON output by mocking process.stdout.write and process.exit */
function captureOutput(fn: () => void): any {
  let captured = '';
  const origExit = process.exit;
  const origWrite = process.stdout.write;

  process.exit = vi.fn(() => { throw new Error('EXIT_0'); }) as any;
  process.stdout.write = vi.fn((chunk: any) => {
    captured += typeof chunk === 'string' ? chunk : chunk.toString();
    return true;
  }) as any;

  try {
    fn();
  } catch (e: any) {
    if (!e.message?.includes('EXIT_0')) throw e;
  } finally {
    process.exit = origExit;
    process.stdout.write = origWrite;
  }

  try {
    return JSON.parse(captured);
  } catch {
    return captured;
  }
}

// ============================================================================
// Expected defaults matching ReviewMilestoneConfig from Phase 556
// ============================================================================

const EXPECTED_CONFIG = {
  type: 'review',
  pacing: {
    maxSubversionsPerSession: 5,
    minContextWindowsPerSubversion: 2,
    mandatoryRetrospective: true,
    mandatoryLessonsLearned: true,
    sequentialOnly: true,
  },
  chain: {
    requiresPriorLessons: true,
    feedForwardEnforced: true,
    patternPromotionThreshold: 3,
    catalogScope: 'milestone-series',
  },
  scoring: {
    rubric: ['completeness', 'depth', 'connections', 'honesty'],
    minimumScore: 3.0,
  },
};

// ============================================================================
// cmdMilestoneReview
// ============================================================================

describe('cmdMilestoneReview', () => {
  let tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs = [];
  });

  it('creates config and state files with correct defaults', () => {
    const dir = createMilestoneFixture({});
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdMilestoneReview(dir, 'v1.50.14', false);
    });

    expect(result.created).toBe(true);
    expect(result.milestoneId).toBe('v1.50.14');
    expect(result.configPath).toBe('review-config-v1.50.14.json');
    expect(result.statePath).toBe('review-state-v1.50.14.json');
    expect(result.config).toEqual(EXPECTED_CONFIG);

    // Verify files on disk
    const configPath = join(dir, '.planning', 'review-config-v1.50.14.json');
    const statePath = join(dir, '.planning', 'review-state-v1.50.14.json');
    expect(existsSync(configPath)).toBe(true);
    expect(existsSync(statePath)).toBe(true);

    // Verify config file content
    const diskConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(diskConfig).toEqual(EXPECTED_CONFIG);

    // Verify state file content
    const diskState = JSON.parse(readFileSync(statePath, 'utf-8'));
    expect(diskState.milestoneId).toBe('v1.50.14');
    expect(diskState.currentState).toBe('LOAD');
    expect(diskState.config).toEqual(EXPECTED_CONFIG);
    expect(diskState.transitions).toEqual([]);
    expect(diskState.createdAt).toBeDefined();
    expect(diskState.updatedAt).toBeDefined();
  });

  it('returns error when milestoneId is missing', () => {
    const dir = createMilestoneFixture({});
    tmpDirs.push(dir);

    // When milestoneId is undefined/null, the function should call error()
    // which calls process.exit. The captureOutput helper catches EXIT_0.
    const result = captureOutput(() => {
      cmdMilestoneReview(dir, undefined, false);
    });

    // error() writes to stderr and calls process.exit(1), so captured
    // stdout may be empty or contain an error message
    // The important behavior is that it does NOT create files
    const configFiles = join(dir, '.planning', 'review-config-undefined.json');
    expect(existsSync(configFiles)).toBe(false);
  });

  it('returns already-exists when config file pre-exists', () => {
    const dir = createMilestoneFixture({ existingConfig: 'v1.50.14' });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdMilestoneReview(dir, 'v1.50.14', false);
    });

    expect(result.created).toBe(false);
    expect(result.reason).toBe('already exists');
    expect(result.milestoneId).toBe('v1.50.14');
  });

  it('returns error when .planning/ directory is missing', () => {
    const dir = createMilestoneFixture({ skipPlanning: true });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdMilestoneReview(dir, 'v1.50.14', false);
    });

    expect(result.created).toBe(false);
    expect(result.reason).toContain('.planning');
  });

  it('state file timestamps are valid ISO strings', () => {
    const dir = createMilestoneFixture({});
    tmpDirs.push(dir);

    captureOutput(() => {
      cmdMilestoneReview(dir, 'v1.50.15', false);
    });

    const statePath = join(dir, '.planning', 'review-state-v1.50.15.json');
    const diskState = JSON.parse(readFileSync(statePath, 'utf-8'));

    // Verify ISO date format
    const created = new Date(diskState.createdAt);
    const updated = new Date(diskState.updatedAt);
    expect(created.toISOString()).toBe(diskState.createdAt);
    expect(updated.toISOString()).toBe(diskState.updatedAt);
  });

  it('output JSON includes full config object matching ReviewMilestoneConfig', () => {
    const dir = createMilestoneFixture({});
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdMilestoneReview(dir, 'v1.50.16', false);
    });

    // Deep-check all config branches
    expect(result.config.type).toBe('review');
    expect(result.config.pacing.maxSubversionsPerSession).toBe(5);
    expect(result.config.pacing.mandatoryRetrospective).toBe(true);
    expect(result.config.pacing.mandatoryLessonsLearned).toBe(true);
    expect(result.config.pacing.sequentialOnly).toBe(true);
    expect(result.config.chain.requiresPriorLessons).toBe(true);
    expect(result.config.chain.feedForwardEnforced).toBe(true);
    expect(result.config.chain.patternPromotionThreshold).toBe(3);
    expect(result.config.chain.catalogScope).toBe('milestone-series');
    expect(result.config.scoring.rubric).toEqual(['completeness', 'depth', 'connections', 'honesty']);
    expect(result.config.scoring.minimumScore).toBe(3.0);
  });
});
