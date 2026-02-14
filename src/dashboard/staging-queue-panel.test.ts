import { describe, it, expect } from 'vitest';
import type { QueueEntry, QueueState } from '../staging/queue/types.js';
import type { DependencyEdge } from '../staging/queue/dependency-detector.js';
import {
  renderStagingQueuePanel,
  renderStagingQueueStyles,
  type StagingQueuePanelData,
} from './staging-queue-panel.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<QueueEntry> = {}): QueueEntry {
  return {
    id: overrides.id ?? 'q-20260101-001',
    filename: overrides.filename ?? 'milestone-alpha.md',
    state: overrides.state ?? 'uploaded',
    milestoneName: overrides.milestoneName ?? 'Alpha',
    domain: overrides.domain ?? 'core',
    tags: overrides.tags ?? ['tag-a', 'tag-b'],
    resourceManifestPath: overrides.resourceManifestPath ?? '/ready/alpha.manifest.json',
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00Z',
  };
}

function makeEdge(overrides: Partial<DependencyEdge> = {}): DependencyEdge {
  return {
    from: overrides.from ?? 'q-20260101-001',
    to: overrides.to ?? 'q-20260101-002',
    type: overrides.type ?? 'explicit',
    reason: overrides.reason ?? 'test dependency',
    confidence: overrides.confidence ?? 0.85,
  };
}

function emptyData(): StagingQueuePanelData {
  return { entries: [], dependencies: [] };
}

// ---------------------------------------------------------------------------
// renderStagingQueuePanel -- Empty state
// ---------------------------------------------------------------------------

