/**
 * Question card renderer for the GSD Dashboard.
 *
 * Converts a validated {@link Question} object into an interactive HTML card
 * with the correct input type for each of the 5 question types (binary,
 * choice, multi-select, text, confirmation). Urgency levels produce
 * visually distinct card styling via CSS classes.
 *
 * No client-side JavaScript -- response submission is handled by a
 * separate module (question panel / poller).
 *
 * @module dashboard/question-card
 */

import type { Question } from '../console/question-schema.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format timeout seconds as a human-readable duration string.
 *
 * - Seconds < 60: "Xs" (e.g. "45s")
 * - Seconds >= 60: "Xm Ys" (e.g. "1m 30s"), omitting seconds when 0.
 */
function formatTimeout(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
}

// ---------------------------------------------------------------------------
// Type-specific input renderers
// ---------------------------------------------------------------------------

function renderBinaryInputs(question: Question): string {
  return `<div class="question-card-options">
      <button class="question-card-option" data-question-id="${question.question_id}" data-value="yes">Yes</button>
      <button class="question-card-option" data-question-id="${question.question_id}" data-value="no">No</button>
    </div>`;
}

function renderChoiceInputs(question: Question): string {
  const options = question.options ?? [];
  const labels = options
    .map(
      (opt) =>
        `<label><input type="radio" name="${question.question_id}" value="${opt}"> ${opt}</label>`,
    )
    .join('\n      ');
  return `<div class="question-card-options">
      ${labels}
    </div>`;
}

function renderMultiSelectInputs(question: Question): string {
  const options = question.options ?? [];
  const labels = options
    .map(
      (opt) =>
        `<label><input type="checkbox" name="${question.question_id}" value="${opt}"> ${opt}</label>`,
    )
    .join('\n      ');
  return `<div class="question-card-options">
      ${labels}
    </div>`;
}

function renderTextInput(question: Question): string {
  const defaultVal =
    typeof question.default_value === 'string' ? question.default_value : '';
  return `<textarea class="question-card-textarea" data-question-id="${question.question_id}">${defaultVal}</textarea>`;
}

