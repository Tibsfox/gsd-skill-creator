/**
 * Tests for event lifecycle convenience functions.
 *
 * Covers:
 * - emitEvent() creates EventStore and calls emit with constructed EventEntry
 * - consumeEvent() creates EventStore and calls consume
 * - expireStaleEvents() creates EventStore and calls markExpired
 * - emitEvent() validates event_name against emitter's declared emits list
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { emitEvent, consumeEvent, expireStaleEvents } from './event-lifecycle.js';
import { EventStore } from './event-store.js';

// ============================================================================
// Lifecycle helpers
// ============================================================================

describe('event lifecycle helpers', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'event-lifecycle-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // emitEvent()
  // --------------------------------------------------------------------------

  describe('emitEvent()', () => {
    it('creates an event entry with status pending and emitted_at timestamp', async () => {
      await emitEvent(tmpDir, 'lint:complete', 'eslint-skill');

      const store = new EventStore(tmpDir);
      const entries = await store.readAll();
      expect(entries).toHaveLength(1);
      expect(entries[0].event_name).toBe('lint:complete');
      expect(entries[0].emitted_by).toBe('eslint-skill');
      expect(entries[0].status).toBe('pending');
      expect(entries[0].emitted_at).toBeTruthy();
      expect(entries[0].consumed_by).toBeNull();
      expect(entries[0].consumed_at).toBeNull();
      expect(entries[0].ttl_hours).toBe(24);
    });

    it('accepts custom ttlHours option', async () => {
      await emitEvent(tmpDir, 'lint:complete', 'eslint-skill', { ttlHours: 48 });

      const store = new EventStore(tmpDir);
      const entries = await store.readAll();
      expect(entries[0].ttl_hours).toBe(48);
    });

    it('warns but does NOT throw when event_name not in emitter declared emits', async () => {
      const stderrSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // emit 'build:start' but declare only ['lint:complete']
      await emitEvent(tmpDir, 'build:start', 'eslint-skill', {
        skillEvents: { emits: ['lint:complete'] },
      });

      expect(stderrSpy).toHaveBeenCalled();
      expect(stderrSpy.mock.calls[0][0]).toMatch(/build:start/);

      // Event should still be created
      const store = new EventStore(tmpDir);
      const entries = await store.readAll();
      expect(entries).toHaveLength(1);
      expect(entries[0].event_name).toBe('build:start');

      stderrSpy.mockRestore();
    });

    it('does not warn when event_name is in emitter declared emits', async () => {
      const stderrSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await emitEvent(tmpDir, 'lint:complete', 'eslint-skill', {
        skillEvents: { emits: ['lint:complete', 'lint:error'] },
      });

      expect(stderrSpy).not.toHaveBeenCalled();
      stderrSpy.mockRestore();
    });

    it('does not warn when skillEvents is not provided', async () => {
      const stderrSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await emitEvent(tmpDir, 'lint:complete', 'eslint-skill');

      expect(stderrSpy).not.toHaveBeenCalled();
      stderrSpy.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // consumeEvent()
  // --------------------------------------------------------------------------

  describe('consumeEvent()', () => {
    it('delegates to EventStore.consume()', async () => {
      // First emit an event
      await emitEvent(tmpDir, 'lint:complete', 'eslint-skill');

      // Then consume it
      await consumeEvent(tmpDir, 'lint:complete', 'report-skill');

      const store = new EventStore(tmpDir);
      const entries = await store.readAll();
      expect(entries).toHaveLength(1);
      expect(entries[0].status).toBe('consumed');
      expect(entries[0].consumed_by).toBe('report-skill');
    });
  });

  // --------------------------------------------------------------------------
  // expireStaleEvents()
  // --------------------------------------------------------------------------

  describe('expireStaleEvents()', () => {
    it('delegates to EventStore.markExpired()', async () => {
      // Emit an expired event (48 hours ago with 24h TTL)
      const store = new EventStore(tmpDir);
      const expired = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      await store.emit({
        event_name: 'old:event',
        emitted_by: 'skill-a',
        status: 'pending',
        emitted_at: expired,
        consumed_by: null,
        consumed_at: null,
        ttl_hours: 24,
      });

      await expireStaleEvents(tmpDir);

      const entries = await store.readAll();
      expect(entries).toHaveLength(1);
      expect(entries[0].status).toBe('expired');
    });
  });
});
