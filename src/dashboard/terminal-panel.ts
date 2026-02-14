/**
 * Terminal panel renderer for the GSD Dashboard.
 *
 * Produces themed iframe HTML targeting a Wetty terminal server,
 * with client-side JavaScript that detects offline state and
 * displays an informative fallback message.
 *
 * @module dashboard/terminal-panel
 */

import type { TerminalConfig } from '../integration/config/terminal-types.js';

// ---------------------------------------------------------------------------
// Panel Renderer
// ---------------------------------------------------------------------------

/**
 * Render a terminal panel containing a Wetty iframe with offline fallback.
 *
 * The output includes:
 * - A styled iframe targeting the configured Wetty URL
 * - A hidden fallback div shown when Wetty is unreachable
 * - A script that probes the URL and toggles visibility
 *
 * @param config - Terminal configuration with port, base_path, etc.
 * @returns HTML string for the terminal panel.
 */
export function renderTerminalPanel(config: TerminalConfig): string {
  const url = `http://localhost:${config.port}${config.base_path}`;

  return `<div class="terminal-panel">
  <iframe
    class="terminal-iframe"
    data-terminal-url="${url}"
    title="Terminal"
  ></iframe>
  <div class="terminal-fallback" style="display: block;">
    <div class="terminal-fallback-title">Terminal Offline</div>
    <div class="terminal-fallback-message">Terminal service is not available. Start Wetty with: <code>npx skill-creator terminal start</code></div>
    <div class="terminal-fallback-url">${url}</div>
  </div>
  <script>
  (function() {
    var url = '${url}';
    var iframe = document.querySelector('.terminal-iframe');
    var fallback = document.querySelector('.terminal-fallback');

    function checkAvailability() {
      fetch(url, { mode: 'no-cors' })
        .then(function(res) {
          if (res.type === 'opaque' || res.ok) {
            if (iframe) {
              if (!iframe.src) iframe.src = url;
              iframe.style.display = 'block';
            }
            if (fallback) fallback.style.display = 'none';
          } else {
            throw new Error('not available');
          }
        })
        .catch(function() {
          if (iframe) {
            iframe.removeAttribute('src');
            iframe.style.display = 'none';
          }
          if (fallback) fallback.style.display = 'block';
        });
    }

    checkAvailability();
    setInterval(checkAvailability, 10000);
  })();
  </script>
</div>`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

/**
 * Return CSS styles for the terminal panel component.
 *
 * Uses CSS custom properties from the dashboard dark theme
 * (defined in the parent page's `:root` block) so the panel
 * inherits colors and spacing automatically.
 *
 * @returns CSS string.
 */
export function renderTerminalStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Terminal Panel
   ----------------------------------------------------------------------- */

.terminal-panel {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--space-md);
  min-height: 400px;
  position: relative;
}

.terminal-iframe {
  width: 100%;
  height: 500px;
  border: none;
  background: var(--bg);
  display: none;
}

.terminal-fallback {
  display: block;
  padding: var(--space-xl);
  text-align: center;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.terminal-fallback-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-md);
}

.terminal-fallback-message {
  margin-bottom: var(--space-sm);
  line-height: 1.6;
}

.terminal-fallback-message code {
  background: var(--surface);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.9em;
}

.terminal-fallback-url {
  font-size: 0.85rem;
  color: var(--text-dim);
  margin-top: var(--space-sm);
}
`;
}
