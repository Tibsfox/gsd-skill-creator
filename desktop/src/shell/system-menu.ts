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
  throw new Error("Not implemented");
}
