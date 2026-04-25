/**
 * Skilldex Auditor — read-only Skilldex-style registry view.
 *
 * Provides a Skilldex (arXiv:2604.16911) "package-manager catalog" projection
 * of the local skill library. Entirely READ-ONLY: the registry never writes
 * back to `.claude/skills/`, `.agents/skills/`, or `examples/`. It does not
 * mutate any DAG, does not register hooks, and is not consumed by CAPCOM
 * gate logic.
 *
 * @module skilldex-auditor/registry
 */

import fs from 'node:fs';
import path from 'node:path';

import { parseSkillFile } from './conformance-scorer.js';
import type { RegistryEntry } from './types.js';

/**
 * Enumerate SKILL.md files under `skillsDir` and return a read-only catalog.
 *
 * - Only descends into immediate child directories that contain a SKILL.md.
 * - On any I/O error returns an empty list rather than throwing.
 * - Performs zero writes.
 */
export function listRegistry(skillsDir: string): ReadonlyArray<RegistryEntry> {
  if (!fs.existsSync(skillsDir)) return [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: RegistryEntry[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    const spec = parseSkillFile(skillPath);
    const name = spec.frontmatter['name'] ?? entry.name;
    const description = spec.frontmatter['description'] ?? '';
    const version = spec.frontmatter['version'];
    out.push({
      name,
      skillPath,
      description,
      ...(version !== undefined ? { version } : {}),
    });
  }
  // Deterministic ordering for reproducible reports.
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/**
 * Look up a single registry entry by skill name. Returns `undefined` when no
 * SKILL.md under `skillsDir` declares that name.
 */
export function findInRegistry(
  skillsDir: string,
  name: string,
): RegistryEntry | undefined {
  return listRegistry(skillsDir).find((e) => e.name === name);
}
