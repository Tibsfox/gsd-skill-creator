/**
 * Linear scale: maps a numeric domain [a, b] to a numeric range [c, d].
 * @module atlas/scales/linear
 */

import { heckbertTicks } from './ticks-heckbert.js';

function clampNum(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export interface LinearScale {
  (value: number): number;
  invert(value: number): number;
  domain(): [number, number];
  domain(d: [number, number]): LinearScale;
  range(): [number, number];
  range(r: [number, number]): LinearScale;
  clamp(): boolean;
  clamp(c: boolean): LinearScale;
  ticks(count?: number): number[];
}

export function linearScale(
  initialDomain: [number, number] = [0, 1],
  initialRange: [number, number] = [0, 1],
): LinearScale {
  let _domain: [number, number] = [...initialDomain] as [number, number];
  let _range: [number, number] = [...initialRange] as [number, number];
  let _clamp = false;

  function interpolate(value: number): number {
    const [d0, d1] = _domain;
    const [r0, r1] = _range;
    const t = d1 === d0 ? 0 : (value - d0) / (d1 - d0);
    const tc = _clamp ? clampNum(t, 0, 1) : t;
    return r0 + tc * (r1 - r0);
  }

  function scale(value: number): number {
    return interpolate(value);
  }

  scale.invert = function (value: number): number {
    const [d0, d1] = _domain;
    const [r0, r1] = _range;
    const t = r1 === r0 ? 0 : (value - r0) / (r1 - r0);
    const tc = _clamp ? clampNum(t, 0, 1) : t;
    return d0 + tc * (d1 - d0);
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

  scale.clamp = function (c?: boolean): any {
    if (c === undefined) return _clamp;
    _clamp = c;
    return scale;
  };

  scale.ticks = function (count = 5): number[] {
    const [d0, d1] = _domain;
    return heckbertTicks(Math.min(d0, d1), Math.max(d0, d1), count).ticks;
  };

  return scale as LinearScale;
}
