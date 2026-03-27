/**
 * Tests for Dolt Commons Scanner — commit parsing, branch extraction, checkpoint.
 */

import { describe, it, expect } from 'vitest';
import {
  extractAgentFromBranch,
  parseCommitMessage,
  createInitialCheckpoint,
} from '../dolt-scanner.js';

describe('extractAgentFromBranch', () => {
  it('extracts agent ID from branch pattern', () => {
    expect(extractAgentFromBranch('agent/cedar/task-123')).toBe('cedar');
  });

  it('returns unknown for non-matching branch', () => {
    expect(extractAgentFromBranch('main')).toBe('unknown');
  });

  it('handles branch with extra segments', () => {
    expect(extractAgentFromBranch('agent/hemlock/task-456/subtask')).toBe('hemlock');
  });
});

describe('parseCommitMessage', () => {
  it('parses claim message', () => {
    const event = parseCommitMessage('claim: task-001 by cedar in town-alpha', 'main', '2026-03-27T00:00:00Z');
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('task-claimed');
    expect(event!.taskId).toBe('task-001');
    expect(event!.agentId).toBe('cedar');
    expect(event!.townId).toBe('town-alpha');
  });

  it('parses complete message', () => {
    const event = parseCommitMessage('complete: task-002 quality=0.95 duration=120s', 'agent/lex/task-002', '2026-03-27T00:00:00Z');
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('task-completed');
    expect(event!.taskId).toBe('task-002');
    expect(event!.metadata?.quality).toBe(0.95);
    expect(event!.metadata?.duration).toBe(120);
  });

  it('parses fail message', () => {
    const event = parseCommitMessage('fail: task-003 reason=timeout', 'agent/sam/task-003', '2026-03-27T00:00:00Z');
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('task-failed');
    expect(event!.metadata?.reason).toBe('timeout');
  });

  it('parses transfer message', () => {
    const event = parseCommitMessage('transfer: task-004 from town-a to town-b agent=foxy', 'main', '2026-03-27T00:00:00Z');
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('task-transferred');
    expect(event!.metadata?.fromTown).toBe('town-a');
    expect(event!.metadata?.toTown).toBe('town-b');
  });

  it('parses post message', () => {
    const event = parseCommitMessage('post: task-005 in town-beta', 'agent/willow/task-005', '2026-03-27T00:00:00Z');
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('task-posted');
    expect(event!.townId).toBe('town-beta');
  });

  it('returns null for unrecognized messages', () => {
    expect(parseCommitMessage('random commit message', 'main', '2026-03-27T00:00:00Z')).toBeNull();
  });

  it('is case insensitive', () => {
    const event = parseCommitMessage('CLAIM: task-001 by cedar in town-a', 'main', '2026-03-27T00:00:00Z');
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe('task-claimed');
  });
});

describe('createInitialCheckpoint', () => {
  it('creates empty checkpoint state', () => {
    const cp = createInitialCheckpoint();
    expect(cp.lastCommitHash).toBe('');
    expect(cp.eventsProcessed).toBe(0);
    expect(cp.lastScanTimestamp).toBeTruthy();
  });
});
