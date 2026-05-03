/**
 * Project list component — chronological list with sort selector.
 * D-24-15: vanilla TS DOM component, no framework.
 * Phase 824 / C08 T3.
 */

import type { Project } from '../../../../src/intelligence/types.js';
import type { Store, IntelligenceStore } from '../store.js';
import { intelligenceIpc } from '../../../../src/intelligence/ipc.js';
import { createProjectRow } from './project-row.js';

export function createProjectList(store: Store<IntelligenceStore>): {
  mount(parent: HTMLElement): void;
  unmount(): void;
} {
  let container: HTMLElement | null = null;
  let listEl: HTMLUListElement | null = null;
  let unsubs: Array<() => void> = [];
  let rowUnmounts: Array<() => void> = [];

  function sortProjects(projects: Project[], mode: 'recent' | 'priority' | 'findings'): Project[] {
    const copy = [...projects];
    if (mode === 'recent') {
      copy.sort((a, b) => b.last_activity_at.localeCompare(a.last_activity_at));
    } else if (mode === 'priority') {
      const order = { high: 0, med: 1, low: 2 };
      copy.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (mode === 'findings') {
      // Findings count is not directly on Project; sort by name as fallback
      copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    return copy;
  }

  function render() {
    if (!container || !listEl) return;

    // Unmount existing rows
    rowUnmounts.forEach(u => u());
    rowUnmounts = [];
    listEl.innerHTML = '';

    const state = store.get();
    const sorted = sortProjects(state.projects, state.sortMode);

    if (state.loading && sorted.length === 0) {
      const li = document.createElement('li');
      li.className = 'project-list-loading';
      li.textContent = 'Loading projects…';
      listEl.appendChild(li);
      return;
    }

    if (state.error) {
      const li = document.createElement('li');
      li.className = 'project-list-error';
      li.innerHTML = `
        <span class="error-msg">${state.error}</span>
        <button class="reconnect-btn" aria-label="Reconnect to server">Reconnect</button>
      `;
      li.querySelector('.reconnect-btn')?.addEventListener('click', loadProjects);
      listEl.appendChild(li);
      return;
    }

    if (sorted.length === 0) {
      const li = document.createElement('li');
      li.className = 'project-list-empty';
      li.innerHTML = `
        <span>No projects mapped yet.</span>
        <button class="reconnect-btn" aria-label="Reconnect to server">Reconnect</button>
      `;
      li.querySelector('.reconnect-btn')?.addEventListener('click', loadProjects);
      listEl.appendChild(li);
      return;
    }

    for (const project of sorted) {
      const li = document.createElement('li');
      li.className = 'project-list-item';
      const row = createProjectRow(project, store);
      row.mount(li);
      rowUnmounts.push(row.unmount);
      listEl.appendChild(li);
    }
  }

  async function loadProjects() {
    store.dispatch(() => ({ loading: true, error: null }));
    try {
      const sort = store.get().sortMode;
      const projects = await intelligenceIpc.listProjects(sort);
      store.dispatch(() => ({ projects, loading: false }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      store.dispatch(() => ({
        loading: false,
        error: msg.includes('not connected')
          ? 'Server unreachable — click Reconnect to retry.'
          : `Failed to load projects: ${msg}`,
      }));
    }
  }

  function mount(parent: HTMLElement) {
    container = document.createElement('div');
    container.className = 'project-list-container';

    // Header row with sort selector
    const header = document.createElement('div');
    header.className = 'project-list-header';

    const title = document.createElement('h2');
    title.textContent = 'Mapped projects';
    title.className = 'project-list-title';

    const sortLabel = document.createElement('label');
    sortLabel.htmlFor = 'project-sort-select';
    sortLabel.textContent = 'Sort:';
    sortLabel.className = 'sort-label';

    const sortSelect = document.createElement('select');
    sortSelect.id = 'project-sort-select';
    sortSelect.className = 'sort-select';
    sortSelect.setAttribute('aria-label', 'Sort projects by');

    const sortOptions: Array<{ value: 'recent' | 'priority' | 'findings'; label: string }> = [
      { value: 'recent', label: 'Recent' },
      { value: 'priority', label: 'Priority' },
      { value: 'findings', label: 'Findings' },
    ];
    for (const opt of sortOptions) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      sortSelect.appendChild(option);
    }
    sortSelect.value = store.get().sortMode;

    sortSelect.addEventListener('change', () => {
      const mode = sortSelect.value as 'recent' | 'priority' | 'findings';
      store.dispatch(() => ({ sortMode: mode }));
      loadProjects();
    });

    header.appendChild(title);
    header.appendChild(sortLabel);
    header.appendChild(sortSelect);
    container.appendChild(header);

    listEl = document.createElement('ul');
    listEl.className = 'project-list';
    container.appendChild(listEl);

    parent.appendChild(container);

    // Subscribe to store changes
    const unsub1 = store.subscribe(s => s.projects, () => render());
    const unsub2 = store.subscribe(s => s.loading, () => render());
    const unsub3 = store.subscribe(s => s.error, () => render());
    const unsub4 = store.subscribe(s => s.sortMode, () => {
      sortSelect.value = store.get().sortMode;
    });
    unsubs = [unsub1, unsub2, unsub3, unsub4];

    render();
    loadProjects();
  }

  function unmount() {
    rowUnmounts.forEach(u => u());
    rowUnmounts = [];
    unsubs.forEach(u => u());
    unsubs = [];
    container?.remove();
    container = null;
    listEl = null;
  }

  return { mount, unmount };
}
