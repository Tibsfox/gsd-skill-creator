// === Learning Report Generator ===
//
// Produces a comprehensive markdown summary of a sc:learn session with full
// provenance chains, summary counts, generated artifacts, and pipeline errors.
//
// The report is the final output of the sc:learn pipeline, consumed by the CLI
// (Plan 03) and presented to the user. Requirement: LEARN-12.

import type { MergeAction, ProvenanceEntry, ConflictResolution } from './merge-engine.js';

// === Exported Types ===

export interface LearningReportInput {
  sessionId: string;
  sourcePath: string;
  startedAt: string;
  completedAt: string;
  // Pipeline results
  provenanceChain: ProvenanceEntry[];
  mergeActions: Array<{ action: MergeAction; count: number }>;
  // Generated artifacts
  skillsGenerated: Array<{ domainName: string; primitiveCount: number; fileName: string }>;
  agentsGenerated: Array<{ agentName: string; fileName: string }>;
  teamsGenerated: Array<{ teamName: string; fileName: string; agentCount: number }>;
  // Errors
  errors: string[];
  // Options used
  options: { domain?: string; depth?: string; dryRun?: boolean; scope?: string[] };
}

export interface LearningReport {
  markdown: string;
  sessionId: string;
  primitivesAdded: number;
  primitivesUpdated: number;
  primitivesSkipped: number;
  conflictsPresented: number;
  skillCount: number;
  agentCount: number;
  teamCount: number;
}

// === Count Helpers ===

function countByAction(chain: ProvenanceEntry[]): {
  added: number;
  updated: number;
  skipped: number;
  conflicts: number;
} {
  let added = 0;
  let updated = 0;
  let skipped = 0;
  let conflicts = 0;

  for (const entry of chain) {
    const action = entry.action;
    if (action.includes('add')) {
      added++;
    } else if (action.includes('update') || action.includes('generalization')) {
      updated++;
    } else if (action === 'skip') {
      skipped++;
    } else if (action.includes('conflict')) {
      conflicts++;
    }
  }

  return { added, updated, skipped, conflicts };
}

// === Duration Formatting ===

