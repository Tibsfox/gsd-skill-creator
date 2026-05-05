/**
 * Gutter subcomponent — one element per line with mission badge(s).
 */

import type { AtlasMissionProvenance } from '../../../../src/intelligence/types.js';

export interface GutterBadgeClickEvent {
  missionId: string;
  lineNo: number;
}

export interface GutterLine {
  lineNo: number;
  provenance: AtlasMissionProvenance[];
}

const MISSION_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
];

function missionColor(missionId: string): string {
  let h = 0;
  for (let i = 0; i < missionId.length; i++) h = (h * 31 + missionId.charCodeAt(i)) >>> 0;
  return MISSION_COLORS[h % MISSION_COLORS.length];
}

export function createGutter(
  lines: GutterLine[],
  onBadgeClick: (e: GutterBadgeClickEvent) => void,
): {
  element: HTMLElement;
  update(lines: GutterLine[]): void;
  destroy(): void;
} {
  const el = document.createElement('div');
  el.className = 'cv-gutter';
  el.setAttribute('aria-hidden', 'true');

  const handlers: Array<() => void> = [];

  function renderLine(line: GutterLine): HTMLElement {
    const row = document.createElement('div');
    row.className = 'cv-gutter-row';
    row.dataset['line'] = String(line.lineNo);

    const numSpan = document.createElement('span');
    numSpan.className = 'cv-line-num';
    numSpan.textContent = String(line.lineNo);
    row.appendChild(numSpan);

    if (line.provenance.length > 0) {
      const badgeGroup = document.createElement('span');
      badgeGroup.className = 'cv-mission-badges';

      line.provenance.slice(0, 4).forEach((prov, idx) => {
        const badge = document.createElement('span');
        badge.className = `cv-mission-badge${idx === 0 ? ' cv-mission-badge--primary' : ' cv-mission-badge--secondary'}`;
        badge.style.backgroundColor = missionColor(prov.mission_id);
        badge.title = prov.mission_id;

        const handler = () => onBadgeClick({ missionId: prov.mission_id, lineNo: line.lineNo });
        badge.addEventListener('click', handler);
        handlers.push(() => badge.removeEventListener('click', handler));

        badgeGroup.appendChild(badge);
      });

      row.appendChild(badgeGroup);
    }

    return row;
  }

  function render(lines: GutterLine[]) {
    el.innerHTML = '';
    for (const line of lines) {
      el.appendChild(renderLine(line));
    }
  }

  render(lines);

  return {
    element: el,
    update(nextLines: GutterLine[]) {
      handlers.splice(0).forEach(fn => fn());
      render(nextLines);
    },
    destroy() {
      handlers.splice(0).forEach(fn => fn());
    },
  };
}
