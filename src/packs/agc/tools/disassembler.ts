/**
 * AGC Block II disassembler.
 *
 * Converts binary instruction words, memory banks, and full rope images
 * into human-readable assembly listings. Uses the decoder for instruction
 * word -> mnemonic mapping and resolveAddress for bank-switched addresses.
 *
 * Pure functional where possible.
 */

import type { DecodedInstruction } from '../decoder.js';
import { decode } from '../decoder.js';

// ─── Types ─────────────────────────────────────────────────────────────────

/** A single disassembled instruction with full metadata. */
export interface DisassembledInstruction {
  address: number;
  word: number;
  mnemonic: string;
  operand: string;
  rawDecoded: DecodedInstruction;
  isExtracode: boolean;
}

// ─── Register Name Table ───────────────────────────────────────────────────

/** Register names for addresses 0-12. */
const REGISTER_NAMES: Record<number, string> = {
  0: 'A',
  1: 'L',
  2: 'Q',
  3: 'Z',
  4: 'EBANK',
  5: 'FBANK',
  6: 'BB',
  7: 'ZRUPT',
  8: 'BRUPT',
  9: 'CYR',
  10: 'SR',
  11: 'CYL',
  12: 'EDOP',
};

// ─── I/O instruction subcodes ──────────────────────────────────────────────

const IO_MNEMONICS = new Set([
  'READ', 'WRITE', 'RAND', 'WAND', 'ROR', 'WOR', 'RXOR',
]);

// ─── Formatting ────────────────────────────────────────────────────────────

/**
 * Format an address as octal with optional bank annotation.
 *
 * For FBANK-switched addresses (>= 0o4000): show as `BB,NNNN` when bank is provided.
 * For switched erasable (0o0400-0o0777): show as `E{bank},{offset}` when ebank provided.
 * Otherwise: plain octal.
 */
export function formatAddress(address: number, bank?: number): string {
  const octal = address.toString(8).padStart(5, '0');

  if (bank !== undefined && address >= 0o4000) {
    const bankStr = bank.toString(8).padStart(2, '0');
    return `${bankStr},${octal}`;
  }

  return octal;
}

// ─── Word-Level Disassembly ────────────────────────────────────────────────

/**
 * Disassemble a single 15-bit instruction word.
 *
 * Uses decode() for mnemonic identification, then formats the operand
 * based on instruction type (branch target, register name, channel, etc.).
 */
export function disassembleWord(
  word: number,
  extracode: boolean,
  address?: number,
  _ebank?: number,
  _fbank?: number,
): DisassembledInstruction {
  const decoded = decode(word, extracode);
  const operand = formatOperand(decoded);

  return {
    address: address ?? 0,
    word,
    mnemonic: decoded.mnemonic,
    operand,
    rawDecoded: decoded,
    isExtracode: extracode,
  };
}

/**
 * Format the operand string for a decoded instruction.
 */
function formatOperand(decoded: DecodedInstruction): string {
  const { mnemonic, address } = decoded;

  // Special instructions with no operand
  if (mnemonic === 'EXTEND' || mnemonic === 'INHINT' || mnemonic === 'RELINT') {
    return '';
  }
  if (mnemonic === 'RESUME') {
    return '';
  }

  // I/O instructions: show channel number in octal
  if (IO_MNEMONICS.has(mnemonic)) {
    return address.toString(8).padStart(3, '0');
  }

  // Register-addressed instructions: show register name if address <= 0o17
  if (address <= 0o17) {
    const regName = REGISTER_NAMES[address];
    if (regName !== undefined) {
      return regName;
    }
  }

  // Default: show address in octal
  return address.toString(8).padStart(5, '0');
}

// ─── Bank-Level Disassembly ────────────────────────────────────────────────

/**
 * Disassemble an entire bank (up to 1024 words).
 *
 * Tracks EXTEND flag across sequential instructions so extracode
 * decoding works correctly.
 */
export function disassembleBank(
  data: Uint16Array | readonly number[],
  bank: number,
  startOffset?: number,
): DisassembledInstruction[] {
  const instructions: DisassembledInstruction[] = [];
  let extracode = false;
  const baseAddress = startOffset ?? bank * 1024;

  for (let i = 0; i < data.length && i < 1024; i++) {
    const word = data[i] & 0o77777;
    const addr = baseAddress + i;
    const instruction = disassembleWord(word, extracode, addr);
    instructions.push(instruction);

    // Track EXTEND: if this instruction is EXTEND, next is extracode
    if (instruction.mnemonic === 'EXTEND') {
      extracode = true;
    } else {
      extracode = false;
    }
  }

  return instructions;
}

// ─── Listing Formatting ────────────────────────────────────────────────────

/**
 * Format a list of disassembled instructions into aligned columns.
 *
 * Output format:
 *   AAAAA  WWWWW  MNEMONIC  OPERAND
 */
export function formatListing(instructions: DisassembledInstruction[]): string {
  const lines: string[] = [];

  for (const instr of instructions) {
    const addrStr = instr.address.toString(8).padStart(5, '0');
    const wordStr = instr.word.toString(8).padStart(5, '0');
    const mnem = instr.mnemonic.padEnd(8);
    const operand = instr.operand;

    lines.push(`${addrStr}  ${wordStr}  ${mnem}${operand}`);
  }

  return lines.join('\n');
}

// ─── Rope-Level Disassembly ────────────────────────────────────────────────

/**
 * Disassemble a full rope image (or specified banks).
 *
 * Iterates each bank, calls disassembleBank(), and formats output with
 * bank headers.
 */
export function disassembleRope(
  fixed: Uint16Array,
  banks?: number[],
): string {
  const totalBanks = Math.ceil(fixed.length / 1024);
  const bankList = banks ?? Array.from({ length: totalBanks }, (_, i) => i);

  const sections: string[] = [];

  for (const bank of bankList) {
    const offset = bank * 1024;
    if (offset >= fixed.length) continue;

    const end = Math.min(offset + 1024, fixed.length);
    const bankData = fixed.slice(offset, end);

    // Check if bank has any non-zero content
    let hasContent = false;
    for (let i = 0; i < bankData.length; i++) {
      if (bankData[i] !== 0) {
        hasContent = true;
        break;
      }
    }
    if (!hasContent) continue;

    const bankStr = bank.toString(8).padStart(2, '0');
    const header = `; Bank ${bankStr} (FBANK=${bankStr})`;

    // Use bank * 1024 as the base address for fixed memory
    const instructions = disassembleBank(bankData, bank);
    const listing = formatListing(instructions);

    sections.push(`${header}\n${listing}`);
  }

  return sections.join('\n\n');
}
