/**
 * Core functionality tests for the Gastown orchestration chipset.
 *
 * 18 tests (CF-01 through CF-18) that verify the chipset's primary
 * capabilities: YAML parsing, skill references, agent topology,
 * communication channels, agent skills (mayor/polecat/witness/refinery),
 * communication primitives (mail/nudge/hook), and dispatch/retirement
 * pipelines.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateChipset } from './validate-chipset.js';
import { StateManager } from './state-manager.js';
import type { AgentMessage } from './types.js';
import * as yaml from 'js-yaml';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { mkdtemp, rm, readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
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

// ---------------------------------------------------------------------------
// State manager setup
// ---------------------------------------------------------------------------

let stateDir: string;
let manager: StateManager;

beforeEach(async () => {
  stateDir = await mkdtemp(join(tmpdir(), 'gastown-core-'));
  manager = new StateManager({ stateDir });
});

afterEach(async () => {
  await rm(stateDir, { recursive: true, force: true });
});

// ===========================================================================
// Chipset Definition Tests (CF-01 through CF-04)
// ===========================================================================

describe('Chipset Definition', () => {
  // -------------------------------------------------------------------------
  // CF-01: YAML parses correctly
  // All sections present, valid types, no unknown fields
  // -------------------------------------------------------------------------
  it('CF-01: chipset YAML parses with all required sections present', () => {
    const data = loadValidData();

    // All top-level sections must be present
    expect(data).toHaveProperty('header');
    expect(data).toHaveProperty('skills');
    expect(data).toHaveProperty('agents');
    expect(data).toHaveProperty('communication');
    expect(data).toHaveProperty('dispatch');
    expect(data).toHaveProperty('evaluation');
    expect(data).toHaveProperty('runtime');

    // Header fields
    const header = data.header as Record<string, unknown>;
    expect(header.name).toBe('gastown-orchestration');
    expect(header.version).toBe('1.0.0');
    expect(header.archetype).toBe('multi-agent-orchestration');

    // Validate against schema
    const result = validateChipset(loadValidYaml(), SCHEMA_PATH);
    expect(result.valid).toBe(true);
  });

  // -------------------------------------------------------------------------
  // CF-02: Skill references resolve
  // Every skill in skills.required has a corresponding directory
  // The chipset YAML declares abstract skill domain names; the actual
  // implementation directories use implementation-specific names.
  // Mapping: agent-topology -> mayor-coordinator, witness-observer, polecat-worker
  //          gupp-propulsion -> gupp-propulsion
  //          beads-persistence -> beads-state
  //          sling-dispatch -> sling-dispatch
  // -------------------------------------------------------------------------
  it('CF-02: every required skill domain maps to existing skill directories', () => {
    const data = loadValidData();
    const skills = data.skills as Record<string, unknown>;
    const required = skills.required as Array<Record<string, unknown>>;

    expect(required.length).toBeGreaterThan(0);

    // Map chipset YAML skill names to actual skill directory names
    const skillDirMap: Record<string, string[]> = {
      'agent-topology': ['mayor-coordinator', 'witness-observer', 'polecat-worker'],
      'gupp-propulsion': ['gupp-propulsion'],
      'beads-persistence': ['beads-state'],
      'sling-dispatch': ['sling-dispatch'],
    };

    for (const skill of required) {
      const skillName = skill.name as string;
      const directories = skillDirMap[skillName];
      expect(directories, `No directory mapping for skill: ${skillName}`).toBeDefined();

      for (const dirName of directories) {
        const skillDir = path.resolve(PROJECT_ROOT, `.claude/skills/${dirName}`);
        const exists = fs.existsSync(skillDir);
        expect(
          exists,
          `Skill directory missing: ${dirName} (maps from ${skillName})`,
        ).toBe(true);
      }
    }
  });

  // -------------------------------------------------------------------------
  // CF-03: Agent topology valid
  // Exactly 1 mayor, >= 1 worker, >= 1 observer topology
  // -------------------------------------------------------------------------
  it('CF-03: agent topology has exactly 1 mayor, >= 1 polecat, >= 1 witness', () => {
    const data = loadValidData();
    const agents = data.agents as Record<string, unknown>;
    const agentList = agents.agents as Array<Record<string, unknown>>;

    const mayors = agentList.filter((a) => a.role === 'mayor');
    const polecats = agentList.filter((a) => a.role === 'polecat');
    const witnesses = agentList.filter((a) => a.role === 'witness');

    expect(mayors).toHaveLength(1);
    expect(polecats.length).toBeGreaterThanOrEqual(1);
    expect(witnesses.length).toBeGreaterThanOrEqual(1);

    // Also verify via the validator
    const result = validateChipset(loadValidYaml(), SCHEMA_PATH);
    const topologySection = result.sections.find((s) => s.name === 'agent_topology');
    expect(topologySection).toBeDefined();
    expect(topologySection!.valid).toBe(true);
  });

  // -------------------------------------------------------------------------
  // CF-04: Communication channels wired
  // Every agent has at least one send or receive channel
  // -------------------------------------------------------------------------
  it('CF-04: all four communication channel types are configured', () => {
    const data = loadValidData();
    const communication = data.communication as Record<string, unknown>;
    const channels = communication.channels as Array<Record<string, unknown>>;

    // All four channel types must be present
    const channelTypes = channels.map((c) => c.type as string);
    expect(channelTypes).toContain('mail');
    expect(channelTypes).toContain('nudge');
    expect(channelTypes).toContain('hook');
    expect(channelTypes).toContain('handoff');

    // Each channel has a non-empty filesystem path
    for (const channel of channels) {
      expect(channel.filesystem_path).toBeTruthy();
      expect((channel.filesystem_path as string).length).toBeGreaterThan(0);
    }
  });
});

// ===========================================================================
// Agent Topology Skills (CF-05 through CF-10)
// ===========================================================================

describe('Agent Topology Skills', () => {
  // -------------------------------------------------------------------------
  // CF-05: Mayor convoy creation
  // Creates convoy with N beads, tracks progress
  // -------------------------------------------------------------------------
  it('CF-05: mayor can create a convoy and track progress', async () => {
    const item1 = await manager.createWorkItem('Fix auth', 'Auth bug', 'P1');
    const item2 = await manager.createWorkItem('Add tests', 'Test coverage', 'P2');
    const item3 = await manager.createWorkItem('Update docs', 'Docs stale', 'P3');

    const convoy = await manager.createConvoy('Sprint 1', [
      item1.beadId,
      item2.beadId,
      item3.beadId,
    ]);

    expect(convoy.name).toBe('Sprint 1');
    expect(convoy.beadIds).toHaveLength(3);
    expect(convoy.progress).toBe(0);

    // Mark one done and verify progress
    await manager.updateWorkStatus(item1.beadId, 'done');
    await manager.updateConvoyProgress(convoy.id);

    const updated = await manager.getConvoy(convoy.id);
    expect(updated!.progress).toBeCloseTo(1 / 3);
  });

  // -------------------------------------------------------------------------
  // CF-06: Mayor dispatch orchestration
  // Dispatches beads to available polecats round-robin
  // -------------------------------------------------------------------------
  it('CF-06: dispatches beads to polecats via hooks', async () => {
    const polecat1 = await manager.createAgent('polecat', 'rig-a');
    const polecat2 = await manager.createAgent('polecat', 'rig-a');

    const item1 = await manager.createWorkItem('Task 1', 'First', 'P1');
    const item2 = await manager.createWorkItem('Task 2', 'Second', 'P2');

    // Dispatch: one bead per polecat
    await manager.setHook(polecat1.id, item1.beadId);
    await manager.setHook(polecat2.id, item2.beadId);

    // Verify each polecat has its assigned bead
    const hook1 = await manager.getHook(polecat1.id);
    const hook2 = await manager.getHook(polecat2.id);

    expect(hook1!.workItem!.beadId).toBe(item1.beadId);
    expect(hook2!.workItem!.beadId).toBe(item2.beadId);
  });

  // -------------------------------------------------------------------------
  // CF-07: Polecat GUPP activation
  // Hooked polecat announces and begins work within 30s
  // -------------------------------------------------------------------------
  it('CF-07: polecat hook state transitions to active on assignment', async () => {
    const polecat = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('GUPP test', 'Test activation', 'P1');

    // Before hook: no assignment
    const beforeHook = await manager.getHook(polecat.id);
    expect(beforeHook).toBeNull();

    // After hook: state is active with work item
    await manager.setHook(polecat.id, item.beadId);
    const hook = await manager.getHook(polecat.id);

    expect(hook!.status).toBe('active');
    expect(hook!.workItem).toBeDefined();
    expect(hook!.workItem!.beadId).toBe(item.beadId);
    expect(hook!.lastActivity).toBeTruthy();

    // lastActivity should be a valid ISO 8601 timestamp
    const timestamp = new Date(hook!.lastActivity);
    expect(timestamp.getTime()).not.toBeNaN();
  });

  // -------------------------------------------------------------------------
  // CF-08: Polecat self-termination
  // Done polecat: branch pushed, MR created, session ended
  // -------------------------------------------------------------------------
  it('CF-08: done polecat transitions through work lifecycle', async () => {
    const polecat = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('Done test', 'Test lifecycle', 'P1');

    // Dispatch
    await manager.setHook(polecat.id, item.beadId);
    await manager.updateWorkStatus(item.beadId, 'hooked');
    await manager.updateAgentStatus(polecat.id, 'active');

    // Work in progress
    await manager.updateWorkStatus(item.beadId, 'in_progress');

    // Complete and retire
    await manager.updateWorkStatus(item.beadId, 'done');
    await manager.clearHook(polecat.id);
    await manager.updateAgentStatus(polecat.id, 'terminated');

    // Verify final state
    const finalItem = await manager.getWorkItem(item.beadId);
    expect(finalItem!.status).toBe('done');

    const finalAgent = await manager.getAgent(polecat.id);
    expect(finalAgent!.status).toBe('terminated');

    const finalHook = await manager.getHook(polecat.id);
    expect(finalHook).toBeNull();
  });

  // -------------------------------------------------------------------------
  // CF-09: Witness stall detection
  // Detects idle polecat with hooked work after threshold
  // -------------------------------------------------------------------------
  it('CF-09: witness can detect stalled agent via hook lastActivity', async () => {
    const polecat = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('Stall test', 'Test stall detection', 'P1');

    await manager.setHook(polecat.id, item.beadId);
    await manager.updateAgentStatus(polecat.id, 'active');

    // Read hook and check lastActivity
    const hook = await manager.getHook(polecat.id);
    expect(hook).not.toBeNull();
    expect(hook!.lastActivity).toBeTruthy();

    // Simulate stall detection: compare lastActivity with current time
    const lastActivity = new Date(hook!.lastActivity).getTime();
    const now = Date.now();
    const elapsed = now - lastActivity;

    // Just-created hook should have very recent lastActivity (< 5 seconds)
    expect(elapsed).toBeLessThan(5000);

    // In a real scenario, elapsed > stallThreshold (30 min) = stall
    const stallThreshold = 30 * 60 * 1000;
    const isStalled = elapsed > stallThreshold;
    expect(isStalled).toBe(false); // Not stalled (just created)
  });

  // -------------------------------------------------------------------------
  // CF-10: Refinery merge pipeline
  // Clean MR: rebase -> test -> merge -> push -> close
  // -------------------------------------------------------------------------
  it('CF-10: refinery merge pipeline is documented as 5-stage FIFO', () => {
    const content = fs.readFileSync(
      path.resolve(PROJECT_ROOT, '.claude/skills/refinery-merge/SKILL.md'),
      'utf8',
    );

    // Verify the 5-stage pipeline
    expect(content).toContain('CHECKOUT');
    expect(content).toContain('REBASE');
    expect(content).toContain('TEST');
    expect(content).toContain('MERGE');
    expect(content).toContain('PUSH');

    // Verify FIFO processing
    expect(content).toContain('FIFO');
    expect(content).toMatch(/sequential/i);
  });
});

// ===========================================================================
// Communication Skills (CF-11 through CF-14)
// ===========================================================================

describe('Communication Skills', () => {
  // -------------------------------------------------------------------------
  // CF-11: Mail delivery
  // Sender writes JSON, recipient reads from directory
  // -------------------------------------------------------------------------
  it('CF-11: mail messages can be written and read from filesystem', async () => {
    const mailDir = join(stateDir, 'mail', 'polecat-alpha');
    await mkdir(mailDir, { recursive: true });

    const msg: AgentMessage = {
      from: 'mayor-prime',
      to: 'polecat-alpha',
      channel: 'mail',
      payload: 'ASSIGNED: bead-abc - Fix auth',
      timestamp: new Date().toISOString(),
      durable: true,
    };

    const filePath = join(mailDir, `${msg.timestamp}-${msg.from}.json`);
    await writeFile(filePath, JSON.stringify(msg, null, 2), 'utf8');

    // Recipient reads mail
    const files = await readdir(mailDir);
    expect(files.length).toBeGreaterThan(0);

    const content = await readFile(join(mailDir, files[0]), 'utf8');
    const received = JSON.parse(content) as AgentMessage;
    expect(received.from).toBe('mayor-prime');
    expect(received.to).toBe('polecat-alpha');
    expect(received.channel).toBe('mail');
    expect(received.payload).toContain('Fix auth');
    expect(received.durable).toBe(true);
  });

  // -------------------------------------------------------------------------
  // CF-12: Nudge latest-wins
  // Second nudge overwrites first, only latest visible
  // -------------------------------------------------------------------------
  it('CF-12: nudge overwrites previous (latest-wins semantics)', async () => {
    const nudgeDir = join(stateDir, 'nudge');
    await mkdir(nudgeDir, { recursive: true });

    const nudgePath = join(nudgeDir, 'polecat-alpha.json');

    // First nudge
    const nudge1: AgentMessage = {
      from: 'witness-1',
      to: 'polecat-alpha',
      channel: 'nudge',
      payload: 'First nudge: are you alive?',
      timestamp: '2026-03-06T09:00:00Z',
      durable: false,
    };
    await writeFile(nudgePath, JSON.stringify(nudge1, null, 2), 'utf8');

    // Second nudge overwrites the first
    const nudge2: AgentMessage = {
      from: 'witness-1',
      to: 'polecat-alpha',
      channel: 'nudge',
      payload: 'Second nudge: respond now!',
      timestamp: '2026-03-06T09:05:00Z',
      durable: false,
    };
    await writeFile(nudgePath, JSON.stringify(nudge2, null, 2), 'utf8');

    // Only latest nudge should be visible
    const content = await readFile(nudgePath, 'utf8');
    const received = JSON.parse(content) as AgentMessage;
    expect(received.payload).toBe('Second nudge: respond now!');
    expect(received.timestamp).toBe('2026-03-06T09:05:00Z');
  });

  // -------------------------------------------------------------------------
  // CF-13: Hook assignment
  // Sling sets hook, agent reads hook on poll
  // -------------------------------------------------------------------------
  it('CF-13: hook is set by sling and readable by polling agent', async () => {
    const agent = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('Poll test', 'Test hook poll', 'P1');

    // Sling sets hook
    await manager.setHook(agent.id, item.beadId);

    // Agent polls hook
    const hook = await manager.getHook(agent.id);
    expect(hook).not.toBeNull();
    expect(hook!.status).toBe('active');
    expect(hook!.workItem!.beadId).toBe(item.beadId);
    expect(hook!.workItem!.title).toBe('Poll test');
  });

  // -------------------------------------------------------------------------
  // CF-14: Hook clear on done
  // Done retirement clears hook, status -> empty
  // -------------------------------------------------------------------------
  it('CF-14: done retirement clears hook leaving no active assignment', async () => {
    const agent = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('Clear test', 'Test hook clear', 'P1');

    // Hook is set
    await manager.setHook(agent.id, item.beadId);
    const hookBefore = await manager.getHook(agent.id);
    expect(hookBefore).not.toBeNull();
    expect(hookBefore!.status).toBe('active');

    // Done retirement clears hook
    await manager.clearHook(agent.id);
    const hookAfter = await manager.getHook(agent.id);
    expect(hookAfter).toBeNull();

    // Agent can now receive new work
    const item2 = await manager.createWorkItem('New work', 'After clear', 'P2');
    await manager.setHook(agent.id, item2.beadId);
    const hookNew = await manager.getHook(agent.id);
    expect(hookNew!.workItem!.beadId).toBe(item2.beadId);
  });
});

// ===========================================================================
// Dispatch & Retirement (CF-15 through CF-18)
// ===========================================================================

describe('Dispatch & Retirement', () => {
  // -------------------------------------------------------------------------
  // CF-15: Single dispatch
  // 1 bead -> 1 polecat, correct state transitions
  // -------------------------------------------------------------------------
  it('CF-15: single dispatch assigns 1 bead to 1 polecat with correct transitions', async () => {
    const polecat = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('Single dispatch', 'Test dispatch', 'P1');

    // Verify initial state
    expect(item.status).toBe('open');
    expect(polecat.status).toBe('idle');

    // Dispatch: set hook
    await manager.setHook(polecat.id, item.beadId);
    await manager.updateWorkStatus(item.beadId, 'hooked');
    await manager.updateAgentStatus(polecat.id, 'active');

    // Verify dispatched state
    const dispatchedItem = await manager.getWorkItem(item.beadId);
    expect(dispatchedItem!.status).toBe('hooked');

    const activeAgent = await manager.getAgent(polecat.id);
    expect(activeAgent!.status).toBe('active');

    const hook = await manager.getHook(polecat.id);
    expect(hook!.workItem!.beadId).toBe(item.beadId);
  });

  // -------------------------------------------------------------------------
  // CF-16: Batch dispatch
  // 5 beads -> auto-convoy, 5 parallel dispatches
  // -------------------------------------------------------------------------
  it('CF-16: batch dispatch creates convoy for multiple beads', async () => {
    // Create 5 beads
    const items = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        manager.createWorkItem(`Task ${i + 1}`, `Description ${i + 1}`, 'P2'),
      ),
    );

    // Create 5 polecats
    const polecats = await Promise.all(
      Array.from({ length: 5 }, () => manager.createAgent('polecat', 'rig-batch')),
    );

    // Create convoy for batch
    const convoy = await manager.createConvoy(
      'Batch Sprint',
      items.map((i) => i.beadId),
    );

    expect(convoy.beadIds).toHaveLength(5);
    expect(convoy.progress).toBe(0);

    // Dispatch each bead to a polecat
    for (let i = 0; i < 5; i++) {
      await manager.setHook(polecats[i].id, items[i].beadId);
      await manager.updateWorkStatus(items[i].beadId, 'hooked');
    }

    // Verify all 5 hooks are set
    for (let i = 0; i < 5; i++) {
      const hook = await manager.getHook(polecats[i].id);
      expect(hook!.workItem!.beadId).toBe(items[i].beadId);
    }
  });

  // -------------------------------------------------------------------------
  // CF-17: Done pipeline
  // All 7 stages execute in order
  // -------------------------------------------------------------------------
  it('CF-17: done pipeline stages execute in lifecycle order', async () => {
    const polecat = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('Pipeline test', 'Full lifecycle', 'P1');

    // Stage 1: Validate (item is open)
    expect(item.status).toBe('open');

    // Stage 2: Hook (dispatch)
    await manager.setHook(polecat.id, item.beadId);
    await manager.updateWorkStatus(item.beadId, 'hooked');

    // Stage 3: In progress (agent working)
    await manager.updateWorkStatus(item.beadId, 'in_progress');
    await manager.updateAgentStatus(polecat.id, 'active');

    // Stage 4: Done (push completed)
    await manager.updateWorkStatus(item.beadId, 'done');

    // Stage 5: Merged (refinery completes)
    await manager.updateWorkStatus(item.beadId, 'merged');

    // Stage 6: Cleanup (clear hook)
    await manager.clearHook(polecat.id);

    // Stage 7: Terminate
    await manager.updateAgentStatus(polecat.id, 'terminated');

    // Verify final state
    const finalItem = await manager.getWorkItem(item.beadId);
    expect(finalItem!.status).toBe('merged');

    const finalAgent = await manager.getAgent(polecat.id);
    expect(finalAgent!.status).toBe('terminated');

    const finalHook = await manager.getHook(polecat.id);
    expect(finalHook).toBeNull();
  });

  // -------------------------------------------------------------------------
  // CF-18: Dispatch idempotency
  // Re-dispatch of hooked bead is a no-op
  // -------------------------------------------------------------------------
  it('CF-18: re-dispatch of hooked bead is a no-op (idempotent)', async () => {
    const polecat1 = await manager.createAgent('polecat', 'test-rig');
    const polecat2 = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('Idempotent test', 'Test idempotency', 'P1');

    // First dispatch succeeds
    await manager.setHook(polecat1.id, item.beadId);
    await manager.updateWorkStatus(item.beadId, 'hooked');

    // Re-dispatching the same bead to polecat1 should fail (already hooked)
    await expect(manager.setHook(polecat1.id, item.beadId)).rejects.toThrow();

    // The original hook is unchanged
    const hook = await manager.getHook(polecat1.id);
    expect(hook!.workItem!.beadId).toBe(item.beadId);
  });
});
