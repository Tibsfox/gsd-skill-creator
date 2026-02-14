/**
 * Submit flow renderer for the GSD Dashboard.
 *
 * Composes the upload zone, configuration form, and a submit button
 * into a single page section. On submit, writes milestone-config.json
 * to the config/ directory and creates a milestone-submit message in
 * inbox/pending/ via the helper endpoint.
 *
 * @module dashboard/submit-flow
 */

import { renderUploadZone } from './upload-zone.js';
import { renderConfigForm } from './config-form.js';

// ---------------------------------------------------------------------------
// Submit Flow Renderer
// ---------------------------------------------------------------------------

/**
 * Render the submit flow HTML combining upload zone, config form,
 * and a submit action with two-stage POST logic.
 *
 * @param helperUrl - URL for the helper endpoint. Defaults to '/api/console/message'.
 * @returns HTML string for the submit flow component.
 */
export function renderSubmitFlow(
  helperUrl = '/api/console/message',
): string {
  const uploadZoneHtml = renderUploadZone();
  const configFormHtml = renderConfigForm();

  return `<div class="submit-flow">
  <h2 class="submit-flow-title">New Milestone</h2>

  <div class="submit-flow-section">
    <h3>1. Upload Vision Document</h3>
    ${uploadZoneHtml}
  </div>

  <div class="submit-flow-section">
    <h3>2. Configure Execution</h3>
    ${configFormHtml}
  </div>

  <div class="submit-flow-section">
    <h3>3. Submit</h3>
    <button id="submit-milestone" class="submit-button" disabled>
      Submit Milestone
    </button>
    <div class="submit-status" style="display:none"></div>
  </div>

  <script>
  (function() {
    var HELPER_URL = '${helperUrl}';
    var submitBtn = document.getElementById('submit-milestone');
    var statusDiv = document.querySelector('.submit-status');
    var uploadZone = document.getElementById('upload-zone');
    var configForm = document.getElementById('config-form');

    // Enable/disable submit based on readiness
    function checkReady() {
      var hasFile = uploadZone && uploadZone.dataset.fileContent;
      var nameInput = document.querySelector('[name="milestone.name"]');
      var hasName = nameInput && nameInput.value.trim().length > 0;
      submitBtn.disabled = !(hasFile && hasName);
    }

    // Poll readiness (simple approach -- events from child components)
    setInterval(checkReady, 500);

    // Submit handler
    submitBtn.addEventListener('click', async function() {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      statusDiv.style.display = 'none';

      try {
        // 1. Collect config from form
        var configEl = document.getElementById('config-json-output');
        var config = JSON.parse(configEl.value || configEl.textContent);

        // 2. Write config file
        var configRes = await fetch(HELPER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: 'milestone-config.json',
            content: config,
            subdirectory: 'config'
          })
        });
        if (!configRes.ok) throw new Error('Config write failed: ' + (await configRes.text()));

        // 3. Create milestone-submit message
        var now = new Date();
        var msgId = 'msg-' + now.toISOString().slice(0,10).replace(/-/g,'') +
                    '-' + String(now.getTime()).slice(-4);
        var submitMsg = {
          id: msgId,
          type: 'milestone-submit',
          timestamp: now.toISOString(),
          source: 'dashboard',
          payload: {
            config_path: 'config/milestone-config.json',
            document_name: uploadZone.dataset.fileName || '',
            document_content: uploadZone.dataset.fileContent || ''
          }
        };

        var msgRes = await fetch(HELPER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: msgId + '-milestone-submit.json',
            content: submitMsg,
            subdirectory: 'inbox/pending'
          })
        });
        if (!msgRes.ok) throw new Error('Message write failed: ' + (await msgRes.text()));

        // Success
        statusDiv.textContent = 'Milestone submitted successfully';
        statusDiv.className = 'submit-status submit-status-success';
        statusDiv.style.display = 'block';
        submitBtn.textContent = 'Submitted';
      } catch (err) {
        statusDiv.textContent = 'Error: ' + err.message;
        statusDiv.className = 'submit-status submit-status-error';
        statusDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Milestone';
      }
    });
  })();
  </script>
</div>`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

/**
 * Return CSS styles for the submit flow component.
 *
 * Includes styles for the container, sections, submit button
 * (normal, disabled, loading), and status messages (success, error).
 *
 * @returns CSS string.
 */
export function renderSubmitFlowStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Submit Flow
   ----------------------------------------------------------------------- */

.submit-flow {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-lg, 1.25rem);
}

.submit-flow-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text, #e0e0e0);
  margin-bottom: var(--space-lg, 1.25rem);
}

.submit-flow-section {
  margin-bottom: var(--space-xl, 1.75rem);
}

.submit-flow-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-muted, #a0a0a0);
  margin-bottom: var(--space-md, 1rem);
}

/* Submit button */
.submit-button {
  display: inline-block;
  padding: var(--space-sm, 0.5rem) var(--space-xl, 1.75rem);
  background: var(--accent, #58a6ff);
  color: var(--bg, #0d1117);
  border: none;
  border-radius: var(--radius-sm, 4px);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, background 0.2s;
}

.submit-button:hover:not(:disabled) {
  opacity: 0.85;
}

.submit-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--text-dim, #666);
}

/* Status messages */
.submit-status {
  margin-top: var(--space-md, 1rem);
  padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
  border-radius: var(--radius-sm, 4px);
  font-size: 0.9rem;
}

.submit-status-success {
  background: color-mix(in srgb, var(--green, #3fb950) 15%, var(--surface, #1e1e2e));
  color: var(--green, #3fb950);
  border: 1px solid var(--green, #3fb950);
}

.submit-status-error {
  background: color-mix(in srgb, var(--red, #f85149) 15%, var(--surface, #1e1e2e));
  color: var(--red, #f85149);
  border: 1px solid var(--red, #f85149);
}
`;
}