function renderConfirmationInput(question: Question): string {
  return `<button class="question-card-confirm" data-question-id="${question.question_id}">Confirm</button>`;
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

/**
 * Render a single question as an interactive HTML card.
 *
 * The card structure includes a header (urgency badge + optional timeout),
 * a body (question text + type-specific input controls), and an optional
 * actions bar (submit button for choice, multi-select, and text types).
 *
 * @param question - A validated Question object.
 * @returns HTML string for the question card.
 */
export function renderQuestionCard(question: Question): string {
  const urgency = question.urgency ?? 'medium';
  const answeredClass = question.status === 'answered' ? ' question-card-answered' : '';

  // Type-specific input controls
  let inputHtml: string;
  let showSubmit = false;

  switch (question.type) {
    case 'binary':
      inputHtml = renderBinaryInputs(question);
      break;
    case 'choice':
      inputHtml = renderChoiceInputs(question);
      showSubmit = true;
      break;
    case 'multi-select':
      inputHtml = renderMultiSelectInputs(question);
      showSubmit = true;
      break;
    case 'text':
      inputHtml = renderTextInput(question);
      showSubmit = true;
      break;
    case 'confirmation':
      inputHtml = renderConfirmationInput(question);
      break;
    default:
      inputHtml = `<p class="question-card-unknown">Unknown question type</p>`;
      break;
  }

  // Timeout display
  let timeoutHtml = '';
  if (question.timeout) {
    const formatted = formatTimeout(question.timeout.seconds);
    timeoutHtml = `<span class="question-card-timeout">${formatted} -- fallback: ${question.timeout.fallback}</span>`;
  }

  // Actions bar (submit button for types that need it)
  const actionsHtml = showSubmit
    ? `<div class="question-card-actions">
      <button class="question-card-submit" data-question-id="${question.question_id}">Submit</button>
    </div>`
    : '';

  return `<div class="question-card question-card-urgency-${urgency}${answeredClass}" data-question-id="${question.question_id}" data-type="${question.type}">
  <div class="question-card-header">
    <span class="question-card-urgency-badge">${urgency}</span>
    ${timeoutHtml}
  </div>
  <div class="question-card-body">
    <p class="question-card-text">${question.text}</p>
    ${inputHtml}
  </div>
  ${actionsHtml}
</div>`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

/**
 * Return CSS styles for the question card component.
 *
 * Uses CSS custom properties from the dashboard dark theme
 * (defined in the parent page's `:root` block) so the component
 * inherits colors and spacing automatically.
 *
 * @returns CSS string.
 */
export function renderQuestionCardStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Question Card
   ----------------------------------------------------------------------- */

.question-card {
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-left: 4px solid var(--accent, #58a6ff);
  border-radius: var(--radius-md, 6px);
  padding: var(--space-md, 1rem);
  margin-bottom: var(--space-md, 1rem);
}

/* Urgency levels */
.question-card-urgency-low {
  border-left-color: var(--text-dim, #666);
}

.question-card-urgency-medium {
  border-left-color: var(--accent, #58a6ff);
}

.question-card-urgency-high {
  border-left-color: var(--signal-warning, #f0883e);
}

.question-card-urgency-critical {
  border-left-color: var(--red, #f85149);
  background: color-mix(in srgb, #f85149 6%, var(--surface, #1e1e2e));
}

/* Answered state */
.question-card-answered {
  opacity: 0.6;
  pointer-events: none;
}

/* Header: urgency badge + timeout */
.question-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 0.5rem);
  margin-bottom: var(--space-sm, 0.5rem);
}

.question-card-urgency-badge {
  display: inline-block;
  padding: 2px var(--space-xs, 0.25rem);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #a0a0a0);
  background: var(--bg, #0d1117);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-sm, 4px);
}

.question-card-timeout {
  font-size: 0.8rem;
  color: var(--text-dim, #666);
  font-family: var(--font-mono, monospace);
}

/* Body: question text + input controls */
.question-card-text {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text, #e0e0e0);
  margin: 0 0 var(--space-sm, 0.5rem) 0;
}

/* Options container */
.question-card-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm, 0.5rem);
  margin-bottom: var(--space-sm, 0.5rem);
}

/* Binary option buttons */
.question-card-option {
  padding: var(--space-xs, 0.25rem) var(--space-md, 1rem);
  background: var(--accent, #58a6ff);
  color: var(--bg, #0d1117);
  border: none;
  border-radius: var(--radius-sm, 4px);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.question-card-option:hover {
  opacity: 0.85;
}

/* Radio / checkbox labels */
.question-card-options label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: var(--text, #e0e0e0);
  cursor: pointer;
  padding: var(--space-xs, 0.25rem) 0;
}

/* Textarea */
.question-card-textarea {
  width: 100%;
  min-height: 80px;
  padding: var(--space-sm, 0.5rem);
  background: var(--bg, #0d1117);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-sm, 4px);
  color: var(--text, #e0e0e0);
  font-family: var(--font-mono, monospace);
  font-size: 0.9rem;
  resize: vertical;
  box-sizing: border-box;
}

.question-card-textarea:focus {
  outline: none;
  border-color: var(--accent, #58a6ff);
}

/* Actions bar */
.question-card-actions {
  margin-top: var(--space-sm, 0.5rem);
  padding-top: var(--space-sm, 0.5rem);
  border-top: 1px solid var(--border, #333);
}

/* Submit button */
.question-card-submit {
  padding: var(--space-xs, 0.25rem) var(--space-lg, 1.25rem);
  background: var(--accent, #58a6ff);
  color: var(--bg, #0d1117);
  border: none;
  border-radius: var(--radius-sm, 4px);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.question-card-submit:hover {
  opacity: 0.85;
}

/* Confirm button */
.question-card-confirm {
  padding: var(--space-sm, 0.5rem) var(--space-xl, 1.75rem);
  background: var(--accent, #58a6ff);
  color: var(--bg, #0d1117);
  border: none;
  border-radius: var(--radius-sm, 4px);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.question-card-confirm:hover {
  opacity: 0.85;
}
`;
}
