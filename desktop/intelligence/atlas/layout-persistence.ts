/**
 * Atlas layout persistence — localStorage-backed per-project layout save/restore.
 *
 * Key: atlas:layout:<projectId>
 * Schema-versioned so future shape changes can migrate gracefully.
 */

import type { ColorMode } from './system-map/index.js';

export interface SavedAtlasLayout {
  schema_version: 1;
  splitters: { col: number; rowTop: number; rowMid: number };
  systemMapColorMode: ColorMode;
  missionFilter: string | null;
  legendVisible: boolean;
  saved_at: string;
}

function storageKey(projectId: string): string {
  return `atlas:layout:${projectId}`;
}

function getStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function migrateLayout(raw: unknown): SavedAtlasLayout | null {
  if (raw === null || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  if (rec['schema_version'] !== 1) return null;
  if (typeof rec['saved_at'] !== 'string') return null;
  if (typeof rec['splitters'] !== 'object' || rec['splitters'] === null) return null;
  const sp = rec['splitters'] as Record<string, unknown>;
  if (typeof sp['col'] !== 'number' || typeof sp['rowTop'] !== 'number' || typeof sp['rowMid'] !== 'number') return null;
  const validModes: ColorMode[] = ['symbol-density', 'recent-activity', 'mission-attribution', 'provenance-overlay'];
  if (!validModes.includes(rec['systemMapColorMode'] as ColorMode)) return null;
  if (rec['missionFilter'] !== null && typeof rec['missionFilter'] !== 'string') return null;
  if (typeof rec['legendVisible'] !== 'boolean') return null;
  return raw as SavedAtlasLayout;
}

export function loadSavedLayout(projectId: string): SavedAtlasLayout | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(storageKey(projectId));
    if (raw === null) return null;
    return migrateLayout(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveLayout(projectId: string, layout: SavedAtlasLayout): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(storageKey(projectId), JSON.stringify(layout));
  } catch {
    // quota exceeded or storage blocked — best-effort
  }
}

export function clearSavedLayout(projectId: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(storageKey(projectId));
  } catch {
    // best-effort
  }
}
