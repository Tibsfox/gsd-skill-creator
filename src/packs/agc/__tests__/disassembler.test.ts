/**
 * Tests for the AGC disassembler.
 *
 * Verifies word-level, bank-level, and rope-level disassembly
 * for all basic, extracode, and special instructions.
 */

import { describe, it, expect } from 'vitest';
import {
  disassembleWord,
  disassembleBank,
  disassembleRope,
  formatAddress,
  formatListing,
} from '../tools/disassembler.js';

describe('AGC Disassembler', () => {
  // ─── formatAddress ─────────────────────────────────────────────────────

  describe('formatAddress', () => {
    it('formats a plain address as 5-digit octal', () => {
      expect(formatAddress(0o4000)).toBe('04000');
      expect(formatAddress(0o2000)).toBe('02000');
      expect(formatAddress(0)).toBe('00000');
    });

    it('formats FBANK-switched address with bank annotation', () => {
      expect(formatAddress(0o4000, 0)).toBe('00,04000');
      expect(formatAddress(0o5000, 5)).toBe('05,05000');
      expect(formatAddress(0o7777, 0o35)).toBe('35,07777');
    });

    it('does not annotate non-FBANK addresses even with bank', () => {
      expect(formatAddress(0o2000, 2)).toBe('02000');
      expect(formatAddress(0o100, 1)).toBe('00100');
    });
  });

  // ─── Basic Instructions ────────────────────────────────────────────────

  describe('basic instructions', () => {
    it('disassembles TC', () => {
      // TC 0o100 -> opcode 0, address 0o100
      const word = (0 << 12) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('TC');
      expect(result.operand).toBe('00100');
    });

    it('disassembles CCS (erasable address)', () => {
      // CCS 0o100 -> opcode 1, address 0o100 (< 0o2000)
      const word = (1 << 12) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('CCS');
      expect(result.operand).toBe('00100');
    });

    it('disassembles TCF (fixed address)', () => {
      // TCF 0o4000 -> opcode 1, address 0o4000
      const word = (1 << 12) | 0o4000;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('TCF');
      expect(result.operand).toBe('04000');
    });

    it('disassembles DAS (qc=0)', () => {
      // DAS 0o100 -> opcode 2, qc=0, addr=0o100
      const word = (2 << 12) | (0 << 10) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('DAS');
      expect(result.operand).toBe('00100');
    });

    it('disassembles LXCH (qc=1)', () => {
      // LXCH 0o100 -> opcode 2, qc=1, addr=0o100
      const word = (2 << 12) | (1 << 10) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('LXCH');
      expect(result.operand).toBe('00100');
    });

    it('disassembles INCR (qc=2)', () => {
      // INCR 0o100 -> opcode 2, qc=2, addr=0o100
      const word = (2 << 12) | (2 << 10) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('INCR');
      expect(result.operand).toBe('00100');
    });

    it('disassembles ADS (qc=3)', () => {
      // ADS 0o100 -> opcode 2, qc=3, addr=0o100
      const word = (2 << 12) | (3 << 10) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('ADS');
      expect(result.operand).toBe('00100');
    });

    it('disassembles CA', () => {
      // CA 0o100 -> opcode 3, address 0o100
      const word = (3 << 12) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('CA');
      expect(result.operand).toBe('00100');
    });

    it('disassembles CS', () => {
      // CS 0o100 -> opcode 4, address 0o100
      const word = (4 << 12) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('CS');
      expect(result.operand).toBe('00100');
    });

    it('disassembles INDEX', () => {
      // INDEX 0o100 -> opcode 5, qc=0, address 0o100
      const word = (5 << 12) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('INDEX');
      expect(result.operand).toBe('00100');
    });

    it('disassembles DXCH (qc=1)', () => {
      // DXCH 0o100 -> opcode 5, qc=1, addr=0o100
      const word = (5 << 12) | (1 << 10) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('DXCH');
      expect(result.operand).toBe('00100');
    });

    it('disassembles TS (qc=2)', () => {
      // TS 0o100 -> opcode 5, qc=2, addr=0o100
      const word = (5 << 12) | (2 << 10) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('TS');
      expect(result.operand).toBe('00100');
    });

    it('disassembles XCH (qc=3)', () => {
      // XCH 0o100 -> opcode 5, qc=3, addr=0o100
      const word = (5 << 12) | (3 << 10) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('XCH');
      expect(result.operand).toBe('00100');
    });

    it('disassembles AD', () => {
      // AD 0o100 -> opcode 6, address 0o100
      const word = (6 << 12) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('AD');
      expect(result.operand).toBe('00100');
    });

    it('disassembles MASK', () => {
      // MASK 0o100 -> opcode 7, address 0o100
      const word = (7 << 12) | 0o100;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('MASK');
      expect(result.operand).toBe('00100');
    });
  });

  // ─── Special Instructions ──────────────────────────────────────────────

  describe('special instructions', () => {
    it('disassembles EXTEND (TC 0o6)', () => {
      const word = 0o00006;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('EXTEND');
      expect(result.operand).toBe('');
    });

    it('disassembles INHINT (TC 0o4)', () => {
      const word = 0o00004;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('INHINT');
      expect(result.operand).toBe('');
    });

    it('disassembles RELINT (TC 0o3)', () => {
      const word = 0o00003;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('RELINT');
      expect(result.operand).toBe('');
    });

    it('disassembles RESUME (INDEX 0o17)', () => {
      const word = 0o50017;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('RESUME');
      expect(result.operand).toBe('');
    });
  });

  // ─── Extracode Instructions ────────────────────────────────────────────

  describe('extracode instructions', () => {
    it('disassembles READ', () => {
      // READ ch 0o10 -> extracode opcode 0, subcode 0, channel 0o10
      const word = (0 << 12) | (0 << 9) | 0o10;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('READ');
      expect(result.operand).toBe('010');
    });

    it('disassembles WRITE', () => {
      // WRITE ch 0o10 -> extracode opcode 0, subcode 1, channel 0o10
      const word = (0 << 12) | (1 << 9) | 0o10;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('WRITE');
      expect(result.operand).toBe('010');
    });

    it('disassembles RAND', () => {
      const word = (0 << 12) | (2 << 9) | 0o10;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('RAND');
      expect(result.operand).toBe('010');
    });

    it('disassembles WAND', () => {
      const word = (0 << 12) | (3 << 9) | 0o10;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('WAND');
      expect(result.operand).toBe('010');
    });

    it('disassembles ROR', () => {
      const word = (0 << 12) | (4 << 9) | 0o10;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('ROR');
      expect(result.operand).toBe('010');
    });

    it('disassembles WOR', () => {
      const word = (0 << 12) | (5 << 9) | 0o10;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('WOR');
      expect(result.operand).toBe('010');
    });

    it('disassembles RXOR', () => {
      const word = (0 << 12) | (6 << 9) | 0o10;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('RXOR');
      expect(result.operand).toBe('010');
    });

    it('disassembles DV (erasable)', () => {
      // DV 0o100 -> extracode opcode 1, address 0o100 (< 0o2000)
      const word = (1 << 12) | 0o100;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('DV');
      expect(result.operand).toBe('00100');
    });

    it('disassembles BZF (fixed)', () => {
      // BZF 0o4000 -> extracode opcode 1, address 0o4000 (>= 0o2000)
      const word = (1 << 12) | 0o4000;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('BZF');
      expect(result.operand).toBe('04000');
    });

    it('disassembles MSU (qc=0)', () => {
      const word = (2 << 12) | (0 << 10) | 0o100;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('MSU');
      expect(result.operand).toBe('00100');
    });

    it('disassembles QXCH (qc=1)', () => {
      const word = (2 << 12) | (1 << 10) | 0o100;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('QXCH');
      expect(result.operand).toBe('00100');
    });

    it('disassembles AUG (qc=2)', () => {
      const word = (2 << 12) | (2 << 10) | 0o100;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('AUG');
      expect(result.operand).toBe('00100');
    });

    it('disassembles DIM (qc=3)', () => {
      const word = (2 << 12) | (3 << 10) | 0o100;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('DIM');
      expect(result.operand).toBe('00100');
    });

    it('disassembles DCA', () => {
      const word = (3 << 12) | 0o100;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('DCA');
      expect(result.operand).toBe('00100');
    });

    it('disassembles DCS', () => {
      const word = (4 << 12) | 0o100;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('DCS');
      expect(result.operand).toBe('00100');
    });

    it('disassembles SU (erasable)', () => {
      const word = (6 << 12) | 0o100;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('SU');
      expect(result.operand).toBe('00100');
    });

    it('disassembles BZMF (fixed)', () => {
      const word = (6 << 12) | 0o4000;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('BZMF');
      expect(result.operand).toBe('04000');
    });

    it('disassembles MP', () => {
      const word = (7 << 12) | 0o100;
      const result = disassembleWord(word, true);
      expect(result.mnemonic).toBe('MP');
      expect(result.operand).toBe('00100');
    });
  });

  // ─── Register Operands ─────────────────────────────────────────────────

  describe('register operands', () => {
    it('shows register name for CA A', () => {
      // CA A -> opcode 3, address 0 (A)
      const word = (3 << 12) | 0;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('CA');
      expect(result.operand).toBe('A');
    });

    it('shows register name for XCH L', () => {
      // XCH L -> opcode 5, qc=3, address 1 (L)
      const word = (5 << 12) | (3 << 10) | 1;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('XCH');
      expect(result.operand).toBe('L');
    });

    it('shows register name for CA Q', () => {
      const word = (3 << 12) | 2;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('CA');
      expect(result.operand).toBe('Q');
    });

    it('shows register name for TS EBANK', () => {
      const word = (5 << 12) | (2 << 10) | 4;
      const result = disassembleWord(word, false);
      expect(result.mnemonic).toBe('TS');
      expect(result.operand).toBe('EBANK');
    });
  });

  // ─── Bank-Level Disassembly ────────────────────────────────────────────

  describe('disassembleBank', () => {
    it('tracks EXTEND across sequential instructions', () => {
      // EXTEND, then MP 0o100
      const data = [
        0o00006,           // EXTEND
        (7 << 12) | 0o100, // MP 0o100 (extracode because of preceding EXTEND)
        (3 << 12) | 0o100, // CA 0o100 (back to basic)
      ];

      const result = disassembleBank(data, 0);
      expect(result).toHaveLength(3);
      expect(result[0].mnemonic).toBe('EXTEND');
      expect(result[1].mnemonic).toBe('MP');
      expect(result[1].isExtracode).toBe(true);
      expect(result[2].mnemonic).toBe('CA');
      expect(result[2].isExtracode).toBe(false);
    });

    it('assigns correct addresses based on bank', () => {
      const data = [(3 << 12) | 0o100]; // CA 0o100
      const result = disassembleBank(data, 5);
      expect(result[0].address).toBe(5 * 1024);
    });

    it('disassembles a small program', () => {
      // Small program at bank 2:
      // CA 0o100
      // AD 0o101
      // TS 0o102
      // TC to self (infinite loop)
      const bank2Base = 2 * 1024;
      const data = [
        (3 << 12) | 0o100,       // CA 0o100
        (6 << 12) | 0o101,       // AD 0o101
        (5 << 12) | (2 << 10) | 0o102, // TS 0o102
        (0 << 12) | (bank2Base + 3), // TC to self (won't fit in 12 bits for high banks, but fine for test)
      ];

      const result = disassembleBank(data, 2);
      expect(result).toHaveLength(4);
      expect(result[0].mnemonic).toBe('CA');
      expect(result[1].mnemonic).toBe('AD');
      expect(result[2].mnemonic).toBe('TS');
      expect(result[3].mnemonic).toBe('TC');
    });

    it('uses startOffset when provided', () => {
      const data = [(3 << 12) | 0o100]; // CA 0o100
      const result = disassembleBank(data, 0, 0o4000);
      expect(result[0].address).toBe(0o4000);
    });
  });

  // ─── formatListing ─────────────────────────────────────────────────────

  describe('formatListing', () => {
    it('produces aligned output', () => {
      const instructions = disassembleBank(
        [(3 << 12) | 0o100, (6 << 12) | 0o101],
        0,
        0o4000,
      );

      const listing = formatListing(instructions);
      const lines = listing.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('04000');
      expect(lines[0]).toContain('CA');
      expect(lines[1]).toContain('04001');
      expect(lines[1]).toContain('AD');
    });
  });

  // ─── Rope-Level Disassembly ────────────────────────────────────────────

  describe('disassembleRope', () => {
    it('produces multi-bank output with headers', () => {
      // Create a small rope with 2 banks (2048 words)
      const fixed = new Uint16Array(2048);
      // Put some code in bank 0
      fixed[0] = (3 << 12) | 0o100; // CA 0o100
      fixed[1] = (6 << 12) | 0o101; // AD 0o101
      // Put some code in bank 1
      fixed[1024] = (0 << 12) | 0o200; // TC 0o200

      const output = disassembleRope(fixed, [0, 1]);
      expect(output).toContain('; Bank 00 (FBANK=00)');
      expect(output).toContain('; Bank 01 (FBANK=01)');
      expect(output).toContain('CA');
      expect(output).toContain('TC');
    });

    it('skips empty banks', () => {
      const fixed = new Uint16Array(3072); // 3 banks, all zero
      // Only put code in bank 2
      fixed[2048] = (3 << 12) | 0o100;

      const output = disassembleRope(fixed);
      expect(output).not.toContain('Bank 00');
      expect(output).not.toContain('Bank 01');
      expect(output).toContain('Bank 02');
    });

    it('handles specific bank selection', () => {
      const fixed = new Uint16Array(3072);
      fixed[0] = (3 << 12) | 0o100;
      fixed[1024] = (6 << 12) | 0o101;
      fixed[2048] = (7 << 12) | 0o102;

      const output = disassembleRope(fixed, [1]);
      expect(output).not.toContain('Bank 00');
      expect(output).toContain('Bank 01');
      expect(output).not.toContain('Bank 02');
    });
  });
});
