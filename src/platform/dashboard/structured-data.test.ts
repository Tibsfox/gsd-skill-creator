/**
 * Tests for JSON-LD structured data and OG meta tag generation.
 *
 * Covers:
 * - generateProjectJsonLd returns valid JSON-LD with @context, @type SoftwareSourceCode
 * - generateMilestonesJsonLd returns ItemList with milestone entries
 * - generateRoadmapJsonLd returns ItemList with phase entries
 * - OG meta tags are present in all generated pages (integration via generator)
 * - JSON-LD script tags are embedded in all generated pages
 */

import { describe, it, expect } from 'vitest';
import type {
  DashboardData,
  ProjectData,
  MilestonesData,
  RoadmapData,
} from './types.js';
import {
  generateProjectJsonLd,
  generateMilestonesJsonLd,
  generateRoadmapJsonLd,
} from './structured-data.js';
import { renderLayout } from './renderer.js';
import { renderStyles } from './styles.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleProject: ProjectData = {
  name: 'gsd-skill-creator',
  description: 'Adaptive learning layer for Claude Code',
  currentMilestone: { name: 'GSD Planning Docs Dashboard', version: 'v1.12' },
  context: ['TypeScript project'],
  constraints: ['Must work offline'],
  decisions: [
    {
      decision: 'Use Schema.org',
      rationale: 'Industry standard',
      outcome: 'JSON-LD on all pages',
    },
  ],
};

const sampleMilestones: MilestonesData = {
  milestones: [
    {
      version: 'v1.0',
      name: 'First Release',
      goal: 'Ship the initial version',
      shipped: '2026-01-15',
      stats: { requirements: 10, phases: 3, plans: 8 },
      accomplishments: ['Core engine', 'CLI'],
    },
    {
      version: 'v1.1',
      name: 'Second Release',
      goal: 'Add validation',
      shipped: '2026-02-01',
      stats: { requirements: 5, phases: 2, plans: 4 },
    },
  ],
  totals: { milestones: 2, phases: 5, plans: 12 },
};

const sampleRoadmap: RoadmapData = {
  phases: [
    {
      number: 88,
      name: 'Foundation',
      status: 'complete',
      goal: 'Build core infrastructure',
      requirements: ['REQ-01'],
      deliverables: ['Core module'],
    },
    {
      number: 89,
      name: 'Pages',
      status: 'active',
      goal: 'Build individual pages',
      requirements: ['REQ-05'],
      deliverables: ['Page renderers'],
    },
  ],
  totalPhases: 2,
};

const sampleDashboardData: DashboardData = {
  project: sampleProject,
  milestones: sampleMilestones,
  roadmap: sampleRoadmap,
  generatedAt: '2026-02-12T10:00:00Z',
};

// ---------------------------------------------------------------------------
// generateProjectJsonLd
// ---------------------------------------------------------------------------

