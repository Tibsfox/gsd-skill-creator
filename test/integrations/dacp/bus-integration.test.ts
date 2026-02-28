/**
 * Phase 456 verification tests for DACP bus integration.
 * Tests: bundle transport, scanner detection, coexistence with .msg,
 * and companion pairing.
 *
 * @module test/dacp/bus-integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { scanPriorityDirWithBundles } from '../../../src/dacp/bus/scanner.js';
import { detectOrphans } from '../../../src/dacp/bus/cleanup.js';
import type { BusConfig } from '../../../src/den/types.js';

// ============================================================================
// Helpers
// ============================================================================

function createMsgFile(dir: string, name: string, content: string = 'test payload'): void {
  writeFileSync(join(dir, name), content, 'utf-8');
}

function createBundleDir(dir: string, name: string): void {
  const bundlePath = join(dir, name);
  mkdirSync(bundlePath, { recursive: true });
  writeFileSync(join(bundlePath, 'manifest.json'), '{}');
  writeFileSync(join(bundlePath, '.complete'), '');
}

// ============================================================================
// Setup
// ============================================================================

let busDir: string;
let config: BusConfig;

beforeEach(() => {
  busDir = join(tmpdir(), `dacp-bus-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(busDir, { recursive: true });
  for (let p = 0; p < 8; p++) {
    mkdirSync(join(busDir, `priority-${p}`), { recursive: true });
  }
  mkdirSync(join(busDir, 'acknowledged'), { recursive: true });

  config = {
    busDir,
    agentId: 'test-agent',
    role: 'executor',
    teamDir: busDir,
  } as BusConfig;
});

afterEach(() => {
  try {
    rmSync(busDir, { recursive: true, force: true });
  } catch {
    // Best effort cleanup
  }
});

// ============================================================================
// Tests
// ============================================================================

describe('Bus Integration', () => {
  it('scanner detects .msg files in priority directory', async () => {
    const priDir = join(busDir, 'priority-3');
    createMsgFile(priDir, '20260227-120000-EXEC-planner-executor.msg');

    const entries = await scanPriorityDirWithBundles(priDir, 3);
    expect(entries).toHaveLength(1);
    expect(entries[0].opcode).toBe('EXEC');
    expect(entries[0].source).toBe('planner');
    expect(entries[0].target).toBe('executor');
  });

  it('scanner pairs .msg with companion .bundle/ directory', async () => {
    const priDir = join(busDir, 'priority-3');
    const stem = '20260227-120000-EXEC-planner-executor';
    createMsgFile(priDir, `${stem}.msg`);
    createBundleDir(priDir, `${stem}.bundle`);

    const entries = await scanPriorityDirWithBundles(priDir, 3);
    expect(entries).toHaveLength(1);
    expect(entries[0].bundlePath).not.toBeNull();
    expect(entries[0].bundlePath).toContain('.bundle');
  });

  it('coexistence: .msg without .bundle companion has null bundlePath', async () => {
    const priDir = join(busDir, 'priority-3');
    createMsgFile(priDir, '20260227-120001-EXEC-planner-executor.msg');

    const entries = await scanPriorityDirWithBundles(priDir, 3);
    expect(entries).toHaveLength(1);
    expect(entries[0].bundlePath).toBeNull();
  });

  it('mixed messages: both .msg-only and .msg+.bundle detected', async () => {
    const priDir = join(busDir, 'priority-3');
    // Message 1: .msg only
    createMsgFile(priDir, '20260227-120000-EXEC-planner-executor.msg');
    // Message 2: .msg + .bundle
    const stem2 = '20260227-120001-VERIFY-planner-verifier';
    createMsgFile(priDir, `${stem2}.msg`);
    createBundleDir(priDir, `${stem2}.bundle`);

    const entries = await scanPriorityDirWithBundles(priDir, 3);
    expect(entries).toHaveLength(2);
    const withBundle = entries.find(e => e.bundlePath !== null);
    const withoutBundle = entries.find(e => e.bundlePath === null);
    expect(withBundle).toBeDefined();
    expect(withoutBundle).toBeDefined();
  });

  it('orphan detection finds .bundle/ without companion .msg', async () => {
    const priDir = join(busDir, 'priority-3');
    // Create orphaned bundle (no .msg companion)
    createBundleDir(priDir, '20260227-120000-EXEC-planner-executor.bundle');

    const orphans = await detectOrphans(config);
    expect(orphans).toHaveLength(1);
    expect(orphans[0].reason).toBe('no_companion_msg');
  });

  it('non-orphan: .bundle/ with .msg companion is not flagged', async () => {
    const priDir = join(busDir, 'priority-3');
    const stem = '20260227-120000-EXEC-planner-executor';
    createMsgFile(priDir, `${stem}.msg`);
    createBundleDir(priDir, `${stem}.bundle`);

    const orphans = await detectOrphans(config);
    expect(orphans).toHaveLength(0);
  });
});
