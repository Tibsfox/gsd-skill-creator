/**
 * Behavioral tests for STATE.md frontmatter preservation.
 *
 * Proves that writeStateMd merges newly computed frontmatter values with
 * existing frontmatter instead of clobbering them. The core bug:
 * syncStateFrontmatter rebuilds ALL frontmatter from scratch via
 * buildStateFrontmatter. When the markdown body lacks fields like
 * Total Plans or when disk directories are empty, the rebuild produces
 * 0 for progress counters and loses milestone_name.
 *
 * The fix makes syncStateFrontmatter MERGE new values with existing
 * frontmatter, preserving fields the rebuild cannot derive.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ============================================================================
// Test fixtures
// ============================================================================

/** STATE.md with rich frontmatter and a minimal body */
const STATE_WITH_RICH_FRONTMATTER = `---
gsd_state_version: 1.0
milestone: v1.50.11
milestone_name: GSD Tooling Hardening
status: active
last_updated: "2026-03-02T10:00:00.000Z"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 2
  completed_plans: 2
---

# Project State

## Current Position

**Current Phase:** 541
**Current Phase Name:** cli-state-preservation
**Current Plan:** 1 of 2
**Status:** Executing
**Last Activity:** Working on frontmatter fix
`;

/** STATE.md body with only Status and Last Activity (no Total Plans, etc.) */
const STATE_MINIMAL_BODY = `---
gsd_state_version: 1.0
milestone: v1.50.11
milestone_name: GSD Tooling Hardening
status: active
last_updated: "2026-03-02T10:00:00.000Z"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 2
  completed_plans: 2
---

# Project State

## Current Position

**Status:** Executing
**Last Activity:** Working on frontmatter fix
`;

/** STATE.md with status about to change */
const STATE_STATUS_CHANGE = `---
gsd_state_version: 1.0
milestone: v1.50.11
milestone_name: GSD Tooling Hardening
status: active
last_updated: "2026-03-02T10:00:00.000Z"
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 8
  completed_plans: 8
---

# Project State

## Current Position

**Current Phase:** 541
**Status:** Phase complete
**Last Activity:** All plans done
`;

/** STATE.md with no frontmatter (fresh file) */
const STATE_NO_FRONTMATTER = `# Project State

## Current Position

**Current Phase:** 541
**Current Phase Name:** cli-state-preservation
**Current Plan:** 1 of 2
**Status:** Executing
**Last Activity:** Starting fresh
`;

/** Config with milestone info */
const CONFIG_JSON = JSON.stringify({
  milestone: { version: 'v1.50.11', name: 'GSD Tooling Hardening' },
}, null, 2);

// ============================================================================
// Test helpers
// ============================================================================

let tempDir: string;

function setupTempDir() {
  tempDir = mkdtempSync(join(tmpdir(), 'state-fm-'));
  mkdirSync(join(tempDir, '.planning', 'phases'), { recursive: true });
}

function writePlanning(filename: string, content: string) {
  writeFileSync(join(tempDir, '.planning', filename), content, 'utf-8');
}

function createPhaseDir(dirName: string, files?: Record<string, string>) {
  const dirPath = join(tempDir, '.planning', 'phases', dirName);
  mkdirSync(dirPath, { recursive: true });
  if (files) {
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(dirPath, name), content, 'utf-8');
    }
  }
}

function readStateFrontmatter(): Record<string, any> {
  const content = readFileSync(join(tempDir, '.planning', 'STATE.md'), 'utf-8');
  const { extractFrontmatter } = require('../../.claude/get-shit-done/bin/lib/frontmatter.cjs');
  return extractFrontmatter(content);
}

// ============================================================================
// Tests
// ============================================================================

