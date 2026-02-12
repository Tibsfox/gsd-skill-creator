/**
 * Per-section JavaScript refresh snippet generator.
 *
 * Generates self-contained `<script>` blocks that each dashboard section
 * embeds to handle its own independent refresh cycle. Hot sections fetch
 * and replace their content every 1-2s, warm sections every 5-10s, and
 * cold sections only on external trigger (no auto-polling).
 *
 * This replaces the v1.12 full-page-reload approach with granular
 * per-section polling via fetch() + innerHTML replacement.
 *
 * @module dashboard/metrics/tier-refresh
 */

import { SampleTier, type SampleRateConfig, type TierInterval } from './types.js';
import { resolveSectionInterval } from './sample-rate.js';

// ============================================================================
// Constants
// ============================================================================

/** Default API base path for section data endpoints. */
const DEFAULT_API_BASE_PATH = '/api/metrics/';

// ============================================================================
// Script Generation
// ============================================================================

/**
 * Generate a self-contained `<script>` block that auto-refreshes a single
 * dashboard section via fetch() + innerHTML replacement.
 *
 * The generated JavaScript uses ES5 syntax for maximum browser compatibility
 * (no arrow functions, no const/let). It includes error handling via
 * try/catch so a failed fetch never breaks the page.
 *
 * @param sectionId - Dashboard section identifier (e.g., "session-pulse")
 * @param config - Optional custom SampleRateConfig (defaults to built-in)
 * @param apiBasePath - URL prefix for section endpoints (default: "/api/metrics/")
 * @returns `<script>` HTML string, or empty string for cold/unknown sections
 */
export function generateSectionRefreshScript(
  sectionId: string,
  config?: SampleRateConfig,
  apiBasePath?: string,
): string {
  const interval = resolveSectionInterval(sectionId, config);

  // Cold tier or unknown section: no auto-polling
  if (!interval || interval.intervalMs === 0) {
    return '';
  }

  const basePath = apiBasePath ?? DEFAULT_API_BASE_PATH;

  return `<script>
(function() {
  var el = document.getElementById('gsd-section-${sectionId}');
  if (!el) return;
  setInterval(function() {
    try {
      fetch('${basePath}${sectionId}')
        .then(function(r) { return r.ok ? r.text() : ''; })
        .then(function(html) { if (html) el.innerHTML = html; })
        .catch(function() {});
    } catch(e) {}
  }, ${interval.intervalMs});
})();
</script>`;
}

// ============================================================================
// Section Wrapping
// ============================================================================

/**
 * Wrap dashboard section content in a `<div>` with tier metadata and
 * optionally append a per-section refresh script.
 *
 * The wrapper div includes:
 * - `id="gsd-section-{sectionId}"` for script targeting
 * - `data-tier="{tierName}"` for CSS/debugging
 * - `data-interval="{intervalMs}"` for observability
 *
 * Hot and warm sections get a refresh script appended after the div.
 * Cold and unknown sections get only the wrapper div (no script).
 *
 * @param sectionId - Dashboard section identifier
 * @param content - HTML content to wrap
 * @param config - Optional custom SampleRateConfig
 * @param apiBasePath - URL prefix for section endpoints
 * @returns HTML string with wrapper div and optional refresh script
 */
export function wrapSectionWithRefresh(
  sectionId: string,
  content: string,
  config?: SampleRateConfig,
  apiBasePath?: string,
): string {
  const interval = resolveSectionInterval(sectionId, config);

  // Determine tier name and interval for data attributes
  const tierName = interval?.tier ?? 'unknown';
  const intervalMs = interval?.intervalMs ?? 0;

  // Build the wrapper div
  const wrapper = `<div id="gsd-section-${sectionId}" data-tier="${tierName}" data-interval="${intervalMs}">${content}</div>`;

  // Append refresh script for hot/warm sections (intervalMs > 0)
  if (interval && interval.intervalMs > 0) {
    const script = generateSectionRefreshScript(sectionId, config, apiBasePath);
    return wrapper + '\n' + script;
  }

  return wrapper;
}
