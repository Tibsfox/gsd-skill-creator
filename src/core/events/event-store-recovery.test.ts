/**
 * Queue-recovery tests for EventStore.
 *
 * These tests require vi.mock('node:fs/promises') at module scope, which
 * would prevent the real-filesystem tests in event-store.test.ts from
 * running. Kept in a separate file so both suites can coexist.
 *
 * Covers:
 * - emit() queue heals after an appendFile I/O error
 * - consume() queue heals after a writeFile I/O error
 * - markExpired() queue heals after a writeFile I/O error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EventEntry } from './types.js';

// ----------------------------------------------------------------------------
// Module-level mock — must come before any imports that touch the module
// ----------------------------------------------------------------------------

// Track call counts per function so individual tests can control failure windows
const appendFileCalls = { count: 0, failUntil: 0 };
const writeFileCalls = { count: 0, failUntil: 0 };
const mkdirCalls = { count: 0 };

vi.mock('node:fs/promises', () => {
  return {
    mkdir: vi.fn(async () => { mkdirCalls.count++; }),
    appendFile: vi.fn(async (..._args: unknown[]) => {
      appendFileCalls.count++;
      if (appendFileCalls.count <= appendFileCalls.failUntil) {
        throw new Error('ENOSPC: no space left on device');
      }
    }),
    readFile: vi.fn(async () => ''),
    writeFile: vi.fn(async (..._args: unknown[]) => {
      writeFileCalls.count++;
      if (writeFileCalls.count <= writeFileCalls.failUntil) {
        throw new Error('EIO: i/o error');
      }
    }),
  };
});

// Import after mock so EventStore picks up the mocked module
import { EventStore } from './event-store.js';

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function makeEntry(overrides: Partial<EventEntry> = {}): EventEntry {
  return {
    event_name: 'lint:complete',
    emitted_by: 'eslint-skill',
    status: 'pending',
    emitted_at: new Date().toISOString(),
    consumed_by: null,
    consumed_at: null,
    ttl_hours: 24,
    ...overrides,
  };
}

function resetCounts() {
  appendFileCalls.count = 0;
  appendFileCalls.failUntil = 0;
  writeFileCalls.count = 0;
  writeFileCalls.failUntil = 0;
  mkdirCalls.count = 0;
}

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe('EventStore — write queue recovery', () => {
  let store: EventStore;

  beforeEach(() => {
    resetCounts();
    store = new EventStore('/fake/patterns');
  });

  describe('emit()', () => {
    it('rejects on I/O error and the queue heals for the next emit', async () => {
      // Make the first appendFile call throw
      appendFileCalls.failUntil = 1;

      // First emit must reject with the I/O error
      await expect(store.emit(makeEntry({ event_name: 'fail:event' }))).rejects.toThrow('ENOSPC');

      // Second emit must resolve — queue must have healed
      await expect(store.emit(makeEntry({ event_name: 'recover:event' }))).resolves.toBeUndefined();

      // appendFile was called twice (once failed, once succeeded)
      expect(appendFileCalls.count).toBe(2);
    });

    it('subsequent successful emits continue normally after recovery', async () => {
      appendFileCalls.failUntil = 1;

      await expect(store.emit(makeEntry({ event_name: 'fail:event' }))).rejects.toThrow();
      await store.emit(makeEntry({ event_name: 'a:event' }));
      await store.emit(makeEntry({ event_name: 'b:event' }));
      await store.emit(makeEntry({ event_name: 'c:event' }));

      // 4 total calls: 1 failed + 3 successful
      expect(appendFileCalls.count).toBe(4);
    });
  });

  describe('consume()', () => {
    it('rejects on I/O error and the queue heals for the next consume', async () => {
      // readFile returns empty string by default (no file), so consume returns early
      // Make readFile return a valid line so writeFile is actually called
      const { readFile } = await import('node:fs/promises');
      const validLine = JSON.stringify({
        timestamp: Date.now(),
        category: 'events',
        data: makeEntry({ event_name: 'lint:complete' }),
      }) + '\n';
      vi.mocked(readFile).mockResolvedValue(validLine as any);

      writeFileCalls.failUntil = 1;

      await expect(store.consume('lint:complete', 'reporter')).rejects.toThrow('EIO');
      await expect(store.consume('lint:complete', 'reporter')).resolves.toBeUndefined();

      expect(writeFileCalls.count).toBe(2);
    });
  });

  describe('markExpired()', () => {
    it('rejects on I/O error and the queue heals for the next markExpired', async () => {
      const { readFile } = await import('node:fs/promises');
      const expiredDate = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const validLine = JSON.stringify({
        timestamp: Date.now(),
        category: 'events',
        data: makeEntry({ event_name: 'old:event', emitted_at: expiredDate }),
      }) + '\n';
      vi.mocked(readFile).mockResolvedValue(validLine as any);

      writeFileCalls.failUntil = 1;

      await expect(store.markExpired()).rejects.toThrow('EIO');
      await expect(store.markExpired()).resolves.toBeUndefined();

      expect(writeFileCalls.count).toBe(2);
    });
  });
});
