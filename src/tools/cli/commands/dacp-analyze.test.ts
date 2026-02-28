/**
 * Tests for DACP analyze CLI command.
 *
 * Mocks the retrospective analyzer module to isolate CLI logic.
 * Verifies exit codes, output formatting, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock functions
const { mockLog, mockAnalyzePatterns, mockReadDriftHistory } = vi.hoisted(
  () => ({
    mockLog: {
      error: vi.fn(),
      message: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      warn: vi.fn(),
    },
    mockAnalyzePatterns: vi.fn(),
    mockReadDriftHistory: vi.fn(),
  }),
);

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: mockLog,
}));

// Mock picocolors pass-through
vi.mock('picocolors', () => ({
  default: {
    bold: (s: string) => s,
    dim: (s: string) => s,
    cyan: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    bgCyan: (s: string) => s,
    black: (s: string) => s,
  },
}));

// Mock the retrospective analyzer module
vi.mock('../../../dacp/retrospective/index.js', () => ({
  analyzePatterns: mockAnalyzePatterns,
  readDriftHistory: mockReadDriftHistory,
}));

import { dacpAnalyzeCommand } from './dacp-analyze.js';

// ── Fixtures ─────────────────────────────────────────────────────────

const mockAnalysisResult = {
  patterns_created: 2,
  patterns_updated: 1,
  promotions_recommended: [
    {
      id: 'pattern-planner->executor:schema-task',
      type: 'planner->executor:schema-task',
      observed_count: 12,
      avg_drift_score: 0.42,
      current_fidelity: 2,
      recommended_fidelity: 3,
      last_observed: '2026-02-27T10:00:00.000Z',
      promotion_history: [],
    },
  ],
  demotions_recommended: [],
  summary: {
    total_handoffs_analyzed: 15,
    avg_drift_score: 0.18,
    highest_drift_pattern: 'planner->executor:schema-task',
    lowest_drift_pattern: 'executor->verifier:test-handoff',
  },
};

const mockDriftRecords = [
  {
    score: 0.45,
    bundle_id: 'b-001',
    handoff_type: 'planner->executor:schema-task',
    fidelity_level: 2,
    timestamp: '2026-02-27T10:00:00.000Z',
    intent_alignment: 0.55,
    rework_required: true,
    tokens_spent_interpreting: 1200,
    code_modifications: 3,
    verification_pass: true,
  },
];

// ── Tests ────────────────────────────────────────────────────────────

describe('dacpAnalyzeCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 and prints usage for --help', async () => {
    const result = await dacpAnalyzeCommand(['--help']);
    expect(result).toBe(0);
  });

  it('invokes analyzer with no filter and prints summary', async () => {
    mockReadDriftHistory.mockResolvedValue(mockDriftRecords);
    mockAnalyzePatterns.mockReturnValue(mockAnalysisResult);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpAnalyzeCommand([]);

    expect(result).toBe(0);
    expect(mockAnalyzePatterns).toHaveBeenCalled();

    const allCalls = [
      ...mockLog.message.mock.calls.map((c: unknown[]) => String(c[0])),
      ...mockLog.info.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    // Should show analysis summary info
    expect(allCalls).toMatch(/15|handoffs|analyzed/i);

    consoleSpy.mockRestore();
  });

  it('passes milestone filter with --milestone flag', async () => {
    mockReadDriftHistory.mockResolvedValue(mockDriftRecords);
    mockAnalyzePatterns.mockReturnValue(mockAnalysisResult);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpAnalyzeCommand(['--milestone', 'v1.49']);

    expect(result).toBe(0);
    // The milestone filter should be passed through to readDriftHistory
    expect(mockReadDriftHistory).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('outputs analysis result as JSON with --json flag', async () => {
    mockReadDriftHistory.mockResolvedValue(mockDriftRecords);
    mockAnalyzePatterns.mockReturnValue(mockAnalysisResult);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpAnalyzeCommand(['--json']);

    expect(result).toBe(0);
    const jsonCalls = consoleSpy.mock.calls.filter((c: unknown[]) => {
      try {
        JSON.parse(String(c[0]));
        return true;
      } catch {
        return false;
      }
    });
    expect(jsonCalls.length).toBeGreaterThanOrEqual(1);

    const output = JSON.parse(String(jsonCalls[0][0]));
    expect(output).toHaveProperty('summary');
    expect(output.summary.total_handoffs_analyzed).toBe(15);

    consoleSpy.mockRestore();
  });

  it('returns 1 when analyzer throws an error', async () => {
    mockReadDriftHistory.mockRejectedValue(new Error('Filesystem error'));

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpAnalyzeCommand([]);

    expect(result).toBe(1);

    consoleSpy.mockRestore();
  });

  it('prints "No handoff data" when no records exist', async () => {
    mockReadDriftHistory.mockResolvedValue([]);
    mockAnalyzePatterns.mockReturnValue({
      patterns_created: 0,
      patterns_updated: 0,
      promotions_recommended: [],
      demotions_recommended: [],
      summary: {
        total_handoffs_analyzed: 0,
        avg_drift_score: 0,
        highest_drift_pattern: '',
        lowest_drift_pattern: '',
      },
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpAnalyzeCommand([]);

    expect(result).toBe(0);
    const allCalls = [
      ...mockLog.message.mock.calls.map((c: unknown[]) => String(c[0])),
      ...mockLog.info.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    expect(allCalls).toMatch(/[Nn]o handoff data/i);

    consoleSpy.mockRestore();
  });
});
