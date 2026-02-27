import type { ComplexNumber } from '../types';

/** Additive identity */
export const ZERO: ComplexNumber = { re: 0, im: 0 };

/** Multiplicative identity */
export const ONE: ComplexNumber = { re: 1, im: 0 };

/** Imaginary unit */
export const I: ComplexNumber = { re: 0, im: 1 };

/** Add two complex numbers: (a + bi) + (c + di) = (a+c) + (b+d)i */
export function add(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return { re: a.re + b.re, im: a.im + b.im };
}

/** Subtract two complex numbers: (a + bi) - (c + di) = (a-c) + (b-d)i */
export function sub(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return { re: a.re - b.re, im: a.im - b.im };
}

/** Multiply two complex numbers: (a + bi)(c + di) = (ac - bd) + (ad + bc)i */
export function mul(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

/**
 * Divide two complex numbers via conjugate method:
 * (a + bi) / (c + di) = (a + bi)(c - di) / (c^2 + d^2)
 *
 * Division by zero returns {re: Infinity, im: Infinity}.
 */
export function div(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  const denom = b.re * b.re + b.im * b.im;
  if (denom === 0) {
    return { re: Infinity, im: Infinity };
  }
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom,
  };
}

/** Magnitude (modulus): |z| = sqrt(re^2 + im^2) */
export function magnitude(z: ComplexNumber): number {
  return Math.sqrt(z.re * z.re + z.im * z.im);
}

/** Argument (phase angle): arg(z) = atan2(im, re) */
export function argument(z: ComplexNumber): number {
  return Math.atan2(z.im, z.re);
}

/** Complex conjugate: conj(a + bi) = a - bi */
export function conjugate(z: ComplexNumber): ComplexNumber {
  return { re: z.re, im: -z.im };
}

/**
 * Complex exponential: e^z = e^re * (cos(im) + i*sin(im))
 *
 * Euler's formula applied to arbitrary complex numbers.
 */
export function cexp(z: ComplexNumber): ComplexNumber {
  const expRe = Math.exp(z.re);
  return {
    re: expRe * Math.cos(z.im),
    im: expRe * Math.sin(z.im),
  };
}

/**
 * Complex integer power: z^n computed via repeated multiplication.
 *
 * Uses the polar form: z^n = |z|^n * e^(i*n*arg(z))
 */
export function cpow(z: ComplexNumber, n: number): ComplexNumber {
  const r = magnitude(z);
  const theta = argument(z);
  const rn = Math.pow(r, n);
  return {
    re: rn * Math.cos(n * theta),
    im: rn * Math.sin(n * theta),
  };
}
