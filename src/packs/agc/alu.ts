/**
 * AGC Block II Arithmetic Logic Unit.
 *
 * Ones' complement 15-bit arithmetic with overflow detection.
 * All functions are pure (no side effects, no mutation).
 *
 * Key difference from two's complement:
 *   - Two representations of zero: +0 (0o00000) and -0 (0o77777)
 *   - Negation is bitwise complement (XOR with 0o77777)
 *   - Addition uses end-around carry
 *   - Overflow detected by sign-bit disagreement
 */

import { WORD15_MASK, WORD16_MASK } from './types.js';

// ─── Sign and zero helpers ─────────────────────────────────────────────────

/** Check if bit 14 (sign bit) is set -- value is negative. */
export function isNegative(value: number): boolean {
  return (value & 0o40000) !== 0;
}

/** Check if value is positive zero (0o00000). */
export function isPositiveZero(value: number): boolean {
  return (value & WORD15_MASK) === 0;
}

/** Check if value is negative zero (0o77777). */
export function isNegativeZero(value: number): boolean {
  return (value & WORD15_MASK) === WORD15_MASK;
}

/** Check if value is either +0 or -0. */
export function isZero(value: number): boolean {
  return isPositiveZero(value) || isNegativeZero(value);
}

// ─── Basic operations ──────────────────────────────────────────────────────

/** Ones' complement negation: XOR with WORD15_MASK. */
export function onesNegate(value: number): number {
  return (value ^ WORD15_MASK) & WORD15_MASK;
}

/** Ones' complement bitwise complement (same as negate). */
export function onesComplement(value: number): number {
  return (value ^ WORD15_MASK) & WORD15_MASK;
}

/** Absolute value: if negative, negate; else return as-is. */
export function onesAbs(value: number): number {
  if (isNegative(value)) {
    return onesNegate(value);
  }
  return value & WORD15_MASK;
}

// ─── Addition ──────────────────────────────────────────────────────────────

export interface ArithResult {
  value: number;
  overflow: boolean;
}

/**
 * Ones' complement 15-bit addition with end-around carry.
 *
 * 1. Add as unsigned integers.
 * 2. If sum exceeds 15 bits, wrap the carry bit back (end-around carry).
 * 3. Overflow if both operands same sign but result differs.
 */
export function onesAdd(a: number, b: number): ArithResult {
  const va = a & WORD15_MASK;
  const vb = b & WORD15_MASK;

  let sum = va + vb;

  // End-around carry: if bit 15 is set, add it back to bit 0
  if (sum > WORD15_MASK) {
    sum = (sum & WORD15_MASK) + 1;
    // Could overflow again (e.g., -0 + -0 = 0o77777 + 0o77777 = 0o177776 -> 0o77777 + 1 -> could wrap)
    if (sum > WORD15_MASK) {
      sum = (sum & WORD15_MASK) + 1;
    }
  }

  sum = sum & WORD15_MASK;

  // Overflow detection: same-sign operands produce different-sign result
  const signA = va & 0o40000;
  const signB = vb & 0o40000;
  const signR = sum & 0o40000;
  const overflowed = (signA === signB) && (signR !== signA);

  return { value: sum, overflow: overflowed };
}

/** Ones' complement subtraction: a - b = a + negate(b). */
export function onesSub(a: number, b: number): ArithResult {
  return onesAdd(a, onesNegate(b));
}

// ─── 16-bit Accumulator overflow ───────────────────────────────────────────

/**
 * Detect overflow state from 16-bit A register value.
 * Bits 15,14:
 *   00 = positive, no overflow
 *   11 = negative, no overflow
 *   01 = positive overflow
 *   10 = negative overflow
 */
export function overflow(a16: number): 'none' | 'positive' | 'negative' {
  const bit15 = (a16 >> 15) & 1;
  const bit14 = (a16 >> 14) & 1;

  if (bit15 === bit14) return 'none';
  if (bit15 === 0 && bit14 === 1) return 'positive';
  return 'negative';
}

/**
 * Extract the overflow-corrected 15-bit value from a 16-bit A register.
 * If overflow, the sign bit was wrong -- correct it based on bit 15.
 */
export function overflowCorrect(a16: number): number {
  const ov = overflow(a16);
  const lower14 = a16 & 0o37777; // bits 0-13

  switch (ov) {
    case 'none':
      // No overflow: just take bits 0-14
      return a16 & WORD15_MASK;
    case 'positive':
      // Positive overflow (bit 15=0, bit 14=1): real sign is positive (bit 14 should be 0)
      return lower14; // Clear bit 14 (sign = 0, positive)
    case 'negative':
      // Negative overflow (bit 15=1, bit 14=0): real sign is negative (bit 14 should be 1)
      return lower14 | 0o40000; // Set bit 14 (sign = 1, negative)
  }
}

// ─── Increment / Decrement ─────────────────────────────────────────────────

/** Increment by 1 (ones' complement). */
export function onesIncrement(value: number): ArithResult {
  return onesAdd(value, 1);
}

/** Decrement by 1 (ones' complement). */
export function onesDecrement(value: number): ArithResult {
  return onesAdd(value, onesNegate(1));
}

