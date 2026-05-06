/**
 * Logarithmic scale: maps a numeric domain [a, b] (positive) to range [c, d].
 * Base is configurable; defaults to 10.
 * @module atlas/scales/log
 */

function clampNum(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export interface LogScale {
  (value: number): number;
  invert(value: number): number;
  domain(): [number, number];
  domain(d: [number, number]): LogScale;
  range(): [number, number];
  range(r: [number, number]): LogScale;
  base(): number;
  base(b: number): LogScale;
  clamp(): boolean;
  clamp(c: boolean): LogScale;
  ticks(count?: number): number[];
}

export function logScale(
  initialDomain: [number, number] = [1, 10],
  initialRange: [number, number] = [0, 1],
  initialBase = 10,
): LogScale {
  let _domain: [number, number] = [...initialDomain] as [number, number];
  let _range: [number, number] = [...initialRange] as [number, number];
  let _base = initialBase;
  let _clamp = false;

  function logB(x: number): number {
    return Math.log(x) / Math.log(_base);
  }

  function interpolate(value: number): number {
    const [d0, d1] = _domain;
    const [r0, r1] = _range;
    const ld0 = logB(d0);
    const ld1 = logB(d1);
    const lv = logB(value);
    const t = ld1 === ld0 ? 0 : (lv - ld0) / (ld1 - ld0);
    const tc = _clamp ? clampNum(t, 0, 1) : t;
    return r0 + tc * (r1 - r0);
  }

  function scale(value: number): number {
    return interpolate(value);
  }

  scale.invert = function (value: number): number {
    const [d0, d1] = _domain;
    const [r0, r1] = _range;
    const ld0 = logB(d0);
    const ld1 = logB(d1);
    const t = r1 === r0 ? 0 : (value - r0) / (r1 - r0);
    const tc = _clamp ? clampNum(t, 0, 1) : t;
    const logVal = ld0 + tc * (ld1 - ld0);
    return Math.pow(_base, logVal);
  };

  scale.domain = function (d?: [number, number]): any {
    if (d === undefined) return [..._domain] as [number, number];
    _domain = [...d] as [number, number];
    return scale;
  };

  scale.range = function (r?: [number, number]): any {
    if (r === undefined) return [..._range] as [number, number];
    _range = [...r] as [number, number];
    return scale;
  };

  scale.base = function (b?: number): any {
    if (b === undefined) return _base;
    _base = b;
    return scale;
  };

  scale.clamp = function (c?: boolean): any {
    if (c === undefined) return _clamp;
    _clamp = c;
    return scale;
  };

  scale.ticks = function (count = 5): number[] {
    const [d0, d1] = _domain;
    const lo = Math.min(d0, d1);
    const hi = Math.max(d0, d1);
    const loExp = Math.floor(logB(lo));
    const hiExp = Math.ceil(logB(hi));
    const result: number[] = [];
    for (let exp = loExp; exp <= hiExp; exp++) {
      const v = Math.pow(_base, exp);
      if (v >= lo && v <= hi) result.push(v);
    }
    if (result.length === 0) result.push(lo, hi);
    return result;
  };

  return scale as LogScale;
}
