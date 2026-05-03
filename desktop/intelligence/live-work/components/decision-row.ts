/**
 * Decision row component with timeline indicator.
 * Phase 824 / C09 T4.
 */

import type { InFlightDecision, DecisionUIState } from '../types.js';
import { pillFor } from '../types.js';

/**
 * Maps DecisionUIState to filled stage count (0..4).
 * Timeline: Wave 0 | Wave 1 | Wave 2 | Wave N
 */
function filledStages(state: DecisionUIState): number {
  switch (state) {
    case 'queued':
    case 'picked_up':
    case 'expanding':
      return 0;
    case 'wave_0':
      return 1;
    case 'wave_1':
      return 2;
    case 'wave_2':
      return 3;
    case 'wave_n':
    case 'blocked':
    case 'complete':
    case 'failed':
      return 4;
    default:
      return 0;
  }
}

function renderTimeline(state: DecisionUIState): string {
  const filled = filledStages(state);
  const stages: string[] = [];
  const labels = ['W0', 'W1', 'W2', 'WN'];
  for (let i = 0; i < 4; i++) {
    const cls = i < filled ? 'timeline-stage filled' : 'timeline-stage';
    stages.push(`<span class="${cls}" aria-label="${labels[i]!}"></span>`);
    if (i < 3) stages.push('<span class="timeline-connector"></span>');
  }
  return `<div class="timeline-indicator" role="img" aria-label="Progress: ${filled} of 4 stages">${stages.join('')}</div>`;
}

function buildSubStatus(decision: InFlightDecision): string {
  const descriptor = pillFor(decision.state);
  let sub = decision.sub_status ?? descriptor.sub_status_template;
  if (decision.block_reason) {
    sub = decision.block_reason;
  }
  if (decision.wave_progress) {
    sub = sub.replace('{N}', String(decision.wave_progress.current))
              .replace('{M}', String(decision.wave_progress.total));
  }
  return sub;
}

export interface DecisionRowComponent {
  mount(parent: HTMLElement): void;
  unmount(): void;
  /** Update decision state (live status event) — synchronous re-render */
  update(patch: Partial<InFlightDecision>): void;
}

export function createDecisionRow(
  initialDecision: InFlightDecision,
  onAddress: (decision: InFlightDecision) => void,
): DecisionRowComponent {
  let decision: InFlightDecision = { ...initialDecision };
  let rowEl: HTMLElement | null = null;

  function render(): HTMLElement {
    const descriptor = pillFor(decision.state);
    const subStatus = buildSubStatus(decision);
    const showAddress = decision.state === 'blocked';
    const showOpenResult = decision.state === 'complete' && !!decision.result_path;
    const showView = ['wave_0', 'wave_1', 'wave_2', 'wave_n', 'blocked', 'complete'].includes(decision.state);

    const row = document.createElement('div');
    row.className = 'decision-row';

    row.innerHTML = `
      <div class="decision-row-header">
        <span class="pill ${descriptor.cssClass}">${descriptor.label}</span>
        <span class="decision-title">${decision.title}</span>
      </div>
      <div class="decision-sub-status">${subStatus}</div>
      ${renderTimeline(decision.state)}
      <div class="decision-row-actions">
        ${showAddress ? `<button class="address-btn" aria-label="Address blocked decision: ${decision.title}">Address ↗</button>` : ''}
        ${showView ? `<button class="view-btn" aria-label="View decision details">View ↗</button>` : ''}
        ${showOpenResult ? `<button class="open-result-btn" aria-label="Open result">Open result ↗</button>` : ''}
      </div>
    `;

    // Wire address button
    const addrBtn = row.querySelector('.address-btn');
    if (addrBtn) {
      addrBtn.addEventListener('click', () => onAddress(decision));
    }

    return row;
  }

  function rerender(): void {
    if (!rowEl) return;
    const parent = rowEl.parentElement;
    if (!parent) return;
    const newRow = render();
    parent.replaceChild(newRow, rowEl);
    rowEl = newRow;
  }

  return {
    mount(parent: HTMLElement): void {
      rowEl = render();
      parent.appendChild(rowEl);
    },

    unmount(): void {
      rowEl?.parentElement?.removeChild(rowEl);
      rowEl = null;
    },

    update(patch: Partial<InFlightDecision>): void {
      decision = { ...decision, ...patch };
      rerender();
    },
  };
}
