/**
 * AGC Block II register file.
 *
 * Purely functional: setRegister() returns a new register state, never mutates.
 * All Block II registers: A (16-bit), L, Q (15-bit), Z (12-bit),
 * EBANK (3-bit), FBANK (5-bit), BB (15-bit composite),
 * BRUPT, CYR, SR, CYL, EDOP (special edit registers).
 */

import {
  RegisterId,
  WORD15_MASK,
  WORD16_MASK,
  ADDRESS12_MASK,
  EBANK_MASK,
  FBANK_MASK,
} from './types.js';

/** Immutable register state. */
export interface AgcRegisters {
  readonly [RegisterId.A]: number;
  readonly [RegisterId.L]: number;
  readonly [RegisterId.Q]: number;
  readonly [RegisterId.Z]: number;
  readonly [RegisterId.EBANK]: number;
  readonly [RegisterId.FBANK]: number;
  readonly [RegisterId.BB]: number;
  readonly [RegisterId.BRUPT]: number;
  readonly [RegisterId.CYR]: number;
  readonly [RegisterId.SR]: number;
  readonly [RegisterId.CYL]: number;
  readonly [RegisterId.EDOP]: number;
}

/** Create a zeroed register file. */
export function createRegisters(): AgcRegisters {
  return {
    [RegisterId.A]: 0,
    [RegisterId.L]: 0,
    [RegisterId.Q]: 0,
    [RegisterId.Z]: 0,
    [RegisterId.EBANK]: 0,
    [RegisterId.FBANK]: 0,
    [RegisterId.BB]: 0,
    [RegisterId.BRUPT]: 0,
    [RegisterId.CYR]: 0,
    [RegisterId.SR]: 0,
    [RegisterId.CYL]: 0,
    [RegisterId.EDOP]: 0,
  };
}

/** Read a register value. */
export function getRegister(regs: AgcRegisters, id: RegisterId): number {
  return regs[id];
}

/**
 * Write a register value, returning a new register state.
 *
 * Handles:
 * - Bit width masking per register
 * - BB <-> EBANK/FBANK synchronization
 * - Edit register operations (CYR, SR, CYL, EDOP)
 */
export function setRegister(
  regs: AgcRegisters,
  id: RegisterId,
  value: number,
): AgcRegisters {
  const next = { ...regs };

  switch (id) {
    case RegisterId.A:
      next[RegisterId.A] = value & WORD16_MASK;
      break;

    case RegisterId.L:
      next[RegisterId.L] = value & WORD15_MASK;
      break;

    case RegisterId.Q:
      next[RegisterId.Q] = value & WORD15_MASK;
      break;

    case RegisterId.Z:
      next[RegisterId.Z] = value & ADDRESS12_MASK;
      break;

    case RegisterId.EBANK: {
      const masked = value & EBANK_MASK;
      next[RegisterId.EBANK] = masked;
      // Sync BB: EBANK occupies bits 0-2 of BB
      next[RegisterId.BB] = (next[RegisterId.FBANK] << 10) | masked;
      break;
    }

    case RegisterId.FBANK: {
      const masked = value & FBANK_MASK;
      next[RegisterId.FBANK] = masked;
      // Sync BB: FBANK occupies bits 10-14 of BB
      next[RegisterId.BB] = (masked << 10) | next[RegisterId.EBANK];
      break;
    }

    case RegisterId.BB: {
      const masked = value & WORD15_MASK;
      next[RegisterId.BB] = masked;
      // Extract and sync EBANK (bits 0-2) and FBANK (bits 10-14)
      next[RegisterId.EBANK] = masked & EBANK_MASK;
      next[RegisterId.FBANK] = (masked >> 10) & FBANK_MASK;
      break;
    }

    case RegisterId.BRUPT:
      next[RegisterId.BRUPT] = value & WORD15_MASK;
      break;

    case RegisterId.CYR: {
      // Cycle Right: bit 0 goes to bit 14, all others shift right by 1
      const v = value & WORD15_MASK;
      const bit0 = v & 1;
      next[RegisterId.CYR] = (v >> 1) | (bit0 << 14);
      break;
    }

    case RegisterId.SR: {
      // Shift Right with sign extension: bit 14 preserved, all others shift right by 1
      const v = value & WORD15_MASK;
      const signBit = v & 0o40000; // bit 14
      next[RegisterId.SR] = (v >> 1) | signBit;
      break;
    }

    case RegisterId.CYL: {
      // Cycle Left: bit 14 goes to bit 0, all others shift left by 1
      const v = value & WORD15_MASK;
      const bit14 = (v >> 14) & 1;
      next[RegisterId.CYL] = ((v << 1) & WORD15_MASK) | bit14;
      break;
    }

    case RegisterId.EDOP: {
      // Edit Opcode: extract bits 14-9 (6 bits) and place in bits 5-0
      const v = value & WORD15_MASK;
      next[RegisterId.EDOP] = (v >> 9) & 0o77; // 6 bits
      break;
    }

    default:
      break;
  }

  return next;
}
