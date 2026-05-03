/**
 * Bundle summary card component.
 * Phase 824 / C09 T3.
 *
 * Renders a single in-flight bundle: header with id/time, progress bar,
 * aggregate counts, notify checkbox.
 */

import type { InFlightBundle, InFlightDecision, DecisionUIState } from '../types.js';
import { pillFor } from '../types.js';

function relativeTime(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

function isInProgress(state: DecisionUIState): boolean {
  return ['picked_up', 'expanding', 'wave_0', 'wave_1', 'wave_2', 'wave_n'].includes(state);
}

function computeAggregates(decisions: InFlightDecision[]): {
  complete: number; inProgress: number; blocked: number; failed: number; queued: number;
} {
  return {
    complete: decisions.filter(d => d.state === 'complete').length,
    inProgress: decisions.filter(d => isInProgress(d.state)).length,
    blocked: decisions.filter(d => d.state === 'blocked').length,
    failed: decisions.filter(d => d.state === 'failed').length,
    queued: decisions.filter(d => d.state === 'queued').length,
  };
}

function notifyKey(projectId: string): string {
  return `notify-${projectId}`;
}

export interface BundleSummaryCardComponent {
  mount(parent: HTMLElement): void;
  unmount(): void;
  /** Update a single decision's state (for live status events) */
  updateDecision(decisionId: string, update: Partial<InFlightDecision>): void;
}

export function createBundleSummaryCard(
  initialBundle: InFlightBundle,
  projectId: string,
): BundleSummaryCardComponent {
  let bundle: InFlightBundle = { ...initialBundle, decisions: [...initialBundle.decisions] };
  let cardEl: HTMLElement | null = null;

  function getNotifyPref(): boolean {
    return localStorage.getItem(notifyKey(projectId)) === 'true';
  }

  function setNotifyPref(val: boolean): void {
    localStorage.setItem(notifyKey(projectId), val ? 'true' : 'false');
  }

  function fireNotification(message: string): void {
    if (typeof (globalThis as Record<string, unknown>).Notification === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (globalThis as any).Notification('GSD Intelligence', { body: message });
    }
  }

  function render(): HTMLElement {
    const agg = computeAggregates(bundle.decisions);
    const total = bundle.decisions.length;
    const completePercent = total > 0 ? Math.round((agg.complete / total) * 100) : 0;
    const isAllComplete = agg.complete === total && total > 0;

    // Find last update time
    const lastUpdateTimes = bundle.decisions.map(d => new Date(d.updated_at).getTime());
    const lastUpdateMs = lastUpdateTimes.length > 0 ? Math.max(...lastUpdateTimes) : Date.now();
    const lastUpdateAgo = relativeTime(new Date(lastUpdateMs).toISOString());

    const card = document.createElement('div');
    card.className = `bundle-summary-card${isAllComplete ? ' bundle-complete' : ''}`;

    card.innerHTML = `
      <div class="bundle-header">
        <span class="bundle-id">${bundle.id}</span>
        <span class="bundle-time">Committed ${relativeTime(bundle.committed_at)} · ${total} decision${total !== 1 ? 's' : ''}</span>
        <label class="notify-label">
          <input type="checkbox" class="notify-checkbox" aria-label="Notify on block or completion" ${getNotifyPref() ? 'checked' : ''}>
          notify
        </label>
      </div>
      <div class="progress-bar" role="progressbar" aria-valuenow="${completePercent}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar-fill" style="width: ${completePercent}%"></div>
      </div>
      <div class="bundle-aggregate">
        ${agg.complete} complete · ${agg.inProgress} in progress · ${agg.blocked} blocked · last update ${lastUpdateAgo}
      </div>
    `;

    // Wire notify checkbox
    const checkbox = card.querySelector('.notify-checkbox') as HTMLInputElement;
    checkbox.addEventListener('change', () => {
      setNotifyPref(checkbox.checked);
    });

    return card;
  }

  function rerender(): void {
    if (!cardEl) return;
    const parent = cardEl.parentElement;
    if (!parent) return;
    const newCard = render();
    parent.replaceChild(newCard, cardEl);
    cardEl = newCard;
  }

  return {
    mount(parent: HTMLElement): void {
      cardEl = render();
      parent.appendChild(cardEl);
    },

    unmount(): void {
      cardEl?.parentElement?.removeChild(cardEl);
      cardEl = null;
    },

    updateDecision(decisionId: string, update: Partial<InFlightDecision>): void {
      const idx = bundle.decisions.findIndex(d => d.id === decisionId);
      if (idx === -1) return; // Unknown decision — silently ignore

      const prev = bundle.decisions[idx]!;
      bundle = {
        ...bundle,
        decisions: bundle.decisions.map((d, i) =>
          i === idx ? { ...d, ...update } : d,
        ),
      };

      // Fire notification if notify is enabled and decision transitions to blocked
      if (getNotifyPref()) {
        const next = bundle.decisions[idx]!;
        if (prev.state !== 'blocked' && next.state === 'blocked') {
          fireNotification(`Decision "${prev.title}" is blocked: ${next.block_reason ?? 'gate failed'}`);
        }
        // Also notify on all-complete
        const agg = computeAggregates(bundle.decisions);
        const total = bundle.decisions.length;
        if (agg.complete === total && total > 0 && prev.state !== 'complete' && next.state === 'complete') {
          fireNotification(`Bundle ${bundle.id} — all ${total} decisions complete`);
        }
      }

      rerender();
    },
  };
}
