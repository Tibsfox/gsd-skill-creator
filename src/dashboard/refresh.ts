/**
 * Auto-refresh script generator for the GSD Planning Docs Dashboard.
 *
 * Generates a self-contained JavaScript snippet that:
 * - Periodically refreshes the page via setInterval
 * - Preserves scroll position across refreshes using sessionStorage
 * - Shows a brief visual indicator when a refresh occurs
 */

// ---------------------------------------------------------------------------
// Refresh script generation
// ---------------------------------------------------------------------------

/**
 * Generate a `<script>` block that auto-refreshes the current page.
 *
 * The generated script:
 * 1. Creates a fixed-position overlay indicator ("Refreshing...")
 * 2. Saves the current scrollY to sessionStorage before reload
 * 3. Restores scrollY after page load from sessionStorage
 * 4. Uses setInterval to trigger refresh at the given interval
 *
 * @param intervalMs - Refresh interval in milliseconds.
 * @returns HTML string containing a `<script>` tag and indicator styles.
 */
export function generateRefreshScript(intervalMs: number): string {
  return `<style>
  #gsd-refresh-indicator {
    position: fixed;
    top: 8px;
    right: 8px;
    background: rgba(59, 130, 246, 0.9);
    color: var(--text, #fff);
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-family: system-ui, sans-serif;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  #gsd-refresh-indicator.visible {
    opacity: 1;
  }
</style>
<div id="gsd-refresh-indicator">Refreshing...</div>
<script>
(function() {
  var STORAGE_KEY = 'gsd-dashboard-scrollY';
  var INDICATOR_KEY = 'gsd-dashboard-refreshing';

  // Restore scroll position after refresh
  var savedY = sessionStorage.getItem(STORAGE_KEY);
  if (savedY !== null) {
    window.scrollTo(0, parseInt(savedY, 10));
    sessionStorage.removeItem(STORAGE_KEY);
  }

  // Show indicator briefly if we just refreshed
  var wasRefreshing = sessionStorage.getItem(INDICATOR_KEY);
  if (wasRefreshing) {
    sessionStorage.removeItem(INDICATOR_KEY);
    var indicator = document.getElementById('gsd-refresh-indicator');
    if (indicator) {
      indicator.classList.add('visible');
      setTimeout(function() {
        indicator.classList.remove('visible');
      }, 1200);
    }
  }

  // Schedule periodic refresh
  setInterval(function() {
    // Save scroll position
    sessionStorage.setItem(STORAGE_KEY, String(window.scrollY));
    // Mark that we are refreshing (so indicator shows after reload)
    sessionStorage.setItem(INDICATOR_KEY, '1');
    // Reload the page
    window.location.reload();
  }, ${intervalMs});
})();
</script>`;
}
