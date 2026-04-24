/**
 * Wasserstein-Hebbian adapter — structured audit-finding emitter.
 *
 * Produces the `WassersteinAuditFinding` object. All functions here are
 * pure: no I/O, no write paths, no orchestration surface touch.
 *
 * Serialisation uses `JSON.stringify` with deterministic field order.
 * Parsing is fail-closed — any shape / JSON error returns `null`.
 *
 * @module wasserstein-hebbian/audit-finding
 */

import type { PlasticityRule, WassersteinAuditFinding } from './types.js';
import {
  collectInconsistencyReasons,
  validatePlasticityRule,
} from './plasticity-rule.js';

/**
 * Construct a finding from a plasticity rule. Verdict precedence:
 *
 *   - rule shape invalid ⇒ `'unaudited'`
 *   - rule inside stable region (no inconsistency reasons) ⇒ `'consistent'`
 *   - otherwise ⇒ `'inconsistent'` with reasons enumerated
 */
export function emitFinding(rule: PlasticityRule): WassersteinAuditFinding {
  const shape = validatePlasticityRule(rule);
  const timestamp = new Date().toISOString();
  if (!shape.ok) {
    return {
      findingId: makeId(timestamp, rule, 'unaudited'),
      type: 'unaudited',
      rule: copyRule(rule),
      reasons: shape.violations,
      timestamp,
    };
  }
  const reasons = collectInconsistencyReasons(rule);
  const type: WassersteinAuditFinding['type'] =
    reasons.length === 0 ? 'consistent' : 'inconsistent';
  return {
    findingId: makeId(timestamp, rule, type),
    type,
    rule: copyRule(rule),
    reasons,
    timestamp,
  };
}

function copyRule(r: PlasticityRule): PlasticityRule {
  const out: PlasticityRule = {
    ruleName: typeof r?.ruleName === 'string' ? r.ruleName : '',
    learningRate:
      typeof r?.learningRate === 'number' && Number.isFinite(r.learningRate)
        ? r.learningRate
        : Number.NaN,
  };
  if (r && typeof r.regularization === 'number' && Number.isFinite(r.regularization)) {
    out.regularization = r.regularization;
  }
  return out;
}

function makeId(timestamp: string, r: PlasticityRule, verdict: string): string {
  const tsKey = timestamp.replace(/[:.]/g, '-');
  const hash = hashRule(r, verdict);
  return `wh-${tsKey}-${hash}`;
}

function hashRule(r: PlasticityRule, verdict: string): string {
  let h = 0x811c9dc5;
  const name = typeof r?.ruleName === 'string' ? r.ruleName : '';
  const lr =
    typeof r?.learningRate === 'number' && Number.isFinite(r.learningRate)
      ? r.learningRate.toFixed(6)
      : 'nan';
  const reg =
    typeof r?.regularization === 'number' && Number.isFinite(r.regularization)
      ? r.regularization.toFixed(6)
      : 'none';
  const s = `${verdict}|${name}|${lr}|${reg}`;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * Serialise a finding to JSON with deterministic field order.
 */
export function serializeFinding(f: WassersteinAuditFinding): string {
  const ordered = {
    findingId: f.findingId,
    type: f.type,
    timestamp: f.timestamp,
    rule: {
      ruleName: f.rule.ruleName,
      learningRate: f.rule.learningRate,
      ...(f.rule.regularization !== undefined
        ? { regularization: f.rule.regularization }
        : {}),
    },
    reasons: [...f.reasons],
  };
  return JSON.stringify(ordered, null, 2);
}

/**
 * Parse a JSON string into a finding. Returns `null` on any shape / JSON
 * error (fail-closed).
 */
export function parseFinding(s: string): WassersteinAuditFinding | null {
  let raw: unknown;
  try {
    raw = JSON.parse(s);
  } catch {
    return null;
  }
  if (!validateFinding(raw)) return null;
  return raw as WassersteinAuditFinding;
}

/**
 * Structural validator for an `unknown` payload claiming to be a finding.
 * Returns `true` iff every required field is shape-valid.
 */
export function validateFinding(v: unknown): v is WassersteinAuditFinding {
  if (!v || typeof v !== 'object') return false;
  const rec = v as Record<string, unknown>;
  if (typeof rec.findingId !== 'string') return false;
  if (
    rec.type !== 'consistent' &&
    rec.type !== 'inconsistent' &&
    rec.type !== 'unaudited'
  ) {
    return false;
  }
  if (typeof rec.timestamp !== 'string') return false;
  if (!Array.isArray(rec.reasons)) return false;
  for (const r of rec.reasons) if (typeof r !== 'string') return false;
  const rule = rec.rule;
  if (!rule || typeof rule !== 'object') return false;
  const rr = rule as Record<string, unknown>;
  if (typeof rr.ruleName !== 'string') return false;
  if (typeof rr.learningRate !== 'number') return false;
  if (
    rr.regularization !== undefined &&
    typeof rr.regularization !== 'number'
  ) {
    return false;
  }
  return true;
}
