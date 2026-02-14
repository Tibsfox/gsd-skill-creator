import { describe, it, expect } from 'vitest';
import {
  renderSiliconPanel,
  renderSiliconPanelStyles,
  type AdapterInfo,
  type SiliconPanelData,
  type VramSegment,
} from './silicon-panel.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAdapter(overrides: Partial<AdapterInfo> = {}): AdapterInfo {
  return {
    name: overrides.name ?? 'CUDA',
    state: overrides.state ?? 'active',
    confidence: overrides.confidence ?? 0.85,
    domain: overrides.domain,
  };
}

function makeVramSegment(overrides: Partial<VramSegment> = {}): VramSegment {
  return {
    label: overrides.label ?? 'Model',
    percentage: overrides.percentage ?? 40,
    color: overrides.color ?? '#bc8cff',
  };
}

function makeData(overrides: Partial<SiliconPanelData> = {}): SiliconPanelData {
  return {
    enabled: 'enabled' in overrides ? overrides.enabled! : true,
    adapters: overrides.adapters ?? [makeAdapter()],
    vram: overrides.vram ?? {
      segments: [makeVramSegment()],
      totalUsed: 40,
    },
  };
}

// ---------------------------------------------------------------------------
// renderSiliconPanel -- Progressive enhancement: no config (REQ-SP-04)
// ---------------------------------------------------------------------------

