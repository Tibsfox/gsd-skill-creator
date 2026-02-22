/**
 * SessionManager test suite.
 *
 * TDD RED phase: tests written to verify SessionManager behavior.
 * Covers SESS-01 (session lifecycle), SESS-04 (JSONL persistence),
 * SESS-05 (technique timer semantics).
 *
 * Each test uses an isolated temp directory to prevent production
 * .brainstorm/ writes and avoid inter-test interference.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { SessionManager, SessionManagerError } from './session-manager.js';
import { SessionStateSchema } from '../shared/types.js';
import type { Idea, Question, Cluster } from '../shared/types.js';

// ============================================================================
// Test helpers
// ============================================================================

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'brainstorm-test-'));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

/**
 * Create a minimal valid Idea for testing addIdea().
 */
function makeIdea(content: string): Idea {
  return {
    id: randomUUID(),
    content,
    source_agent: 'ideator',
    source_technique: 'freewriting',
    phase: 'diverge',
    tags: [],
    timestamp: Date.now(),
  };
}

/**
 * Create a minimal valid Question for testing addQuestion().
 */
function makeQuestion(content: string): Question {
  return {
    id: randomUUID(),
    content,
    category: 'what',
    source_technique: 'starbursting',
    timestamp: Date.now(),
  };
}

/**
 * Create a minimal valid Cluster for testing setClusters().
 */
function makeCluster(label: string, ideaIds: string[]): Cluster {
  return {
    id: randomUUID(),
    label,
    idea_ids: ideaIds,
  };
}

// ============================================================================
// Session lifecycle (SESS-01)
// ============================================================================

describe('SessionManager -- Session Lifecycle (SESS-01)', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager({ brainstormDir: testDir });
  });

  it('createSession returns valid SessionState in created status', async () => {
    const session = await manager.createSession('Test problem statement');

    expect(session.status).toBe('created');
    expect(session.phase).toBe('explore');
    expect(session.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(session.active_agents).toContain('facilitator');
    expect(session.active_agents).toContain('scribe');
    expect(session.problem_statement).toBe('Test problem statement');
  });

  it('createSession writes state.json to disk', async () => {
    const session = await manager.createSession('Test problem statement');
    const statePath = join(testDir, 'sessions', session.id, 'state.json');

    const raw = await readFile(statePath, 'utf-8');
    const parsed = JSON.parse(raw);

    // Zod validation must pass without throwing
    const validated = SessionStateSchema.parse(parsed);
    expect(validated.id).toBe(session.id);
  });

  it('status transitions: created -> active via setActiveTechnique', async () => {
    const session = await manager.createSession('Test problem');
    await manager.setActiveTechnique(session.id, 'freewriting');

    const updated = await manager.getSession(session.id);
    expect(updated.status).toBe('active');
  });

  it('status transitions: active -> paused via pauseSession', async () => {
    const session = await manager.createSession('Test problem');
    await manager.setActiveTechnique(session.id, 'freewriting');
    await manager.pauseSession(session.id);

    const updated = await manager.getSession(session.id);
    expect(updated.status).toBe('paused');
    expect(updated.timer.is_paused).toBe(true);
  });

  it('status transitions: paused -> active via resumeSession', async () => {
    const session = await manager.createSession('Test problem');
    await manager.setActiveTechnique(session.id, 'freewriting');
    await manager.pauseSession(session.id);
    await manager.resumeSession(session.id);

    const updated = await manager.getSession(session.id);
    expect(updated.status).toBe('active');
    expect(updated.timer.is_paused).toBe(false);
  });

  it('invalid transition: paused -> completed throws INVALID_TRANSITION', async () => {
    const session = await manager.createSession('Test problem');
    await manager.setActiveTechnique(session.id, 'freewriting');
    await manager.pauseSession(session.id);

    await expect(manager.completeSession(session.id)).rejects.toThrow(
      SessionManagerError,
    );
    try {
      await manager.completeSession(session.id);
    } catch (err) {
      expect((err as SessionManagerError).code).toBe('INVALID_TRANSITION');
    }
  });

  it('invalid transition: completed -> active throws INVALID_TRANSITION', async () => {
    const session = await manager.createSession('Test problem');
    await manager.setActiveTechnique(session.id, 'freewriting');
    await manager.completeSession(session.id);

    await expect(
      manager.setActiveTechnique(session.id, 'rapid-ideation'),
    ).rejects.toThrow(SessionManagerError);
    try {
      await manager.setActiveTechnique(session.id, 'rapid-ideation');
    } catch (err) {
      expect((err as SessionManagerError).code).toBe('INVALID_TRANSITION');
    }
  });

  it('completeSession sets status to completed and finalizes metadata', async () => {
    const session = await manager.createSession('Test problem');
    await manager.setActiveTechnique(session.id, 'freewriting');
    await manager.updatePhase(session.id, 'diverge');
    await manager.updatePhase(session.id, 'organize');
    await manager.updatePhase(session.id, 'converge');
    await manager.updatePhase(session.id, 'act');
    const completed = await manager.completeSession(session.id);

    expect(completed.status).toBe('completed');
    // All phase_history entries should have exited_at set
    for (const entry of completed.metadata.phase_history) {
      expect(entry.exited_at).toBeDefined();
    }
  });
});

// ============================================================================
// JSONL persistence (SESS-04)
// ============================================================================

