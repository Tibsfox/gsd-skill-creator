import type { WindowType } from "../wm/types";
import type { DesktopIconDef, PixelBitmap } from "./types";

/** Icon definitions for all 5 module types with Amiga-inspired pixel-art bitmaps */
const ICON_DEFS: readonly DesktopIconDef[] = [
  {
    type: "dashboard",
    label: "Dashboard",
    // Bar chart: 4 columns with varying heights
    bitmap: [
      0b00000000,
      0b01010100,
      0b01010100,
      0b01110100,
      0b01110110,
      0b01110110,
      0b01110110,
      0b00000000,
    ] as unknown as PixelBitmap,
    defaultBounds: { x: 20, y: 20, width: 640, height: 480 },
  },
  {
    type: "terminal",
    label: "Terminal",
    // Command prompt ">_" shape
    bitmap: [
      0b00000000,
      0b01000000,
      0b00100000,
      0b00010000,
      0b00100000,
      0b01000000,
      0b00011110,
      0b00000000,
    ] as unknown as PixelBitmap,
    defaultBounds: { x: 60, y: 60, width: 640, height: 480 },
  },
  {
    type: "console",
    label: "Console",
    // Speech bubble with dots
    bitmap: [
      0b00111100,
      0b01000010,
      0b01010010,
      0b01000010,
      0b01010010,
      0b01000010,
      0b00111100,
      0b00001000,
    ] as unknown as PixelBitmap,
    defaultBounds: { x: 100, y: 100, width: 500, height: 400 },
  },
  {
    type: "staging",
    label: "Staging",
    // Inbox/tray with arrow
    bitmap: [
      0b00010000,
      0b00111000,
      0b00010000,
      0b01111110,
      0b01000010,
      0b01000010,
      0b01000010,
      0b01111110,
    ] as unknown as PixelBitmap,
    defaultBounds: { x: 80, y: 80, width: 520, height: 420 },
  },
  {
    type: "settings",
    label: "Settings",
    // Gear/cog shape
    bitmap: [
      0b00010000,
      0b01010100,
      0b00111000,
      0b01101100,
      0b00111000,
      0b01010100,
      0b00010000,
      0b00000000,
    ] as unknown as PixelBitmap,
    defaultBounds: { x: 120, y: 120, width: 400, height: 350 },
  },
];

/** All module types that have desktop icons */
export const ALL_MODULE_TYPES: readonly WindowType[] = ICON_DEFS.map((d) => d.type);

/** Registry mapping WindowType to icon definition */
export const ICON_REGISTRY: ReadonlyMap<WindowType, DesktopIconDef> = new Map(
  ICON_DEFS.map((d) => [d.type, d]),
);

/** Get icon definition for a window type, or undefined */
export function getIconDef(type: WindowType): DesktopIconDef | undefined {
  return ICON_REGISTRY.get(type);
}
