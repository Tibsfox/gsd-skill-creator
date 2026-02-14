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
});
