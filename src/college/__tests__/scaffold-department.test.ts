import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { scaffoldDepartment } from '../scaffold-department.js';

interface DepartmentSummaryLike {
  id: string;
  name: string;
  entryPoint: string;
  wings: Array<{ id: string; name: string; conceptCount: number }>;
}
interface ConceptLike {
  id: string;
  domain: string;
  description: string;
}
interface CollegeLoaderLike {
  listDepartments(): string[];
  loadSummary(id: string): Promise<DepartmentSummaryLike>;
  loadWing(dept: string, wing: string): Promise<{ concepts: ConceptLike[] }>;
}

async function loadCollegeLoader(
  basePath: string,
): Promise<CollegeLoaderLike> {
  const tsPath = join(process.cwd(), '.college', 'college', 'index.ts');
  const jsPath = join(process.cwd(), '.college', 'college', 'index.js');
  const url = pathToFileURL(existsSync(tsPath) ? tsPath : jsPath).href;
  const barrel = (await import(url)) as {
    CollegeLoader: new (basePath?: string) => CollegeLoaderLike;
  };
  return new barrel.CollegeLoader(basePath);
}

describe('scaffoldDepartment', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'dept-scaffold-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('writes a complete, discoverable department tree', async () => {
    const result = scaffoldDepartment({
      slug: 'widget-craft',
      topic: 'precision widget fabrication',
      wings: ['Materials Science', 'Assembly Technique'],
      targetRoot: root,
    });

    expect(result.slug).toBe('widget-craft');
    expect(result.wings.map((w) => w.id)).toEqual([
      'materials-science',
      'assembly-technique',
    ]);

    const dir = result.departmentDir;
    expect(existsSync(join(dir, 'DEPARTMENT.md'))).toBe(true);
    expect(existsSync(join(dir, 'try-sessions/.gitkeep'))).toBe(true);
    expect(existsSync(join(dir, 'references/.gitkeep'))).toBe(true);
    expect(existsSync(join(dir, 'calibration/.gitkeep'))).toBe(true);
    expect(
      existsSync(join(dir, 'concepts/materials-science/materials-science-overview.ts')),
    ).toBe(true);

    // CollegeLoader auto-discovers the scaffolded department.
    const loader = await loadCollegeLoader(root);
    expect(loader.listDepartments()).toContain('widget-craft');

    const summary = await loader.loadSummary('widget-craft');
    expect(summary.wings).toHaveLength(2);
    expect(summary.entryPoint).toBe('widget-craft-materials-science-overview');
    for (const w of summary.wings) {
      expect(w.conceptCount).toBe(1);
    }

    // Concepts parse and carry the right identity.
    const wing = await loader.loadWing('widget-craft', 'materials-science');
    expect(wing.concepts).toHaveLength(1);
    expect(wing.concepts[0]!.id).toBe('widget-craft-materials-science-overview');
    expect(wing.concepts[0]!.domain).toBe('widget-craft');
    expect(wing.concepts[0]!.description.length).toBeGreaterThan(0);
  });

  it('emits a concept stub that imports RosettaConcept from rosetta-core/types', () => {
    const result = scaffoldDepartment({
      slug: 'demo-dept',
      topic: 'demo',
      wings: ['Alpha'],
      targetRoot: root,
    });
    const src = readFileSync(
      join(result.departmentDir, 'concepts/alpha/alpha-overview.ts'),
      'utf8',
    );
    expect(src).toContain(
      "import type { RosettaConcept } from '../../../../rosetta-core/types.js'",
    );
    expect(src).toContain('complexPlanePosition');
  });

  it('rejects a path-traversal slug before writing', () => {
    expect(() =>
      scaffoldDepartment({
        slug: '../evil',
        topic: 't',
        wings: ['Alpha'],
        targetRoot: root,
      }),
    ).toThrow(/invalid department slug/);
  });

  it('rejects an empty wing list', () => {
    expect(() =>
      scaffoldDepartment({ slug: 'ok', topic: 't', wings: [], targetRoot: root }),
    ).toThrow(/at least one wing/);
  });

  it('refuses to overwrite a non-empty existing department directory', () => {
    scaffoldDepartment({ slug: 'twice', topic: 't', wings: ['A'], targetRoot: root });
    expect(() =>
      scaffoldDepartment({ slug: 'twice', topic: 't', wings: ['A'], targetRoot: root }),
    ).toThrow(/not empty/);
  });
});
