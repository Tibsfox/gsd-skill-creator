/**
 * Mission Archeology — single-mission card.
 *
 * Renders one mission's files-changed list with A/M/D/R badges, line-count
 * deltas, and (when present) a deep-link to the linked decision.  Cards are
 * stacked in a scroll container by the parent view.
 *
 * @module desktop/intelligence/atlas/archeology/mission-card
 */

import type { AtlasFilesChanged, FileChangeKind, MilestoneLink } from './types.js';

const BADGE_TEXT: Record<FileChangeKind, string> = {
  A: 'A',
  M: 'M',
  D: 'D',
  R: 'R',
};

export interface MissionCardComponent {
  el: HTMLElement;
  setData(mission: MilestoneLink, rows: AtlasFilesChanged[]): void;
  onFileClick(cb: (filePath: string) => void): void;
  onDecisionClick(cb: (decisionId: string) => void): void;
  highlight(filePath: string | null): void;
}

export function createMissionCard(): MissionCardComponent {
  const el = document.createElement('section');
  el.className = 'archeology-mission-card';

  let fileCb: (path: string) => void = () => {};
  let decisionCb: (id: string) => void = () => {};
  let currentRows: AtlasFilesChanged[] = [];

  function render(mission: MilestoneLink, rows: AtlasFilesChanged[]): void {
    currentRows = rows;
    const totalAdded = rows.reduce((s, r) => s + (r.added_lines | 0), 0);
    const totalRemoved = rows.reduce((s, r) => s + (r.removed_lines | 0), 0);

    const header = `<header class="archeology-card-header">
      <h4 class="archeology-card-title">${esc(mission.label)}</h4>
      <span class="archeology-card-stats">+${totalAdded} −${totalRemoved} · ${rows.length} file${rows.length === 1 ? '' : 's'}</span>
    </header>`;

    const decisionLink = mission.linkedDecisionId
      ? `<a class="archeology-decision-link" href="#decision/${esc(mission.linkedDecisionId)}" data-decision-id="${esc(mission.linkedDecisionId)}">linked decision →</a>`
      : '';

    const list = rows.length === 0
      ? `<p class="archeology-empty">No file changes recorded for this mission.</p>`
      : `<ul class="archeology-file-list">${rows.map(rowMarkup).join('')}</ul>`;

    el.innerHTML = `${header}${decisionLink}${list}`;

    if (mission.linkedDecisionId) {
      const a = el.querySelector<HTMLAnchorElement>('.archeology-decision-link');
      a?.addEventListener('click', (ev) => {
        ev.preventDefault();
        decisionCb(mission.linkedDecisionId!);
      });
    }

    el.querySelectorAll<HTMLLIElement>('li.archeology-file-row').forEach((li) => {
      li.addEventListener('click', () => {
        const fp = li.dataset.filePath;
        if (fp) fileCb(fp);
      });
      li.addEventListener('keydown', (ke: KeyboardEvent) => {
        if (ke.key === 'Enter' || ke.key === ' ') {
          ke.preventDefault();
          const fp = li.dataset.filePath;
          if (fp) fileCb(fp);
        }
      });
    });
  }

  function rowMarkup(row: AtlasFilesChanged): string {
    const kind = row.change_kind;
    const renamed = kind === 'R' && row.rename_from
      ? `<span class="archeology-rename-from">${esc(row.rename_from)} →</span>`
      : '';
    return `<li class="archeology-file-row" role="button" tabindex="0" data-file-path="${esc(row.file_path)}">
      <span class="archeology-badge archeology-badge-${kind}" title="${kindTitle(kind)}">${BADGE_TEXT[kind]}</span>
      ${renamed}
      <span class="archeology-file-path">${esc(row.file_path)}</span>
      <span class="archeology-line-counts">+${row.added_lines}<span class="sep"> </span>−${row.removed_lines}</span>
    </li>`;
  }

  return {
    el,
    setData(mission, rows) {
      render(mission, rows);
    },
    onFileClick(cb) {
      fileCb = cb;
    },
    onDecisionClick(cb) {
      decisionCb = cb;
    },
    highlight(filePath) {
      el.querySelectorAll<HTMLLIElement>('li.archeology-file-row').forEach((li) => {
        li.classList.toggle('is-highlighted', li.dataset.filePath === filePath);
      });
      // Suppress unused warning when the row list is empty but consumers
      // still call highlight() (defensive parity with system-map UX).
      void currentRows;
    },
  };
}

function kindTitle(k: FileChangeKind): string {
  switch (k) {
    case 'A': return 'Added';
    case 'M': return 'Modified';
    case 'D': return 'Deleted';
    case 'R': return 'Renamed';
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
