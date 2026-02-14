/**
 * Design system CSS foundation for the GSD Dashboard.
 *
 * Provides domain colors, signal colors, spacing tokens, and
 * five-state status vocabulary as CSS custom properties and classes.
 *
 * @module dashboard/design-system
 */

export function renderDesignSystem(): string {
  return `
/* -----------------------------------------------------------------------
   GSD Design System — Foundation Tokens
   ----------------------------------------------------------------------- */

:root {
  /* Domain Colors (REQ-DS-01) */
  --color-frontend: #58a6ff;
  --color-backend: #3fb950;
  --color-testing: #d29922;
  --color-infrastructure: #bc8cff;
  --color-observation: #39d2c0;
  --color-silicon: #f778ba;

  /* Signal Colors (REQ-DS-02) */
  --signal-success: #22c55e;
  --signal-warning: #f97316;
  --signal-error: #ef4444;
  --signal-neutral: #6b7280;

  /* Spacing Tokens (REQ-DS-06) */
  --ds-letter-spacing: 0.025em;
  --ds-line-height: 1.5;
  --ds-card-margin-sm: 16px;
  --ds-card-margin-lg: 24px;
}

/* -----------------------------------------------------------------------
   Five-State Status Vocabulary (REQ-DS-07)
   ----------------------------------------------------------------------- */

.status-not-started {
  color: var(--signal-neutral);
  border-color: var(--signal-neutral);
}

.status-active {
  color: var(--signal-success);
  border-color: var(--signal-success);
}

.status-complete {
  color: var(--color-frontend);
  border-color: var(--color-frontend);
}

.status-blocked {
  color: var(--signal-error);
  border-color: var(--signal-error);
}

.status-attention {
  color: var(--signal-warning);
  border-color: var(--signal-warning);
}
`;
}
