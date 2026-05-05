/**
 * Project Picker — toolbar element for multi-project selection.
 *
 * Queries registered projects via intelligenceIpc.listProjects, renders a
 * checkbox list capped at MAX_SELECTED_PROJECTS, and wires changes through
 * the Coordinator's setSelectedProjects API.
 *
 * "Select up to N" hint is shown when the cap is reached; further checkbox
 * attempts no-op and apply the .project-picker-checkbox--rejected CSS class
 * for a moment of visual feedback.
 *
 * Part of J3 cross-repo Atlas track (v1.49.607).
 */

import { intelligenceIpc } from '../../../../src/intelligence/ipc.js';
import type { Project } from '../../../../src/intelligence/types.js';
import { MAX_SELECTED_PROJECTS } from '../coordinator.js';
import type { Coordinator } from '../coordinator.js';

export interface ProjectPickerOptions {
  /** The coordinator to call setSelectedProjects on. */
  coordinator: Coordinator;
  /**
   * ID of the primary project. Always pre-selected and used as the
   * single-project fallback when Clear is pressed.
   */
  primaryProjectId: string;
}

export interface ProjectPickerComponent {
  /** Append the picker toolbar into the given parent element. */
  mount(parent: HTMLElement): Promise<void>;
  unmount(): void;
  /** The currently selected project IDs (reflects coordinator state). */
  selectedProjectIds(): string[];
}

export function createProjectPicker(opts: ProjectPickerOptions): ProjectPickerComponent {
  const { coordinator, primaryProjectId } = opts;

  let containerEl: HTMLElement | null = null;
  let projects: Project[] = [];
  let selected: Set<string> = new Set([primaryProjectId]);

  function rebuild(): void {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const hint = document.createElement('span');
    hint.className = 'project-picker-hint';
    hint.textContent =
      selected.size >= MAX_SELECTED_PROJECTS
        ? `Select up to ${MAX_SELECTED_PROJECTS}`
        : '';
    containerEl.appendChild(hint);

    for (const project of projects) {
      const label = document.createElement('label');
      label.className = 'project-picker-label';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'project-picker-checkbox';
      checkbox.value = project.id;
      checkbox.checked = selected.has(project.id);
      checkbox.setAttribute('aria-label', project.name ?? project.id);

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          if (selected.size >= MAX_SELECTED_PROJECTS) {
            // Reject — show transient feedback and revert the checkbox.
            checkbox.checked = false;
            checkbox.classList.add('project-picker-checkbox--rejected');
            setTimeout(() => checkbox.classList.remove('project-picker-checkbox--rejected'), 600);
            return;
          }
          selected.add(project.id);
        } else {
          // Prevent deselecting the primary project via the checkbox — only
          // Clear reverts to primary-only mode.
          if (project.id === primaryProjectId && selected.size === 1) {
            checkbox.checked = true;
            return;
          }
          selected.delete(project.id);
        }
        const ids = [...selected];
        coordinator.setSelectedProjects(ids);
        // Update hint visibility without a full rebuild to avoid focus loss.
        hint.textContent =
          selected.size >= MAX_SELECTED_PROJECTS
            ? `Select up to ${MAX_SELECTED_PROJECTS}`
            : '';
      });

      const nameSpan = document.createElement('span');
      nameSpan.className = 'project-picker-name';
      nameSpan.textContent = project.name ?? project.id;

      label.appendChild(checkbox);
      label.appendChild(nameSpan);
      containerEl.appendChild(label);
    }

    const clearBtn = document.createElement('button');
    clearBtn.className = 'project-picker-clear';
    clearBtn.textContent = 'Clear';
    clearBtn.setAttribute('aria-label', 'Revert to primary project only');
    clearBtn.addEventListener('click', () => {
      selected = new Set([primaryProjectId]);
      coordinator.setSelectedProjects([primaryProjectId]);
      rebuild();
    });
    containerEl.appendChild(clearBtn);
  }

  return {
    async mount(parent: HTMLElement): Promise<void> {
      containerEl = document.createElement('div');
      containerEl.className = 'project-picker';
      parent.appendChild(containerEl);

      try {
        projects = await intelligenceIpc.listProjects();
      } catch {
        projects = [];
      }

      // Ensure primary project is always in the list (even if IPC returned partial data).
      if (!projects.some((p) => p.id === primaryProjectId)) {
        projects = [
          { id: primaryProjectId, name: primaryProjectId } as Project,
          ...projects,
        ];
      }

      rebuild();
    },

    unmount(): void {
      containerEl?.parentElement?.removeChild(containerEl);
      containerEl = null;
    },

    selectedProjectIds(): string[] {
      return [...selected];
    },
  };
}
