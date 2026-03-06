/**
 * Design Tokens
 *
 * The Observatory's visual language. Dark mode by default,
 * foundation colors drawn from the registry, spacing and
 * breakpoints for responsive layout.
 */

export const theme = {
  colors: {
    background: '#0a0a14',
    surface: '#141428',
    surfaceHover: '#1c1c3a',
    text: '#e8e8f0',
    textMuted: '#8888a0',
    border: '#2a2a44',
    accent: '#4488cc',
    accentMuted: '#335577',
    success: '#44aa66',
    warning: '#ccaa44',
    error: '#cc4444',
    foundations: {
      'unit-circle': '#1e3a5f',
      pythagorean: '#d4a574',
      trigonometry: '#2d8c8c',
      'vector-calculus': '#6b4d8a',
      'set-theory': '#2d5a2d',
      'category-theory': '#d47a6b',
      'information-theory': '#c4a02d',
      'l-systems': '#2da55a',
    } as Record<string, string>,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  breakpoints: {
    mobile: 768,
    tablet: 1024,
  },
  sidebar: {
    width: 240,
  },
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '600ms',
  },
} as const;

export type Theme = typeof theme;