function formatDuration(startedAt: string, completedAt: string): string {
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;

  if (Number.isNaN(diffMs) || diffMs < 0) {
    return 'unknown';
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSec = seconds % 60;
  return `${minutes}m ${remainingSec}s`;
}

// === Section Builders ===

function buildHeader(input: LearningReportInput): string {
  const duration = formatDuration(input.startedAt, input.completedAt);
  return [
    `# sc:learn Report — ${input.sessionId}`,
    '',
    `- **Source:** ${input.sourcePath}`,
    `- **Started:** ${input.startedAt}`,
    `- **Completed:** ${input.completedAt}`,
    `- **Duration:** ${duration}`,
    '',
  ].join('\n');
}

function buildSummary(counts: ReturnType<typeof countByAction>, input: LearningReportInput): string {
  const lines: string[] = [
    '## Summary',
    '',
    '| Metric | Count |',
    '|--------|-------|',
    `| Primitives added | ${counts.added} |`,
    `| Primitives updated | ${counts.updated} |`,
    `| Primitives skipped | ${counts.skipped} |`,
    `| Conflicts | ${counts.conflicts} |`,
    `| Skills generated | ${input.skillsGenerated.length} |`,
    `| Agents generated | ${input.agentsGenerated.length} |`,
    `| Teams generated | ${input.teamsGenerated.length} |`,
    '',
  ];
  return lines.join('\n');
}

function buildPrimitivesSection(chain: ProvenanceEntry[]): string {
  if (chain.length === 0) {
    return ['## Primitives', '', 'No primitives processed.', ''].join('\n');
  }

  // Group by action category
  const added: ProvenanceEntry[] = [];
  const updated: ProvenanceEntry[] = [];
  const skipped: ProvenanceEntry[] = [];
  const conflicts: ProvenanceEntry[] = [];

  for (const entry of chain) {
    const action = entry.action;
    if (action.includes('add')) {
      added.push(entry);
    } else if (action.includes('update') || action.includes('generalization')) {
      updated.push(entry);
    } else if (action === 'skip') {
      skipped.push(entry);
    } else if (action.includes('conflict')) {
      conflicts.push(entry);
    }
  }

  const sections: string[] = ['## Primitives', ''];

  if (added.length > 0) {
    sections.push('### Added', '');
    for (const entry of added) {
      sections.push(`- **${entry.candidateId}** — ${entry.action}: ${entry.rationale}`);
    }
    sections.push('');
  }

  if (updated.length > 0) {
    sections.push('### Updated', '');
    for (const entry of updated) {
      sections.push(`- **${entry.candidateId}** (existing: ${entry.existingId}) — ${entry.action}: ${entry.rationale}`);
    }
    sections.push('');
  }

  if (skipped.length > 0) {
    sections.push('### Skipped', '');
    for (const entry of skipped) {
      sections.push(`- **${entry.candidateId}** (existing: ${entry.existingId}) — ${entry.rationale}`);
    }
    sections.push('');
  }

  if (conflicts.length > 0) {
    sections.push('### Conflicts', '');
    for (const entry of conflicts) {
      const decision = entry.userDecision ? ` [Decision: ${entry.userDecision}]` : '';
      sections.push(`- **${entry.candidateId}** (existing: ${entry.existingId}) — ${entry.action}: ${entry.rationale}${decision}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

function buildProvenanceSection(chain: ProvenanceEntry[]): string {
  // Only include provenance for added and updated entries (meaningful changes)
  const relevant = chain.filter(e =>
    e.action.includes('add') ||
    e.action.includes('update') ||
    e.action.includes('generalization') ||
    e.action.includes('conflict'),
  );

  if (relevant.length === 0) {
    return ['## Provenance Chains', '', 'No provenance entries for modifications.', ''].join('\n');
  }

  // Group by action type
  const groups = new Map<string, ProvenanceEntry[]>();
  for (const entry of relevant) {
    const key = entry.action;
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  const sections: string[] = ['## Provenance Chains', ''];

  for (const [action, entries] of groups) {
    sections.push(`### ${action}`, '');
    for (const entry of entries) {
      sections.push(`**${entry.candidateId}** → ${entry.action}`);
      sections.push(`- Rationale: ${entry.rationale}`);
      if (entry.existingId) {
        sections.push(`- Existing: ${entry.existingId}`);
      }
      if (entry.originalFormalStatement) {
        sections.push(`- Original: \`${entry.originalFormalStatement}\``);
      }
      if (entry.newFormalStatement) {
        sections.push(`- New: \`${entry.newFormalStatement}\``);
      }
      if (entry.userDecision) {
        sections.push(`- User decision: ${entry.userDecision}`);
      }
      sections.push('');
    }
  }

  return sections.join('\n');
}

function buildArtifactsSection(input: LearningReportInput): string {
  const hasArtifacts =
    input.skillsGenerated.length > 0 ||
    input.agentsGenerated.length > 0 ||
    input.teamsGenerated.length > 0;

  if (!hasArtifacts) {
    return '';
  }

  const sections: string[] = ['## Generated Artifacts', ''];

  if (input.skillsGenerated.length > 0) {
    sections.push('### Skills', '');
    sections.push('| Domain | Primitives | File |');
    sections.push('|--------|-----------|------|');
    for (const skill of input.skillsGenerated) {
      sections.push(`| ${skill.domainName} | ${skill.primitiveCount} | ${skill.fileName} |`);
    }
    sections.push('');
  }

  if (input.agentsGenerated.length > 0) {
    sections.push('### Agents', '');
    sections.push('| Agent | File |');
    sections.push('|-------|------|');
    for (const agent of input.agentsGenerated) {
      sections.push(`| ${agent.agentName} | ${agent.fileName} |`);
    }
    sections.push('');
  }

  if (input.teamsGenerated.length > 0) {
    sections.push('### Teams', '');
    sections.push('| Team | Agents | File |');
    sections.push('|------|--------|------|');
    for (const team of input.teamsGenerated) {
      sections.push(`| ${team.teamName} | ${team.agentCount} | ${team.fileName} |`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

function buildErrorsSection(errors: string[]): string {
  if (errors.length === 0) {
    return '';
  }

  const sections: string[] = ['## Errors', ''];
  for (const error of errors) {
    sections.push(`- ${error}`);
  }
  sections.push('');
  return sections.join('\n');
}

function buildOptionsSection(options: LearningReportInput['options']): string {
  const sections: string[] = ['## Options', ''];

  const entries = Object.entries(options).filter(([, v]) => v !== undefined);

  if (entries.length === 0) {
    sections.push('No options specified.', '');
    return sections.join('\n');
  }

  sections.push('| Option | Value |');
  sections.push('|--------|-------|');
  for (const [key, value] of entries) {
    const display = Array.isArray(value) ? value.join(', ') : String(value);
    sections.push(`| ${key} | ${display} |`);
  }
  sections.push('');
  return sections.join('\n');
}

// === Main Export ===

export function generateLearningReport(input: LearningReportInput): LearningReport {
  const counts = countByAction(input.provenanceChain);

  const parts: string[] = [
    buildHeader(input),
    buildSummary(counts, input),
    buildPrimitivesSection(input.provenanceChain),
    buildProvenanceSection(input.provenanceChain),
    buildArtifactsSection(input),
    buildErrorsSection(input.errors),
    buildOptionsSection(input.options),
  ].filter(part => part.length > 0);

  const markdown = parts.join('\n');

  return {
    markdown,
    sessionId: input.sessionId,
    primitivesAdded: counts.added,
    primitivesUpdated: counts.updated,
    primitivesSkipped: counts.skipped,
    conflictsPresented: counts.conflicts,
    skillCount: input.skillsGenerated.length,
    agentCount: input.agentsGenerated.length,
    teamCount: input.teamsGenerated.length,
  };
}
