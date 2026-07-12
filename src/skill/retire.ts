/**
 * Skill retirement — a REAL, reversible removal from Claude Code's auto-load
 * path (item 7).
 *
 * A `status: retired` frontmatter marker is inert at load time (Claude Code
 * auto-loads every `.claude/skills/<name>/SKILL.md` natively and honors no
 * status field), so it does NOT reduce the context budget the way the objective
 * needs. The actual mechanism here is a MOVE: `.claude/skills/<name>` →
 * `.claude/skills-retired/<name>`, a sibling directory OUTSIDE the auto-load
 * glob. That genuinely removes the skill from the load path and is fully
 * reversible via `restoreSkill`. `.claude/` is gitignored, so this touches no
 * tracked source and has no install-parity impact.
 *
 * Retirement is SUGGEST-FIRST and human-confirmed: `buildRetireCandidates`
 * only ranks candidates from the MEASURED activation signal; nothing is moved
 * unless the operator names a skill explicitly. Never deletes.
 *
 * @module skill/retire
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  appendFileSync,
  statSync,
} from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { validateSafeName } from '../validation/path-safety.js';
import { setSkillStatus } from './frontmatter-edit.js';
import { evaluateRetireCandidate, RETIRE_GRACE_DAYS } from './retire-signal.js';
import { buildSkillInventory, type SkillInventoryEntry } from '../cli/commands/skill-inventory.js';
import { SkillStore } from '../storage/skill-store.js';
import { SkillIndex } from '../storage/skill-index.js';

/** A retire candidate surfaced by the suggest pass. */
export interface RetireCandidate {
  name: string;
  path: string;
  ageDays: number | null;
  activationCount?: number;
  reason: string;
}

/** Result of a retire/restore operation. */
export interface RetireResult {
  ok: boolean;
  error?: string;
  /** Destination the skill dir was moved to (retire) or restored to (restore). */
  movedTo?: string;
  /** True when a project-claude/ source exists — reinstall would resurrect it. */
  bundled?: boolean;
  /** Dry-run: describe the move without performing it. */
  planned?: boolean;
}

function retiredRootFor(skillsDir: string): string {
  return resolve(skillsDir, '..', 'skills-retired');
}

function assertWithin(child: string, parent: string): void {
  const c = resolve(child);
  const p = resolve(parent);
  if (c !== p && !c.startsWith(p + sep)) {
    throw new Error(`resolved path escapes base directory: ${child}`);
  }
}

/**
 * Pure selector: from an inventory + a measured-activation map, rank the active
 * skills that the measured signal marks as retire candidates (oldest first).
 * Only `active` skills are considered.
 */
export function selectRetireCandidates(
  entries: SkillInventoryEntry[],
  activationByName: Map<string, number | undefined>,
  graceDays: number = RETIRE_GRACE_DAYS,
): RetireCandidate[] {
  const out: RetireCandidate[] = [];
  for (const e of entries) {
    if (e.status !== 'active') continue;
    const activationCount = activationByName.get(e.name);
    const verdict = evaluateRetireCandidate({ activationCount, ageDays: e.ageDays }, graceDays);
    if (verdict.isCandidate) {
      out.push({ name: e.name, path: e.path, ageDays: e.ageDays, activationCount, reason: verdict.reason });
    }
  }
  return out.sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0));
}

/** Join the skill inventory + SkillIndex activation counts into ranked candidates. */
export async function buildRetireCandidates(opts: {
  skillsDir: string;
  now?: () => Date;
  graceDays?: number;
}): Promise<RetireCandidate[]> {
  const inventory = buildSkillInventory({ skillsRoot: opts.skillsDir, now: opts.now });
  const activationByName = new Map<string, number | undefined>();
  try {
    const index = new SkillIndex(new SkillStore(opts.skillsDir), opts.skillsDir);
    for (const entry of await index.getAll()) {
      activationByName.set(entry.name, entry.activationCount);
    }
  } catch {
    // No index yet → every skill is never-measured, so nothing is flagged.
  }
  return selectRetireCandidates(inventory.entries, activationByName, opts.graceDays);
}

