/**
 * Tests for Mesh type schemas.
 *
 * Verifies that MeshNodeSchema, NodeCapabilitySchema, HeartbeatConfigSchema,
 * and MeshEventSchema validate correctly and apply defaults.
 */

import { describe, it, expect } from 'vitest';
import {
  NodeCapabilitySchema,
  MeshNodeSchema,
  HeartbeatConfigSchema,
  MeshEventSchema,
  DEFAULT_HEARTBEAT_INTERVAL_MS,
  MAX_MISSED_HEARTBEATS,
  DEFAULT_CHECK_INTERVAL_MS,
  MESH_EVENT_LOG_VERSION,
} from './types.js';

// ─── Constants ────────────────────────────────────────────────────────────────

describe('constants', () => {
  it('exports DEFAULT_HEARTBEAT_INTERVAL_MS = 30000', () => {
    expect(DEFAULT_HEARTBEAT_INTERVAL_MS).toBe(30000);
  });

  it('exports MAX_MISSED_HEARTBEATS = 3', () => {
    expect(MAX_MISSED_HEARTBEATS).toBe(3);
  });

  it('exports DEFAULT_CHECK_INTERVAL_MS = 10000', () => {
    expect(DEFAULT_CHECK_INTERVAL_MS).toBe(10000);
  });

  it('exports MESH_EVENT_LOG_VERSION = 1', () => {
    expect(MESH_EVENT_LOG_VERSION).toBe(1);
  });
});

// ─── NodeCapabilitySchema ─────────────────────────────────────────────────────

describe('NodeCapabilitySchema', () => {
  const valid = {
    chipName: 'local-llama',
    models: ['llama3', 'mistral'],
    maxContextLength: 8192,
  };

  it('accepts valid NodeCapability', () => {
    expect(() => NodeCapabilitySchema.parse(valid)).not.toThrow();
    const parsed = NodeCapabilitySchema.parse(valid);
    expect(parsed.chipName).toBe('local-llama');
    expect(parsed.models).toEqual(['llama3', 'mistral']);
    expect(parsed.maxContextLength).toBe(8192);
  });

  it('rejects empty chipName', () => {
    expect(() => NodeCapabilitySchema.parse({ ...valid, chipName: '' })).toThrow();
  });

  it('rejects non-positive maxContextLength', () => {
    expect(() => NodeCapabilitySchema.parse({ ...valid, maxContextLength: 0 })).toThrow();
    expect(() => NodeCapabilitySchema.parse({ ...valid, maxContextLength: -1 })).toThrow();
  });

  it('accepts empty models array', () => {
    expect(() => NodeCapabilitySchema.parse({ ...valid, models: [] })).not.toThrow();
  });
});

// ─── MeshNodeSchema ───────────────────────────────────────────────────────────

describe('MeshNodeSchema', () => {
  const validNode = {
    nodeId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'node-alpha',
    endpoint: 'http://localhost:3000',
    capabilities: [
      {
        chipName: 'local-llama',
        models: ['llama3'],
        maxContextLength: 4096,
      },
    ],
    registeredAt: '2026-01-01T00:00:00.000Z',
    lastHeartbeat: '2026-01-01T00:01:00.000Z',
    status: 'healthy' as const,
  };

  it('accepts valid MeshNode', () => {
    expect(() => MeshNodeSchema.parse(validNode)).not.toThrow();
    const parsed = MeshNodeSchema.parse(validNode);
    expect(parsed.nodeId).toBe(validNode.nodeId);
    expect(parsed.status).toBe('healthy');
  });

  it('rejects invalid UUID for nodeId', () => {
    expect(() => MeshNodeSchema.parse({ ...validNode, nodeId: 'not-a-uuid' })).toThrow();
  });

  it('rejects empty name', () => {
    expect(() => MeshNodeSchema.parse({ ...validNode, name: '' })).toThrow();
  });

  it('rejects invalid endpoint URL', () => {
    expect(() => MeshNodeSchema.parse({ ...validNode, endpoint: 'not-a-url' })).toThrow();
  });

  it('rejects invalid status', () => {
    expect(() => MeshNodeSchema.parse({ ...validNode, status: 'pending' })).toThrow();
  });

  it('accepts all valid statuses', () => {
    for (const status of ['healthy', 'unhealthy', 'evicted'] as const) {
      expect(() => MeshNodeSchema.parse({ ...validNode, status })).not.toThrow();
    }
  });

  it('rejects non-datetime registeredAt', () => {
    expect(() => MeshNodeSchema.parse({ ...validNode, registeredAt: 'not-a-date' })).toThrow();
  });
});

// ─── HeartbeatConfigSchema ────────────────────────────────────────────────────

describe('HeartbeatConfigSchema', () => {
  it('applies defaults when empty object provided', () => {
    const parsed = HeartbeatConfigSchema.parse({});
    expect(parsed.intervalMs).toBe(30000);
    expect(parsed.maxMissed).toBe(3);
    expect(parsed.checkIntervalMs).toBe(10000);
  });

  it('accepts custom values', () => {
    const parsed = HeartbeatConfigSchema.parse({
      intervalMs: 5000,
      maxMissed: 5,
      checkIntervalMs: 1000,
    });
    expect(parsed.intervalMs).toBe(5000);
    expect(parsed.maxMissed).toBe(5);
    expect(parsed.checkIntervalMs).toBe(1000);
  });

  it('rejects non-positive intervalMs', () => {
    expect(() => HeartbeatConfigSchema.parse({ intervalMs: 0 })).toThrow();
    expect(() => HeartbeatConfigSchema.parse({ intervalMs: -1 })).toThrow();
  });

  it('rejects non-integer intervalMs', () => {
    expect(() => HeartbeatConfigSchema.parse({ intervalMs: 1.5 })).toThrow();
  });

  it('rejects non-positive maxMissed', () => {
    expect(() => HeartbeatConfigSchema.parse({ maxMissed: 0 })).toThrow();
  });
});

// ─── MeshEventSchema ──────────────────────────────────────────────────────────

describe('MeshEventSchema', () => {
  const validEvent = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    timestamp: '2026-01-01T00:00:00.000Z',
    nodeId: 'some-node-id',
    eventType: 'register' as const,
    payload: { name: 'node-alpha' },
  };

  it('accepts valid MeshEvent', () => {
    expect(() => MeshEventSchema.parse(validEvent)).not.toThrow();
    const parsed = MeshEventSchema.parse(validEvent);
    expect(parsed.eventType).toBe('register');
  });

  it('accepts all valid event types', () => {
    const types = ['register', 'deregister', 'heartbeat', 'eviction', 'health-change'] as const;
    for (const eventType of types) {
      expect(() => MeshEventSchema.parse({ ...validEvent, eventType })).not.toThrow();
    }
  });

  it('rejects invalid event type', () => {
    expect(() => MeshEventSchema.parse({ ...validEvent, eventType: 'unknown' })).toThrow();
  });

  it('rejects invalid UUID for id', () => {
    expect(() => MeshEventSchema.parse({ ...validEvent, id: 'bad-id' })).toThrow();
  });

  it('rejects non-datetime timestamp', () => {
    expect(() => MeshEventSchema.parse({ ...validEvent, timestamp: 'bad-ts' })).toThrow();
  });

  it('accepts empty payload', () => {
    expect(() => MeshEventSchema.parse({ ...validEvent, payload: {} })).not.toThrow();
  });
});
