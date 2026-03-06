// Observatory Theme — Colors, typography, and spacing for The Space Between.
// Dark mode default. Foundation colors sourced from the registry.

import type { FoundationId } from '@/types/index';

// ─── Foundation Colors ──────────────────────────────────────

export const FOUNDATION_COLORS: Record<FoundationId, string> = {
  'unit-circle': '#1e3a5f',
  'pythagorean': '#b8860b',
  'trigonometry': '#008080',
  'vector-calculus': '#7b2d8e',
  'set-theory': '#2d5016',
  'category-theory': '#cd5c5c',
  'information-theory': '#b8860b',
  'l-systems': '#2e8b57',
};

// ─── Phase Colors ──────────────────────────────────────────

export const PHASE_COLORS: Record<string, string> = {
  wonder: '#a78bfa',      // soft violet
  see: '#60a5fa',         // sky blue
  touch: '#34d399',       // emerald
  understand: '#fbbf24',  // amber
  connect: '#f87171',     // coral
  create: '#e879f9',      // fuchsia
};

// ─── Surface Colors ─────────────────────────────────────────

export const SURFACE = {
  background: '#0f172a',      // slate-900
  sidebar: '#1e293b',         // slate-800
  card: '#1e293b',            // slate-800
  cardHover: '#334155',       // slate-700
  border: '#334155',          // slate-700
  borderSubtle: '#1e293b',    // slate-800
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

// ─── Text Colors ────────────────────────────────────────────

export const TEXT = {
  primary: '#f1f5f9',       // slate-100
  secondary: '#94a3b8',     // slate-400
  muted: '#64748b',         // slate-500
  accent: '#e2e8f0',        // slate-200
  inverse: '#0f172a',       // slate-900
} as const;

// ─── Typography ─────────────────────────────────────────────

export const FONT = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  serif: "'Georgia', 'Times New Roman', serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

export const FONT_SIZE = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
} as const;

// ─── Spacing ────────────────────────────────────────────────

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

// ─── Layout ─────────────────────────────────────────────────

export const LAYOUT = {
  sidebarWidth: 240,
  sidebarCollapsedWidth: 64,
  bottomNavHeight: 64,
  headerHeight: 56,
  maxContentWidth: 1200,
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
  },
} as const;

// ─── Transitions ────────────────────────────────────────────

export const TRANSITION = {
  fast: '150ms ease',
  normal: '300ms ease',
  slow: '500ms ease',
  spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// ─── Z-Index ────────────────────────────────────────────────

export const Z_INDEX = {
  sidebar: 100,
  overlay: 200,
  modal: 300,
  toast: 400,
  warden: 250,
} as const;