describe('renderStagingQueuePanel', () => {
  describe('empty state', () => {
    it('renders empty message when no entries exist', () => {
      const html = renderStagingQueuePanel(emptyData());
      expect(html).toContain('sq-empty');
      expect(html).toContain('No items in staging queue');
    });

    it('does not render columns when empty', () => {
      const html = renderStagingQueuePanel(emptyData());
      expect(html).not.toContain('sq-column');
    });
  });

  // -------------------------------------------------------------------------
  // Panel structure
  // -------------------------------------------------------------------------

  describe('panel structure', () => {
    it('wraps content in staging-queue-panel container', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry()],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('<div class="staging-queue-panel">');
    });

    it('renders panel title', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry()],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('<h3 class="sq-title">Staging Queue</h3>');
    });

    it('renders four columns', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry()],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('data-column="incoming"');
      expect(html).toContain('data-column="attention"');
      expect(html).toContain('data-column="ready"');
      expect(html).toContain('data-column="aside"');
    });

    it('renders column headers', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry()],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('Incoming');
      expect(html).toContain('Needs Attention');
      expect(html).toContain('Ready');
      expect(html).toContain('Set Aside');
    });
  });

  // -------------------------------------------------------------------------
  // Column mapping
  // -------------------------------------------------------------------------

  describe('column mapping', () => {
    it('maps uploaded state to incoming column', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ id: 'q-001', state: 'uploaded' })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      // Card should be inside the incoming column
      const incomingMatch = html.match(
        /data-column="incoming"[\s\S]*?(?=data-column="|<\/div>\s*<svg|$)/,
      );
      expect(incomingMatch).toBeDefined();
      expect(incomingMatch![0]).toContain('data-entry-id="q-001"');
    });

    it('maps checking state to incoming column', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ id: 'q-002', state: 'checking' })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      const incomingMatch = html.match(
        /data-column="incoming"[\s\S]*?(?=data-column="|<\/div>\s*<svg|$)/,
      );
      expect(incomingMatch).toBeDefined();
      expect(incomingMatch![0]).toContain('data-entry-id="q-002"');
    });

    it('maps needs-attention state to attention column', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ id: 'q-003', state: 'needs-attention' })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      const attentionMatch = html.match(
        /data-column="attention"[\s\S]*?(?=data-column="|<\/div>\s*<svg|$)/,
      );
      expect(attentionMatch).toBeDefined();
      expect(attentionMatch![0]).toContain('data-entry-id="q-003"');
    });

    it('maps ready state to ready column', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ id: 'q-004', state: 'ready' })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      const readyMatch = html.match(
        /data-column="ready"[\s\S]*?(?=data-column="|<\/div>\s*<svg|$)/,
      );
      expect(readyMatch).toBeDefined();
      expect(readyMatch![0]).toContain('data-entry-id="q-004"');
    });

    it('maps queued state to ready column', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ id: 'q-005', state: 'queued' })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      const readyMatch = html.match(
        /data-column="ready"[\s\S]*?(?=data-column="|<\/div>\s*<svg|$)/,
      );
      expect(readyMatch).toBeDefined();
      expect(readyMatch![0]).toContain('data-entry-id="q-005"');
    });

    it('maps executing state to ready column', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ id: 'q-006', state: 'executing' })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      const readyMatch = html.match(
        /data-column="ready"[\s\S]*?(?=data-column="|<\/div>\s*<svg|$)/,
      );
      expect(readyMatch).toBeDefined();
      expect(readyMatch![0]).toContain('data-entry-id="q-006"');
    });

    it('maps set-aside state to aside column', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ id: 'q-007', state: 'set-aside' })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      const asideMatch = html.match(
        /data-column="aside"[\s\S]*?(?=<\/div>\s*<\/div>\s*<svg|$)/,
      );
      expect(asideMatch).toBeDefined();
      expect(asideMatch![0]).toContain('data-entry-id="q-007"');
    });
  });

  // -------------------------------------------------------------------------
  // Card content
  // -------------------------------------------------------------------------

  describe('card content', () => {
    it('renders card with data-entry-id and data-state', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ id: 'q-100', state: 'ready' })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('data-entry-id="q-100"');
      expect(html).toContain('data-state="ready"');
    });

    it('renders milestone name in card title', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ milestoneName: 'Beta Release' })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('sq-card-title');
      expect(html).toContain('Beta Release');
    });

    it('renders state badge', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ state: 'needs-attention' })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('sq-badge');
      expect(html).toContain('sq-badge-needs-attention');
      expect(html).toContain('needs-attention');
    });

    it('renders executing badge in ready column', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ state: 'executing' })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('sq-badge-executing');
    });

    it('renders domain text', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ domain: 'infrastructure' })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('sq-card-domain');
      expect(html).toContain('infrastructure');
    });

    it('renders tags as pill spans', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ tags: ['auth', 'api', 'security'] })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('sq-card-tags');
      expect(html).toContain('<span class="sq-tag">auth</span>');
      expect(html).toContain('<span class="sq-tag">api</span>');
      expect(html).toContain('<span class="sq-tag">security</span>');
    });

    it('renders empty tags container when no tags', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry({ tags: [] })],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('sq-card-tags');
    });
  });

  // -------------------------------------------------------------------------
  // Multiple entries
  // -------------------------------------------------------------------------

  describe('multiple entries', () => {
    it('renders entries across different columns', () => {
      const data: StagingQueuePanelData = {
        entries: [
          makeEntry({ id: 'q-a', state: 'uploaded' }),
          makeEntry({ id: 'q-b', state: 'needs-attention' }),
          makeEntry({ id: 'q-c', state: 'ready' }),
        ],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('data-entry-id="q-a"');
      expect(html).toContain('data-entry-id="q-b"');
      expect(html).toContain('data-entry-id="q-c"');
    });

    it('renders multiple entries in same column in order', () => {
      const data: StagingQueuePanelData = {
        entries: [
          makeEntry({ id: 'q-first', state: 'uploaded', milestoneName: 'First' }),
          makeEntry({ id: 'q-second', state: 'checking', milestoneName: 'Second' }),
        ],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      // Both should be in incoming column
      const incomingMatch = html.match(
        /data-column="incoming"[\s\S]*?(?=data-column="|<\/div>\s*<svg|$)/,
      );
      expect(incomingMatch).toBeDefined();
      expect(incomingMatch![0]).toContain('data-entry-id="q-first"');
      expect(incomingMatch![0]).toContain('data-entry-id="q-second"');
      // First should appear before second
      const firstIdx = incomingMatch![0].indexOf('q-first');
      const secondIdx = incomingMatch![0].indexOf('q-second');
      expect(firstIdx).toBeLessThan(secondIdx);
    });
  });

  // -------------------------------------------------------------------------
  // Dependency lines
  // -------------------------------------------------------------------------

  describe('dependency lines', () => {
    it('renders SVG overlay element', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry()],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('sq-dep-overlay');
      expect(html).toContain('<svg');
    });

    it('renders arrowhead marker definition', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry()],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('sq-arrowhead');
      expect(html).toContain('<marker');
    });

    it('renders line elements for dependency edges', () => {
      const data: StagingQueuePanelData = {
        entries: [
          makeEntry({ id: 'q-from' }),
          makeEntry({ id: 'q-to', state: 'ready' }),
        ],
        dependencies: [makeEdge({ from: 'q-from', to: 'q-to' })],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('sq-dep-line');
      expect(html).toContain('data-from="q-from"');
      expect(html).toContain('data-to="q-to"');
    });

    it('renders multiple dependency lines', () => {
      const data: StagingQueuePanelData = {
        entries: [
          makeEntry({ id: 'q-1' }),
          makeEntry({ id: 'q-2', state: 'ready' }),
          makeEntry({ id: 'q-3', state: 'needs-attention' }),
        ],
        dependencies: [
          makeEdge({ from: 'q-1', to: 'q-2' }),
          makeEdge({ from: 'q-1', to: 'q-3' }),
        ],
      };
      const html = renderStagingQueuePanel(data);
      const lineCount = (html.match(/<line[^>]*sq-dep-line/g) || []).length;
      expect(lineCount).toBe(2);
    });

    it('renders no lines when no dependencies', () => {
      const data: StagingQueuePanelData = {
        entries: [makeEntry()],
        dependencies: [],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).not.toContain('sq-dep-line');
    });

    it('includes client-side positioning script', () => {
      const data: StagingQueuePanelData = {
        entries: [
          makeEntry({ id: 'q-from' }),
          makeEntry({ id: 'q-to', state: 'ready' }),
        ],
        dependencies: [makeEdge({ from: 'q-from', to: 'q-to' })],
      };
      const html = renderStagingQueuePanel(data);
      expect(html).toContain('<script>');
      expect(html).toContain('getBoundingClientRect');
    });
  });
});

