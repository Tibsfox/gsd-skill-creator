/**
 * Tests for SessionLog + ActivationEvent record types.
 */

import { describe, it, expect } from 'vitest';
import {
  ActivityLog,
  SESSION_LOG_TYPE_HASH,
  ACTIVATION_EVENT_TYPE_HASH,
  buildSessionLogRecord,
  buildActivationEventRecord,
  parseSessionLogRecord,
  parseActivationEventRecord,
  type SessionLog,
  type ActivationEvent,
} from './session-activation-view.js';
import { ContentAddressedStore } from '../memory/content-addressed-store.js';
import { RustArena, type InvokeFn, base64ToBytes } from '../memory/rust-arena.js';
import { HASH_ALGO, hashRefEquals, hashRecord, type HashRef, TYPE_RECORD_HASH } from '../memory/grove-format.js';

// ─── Mock arena ─────────────────────────────────────────────────────────────

interface MockChunk {
  tier: string;
  payloadBase64: string;
  payloadSize: number;
  accessCount: number;
  createdAtNs: number;
  lastAccessNs: number;
}

function createMockArena() {
  const chunks = new Map<number, MockChunk>();
  let nextId = 1;
  const invoke: InvokeFn = async (cmd, args) => {
    switch (cmd) {
      case 'arena_init':
        return {
          initialized: true, recovered: false,
          checkpointPath: '/mock', journalPath: '/mock',
          stats: {
            totalSlots: 1024, freeSlots: 1024 - chunks.size,
            allocatedSlots: chunks.size, totalBytes: 0, freeBytes: 0,
            allocatedBytes: 0, nextChunkId: nextId,
          },
        };
      case 'arena_alloc': {
        const { tier, payloadBase64 } = (args as {
          req: { tier: string; payloadBase64: string };
        }).req;
        const id = nextId++;
        chunks.set(id, {
          tier, payloadBase64,
          payloadSize: base64ToBytes(payloadBase64).length,
          accessCount: 0, createdAtNs: id * 1000, lastAccessNs: id * 1000,
        });
        return { chunkId: id };
      }
      case 'arena_get': {
        const { chunkId } = args as { chunkId: number };
        const chunk = chunks.get(chunkId);
        if (!chunk) throw new Error(`not found: ${chunkId}`);
        return { chunkId, ...chunk };
      }
      case 'arena_free': {
        const { chunkId } = args as { chunkId: number };
        if (!chunks.delete(chunkId)) throw new Error(`not found: ${chunkId}`);
        return null;
      }
      case 'arena_touch': return null;
      case 'arena_list_ids':
        return { chunkIds: Array.from(chunks.keys()) };
      case 'arena_checkpoint':
        return {
          checkpointed: true,
          stats: {
            totalSlots: 1024, freeSlots: 1024 - chunks.size,
            allocatedSlots: chunks.size, totalBytes: 0, freeBytes: 0,
            allocatedBytes: 0, nextChunkId: nextId,
          },
        };
      case 'arena_stats':
        return {
          totalSlots: 1024, freeSlots: 1024 - chunks.size,
          allocatedSlots: chunks.size, totalBytes: 0, freeBytes: 0,
          allocatedBytes: 0, nextChunkId: nextId,
        };
      default:
        throw new Error(`unknown command: ${cmd}`);
    }
  };
  return { invoke, size: () => chunks.size };
}

async function buildFixture() {
  const mock = createMockArena();
  const arena = new RustArena(mock.invoke);
  await arena.init({ dir: '/mock', numSlots: 1024 });
  const cas = new ContentAddressedStore({ arena });
  await cas.loadIndex();
  const log = new ActivityLog(cas);
  return { mock, arena, cas, log };
}

const fakeSkillHash: HashRef = {
  algoId: HASH_ALGO.SHA_256,
  hash: new Uint8Array(32).fill(0xab),
};

// ─── Type records ───────────────────────────────────────────────────────────

