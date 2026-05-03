/**
 * Live work view orchestrator.
 * Phase 824 / C09 T6+T7+T8+T9.
 *
 * Renders one bundle-summary-card + decision rows per in-flight bundle.
 * Most recent bundle first. Empty → zero-height placeholder.
 * Handles status events with 100ms debouncing (D-24-18).
 */

import type { InFlightBundle, InFlightDecision, StatusUpdateEvent } from '../types.js';
import { createBundleSummaryCard } from './bundle-summary-card.js';
import { createDecisionRow, DecisionRowComponent } from './decision-row.js';
import { createMicroMeetingModal } from './micro-meeting-modal.js';

interface BundlePanel {
  bundleSummary: ReturnType<typeof createBundleSummaryCard>;
  decisionRows: Map<string, DecisionRowComponent>;
  containerEl: HTMLElement;
}

// Debounce helper (per-decision)
function makeDebouncer(delayMs: number) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return function debounce(key: string, fn: () => void): void {
    const existing = timers.get(key);
    if (existing !== undefined) clearTimeout(existing);
    const id = setTimeout(() => {
      timers.delete(key);
      fn();
    }, delayMs);
    timers.set(key, id);
  };
}

/** Sort bundles most-recent-first by committed_at */
function sortBundles(bundles: InFlightBundle[]): InFlightBundle[] {
  return [...bundles].sort((a, b) =>
    new Date(b.committed_at).getTime() - new Date(a.committed_at).getTime(),
  );
}

export interface LiveWorkViewComponent {
  mount(parent: HTMLElement): void;
  unmount(): void;
  /** Handle a live status update event (debounced) */
  handleStatusUpdate(event: StatusUpdateEvent): void;
}

export function createLiveWorkView(
  projectId: string,
  initialBundles: InFlightBundle[],
): LiveWorkViewComponent {
  let viewEl: HTMLElement | null = null;
  const panels = new Map<string, BundlePanel>();
  const debounce = makeDebouncer(100);
  let modalContainer: HTMLElement | null = null;

  function handleAddress(decision: InFlightDecision): void {
    if (!viewEl || !modalContainer) return;
    const modal = createMicroMeetingModal(decision);
    // Replace previous modal if any
    modalContainer.innerHTML = '';
    modal.mount(modalContainer);
    modal.open();
  }

  function buildPanel(bundle: InFlightBundle, container: HTMLElement): BundlePanel {
    // Bundle summary card
    const bundleSummary = createBundleSummaryCard(bundle, projectId);
    bundleSummary.mount(container);

    // Decision rows container
    const rowsEl = document.createElement('div');
    rowsEl.className = 'decision-rows';
    container.appendChild(rowsEl);

    // Create a row for each decision
    const decisionRows = new Map<string, DecisionRowComponent>();
    for (const decision of bundle.decisions) {
      const row = createDecisionRow(decision, handleAddress);
      row.mount(rowsEl);
      decisionRows.set(decision.id, row);
    }

    return { bundleSummary, decisionRows, containerEl: container };
  }

  return {
    mount(parent: HTMLElement): void {
      viewEl = document.createElement('div');
      viewEl.className = 'live-work-view';

      const sorted = sortBundles(initialBundles);
      for (const bundle of sorted) {
        const panelEl = document.createElement('div');
        panelEl.className = 'bundle-panel';
        panelEl.dataset.bundleId = bundle.id;
        viewEl.appendChild(panelEl);

        const panel = buildPanel(bundle, panelEl);
        panels.set(bundle.id, panel);
      }

      // Modal container (hidden until opened)
      modalContainer = document.createElement('div');
      modalContainer.className = 'modal-container';
      viewEl.appendChild(modalContainer);

      parent.appendChild(viewEl);
    },

    unmount(): void {
      panels.forEach(panel => {
        panel.bundleSummary.unmount();
        panel.decisionRows.forEach(row => row.unmount());
      });
      panels.clear();
      viewEl?.parentElement?.removeChild(viewEl);
      viewEl = null;
      modalContainer = null;
    },

    handleStatusUpdate(event: StatusUpdateEvent): void {
      if (event.project_id !== projectId) return;
      if (!event.decision_id || !event.bundle_id) return;

      const panel = panels.get(event.bundle_id);
      if (!panel) return; // Unknown bundle — ignore

      const decisionId = event.decision_id;
      const bundleId = event.bundle_id;

      // Debounce updates for the same decision
      debounce(`${bundleId}:${decisionId}`, () => {
        const row = panel.decisionRows.get(decisionId);
        if (row) {
          row.update({
            state: event.state,
            sub_status: event.sub_status,
            wave_progress: event.wave_progress,
            result_path: event.result_path,
            block_reason: event.block_reason,
            block_findings: event.block_findings,
            error: event.error,
            updated_at: event.updated_at,
          });
        }

        // Also update bundle summary card
        panel.bundleSummary.updateDecision(decisionId, {
          state: event.state,
          block_reason: event.block_reason,
          updated_at: event.updated_at,
        });
      });
    },
  };
}