describe('STATE.md frontmatter preservation', () => {
  beforeEach(() => {
    setupTempDir();
  });

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('preserves milestone_name when body has no milestone name field', () => {
    // Given: STATE.md with frontmatter containing milestone_name
    writePlanning('STATE.md', STATE_MINIMAL_BODY);
    writePlanning('config.json', CONFIG_JSON);

    // When: writeStateMd is called with the same content (only last_updated changes)
    const statePath = join(tempDir, '.planning', 'STATE.md');
    const content = readFileSync(statePath, 'utf-8');
    const { writeStateMd } = require('../../.claude/get-shit-done/bin/lib/state.cjs');
    writeStateMd(statePath, content, tempDir);

    // Then: milestone_name should still be present
    const fm = readStateFrontmatter();
    expect(fm.milestone_name).toBe('GSD Tooling Hardening');
  });

  it('preserves progress.completed_plans when disk has no phase dirs with plans', () => {
    // Given: STATE.md with completed_plans: 2, but empty phases/ directory
    writePlanning('STATE.md', STATE_MINIMAL_BODY);
    writePlanning('config.json', CONFIG_JSON);
    // Empty phases dir — no PLAN files on disk

    // When: writeStateMd is called
    const statePath = join(tempDir, '.planning', 'STATE.md');
    const content = readFileSync(statePath, 'utf-8');
    const { writeStateMd } = require('../../.claude/get-shit-done/bin/lib/state.cjs');
    writeStateMd(statePath, content, tempDir);

    // Then: completed_plans should still be 2 (not reset to 0)
    const fm = readStateFrontmatter();
    expect(fm.progress).toBeDefined();
    expect(Number(fm.progress.completed_plans)).toBe(2);
  });

  it('preserves progress.total_plans from existing frontmatter when disk is empty', () => {
    // Given: STATE.md with total_plans: 2, but empty phases/ directory
    writePlanning('STATE.md', STATE_MINIMAL_BODY);
    writePlanning('config.json', CONFIG_JSON);

    // When: writeStateMd is called
    const statePath = join(tempDir, '.planning', 'STATE.md');
    const content = readFileSync(statePath, 'utf-8');
    const { writeStateMd } = require('../../.claude/get-shit-done/bin/lib/state.cjs');
    writeStateMd(statePath, content, tempDir);

    // Then: total_plans should still be 2 (not reset to 0)
    const fm = readStateFrontmatter();
    expect(fm.progress).toBeDefined();
    expect(Number(fm.progress.total_plans)).toBe(2);
  });

  it('honors buildStateFrontmatter-computed values when present', () => {
    // Given: STATE.md with status: "active" in frontmatter, but body says "Phase complete"
    writePlanning('STATE.md', STATE_STATUS_CHANGE);
    writePlanning('config.json', CONFIG_JSON);

    // When: writeStateMd is called
    const statePath = join(tempDir, '.planning', 'STATE.md');
    const content = readFileSync(statePath, 'utf-8');
    const { writeStateMd } = require('../../.claude/get-shit-done/bin/lib/state.cjs');
    writeStateMd(statePath, content, tempDir);

    // Then: status should reflect the body value ("completed"), not the old frontmatter ("active")
    const fm = readStateFrontmatter();
    expect(fm.status).toBe('completed');
  });

  it('works with fresh file that has no existing frontmatter', () => {
    // Given: STATE.md with no frontmatter block
    writePlanning('STATE.md', STATE_NO_FRONTMATTER);
    writePlanning('config.json', CONFIG_JSON);

    // When: writeStateMd is called
    const statePath = join(tempDir, '.planning', 'STATE.md');
    const content = readFileSync(statePath, 'utf-8');
    const { writeStateMd } = require('../../.claude/get-shit-done/bin/lib/state.cjs');
    writeStateMd(statePath, content, tempDir);

    // Then: frontmatter is generated from scratch with gsd_state_version
    const fm = readStateFrontmatter();
    expect(fm.gsd_state_version).toBe('1.0');
    expect(fm.status).toBe('executing');
  });

  it('preserves all progress counters when only last_updated changes', () => {
    // Given: STATE.md with rich progress counters
    writePlanning('STATE.md', STATE_WITH_RICH_FRONTMATTER);
    writePlanning('config.json', CONFIG_JSON);

    // Create a phase dir with 2 plans and 2 summaries (matching frontmatter)
    createPhaseDir('541-cli-state-preservation', {
      '541-01-PLAN.md': '---\nphase: 541\nplan: 01\n---\n# Plan',
      '541-02-PLAN.md': '---\nphase: 541\nplan: 02\n---\n# Plan',
      '541-01-SUMMARY.md': '---\nphase: 541\nplan: 01\n---\n# Summary',
      '541-02-SUMMARY.md': '---\nphase: 541\nplan: 02\n---\n# Summary',
    });

    // When: writeStateMd is called (simulating a write that only touches last_updated)
    const statePath = join(tempDir, '.planning', 'STATE.md');
    const content = readFileSync(statePath, 'utf-8');
    const { writeStateMd } = require('../../.claude/get-shit-done/bin/lib/state.cjs');
    writeStateMd(statePath, content, tempDir);

    // Then: all progress values should be preserved (total_phases may change from disk)
    const fm = readStateFrontmatter();
    expect(fm.progress).toBeDefined();
    // completed_plans should be at least 2 (from disk scan or preserved)
    expect(Number(fm.progress.completed_plans)).toBeGreaterThanOrEqual(2);
    // total_plans should be at least 2 (from disk scan or preserved)
    expect(Number(fm.progress.total_plans)).toBeGreaterThanOrEqual(2);
    // completed_phases should be preserved (1 from frontmatter, or accurate from disk)
    expect(Number(fm.progress.completed_phases)).toBeGreaterThanOrEqual(1);
  });
});
