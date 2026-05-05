/**
 * Atlas — public API.
 *
 * Usage:
 *   import { createAtlas, attachToHashRouting } from './atlas/index.js';
 *   const atlas = createAtlas(document.getElementById('atlas-root')!);
 *   const detach = attachToHashRouting(atlas.coordinator);
 */

export { createAtlasShell } from './shell.js';
export type { AtlasShell, AtlasShellOptions } from './shell.js';

export { createCoordinator } from './coordinator.js';
export type { Coordinator, CoordinatedView, FocusSubscriber } from './coordinator.js';

export { parseHash, serializeHash } from './focus-state.js';
export type { Focus } from './focus-state.js';

import { createAtlasShell } from './shell.js';
import type { Coordinator } from './coordinator.js';
import type { AtlasShell } from './shell.js';

/**
 * Factory: create + mount the atlas in one call.
 */
export function createAtlas(host: HTMLElement): AtlasShell {
  const atlas = createAtlasShell();
  atlas.mount(host);
  return atlas;
}

/**
 * Wire the coordinator to the browser's history hash so that
 * reload survives and back-button works.
 * Returns a cleanup function.
 */
export function attachToHashRouting(coordinator: Coordinator): () => void {
  return coordinator.attachHashRouting();
}
