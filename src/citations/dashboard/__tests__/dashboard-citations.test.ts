/**
 * Tests for the citation dashboard components.
 *
 * Covers: renderCitationPanel, renderProvenanceViewer,
 * renderIntegrityBadge, renderPackBadge. All tests verify
 * HTML output structure and content without real I/O.
 */

import { describe, it, expect } from 'vitest';
import { renderCitationPanel } from '../citation-panel.js';
import { renderProvenanceViewer } from '../provenance-viewer.js';
import { renderIntegrityBadge, renderPackBadge } from '../integrity-badges.js';
import type { AuditResult } from '../integrity-badges.js';
import type { CitedWork, ProvenanceEntry } from '../../types/index.js';
import type { ProvenanceChain } from '../../store/provenance-chain.js';

// ============================================================================
// Test data factories
// ============================================================================

function makeWork(overrides: Partial<CitedWork> = {}): CitedWork {
  return {
    id: overrides.id ?? 'test-id-001',
    title: overrides.title ?? 'The Art of Electronics',
    authors: overrides.authors ?? [{ family: 'Horowitz', given: 'Paul' }],
    year: overrides.year ?? 2015,
    doi: overrides.doi,
    isbn: overrides.isbn,
    url: overrides.url,
    publisher: overrides.publisher,
    journal: overrides.journal,
    volume: overrides.volume,
    issue: overrides.issue,
    pages: overrides.pages,
    edition: overrides.edition,
    type: overrides.type ?? 'book',
    source_api: overrides.source_api ?? 'crossref',
    confidence: overrides.confidence ?? 0.95,
    first_seen: overrides.first_seen ?? '2026-01-01T00:00:00Z',
    last_verified: overrides.last_verified,
    cited_by: overrides.cited_by ?? [],
    tags: overrides.tags ?? ['electronics'],
    notes: overrides.notes,
    verified: overrides.verified ?? false,
    raw_citations: overrides.raw_citations ?? [],
  };
}

function makeProvenance(overrides: Partial<ProvenanceEntry> = {}): ProvenanceEntry {
  return {
    artifact_type: overrides.artifact_type ?? 'skill',
    artifact_path: overrides.artifact_path ?? 'skills/test-skill/SKILL.md',
    artifact_name: overrides.artifact_name ?? 'test-skill',
    context: overrides.context,
    section: overrides.section,
    timestamp: overrides.timestamp ?? '2026-01-01T00:00:00Z',
  };
}

function makeAudit(overrides: Partial<AuditResult> = {}): AuditResult {
  return {
    completeness_score: overrides.completeness_score ?? 0.95,
    total_fields: overrides.total_fields ?? 20,
    passed_fields: overrides.passed_fields ?? 19,
    label: overrides.label,
    issues: overrides.issues,
  };
}

// ============================================================================
// Citation Panel Tests
// ============================================================================

