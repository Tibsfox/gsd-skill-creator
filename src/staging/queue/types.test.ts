/**
 * Tests for queue type definitions and constants.
 *
 * Verifies QUEUE_STATES, VALID_QUEUE_TRANSITIONS, QueueEntry shape,
 * and QueueAuditEntry shape.
 *
 * @module staging/queue/types.test
 */

import { describe, it, expect } from 'vitest';
import {
  QUEUE_STATES,
  VALID_QUEUE_TRANSITIONS,
} from './types.js';
import type { QueueState, QueueEntry, QueueAuditEntry } from './types.js';

// ============================================================================
// QUEUE_STATES
// ============================================================================

describe('QUEUE_STATES', () => {
  it('contains exactly 7 entries', () => {
    expect(QUEUE_STATES).toHaveLength(7);
  });

  it('contains all expected queue states', () => {
    const expected: QueueState[] = [
      'uploaded',
      'checking',
      'needs-attention',
      'ready',
      'queued',
      'executing',
      'set-aside',
    ];
    expect(QUEUE_STATES).toEqual(expected);
  });
});

// ============================================================================
// VALID_QUEUE_TRANSITIONS
// ============================================================================

describe('VALID_QUEUE_TRANSITIONS', () => {
  it('uploaded -> checking, set-aside', () => {
    expect(VALID_QUEUE_TRANSITIONS['uploaded']).toEqual(['checking', 'set-aside']);
  });

  it('checking -> needs-attention, ready, set-aside', () => {
    expect(VALID_QUEUE_TRANSITIONS['checking']).toEqual([
      'needs-attention',
      'ready',
      'set-aside',
    ]);
  });

  it('needs-attention -> checking, ready, set-aside', () => {
    expect(VALID_QUEUE_TRANSITIONS['needs-attention']).toEqual([
      'checking',
      'ready',
      'set-aside',
    ]);
  });

  it('ready -> queued, set-aside', () => {
    expect(VALID_QUEUE_TRANSITIONS['ready']).toEqual(['queued', 'set-aside']);
  });

  it('queued -> executing, set-aside', () => {
    expect(VALID_QUEUE_TRANSITIONS['queued']).toEqual(['executing', 'set-aside']);
  });

  it('executing is a terminal state with no transitions', () => {
    expect(VALID_QUEUE_TRANSITIONS['executing']).toEqual([]);
  });

  it('set-aside -> uploaded (re-enter pipeline)', () => {
    expect(VALID_QUEUE_TRANSITIONS['set-aside']).toEqual(['uploaded']);
  });
});

// ============================================================================
// QueueEntry shape
// ============================================================================

describe('QueueEntry', () => {
  it('has all required fields', () => {
    const entry: QueueEntry = {
      id: 'q-20240101-001',
      filename: 'my-skill.md',
      state: 'uploaded',
      milestoneName: 'v1.17 Staging Layer',
      domain: 'authentication',
      tags: ['auth', 'jwt'],
      resourceManifestPath: '.planning/staging/ready/my-skill.md.manifest.json',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(entry.id).toBe('q-20240101-001');
    expect(entry.filename).toBe('my-skill.md');
    expect(entry.state).toBe('uploaded');
    expect(entry.milestoneName).toBe('v1.17 Staging Layer');
    expect(entry.domain).toBe('authentication');
    expect(entry.tags).toEqual(['auth', 'jwt']);
    expect(entry.resourceManifestPath).toBe(
      '.planning/staging/ready/my-skill.md.manifest.json',
    );
    expect(entry.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(entry.updatedAt).toBe('2024-01-01T00:00:00Z');
  });
});

// ============================================================================
// QueueAuditEntry shape
// ============================================================================

describe('QueueAuditEntry', () => {
  it('has all required fields', () => {
    const entry: QueueAuditEntry = {
      id: 'audit-20240101-120000-001',
      entryId: 'q-20240101-001',
      action: 'transition',
      fromState: 'uploaded',
      toState: 'checking',
      actor: 'system',
      rationale: 'Auto-transition after upload',
      timestamp: '2024-01-01T12:00:00Z',
    };

    expect(entry.id).toBe('audit-20240101-120000-001');
    expect(entry.entryId).toBe('q-20240101-001');
    expect(entry.action).toBe('transition');
    expect(entry.fromState).toBe('uploaded');
    expect(entry.toState).toBe('checking');
    expect(entry.actor).toBe('system');
    expect(entry.rationale).toBe('Auto-transition after upload');
    expect(entry.timestamp).toBe('2024-01-01T12:00:00Z');
  });

  it('allows null fromState for creation entries', () => {
    const entry: QueueAuditEntry = {
      id: 'audit-20240101-120000-002',
      entryId: 'q-20240101-001',
      action: 'create',
      fromState: null,
      toState: 'uploaded',
      actor: 'user',
      rationale: 'Initial queue entry creation',
      timestamp: '2024-01-01T12:00:00Z',
    };

    expect(entry.fromState).toBeNull();
    expect(entry.toState).toBe('uploaded');
  });
});
