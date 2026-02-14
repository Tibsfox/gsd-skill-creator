export type {
  PixelBitmap,
  DesktopIconDef,
  ProcessStatus,
  ProcessIndicator,
  TaskbarEntry,
  MenuItem,
  MenuSection,
  KeyBinding,
} from "./types";

export {
  ICON_REGISTRY,
  getIconDef,
  ALL_MODULE_TYPES,
} from "./icon-registry";

export type { DesktopIconsHandle, IconActivateCallback } from "./desktop-icons";
export { createDesktopIcons } from "./desktop-icons";

export { ProcessMonitor } from "./process-monitor";
export type { ProcessChangeCallback } from "./process-monitor";
export type { TaskbarHandle, TaskbarClickCallback } from "./taskbar";
export { createTaskbar } from "./taskbar";

export type { SystemMenuHandle } from "./system-menu";
export { createSystemMenu } from "./system-menu";
export { KeyboardManager } from "./keyboard-nav";
