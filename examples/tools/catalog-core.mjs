// examples/tools/catalog-core.mjs
//
// Shared, zero-dependency core for the examples/ catalog tooling.
//
// Single source of truth for CATEGORY DISCOVERY. Before v1.49.970 each tool
// (install / validate / catalog-gen / generate-category-readmes / license-report
// / backfill-frontmatter) carried its OWN hardcoded category allowlist
// (SKILL_CATEGORIES = {gsd, research, media, dev, ops, workflow, patterns,
// orchestration, state, deprecated}, etc.). The storefront's taxonomy grew to
// 50+ college/department categories, but the allowlists never did — so the
// tooling silently served ~19% of the library and mis-counted the rest. The
// fix is to STOP allowlisting and detect structure on disk instead.
//
// The structure under examples/<type>/ is:
//
//   examples/<type>/<category>/<artifact>/<metadata-file>
//
// with one legacy exception — a pre-Stage-2 artifact placed directly at
//
//   examples/<type>/<artifact>/<metadata-file>     ("(unclassified)")
//
// We tell a CATEGORY dir from an (unclassified) ARTIFACT dir STRUCTURALLY: an
// artifact dir holds its metadata file directly; a category dir does not (its
// metadata-bearing children are one level deeper). This self-maintains as the
// taxonomy grows — adding examples/skills/astronomy/ needs no code change.

import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Types that use category subfolders. (Chipsets are flat and handled
// separately by each tool — they have no category layer.)
export const CATEGORIZED_TYPES = ['skills', 'agents', 'teams'];

// Where the 9-field frontmatter lives for each artifact type.
//   skills   -> SKILL.md
//   agents   -> AGENT.md
//   teams    -> README.md sidecar (alongside config.json)
//   chipsets -> README.md sidecar (alongside chipset.yaml)
export function metadataFileFor(type, artifactDir) {
  switch (type) {
    case 'skills':   return join(artifactDir, 'SKILL.md');
    case 'agents':   return join(artifactDir, 'AGENT.md');
    case 'teams':    return join(artifactDir, 'README.md');
    case 'chipsets': return join(artifactDir, 'README.md');
    default:         return null;
  }
}

// Is `dir` an ARTIFACT dir (holds its metadata directly) rather than a CATEGORY
// dir? Used only on the TOP-LEVEL dirs under examples/<type>/ to disambiguate
// the legacy pre-Stage-2 placement.
//
// Teams need special care: a team artifact carries a README.md sidecar AND a
// config.json, while a generated category README.md ALSO sits at the category
// level. So for teams we key on config.json (present only on real team
// artifacts) rather than on README.md — otherwise a freshly-generated category
// README would make the category look like an artifact.
export function isArtifactDir(type, dir) {
  if (type === 'teams') return existsSync(join(dir, 'config.json'));
  const mp = metadataFileFor(type, dir);
  return !!mp && existsSync(mp);
}

// Discover the category names for a type by reading the disk, NOT an allowlist.
// A top-level dir is a category unless it is itself an (unclassified) artifact.
// Returns a sorted array of category names (e.g. ['art', 'astronomy', ...]).
export async function discoverCategories(root, type) {
  const typeDir = join(root, type);
  if (!existsSync(typeDir)) return [];
  const cats = [];
  for (const ent of await readdir(typeDir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'README.md' || !ent.isDirectory()) continue;
    if (isArtifactDir(type, join(typeDir, ent.name))) continue; // unclassified artifact, not a category
    cats.push(ent.name);
  }
  return cats.sort();
}
