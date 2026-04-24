/**
 * Hourglass-Persistence Audit — structured audit-finding emitter.
 *
 * Produces the `HourglassFinding` object consumed by the downstream
 * `tools/session-retro/observe.mjs` event pipeline. All functions here are
 * pure: no I/O, no write paths, no orchestration surface touch.
 *
 * Serialisation uses `JSON.stringify` with deterministic field order
 * and 2-space indent. Parsing is fail-closed — any shape / JSON error
 * returns `null`.
 *
 * @module hourglass-persistence/audit-finding
 */

import type {
  ContractionIndex,
  HourglassFinding,
  ObservatoryEvent,
  TopologicalHole,
} from './types.js';
import {
  DEFAULT_WAIST_THRESHOLD,
  detectWaists,
} from './contraction-index.js';

/**
 * Construct a finding from contraction indices + detected holes.
 *
 * The finding `type` is derived by precedence:
 *   - any waist (index > threshold) → `'waist'`
 *   - no waist but ≥1 hole → `'hole'`
 *   - otherwise → `'healthy'`
 */
export function emitFinding(
  indices: ReadonlyArray<ContractionIndex>,
  holes: ReadonlyArray<TopologicalHole>,
  threshold: number = DEFAULT_WAIST_THRESHOLD,
): HourglassFinding {
  const waists = detectWaists(indices, threshold);
  const type: HourglassFinding['type'] =
    waists.length > 0
      ? 'waist'
      : holes.length > 0
        ? 'hole'
        : 'healthy';
  const summary = buildSummary(waists.length, holes.length, indices.length, threshold);
  const timestamp = new Date().toISOString();
  const findingId = `hourglass-${timestamp.replace(/[:.]/g, '-')}-${hashSignal(indices, holes)}`;
  return {
    findingId,
    type,
    contractionIndices: [...indices],
    holes: [...holes],
    summary,
    timestamp,
  };
}

function buildSummary(
  nWaists: number,
  nHoles: number,
  nVertices: number,
  theta: number,
): string {
  return (
    `Hourglass-persistence audit: ${nWaists} waist / ${nHoles} hole ` +
    `(of ${nVertices} vertices, waist threshold θ=${theta.toFixed(3)})`
  );
}

function hashSignal(
  indices: ReadonlyArray<ContractionIndex>,
  holes: ReadonlyArray<TopologicalHole>,
): string {
  let h = 0x811c9dc5;
  for (const rec of indices) {
    const s = `${rec.vertex}:${rec.index.toFixed(6)}`;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
    }
  }
  for (const hole of holes) {
    const s = `${hole.vertices.join('|')}:${hole.persistence.toFixed(6)}`;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
    }
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * Serialise a finding to JSON with deterministic field order.
 */
export function serializeFinding(f: HourglassFinding): string {
  const ordered = {
    findingId: f.findingId,
    type: f.type,
    summary: f.summary,
    timestamp: f.timestamp,
    contractionIndices: f.contractionIndices.map((r) => ({
      vertex: r.vertex,
      index: r.index,
      componentsBefore: r.componentsBefore,
      componentsAfter: r.componentsAfter,
    })),
    holes: f.holes.map((h) => ({
      vertices: [...h.vertices],
      persistence: h.persistence,
      kind: h.kind,
    })),
  };
  return JSON.stringify(ordered, null, 2);
}

/**
 * Parse a finding. Returns `null` on any JSON / shape error.
 */
export function parseFinding(s: string): HourglassFinding | null {
  let raw: unknown;
  try {
    raw = JSON.parse(s);
  } catch {
    return null;
  }
  if (!validateFinding(raw)) return null;
  return raw;
}

/**
 * Type guard for `HourglassFinding`. Strict on every field.
 */
export function validateFinding(raw: unknown): raw is HourglassFinding {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Record<string, unknown>;
  if (typeof r.findingId !== 'string') return false;
  if (r.type !== 'waist' && r.type !== 'hole' && r.type !== 'healthy') return false;
  if (typeof r.summary !== 'string') return false;
  if (typeof r.timestamp !== 'string') return false;
  if (!Array.isArray(r.contractionIndices)) return false;
  for (const rec of r.contractionIndices) {
    if (!rec || typeof rec !== 'object') return false;
    const er = rec as Record<string, unknown>;
    if (typeof er.vertex !== 'string') return false;
    if (typeof er.index !== 'number' || !Number.isFinite(er.index)) return false;
    if (typeof er.componentsBefore !== 'number' || !Number.isFinite(er.componentsBefore)) return false;
    if (typeof er.componentsAfter !== 'number' || !Number.isFinite(er.componentsAfter)) return false;
  }
  if (!Array.isArray(r.holes)) return false;
  for (const hole of r.holes) {
    if (!hole || typeof hole !== 'object') return false;
    const hr = hole as Record<string, unknown>;
    if (!Array.isArray(hr.vertices)) return false;
    for (const v of hr.vertices) {
      if (typeof v !== 'string') return false;
    }
    if (typeof hr.persistence !== 'number' || !Number.isFinite(hr.persistence)) return false;
    if (hr.kind !== '1-hole' && hr.kind !== 'persistent-hole') return false;
  }
  return true;
}

/**
 * Adapter to the downstream observatory event shape. Pure shape-translator;
 * no I/O is performed here.
 */
export function toObservatoryEvent(f: HourglassFinding): ObservatoryEvent {
  return {
    t: f.timestamp,
    kind: 'hourglass-audit',
    label: f.type,
    payload: {
      findingId: f.findingId,
      summary: f.summary,
      vertexCount: f.contractionIndices.length,
      waistCount: f.contractionIndices.filter((r) => r.index > DEFAULT_WAIST_THRESHOLD).length,
      holeCount: f.holes.length,
    },
  };
}
