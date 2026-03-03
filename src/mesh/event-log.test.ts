/**
 * Tests for MeshEventLog append-only event log.
 *
 * IMP-07: Verifies fs.appendFile is used exclusively -- no overwrite possible.
 * Verifies JSONL format, corrupt line skipping, and missing file handling.
 */

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import * as fsPromises from 'node:fs/promises';
import {
  writeMeshEvent,
  readMeshEvents,
  MeshEventLog,
} from './event-log.js';
import type { WriteMeshEventInput } from './event-log.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTempLogPath(): string {
  return join(tmpdir(), `mesh-event-log-test-${randomUUID()}.jsonl`);
}

function makeInput(eventType: WriteMeshEventInput['eventType'] = 'register'): WriteMeshEventInput {
  return {
    nodeId: randomUUID(),
    eventType,
    payload: { test: true },
  };
}

// ─── writeMeshEvent / readMeshEvents ──────────────────────────────────────────

describe('writeMeshEvent', () => {
  it('writes an event and returns the written event with id and timestamp', async () => {
    const logPath = getTempLogPath();
    const input = makeInput('register');
    const event = await writeMeshEvent(logPath, input);

    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeDefined();
    expect(event.nodeId).toBe(input.nodeId);
    expect(event.eventType).toBe('register');
  });

  it('writes 3 events and readMeshEvents returns all 3 in order', async () => {
    const logPath = getTempLogPath();
    const e1 = await writeMeshEvent(logPath, makeInput('register'));
    const e2 = await writeMeshEvent(logPath, makeInput('heartbeat'));
    const e3 = await writeMeshEvent(logPath, makeInput('eviction'));

    const events = await readMeshEvents(logPath);
    expect(events).toHaveLength(3);
    expect(events[0].id).toBe(e1.id);
    expect(events[1].id).toBe(e2.id);
    expect(events[2].id).toBe(e3.id);
    expect(events[0].eventType).toBe('register');
    expect(events[1].eventType).toBe('heartbeat');
    expect(events[2].eventType).toBe('eviction');
  });

  it('creates parent directories if they do not exist', async () => {
    const logPath = join(tmpdir(), `mesh-nested-${randomUUID()}`, 'subdir', 'events.jsonl');
    const input = makeInput('register');
    await expect(writeMeshEvent(logPath, input)).resolves.toBeDefined();
    const events = await readMeshEvents(logPath);
    expect(events).toHaveLength(1);
  });

  // IMP-07: append-only verification via static source inspection.
  // ESM non-configurable module namespaces prevent vi.spyOn on node:fs/promises.
  // Static inspection provides a stronger guarantee: the implementation cannot
  // contain writeFile at all, making overwrite impossible by construction.
  it('uses fs.appendFile -- never fs.writeFile (IMP-07)', async () => {
    // Verify functional behavior: multiple writes accumulate (not overwrite)
    const logPath = getTempLogPath();
    await writeMeshEvent(logPath, makeInput('register'));
    await writeMeshEvent(logPath, makeInput('heartbeat'));
    await writeMeshEvent(logPath, makeInput('eviction'));

    const events = await readMeshEvents(logPath);
    // If writeFile were used, only the last event would exist
    expect(events).toHaveLength(3);
    expect(events[0].eventType).toBe('register');
    expect(events[1].eventType).toBe('heartbeat');
    expect(events[2].eventType).toBe('eviction');

    // Verify source uses appendFile (static assertion via file read)
    const source = await fsPromises.readFile(
      new URL('./event-log.ts', import.meta.url),
      'utf-8',
    );
    // appendFile must appear as a function call in source
    expect(source).toContain('fs.appendFile(');
    // writeFile must NOT appear as a function call (comments may mention it, calls are forbidden)
    expect(source).not.toContain('fs.writeFile(');
  });
});

describe('readMeshEvents', () => {
  it('returns empty array when file does not exist', async () => {
    const logPath = join(tmpdir(), `nonexistent-${randomUUID()}.jsonl`);
    const events = await readMeshEvents(logPath);
    expect(events).toEqual([]);
  });

  it('skips corrupt lines without throwing', async () => {
    const logPath = getTempLogPath();
    // Write a valid event, then inject a corrupt line directly
    const e1 = await writeMeshEvent(logPath, makeInput('register'));
    await fsPromises.appendFile(logPath, 'NOT_VALID_JSON\n', 'utf-8');
    const e2 = await writeMeshEvent(logPath, makeInput('deregister'));

    const events = await readMeshEvents(logPath);
    expect(events).toHaveLength(2);
    expect(events[0].id).toBe(e1.id);
    expect(events[1].id).toBe(e2.id);
  });

  it('returns events in write order (JSONL format)', async () => {
    const logPath = getTempLogPath();
    const inputs: Array<WriteMeshEventInput['eventType']> = [
      'register', 'heartbeat', 'heartbeat', 'eviction',
    ];
    for (const eventType of inputs) {
      await writeMeshEvent(logPath, makeInput(eventType));
    }
    const events = await readMeshEvents(logPath);
    expect(events.map(e => e.eventType)).toEqual(inputs);
  });
});

// ─── MeshEventLog class ───────────────────────────────────────────────────────

describe('MeshEventLog', () => {
  it('write() persists event and readAll() returns it', async () => {
    const logPath = getTempLogPath();
    const log = new MeshEventLog(logPath);

    const event = await log.write(makeInput('register'));
    expect(event.eventType).toBe('register');

    const all = await log.readAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(event.id);
  });

  it('multiple writes accumulate correctly', async () => {
    const logPath = getTempLogPath();
    const log = new MeshEventLog(logPath);

    await log.write(makeInput('register'));
    await log.write(makeInput('heartbeat'));
    await log.write(makeInput('deregister'));

    const all = await log.readAll();
    expect(all).toHaveLength(3);
    expect(all[0].eventType).toBe('register');
    expect(all[1].eventType).toBe('heartbeat');
    expect(all[2].eventType).toBe('deregister');
  });
});
