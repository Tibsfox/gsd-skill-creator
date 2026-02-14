export type {
  WindowId,
  WindowType,
  WindowBounds,
  WindowState,
  CreateWindowOptions,
  ZStack,
} from "./types";

export {
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  DEFAULT_WINDOW_BOUNDS,
} from "./types";

export {
  createWindow,
  updateBounds,
  minimizeWindow,
  restoreWindow,
} from "./window-state";

export {
  createZStack,
  bringToFront,
  sendToBack,
  depthCycle,
  removeFromStack,
  insertAtFront,
  getZIndex,
  getFront,
} from "./z-order";

export type {
  GadgetAction,
  GadgetCallback,
  WindowChromeElements,
} from "./window-chrome";

export { createWindowChrome } from "./window-chrome";

export type { BoundsUpdateCallback, Cleanup } from "./drag-resize";

export { enableDrag, enableResize } from "./drag-resize";
