/**
 * Lifecycle loader — wraps skill loading with status-based behavior.
 *
 * - active / undefined → load normally
 * - deprecated         → load + emit stderr warning
 * - retired            → do not load (returns null)
 * - draft              → do not load unless explicitly enabled
 *
 * Warnings go to stderr (not stdout) so they don't pollute additionalContext.
 */

import { readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';

import { parseFrontmatter } from './version-backfill.js';
import type { SkillStatus } from './frontmatter-types.js';

export interface LoadedSkill {
  name: string;
  status: SkillStatus;
  warnings: string[];
  body: string;
  frontmatter: Record<string, unknown>;
}

export interface LoadOptions {
  allowDraft?: boolean;
  onWarning?: (message: string) => void;
}

export function loadSkillWithLifecycle(
  skillPath: string,
  opts: LoadOptions = {}
): LoadedSkill | null {
  const content = readFileSync(skillPath, 'utf8');
  const parsed = parseFrontmatter(content);
  if (!parsed.hasFrontmatter) return null;

  const fm = parsed.frontmatter as Record<string, unknown>;
  const status = ((fm.status as SkillStatus | undefined) ?? 'active') as SkillStatus;

  if (status === 'retired') return null;
  if (status === 'draft' && !opts.allowDraft) return null;

  const name = (fm.name as string | undefined) ?? basename(dirname(skillPath));
  const warnings: string[] = [];

  if (status === 'deprecated') {
    const replacement = fm.deprecated_by ? ` → ${fm.deprecated_by}` : '';
    const msg = `DEPRECATED skill "${name}" loaded${replacement}`;
    warnings.push(msg);
    if (opts.onWarning) {
      opts.onWarning(msg);
    } else {
      process.stderr.write(`${msg}\n`);
    }
  }

  return {
    name,
    status,
    warnings,
    body: parsed.body,
    frontmatter: fm,
  };
}
