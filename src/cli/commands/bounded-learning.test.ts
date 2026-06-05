/**
 * Tests for the `bounded-learning` CLI command.
 *
 * Real-integration tests against the underlying bounded-learning primitive
 * with temp-dir fixtures for suggestions.json + skill-creator.json. Unit
 * tests for the primitive itself live in
 * `src/bounded-learning/__tests__/`; these tests focus on CLI argument
 * parsing, output formatting (text/quiet/JSON), and the `--apply` gate.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock('picocolors', () => ({
  default: {
    bold: (s: string) => s,
    dim: (s: string) => s,
    cyan: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
  },
}));

import { boundedLearningCommand } from './bounded-learning.js';
import { readAuditLog } from '../../bounded-learning/audit-log.js';

let tmpRoot: string;
let suggestionsPath: string;
let configPath: string;
let auditLogPath: string;
let logSpy: ReturnType<typeof vi.spyOn>;

function writeConfig(value: unknown): void {
  writeFileSync(configPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeSuggestions(value: unknown): void {
  writeFileSync(suggestionsPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function collectLog(): string {
  return logSpy.mock.calls.map((c: unknown[]) => String(c[0] ?? '')).join('\n');
}

function baseArgs(extra: string[] = []): string[] {
  // Always pass an audit-log path inside tmpRoot so tests never write to
  // the real audit-log path under the project planning dir (v1.49.799).
  return ['--suggestions', suggestionsPath, '--config', configPath, '--audit-log', auditLogPath, ...extra];
}

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'bounded-learning-cli-test-'));
  suggestionsPath = join(tmpRoot, 'suggestions.json');
  configPath = join(tmpRoot, 'skill-creator.json');
  auditLogPath = join(tmpRoot, 'bounded-learning-log.jsonl');
  writeConfig({ suggestions: { min_occurrences: 3 } });
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

describe('boundedLearningCommand — argument handling', () => {
  it('--help prints usage and exits 0', async () => {
    const code = await boundedLearningCommand(['--help']);
    expect(code).toBe(0);
    expect(collectLog()).toContain('skill-creator bounded-learning');
  });

  it('-h prints usage and exits 0', async () => {
    const code = await boundedLearningCommand(['-h']);
    expect(code).toBe(0);
    expect(collectLog()).toContain('skill-creator bounded-learning');
  });

  it('rejects unsupported --threshold', async () => {
    const code = await boundedLearningCommand(baseArgs(['--threshold', 'not.a.thing', '--json']));
    expect(code).toBe(1);
    expect(collectLog()).toContain('invalid-flag');
    expect(collectLog()).toContain('not.a.thing');
  });

  it('rejects invalid --alpha (out of range)', async () => {
    const code = await boundedLearningCommand(baseArgs(['--alpha', '2', '--json']));
    expect(code).toBe(1);
    expect(collectLog()).toContain('invalid-flag');
  });

  it('rejects invalid --lambda (non-positive)', async () => {
    const code = await boundedLearningCommand(baseArgs(['--lambda', '0', '--json']));
    expect(code).toBe(1);
  });

  it('exits 2 when config file is missing', async () => {
    rmSync(configPath);
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(2);
    expect(collectLog()).toContain('config-not-found');
  });

  it('exits 2 when threshold is not in config', async () => {
    writeConfig({ unrelated: { stuff: 42 } });
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(2);
    expect(collectLog()).toContain('threshold-not-in-config');
  });
});

describe('boundedLearningCommand — happy path: no suggestions', () => {
  it('handles missing suggestions.json gracefully (hold)', async () => {
    // suggestions.json deliberately absent.
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('hold');
    expect(out.observations).toBe(0);
    expect(out.proposedValue).toBeNull();
    expect(out.applied).toBe('noop');
  });

  it('handles empty suggestions.json gracefully', async () => {
    writeSuggestions([]);
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('hold');
    expect(out.observations).toBe(0);
  });
});

describe('boundedLearningCommand — happy path: accept-skew', () => {
  it('recommends decrease after 10 unanimous accepts', async () => {
    writeSuggestions(
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })),
    );
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('decrease');
    expect(out.rejected).toBe(true);
    expect(out.proposedValue).toBe(2);
    expect(out.applied).toBe('dry-run');
  });

  it('emits CSV in --quiet mode', async () => {
    writeSuggestions(
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })),
    );
    const code = await boundedLearningCommand(baseArgs(['--quiet']));
    expect(code).toBe(0);
    const line = collectLog();
    expect(line).toContain('suggestions.min_occurrences,3,2,decrease,rejected,10,');
  });
});

describe('boundedLearningCommand — happy path: dismiss-skew', () => {
  it('recommends increase after 10 unanimous dismisses', async () => {
    writeSuggestions(
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'dismissed' })),
    );
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('increase');
    expect(out.rejected).toBe(true);
    expect(out.proposedValue).toBe(4);
    expect(out.applied).toBe('dry-run');
  });
});

describe('boundedLearningCommand — --apply gate', () => {
  it('writes new value to config when --apply is passed', async () => {
    writeSuggestions(
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })),
    );
    const code = await boundedLearningCommand(baseArgs(['--apply', '--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.applied).toBe('applied');
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(onDisk.suggestions.min_occurrences).toBe(2);
  });

  it('does NOT write to config in default (dry-run) mode', async () => {
    writeSuggestions(
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })),
    );
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(onDisk.suggestions.min_occurrences).toBe(3);
  });

  it('does NOT write when no change is recommended even with --apply', async () => {
    writeSuggestions([
      { id: 'a', state: 'accepted' },
      { id: 'b', state: 'dismissed' },
    ]);
    const code = await boundedLearningCommand(baseArgs(['--apply', '--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('hold');
    expect(out.applied).toBe('noop');
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(onDisk.suggestions.min_occurrences).toBe(3);
  });
});

describe('boundedLearningCommand — retention bidirectional apply-guard (v1.49.982 / Ship 5.2 Option D)', () => {
  let retentionEventsPath: string;

  beforeEach(() => {
    retentionEventsPath = join(tmpRoot, 'observation-retention-events.jsonl');
    // observation.retention_days threshold target.
    writeConfig({ observation: { retention_days: 90 } });
  });

  function writeRetentionEvents(kinds: Array<'too_aggressive' | 'too_lax'>): void {
    const lines = kinds.map((kind, i) =>
      JSON.stringify({ timestamp: `2026-06-05T00:00:${String(i % 60).padStart(2, '0')}.000Z`, kind, droppedCount: 3, retentionDays: 90 }),
    );
    writeFileSync(retentionEventsPath, lines.join('\n') + '\n', 'utf8');
  }

  it('refuses --apply on a one-directional signal: exit 1, audit "refused", config untouched', async () => {
    // 20 too_aggressive → the e-process rejects and recommends increase, but the
    // signal is one-directional (0 too_lax) so the guard blocks the write.
    writeRetentionEvents(Array.from({ length: 20 }, () => 'too_aggressive'));

    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'observation.retention_days', '--apply', '--json']),
      { retentionEventsPath },
    );

    expect(code).toBe(1);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('increase');
    expect(out.applied).toBe('refused');
    expect(out.applyReason).toContain('not verifiably bidirectional');

    // Config NOT written.
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(onDisk.observation.retention_days).toBe(90);

    // Audit entry is forensically distinct from a plain noop.
    const audit = await readAuditLog(auditLogPath);
    expect(audit[audit.length - 1]?.applied).toBe('refused');
  });

  it('applies --apply once the signal is verifiably bidirectional', async () => {
    // 20 too_aggressive + 2 too_lax → recommendation still increase, but both
    // polarities present ⇒ guard lifts ⇒ write proceeds.
    writeRetentionEvents([
      ...Array.from({ length: 20 }, () => 'too_aggressive' as const),
      'too_lax',
      'too_lax',
    ]);

    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'observation.retention_days', '--apply', '--json']),
      { retentionEventsPath },
    );

    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.applied).toBe('applied');
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(onDisk.observation.retention_days).toBe(91);
  });
});

describe('boundedLearningCommand — --threshold suggestions.cooldown_days (v1.49.796)', () => {
  beforeEach(() => {
    // Live-default cooldown_days = 7; min_occurrences sibling preserved.
    writeConfig({ suggestions: { min_occurrences: 3, cooldown_days: 7 } });
  });

  it('reads the cooldown_days threshold from config and reports current value', async () => {
    writeSuggestions([]);
    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'suggestions.cooldown_days', '--json']),
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.threshold).toBe('suggestions.cooldown_days');
    expect(out.currentValue).toBe(7);
    expect(out.direction).toBe('hold');
  });

  it('recommends decrease (6) after 10 unanimous accepts', async () => {
    writeSuggestions(
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })),
    );
    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'suggestions.cooldown_days', '--json']),
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.threshold).toBe('suggestions.cooldown_days');
    expect(out.direction).toBe('decrease');
    expect(out.currentValue).toBe(7);
    expect(out.proposedValue).toBe(6);
    expect(out.applied).toBe('dry-run');
  });

  it('recommends increase (8) after 10 unanimous dismisses', async () => {
    writeSuggestions(
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'dismissed' })),
    );
    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'suggestions.cooldown_days', '--json']),
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('increase');
    expect(out.proposedValue).toBe(8);
  });

  it('writes cooldown_days=6 to config when --apply is passed (siblings preserved)', async () => {
    writeSuggestions(
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })),
    );
    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'suggestions.cooldown_days', '--apply', '--json']),
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.applied).toBe('applied');
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(onDisk.suggestions.cooldown_days).toBe(6);
    expect(onDisk.suggestions.min_occurrences).toBe(3);
  });
});

describe('boundedLearningCommand — --summary mode (v1.49.801)', () => {
  beforeEach(() => {
    writeConfig({
      suggestions: { min_occurrences: 3, cooldown_days: 7, auto_dismiss_after_days: 30 },
      token_budget: { max_percent: 5, warn_at_percent: 4 },
    });
  });

  it('emits JSON summary of all 7 wired thresholds with currentValue + observationSource', async () => {
    const code = await boundedLearningCommand(
      ['--config', configPath, '--audit-log', auditLogPath, '--summary'],
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.thresholds).toHaveLength(7);
    expect(out.wiredThresholdCount).toBe(7);
    const minOcc = out.thresholds.find((t: { threshold: string }) => t.threshold === 'suggestions.min_occurrences');
    expect(minOcc.currentValue).toBe(3);
    expect(minOcc.observationSource.sourceId).toBe('suggestions.json');
    expect(minOcc.observationSource.wired).toBe(true);
    const tokenBudget = out.thresholds.find((t: { threshold: string }) => t.threshold === 'token_budget.warn_at_percent');
    expect(tokenBudget.currentValue).toBe(4);
    // v1.49.803: token_budget.warn_at_percent observation source now wired.
    expect(tokenBudget.observationSource.wired).toBe(true);
    expect(tokenBudget.observationSource.sourceId).toBe('token-budget-events');
    // v1.49.837: predictive.low_confidence_threshold observation source now wired.
    const predictive = out.thresholds.find((t: { threshold: string }) => t.threshold === 'predictive.low_confidence_threshold');
    expect(predictive.observationSource.wired).toBe(true);
    expect(predictive.observationSource.sourceId).toBe('predictive-low-confidence-events');
    // v1.49.884: observation.retention_days observation source now wired.
    const obsRetention = out.thresholds.find((t: { threshold: string }) => t.threshold === 'observation.retention_days');
    expect(obsRetention.observationSource.wired).toBe(true);
    expect(obsRetention.observationSource.sourceId).toBe('observation-retention-events');
  });

  it('reports auditLog totalEntries=0 + lastEntryAt=null when log is empty', async () => {
    const code = await boundedLearningCommand(
      ['--config', configPath, '--audit-log', auditLogPath, '--summary'],
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.auditLog.totalEntries).toBe(0);
    expect(out.auditLog.lastEntryAt).toBeNull();
    expect(out.pendingRecommendations).toEqual([]);
  });

  it('reports lastTick + pendingRecommendation when prior --apply has run', async () => {
    // Seed the audit log by running a normal tick that produces a decrease + dry-run.
    writeSuggestions(Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })));
    await boundedLearningCommand(baseArgs(['--json']));
    // Re-spy on console.log so we only collect the --summary output.
    logSpy.mockClear();
    const code = await boundedLearningCommand(
      ['--config', configPath, '--audit-log', auditLogPath, '--summary'],
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    const minOcc = out.thresholds.find((t: { threshold: string }) => t.threshold === 'suggestions.min_occurrences');
    expect(minOcc.lastTick).not.toBeNull();
    expect(minOcc.lastTick.direction).toBe('decrease');
    expect(minOcc.lastTick.applied).toBe('dry-run');
    expect(out.pendingRecommendations).toHaveLength(1);
    expect(out.pendingRecommendations[0].threshold).toBe('suggestions.min_occurrences');
    expect(out.pendingRecommendations[0].proposedValue).toBe(2);
  });

  it('reports currentValue=null when config is missing the threshold key', async () => {
    writeConfig({}); // empty config
    const code = await boundedLearningCommand(
      ['--config', configPath, '--audit-log', auditLogPath, '--summary'],
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    for (const t of out.thresholds) {
      expect(t.currentValue).toBeNull();
    }
  });
});

describe('boundedLearningCommand — --record-event mode (v1.49.803)', () => {
  let tokenBudgetEventsPath: string;

  beforeEach(() => {
    tokenBudgetEventsPath = join(tmpRoot, 'token-budget-events.jsonl');
  });

  it('--record-event without --kind exits 1 with JSON error', async () => {
    const code = await boundedLearningCommand([
      '--record-event',
      '--token-budget-events', tokenBudgetEventsPath,
      '--json',
    ]);
    expect(code).toBe(1);
    const out = JSON.parse(collectLog());
    expect(out.error).toBe('missing-flag');
    expect(out.flag).toBe('--kind');
  });

  it('--record-event with invalid --kind exits 1', async () => {
    const code = await boundedLearningCommand([
      '--record-event',
      '--kind', 'maybe',
      '--token-budget-events', tokenBudgetEventsPath,
      '--json',
    ]);
    expect(code).toBe(1);
    const out = JSON.parse(collectLog());
    expect(out.error).toBe('invalid-flag');
  });

  it('--record-event --kind responsive appends one JSONL line to the events file', async () => {
    const code = await boundedLearningCommand([
      '--record-event',
      '--kind', 'responsive',
      '--token-budget-events', tokenBudgetEventsPath,
      '--json',
    ]);
    expect(code).toBe(0);
    expect(existsSync(tokenBudgetEventsPath)).toBe(true);
    const raw = readFileSync(tokenBudgetEventsPath, 'utf8');
    const lines = raw.split('\n').filter((l) => l.length > 0);
    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]!);
    expect(entry.kind).toBe('responsive');
    expect(typeof entry.timestamp).toBe('string');
  });

  it('--record-event --kind ignored captures optional usagePercent + warnAtPercent + reason', async () => {
    const code = await boundedLearningCommand([
      '--record-event',
      '--kind', 'ignored',
      '--usage-percent', '8',
      '--warn-at-percent', '4',
      '--reason', 'continued past warn',
      '--token-budget-events', tokenBudgetEventsPath,
      '--json',
    ]);
    expect(code).toBe(0);
    const raw = readFileSync(tokenBudgetEventsPath, 'utf8');
    const entry = JSON.parse(raw.trim());
    expect(entry.kind).toBe('ignored');
    expect(entry.usagePercent).toBe(8);
    expect(entry.warnAtPercent).toBe(4);
    expect(entry.reason).toBe('continued past warn');
  });

  it('subsequent calibration on token_budget.warn_at_percent reads the recorded events', async () => {
    writeConfig({
      suggestions: { min_occurrences: 3, cooldown_days: 7, auto_dismiss_after_days: 30 },
      token_budget: { max_percent: 5, warn_at_percent: 4 },
    });
    // Record 10 responsive events — strong accept-skew signal → decrease recommendation.
    for (let i = 0; i < 10; i++) {
      await boundedLearningCommand([
        '--record-event',
        '--kind', 'responsive',
        '--token-budget-events', tokenBudgetEventsPath,
        '--quiet',
      ]);
    }
    logSpy.mockClear();
    const code = await boundedLearningCommand(baseArgs([
      '--threshold', 'token_budget.warn_at_percent',
      '--token-budget-events', tokenBudgetEventsPath,
      '--json',
    ]));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.threshold).toBe('token_budget.warn_at_percent');
    expect(out.observations).toBe(10);
    expect(out.direction).toBe('decrease');
    expect(out.observationSource.wired).toBe(true);
  });
});

describe('boundedLearningCommand — --watch mode (v1.49.800)', () => {
  beforeEach(() => {
    writeConfig({ suggestions: { min_occurrences: 3, cooldown_days: 7, auto_dismiss_after_days: 30 }, token_budget: { max_percent: 5, warn_at_percent: 4 } });
  });

  it('fires one initial tick and exits cleanly when signal aborts before any change', async () => {
    writeSuggestions([]);
    const controller = new AbortController();
    queueMicrotask(() => controller.abort());
    const code = await boundedLearningCommand(
      baseArgs(['--watch', '--watch-debounce', '50', '--json']),
      { watchSignal: controller.signal },
    );
    expect(code).toBe(0);
    const log = collectLog();
    expect(log).toContain('"threshold"');
  });

  it('re-runs the tick when --suggestions changes', async () => {
    writeSuggestions([]);
    const controller = new AbortController();
    const cmdPromise = boundedLearningCommand(
      baseArgs(['--watch', '--watch-debounce', '50', '--json']),
      { watchSignal: controller.signal },
    );
    // Allow initial tick + watcher setup.
    await new Promise((r) => setTimeout(r, 80));
    writeSuggestions(Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })));
    await new Promise((r) => setTimeout(r, 200));
    controller.abort();
    const code = await cmdPromise;
    expect(code).toBe(0);
    // Audit log should now have >= 2 entries (initial + post-change).
    const raw = readFileSync(auditLogPath, 'utf8');
    const lines = raw.split('\n').filter((l) => l.length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    // Last entry should reflect the new accept-skew (decrease recommendation).
    const last = JSON.parse(lines[lines.length - 1]!);
    expect(last.direction).toBe('decrease');
    expect(last.proposedValue).toBe(2);
  });

  it('honors --watch-debounce override', async () => {
    writeSuggestions([]);
    const controller = new AbortController();
    queueMicrotask(() => controller.abort());
    const code = await boundedLearningCommand(
      baseArgs(['--watch', '--watch-debounce', '10', '--json']),
      { watchSignal: controller.signal },
    );
    expect(code).toBe(0);
  });
});

describe('boundedLearningCommand — audit log (v1.49.799)', () => {
  beforeEach(() => {
    writeConfig({ suggestions: { min_occurrences: 3, cooldown_days: 7, auto_dismiss_after_days: 30 }, token_budget: { max_percent: 5, warn_at_percent: 4 } });
  });

  it('writes one JSONL entry per invocation to --audit-log path', async () => {
    writeSuggestions([]);
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    expect(existsSync(auditLogPath)).toBe(true);
    const raw = readFileSync(auditLogPath, 'utf8');
    const lines = raw.split('\n').filter((l) => l.length > 0);
    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]!);
    expect(entry.threshold).toBe('suggestions.min_occurrences');
    expect(entry.applied).toBe('noop');
    expect(entry.observationSource.sourceId).toBe('suggestions.json');
    expect(typeof entry.timestamp).toBe('string');
  });

  it('appends a second entry on the second invocation without truncating', async () => {
    writeSuggestions([]);
    await boundedLearningCommand(baseArgs(['--json']));
    await boundedLearningCommand(baseArgs(['--threshold', 'suggestions.cooldown_days', '--json']));
    const raw = readFileSync(auditLogPath, 'utf8');
    const lines = raw.split('\n').filter((l) => l.length > 0);
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!).threshold).toBe('suggestions.min_occurrences');
    expect(JSON.parse(lines[1]!).threshold).toBe('suggestions.cooldown_days');
  });

  it('captures applied=applied when --apply triggers a write', async () => {
    writeSuggestions(Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })));
    await boundedLearningCommand(baseArgs(['--apply', '--json']));
    const raw = readFileSync(auditLogPath, 'utf8');
    const lines = raw.split('\n').filter((l) => l.length > 0);
    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]!);
    expect(entry.applied).toBe('applied');
    expect(entry.proposedValue).toBe(2);
    expect(entry.direction).toBe('decrease');
  });

  it('does NOT write the audit log when --no-audit-log is passed', async () => {
    writeSuggestions([]);
    await boundedLearningCommand(baseArgs(['--no-audit-log', '--json']));
    expect(existsSync(auditLogPath)).toBe(false);
  });

  it('captures token_budget threshold runs with wired source metadata (v1.49.803)', async () => {
    writeSuggestions([]);
    await boundedLearningCommand(baseArgs(['--threshold', 'token_budget.warn_at_percent', '--json']));
    const raw = readFileSync(auditLogPath, 'utf8');
    const entry = JSON.parse(raw.trim());
    expect(entry.threshold).toBe('token_budget.warn_at_percent');
    // v1.49.803: source now wired to token-budget-events.jsonl.
    expect(entry.observationSource.wired).toBe(true);
    expect(entry.observationSource.sourceId).toBe('token-budget-events');
  });
});

describe('boundedLearningCommand — --threshold token_budget.warn_at_percent (v1.49.798)', () => {
  beforeEach(() => {
    writeConfig({
      suggestions: { min_occurrences: 3, cooldown_days: 7, auto_dismiss_after_days: 30 },
      token_budget: { max_percent: 5, warn_at_percent: 4 },
    });
  });

  it('reads token_budget.warn_at_percent and reports hold + wired source (zero events at v1.49.803)', async () => {
    writeSuggestions(
      // Even with suggestions data, token_budget threshold should NOT consume it.
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })),
    );
    const code = await boundedLearningCommand(
      baseArgs([
        '--threshold', 'token_budget.warn_at_percent',
        '--token-budget-events', join(tmpRoot, 'token-budget-events.jsonl'),
        '--json',
      ]),
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.threshold).toBe('token_budget.warn_at_percent');
    expect(out.currentValue).toBe(4);
    expect(out.direction).toBe('hold');
    expect(out.observations).toBe(0);
    expect(out.observationSource.sourceId).toBe('token-budget-events');
    // v1.49.803: wire now exists; events file is empty so still no observations,
    // but the source is wired.
    expect(out.observationSource.wired).toBe(true);
  });

  it('does not write to config when --apply is passed with zero observations', async () => {
    writeSuggestions([]);
    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'token_budget.warn_at_percent', '--apply', '--json']),
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.applied).toBe('noop');
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(onDisk.token_budget.warn_at_percent).toBe(4);
  });

  it('suggestions thresholds still show wired source in JSON output', async () => {
    writeSuggestions([]);
    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'suggestions.min_occurrences', '--json']),
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.observationSource.sourceId).toBe('suggestions.json');
    expect(out.observationSource.wired).toBe(true);
  });
});

describe('boundedLearningCommand — --threshold suggestions.auto_dismiss_after_days (v1.49.797)', () => {
  beforeEach(() => {
    // Live-default auto_dismiss_after_days = 30; siblings preserved.
    writeConfig({ suggestions: { min_occurrences: 3, cooldown_days: 7, auto_dismiss_after_days: 30 } });
  });

  it('reads the auto_dismiss_after_days threshold from config and reports current value', async () => {
    writeSuggestions([]);
    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'suggestions.auto_dismiss_after_days', '--json']),
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.threshold).toBe('suggestions.auto_dismiss_after_days');
    expect(out.currentValue).toBe(30);
    expect(out.direction).toBe('hold');
  });

  it('recommends decrease (29) after 10 unanimous accepts', async () => {
    writeSuggestions(
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })),
    );
    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'suggestions.auto_dismiss_after_days', '--json']),
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.threshold).toBe('suggestions.auto_dismiss_after_days');
    expect(out.direction).toBe('decrease');
    expect(out.currentValue).toBe(30);
    expect(out.proposedValue).toBe(29);
    expect(out.applied).toBe('dry-run');
  });

  it('recommends increase (31) after 10 unanimous dismisses', async () => {
    writeSuggestions(
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'dismissed' })),
    );
    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'suggestions.auto_dismiss_after_days', '--json']),
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.direction).toBe('increase');
    expect(out.proposedValue).toBe(31);
  });

  it('writes auto_dismiss_after_days=29 to config when --apply is passed (siblings preserved)', async () => {
    writeSuggestions(
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })),
    );
    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'suggestions.auto_dismiss_after_days', '--apply', '--json']),
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.applied).toBe('applied');
    const onDisk = JSON.parse(readFileSync(configPath, 'utf8'));
    expect(onDisk.suggestions.auto_dismiss_after_days).toBe(29);
    expect(onDisk.suggestions.min_occurrences).toBe(3);
    expect(onDisk.suggestions.cooldown_days).toBe(7);
  });
});

describe('boundedLearningCommand — malformed input tolerance', () => {
  it('ignores garbage suggestions.json (treats as empty)', async () => {
    writeFileSync(suggestionsPath, '<<<not json>>>', 'utf8');
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.observations).toBe(0);
  });

  it('ignores non-array suggestions.json (treats as empty)', async () => {
    writeFileSync(suggestionsPath, '{"some": "object"}', 'utf8');
    const code = await boundedLearningCommand(baseArgs(['--json']));
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.observations).toBe(0);
  });
});

describe('boundedLearningCommand — --query mode (v1.49.804)', () => {
  let tokenBudgetEventsPath: string;

  function writeAuditEntries(entries: Array<Record<string, unknown>>): void {
    const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
    writeFileSync(auditLogPath, lines, 'utf8');
  }

  function writeEventEntries(events: Array<Record<string, unknown>>): void {
    const lines = events.map((e) => JSON.stringify(e)).join('\n') + '\n';
    writeFileSync(tokenBudgetEventsPath, lines, 'utf8');
  }

  beforeEach(() => {
    tokenBudgetEventsPath = join(tmpRoot, 'token-budget-events.jsonl');
  });

  it('--query defaults to audit log + emits empty result when log missing', async () => {
    const code = await boundedLearningCommand([
      '--query',
      '--audit-log', join(tmpRoot, 'no-such-log.jsonl'),
      '--json',
    ]);
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.log).toBe('audit');
    expect(out.count).toBe(0);
    expect(out.entries).toEqual([]);
  });

  it('--query --log audit returns all entries by default', async () => {
    writeAuditEntries([
      { timestamp: '2026-05-27T01:00:00.000Z', threshold: 'suggestions.min_occurrences', currentValue: 3, proposedValue: null, direction: 'hold', applied: 'noop' },
      { timestamp: '2026-05-27T02:00:00.000Z', threshold: 'suggestions.cooldown_days', currentValue: 7, proposedValue: 6, direction: 'decrease', applied: 'dry-run' },
    ]);
    const code = await boundedLearningCommand([
      '--query', '--log', 'audit',
      '--audit-log', auditLogPath,
      '--json',
    ]);
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.count).toBe(2);
    expect(out.entries[0].threshold).toBe('suggestions.min_occurrences');
    expect(out.entries[1].direction).toBe('decrease');
  });

  it('--query --log audit --last N returns last N entries', async () => {
    writeAuditEntries([
      { timestamp: '2026-05-27T01:00:00.000Z', threshold: 'suggestions.min_occurrences', currentValue: 3, proposedValue: null, direction: 'hold', applied: 'noop' },
      { timestamp: '2026-05-27T02:00:00.000Z', threshold: 'suggestions.cooldown_days', currentValue: 7, proposedValue: 6, direction: 'decrease', applied: 'dry-run' },
      { timestamp: '2026-05-27T03:00:00.000Z', threshold: 'suggestions.auto_dismiss_after_days', currentValue: 30, proposedValue: 31, direction: 'increase', applied: 'dry-run' },
    ]);
    const code = await boundedLearningCommand([
      '--query', '--log', 'audit', '--last', '2',
      '--audit-log', auditLogPath,
      '--json',
    ]);
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.count).toBe(2);
    expect(out.entries[0].threshold).toBe('suggestions.cooldown_days');
    expect(out.entries[1].threshold).toBe('suggestions.auto_dismiss_after_days');
  });

  it('--query --log audit --since filters by ISO timestamp', async () => {
    writeAuditEntries([
      { timestamp: '2026-05-27T01:00:00.000Z', threshold: 'suggestions.min_occurrences', currentValue: 3, proposedValue: null, direction: 'hold', applied: 'noop' },
      { timestamp: '2026-05-27T02:30:00.000Z', threshold: 'suggestions.cooldown_days', currentValue: 7, proposedValue: 6, direction: 'decrease', applied: 'dry-run' },
      { timestamp: '2026-05-27T04:00:00.000Z', threshold: 'suggestions.auto_dismiss_after_days', currentValue: 30, proposedValue: 31, direction: 'increase', applied: 'dry-run' },
    ]);
    const code = await boundedLearningCommand([
      '--query', '--log', 'audit', '--since', '2026-05-27T02:00:00.000Z',
      '--audit-log', auditLogPath,
      '--json',
    ]);
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.count).toBe(2);
    expect(out.entries[0].threshold).toBe('suggestions.cooldown_days');
  });

  it('--query --log audit --threshold filters by threshold key', async () => {
    writeAuditEntries([
      { timestamp: '2026-05-27T01:00:00.000Z', threshold: 'suggestions.min_occurrences', currentValue: 3, proposedValue: null, direction: 'hold', applied: 'noop' },
      { timestamp: '2026-05-27T02:00:00.000Z', threshold: 'suggestions.cooldown_days', currentValue: 7, proposedValue: 6, direction: 'decrease', applied: 'dry-run' },
      { timestamp: '2026-05-27T03:00:00.000Z', threshold: 'suggestions.cooldown_days', currentValue: 6, proposedValue: 5, direction: 'decrease', applied: 'applied' },
    ]);
    const code = await boundedLearningCommand([
      '--query', '--log', 'audit', '--threshold', 'suggestions.cooldown_days',
      '--audit-log', auditLogPath,
      '--json',
    ]);
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.count).toBe(2);
    expect(out.entries.every((e: { threshold: string }) => e.threshold === 'suggestions.cooldown_days')).toBe(true);
  });

  it('--query --log audit --quiet emits CSV one line per entry', async () => {
    writeAuditEntries([
      { timestamp: '2026-05-27T01:00:00.000Z', threshold: 'suggestions.min_occurrences', currentValue: 3, proposedValue: null, direction: 'hold', applied: 'noop' },
      { timestamp: '2026-05-27T02:00:00.000Z', threshold: 'suggestions.cooldown_days', currentValue: 7, proposedValue: 6, direction: 'decrease', applied: 'dry-run' },
    ]);
    const code = await boundedLearningCommand([
      '--query', '--log', 'audit',
      '--audit-log', auditLogPath,
      '--quiet',
    ]);
    expect(code).toBe(0);
    const lines = collectLog().split('\n').filter((l) => l.length > 0);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('suggestions.min_occurrences');
    expect(lines[1]).toContain('decrease');
  });

  it('--query --log events returns events log entries', async () => {
    writeEventEntries([
      { timestamp: '2026-05-27T01:00:00.000Z', kind: 'responsive' },
      { timestamp: '2026-05-27T02:00:00.000Z', kind: 'ignored', usagePercent: 85, warnAtPercent: 80 },
    ]);
    const code = await boundedLearningCommand([
      '--query', '--log', 'events',
      '--token-budget-events', tokenBudgetEventsPath,
      '--json',
    ]);
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.log).toBe('events');
    expect(out.count).toBe(2);
    expect(out.entries[1].usagePercent).toBe(85);
  });

  it('--query --log events --kind filters by event kind', async () => {
    writeEventEntries([
      { timestamp: '2026-05-27T01:00:00.000Z', kind: 'responsive' },
      { timestamp: '2026-05-27T02:00:00.000Z', kind: 'ignored' },
      { timestamp: '2026-05-27T03:00:00.000Z', kind: 'responsive' },
    ]);
    const code = await boundedLearningCommand([
      '--query', '--log', 'events', '--kind', 'responsive',
      '--token-budget-events', tokenBudgetEventsPath,
      '--json',
    ]);
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.count).toBe(2);
    expect(out.entries.every((e: { kind: string }) => e.kind === 'responsive')).toBe(true);
  });

  it('--query --log events --last + --since compose correctly', async () => {
    writeEventEntries([
      { timestamp: '2026-05-27T01:00:00.000Z', kind: 'responsive' },
      { timestamp: '2026-05-27T02:00:00.000Z', kind: 'ignored' },
      { timestamp: '2026-05-27T03:00:00.000Z', kind: 'responsive' },
      { timestamp: '2026-05-27T04:00:00.000Z', kind: 'ignored' },
    ]);
    const code = await boundedLearningCommand([
      '--query', '--log', 'events',
      '--since', '2026-05-27T02:00:00.000Z',
      '--last', '2',
      '--token-budget-events', tokenBudgetEventsPath,
      '--json',
    ]);
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.count).toBe(2);
    expect(out.entries[0].timestamp).toBe('2026-05-27T03:00:00.000Z');
    expect(out.entries[1].timestamp).toBe('2026-05-27T04:00:00.000Z');
  });

  it('--query --log events --quiet emits CSV with reason commas sanitized', async () => {
    writeEventEntries([
      { timestamp: '2026-05-27T01:00:00.000Z', kind: 'ignored', reason: 'a, b, c' },
    ]);
    const code = await boundedLearningCommand([
      '--query', '--log', 'events',
      '--token-budget-events', tokenBudgetEventsPath,
      '--quiet',
    ]);
    expect(code).toBe(0);
    const out = collectLog();
    expect(out).toContain('a; b; c');
    expect(out).not.toContain('a, b, c');
  });

  it('--query --log invalid exits 1 with JSON error', async () => {
    const code = await boundedLearningCommand([
      '--query', '--log', 'bogus',
      '--json',
    ]);
    expect(code).toBe(1);
    const out = JSON.parse(collectLog());
    expect(out.error).toBe('invalid-flag');
    expect(out.flag).toBe('--log');
  });

  it('--query --last 0 exits 1', async () => {
    const code = await boundedLearningCommand([
      '--query', '--last', '0',
      '--json',
    ]);
    expect(code).toBe(1);
    const out = JSON.parse(collectLog());
    expect(out.error).toBe('invalid-flag');
    expect(out.flag).toBe('--last');
  });

  it('--query --since not-an-iso exits 1', async () => {
    const code = await boundedLearningCommand([
      '--query', '--since', 'not a date',
      '--json',
    ]);
    expect(code).toBe(1);
    const out = JSON.parse(collectLog());
    expect(out.error).toBe('invalid-flag');
    expect(out.flag).toBe('--since');
  });

  it('--query --log audit --threshold BAD exits 1', async () => {
    const code = await boundedLearningCommand([
      '--query', '--log', 'audit', '--threshold', 'no.such.threshold',
      '--json',
    ]);
    expect(code).toBe(1);
    const out = JSON.parse(collectLog());
    expect(out.error).toBe('invalid-flag');
    expect(out.flag).toBe('--threshold');
  });

  it('--query --log events --kind BAD exits 1', async () => {
    const code = await boundedLearningCommand([
      '--query', '--log', 'events', '--kind', 'maybe',
      '--json',
    ]);
    expect(code).toBe(1);
    const out = JSON.parse(collectLog());
    expect(out.error).toBe('invalid-flag');
    expect(out.flag).toBe('--kind');
  });

  it('--query tolerates malformed lines in the JSONL log', async () => {
    writeFileSync(
      tokenBudgetEventsPath,
      [
        JSON.stringify({ timestamp: '2026-05-27T01:00:00.000Z', kind: 'responsive' }),
        '{not json',
        JSON.stringify({ timestamp: '2026-05-27T02:00:00.000Z', kind: 'ignored' }),
        '',
      ].join('\n'),
      'utf8',
    );
    const code = await boundedLearningCommand([
      '--query', '--log', 'events',
      '--token-budget-events', tokenBudgetEventsPath,
      '--json',
    ]);
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.count).toBe(2);
  });
});
