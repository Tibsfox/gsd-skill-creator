/**
 * Tests for EventStore JSONL append-log.
 *
 * Covers:
 * - emit() creates events.jsonl in patternsDir with pattern envelope format
 * - emit() creates patternsDir if it does not exist (mkdir recursive)
 * - readAll() returns empty array when file does not exist
 * - readAll() parses all valid lines, skips corrupted JSON lines
 * - readAll() validates each entry through EventEntrySchema.safeParse
 * - getPending() returns only entries with status: 'pending' not exceeding TTL
 * - getPending() filters out entries whose TTL has expired
 * - consume() marks matching pending event as consumed
 * - consume() only consumes the first matching pending event
 * - markExpired() rewrites file setting all TTL-exceeded pending events to expired
 * - Write serialization: concurrent emit() calls don't corrupt the file
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { EventStore } from './event-store.js';
import type { EventEntry } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

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

// ============================================================================
// EventStore
// ============================================================================

describe('EventStore', () => {
  let tmpDir: string;
  let store: EventStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'event-store-'));
    store = new EventStore(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // emit()
  // --------------------------------------------------------------------------

  describe('emit()', () => {
    it('creates events.jsonl with pattern envelope format', async () => {
      const entry = makeEntry();
      await store.emit(entry);

      const content = await readFile(join(tmpDir, 'events.jsonl'), 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(1);

      const envelope = JSON.parse(lines[0]);
      expect(envelope.timestamp).toBeDefined();
      expect(typeof envelope.timestamp).toBe('number');
      expect(envelope.category).toBe('events');
      expect(envelope.data.event_name).toBe('lint:complete');
      expect(envelope.data.emitted_by).toBe('eslint-skill');
      expect(envelope.data.status).toBe('pending');
    });

    it('creates patternsDir if it does not exist', async () => {
      const nestedDir = join(tmpDir, 'nested', 'deep', 'dir');
      const nestedStore = new EventStore(nestedDir);
      await nestedStore.emit(makeEntry());

      const entries = await nestedStore.readAll();
      expect(entries).toHaveLength(1);
    });

    it('appends multiple entries as separate lines', async () => {
      await store.emit(makeEntry({ event_name: 'lint:complete' }));
      await store.emit(makeEntry({ event_name: 'test:fail' }));
      await store.emit(makeEntry({ event_name: 'build:start' }));

      const content = await readFile(join(tmpDir, 'events.jsonl'), 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(3);
    });
  });

  // --------------------------------------------------------------------------
  // readAll()
  // --------------------------------------------------------------------------

  describe('readAll()', () => {
    it('returns empty array when file does not exist', async () => {
      const freshStore = new EventStore(join(tmpDir, 'nonexistent'));
      const entries = await freshStore.readAll();
      expect(entries).toEqual([]);
    });

    it('parses all valid lines, skips corrupted JSON lines', async () => {
      const filePath = join(tmpDir, 'events.jsonl');
      const validEnvelope = JSON.stringify({
        timestamp: Date.now(),
        category: 'events',
        data: makeEntry(),
      });

      await appendFile(filePath, validEnvelope + '\n', 'utf-8');
      await appendFile(filePath, 'this is not valid json\n', 'utf-8');
      await appendFile(filePath, validEnvelope + '\n', 'utf-8');

      const entries = await store.readAll();
      expect(entries).toHaveLength(2);
    });

    it('validates each entry through EventEntrySchema.safeParse', async () => {
      const filePath = join(tmpDir, 'events.jsonl');

      // Valid entry
      const valid = JSON.stringify({
        timestamp: Date.now(),
        category: 'events',
        data: makeEntry(),
      });

      // Invalid entry (bad event_name format)
      const invalid = JSON.stringify({
        timestamp: Date.now(),
        category: 'events',
        data: { event_name: 'BadName', emitted_by: 'skill', status: 'pending', emitted_at: new Date().toISOString() },
      });

      await appendFile(filePath, valid + '\n', 'utf-8');
      await appendFile(filePath, invalid + '\n', 'utf-8');

      const entries = await store.readAll();
      expect(entries).toHaveLength(1);
      expect(entries[0].event_name).toBe('lint:complete');
    });
  });

  // --------------------------------------------------------------------------
  // getPending()
  // --------------------------------------------------------------------------

  describe('getPending()', () => {
    it('returns only entries with status pending', async () => {
      await store.emit(makeEntry({ status: 'pending', event_name: 'lint:complete' }));
      await store.emit(makeEntry({ status: 'consumed', event_name: 'test:fail', consumed_by: 'reporter', consumed_at: new Date().toISOString() }));
      await store.emit(makeEntry({ status: 'expired', event_name: 'build:start' }));

      const pending = await store.getPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].event_name).toBe('lint:complete');
    });

    it('filters out entries whose TTL has expired', async () => {
      // Emit an event with emitted_at 25 hours ago and ttl_hours 24
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
      await store.emit(makeEntry({
        event_name: 'old:event',
        emitted_at: twentyFiveHoursAgo,
        ttl_hours: 24,
      }));

      // Emit a fresh event
      await store.emit(makeEntry({
        event_name: 'fresh:event',
        emitted_at: new Date().toISOString(),
        ttl_hours: 24,
      }));

      const pending = await store.getPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].event_name).toBe('fresh:event');
    });

    it('returns empty array when all pending events have expired TTL', async () => {
      const expired = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      await store.emit(makeEntry({ emitted_at: expired, ttl_hours: 24 }));

      const pending = await store.getPending();
      expect(pending).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // consume()
  // --------------------------------------------------------------------------

  describe('consume()', () => {
    it('marks matching pending event as consumed with consumer name and timestamp', async () => {
      await store.emit(makeEntry({ event_name: 'lint:complete' }));

      await store.consume('lint:complete', 'report-skill');

      const entries = await store.readAll();
      expect(entries).toHaveLength(1);
      expect(entries[0].status).toBe('consumed');
      expect(entries[0].consumed_by).toBe('report-skill');
      expect(entries[0].consumed_at).toBeTruthy();
    });

    it('only consumes the first matching pending event', async () => {
      await store.emit(makeEntry({ event_name: 'lint:complete', emitted_by: 'skill-a' }));
      await store.emit(makeEntry({ event_name: 'lint:complete', emitted_by: 'skill-b' }));

      await store.consume('lint:complete', 'report-skill');

      const entries = await store.readAll();
      expect(entries).toHaveLength(2);

      const consumed = entries.filter(e => e.status === 'consumed');
      const pending = entries.filter(e => e.status === 'pending');
      expect(consumed).toHaveLength(1);
      expect(pending).toHaveLength(1);
      expect(consumed[0].emitted_by).toBe('skill-a');
      expect(pending[0].emitted_by).toBe('skill-b');
    });

    it('does nothing if no matching pending event exists', async () => {
      await store.emit(makeEntry({ event_name: 'test:fail' }));

      await store.consume('lint:complete', 'report-skill');

      const entries = await store.readAll();
      expect(entries).toHaveLength(1);
      expect(entries[0].status).toBe('pending');
      expect(entries[0].event_name).toBe('test:fail');
    });
  });

  // --------------------------------------------------------------------------
  // markExpired()
  // --------------------------------------------------------------------------

  describe('markExpired()', () => {
    it('sets TTL-exceeded pending events to expired status', async () => {
      const expired = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      await store.emit(makeEntry({ event_name: 'old:event', emitted_at: expired, ttl_hours: 24 }));
      await store.emit(makeEntry({ event_name: 'fresh:event', emitted_at: new Date().toISOString(), ttl_hours: 24 }));

      await store.markExpired();

      const entries = await store.readAll();
      expect(entries).toHaveLength(2);

      const oldEntry = entries.find(e => e.event_name === 'old:event');
      const freshEntry = entries.find(e => e.event_name === 'fresh:event');

      expect(oldEntry?.status).toBe('expired');
      expect(freshEntry?.status).toBe('pending');
    });

    it('does not mark already-consumed events as expired', async () => {
      const expired = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      await store.emit(makeEntry({
        event_name: 'old:consumed',
        emitted_at: expired,
        ttl_hours: 24,
        status: 'consumed',
        consumed_by: 'skill-x',
        consumed_at: new Date().toISOString(),
      }));

      await store.markExpired();

      const entries = await store.readAll();
      expect(entries[0].status).toBe('consumed');
    });

    it('handles empty file gracefully', async () => {
      await store.markExpired();
      const entries = await store.readAll();
      expect(entries).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Write serialization
  // --------------------------------------------------------------------------

  describe('write serialization', () => {
    it('concurrent emit() calls do not corrupt the file', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        store.emit(makeEntry({ event_name: `test:event-${i}` as `test:event-${number}` })),
      );
      await Promise.all(promises);

      const entries = await store.readAll();
      expect(entries).toHaveLength(10);
    });
  });
});