describe('Type records', () => {
  it('SESSION_LOG_TYPE_HASH is a 32-byte SHA-256', () => {
    expect(SESSION_LOG_TYPE_HASH.algoId).toBe(HASH_ALGO.SHA_256);
    expect(SESSION_LOG_TYPE_HASH.hash.length).toBe(32);
  });

  it('ACTIVATION_EVENT_TYPE_HASH is a 32-byte SHA-256', () => {
    expect(ACTIVATION_EVENT_TYPE_HASH.algoId).toBe(HASH_ALGO.SHA_256);
    expect(ACTIVATION_EVENT_TYPE_HASH.hash.length).toBe(32);
  });

  it('type hashes are distinct from each other and from core Grove types', () => {
    expect(hashRefEquals(SESSION_LOG_TYPE_HASH, ACTIVATION_EVENT_TYPE_HASH)).toBe(false);
    expect(hashRefEquals(SESSION_LOG_TYPE_HASH, TYPE_RECORD_HASH)).toBe(false);
    expect(hashRefEquals(ACTIVATION_EVENT_TYPE_HASH, TYPE_RECORD_HASH)).toBe(false);
  });
});

// ─── SessionLog roundtrip ───────────────────────────────────────────────────

describe('SessionLog', () => {
  const sample: SessionLog = {
    sessionId: 'session-abc-123',
    startedAtMs: 1000,
    endedAtMs: 2000,
    toolVersion: 'gsd-skill-creator/1.50.0',
    activations: [fakeSkillHash],
    summary: 'Built a vision-to-mission skill and ran it once.',
  };

  it('roundtrips through build + parse', () => {
    const record = buildSessionLogRecord(sample);
    expect(hashRefEquals(record.typeHash, SESSION_LOG_TYPE_HASH)).toBe(true);
    const back = parseSessionLogRecord(record);
    expect(back.sessionId).toBe(sample.sessionId);
    expect(back.startedAtMs).toBe(sample.startedAtMs);
    expect(back.endedAtMs).toBe(sample.endedAtMs);
    expect(back.toolVersion).toBe(sample.toolVersion);
    expect(back.activations.length).toBe(1);
    expect(hashRefEquals(back.activations[0], fakeSkillHash)).toBe(true);
    expect(back.summary).toBe(sample.summary);
  });

  it('stores and retrieves via ActivityLog', async () => {
    const { log } = await buildFixture();
    const hash = await log.recordSession(sample);
    const back = await log.getSession(hash);
    expect(back).not.toBeNull();
    expect(back!.sessionId).toBe(sample.sessionId);
  });

  it('handles empty activations list', async () => {
    const { log } = await buildFixture();
    const empty: SessionLog = { ...sample, activations: [] };
    const hash = await log.recordSession(empty);
    const back = await log.getSession(hash);
    expect(back!.activations).toEqual([]);
  });

  it('handles empty summary', async () => {
    const { log } = await buildFixture();
    const nosumm: SessionLog = { ...sample, summary: '' };
    const hash = await log.recordSession(nosumm);
    const back = await log.getSession(hash);
    expect(back!.summary).toBe('');
  });
});

// ─── ActivationEvent roundtrip ──────────────────────────────────────────────