describe('SessionManager -- JSONL Persistence (SESS-04)', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager({ brainstormDir: testDir });
  });

  it('addIdea appends to ideas.jsonl', async () => {
    const session = await manager.createSession('Test problem');
    const idea1 = makeIdea('First idea');
    const idea2 = makeIdea('Second idea');

    await manager.addIdea(session.id, idea1);
    await manager.addIdea(session.id, idea2);

    const ideasPath = join(testDir, 'sessions', session.id, 'ideas.jsonl');
    const content = await readFile(ideasPath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim().length > 0);

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).content).toBe('First idea');
    expect(JSON.parse(lines[1]).content).toBe('Second idea');
  });

  it('addIdea does NOT overwrite ideas.jsonl', async () => {
    const session = await manager.createSession('Test problem');
    const idea1 = makeIdea('Idea alpha');
    const idea2 = makeIdea('Idea beta');

    await manager.addIdea(session.id, idea1);

    const ideasPath = join(testDir, 'sessions', session.id, 'ideas.jsonl');
    const contentAfterFirst = await readFile(ideasPath, 'utf-8');

    await manager.addIdea(session.id, idea2);

    const contentAfterSecond = await readFile(ideasPath, 'utf-8');

    // Second read must still contain the first idea
    expect(contentAfterSecond).toContain('Idea alpha');
    expect(contentAfterSecond).toContain('Idea beta');
    // First read content should be a prefix of second read content
    expect(contentAfterSecond.startsWith(contentAfterFirst)).toBe(true);
  });

  it('addQuestion appends to questions.jsonl', async () => {
    const session = await manager.createSession('Test problem');
    const q1 = makeQuestion('What is the problem?');
    const q2 = makeQuestion('How do we solve it?');

    await manager.addQuestion(session.id, q1);
    await manager.addQuestion(session.id, q2);

    const questionsPath = join(
      testDir,
      'sessions',
      session.id,
      'questions.jsonl',
    );
    const content = await readFile(questionsPath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim().length > 0);

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).content).toBe('What is the problem?');
    expect(JSON.parse(lines[1]).content).toBe('How do we solve it?');
  });

  it('setClusters overwrites clusters.json', async () => {
    const session = await manager.createSession('Test problem');

    const clusterA = [makeCluster('Group A', [randomUUID()])];
    const clusterB = [makeCluster('Group B', [randomUUID()])];

    await manager.setClusters(session.id, clusterA);
    await manager.setClusters(session.id, clusterB);

    const clustersPath = join(
      testDir,
      'sessions',
      session.id,
      'clusters.json',
    );
    const content = await readFile(clustersPath, 'utf-8');
    const parsed = JSON.parse(content);

    // Should contain only clusterB (overwritten, not appended)
    expect(parsed).toHaveLength(1);
    expect(parsed[0].label).toBe('Group B');
  });
});

// ============================================================================
// Timer semantics (SESS-05)
// ============================================================================

describe('SessionManager -- Timer Semantics (SESS-05)', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager({ brainstormDir: testDir });
  });

  it('technique timer set on setActiveTechnique', async () => {
    const session = await manager.createSession('Test problem');
    // rapid-ideation default is 60s = 60_000ms
    await manager.setActiveTechnique(session.id, 'rapid-ideation');

    const updated = await manager.getSession(session.id);
    expect(updated.timer.technique_timer).not.toBeNull();
    expect(updated.timer.technique_timer!.total_ms).toBe(60_000);
    expect(updated.timer.technique_timer!.remaining_ms).toBe(60_000);
  });

  it('pause stores remaining_ms less than total_ms', async () => {
    const session = await manager.createSession('Test problem');
    await manager.setActiveTechnique(session.id, 'rapid-ideation');

    // Wait a small amount of time to ensure elapsed > 0
    await new Promise((resolve) => setTimeout(resolve, 15));

    await manager.pauseSession(session.id);
    const updated = await manager.getSession(session.id);

    expect(updated.timer.technique_timer).not.toBeNull();
    expect(updated.timer.technique_timer!.remaining_ms).toBeLessThan(
      updated.timer.technique_timer!.total_ms,
    );
  });

  it('resume restores remaining_ms', async () => {
    const session = await manager.createSession('Test problem');
    await manager.setActiveTechnique(session.id, 'rapid-ideation');

    // Wait and pause
    await new Promise((resolve) => setTimeout(resolve, 15));
    await manager.pauseSession(session.id);

    const paused = await manager.getSession(session.id);
    const remainingAtPause = paused.timer.technique_timer!.remaining_ms;

    // Resume
    await manager.resumeSession(session.id);
    const resumed = await manager.getSession(session.id);

    expect(resumed.timer.is_paused).toBe(false);
    // remaining_ms should be the same as when paused
    expect(resumed.timer.technique_timer!.remaining_ms).toBe(remainingAtPause);
  });

  it('getSession reads from disk (process-restart simulation)', async () => {
    // Create session with manager A
    const managerA = new SessionManager({ brainstormDir: testDir });
    const session = await managerA.createSession('Test problem');

    // Create new manager B pointing at same brainstormDir
    const managerB = new SessionManager({ brainstormDir: testDir });
    const restored = await managerB.getSession(session.id);

    // Zod validation must pass
    const validated = SessionStateSchema.parse(restored);
    expect(validated.id).toBe(session.id);
    expect(validated.status).toBe('created');
    expect(validated.problem_statement).toBe('Test problem');
  });
});
