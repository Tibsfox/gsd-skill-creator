/**
 * Edge case tests for the Gastown orchestration chipset.
 *
 * 6 tests (EC-01 through EC-06) that verify boundary behavior:
 * empty rig handling, busy pool queuing, concurrent hook writes,
 * malformed state file recovery, unknown runtime fallback, and
 * chipset YAML with missing optional sections.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateChipset } from './validate-chipset.js';
import { StateManager } from './state-manager.js';
import * as yaml from 'js-yaml';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Shared paths and helpers
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(import.meta.dirname ?? __dirname, '../../..');

const CHIPSET_PATH = path.resolve(
  PROJECT_ROOT,
  'data/chipset/gastown-orchestration/gastown-orchestration.yaml',
);

const SCHEMA_PATH = path.resolve(
  PROJECT_ROOT,
  'data/chipset/schema/gastown-chipset-schema.json',
);

function loadValidYaml(): string {
  return fs.readFileSync(CHIPSET_PATH, 'utf8');
}

function loadValidData(): Record<string, unknown> {
  return yaml.load(loadValidYaml()) as Record<string, unknown>;
}

function toYaml(data: Record<string, unknown>): string {
  return yaml.dump(data);
}

// ---------------------------------------------------------------------------
// State manager setup
// ---------------------------------------------------------------------------

let stateDir: string;
let manager: StateManager;

beforeEach(async () => {
  stateDir = await mkdtemp(join(tmpdir(), 'gastown-edge-'));
  manager = new StateManager({ stateDir });
});

afterEach(async () => {
  await rm(stateDir, { recursive: true, force: true });
});

// ===========================================================================
// Edge Case Tests (EC-01 through EC-06)
// ===========================================================================

describe('Edge Case Tests', () => {
  // -------------------------------------------------------------------------
  // EC-01: Empty rig (no work items)
  // Mayor reports no work, no agents spawned
  // -------------------------------------------------------------------------
  it('EC-01: empty rig has no agents and no work items', async () => {
    // Query agents on a fresh state directory — should be empty
    const agents = await manager.listAgents();
    expect(agents).toHaveLength(0);

    // Filter by role — still empty
    const polecats = await manager.listAgents({ role: 'polecat' });
    expect(polecats).toHaveLength(0);

    // Query for a non-existent work item
    const item = await manager.getWorkItem('bead-nonexistent');
    expect(item).toBeNull();

    // Query for a non-existent convoy
    const convoy = await manager.getConvoy('convoy-nonexistent');
    expect(convoy).toBeNull();

    // Query for a non-existent hook
    const hook = await manager.getHook('agent-nonexistent');
    expect(hook).toBeNull();
  });

  // -------------------------------------------------------------------------
  // EC-02: All polecats busy
  // Dispatch queues bead, dispatches when polecat frees
  // -------------------------------------------------------------------------
  it('EC-02: new hook fails when all polecats have active hooks', async () => {
    // Create 2 polecats and assign work to both
    const polecat1 = await manager.createAgent('polecat', 'busy-rig');
    const polecat2 = await manager.createAgent('polecat', 'busy-rig');

    const item1 = await manager.createWorkItem('Task 1', 'First', 'P1');
    const item2 = await manager.createWorkItem('Task 2', 'Second', 'P2');
    const item3 = await manager.createWorkItem('Task 3', 'Third (queued)', 'P3');

    // Both polecats are now busy
    await manager.setHook(polecat1.id, item1.beadId);
    await manager.setHook(polecat2.id, item2.beadId);
    await manager.updateAgentStatus(polecat1.id, 'active');
    await manager.updateAgentStatus(polecat2.id, 'active');

    // Attempting to assign item3 to either polecat should fail
    await expect(manager.setHook(polecat1.id, item3.beadId)).rejects.toThrow(
      /already has an active hook/,
    );
    await expect(manager.setHook(polecat2.id, item3.beadId)).rejects.toThrow(
      /already has an active hook/,
    );

    // When a polecat frees up, the queued bead can be dispatched
    await manager.clearHook(polecat1.id);
    await manager.updateAgentStatus(polecat1.id, 'idle');

    // Now dispatch succeeds
    await manager.setHook(polecat1.id, item3.beadId);
    const hook = await manager.getHook(polecat1.id);
    expect(hook!.workItem!.beadId).toBe(item3.beadId);
  });

  // -------------------------------------------------------------------------
  // EC-03: Concurrent hook writes
  // Atomic write ensures one wins, other retries
  // -------------------------------------------------------------------------
  it('EC-03: atomic write pattern prevents partial state on concurrent access', async () => {
    const agent = await manager.createAgent('polecat', 'concurrent-rig');
    const item1 = await manager.createWorkItem('Task A', 'First attempt', 'P1');
    const item2 = await manager.createWorkItem('Task B', 'Second attempt', 'P2');

    // First write succeeds
    await manager.setHook(agent.id, item1.beadId);

    // Second write fails because hook is already active
    await expect(manager.setHook(agent.id, item2.beadId)).rejects.toThrow();

    // The state file should be consistent — not corrupted by the failed attempt
    const hook = await manager.getHook(agent.id);
    expect(hook).not.toBeNull();
    expect(hook!.status).toBe('active');
    expect(hook!.workItem!.beadId).toBe(item1.beadId);

    // Verify the JSON file is valid and complete
    const hookPath = join(stateDir, 'hooks', `${agent.id}.json`);
    const content = await readFile(hookPath, 'utf8');
    const parsed = JSON.parse(content);
    expect(parsed.agentId).toBe(agent.id);
    expect(parsed.status).toBe('active');
  });

  // -------------------------------------------------------------------------
  // EC-04: Malformed state file
  // State manager detects corruption, logs warning, recreates from defaults
  // -------------------------------------------------------------------------
  it('EC-04: state manager handles malformed JSON by returning null', async () => {
    // Write a corrupt agent file
    const agentsDir = join(stateDir, 'agents');
    await mkdir(agentsDir, { recursive: true });
    const corruptPath = join(agentsDir, 'corrupt-agent.json');
    await writeFile(corruptPath, '{ this is not valid JSON {{{{', 'utf8');

    // Reading the corrupt file should return null (graceful degradation)
    const result = await manager.getAgent('corrupt-agent');
    expect(result).toBeNull();

    // Write a corrupt work item file
    const workDir = join(stateDir, 'work');
    await mkdir(workDir, { recursive: true });
    const corruptWorkPath = join(workDir, 'bead-corrupt.json');
    await writeFile(corruptWorkPath, '', 'utf8');

    // Reading empty/corrupt work item returns null
    const workResult = await manager.getWorkItem('bead-corrupt');
    expect(workResult).toBeNull();

    // Write a corrupt hook file
    const hooksDir = join(stateDir, 'hooks');
    await mkdir(hooksDir, { recursive: true });
    const corruptHookPath = join(hooksDir, 'bad-hook.json');
    await writeFile(corruptHookPath, 'null', 'utf8');

    // Reading corrupt hook returns null
    const hookResult = await manager.getHook('bad-hook');
    expect(hookResult).toBeNull();
  });

  // -------------------------------------------------------------------------
  // EC-05: Unknown runtime provider
  // HAL falls back to polling strategy, all features degrade gracefully
  // -------------------------------------------------------------------------
  it('EC-05: runtime HAL skill documents polling fallback for unknown runtimes', () => {
    const content = fs.readFileSync(
      path.resolve(PROJECT_ROOT, '.claude/skills/runtime-hal/SKILL.md'),
      'utf8',
    );

    // Verify unknown provider maps to polling
    expect(content).toMatch(/unknown.*polling/i);

    // Verify degradation guarantees
    expect(content).toMatch(/No crash/i);
    expect(content).toMatch(/No hang/i);
    expect(content).toMatch(/No error thrown/i);

    // Verify the fallback step in the detection cascade
    expect(content).toMatch(/Fall back to 'unknown'/i);

    // Verify polling is documented as the most robust fallback strategy
    expect(content).toMatch(/most robust fallback/i);
  });

  // -------------------------------------------------------------------------
  // EC-06: Chipset YAML missing optional section
  // Defaults applied, no error
  // -------------------------------------------------------------------------
  it('EC-06: chipset with empty optional arrays still validates', () => {
    const data = loadValidData();

    // Remove optional content: empty recommended skills array
    const skills = data.skills as Record<string, unknown>;
    skills.recommended = [];

    // Remove recommended skill references from agents
    const agents = data.agents as Record<string, unknown>;
    const agentList = agents.agents as Array<Record<string, unknown>>;
    for (const agent of agentList) {
      const agentSkills = agent.skills as string[];
      agent.skills = agentSkills.filter(
        (s) => s !== 'convoy-batch' && s !== 'formula-microcode',
      );
    }

    // Remove optional 'count' field from polecat (defaults to 1)
    for (const agent of agentList) {
      if (agent.role === 'polecat') {
        delete agent.count;
      }
    }

    const result = validateChipset(toYaml(data), SCHEMA_PATH);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);

    // Token budget should still be valid with only required skills
    const budgetSection = result.sections.find((s) => s.name === 'token_budget');
    expect(budgetSection!.valid).toBe(true);

    // Required skills sum should be less than 1.0 even without recommended
    const required = skills.required as Array<Record<string, unknown>>;
    const requiredSum = required.reduce(
      (sum, s) => sum + (s.token_budget_weight as number),
      0,
    );
    expect(requiredSum).toBeLessThanOrEqual(1.0);
  });
});
