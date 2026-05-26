/**
 * Tests for the `dacp drift-check` CLI command.
 *
 * Mocks the semantic-channel module + node:fs/promises access to isolate
 * CLI logic from disk I/O. Verifies exit codes, output formatting, opt-in
 * flag behaviour, and the advisory-only invariant.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockLog,
  mockAccess,
  mockComputeChannelState,
  mockComputeCapacityBound,
  mockCapacityFitsBudget,
  mockCheckSemanticDriftIfEnabled,
  mockIsSemanticChannelEnabled,
} = vi.hoisted(() => ({
  mockLog: {
    error: vi.fn(),
    message: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
  mockAccess: vi.fn(),
  mockComputeChannelState: vi.fn(),
  mockComputeCapacityBound: vi.fn(),
  mockCapacityFitsBudget: vi.fn(),
  mockCheckSemanticDriftIfEnabled: vi.fn(),
  mockIsSemanticChannelEnabled: vi.fn(),
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
    bgCyan: (s: string) => s,
    black: (s: string) => s,
  },
}));

vi.mock('node:fs/promises', () => ({
  access: mockAccess,
}));

vi.mock('../../semantic-channel/index.js', () => ({
  computeChannelState: mockComputeChannelState,
  computeCapacityBound: mockComputeCapacityBound,
  capacityFitsBudget: mockCapacityFitsBudget,
  checkSemanticDriftIfEnabled: mockCheckSemanticDriftIfEnabled,
  isSemanticChannelEnabled: mockIsSemanticChannelEnabled,
}));

import { dacpDriftCheckCommand } from './dacp-drift-check.js';

// ── Fixtures ─────────────────────────────────────────────────────────────

const mockTriad = {
  humanIntent: 'plan a thing',
  structuredData: { foo: 'bar' },
  executableCode: ['console.log(1);'],
};

const mockFidelity = {
  intent: 'closure-preserving' as const,
  data: 'lossless' as const,
  code: 'closure-preserving' as const,
};

const mockManifest = { fidelity_level: 3 } as { fidelity_level: number };

const mockChannelState = {
  triad: mockTriad,
  fidelity: mockFidelity,
  manifest: mockManifest,
};

const mockCapacity = {
  intentBits: 96,
  dataBits: 104,
  codeBits: 120,
  totalBits: 320,
  distortion: 0,
};

const mockDriftInfo = {
  findingId: 'semch-mock-info',
  kind: 'semantic-channel-drift' as const,
  severity: 'info' as const,
  summary: 'Semantic-channel drift (advisory): intent=0.010 data=0.020 code=0.030 (threshold θ=0.250)',
  perComponent: { intent: 0.01, data: 0.02, code: 0.03 },
  threshold: 0.25,
  baselineFidelity: mockFidelity,
  currentFidelity: mockFidelity,
  weakened: false,
  timestamp: '2026-05-26T17:00:00.000Z',
};

const mockDriftWarn = {
  ...mockDriftInfo,
  findingId: 'semch-mock-warn',
  severity: 'warn' as const,
  summary: 'Semantic-channel fidelity WEAKENED (advisory): intent=0.500 data=0.100 code=0.050 (threshold θ=0.250)',
  perComponent: { intent: 0.5, data: 0.1, code: 0.05 },
  weakened: true,
};

let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  mockAccess.mockResolvedValue(undefined);
  mockComputeChannelState.mockResolvedValue(mockChannelState);
  mockComputeCapacityBound.mockReturnValue(mockCapacity);
  mockCapacityFitsBudget.mockReturnValue(true);
  mockCheckSemanticDriftIfEnabled.mockReturnValue(mockDriftInfo);
  mockIsSemanticChannelEnabled.mockReturnValue(true);
});

// ── Tests ────────────────────────────────────────────────────────────────

describe('dacp drift-check command', () => {
  describe('argument handling', () => {
    it('exits 0 with help text on --help', async () => {
      const code = await dacpDriftCheckCommand(['drift-check', '--help']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalled();
      const helpOutput = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(helpOutput).toContain('dacp drift-check');
      expect(helpOutput).toContain('--bundle');
      expect(helpOutput).toContain('ADVISORY-ONLY');
    });

    it('exits 0 with help text on -h', async () => {
      const code = await dacpDriftCheckCommand(['drift-check', '-h']);
      expect(code).toBe(0);
    });

    it('exits 1 when --bundle is missing (text mode)', async () => {
      const code = await dacpDriftCheckCommand(['drift-check']);
      expect(code).toBe(1);
      expect(mockLog.error).toHaveBeenCalled();
      expect(mockLog.error.mock.calls[0][0]).toContain('--bundle');
    });

    it('exits 1 with JSON error when --bundle is missing in --json mode', async () => {
      const code = await dacpDriftCheckCommand(['drift-check', '--json']);
      expect(code).toBe(1);
      expect(logSpy).toHaveBeenCalled();
      const out = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(out).toEqual({
        error: 'missing-required-flag',
        flag: '--bundle',
      });
    });

    it('suppresses error log in quiet mode when --bundle is missing', async () => {
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--quiet',
      ]);
      expect(code).toBe(1);
      expect(mockLog.error).not.toHaveBeenCalled();
    });

    it('exits 1 when --bundle path does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/nope',
      ]);
      expect(code).toBe(1);
      expect(mockLog.error.mock.calls[0][0]).toContain('not found');
    });

    it('returns JSON error envelope when bundle path missing in --json mode', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/nope',
        '--json',
      ]);
      expect(code).toBe(1);
      const out = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(out).toEqual({ error: 'bundle-not-found', path: '/nope' });
    });

    it('exits 1 when computeChannelState throws', async () => {
      mockComputeChannelState.mockRejectedValue(new Error('bad manifest'));
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/b',
      ]);
      expect(code).toBe(1);
      expect(mockLog.error.mock.calls[0][0]).toContain('bad manifest');
    });
  });

  describe('capacity-only path (no baseline)', () => {
    it('emits text report and exits 0 when only --bundle supplied', async () => {
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/b',
      ]);
      expect(code).toBe(0);
      const text = mockLog.message.mock.calls.map((c) => c[0]).join('\n');
      expect(text).toContain('Semantic-Channel Drift Check');
      expect(text).toContain('L3');
      expect(text).toContain('Capacity bound: 320 bits');
      expect(mockLog.info).toHaveBeenCalled();
      const infoText = mockLog.info.mock.calls.map((c) => c[0]).join('\n');
      expect(infoText).toContain('skipping drift comparison');
      // Drift check must NOT have run when no baseline provided
      expect(mockCheckSemanticDriftIfEnabled).not.toHaveBeenCalled();
    });

    it('reports budget verdict when --max-bits supplied', async () => {
      mockCapacityFitsBudget.mockReturnValue(false);
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/b',
        '--max-bits',
        '256',
      ]);
      expect(code).toBe(0);
      expect(mockCapacityFitsBudget).toHaveBeenCalledWith(mockCapacity, 256);
      const text = mockLog.message.mock.calls.map((c) => c[0]).join('\n');
      expect(text).toContain('exceeds 256-bit budget');
    });

    it('emits a CSV line in quiet mode', async () => {
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/b',
        '--quiet',
      ]);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledTimes(1);
      const csv = String(logSpy.mock.calls[0][0]);
      // bundle,baseline,fidelity,bytes,severity,weakened
      expect(csv).toBe('/b,,L3,40,n/a,0');
    });

    it('emits a structured JSON object in --json mode', async () => {
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/b',
        '--json',
      ]);
      expect(code).toBe(0);
      const out = JSON.parse(String(logSpy.mock.calls[0][0]));
      expect(out.bundle).toBe('/b');
      expect(out.baseline).toBeNull();
      expect(out.dacpFidelityLevel).toBe(3);
      expect(out.capacity).toEqual(mockCapacity);
      expect(out.drift).toBeNull();
      expect(out.driftSkippedReason).toBeNull();
    });
  });

  describe('drift comparison path (with --baseline)', () => {
    it('runs drift check when both bundles supplied and flag is on', async () => {
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/cur',
        '--baseline',
        '/prev',
      ]);
      expect(code).toBe(0);
      expect(mockCheckSemanticDriftIfEnabled).toHaveBeenCalledTimes(1);
      expect(mockComputeChannelState).toHaveBeenCalledTimes(2);
      const text = mockLog.message.mock.calls.map((c) => c[0]).join('\n');
      expect(text).toContain('Drift finding');
      expect(text).toContain('info');
    });

    it('passes --threshold through to checkSemanticDriftIfEnabled', async () => {
      await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/cur',
        '--baseline',
        '/prev',
        '--threshold',
        '0.5',
      ]);
      expect(mockCheckSemanticDriftIfEnabled).toHaveBeenCalledWith(
        mockChannelState,
        mockChannelState,
        { threshold: 0.5 },
      );
    });

    it('renders warn severity + weakened banner when drift flags weakening', async () => {
      mockCheckSemanticDriftIfEnabled.mockReturnValue(mockDriftWarn);
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/cur',
        '--baseline',
        '/prev',
      ]);
      expect(code).toBe(0); // advisory-only — never propagates severity to exit code
      const text =
        mockLog.message.mock.calls.map((c) => c[0]).join('\n') +
        mockLog.warn.mock.calls.map((c) => c[0]).join('\n');
      expect(text).toContain('WARN');
      expect(text).toContain('WEAKENED');
      expect(text).toContain('advisory');
    });

    it('reports skipped drift when flag is off', async () => {
      mockCheckSemanticDriftIfEnabled.mockReturnValue(null);
      mockIsSemanticChannelEnabled.mockReturnValue(false);
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/cur',
        '--baseline',
        '/prev',
      ]);
      expect(code).toBe(0);
      const warnText = mockLog.warn.mock.calls.map((c) => c[0]).join('\n');
      expect(warnText).toContain('Drift comparison skipped');
      const infoText = mockLog.info.mock.calls.map((c) => c[0]).join('\n');
      expect(infoText).toContain('mathematical-foundations.semantic-channel.enabled');
    });

    it('exits 1 when baseline path is missing', async () => {
      mockAccess
        .mockResolvedValueOnce(undefined) // bundle exists
        .mockRejectedValueOnce(new Error('ENOENT')); // baseline missing
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/cur',
        '--baseline',
        '/nope',
      ]);
      expect(code).toBe(1);
      expect(mockLog.error.mock.calls[0][0]).toContain('Baseline');
    });

    it('includes drift in JSON output when comparison runs', async () => {
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/cur',
        '--baseline',
        '/prev',
        '--json',
      ]);
      expect(code).toBe(0);
      const out = JSON.parse(String(logSpy.mock.calls[0][0]));
      expect(out.baseline).toBe('/prev');
      expect(out.drift).toEqual(mockDriftInfo);
      expect(out.driftSkippedReason).toBeNull();
    });

    it('emits skipped reason in JSON when flag is off', async () => {
      mockCheckSemanticDriftIfEnabled.mockReturnValue(null);
      mockIsSemanticChannelEnabled.mockReturnValue(false);
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/cur',
        '--baseline',
        '/prev',
        '--json',
      ]);
      expect(code).toBe(0);
      const out = JSON.parse(String(logSpy.mock.calls[0][0]));
      expect(out.drift).toBeNull();
      expect(out.driftSkippedReason).toContain(
        'mathematical-foundations.semantic-channel.enabled is off',
      );
    });

    it('quiet mode CSV includes severity and weakened columns', async () => {
      mockCheckSemanticDriftIfEnabled.mockReturnValue(mockDriftWarn);
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/cur',
        '--baseline',
        '/prev',
        '--quiet',
      ]);
      expect(code).toBe(0);
      const csv = String(logSpy.mock.calls[0][0]);
      // bundle,baseline,fidelity,bytes,severity,weakened
      expect(csv).toBe('/cur,/prev,L3,40,warn,1');
    });
  });

  describe('advisory-only invariant', () => {
    it('returns 0 regardless of drift severity', async () => {
      mockCheckSemanticDriftIfEnabled.mockReturnValue(mockDriftWarn);
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/cur',
        '--baseline',
        '/prev',
      ]);
      expect(code).toBe(0);
    });

    it('returns 0 when capacity exceeds budget (budget check is informational)', async () => {
      mockCapacityFitsBudget.mockReturnValue(false);
      const code = await dacpDriftCheckCommand([
        'drift-check',
        '--bundle',
        '/b',
        '--max-bits',
        '8',
      ]);
      expect(code).toBe(0);
    });
  });
});
