/**
 * Action plan renderer.
 *
 * Pure function that transforms ActionItem[] and Idea[] into a standalone
 * Markdown action plan document. Every action item MUST include the original
 * source idea text (traced via source_idea_ids). This prevents the "action
 * plan omits source ideas" UX pitfall from PITFALLS.md.
 *
 * No side effects, no filesystem writes. The Scribe agent calls this
 * and handles writing.
 *
 * Only imports from ../../shared/types.js. No imports from den/, vtm/, knowledge/.
 */

import type { ActionItem, Idea } from '../../shared/types.js';

// ============================================================================
// Action plan renderer
// ============================================================================

/**
 * Render a standalone action plan as Markdown.
 *
 * Pure function: takes ActionItem[] and Idea[], returns a string.
 *
 * Groups action items by priority (high, medium, low). Each item includes
 * the original source idea text looked up from the ideas array by
 * source_idea_ids[0]. If no source_idea_ids, uses "No source idea linked".
 *
 * Critical: source_idea_ids MUST be traced back to actual idea content.
 * This is a key UX requirement -- users need to trace actions to their
 * brainstormed origins.
 */
export function renderActionPlan(items: ActionItem[], ideas: Idea[]): string {
  const lines: string[] = [];
  const now = new Date().toISOString().slice(0, 10);

  lines.push('# Action Plan');
  lines.push(`*Generated: ${now}*`);
  lines.push('');

  // Group items by priority
  const high = items.filter(i => i.priority === 'high');
  const medium = items.filter(i => i.priority === 'medium');
  const low = items.filter(i => i.priority === 'low');

  if (high.length > 0) {
    lines.push('## High Priority');
    lines.push(renderPriorityTable(high, ideas));
    lines.push('');
  }

  if (medium.length > 0) {
    lines.push('## Medium Priority');
    lines.push(renderPriorityTable(medium, ideas));
    lines.push('');
  }

  if (low.length > 0) {
    lines.push('## Low Priority');
    lines.push(renderPriorityTable(low, ideas));
    lines.push('');
  }

  if (items.length === 0) {
    lines.push('*No action items defined.*');
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Render a priority group as a Markdown table.
 *
 * Each row traces the action item back to its source idea. If source_idea_ids
 * is empty or the idea is not found, uses "No source idea linked".
 */
function renderPriorityTable(items: ActionItem[], ideas: Idea[]): string {
  const rows: string[] = [];
  rows.push('| # | Action | Source Idea | Owner | Deadline | Status |');
  rows.push('|---|--------|-------------|-------|----------|--------|');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const sourceIdeaText = lookupSourceIdea(item, ideas);
    const owner = item.owner ?? 'Unassigned';
    const deadline = item.deadline ?? 'TBD';

    rows.push(
      `| ${i + 1} | ${item.description} | "${sourceIdeaText}" | ${owner} | ${deadline} | ${item.status} |`,
    );
  }

  return rows.join('\n');
}

/**
 * Look up the source idea text for an action item.
 *
 * Uses source_idea_ids[0] to find the original idea. Returns "No source
 * idea linked" if no IDs are present or the idea is not found.
 *
 * This tracing prevents the "action plan omits source ideas" UX pitfall.
 */
function lookupSourceIdea(item: ActionItem, ideas: Idea[]): string {
  if (item.source_idea_ids.length === 0) {
    return 'No source idea linked';
  }

  const sourceId = item.source_idea_ids[0];
  const idea = ideas.find(i => i.id === sourceId);

  if (!idea) {
    return 'No source idea linked';
  }

  // Truncate long ideas for table readability
  const maxLen = 60;
  return idea.content.length > maxLen
    ? idea.content.slice(0, maxLen - 3) + '...'
    : idea.content;
}
