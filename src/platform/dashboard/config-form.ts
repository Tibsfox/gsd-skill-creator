/**
 * Configuration form HTML renderer for the GSD Dashboard.
 *
 * Produces form HTML with input controls for all milestone
 * configuration settings, grouped into collapsible fieldsets.
 * Includes client-side JavaScript to collect form values into
 * a JSON object matching the MilestoneConfig schema shape.
 *
 * @module dashboard/config-form
 */

import {
  DEFAULT_MILESTONE_CONFIG,
  type MilestoneConfig,
} from '../console/milestone-config.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a checked attribute if condition is true. */
function checked(condition: boolean): string {
  return condition ? ' checked' : '';
}

/** Generate a selected attribute if condition is true. */
function selected(condition: boolean): string {
  return condition ? ' selected' : '';
}

/** Merge partial overrides with defaults. */
function mergeDefaults(
  overrides?: Partial<MilestoneConfig>,
): MilestoneConfig {
  if (!overrides) return { ...DEFAULT_MILESTONE_CONFIG };
  return {
    milestone: { ...DEFAULT_MILESTONE_CONFIG.milestone, ...overrides.milestone },
    execution: {
      ...DEFAULT_MILESTONE_CONFIG.execution,
      ...overrides.execution,
      pause_points: {
        ...DEFAULT_MILESTONE_CONFIG.execution.pause_points,
        ...overrides.execution?.pause_points,
      },
    },
    research: { ...DEFAULT_MILESTONE_CONFIG.research, ...overrides.research },
    planning: { ...DEFAULT_MILESTONE_CONFIG.planning, ...overrides.planning },
    verification: { ...DEFAULT_MILESTONE_CONFIG.verification, ...overrides.verification },
    resources: { ...DEFAULT_MILESTONE_CONFIG.resources, ...overrides.resources },
    notifications: { ...DEFAULT_MILESTONE_CONFIG.notifications, ...overrides.notifications },
  };
}

// ---------------------------------------------------------------------------
// Toggle switch helper
// ---------------------------------------------------------------------------

function toggleSwitch(name: string, label: string, value: boolean): string {
  return `<label class="config-toggle">
      <input type="checkbox" name="${name}"${checked(value)}>
      <span class="config-toggle-label">${label}</span>
    </label>`;
}

// ---------------------------------------------------------------------------
// Range input helper
// ---------------------------------------------------------------------------

