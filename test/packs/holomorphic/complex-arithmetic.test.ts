import { describe, it, expect } from 'vitest';
import type { ComplexNumber } from '../../../src/packs/holomorphic/types';
import {
  add,
  sub,
  mul,
  div,
  magnitude,
  argument,
  conjugate,
  cexp,
  cpow,
  ZERO,
  ONE,
  I,
} from '../../../src/packs/holomorphic/complex/arithmetic';

/* ------------------------------------------------------------------ */
/*  Complex arithmetic tests                                            */
/* ------------------------------------------------------------------ */

describe('Complex Arithmetic', () => {
  const a: ComplexNumber = { re: 1, im: 2 };
  const b: ComplexNumber = { re: 3, im: 4 };

  it('add(a, b) returns correct sum', () => {
    const result = add(a, b);
    expect(result.re).toBe(4);
    expect(result.im).toBe(6);
  });

  it('sub(a, b) returns correct difference', () => {
    const result = sub(a, b);
    expect(result.re).toBe(-2);
    expect(result.im).toBe(-2);
  });

  it('mul(a, b) returns correct product with cross terms', () => {
    // (1+2i)(3+4i) = (1*3 - 2*4) + (1*4 + 2*3)i = -5 + 10i
    const result = mul(a, b);
    expect(result.re).toBe(-5);
    expect(result.im).toBe(10);
  });

  it('div(a, b) returns correct quotient via conjugate method', () => {
    // (1+2i)/(3+4i) = (1+2i)(3-4i) / (9+16) = (3+8 + (6-4)i) / 25 = 11/25 + 2i/25
    const result = div(a, b);
    expect(result.re).toBeCloseTo(11 / 25);
    expect(result.im).toBeCloseTo(2 / 25);
  });

  it('magnitude(z) returns sqrt(re^2 + im^2)', () => {
    const z: ComplexNumber = { re: 3, im: 4 };
    expect(magnitude(z)).toBe(5);
  });

  it('argument(z) returns atan2(im, re)', () => {
    const z: ComplexNumber = { re: 1, im: 1 };
    expect(argument(z)).toBeCloseTo(Math.PI / 4);
  });

  it('conjugate(z) returns {re, -im}', () => {
    const z: ComplexNumber = { re: 2, im: 3 };
    const result = conjugate(z);
    expect(result.re).toBe(2);
    expect(result.im).toBe(-3);
  });

  it('cexp(z) returns e^re * (cos(im) + i*sin(im))', () => {
    // e^(0 + i*PI) = cos(PI) + i*sin(PI) = -1 + 0i
    const z: ComplexNumber = { re: 0, im: Math.PI };
    const result = cexp(z);
    expect(result.re).toBeCloseTo(-1);
    expect(result.im).toBeCloseTo(0);
  });

  it('cpow(z, n) returns z^n', () => {
    // (1+i)^2 = 1 + 2i + i^2 = 2i
    const z: ComplexNumber = { re: 1, im: 1 };
    const result = cpow(z, 2);
    expect(result.re).toBeCloseTo(0);
    expect(result.im).toBeCloseTo(2);
  });

  it('Identity: add(z, ZERO) = z', () => {
    const z: ComplexNumber = { re: 7, im: -3 };
    const result = add(z, ZERO);
    expect(result.re).toBe(z.re);
    expect(result.im).toBe(z.im);
  });

  it('Identity: mul(z, ONE) = z', () => {
    const z: ComplexNumber = { re: 7, im: -3 };
    const result = mul(z, ONE);
    expect(result.re).toBe(z.re);
    expect(result.im).toBe(z.im);
  });

  it('Division by zero returns {re: Infinity, im: Infinity}', () => {
    const result = div(a, ZERO);
    expect(result.re).toBe(Infinity);
    expect(result.im).toBe(Infinity);
  });

  it('magnitude({re:3, im:4}) = 5', () => {
    expect(magnitude({ re: 3, im: 4 })).toBe(5);
  });

  it('argument({re:1, im:1}) = PI/4', () => {
    expect(argument({ re: 1, im: 1 })).toBeCloseTo(Math.PI / 4);
  });

  it('conjugate({re:2, im:3}) = {re:2, im:-3}', () => {
    const result = conjugate({ re: 2, im: 3 });
    expect(result.re).toBe(2);
    expect(result.im).toBe(-3);
  });
});
