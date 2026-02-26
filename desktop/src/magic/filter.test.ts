/**
 * Tests for MagicFilter: shouldRender and transform at all level boundaries.
 *
 * Verifies:
 * - Default level is ANNOTATED (3)
 * - Chat events pass through at all levels (never filtered)
 * - Level 1 filters all non-chat text events
 * - Level 5 passes everything including debug
 * - Transform produces correct renderMode per level
 */

import { describe, it, expect } from 'vitest';
import { MagicFilter } from './filter';
import { MagicLevel, EVENT_VISIBILITY } from './types';

describe('MagicFilter', () => {
  it('default level is ANNOTATED (3)', () => {
    const filter = new MagicFilter();
    expect(filter.getLevel()).toBe(MagicLevel.ANNOTATED);
  });

  it('constructor accepts initial level', () => {
    const filter = new MagicFilter(MagicLevel.VERBOSE);
    expect(filter.getLevel()).toBe(MagicLevel.VERBOSE);
  });

  it('setLevel changes current level', () => {
    const filter = new MagicFilter();
    filter.setLevel(MagicLevel.FULL_MAGIC);
    expect(filter.getLevel()).toBe(MagicLevel.FULL_MAGIC);
  });

  describe('shouldRender', () => {
    it('returns true for chat:delta at level 1', () => {
      const filter = new MagicFilter(MagicLevel.FULL_MAGIC);
      expect(filter.shouldRender('chat:delta')).toBe(true);
    });

    it('returns true for chat:complete at level 1', () => {
      const filter = new MagicFilter(MagicLevel.FULL_MAGIC);
      expect(filter.shouldRender('chat:complete')).toBe(true);
    });

    it('returns true for chat:error at level 1', () => {
      const filter = new MagicFilter(MagicLevel.FULL_MAGIC);
      expect(filter.shouldRender('chat:error')).toBe(true);
    });

    it('returns true for chat:needs_key at level 1', () => {
      const filter = new MagicFilter(MagicLevel.FULL_MAGIC);
      expect(filter.shouldRender('chat:needs_key')).toBe(true);
    });

    it('returns true for service:state_change at level 1 (LED)', () => {
      const filter = new MagicFilter(MagicLevel.FULL_MAGIC);
      expect(filter.shouldRender('service:state_change')).toBe(true);
    });

    it('returns false for service:stdout at level 1', () => {
      const filter = new MagicFilter(MagicLevel.FULL_MAGIC);
      expect(filter.shouldRender('service:stdout')).toBe(false);
    });

    it('returns false for service:command at level 1', () => {
      const filter = new MagicFilter(MagicLevel.FULL_MAGIC);
      expect(filter.shouldRender('service:command')).toBe(false);
    });

    it('returns false for debug:ipc_raw at level 4', () => {
      const filter = new MagicFilter(MagicLevel.VERBOSE);
      expect(filter.shouldRender('debug:ipc_raw')).toBe(false);
    });

    it('returns true for debug:ipc_raw at level 5', () => {
      const filter = new MagicFilter(MagicLevel.NO_MAGIC);
      expect(filter.shouldRender('debug:ipc_raw')).toBe(true);
    });

    it('returns true for debug:timing at level 5', () => {
      const filter = new MagicFilter(MagicLevel.NO_MAGIC);
      expect(filter.shouldRender('debug:timing')).toBe(true);
    });

    it('returns true for service:stdout at level 4', () => {
      const filter = new MagicFilter(MagicLevel.VERBOSE);
      expect(filter.shouldRender('service:stdout')).toBe(true);
    });

    it('returns true for service:health_check at level 3', () => {
      const filter = new MagicFilter(MagicLevel.ANNOTATED);
      expect(filter.shouldRender('service:health_check')).toBe(true);
    });

    it('returns false for service:health_check at level 2', () => {
      const filter = new MagicFilter(MagicLevel.GUIDED);
      expect(filter.shouldRender('service:health_check')).toBe(false);
    });

    it('unknown event defaults to ANNOTATED level', () => {
      const filter3 = new MagicFilter(MagicLevel.ANNOTATED);
      expect(filter3.shouldRender('some:unknown_event')).toBe(true);

      const filter2 = new MagicFilter(MagicLevel.GUIDED);
      expect(filter2.shouldRender('some:unknown_event')).toBe(false);
    });
  });

  describe('transform', () => {
    it('returns null for filtered events', () => {
      const filter = new MagicFilter(MagicLevel.FULL_MAGIC);
      const result = filter.transform({
        type: 'service:stdout',
        payload: {},
      });
      expect(result).toBeNull();
    });

    it('returns DisplayEvent for visible events', () => {
      const filter = new MagicFilter(MagicLevel.ANNOTATED);
      const result = filter.transform({
        type: 'chat:delta',
        payload: { conversation_id: 'a', delta: 'hi', index: 0 },
      });
      expect(result).not.toBeNull();
      expect(result!.renderMode).toBeDefined();
    });

    it('at level 1 returns visual renderMode for non-chat events', () => {
      const filter = new MagicFilter(MagicLevel.FULL_MAGIC);
      const result = filter.transform({
        type: 'service:state_change',
        payload: {
          service_id: 's',
          from_status: 'offline',
          to_status: 'online',
          led_color: 'green',
        },
      });
      expect(result).not.toBeNull();
      expect(result!.renderMode).toBe('visual');
    });

    it('at level 1 returns text renderMode for chat events', () => {
      const filter = new MagicFilter(MagicLevel.FULL_MAGIC);
      const result = filter.transform({
        type: 'chat:delta',
        payload: { conversation_id: 'a', delta: 'hi', index: 0 },
      });
      expect(result).not.toBeNull();
      expect(result!.renderMode).toBe('text');
    });

    it('at level 5 sets showRaw to true', () => {
      const filter = new MagicFilter(MagicLevel.NO_MAGIC);
      const result = filter.transform({
        type: 'debug:ipc_raw',
        payload: { direction: 'send', command: 'test', payload: {} },
      });
      expect(result).not.toBeNull();
      expect(result!.showRaw).toBe(true);
    });

    it('at level 4 does not set showRaw', () => {
      const filter = new MagicFilter(MagicLevel.VERBOSE);
      const result = filter.transform({
        type: 'service:stdout',
        payload: { service_id: 's', line: 'output' },
      });
      expect(result).not.toBeNull();
      expect(result!.showRaw).toBeFalsy();
    });

    it('level 1 produces zero non-chat text renders', () => {
      const filter = new MagicFilter(MagicLevel.FULL_MAGIC);
      for (const [eventType] of Object.entries(EVENT_VISIBILITY)) {
        if (eventType.startsWith('chat:')) continue;
        const result = filter.transform({ type: eventType, payload: {} });
        if (result !== null) {
          expect(
            result.renderMode,
            `${eventType} at level 1 should not render as text`,
          ).toBe('visual');
        }
      }
    });

    it('setLevel emits no side effects without persistence layer', () => {
      const filter = new MagicFilter();
      expect(() => {
        filter.setLevel(MagicLevel.NO_MAGIC);
        filter.setLevel(MagicLevel.FULL_MAGIC);
      }).not.toThrow();
    });
  });
});
