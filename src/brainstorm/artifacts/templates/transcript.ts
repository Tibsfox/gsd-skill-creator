/**
 * Session transcript renderer.
 *
 * Pure function that transforms a complete SessionState into a polished
 * Markdown transcript document. No side effects, no filesystem writes.
 * The Scribe agent calls this and handles writing.
 *
 * Produces Markdown with:
 * - Session header (problem, date, duration, pathway, techniques)
 * - Phase sections with timestamps
 * - Technique subsections with ideas grouped by technique
 * - SCAMPER lens and Six Thinking Hats color labels
 * - Parent idea references for building chains
 * - Cluster map from Organize phase
 * - Evaluation table from Converge phase
 * - Action plan from Act phase
 * - Session statistics footer
 *
 * Only imports from ../../shared/types.js. No imports from den/, vtm/, knowledge/.
 */

import type { Idea, SessionState } from '../../shared/types.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format milliseconds as human-readable duration.
 *
 * Examples: 0ms -> '0m', 60000ms -> '1m', 3660000ms -> '1h 1m'
 */
function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60_000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}

/**
 * Format a Unix timestamp as an ISO date string.
 */
function formatDate(ts: number): string {
  return new Date(ts).toISOString();
}

/**
 * Look up an idea by ID in the ideas array.
 */
function findIdea(ideas: Idea[], id: string): Idea | undefined {
  return ideas.find(i => i.id === id);
}

// ============================================================================
// Transcript renderer
// ============================================================================

/**
 * Render a complete session transcript as Markdown.
 *
 * Pure function: takes SessionState, returns a string. No side effects.
 *
 * Structure:
 * 1. Session header with metadata
 * 2. Phase sections (explore, diverge, organize, converge, act)
 * 3. Within each phase: technique subsections with ideas
 * 4. Cluster map (organize), evaluation table (converge), action plan (act)
 * 5. Session statistics footer
 */
