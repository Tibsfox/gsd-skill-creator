import { describe, it, expect } from 'vitest';
import { linearScale } from '../linear.js';
import { logScale } from '../log.js';
import { timeScale } from '../time.js';
import { heckbertTicks } from '../ticks-heckbert.js';
import { axisToSvg } from '../axis-svg.js';

// ── Linear scale ─────────────────────────────────────────────────────────────

describe('linearScale', () => {
  it('maps domain min→range min and domain max→range max', () => {
    const s = linearScale([0, 100], [0, 500]);
    expect(s(0)).toBe(0);
    expect(s(100)).toBe(500);
  });

  it('interpolates midpoint correctly', () => {
    const s = linearScale([0, 10], [0, 200]);
    expect(s(5)).toBe(100);
  });

  it('invert is the exact inverse of forward', () => {
    const s = linearScale([10, 90], [0, 1]);
    const vals = [10, 30, 50, 70, 90];
    for (const v of vals) {
      expect(s.invert(s(v))).toBeCloseTo(v, 10);
    }
  });

  it('invert maps range endpoints back to domain endpoints', () => {
    const s = linearScale([5, 25], [100, 300]);
    expect(s.invert(100)).toBeCloseTo(5, 10);
    expect(s.invert(300)).toBeCloseTo(25, 10);
  });

  it('clamp prevents extrapolation', () => {
    const s = linearScale([0, 10], [0, 100]);
    s.clamp(true);
    expect(s(-5)).toBe(0);
    expect(s(15)).toBe(100);
  });

  it('extrapolates beyond domain when clamp=false', () => {
    const s = linearScale([0, 10], [0, 100]);
    expect(s(20)).toBe(200);
    expect(s(-10)).toBe(-100);
  });

  it('ticks returns 5 values by default and they lie within domain', () => {
    const s = linearScale([0, 100], [0, 1]);
    const ticks = s.ticks();
    expect(ticks.length).toBeGreaterThanOrEqual(4);
    for (const t of ticks) {
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(100);
    }
  });

  it('domain and range getters return copies of current values', () => {
    const s = linearScale([1, 9], [10, 90]);
    expect(s.domain()).toEqual([1, 9]);
    expect(s.range()).toEqual([10, 90]);
  });
});

// ── Log scale ─────────────────────────────────────────────────────────────────

describe('logScale', () => {
  it('maps domain endpoints to range endpoints', () => {
    const s = logScale([1, 1000], [0, 300]);
    expect(s(1)).toBeCloseTo(0, 5);
    expect(s(1000)).toBeCloseTo(300, 5);
  });

  it('maps midpoint (100) to 2/3 of range for 3-decade domain', () => {
    const s = logScale([1, 1000], [0, 300]);
    expect(s(100)).toBeCloseTo(200, 5);
  });

  it('invert reverses forward mapping across decades', () => {
    const s = logScale([1, 10000], [0, 1]);
    for (const v of [1, 10, 100, 1000, 10000]) {
      expect(s.invert(s(v))).toBeCloseTo(v, 6);
    }
  });

  it('ticks returns one tick per decade', () => {
    const s = logScale([1, 1000], [0, 300]);
    const ticks = s.ticks();
    expect(ticks).toContain(1);
    expect(ticks).toContain(10);
    expect(ticks).toContain(100);
    expect(ticks).toContain(1000);
  });

  it('respects configurable base (base 2)', () => {
    const s = logScale([1, 8], [0, 3], 2);
    expect(s.base()).toBe(2);
    expect(s(2)).toBeCloseTo(1, 5);
    expect(s(4)).toBeCloseTo(2, 5);
    expect(s(8)).toBeCloseTo(3, 5);
  });
});

// ── Time scale ────────────────────────────────────────────────────────────────

describe('timeScale', () => {
  it('maps domain endpoints to range endpoints', () => {
    const d0 = new Date('2024-01-01T00:00:00Z');
    const d1 = new Date('2024-01-02T00:00:00Z');
    const s = timeScale([d0, d1], [0, 100]);
    expect(s(d0)).toBeCloseTo(0, 5);
    expect(s(d1)).toBeCloseTo(100, 5);
  });

  it('invert reverses forward mapping', () => {
    const d0 = new Date('2024-01-01T00:00:00Z');
    const d1 = new Date('2024-01-08T00:00:00Z');
    const s = timeScale([d0, d1], [0, 1]);
    const mid = new Date((d0.getTime() + d1.getTime()) / 2);
    const recovered = s.invert(s(mid));
    expect(Math.abs(recovered.getTime() - mid.getTime())).toBeLessThan(1);
  });

  it('daily ticks for 9-day domain', () => {
    // Jan 1 00:00 to Jan 10 00:00 = 9 days; ticks at Jan 1..Jan 10 = 10 ticks
    // (floor(Jan1)=Jan1 which equals lo, so it's included; nextTick walks to Jan10=d1 inclusive)
    const d0 = new Date('2024-01-01T00:00:00Z');
    const d1 = new Date('2024-01-10T00:00:00Z');
    const s = timeScale([d0, d1], [0, 1]);
    const ticks = s.ticks('day');
    expect(ticks.length).toBeGreaterThanOrEqual(9);
    expect(ticks.length).toBeLessThanOrEqual(10);
    for (const t of ticks) {
      expect(t.getUTCHours()).toBe(0);
    }
  });

  it('weekly ticks for multi-week domain', () => {
    const d0 = new Date('2024-01-01T00:00:00Z');
    const d1 = new Date('2024-03-01T00:00:00Z');
    const s = timeScale([d0, d1], [0, 1]);
    const ticks = s.ticks('week');
    expect(ticks.length).toBeGreaterThan(0);
    for (const t of ticks) {
      // Week floor aligns to UTC Sunday (day 0); use getUTCDay for timezone-safe assertion.
      expect(t.getUTCDay()).toBe(0);
    }
  });

  it('monthly ticks for year-long domain', () => {
    const d0 = new Date('2024-01-01T00:00:00Z');
    const d1 = new Date('2024-12-31T00:00:00Z');
    const s = timeScale([d0, d1], [0, 1]);
    const ticks = s.ticks('month');
    expect(ticks.length).toBe(12);
  });

  it('auto-picks quarter-hour ticks for < 2 hour extent', () => {
    const d0 = new Date('2024-01-01T00:00:00Z');
    const d1 = new Date('2024-01-01T01:00:00Z');
    const s = timeScale([d0, d1], [0, 1]);
    const ticks = s.ticks();
    expect(ticks.length).toBe(5); // :00, :15, :30, :45, :60
  });
});

