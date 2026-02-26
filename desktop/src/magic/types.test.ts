/**
 * Tests for magic level definitions and event visibility map.
 *
 * Verifies:
 * - MagicLevel enum has exactly 5 values (1-5)
 * - EVENT_VISIBILITY covers all 29 IPC event types
 * - Correct visibility thresholds for each event category
 * - Chat events never require above GUIDED level
 */

import { describe, it, expect } from 'vitest';
import { MagicLevel, EVENT_VISIBILITY } from './types';

describe('MagicLevel enum', () => {
  it('MagicLevel enum has 5 values from 1 to 5', () => {
    expect(MagicLevel.FULL_MAGIC).toBe(1);
    expect(MagicLevel.GUIDED).toBe(2);
    expect(MagicLevel.ANNOTATED).toBe(3);
    expect(MagicLevel.VERBOSE).toBe(4);
    expect(MagicLevel.NO_MAGIC).toBe(5);
  });
});

describe('EVENT_VISIBILITY', () => {
  it('maps all 29 IPC event types', () => {
    expect(Object.keys(EVENT_VISIBILITY).length).toBe(29);
  });

  it('chat:delta visible at FULL_MAGIC', () => {
    expect(EVENT_VISIBILITY['chat:delta']).toBe(MagicLevel.FULL_MAGIC);
  });

  it('chat:complete visible at FULL_MAGIC', () => {
    expect(EVENT_VISIBILITY['chat:complete']).toBe(MagicLevel.FULL_MAGIC);
  });

  it('chat:error visible at FULL_MAGIC', () => {
    expect(EVENT_VISIBILITY['chat:error']).toBe(MagicLevel.FULL_MAGIC);
  });

  it('chat:needs_key visible at FULL_MAGIC', () => {
    expect(EVENT_VISIBILITY['chat:needs_key']).toBe(MagicLevel.FULL_MAGIC);
  });

  it('service:state_change visible at FULL_MAGIC (LED updates)', () => {
    expect(EVENT_VISIBILITY['service:state_change']).toBe(MagicLevel.FULL_MAGIC);
  });

  it('chat:start visible at GUIDED', () => {
    expect(EVENT_VISIBILITY['chat:start']).toBe(MagicLevel.GUIDED);
  });

  it('chat:usage visible at GUIDED', () => {
    expect(EVENT_VISIBILITY['chat:usage']).toBe(MagicLevel.GUIDED);
  });

  it('service:command visible at ANNOTATED', () => {
    expect(EVENT_VISIBILITY['service:command']).toBe(MagicLevel.ANNOTATED);
  });

  it('service:health_check visible at ANNOTATED', () => {
    expect(EVENT_VISIBILITY['service:health_check']).toBe(MagicLevel.ANNOTATED);
  });

  it('service:stdout visible at VERBOSE', () => {
    expect(EVENT_VISIBILITY['service:stdout']).toBe(MagicLevel.VERBOSE);
  });

  it('service:stderr visible at VERBOSE', () => {
    expect(EVENT_VISIBILITY['service:stderr']).toBe(MagicLevel.VERBOSE);
  });

  it('debug:ipc_raw visible only at NO_MAGIC', () => {
    expect(EVENT_VISIBILITY['debug:ipc_raw']).toBe(MagicLevel.NO_MAGIC);
  });

  it('debug:timing visible only at NO_MAGIC', () => {
    expect(EVENT_VISIBILITY['debug:timing']).toBe(MagicLevel.NO_MAGIC);
  });

  it('all chat events are visible at FULL_MAGIC or GUIDED', () => {
    const chatEvents = Object.entries(EVENT_VISIBILITY).filter(([key]) =>
      key.startsWith('chat:'),
    );
    expect(chatEvents.length).toBeGreaterThan(0);
    for (const [key, level] of chatEvents) {
      expect(level, `${key} should be <= GUIDED (2)`).toBeLessThanOrEqual(
        MagicLevel.GUIDED,
      );
    }
  });

  it('no event requires level below FULL_MAGIC', () => {
    for (const [key, level] of Object.entries(EVENT_VISIBILITY)) {
      expect(level, `${key} should be >= 1`).toBeGreaterThanOrEqual(1);
    }
  });
});
