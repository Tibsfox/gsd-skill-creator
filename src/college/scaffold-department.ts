/**
 * Department scaffolder for the on-disk `.college/` tree.
 *
 * Writes a complete, loader-discoverable department directory from a slug,
 * topic, and wing list. The emitted tree mirrors the reference layout of
 * `.college/departments/culinary-arts/`:
 *
 *   <slug>/
 *     DEPARTMENT.md                 wings + entry-point convention
 *     concepts/<wing-id>/<wing-id>-overview.ts   one RosettaConcept stub per wing
 *     try-sessions/.gitkeep
 *     references/.gitkeep
 *     calibration/.gitkeep + CALIBRATION.md
 *
 * This is distinct from the cartridge scaffolder (`scaffoldCartridge` with
 * `template: 'department'`), which emits a cartridge YAML bundle. This writes
 * the actual College knowledge tree that `CollegeLoader.listDepartments`
 * auto-discovers.
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { assertSafePath, validateSafeName } from '../validation/path-safety.js';

export interface ScaffoldDepartmentOptions {
  /** Department slug — lowercase, letter-first, `[a-z0-9-]`. Used as directory name and domain. */
  slug: string;
  /** Human-readable topic that seeds the department description and concept stubs. */
  topic: string;
  /** Wing names to seed; one concept stub is emitted per wing. */
  wings: string[];
  /** Directory that will contain the new `<slug>/` department directory. */
  targetRoot: string;
}

export interface ScaffoldedWing {
  id: string;
  name: string;
  conceptId: string;
}

export interface ScaffoldDepartmentResult {
  departmentDir: string;
  slug: string;
  wings: ScaffoldedWing[];
  filesWritten: string[];
}

const SLUG_RE = /^[a-z][a-z0-9-]*$/;

function normalizeWingId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toCamelId(id: string): string {
  const camel = id.replace(/[^a-zA-Z0-9]+(.)?/g, (_, c: string | undefined) =>
    c ? c.toUpperCase() : '',
  );
  return /^[a-zA-Z]/.test(camel) ? camel : `c${camel}`;
}

/** Strip characters that would break a single-quoted TS string or the loader's regex parse. */
function sanitizeInline(text: string): string {
  return text.replace(/['"\\\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleize(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function renderConceptStub(
  conceptId: string,
  wingName: string,
  slug: string,
  topic: string,
): string {
  const camel = toCamelId(conceptId);
  const safeTopic = sanitizeInline(topic);
  const safeWing = sanitizeInline(wingName);
  const description = sanitizeInline(
    `Overview stub for the ${safeWing} wing of the ${titleize(slug)} department, ` +
      `seeded from the topic "${safeTopic}". Replace this with a concrete concept ` +
      `grounded in the wing's subject matter.`,
  );
  return `import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const ${camel}: RosettaConcept = {
  id: '${conceptId}',
  name: '${safeWing} Overview',
  domain: '${slug}',
  description: '${description}',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0,
    imaginary: 0,
    magnitude: 0,
    angle: 0,
  },
};
`;
}

function renderDepartmentMd(
  slug: string,
  topic: string,
  wings: ScaffoldedWing[],
): string {
  const name = titleize(slug);
  const safeTopic = sanitizeInline(topic);
  const wingLines = wings
    .map((w) => `- ${w.name} -- ${safeTopic} concepts for the ${w.name} wing`)
    .join('\n');
  const conceptLines = wings
    .map((w) => `### ${w.name} (1 concept)\n- ${w.conceptId} -- overview stub`)
    .join('\n\n');
  return `# ${name} Department

**Domain:** ${slug}
**Source:** Scaffolded stub
**Status:** Draft
**Purpose:** ${safeTopic} — a scaffolded department awaiting concept authoring across ${wings.length} wing(s).

## Wings

${wingLines}

## Entry Point

${wings[0]!.conceptId}

## Concepts

${conceptLines}

## Calibration Models

None yet. See calibration/CALIBRATION.md for the skeleton.
`;
}

function renderCalibrationMd(slug: string, topic: string): string {
  const safeTopic = sanitizeInline(topic);
  return `# ${titleize(slug)} Calibration

Skeleton for domain calibration models. Each model describes adjustable
parameters, the scientific basis, and any absolute safety boundaries.

Topic: ${safeTopic}

## Models

<!-- Add CalibrationModel definitions here, one per adjustable domain. -->

## Safety Boundaries

<!-- Add absolute limits the Safety Warden must enforce. -->
`;
}

/**
 * Scaffold a discoverable `.college` department tree.
 *
 * Validates the slug against path-traversal before any write, refuses to
 * overwrite a non-empty existing department directory, and confines every
 * write to the department directory via {@link assertSafePath}.
 */
export function scaffoldDepartment(
  options: ScaffoldDepartmentOptions,
): ScaffoldDepartmentResult {
  const { slug, topic } = options;

  const safe = validateSafeName(slug);
  if (!safe.valid) {
    throw new Error(`invalid department slug "${slug}": ${safe.error}`);
  }
  if (!SLUG_RE.test(slug)) {
    throw new Error(
      `invalid department slug "${slug}": must be lowercase, start with a letter, and contain only [a-z0-9-]`,
    );
  }

  const wingNames = options.wings.map((w) => w.trim()).filter(Boolean);
  if (wingNames.length === 0) {
    throw new Error('at least one wing is required');
  }

  const seenWingIds = new Set<string>();
  const wings: ScaffoldedWing[] = [];
  for (const name of wingNames) {
    const id = normalizeWingId(name);
    if (!id) {
      throw new Error(`wing name "${name}" normalizes to an empty id`);
    }
    if (seenWingIds.has(id)) {
      throw new Error(`duplicate wing id "${id}" derived from "${name}"`);
    }
    seenWingIds.add(id);
    wings.push({ id, name, conceptId: `${slug}-${id}-overview` });
  }

  const targetRoot = resolve(options.targetRoot);
  const departmentDir = join(targetRoot, slug);

  if (existsSync(departmentDir) && readdirSync(departmentDir).length > 0) {
    throw new Error(`department directory is not empty: ${departmentDir}`);
  }

  const writes: Array<{ rel: string; content: string }> = [
    { rel: 'DEPARTMENT.md', content: renderDepartmentMd(slug, topic, wings) },
    { rel: 'try-sessions/.gitkeep', content: '' },
    { rel: 'references/.gitkeep', content: '' },
    { rel: 'calibration/.gitkeep', content: '' },
    { rel: 'calibration/CALIBRATION.md', content: renderCalibrationMd(slug, topic) },
  ];
  for (const w of wings) {
    writes.push({
      rel: `concepts/${w.id}/${w.id}-overview.ts`,
      content: renderConceptStub(w.conceptId, w.name, slug, topic),
    });
  }

  const filesWritten: string[] = [];
  for (const { rel, content } of writes) {
    const abs = join(departmentDir, rel);
    assertSafePath(abs, departmentDir);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, content, 'utf8');
    filesWritten.push(rel);
  }

  return { departmentDir, slug, wings, filesWritten };
}
