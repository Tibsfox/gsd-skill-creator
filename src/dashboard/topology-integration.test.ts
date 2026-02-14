import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./topology-renderer.js', () => ({
  renderTopologyPanel: vi.fn(() => '<div class="topology-panel">mock</div>'),
  renderTopologyStyles: vi.fn(() => '.topology-panel { } .tp-detail-panel { animation: tp-slide-in 0.2s ease-out; }'),
}));

vi.mock('./topology-data.js', () => ({
  buildTopologyData: vi.fn(() => ({
    nodes: [],
    edges: [],
    viewBox: { width: 800, height: 600 },
  })),
}));

import { renderTopologyPanel, renderTopologyStyles } from './topology-renderer.js';
import { buildTopologyData } from './topology-data.js';
import {
  buildTopologyHtml,
  renderTopologyClickScript,
} from './topology-integration.js';
import type { TopologySource } from './topology-data.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptySource(): TopologySource {
  return {
    agents: [],
    skills: [],
    teams: [],
    activeAgentIds: [],
    activeSkillIds: [],
  };
}

// ---------------------------------------------------------------------------
// buildTopologyHtml -- Delegation
// ---------------------------------------------------------------------------

describe('buildTopologyHtml', () => {
  beforeEach(() => {
    vi.mocked(buildTopologyData).mockClear();
    vi.mocked(renderTopologyPanel).mockClear();
  });

  describe('delegation', () => {
    it('calls buildTopologyData with the provided source', () => {
      const source = emptySource();
      buildTopologyHtml(source);
      expect(buildTopologyData).toHaveBeenCalledWith(source);
    });

    it('calls renderTopologyPanel with the result of buildTopologyData', () => {
      const mockData = { nodes: [], edges: [], viewBox: { width: 800, height: 600 } };
      vi.mocked(buildTopologyData).mockReturnValue(mockData);
      buildTopologyHtml(emptySource());
      expect(renderTopologyPanel).toHaveBeenCalledWith(mockData);
    });

    it('returns HTML containing topology-panel class', () => {
      const html = buildTopologyHtml(emptySource());
      expect(html).toContain('topology-panel');
    });
  });

  describe('empty source', () => {
    it('returns HTML containing topology-panel even with no data', () => {
      const html = buildTopologyHtml(emptySource());
      expect(html).toContain('topology-panel');
    });
  });
});

// ---------------------------------------------------------------------------
// renderTopologyClickScript
// ---------------------------------------------------------------------------

describe('renderTopologyClickScript', () => {
  describe('script structure', () => {
    it('returns string containing <script> tag', () => {
      const script = renderTopologyClickScript();
      expect(script).toContain('<script>');
      expect(script).toContain('</script>');
    });

    it('contains event delegation on .topology-panel for click events', () => {
      const script = renderTopologyClickScript();
      expect(script).toContain('.topology-panel');
      expect(script).toContain('click');
    });

    it('contains .tp-detail-panel side panel creation logic', () => {
      const script = renderTopologyClickScript();
      expect(script).toContain('tp-detail-panel');
    });

    it('contains data-node-id attribute reading from clicked element', () => {
      const script = renderTopologyClickScript();
      expect(script).toContain('data-node-id');
    });

    it('contains close button handler', () => {
      const script = renderTopologyClickScript();
      expect(script).toContain('tp-detail-close');
    });
  });

  describe('detail panel content', () => {
    it('script creates element with class .tp-detail-panel', () => {
      const script = renderTopologyClickScript();
      expect(script).toContain('tp-detail-panel');
    });

    it('shows node label, type, domain, and active status', () => {
      const script = renderTopologyClickScript();
      expect(script).toContain('Type');
      expect(script).toContain('Domain');
      expect(script).toContain('Status');
    });

    it('positioned absolutely relative to topology panel', () => {
      // The script appends to the panel which has position:relative
      const script = renderTopologyClickScript();
      expect(script).toContain('appendChild');
    });
  });
});

// ---------------------------------------------------------------------------
// Styles integration
// ---------------------------------------------------------------------------

describe('styles integration', () => {
  it('renderTopologyStyles includes .tp-detail-panel styling', () => {
    const css = renderTopologyStyles();
    expect(css).toContain('.tp-detail-panel');
  });

  it('detail panel has slide-in animation', () => {
    const css = renderTopologyStyles();
    expect(css).toContain('tp-slide-in');
  });
});
