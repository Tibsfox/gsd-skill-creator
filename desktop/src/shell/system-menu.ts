import type { MenuSection } from "./types";

/** Handle for interacting with the system menu */
export interface SystemMenuHandle {
  /** The menu container element (hidden by default) */
  element: HTMLDivElement;
  /** Show the menu at a position */
  show: (x: number, y: number) => void;
  /** Show menu anchored to an element (above it, left-aligned) */
  showAnchored: (anchor: HTMLElement) => void;
  /** Hide the menu */
  hide: () => void;
  /** Update menu sections (re-render content) */
  updateSections: (sections: readonly MenuSection[]) => void;
  /** Whether the menu is currently visible */
  isVisible: () => boolean;
  /** Destroy and clean up */
  destroy: () => void;
}

/**
 * Create the system menu popup.
 *
 * Renders a sectioned popup menu that can be shown/hidden.
 * Sections contain labeled groups of menu items.
 * Clicking an item executes its action and closes the menu.
 * Clicking outside or pressing Escape closes the menu.
 */
export function createSystemMenu(): SystemMenuHandle {
  let visible = false;
  let destroyed = false;

  const menuEl = document.createElement("div");
  menuEl.className = "shell-menu";
  menuEl.style.position = "fixed";
  menuEl.style.zIndex = "10000";
  menuEl.style.background = "var(--wm-content-bg, #bbbbbb)";
  menuEl.style.border = "2px solid var(--wm-border, #000)";
  menuEl.style.boxShadow = "2px 2px 0 rgba(0,0,0,0.4)";
  menuEl.style.minWidth = "180px";
  menuEl.style.display = "none";
  menuEl.style.fontFamily = "monospace";
  menuEl.style.fontSize = "12px";
  menuEl.style.padding = "2px 0";

  const outsideClickHandler = (e: MouseEvent): void => {
    if (visible && !menuEl.contains(e.target as Node)) {
      hide();
    }
  };

  const escapeHandler = (e: KeyboardEvent): void => {
    if (visible && e.key === "Escape") {
      hide();
    }
  };

  document.addEventListener("mousedown", outsideClickHandler);
  document.addEventListener("keydown", escapeHandler);

  function show(x: number, y: number): void {
    menuEl.style.left = x + "px";
    menuEl.style.top = y + "px";
    menuEl.style.display = "block";
    visible = true;
  }

  function showAnchored(anchor: HTMLElement): void {
    const rect = anchor.getBoundingClientRect();
    menuEl.style.display = "block";
    menuEl.style.left = rect.left + "px";
    menuEl.style.top = "0px";

    // Measure and reposition above anchor
    const menuHeight = menuEl.offsetHeight;
    const targetTop = rect.top - menuHeight;
    if (targetTop < 0) {
      // Below anchor if not enough space above
      menuEl.style.top = rect.bottom + "px";
    } else {
      menuEl.style.top = targetTop + "px";
    }

    visible = true;
  }

  function hide(): void {
    menuEl.style.display = "none";
    visible = false;
  }

  function updateSections(sections: readonly MenuSection[]): void {
    menuEl.innerHTML = "";

    for (const section of sections) {
      const header = document.createElement("div");
      header.className = "shell-menu__section-title";
      header.style.padding = "4px 8px";
      header.style.fontWeight = "bold";
      header.style.color = "var(--wm-titlebar-text-inactive)";
      header.textContent = section.title;
      menuEl.appendChild(header);

      for (const item of section.items) {
        if (item.separator) {
          const hr = document.createElement("hr");
          hr.className = "shell-menu__separator";
          hr.style.margin = "2px 4px";
          hr.style.border = "0";
          hr.style.borderTop = "1px solid var(--wm-border)";
          menuEl.appendChild(hr);
          continue;
        }

        const itemEl = document.createElement("div");
        itemEl.className = "shell-menu__item";
        itemEl.style.padding = "4px 8px";
        itemEl.style.cursor = "pointer";
        itemEl.style.display = "flex";
        itemEl.style.justifyContent = "space-between";

        if (item.disabled) {
          itemEl.classList.add("shell-menu__item--disabled");
          itemEl.style.cursor = "default";
          itemEl.style.opacity = "0.5";
        }

        const labelSpan = document.createElement("span");
        labelSpan.textContent = item.label;
        itemEl.appendChild(labelSpan);

        if (item.shortcut) {
          const shortcutSpan = document.createElement("span");
          shortcutSpan.className = "shell-menu__shortcut";
          shortcutSpan.style.opacity = "0.6";
          shortcutSpan.style.fontSize = "10px";
          shortcutSpan.textContent = item.shortcut;
          itemEl.appendChild(shortcutSpan);
        }

        itemEl.addEventListener("click", () => {
          if (!item.disabled) {
            item.action();
            hide();
          }
        });

        itemEl.addEventListener("mouseenter", () => {
          if (!item.disabled) {
            itemEl.style.background = "var(--wm-titlebar-active, #6688bb)";
          }
        });

        itemEl.addEventListener("mouseleave", () => {
          itemEl.style.background = "";
        });

        menuEl.appendChild(itemEl);
      }
    }
  }

  function destroy(): void {
    document.removeEventListener("mousedown", outsideClickHandler);
    document.removeEventListener("keydown", escapeHandler);
    menuEl.innerHTML = "";
    visible = false;
    destroyed = true;
  }

  return {
    element: menuEl,
    show,
    showAnchored,
    hide,
    updateSections,
    isVisible: () => visible,
    destroy,
  };
}
