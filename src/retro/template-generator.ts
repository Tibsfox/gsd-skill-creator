/**
 * Self-Improvement Lifecycle -- retrospective template generator.
 *
 * Renders a structured RETROSPECTIVE.md from milestone metrics, changelog
 * analysis, calibration deltas, observations, and human-input sections.
 * The output follows the template structure defined in the mission addendum.
 *
 * Pure function: no side effects, no I/O. Takes data, returns markdown string.
 *
 * @module retro/template-generator
 */

import type {
  RetroTemplateData,
  CalibrationDelta,
  ChangelogEntry,
  ActionItem,
} from './types.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format a numeric delta with +/- prefix.
 */
function formatDelta(actual: number, estimated: number): string {
  const delta = actual - estimated;
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return '0';
}

/**
 * Format a number with locale-aware thousands separators.
 */
function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Render a section of changelog features.
 */
function renderFeatureSection(
  features: ChangelogEntry[],
): string {
  if (features.length === 0) {
    return '_None identified._\n';
  }
  return features
    .map((f) => `- **${f.name}**: ${f.impact}\n  _Action: ${f.action || 'No action specified'}_`)
    .join('\n') + '\n';
}

// ============================================================================
// Main generator
// ============================================================================

/**
 * Generate a RETROSPECTIVE.md string from template data.
 *
 * Produces a complete markdown document with these sections:
 * 1. Header with milestone name, date, version, duration
 * 2. Summary (auto-generated from metrics)
 * 3. Metrics table (estimated vs actual with delta)
 * 4. Claude Code Feature Alignment (changelog analysis)
 * 5. What Went Well / What Didn't Go Well / Lessons Learned
 * 6. Skill-Creator Observations
 * 7. Calibration Updates
 * 8. Action Items for Next Milestone
 * 9. Footer
 */
