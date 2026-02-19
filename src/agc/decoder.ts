/**
 * AGC Block II instruction decoder.
 *
 * Translates a 15-bit instruction word into a structured decoded instruction.
 * Handles both basic and extracode instruction sets, special-case
 * instructions, and quarter-code disambiguation for opcodes 2 and 5.
 *
 * Pure function: no side effects.
 */

import { WORD15_MASK } from './types.js';

/** Decoded instruction structure. */
export interface DecodedInstruction {
  mnemonic: string;
  opcode: number;
  quarterCode: number;
  address: number;
  isExtracode: boolean;
}

/** Erasable address boundary: addresses below this are erasable. */
const ERASABLE_BOUNDARY = 0o2000;

/**
 * Decode a 15-bit instruction word into a structured instruction.
 *
 * @param instructionWord - 15-bit AGC instruction word
 * @param extracode - true if EXTEND prefix was active
 */
export function decode(instructionWord: number, extracode: boolean): DecodedInstruction {
  const word = instructionWord & WORD15_MASK;
  const opcode = (word >> 12) & 0o7;
  const address = word & 0o7777; // 12-bit address field
  const quarterCode = (word >> 10) & 0o3; // bits 11-10

  if (extracode) {
    return decodeExtracode(word, opcode, quarterCode, address);
  }
  return decodeBasic(word, opcode, quarterCode, address);
}

/** Decode basic (non-extracode) instruction. */
function decodeBasic(
  word: number,
  opcode: number,
  quarterCode: number,
  address: number,
): DecodedInstruction {
  const base = { opcode, quarterCode, address, isExtracode: false };

  switch (opcode) {
    case 0: {
      // TC family -- special cases by address
      if (address === 0o00003) return { ...base, mnemonic: 'RELINT' };
      if (address === 0o00004) return { ...base, mnemonic: 'INHINT' };
      if (address === 0o00006) return { ...base, mnemonic: 'EXTEND' };
      return { ...base, mnemonic: 'TC' };
    }

    case 1: {
      // CCS (erasable) / TCF (fixed)
      if (address < ERASABLE_BOUNDARY) {
        return { ...base, mnemonic: 'CCS' };
      }
      return { ...base, mnemonic: 'TCF' };
    }

    case 2: {
      // Quarter-code selects: DAS, LXCH, INCR, ADS
      // Effective address is lower 10 bits (bits 9-0), QC bits are opcode extension
      const qcAddr = address & 0o1777;
      const qcBase = { ...base, address: qcAddr };
      switch (quarterCode) {
        case 0: return { ...qcBase, mnemonic: 'DAS' };
        case 1: return { ...qcBase, mnemonic: 'LXCH' };
        case 2: return { ...qcBase, mnemonic: 'INCR' };
        case 3: return { ...qcBase, mnemonic: 'ADS' };
      }
      break;
    }

    case 3:
      return { ...base, mnemonic: 'CA' };

    case 4:
      return { ...base, mnemonic: 'CS' };

    case 5: {
      // Quarter-code selects: INDEX, DXCH, TS, XCH
      // Effective address is lower 10 bits for QC instructions
      const qcAddr = address & 0o1777;
      const qcBase = { ...base, address: qcAddr };
      if (quarterCode === 0) {
        // INDEX uses full 12-bit address (no QC restriction)
        if (address === 0o00017) {
          return { ...base, mnemonic: 'RESUME' };
        }
        return { ...base, mnemonic: 'INDEX' };
      }
      switch (quarterCode) {
        case 1: return { ...qcBase, mnemonic: 'DXCH' };
        case 2: return { ...qcBase, mnemonic: 'TS' };
        case 3: return { ...qcBase, mnemonic: 'XCH' };
      }
      break;
    }

    case 6:
      return { ...base, mnemonic: 'AD' };

    case 7:
      return { ...base, mnemonic: 'MASK' };
  }

  return { ...base, mnemonic: 'UNKNOWN' };
}

/** Decode extracode instruction (after EXTEND). */
function decodeExtracode(
  word: number,
  opcode: number,
  quarterCode: number,
  address: number,
): DecodedInstruction {
  const base = { opcode, quarterCode, address, isExtracode: true };

  switch (opcode) {
    case 0: {
      // I/O instructions: subcode in bits 11-9
      const subcode = (word >> 9) & 0o7;
      const channel = word & 0o777; // 9-bit channel number
      const ioBase = { ...base, address: channel };

      switch (subcode) {
        case 0: return { ...ioBase, mnemonic: 'READ' };
        case 1: return { ...ioBase, mnemonic: 'WRITE' };
        case 2: return { ...ioBase, mnemonic: 'RAND' };
        case 3: return { ...ioBase, mnemonic: 'WAND' };
        case 4: return { ...ioBase, mnemonic: 'ROR' };
        case 5: return { ...ioBase, mnemonic: 'WOR' };
        case 6: return { ...ioBase, mnemonic: 'RXOR' };
        default: return { ...ioBase, mnemonic: 'UNKNOWN_IO' };
      }
    }

    case 1: {
      // DV (erasable) / BZF (fixed)
      if (address < ERASABLE_BOUNDARY) {
        return { ...base, mnemonic: 'DV' };
      }
      return { ...base, mnemonic: 'BZF' };
    }

    case 2: {
      // Quarter-code: MSU, QXCH, AUG, DIM
      const qcAddr = address & 0o1777;
      const qcBase = { ...base, address: qcAddr };
      switch (quarterCode) {
        case 0: return { ...qcBase, mnemonic: 'MSU' };
        case 1: return { ...qcBase, mnemonic: 'QXCH' };
        case 2: return { ...qcBase, mnemonic: 'AUG' };
        case 3: return { ...qcBase, mnemonic: 'DIM' };
      }
      break;
    }

    case 3:
      return { ...base, mnemonic: 'DCA' };

    case 4:
      return { ...base, mnemonic: 'DCS' };

    case 5:
      // Not a standard extracode in Block II
      return { ...base, mnemonic: 'UNKNOWN_EXT5' };

    case 6: {
      // SU (erasable) / BZMF (fixed)
      if (address < ERASABLE_BOUNDARY) {
        return { ...base, mnemonic: 'SU' };
      }
      return { ...base, mnemonic: 'BZMF' };
    }

    case 7:
      return { ...base, mnemonic: 'MP' };
  }

  return { ...base, mnemonic: 'UNKNOWN_EXT' };
}

/**
 * Apply INDEX value to an instruction word.
 * INDEX adds its stored value to the next instruction word BEFORE decoding.
 * This can modify the opcode, address, or both.
 */
export function applyIndex(instructionWord: number, indexValue: number): number {
  return (instructionWord + indexValue) & WORD15_MASK;
}
