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

  it('captures token_budget threshold runs with unwired source metadata', async () => {
    writeSuggestions([]);
    await boundedLearningCommand(baseArgs(['--threshold', 'token_budget.warn_at_percent', '--json']));
    const raw = readFileSync(auditLogPath, 'utf8');
    const entry = JSON.parse(raw.trim());
    expect(entry.threshold).toBe('token_budget.warn_at_percent');
    expect(entry.observationSource.wired).toBe(false);
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

  it('reads token_budget.warn_at_percent and reports hold + unwired source (zero data)', async () => {
    writeSuggestions(
      // Even with suggestions data, token_budget threshold should NOT consume it.
      Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, state: 'accepted' })),
    );
    const code = await boundedLearningCommand(
      baseArgs(['--threshold', 'token_budget.warn_at_percent', '--json']),
    );
    expect(code).toBe(0);
    const out = JSON.parse(collectLog());
    expect(out.threshold).toBe('token_budget.warn_at_percent');
    expect(out.currentValue).toBe(4);
    expect(out.direction).toBe('hold');
    expect(out.observations).toBe(0);
    expect(out.observationSource.sourceId).toBe('token-budget-events');
    expect(out.observationSource.wired).toBe(false);
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
