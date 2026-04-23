#!/usr/bin/env node
// scripts/drift/drift-audit.mjs
// Permanent repo utility for unified drift-telemetry audit (DRIFT-26).
//
// Reads .logs/drift-telemetry.jsonl (or --logs <path>), produces a per-surface
// scorecard report. Two output formats: markdown (default) and JSON.
//
// Exit codes:
//   0 = clean audit (no CRITICAL events in the filtered window)
//   1 = CRITICAL findings present
//
// CLI:
//   node scripts/drift/drift-audit.mjs [options]
//
// Options:
//   --logs <path>                    Override log file path (default: .logs/drift-telemetry.jsonl)
//   --format markdown|json           Output format (default: markdown)
//   --since <ISO-date>               Filter: only events at or after this timestamp
//   --surface knowledge|alignment|retrieval|all   Filter by surface (default: all)
//   --severity info|warn|critical|all             Filter by severity (default: all)

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Event type → surface + severity mapping
// ---------------------------------------------------------------------------

const EVENT_META = {
  'drift.knowledge.detected': { surface: 'knowledge', severity: 'warn' },
  'drift.alignment.taskDrift.detected': { surface: 'alignment', severity: 'warn' },
  'drift.retrieval.stale_index_detected': { surface: 'retrieval', severity: 'warn' },
  'drift.retrieval.lazy_grounding_detected': { surface: 'retrieval', severity: 'warn' },
  'drift.retrieval.context_collapse_detected': { surface: 'retrieval', severity: 'critical' },
};

// Classify severity from event content when not directly encoded in the event type.
// Rules:
//   - context_collapse → critical always
//   - lazy_grounding → use sgi_score with INVERTED polarity (lower = worse):
//       sgi_score <= 0.2 → critical
//       sgi_score <= 0.5 → warn
//       else             → info
//   - score >= 0.8 or drift_magnitude >= 0.8 → critical
//   - score >= 0.5 or drift_magnitude >= 0.5 → warn
//   - otherwise → info
function classifySeverity(event) {
  const type = event.type || event.event_type || '';
  if (type === 'drift.retrieval.context_collapse_detected') return 'critical';

  // Lazy-grounding: sgi_score polarity is inverted relative to score/drift_magnitude
  // (for SGI, HIGHER = more grounded = better). Use its own rule chain.
  if (type === 'drift.retrieval.lazy_grounding_detected') {
    const sgi = typeof event.sgi_score === 'number' ? event.sgi_score : null;
    if (sgi !== null) {
      if (sgi <= 0.2) return 'critical';
      if (sgi <= 0.5) return 'warn';
      return 'info';
    }
    // Missing sgi_score on a lazy-grounding event: fall back to static map.
    const meta = EVENT_META[type];
    return meta ? meta.severity : 'info';
  }

  // Score-based escalation (higher = worse for score, drift_magnitude, similarity)
  const score = event.score ?? event.drift_magnitude ?? event.similarity ?? null;
  if (typeof score === 'number') {
    if (score >= 0.8) return 'critical';
    if (score >= 0.5) return 'warn';
    return 'info';
  }

  // Fallback from static map
  const meta = EVENT_META[type];
  return meta ? meta.severity : 'info';
}

function classifySurface(event) {
  const type = event.type || event.event_type || '';
  if (type.startsWith('drift.knowledge')) return 'knowledge';
  if (type.startsWith('drift.alignment')) return 'alignment';
  if (type.startsWith('drift.retrieval')) return 'retrieval';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    logs: '.logs/drift-telemetry.jsonl',
    format: 'markdown',
    since: null,
    surface: 'all',
    severity: 'all',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--logs' && args[i + 1]) {
      result.logs = args[++i];
    } else if (arg === '--format' && args[i + 1]) {
      result.format = args[++i];
    } else if (arg === '--since' && args[i + 1]) {
      result.since = args[++i];
    } else if (arg === '--surface' && args[i + 1]) {
      result.surface = args[++i];
    } else if (arg === '--severity' && args[i + 1]) {
      result.severity = args[++i];
    }
  }

  return result;
}

// Reject --since values that don't parse as a real ISO-8601 date.
// Without this guard, a garbage value like "not-a-date" slips through
// the lexical `ts < since` comparison and silently filters all events
// out — producing a false "clean" audit in CI.
function isValidISODate(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  // Require at least a date-shaped prefix (YYYY-MM-DD). Node's Date
  // constructor will happily accept "2026" or "Mar 3" which aren't
  // well-suited for the lexical string compare used by the filter.
  return /^\d{4}-\d{2}-\d{2}/.test(value);
}

// ---------------------------------------------------------------------------
// Log reader
// ---------------------------------------------------------------------------

function readEvents(logsPath) {
  const resolved = path.resolve(logsPath);
  if (!fs.existsSync(resolved)) return [];

  const lines = fs.readFileSync(resolved, 'utf8').split('\n').filter((l) => l.trim().length > 0);
  const events = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }
  return events;
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