describe('ActivationEvent', () => {
  const sample: ActivationEvent = {
    skillHash: fakeSkillHash,
    firedAtMs: 1500,
    input: 'user wants a mission pack for a forest restoration project',
    output: '# Forest Restoration Mission\n\n## Overview\n...',
    success: true,
    parent: null,
    durationMs: 2300,
    error: '',
  };

  it('roundtrips through build + parse', () => {
    const record = buildActivationEventRecord(sample);
    expect(hashRefEquals(record.typeHash, ACTIVATION_EVENT_TYPE_HASH)).toBe(true);
    const back = parseActivationEventRecord(record);
    expect(back.firedAtMs).toBe(sample.firedAtMs);
    expect(back.input).toBe(sample.input);
    expect(back.output).toBe(sample.output);
    expect(back.success).toBe(true);
    expect(back.parent).toBeNull();
    expect(back.durationMs).toBe(sample.durationMs);
    expect(hashRefEquals(back.skillHash, fakeSkillHash)).toBe(true);
  });

  it('records parent activation for chained invocations', async () => {
    const { log } = await buildFixture();
    const parentHash = await log.recordActivation(sample);
    const child: ActivationEvent = {
      ...sample,
      firedAtMs: sample.firedAtMs + 500,
      input: 'sub-step: refine the mission',
      output: 'refined',
      parent: parentHash,
    };
    const childHash = await log.recordActivation(child);
    const back = await log.getActivation(childHash);
    expect(back).not.toBeNull();
    expect(back!.parent).not.toBeNull();
    expect(hashRefEquals(back!.parent!, parentHash)).toBe(true);
  });

  it('records failure with an error message', async () => {
    const { log } = await buildFixture();
    const fail: ActivationEvent = {
      ...sample,
      success: false,
      error: 'missing API key',
      output: '',
    };
    const hash = await log.recordActivation(fail);
    const back = await log.getActivation(hash);
    expect(back!.success).toBe(false);
    expect(back!.error).toBe('missing API key');
  });
});

// ─── ActivityLog.findActivationsOfSkill ─────────────────────────────────────

describe('ActivityLog.findActivationsOfSkill', () => {
  it('returns every activation for a given skill hash', async () => {
    const { log } = await buildFixture();

    const skill1: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0x11) };
    const skill2: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0x22) };

    await log.recordActivation({
      skillHash: skill1, firedAtMs: 1, input: 'a', output: 'a', success: true, parent: null, durationMs: 10, error: '',
    });
    await log.recordActivation({
      skillHash: skill1, firedAtMs: 2, input: 'b', output: 'b', success: true, parent: null, durationMs: 10, error: '',
    });
    await log.recordActivation({
      skillHash: skill2, firedAtMs: 3, input: 'c', output: 'c', success: true, parent: null, durationMs: 10, error: '',
    });

    const hits1 = await log.findActivationsOfSkill(skill1);
    const hits2 = await log.findActivationsOfSkill(skill2);
    expect(hits1.length).toBe(2);
    expect(hits2.length).toBe(1);

    const hits1Inputs = hits1.map((h) => h.event.input).sort();
    expect(hits1Inputs).toEqual(['a', 'b']);
  });

  it('returns empty for a skill with no activations', async () => {
    const { log } = await buildFixture();
    const skill: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0x99) };
    const hits = await log.findActivationsOfSkill(skill);
    expect(hits).toEqual([]);
  });
});

// ─── End-to-end session replay ──────────────────────────────────────────────

describe('end-to-end session replay', () => {
  it('records a full session with multiple chained activations', async () => {
    const { log } = await buildFixture();

    const skillA: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0xaa) };
    const skillB: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0xbb) };

    // Root activation.
    const rootHash = await log.recordActivation({
      skillHash: skillA,
      firedAtMs: 1000,
      input: 'user request',
      output: 'intermediate output',
      success: true,
      parent: null,
      durationMs: 200,
      error: '',
    });

    // Sub-activation.
    const subHash = await log.recordActivation({
      skillHash: skillB,
      firedAtMs: 1200,
      input: 'sub-step',
      output: 'final output',
      success: true,
      parent: rootHash,
      durationMs: 150,
      error: '',
    });

    // Session log wrapping both.
    const sessionHash = await log.recordSession({
      sessionId: 'e2e-test',
      startedAtMs: 1000,
      endedAtMs: 1400,
      toolVersion: 'e2e/1.0',
      activations: [rootHash, subHash],
      summary: '2 chained activations',
    });

    const session = await log.getSession(sessionHash);
    expect(session).not.toBeNull();
    expect(session!.activations.length).toBe(2);

    // Verify we can walk from session → activations → parent chain.
    const firstActivation = await log.getActivation(session!.activations[0]);
    const secondActivation = await log.getActivation(session!.activations[1]);
    expect(firstActivation!.parent).toBeNull();
    expect(secondActivation!.parent).not.toBeNull();
    expect(hashRefEquals(secondActivation!.parent!, rootHash)).toBe(true);
  });
});
