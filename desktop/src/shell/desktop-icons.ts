import type { DesktopIconDef } from "./types";

/** Handle returned by createDesktopIcons for external interaction */
export interface DesktopIconsHandle {
  /** The container element holding all icons */
  element: HTMLDivElement;
  /** Destroy all icons and clean up listeners */
  destroy: () => void;
}

/**
 * Callback invoked when a desktop icon is double-clicked.
 * Receives the WindowType of the icon.
 */
export type IconActivateCallback = (type: string) => void;

/**
 * Create the desktop icon grid.
 *
 * Renders pixel-art icons for all registered modules.
 * Double-clicking an icon triggers the onActivate callback.
 *
 * @param icons - Icon definitions to render
 * @param onActivate - Called when an icon is double-clicked
 */
export function createDesktopIcons(
  _icons: readonly DesktopIconDef[],
  _onActivate: IconActivateCallback,
): DesktopIconsHandle {
  throw new Error("Not implemented");
}
