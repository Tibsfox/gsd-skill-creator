import { describe, it, expect } from 'vitest';
import { renderDesignSystem } from './design-system.js';

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe('renderDesignSystem', () => {
  describe('structure', () => {
    it('returns a non-empty string', () => {
      const css = renderDesignSystem();
      expect(css.length).toBeGreaterThan(0);
    });

    it('includes a comment header identifying the design system', () => {
      const css = renderDesignSystem();
      expect(css).toContain('GSD Design System');
    });

    it('defines custom properties inside a :root block', () => {
      const css = renderDesignSystem();
      expect(css).toMatch(/:root\s*\{/);
    });
  });

  // -------------------------------------------------------------------------
  // Domain Colors (REQ-DS-01)
  // -------------------------------------------------------------------------

  describe('domain colors (REQ-DS-01)', () => {
    it('contains --color-frontend: #58a6ff', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--color-frontend: #58a6ff');
    });

    it('contains --color-backend: #3fb950', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--color-backend: #3fb950');
    });

    it('contains --color-testing: #d29922', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--color-testing: #d29922');
    });

    it('contains --color-infrastructure: #bc8cff', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--color-infrastructure: #bc8cff');
    });

    it('contains --color-observation: #39d2c0', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--color-observation: #39d2c0');
    });

    it('contains --color-silicon: #f778ba', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--color-silicon: #f778ba');
    });
  });

  // -------------------------------------------------------------------------
  // Signal Colors (REQ-DS-02)
  // -------------------------------------------------------------------------

  describe('signal colors (REQ-DS-02)', () => {
    it('contains --signal-success: #22c55e', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--signal-success: #22c55e');
    });

    it('contains --signal-warning: #f97316', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--signal-warning: #f97316');
    });

    it('contains --signal-error: #ef4444', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--signal-error: #ef4444');
    });

    it('contains --signal-neutral: #6b7280', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--signal-neutral: #6b7280');
    });
  });

  // -------------------------------------------------------------------------
  // Spacing Tokens (REQ-DS-06)
  // -------------------------------------------------------------------------

  describe('spacing tokens (REQ-DS-06)', () => {
    it('contains --ds-letter-spacing: 0.025em', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--ds-letter-spacing: 0.025em');
    });

    it('contains --ds-line-height: 1.5', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--ds-line-height: 1.5');
    });

    it('contains --ds-card-margin-sm: 16px', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--ds-card-margin-sm: 16px');
    });

    it('contains --ds-card-margin-lg: 24px', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--ds-card-margin-lg: 24px');
    });
  });

  // -------------------------------------------------------------------------
  // Status State Classes (REQ-DS-07)
  // -------------------------------------------------------------------------

  describe('status state classes (REQ-DS-07)', () => {
    it('contains .status-not-started class', () => {
      const css = renderDesignSystem();
      expect(css).toContain('.status-not-started');
    });

    it('contains .status-active class', () => {
      const css = renderDesignSystem();
      expect(css).toContain('.status-active');
    });

    it('contains .status-complete class', () => {
      const css = renderDesignSystem();
      expect(css).toContain('.status-complete');
    });

    it('contains .status-blocked class', () => {
      const css = renderDesignSystem();
      expect(css).toContain('.status-blocked');
    });

    it('contains .status-attention class', () => {
      const css = renderDesignSystem();
      expect(css).toContain('.status-attention');
    });

    it('.status-not-started uses --signal-neutral (gray)', () => {
      const css = renderDesignSystem();
      const match = css.match(/\.status-not-started\s*\{[^}]+\}/);
      expect(match).not.toBeNull();
      expect(match![0]).toContain('var(--signal-neutral)');
    });

    it('.status-active uses --signal-success (green)', () => {
      const css = renderDesignSystem();
      const match = css.match(/\.status-active\s*\{[^}]+\}/);
      expect(match).not.toBeNull();
      expect(match![0]).toContain('var(--signal-success)');
    });

    it('.status-complete uses --color-frontend (blue)', () => {
      const css = renderDesignSystem();
      const match = css.match(/\.status-complete\s*\{[^}]+\}/);
      expect(match).not.toBeNull();
      expect(match![0]).toContain('var(--color-frontend)');
    });

    it('.status-blocked uses --signal-error (red)', () => {
      const css = renderDesignSystem();
      const match = css.match(/\.status-blocked\s*\{[^}]+\}/);
      expect(match).not.toBeNull();
      expect(match![0]).toContain('var(--signal-error)');
    });

    it('.status-attention uses --signal-warning (orange)', () => {
      const css = renderDesignSystem();
      const match = css.match(/\.status-attention\s*\{[^}]+\}/);
      expect(match).not.toBeNull();
      expect(match![0]).toContain('var(--signal-warning)');
    });
  });

  // -------------------------------------------------------------------------
  // Font Imports (REQ-DS-03)
  // -------------------------------------------------------------------------

  describe('font imports (REQ-DS-03)', () => {
    it('contains JetBrains Mono font reference', () => {
      const css = renderDesignSystem();
      expect(css).toContain('JetBrains Mono');
    });

    it('contains Inter font reference', () => {
      const css = renderDesignSystem();
      expect(css).toContain('Inter');
    });

    it('declares --font-data custom property with JetBrains Mono', () => {
      const css = renderDesignSystem();
      expect(css).toMatch(/--font-data:.*JetBrains Mono/);
    });

    it('declares --font-ui custom property with Inter', () => {
      const css = renderDesignSystem();
      expect(css).toMatch(/--font-ui:.*Inter/);
    });
  });

  // -------------------------------------------------------------------------
  // Tabular-Nums (REQ-DS-04)
  // -------------------------------------------------------------------------

  describe('tabular-nums (REQ-DS-04)', () => {
    it('contains font-variant-numeric: tabular-nums rule', () => {
      const css = renderDesignSystem();
      expect(css).toContain('font-variant-numeric: tabular-nums');
    });

    it('tabular-nums is applied globally via body selector', () => {
      const css = renderDesignSystem();
      const bodyMatch = css.match(/body\s*\{[^}]+\}/);
      expect(bodyMatch).not.toBeNull();
      expect(bodyMatch![0]).toContain('tabular-nums');
    });
  });

  // -------------------------------------------------------------------------
  // Weight Hierarchy (REQ-DS-05)
  // -------------------------------------------------------------------------

  describe('weight hierarchy (REQ-DS-05)', () => {
    it('contains .text-primary class with font-weight: 700', () => {
      const css = renderDesignSystem();
      const match = css.match(/\.text-primary\s*\{[^}]+\}/);
      expect(match).not.toBeNull();
      expect(match![0]).toContain('font-weight: 700');
    });

    it('contains .text-secondary class with font-weight: 400', () => {
      const css = renderDesignSystem();
      const match = css.match(/\.text-secondary\s*\{[^}]+\}/);
      expect(match).not.toBeNull();
      expect(match![0]).toContain('font-weight: 400');
    });

    it('.text-primary does not set font-size', () => {
      const css = renderDesignSystem();
      const match = css.match(/\.text-primary\s*\{[^}]+\}/);
      expect(match).not.toBeNull();
      expect(match![0]).not.toContain('font-size');
    });

    it('.text-secondary does not set font-size', () => {
      const css = renderDesignSystem();
      const match = css.match(/\.text-secondary\s*\{[^}]+\}/);
      expect(match).not.toBeNull();
      expect(match![0]).not.toContain('font-size');
    });
  });

  // -------------------------------------------------------------------------
  // Case Discipline (REQ-DS-08)
  // -------------------------------------------------------------------------

  describe('case discipline (REQ-DS-08)', () => {
    it('contains .case-label class with text-transform: none', () => {
      const css = renderDesignSystem();
      const match = css.match(/\.case-label\s*\{[^}]+\}/);
      expect(match).not.toBeNull();
      expect(match![0]).toContain('text-transform: none');
    });

    it('contains .case-interrupt class with text-transform: uppercase', () => {
      const css = renderDesignSystem();
      const match = css.match(/\.case-interrupt\s*\{[^}]+\}/);
      expect(match).not.toBeNull();
      expect(match![0]).toContain('text-transform: uppercase');
    });

    it('.case-interrupt includes letter-spacing', () => {
      const css = renderDesignSystem();
      const match = css.match(/\.case-interrupt\s*\{[^}]+\}/);
      expect(match).not.toBeNull();
      expect(match![0]).toContain('letter-spacing');
    });
  });

  // -------------------------------------------------------------------------
  // Integration: Full Design System Completeness
  // -------------------------------------------------------------------------

  describe('integration: design system completeness', () => {
    it('contains --color-frontend for REQ-DS-01 domain colors', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--color-frontend');
    });

    it('contains --signal-success for REQ-DS-02 signal colors', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--signal-success');
    });

    it('contains Inter for REQ-DS-03 typography', () => {
      const css = renderDesignSystem();
      expect(css).toContain('Inter');
    });

    it('contains tabular-nums for REQ-DS-04 numeric treatment', () => {
      const css = renderDesignSystem();
      expect(css).toContain('tabular-nums');
    });

    it('contains .text-primary for REQ-DS-05 weight hierarchy', () => {
      const css = renderDesignSystem();
      expect(css).toContain('.text-primary');
    });

    it('contains --ds-letter-spacing for REQ-DS-06 spacing tokens', () => {
      const css = renderDesignSystem();
      expect(css).toContain('--ds-letter-spacing');
    });

    it('contains .status-active for REQ-DS-07 status vocabulary', () => {
      const css = renderDesignSystem();
      expect(css).toContain('.status-active');
    });

    it('contains .case-interrupt for REQ-DS-08 case discipline', () => {
      const css = renderDesignSystem();
      expect(css).toContain('.case-interrupt');
    });

    it('all :root custom properties are syntactically valid', () => {
      const css = renderDesignSystem();
      const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
      expect(rootMatch).toBeDefined();
      const rootBlock = rootMatch![1];
      const properties = rootBlock.match(/--[\w-]+:\s*[^;]+;/g);
      expect(properties).toBeDefined();
      // At least 16 custom properties: 6 domain + 4 signal + 4 spacing + 2 font
      expect(properties!.length).toBeGreaterThanOrEqual(16);
    });

    it('all five status classes are present', () => {
      const css = renderDesignSystem();
      const statusClasses = ['not-started', 'active', 'complete', 'blocked', 'attention'];
      for (const state of statusClasses) {
        expect(css).toContain(`.status-${state}`);
      }
    });
  });
});
