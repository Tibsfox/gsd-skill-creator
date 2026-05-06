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

// Browser-mode atlas pulls every component CSS into the bundle so the dashboard
// gets the same styling the Tauri-side atlas/index.html serves via direct
// <link rel="stylesheet"> tags. The `?inline` query (Vite-specific) returns
// the file's text content as a string at build time; we concatenate and inject
// into a <style> tag at module-eval time so no separate CSS asset is needed.
import shellCss from '../atlas.css?inline';
import systemMapCss from '../system-map/system-map.css?inline';
import symbolGraphCss from '../symbol-graph/symbol-graph.css?inline';
import archeologyCss from '../archeology/archeology.css?inline';
import codeViewCss from '../code-view/code-view.css?inline';
import paletteCss from '../search-palette/palette.css?inline';

const ATLAS_BROWSER_CSS = [
  shellCss,
  systemMapCss,
  symbolGraphCss,
  archeologyCss,
  codeViewCss,
  paletteCss,
].join('\n\n');

if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-atlas-browser', 'true');
  styleEl.textContent = ATLAS_BROWSER_CSS;
  document.head.appendChild(styleEl);
}

export { createAtlas, attachToHashRouting } from '../index.js';
export type { AtlasShell, AtlasShellOptions } from '../shell.js';
export type { Coordinator } from '../coordinator.js';
