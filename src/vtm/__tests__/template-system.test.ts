/**
 * Tests for VTM template loader, renderer, registry, and validator.
 *
 * Covers four subsystems:
 * - loadTemplate(): reads .md files from disk with memory caching
 * - renderTemplate(): mustache-style {{placeholder}} substitution with
 *   {{#if}}...{{/if}} conditionals and {{#each}}...{{/each}} loops
 * - createTemplateRegistry(): factory returning a registry with listAll(),
 *   get(), getNames(), and register() for all 7 VTM templates
 * - validateRenderedTemplate(): validates rendered output against Zod schemas
 *   with structured diagnostics (errors for schema violations, warnings for
 *   unresolved placeholders)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  loadTemplate,
  renderTemplate,
  createTemplateRegistry,
  validateRenderedTemplate,
  VTM_TEMPLATE_NAMES,
} from '../template-system.js';
import type { TemplateDiagnostic, ValidationResult } from '../template-system.js';

// ---------------------------------------------------------------------------
// Temp directory for test templates
// ---------------------------------------------------------------------------

let tempDir: string;

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'vtm-template-test-'));

  // Create test template files
  await writeFile(
    join(tempDir, 'simple-template.md'),
    '# {{title}}\n\nBy {{author}}\n\n{{content}}',
  );

  await writeFile(
    join(tempDir, 'conditional-template.md'),
    [
      '# {{title}}',
      '',
      '{{#if showIntro}}Welcome to the guide.{{/if}}',
      '',
      '{{#if hasWarning}}WARNING: {{warning}}{{else}}All clear.{{/if}}',
    ].join('\n'),
  );

  await writeFile(
    join(tempDir, 'loop-template.md'),
    [
      '# {{title}}',
      '',
      '## Items',
      '',
      '{{#each items}}- {{name}}: {{description}}',
      '{{/each}}',
    ].join('\n'),
  );

  await writeFile(
    join(tempDir, 'complex-template.md'),
    [
      '# {{projectName}}',
      '',
      '{{#if hasSafety}}## Safety Notes',
      '',
      '{{safetyNotes}}{{/if}}',
      '',
      '## Components',
      '',
      '{{#each components}}### {{name}}',
      '{{description}}',
      '{{/each}}',
      '',
      'Version: {{version}}',
    ].join('\n'),
  );

  await writeFile(
    join(tempDir, 'markdown-structure-template.md'),
    [
      '# {{title}}',
      '',
      '## Table',
      '',
      '| Column A | Column B |',
      '|----------|----------|',
      '| {{cellA}} | {{cellB}} |',
      '',
      '## Code Block',
      '',
      '```typescript',
      'const x = {{varName}};',
      '```',
      '',
      '## Link',
      '',
      '[{{linkText}}]({{linkUrl}})',
    ].join('\n'),
  );
});

afterAll(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

// ===========================================================================
// loadTemplate
// ===========================================================================

describe('loadTemplate', () => {
  it('loads a .md template file and returns { name, content, path }', async () => {
    const result = await loadTemplate('simple', { basePath: tempDir });
    expect(result).not.toBeNull();
    expect(result!.name).toBe('simple');
    expect(result!.content).toContain('# {{title}}');
    expect(result!.content).toContain('{{author}}');
    expect(result!.path).toContain(tempDir);
  });

  it('returns null for a missing template', async () => {
    const result = await loadTemplate('nonexistent', { basePath: tempDir });
    expect(result).toBeNull();
  });

  it('caches template content after first read', async () => {
    // First load
    const first = await loadTemplate('simple', { basePath: tempDir });
    // Second load (should come from cache — same object reference)
    const second = await loadTemplate('simple', { basePath: tempDir });
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first!.content).toBe(second!.content);
  });

  it('invalidates cache when reload: true is passed', async () => {
    // Load once to populate cache
    await loadTemplate('simple', { basePath: tempDir });

    // Reload should re-read from disk
    const reloaded = await loadTemplate('simple', {
      basePath: tempDir,
      reload: true,
    });
    expect(reloaded).not.toBeNull();
    expect(reloaded!.content).toContain('# {{title}}');
  });

  it('uses -template.md suffix for file resolution', async () => {
    const result = await loadTemplate('simple', { basePath: tempDir });
    expect(result).not.toBeNull();
    expect(result!.path).toMatch(/simple-template\.md$/);
  });
});

// ===========================================================================
// renderTemplate
// ===========================================================================

describe('renderTemplate', () => {
  // --- Simple substitution ---

  it('substitutes {{placeholder}} tokens with provided values', () => {
    const content = '# {{title}}\n\nBy {{author}}';
    const result = renderTemplate(content, {
      title: 'My Document',
      author: 'Alice',
    });
    expect(result).toBe('# My Document\n\nBy Alice');
  });

  it('preserves markdown structure (headings, code blocks, tables, links)', () => {
    const content = [
      '# {{title}}',
      '',
      '| Col A | Col B |',
      '|-------|-------|',
      '| {{a}} | {{b}} |',
      '',
      '```ts',
      'const x = {{val}};',
      '```',
      '',
      '[{{text}}]({{url}})',
    ].join('\n');

    const result = renderTemplate(content, {
      title: 'Test',
      a: 'A1',
      b: 'B1',
      val: '42',
      text: 'Click',
      url: 'https://example.com',
    });

    expect(result).toContain('# Test');
    expect(result).toContain('| A1 | B1 |');
    expect(result).toContain('const x = 42;');
    expect(result).toContain('[Click](https://example.com)');
  });

  it('leaves unresolved {{placeholder}} tokens as-is in output', () => {
    const content = '# {{title}}\n\n{{unresolved}} stays here';
    const result = renderTemplate(content, { title: 'Resolved' });
    expect(result).toContain('# Resolved');
    expect(result).toContain('{{unresolved}}');
  });

  it('converts non-string values to strings', () => {
    const content = 'Count: {{count}}, Active: {{active}}';
    const result = renderTemplate(content, { count: 42, active: true });
    expect(result).toBe('Count: 42, Active: true');
  });

  // --- Conditional blocks ---

  it('renders {{#if condition}} content when condition is truthy', () => {
    const content = '{{#if showIntro}}Welcome!{{/if}}';
    const result = renderTemplate(content, { showIntro: true });
    expect(result).toBe('Welcome!');
  });

  it('hides {{#if condition}} content when condition is falsy', () => {
    const content = '{{#if showIntro}}Welcome!{{/if}}';
    const result = renderTemplate(content, { showIntro: false });
    expect(result).toBe('');
  });

  it('renders else branch when condition is falsy', () => {
    const content = '{{#if hasWarning}}Danger!{{else}}All clear.{{/if}}';
    const result = renderTemplate(content, { hasWarning: false });
    expect(result).toBe('All clear.');
  });

  it('renders if branch (not else) when condition is truthy', () => {
    const content = '{{#if hasWarning}}Danger!{{else}}All clear.{{/if}}';
    const result = renderTemplate(content, { hasWarning: true });
    expect(result).toBe('Danger!');
  });

  it('treats empty string as falsy for {{#if}}', () => {
    const content = '{{#if value}}Yes{{else}}No{{/if}}';
    expect(renderTemplate(content, { value: '' })).toBe('No');
  });

  it('treats null as falsy for {{#if}}', () => {
    const content = '{{#if value}}Yes{{else}}No{{/if}}';
    expect(renderTemplate(content, { value: null })).toBe('No');
  });

  it('treats undefined as falsy for {{#if}}', () => {
    const content = '{{#if value}}Yes{{else}}No{{/if}}';
    expect(renderTemplate(content, { value: undefined })).toBe('No');
  });

  it('treats 0 as falsy for {{#if}}', () => {
    const content = '{{#if value}}Yes{{else}}No{{/if}}';
    expect(renderTemplate(content, { value: 0 })).toBe('No');
  });

  it('treats missing key as falsy for {{#if}}', () => {
    const content = '{{#if missing}}Yes{{else}}No{{/if}}';
    expect(renderTemplate(content, {})).toBe('No');
  });

  // --- Loop blocks ---

  it('expands {{#each items}} for each item in array', () => {
    const content = '{{#each items}}{{name}} - {{description}}\n{{/each}}';
    const result = renderTemplate(content, {
      items: [
        { name: 'Alpha', description: 'First item' },
        { name: 'Beta', description: 'Second item' },
      ],
    });
    expect(result).toContain('Alpha - First item');
    expect(result).toContain('Beta - Second item');
  });

  it('handles nested {{property}} tokens inside each blocks using item context', () => {
    const content = '{{#each modules}}## {{name}}\n{{concepts}}\n{{/each}}';
    const result = renderTemplate(content, {
      modules: [
        { name: 'Core', concepts: 'Types and schemas' },
        { name: 'Parser', concepts: 'Markdown parsing' },
      ],
    });
    expect(result).toContain('## Core');
    expect(result).toContain('Types and schemas');
    expect(result).toContain('## Parser');
    expect(result).toContain('Markdown parsing');
  });

  it('produces no output for empty array in {{#each}}', () => {
    const content = 'Before\n{{#each items}}{{name}}\n{{/each}}After';
    const result = renderTemplate(content, { items: [] });
    expect(result).toBe('Before\nAfter');
  });

  it('silently skips non-array value for {{#each}}', () => {
    const content = 'Before\n{{#each items}}{{name}}\n{{/each}}After';
    const result = renderTemplate(content, { items: 'not an array' });
    expect(result).toBe('Before\nAfter');
  });

  it('silently skips missing key for {{#each}}', () => {
    const content = 'Before\n{{#each missing}}{{name}}\n{{/each}}After';
    const result = renderTemplate(content, {});
    expect(result).toBe('Before\nAfter');
  });

  // --- Combined rendering ---

  it('processes each, then if, then simple substitution in correct order', () => {
    const content = [
      '# {{projectName}}',
      '{{#if hasSafety}}Safety: {{safetyNotes}}{{/if}}',
      '{{#each components}}Component: {{name}}',
      '{{/each}}',
      'Version: {{version}}',
    ].join('\n');

    const result = renderTemplate(content, {
      projectName: 'TestProject',
      hasSafety: true,
      safetyNotes: 'Handle with care',
      components: [{ name: 'Alpha' }, { name: 'Beta' }],
      version: '1.0.0',
    });

    expect(result).toContain('# TestProject');
    expect(result).toContain('Safety: Handle with care');
    expect(result).toContain('Component: Alpha');
    expect(result).toContain('Component: Beta');
    expect(result).toContain('Version: 1.0.0');
  });
});

// ===========================================================================
// createTemplateRegistry
// ===========================================================================

describe('createTemplateRegistry', () => {
  it('creates a registry instance via factory function', () => {
    const registry = createTemplateRegistry();
    expect(registry).toBeDefined();
    expect(typeof registry.listAll).toBe('function');
    expect(typeof registry.get).toBe('function');
    expect(typeof registry.getNames).toBe('function');
    expect(typeof registry.register).toBe('function');
  });

  it('listAll() returns metadata for all 7 built-in VTM templates', () => {
    const registry = createTemplateRegistry();
    const all = registry.listAll();
    expect(all.length).toBeGreaterThanOrEqual(7);

    const names = all.map((t) => t.name);
    expect(names).toContain('vision');
    expect(names).toContain('milestone-spec');
    expect(names).toContain('component-spec');
    expect(names).toContain('wave-plan');
    expect(names).toContain('test-plan');
    expect(names).toContain('readme');
    expect(names).toContain('research-reference');
  });

  it('each metadata entry has name, purpose, requiredVariables, optionalVariables, outputFormat', () => {
    const registry = createTemplateRegistry();
    const all = registry.listAll();

    for (const meta of all) {
      expect(meta).toHaveProperty('name');
      expect(meta).toHaveProperty('purpose');
      expect(meta).toHaveProperty('requiredVariables');
      expect(meta).toHaveProperty('optionalVariables');
      expect(meta).toHaveProperty('outputFormat');
      expect(typeof meta.name).toBe('string');
      expect(typeof meta.purpose).toBe('string');
      expect(Array.isArray(meta.requiredVariables)).toBe(true);
      expect(Array.isArray(meta.optionalVariables)).toBe(true);
      expect(typeof meta.outputFormat).toBe('string');
    }
  });

  it('get() returns metadata + loaded template content for a specific template', async () => {
    const registry = createTemplateRegistry();
    const result = await registry.get('vision');
    expect(result).not.toBeNull();
    expect(result!.meta.name).toBe('vision');
    expect(typeof result!.content).toBe('string');
    expect(result!.content.length).toBeGreaterThan(0);
  });

  it('get() returns null for nonexistent template', async () => {
    const registry = createTemplateRegistry();
    const result = await registry.get('nonexistent');
    expect(result).toBeNull();
  });

  it('register() adds custom templates alongside built-in 7', () => {
    const registry = createTemplateRegistry();
    registry.register(
      {
        name: 'custom-report',
        purpose: 'Custom reporting template',
        requiredVariables: ['title', 'content'],
        optionalVariables: ['author'],
        outputFormat: 'markdown',
      },
      '# {{title}}\n\n{{content}}\n\nBy: {{author}}',
    );

    const all = registry.listAll();
    const names = all.map((t) => t.name);
    expect(names).toContain('custom-report');
    expect(all.length).toBeGreaterThanOrEqual(8); // 7 built-in + 1 custom
  });

  it('custom templates appear in listAll() results', () => {
    const registry = createTemplateRegistry();
    registry.register(
      {
        name: 'my-template',
        purpose: 'Test template',
        requiredVariables: ['x'],
        optionalVariables: [],
        outputFormat: 'markdown',
      },
      '# {{x}}',
    );

    const all = registry.listAll();
    const custom = all.find((t) => t.name === 'my-template');
    expect(custom).toBeDefined();
    expect(custom!.purpose).toBe('Test template');
  });

  it('custom templates override built-in templates of the same name', async () => {
    const registry = createTemplateRegistry();
    registry.register(
      {
        name: 'vision',
        purpose: 'Custom vision override',
        requiredVariables: ['title'],
        optionalVariables: [],
        outputFormat: 'markdown',
      },
      '# Custom Vision: {{title}}',
    );

    const result = await registry.get('vision');
    expect(result).not.toBeNull();
    expect(result!.meta.purpose).toBe('Custom vision override');
    expect(result!.content).toBe('# Custom Vision: {{title}}');
  });

  it('getNames() returns sorted array of all registered template names', () => {
    const registry = createTemplateRegistry();
    const names = registry.getNames();

    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBeGreaterThanOrEqual(7);

    // Check sorted
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);

    // All 7 built-in names present
    expect(names).toContain('vision');
    expect(names).toContain('readme');
    expect(names).toContain('component-spec');
  });

  it('getNames() includes custom template names in sorted order', () => {
    const registry = createTemplateRegistry();
    registry.register(
      {
        name: 'aaa-first',
        purpose: 'First alphabetically',
        requiredVariables: [],
        optionalVariables: [],
        outputFormat: 'markdown',
      },
      'content',
    );
    registry.register(
      {
        name: 'zzz-last',
        purpose: 'Last alphabetically',
        requiredVariables: [],
        optionalVariables: [],
        outputFormat: 'markdown',
      },
      'content',
    );

    const names = registry.getNames();
    expect(names[0]).toBe('aaa-first');
    expect(names[names.length - 1]).toBe('zzz-last');
  });
});

// ===========================================================================
// VTM_TEMPLATE_NAMES constant
// ===========================================================================

describe('VTM_TEMPLATE_NAMES', () => {
  it('contains all 7 built-in template names', () => {
    expect(VTM_TEMPLATE_NAMES).toContain('vision');
    expect(VTM_TEMPLATE_NAMES).toContain('milestone-spec');
    expect(VTM_TEMPLATE_NAMES).toContain('component-spec');
    expect(VTM_TEMPLATE_NAMES).toContain('wave-plan');
    expect(VTM_TEMPLATE_NAMES).toContain('test-plan');
    expect(VTM_TEMPLATE_NAMES).toContain('readme');
    expect(VTM_TEMPLATE_NAMES).toContain('research-reference');
    expect(VTM_TEMPLATE_NAMES.length).toBe(7);
  });
});

// ===========================================================================
// validateRenderedTemplate
// ===========================================================================

describe('validateRenderedTemplate', () => {
  // --- Helper: minimal valid VisionDocument data ---
  const validVisionData = {
    name: 'test-pack',
    date: '2026-01-01',
    status: 'initial-vision',
    dependsOn: [],
    context: 'Test context',
    vision: 'Test vision',
    problemStatement: [{ name: 'P1', description: 'Problem 1' }],
    coreConcept: {
      interactionModel: 'Test model',
      description: 'Test description',
    },
    architecture: {
      connections: [{ from: 'A', to: 'B', relationship: 'uses' }],
    },
    modules: [{ name: 'core', concepts: ['types'] }],
    chipsetConfig: {
      name: 'test-chip',
      version: '1.0.0',
      description: 'Test chipset',
      skills: { 'skill-a': { domain: 'test', description: 'Test skill' } },
      agents: {
        topology: 'pipeline',
        agents: [{ name: 'agent-a', role: 'builder' }],
      },
      evaluation: {
        gates: {
          preDeploy: [{ check: 'test_coverage', action: 'block' }],
        },
      },
    },
    successCriteria: ['All tests pass'],
    throughLine: 'Test alignment',
  };

  it('validates a fully-populated VisionDocument and returns valid: true', () => {
    const result = validateRenderedTemplate(
      'vision',
      '# Rendered vision document content',
      validVisionData,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('reports missing required fields as errors with severity error', () => {
    const incomplete = { ...validVisionData, name: undefined };
    // Remove the name field entirely
    delete (incomplete as Record<string, unknown>).name;

    const result = validateRenderedTemplate(
      'vision',
      '# Vision doc',
      incomplete,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);

    const nameError = result.errors.find((e) => e.section === 'name');
    expect(nameError).toBeDefined();
    expect(nameError!.severity).toBe('error');
  });

  it('reports multiple missing required fields collecting ALL errors', () => {
    const incomplete: Record<string, unknown> = { ...validVisionData };
    delete incomplete.name;
    delete incomplete.date;
    delete incomplete.vision;

    const result = validateRenderedTemplate(
      'vision',
      '# Vision doc',
      incomplete,
    );
    expect(result.valid).toBe(false);
    // Should have at least 3 errors (one for each deleted field)
    expect(result.errors.length).toBeGreaterThanOrEqual(3);

    const sections = result.errors.map((e) => e.section);
    expect(sections).toContain('name');
    expect(sections).toContain('date');
    expect(sections).toContain('vision');
  });

  it('reports invalid field values (e.g., invalid enum) as errors', () => {
    const invalid = { ...validVisionData, status: 'invalid-status-value' };
    const result = validateRenderedTemplate(
      'vision',
      '# Vision doc',
      invalid,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);

    const statusError = result.errors.find((e) => e.section === 'status');
    expect(statusError).toBeDefined();
    expect(statusError!.severity).toBe('error');
  });

  it('reports unresolved {{placeholder}} tokens as warnings', () => {
    const result = validateRenderedTemplate(
      'vision',
      '# {{title}}\n\nContent with {{unresolved}} placeholders',
      validVisionData,
    );
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);

    const titleWarning = result.warnings.find((w) => w.section === 'title');
    expect(titleWarning).toBeDefined();
    expect(titleWarning!.severity).toBe('warning');
    expect(titleWarning!.message).toContain('{{title}}');
  });

  it('reports one warning per unique placeholder, not per occurrence', () => {
    const result = validateRenderedTemplate(
      'vision',
      '{{foo}} and {{foo}} and {{bar}}',
      validVisionData,
    );
    const fooWarnings = result.warnings.filter((w) => w.section === 'foo');
    expect(fooWarnings.length).toBe(1);

    const barWarnings = result.warnings.filter((w) => w.section === 'bar');
    expect(barWarnings.length).toBe(1);
  });

  it('reports both schema errors AND unresolved placeholders together', () => {
    const incomplete: Record<string, unknown> = { ...validVisionData };
    delete incomplete.name;

    const result = validateRenderedTemplate(
      'vision',
      '# {{unresolved}} content',
      incomplete,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1); // schema error
    expect(result.warnings.length).toBeGreaterThanOrEqual(1); // placeholder warning
  });

  it('returns valid: true when no errors exist even if warnings present', () => {
    const result = validateRenderedTemplate(
      'vision',
      '# {{placeholder}} in content',
      validVisionData,
    );
    // No schema errors since data is valid, but has placeholder warnings
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
  });

  it('validates ComponentSpec against ComponentSpecSchema', () => {
    const validComponentSpec = {
      name: 'test-component',
      milestone: 'v1',
      wave: 'Wave 1, Track A',
      modelAssignment: 'sonnet',
      estimatedTokens: 5000,
      dependencies: [],
      produces: ['output.ts'],
      objective: 'Build test component',
      context: 'Self-contained context',
      technicalSpec: [{ name: 'API', spec: 'REST interface' }],
      implementationSteps: [{ name: 'Step 1', description: 'Do thing' }],
      testCases: [{ name: 'Test 1', input: 'x', expected: 'y' }],
      verificationGate: {
        conditions: ['All tests pass'],
        handoff: 'Ready for review',
      },
    };

    const result = validateRenderedTemplate(
      'component-spec',
      '# Component spec',
      validComponentSpec,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('validates TestPlan against TestPlanSchema', () => {
    const validTestPlan = {
      milestoneName: 'v1',
      milestoneSpec: 'v1-spec.md',
      visionDocument: 'vision.md',
      totalTests: 5,
      safetyCriticalCount: 1,
      targetCoverage: 80,
      categories: [
        { name: 'safety-critical', count: 1, priority: 'mandatory-pass', failureAction: 'block' },
      ],
      tests: [
        { id: 'S-001', category: 'safety-critical', verifies: 'Safety check', expectedBehavior: 'Blocks unsafe input' },
      ],
      verificationMatrix: [
        { criterion: 'Safety', testIds: ['S-001'] },
      ],
    };

    const result = validateRenderedTemplate(
      'test-plan',
      '# Test plan',
      validTestPlan,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('validates WaveExecutionPlan against WaveExecutionPlanSchema', () => {
    const validWavePlan = {
      milestoneName: 'v1',
      milestoneSpec: 'v1-spec.md',
      totalTasks: 3,
      parallelTracks: 2,
      sequentialDepth: 1,
      estimatedWallTime: '2 hours',
      criticalPath: 'A -> B -> C',
      waveSummary: [
        { wave: 1, tasks: 3, parallelTracks: 2, estimatedTime: '1h', cacheDependencies: 'none' },
      ],
      waves: [
        {
          number: 1,
          name: 'Foundation',
          purpose: 'Build core',
          isSequential: false,
          tracks: [
            {
              name: 'Track A',
              tasks: [
                { id: 'task-a', description: 'Build A', produces: 'a.ts', model: 'sonnet', estimatedTokens: 1000, dependsOn: [] },
              ],
            },
          ],
        },
      ],
    };

    const result = validateRenderedTemplate(
      'wave-plan',
      '# Wave plan',
      validWavePlan,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('returns error diagnostic for unknown template name', () => {
    const result = validateRenderedTemplate(
      'nonexistent-template',
      '# Some content',
      {},
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].section).toBe('templateName');
    expect(result.errors[0].severity).toBe('error');
    expect(result.errors[0].message).toContain('nonexistent-template');
  });

  it('each diagnostic has section field pointing to the Zod path', () => {
    // Invalid chipsetConfig.agents (empty agents array violates .min(1))
    const invalid = {
      ...validVisionData,
      chipsetConfig: {
        ...validVisionData.chipsetConfig,
        agents: {
          topology: 'pipeline',
          agents: [], // violates .min(1)
        },
      },
    };

    const result = validateRenderedTemplate(
      'vision',
      '# Vision doc',
      invalid,
    );
    expect(result.valid).toBe(false);

    // Should have a deep path like "chipsetConfig.agents.agents"
    const deepError = result.errors.find((e) =>
      e.section.startsWith('chipsetConfig.agents'),
    );
    expect(deepError).toBeDefined();
    expect(deepError!.severity).toBe('error');
  });

  it('computes line number for unresolved placeholder in rendered content', () => {
    const content = [
      'Line 1: resolved',
      'Line 2: also resolved',
      'Line 3: {{unresolvedHere}}',
      'Line 4: done',
    ].join('\n');

    const result = validateRenderedTemplate('vision', content, validVisionData);
    const warning = result.warnings.find((w) => w.section === 'unresolvedHere');
    expect(warning).toBeDefined();
    expect(warning!.line).toBe(3);
  });

  it('detects unresolved block tokens as warnings', () => {
    const content = '# Title\n{{#if condition}}block content{{/if}}\n{{#each items}}item{{/each}}\n{{else}}';
    const result = validateRenderedTemplate('vision', content, validVisionData);

    // Should detect unresolved block tokens
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    const blockWarnings = result.warnings.filter(
      (w) => w.message.includes('Unresolved block token'),
    );
    expect(blockWarnings.length).toBeGreaterThanOrEqual(1);
  });

  it('handles readme template (no schema) gracefully', () => {
    const result = validateRenderedTemplate(
      'readme',
      '# README content',
      {},
    );
    // readme has no structured schema -- should succeed (no schema to validate against)
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

// ===========================================================================
// Barrel export
// ===========================================================================

describe('barrel export', () => {
  it('exports loadTemplate, renderTemplate, createTemplateRegistry, validateRenderedTemplate from index', async () => {
    const barrel = await import('../index.js');
    expect(typeof barrel.loadTemplate).toBe('function');
    expect(typeof barrel.renderTemplate).toBe('function');
    expect(typeof barrel.createTemplateRegistry).toBe('function');
    expect(typeof barrel.validateRenderedTemplate).toBe('function');
  });
});
