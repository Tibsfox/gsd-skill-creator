/**
 * Tests for MCC calculator.
 */
import { describe, it, expect } from 'vitest';
import { calculateMCC, mccToPercentage } from './mcc-calculator.js';

describe('calculateMCC', () => {
  it('returns 1.0 for perfect prediction (all correct)', () => {
    // All positives correctly identified, all negatives correctly identified
    const mcc = calculateMCC(50, 50, 0, 0);
    expect(mcc).toBe(1.0);
  });

  it('returns -1.0 for inverse prediction (all wrong)', () => {
    // All positives misclassified as negative, all negatives misclassified as positive
    const mcc = calculateMCC(0, 0, 50, 50);
    expect(mcc).toBe(-1.0);
  });

  it('returns value near 0 for random prediction', () => {
    // Equal distribution across all quadrants = random
    const mcc = calculateMCC(25, 25, 25, 25);
    expect(mcc).toBe(0);
  });

  it('returns 0 when all predictions are same class (all positive)', () => {
    // All predicted positive (no negative predictions)
    // Denominator becomes 0 because (TN + FP) = 0
    const mcc = calculateMCC(50, 0, 50, 0);
    expect(mcc).toBe(0);
  });

  it('returns 0 when all predictions are same class (all negative)', () => {
    // All predicted negative (no positive predictions)
    // Denominator becomes 0 because (TP + FP) = 0
    const mcc = calculateMCC(0, 50, 0, 50);
    expect(mcc).toBe(0);
  });

  it('returns 0 when all actual values are same class (all actual positive)', () => {
    // All actual positive (no actual negative)
    // Denominator becomes 0 because (TN + FN) = 0
    const mcc = calculateMCC(50, 0, 0, 50);
    expect(mcc).toBe(0);
  });

  it('returns 0 when all actual values are same class (all actual negative)', () => {
    // All actual negative (no actual positive)
    // Denominator becomes 0 because (TP + FN) = 0
    const mcc = calculateMCC(0, 50, 50, 0);
    expect(mcc).toBe(0);
  });

  it('handles realistic benchmark scenario with good correlation', () => {
    // 45 TP, 92 TN, 5 FP, 8 FN (from plan example)
    const mcc = calculateMCC(45, 92, 5, 8);
    // Expected MCC calculation:
    // numerator = 45*92 - 5*8 = 4140 - 40 = 4100
    // denominator = sqrt((45+5)*(45+8)*(92+5)*(92+8))
    //             = sqrt(50 * 53 * 97 * 100)
    //             = sqrt(25705000) = 5070.01
    // MCC = 4100 / 5070.01 = 0.809
    expect(mcc).toBeCloseTo(0.809, 2);
  });

  it('handles all zeros (no data)', () => {
    const mcc = calculateMCC(0, 0, 0, 0);
    expect(mcc).toBe(0);
  });

  it('returns positive value when predictions correlate with actuals', () => {
    // More TP and TN than FP and FN
    const mcc = calculateMCC(40, 40, 10, 10);
    expect(mcc).toBeGreaterThan(0);
  });

  it('returns negative value when predictions inversely correlate', () => {
    // More FP and FN than TP and TN
    const mcc = calculateMCC(10, 10, 40, 40);
    expect(mcc).toBeLessThan(0);
  });
});

describe('mccToPercentage', () => {
  it('converts MCC 1.0 to 100%', () => {
    expect(mccToPercentage(1.0)).toBe(100);
  });

  it('converts MCC 0.5 to 50%', () => {
    expect(mccToPercentage(0.5)).toBe(50);
  });

  it('converts MCC 0 to 0%', () => {
    expect(mccToPercentage(0)).toBe(0);
  });

  it('converts MCC -1.0 to -100%', () => {
    expect(mccToPercentage(-1.0)).toBe(-100);
  });

  it('rounds to nearest integer', () => {
    expect(mccToPercentage(0.857)).toBe(86);
    expect(mccToPercentage(0.854)).toBe(85);
  });

  it('handles realistic MCC value', () => {
    // MCC of 0.809 from our benchmark scenario
    expect(mccToPercentage(0.809)).toBe(81);
  });
});
