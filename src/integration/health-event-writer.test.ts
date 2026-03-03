import { describe, it, expect } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFile, appendFile } from 'node:fs/promises';
import {
  writeEvent,
  readEvents,
  buildHealthEvent,
  HealthEventWriter,
} from './health-event-writer.js';
import type { WriteEventInput } from './health-event-writer.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uniquePath(): string {
  return join(tmpdir(), `health-log-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`);
}

function makeInput(overrides: Partial<WriteEventInput> = {}): WriteEventInput {
  return {
    eventType: 'audit',
    packageName: 'lodash',
    ecosystem: 'npm',
    packageVersion: '4.17.21',
    decisionRationale: 'Package is healthy with recent activity',
    payload: { classification: 'healthy' },
    projectId: 'project-abc',
    ...overrides,
  };
}

// ─── buildHealthEvent ─────────────────────────────────────────────────────────

describe('buildHealthEvent', () => {
  it('sets id as non-empty string', () => {
    const event = buildHealthEvent(makeInput());
    expect(typeof event.id).toBe('string');
    expect(event.id.length).toBeGreaterThan(0);
  });

  it('sets timestamp as valid ISO 8601', () => {
    const event = buildHealthEvent(makeInput());
    expect(() => new Date(event.timestamp)).not.toThrow();
    expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
  });

  it('copies all WriteEventInput fields', () => {
    const input = makeInput();
    const event = buildHealthEvent(input);
    expect(event.eventType).toBe(input.eventType);
    expect(event.packageName).toBe(input.packageName);
    expect(event.ecosystem).toBe(input.ecosystem);
    expect(event.packageVersion).toBe(input.packageVersion);
    expect(event.decisionRationale).toBe(input.decisionRationale);
    expect(event.payload).toEqual(input.payload);
    expect(event.projectId).toBe(input.projectId);
  });
});

// ─── writeEvent + readEvents ──────────────────────────────────────────────────

describe('writeEvent + readEvents', () => {
  it('writeEvent creates file when it does not exist', async () => {
    const path = uniquePath();
    await writeEvent(path, makeInput());
    const content = await readFile(path, 'utf-8');
    expect(content.trim()).toBeTruthy();
  });

  it('writeEvent creates parent directory when missing', async () => {
    const path = join(tmpdir(), `nested-${Date.now()}`, 'sub', 'health.jsonl');
    await writeEvent(path, makeInput());
    const content = await readFile(path, 'utf-8');
    expect(content.trim()).toBeTruthy();
  });

  it('readEvents returns [] when file does not exist', async () => {
    const path = uniquePath();
    const events = await readEvents(path);
    expect(events).toEqual([]);
  });

  it('writeEvent + readEvents round-trips a complete HealthEvent', async () => {
    const path = uniquePath();
    const input = makeInput({ packageName: 'express', packageVersion: '4.18.0' });
    const written = await writeEvent(path, input);
    const events = await readEvents(path);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(written);
    expect(events[0].packageVersion).toBe('4.18.0');
    expect(events[0].decisionRationale).toBe(input.decisionRationale);
  });

  it('multiple writeEvent calls produce multiple events in order', async () => {
    const path = uniquePath();
    await writeEvent(path, makeInput({ packageName: 'first' }));
    await writeEvent(path, makeInput({ packageName: 'second' }));
    await writeEvent(path, makeInput({ packageName: 'third' }));
    const events = await readEvents(path);
    expect(events.map(e => e.packageName)).toEqual(['first', 'second', 'third']);
  });

  it('readEvents skips corrupt lines without throwing', async () => {
    const path = uniquePath();
    await writeEvent(path, makeInput({ packageName: 'good1' }));
    await appendFile(path, 'not-valid-json\n', 'utf-8');
    await writeEvent(path, makeInput({ packageName: 'good2' }));
    const events = await readEvents(path);
    expect(events).toHaveLength(2);
    expect(events.map(e => e.packageName)).toEqual(['good1', 'good2']);
  });

  it('existing events are never modified (append-only verified by reading twice)', async () => {
    const path = uniquePath();
    await writeEvent(path, makeInput({ packageName: 'immutable' }));
    const before = await readEvents(path);

    await writeEvent(path, makeInput({ packageName: 'new-event' }));
    const after = await readEvents(path);

    expect(after[0]).toEqual(before[0]);
    expect(after).toHaveLength(2);
  });

  it('written event includes INTG-03 provenance fields', async () => {
    const path = uniquePath();
    const event = await writeEvent(path, makeInput({
      packageVersion: '1.2.3',
      decisionRationale: 'Package abandoned — no commits in 3 years',
    }));
    expect(event.timestamp).toBeTruthy();
    expect(event.packageVersion).toBe('1.2.3');
    expect(event.decisionRationale).toBe('Package abandoned — no commits in 3 years');
  });
});

// ─── HealthEventWriter class ──────────────────────────────────────────────────

describe('HealthEventWriter', () => {
  it('write() delegates to writeEvent with configured path', async () => {
    const path = uniquePath();
    const writer = new HealthEventWriter(path);
    const event = await writer.write(makeInput({ packageName: 'class-test' }));
    expect(event.packageName).toBe('class-test');
    const events = await readEvents(path);
    expect(events).toHaveLength(1);
  });

  it('readAll() delegates to readEvents', async () => {
    const path = uniquePath();
    const writer = new HealthEventWriter(path);
    await writer.write(makeInput({ packageName: 'pkg-a' }));
    await writer.write(makeInput({ packageName: 'pkg-b' }));
    const events = await writer.readAll();
    expect(events).toHaveLength(2);
    expect(events.map(e => e.packageName)).toEqual(['pkg-a', 'pkg-b']);
  });
});
