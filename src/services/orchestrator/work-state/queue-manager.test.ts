/**
 * Tests for the QueueManager class.
 *
 * Covers:
 * - add() creates a new queued task with generated id, returns the created task
 * - add() persists the task (subsequent list() includes it)
 * - add() with skills_needed populates the array
 * - add() with priority sets the priority field
 * - list() returns empty array when no tasks exist
 * - list() returns all queued tasks in order
 * - remove() removes a task by id, returns true
 * - remove() returns false for non-existent id
 * - remove() persists the removal
 * - Works correctly when work state file doesn't exist yet (creates fresh state)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { QueueManager } from './queue-manager.js';

// ============================================================================
// Tests
// ============================================================================

describe('QueueManager', () => {
  let testDir: string;
  let filePath: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gsd-queue-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
    filePath = join(testDir, 'hooks', 'current-work.yaml');
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // add()
  // --------------------------------------------------------------------------

  it('add() creates a new queued task with generated id and returns it', async () => {
    const manager = new QueueManager(filePath);
    const task = await manager.add({ description: 'Build the thing' });

    expect(task).toBeDefined();
    expect(task.id).toBeTruthy();
    expect(typeof task.id).toBe('string');
    expect(task.description).toBe('Build the thing');
    expect(task.created_at).toBeTruthy();
  });

  it('add() persists the task so subsequent list() includes it', async () => {
    const manager = new QueueManager(filePath);
    const task = await manager.add({ description: 'Persisted task' });

    // Create a new manager instance to prove persistence (not just in-memory)
    const manager2 = new QueueManager(filePath);
    const tasks = await manager2.list();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(task.id);
    expect(tasks[0].description).toBe('Persisted task');
  });

  it('add() with skills_needed populates the array', async () => {
    const manager = new QueueManager(filePath);
    const task = await manager.add({
      description: 'Skill task',
      skills_needed: ['typescript', 'vitest'],
    });

    expect(task.skills_needed).toEqual(['typescript', 'vitest']);
  });

  it('add() with priority sets the priority field', async () => {
    const manager = new QueueManager(filePath);
    const task = await manager.add({
      description: 'High priority task',
      priority: 'high',
    });

    expect(task.priority).toBe('high');
  });

  it('add() defaults priority to medium and skills_needed to empty array', async () => {
    const manager = new QueueManager(filePath);
    const task = await manager.add({ description: 'Default task' });

    expect(task.priority).toBe('medium');
    expect(task.skills_needed).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // list()
  // --------------------------------------------------------------------------

  it('list() returns empty array when no tasks exist', async () => {
    const manager = new QueueManager(filePath);
    const tasks = await manager.list();

    expect(tasks).toEqual([]);
  });

  it('list() returns all queued tasks in order', async () => {
    const manager = new QueueManager(filePath);
    const t1 = await manager.add({ description: 'First' });
    const t2 = await manager.add({ description: 'Second' });
    const t3 = await manager.add({ description: 'Third' });

    const tasks = await manager.list();

    expect(tasks).toHaveLength(3);
    expect(tasks[0].id).toBe(t1.id);
    expect(tasks[1].id).toBe(t2.id);
    expect(tasks[2].id).toBe(t3.id);
  });

  // --------------------------------------------------------------------------
  // remove()
  // --------------------------------------------------------------------------

  it('remove() removes a task by id and returns true', async () => {
    const manager = new QueueManager(filePath);
    const task = await manager.add({ description: 'To remove' });

    const result = await manager.remove(task.id);

    expect(result).toBe(true);

    const tasks = await manager.list();
    expect(tasks).toHaveLength(0);
  });

  it('remove() returns false for non-existent id', async () => {
    const manager = new QueueManager(filePath);
    await manager.add({ description: 'Exists' });

    const result = await manager.remove('non-existent-id');

    expect(result).toBe(false);
  });

  it('remove() persists the removal', async () => {
    const manager = new QueueManager(filePath);
    const t1 = await manager.add({ description: 'Stay' });
    const t2 = await manager.add({ description: 'Remove me' });

    await manager.remove(t2.id);

    // Verify with fresh manager instance
    const manager2 = new QueueManager(filePath);
    const tasks = await manager2.list();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(t1.id);
  });

  // --------------------------------------------------------------------------
  // Non-existent file handling
  // --------------------------------------------------------------------------

  it('works correctly when work state file does not exist yet', async () => {
    // filePath points to non-existent directory structure
    const freshPath = join(testDir, 'fresh', 'new', 'current-work.yaml');
    const manager = new QueueManager(freshPath);

    // list() should return empty, not throw
    const emptyList = await manager.list();
    expect(emptyList).toEqual([]);

    // add() should create the file and persist
    const task = await manager.add({ description: 'First ever task' });
    expect(task.id).toBeTruthy();

    // Verify persistence from fresh instance
    const manager2 = new QueueManager(freshPath);
    const tasks = await manager2.list();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].description).toBe('First ever task');
  });
});
