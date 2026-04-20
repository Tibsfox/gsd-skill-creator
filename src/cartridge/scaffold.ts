/**
 * Cartridge scaffolder.
 *
 * Generates a minimal, valid cartridge skeleton from a named template into a
 * target directory. Output is designed to round-trip through `loadCartridge`
 * and `validateCartridge` without edits.
 *
 * Templates live as static files under `src/cartridge/templates/` and are
 * copied to the target directory with simple `{{placeholder}}` substitution.
 * The placeholders are intentionally few: name, slug, trust.
 *
 * The scaffolder refuses to overwrite an existing non-empty target directory.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ScaffoldTemplate =
  | 'department'
  | 'content'
  | 'coprocessor'
  | 'graphics';

export interface ScaffoldOptions {
  template: ScaffoldTemplate;
  targetDir: string;
  name: string;
  trust?: 'system' | 'user' | 'community';
  author?: string;
  description?: string;
  tags?: string[];
  createdAt?: string;
}

export interface ScaffoldResult {
  targetDir: string;
  filesWritten: string[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = join(HERE, 'templates');

interface TemplateManifest {
  files: { src: string; dest: string }[];
}

const MANIFESTS: Record<ScaffoldTemplate, TemplateManifest> = {
  department: {
    files: [
      { src: 'cartridge-department.yaml.tmpl', dest: 'cartridge.yaml' },
      { src: 'chipset-department.yaml.tmpl', dest: 'chipsets/department.yaml' },
      { src: 'chipset-grove.yaml.tmpl', dest: 'chipsets/grove.yaml' },
      { src: 'chipset-evaluation.yaml.tmpl', dest: 'chipsets/evaluation.yaml' },
      { src: 'skill.md.tmpl', dest: 'skills/placeholder-skill.md' },
      { src: 'agent.md.tmpl', dest: 'agents/placeholder-agent.md' },
      { src: 'team.md.tmpl', dest: 'teams/placeholder-team.md' },
      { src: 'README.md.tmpl', dest: 'README.md' },
    ],
  },
  content: {
    files: [
      { src: 'cartridge-content.yaml.tmpl', dest: 'cartridge.yaml' },
      { src: 'README.md.tmpl', dest: 'README.md' },
    ],
  },
  coprocessor: {
    files: [
      { src: 'cartridge-coprocessor.yaml.tmpl', dest: 'cartridge.yaml' },
      { src: 'README.md.tmpl', dest: 'README.md' },
    ],
  },
  graphics: {
    files: [
      { src: 'cartridge-graphics.yaml.tmpl', dest: 'cartridge.yaml' },
      { src: 'README.graphics.md.tmpl', dest: 'README.md' },
      { src: 'shader-basic.vert.glsl.tmpl', dest: 'shaders/basic.vert.glsl' },
      { src: 'shader-basic.frag.glsl.tmpl', dest: 'shaders/basic.frag.glsl' },
    ],
  },
};

export function scaffoldCartridge(options: ScaffoldOptions): ScaffoldResult {
  const { template, name } = options;
  const targetDir = resolve(options.targetDir);
  const trust = options.trust ?? 'user';
  const author = options.author ?? 'unknown';
  const description =
    options.description ??
    `A scaffolded ${template} cartridge. Edit this description.`;
  const createdAt = options.createdAt ?? new Date().toISOString();
  const tags = options.tags ?? [];

  const manifest = MANIFESTS[template];
  if (!manifest) {
    throw new Error(`unknown scaffold template: ${template}`);
  }

  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(
      `invalid cartridge name "${name}": must be lowercase, start with a letter, and contain only [a-z0-9-]`,
    );
  }

  if (existsSync(targetDir)) {
    const entries = readdirSync(targetDir);
    if (entries.length > 0) {
      throw new Error(`target directory is not empty: ${targetDir}`);
    }
  } else {
    mkdirSync(targetDir, { recursive: true });
  }

  const slug = name;
  const tagsList =
    tags.length > 0
      ? tags.map((t) => `    - ${t}`).join('\n')
      : `    - ${slug}`;
  const substitutions: Record<string, string> = {
    name,
    slug,
    trust,
    author,
    description,
    createdAt,
    tagsList,
  };

  const filesWritten: string[] = [];
  for (const entry of manifest.files) {
    const srcPath = join(TEMPLATES_ROOT, entry.src);
    const destPath = join(targetDir, entry.dest);
    const raw = readFileSync(srcPath, 'utf8');
    const rendered = applySubstitutions(raw, substitutions);
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(destPath, rendered, 'utf8');
    filesWritten.push(entry.dest);
  }

  return { targetDir, filesWritten };
}

function applySubstitutions(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return vars[key] ?? match;
    }
    return match;
  });
}
