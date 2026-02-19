import { describe, it, expect } from 'vitest';
import { WORD15_MASK } from '../types.js';
import {
  onesNegate,
  onesComplement,
  onesAbs,
  isNegative,
  isPositiveZero,
  isNegativeZero,
  isZero,
  onesAdd,
  onesSub,
  onesIncrement,
  onesDecrement,
  diminish,
  onesMultiply,
  onesDivide,
  onesDoubleAdd,
  overflow,
  overflowCorrect,
} from '../alu.js';

describe('AGC Ones Complement ALU', () => {
  describe('onesNegate', () => {
    it('negates +1 to -1', () => {
      expect(onesNegate(0o00001)).toBe(0o77776);
    });

    it('negates -1 to +1', () => {
      expect(onesNegate(0o77776)).toBe(0o00001);
    });

    it('negates +0 to -0', () => {
      expect(onesNegate(0o00000)).toBe(0o77777);
    });

    it('negates -0 to +0', () => {
      expect(onesNegate(0o77777)).toBe(0o00000);
    });
  });

  describe('onesComplement', () => {
    it('is XOR with WORD15_MASK (same as negate for ones complement)', () => {
      expect(onesComplement(0o00001)).toBe(WORD15_MASK ^ 0o00001);
      expect(onesComplement(0o12345)).toBe(WORD15_MASK ^ 0o12345);
    });
  });

  describe('isNegative / isZero helpers', () => {
    it('identifies negative numbers (bit 14 set)', () => {
      expect(isNegative(0o40000)).toBe(true);
      expect(isNegative(0o77776)).toBe(true); // -1
      expect(isNegative(0o00001)).toBe(false); // +1
    });

    it('identifies positive zero', () => {
      expect(isPositiveZero(0o00000)).toBe(true);
      expect(isPositiveZero(0o77777)).toBe(false);
    });

    it('identifies negative zero', () => {
      expect(isNegativeZero(0o77777)).toBe(true);
      expect(isNegativeZero(0o00000)).toBe(false);
    });

    it('identifies either zero', () => {
      expect(isZero(0o00000)).toBe(true);
      expect(isZero(0o77777)).toBe(true);
      expect(isZero(0o00001)).toBe(false);
    });
  });

  describe('onesAbs', () => {
    it('returns positive values unchanged', () => {
      expect(onesAbs(0o00005)).toBe(0o00005);
    });

    it('negates negative values to positive', () => {
      // -5 in ones complement: onesNegate(5) = 0o77772
      expect(onesAbs(onesNegate(5))).toBe(5);
    });

    it('returns +0 for +0', () => {
      expect(onesAbs(0o00000)).toBe(0o00000);
    });

    it('returns +0 for -0', () => {
      expect(onesAbs(0o77777)).toBe(0o00000);
    });
  });

  describe('onesAdd (single precision)', () => {
    it('adds two positive numbers', () => {
      const result = onesAdd(5, 3);
      expect(result.value).toBe(8);
      expect(result.overflow).toBe(false);
    });

    it('adds +0 and +0', () => {
      const result = onesAdd(0o00000, 0o00000);
      expect(result.value).toBe(0o00000);
      expect(result.overflow).toBe(false);
    });

    it('adds -0 and -0', () => {
      const result = onesAdd(0o77777, 0o77777);
      // -0 + -0 in ones complement: should be -0 or +0 with no overflow
      expect(isZero(result.value)).toBe(true);
      expect(result.overflow).toBe(false);
    });

    it('adds +0 and -0 (end-around carry)', () => {
      const result = onesAdd(0o00000, 0o77777);
      expect(isZero(result.value)).toBe(true);
      expect(result.overflow).toBe(false);
    });

    it('detects positive overflow', () => {
      // +16383 (max positive) + 1
      const result = onesAdd(0o37777, 0o00001);
      expect(result.overflow).toBe(true);
    });

    it('detects negative overflow', () => {
      // -16383 + (-1)
      const negMax = onesNegate(0o37777); // 0o40000
      const negOne = onesNegate(1); // 0o77776
      const result = onesAdd(negMax, negOne);
      expect(result.overflow).toBe(true);
    });

    it('adds positive and negative correctly', () => {
      // +5 + (-3) = +2
      const result = onesAdd(5, onesNegate(3));
      expect(result.value).toBe(2);
      expect(result.overflow).toBe(false);
    });

    it('adds negative and positive correctly', () => {
      // -5 + 3 = -2
      const result = onesAdd(onesNegate(5), 3);
      expect(result.value).toBe(onesNegate(2));
      expect(result.overflow).toBe(false);
    });

    it('cancels to zero', () => {
      // +5 + (-5) = 0
      const result = onesAdd(5, onesNegate(5));
      expect(isZero(result.value)).toBe(true);
      expect(result.overflow).toBe(false);
    });
  });

  describe('onesSub', () => {
    it('subtracts positive from positive', () => {
      const result = onesSub(5, 3);
      expect(result.value).toBe(2);
      expect(result.overflow).toBe(false);
    });

    it('subtracts larger from smaller', () => {
      const result = onesSub(3, 5);
      expect(result.value).toBe(onesNegate(2));
      expect(result.overflow).toBe(false);
    });

    it('is equivalent to onesAdd(a, onesNegate(b))', () => {
      const sub = onesSub(100, 50);
      const add = onesAdd(100, onesNegate(50));
      expect(sub.value).toBe(add.value);
      expect(sub.overflow).toBe(add.overflow);
    });
  });

  describe('overflow (16-bit A register)', () => {
    it('detects no overflow (positive: bits 15,14 = 00)', () => {
      // Bits 15=0, 14=0: positive, no overflow
      expect(overflow(0o00100)).toBe('none');
    });

    it('detects no overflow (negative: bits 15,14 = 11)', () => {
      // Bits 15=1, 14=1: negative, no overflow
      expect(overflow(0o140000)).toBe('none');
    });

    it('detects positive overflow (bits 15,14 = 01)', () => {
      // Bits 15=0, 14=1: positive overflow
      expect(overflow(0o040000)).toBe('positive');
    });

    it('detects negative overflow (bits 15,14 = 10)', () => {
      // Bits 15=1, 14=0: negative overflow
      expect(overflow(0o100000)).toBe('negative');
    });
  });

  describe('overflowCorrect', () => {
    it('returns 15-bit value from non-overflowed positive', () => {
      expect(overflowCorrect(0o00100)).toBe(0o00100);
    });

    it('returns 15-bit value from non-overflowed negative', () => {
      // 0o140000 = bits 15,14 set = negative, value = 0o40000 (mask 15 bits)
      expect(overflowCorrect(0o140000)).toBe(0o40000);
    });

    it('corrects positive overflow to positive maximum-ish', () => {
      // Positive overflow: bit 15=0, bit 14=1 -> should return positive value
      const corrected = overflowCorrect(0o040001);
      // Positive overflow: the 15-bit value has the sign wrong, correct by clearing overflow
      expect(corrected).toBe(0o00001); // Strip bit 15, keep bits 0-14 with sign=0
    });

    it('corrects negative overflow to negative', () => {
      // Negative overflow: bit 15=1, bit 14=0 -> should return negative value
      const corrected = overflowCorrect(0o100001);
      // Negative overflow: force sign bit to 1
      expect(corrected).toBe(0o40001);
    });
  });

  describe('onesIncrement', () => {
    it('increments positive value', () => {
      const result = onesIncrement(5);
      expect(result.value).toBe(6);
      expect(result.overflow).toBe(false);
    });

    it('increments -1 to -0', () => {
      const result = onesIncrement(onesNegate(1));
      expect(isZero(result.value)).toBe(true);
      expect(result.overflow).toBe(false);
    });

    it('detects overflow on max positive', () => {
      const result = onesIncrement(0o37777);
      expect(result.overflow).toBe(true);
    });
  });

  describe('onesDecrement', () => {
    it('decrements positive value', () => {
      const result = onesDecrement(5);
      expect(result.value).toBe(4);
      expect(result.overflow).toBe(false);
    });

    it('decrements +0 to -0', () => {
      const result = onesDecrement(0o00000);
      expect(result.value).toBe(0o77777); // -0
      expect(result.overflow).toBe(false);
    });
  });

  describe('diminish', () => {
    it('decrements positive toward zero', () => {
      expect(diminish(5)).toBe(4);
    });

    it('decrements negative magnitude toward zero', () => {
      // -5 -> -4 (magnitude decreases)
      expect(diminish(onesNegate(5))).toBe(onesNegate(4));
    });

    it('does not change +0', () => {
      expect(diminish(0o00000)).toBe(0o00000);
    });

    it('does not change -0', () => {
      expect(diminish(0o77777)).toBe(0o77777);
    });
  });

  describe('onesMultiply', () => {
    it('multiplies two positive numbers', () => {
      const result = onesMultiply(100, 200);
      // Both treated as fractions: 100/16384 * 200/16384 * 16384^2 = 100*200 = 20000
      // But the AGC treats them as fractions, so result = (100 * 200) split across high/low
      expect(result.high).toBeDefined();
      expect(result.low).toBeDefined();
    });

    it('multiplies positive by negative', () => {
      const result = onesMultiply(100, onesNegate(200));
      // Result should be negative
      expect(isNegative(result.high)).toBe(true);
    });

    it('multiplying by zero gives zero', () => {
      const result = onesMultiply(0, 100);
      expect(isZero(result.high)).toBe(true);
      expect(isZero(result.low)).toBe(true);
    });

    it('produces correct double precision result', () => {
      // 0o10000 * 0o10000 = 4096 * 4096 = 16777216
      // As fractions: (4096/16384) * (4096/16384) = 0.25 * 0.25 = 0.0625
      // High word = 0.0625 * 16384 = 1024 = 0o2000
      // Low word = 0
      const result = onesMultiply(0o10000, 0o10000);
      expect(result.high).toBe(0o02000);
      expect(result.low).toBe(0);
    });
  });

  describe('onesDivide', () => {
    it('divides double precision by single precision', () => {
      // Simple case: 1024 / 4096 -> some quotient and remainder
      const result = onesDivide(0o02000, 0, 0o10000);
      expect(result.overflow).toBe(false);
      expect(result.quotient).toBeDefined();
      expect(result.remainder).toBeDefined();
    });

    it('signals overflow when dividend >= divisor', () => {
      // Dividend high word >= divisor -> overflow
      const result = onesDivide(0o20000, 0, 0o10000);
      expect(result.overflow).toBe(true);
    });

    it('handles division by zero as overflow', () => {
      const result = onesDivide(0o00100, 0, 0);
      expect(result.overflow).toBe(true);
    });
  });

  describe('onesDoubleAdd', () => {
    it('adds two double precision values', () => {
      const result = onesDoubleAdd(0o00010, 0o00005, 0o00003, 0o00002);
      expect(result.high).toBe(0o00013);
      expect(result.low).toBe(0o00007);
      expect(result.overflow).toBe(false);
    });

    it('propagates carry from low to high', () => {
      // Low words that overflow should carry into high
      const result = onesDoubleAdd(0o00001, 0o37777, 0o00001, 0o00001);
      // Low: 0o37777 + 0o00001 = overflow -> carry to high
      expect(result.overflow).toBe(false);
      // High should be 1 + 1 + carry = 3
      expect(result.high).toBe(0o00003);
    });

    it('detects overflow from high word', () => {
      const result = onesDoubleAdd(0o37777, 0, 0o00001, 0);
      expect(result.overflow).toBe(true);
    });
  });
});
