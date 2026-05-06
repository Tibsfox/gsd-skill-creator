/**
 * Render a scale axis as an SVG string.
 * Pure string generation — no DOM API usage.
 * @module atlas/scales/axis-svg
 */

import type { Orientation } from './types.js';

export interface AxisOptions {
  orientation: Orientation;
  /** Length of the axis in pixels. */
  length: number;
  /** Tick size (pixels). Default 6. */
  tickSize?: number;
  /** Offset from tick end to label. Default 3. */
  labelOffset?: number;
  /** CSS class for the root <g>. */
  className?: string;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatTick(v: unknown): string {
  if (v instanceof Date) {
    return v.toISOString().slice(0, 16).replace('T', ' ');
  }
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : parseFloat(v.toPrecision(6)).toString();
  }
  return String(v);
}

/**
 * Render an axis as an SVG <g> element string.
 *
 * @param ticks   Array of domain values at which to draw ticks.
 * @param toPixel Map domain value to pixel position along the axis.
 * @param opts    Axis rendering options.
 */
export function axisToSvg(
  ticks: unknown[],
  toPixel: (v: unknown) => number,
  opts: AxisOptions,
): string {
  const { orientation, tickSize = 6, labelOffset = 3, className } = opts;
  const isVertical = orientation === 'left' || orientation === 'right';
  const isEnd = orientation === 'right' || orientation === 'bottom';
  const sign = isEnd ? 1 : -1;

  const classAttr = className ? ` class="${esc(className)}"` : '';
  let inner = '';

  for (const tick of ticks) {
    const pos = toPixel(tick);
    const label = esc(formatTick(tick));
    if (isVertical) {
      const x2 = sign * tickSize;
      const lx = sign * (tickSize + labelOffset);
      const anchor = isEnd ? 'start' : 'end';
      inner += `<g transform="translate(0,${pos})">`;
      inner += `<line x1="0" y1="0" x2="${x2}" y2="0" stroke="currentColor" stroke-width="1"/>`;
      inner += `<text x="${lx}" y="0" dy="0.32em" text-anchor="${anchor}" font-size="11">${label}</text>`;
      inner += `</g>`;
    } else {
      const y2 = sign * tickSize;
      const ly = sign * (tickSize + labelOffset);
      const baseline = isEnd ? 'hanging' : 'auto';
      inner += `<g transform="translate(${pos},0)">`;
      inner += `<line x1="0" y1="0" x2="0" y2="${y2}" stroke="currentColor" stroke-width="1"/>`;
      inner += `<text x="0" y="${ly}" text-anchor="middle" dominant-baseline="${baseline}" font-size="11">${label}</text>`;
      inner += `</g>`;
    }
  }

  // Spine
  if (isVertical) {
    inner += `<line x1="0" y1="0" x2="0" y2="${opts.length}" stroke="currentColor" stroke-width="1"/>`;
  } else {
    inner += `<line x1="0" y1="0" x2="${opts.length}" y2="0" stroke="currentColor" stroke-width="1"/>`;
  }

  return `<g${classAttr}>${inner}</g>`;
}
