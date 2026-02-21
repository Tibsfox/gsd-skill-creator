/**
 * Tests for VTM vision document parser and dependency extractor.
 *
 * Covers parseVisionDocument() and extractDependencies() functions:
 * - Parses complete vision document markdown into typed VisionDocument objects
 * - Extracts structured sections: name, date, status, vision, problems, etc.
 * - Parses embedded YAML chipset configuration
 * - Extracts modules from ## Module N: Name headers
 * - Dependency extraction from header and relationship table
 * - Structured error handling for invalid/malformed input
 */

import { describe, it, expect } from 'vitest';
import { parseVisionDocument, extractDependencies } from '../vision-parser.js';
import type { VisionDocument } from '../types.js';

// ---------------------------------------------------------------------------
// Test fixture: generates a valid vision document markdown string
// ---------------------------------------------------------------------------

function createVisionMarkdown(overrides?: {
  name?: string;
  date?: string;
  status?: string;
  dependsOn?: string;
  context?: string;
  vision?: string;
  problemStatement?: string;
  coreConcept?: string;
  architecture?: string;
  modules?: string;
  chipset?: string;
  successCriteria?: string;
  relationships?: string;
  throughLine?: string;
  omitSections?: string[];
}): string {
  const o = overrides ?? {};
  const omit = new Set(o.omitSections ?? []);

  const header = [
    `# ${o.name ?? 'Test Pack'} -- Vision Guide`,
    '',
    `**Date:** ${o.date ?? '2026-01-15'}`,
    `**Status:** ${o.status ?? 'Initial Vision'}`,
    `**Depends on:** ${o.dependsOn ?? 'core-platform, auth-module'}`,
    `**Context:** ${o.context ?? 'A test vision document for parser validation.'}`,
    '',
    '---',
  ].join('\n');

  const vision = omit.has('vision') ? '' : [
    '',
    '## Vision',
    '',
    o.vision ?? 'This is the vision narrative. It tells the story of why this matters.',
    '',
    '---',
  ].join('\n');

  const problemStatement = omit.has('problemStatement') ? '' : [
    '',
    '## Problem Statement',
    '',
    o.problemStatement ?? [
      '1. **Complexity Gap.** Users face too much complexity when starting.',
      '',
      '2. **Missing Guardrails.** No safety boundaries exist for beginners.',
      '',
      '3. **Fragmented Tools.** Tools are scattered across multiple systems.',
    ].join('\n'),
    '',
    '---',
  ].join('\n');

  const coreConcept = omit.has('coreConcept') ? '' : [
    '',
    '## Core Concept',
    '',
    o.coreConcept ?? [
      '**Explore, Try, Practice, Understand, Integrate.**',
      '',
      'Users begin with exploration and progress through guided practice.',
      '',
      '### Learning Environment',
      '',
      '```',
      '+-----------+     +-----------+',
      '| Module A  | --> | Module B  |',
      '+-----------+     +-----------+',
      '```',
      '',
      'The diagram shows how modules connect in the learning flow.',
    ].join('\n'),
    '',
    '---',
  ].join('\n');

  const architecture = omit.has('architecture') ? '' : [
    '',
    '## Architecture',
    '',
    o.architecture ?? [
      '### Module/Component Map',
      '',
      '```',
      'Core',
      '  +-- Module A',
      '  +-- Module B',
      '```',
      '',
      '**Cross-component connections:**',
      '- Module A -> Module B -- data flow',
      '- Module B -> Module C -- event notification',
    ].join('\n'),
    '',
    '---',
  ].join('\n');

  const modules = omit.has('modules') ? '' : [
    '',
    o.modules ?? [
      '## Module 1: Foundations',
      '',
      '**What the user learns/gets:**',
      '- Basic concepts',
      '- Core terminology',
      '- Safety awareness',
      '',
      '**Try Session:** "Hello World" -- A simple introductory exercise.',
      '',
      '**Safety considerations:** Always use protective equipment.',
      '',
      '---',
      '',
      '## Module 2: Advanced Topics',
      '',
      '**What the user learns/gets:**',
      '- Deep analysis',
      '- System integration',
      '',
      '**Try Session:** "Deep Dive" -- Explore advanced patterns.',
    ].join('\n'),
    '',
    '---',
  ].join('\n');

  const chipset = omit.has('chipset') ? '' : [
    '',
    '## Skill-Creator Integration',
    '',
    '### Chipset Configuration',
    '',
    o.chipset ?? [
      '```yaml',
      'name: test-pack',
      'version: 1.0.0',
      'description: A test pack for validation',
      '',
      'skills:',
      '  test-skill:',
      '    domain: testing',
      '    description: "Validates test functionality"',
      '',
      'agents:',
      '  topology: pipeline',
      '  agents:',
      '    - name: test-agent',
      '      role: "Runs test validation"',
      '',
      'evaluation:',
      '  gates:',
      '    preDeploy:',
      '      - check: test_coverage',
      '        threshold: 80',
      '        action: block',
      '```',
    ].join('\n'),
    '',
    '---',
  ].join('\n');

  const successCriteria = omit.has('successCriteria') ? '' : [
    '',
    '## Success Criteria',
    '',
    o.successCriteria ?? [
      '1. Users can complete the introductory module in under 15 minutes',
      '',
      '2. All safety boundaries are enforced at runtime',
      '',
      '3. Test coverage exceeds 80% across all modules',
    ].join('\n'),
    '',
    '---',
  ].join('\n');

  const relationships = omit.has('relationships') ? '' : [
    '',
    '## Relationship to Other Vision Documents',
    '',
    o.relationships ?? [
      '| Document | Relationship |',
      '|----------|-------------|',
      '| core-platform.md | Provides base infrastructure |',
      '| auth-module.md | Handles user authentication |',
    ].join('\n'),
    '',
    '---',
  ].join('\n');

  const throughLine = omit.has('throughLine') ? '' : [
    '',
    '## The Through-Line',
    '',
    o.throughLine ?? 'This vision connects to the broader ecosystem through progressive disclosure and the Amiga Principle.',
    '',
    '---',
  ].join('\n');

  return [header, vision, problemStatement, coreConcept, architecture, modules, chipset, successCriteria, relationships, throughLine].join('\n');
}

