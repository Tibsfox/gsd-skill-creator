/**
 * 32-bit signal system for the team-as-chip framework.
 *
 * Provides lightweight wake/sleep notification between chips using a 32-bit
 * signal register per team. Setting a bit wakes any listener waiting on that
 * bit via callback or promise-based wait(). Clearing a bit is silent.
 *
 * Bit allocation:
 * - Bits 0-15: system-reserved (chipset kernel signals)
 * - Bits 16-31: user-allocatable (chip-specific signals)
 *
 * All bitwise operations use `>>> 0` to ensure unsigned 32-bit interpretation.
 * JavaScript bitwise operators return signed 32-bit integers; `>>> 0` converts
 * to unsigned. This is essential for bit 31 (the sign bit).
 */

// ============================================================================
// Bit utility functions (pure, no side effects)
// ============================================================================

/**
 * Create a bitmask with bit `n` set.
 *
 * @param n - Bit position (0-31)
 * @returns Unsigned 32-bit mask with only bit `n` set
 * @throws RangeError if n is outside 0-31
 */
export function signalBit(n: number): number {
  if (n < 0 || n > 31) {
    throw new RangeError(`Signal bit must be 0-31, got ${n}`);
  }
  return ((1 << n) >>> 0);
}

/**
 * Test if bit `n` is set in `mask`.
 *
 * @param mask - 32-bit mask to test
 * @param n - Bit position (0-31)
 * @returns true if bit `n` is set
 */
export function testBit(mask: number, n: number): boolean {
  return ((mask >>> 0) & ((1 << n) >>> 0)) !== 0;
}

/**
 * Bitwise OR of two masks.
 *
 * @param a - First mask
 * @param b - Second mask
 * @returns Unsigned 32-bit result of a | b
 */
export function maskOR(a: number, b: number): number {
  return ((a | b) >>> 0);
}

/**
 * Bitwise AND of two masks.
 *
 * @param a - First mask
 * @param b - Second mask
 * @returns Unsigned 32-bit result of a & b
 */
export function maskAND(a: number, b: number): number {
  return ((a & b) >>> 0);
}

/**
 * Clear bit `n` in `mask`.
 *
 * @param mask - 32-bit mask to modify
 * @param n - Bit position to clear (0-31)
 * @returns Unsigned 32-bit mask with bit `n` cleared
 */
export function clearBit(mask: number, n: number): number {
  return ((mask & ~((1 << n) >>> 0)) >>> 0);
}

// ============================================================================
// Waiter type
// ============================================================================

interface SignalWaiter {
  mask: number;
  resolve: (matched: number) => void;
  reject: (err: Error) => void;
}

// ============================================================================
// TeamSignals class
// ============================================================================

/**
 * 32-bit signal register for a chip team.
 *
 * Provides signal/clear/wait/onSignal/offSignal operations for lightweight
 * inter-chip coordination. Setting a signal bit wakes any pending waiters
 * and invokes registered callbacks. Clearing is silent.
 */
export class TeamSignals {
  /** The chip this signal system belongs to. */
  readonly chipName: string;

  /** The 32-bit signal register (internal mutable state). */
  private _register: number = 0;

  /** Pending wait() promises awaiting matching bit signals. */
  private _waiters: SignalWaiter[] = [];

  /** Callback listeners keyed by bit number. */
  private _listeners: Map<number, Array<(bit: number) => void>> = new Map();

  constructor(chipName: string) {
    this.chipName = chipName;
  }

  /** Current value of the 32-bit signal register (unsigned). */
  get register(): number {
    return this._register >>> 0;
  }

  /**
   * Set a signal bit and notify matching waiters and listeners.
   *
   * If the bit is already set, the register is unchanged and no
   * notifications are sent (idempotent). New waiters registered after
   * a bit is already set will resolve immediately via wait().
   *
   * @param bit - Bit position to signal (0-31)
   */
  signal(bit: number): void {
    const mask = signalBit(bit);

    // If bit is already set, skip notification (idempotent)
    if (testBit(this._register, bit)) {
      return;
    }

    // Set the bit
    this._register = ((this._register | mask) >>> 0);

    // Notify matching waiters (one-shot: remove after resolving)
    const remaining: SignalWaiter[] = [];
    for (const waiter of this._waiters) {
      const match = maskAND(waiter.mask, mask);
      if (match !== 0) {
        waiter.resolve(match);
      } else {
        remaining.push(waiter);
      }
    }
    this._waiters = remaining;

    // Notify callback listeners for this bit
    const callbacks = this._listeners.get(bit);
    if (callbacks) {
      for (const cb of callbacks) {
        cb(bit);
      }
    }
  }

  /**
   * Clear a signal bit without notifying anyone.
   *
   * @param bit - Bit position to clear (0-31)
   */
  clear(bit: number): void {
    this._register = clearBit(this._register, bit);
  }

  /**
   * Wait for any bit in `mask` to be set.
   *
   * If any matching bit is already set in the register, resolves immediately.
   * Otherwise returns a promise that resolves when a matching bit is signaled.
   *
   * @param mask - Bitmask of bits to wait on (any bit match resolves)
   * @returns Promise resolving to the matching bits
   */
  wait(mask: number): Promise<number> {
    // Check if any bit in mask is already set
    const match = maskAND(this._register, mask);
    if (match !== 0) {
      return Promise.resolve(match);
    }

    // Otherwise, register a waiter
    return new Promise<number>((resolve, reject) => {
      this._waiters.push({ mask, resolve, reject });
    });
  }

  /**
   * Register a callback listener for a specific bit.
   *
   * @param bit - Bit position to listen on (0-31)
   * @param callback - Function called with the bit number when signaled
   */
  onSignal(bit: number, callback: (bit: number) => void): void {
    let callbacks = this._listeners.get(bit);
    if (!callbacks) {
      callbacks = [];
      this._listeners.set(bit, callbacks);
    }
    callbacks.push(callback);
  }

  /**
   * Remove a callback listener for a specific bit.
   *
   * @param bit - Bit position to stop listening on
   * @param callback - The exact callback reference to remove
   */
  offSignal(bit: number, callback: (bit: number) => void): void {
    const callbacks = this._listeners.get(bit);
    if (!callbacks) return;

    const idx = callbacks.indexOf(callback);
    if (idx !== -1) {
      callbacks.splice(idx, 1);
    }

    // Clean up empty arrays
    if (callbacks.length === 0) {
      this._listeners.delete(bit);
    }
  }

  /**
   * Reset the signal system: clear register, reject pending waiters, clear listeners.
   */
  reset(): void {
    this._register = 0;

    // Reject all pending waiters
    for (const waiter of this._waiters) {
      waiter.reject(new Error('Signal system reset'));
    }
    this._waiters = [];

    // Clear all listeners
    this._listeners.clear();
  }
}