// ---------------------------------------------------------------------------
// renderStagingQueueStyles
// ---------------------------------------------------------------------------

describe('renderStagingQueueStyles', () => {
  it('returns a CSS string', () => {
    const css = renderStagingQueueStyles();
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('includes staging-queue-panel class', () => {
    const css = renderStagingQueueStyles();
    expect(css).toContain('.staging-queue-panel');
  });

  it('uses CSS grid for columns layout', () => {
    const css = renderStagingQueueStyles();
    expect(css).toContain('grid');
  });

  it('includes card styling', () => {
    const css = renderStagingQueueStyles();
    expect(css).toContain('.sq-card');
  });

  it('includes badge color for each state', () => {
    const css = renderStagingQueueStyles();
    expect(css).toContain('.sq-badge-uploaded');
    expect(css).toContain('.sq-badge-checking');
    expect(css).toContain('.sq-badge-needs-attention');
    expect(css).toContain('.sq-badge-ready');
    expect(css).toContain('.sq-badge-queued');
    expect(css).toContain('.sq-badge-executing');
    expect(css).toContain('.sq-badge-set-aside');
  });

  it('includes tag pill styling', () => {
    const css = renderStagingQueueStyles();
    expect(css).toContain('.sq-tag');
  });

  it('includes SVG overlay positioning', () => {
    const css = renderStagingQueueStyles();
    expect(css).toContain('.sq-dep-overlay');
  });

  it('includes dependency line styling', () => {
    const css = renderStagingQueueStyles();
    expect(css).toContain('.sq-dep-line');
  });

  it('includes empty state styling', () => {
    const css = renderStagingQueueStyles();
    expect(css).toContain('.sq-empty');
  });

  it('uses dashboard theme variables', () => {
    const css = renderStagingQueueStyles();
    expect(css).toContain('var(--surface');
    expect(css).toContain('var(--border');
  });

  it('uses only design system tokens for colors (no bare hex)', () => {
    const css = renderStagingQueueStyles();
    // Strip var() fallback values -- var(--name, #hex) is acceptable
    const stripped = css.replace(/var\([^)]+\)/g, 'VAR_REPLACED');
    // After stripping var() patterns, no bare #hex should remain in color/background/border rules
    const hexInRules = stripped.match(/(?:color|background|border-\w+-color):\s*#[0-9a-fA-F]{3,8}/g);
    expect(hexInRules).toBeNull();
  });
});