function skillMdPath(dir: string): string {
  return join(dir, 'SKILL.md');
}

function isBundled(skillsDir: string, name: string): boolean {
  const repoRoot = resolve(skillsDir, '..', '..');
  return existsSync(join(repoRoot, 'project-claude', 'skills', name, 'SKILL.md'));
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Retire a skill: stamp its frontmatter, then MOVE its directory out of the
 * auto-load path into `.claude/skills-retired/`. Reversible via `restoreSkill`.
 * Human-confirmed by construction (the operator names the skill). Never deletes.
 */
export async function retireSkill(opts: {
  name: string;
  skillsDir: string;
  reason?: string;
  dryRun?: boolean;
  now?: () => Date;
}): Promise<RetireResult> {
  const safe = validateSafeName(opts.name);
  if (!safe.valid) return { ok: false, error: `unsafe skill name: ${safe.error}` };

  const srcDir = join(opts.skillsDir, opts.name);
  assertWithin(srcDir, opts.skillsDir);
  if (!existsSync(srcDir) || !statSync(srcDir).isDirectory() || !existsSync(skillMdPath(srcDir))) {
    return { ok: false, error: `no such skill: ${opts.name} (looked in ${opts.skillsDir})` };
  }

  const retiredRoot = retiredRootFor(opts.skillsDir);
  const destDir = join(retiredRoot, opts.name);
  const bundled = isBundled(opts.skillsDir, opts.name);

  if (opts.dryRun) {
    return { ok: true, planned: true, movedTo: destDir, bundled };
  }
  if (existsSync(destDir)) {
    return { ok: false, error: `already retired (exists: ${destDir})`, bundled };
  }

  const now = (opts.now ?? (() => new Date()))();
  const retiredAt = isoDate(now);

  // Stamp the frontmatter for the record; the MOVE is what removes it from load.
  const md = skillMdPath(srcDir);
  const stamped = setSkillStatus(readFileSync(md, 'utf8'), 'retired', { retiredAt, reason: opts.reason });
  writeFileSync(md, stamped, 'utf8');

  mkdirSync(retiredRoot, { recursive: true });
  renameSync(srcDir, destDir);

  appendFileSync(
    join(retiredRoot, 'retirements.jsonl'),
    JSON.stringify({ action: 'retire', name: opts.name, retiredAt, reason: opts.reason ?? null, bundled }) + '\n',
    'utf8',
  );

  return { ok: true, movedTo: destDir, bundled };
}

/** Restore a retired skill: move it back into the auto-load path and re-activate. */
export async function restoreSkill(opts: {
  name: string;
  skillsDir: string;
  now?: () => Date;
}): Promise<RetireResult> {
  const safe = validateSafeName(opts.name);
  if (!safe.valid) return { ok: false, error: `unsafe skill name: ${safe.error}` };

  const retiredRoot = retiredRootFor(opts.skillsDir);
  const srcDir = join(retiredRoot, opts.name);
  assertWithin(srcDir, retiredRoot);
  if (!existsSync(srcDir) || !existsSync(skillMdPath(srcDir))) {
    return { ok: false, error: `no retired skill: ${opts.name} (looked in ${retiredRoot})` };
  }
  const destDir = join(opts.skillsDir, opts.name);
  if (existsSync(destDir)) {
    return { ok: false, error: `an active skill already occupies ${destDir}` };
  }

  const md = skillMdPath(srcDir);
  writeFileSync(md, setSkillStatus(readFileSync(md, 'utf8'), 'active'), 'utf8');
  mkdirSync(opts.skillsDir, { recursive: true });
  renameSync(srcDir, destDir);

  const now = (opts.now ?? (() => new Date()))();
  appendFileSync(
    join(retiredRoot, 'retirements.jsonl'),
    JSON.stringify({ action: 'restore', name: opts.name, restoredAt: isoDate(now) }) + '\n',
    'utf8',
  );

  return { ok: true, movedTo: destDir };
}
