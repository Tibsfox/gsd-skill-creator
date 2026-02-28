import { describe, it, expect } from 'vitest';
import {
  createMemory,
  readMemory,
  writeMemory,
  loadFixed,
  resolveAddress,
} from '../memory.js';

describe('AGC Memory System', () => {
  describe('createMemory', () => {
    it('returns memory with 2048 words of erasable, all zero', () => {
      const mem = createMemory();
      expect(mem.erasable.length).toBe(2048);
      for (let i = 0; i < 2048; i++) {
        expect(mem.erasable[i]).toBe(0);
      }
    });

    it('returns memory with 36864 words of fixed, all zero', () => {
      const mem = createMemory();
      expect(mem.fixed.length).toBe(36864);
    });

    it('has superbank defaulting to 0', () => {
      const mem = createMemory();
      expect(mem.superbank).toBe(0);
    });
  });

  describe('resolveAddress', () => {
    it('identifies register addresses (0o0000-0o0017)', () => {
      const result = resolveAddress(0o0000, 0, 0, 0);
      expect(result.type).toBe('register');
      expect(result.absolute).toBe(0);

      const result2 = resolveAddress(0o0017, 0, 0, 0);
      expect(result2.type).toBe('register');
      expect(result2.absolute).toBe(0o17);
    });

    it('resolves unswitched erasable (0o0020-0o0377) to bank 0', () => {
      const result = resolveAddress(0o0020, 0, 0, 0);
      expect(result.type).toBe('erasable');
      expect(result.absolute).toBe(0o0020);

      const result2 = resolveAddress(0o0377, 0, 0, 0);
      expect(result2.type).toBe('erasable');
      expect(result2.absolute).toBe(0o0377);
    });

    it('resolves switched erasable (0o0400-0o0777) using EBANK', () => {
      // EBANK=0: maps to absolute 0o0000 + offset
      const r0 = resolveAddress(0o0400, 0, 0, 0);
      expect(r0.type).toBe('erasable');
      expect(r0.absolute).toBe(0 * 256 + 0); // EBANK 0, offset 0

      // EBANK=3: maps to absolute 3*256 + offset
      const r3 = resolveAddress(0o0500, 3, 0, 0);
      expect(r3.type).toBe('erasable');
      expect(r3.absolute).toBe(3 * 256 + (0o0500 - 0o0400));

      // EBANK=7: maps to absolute 7*256 + offset
      const r7 = resolveAddress(0o0777, 7, 0, 0);
      expect(r7.type).toBe('erasable');
      expect(r7.absolute).toBe(7 * 256 + (0o0777 - 0o0400));
    });

    it('resolves fixed-fixed bank 02 (0o2000-0o2777)', () => {
      const result = resolveAddress(0o2000, 0, 0, 0);
      expect(result.type).toBe('fixed');
      // Fixed-fixed bank 02 starts at absolute offset 2*1024
      expect(result.absolute).toBe(2 * 1024);

      const result2 = resolveAddress(0o2777, 0, 0, 0);
      expect(result2.type).toBe('fixed');
      expect(result2.absolute).toBe(2 * 1024 + 0o777);
    });

    it('resolves fixed-fixed bank 03 (0o3000-0o3777)', () => {
      const result = resolveAddress(0o3000, 0, 0, 0);
      expect(result.type).toBe('fixed');
      expect(result.absolute).toBe(3 * 1024);

      const result2 = resolveAddress(0o3777, 0, 0, 0);
      expect(result2.type).toBe('fixed');
      expect(result2.absolute).toBe(3 * 1024 + 0o777);
    });

    it('resolves FBANK-switched fixed (0o4000-0o7777) using FBANK', () => {
      // FBANK=0: maps to fixed bank 0
      const r0 = resolveAddress(0o4000, 0, 0, 0);
      expect(r0.type).toBe('fixed');
      expect(r0.absolute).toBe(0 * 1024);

      // FBANK=1: maps to fixed bank 1
      const r1 = resolveAddress(0o4000, 0, 1, 0);
      expect(r1.type).toBe('fixed');
      expect(r1.absolute).toBe(1 * 1024);

      // FBANK=0o37 (31): maps to fixed bank 31
      const r31 = resolveAddress(0o4000, 0, 0o37, 0);
      expect(r31.type).toBe('fixed');
      // FBANK >= 0o30 with superbank=0 maps to banks 30-33
      expect(r31.absolute).toBe(31 * 1024);
    });

    it('resolves FBANK-switched with offset within the bank', () => {
      // FBANK=5, address 0o4100 -> bank 5, offset 0o100
      const result = resolveAddress(0o4100, 0, 5, 0);
      expect(result.type).toBe('fixed');
      expect(result.absolute).toBe(5 * 1024 + 0o100);
    });

    it('handles superbank for FBANK >= 0o30', () => {
      // FBANK=0o30, superbank=0 -> bank 0o30 (24 decimal)
      const r0 = resolveAddress(0o4000, 0, 0o30, 0);
      expect(r0.type).toBe('fixed');
      expect(r0.absolute).toBe(0o30 * 1024);

      // FBANK=0o30, superbank=1 -> bank 0o34 (28 decimal, shifted by 4)
      const r1 = resolveAddress(0o4000, 0, 0o30, 1);
      expect(r1.type).toBe('fixed');
      expect(r1.absolute).toBe(0o34 * 1024);
    });

    it('handles the address range 0o1000-0o1377 as unswitched erasable', () => {
      // Per AGC Block II address map, 0o1000-0o1377 is part of the erasable region
      // This maps to addresses 512-767 in erasable
      const result = resolveAddress(0o1000, 0, 0, 0);
      expect(result.type).toBe('erasable');
      expect(result.absolute).toBe(0o1000);
    });

    it('handles the address range 0o1400-0o1777 as unswitched erasable', () => {
      const result = resolveAddress(0o1400, 0, 0, 0);
      expect(result.type).toBe('erasable');
      expect(result.absolute).toBe(0o1400);
    });
  });

  describe('Erasable memory (RAM)', () => {
    it('reads and writes to unswitched erasable bank 0', () => {
      const mem = createMemory();
      const updated = writeMemory(mem, 0o0020, 0, 0, 0o12345);
      expect(readMemory(updated, 0o0020, 0, 0, 0)).toBe(0o12345);
    });

    it('reads and writes to switched erasable with EBANK=3', () => {
      const mem = createMemory();
      const updated = writeMemory(mem, 0o0500, 3, 0, 0o54321);
      expect(readMemory(updated, 0o0500, 3, 0, 0)).toBe(0o54321);
    });

    it('EBANK=7 maps switched erasable to bank 7 (last bank)', () => {
      const mem = createMemory();
      const updated = writeMemory(mem, 0o0400, 7, 0, 0o77777);
      expect(readMemory(updated, 0o0400, 7, 0, 0)).toBe(0o77777);
    });

    it('register addresses (0o0000-0o0017) return 0 from memory reads', () => {
      const mem = createMemory();
      expect(readMemory(mem, 0o0000, 0, 0, 0)).toBe(0);
      expect(readMemory(mem, 0o0007, 0, 0, 0)).toBe(0);
      expect(readMemory(mem, 0o0017, 0, 0, 0)).toBe(0);
    });

    it('writes to register addresses are no-ops', () => {
      const mem = createMemory();
      const updated = writeMemory(mem, 0o0000, 0, 0, 0o12345);
      expect(readMemory(updated, 0o0000, 0, 0, 0)).toBe(0);
    });

    it('data persists across bank switches', () => {
      let mem = createMemory();
      // Write to EBANK=3
      mem = writeMemory(mem, 0o0500, 3, 0, 0o11111);
      // Read from different EBANK (should not see the value)
      expect(readMemory(mem, 0o0500, 4, 0, 0)).toBe(0);
      // Switch back to EBANK=3 -- data should still be there
      expect(readMemory(mem, 0o0500, 3, 0, 0)).toBe(0o11111);
    });
  });

  describe('Fixed memory (ROM)', () => {
    it('loadFixed loads a bank into fixed memory', () => {
      const mem = createMemory();
      const bankData = new Array(1024).fill(0).map((_, i) => i + 1);
      const updated = loadFixed(mem, 2, bankData);
      expect(readMemory(updated, 0o2000, 0, 0, 0)).toBe(1);
      expect(readMemory(updated, 0o2001, 0, 0, 0)).toBe(2);
    });

    it('fixed-fixed bank 02 is always visible regardless of FBANK', () => {
      const mem = createMemory();
      const bankData = new Array(1024).fill(0o77777);
      const updated = loadFixed(mem, 2, bankData);
      expect(readMemory(updated, 0o2000, 0, 5, 0)).toBe(0o77777);
      expect(readMemory(updated, 0o2000, 0, 0o37, 0)).toBe(0o77777);
    });

    it('fixed-fixed bank 03 is always visible regardless of FBANK', () => {
      const mem = createMemory();
      const bankData = new Array(1024).fill(0o55555);
      const updated = loadFixed(mem, 3, bankData);
      expect(readMemory(updated, 0o3000, 0, 10, 0)).toBe(0o55555);
    });

    it('FBANK-switched region selects the correct bank', () => {
      const mem = createMemory();
      const bank5Data = new Array(1024).fill(0o12345);
      const updated = loadFixed(mem, 5, bank5Data);
      expect(readMemory(updated, 0o4000, 0, 5, 0)).toBe(0o12345);
      // Different FBANK should not see bank 5 data
      expect(readMemory(updated, 0o4000, 0, 6, 0)).toBe(0);
    });

    it('fixed memory is read-only -- writes are no-ops', () => {
      const mem = createMemory();
      const bankData = new Array(1024).fill(0o11111);
      const loaded = loadFixed(mem, 2, bankData);
      const attempted = writeMemory(loaded, 0o2000, 0, 0, 0o77777);
      expect(readMemory(attempted, 0o2000, 0, 0, 0)).toBe(0o11111);
    });
  });

  describe('Memory immutability', () => {
    it('writeMemory returns a new memory state without mutating original', () => {
      const original = createMemory();
      const updated = writeMemory(original, 0o0020, 0, 0, 0o12345);
      expect(readMemory(original, 0o0020, 0, 0, 0)).toBe(0);
      expect(readMemory(updated, 0o0020, 0, 0, 0)).toBe(0o12345);
    });

    it('loadFixed returns a new memory state without mutating original', () => {
      const original = createMemory();
      const bankData = new Array(1024).fill(0o11111);
      const updated = loadFixed(original, 2, bankData);
      expect(readMemory(original, 0o2000, 0, 0, 0)).toBe(0);
      expect(readMemory(updated, 0o2000, 0, 0, 0)).toBe(0o11111);
    });
  });
});
