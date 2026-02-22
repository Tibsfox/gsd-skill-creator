/**
 * Artifact Generator -- transforms raw session data into polished documents.
 *
 * Provides the IArtifactGenerator interface and ArtifactGenerator class.
 * Each method delegates to pure render functions in templates/.
 *
 * Four output formats:
 * - generateTranscript(): Full session transcript as Markdown
 * - generateActionPlan(): Standalone action plan as Markdown
 * - generateJsonExport(): Complete SessionState as formatted JSON
 * - generateClusterMap(): Cluster visualization as Markdown
 *
 * All rendering functions are PURE -- they take SessionState (or subsets)
 * and return strings. No filesystem writes. No side effects. The Scribe
 * agent calls these and handles writing.
 *
 * Only imports from ../shared/types.js and templates/.
 * No imports from den/, vtm/, knowledge/.
 */

import type { SessionState } from '../shared/types.js';
import { renderTranscript } from './templates/transcript.js';
import { renderActionPlan } from './templates/action-plan.js';
import { renderJsonExport } from './templates/json-export.js';

// ============================================================================
// Interface
// ============================================================================

/**
 * Artifact Generator interface.
 *
 * Agents interact with artifact generation exclusively through this interface.
 * Each method takes session state and returns a formatted string.
 */
export interface IArtifactGenerator {
  /** Generate a full session transcript as Markdown. */
  generateTranscript(session: SessionState): string;

  /** Generate a standalone action plan as Markdown. */
  generateActionPlan(session: SessionState): string;

  /** Generate a complete session export as formatted JSON. */
  generateJsonExport(session: SessionState): string;

  /** Generate a cluster map visualization as Markdown. */
  generateClusterMap(session: SessionState): string;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Artifact Generator implementation.
 *
 * Delegates to pure render functions in templates/. Each method is a
 * thin wrapper that extracts the relevant data from SessionState and
 * passes it to the corresponding renderer.
 */
export class ArtifactGenerator implements IArtifactGenerator {
  /**
   * Generate a full session transcript as Markdown.
   *
   * Includes session header, phase sections with technique subsections,
   * cluster map, evaluation table, action plan, and session statistics.
   */
  generateTranscript(session: SessionState): string {
    return renderTranscript(session);
  }

  /**
   * Generate a standalone action plan as Markdown.
   *
   * Groups action items by priority (high, medium, low). Each item traces
   * back to its source idea via source_idea_ids. This prevents the
   * "action plan omits source ideas" UX pitfall.
   */
  generateActionPlan(session: SessionState): string {
    return renderActionPlan(session.action_items, session.ideas);
  }

  /**
   * Generate a complete session export as formatted JSON.
   *
   * Validates SessionState with Zod schema before serializing. This catches
   * any runtime corruption before producing the export.
   */
  generateJsonExport(session: SessionState): string {
    return renderJsonExport(session);
  }

  /**
   * Generate a cluster map visualization as Markdown.
   *
   * Produces a Markdown document showing each cluster with its theme and
   * member ideas. Ideas not assigned to any cluster appear in an
   * "Unassigned Ideas" section.
   *
   * Inline implementation (no separate template) because the cluster map
   * has a simpler structure than the transcript or action plan.
   */
  generateClusterMap(session: SessionState): string {
    const lines: string[] = [];
    const totalIdeas = session.ideas.length;
    const clusterCount = session.clusters.length;

    lines.push('# Cluster Map');
    lines.push(`*${clusterCount} clusters from ${totalIdeas} ideas*`);
    lines.push('');

    // Collect all assigned idea IDs
    const assignedIds = new Set<string>();

    for (const cluster of session.clusters) {
      lines.push(`## ${cluster.label}`);

      if (cluster.theme) {
        lines.push(cluster.theme);
      }

      for (const ideaId of cluster.idea_ids) {
        assignedIds.add(ideaId);
        const idea = session.ideas.find(i => i.id === ideaId);
        if (idea) {
          lines.push(`- ${idea.content} *(source: ${formatTechniqueName(idea.source_technique)})*`);
        }
      }
      lines.push('');
    }

    // Unassigned ideas section
    const unassigned = session.ideas.filter(i => !assignedIds.has(i.id));
    if (unassigned.length > 0) {
      lines.push('## Unassigned Ideas');
      for (const idea of unassigned) {
        lines.push(`- ${idea.content}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

// ============================================================================
// Internal helpers
// ============================================================================

function formatTechniqueName(id: string): string {
  return id
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