export function renderTranscript(session: SessionState): string {
  const lines: string[] = [];

  // ---- Header ----
  const elapsed = session.timer.session_timer.elapsed_ms;
  const pathway = session.active_pathway ?? 'Free-Form';
  const techniques = session.metadata.techniques_used;

  lines.push(`# Brainstorm Session: ${session.problem_statement}`);
  lines.push(
    `**Date:** ${formatDate(session.metadata.created_at)} | ` +
      `**Duration:** ${formatDuration(elapsed)} | ` +
      `**Pathway:** ${pathway}`,
  );
  lines.push(`**Techniques Used:** ${techniques.join(', ')}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ---- Phase sections ----
  for (const entry of session.metadata.phase_history) {
    lines.push(`## Phase: ${capitalize(entry.phase)}`);
    lines.push(`*Entered: ${formatDate(entry.entered_at)}*`);
    lines.push('');

    // Filter ideas for this phase
    const phaseIdeas = session.ideas.filter(i => i.phase === entry.phase);

    if (entry.phase === 'diverge' || entry.phase === 'explore') {
      // Group ideas by technique
      const byTechnique = groupByTechnique(phaseIdeas);

      for (const [technique, ideas] of byTechnique) {
        const duration = formatDuration(
          ideas.length > 0
            ? (ideas[ideas.length - 1].timestamp - ideas[0].timestamp)
            : 0,
        );
        lines.push(`### Technique: ${formatTechniqueName(technique)} (${duration})`);

        for (const idea of ideas) {
          let line = `- ${idea.content}`;

          // Add SCAMPER lens label
          if (idea.scamper_lens) {
            line = `- ${idea.content} -- *${capitalize(idea.scamper_lens)}*`;
          }

          // Add Six Thinking Hats color label
          if (idea.hat_color) {
            line = `- ${idea.content} -- *${capitalize(idea.hat_color)} Hat*`;
          }

          // Add parent idea reference for building chains
          if (idea.parent_id) {
            const parent = findIdea(session.ideas, idea.parent_id);
            if (parent) {
              line += ` *(built on: ${parent.content})*`;
            }
          }

          lines.push(line);
        }
        lines.push('');
      }
    }

    if (entry.phase === 'organize') {
      lines.push('### Clusters');
      if (session.clusters.length > 0) {
        for (const cluster of session.clusters) {
          const clusterIdeas = session.ideas.filter(i =>
            cluster.idea_ids.includes(i.id),
          );
          lines.push(`**${cluster.label}:** ${clusterIdeas.length} ideas`);
          for (const idea of clusterIdeas) {
            lines.push(`- ${idea.content}`);
          }
          lines.push('');
        }
      } else {
        lines.push('*No clusters formed.*');
        lines.push('');
      }
    }

    if (entry.phase === 'converge') {
      lines.push('### Top Ideas (by composite score)');
      if (session.evaluations.length > 0) {
        lines.push(
          '| Rank | Idea | Feasibility | Impact | Alignment | Risk | Score |',
        );
        lines.push(
          '|------|------|-------------|--------|-----------|------|-------|',
        );

        // Sort evaluations by composite score (feasibility + impact + alignment - risk)
        const scored = session.evaluations
          .map(ev => {
            const idea = findIdea(session.ideas, ev.idea_id);
            const score = ev.feasibility + ev.impact + ev.alignment - ev.risk;
            return { ev, idea, score };
          })
          .sort((a, b) => b.score - a.score);

        for (let rank = 0; rank < scored.length; rank++) {
          const { ev, idea, score } = scored[rank];
          const content = idea ? truncate(idea.content, 60) : 'Unknown idea';
          lines.push(
            `| ${rank + 1} | ${content} | ${ev.feasibility} | ${ev.impact} | ${ev.alignment} | ${ev.risk} | ${score} |`,
          );
        }
        lines.push('');
      } else {
        lines.push('*No evaluations completed.*');
        lines.push('');
      }
    }

    if (entry.phase === 'act') {
      lines.push('### Action Plan');
      if (session.action_items.length > 0) {
        lines.push(
          '| Priority | Action | Source Idea | Owner | Deadline | Status |',
        );
        lines.push(
          '|----------|--------|-------------|-------|----------|--------|',
        );

        for (const item of session.action_items) {
          const sourceIdea =
            item.source_idea_ids.length > 0
              ? findIdea(session.ideas, item.source_idea_ids[0])
              : undefined;
          const sourceText = sourceIdea
            ? truncate(sourceIdea.content, 40)
            : 'No source idea linked';
          lines.push(
            `| ${item.priority} | ${item.description} | "${sourceText}" | ${item.owner ?? 'Unassigned'} | ${item.deadline ?? 'TBD'} | ${item.status} |`,
          );
        }
        lines.push('');
      } else {
        lines.push('*No action items defined.*');
        lines.push('');
      }
    }
  }

  // ---- Session statistics ----
  lines.push('---');
  lines.push('## Session Statistics');
  const questionCount = session.questions.length;
  const clusterCount = session.clusters.length;
  const totalIdeas = session.ideas.length;
  lines.push(
    `- Total ideas: ${totalIdeas} | Questions: ${questionCount} | Clusters: ${clusterCount}`,
  );
  lines.push(
    `- Techniques used: ${techniques.length} | Duration: ${formatDuration(elapsed)}`,
  );
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// Internal helpers
// ============================================================================

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncate(s: string, maxLen: number): string {
  return s.length > maxLen ? s.slice(0, maxLen - 3) + '...' : s;
}

function formatTechniqueName(id: string): string {
  return id
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function groupByTechnique(ideas: Idea[]): Map<string, Idea[]> {
  const map = new Map<string, Idea[]>();
  for (const idea of ideas) {
    const key = idea.source_technique;
    const arr = map.get(key) ?? [];
    arr.push(idea);
    map.set(key, arr);
  }
  return map;
}
