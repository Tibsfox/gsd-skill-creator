/**
 * Console settings panel renderer.
 *
 * Renders hot-configurable and non-hot settings from MilestoneConfig
 * as interactive controls. Hot settings can be changed while a session
 * is running; changes are posted to the helper endpoint as config-update
 * messages. Non-hot settings are disabled with a tooltip indicating
 * that a session restart is required.
 *
 * @module dashboard/console-settings
 */

import type { MilestoneConfig } from '../console/milestone-config.js';

// ---------------------------------------------------------------------------
// Hot settings registry
// ---------------------------------------------------------------------------

/**
 * Set of dotted paths for hot-configurable settings.
 * These can be changed while a session is running.
 */
const HOT_SETTINGS = new Set([
  'execution.mode',
  'execution.yolo',
  'execution.pause_points.after_planning',
  'execution.pause_points.after_each_phase',
  'execution.pause_points.after_verification',
  'research.enabled',
  'research.web_search',
  'planning.auto_approve',
  'planning.require_tdd',
  'verification.run_tests',
  'verification.type_check',
  'verification.lint',
  'verification.block_on_failure',
  'notifications.on_phase_complete',
  'notifications.on_question',
  'notifications.on_error',
  'notifications.on_milestone_complete',
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Format a dotted key segment as a human-readable label. */
function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Check if a setting path is hot-configurable. */
function isHot(path: string): boolean {
  return HOT_SETTINGS.has(path);
}

/** Render disabled + title attributes for non-hot settings. */
function nonHotAttrs(path: string): string {
  if (isHot(path)) return '';
  return ' disabled title="Requires session restart to take effect"';
}

/** Render a checkbox toggle control. */
function renderToggle(path: string, label: string, checked: boolean): string {
  const hot = isHot(path);
  const checkedAttr = checked ? ' checked' : '';
  const disabledAttr = hot ? '' : ' disabled';
  const titleAttr = hot ? '' : ' title="Requires session restart to take effect"';
  const disabledClass = hot ? '' : ' setting-disabled';

  return `<label class="setting-toggle${disabledClass}">` +
    `<input type="checkbox" data-setting="${path}" data-hot="${hot}"${checkedAttr}${disabledAttr}${titleAttr}>` +
    ` ${label}</label>`;
}

/** Render a select dropdown control. */
function renderSelect(
  path: string,
  label: string,
  options: string[],
  current: string,
): string {
  const hot = isHot(path);
  const disabledAttr = hot ? '' : ' disabled';
  const titleAttr = hot ? '' : ' title="Requires session restart to take effect"';
  const disabledClass = hot ? '' : ' setting-disabled';

  const optionsHtml = options
    .map((opt) => {
      const selected = opt === current ? ' selected' : '';
      return `<option value="${opt}"${selected}>${formatLabel(opt)}</option>`;
    })
    .join('');

  return `<div class="setting-select${disabledClass}">` +
    `<label>${label}</label>` +
    `<select data-setting="${path}" data-hot="${hot}"${disabledAttr}${titleAttr}>` +
    `${optionsHtml}</select></div>`;
}

/** Render a number input control. */
function renderNumber(
  path: string,
  label: string,
  value: number,
  min: number,
  max: number,
): string {
  const hot = isHot(path);
  const disabledAttr = hot ? '' : ' disabled';
  const titleAttr = hot ? '' : ' title="Requires session restart to take effect"';
  const disabledClass = hot ? '' : ' setting-disabled';

  return `<div class="setting-number${disabledClass}">` +
    `<label>${label}</label>` +
    `<input type="number" data-setting="${path}" data-hot="${hot}" value="${value}" min="${min}" max="${max}"${disabledAttr}${titleAttr}>` +
    `</div>`;
}

/** Wrap controls in a setting-group with a heading. */
function renderGroup(title: string, controls: string[]): string {
  return `<div class="setting-group">` +
    `<h4>${title}</h4>` +
    controls.join('\n') +
    `</div>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render the console settings panel HTML.
 *
 * Displays grouped controls for all MilestoneConfig settings.
 * Hot-configurable settings are enabled; non-hot settings are disabled
 * with a tooltip explaining that a session restart is required.
 *
 * @param config - The current milestone configuration
 * @returns HTML string for the settings panel
 */
export function renderConsoleSettings(config: MilestoneConfig): string {
  const exec = config.execution;
  const research = config.research;
  const planning = config.planning;
  const verification = config.verification;
  const resources = config.resources;
  const notifications = config.notifications;

  // -- Execution section --
  const executionControls = [
    renderSelect('execution.mode', 'Mode', ['hitl', 'supervised', 'yolo'], exec.mode),
    renderToggle('execution.pause_points.after_planning', 'Pause After Planning', exec.pause_points.after_planning),
    renderToggle('execution.pause_points.after_each_phase', 'Pause After Each Phase', exec.pause_points.after_each_phase),
    renderToggle('execution.pause_points.after_verification', 'Pause After Verification', exec.pause_points.after_verification),
  ];

  // -- Research section --
  const researchControls = [
    renderToggle('research.enabled', 'Research Enabled', research.enabled),
    renderToggle('research.web_search', 'Web Search', research.web_search),
    renderNumber('research.max_research_time_minutes', 'Max Research Time (min)', research.max_research_time_minutes, 1, 120),
  ];

  // -- Planning section --
  const planningControls = [
    renderToggle('planning.auto_approve', 'Auto Approve', planning.auto_approve),
    renderToggle('planning.require_tdd', 'Require TDD', planning.require_tdd),
    renderSelect('planning.review_granularity', 'Review Granularity', ['phase', 'plan', 'task'], planning.review_granularity),
    renderNumber('planning.max_plans_per_phase', 'Max Plans Per Phase', planning.max_plans_per_phase, 1, 20),
  ];

  // -- Verification section --
  const verificationControls = [
    renderToggle('verification.run_tests', 'Run Tests', verification.run_tests),
    renderToggle('verification.type_check', 'Type Check', verification.type_check),
    renderToggle('verification.lint', 'Lint', verification.lint),
    renderToggle('verification.block_on_failure', 'Block On Failure', verification.block_on_failure),
    renderNumber('verification.coverage_threshold', 'Coverage Threshold (%)', verification.coverage_threshold, 0, 100),
  ];

  // -- Resources section --
  const resourcesControls = [
    renderSelect('resources.model_preference', 'Model Preference', ['quality', 'balanced', 'speed'], resources.model_preference),
    renderNumber('resources.token_budget_pct', 'Token Budget (%)', resources.token_budget_pct, 1, 100),
    renderNumber('resources.max_phases', 'Max Phases', resources.max_phases, 1, 50),
    renderNumber('resources.max_wall_time_minutes', 'Max Wall Time (min)', resources.max_wall_time_minutes, 1, 1440),
  ];

  // -- Notifications section --
  const notificationsControls = [
    renderToggle('notifications.on_phase_complete', 'On Phase Complete', notifications.on_phase_complete),
    renderToggle('notifications.on_question', 'On Question', notifications.on_question),
    renderToggle('notifications.on_error', 'On Error', notifications.on_error),
    renderToggle('notifications.on_milestone_complete', 'On Milestone Complete', notifications.on_milestone_complete),
  ];

  const groups = [
    renderGroup('Execution', executionControls),
    renderGroup('Research', researchControls),
    renderGroup('Planning', planningControls),
    renderGroup('Verification', verificationControls),
    renderGroup('Resources', resourcesControls),
    renderGroup('Notifications', notificationsControls),
  ];

  return `<div class="console-settings-panel">\n${groups.join('\n')}\n</div>`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

/**
 * Return CSS styles for the console settings panel.
 *
 * Includes styles for setting groups, toggles, selects, numbers,
 * disabled state, and the pending-sync indicator.
 *
 * @returns CSS string
 */
export function renderConsoleSettingsStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Console Settings Panel
   ----------------------------------------------------------------------- */

.console-settings-panel {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md, 1rem);
}

.setting-group {
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-md, 1rem);
}

.setting-group h4 {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary, #e0e0e0);
  margin: 0 0 var(--space-sm, 0.5rem) 0;
  padding-bottom: var(--space-xs, 0.25rem);
  border-bottom: 1px solid var(--border, #333);
}

.setting-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-primary, #e0e0e0);
}

.setting-toggle input[type="checkbox"] {
  cursor: pointer;
  accent-color: var(--accent, #58a6ff);
}

.setting-toggle input[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-select {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 0.85rem;
  color: var(--text-primary, #e0e0e0);
}

.setting-select label {
  min-width: 80px;
}

.setting-select select {
  background: var(--bg, #0d1117);
  color: var(--text-primary, #e0e0e0);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-sm, 4px);
  padding: 4px 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.setting-select select[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-number {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 0.85rem;
  color: var(--text-primary, #e0e0e0);
}

.setting-number label {
  min-width: 80px;
  flex: 1;
}

.setting-number input[type="number"] {
  width: 80px;
  background: var(--bg, #0d1117);
  color: var(--text-primary, #e0e0e0);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-sm, 4px);
  padding: 4px 8px;
  font-size: 0.85rem;
}

.setting-number input[type="number"][disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-disabled {
  opacity: 0.5;
}

/* --- Pending sync indicator --- */

.setting-pending {
  position: relative;
  border-color: var(--accent, #58a6ff);
  box-shadow: 0 0 0 1px var(--accent, #58a6ff);
  border-radius: var(--radius-sm, 4px);
  padding: 2px 4px;
}

.setting-pending::after {
  content: "syncing...";
  font-size: 0.65rem;
  color: var(--accent, #58a6ff);
  margin-left: 8px;
  animation: setting-pulse 1.5s ease-in-out infinite;
}

@keyframes setting-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.setting-pending.setting-synced {
  border-color: transparent;
  box-shadow: none;
}

.setting-pending.setting-synced::after {
  display: none;
}
`;
}

// ---------------------------------------------------------------------------
// Client-side script
// ---------------------------------------------------------------------------

/**
 * Return a client-side script that handles settings changes.
 *
 * Attaches change event listeners on all hot-configurable controls
 * within .console-settings-panel. On change, constructs a config-update
 * message envelope and POSTs it to the helper endpoint.
 *
 * @param helperUrl - URL for the helper endpoint (e.g., /api/console/message)
 * @returns HTML script tag string
 */
export function renderSettingsScript(helperUrl: string): string {
  return `<script>
(function() {
  var settingsPanel = document.querySelector('.console-settings-panel');
  if (!settingsPanel) return;

  var seqCounter = 0;

  function generateMsgId() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    seqCounter++;
    return 'msg-' + y + m + d + '-' + String(seqCounter).padStart(3, '0');
  }

  settingsPanel.addEventListener('change', function(e) {
    var target = e.target;
    if (!target || !target.dataset) return;
    var settingPath = target.dataset.setting;
    var hotFlag = target.dataset.hot;
    if (!settingPath || hotFlag !== 'true') return;

    var value;
    if (target.type === 'checkbox') {
      value = target.checked;
    } else if (target.type === 'number') {
      value = target.valueAsNumber;
    } else {
      value = target.value;
    }

    var envelope = {
      id: generateMsgId(),
      type: 'config-update',
      timestamp: new Date().toISOString(),
      source: 'dashboard',
      payload: {
        settings: {},
        hot: true
      }
    };
    envelope.payload.settings[settingPath] = value;

    var pendingEl = target.closest('.setting-toggle') || target.closest('.setting-select') || target.closest('.setting-number') || target.closest('.setting-group');
    if (pendingEl) {
      pendingEl.classList.add('setting-pending');
    }

    fetch('${helperUrl}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: envelope.id + '-config-update.json',
        content: envelope,
        subdirectory: 'inbox/pending'
      })
    }).then(function(res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      // Keep .setting-pending -- cleared on next dashboard regeneration
    }).catch(function(err) {
      console.error('Settings update failed:', err);
      // Revert value
      if (target.type === 'checkbox') {
        target.checked = !target.checked;
      }
      if (pendingEl) {
        pendingEl.classList.remove('setting-pending');
      }
    });
  });
})();
</script>`;
}