describe('generateProjectJsonLd', () => {
  it('returns a valid JSON string', () => {
    const result = generateProjectJsonLd(sampleDashboardData);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('includes @context pointing to schema.org', () => {
    const parsed = JSON.parse(generateProjectJsonLd(sampleDashboardData));
    expect(parsed['@context']).toBe('https://schema.org');
  });

  it('uses @type SoftwareSourceCode', () => {
    const parsed = JSON.parse(generateProjectJsonLd(sampleDashboardData));
    expect(parsed['@type']).toBe('SoftwareSourceCode');
  });

  it('includes project name', () => {
    const parsed = JSON.parse(generateProjectJsonLd(sampleDashboardData));
    expect(parsed.name).toBe('gsd-skill-creator');
  });

  it('includes project description', () => {
    const parsed = JSON.parse(generateProjectJsonLd(sampleDashboardData));
    expect(parsed.description).toBe('Adaptive learning layer for Claude Code');
  });

  it('includes dateModified from generatedAt', () => {
    const parsed = JSON.parse(generateProjectJsonLd(sampleDashboardData));
    expect(parsed.dateModified).toBe('2026-02-12T10:00:00Z');
  });

  it('includes programmingLanguage as TypeScript', () => {
    const parsed = JSON.parse(generateProjectJsonLd(sampleDashboardData));
    expect(parsed.programmingLanguage).toBe('TypeScript');
  });

  it('handles missing project data gracefully', () => {
    const data: DashboardData = { generatedAt: '2026-02-12T10:00:00Z' };
    const result = generateProjectJsonLd(data);
    const parsed = JSON.parse(result);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('SoftwareSourceCode');
    expect(parsed.name).toBe('GSD Dashboard');
  });
});

// ---------------------------------------------------------------------------
// generateMilestonesJsonLd
// ---------------------------------------------------------------------------

describe('generateMilestonesJsonLd', () => {
  it('returns a valid JSON string', () => {
    const result = generateMilestonesJsonLd(sampleDashboardData);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('includes @context pointing to schema.org', () => {
    const parsed = JSON.parse(generateMilestonesJsonLd(sampleDashboardData));
    expect(parsed['@context']).toBe('https://schema.org');
  });

  it('uses @type ItemList', () => {
    const parsed = JSON.parse(generateMilestonesJsonLd(sampleDashboardData));
    expect(parsed['@type']).toBe('ItemList');
  });

  it('has correct number of itemListElement entries', () => {
    const parsed = JSON.parse(generateMilestonesJsonLd(sampleDashboardData));
    expect(parsed.itemListElement).toHaveLength(2);
  });

  it('each item has @type ListItem and position', () => {
    const parsed = JSON.parse(generateMilestonesJsonLd(sampleDashboardData));
    for (let i = 0; i < parsed.itemListElement.length; i++) {
      const item = parsed.itemListElement[i];
      expect(item['@type']).toBe('ListItem');
      expect(item.position).toBe(i + 1);
    }
  });

  it('each item contains milestone name and description', () => {
    const parsed = JSON.parse(generateMilestonesJsonLd(sampleDashboardData));
    const first = parsed.itemListElement[0].item;
    expect(first.name).toBe('v1.0 — First Release');
    expect(first.description).toBe('Ship the initial version');
  });

  it('handles missing milestones data', () => {
    const data: DashboardData = { generatedAt: '2026-02-12T10:00:00Z' };
    const parsed = JSON.parse(generateMilestonesJsonLd(data));
    expect(parsed['@type']).toBe('ItemList');
    expect(parsed.itemListElement).toHaveLength(0);
  });

  it('includes numberOfItems matching milestone count', () => {
    const parsed = JSON.parse(generateMilestonesJsonLd(sampleDashboardData));
    expect(parsed.numberOfItems).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// generateRoadmapJsonLd
// ---------------------------------------------------------------------------

describe('generateRoadmapJsonLd', () => {
  it('returns a valid JSON string', () => {
    const result = generateRoadmapJsonLd(sampleDashboardData);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('includes @context pointing to schema.org', () => {
    const parsed = JSON.parse(generateRoadmapJsonLd(sampleDashboardData));
    expect(parsed['@context']).toBe('https://schema.org');
  });

  it('uses @type ItemList', () => {
    const parsed = JSON.parse(generateRoadmapJsonLd(sampleDashboardData));
    expect(parsed['@type']).toBe('ItemList');
  });

  it('has correct number of itemListElement entries', () => {
    const parsed = JSON.parse(generateRoadmapJsonLd(sampleDashboardData));
    expect(parsed.itemListElement).toHaveLength(2);
  });

  it('each item has @type ListItem and position', () => {
    const parsed = JSON.parse(generateRoadmapJsonLd(sampleDashboardData));
    for (let i = 0; i < parsed.itemListElement.length; i++) {
      const item = parsed.itemListElement[i];
      expect(item['@type']).toBe('ListItem');
      expect(item.position).toBe(i + 1);
    }
  });

  it('each item contains phase name and description', () => {
    const parsed = JSON.parse(generateRoadmapJsonLd(sampleDashboardData));
    const first = parsed.itemListElement[0].item;
    expect(first.name).toBe('Phase 88: Foundation');
    expect(first.description).toBe('Build core infrastructure');
  });

  it('includes phase status in item', () => {
    const parsed = JSON.parse(generateRoadmapJsonLd(sampleDashboardData));
    const first = parsed.itemListElement[0].item;
    expect(first.status).toBe('complete');
  });

  it('handles missing roadmap data', () => {
    const data: DashboardData = { generatedAt: '2026-02-12T10:00:00Z' };
    const parsed = JSON.parse(generateRoadmapJsonLd(data));
    expect(parsed['@type']).toBe('ItemList');
    expect(parsed.itemListElement).toHaveLength(0);
  });

  it('includes numberOfItems matching phase count', () => {
    const parsed = JSON.parse(generateRoadmapJsonLd(sampleDashboardData));
    expect(parsed.numberOfItems).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Integration: OG tags and JSON-LD in generated pages
// ---------------------------------------------------------------------------

describe('OG tags and JSON-LD integration', () => {
  // Integration tests that verify the full pipeline produces OG and JSON-LD
  // These import generator indirectly to verify end-to-end wiring

  it('renderLayout includes OG tags when meta is provided', () => {
    const html = renderLayout({
      title: 'Test',
      content: '<p>Test</p>',
      nav: '<nav></nav>',
      projectName: 'Test Project',
      generatedAt: '2026-02-12T10:00:00Z',
      styles: renderStyles(),
      meta: {
        description: 'Test description',
        ogTitle: 'Test OG Title',
        ogDescription: 'Test OG Description',
        ogType: 'website',
      },
    });

    expect(html).toContain('<meta property="og:title"');
    expect(html).toContain('Test OG Title');
    expect(html).toContain('<meta property="og:description"');
    expect(html).toContain('Test OG Description');
    expect(html).toContain('<meta property="og:type"');
    expect(html).toContain('website');
    expect(html).toContain('<meta name="description"');
    expect(html).toContain('Test description');
  });

  it('renderLayout includes JSON-LD script tag when jsonLd is provided', () => {
    const jsonLd = generateProjectJsonLd(sampleDashboardData);
    const html = renderLayout({
      title: 'Test',
      content: '<p>Test</p>',
      nav: '<nav></nav>',
      projectName: 'Test Project',
      generatedAt: '2026-02-12T10:00:00Z',
      styles: renderStyles(),
      jsonLd,
    });

    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('"@context":"https://schema.org"');
    expect(html).toContain('"@type":"SoftwareSourceCode"');
  });

  it('each page type gets appropriate JSON-LD type', () => {
    // Verify the structured data functions produce distinct types
    const projectLd = JSON.parse(generateProjectJsonLd(sampleDashboardData));
    const milestonesLd = JSON.parse(generateMilestonesJsonLd(sampleDashboardData));
    const roadmapLd = JSON.parse(generateRoadmapJsonLd(sampleDashboardData));

    expect(projectLd['@type']).toBe('SoftwareSourceCode');
    expect(milestonesLd['@type']).toBe('ItemList');
    expect(roadmapLd['@type']).toBe('ItemList');

    // ItemLists should have distinct content
    expect(milestonesLd.name).not.toBe(roadmapLd.name);
  });
});
