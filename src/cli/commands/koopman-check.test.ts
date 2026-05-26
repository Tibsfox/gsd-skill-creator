/**
 * Tests for the `koopman-check` CLI command.
 *
 * Mocks the koopman-memory module to isolate CLI logic from numerical
 * computation. Verifies exit codes, output formatting, opt-in flag
 * reporting, and the advisory-only invariant.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockLog,
  mockIdentity,
  mockSpectralData,
  mockCheckIdentityRetention,
  mockCheckZeroInputRetention,
  mockCheckLipschitzBound,
  mockIsKoopmanMemoryEnabled,
} = vi.hoisted(() => ({
  mockLog: {
    error: vi.fn(),
    message: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
  mockIdentity: vi.fn(),
  mockSpectralData: vi.fn(),
  mockCheckIdentityRetention: vi.fn(),
  mockCheckZeroInputRetention: vi.fn(),
  mockCheckLipschitzBound: vi.fn(),
  mockIsKoopmanMemoryEnabled: vi.fn(),
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

vi.mock('../../koopman-memory/index.js', () => ({
  DEFAULT_STATE_DIM: 8,
  identity: mockIdentity,
  spectralData: mockSpectralData,
  checkIdentityRetention: mockCheckIdentityRetention,
  checkZeroInputRetention: mockCheckZeroInputRetention,
  checkLipschitzBound: mockCheckLipschitzBound,
  isKoopmanMemoryEnabled: mockIsKoopmanMemoryEnabled,
}));

import { koopmanCheckCommand } from './koopman-check.js';

// ── Fixtures ─────────────────────────────────────────────────────────────

const mockOperator = {
  stateDim: 8,
  inputDim: 1,
  name: 'I_8',
  A: [],
  K: [],
};

const mockSpectrum = {
  maxSingularValue: 1.0,
  minSingularValue: 1.0,
  stable: true,
};

const passResult = { ok: true, finalNorm: 0, violations: [] };
const failResult = { ok: false, finalNorm: 1e-3, violations: ['mock violation'] };

// ── Tests ────────────────────────────────────────────────────────────────

describe('koopmanCheckCommand', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Defaults: identity returns a fresh op, all invariants pass, flag is off.
    mockIdentity.mockImplementation((d: number) => ({ ...mockOperator, stateDim: d }));
    mockSpectralData.mockReturnValue(mockSpectrum);
    mockCheckIdentityRetention.mockReturnValue(passResult);
    mockCheckZeroInputRetention.mockReturnValue(passResult);
    mockCheckLipschitzBound.mockReturnValue(passResult);
    mockIsKoopmanMemoryEnabled.mockReturnValue(false);
  });

  describe('argument handling', () => {
    it('--help prints help and returns 0 (no module work)', async () => {
      const code = await koopmanCheckCommand(['koopman-check', '--help']);
      expect(code).toBe(0);
      expect(mockIdentity).not.toHaveBeenCalled();
    });

    it('-h prints help and returns 0', async () => {
      const code = await koopmanCheckCommand(['koopman-check', '-h']);
      expect(code).toBe(0);
      expect(mockIdentity).not.toHaveBeenCalled();
    });

    it('defaults to DEFAULT_STATE_DIM (8) when --state-dim omitted', async () => {
      const code = await koopmanCheckCommand(['koopman-check']);
      expect(code).toBe(0);
      expect(mockIdentity).toHaveBeenCalledWith(8);
    });

    it('honors --state-dim', async () => {
      const code = await koopmanCheckCommand(['koopman-check', '--state-dim', '16']);
      expect(code).toBe(0);
      expect(mockIdentity).toHaveBeenCalledWith(16);
    });

    it('rejects non-positive-integer --state-dim with exit 1', async () => {
      const code = await koopmanCheckCommand(['koopman-check', '--state-dim', 'abc']);
      expect(code).toBe(1);
      expect(mockLog.error).toHaveBeenCalled();
      expect(mockIdentity).not.toHaveBeenCalled();
    });

    it('rejects zero --state-dim with exit 1', async () => {
      const code = await koopmanCheckCommand(['koopman-check', '--state-dim', '0']);
      expect(code).toBe(1);
    });

    it('rejects negative --state-dim with exit 1', async () => {
      const code = await koopmanCheckCommand(['koopman-check', '--state-dim', '-3']);
      expect(code).toBe(1);
    });

    it('rejects non-integer --steps with exit 1', async () => {
      const code = await koopmanCheckCommand(['koopman-check', '--steps', '3.5']);
      expect(code).toBe(1);
    });

    it('rejects --state-dim flag with no value as exit 1', async () => {
      const code = await koopmanCheckCommand(['koopman-check', '--state-dim']);
      expect(code).toBe(1);
    });
  });

  describe('all-pass path', () => {
    it('runs all 3 invariants and exits 0', async () => {
      const code = await koopmanCheckCommand(['koopman-check']);
      expect(code).toBe(0);
      expect(mockCheckIdentityRetention).toHaveBeenCalled();
      expect(mockCheckZeroInputRetention).toHaveBeenCalled();
      expect(mockCheckLipschitzBound).toHaveBeenCalled();
    });

    it('reports success in text mode', async () => {
      await koopmanCheckCommand(['koopman-check']);
      expect(mockLog.success).toHaveBeenCalled();
      expect(mockLog.warn).not.toHaveBeenCalled();
    });

    it('json mode emits all invariant + spectrum data', async () => {
      await koopmanCheckCommand(['koopman-check', '--json']);
      const calls = logSpy.mock.calls.map((c: unknown[]) => String(c[0]));
      const output = calls.join('\n');
      const parsed = JSON.parse(output);
      expect(parsed.allPass).toBe(true);
      expect(parsed.invariants.identityRetention.ok).toBe(true);
      expect(parsed.invariants.zeroInputRetention.ok).toBe(true);
      expect(parsed.invariants.lipschitzBound.ok).toBe(true);
      expect(parsed.spectrum.maxSingularValue).toBe(1.0);
      expect(parsed.stateDim).toBe(8);
    });

    it('quiet mode emits CSV row', async () => {
      await koopmanCheckCommand(['koopman-check', '--quiet']);
      const out = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
      expect(out).toContain('I_8,8,8,off,1.000000,PASS,PASS,PASS');
    });
  });

  describe('failure path', () => {
    it('reports warn in text mode when an invariant fails', async () => {
      mockCheckZeroInputRetention.mockReturnValue(failResult);
      await koopmanCheckCommand(['koopman-check']);
      expect(mockLog.warn).toHaveBeenCalled();
      expect(mockLog.success).not.toHaveBeenCalled();
    });

    it('json mode reports allPass=false when an invariant fails', async () => {
      mockCheckLipschitzBound.mockReturnValue(failResult);
      await koopmanCheckCommand(['koopman-check', '--json']);
      const parsed = JSON.parse(
        logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n'),
      );
      expect(parsed.allPass).toBe(false);
      expect(parsed.invariants.lipschitzBound.ok).toBe(false);
    });

    it('quiet CSV reflects per-invariant FAIL', async () => {
      mockCheckIdentityRetention.mockReturnValue(failResult);
      await koopmanCheckCommand(['koopman-check', '--quiet']);
      const out = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
      expect(out).toContain('FAIL,PASS,PASS');
    });
  });

  describe('opt-in flag reporting', () => {
    it('reports off in text mode when flag is off', async () => {
      mockIsKoopmanMemoryEnabled.mockReturnValue(false);
      await koopmanCheckCommand(['koopman-check']);
      const messages = mockLog.message.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .join('\n');
      expect(messages).toMatch(/Opt-in flag:.*off/);
    });

    it('reports on in text mode when flag is on', async () => {
      mockIsKoopmanMemoryEnabled.mockReturnValue(true);
      await koopmanCheckCommand(['koopman-check']);
      const messages = mockLog.message.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .join('\n');
      expect(messages).toMatch(/Opt-in flag:.*on/);
    });

    it('json mode includes enabled flag', async () => {
      mockIsKoopmanMemoryEnabled.mockReturnValue(true);
      await koopmanCheckCommand(['koopman-check', '--json']);
      const parsed = JSON.parse(
        logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n'),
      );
      expect(parsed.enabled).toBe(true);
    });

    it('still runs invariants when flag is off (check is pure read-only)', async () => {
      mockIsKoopmanMemoryEnabled.mockReturnValue(false);
      await koopmanCheckCommand(['koopman-check']);
      expect(mockCheckIdentityRetention).toHaveBeenCalled();
    });
  });

  describe('advisory-only invariant', () => {
    it('exits 0 even when ALL invariants fail', async () => {
      mockCheckIdentityRetention.mockReturnValue(failResult);
      mockCheckZeroInputRetention.mockReturnValue(failResult);
      mockCheckLipschitzBound.mockReturnValue(failResult);
      const code = await koopmanCheckCommand(['koopman-check']);
      expect(code).toBe(0);
    });

    it('exits 0 in quiet mode regardless of invariant results', async () => {
      mockCheckIdentityRetention.mockReturnValue(failResult);
      const code = await koopmanCheckCommand(['koopman-check', '--quiet']);
      expect(code).toBe(0);
    });
  });
});
