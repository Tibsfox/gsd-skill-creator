// test/proofs/helpers/complex.ts
// Complex number helpers for proof verification tests (Phase 475, Chapters 1-6)

export interface Complex {
  re: number;
  im: number;
}

export function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function complexSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function complexMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function complexMag(z: Complex): number {
  return Math.sqrt(z.re * z.re + z.im * z.im);
}

export function complexArg(z: Complex): number {
  return Math.atan2(z.im, z.re);
}

export function complexConj(z: Complex): Complex {
  return { re: z.re, im: -z.im };
}

/** Convert polar coordinates (r, theta) to complex Cartesian form. */
export function fromPolar(r: number, theta: number): Complex {
  return { re: r * Math.cos(theta), im: r * Math.sin(theta) };
}

/** Create a unit-circle point at angle theta (r = 1). */
export function fromUnitCircle(theta: number): Complex {
  return fromPolar(1, theta);
}

/** Verify that |z|^2 = re^2 + im^2. */
export function magSquared(z: Complex): number {
  return z.re * z.re + z.im * z.im;
}