export function generateRetrospective(data: RetroTemplateData): string {
  const { metrics, changelog, calibration_deltas, observations, action_items } = data;
  const what_went_well = data.what_went_well ?? [];
  const what_didnt_go_well = data.what_didnt_go_well ?? [];
  const lessons_learned = data.lessons_learned ?? [];

  const lines: string[] = [];

  // ---- Header ----
  lines.push(`# ${metrics.milestone_name} -- Retrospective`);
  lines.push('');
  lines.push(`**Version:** ${metrics.milestone_version}`);
  lines.push(`**Completed:** ${metrics.completion_date}`);
  lines.push(`**Duration:** ${fmt(metrics.wall_time_minutes)} min (estimated: ${fmt(metrics.estimated_wall_time_minutes)} min)`);
  const wallRatio = metrics.estimated_wall_time_minutes > 0
    ? (metrics.wall_time_minutes / metrics.estimated_wall_time_minutes).toFixed(2)
    : 'N/A';
  lines.push(`**Estimated/Actual Ratio:** ${wallRatio}x`);
  lines.push('');

  // ---- Summary ----
  lines.push('## Summary');
  lines.push('');
  lines.push(
    `Built ${metrics.milestone_name} with ${metrics.plans} plans across ${metrics.phases} phases, ` +
    `producing ${fmt(metrics.source_loc)} LOC and ${fmt(metrics.tests_written)} tests.`,
  );
  lines.push('');

  // ---- Metrics table ----
  lines.push('## Metrics');
  lines.push('');
  lines.push('| Metric | Estimated | Actual | Delta |');
  lines.push('|--------|-----------|--------|-------|');

  const metricRows: Array<{ label: string; estimated: number; actual: number }> = [
    { label: 'Wall Time (min)', estimated: metrics.estimated_wall_time_minutes, actual: metrics.wall_time_minutes },
    { label: 'Total Tokens', estimated: 0, actual: metrics.total_tokens },
    { label: 'Opus Tokens', estimated: 0, actual: metrics.opus_tokens },
    { label: 'Sonnet Tokens', estimated: 0, actual: metrics.sonnet_tokens },
    { label: 'Haiku Tokens', estimated: 0, actual: metrics.haiku_tokens },
    { label: 'Context Windows', estimated: 0, actual: metrics.context_windows },
    { label: 'Sessions', estimated: 0, actual: metrics.sessions },
    { label: 'Phases', estimated: 0, actual: metrics.phases },
    { label: 'Plans', estimated: 0, actual: metrics.plans },
    { label: 'Commits', estimated: 0, actual: metrics.commits },
    { label: 'Tests Written', estimated: 0, actual: metrics.tests_written },
    { label: 'Tests Passing', estimated: 0, actual: metrics.tests_passing },
    { label: 'Requirements Total', estimated: 0, actual: metrics.requirements_total },
    { label: 'Requirements Met', estimated: 0, actual: metrics.requirements_met },
    { label: 'Source LOC', estimated: 0, actual: metrics.source_loc },
  ];

  for (const row of metricRows) {
    const estStr = row.estimated > 0 ? fmt(row.estimated) : '--';
    const actStr = fmt(row.actual);
    const deltaStr = row.estimated > 0 ? formatDelta(row.actual, row.estimated) : '--';
    lines.push(`| ${row.label} | ${estStr} | ${actStr} | ${deltaStr} |`);
  }
  lines.push('');

  // ---- Claude Code Feature Alignment ----
  lines.push('## Changes -- Claude Code Feature Alignment');
  lines.push('');

  const leveraged: ChangelogEntry[] = [];
  const coming: ChangelogEntry[] = [];
  const missed: ChangelogEntry[] = [];

  if (changelog && changelog.features) {
    for (const f of changelog.features) {
      if (f.classification === 'LEVERAGE_NOW') leveraged.push(f);
      else if (f.classification === 'PLAN_FOR') coming.push(f);
      else missed.push(f);
    }
  }

  lines.push('### Features Leveraged');
  lines.push('');
  lines.push(renderFeatureSection(leveraged));

  lines.push('### Features Coming');
  lines.push('');
  lines.push(renderFeatureSection(coming));

  lines.push('### Features Missed');
  lines.push('');
  lines.push(renderFeatureSection(missed));

  // ---- What Went Well ----
  lines.push('## What Went Well');
  lines.push('');
  if (what_went_well.length > 0) {
    for (const item of what_went_well) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push('_[Add your observations]_');
  }
  lines.push('');

  // ---- What Didn't Go Well ----
  lines.push("## What Didn't Go Well");
  lines.push('');
  if (what_didnt_go_well.length > 0) {
    for (const item of what_didnt_go_well) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push('_[Add your observations]_');
  }
  lines.push('');

  // ---- Lessons Learned ----
  lines.push('## Lessons Learned');
  lines.push('');
  if (lessons_learned.length > 0) {
    for (const item of lessons_learned) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push('_[Add your observations]_');
  }
  lines.push('');

  // ---- Skill-Creator Observations ----
  lines.push('## Skill-Creator Observations');
  lines.push('');

  lines.push('### New Patterns');
  lines.push('');
  if (observations.new_patterns.length > 0) {
    for (const p of observations.new_patterns) {
      lines.push(`- ${p}`);
    }
  } else {
    lines.push('_None detected._');
  }
  lines.push('');

  lines.push('### Skill Suggestions');
  lines.push('');
  if (observations.skill_suggestions.length > 0) {
    for (const s of observations.skill_suggestions) {
      lines.push(`- ${s}`);
    }
  } else {
    lines.push('_None pending._');
  }
  lines.push('');

  lines.push('### Promotion Candidates');
  lines.push('');
  if (observations.promotion_candidates.length > 0) {
    for (const c of observations.promotion_candidates) {
      lines.push(`- ${c}`);
    }
  } else {
    lines.push('_None identified._');
  }
  lines.push('');

  // ---- Calibration Updates ----
  lines.push('## Calibration Updates');
  lines.push('');
  if (calibration_deltas.length > 0) {
    for (const delta of calibration_deltas) {
      lines.push(`- ${renderCalibrationDelta(delta)}`);
    }
  } else {
    lines.push('_No calibration adjustments needed._');
  }
  lines.push('');

  // ---- Action Items ----
  lines.push('## Action Items for Next Milestone');
  lines.push('');
  if (action_items.length > 0) {
    for (const item of action_items) {
      lines.push(`- [ ] ${item.description} (${item.source}, ${item.priority})`);
    }
  } else {
    lines.push('_No action items generated._');
  }
  lines.push('');

  // ---- Footer ----
  lines.push('---');
  lines.push('*This retrospective was generated as part of the GSD milestone lifecycle.*');
  lines.push('');

  return lines.join('\n');
}

/**
 * Render a calibration delta as a human-readable adjustment recommendation.
 */
function renderCalibrationDelta(delta: CalibrationDelta): string {
  const ratioStr = delta.ratio === Infinity ? 'Infinity' : delta.ratio.toFixed(3);

  switch (delta.direction) {
    case 'over':
      return `Reduce ${delta.metric_name} estimate (was ${fmt(delta.estimated)}, actual ${fmt(delta.actual)}, ${ratioStr}x)`;
    case 'under':
      return `Increase ${delta.metric_name} estimate (was ${fmt(delta.estimated)}, actual ${fmt(delta.actual)}, ${ratioStr}x)`;
    case 'accurate':
      return `Estimate accurate for ${delta.metric_name} (${ratioStr}x)`;
  }
}
