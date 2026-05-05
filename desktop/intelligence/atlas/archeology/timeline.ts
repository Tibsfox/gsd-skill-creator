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

export type PlaybackSpeed = 1 | 2 | 4 | 8;

export interface TimelineComponent {
  mount(host: SVGGElement | HTMLElement): void;
  setMissions(missions: MilestoneLink[]): void;
  setFocus(missionId: string | null): void;
  onSelect(cb: (missionId: string) => void): void;
  /** Fires when the time-lapse scrubber moves to a new mission. */
  onCursor(cb: (missionId: string) => void): void;
  /** Programmatically move the scrubber (used by tests and external reset). */
  setCursor(missionId: string | null): void;
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
  let cursor: string | null = null;
  let playing = false;
  let speed: PlaybackSpeed = 1;
  let playTimer: ReturnType<typeof setInterval> | null = null;
  let selectCb: (id: string) => void = () => {};
  let cursorCb: (id: string) => void = () => {};
  let host: SVGGElement | HTMLElement | null = null;
  let controlBar: HTMLElement | null = null;

  function sortedMissions(): MilestoneLink[] {
    return [...missions].sort((a, b) => a.shippedAt - b.shippedAt);
  }

  function stopPlayback(): void {
    if (playTimer !== null) {
      clearInterval(playTimer);
      playTimer = null;
    }
    playing = false;
    updatePlayButton();
  }

  function updatePlayButton(): void {
    if (!controlBar) return;
    const btn = controlBar.querySelector<HTMLButtonElement>('.tl-play-btn');
    if (btn) btn.textContent = playing ? '⏸' : '▶';
  }

  function advanceCursor(): void {
    const sorted = sortedMissions();
    if (sorted.length === 0) return;
    if (cursor === null) {
      cursor = sorted[0].missionId;
    } else {
      const idx = sorted.findIndex((m) => m.missionId === cursor);
      if (idx === -1 || idx >= sorted.length - 1) {
        stopPlayback();
        return;
      }
      cursor = sorted[idx + 1].missionId;
    }
    renderScrubber();
    cursorCb(cursor);
  }

  function startPlayback(): void {
    if (missions.length === 0) return;
    playing = true;
    updatePlayButton();
    playTimer = setInterval(advanceCursor, Math.floor(1000 / speed));
  }

  function togglePlay(): void {
    if (playing) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }

  function buildControlBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'tl-controls';
    bar.setAttribute('aria-label', 'time-lapse controls');

    const playBtn = document.createElement('button');
    playBtn.className = 'tl-play-btn';
    playBtn.textContent = '▶';
    playBtn.setAttribute('aria-label', 'play / pause time-lapse');
    playBtn.addEventListener('click', togglePlay);
    bar.appendChild(playBtn);

    const speedLabel = document.createElement('label');
    speedLabel.className = 'tl-speed-label';
    speedLabel.textContent = 'Speed:';
    bar.appendChild(speedLabel);

    const speedSel = document.createElement('select');
    speedSel.className = 'tl-speed-select';
    speedSel.setAttribute('aria-label', 'playback speed');
    for (const s of [1, 2, 4, 8] as PlaybackSpeed[]) {
      const opt = document.createElement('option');
      opt.value = String(s);
      opt.textContent = `${s}×`;
      if (s === speed) opt.selected = true;
      speedSel.appendChild(opt);
    }
    speedSel.addEventListener('change', () => {
      speed = Number(speedSel.value) as PlaybackSpeed;
      if (playing) {
        stopPlayback();
        startPlayback();
      }
    });
    bar.appendChild(speedSel);

    return bar;
  }

  function renderScrubber(): void {
    if (!host) return;
    const svgEl = (host instanceof SVGElement ? host : host.querySelector('svg')) as SVGSVGElement | null;
    if (!svgEl) return;

    svgEl.querySelectorAll('.tl-scrubber').forEach((el) => el.remove());

    if (cursor === null) return;

    const { tickPositions } = layoutTimeline(missions, opts);
    const x = tickPositions.get(cursor);
    if (x === undefined) return;

    const scrubLine = document.createElementNS(SVG_NS, 'line');
    scrubLine.setAttribute('class', 'tl-scrubber');
    scrubLine.setAttribute('x1', String(x));
    scrubLine.setAttribute('x2', String(x));
    scrubLine.setAttribute('y1', '0');
    scrubLine.setAttribute('y2', String(opts.height ?? 64));
    scrubLine.setAttribute('stroke', '#f0c040');
    scrubLine.setAttribute('stroke-width', '2');
    scrubLine.setAttribute('pointer-events', 'none');
    svgEl.appendChild(scrubLine);
  }

  function render(): void {
    if (!host) return;
    // Rebuild SVG portion only; control bar is appended once.
    const existingSvg = host instanceof SVGElement ? null : host.querySelector('svg');
    if (existingSvg) existingSvg.remove();
    if (host instanceof SVGElement) host.innerHTML = '';

    const { axisSvg, tickPositions, rotated } = layoutTimeline(missions, opts);

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', String(opts.width));
    svg.setAttribute('height', String(opts.height));
    svg.setAttribute('class', 'archeology-timeline');
    const axisGroup = document.createElementNS(SVG_NS, 'g');
    axisGroup.setAttribute('transform', `translate(0,${opts.height / 2})`);
    axisGroup.innerHTML = axisSvg;
    svg.appendChild(axisGroup);

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
      while (svg.firstChild) host.appendChild(svg.firstChild);
    } else {
      // Insert SVG before the control bar (or append if bar not present yet).
      if (controlBar && host.contains(controlBar)) {
        host.insertBefore(svg, controlBar);
      } else {
        host.appendChild(svg);
      }
    }

    renderScrubber();
  }

  return {
    mount(h) {
      host = h;
      controlBar = buildControlBar();
      if (!(h instanceof SVGElement)) h.appendChild(controlBar);
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
    setCursor(id) {
      cursor = id;
      renderScrubber();
    },
    onSelect(cb) {
      selectCb = cb;
    },
    onCursor(cb) {
      cursorCb = cb;
    },
    unmount() {
      stopPlayback();
      if (host) host.innerHTML = '';
      host = null;
      controlBar = null;
    },
  };
}