describe('renderSiliconPanel', () => {
  describe('progressive enhancement -- no config (REQ-SP-04)', () => {
    it('returns empty string when enabled is null', () => {
      const html = renderSiliconPanel(
        makeData({ enabled: null }),
      );
      expect(html).toBe('');
    });

    it('does not render .silicon-panel container when enabled is null', () => {
      const html = renderSiliconPanel(
        makeData({ enabled: null }),
      );
      expect(html).not.toContain('silicon-panel');
    });
  });

  // -------------------------------------------------------------------------
  // Progressive enhancement -- disabled (REQ-SP-04)
  // -------------------------------------------------------------------------

  describe('progressive enhancement -- disabled (REQ-SP-04)', () => {
    it('renders .silicon-panel container when disabled', () => {
      const html = renderSiliconPanel(
        makeData({ enabled: false }),
      );
      expect(html).toContain('silicon-panel');
    });

    it('renders .sp-disabled-msg with informational message', () => {
      const html = renderSiliconPanel(
        makeData({ enabled: false }),
      );
      expect(html).toContain('sp-disabled-msg');
      expect(html).toContain('silicon.yaml');
    });

    it('does not render adapter indicators when disabled', () => {
      const html = renderSiliconPanel(
        makeData({ enabled: false }),
      );
      expect(html).not.toContain('sp-adapter');
      expect(html).not.toContain('sp-diamond');
    });

    it('does not render VRAM gauge when disabled', () => {
      const html = renderSiliconPanel(
        makeData({ enabled: false }),
      );
      expect(html).not.toContain('sp-vram-gauge');
      expect(html).not.toContain('sp-vram-bar');
    });
  });

  // -------------------------------------------------------------------------
  // Progressive enhancement -- enabled (REQ-SP-04)
  // -------------------------------------------------------------------------

  describe('progressive enhancement -- enabled (REQ-SP-04)', () => {
    it('renders full panel with adapters section', () => {
      const html = renderSiliconPanel(makeData());
      expect(html).toContain('sp-adapters');
    });

    it('renders full panel with VRAM section', () => {
      const html = renderSiliconPanel(makeData());
      expect(html).toContain('sp-vram-gauge');
    });
  });

  // -------------------------------------------------------------------------
  // Diamond adapter indicators (REQ-SP-01)
  // -------------------------------------------------------------------------

  describe('diamond adapter indicators (REQ-SP-01)', () => {
    it('renders each adapter inside .sp-adapter container', () => {
      const html = renderSiliconPanel(
        makeData({
          adapters: [makeAdapter({ name: 'CUDA' }), makeAdapter({ name: 'ROCm' })],
        }),
      );
      const adapterMatches = html.match(/sp-adapter[^s]/g);
      expect(adapterMatches!.length).toBeGreaterThanOrEqual(2);
    });

    it('renders diamond shape element with class .sp-diamond', () => {
      const html = renderSiliconPanel(makeData());
      expect(html).toContain('sp-diamond');
    });

    it('uses Unicode U+25C6 (black diamond) character', () => {
      const html = renderSiliconPanel(makeData());
      expect(html).toContain('\u25C6');
    });

    it('renders adapter name in .sp-adapter-name', () => {
      const html = renderSiliconPanel(
        makeData({ adapters: [makeAdapter({ name: 'Metal' })] }),
      );
      expect(html).toContain('sp-adapter-name');
      expect(html).toContain('Metal');
    });

    it('renders confidence score in .sp-confidence as decimal', () => {
      const html = renderSiliconPanel(
        makeData({ adapters: [makeAdapter({ confidence: 0.85 })] }),
      );
      expect(html).toContain('sp-confidence');
      expect(html).toContain('0.85');
    });

    it('sets data-state attribute matching lifecycle state', () => {
      const html = renderSiliconPanel(
        makeData({ adapters: [makeAdapter({ state: 'blocked' })] }),
      );
      expect(html).toContain('data-state="blocked"');
    });
  });

  // -------------------------------------------------------------------------
  // Five-state mapping (REQ-SP-02)
  // -------------------------------------------------------------------------

  describe('five-state mapping (REQ-SP-02)', () => {
    it('not-started: diamond gray with sp-state-not-started class', () => {
      const html = renderSiliconPanel(
        makeData({ adapters: [makeAdapter({ state: 'not-started' })] }),
      );
      expect(html).toContain('sp-state-not-started');
      expect(html).toContain('var(--text-dim)');
    });

    it('active: diamond colored with sp-state-active class', () => {
      const html = renderSiliconPanel(
        makeData({ adapters: [makeAdapter({ state: 'active' })] }),
      );
      expect(html).toContain('sp-state-active');
      expect(html).toContain('var(--green)');
    });

    it('complete: diamond green with sp-state-complete class', () => {
      const html = renderSiliconPanel(
        makeData({ adapters: [makeAdapter({ state: 'complete' })] }),
      );
      expect(html).toContain('sp-state-complete');
      expect(html).toContain('var(--green)');
    });

    it('blocked: diamond red with sp-state-blocked class', () => {
      const html = renderSiliconPanel(
        makeData({ adapters: [makeAdapter({ state: 'blocked' })] }),
      );
      expect(html).toContain('sp-state-blocked');
      expect(html).toContain('var(--red)');
    });

    it('attention: diamond orange with sp-state-attention class', () => {
      const html = renderSiliconPanel(
        makeData({ adapters: [makeAdapter({ state: 'attention' })] }),
      );
      expect(html).toContain('sp-state-attention');
      expect(html).toContain('var(--yellow)');
    });
  });

  // -------------------------------------------------------------------------
  // VRAM gauge (REQ-SP-03)
  // -------------------------------------------------------------------------

  describe('VRAM gauge (REQ-SP-03)', () => {
    it('renders .sp-vram-gauge container', () => {
      const html = renderSiliconPanel(makeData());
      expect(html).toContain('sp-vram-gauge');
    });

    it('contains .sp-vram-bar horizontal stacked bar', () => {
      const html = renderSiliconPanel(makeData());
      expect(html).toContain('sp-vram-bar');
    });

    it('renders VRAM segments with width and color', () => {
      const html = renderSiliconPanel(
        makeData({
          vram: {
            segments: [makeVramSegment({ percentage: 35, color: '#bc8cff' })],
            totalUsed: 35,
          },
        }),
      );
      expect(html).toContain('width:35%');
      expect(html).toContain('background:#bc8cff');
    });

    it('renders VRAM segments with .sp-vram-segment class', () => {
      const html = renderSiliconPanel(makeData());
      expect(html).toContain('sp-vram-segment');
    });

    it('renders headroom as gray remaining space', () => {
      const html = renderSiliconPanel(
        makeData({
          vram: {
            segments: [makeVramSegment({ percentage: 60 })],
            totalUsed: 60,
          },
        }),
      );
      expect(html).toContain('sp-vram-headroom');
      expect(html).toContain('width:40%');
    });

    it('has role="meter" for accessibility on VRAM gauge', () => {
      const html = renderSiliconPanel(makeData());
      expect(html).toContain('role="meter"');
    });
  });

  // -------------------------------------------------------------------------
  // Multiple adapters
  // -------------------------------------------------------------------------

  describe('multiple adapters', () => {
    it('renders three adapters as three .sp-adapter elements', () => {
      const html = renderSiliconPanel(
        makeData({
          adapters: [
            makeAdapter({ name: 'CUDA' }),
            makeAdapter({ name: 'ROCm' }),
            makeAdapter({ name: 'Metal' }),
          ],
        }),
      );
      expect(html).toContain('CUDA');
      expect(html).toContain('ROCm');
      expect(html).toContain('Metal');
      const adapterCount = (html.match(/class="sp-adapter /g) || []).length;
      expect(adapterCount).toBe(3);
    });

    it('renders adapters in provided order', () => {
      const html = renderSiliconPanel(
        makeData({
          adapters: [
            makeAdapter({ name: 'First' }),
            makeAdapter({ name: 'Second' }),
            makeAdapter({ name: 'Third' }),
          ],
        }),
      );
      const firstIdx = html.indexOf('First');
      const secondIdx = html.indexOf('Second');
      const thirdIdx = html.indexOf('Third');
      expect(firstIdx).toBeLessThan(secondIdx);
      expect(secondIdx).toBeLessThan(thirdIdx);
    });

    it('renders panel with no adapters section content when empty array', () => {
      const html = renderSiliconPanel(
        makeData({ adapters: [] }),
      );
      expect(html).toContain('silicon-panel');
      expect(html).toContain('sp-adapters');
      // No sp-adapter (singular) elements
      expect(html).not.toMatch(/class="sp-adapter /);
    });
  });

  // -------------------------------------------------------------------------
  // Panel structure
  // -------------------------------------------------------------------------

  describe('panel structure', () => {
    it('has class .silicon-panel', () => {
      const html = renderSiliconPanel(makeData());
      expect(html).toContain('class="silicon-panel"');
    });

    it('renders panel title in .sp-title', () => {
      const html = renderSiliconPanel(makeData());
      expect(html).toContain('sp-title');
      expect(html).toContain('Silicon');
    });

    it('renders adapters and VRAM in separate sections', () => {
      const html = renderSiliconPanel(makeData());
      expect(html).toContain('sp-adapters');
      expect(html).toContain('sp-vram-gauge');
    });
  });
});

// ---------------------------------------------------------------------------
// renderSiliconPanelStyles
// ---------------------------------------------------------------------------

describe('renderSiliconPanelStyles', () => {
  it('returns non-empty CSS string', () => {
    const css = renderSiliconPanelStyles();
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains .silicon-panel class', () => {
    const css = renderSiliconPanelStyles();
    expect(css).toContain('.silicon-panel');
  });

  it('contains .sp-diamond styling', () => {
    const css = renderSiliconPanelStyles();
    expect(css).toContain('.sp-diamond');
  });

  it('contains .sp-adapter layout', () => {
    const css = renderSiliconPanelStyles();
    expect(css).toContain('.sp-adapter');
  });

  it('contains .sp-vram-bar bar styling', () => {
    const css = renderSiliconPanelStyles();
    expect(css).toContain('.sp-vram-bar');
  });

  it('contains state-specific classes', () => {
    const css = renderSiliconPanelStyles();
    expect(css).toContain('.sp-state-active');
    expect(css).toContain('.sp-state-blocked');
    expect(css).toContain('.sp-state-not-started');
    expect(css).toContain('.sp-state-complete');
    expect(css).toContain('.sp-state-attention');
  });

  it('contains .sp-disabled-msg styling', () => {
    const css = renderSiliconPanelStyles();
    expect(css).toContain('.sp-disabled-msg');
  });

  it('uses CSS custom properties from dashboard theme', () => {
    const css = renderSiliconPanelStyles();
    expect(css).toContain('var(--surface');
    expect(css).toContain('var(--border');
    expect(css).toContain('var(--text');
  });
});
