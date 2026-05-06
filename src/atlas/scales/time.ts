/**
 * Time scale: maps a Date domain to a numeric range.
 * Tick generation auto-picks granularity based on domain extent.
 * @module atlas/scales/time
 */

function clampNum(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

const MS = {
  minute: 60 * 1000,
  quarter: 15 * 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
} as const;

export type TimeGranularity = 'quarter-hour' | 'hour' | 'day' | 'week' | 'month' | 'year';

function pickGranularity(extentMs: number): TimeGranularity {
  if (extentMs < 2 * MS.hour) return 'quarter-hour';
  if (extentMs < 2 * MS.day) return 'hour';
  if (extentMs < 2 * MS.week) return 'day';
  if (extentMs < 2 * MS.year) return 'month';
  return 'year';
}

function floorDate(d: Date, gran: TimeGranularity): Date {
  const t = d.getTime();
  switch (gran) {
    case 'quarter-hour': return new Date(Math.floor(t / MS.quarter) * MS.quarter);
    case 'hour':         return new Date(Math.floor(t / MS.hour) * MS.hour);
    case 'day':          return new Date(Math.floor(t / MS.day) * MS.day);
    case 'week': {
      const dayFloor = Math.floor(t / MS.day) * MS.day;
      const dow = new Date(dayFloor).getUTCDay();
      return new Date(dayFloor - dow * MS.day);
    }
    case 'month': {
      const u = new Date(t);
      return new Date(Date.UTC(u.getUTCFullYear(), u.getUTCMonth(), 1));
    }
    case 'year': {
      const u = new Date(t);
      return new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
    }
  }
}

function nextTick(d: Date, gran: TimeGranularity): Date {
  const t = d.getTime();
  switch (gran) {
    case 'quarter-hour': return new Date(t + MS.quarter);
    case 'hour':         return new Date(t + MS.hour);
    case 'day':          return new Date(t + MS.day);
    case 'week':         return new Date(t + MS.week);
    case 'month': {
      const u = new Date(t);
      return new Date(Date.UTC(u.getUTCFullYear(), u.getUTCMonth() + 1, 1));
    }
    case 'year': {
      const u = new Date(t);
      return new Date(Date.UTC(u.getUTCFullYear() + 1, 0, 1));
    }
  }
}

export interface TimeScale {
  (value: Date): number;
  invert(value: number): Date;
  domain(): [Date, Date];
  domain(d: [Date, Date]): TimeScale;
  range(): [number, number];
  range(r: [number, number]): TimeScale;
  clamp(): boolean;
  clamp(c: boolean): TimeScale;
  ticks(granularity?: TimeGranularity): Date[];
}

export function timeScale(
  initialDomain: [Date, Date] = [new Date(0), new Date()],
  initialRange: [number, number] = [0, 1],
): TimeScale {
  let _domain: [Date, Date] = [new Date(initialDomain[0]), new Date(initialDomain[1])];
  let _range: [number, number] = [...initialRange] as [number, number];
  let _clamp = false;

  function interpolate(value: Date): number {
    const [d0, d1] = _domain;
    const [r0, r1] = _range;
    const span = d1.getTime() - d0.getTime();
    const t = span === 0 ? 0 : (value.getTime() - d0.getTime()) / span;
    const tc = _clamp ? clampNum(t, 0, 1) : t;
    return r0 + tc * (r1 - r0);
  }

  function scale(value: Date): number {
    return interpolate(value);
  }

  scale.invert = function (value: number): Date {
    const [d0, d1] = _domain;
    const [r0, r1] = _range;
    const span = d1.getTime() - d0.getTime();
    const t = r1 === r0 ? 0 : (value - r0) / (r1 - r0);
    const tc = _clamp ? clampNum(t, 0, 1) : t;
    return new Date(d0.getTime() + tc * span);
  };

  scale.domain = function (d?: [Date, Date]): any {
    if (d === undefined) return [new Date(_domain[0]), new Date(_domain[1])] as [Date, Date];
    _domain = [new Date(d[0]), new Date(d[1])];
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

  scale.ticks = function (granularity?: TimeGranularity): Date[] {
    const [d0, d1] = _domain;
    const lo = d0.getTime() < d1.getTime() ? d0 : d1;
    const hi = d0.getTime() < d1.getTime() ? d1 : d0;
    const gran = granularity ?? pickGranularity(hi.getTime() - lo.getTime());
    const result: Date[] = [];
    let cursor = floorDate(lo, gran);
    if (cursor < lo) cursor = nextTick(cursor, gran);
    let safety = 0;
    while (cursor <= hi && safety++ < 10000) {
      result.push(new Date(cursor));
      cursor = nextTick(cursor, gran);
    }
    return result;
  };

  return scale as TimeScale;
}