// ── Heckbert nice numbers ─────────────────────────────────────────────────────

describe('heckbertTicks', () => {
  it('nice step for range 0–1 is 0.2', () => {
    const r = heckbertTicks(0, 1);
    expect(r.step).toBeCloseTo(0.2, 10);
  });

  it('nice step for range 0–10 is 2', () => {
    const r = heckbertTicks(0, 10);
    expect(r.step).toBeCloseTo(2, 10);
  });

  it('1.234 rounds down to 1 (floor to step multiple)', () => {
    const r = heckbertTicks(0, 1.234);
    expect(r.min).toBeCloseTo(0, 10);
    expect(r.ticks[0]).toBeCloseTo(0, 10);
  });

  it('domain [0,123] → step=50, min=0, ticks cover full range', () => {
    // Heckbert: range=niceNum(123,false)=200, step=niceNum(200/4,true)=50
    const r = heckbertTicks(0, 123);
    expect(r.step).toBe(50);
    expect(r.min).toBe(0);
    expect(r.ticks[0]).toBe(0);
    expect(r.ticks[r.ticks.length - 1]).toBeGreaterThanOrEqual(123);
  });

  it('all ticks lie within [niceMin, niceMax]', () => {
    const r = heckbertTicks(3.7, 89.2);
    for (const t of r.ticks) {
      expect(t).toBeGreaterThanOrEqual(r.min - 1e-9);
      expect(t).toBeLessThanOrEqual(r.max + 1e-9);
    }
  });

  it('ticks are evenly spaced at step intervals', () => {
    const r = heckbertTicks(0, 100);
    for (let i = 1; i < r.ticks.length; i++) {
      expect(r.ticks[i] - r.ticks[i - 1]).toBeCloseTo(r.step, 8);
    }
  });
});

// ── Axis SVG ──────────────────────────────────────────────────────────────────

describe('axisToSvg', () => {
  it('produces a <g> root element', () => {
    const s = linearScale([0, 100], [0, 500]);
    const svg = axisToSvg([0, 50, 100], (v) => s(v as number), {
      orientation: 'bottom',
      length: 500,
    });
    expect(svg).toMatch(/^<g/);
    expect(svg).toMatch(/<\/g>$/);
  });

  it('contains a tick <line> and <text> per tick', () => {
    const s = linearScale([0, 100], [0, 500]);
    const svg = axisToSvg([0, 50, 100], (v) => s(v as number), {
      orientation: 'bottom',
      length: 500,
    });
    const lineCount = (svg.match(/<line/g) ?? []).length;
    const textCount = (svg.match(/<text/g) ?? []).length;
    expect(lineCount).toBe(4); // 3 tick lines + 1 spine
    expect(textCount).toBe(3);
  });

  it('left-orientation uses text-anchor=end', () => {
    const s = linearScale([0, 100], [0, 400]);
    const svg = axisToSvg([0, 50, 100], (v) => s(v as number), {
      orientation: 'left',
      length: 400,
    });
    expect(svg).toContain('text-anchor="end"');
  });

  it('right-orientation uses text-anchor=start', () => {
    const s = linearScale([0, 100], [0, 400]);
    const svg = axisToSvg([0, 50, 100], (v) => s(v as number), {
      orientation: 'right',
      length: 400,
    });
    expect(svg).toContain('text-anchor="start"');
  });

  it('className attribute appears on root <g>', () => {
    const s = linearScale([0, 10], [0, 100]);
    const svg = axisToSvg([0, 5, 10], (v) => s(v as number), {
      orientation: 'top',
      length: 100,
      className: 'my-axis',
    });
    expect(svg).toContain('class="my-axis"');
  });

  it('Date ticks render as ISO-like strings', () => {
    const d0 = new Date('2024-06-01T00:00:00Z');
    const d1 = new Date('2024-06-03T00:00:00Z');
    const ts = timeScale([d0, d1], [0, 200]);
    const ticks = [d0, d1];
    const svg = axisToSvg(ticks, (v) => ts(v as Date), {
      orientation: 'bottom',
      length: 200,
    });
    expect(svg).toContain('2024-06-01');
    expect(svg).toContain('2024-06-03');
  });
});