describe('renderCitationPanel', () => {
  it('renders table with correct number of rows for 10 works', () => {
    const works = Array.from({ length: 10 }, (_, i) =>
      makeWork({
        id: `w${i}`,
        title: `Work ${i}`,
        year: 2010 + i,
        authors: [{ family: `Author${i}` }],
      }),
    );

    const html = renderCitationPanel(works);

    // Count table rows (cp-row class)
    const rowMatches = html.match(/class="cp-row"/g);
    expect(rowMatches).toHaveLength(10);
  });

  it('shows empty message for zero works', () => {
    const html = renderCitationPanel([]);

    expect(html).toContain('No citations tracked');
    expect(html).not.toContain('<table');
  });

  it('displays summary bar with correct counts', () => {
    const works = [
      makeWork({ id: 'w1', confidence: 0.95, tags: ['electronics'] }),
      makeWork({ id: 'w2', confidence: 0.60, tags: ['physics'], authors: [{ family: 'Smith' }], year: 2020 }),
      makeWork({ id: 'w3', confidence: 0.85, tags: ['electronics'], authors: [{ family: 'Jones' }], year: 2021 }),
    ];

    const html = renderCitationPanel(works);

    // 3 total works
    expect(html).toContain('<strong>3</strong> works');
    // 2 resolved (>= 0.7), 1 unresolved
    expect(html).toContain('<strong>2</strong> resolved');
    expect(html).toContain('<strong>1</strong> unresolved');
  });

  it('produces valid HTML with proper opening and closing tags', () => {
    const works = [makeWork()];
    const html = renderCitationPanel(works);

    // Check matching div tags
    const openDivs = (html.match(/<div/g) ?? []).length;
    const closeDivs = (html.match(/<\/div>/g) ?? []).length;
    expect(openDivs).toBe(closeDivs);

    // Check table structure
    expect(html).toContain('<table');
    expect(html).toContain('</table>');
    expect(html).toContain('<thead>');
    expect(html).toContain('</thead>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('</tbody>');
  });
});

// ============================================================================
// Provenance Viewer Tests
// ============================================================================

describe('renderProvenanceViewer', () => {
  it('renders tree with 3 child branches', () => {
    const work = makeWork();
    const chain: ProvenanceChain = {
      root: work.id,
      children: [
        { entry: makeProvenance({ artifact_name: 'skill-a', artifact_path: 'skills/a/SKILL.md' }), citationIds: ['c1'] },
        { entry: makeProvenance({ artifact_name: 'skill-b', artifact_path: 'skills/b/SKILL.md' }), citationIds: ['c2'] },
        { entry: makeProvenance({ artifact_name: 'skill-c', artifact_path: 'skills/c/SKILL.md' }), citationIds: ['c3'] },
      ],
      depth: 3,
      circular: false,
    };

    const html = renderProvenanceViewer(work, chain);

    // Should have 3 branch elements
    const branches = html.match(/class="pv-branch"/g);
    expect(branches).toHaveLength(3);

    // Should contain artifact names
    expect(html).toContain('skill-a');
    expect(html).toContain('skill-b');
    expect(html).toContain('skill-c');
  });

  it('flags circular chains in output', () => {
    const work = makeWork();
    const chain: ProvenanceChain = {
      root: work.id,
      children: [
        { entry: makeProvenance(), citationIds: [work.id] },
      ],
      depth: 1,
      circular: true,
    };

    const html = renderProvenanceViewer(work, chain);

    expect(html).toContain('Circular reference detected');
    expect(html).toContain('pv-warning');
  });

  it('renders single root node when no children', () => {
    const work = makeWork();
    const chain: ProvenanceChain = {
      root: work.id,
      children: [],
      depth: 0,
      circular: false,
    };

    const html = renderProvenanceViewer(work, chain);

    // Should have root node
    expect(html).toContain('pv-root');
    expect(html).toContain(work.title);

    // Should show "No provenance links"
    expect(html).toContain('No provenance links');

    // No branch elements
    const branches = html.match(/class="pv-branch"/g);
    expect(branches).toBeNull();
  });
});

// ============================================================================
// Integrity Badge Tests
// ============================================================================

describe('renderIntegrityBadge', () => {
  it('renders green badge for 95% score', () => {
    const audit = makeAudit({ completeness_score: 0.95, passed_fields: 19, total_fields: 20 });
    const html = renderIntegrityBadge(audit);

    expect(html).toContain('#3fb950'); // green
    expect(html).toContain('95%');
  });

  it('renders yellow badge for 80% score', () => {
    const audit = makeAudit({ completeness_score: 0.80, passed_fields: 16, total_fields: 20 });
    const html = renderIntegrityBadge(audit);

    expect(html).toContain('#d29922'); // yellow
    expect(html).toContain('80%');
  });

  it('renders red badge for 50% score', () => {
    const audit = makeAudit({ completeness_score: 0.50, passed_fields: 10, total_fields: 20 });
    const html = renderIntegrityBadge(audit);

    expect(html).toContain('#f85149'); // red
    expect(html).toContain('50%');
  });

  it('shows percentage and field counts', () => {
    const audit = makeAudit({ completeness_score: 0.85, passed_fields: 17, total_fields: 20, label: 'Test Audit' });
    const html = renderIntegrityBadge(audit);

    expect(html).toContain('85%');
    expect(html).toContain('17/20');
    expect(html).toContain('Test Audit');
  });

  it('renders pack badge as average of multiple audits', () => {
    const audits: AuditResult[] = [
      makeAudit({ completeness_score: 0.90, passed_fields: 18, total_fields: 20 }),
      makeAudit({ completeness_score: 0.80, passed_fields: 16, total_fields: 20 }),
      makeAudit({ completeness_score: 0.70, passed_fields: 14, total_fields: 20 }),
    ];

    const html = renderPackBadge(audits);

    // Average: (0.90 + 0.80 + 0.70) / 3 = 0.80 => 80% => yellow
    expect(html).toContain('80%');
    expect(html).toContain('#d29922'); // yellow
    expect(html).toContain('3 works');
  });
});

// ============================================================================
// Dashboard Aesthetic Tests
// ============================================================================

describe('Dashboard aesthetic', () => {
  it('citation panel contains expected CSS colors', () => {
    const works = [
      makeWork({ id: 'w1' }),
      makeWork({ id: 'w2', title: 'Second Work', authors: [{ family: 'Smith' }], year: 2020 }),
    ];
    const html = renderCitationPanel(works);

    // Dark background
    expect(html).toContain('#0d1117');
    // Alternating row color
    expect(html).toContain('#161b22');
  });

  it('integrity badges use the correct threshold colors', () => {
    const green = renderIntegrityBadge(makeAudit({ completeness_score: 0.95 }));
    const yellow = renderIntegrityBadge(makeAudit({ completeness_score: 0.80 }));
    const red = renderIntegrityBadge(makeAudit({ completeness_score: 0.50 }));

    expect(green).toContain('#3fb950');
    expect(yellow).toContain('#d29922');
    expect(red).toContain('#f85149');
  });
});
