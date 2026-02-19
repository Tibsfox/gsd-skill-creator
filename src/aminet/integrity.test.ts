import { describe, it, expect } from 'vitest';
import { computeSha256, verifySizeKb, verifyIntegrity } from './integrity.js';

describe('computeSha256', () => {
  it('returns known hash for "hello world"', () => {
    const data = Buffer.from('hello world');
    expect(computeSha256(data)).toBe(
      'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    );
  });

  it('returns known hash for empty buffer', () => {
    const data = Buffer.alloc(0);
    expect(computeSha256(data)).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});

describe('verifySizeKb', () => {
  it('exact match: 12288 bytes = 12 KB against expectedKb=12', () => {
    const data = Buffer.alloc(12288);
    const result = verifySizeKb(data, 12);
    expect(result).toEqual({ valid: true, actualKb: 12, expectedKb: 12 });
  });

  it('strict rounding: 12800 bytes rounds to 13 KB', () => {
    const data = Buffer.alloc(12800);
    // 12800 / 1024 = 12.5, Math.round -> 13
    const result12 = verifySizeKb(data, 12);
    // 13 vs 12 = diff 1, within tolerance -> valid
    expect(result12).toEqual({ valid: true, actualKb: 13, expectedKb: 12 });

    const result13 = verifySizeKb(data, 13);
    expect(result13).toEqual({ valid: true, actualKb: 13, expectedKb: 13 });
  });

  it('INDEX rounding: 12500 bytes rounds to 12 KB', () => {
    // 12500 / 1024 = 12.207, Math.round -> 12
    const data12500 = Buffer.alloc(12500);
    expect(verifySizeKb(data12500, 12)).toEqual({
      valid: true,
      actualKb: 12,
      expectedKb: 12,
    });

    // 12700 / 1024 = 12.4, Math.round -> 12
    const data12700 = Buffer.alloc(12700);
    expect(verifySizeKb(data12700, 12)).toEqual({
      valid: true,
      actualKb: 12,
      expectedKb: 12,
    });

    // 13000 / 1024 = 12.695, Math.round -> 13
    const data13000 = Buffer.alloc(13000);
    const result = verifySizeKb(data13000, 12);
    // 13 vs 12 = diff 1, within tolerance -> valid
    expect(result).toEqual({ valid: true, actualKb: 13, expectedKb: 12 });
  });

  it('+/-1 KB tolerance: 12288 bytes (12 KB) with expectedKb=13 is valid', () => {
    const data = Buffer.alloc(12288);
    // |12 - 13| = 1, within tolerance
    expect(verifySizeKb(data, 13)).toEqual({
      valid: true,
      actualKb: 12,
      expectedKb: 13,
    });
  });

  it('+/-1 KB tolerance: 12288 bytes (12 KB) with expectedKb=14 is invalid', () => {
    const data = Buffer.alloc(12288);
    // |12 - 14| = 2, exceeds tolerance
    expect(verifySizeKb(data, 14)).toEqual({
      valid: false,
      actualKb: 12,
      expectedKb: 14,
    });
  });
});

describe('verifyIntegrity', () => {
  it('combines hash and size check when size is valid', () => {
    const data = Buffer.from('hello world');
    // 11 bytes = 0 KB rounded, expectedKb=0 -> valid (|0-0|=0)
    const result = verifyIntegrity(data, 0);
    expect(result).toEqual({
      valid: true,
      sha256: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
      sizeValid: true,
      actualKb: 0,
      expectedKb: 0,
    });
  });

  it('returns sha256 even when size check fails', () => {
    const data = Buffer.from('hello world');
    // 11 bytes = 0 KB rounded, expectedKb=12 -> invalid (|0-12|=12)
    const result = verifyIntegrity(data, 12);
    expect(result.valid).toBe(false);
    expect(result.sizeValid).toBe(false);
    expect(result.sha256).toBe(
      'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    );
    expect(result.actualKb).toBe(0);
    expect(result.expectedKb).toBe(12);
  });

  it('zero-length data with expectedKb=0 is valid', () => {
    const data = Buffer.alloc(0);
    const result = verifyIntegrity(data, 0);
    expect(result).toEqual({
      valid: true,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      sizeValid: true,
      actualKb: 0,
      expectedKb: 0,
    });
  });

  it('truncated download: 500 bytes against expectedKb=12 is invalid', () => {
    const data = Buffer.alloc(500);
    // 500 / 1024 = 0.488, Math.round -> 0 KB. |0 - 12| = 12 -> invalid
    const result = verifyIntegrity(data, 12);
    expect(result.valid).toBe(false);
    expect(result.sizeValid).toBe(false);
    expect(result.actualKb).toBe(0);
    expect(result.expectedKb).toBe(12);
    // sha256 still computed
    expect(result.sha256).toHaveLength(64);
  });
});
