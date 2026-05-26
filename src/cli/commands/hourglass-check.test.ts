/**
 * Tests for the `hourglass-check` CLI command.
 *
 * Mocks the hourglass-persistence module to isolate CLI logic from the
 * actual graph computation. Verifies exit codes, output formatting, opt-in
 * flag reporting, and the advisory-only invariant.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockLog,
  mockDetectHoles,
  mockComputeContractionIndices,
  mockDetectWaists,
  mockAggregateContractionIndex,
  mockEmitFinding,
  mockIsHourglassPersistenceEnabled,
} = vi.hoisted(() => ({
  mockLog: {
    error: vi.fn(),
    message: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
  mockDetectHoles: vi.fn(),
  mockComputeContractionIndices: vi.fn(),
  mockDetectWaists: vi.fn(),
  mockAggregateContractionIndex: vi.fn(),
  mockEmitFinding: vi.fn(),
  mockIsHourglassPersistenceEnabled: vi.fn(),
}));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: mockLog,
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

vi.mock('../../hourglass-persistence/index.js', () => ({
  DEFAULT_WAIST_THRESHOLD: 1.0,
  detectHoles: mockDetectHoles,
  computeContractionIndices: mockComputeContractionIndices,
  detectWaists: mockDetectWaists,
  aggregateContractionIndex: mockAggregateContractionIndex,
  emitFinding: mockEmitFinding,
  isHourglassPersistenceEnabled: mockIsHourglassPersistenceEnabled,
}));

import { hourglassCheckCommand } from './hourglass-check.js';

// Fixtures
const mockIndices = [
  { vertex: 'm', index: 2.0, componentsBefore: 1, componentsAfter: 2 },
  { vertex: 'a', index: 1.0, componentsBefore: 1, componentsAfter: 1 },
];
const mockHoles = [{ vertices: ['a', 'b', 'c'], persistence: 0.5, kind: '1-hole' as const }];
const mockWaists = [mockIndices[0]];
const healthyFinding = { findingId: 'h-1', type: 'healthy' as const, contractionIndices: [], holes: [], summary: 's', timestamp: 't' };
const waistFinding = { ...healthyFinding, type: 'waist' as const };
const holeFinding = { ...healthyFinding, type: 'hole' as const };

describe('hourglassCheckCommand', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockDetectHoles.mockReturnValue([]);
    mockComputeContractionIndices.mockReturnValue(mockIndices);
    mockDetectWaists.mockReturnValue([]);
    mockAggregateContractionIndex.mockReturnValue(1.0);
    mockEmitFinding.mockReturnValue(healthyFinding);
    mockIsHourglassPersistenceEnabled.mockReturnValue(false);
  });

  describe('argument handling', () => {
    it('--help returns 0', async () => {
      const code = await hourglassCheckCommand(['hourglass-check', '--help']);
      expect(code).toBe(0);
      expect(mockDetectHoles).not.toHaveBeenCalled();
    });

    it('-h returns 0', async () => {
      const code = await hourglassCheckCommand(['hourglass-check', '-h']);
      expect(code).toBe(0);
    });

    it('defaults --shape to hourglass', async () => {
      const code = await hourglassCheckCommand(['hourglass-check']);
      expect(code).toBe(0);
      expect(mockDetectHoles).toHaveBeenCalled();
    });

    it('honors --shape chain', async () => {
      const code = await hourglassCheckCommand(['hourglass-check', '--shape', 'chain']);
      expect(code).toBe(0);
    });

    it('honors --shape empty', async () => {
      const code = await hourglassCheckCommand(['hourglass-check', '--shape', 'empty']);
      expect(code).toBe(0);
    });

    it('rejects unknown --shape with exit 1', async () => {
      const code = await hourglassCheckCommand(['hourglass-check', '--shape', 'pentagon']);
      expect(code).toBe(1);
      expect(mockLog.error).toHaveBeenCalled();
    });

    it('honors --waist-threshold', async () => {
      await hourglassCheckCommand(['hourglass-check', '--waist-threshold', '1.5']);
      expect(mockDetectWaists).toHaveBeenCalledWith(mockIndices, 1.5);
    });

    it('rejects negative --waist-threshold with exit 1', async () => {
      const code = await hourglassCheckCommand(['hourglass-check', '--waist-threshold', '-1']);
      expect(code).toBe(1);
    });

    it('rejects non-numeric --waist-threshold with exit 1', async () => {
      const code = await hourglassCheckCommand(['hourglass-check', '--waist-threshold', 'abc']);
      expect(code).toBe(1);
    });
  });

  describe('healthy path', () => {
    it('text mode reports finding healthy (no warn)', async () => {
      await hourglassCheckCommand(['hourglass-check']);
      expect(mockLog.warn).not.toHaveBeenCalled();
    });

    it('json mode emits full record', async () => {
      await hourglassCheckCommand(['hourglass-check', '--json']);
      const parsed = JSON.parse(
        logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n'),
      );
      expect(parsed.shape).toBe('hourglass');
      expect(parsed.finding.type).toBe('healthy');
      expect(parsed.holes).toEqual([]);
      expect(parsed.indices).toEqual(mockIndices);
    });

    it('quiet mode emits CSV', async () => {
      await hourglassCheckCommand(['hourglass-check', '--quiet']);
      const out = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
      expect(out).toContain('hourglass,7,off,0,0,1.000,healthy');
    });
  });

  describe('waist-found path', () => {
    it('text mode warns when finding is waist', async () => {
      mockDetectWaists.mockReturnValue(mockWaists);
      mockAggregateContractionIndex.mockReturnValue(2.0);
      mockEmitFinding.mockReturnValue(waistFinding);
      await hourglassCheckCommand(['hourglass-check']);
      expect(mockLog.warn).toHaveBeenCalled();
    });

    it('json mode reports waist finding', async () => {
      mockDetectWaists.mockReturnValue(mockWaists);
      mockEmitFinding.mockReturnValue(waistFinding);
      await hourglassCheckCommand(['hourglass-check', '--json']);
      const parsed = JSON.parse(
        logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n'),
      );
      expect(parsed.finding.type).toBe('waist');
      expect(parsed.waists).toEqual(mockWaists);
    });

    it('quiet mode shows waist count > 0', async () => {
      mockDetectWaists.mockReturnValue(mockWaists);
      mockEmitFinding.mockReturnValue(waistFinding);
      await hourglassCheckCommand(['hourglass-check', '--quiet']);
      const out = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
      expect(out).toContain(',1,1.000,waist');
    });
  });

  describe('hole-only path', () => {
    it('reports hole finding when holes present but no waists', async () => {
      mockDetectHoles.mockReturnValue(mockHoles);
      mockEmitFinding.mockReturnValue(holeFinding);
      await hourglassCheckCommand(['hourglass-check', '--json']);
      const parsed = JSON.parse(
        logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n'),
      );
      expect(parsed.finding.type).toBe('hole');
    });
  });

  describe('opt-in flag reporting', () => {
    it('json mode includes enabled flag', async () => {
      mockIsHourglassPersistenceEnabled.mockReturnValue(true);
      await hourglassCheckCommand(['hourglass-check', '--json']);
      const parsed = JSON.parse(
        logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n'),
      );
      expect(parsed.enabled).toBe(true);
    });

    it('runs checks regardless of flag (pure read-only)', async () => {
      mockIsHourglassPersistenceEnabled.mockReturnValue(false);
      await hourglassCheckCommand(['hourglass-check']);
      expect(mockComputeContractionIndices).toHaveBeenCalled();
      expect(mockDetectHoles).toHaveBeenCalled();
    });
  });

  describe('advisory-only invariant', () => {
    it('exits 0 even when finding is waist', async () => {
      mockDetectWaists.mockReturnValue(mockWaists);
      mockEmitFinding.mockReturnValue(waistFinding);
      const code = await hourglassCheckCommand(['hourglass-check']);
      expect(code).toBe(0);
    });

    it('exits 0 even when finding is hole', async () => {
      mockDetectHoles.mockReturnValue(mockHoles);
      mockEmitFinding.mockReturnValue(holeFinding);
      const code = await hourglassCheckCommand(['hourglass-check']);
      expect(code).toBe(0);
    });
  });
});
