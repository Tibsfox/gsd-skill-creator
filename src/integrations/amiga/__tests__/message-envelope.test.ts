import { describe, it, expect } from 'vitest';
import { EventEnvelopeSchema, createEnvelope } from '../message-envelope.js';
import type { EventEnvelope } from '../message-envelope.js';

describe('EventEnvelopeSchema', () => {
  const validEnvelope = {
    id: 'evt-12345678-abcd-4321-efgh-123456789012',
    timestamp: '2026-02-17T14:30:00Z',
    source: 'ME-1',
    destination: 'MC-1',
    type: 'TELEMETRY_UPDATE',
    priority: 'normal',
    payload: { phase: 'EXECUTION', progress: 0.5 },
    correlation: null,
    requires_ack: false,
  };

  // ---- Valid envelopes ----

  it('accepts a valid complete envelope', () => {
    const result = EventEnvelopeSchema.safeParse(validEnvelope);
    expect(result.success).toBe(true);
  });

  it('accepts envelope with a correlation ID', () => {
    const result = EventEnvelopeSchema.safeParse({
      ...validEnvelope,
      correlation: 'evt-00000000-0000-0000-0000-000000000000',
    });
    expect(result.success).toBe(true);
  });

  it('accepts envelope with broadcast destination', () => {
    const result = EventEnvelopeSchema.safeParse({
      ...validEnvelope,
      destination: 'broadcast',
    });
    expect(result.success).toBe(true);
  });

  it('accepts envelope with any as source', () => {
    const result = EventEnvelopeSchema.safeParse({
      ...validEnvelope,
      source: 'any',
    });
    expect(result.success).toBe(true);
  });

  // ---- Missing required fields ----

  it('rejects envelope missing id', () => {
    const { id: _, ...rest } = validEnvelope;
    const result = EventEnvelopeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects envelope missing timestamp', () => {
    const { timestamp: _, ...rest } = validEnvelope;
    const result = EventEnvelopeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects envelope missing source', () => {
    const { source: _, ...rest } = validEnvelope;
    const result = EventEnvelopeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects envelope missing destination', () => {
    const { destination: _, ...rest } = validEnvelope;
    const result = EventEnvelopeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects envelope missing type', () => {
    const { type: _, ...rest } = validEnvelope;
    const result = EventEnvelopeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects envelope missing priority', () => {
    const { priority: _, ...rest } = validEnvelope;
    const result = EventEnvelopeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects envelope missing payload', () => {
    const { payload: _, ...rest } = validEnvelope;
    const result = EventEnvelopeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects envelope missing requires_ack', () => {
    const { requires_ack: _, ...rest } = validEnvelope;
    const result = EventEnvelopeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ---- Invalid field values ----

  it('rejects invalid timestamp (not ISO 8601 UTC)', () => {
    const result = EventEnvelopeSchema.safeParse({
      ...validEnvelope,
      timestamp: '2026-02-17 14:30:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid priority value', () => {
    const result = EventEnvelopeSchema.safeParse({
      ...validEnvelope,
      priority: 'critical',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid source pattern', () => {
    const result = EventEnvelopeSchema.safeParse({
      ...validEnvelope,
      source: 'bad-agent',
    });
    expect(result.success).toBe(false);
  });

  // ---- Passthrough ----

  it('preserves extra fields via passthrough', () => {
    const extended = { ...validEnvelope, extra_field: 'should survive' };
    const result = EventEnvelopeSchema.safeParse(extended);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).extra_field).toBe('should survive');
    }
  });
});

describe('createEnvelope', () => {
  it('creates a valid envelope with sensible defaults', () => {
    const envelope = createEnvelope({
      source: 'ME-1',
      destination: 'MC-1',
      type: 'TELEMETRY_UPDATE',
      payload: {},
    });

    expect(envelope.id).toBeDefined();
    expect(envelope.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(envelope.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
    expect(envelope.source).toBe('ME-1');
    expect(envelope.destination).toBe('MC-1');
    expect(envelope.type).toBe('TELEMETRY_UPDATE');
    expect(envelope.priority).toBe('normal');
    expect(envelope.correlation).toBeNull();
    expect(envelope.requires_ack).toBe(false);
  });

  it('accepts optional overrides', () => {
    const envelope = createEnvelope({
      source: 'MC-1',
      destination: 'ME-1',
      type: 'COMMAND_DISPATCH',
      payload: { command: 'start' },
      priority: 'urgent',
      requires_ack: true,
    });

    expect(envelope.priority).toBe('urgent');
    expect(envelope.requires_ack).toBe(true);
  });

  it('produces output that validates against EventEnvelopeSchema', () => {
    const envelope = createEnvelope({
      source: 'ME-1',
      destination: 'MC-1',
      type: 'TELEMETRY_UPDATE',
      payload: { phase: 'EXECUTION' },
    });

    const result = EventEnvelopeSchema.safeParse(envelope);
    expect(result.success).toBe(true);
  });
});
