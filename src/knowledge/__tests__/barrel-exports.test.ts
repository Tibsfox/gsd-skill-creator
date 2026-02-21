/**
 * Tests for barrel exports at src/knowledge/index.ts.
 *
 * Verifies that importing from the barrel provides access to all
 * expected symbols (types, schemas, parsers, registry, loader,
 * resolvers, validators, routers, mappers, content validator).
 *
 * Also verifies NFR-01: no src/knowledge/ file imports from
 * src/knowledge/packs/ (runtime is pack-content-agnostic).
 */

import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

describe('barrel exports', () => {
  it('exports all Zod schemas from types.ts', async () => {
    const barrel = await import('../index.js');

    // Zod schemas
    expect(barrel.KnowledgePackSchema).toBeDefined();
    expect(barrel.PackModuleSchema).toBeDefined();
    expect(barrel.PackActivitySchema).toBeDefined();
    expect(barrel.AssessmentMethodSchema).toBeDefined();
    expect(barrel.LearningOutcomeSchema).toBeDefined();
    expect(barrel.GradeLevelEntrySchema).toBeDefined();
    expect(barrel.LearningPathwaySchema).toBeDefined();
    expect(barrel.PackDependencySchema).toBeDefined();
    expect(barrel.PackStatusSchema).toBeDefined();
    expect(barrel.PackClassificationSchema).toBeDefined();
    expect(barrel.ModulesFileSchema).toBeDefined();
    expect(barrel.ContributorSchema).toBeDefined();
    expect(barrel.ModuleTimeEstimatesSchema).toBeDefined();
    expect(barrel.ModuleActivitiesSchema).toBeDefined();
    expect(barrel.CrossModuleCompetencySchema).toBeDefined();
    expect(barrel.ToolSchema).toBeDefined();
    expect(barrel.InteractiveElementSchema).toBeDefined();
    expect(barrel.TranslationEntrySchema).toBeDefined();
    expect(barrel.TranslationSchema).toBeDefined();
    expect(barrel.AccessibilitySchema).toBeDefined();
    expect(barrel.StandardAlignmentSchema).toBeDefined();
    expect(barrel.DifficultySchema).toBeDefined();
    expect(barrel.ContentFlagSchema).toBeDefined();
    expect(barrel.CommunitySchema).toBeDefined();
    expect(barrel.MaintenanceSchema).toBeDefined();
    expect(barrel.MetricsSchema).toBeDefined();
    expect(barrel.ResourceSchema).toBeDefined();
    expect(barrel.RelatedPackSchema).toBeDefined();
    expect(barrel.ChangelogEntrySchema).toBeDefined();
    expect(barrel.QaSchema).toBeDefined();
    expect(barrel.GsdIntegrationSchema).toBeDefined();
    expect(barrel.PackFilesSchema).toBeDefined();
  });

  it('exports .skillmeta parser functions', async () => {
    const barrel = await import('../index.js');

    expect(typeof barrel.parseSkillmeta).toBe('function');
    expect(typeof barrel.parseSkillmetaFile).toBe('function');
  });

  it('exports vision parser', async () => {
    const barrel = await import('../index.js');

    expect(typeof barrel.parseVisionDocument).toBe('function');
  });

  it('exports activity loader', async () => {
    const barrel = await import('../index.js');

    expect(typeof barrel.loadActivities).toBe('function');
    expect(typeof barrel.loadActivitiesFile).toBe('function');
  });

  it('exports assessment loader', async () => {
    const barrel = await import('../index.js');

    expect(typeof barrel.parseAssessment).toBe('function');
    expect(typeof barrel.parseAssessmentFile).toBe('function');
  });

  it('exports resource loader', async () => {
    const barrel = await import('../index.js');

    expect(typeof barrel.parseResources).toBe('function');
    expect(typeof barrel.parseResourcesFile).toBe('function');
  });

  it('exports pack registry', async () => {
    const barrel = await import('../index.js');

    expect(barrel.PackRegistry).toBeDefined();
    expect(typeof barrel.createRegistry).toBe('function');
  });

  it('exports module loader', async () => {
    const barrel = await import('../index.js');

    expect(typeof barrel.loadPack).toBe('function');
  });

  it('exports dependency resolver', async () => {
    const barrel = await import('../index.js');

    expect(typeof barrel.resolveDependencies).toBe('function');
    expect(barrel.DependencyGraph).toBeDefined();
    expect(barrel.DependencyError).toBeDefined();
  });

  it('exports prerequisite validator', async () => {
    const barrel = await import('../index.js');

    expect(typeof barrel.validatePrerequisites).toBe('function');
  });

  it('exports grade-level router', async () => {
    const barrel = await import('../index.js');

    expect(typeof barrel.routeByGradeLevel).toBe('function');
  });

  it('exports connection mapper', async () => {
    const barrel = await import('../index.js');

    expect(typeof barrel.buildConnectionGraph).toBe('function');
    expect(barrel.ConnectionGraph).toBeDefined();
  });

  it('exports content validator', async () => {
    const barrel = await import('../index.js');

    expect(typeof barrel.validatePackContent).toBe('function');
  });

  it('NFR-01: no src/knowledge/ file imports from src/knowledge/packs/', async () => {
    const knowledgeDir = join(import.meta.dirname, '..');
    const files = await readdir(knowledgeDir);
    const tsFiles = files.filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

    for (const file of tsFiles) {
      const content = await readFile(join(knowledgeDir, file), 'utf-8');
      const hasPackImport = /from\s+['"].*packs\//.test(content);
      expect(hasPackImport, `${file} should not import from packs/`).toBe(false);
    }
  });
});
