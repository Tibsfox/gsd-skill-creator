/**
 * Routes dogfood SkillUpdate proposals into scaffolded skill DRAFTS.
 *
 * Only 'create' updates are materialized: they describe a genuinely new skill,
 * so a staged draft is the natural landing zone. 'refine' / 'merge' / 'annotate'
 * updates propose edits to definitions that already exist in the ecosystem —
 * they are not scaffold-draft candidates and are skipped here.
 *
 * Drafts are staged OUTSIDE the live auto-load path. Nothing is ever written
 * under `.claude/skills/` — promotion into that path is a human ship-gate step
 * (`skill-creator skill ship <name>`). The router refuses, with a thrown error,
 * to stage into any directory inside `.claude/skills`.
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import type { SkillUpdate } from './types.js';

export interface DraftRouteOptions {
  /** Directory drafts are staged under. MUST NOT be inside `.claude/skills`. */
  outputDir: string;
}

export interface StagedDraft {
  skillName: string;
  action: SkillUpdate['action'];
  draftDir: string;
  skillFile: string;
  manifestFile: string;
}

export interface SkippedUpdate {
  skillName: string;
  action: SkillUpdate['action'];
  reason: string;
}

export interface DraftRouteResult {
  outputDir: string;
  staged: StagedDraft[];
  skipped: SkippedUpdate[];
}

/** Draft manifest — the machine-readable side-car next to SKILL.md. */
export interface DraftManifest {
  sourceUpdateId: string;
  skillName: string;
  action: 'create';
  status: 'draft';
  triggerPatterns: string[];
  complexPlanePosition: { theta: number; radius: number };
  evidenceFromTextbook: string;
  evidenceFromEcosystem: string;
  proposedDefinition: string;
  stagedAt: string;
}

const LIVE_SKILLS_FRAGMENT = `${sep}.claude${sep}skills`;

/**
 * Materialize the 'create' SkillUpdates in `updates` as staged drafts under
 * `options.outputDir`. Returns the staged drafts and the skipped updates
 * (with a reason). Throws if `outputDir` resolves inside `.claude/skills`.
 */
export function routeSkillUpdatesToDrafts(
  updates: SkillUpdate[],
  options: DraftRouteOptions,
): DraftRouteResult {
  const outputDir = resolve(options.outputDir);
  if (outputDir.includes(LIVE_SKILLS_FRAGMENT) || outputDir.endsWith(LIVE_SKILLS_FRAGMENT)) {
    throw new Error(
      `refusing to stage drafts inside the live skills path (human ship-gate only): ${outputDir}`,
    );
  }

  const staged: StagedDraft[] = [];
  const skipped: SkippedUpdate[] = [];

  for (const update of updates) {
    if (update.action !== 'create') {
      skipped.push({
        skillName: update.skillName,
        action: update.action,
        reason: `action '${update.action}' proposes an edit to an existing definition, not a new-skill scaffold`,
      });
      continue;
    }

    const slug = toSlug(update.skillName);
    if (!slug) {
      skipped.push({
        skillName: update.skillName,
        action: update.action,
        reason: 'skill name did not reduce to a valid slug',
      });
      continue;
    }

    const draftDir = join(outputDir, slug);
    const skillFile = join(draftDir, 'SKILL.md');
    if (existsSync(skillFile)) {
      skipped.push({
        skillName: slug,
        action: update.action,
        reason: 'draft already staged',
      });
      continue;
    }
    if (existsSync(draftDir) && readdirSync(draftDir).length > 0) {
      skipped.push({
        skillName: slug,
        action: update.action,
        reason: 'draft directory already exists and is non-empty',
      });
      continue;
    }

    const manifest: DraftManifest = {
      sourceUpdateId: update.id,
      skillName: slug,
      action: 'create',
      status: 'draft',
      triggerPatterns: update.triggerPatterns,
      complexPlanePosition: update.complexPlanePosition,
      evidenceFromTextbook: update.evidenceFromTextbook,
      evidenceFromEcosystem: update.evidenceFromEcosystem,
      proposedDefinition: update.proposedDefinition,
      stagedAt: new Date().toISOString(),
    };
    const manifestFile = join(draftDir, 'draft.json');

    mkdirSync(draftDir, { recursive: true });
    writeFileSync(skillFile, renderSkillDraft(slug, update), 'utf8');
    writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    staged.push({
      skillName: slug,
      action: update.action,
      draftDir,
      skillFile,
      manifestFile,
    });
  }

  return { outputDir, staged, skipped };
}

/** Reduce a proposed skill name to a kebab-case slug. */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Build a bounded, `Use when`-carrying description from an update. */
function buildDescription(update: SkillUpdate): string {
  const first = firstSentence(update.proposedDefinition) || update.proposedDefinition;
  const triggers = update.triggerPatterns.filter(Boolean).slice(0, 3);
  const useWhen =
    triggers.length > 0 ? ` Use when working with ${triggers.join(', ')}.` : '';
  const full = `${first}${useWhen}`.trim();
  return full.length > 1024 ? `${full.slice(0, 1021)}...` : full;
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

/** Render the staged SKILL.md body for a 'create' update. */
function renderSkillDraft(slug: string, update: SkillUpdate): string {
  const description = buildDescription(update);
  const triggers = update.triggerPatterns.filter(Boolean);
  const triggerBlock =
    triggers.length > 0 ? triggers.map((t) => `- ${t}`).join('\n') : '- (none proposed)';
  const { theta, radius } = update.complexPlanePosition;

  return [
    '---',
    `name: ${slug}`,
    `description: ${JSON.stringify(description)}`,
    '---',
    '',
    `# ${slug}`,
    '',
    update.proposedDefinition.trim(),
    '',
    '## Triggers',
    '',
    triggerBlock,
    '',
    '## Complex plane position',
    '',
    `- theta: ${theta}`,
    `- radius: ${radius}`,
    '',
    '## Evidence',
    '',
    `- Textbook: ${update.evidenceFromTextbook}`,
    `- Ecosystem: ${update.evidenceFromEcosystem}`,
    '',
    '> Staged draft — not a live skill. Move into `.claude/skills/` and run',
    `> \`skill-creator skill ship ${slug}\` to promote through the human ship gate.`,
    '',
  ].join('\n');
}