function filterEvents(events, { since, surface, severity }) {
  return events.filter((ev) => {
    // Timestamp filter
    if (since) {
      const ts = ev.timestamp;
      if (!ts || ts < since) return false;
    }

    // Surface filter
    if (surface !== 'all') {
      if (classifySurface(ev) !== surface) return false;
    }

    // Severity filter
    if (severity !== 'all') {
      if (classifySeverity(ev) !== severity) return false;
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// Scorecard computation
// ---------------------------------------------------------------------------

const SURFACES = ['knowledge', 'alignment', 'retrieval'];
const SEVERITIES = ['info', 'warn', 'critical'];

function buildScorecard(events) {
  // Initialize counts
  const counts = {};
  for (const surf of SURFACES) {
    counts[surf] = { info: 0, warn: 0, critical: 0, byType: {} };
  }

  for (const ev of events) {
    const surf = classifySurface(ev);
    const sev = classifySeverity(ev);
    const type = ev.type || ev.event_type || 'unknown';

    if (!counts[surf]) {
      counts[surf] = { info: 0, warn: 0, critical: 0, byType: {} };
    }
    counts[surf][sev] = (counts[surf][sev] || 0) + 1;
    counts[surf].byType[type] = (counts[surf].byType[type] || 0) + 1;
  }

  const totalCritical = Object.values(counts).reduce((acc, c) => acc + (c.critical || 0), 0);

  return { counts, totalCritical, totalEvents: events.length };
}

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

function renderMarkdown(scorecard, opts) {
  const { counts, totalCritical, totalEvents } = scorecard;
  const now = new Date().toISOString();
  const lines = [];

  lines.push('# Drift Audit Report');
  lines.push('');
  lines.push(`**Generated:** ${now}`);
  if (opts.since) lines.push(`**Since:** ${opts.since}`);
  if (opts.surface !== 'all') lines.push(`**Surface filter:** ${opts.surface}`);
  if (opts.severity !== 'all') lines.push(`**Severity filter:** ${opts.severity}`);
  lines.push(`**Total events scanned:** ${totalEvents}`);
  lines.push(`**Status:** ${totalCritical === 0 ? 'CLEAN' : `CRITICAL (${totalCritical} critical finding${totalCritical !== 1 ? 's' : ''})`}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const surf of SURFACES) {
    const c = counts[surf] || { info: 0, warn: 0, critical: 0, byType: {} };
    const total = c.info + c.warn + c.critical;
    lines.push(`## Surface: ${surf}`);
    lines.push('');
    lines.push(`| Severity | Count |`);
    lines.push(`| -------- | ----- |`);
    lines.push(`| info     | ${c.info} |`);
    lines.push(`| warn     | ${c.warn} |`);
    lines.push(`| critical | ${c.critical} |`);
    lines.push(`| **total** | **${total}** |`);
    lines.push('');

    const typeEntries = Object.entries(c.byType);
    if (typeEntries.length > 0) {
      lines.push('**By event type:**');
      lines.push('');
      lines.push(`| Event Type | Count |`);
      lines.push(`| ---------- | ----- |`);
      for (const [type, count] of typeEntries) {
        lines.push(`| \`${type}\` | ${count} |`);
      }
      lines.push('');
    } else {
      lines.push('_No events recorded for this surface._');
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push(`**Verdict:** ${totalCritical === 0 ? 'Exit 0 — audit clean.' : `Exit 1 — ${totalCritical} critical event${totalCritical !== 1 ? 's' : ''} require attention.`}`);
  lines.push('');
  lines.push('> See [docs/drift/telemetry-schema.md](../../docs/drift/telemetry-schema.md) for event field definitions.');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// JSON renderer
// ---------------------------------------------------------------------------

function renderJSON(scorecard, opts) {
  const { counts, totalCritical, totalEvents } = scorecard;
  const report = {
    generated: new Date().toISOString(),
    filters: {
      since: opts.since ?? null,
      surface: opts.surface,
      severity: opts.severity,
    },
    total_events: totalEvents,
    status: totalCritical === 0 ? 'clean' : 'critical',
    critical_count: totalCritical,
    surfaces: {},
  };

  for (const surf of SURFACES) {
    const c = counts[surf] || { info: 0, warn: 0, critical: 0, byType: {} };
    report.surfaces[surf] = {
      info: c.info,
      warn: c.warn,
      critical: c.critical,
      total: c.info + c.warn + c.critical,
      by_event_type: { ...c.byType },
    };
  }

  return JSON.stringify(report, null, 2);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function main() {
  const opts = parseArgs(process.argv);

  if (!['markdown', 'json'].includes(opts.format)) {
    console.error(`ERROR: Unknown format "${opts.format}". Use markdown or json.`);
    process.exit(2);
  }

  if (opts.since !== null && !isValidISODate(opts.since)) {
    console.error(
      `ERROR: Invalid --since date: "${opts.since}". Expected ISO-8601 (e.g. 2026-04-23T00:00:00Z).`,
    );
    process.exit(2);
  }

  const raw = readEvents(opts.logs);
  const filtered = filterEvents(raw, opts);
  const scorecard = buildScorecard(filtered);

  const output =
    opts.format === 'json'
      ? renderJSON(scorecard, opts)
      : renderMarkdown(scorecard, opts);

  console.log(output);
  process.exit(scorecard.totalCritical === 0 ? 0 : 1);
}

// Only run main when invoked directly (not when imported as a module).
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
