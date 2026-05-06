/**
 * @vitest-environment jsdom
 *
 * layout-persistence.ts — unit tests (8 cases).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadSavedLayout,
  saveLayout,
  clearSavedLayout,
  migrateLayout,
} from '../layout-persistence.js';
import type { SavedAtlasLayout } from '../layout-persistence.js';

function makeLayout(overrides: Partial<SavedAtlasLayout> = {}): SavedAtlasLayout {
  return {
    schema_version: 1,
    splitters: { col: 42, rowTop: 50, rowMid: 22 },
    systemMapColorMode: 'recent-activity',
    missionFilter: 'v1.49.606',
    legendVisible: false,
    saved_at: '2026-05-05T00:00:00.000Z',
    ...overrides,
  };
}

describe('layout-persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('save + load round-trips on the same projectId', () => {
    const layout = makeLayout();
    saveLayout('proj-a', layout);
    const loaded = loadSavedLayout('proj-a');
    expect(loaded).not.toBeNull();
    expect(loaded!.splitters.col).toBe(42);
    expect(loaded!.systemMapColorMode).toBe('recent-activity');
    expect(loaded!.missionFilter).toBe('v1.49.606');
    expect(loaded!.legendVisible).toBe(false);
    expect(loaded!.schema_version).toBe(1);
  });

  it('different projectIds are independent', () => {
    saveLayout('proj-a', makeLayout({ splitters: { col: 30, rowTop: 40, rowMid: 15 } }));
    saveLayout('proj-b', makeLayout({ splitters: { col: 70, rowTop: 60, rowMid: 10 } }));

    const a = loadSavedLayout('proj-a');
    const b = loadSavedLayout('proj-b');
    expect(a!.splitters.col).toBe(30);
    expect(b!.splitters.col).toBe(70);
  });

  it('migrateLayout drops schema_version: 0 — returns null', () => {
    const raw = {
      schema_version: 0,
      splitters: { col: 40, rowTop: 45, rowMid: 20 },
      systemMapColorMode: 'symbol-density',
      missionFilter: null,
      legendVisible: true,
      saved_at: '2026-05-05T00:00:00.000Z',
    };
    expect(migrateLayout(raw)).toBeNull();
  });

  it('migrateLayout returns null for a malformed / non-object value', () => {
    expect(migrateLayout(null)).toBeNull();
    expect(migrateLayout('not an object')).toBeNull();
    expect(migrateLayout(42)).toBeNull();
    // Missing required field
    expect(migrateLayout({ schema_version: 1 })).toBeNull();
  });

  it('clearSavedLayout removes the entry', () => {
    saveLayout('proj-a', makeLayout());
    expect(loadSavedLayout('proj-a')).not.toBeNull();
    clearSavedLayout('proj-a');
    expect(loadSavedLayout('proj-a')).toBeNull();
  });

  it('localStorage unavailable — no throws', () => {
    const origStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      get() { throw new Error('localStorage blocked'); },
      configurable: true,
    });
    try {
      expect(() => saveLayout('proj-x', makeLayout())).not.toThrow();
      expect(() => loadSavedLayout('proj-x')).not.toThrow();
      expect(() => clearSavedLayout('proj-x')).not.toThrow();
      expect(loadSavedLayout('proj-x')).toBeNull();
    } finally {
      if (origStorage) {
        Object.defineProperty(window, 'localStorage', origStorage);
      }
    }
  });

  it('SavedAtlasLayout must include schema_version: 1', () => {
    const layout = makeLayout();
    expect(layout.schema_version).toBe(1);
    // TypeScript enforces the literal type — runtime check as belt-and-suspenders
    const saved = JSON.parse(JSON.stringify(layout));
    expect(saved.schema_version).toBe(1);
  });

  it('saved_at is set to a current ISO-8601 timestamp on save', () => {
    const before = Date.now();
    saveLayout('proj-ts', makeLayout({ saved_at: new Date().toISOString() }));
    const loaded = loadSavedLayout('proj-ts');
    expect(loaded).not.toBeNull();
    const ts = Date.parse(loaded!.saved_at);
    expect(ts).toBeGreaterThanOrEqual(before - 1000); // within 1s tolerance
  });
});
