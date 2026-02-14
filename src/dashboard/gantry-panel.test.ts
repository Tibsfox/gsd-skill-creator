import { describe, it, expect } from 'vitest';
import {
  renderGantryPanel,
  renderGantryStyles,
  type GantryCell,
  type GantryData,
} from './gantry-panel.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCell(overrides: Partial<GantryCell> = {}): GantryCell {
  return {
    symbol: overrides.symbol ?? '\u25CF',
    label: overrides.label ?? 'Test',
    value: overrides.value,
    color: overrides.color,
    type: overrides.type ?? 'status',
  };
}

function makeData(cells: GantryCell[] = []): GantryData {
  return { cells };
}

// ---------------------------------------------------------------------------
// renderGantryPanel -- Empty / Minimal state
// ---------------------------------------------------------------------------

describe('renderGantryPanel', () => {
  describe('empty and minimal state', () => {
    it('renders gantry container with no cells when cells array is empty', () => {
      const html = renderGantryPanel(makeData());
      expect(html).toContain('gantry-strip');
      expect(html).toContain('gantry-cells');
      expect(html).not.toContain('data-type=');
    });

    it('renders a single cell correctly', () => {
      const html = renderGantryPanel(makeData([makeCell()]));
      expect(html).toContain('gantry-cell');
    });
  });

  // -------------------------------------------------------------------------
  // Agent circles (REQ-GA-02)
  // -------------------------------------------------------------------------

  describe('agent circles (REQ-GA-02)', () => {
    it('renders filled circle symbol for active agent', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ symbol: '\u25CF', type: 'agent', color: 'var(--color-backend)' })]),
      );
      expect(html).toContain('\u25CF');
    });

    it('renders empty circle symbol for inactive agent', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ symbol: '\u25CB', type: 'agent' })]),
      );
      expect(html).toContain('\u25CB');
    });

    it('agent cell has data-type="agent" attribute', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ type: 'agent' })]),
      );
      expect(html).toContain('data-type="agent"');
    });

    it('applies domain color via inline style on symbol', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ type: 'agent', color: 'var(--color-backend)', symbol: '\u25CF' })]),
      );
      expect(html).toContain('style="color:var(--color-backend)"');
    });
  });

  // -------------------------------------------------------------------------
  // Phase progress (REQ-GA-03)
  // -------------------------------------------------------------------------

  describe('phase progress (REQ-GA-03)', () => {
    it('renders fraction text for phase cell', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ type: 'phase', value: '1/2', symbol: '\u276F', label: 'Phase' })]),
      );
      expect(html).toContain('1/2');
      expect(html).not.toMatch(/50\s*%/);
    });

    it('phase cell has data-type="phase" attribute', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ type: 'phase', value: '3/7', symbol: '\u276F' })]),
      );
      expect(html).toContain('data-type="phase"');
    });
  });

  // -------------------------------------------------------------------------
  // Budget bar (REQ-GA-04)
  // -------------------------------------------------------------------------

  describe('budget bar (REQ-GA-04)', () => {
    it('renders a mini progress bar element for budget cell', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ type: 'budget', value: '65', symbol: '\u2588', label: 'Budget' })]),
      );
      expect(html).toContain('gantry-budget-bar');
      expect(html).toContain('gantry-budget-fill');
    });

    it('budget cell has data-type="budget" attribute', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ type: 'budget', value: '50', symbol: '\u2588' })]),
      );
      expect(html).toContain('data-type="budget"');
    });

    it('bar width reflects percentage value from data', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ type: 'budget', value: '73', symbol: '\u2588' })]),
      );
      expect(html).toContain('width:73%');
    });

    it('bar uses color from cell color property', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ type: 'budget', value: '50', color: 'var(--signal-success)', symbol: '\u2588' })]),
      );
      expect(html).toContain('background:var(--signal-success)');
    });
  });

  // -------------------------------------------------------------------------
  // Cell limit (REQ-GA-05)
  // -------------------------------------------------------------------------

  describe('cell limit (REQ-GA-05)', () => {
    it('renders all 8 cells when exactly 8 provided', () => {
      const cells = Array.from({ length: 8 }, (_, i) =>
        makeCell({ label: `Cell${i}`, type: 'status' }),
      );
      const html = renderGantryPanel(makeData(cells));
      for (let i = 0; i < 8; i++) {
        expect(html).toContain(`Cell${i}`);
      }
    });

    it('renders only first 8 cells when 10 provided (truncation)', () => {
      const cells = Array.from({ length: 10 }, (_, i) =>
        makeCell({ label: `Cell${i}`, type: 'status' }),
      );
      const html = renderGantryPanel(makeData(cells));
      for (let i = 0; i < 8; i++) {
        expect(html).toContain(`Cell${i}`);
      }
      expect(html).not.toContain('Cell8');
      expect(html).not.toContain('Cell9');
    });

    it('renders empty strip when 0 cells provided', () => {
      const html = renderGantryPanel(makeData([]));
      expect(html).toContain('gantry-strip');
      expect(html).not.toContain('data-type=');
    });
  });

  // -------------------------------------------------------------------------
  // Symbols before text (REQ-GA-06)
  // -------------------------------------------------------------------------

  describe('symbols before text (REQ-GA-06)', () => {
    it('every cell has .gantry-symbol before .gantry-label', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ symbol: '\u25CF', label: 'Agent' })]),
      );
      const symbolIdx = html.indexOf('gantry-symbol');
      const labelIdx = html.indexOf('gantry-label');
      expect(symbolIdx).toBeGreaterThan(-1);
      expect(labelIdx).toBeGreaterThan(-1);
      expect(symbolIdx).toBeLessThan(labelIdx);
    });

    it('symbol element appears first in DOM order within cell', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ symbol: '\u2588', label: 'Budget', type: 'budget', value: '50' })]),
      );
      // Even for budget type, symbol should come first
      const cellStart = html.indexOf('gantry-cell');
      const symbolIdx = html.indexOf('gantry-symbol', cellStart);
      const labelIdx = html.indexOf('gantry-label', cellStart);
      const budgetBarIdx = html.indexOf('gantry-budget-bar', cellStart);
      expect(symbolIdx).toBeLessThan(budgetBarIdx);
      expect(symbolIdx).toBeLessThan(labelIdx);
    });
  });

  // -------------------------------------------------------------------------
  // Panel structure (REQ-GA-01)
  // -------------------------------------------------------------------------

  describe('panel structure (REQ-GA-01)', () => {
    it('wraps in div.gantry-strip', () => {
      const html = renderGantryPanel(makeData([makeCell()]));
      expect(html).toContain('<div class="gantry-strip"');
    });

    it('has data-max-cells="8" attribute', () => {
      const html = renderGantryPanel(makeData([makeCell()]));
      expect(html).toContain('data-max-cells="8"');
    });

    it('contains .gantry-cells flex container', () => {
      const html = renderGantryPanel(makeData([makeCell()]));
      expect(html).toContain('gantry-cells');
    });
  });

  // -------------------------------------------------------------------------
  // Non-budget cells with value
  // -------------------------------------------------------------------------

  describe('non-budget cells with value', () => {
    it('appends gantry-value span for phase cell with value', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ type: 'phase', value: '3/5', symbol: '\u276F' })]),
      );
      expect(html).toContain('gantry-value');
      expect(html).toContain('3/5');
    });

    it('does not render gantry-value for cell without value', () => {
      const html = renderGantryPanel(
        makeData([makeCell({ type: 'status' })]),
      );
      expect(html).not.toContain('gantry-value');
    });
  });
});

