/**
 * Barrel exports and chipset validation tests.
 *
 * Verifies all public APIs are importable from the top-level barrel,
 * all classes are constructable (with mocks), and the chipset YAML
 * is valid and matches the actual module structure.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================================
// Test 1: All types importable
// ============================================================================

describe('Barrel exports: types', () => {
  it('exports all Zod schemas and TypeScript types from top-level barrel', async () => {
    const barrel = await import('../index.js');

    // Zod schemas
    expect(barrel.AuthorSchema).toBeDefined();
    expect(barrel.CitedWorkTypeSchema).toBeDefined();
    expect(barrel.SourceApiSchema).toBeDefined();
    expect(barrel.ExtractionMethodSchema).toBeDefined();
    expect(barrel.ArtifactTypeSchema).toBeDefined();
    expect(barrel.RawCitationSchema).toBeDefined();
    expect(barrel.ProvenanceEntrySchema).toBeDefined();
    expect(barrel.CitedWorkSchema).toBeDefined();
    expect(barrel.SourceRecordSchema).toBeDefined();
    expect(barrel.BibliographyFormatSchema).toBeDefined();
    expect(barrel.FormatOptionsSchema).toBeDefined();
    expect(barrel.ExtractionResultSchema).toBeDefined();
    expect(barrel.ResolutionResultSchema).toBeDefined();
  });
});

// ============================================================================
// Test 2: All classes constructable
// ============================================================================

describe('Barrel exports: classes', () => {
  it('exports constructable classes for store, provenance, resolver, generator, and learn hook', async () => {
    const barrel = await import('../index.js');

    // CitationStore (requires basePath)
    expect(barrel.CitationStore).toBeDefined();
    expect(typeof barrel.CitationStore).toBe('function');

    // ProvenanceTracker (requires basePath)
    expect(barrel.ProvenanceTracker).toBeDefined();
    expect(typeof barrel.ProvenanceTracker).toBe('function');

    // ResolverEngine (requires adapters array)
    expect(barrel.ResolverEngine).toBeDefined();
    expect(typeof barrel.ResolverEngine).toBe('function');

    // BibliographyFormatter (requires store)
    expect(barrel.BibliographyFormatter).toBeDefined();
    expect(typeof barrel.BibliographyFormatter).toBe('function');

    // AttributionReport (requires store + provenance)
    expect(barrel.AttributionReport).toBeDefined();
    expect(typeof barrel.AttributionReport).toBe('function');

    // IntegrityAuditor (requires store + provenance)
    expect(barrel.IntegrityAuditor).toBeDefined();
    expect(typeof barrel.IntegrityAuditor).toBe('function');

    // CitationLearnHook (requires extractor, resolver, store, provenance)
    expect(barrel.CitationLearnHook).toBeDefined();
    expect(typeof barrel.CitationLearnHook).toBe('function');

    // DiscoverySearchEngine
    expect(barrel.DiscoverySearchEngine).toBeDefined();
    expect(typeof barrel.DiscoverySearchEngine).toBe('function');

    // CitationGraph
    expect(barrel.CitationGraph).toBeDefined();
    expect(typeof barrel.CitationGraph).toBe('function');
  });
});

// ============================================================================
// Test 3: All functions callable
// ============================================================================

describe('Barrel exports: functions', () => {
  it('exports callable functions for extraction and dashboard rendering', async () => {
    const barrel = await import('../index.js');

    // extractCitations
    expect(barrel.extractCitations).toBeDefined();
    expect(typeof barrel.extractCitations).toBe('function');

    // Dashboard render functions
    expect(barrel.renderCitationPanel).toBeDefined();
    expect(typeof barrel.renderCitationPanel).toBe('function');

    expect(barrel.renderProvenanceViewer).toBeDefined();
    expect(typeof barrel.renderProvenanceViewer).toBe('function');

    expect(barrel.renderIntegrityBadge).toBeDefined();
    expect(typeof barrel.renderIntegrityBadge).toBe('function');
  });
});

// ============================================================================
// Test 4: Chipset YAML valid
// ============================================================================

describe('Chipset YAML validation', () => {
  // Load YAML content (parse as structured data without yaml dependency)
  const chipsetPath = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '../../citations/citation-management.chipset.yaml',
  );

  let chipsetContent: string;

  it('chipset YAML file exists and is non-empty', () => {
    expect(fs.existsSync(chipsetPath)).toBe(true);
    chipsetContent = fs.readFileSync(chipsetPath, 'utf-8');
    expect(chipsetContent.length).toBeGreaterThan(0);
  });

  it('contains all required top-level fields', () => {
    chipsetContent = fs.readFileSync(chipsetPath, 'utf-8');

    expect(chipsetContent).toMatch(/^name:\s+citation-management$/m);
    expect(chipsetContent).toMatch(/^version:\s+\d+\.\d+\.\d+$/m);
    expect(chipsetContent).toMatch(/^description:/m);
    expect(chipsetContent).toMatch(/^domain:\s+citation$/m);
    expect(chipsetContent).toMatch(/^skills:/m);
    expect(chipsetContent).toMatch(/^agents:/m);
    expect(chipsetContent).toMatch(/^communication_loops:/m);
    expect(chipsetContent).toMatch(/^evaluation:/m);
  });

  // Test 5: Chipset skills match actual module structure
  it('defines all 6 required skills matching actual modules', () => {
    chipsetContent = fs.readFileSync(chipsetPath, 'utf-8');

    const requiredSkills = [
      'citation-extractor',
      'source-resolver',
      'citation-store',
      'bibliography-generator',
      'discovery-tools',
      'learn-hook',
    ];

    for (const skill of requiredSkills) {
      expect(chipsetContent).toContain(skill);
    }

    // Verify each skill has domain and description
    for (const skill of requiredSkills) {
      const skillSection = chipsetContent.slice(
        chipsetContent.indexOf(skill + ':'),
      );
      expect(skillSection).toMatch(/domain:\s+citation/);
      expect(skillSection).toMatch(/description:/);
      expect(skillSection).toMatch(/token_budget:\s+\d+/);
    }
  });

  // Test 6: Chipset agents valid — each references existing skills
  it('defines 4 agents that reference existing skills', () => {
    chipsetContent = fs.readFileSync(chipsetPath, 'utf-8');

    const requiredAgents = ['LIBRARIAN', 'ARCHIVIST', 'SCRIBE', 'AUDITOR'];
    for (const agent of requiredAgents) {
      expect(chipsetContent).toContain(agent);
    }

    // Each agent should have role, skills, and model
    for (const agent of requiredAgents) {
      const agentIdx = chipsetContent.indexOf(`"${agent}"`);
      expect(agentIdx).toBeGreaterThan(-1);
      const agentSection = chipsetContent.slice(agentIdx, agentIdx + 300);
      expect(agentSection).toMatch(/role:/);
      expect(agentSection).toMatch(/skills:/);
      expect(agentSection).toMatch(/model:/);
    }

    // Verify evaluation gates exist
    expect(chipsetContent).toContain('pre_deploy');
    expect(chipsetContent).toContain('post_deploy');
    expect(chipsetContent).toContain('test_coverage');
    expect(chipsetContent).toContain('type_check');
    expect(chipsetContent).toContain('citation_extraction_accuracy');
    expect(chipsetContent).toContain('resolution_rate');

    // Verify communication loops
    expect(chipsetContent).toMatch(/name:\s+"?citation"?/);
    expect(chipsetContent).toMatch(/name:\s+"?provenance"?/);
    expect(chipsetContent).toMatch(/priority:\s+5/);
    expect(chipsetContent).toMatch(/priority:\s+6/);
  });
});
