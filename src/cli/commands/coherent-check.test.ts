/**
 * Tests for the `coherent-check` CLI command.
 *
 * Mocks the coherent-functors module to isolate CLI logic from the actual
 * categorical computation. Verifies exit codes, output formatting, opt-in
 * flag reporting, and the advisory-only invariant.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockLog,
  mockIdentityFunctor,
  mockCheckNaturality,
  mockCheckIdentity,
  mockCheckComposition,
  mockCheckDirectSum,
  mockCheckCoherence,
  mockIsCoherentFunctorsEnabled,
} = vi.hoisted(() => ({
  mockLog: {
    error: vi.fn(),
    message: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
  mockIdentityFunctor: vi.fn(),
  mockCheckNaturality: vi.fn(),
  mockCheckIdentity: vi.fn(),
  mockCheckComposition: vi.fn(),
  mockCheckDirectSum: vi.fn(),
  mockCheckCoherence: vi.fn(),
  mockIsCoherentFunctorsEnabled: vi.fn(),
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

vi.mock('../../coherent-functors/index.js', () => ({
  identityFunctor: mockIdentityFunctor,
  checkNaturality: mockCheckNaturality,
  checkIdentity: mockCheckIdentity,
  checkComposition: mockCheckComposition,
  checkDirectSum: mockCheckDirectSum,
  checkCoherence: mockCheckCoherence,
  isCoherentFunctorsEnabled: mockIsCoherentFunctorsEnabled,
}));

import { coherentCheckCommand } from './coherent-check.js';

const mockFunctor = { name: 'Identity(IntegerCat)' };
const passResult = { ok: true, witness: 'wit', detail: undefined };
const failResult = { ok: false, witness: 'wit', detail: 'mock violation' };
const passReport = { ok: true, violations: [] };
const failReport = { ok: false, violations: [{ kind: 'identity' as const, witness: 'wit', detail: 'mock' }] };

describe('coherentCheckCommand', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockIdentityFunctor.mockReturnValue(mockFunctor);
    mockCheckNaturality.mockReturnValue(passResult);
    mockCheckIdentity.mockReturnValue(passResult);
    mockCheckComposition.mockReturnValue(passResult);
    mockCheckDirectSum.mockReturnValue(passResult);
    mockCheckCoherence.mockReturnValue(passReport);
    mockIsCoherentFunctorsEnabled.mockReturnValue(false);
  });

  describe('argument handling', () => {
    it('--help returns 0 (no module work)', async () => {
      const code = await coherentCheckCommand(['coherent-check', '--help']);
      expect(code).toBe(0);
      expect(mockIdentityFunctor).not.toHaveBeenCalled();
    });

    it('-h returns 0', async () => {
      const code = await coherentCheckCommand(['coherent-check', '-h']);
      expect(code).toBe(0);
      expect(mockIdentityFunctor).not.toHaveBeenCalled();
    });

    it('defaults --object to 0', async () => {
      await coherentCheckCommand(['coherent-check']);
      expect(mockCheckIdentity).toHaveBeenCalledWith(mockFunctor, 0);
    });

    it('honors --object', async () => {
      await coherentCheckCommand(['coherent-check', '--object', '5']);
      expect(mockCheckIdentity).toHaveBeenCalledWith(mockFunctor, 5);
    });

    it('rejects non-integer --object with exit 1', async () => {
      const code = await coherentCheckCommand(['coherent-check', '--object', '1.5']);
      expect(code).toBe(1);
      expect(mockLog.error).toHaveBeenCalled();
    });

    it('rejects --object with no value as exit 1', async () => {
      const code = await coherentCheckCommand(['coherent-check', '--object']);
      expect(code).toBe(1);
    });

    it('honors --require-composition', async () => {
      await coherentCheckCommand(['coherent-check', '--require-composition']);
      expect(mockCheckCoherence).toHaveBeenCalledWith(
        mockFunctor,
        expect.objectContaining({ requireComposition: true }),
      );
    });
  });

  describe('all-pass path', () => {
    it('runs all 4 predicates + aggregate report', async () => {
      const code = await coherentCheckCommand(['coherent-check']);
      expect(code).toBe(0);
      expect(mockCheckNaturality).toHaveBeenCalled();
      expect(mockCheckIdentity).toHaveBeenCalled();
      expect(mockCheckComposition).toHaveBeenCalled();
      expect(mockCheckDirectSum).toHaveBeenCalled();
      expect(mockCheckCoherence).toHaveBeenCalled();
    });

    it('text mode reports success', async () => {
      await coherentCheckCommand(['coherent-check']);
      expect(mockLog.success).toHaveBeenCalled();
      expect(mockLog.warn).not.toHaveBeenCalled();
    });

    it('json mode emits all predicate + report data', async () => {
      await coherentCheckCommand(['coherent-check', '--json']);
      const parsed = JSON.parse(
        logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n'),
      );
      expect(parsed.allPass).toBe(true);
      expect(parsed.predicates.naturality.ok).toBe(true);
      expect(parsed.predicates.identity.ok).toBe(true);
      expect(parsed.predicates.composition.ok).toBe(true);
      expect(parsed.predicates.directSum.ok).toBe(true);
      expect(parsed.report.ok).toBe(true);
      expect(parsed.probeObject).toBe(0);
    });

    it('quiet mode emits CSV row', async () => {
      await coherentCheckCommand(['coherent-check', '--quiet']);
      const out = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
      expect(out).toContain('Identity(IntegerCat),IntegerCat,0,off,PASS,PASS,PASS,PASS,PASS');
    });
  });

  describe('failure path', () => {
    it('reports warn in text mode when aggregate report fails', async () => {
      mockCheckCoherence.mockReturnValue(failReport);
      await coherentCheckCommand(['coherent-check']);
      expect(mockLog.warn).toHaveBeenCalled();
      expect(mockLog.success).not.toHaveBeenCalled();
    });

    it('json mode reports allPass=false when aggregate report fails', async () => {
      mockCheckIdentity.mockReturnValue(failResult);
      mockCheckCoherence.mockReturnValue(failReport);
      await coherentCheckCommand(['coherent-check', '--json']);
      const parsed = JSON.parse(
        logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n'),
      );
      expect(parsed.allPass).toBe(false);
      expect(parsed.predicates.identity.ok).toBe(false);
    });

    it('quiet CSV reflects per-predicate FAIL', async () => {
      mockCheckNaturality.mockReturnValue(failResult);
      mockCheckCoherence.mockReturnValue(failReport);
      await coherentCheckCommand(['coherent-check', '--quiet']);
      const out = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
      expect(out).toContain('FAIL,PASS,PASS,PASS,FAIL');
    });
  });

  describe('opt-in flag reporting', () => {
    it('reports off in text mode when flag is off', async () => {
      await coherentCheckCommand(['coherent-check']);
      const messages = mockLog.message.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .join('\n');
      expect(messages).toMatch(/Opt-in flag:.*off/);
    });

    it('json mode includes enabled flag', async () => {
      mockIsCoherentFunctorsEnabled.mockReturnValue(true);
      await coherentCheckCommand(['coherent-check', '--json']);
      const parsed = JSON.parse(
        logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n'),
      );
      expect(parsed.enabled).toBe(true);
    });
  });

  describe('advisory-only invariant', () => {
    it('exits 0 even when all predicates fail', async () => {
      mockCheckNaturality.mockReturnValue(failResult);
      mockCheckIdentity.mockReturnValue(failResult);
      mockCheckComposition.mockReturnValue(failResult);
      mockCheckDirectSum.mockReturnValue(failResult);
      mockCheckCoherence.mockReturnValue(failReport);
      const code = await coherentCheckCommand(['coherent-check']);
      expect(code).toBe(0);
    });
  });
});