// ---------------------------------------------------------------------------
// renderGantryStyles
// ---------------------------------------------------------------------------

describe('renderGantryStyles', () => {
  it('returns non-empty CSS string', () => {
    const css = renderGantryStyles();
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains .gantry-strip class with position: sticky', () => {
    const css = renderGantryStyles();
    expect(css).toContain('.gantry-strip');
    expect(css).toContain('position: sticky');
  });

  it('contains .gantry-cell styling', () => {
    const css = renderGantryStyles();
    expect(css).toContain('.gantry-cell');
  });

  it('contains .gantry-symbol styling', () => {
    const css = renderGantryStyles();
    expect(css).toContain('.gantry-symbol');
  });

  it('uses CSS custom properties from dashboard theme', () => {
    const css = renderGantryStyles();
    expect(css).toContain('var(--surface');
    expect(css).toContain('var(--border');
  });

  it('contains .gantry-budget-bar for mini bar rendering', () => {
    const css = renderGantryStyles();
    expect(css).toContain('.gantry-budget-bar');
  });

  it('contains .gantry-budget-fill styling', () => {
    const css = renderGantryStyles();
    expect(css).toContain('.gantry-budget-fill');
  });

  it('contains .gantry-label styling', () => {
    const css = renderGantryStyles();
    expect(css).toContain('.gantry-label');
  });

  it('contains .gantry-value styling', () => {
    const css = renderGantryStyles();
    expect(css).toContain('.gantry-value');
  });

  it('contains cell divider via pseudo-element', () => {
    const css = renderGantryStyles();
    expect(css).toContain('.gantry-cell + .gantry-cell');
  });
});
