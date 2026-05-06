/**
 * Hover tooltip overlay for symbol attribution.
 * Debounce: 200ms. Time-to-paint target: <50ms after commit.
 */

import type { AtlasSymbol } from '../../../../src/intelligence/types.js';

export interface HoverTarget {
  element: HTMLElement;
  symbolId: string;
}

export type SymbolFetcher = (id: string) => Promise<AtlasSymbol | null>;

export function createHoverTooltip(fetcher: SymbolFetcher): {
  attach(root: HTMLElement): void;
  detach(): void;
  showFor(target: HoverTarget): void;
  hide(): void;
} {
  let tooltipEl: HTMLElement | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let currentTarget: HoverTarget | null = null;
  let rootEl: HTMLElement | null = null;

  function ensureTooltip(): HTMLElement {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'cv-hover-tooltip';
      tooltipEl.setAttribute('role', 'tooltip');
      tooltipEl.setAttribute('aria-live', 'polite');
      rootEl?.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function position(target: HTMLElement) {
    if (!tooltipEl) return;
    const rect = target.getBoundingClientRect();
    const rootRect = rootEl?.getBoundingClientRect() ?? { top: 0, left: 0 };
    tooltipEl.style.top = `${rect.top - rootRect.top - tooltipEl.offsetHeight - 6}px`;
    tooltipEl.style.left = `${rect.left - rootRect.left}px`;
  }

  async function commit(target: HoverTarget) {
    const el = ensureTooltip();
    el.textContent = 'Loading…';
    el.classList.add('cv-hover-tooltip--visible');
    position(target.element);

    const t0 = performance.now();
    try {
      const sym = await fetcher(target.symbolId);
      if (currentTarget?.symbolId !== target.symbolId) return;
      if (!sym) {
        el.textContent = target.symbolId;
      } else {
        el.innerHTML = '';

        const nameEl = document.createElement('div');
        nameEl.className = 'cv-tooltip-name';
        nameEl.textContent = sym.name;
        el.appendChild(nameEl);

        const kindEl = document.createElement('div');
        kindEl.className = 'cv-tooltip-kind';
        kindEl.textContent = sym.kind;
        el.appendChild(kindEl);

        if (sym.qualified_name !== sym.name) {
          const qnEl = document.createElement('div');
          qnEl.className = 'cv-tooltip-qn';
          qnEl.textContent = sym.qualified_name;
          el.appendChild(qnEl);
        }
      }
      const elapsed = performance.now() - t0;
      if (elapsed > 50) {
        el.dataset['latencyWarn'] = String(Math.round(elapsed));
      }
    } catch {
      if (currentTarget?.symbolId === target.symbolId) {
        el.textContent = target.symbolId;
      }
    }

    position(target.element);
  }

  return {
    attach(root: HTMLElement) {
      rootEl = root;
    },

    detach() {
      if (debounceTimer !== null) clearTimeout(debounceTimer);
      tooltipEl?.remove();
      tooltipEl = null;
      rootEl = null;
      currentTarget = null;
    },

    showFor(target: HoverTarget) {
      if (debounceTimer !== null) clearTimeout(debounceTimer);
      currentTarget = target;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void commit(target);
      }, 200);
    },

    hide() {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      currentTarget = null;
      if (tooltipEl) {
        tooltipEl.classList.remove('cv-hover-tooltip--visible');
      }
    },
  };
}
