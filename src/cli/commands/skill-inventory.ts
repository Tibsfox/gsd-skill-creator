/**
 * skill-inventory — reports skill lifecycle state.
 *
 * Walks .claude/skills/* / SKILL.md, groups by status, flags stale skills
 * (updated >90 days ago), and lists deprecated skills with migration paths.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { findSkillFiles, parseFrontmatter } from '../../skill/version-backfill.js';
import type { SkillStatus } from '../../skill/frontmatter-types.js';

const DEFAULT_STALE_DAYS = 90;

export interface SkillInventoryEntry {
  name: string;
  path: string;
  status: SkillStatus;
  updated: string | null;
  ageDays: number | null;
  deprecatedBy: string | null;
}

export interface SkillInventoryReport {
  total: number;
  byStatus: Record<SkillStatus, number>;
  stale: SkillInventoryEntry[];
  deprecated: SkillInventoryEntry[];
  entries: SkillInventoryEntry[];
}

function daysBetween(fromISO: string, toDate: Date): number | null {
  const from = Date.parse(`${fromISO}T00:00:00Z`);
  if (Number.isNaN(from)) return null;
  const ms = toDate.getTime() - from;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export interface InventoryOptions {
  skillsRoot: string;
  staleDays?: number;
  now?: () => Date;
}

export function buildSkillInventory(opts: InventoryOptions): SkillInventoryReport {
  const files = findSkillFiles(opts.skillsRoot);
  const now = (opts.now ?? (() => new Date()))();
  const staleDays = opts.staleDays ?? DEFAULT_STALE_DAYS;

  const entries: SkillInventoryEntry[] = [];
  const byStatus: Record<SkillStatus, number> = {
    active: 0,
    deprecated: 0,
    retired: 0,
    draft: 0,
  };

  for (const file of files) {
    const parsed = parseFrontmatter(readFileSync(file, 'utf8'));
    if (!parsed.hasFrontmatter) continue;
    const fm = parsed.frontmatter as Record<string, unknown>;
    const status = ((fm.status as SkillStatus | undefined) ?? 'active') as SkillStatus;
    const updated = (fm.updated as string | undefined) ?? null;
    const name = (fm.name as string | undefined) ?? file;
    const ageDays = updated ? daysBetween(updated, now) : null;
    const entry: SkillInventoryEntry = {
      name,
      path: file,
      status,
      updated,
      ageDays,
      deprecatedBy: (fm.deprecated_by as string | undefined) ?? null,
    };
    entries.push(entry);
    byStatus[status] = (byStatus[status] ?? 0) + 1;
  }

  const stale = entries.filter(
    (e) => e.status === 'active' && e.ageDays !== null && e.ageDays > staleDays
  );
  const deprecated = entries.filter((e) => e.status === 'deprecated');

  return {
    total: entries.length,
    byStatus,
    stale,
    deprecated,
    entries,
  };
}

export function formatSkillInventory(report: SkillInventoryReport): string {
  const lines: string[] = [];
  lines.push(`Skill inventory (${report.total} total):`);
  lines.push(`  active:     ${report.byStatus.active ?? 0}`);
  lines.push(`  deprecated: ${report.byStatus.deprecated ?? 0}`);
  lines.push(`  retired:    ${report.byStatus.retired ?? 0}`);
  lines.push(`  draft:      ${report.byStatus.draft ?? 0}`);
  lines.push('');
  lines.push(`Stale skills (not updated >90 days):`);
  if (report.stale.length === 0) {
    lines.push('  <none>');
  } else {
    for (const e of report.stale) {
      lines.push(`  ${e.name}  (updated ${e.updated}, ${e.ageDays} days ago)`);
    }
  }
  lines.push('');
  lines.push(`Deprecated skills with migration path:`);
  if (report.deprecated.length === 0) {
    lines.push('  <none>');
  } else {
    for (const e of report.deprecated) {
      const arrow = e.deprecatedBy ? ` → ${e.deprecatedBy}` : '';
      lines.push(`  ${e.name}${arrow}`);
    }
  }
  return lines.join('\n');
}

export async function skillInventoryCommand(
  options: { skillsDir?: string } = {}
): Promise<number> {
  const skillsRoot = options.skillsDir ?? join(process.cwd(), '.claude', 'skills');
  const report = buildSkillInventory({ skillsRoot });
  console.log(formatSkillInventory(report));
  return 0;
}
