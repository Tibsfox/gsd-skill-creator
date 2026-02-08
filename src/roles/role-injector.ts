/**
 * Constraint formatting and injection into agent body text.
 *
 * Provides:
 * - formatConstraintsSection: format constraints as numbered markdown list
 * - injectConstraints: prepend formatted constraints section to agent body
 *
 * Empty constraints produce no injection (no empty section).
 */

/**
 * Format an array of constraints as a numbered markdown section.
 *
 * @param constraints - Array of constraint strings
 * @returns Formatted markdown section, or empty string if no constraints
 */
export function formatConstraintsSection(constraints: string[]): string {
  if (constraints.length === 0) return '';
  return [
    '## Behavioral Constraints',
    '',
    'You MUST adhere to the following constraints at all times:',
    '',
    ...constraints.map((c, i) => `${i + 1}. ${c}`),
    '',
  ].join('\n');
}

/**
 * Inject constraints into an agent body by prepending a formatted section.
 *
 * @param agentBody - Existing agent body text
 * @param constraints - Array of constraint strings to inject
 * @returns Agent body with constraints prepended, or unchanged if no constraints
 */
export function injectConstraints(agentBody: string, constraints: string[]): string {
  const section = formatConstraintsSection(constraints);
  if (!section) return agentBody;
  return section + '\n' + agentBody;
}
