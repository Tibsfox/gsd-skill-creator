/**
 * HITL (Human-In-The-Loop) gates for the contribution workflow.
 *
 * Gate 1: dev->main merge — presents diff summary, file groups, commit history.
 * Gate 2: main->upstream PR — presents PR title/description for editing.
 *
 * Both gates BLOCK without human approval. This is the safety-critical
 * component that prevents accidental upstream contact.
 *
 * Uses injectable PromptFn pattern (same as src/learn/hitl-gate.ts) for
 * full testability without real I/O.
 */

import type { DiffSummary, FileDiff, GateDecision } from '../types.js';
import { preFlightMerge, preFlightPR } from './pre-flight.js';
import type { CommitEntry, PreFlightCheck } from './pre-flight.js';

// === Types ===

export interface FileEntry {
  path: string;
  icon: string;
  delta: string;
}

export interface FileGroupDisplay {
  name: string;
  files: FileEntry[];
}

export interface GatePresentation {
  title: string;
  summary: string;
  stats: string;
  fileGroups: FileGroupDisplay[];
  commits: CommitEntry[];
  warnings: string[];
  blockers?: string[];
}

export interface PRGateDecision extends GateDecision {
  prTitle: string;
  prDescription: string;
}

export type GatePromptFn = (presentation: GatePresentation) => Promise<GateDecision>;
export type PRPromptFn = (presentation: GatePresentation, title: string, description: string) => Promise<PRGateDecision>;

// === File Grouping ===

const FILE_GROUP_ORDER = [
  'Source files',
  'Tests',
  'Configuration',
  'Documentation',
  'Scripts',
  'Other',
] as const;

function classifyFile(filePath: string): string {
  const p = filePath.toLowerCase();

  // Tests first (before source, since test files can be in src/)
  if (
    p.includes('test/') ||
    p.includes('tests/') ||
    p.includes('__tests__/') ||
    p.match(/\.test\.\w+$/) ||
    p.match(/\.spec\.\w+$/)
  ) {
    return 'Tests';
  }

  // Source files
  if (p.startsWith('src/') || p.startsWith('lib/') || p.startsWith('packages/')) {
    return 'Source files';
  }

  // Configuration
  if (
    p === 'package.json' ||
    p === 'tsconfig.json' ||
    p.match(/\.config\.\w+$/) ||
    p.match(/^\.eslintrc/) ||
    p.match(/^\.prettierrc/) ||
    p === 'cargo.toml' ||
    p.match(/^vitest\./)
  ) {
    return 'Configuration';
  }

  // Documentation
  if (
    p.match(/^readme/i) ||
    p.startsWith('docs/') ||
    (p.endsWith('.md') && !p.startsWith('src/'))
  ) {
    return 'Documentation';
  }

  // Scripts
  if (p.startsWith('scripts/') || p.startsWith('bin/') || p.endsWith('.sh')) {
    return 'Scripts';
  }

  return 'Other';
}

function statusIcon(status: FileDiff['status']): string {
  switch (status) {
    case 'added': return '+';
    case 'modified': return '*';
    case 'deleted': return '-';
    case 'renamed': return '>';
    default: return '?';
  }
}

export function groupFiles(files: FileDiff[]): FileGroupDisplay[] {
  const groups = new Map<string, FileEntry[]>();

  for (const file of files) {
    const category = classifyFile(file.path);
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push({
      path: file.path,
      icon: statusIcon(file.status),
      delta: `+${file.insertions} / -${file.deletions}`,
    });
  }

  // Return in display order, omitting empty groups
  const result: FileGroupDisplay[] = [];
  for (const name of FILE_GROUP_ORDER) {
    const entries = groups.get(name);
    if (entries && entries.length > 0) {
      result.push({ name, files: entries });
    }
  }

  return result;
}

// === PR Description Generation ===

