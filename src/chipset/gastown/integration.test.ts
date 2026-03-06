/**
 * Integration tests for the Gastown orchestration chipset.
 *
 * 8 tests (IT-01 through IT-08) that verify cross-component interfaces:
 * chipset-to-skill-creator pipeline, sling-to-hook-to-GUPP chains,
 * done-to-refinery-to-mail flows, witness-to-nudge-to-polecat responses,
 * mayor-to-convoy-to-sling dispatch, crash recovery, runtime HAL strategy
 * selection, and full end-to-end workflow.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateChipset } from './validate-chipset.js';
import { StateManager } from './state-manager.js';
import type { AgentMessage, MergeRequest } from './types.js';
import * as yaml from 'js-yaml';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { mkdtemp, rm, mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
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
  stateDir = await mkdtemp(join(tmpdir(), 'gastown-integ-'));
  manager = new StateManager({ stateDir });
});

afterEach(async () => {
  await rm(stateDir, { recursive: true, force: true });
});

// Helper: write a mail message to the filesystem
async function sendMail(msg: AgentMessage): Promise<string> {
  const mailDir = join(stateDir, 'mail', msg.to);
  await mkdir(mailDir, { recursive: true });
  const filePath = join(mailDir, `${msg.timestamp}-${msg.from}.json`);
  await writeFile(filePath, JSON.stringify(msg, null, 2), 'utf8');
  return filePath;
}

// Helper: read all mail for a recipient
async function readMail(recipientId: string): Promise<AgentMessage[]> {
  const mailDir = join(stateDir, 'mail', recipientId);
  let files: string[];
  try {
    files = await readdir(mailDir);
  } catch {
    return [];
  }
  const messages: AgentMessage[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const content = await readFile(join(mailDir, file), 'utf8');
    messages.push(JSON.parse(content) as AgentMessage);
  }
  return messages;
}

// Helper: write a merge request record
async function writeMergeRequest(mr: MergeRequest): Promise<void> {
  const mrDir = join(stateDir, 'merge-queue');
  await mkdir(mrDir, { recursive: true });
  const filePath = join(mrDir, `${mr.id}.json`);
  await writeFile(filePath, JSON.stringify(mr, null, 2), 'utf8');
}

// ===========================================================================
// Integration Tests (IT-01 through IT-08)
// ===========================================================================

describe('Integration Tests', () => {
  // -------------------------------------------------------------------------
  // IT-01: Chipset -> Skill-Creator pipeline loading
  // Chipset YAML loads through skill-creator's 6-stage pipeline
  // -------------------------------------------------------------------------
  it('IT-01: chipset YAML validates through all 4 pipeline stages', () => {
    const result = validateChipset(loadValidYaml(), SCHEMA_PATH);

    // All 4 validation stages must pass
    expect(result.valid).toBe(true);
    expect(result.sections.length).toBe(4);

    const sectionNames = result.sections.map((s) => s.name);
    expect(sectionNames).toEqual([
      'schema',
      'token_budget',
      'agent_topology',
      'communication',
    ]);

    // Every section passes independently
    for (const section of result.sections) {
      expect(section.valid, `Section "${section.name}" failed: ${section.errors.join(', ')}`).toBe(
        true,
      );
    }
  });

  // -------------------------------------------------------------------------
  // IT-02: Sling -> Hook -> GUPP activation chain
  // Dispatched work triggers GUPP activation chain
  // -------------------------------------------------------------------------
  it('IT-02: sling dispatch triggers hook which enables GUPP activation', async () => {
    // Step 1: Create agent and work item (sling prep)
    const polecat = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('GUPP chain test', 'Test full chain', 'P1');

    expect(polecat.status).toBe('idle');
    expect(item.status).toBe('open');

    // Step 2: Sling dispatches (sets hook)
    await manager.setHook(polecat.id, item.beadId);
    await manager.updateWorkStatus(item.beadId, 'hooked');

    // Step 3: Hook triggers GUPP — agent should detect hook and go active
    const hook = await manager.getHook(polecat.id);
    expect(hook).not.toBeNull();
    expect(hook!.status).toBe('active');

    // GUPP activates: agent transitions to active
    await manager.updateAgentStatus(polecat.id, 'active');
    const agent = await manager.getAgent(polecat.id);
    expect(agent!.status).toBe('active');

    // Work transitions to in_progress
    await manager.updateWorkStatus(item.beadId, 'in_progress');
    const workItem = await manager.getWorkItem(item.beadId);
    expect(workItem!.status).toBe('in_progress');
  });

  // -------------------------------------------------------------------------
  // IT-03: Done -> Refinery -> Mail notification
  // Completion triggers merge queue entry and mayor notification
  // -------------------------------------------------------------------------
  it('IT-03: done triggers MR creation and mayor notification via mail', async () => {
    const polecat = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('Done chain test', 'Test done flow', 'P1');

    // Dispatch and work
    await manager.setHook(polecat.id, item.beadId);
    await manager.updateWorkStatus(item.beadId, 'in_progress');
    await manager.updateAgentStatus(polecat.id, 'active');

    // Step 1: Done — push completed
    await manager.updateWorkStatus(item.beadId, 'done');

    // Step 2: Submit merge request to refinery queue
    const mr: MergeRequest = {
      id: `mr-${item.beadId}`,
      sourceBranch: `polecat/${item.beadId}`,
      targetBranch: 'main',
      status: 'pending',
      beadId: item.beadId,
    };
    await writeMergeRequest(mr);

    // Verify MR exists in merge queue
    const mrDir = join(stateDir, 'merge-queue');
    const mrFiles = await readdir(mrDir);
    expect(mrFiles.length).toBe(1);
    expect(mrFiles[0]).toBe(`${mr.id}.json`);

    // Step 3: Send completion notification to mayor via mail
    const completionMail: AgentMessage = {
      from: polecat.id,
      to: 'mayor',
      channel: 'mail',
      payload: `DONE: ${item.beadId} - branch polecat/${item.beadId} pushed, MR ${mr.id} submitted`,
      timestamp: new Date().toISOString(),
      durable: true,
    };
    await sendMail(completionMail);

    // Verify mayor received notification
    const mayorMail = await readMail('mayor');
    expect(mayorMail.length).toBe(1);
    expect(mayorMail[0].payload).toContain('DONE');
    expect(mayorMail[0].payload).toContain(item.beadId);
  });

  // -------------------------------------------------------------------------
  // IT-04: Witness -> Nudge -> Polecat response
  // Stall detection triggers nudge, polecat responds
  // -------------------------------------------------------------------------
  it('IT-04: witness detects stall, sends nudge, polecat can respond', async () => {
    const polecat = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('Nudge chain test', 'Test nudge flow', 'P1');

    // Polecat is working
    await manager.setHook(polecat.id, item.beadId);
    await manager.updateAgentStatus(polecat.id, 'active');

    // Step 1: Witness detects stall (via hook lastActivity)
    const hook = await manager.getHook(polecat.id);
    expect(hook!.lastActivity).toBeTruthy();

    // Step 2: Witness sends nudge
    const nudgeDir = join(stateDir, 'nudge');
    await mkdir(nudgeDir, { recursive: true });
    const nudgePath = join(nudgeDir, `${polecat.id}.json`);

    const nudge: AgentMessage = {
      from: 'witness-1',
      to: polecat.id,
      channel: 'nudge',
      payload: `HEALTH_CHECK: no activity on ${item.beadId}`,
      timestamp: new Date().toISOString(),
      durable: false,
    };
    await writeFile(nudgePath, JSON.stringify(nudge, null, 2), 'utf8');

    // Step 3: Polecat reads nudge and responds via mail
    const nudgeContent = await readFile(nudgePath, 'utf8');
    const receivedNudge = JSON.parse(nudgeContent) as AgentMessage;
    expect(receivedNudge.channel).toBe('nudge');
    expect(receivedNudge.payload).toContain('HEALTH_CHECK');

    // Polecat sends status response
    const response: AgentMessage = {
      from: polecat.id,
      to: 'witness-1',
      channel: 'mail',
      payload: `STATUS_OK: working on ${item.beadId}, running tests`,
      timestamp: new Date().toISOString(),
      durable: true,
    };
    await sendMail(response);

    // Witness reads response
    const witnessMail = await readMail('witness-1');
    expect(witnessMail.length).toBe(1);
    expect(witnessMail[0].payload).toContain('STATUS_OK');
  });

  // -------------------------------------------------------------------------
  // IT-05: Mayor -> Convoy -> Sling dispatch
  // Convoy creation leads to parallel dispatches
  // -------------------------------------------------------------------------
  it('IT-05: mayor creates convoy and dispatches all beads to polecats', async () => {
    // Mayor creates work items
    const items = await Promise.all([
      manager.createWorkItem('Task A', 'Auth', 'P1'),
      manager.createWorkItem('Task B', 'Tests', 'P2'),
      manager.createWorkItem('Task C', 'Docs', 'P3'),
    ]);

    // Mayor creates convoy
    const convoy = await manager.createConvoy(
      'Sprint Convoy',
      items.map((i) => i.beadId),
    );
    expect(convoy.beadIds).toHaveLength(3);

    // Mayor spawns polecats
    const polecats = await Promise.all([
      manager.createAgent('polecat', 'rig-a'),
      manager.createAgent('polecat', 'rig-a'),
      manager.createAgent('polecat', 'rig-a'),
    ]);

    // Sling dispatches each bead to a polecat
    for (let i = 0; i < 3; i++) {
      await manager.setHook(polecats[i].id, items[i].beadId);
      await manager.updateWorkStatus(items[i].beadId, 'hooked');
    }

    // Verify all dispatched
    for (let i = 0; i < 3; i++) {
      const hook = await manager.getHook(polecats[i].id);
      expect(hook!.workItem!.beadId).toBe(items[i].beadId);
    }

    // Simulate completion and track convoy progress
    await manager.updateWorkStatus(items[0].beadId, 'done');
    await manager.updateConvoyProgress(convoy.id);

    const progress1 = await manager.getConvoy(convoy.id);
    expect(progress1!.progress).toBeCloseTo(1 / 3);

    await manager.updateWorkStatus(items[1].beadId, 'done');
    await manager.updateWorkStatus(items[2].beadId, 'done');
    await manager.updateConvoyProgress(convoy.id);

    const progress2 = await manager.getConvoy(convoy.id);
    expect(progress2!.progress).toBe(1.0);
  });

  // -------------------------------------------------------------------------
  // IT-06: Crash -> Recovery -> GUPP fires
  // Simulated crash recovery: state loads, hook detected, GUPP fires
  // -------------------------------------------------------------------------
  it('IT-06: crash recovery loads state and detects existing hooks', async () => {
    // Before crash: create agent and hook
    const polecat = await manager.createAgent('polecat', 'test-rig');
    const item = await manager.createWorkItem('Crash test', 'Survives crash', 'P1');
    await manager.setHook(polecat.id, item.beadId);
    await manager.updateAgentStatus(polecat.id, 'active');

    // Simulate crash: create a NEW StateManager pointing to the same directory
    const recoveredManager = new StateManager({ stateDir });

    // After recovery: state is intact
    const recoveredAgent = await recoveredManager.getAgent(polecat.id);
    expect(recoveredAgent).not.toBeNull();
    expect(recoveredAgent!.status).toBe('active');

    // Hook survived the crash
    const recoveredHook = await recoveredManager.getHook(polecat.id);
    expect(recoveredHook).not.toBeNull();
    expect(recoveredHook!.status).toBe('active');
    expect(recoveredHook!.workItem!.beadId).toBe(item.beadId);

    // GUPP can re-fire: work item is still intact
    const recoveredItem = await recoveredManager.getWorkItem(item.beadId);
    expect(recoveredItem).not.toBeNull();
    expect(recoveredItem!.title).toBe('Crash test');
  });

  // -------------------------------------------------------------------------
  // IT-07: HAL -> Strategy selection per runtime
  // Runtime detection selects correct GUPP strategy
  // -------------------------------------------------------------------------
  it('IT-07: runtime HAL documents strategy selection for each provider', () => {
    const content = fs.readFileSync(
      path.resolve(PROJECT_ROOT, '.claude/skills/runtime-hal/SKILL.md'),
      'utf8',
    );

    // Verify all providers are documented
    expect(content).toContain('claude');
    expect(content).toContain('codex');
    expect(content).toContain('gemini');
    expect(content).toContain('cursor');
    expect(content).toContain('unknown');

    // Verify strategy types are documented
    expect(content).toContain('hook_injection');
    expect(content).toContain('startup_fallback');
    expect(content).toContain('polling');
    expect(content).toContain('prompt_preamble');

    // Verify the detection cascade exists
    expect(content).toMatch(/detection cascade/i);
    expect(content).toContain('GT_RUNTIME');
    expect(content).toContain('CLAUDE_SESSION_ID');

    // Verify the capabilities matrix documents all providers
    expect(content).toMatch(/Provider Capabilities Matrix/i);
  });

  // -------------------------------------------------------------------------
  // IT-08: Full E2E workflow
  // User intent -> chipset loads -> agents spawn -> work dispatches ->
  // work completes -> merge succeeds
  // -------------------------------------------------------------------------
  it('IT-08: full end-to-end workflow from chipset load to work completion', async () => {
    // Step 1: Chipset loads and validates
    const result = validateChipset(loadValidYaml(), SCHEMA_PATH);
    expect(result.valid).toBe(true);

    // Step 2: Extract topology from chipset
    const data = loadValidData();
    const agents = data.agents as Record<string, unknown>;
    const agentList = agents.agents as Array<Record<string, unknown>>;
    expect(agentList.length).toBeGreaterThan(0);

    // Step 3: Agents spawn per topology
    const mayor = await manager.createAgent('mayor', 'e2e-rig');
    const witness = await manager.createAgent('witness', 'e2e-rig');
    const refinery = await manager.createAgent('refinery', 'e2e-rig');
    const polecat = await manager.createAgent('polecat', 'e2e-rig');

    // Step 4: Mayor creates work and convoy
    const item = await manager.createWorkItem('E2E task', 'Full workflow test', 'P1');
    const convoy = await manager.createConvoy('E2E Convoy', [item.beadId]);

    // Step 5: Sling dispatches to polecat
    await manager.setHook(polecat.id, item.beadId);
    await manager.updateWorkStatus(item.beadId, 'hooked');
    await manager.updateAgentStatus(polecat.id, 'active');

    // Step 6: GUPP activates, polecat works
    await manager.updateWorkStatus(item.beadId, 'in_progress');

    // Step 7: Polecat completes, enters done pipeline
    await manager.updateWorkStatus(item.beadId, 'done');

    // Step 8: MR submitted to refinery
    const mr: MergeRequest = {
      id: `mr-${item.beadId}`,
      sourceBranch: `polecat/${item.beadId}`,
      targetBranch: 'main',
      status: 'pending',
      beadId: item.beadId,
    };
    await writeMergeRequest(mr);

    // Step 9: Notification sent to mayor
    const doneMail: AgentMessage = {
      from: polecat.id,
      to: 'mayor',
      channel: 'mail',
      payload: `DONE: ${item.beadId}`,
      timestamp: new Date().toISOString(),
      durable: true,
    };
    await sendMail(doneMail);

    // Step 10: Cleanup and terminate
    await manager.clearHook(polecat.id);
    await manager.updateAgentStatus(polecat.id, 'terminated');

    // Step 11: Refinery merges (simulate)
    await manager.updateWorkStatus(item.beadId, 'merged');

    // Step 12: Convoy completes
    await manager.updateConvoyProgress(convoy.id);
    const finalConvoy = await manager.getConvoy(convoy.id);
    expect(finalConvoy!.progress).toBe(1.0);

    // Verify full lifecycle completed
    const finalItem = await manager.getWorkItem(item.beadId);
    expect(finalItem!.status).toBe('merged');

    const finalPolecat = await manager.getAgent(polecat.id);
    expect(finalPolecat!.status).toBe('terminated');

    const mayorMail = await readMail('mayor');
    expect(mayorMail.length).toBe(1);
    expect(mayorMail[0].payload).toContain('DONE');
  });
});
