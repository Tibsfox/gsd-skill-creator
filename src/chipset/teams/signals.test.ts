/**
 * Tests for the 32-bit team signal system.
 *
 * Covers bit utility functions (signalBit, testBit, maskOR, maskAND, clearBit)
 * and the TeamSignals class (signal/clear/wait/onSignal/offSignal/reset).
 */

import { describe, it, expect, vi } from 'vitest';
import {
  TeamSignals,
  signalBit,
  testBit,
  maskOR,
  maskAND,
  clearBit,
} from './signals.js';

// ============================================================================
// Bit utility functions
// ============================================================================

describe('signalBit', () => {
  it('creates bitmask with bit 0 set', () => {
    expect(signalBit(0)).toBe(1); // 0x00000001
  });

  it('creates bitmask with bit 15 set', () => {
    expect(signalBit(15)).toBe(0x00008000);
  });

  it('creates bitmask with bit 16 set', () => {
    expect(signalBit(16)).toBe(0x00010000);
  });

  it('creates bitmask with bit 31 set (sign bit handled via >>> 0)', () => {
    expect(signalBit(31)).toBe(0x80000000);
  });

  it('throws RangeError for n < 0', () => {
    expect(() => signalBit(-1)).toThrow(RangeError);
  });

  it('throws RangeError for n > 31', () => {
    expect(() => signalBit(32)).toThrow(RangeError);
  });
});

describe('testBit', () => {
  it('returns true when bit 0 is set in 0xFF', () => {
    expect(testBit(0xff, 0)).toBe(true);
  });

  it('returns false when bit 8 is not set in 0xFF', () => {
    expect(testBit(0xff, 8)).toBe(false);
  });

  it('returns true for a specific bit position via signalBit', () => {
    expect(testBit(signalBit(16), 16)).toBe(true);
  });

  it('returns false when mask is 0', () => {
    expect(testBit(0, 0)).toBe(false);
  });
});

describe('maskOR', () => {
  it('combines two single-bit masks', () => {
    expect(maskOR(signalBit(0), signalBit(1))).toBe(0x00000003);
  });

  it('returns 0 when both operands are 0', () => {
    expect(maskOR(0, 0)).toBe(0);
  });
});

describe('maskAND', () => {
  it('masks off high nibble', () => {
    expect(maskAND(0xff, 0x0f)).toBe(0x0f);
  });

  it('returns same bit when both operands have it set', () => {
    expect(maskAND(signalBit(5), signalBit(5))).toBe(signalBit(5));
  });

  it('returns 0 when operands have different bits set', () => {
    expect(maskAND(signalBit(5), signalBit(6))).toBe(0);
  });
});

describe('clearBit', () => {
  it('clears bit 0 in 0xFF', () => {
    expect(clearBit(0xff, 0)).toBe(0xfe);
  });

  it('clears the only set bit to produce 0', () => {
    expect(clearBit(signalBit(16), 16)).toBe(0);
  });

  it('clearing an unset bit is a no-op', () => {
    expect(clearBit(0, 5)).toBe(0);
  });
});

// ============================================================================
// TeamSignals class
// ============================================================================

