/**
 * Project Picker — unit tests (vitest, jsdom).
 *
 * IPC is stubbed; tests cover render, multi-select, 5th-selection rejection,
 * and Clear revert.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProjectPicker } from '../picker.js';
import { createCoordinator } from '../../coordinator.js';
import type { Project } from '../../../../../src/intelligence/types.js';

// ─── IPC stub ─────────────────────────────────────────────────────────────────

vi.mock('../../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    listProjects: vi.fn().mockResolvedValue([
      { id: 'proj-a', name: 'Project A' },
      { id: 'proj-b', name: 'Project B' },
      { id: 'proj-c', name: 'Project C' },
      { id: 'proj-d', name: 'Project D' },
      { id: 'proj-e', name: 'Project E' },
    ] satisfies Pick<Project, 'id' | 'name'>[]),
  },
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

async function mountPicker(primaryProjectId = 'proj-a') {
  const coordinator = createCoordinator(primaryProjectId);
  const setSelectedSpy = vi.spyOn(coordinator, 'setSelectedProjects');
  const picker = createProjectPicker({ coordinator, primaryProjectId });
  const parent = document.createElement('div');
  document.body.appendChild(parent);
  await picker.mount(parent);
  return { picker, coordinator, setSelectedSpy, parent };
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('ProjectPicker — render', () => {
  it('renders checkboxes for all returned projects', async () => {
    const { parent, picker } = await mountPicker();
    const checkboxes = parent.querySelectorAll('input[type="checkbox"]');
    // 5 from IPC; primary is pre-injected → but IPC already returns proj-a so no dupe
    expect(checkboxes.length).toBe(5);
    picker.unmount();
    parent.remove();
  });

  it('primary project checkbox is pre-checked', async () => {
    const { parent, picker } = await mountPicker('proj-a');
    const cb = parent.querySelector<HTMLInputElement>('input[value="proj-a"]');
    expect(cb).not.toBeNull();
    expect(cb!.checked).toBe(true);
    picker.unmount();
    parent.remove();
  });

  it('non-primary checkboxes start unchecked', async () => {
    const { parent, picker } = await mountPicker('proj-a');
    const cb = parent.querySelector<HTMLInputElement>('input[value="proj-b"]');
    expect(cb!.checked).toBe(false);
    picker.unmount();
    parent.remove();
  });

  it('renders a Clear button', async () => {
    const { parent, picker } = await mountPicker();
    const btn = parent.querySelector('.project-picker-clear');
    expect(btn).not.toBeNull();
    picker.unmount();
    parent.remove();
  });
});

describe('ProjectPicker — multi-select', () => {
  it('checking a second project calls setSelectedProjects with both IDs', async () => {
    const { parent, picker, setSelectedSpy } = await mountPicker('proj-a');
    const cb = parent.querySelector<HTMLInputElement>('input[value="proj-b"]')!;
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));

    expect(setSelectedSpy).toHaveBeenCalledWith(expect.arrayContaining(['proj-a', 'proj-b']));
    picker.unmount();
    parent.remove();
  });

  it('selectedProjectIds returns the current selection', async () => {
    const { parent, picker } = await mountPicker('proj-a');
    const cb = parent.querySelector<HTMLInputElement>('input[value="proj-b"]')!;
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));

    expect(picker.selectedProjectIds()).toContain('proj-a');
    expect(picker.selectedProjectIds()).toContain('proj-b');
    picker.unmount();
    parent.remove();
  });

  it('unchecking a non-primary project removes it from selection', async () => {
    const { parent, picker } = await mountPicker('proj-a');

    const cbB = parent.querySelector<HTMLInputElement>('input[value="proj-b"]')!;
    cbB.checked = true;
    cbB.dispatchEvent(new Event('change'));
    expect(picker.selectedProjectIds()).toContain('proj-b');

    cbB.checked = false;
    cbB.dispatchEvent(new Event('change'));
    expect(picker.selectedProjectIds()).not.toContain('proj-b');

    picker.unmount();
    parent.remove();
  });
});

describe('ProjectPicker — 5th selection rejected', () => {
  it('attempting to select a 5th project is rejected (no state change)', async () => {
    const { parent, picker } = await mountPicker('proj-a');

    // Select proj-b, c, d to fill up to MAX (4)
    for (const id of ['proj-b', 'proj-c', 'proj-d']) {
      const cb = parent.querySelector<HTMLInputElement>(`input[value="${id}"]`)!;
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));
    }
    expect(picker.selectedProjectIds()).toHaveLength(4);

    // Now attempt to select proj-e (5th)
    const cbE = parent.querySelector<HTMLInputElement>('input[value="proj-e"]')!;
    cbE.checked = true;
    cbE.dispatchEvent(new Event('change'));

    expect(cbE.checked).toBe(false); // reverted
    expect(picker.selectedProjectIds()).toHaveLength(4); // no state change
    expect(picker.selectedProjectIds()).not.toContain('proj-e');

    picker.unmount();
    parent.remove();
  });

  it('rejected checkbox receives .project-picker-checkbox--rejected class', async () => {
    const { parent, picker } = await mountPicker('proj-a');
    for (const id of ['proj-b', 'proj-c', 'proj-d']) {
      const cb = parent.querySelector<HTMLInputElement>(`input[value="${id}"]`)!;
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));
    }
    const cbE = parent.querySelector<HTMLInputElement>('input[value="proj-e"]')!;
    cbE.checked = true;
    cbE.dispatchEvent(new Event('change'));

    expect(cbE.classList.contains('project-picker-checkbox--rejected')).toBe(true);

    picker.unmount();
    parent.remove();
  });
});

describe('ProjectPicker — Clear reverts to primary', () => {
  it('clicking Clear resets selection to primary-only', async () => {
    const { parent, picker, setSelectedSpy } = await mountPicker('proj-a');

    const cbB = parent.querySelector<HTMLInputElement>('input[value="proj-b"]')!;
    cbB.checked = true;
    cbB.dispatchEvent(new Event('change'));
    expect(picker.selectedProjectIds()).toHaveLength(2);

    const clearBtn = parent.querySelector<HTMLButtonElement>('.project-picker-clear')!;
    clearBtn.click();

    expect(picker.selectedProjectIds()).toEqual(['proj-a']);
    expect(setSelectedSpy).toHaveBeenLastCalledWith(['proj-a']);

    picker.unmount();
    parent.remove();
  });
});
