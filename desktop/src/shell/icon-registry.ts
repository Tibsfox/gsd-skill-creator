import type { WindowType } from "../wm/types";
import type { DesktopIconDef } from "./types";

/** All module types that have desktop icons */
export const ALL_MODULE_TYPES: readonly WindowType[] = [];

/** Registry mapping WindowType to icon definition */
export const ICON_REGISTRY: ReadonlyMap<WindowType, DesktopIconDef> = new Map();

/** Get icon definition for a window type, or undefined */
export function getIconDef(_type: WindowType): DesktopIconDef | undefined {
  throw new Error("Not implemented");
}
