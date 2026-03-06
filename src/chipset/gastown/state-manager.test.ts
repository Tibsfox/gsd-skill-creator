/**
 * Tests for Gastown StateManager — beads persistence abstraction.
 *
 * Validates:
 * - Agent create/get/list/filter operations
 * - Work item create/get/status-update operations
 * - Hook assignment with single-work-item enforcement
 * - Convoy create/get/progress-calculation
 * - Atomic write pattern (temp file -> rename)
 * - JSON sorted-key output for git-friendly diffs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { StateManager } from './state-manager.js';

let stateDir: string;
let manager: StateManager;

beforeEach(async () => {
  stateDir = await mkdtemp(join(tmpdir(), 'gastown-state-'));
  manager = new StateManager({ stateDir });
});

afterEach(async () => {
  await rm(stateDir, { recursive: true, force: true });
});

// ============================================================================
// Agent Operations
// ============================================================================

describe('Agent operations', () => {
  it('creates and retrieves an agent', async () => {
    const agent = await manager.createAgent('polecat', 'test-rig');
    expect(agent.role).toBe('polecat');
    expect(agent.rig).toBe('test-rig');
    expect(agent.status).toBe('idle');
    expect(agent.id).toBeTruthy();
    expect(agent.hookId).toBeTruthy();

    const retrieved = await manager.getAgent(agent.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(agent.id);
    expect(retrieved!.role).toBe('polecat');
    expect(retrieved!.rig).toBe('test-rig');
  });

  it('returns null for non-existent agent', async () => {
    const result = await manager.getAgent('nonexistent-id');
    expect(result).toBeNull();
  });

  it('updates agent status atomically', async () => {
    const agent = await manager.createAgent('mayor', 'test-rig');
    expect(agent.status).toBe('idle');

    await manager.updateAgentStatus(agent.id, 'active');
    const updated = await manager.getAgent(agent.id);
    expect(updated!.status).toBe('active');
  });

  it('lists agents with role filter', async () => {
    await manager.createAgent('polecat', 'rig-a');
    await manager.createAgent('polecat', 'rig-b');
    await manager.createAgent('mayor', 'rig-a');
    await manager.createAgent('witness', 'rig-a');

    const allAgents = await manager.listAgents();
    expect(allAgents).toHaveLength(4);

    const polecats = await manager.listAgents({ role: 'polecat' });
    expect(polecats).toHaveLength(2);
    expect(polecats.every(a => a.role === 'polecat')).toBe(true);

    const rigA = await manager.listAgents({ rig: 'rig-a' });
    expect(rigA).toHaveLength(3);
    expect(rigA.every(a => a.rig === 'rig-a')).toBe(true);
  });
});

// ============================================================================
// Work Item Operations
// ============================================================================

describe('Work item operations', () => {
  it('creates and retrieves a work item', async () => {
    const item = await manager.createWorkItem('Fix auth', 'JWT expiry bug', 'P1');
    expect(item.title).toBe('Fix auth');
    expect(item.description).toBe('JWT expiry bug');
    expect(item.priority).toBe('P1');
    expect(item.status).toBe('open');
    expect(item.hookStatus).toBe('empty');
    expect(item.beadId).toBeTruthy();

    const retrieved = await manager.getWorkItem(item.beadId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.beadId).toBe(item.beadId);
    expect(retrieved!.title).toBe('Fix auth');
  });

  it('returns null for non-existent work item', async () => {
    const result = await manager.getWorkItem('bead-nonexistent');
    expect(result).toBeNull();
  });

  it('defaults priority to P2', async () => {
    const item = await manager.createWorkItem('Task', 'Description');
    expect(item.priority).toBe('P2');
  });

  it('updates work item status', async () => {
    const item = await manager.createWorkItem('Task', 'Description', 'P1');
    await manager.updateWorkStatus(item.beadId, 'in_progress');
    const updated = await manager.getWorkItem(item.beadId);
    expect(updated!.status).toBe('in_progress');
  });
});

// ============================================================================
// Hook Operations
// ============================================================================

describe('Hook operations', () => {
  it('sets and retrieves a hook', async () => {
    const agent = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('Task', 'Do work', 'P1');

    await manager.setHook(agent.id, item.beadId);
    const hook = await manager.getHook(agent.id);
    expect(hook).not.toBeNull();
    expect(hook!.agentId).toBe(agent.id);
    expect(hook!.status).toBe('active');
    expect(hook!.workItem).toBeDefined();
    expect(hook!.workItem!.beadId).toBe(item.beadId);
  });

  it('enforces single hook assignment', async () => {
    const agent = await manager.createAgent('polecat', 'test-rig');
    const item1 = await manager.createWorkItem('Task 1', 'First', 'P1');
    const item2 = await manager.createWorkItem('Task 2', 'Second', 'P2');

    await manager.setHook(agent.id, item1.beadId);
    await expect(manager.setHook(agent.id, item2.beadId)).rejects.toThrow(
      /already has an active hook/
    );
  });

  it('clears a hook', async () => {
    const agent = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('Task', 'Work', 'P1');

    await manager.setHook(agent.id, item.beadId);
    await manager.clearHook(agent.id);

    const hook = await manager.getHook(agent.id);
    expect(hook).toBeNull();
  });

  it('allows new hook after clearing', async () => {
    const agent = await manager.createAgent('polecat', 'test-rig');
    const item1 = await manager.createWorkItem('Task 1', 'First', 'P1');
    const item2 = await manager.createWorkItem('Task 2', 'Second', 'P2');

    await manager.setHook(agent.id, item1.beadId);
    await manager.clearHook(agent.id);
    await manager.setHook(agent.id, item2.beadId);

    const hook = await manager.getHook(agent.id);
    expect(hook!.workItem!.beadId).toBe(item2.beadId);
  });

  it('returns null for agent without hook', async () => {
    const result = await manager.getHook('no-agent');
    expect(result).toBeNull();
  });
});

// ============================================================================
// Convoy Operations
// ============================================================================

describe('Convoy operations', () => {
  it('creates and retrieves a convoy', async () => {
    const item1 = await manager.createWorkItem('T1', 'D1', 'P1');
    const item2 = await manager.createWorkItem('T2', 'D2', 'P2');

    const convoy = await manager.createConvoy('Sprint 1', [item1.beadId, item2.beadId]);
    expect(convoy.name).toBe('Sprint 1');
    expect(convoy.beadIds).toHaveLength(2);
    expect(convoy.progress).toBe(0);
    expect(convoy.id).toBeTruthy();

    const retrieved = await manager.getConvoy(convoy.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(convoy.id);
  });

  it('calculates convoy progress from bead statuses', async () => {
    const item1 = await manager.createWorkItem('T1', 'D1', 'P1');
    const item2 = await manager.createWorkItem('T2', 'D2', 'P2');
    const item3 = await manager.createWorkItem('T3', 'D3', 'P3');

    const convoy = await manager.createConvoy('Progress Test', [
      item1.beadId,
      item2.beadId,
      item3.beadId,
    ]);

    // Mark one item as done
    await manager.updateWorkStatus(item1.beadId, 'done');
    await manager.updateConvoyProgress(convoy.id);

    const updated = await manager.getConvoy(convoy.id);
    expect(updated!.progress).toBeCloseTo(1 / 3);

    // Mark another as merged
    await manager.updateWorkStatus(item2.beadId, 'merged');
    await manager.updateConvoyProgress(convoy.id);

    const final = await manager.getConvoy(convoy.id);
    expect(final!.progress).toBeCloseTo(2 / 3);
  });

  it('returns null for non-existent convoy', async () => {
    const result = await manager.getConvoy('convoy-nonexistent');
    expect(result).toBeNull();
  });
});

// ============================================================================
// Atomic Write Pattern
// ============================================================================

describe('Atomic write pattern', () => {
  it('writes agent files to the agents subdirectory', async () => {
    const agent = await manager.createAgent('polecat', 'test-rig');
    const agentsDir = join(stateDir, 'agents');
    const files = await readdir(agentsDir);
    expect(files).toContain(`${agent.id}.json`);
  });

  it('does not leave temp files after successful write', async () => {
    await manager.createAgent('polecat', 'test-rig');
    const agentsDir = join(stateDir, 'agents');
    const files = await readdir(agentsDir);
    const tmpFiles = files.filter(f => f.endsWith('.tmp'));
    expect(tmpFiles).toHaveLength(0);
  });
});

// ============================================================================
// JSON Sorted Keys
// ============================================================================

describe('JSON sorted keys', () => {
  it('outputs agent JSON with alphabetically sorted keys', async () => {
    const agent = await manager.createAgent('witness', 'sorted-rig');
    const filePath = join(stateDir, 'agents', `${agent.id}.json`);
    const content = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    const keys = Object.keys(parsed);

    const sortedKeys = [...keys].sort();
    expect(keys).toEqual(sortedKeys);
  });

  it('outputs work item JSON with alphabetically sorted keys', async () => {
    const item = await manager.createWorkItem('Sorted test', 'Check keys', 'P1');
    const filePath = join(stateDir, 'work', `${item.beadId}.json`);
    const content = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    const keys = Object.keys(parsed);

    const sortedKeys = [...keys].sort();
    expect(keys).toEqual(sortedKeys);
  });
});
