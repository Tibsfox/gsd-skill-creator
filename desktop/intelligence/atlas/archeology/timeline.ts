/**
 * Mission Archeology — timeline subcomponent.
 *
 * Composes `timeScale` + `axisToSvg`, then overlays per-mission tick marks
 * with rotated labels (45° when tick density > LABEL_DENSITY_THRESHOLD).
 *
 * Pure SVG-string emission via the upstream axis renderer; click handling
 * is wired by re-parsing the emitted SVG into a host SVG element via
 * innerHTML and attaching native listeners on the produced <g> children.
 *
 * @module desktop/intelligence/atlas/archeology/timeline
 */

import { timeScale, axisToSvg } from '../../../../src/atlas/scales/index.js';
import type { MilestoneLink } from './types.js';

export interface TimelineOptions {
  width: number;
  height: number;
  /** Above this many ticks in the visible range, labels rotate 45°. */
  rotateThreshold?: number;
}

const DEFAULTS: Required<TimelineOptions> = {
  width: 960,
  height: 64,
  rotateThreshold: 8,
};

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface TimelineRender {
  /** SVG string fragment for the axis spine + ticks (no events). */
  axisSvg: string;
  /** Computed tick positions in pixels for each mission, by missionId. */
  tickPositions: Map<string, number>;
  /** Whether labels should be rotated for legibility. */
  rotated: boolean;
}

export interface TimelineComponent {
  mount(host: SVGGElement | HTMLElement): void;
  setMissions(missions: MilestoneLink[]): void;
  setFocus(missionId: string | null): void;
  onSelect(cb: (missionId: string) => void): void;
  unmount(): void;
}

/** Pure layout — no DOM. Useful for tests and SSR. */
export function layoutTimeline(
  missions: MilestoneLink[],
  opts: TimelineOptions = { width: 960, height: 64 },
): TimelineRender {
  const o = { ...DEFAULTS, ...opts };
  if (missions.length === 0) {
    return { axisSvg: '', tickPositions: new Map(), rotated: false };
  }
  const sorted = [...missions].sort((a, b) => a.shippedAt - b.shippedAt);
  const lo = sorted[0].shippedAt;
  const hi = sorted[sorted.length - 1].shippedAt;
  // Pad single-mission case so the scale is well-defined.
  const domain: [Date, Date] =
    lo === hi
      ? [new Date(lo - 86400_000), new Date(hi + 86400_000)]
      : [new Date(lo), new Date(hi)];

  const scale = timeScale(domain, [16, o.width - 16]);
  const tickPositions = new Map<string, number>();
  for (const m of sorted) {
    tickPositions.set(m.missionId, scale(new Date(m.shippedAt)));
  }
  const rotated = sorted.length > o.rotateThreshold;
  // Use the upstream axis renderer for the spine (auto-derived ticks).  The
  // mission-specific ticks are overlaid by mount() because they need
  // per-mission ids on the <g> for click delegation.
  const axisSvg = axisToSvg(scale.ticks(), (v) => scale(v as Date), {
    orientation: 'bottom',
    length: o.width,
    className: 'archeology-axis',
  });
  return { axisSvg, tickPositions, rotated };
}

export function createTimeline(opts: TimelineOptions = { width: 960, height: 64 }): TimelineComponent {
  let missions: MilestoneLink[] = [];
  let focused: string | null = null;
  let selectCb: (id: string) => void = () => {};
  let host: SVGGElement | HTMLElement | null = null;

  function render(): void {
    if (!host) return;
    host.innerHTML = '';
    const { axisSvg, tickPositions, rotated } = layoutTimeline(missions, opts);

    // The axis fragment is an SVG <g>; embed it inside an <svg> container so
    // it renders even when the host is a plain HTML element.
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', String(opts.width));
    svg.setAttribute('height', String(opts.height));
    svg.setAttribute('class', 'archeology-timeline');
    // Translate the axis to the vertical centre-ish so labels have room above.
    const axisGroup = document.createElementNS(SVG_NS, 'g');
    axisGroup.setAttribute('transform', `translate(0,${opts.height / 2})`);
    axisGroup.innerHTML = axisSvg;
    svg.appendChild(axisGroup);

    // Mission ticks (foreground, clickable).
    const tickGroup = document.createElementNS(SVG_NS, 'g');
    tickGroup.setAttribute('class', 'archeology-mission-ticks');
    for (const m of missions) {
      const x = tickPositions.get(m.missionId);
      if (x === undefined) continue;
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', `mission-tick${focused === m.missionId ? ' is-focused' : ''}`);
      g.setAttribute('data-mission-id', m.missionId);
      g.setAttribute('transform', `translate(${x},${opts.height / 2})`);
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', m.label);
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('r', focused === m.missionId ? '5' : '3');
      dot.setAttribute('cy', '0');
      dot.setAttribute('class', 'tick-dot');
      g.appendChild(dot);
      const text = document.createElementNS(SVG_NS, 'text');
      const labelTransform = rotated ? `rotate(-45) translate(2,-6)` : `translate(0,-10)`;
      text.setAttribute('transform', labelTransform);
      text.setAttribute('text-anchor', rotated ? 'end' : 'middle');
      text.setAttribute('font-size', '11');
      text.textContent = m.label;
      g.appendChild(text);
      g.addEventListener('click', () => selectCb(m.missionId));
      g.addEventListener('keydown', (ke: KeyboardEvent) => {
        if (ke.key === 'Enter' || ke.key === ' ') {
          ke.preventDefault();
          selectCb(m.missionId);
        }
      });
      tickGroup.appendChild(g);
    }
    svg.appendChild(tickGroup);

    if (host instanceof SVGElement) {
      // host is an svg <g> or similar — wrap by appending children directly.
      while (svg.firstChild) host.appendChild(svg.firstChild);
    } else {
      host.appendChild(svg);
    }
  }

  return {
    mount(h) {
      host = h;
      render();
    },
    setMissions(m) {
      missions = m;
      render();
    },
    setFocus(id) {
      focused = id;
      render();
    },
    onSelect(cb) {
      selectCb = cb;
    },
    unmount() {
      if (host) host.innerHTML = '';
      host = null;
    },
  };
}
