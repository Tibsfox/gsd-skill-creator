/**
 * Tests for the queue state machine.
 *
 * Verifies transitionQueueItem validates transitions, returns
 * immutable new entries, and rejects invalid state changes.
 *
 * @module staging/queue/state-machine.test
 */

import { describe, it, expect } from 'vitest';
import { transitionQueueItem } from './state-machine.js';
import type { QueueEntry } from './types.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeEntry(overrides: Partial<QueueEntry> = {}): QueueEntry {
  return {
    id: 'q-20240101-001',
    filename: 'my-skill.md',
    state: 'uploaded',
    milestoneName: 'v1.17 Staging Layer',
    domain: 'authentication',
    tags: ['auth', 'jwt'],
    resourceManifestPath: '.planning/staging/ready/my-skill.md.manifest.json',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// ============================================================================
// Valid transitions
// ============================================================================

describe('transitionQueueItem', () => {
  it('transitions uploaded -> checking successfully', () => {
    const entry = makeEntry({ state: 'uploaded' });
    const result = transitionQueueItem(entry, 'checking');

    expect(result.state).toBe('checking');
    expect(result.id).toBe(entry.id);
    expect(result.filename).toBe(entry.filename);
  });

  it('returns a new QueueEntry with updated state and updatedAt', () => {
    const entry = makeEntry({ state: 'uploaded' });
    const result = transitionQueueItem(entry, 'checking');

    expect(result.state).toBe('checking');
    expect(result.updatedAt).not.toBe(entry.updatedAt);
  });

  it('updatedAt is a valid ISO 8601 timestamp', () => {
    const entry = makeEntry({ state: 'uploaded' });
    const result = transitionQueueItem(entry, 'checking');

    // ISO 8601 pattern check
    expect(result.updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
    );
  });

  it('updatedAt differs from createdAt', () => {
    const entry = makeEntry({
      state: 'uploaded',
      createdAt: '2024-01-01T00:00:00Z',
    });
    const result = transitionQueueItem(entry, 'checking');

    expect(result.updatedAt).not.toBe(result.createdAt);
  });

  // --------------------------------------------------------------------------
  // Invalid transitions
  // --------------------------------------------------------------------------

  it('throws on invalid transition (uploaded -> executing)', () => {
    const entry = makeEntry({ state: 'uploaded' });

    expect(() => transitionQueueItem(entry, 'executing')).toThrow(
      'Invalid queue transition',
    );
  });

  it('throws on same-state transition (checking -> checking)', () => {
    const entry = makeEntry({ state: 'checking' });

    expect(() => transitionQueueItem(entry, 'checking')).toThrow('same state');
  });

  it('throws on terminal state transition (executing -> anything)', () => {
    const entry = makeEntry({ state: 'executing' });

    expect(() => transitionQueueItem(entry, 'uploaded')).toThrow(
      'Invalid queue transition',
    );
  });

  // --------------------------------------------------------------------------
  // Set-aside transitions
  // --------------------------------------------------------------------------

  it('set-aside from uploaded succeeds', () => {
    const entry = makeEntry({ state: 'uploaded' });
    const result = transitionQueueItem(entry, 'set-aside');
    expect(result.state).toBe('set-aside');
  });

  it('set-aside from checking succeeds', () => {
    const entry = makeEntry({ state: 'checking' });
    const result = transitionQueueItem(entry, 'set-aside');
    expect(result.state).toBe('set-aside');
  });

  it('set-aside from ready succeeds', () => {
    const entry = makeEntry({ state: 'ready' });
    const result = transitionQueueItem(entry, 'set-aside');
    expect(result.state).toBe('set-aside');
  });

  it('set-aside from queued succeeds', () => {
    const entry = makeEntry({ state: 'queued' });
    const result = transitionQueueItem(entry, 'set-aside');
    expect(result.state).toBe('set-aside');
  });

  it('set-aside from executing (terminal) throws', () => {
    const entry = makeEntry({ state: 'executing' });

    expect(() => transitionQueueItem(entry, 'set-aside')).toThrow(
      'Invalid queue transition',
    );
  });

  // --------------------------------------------------------------------------
  // Re-enter from set-aside
  // --------------------------------------------------------------------------

  it('re-enter from set-aside -> uploaded succeeds', () => {
    const entry = makeEntry({ state: 'set-aside' });
    const result = transitionQueueItem(entry, 'uploaded');
    expect(result.state).toBe('uploaded');
  });

  // --------------------------------------------------------------------------
  // Immutability
  // --------------------------------------------------------------------------

  it('does not mutate the original entry', () => {
    const entry = makeEntry({ state: 'uploaded' });
    const originalState = entry.state;
    const originalUpdatedAt = entry.updatedAt;

    transitionQueueItem(entry, 'checking');

    expect(entry.state).toBe(originalState);
    expect(entry.updatedAt).toBe(originalUpdatedAt);
  });
});
