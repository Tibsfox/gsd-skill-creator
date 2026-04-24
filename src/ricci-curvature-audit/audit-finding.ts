/**
 * Ricci-Curvature Audit — structured audit-finding emitter.
 *
 * Produces the `AuditFinding` object consumed by the downstream
 * `tools/session-retro/observe.mjs` event pipeline. All functions here are
 * pure: no I/O, no write paths, no orchestration surface touch.
 *
 * Serialisation uses `JSON.stringify` with deterministic field order
 * and 2-space indent. Parsing is fail-closed — any shape / JSON error
 * returns `null`.
 *
 * @module ricci-curvature-audit/audit-finding
 */

import type {
  AuditFinding,
  EdgeCurvature,
  ObservatoryEvent,
} from './types.js';
import {
  DEFAULT_BOTTLENECK_THRESHOLD,
  detectBottlenecks,
} from './bottleneck-detector.js';

/**
 * Construct a finding from a list of edge-curvatures.
 *
 * The finding `type` is derived from the presence of bottlenecks:
 *   - any bottleneck present → `'bottleneck'`
 *   - no bottleneck but near-bottlenecks → `'near-bottleneck'`
 *   - otherwise → `'healthy'`
 */
export function emitFinding(
  curvatures: ReadonlyArray<EdgeCurvature>,
  threshold: number = DEFAULT_BOTTLENECK_THRESHOLD,
): AuditFinding {
  const report = detectBottlenecks(curvatures, threshold);
  const type: AuditFinding['type'] =
    report.bottlenecks.length > 0
      ? 'bottleneck'
      : report.nearBottlenecks.length > 0
        ? 'near-bottleneck'
        : 'healthy';
  const summary = buildSummary(report.bottlenecks.length, report.nearBottlenecks.length, report.healthy.length, report.threshold);
  const timestamp = new Date().toISOString();
  const findingId = `ricci-${timestamp.replace(/[:.]/g, '-')}-${hashEdges(curvatures)}`;
  return {
    findingId,
    type,
    edgesCurvatureList: [...curvatures],
    threshold: report.threshold,
    summary,
    timestamp,
  };
}

function buildSummary(nBottleneck: number, nNear: number, nHealthy: number, theta: number): string {
  const total = nBottleneck + nNear + nHealthy;
  return `Ricci-curvature audit: ${nBottleneck} bottleneck / ${nNear} near-bottleneck / ${nHealthy} healthy (of ${total} edges, threshold θ=${theta.toFixed(3)})`;
}

function hashEdges(curvatures: ReadonlyArray<EdgeCurvature>): string {
  // Stable short hash of edge list — not cryptographic, just disambiguates
  // findingIds produced in the same millisecond.
  let h = 0x811c9dc5;
  for (const rec of curvatures) {
    const s = `${rec.source}->${rec.target}:${rec.kappa.toFixed(6)}`;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
    }
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * Serialise a finding to JSON with deterministic field order.
 */
export function serializeFinding(f: AuditFinding): string {
  const ordered = {
    findingId: f.findingId,
    type: f.type,
    threshold: f.threshold,
    summary: f.summary,
    timestamp: f.timestamp,
    edgesCurvatureList: f.edgesCurvatureList.map((e) => ({
      source: e.source,
      target: e.target,
      kappa: e.kappa,
      wassersteinDistance: e.wassersteinDistance,
      geodesicDistance: e.geodesicDistance,
    })),
  };
  return JSON.stringify(ordered, null, 2);
}

/**
 * Parse a finding. Returns `null` on any JSON / shape error.
 */
export function parseFinding(s: string): AuditFinding | null {
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
 * Type guard for `AuditFinding`. Strict on every field.
 */
export function validateFinding(raw: unknown): raw is AuditFinding {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Record<string, unknown>;
  if (typeof r.findingId !== 'string') return false;
  if (r.type !== 'bottleneck' && r.type !== 'near-bottleneck' && r.type !== 'healthy') return false;
  if (typeof r.threshold !== 'number' || !Number.isFinite(r.threshold)) return false;
  if (typeof r.summary !== 'string') return false;
  if (typeof r.timestamp !== 'string') return false;
  if (!Array.isArray(r.edgesCurvatureList)) return false;
  for (const e of r.edgesCurvatureList) {
    if (!e || typeof e !== 'object') return false;
    const er = e as Record<string, unknown>;
    if (typeof er.source !== 'string') return false;
    if (typeof er.target !== 'string') return false;
    if (typeof er.kappa !== 'number' || !Number.isFinite(er.kappa)) return false;
    if (typeof er.wassersteinDistance !== 'number' || !Number.isFinite(er.wassersteinDistance)) return false;
    if (typeof er.geodesicDistance !== 'number' || !Number.isFinite(er.geodesicDistance)) return false;
  }
  return true;
}

/**
 * Adapter to the downstream observatory event shape
 * (`tools/session-retro/observe.mjs` writes events of this form to
 * `.planning/sessions/current.jsonl`). This is a pure shape-translator; no
 * I/O is performed here. The caller is responsible for any routing.
 */
export function toObservatoryEvent(f: AuditFinding): ObservatoryEvent {
  return {
    t: f.timestamp,
    kind: 'ricci-audit',
    label: f.type,
    payload: {
      findingId: f.findingId,
      threshold: f.threshold,
      summary: f.summary,
      edgeCount: f.edgesCurvatureList.length,
      bottleneckCount: f.edgesCurvatureList.filter((e) => e.kappa < -f.threshold).length,
    },
  };
}