// ─── Diminish ──────────────────────────────────────────────────────────────

/**
 * Diminish: move toward zero.
 * - Positive: decrement (5 -> 4)
 * - Negative: increment magnitude toward zero (-5 -> -4)
 * - Zero: no change
 */
export function diminish(value: number): number {
  const v = value & WORD15_MASK;

  if (isZero(v)) return v;

  if (isNegative(v)) {
    // Negative: decrement magnitude = increment in ones' complement
    // -5 (0o77772) + 1 -> -4 (0o77773)
    return onesAdd(v, 1).value;
  }

  // Positive: decrement
  return onesAdd(v, onesNegate(1)).value;
}

// ─── Multiplication ────────────────────────────────────────────────────────

export interface DoubleWord {
  high: number;
  low: number;
}

/**
 * AGC multiplication: both operands are 15-bit ones' complement fractions.
 * Result is a 30-bit double-precision value split into {high, low}.
 *
 * Treats operands as signed fractions in [-1, +1) with 14 fractional bits.
 * Product magnitude = |a| * |b|, sign = XOR of input signs.
 */
export function onesMultiply(a: number, b: number): DoubleWord {
  const va = a & WORD15_MASK;
  const vb = b & WORD15_MASK;

  // Handle zero cases
  if (isZero(va) || isZero(vb)) {
    return { high: 0, low: 0 };
  }

  // Determine result sign
  const negA = isNegative(va);
  const negB = isNegative(vb);
  const resultNegative = negA !== negB;

  // Get magnitudes (14-bit unsigned)
  const magA = negA ? onesNegate(va) & 0o37777 : va & 0o37777;
  const magB = negB ? onesNegate(vb) & 0o37777 : vb & 0o37777;

  // Multiply magnitudes: product is up to 28 bits
  const product = magA * magB;

  // Split into high 14 bits and low 14 bits
  // The product of two 14-bit fractions: shift right by 14 to get the high word
  const highMag = (product >> 14) & 0o37777;
  const lowMag = product & 0o37777;

  // Apply sign
  if (resultNegative) {
    return {
      high: highMag === 0 && lowMag === 0 ? 0 : onesNegate(highMag) & WORD15_MASK,
      low: lowMag === 0 ? 0 : onesNegate(lowMag) & WORD15_MASK,
    };
  }

  return { high: highMag, low: lowMag };
}

// ─── Division ──────────────────────────────────────────────────────────────

export interface DivResult {
  quotient: number;
  remainder: number;
  overflow: boolean;
}

/**
 * AGC division: (high, low) double-precision / single-precision divisor.
 * Returns quotient and remainder as 15-bit ones' complement.
 */
export function onesDivide(high: number, low: number, divisor: number): DivResult {
  const vd = divisor & WORD15_MASK;

  // Division by zero
  if (isZero(vd)) {
    return { quotient: 0, remainder: 0, overflow: true };
  }

  const negH = isNegative(high & WORD15_MASK);
  const negD = isNegative(vd);
  const resultNegative = negH !== negD;

  // Get magnitudes
  const magH = negH ? onesNegate(high & WORD15_MASK) & 0o37777 : (high & WORD15_MASK) & 0o37777;
  const magL = isNegative(low & WORD15_MASK) ? onesNegate(low & WORD15_MASK) & 0o37777 : (low & WORD15_MASK) & 0o37777;
  const magD = negD ? onesNegate(vd) & 0o37777 : vd & 0o37777;

  // Combine into 28-bit dividend
  const dividend = (magH << 14) | magL;

  // Check for overflow: dividend magnitude >= divisor magnitude * 2^14
  if (magH >= magD) {
    return { quotient: 0, remainder: 0, overflow: true };
  }

  const quotMag = Math.floor(dividend / magD);
  const remMag = dividend % magD;

  // Apply signs
  const quotient = resultNegative && quotMag > 0
    ? onesNegate(quotMag & 0o37777)
    : quotMag & WORD15_MASK;
  const remainder = negH && remMag > 0
    ? onesNegate(remMag & 0o37777)
    : remMag & WORD15_MASK;

  return { quotient, remainder, overflow: false };
}

// ─── Double precision addition ─────────────────────────────────────────────

export interface DoubleAddResult {
  high: number;
  low: number;
  overflow: boolean;
}

/**
 * Double-precision (30-bit) addition.
 * Adds (h1,l1) + (h2,l2) with carry from low to high.
 */
export function onesDoubleAdd(
  h1: number,
  l1: number,
  h2: number,
  l2: number,
): DoubleAddResult {
  // Add low words
  const lowResult = onesAdd(l1, l2);

  // Add high words, plus carry from low overflow
  let highResult: ArithResult;
  if (lowResult.overflow) {
    const h = onesAdd(h1, h2);
    highResult = onesAdd(h.value, 1);
    // If first high add already overflowed, propagate
    if (h.overflow) {
      highResult = { value: highResult.value, overflow: true };
    }
  } else {
    highResult = onesAdd(h1, h2);
  }

  return {
    high: highResult.value,
    low: lowResult.value,
    overflow: highResult.overflow,
  };
}
