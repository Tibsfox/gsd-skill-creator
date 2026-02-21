/**
 * AGC Block II memory system with bank switching.
 *
 * Erasable (RAM): 2048 words across 8 banks of 256 words each.
 * Fixed (ROM/core rope): 36864 words across 36 banks of 1024 words each.
 *
 * Address map (12-bit, 0o0000-0o7777):
 *   0o0000-0o0017: Register space (handled by register file)
 *   0o0020-0o0377: Unswitched erasable (bank 0)
 *   0o0400-0o0777: EBANK-switched erasable (256 words, bank 0-7)
 *   0o1000-0o1777: Unswitched erasable (addresses 0o1000-0o1777)
 *   0o2000-0o2777: Fixed-fixed bank 02 (always visible)
 *   0o3000-0o3777: Fixed-fixed bank 03 (always visible)
 *   0o4000-0o7777: FBANK-switched fixed (1024-word window, banks 00-37)
 *
 * Purely functional: all write operations return new memory state.
 */

import { WORD15_MASK } from './types.js';

/** Erasable bank count and size. */
const ERASABLE_BANKS = 8;
const ERASABLE_BANK_SIZE = 256;
const ERASABLE_TOTAL = ERASABLE_BANKS * ERASABLE_BANK_SIZE; // 2048

/** Fixed bank count and size. */
const FIXED_BANK_SIZE = 1024;
const FIXED_TOTAL = 36864; // 36 banks * 1024

/** Register space boundary. */
const REGISTER_MAX = 0o0017;

/** Address region boundaries. */
const UNSWITCHED_ERASABLE_END = 0o0377;
const SWITCHED_ERASABLE_START = 0o0400;
const SWITCHED_ERASABLE_END = 0o0777;
const ERASABLE_UPPER_END = 0o1777;
const FIXED_FIXED_02_START = 0o2000;
const FIXED_FIXED_02_END = 0o2777;
const FIXED_FIXED_03_START = 0o3000;
const FIXED_FIXED_03_END = 0o3777;
const FBANK_SWITCHED_START = 0o4000;

/** Immutable memory state. */
export interface AgcMemory {
  readonly erasable: Uint16Array;
  readonly fixed: Uint16Array;
  readonly superbank: number;
}

/** Create zeroed memory. */
export function createMemory(): AgcMemory {
  return {
    erasable: new Uint16Array(ERASABLE_TOTAL),
    fixed: new Uint16Array(FIXED_TOTAL),
    superbank: 0,
  };
}

/** Result of address resolution. */
export interface ResolvedAddress {
  type: 'erasable' | 'fixed' | 'register';
  absolute: number;
}

/**
 * Resolve a 12-bit address + bank registers to an absolute memory location.
 */
export function resolveAddress(
  address: number,
  ebank: number,
  fbank: number,
  superbank: number,
): ResolvedAddress {
  // Register space
  if (address <= REGISTER_MAX) {
    return { type: 'register', absolute: address };
  }

  // Unswitched erasable bank 0 (0o0020-0o0377)
  if (address <= UNSWITCHED_ERASABLE_END) {
    return { type: 'erasable', absolute: address };
  }

  // Switched erasable (0o0400-0o0777) -- EBANK selects bank
  if (address <= SWITCHED_ERASABLE_END) {
    const offset = address - SWITCHED_ERASABLE_START;
    const absolute = ebank * ERASABLE_BANK_SIZE + offset;
    return { type: 'erasable', absolute };
  }

  // Upper unswitched erasable (0o1000-0o1777)
  if (address <= ERASABLE_UPPER_END) {
    return { type: 'erasable', absolute: address };
  }

  // Fixed-fixed bank 02 (0o2000-0o2777)
  if (address <= FIXED_FIXED_02_END) {
    const offset = address - FIXED_FIXED_02_START;
    const absolute = 2 * FIXED_BANK_SIZE + offset;
    return { type: 'fixed', absolute };
  }

  // Fixed-fixed bank 03 (0o3000-0o3777)
  if (address <= FIXED_FIXED_03_END) {
    const offset = address - FIXED_FIXED_03_START;
    const absolute = 3 * FIXED_BANK_SIZE + offset;
    return { type: 'fixed', absolute };
  }

  // FBANK-switched fixed (0o4000-0o7777)
  const offset = address - FBANK_SWITCHED_START;
  let bank = fbank;

  // Superbank: when FBANK >= 0o30, superbank bit selects higher banks
  if (fbank >= 0o30 && superbank === 1) {
    bank = fbank + 4; // Banks 0o30-0o33 become 0o34-0o37
  }

  const absolute = bank * FIXED_BANK_SIZE + offset;
  return { type: 'fixed', absolute };
}

/**
 * Load a rope bank (1024 words) into fixed memory.
 * Returns a new memory state.
 */
export function loadFixed(
  mem: AgcMemory,
  bank: number,
  data: readonly number[],
): AgcMemory {
  const newFixed = new Uint16Array(mem.fixed);
  const baseAddr = bank * FIXED_BANK_SIZE;
  const len = Math.min(data.length, FIXED_BANK_SIZE);
  for (let i = 0; i < len; i++) {
    newFixed[baseAddr + i] = data[i] & WORD15_MASK;
  }
  return {
    erasable: mem.erasable,
    fixed: newFixed,
    superbank: mem.superbank,
  };
}

/**
 * Read a 15-bit word from memory.
 * Register addresses return 0 (register file handles them).
 */
export function readMemory(
  mem: AgcMemory,
  address: number,
  ebank: number,
  fbank: number,
  superbank: number,
): number {
  const resolved = resolveAddress(address, ebank, fbank, superbank);

  switch (resolved.type) {
    case 'register':
      return 0; // Register file handles register reads
    case 'erasable':
      return mem.erasable[resolved.absolute] ?? 0;
    case 'fixed':
      return mem.fixed[resolved.absolute] ?? 0;
  }
}

/**
 * Write a 15-bit word to memory.
 * Returns a new memory state (immutable update).
 * Writes to fixed memory or register addresses are no-ops.
 */
export function writeMemory(
  mem: AgcMemory,
  address: number,
  ebank: number,
  fbank: number,
  value: number,
): AgcMemory {
  const resolved = resolveAddress(address, ebank, fbank, 0);

  // Register space and fixed memory: no-op
  if (resolved.type !== 'erasable') {
    return mem;
  }

  const newErasable = new Uint16Array(mem.erasable);
  newErasable[resolved.absolute] = value & WORD15_MASK;

  return {
    erasable: newErasable,
    fixed: mem.fixed,
    superbank: mem.superbank,
  };
}