function rangeInput(
  name: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step = 1,
): string {
  return `<div class="config-range-group">
      <label class="config-label" for="${name}">${label}</label>
      <div class="config-range-row">
        <input type="range" id="${name}" name="${name}" min="${min}" max="${max}" step="${step}" value="${value}"
          oninput="document.getElementById('${name}-val').textContent=this.value">
        <span class="config-range-value" id="${name}-val">${value}</span>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Form Renderer
// ---------------------------------------------------------------------------

/**
 * Render a configuration form with input controls for all milestone settings.
 *
 * Groups settings into collapsible fieldsets: Execution, Research,
 * Planning, Verification, Resources, Notifications.
 * Milestone name is always visible at the top.
 *
 * @param defaults - Optional partial config to override default values.
 * @returns HTML string for the configuration form.
 */
export function renderConfigForm(
  defaults?: Partial<MilestoneConfig>,
): string {
  const cfg = mergeDefaults(defaults);

  return `<form id="config-form" class="config-form">

  <!-- Milestone Name (always visible) -->
  <div class="config-section config-section-milestone">
    <h3 class="config-section-title">Milestone</h3>
    <div class="config-field">
      <label class="config-label" for="milestone.name">Milestone Name</label>
      <input type="text" id="milestone.name" name="milestone.name" value="${cfg.milestone.name}" required maxlength="100" class="config-input">
    </div>
  </div>

  <!-- Execution -->
  <fieldset class="config-section config-section-execution">
    <legend class="config-section-title">Execution</legend>

    <div class="config-field config-radio-group">
      <span class="config-label">Mode</span>
      <label class="config-radio"><input type="radio" name="execution.mode" value="hitl"${checked(cfg.execution.mode === 'hitl')}> Human-in-the-Loop</label>
      <label class="config-radio"><input type="radio" name="execution.mode" value="supervised"${checked(cfg.execution.mode === 'supervised')}> Supervised</label>
      <label class="config-radio"><input type="radio" name="execution.mode" value="yolo"${checked(cfg.execution.mode === 'yolo')}> YOLO</label>
    </div>

    <div class="config-field config-toggles">
      <span class="config-label">Pause Points</span>
      ${toggleSwitch('execution.pause_points.after_planning', 'After Planning', cfg.execution.pause_points.after_planning)}
      ${toggleSwitch('execution.pause_points.after_each_phase', 'After Each Phase', cfg.execution.pause_points.after_each_phase)}
      ${toggleSwitch('execution.pause_points.after_verification', 'After Verification', cfg.execution.pause_points.after_verification)}
    </div>
  </fieldset>

  <!-- Research -->
  <fieldset class="config-section config-section-research">
    <legend class="config-section-title">Research</legend>

    <div class="config-field config-toggles">
      ${toggleSwitch('research.enabled', 'Enable Research', cfg.research.enabled)}
      ${toggleSwitch('research.web_search', 'Web Search', cfg.research.web_search)}
      ${toggleSwitch('research.skip_if_vision_sufficient', 'Skip if Vision Sufficient', cfg.research.skip_if_vision_sufficient)}
    </div>

    ${rangeInput('research.max_research_time_minutes', 'Max Research Time (minutes)', cfg.research.max_research_time_minutes, 1, 120)}
  </fieldset>

  <!-- Planning -->
  <fieldset class="config-section config-section-planning">
    <legend class="config-section-title">Planning</legend>

    <div class="config-field">
      <label class="config-label" for="planning.review_granularity">Review Granularity</label>
      <select id="planning.review_granularity" name="planning.review_granularity" class="config-select">
        <option value="phase"${selected(cfg.planning.review_granularity === 'phase')}>Phase</option>
        <option value="plan"${selected(cfg.planning.review_granularity === 'plan')}>Plan</option>
        <option value="task"${selected(cfg.planning.review_granularity === 'task')}>Task</option>
      </select>
    </div>

    ${rangeInput('planning.max_plans_per_phase', 'Max Plans per Phase', cfg.planning.max_plans_per_phase, 1, 20)}

    <div class="config-field config-toggles">
      ${toggleSwitch('planning.auto_approve', 'Auto-Approve Plans', cfg.planning.auto_approve)}
      ${toggleSwitch('planning.require_tdd', 'Require TDD', cfg.planning.require_tdd)}
    </div>
  </fieldset>

  <!-- Verification -->
  <fieldset class="config-section config-section-verification">
    <legend class="config-section-title">Verification</legend>

    <div class="config-field config-toggles">
      ${toggleSwitch('verification.run_tests', 'Run Tests', cfg.verification.run_tests)}
      ${toggleSwitch('verification.type_check', 'Type Check', cfg.verification.type_check)}
      ${toggleSwitch('verification.lint', 'Lint', cfg.verification.lint)}
      ${toggleSwitch('verification.block_on_failure', 'Block on Failure', cfg.verification.block_on_failure)}
    </div>

    ${rangeInput('verification.coverage_threshold', 'Coverage Threshold (%)', cfg.verification.coverage_threshold, 0, 100)}
  </fieldset>

  <!-- Resources -->
  <fieldset class="config-section config-section-resources">
    <legend class="config-section-title">Resources</legend>

    ${rangeInput('resources.token_budget_pct', 'Token Budget (%)', cfg.resources.token_budget_pct, 1, 100)}
    ${rangeInput('resources.max_phases', 'Max Phases', cfg.resources.max_phases, 1, 50)}
    ${rangeInput('resources.max_wall_time_minutes', 'Max Wall Time (minutes)', cfg.resources.max_wall_time_minutes, 1, 1440)}

    <div class="config-field config-radio-group">
      <span class="config-label">Model Preference</span>
      <label class="config-radio"><input type="radio" name="resources.model_preference" value="quality"${checked(cfg.resources.model_preference === 'quality')}> Quality</label>
      <label class="config-radio"><input type="radio" name="resources.model_preference" value="balanced"${checked(cfg.resources.model_preference === 'balanced')}> Balanced</label>
      <label class="config-radio"><input type="radio" name="resources.model_preference" value="speed"${checked(cfg.resources.model_preference === 'speed')}> Speed</label>
    </div>
  </fieldset>

  <!-- Notifications -->
  <fieldset class="config-section config-section-notifications">
    <legend class="config-section-title">Notifications</legend>

    <div class="config-field config-toggles">
      ${toggleSwitch('notifications.on_phase_complete', 'Phase Complete', cfg.notifications.on_phase_complete)}
      ${toggleSwitch('notifications.on_question', 'Questions', cfg.notifications.on_question)}
      ${toggleSwitch('notifications.on_error', 'Errors', cfg.notifications.on_error)}
      ${toggleSwitch('notifications.on_milestone_complete', 'Milestone Complete', cfg.notifications.on_milestone_complete)}
    </div>
  </fieldset>

  <!-- Hidden output for collected JSON -->
  <textarea id="config-json-output" style="display:none;"></textarea>

  <script>
  (function() {
    var form = document.getElementById('config-form');
    if (!form) return;

    function collectConfig() {
      var config = {
        milestone: {
          name: form.querySelector('[name="milestone.name"]').value,
          submitted_at: new Date().toISOString(),
          submitted_by: 'dashboard'
        },
        execution: {
          mode: (form.querySelector('[name="execution.mode"]:checked') || {}).value || 'supervised',
          yolo: ((form.querySelector('[name="execution.mode"]:checked') || {}).value || '') === 'yolo',
          pause_points: {
            after_planning: form.querySelector('[name="execution.pause_points.after_planning"]').checked,
            after_each_phase: form.querySelector('[name="execution.pause_points.after_each_phase"]').checked,
            after_verification: form.querySelector('[name="execution.pause_points.after_verification"]').checked
          }
        },
        research: {
          enabled: form.querySelector('[name="research.enabled"]').checked,
          web_search: form.querySelector('[name="research.web_search"]').checked,
          max_research_time_minutes: parseInt(form.querySelector('[name="research.max_research_time_minutes"]').value, 10),
          skip_if_vision_sufficient: form.querySelector('[name="research.skip_if_vision_sufficient"]').checked
        },
        planning: {
          auto_approve: form.querySelector('[name="planning.auto_approve"]').checked,
          review_granularity: form.querySelector('[name="planning.review_granularity"]').value,
          max_plans_per_phase: parseInt(form.querySelector('[name="planning.max_plans_per_phase"]').value, 10),
          require_tdd: form.querySelector('[name="planning.require_tdd"]').checked
        },
        verification: {
          run_tests: form.querySelector('[name="verification.run_tests"]').checked,
          type_check: form.querySelector('[name="verification.type_check"]').checked,
          lint: form.querySelector('[name="verification.lint"]').checked,
          block_on_failure: form.querySelector('[name="verification.block_on_failure"]').checked,
          coverage_threshold: parseInt(form.querySelector('[name="verification.coverage_threshold"]').value, 10)
        },
        resources: {
          token_budget_pct: parseInt(form.querySelector('[name="resources.token_budget_pct"]').value, 10),
          max_phases: parseInt(form.querySelector('[name="resources.max_phases"]').value, 10),
          max_wall_time_minutes: parseInt(form.querySelector('[name="resources.max_wall_time_minutes"]').value, 10),
          model_preference: (form.querySelector('[name="resources.model_preference"]:checked') || {}).value || 'quality'
        },
        notifications: {
          on_phase_complete: form.querySelector('[name="notifications.on_phase_complete"]').checked,
          on_question: form.querySelector('[name="notifications.on_question"]').checked,
          on_error: form.querySelector('[name="notifications.on_error"]').checked,
          on_milestone_complete: form.querySelector('[name="notifications.on_milestone_complete"]').checked
        }
      };

      var output = document.getElementById('config-json-output');
      if (output) output.value = JSON.stringify(config, null, 2);

      return config;
    }

    // Collect on any form change
    form.addEventListener('change', collectConfig);
    form.addEventListener('input', collectConfig);

    // Initial collection
    collectConfig();
  })();
  </script>
</form>`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

/**
 * Return CSS styles for the configuration form component.
 *
 * Uses CSS custom properties from the dashboard dark theme
 * (defined in the parent page's `:root` block) so the form
 * inherits colors and spacing automatically.
 *
 * @returns CSS string.
 */
export function renderConfigFormStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Configuration Form
   ----------------------------------------------------------------------- */

.config-form {
  font-family: var(--font-sans, system-ui, sans-serif);
  color: var(--text, #e0e0e0);
}

.config-section {
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-lg, 1.25rem);
  margin-bottom: var(--space-md, 1rem);
}

.config-section legend,
.config-section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text, #e0e0e0);
  margin-bottom: var(--space-sm, 0.5rem);
  padding: 0 var(--space-xs, 0.25rem);
}

.config-field {
  margin-bottom: var(--space-md, 1rem);
}

.config-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted, #a0a0a0);
  margin-bottom: var(--space-xs, 0.25rem);
}

.config-input,
.config-select {
  width: 100%;
  padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
  background: var(--bg, #0d1117);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-sm, 4px);
  color: var(--text, #e0e0e0);
  font-size: 0.95rem;
  font-family: inherit;
  box-sizing: border-box;
}

.config-input:focus,
.config-select:focus {
  outline: none;
  border-color: var(--accent, #58a6ff);
}

/* Radio groups */
.config-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm, 0.5rem);
  align-items: center;
}

.config-radio {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: var(--text, #e0e0e0);
  cursor: pointer;
}

/* Toggle switches */
.config-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm, 0.5rem);
}

.config-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: var(--text, #e0e0e0);
  cursor: pointer;
}

.config-toggle-label {
  user-select: none;
}

/* Range inputs */
.config-range-group {
  margin-bottom: var(--space-md, 1rem);
}

.config-range-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 0.5rem);
}

.config-range-row input[type="range"] {
  flex: 1;
  accent-color: var(--accent, #58a6ff);
}

.config-range-value {
  min-width: 3ch;
  text-align: right;
  font-family: var(--font-mono, monospace);
  font-size: 0.9rem;
  color: var(--accent, #58a6ff);
}
`;
}