export function generatePRDescription(commits: CommitEntry[], diff: DiffSummary): string {
  const lines: string[] = [];

  // Cluster commits by type prefix
  const clusters = new Map<string, CommitEntry[]>();
  for (const commit of commits) {
    const match = commit.subject.match(/^(\w+)(?:\(.+?\))?:\s*/);
    const type = match ? match[1] : 'other';
    if (!clusters.has(type)) {
      clusters.set(type, []);
    }
    clusters.get(type)!.push(commit);
  }

  // === Summary ===
  lines.push('## Summary');
  lines.push('');

  if (commits.length === 1) {
    // Simple single-commit PR
    lines.push(commits[0].subject.replace(/^\w+(?:\(.+?\))?:\s*/, '').replace(/^./, c => c.toUpperCase()) + '.');
  } else {
    // Multi-commit: build a coherent summary
    const featCommits = clusters.get('feat') || [];
    const fixCommits = clusters.get('fix') || [];
    const parts: string[] = [];

    if (featCommits.length > 0) {
      const features = featCommits.map(c => c.subject.replace(/^feat(?:\(.+?\))?:\s*/, ''));
      parts.push(`Adds ${features.join(', ')}`);
    }
    if (fixCommits.length > 0) {
      const fixes = fixCommits.map(c => c.subject.replace(/^fix(?:\(.+?\))?:\s*/, ''));
      parts.push(`fixes ${fixes.join(', ')}`);
    }

    const otherTypes = [...clusters.keys()].filter(t => t !== 'feat' && t !== 'fix');
    for (const type of otherTypes) {
      const items = clusters.get(type)!;
      parts.push(`includes ${items.length} ${type} change(s)`);
    }

    if (parts.length > 0) {
      lines.push(parts.join('; ') + '.');
    } else {
      lines.push(`${commits.length} changes across ${diff.filesChanged} files.`);
    }

    if (commits.length >= 20) {
      lines.push('');
      lines.push(`This is a large change: ${diff.filesChanged} files changed with +${diff.insertions} / -${diff.deletions} lines.`);
    }
  }

  // === Changes ===
  lines.push('');
  lines.push('## Changes');
  lines.push('');

  const typeLabels: Record<string, string> = {
    feat: 'Features',
    fix: 'Bug Fixes',
    test: 'Testing',
    docs: 'Documentation',
    refactor: 'Refactoring',
    chore: 'Chores',
    perf: 'Performance',
    style: 'Style',
    build: 'Build',
    ci: 'CI',
  };

  for (const [type, entries] of clusters) {
    const label = typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
    lines.push(`**${label}:**`);
    for (const entry of entries) {
      const desc = entry.subject.replace(/^\w+(?:\(.+?\))?:\s*/, '');
      lines.push(`- ${desc}`);
    }
    lines.push('');
  }

  // File stats
  lines.push(`${diff.filesChanged} files changed (+${diff.insertions}, -${diff.deletions}).`);

  // === Testing ===
  lines.push('');
  lines.push('## Testing');
  lines.push('');

  const testCommits = clusters.get('test') || [];
  if (testCommits.length > 0) {
    lines.push('Test changes included:');
    for (const tc of testCommits) {
      const desc = tc.subject.replace(/^test(?:\(.+?\))?:\s*/, '');
      lines.push(`- ${desc}`);
    }
  } else {
    lines.push('No dedicated test commits in this change set.');
  }

  return lines.join('\n');
}

// === Gate 1: Merge dev -> main ===

export async function presentMergeGate(
  repoPath: string,
  promptFn: GatePromptFn,
): Promise<GateDecision> {
  const preflight = await preFlightMerge(repoPath);

  const blockingFailures = preflight.checks.filter(
    (c: PreFlightCheck) => c.level === 'BLOCKING' && !c.passed,
  );
  const warnings = preflight.checks.filter(
    (c: PreFlightCheck) => c.level === 'WARNING' && !c.passed,
  );

  // Build summary theme from commits
  const commitTheme = preflight.commitLog.length > 0
    ? preflight.commitLog.map(c => c.subject).slice(0, 3).join(', ')
    : 'changes';

  const fileGroups = groupFiles(preflight.summary.files);

  const presentation: GatePresentation = {
    title: 'GATE 1: Merge dev -> main',
    summary: `${preflight.commitLog.length} commit(s) adding ${commitTheme}`,
    stats: `${preflight.summary.filesChanged} files changed (+${preflight.summary.insertions}, -${preflight.summary.deletions})`,
    fileGroups,
    commits: preflight.commitLog,
    warnings: warnings.map(w => w.message),
    blockers: blockingFailures.length > 0
      ? blockingFailures.map(b => b.message)
      : undefined,
  };

  return promptFn(presentation);
}

// === Gate 2: PR to upstream ===

export async function presentPRGate(
  repoPath: string,
  promptFn: PRPromptFn,
): Promise<PRGateDecision> {
  const preflight = await preFlightPR(repoPath);

  const blockingFailures = preflight.checks.filter(
    (c: PreFlightCheck) => c.level === 'BLOCKING' && !c.passed,
  );
  const warnings = preflight.checks.filter(
    (c: PreFlightCheck) => c.level === 'WARNING' && !c.passed,
  );

  // Generate PR title from commits
  const featOrFix = preflight.commitLog.find(c =>
    c.subject.startsWith('feat:') || c.subject.startsWith('fix:'),
  );
  const prTitle = featOrFix
    ? featOrFix.subject
    : preflight.commitLog.length === 1
      ? preflight.commitLog[0].subject
      : 'Multiple changes';

  // Generate PR description as coherent prose
  const prDescription = generatePRDescription(preflight.commitLog, preflight.summary);

  const fileGroups = groupFiles(preflight.summary.files);

  const presentation: GatePresentation = {
    title: 'GATE 2: Push to upstream (PR)',
    summary: `${preflight.commitLog.length} commit(s) for PR`,
    stats: `${preflight.summary.filesChanged} files changed (+${preflight.summary.insertions}, -${preflight.summary.deletions})`,
    fileGroups,
    commits: preflight.commitLog,
    warnings: warnings.map(w => w.message),
    blockers: blockingFailures.length > 0
      ? blockingFailures.map(b => b.message)
      : undefined,
  };

  return promptFn(presentation, prTitle, prDescription);
}
