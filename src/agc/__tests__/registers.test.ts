import { describe, it, expect } from 'vitest';
import {
  RegisterId,
  WORD15_MASK,
  WORD16_MASK,
  ADDRESS12_MASK,
  toWord15,
  toWord16,
  toAddress12,
} from '../types.js';
import {
  createRegisters,
  getRegister,
  setRegister,
} from '../registers.js';

describe('AGC Register File', () => {
  describe('createRegisters', () => {
    it('returns a fresh register state with all registers zeroed', () => {
      const regs = createRegisters();
      expect(getRegister(regs, RegisterId.A)).toBe(0);
      expect(getRegister(regs, RegisterId.L)).toBe(0);
      expect(getRegister(regs, RegisterId.Q)).toBe(0);
      expect(getRegister(regs, RegisterId.Z)).toBe(0);
      expect(getRegister(regs, RegisterId.EBANK)).toBe(0);
      expect(getRegister(regs, RegisterId.FBANK)).toBe(0);
      expect(getRegister(regs, RegisterId.BB)).toBe(0);
      expect(getRegister(regs, RegisterId.BRUPT)).toBe(0);
      expect(getRegister(regs, RegisterId.CYR)).toBe(0);
      expect(getRegister(regs, RegisterId.SR)).toBe(0);
      expect(getRegister(regs, RegisterId.CYL)).toBe(0);
      expect(getRegister(regs, RegisterId.EDOP)).toBe(0);
    });
  });

  describe('A register (16-bit with overflow)', () => {
    it('reads and writes values in 16-bit range', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.A, 0o12345);
      expect(getRegister(updated, RegisterId.A)).toBe(0o12345);
    });

    it('masks to 16 bits (preserves overflow bit)', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.A, 0o177777);
      expect(getRegister(updated, RegisterId.A)).toBe(0o177777);
    });

    it('truncates values beyond 16 bits', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.A, 0o377777);
      expect(getRegister(updated, RegisterId.A)).toBe(0o177777);
    });
  });

  describe('L register (15-bit)', () => {
    it('reads and writes values in 15-bit range', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.L, 0o54321);
      expect(getRegister(updated, RegisterId.L)).toBe(0o54321);
    });

    it('masks to 15 bits', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.L, 0o177777);
      expect(getRegister(updated, RegisterId.L)).toBe(0o77777);
    });
  });

  describe('Q register (15-bit return address)', () => {
    it('reads and writes values in 15-bit range', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.Q, 0o4000);
      expect(getRegister(updated, RegisterId.Q)).toBe(0o4000);
    });

    it('masks to 15 bits', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.Q, 0o177777);
      expect(getRegister(updated, RegisterId.Q)).toBe(0o77777);
    });
  });

  describe('Z register (12-bit program counter)', () => {
    it('reads and writes values in 12-bit range', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.Z, 0o4000);
      expect(getRegister(updated, RegisterId.Z)).toBe(0o4000);
    });

    it('masks to 12 bits', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.Z, 0o77777);
      expect(getRegister(updated, RegisterId.Z)).toBe(0o7777);
    });
  });

  describe('EBANK register (3-bit)', () => {
    it('reads and writes values in 3-bit range', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.EBANK, 5);
      expect(getRegister(updated, RegisterId.EBANK)).toBe(5);
    });

    it('masks to 3 bits', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.EBANK, 0o77);
      expect(getRegister(updated, RegisterId.EBANK)).toBe(7);
    });
  });

  describe('FBANK register (5-bit)', () => {
    it('reads and writes values in 5-bit range', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.FBANK, 0o25);
      expect(getRegister(updated, RegisterId.FBANK)).toBe(0o25);
    });

    it('masks to 5 bits', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.FBANK, 0o77);
      expect(getRegister(updated, RegisterId.FBANK)).toBe(0o37);
    });
  });

  describe('BB register (15-bit composite)', () => {
    it('reads as composite of FBANK (bits 10-14) and EBANK (bits 0-2)', () => {
      let regs = createRegisters();
      regs = setRegister(regs, RegisterId.FBANK, 0o25);
      regs = setRegister(regs, RegisterId.EBANK, 5);
      // BB = (FBANK << 10) | EBANK = (0o25 << 10) | 5
      expect(getRegister(regs, RegisterId.BB)).toBe((0o25 << 10) | 5);
    });

    it('writing BB updates both FBANK and EBANK atomically', () => {
      const regs = createRegisters();
      const bbValue = (0o17 << 10) | 3; // FBANK=0o17, EBANK=3
      const updated = setRegister(regs, RegisterId.BB, bbValue);
      expect(getRegister(updated, RegisterId.FBANK)).toBe(0o17);
      expect(getRegister(updated, RegisterId.EBANK)).toBe(3);
      expect(getRegister(updated, RegisterId.BB)).toBe(bbValue);
    });

    it('writing FBANK individually updates BB accordingly', () => {
      let regs = createRegisters();
      regs = setRegister(regs, RegisterId.EBANK, 6);
      regs = setRegister(regs, RegisterId.FBANK, 0o31);
      expect(getRegister(regs, RegisterId.BB)).toBe((0o31 << 10) | 6);
    });

    it('writing EBANK individually updates BB accordingly', () => {
      let regs = createRegisters();
      regs = setRegister(regs, RegisterId.FBANK, 0o12);
      regs = setRegister(regs, RegisterId.EBANK, 4);
      expect(getRegister(regs, RegisterId.BB)).toBe((0o12 << 10) | 4);
    });
  });

  describe('BRUPT register (15-bit)', () => {
    it('reads and writes values in 15-bit range', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.BRUPT, 0o54321);
      expect(getRegister(updated, RegisterId.BRUPT)).toBe(0o54321);
    });

    it('masks to 15 bits', () => {
      const regs = createRegisters();
      const updated = setRegister(regs, RegisterId.BRUPT, 0o177777);
      expect(getRegister(updated, RegisterId.BRUPT)).toBe(0o77777);
    });
  });

  describe('Special edit registers', () => {
    describe('CYR (Cycle Right)', () => {
      it('stores the result of cycling right -- bit 0 goes to bit 14', () => {
        const regs = createRegisters();
        // Write 0o00001 (bit 0 set) -> cycle right -> bit 0 goes to bit 14
        const updated = setRegister(regs, RegisterId.CYR, 0o00001);
        // Bit 0 should cycle to bit 14: result = 0o40000
        expect(getRegister(updated, RegisterId.CYR)).toBe(0o40000);
      });

      it('cycles right for a multi-bit value', () => {
        const regs = createRegisters();
        // Write 0o00006 (binary 110) -> cycle right -> 0o00003 (binary 011)
        const updated = setRegister(regs, RegisterId.CYR, 0o00006);
        expect(getRegister(updated, RegisterId.CYR)).toBe(0o00003);
      });

      it('cycles right for a value with bit 14 set', () => {
        const regs = createRegisters();
        // 0o40000 (bit 14 only) -> cycle right -> 0o20000
        const updated = setRegister(regs, RegisterId.CYR, 0o40000);
        expect(getRegister(updated, RegisterId.CYR)).toBe(0o20000);
      });
    });

    describe('SR (Shift Right with sign extension)', () => {
      it('shifts right preserving sign bit (positive)', () => {
        const regs = createRegisters();
        // 0o00006 (positive, bits 2,1 set) -> shift right -> 0o00003
        const updated = setRegister(regs, RegisterId.SR, 0o00006);
        expect(getRegister(updated, RegisterId.SR)).toBe(0o00003);
      });

      it('shifts right preserving sign bit (negative)', () => {
        const regs = createRegisters();
        // 0o40002 (bit 14 set = negative, bit 1 set) -> shift right -> bit 14 preserved
        // 0o40002 >> 1 = 0o20001, but sign extension: bit 14 stays set = 0o60001
        const updated = setRegister(regs, RegisterId.SR, 0o40002);
        expect(getRegister(updated, RegisterId.SR)).toBe(0o60001);
      });
    });

    describe('CYL (Cycle Left)', () => {
      it('cycles left -- bit 14 goes to bit 0', () => {
        const regs = createRegisters();
        // 0o40000 (bit 14 set) -> cycle left -> bit 14 goes to bit 0 = 0o00001
        const updated = setRegister(regs, RegisterId.CYL, 0o40000);
        expect(getRegister(updated, RegisterId.CYL)).toBe(0o00001);
      });

      it('cycles left for a multi-bit value', () => {
        const regs = createRegisters();
        // 0o00003 (bits 0,1) -> cycle left -> 0o00006
        const updated = setRegister(regs, RegisterId.CYL, 0o00003);
        expect(getRegister(updated, RegisterId.CYL)).toBe(0o00006);
      });
    });

    describe('EDOP (Edit Opcode)', () => {
      it('stores bits 9-14 of written value in bits 0-6', () => {
        const regs = createRegisters();
        // Write value with bits 9-14 = 0o76000 >> 9 shifted from bits 9-14
        // Value: 0o76000 = 111 110 000 000 000 in binary
        // Bits 14-9: 111110 = 0o76 >> shifted to 0o76 in bits 0-5
        // Actually bits 14 down to 9 = 6 bits, stored in bits 6 down to 0 (7 bits)
        // Let me be precise: EDOP extracts bits 14-9 (6 bits) and places them in bits 5-0
        const value = 0o76000; // bits 14-9 = 0b111110 = 0o76 >> but let's check
        // 0o76000 in binary: 111 110 000 000 000
        // bits 14-12 = 111, bits 11-9 = 110 -> bits 14-9 = 111110 = 62 decimal
        const updated = setRegister(regs, RegisterId.EDOP, value);
        // Stored value should have bits 14-9 moved to bits 5-0
        expect(getRegister(updated, RegisterId.EDOP)).toBe(0o76);
      });
    });
  });

  describe('Immutability', () => {
    it('setRegister returns a NEW state without mutating the original', () => {
      const original = createRegisters();
      const updated = setRegister(original, RegisterId.A, 0o12345);
      expect(getRegister(original, RegisterId.A)).toBe(0);
      expect(getRegister(updated, RegisterId.A)).toBe(0o12345);
    });

    it('chained setRegister calls produce independent states', () => {
      const regs = createRegisters();
      const state1 = setRegister(regs, RegisterId.A, 100);
      const state2 = setRegister(state1, RegisterId.L, 200);
      expect(getRegister(state1, RegisterId.L)).toBe(0);
      expect(getRegister(state2, RegisterId.A)).toBe(100);
      expect(getRegister(state2, RegisterId.L)).toBe(200);
    });
  });
});