describe('TeamSignals', () => {
  describe('initial state', () => {
    it('register starts at 0', () => {
      const signals = new TeamSignals('agnus');
      expect(signals.register).toBe(0);
    });

    it('exposes chipName', () => {
      const signals = new TeamSignals('agnus');
      expect(signals.chipName).toBe('agnus');
    });
  });

  describe('signal(bit)', () => {
    it('sets a bit in the register', () => {
      const signals = new TeamSignals('agnus');
      signals.signal(16);
      expect(testBit(signals.register, 16)).toBe(true);
    });

    it('leaves other bits unset', () => {
      const signals = new TeamSignals('agnus');
      signals.signal(16);
      expect(testBit(signals.register, 17)).toBe(false);
      expect(testBit(signals.register, 0)).toBe(false);
    });

    it('setting an already-set bit is idempotent for the register', () => {
      const signals = new TeamSignals('agnus');
      signals.signal(16);
      const registerBefore = signals.register;
      signals.signal(16);
      expect(signals.register).toBe(registerBefore);
    });

    it('does not double-notify a waiter when bit is already set', async () => {
      const signals = new TeamSignals('agnus');
      const cb = vi.fn();
      signals.onSignal(16, cb);
      signals.signal(16);
      signals.signal(16); // second signal on same bit
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear(bit)', () => {
    it('clears a set bit', () => {
      const signals = new TeamSignals('agnus');
      signals.signal(16);
      signals.clear(16);
      expect(testBit(signals.register, 16)).toBe(false);
    });

    it('does NOT notify waiters', async () => {
      const signals = new TeamSignals('agnus');
      // Set bit 16 and consume waiter
      signals.signal(16);
      // Clear it
      signals.clear(16);

      // Register new waiter
      const cb = vi.fn();
      signals.onSignal(16, cb);

      // Clear should not trigger callback
      signals.clear(16);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('wait(mask)', () => {
    it('returns promise that resolves when matching bit is signaled', async () => {
      const signals = new TeamSignals('agnus');
      const promise = signals.wait(signalBit(16));
      signals.signal(16);
      const result = await promise;
      expect(result).toBe(signalBit(16));
    });

    it('resolves immediately if bit is already set', async () => {
      const signals = new TeamSignals('agnus');
      signals.signal(16);
      const result = await signals.wait(signalBit(16));
      expect(result).toBe(signalBit(16));
    });

    it('multi-bit mask resolves when ANY bit is set', async () => {
      const signals = new TeamSignals('agnus');
      const mask = maskOR(signalBit(16), signalBit(17));
      const promise = signals.wait(mask);
      signals.signal(17);
      const result = await promise;
      expect(result).toBe(signalBit(17));
    });
  });

  describe('multiple waiters', () => {
    it('all waiters on the same bit are notified', async () => {
      const signals = new TeamSignals('agnus');
      const p1 = signals.wait(signalBit(16));
      const p2 = signals.wait(signalBit(16));
      signals.signal(16);
      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1).toBe(signalBit(16));
      expect(r2).toBe(signalBit(16));
    });
  });

  describe('onSignal / offSignal (callback listeners)', () => {
    it('calls callback when bit is signaled', () => {
      const signals = new TeamSignals('agnus');
      const cb = vi.fn();
      signals.onSignal(16, cb);
      signals.signal(16);
      expect(cb).toHaveBeenCalledWith(16);
    });

    it('offSignal removes the listener', () => {
      const signals = new TeamSignals('agnus');
      const cb = vi.fn();
      signals.onSignal(16, cb);
      signals.offSignal(16, cb);
      signals.signal(16);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('system and user bit ranges', () => {
    it('system bit 0 can be signaled and waited on', async () => {
      const signals = new TeamSignals('agnus');
      const promise = signals.wait(signalBit(0));
      signals.signal(0);
      const result = await promise;
      expect(result).toBe(signalBit(0));
    });

    it('user bit 31 (highest) can be signaled and waited on', async () => {
      const signals = new TeamSignals('agnus');
      const promise = signals.wait(signalBit(31));
      signals.signal(31);
      const result = await promise;
      expect(result).toBe(signalBit(31));
    });
  });

  describe('reset()', () => {
    it('clears the register to 0', () => {
      const signals = new TeamSignals('agnus');
      signals.signal(16);
      signals.signal(17);
      signals.signal(0);
      signals.reset();
      expect(signals.register).toBe(0);
    });

    it('rejects pending waiters with reset error', async () => {
      const signals = new TeamSignals('agnus');
      const promise = signals.wait(signalBit(16));
      signals.reset();
      await expect(promise).rejects.toThrow('Signal system reset');
    });

    it('clears all listeners', () => {
      const signals = new TeamSignals('agnus');
      const cb = vi.fn();
      signals.onSignal(16, cb);
      signals.reset();
      // Manually signal after reset -- listener should be gone
      signals.signal(16);
      expect(cb).not.toHaveBeenCalled();
    });
  });
});
