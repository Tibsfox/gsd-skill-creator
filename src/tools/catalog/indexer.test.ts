/**
 * TDD tests for the unified indexer that populates both ScriptCatalog
 * and SchemaLibrary from skill directories.
 *
 * RED phase: all tests import indexSkills which does not exist yet.
 *
 * @module catalog/indexer.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { indexSkills } from './indexer.js';
import { ScriptCatalog } from './script-catalog.js';
import { SchemaLibrary } from './schema-library.js';

// ============================================================================
// Test Helpers
// ============================================================================

const sampleSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    name: { type: 'string' },
    value: { type: 'number' },
  },
};

async function createSkillDir(
  skillsRoot: string,
  skillName: string,
  options: { scripts?: string[]; schemas?: { dir: string; files: string[] } } = {},
): Promise<void> {
  const skillDir = path.join(skillsRoot, skillName);
  await fs.promises.mkdir(skillDir, { recursive: true });

  // Create SKILL.md
  await fs.promises.writeFile(
    path.join(skillDir, 'SKILL.md'),
    `# ${skillName}\nversion: 1.0.0\n`,
  );

  // Create scripts
  if (options.scripts) {
    const scriptsDir = path.join(skillDir, 'scripts');
    await fs.promises.mkdir(scriptsDir, { recursive: true });
    for (const script of options.scripts) {
      await fs.promises.writeFile(
        path.join(scriptsDir, script),
        `#!/bin/bash\necho "${script}"`,
      );
    }
  }

  // Create schemas
  if (options.schemas) {
    const schemasDir = path.join(skillDir, options.schemas.dir);
    await fs.promises.mkdir(schemasDir, { recursive: true });
    for (const schemaFile of options.schemas.files) {
      await fs.promises.writeFile(
        path.join(schemasDir, schemaFile),
        JSON.stringify(sampleSchema),
      );
    }
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('indexSkills', () => {
  let tmpDir: string;
  let catalog: ScriptCatalog;
  let library: SchemaLibrary;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'idx-test-'));
    catalog = new ScriptCatalog(path.join(tmpDir, 'scripts.json'));
    library = new SchemaLibrary(path.join(tmpDir, 'schemas.json'));
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('populates both ScriptCatalog and SchemaLibrary from a skill directory structure', async () => {
    const skillsRoot = path.join(tmpDir, 'skills');

    await createSkillDir(skillsRoot, 'skill-a', {
      scripts: ['validate-json.sh'],
      schemas: { dir: 'references', files: ['event-schema.schema.json'] },
    });
    await createSkillDir(skillsRoot, 'skill-b', {
      scripts: ['parse-yaml.sh', 'transform-data.sh'],
      schemas: { dir: 'resources', files: ['config-schema.schema.json'] },
    });

    const result = await indexSkills(skillsRoot, catalog, library);

    expect(result.scripts_indexed).toBe(3);
    expect(result.schemas_indexed).toBe(2);
    expect(result.skills_scanned).toBe(2);
    expect(result.errors).toHaveLength(0);
    expect(catalog.size).toBe(3);
    expect(library.size).toBe(2);
  });

  it('returns IndexResult with correct counts', async () => {
    const skillsRoot = path.join(tmpDir, 'skills');

    await createSkillDir(skillsRoot, 'skill-a', {
      scripts: ['validate.sh'],
    });

    const result = await indexSkills(skillsRoot, catalog, library);

    expect(result.scripts_indexed).toBe(1);
    expect(result.schemas_indexed).toBe(0);
    expect(result.skills_scanned).toBe(1);
    expect(result.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('records errors for malformed skill directories (does not throw)', async () => {
    const skillsRoot = path.join(tmpDir, 'skills');

    // Create a skill with a "scripts" that is actually a file (not a dir)
    const skillDir = path.join(skillsRoot, 'broken-skill');
    await fs.promises.mkdir(skillDir, { recursive: true });
    await fs.promises.writeFile(path.join(skillDir, 'scripts'), 'not a directory');

    const result = await indexSkills(skillsRoot, catalog, library);

    expect(result.skills_scanned).toBe(1);
    // Should not throw, errors recorded
    expect(result.scripts_indexed).toBe(0);
  });

  it('handles empty skill directory gracefully', async () => {
    const skillsRoot = path.join(tmpDir, 'skills');
    await fs.promises.mkdir(skillsRoot, { recursive: true });

    const result = await indexSkills(skillsRoot, catalog, library);

    expect(result.scripts_indexed).toBe(0);
    expect(result.schemas_indexed).toBe(0);
    expect(result.skills_scanned).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('skips hidden directories (starting with .)', async () => {
    const skillsRoot = path.join(tmpDir, 'skills');

    await createSkillDir(skillsRoot, '.hidden-skill', {
      scripts: ['secret.sh'],
    });
    await createSkillDir(skillsRoot, 'visible-skill', {
      scripts: ['validate.sh'],
    });

    const result = await indexSkills(skillsRoot, catalog, library);

    expect(result.skills_scanned).toBe(1);
    expect(result.scripts_indexed).toBe(1);
    expect(catalog.size).toBe(1);
  });

  it('completes in under 2 seconds for 100+ mock entries (SLIB-03)', async () => {
    const skillsRoot = path.join(tmpDir, 'skills');

    // Create 25 skills with 4-5 scripts each = 100+ entries
    const promises: Promise<void>[] = [];
    for (let i = 0; i < 25; i++) {
      promises.push(
        createSkillDir(skillsRoot, `skill-${i.toString().padStart(3, '0')}`, {
          scripts: [
            `parse-${i}.sh`,
            `validate-${i}.sh`,
            `transform-${i}.sh`,
            `format-${i}.sh`,
            ...(i % 2 === 0 ? [`analyze-${i}.sh`] : []),
          ],
          schemas: {
            dir: 'references',
            files: [`data-${i}.schema.json`],
          },
        }),
      );
    }
    await Promise.all(promises);

    const start = performance.now();
    const result = await indexSkills(skillsRoot, catalog, library);
    const elapsed = performance.now() - start;

    expect(result.scripts_indexed).toBeGreaterThanOrEqual(100);
    expect(result.schemas_indexed).toBeGreaterThanOrEqual(25);
    expect(elapsed).toBeLessThan(2000);
  });
});
