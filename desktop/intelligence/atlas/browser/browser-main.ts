/**
 * Atlas browser bundle entry (v1.49.607 W4c).
 *
 * This module is the Vite rollup input that produces
 * `dashboard/intelligence/atlas.bundle.js`. It re-exports the same factory
 * functions the Tauri shell uses (`createAtlas`, `attachToHashRouting`) so the
 * dashboard's `atlas.html` can dynamically import this bundle and mount the
 * full 4-pane atlas UI without any Tauri runtime.
 *
 * Browser-mode IPC: `intelligenceIpc` in `src/intelligence/ipc.ts` already
 * feature-detects `__TAURI__` and falls back to `POST /api/intelligence/invoke`
 * + `/api/events` SSE. This module imports the same UI surface; the IPC fallback
 * is what makes the atlas work without the Tauri shell.
 *
 * No `@tauri-apps/api` imports are reachable from this entry — the W4c contract
 * test (`atlas-bridge.test.ts`) ratifies the catalog; the browser bundle is
 * inert until the dashboard calls `createAtlas(host)`.
 */

export { createAtlas, attachToHashRouting } from '../index.js';
export type { AtlasShell, AtlasShellOptions } from '../shell.js';
export type { Coordinator } from '../coordinator.js';