// ---------------------------------------------------------------------------
// parseVisionDocument tests (VDOC-01)
// ---------------------------------------------------------------------------

describe('parseVisionDocument', () => {
  it('parses a complete valid vision document and returns a VisionDocument', () => {
    const md = createVisionMarkdown();
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Pack');
      expect(result.data.date).toBe('2026-01-15');
      expect(result.data.status).toBe('initial-vision');
    }
  });

  it('extracts name from the H1 header', () => {
    const md = createVisionMarkdown({ name: 'Electronics Fundamentals' });
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Electronics Fundamentals');
    }
  });

  it('extracts date from **Date:** line', () => {
    const md = createVisionMarkdown({ date: '2025-12-31' });
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBe('2025-12-31');
    }
  });

  it('extracts status and maps to enum value', () => {
    const cases: Array<[string, string]> = [
      ['Initial Vision', 'initial-vision'],
      ['Pre-Research', 'pre-research'],
      ['Research Complete', 'research-complete'],
      ['Mission Ready', 'mission-ready'],
    ];

    for (const [input, expected] of cases) {
      const md = createVisionMarkdown({ status: input });
      const result = parseVisionDocument(md);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(expected);
      }
    }
  });

  it('extracts dependsOn from **Depends on:** line as string array', () => {
    const md = createVisionMarkdown({ dependsOn: 'alpha, beta, gamma' });
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dependsOn).toEqual(['alpha', 'beta', 'gamma']);
    }
  });

  it('extracts context from **Context:** line', () => {
    const md = createVisionMarkdown({ context: 'Custom context statement.' });
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.context).toBe('Custom context statement.');
    }
  });

  it('extracts vision section text', () => {
    const md = createVisionMarkdown({ vision: 'A compelling vision narrative about the future.' });
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vision).toContain('compelling vision narrative');
    }
  });

  it('extracts problem statements from numbered items with **Name.** pattern', () => {
    const md = createVisionMarkdown();
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.problemStatement).toHaveLength(3);
      expect(result.data.problemStatement[0].name).toBe('Complexity Gap');
      expect(result.data.problemStatement[0].description).toContain('too much complexity');
      expect(result.data.problemStatement[1].name).toBe('Missing Guardrails');
      expect(result.data.problemStatement[2].name).toBe('Fragmented Tools');
    }
  });

  it('extracts core concept: interaction model, description, and diagram', () => {
    const md = createVisionMarkdown();
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.coreConcept.interactionModel).toContain('Explore');
      expect(result.data.coreConcept.description).toContain('exploration');
      expect(result.data.coreConcept.diagram).toBeDefined();
      expect(result.data.coreConcept.diagram).toContain('Module A');
    }
  });

  it('extracts architecture: moduleMap and connections', () => {
    const md = createVisionMarkdown();
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.architecture.moduleMap).toContain('Core');
      expect(result.data.architecture.connections).toHaveLength(2);
      expect(result.data.architecture.connections[0].from).toBe('Module A');
      expect(result.data.architecture.connections[0].to).toBe('Module B');
      expect(result.data.architecture.connections[0].relationship).toContain('data flow');
    }
  });

  it('extracts modules from ## Module N: Name headers', () => {
    const md = createVisionMarkdown();
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.modules).toHaveLength(2);
      expect(result.data.modules[0].name).toBe('Foundations');
      expect(result.data.modules[0].concepts).toContain('Basic concepts');
      expect(result.data.modules[0].concepts).toContain('Core terminology');
      expect(result.data.modules[0].concepts).toContain('Safety awareness');
      expect(result.data.modules[0].trySession).toBeDefined();
      expect(result.data.modules[0].trySession!.name).toBe('Hello World');
      expect(result.data.modules[0].safetyConcerns).toContain('protective equipment');
      expect(result.data.modules[1].name).toBe('Advanced Topics');
      expect(result.data.modules[1].concepts).toHaveLength(2);
    }
  });

  it('extracts chipset config from YAML code block', () => {
    const md = createVisionMarkdown();
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chipsetConfig.name).toBe('test-pack');
      expect(result.data.chipsetConfig.version).toBe('1.0.0');
      expect(result.data.chipsetConfig.skills['test-skill']).toBeDefined();
      expect(result.data.chipsetConfig.agents.topology).toBe('pipeline');
      expect(result.data.chipsetConfig.agents.agents).toHaveLength(1);
      expect(result.data.chipsetConfig.evaluation.gates.preDeploy).toHaveLength(1);
    }
  });

  it('extracts success criteria from numbered list', () => {
    const md = createVisionMarkdown();
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.successCriteria).toHaveLength(3);
      expect(result.data.successCriteria[0]).toContain('introductory module');
      expect(result.data.successCriteria[1]).toContain('safety boundaries');
    }
  });

  it('extracts relationships from table rows', () => {
    const md = createVisionMarkdown();
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.relationships).toHaveLength(2);
      expect(result.data.relationships![0].document).toBe('core-platform.md');
      expect(result.data.relationships![0].relationship).toContain('base infrastructure');
      expect(result.data.relationships![1].document).toBe('auth-module.md');
    }
  });

  it('extracts throughLine section text', () => {
    const md = createVisionMarkdown({ throughLine: 'Everything connects through progressive disclosure.' });
    const result = parseVisionDocument(md);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.throughLine).toContain('progressive disclosure');
    }
  });

  it('returns parse error result when H1 header is missing', () => {
    const md = createVisionMarkdown().replace(/^# .+$/m, '');
    const result = parseVisionDocument(md);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.section === 'header' || e.message.toLowerCase().includes('header') || e.message.toLowerCase().includes('name'))).toBe(true);
    }
  });

  it('returns parse error result when required sections are missing', () => {
    const md = createVisionMarkdown({ omitSections: ['vision', 'problemStatement', 'throughLine'] });
    const result = parseVisionDocument(md);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('handles sections with no content gracefully', () => {
    const md = createVisionMarkdown({
      vision: '',
      throughLine: '',
    });
    const result = parseVisionDocument(md);

    // Should fail validation because vision and throughLine require min(1) content
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// extractDependencies tests (VDOC-05)
// ---------------------------------------------------------------------------

describe('extractDependencies', () => {
  it('extracts dependency list from **Depends on:** header line', () => {
    const md = createVisionMarkdown({ dependsOn: 'alpha, beta' });
    const deps = extractDependencies(md);

    expect(deps).toContain('alpha');
    expect(deps).toContain('beta');
  });

  it('extracts dependencies from relationship table rows', () => {
    const md = createVisionMarkdown({
      dependsOn: 'None',
      relationships: [
        '| Document | Relationship |',
        '|----------|-------------|',
        '| core-platform.md | Provides base |',
        '| auth-module.md | Handles auth |',
      ].join('\n'),
    });
    const deps = extractDependencies(md);

    expect(deps).toContain('core-platform.md');
    expect(deps).toContain('auth-module.md');
  });

  it('returns combined unique list from both sources', () => {
    const md = createVisionMarkdown({
      dependsOn: 'core-platform.md, extra-dep',
      relationships: [
        '| Document | Relationship |',
        '|----------|-------------|',
        '| core-platform.md | Provides base |',
        '| auth-module.md | Handles auth |',
      ].join('\n'),
    });
    const deps = extractDependencies(md);

    // core-platform.md appears in both sources but should be deduplicated
    expect(deps.filter(d => d === 'core-platform.md')).toHaveLength(1);
    expect(deps).toContain('extra-dep');
    expect(deps).toContain('auth-module.md');
  });

  it('returns empty array when no dependencies found', () => {
    const md = [
      '# No Deps Pack -- Vision Guide',
      '',
      '**Date:** 2026-01-01',
      '**Status:** Initial Vision',
      '**Context:** Standalone document.',
      '',
      '---',
    ].join('\n');
    const deps = extractDependencies(md);

    expect(deps).toEqual([]);
  });

  it('handles "None" or empty depends-on value', () => {
    const mdNone = createVisionMarkdown({ dependsOn: 'None' });
    const depsNone = extractDependencies(mdNone);
    // "None" should not appear as a dependency; table deps still count
    expect(depsNone).not.toContain('None');

    const mdEmpty = createVisionMarkdown({ dependsOn: '' });
    const depsEmpty = extractDependencies(mdEmpty);
    expect(depsEmpty.every(d => d.trim().length > 0)).toBe(true);
  });
});
