import { describe, it, expect } from 'vitest';
import type { HealthCheckConfig, HealthReport, VenvResult } from '../../../../../src/dogfood/pydmd/types.js';
import type { CommandExecutor } from '../../../../../src/dogfood/pydmd/install/venv-manager.js';
import { runHealthCheck } from '../../../../../src/dogfood/pydmd/install/health-check.js';

// --- Factories ---

function makeVenvResult(overrides: Partial<VenvResult> = {}): VenvResult {
  return {
    success: true,
    venvPath: '/tmp/test-venv',
    pythonPath: '/tmp/test-venv/bin/python',
    installedPackages: ['numpy==1.24.0', 'pytest==7.4.0'],
    installErrors: [],
    sizeBytes: 200_000_000,
    ...overrides,
  };
}

function makeHealthConfig(overrides: Partial<HealthCheckConfig> = {}): HealthCheckConfig {
  return {
    venvResult: makeVenvResult(),
    projectPath: '/tmp/test-project',
    testFramework: 'pytest',
    timeout: 300,
    maxTestOutput: 65536,
    ...overrides,
  };
}

// --- Pytest output fixtures ---

const PYTEST_FULL_PASS = `
============================= test session starts ==============================
collected 42 items

tests/test_dmd.py ..........................................                [100%]

============================== 42 passed in 8.00s ==============================
`;

const PYTEST_MIXED = `
============================= test session starts ==============================
collected 50 items

tests/test_dmd.py ..............................F.F.Fs....x..             [100%]

FAILED tests/test_dmd.py::TestDMD::test_svd_reconstruction - AssertionError: Arrays not close enough within tolerance 1e-07; max diff was 2.5e-05 on entry [3,7] of reconstructed matrix
FAILED tests/test_dmd.py::TestBOPDMD::test_eigs - ValueError: Cannot compute eigenvalues of empty array when input matrix is rank-deficient
============================== warnings summary ================================
tests/test_dmd.py::TestDMD::test_plot
  DeprecationWarning: matplotlib 3.9 removed get_cmap, use colormaps[] instead
tests/test_dmd.py::TestCDMD::test_compress
  FutureWarning: numpy.matrix is deprecated
============================== short test summary info ==========================
FAILED tests/test_dmd.py::TestDMD::test_svd_reconstruction - AssertionError: ...
FAILED tests/test_dmd.py::TestBOPDMD::test_eigs - ValueError: Cannot compute...
42 passed, 3 failed, 5 skipped in 12.34s
`;

const PYTEST_WITH_ERRORS = `
============================= test session starts ==============================
collected 12 items

tests/test_api.py EE........                                              [100%]

============================== short test summary info ==========================
ERROR tests/test_api.py::test_init - RuntimeError: CUDA not available
ERROR tests/test_api.py::test_gpu - RuntimeError: CUDA not available
10 passed, 2 errors in 5.00s
`;

const PYTEST_WITH_COVERAGE = `
============================= test session starts ==============================
collected 30 items

tests/test_core.py ..............................                          [100%]

---------- coverage: platform linux, python 3.11.5 ----------
Name                 Stmts   Miss  Cover
-----------------------------------------
pydmd/__init__.py        5      0   100%
pydmd/dmd.py           120     18    85%
pydmd/bopdmd.py         80     12    85%
-----------------------------------------
TOTAL                  205     30    85%

============================== 30 passed in 6.50s ==============================
`;

const PYTEST_IMPORT_ERROR = `
============================= test session starts ==============================
ERRORS during collection:

ModuleNotFoundError: No module named 'pydmd'

============================== no tests ran in 0.05s ===========================
`;

const PYTEST_NO_TESTS = `
============================= test session starts ==============================
collected 0 items

============================== no tests ran in 0.01s ===========================
`;

const PYTEST_SHORT_TRACEBACK = `
============================= test session starts ==============================
collected 10 items

tests/test_a.py .....F....                                                [100%]

FAILED tests/test_a.py::test_compute - AssertionError: expected 42 got 41
============================== short test summary info ==========================
FAILED tests/test_a.py::test_compute - AssertionError: expected 42 got 41
9 passed, 1 failed in 3.20s
`;

function makeExec(stdout: string, stderr = '', exitCode = 0): CommandExecutor {
  return async () => ({ stdout, stderr, exitCode });
}

function makeCallTrackingExec(stdout: string): { exec: CommandExecutor; calls: { cmd: string; args: string[]; opts?: { cwd?: string; timeout?: number } }[] } {
  const calls: { cmd: string; args: string[]; opts?: { cwd?: string; timeout?: number } }[] = [];
  const exec: CommandExecutor = async (cmd, args, opts) => {
    calls.push({ cmd, args, opts });
    return { stdout, stderr: '', exitCode: 0 };
  };
  return { exec, calls };
}

describe('health-check', () => {
  describe('INS-05: Test discovery and execution', () => {
    it('runs pytest with correct args', async () => {
      const { exec, calls } = makeCallTrackingExec(PYTEST_FULL_PASS);
      const config = makeHealthConfig();

      await runHealthCheck(config, exec);

      expect(calls.length).toBeGreaterThanOrEqual(1);
      const call = calls[0];
      expect(call.cmd).toBe(config.venvResult.pythonPath);
      expect(call.args).toContain('-m');
      expect(call.args).toContain('pytest');
      expect(call.args).toContain('tests/');
      expect(call.args).toContain('--tb=short');
      expect(call.args).toContain('--no-header');
      expect(call.args).toContain('-q');
      expect(call.args).toContain('--timeout=60');
    });

    it('uses correct python binary from venvResult.pythonPath', async () => {
      const customPython = '/opt/custom-venv/bin/python3';
      const config = makeHealthConfig({
        venvResult: makeVenvResult({ pythonPath: customPython }),
      });
      const { exec, calls } = makeCallTrackingExec(PYTEST_FULL_PASS);

      await runHealthCheck(config, exec);

      expect(calls[0].cmd).toBe(customPython);
    });

    it('passes testFramework-appropriate command for pytest', async () => {
      const { exec, calls } = makeCallTrackingExec(PYTEST_FULL_PASS);

      await runHealthCheck(makeHealthConfig({ testFramework: 'pytest' }), exec);

      expect(calls[0].args).toContain('pytest');
    });

    it('handles testFramework "unittest" with discover command', async () => {
      const unittestOutput = `
----------------------------------------------------------------------
Ran 10 tests in 2.50s

OK
`;
      const { exec, calls } = makeCallTrackingExec(unittestOutput);

      await runHealthCheck(makeHealthConfig({ testFramework: 'unittest' }), exec);

      expect(calls[0].args).toContain('unittest');
      expect(calls[0].args).toContain('discover');
    });

    it('sets cwd to projectPath', async () => {
      const { exec, calls } = makeCallTrackingExec(PYTEST_FULL_PASS);
      const config = makeHealthConfig({ projectPath: '/home/user/pydmd' });

      await runHealthCheck(config, exec);

      expect(calls[0].opts?.cwd).toBe('/home/user/pydmd');
    });
  });

  describe('INS-06: Structured JSON report', () => {
    it('parses pytest summary "42 passed, 3 failed, 5 skipped in 12.34s"', async () => {
      const report = await runHealthCheck(makeHealthConfig(), makeExec(PYTEST_MIXED));

      expect(report.testResults.total).toBe(50);
      expect(report.testResults.passed).toBe(42);
      expect(report.testResults.failed).toBe(3);
      expect(report.testResults.skipped).toBe(5);
      expect(report.testResults.errors).toBe(0);
      expect(report.testResults.duration).toBeCloseTo(12.34, 1);
    });

    it('parses pytest summary with errors "10 passed, 2 errors in 5.00s"', async () => {
      const report = await runHealthCheck(makeHealthConfig(), makeExec(PYTEST_WITH_ERRORS));

      expect(report.testResults.passed).toBe(10);
      expect(report.testResults.errors).toBe(2);
      expect(report.testResults.total).toBe(12);
      expect(report.testResults.duration).toBeCloseTo(5.0, 1);
    });

    it('parses "all passed" variant "42 passed in 8.00s"', async () => {
      const report = await runHealthCheck(makeHealthConfig(), makeExec(PYTEST_FULL_PASS));

      expect(report.testResults.passed).toBe(42);
      expect(report.testResults.failed).toBe(0);
      expect(report.testResults.skipped).toBe(0);
      expect(report.testResults.errors).toBe(0);
      expect(report.testResults.total).toBe(42);
      expect(report.testResults.duration).toBeCloseTo(8.0, 1);
    });

    it('captures failed test names and reasons from short traceback', async () => {
      const report = await runHealthCheck(makeHealthConfig(), makeExec(PYTEST_MIXED));

      expect(report.failedTests.length).toBeGreaterThanOrEqual(2);
      const svdTest = report.failedTests.find(t => t.name.includes('test_svd_reconstruction'));
      expect(svdTest).toBeDefined();
      expect(svdTest!.reason).toContain('AssertionError');

      const eigsTest = report.failedTests.find(t => t.name.includes('test_eigs'));
      expect(eigsTest).toBeDefined();
      expect(eigsTest!.reason).toContain('ValueError');
    });

    it('truncates reason to 200 characters when output is longer', async () => {
      const longReason = 'A'.repeat(300);
      const longOutput = `
FAILED tests/test_long.py::test_big - ${longReason}
============================== short test summary info ==========================
FAILED tests/test_long.py::test_big - ${longReason}
1 passed, 1 failed in 1.00s
`;
      const report = await runHealthCheck(makeHealthConfig(), makeExec(longOutput));

      const failedTest = report.failedTests.find(t => t.name.includes('test_big'));
      expect(failedTest).toBeDefined();
      expect(failedTest!.reason.length).toBeLessThanOrEqual(200);
    });

    it('sets timestamp as ISO string', async () => {
      const report = await runHealthCheck(makeHealthConfig(), makeExec(PYTEST_FULL_PASS));

      expect(report.timestamp).toBeDefined();
      expect(typeof report.timestamp).toBe('string');
      // ISO 8601 format check
      expect(() => new Date(report.timestamp)).not.toThrow();
      expect(new Date(report.timestamp).toISOString()).toBe(report.timestamp);
    });

    it('detects coverage percentage from "TOTAL ... 85%" line', async () => {
      const report = await runHealthCheck(makeHealthConfig(), makeExec(PYTEST_WITH_COVERAGE));

      expect(report.coverage).toBe(85);
    });

    it('sets coverage to null when pytest-cov not in output', async () => {
      const report = await runHealthCheck(makeHealthConfig(), makeExec(PYTEST_FULL_PASS));

      expect(report.coverage).toBeNull();
    });

    it('captures warnings from pytest warning summary section', async () => {
      const report = await runHealthCheck(makeHealthConfig(), makeExec(PYTEST_MIXED));

      expect(report.warnings.length).toBeGreaterThanOrEqual(1);
      const hasDeprecation = report.warnings.some(w =>
        w.includes('DeprecationWarning') || w.includes('FutureWarning') || w.includes('deprecated') || w.includes('matplotlib'),
      );
      expect(hasDeprecation).toBe(true);
    });
  });

  describe('INS-07: Gate logic (>= 80% pass rate)', () => {
    it('100% pass rate -> overall: "pass"', async () => {
      const report = await runHealthCheck(makeHealthConfig(), makeExec(PYTEST_FULL_PASS));

      expect(report.overall).toBe('pass');
    });

    it('95% pass rate -> overall: "pass" (threshold is >=95%)', async () => {
      const output95 = `
95 passed, 5 skipped in 10.00s
`;
      const report = await runHealthCheck(makeHealthConfig(), makeExec(output95));

      // 95/100 = 0.95 -> pass
      expect(report.overall).toBe('pass');
    });

    it('90% pass rate -> overall: "partial" (between 80-95%)', async () => {
      const output90 = `
9 passed, 1 failed in 3.00s
`;
      const report = await runHealthCheck(makeHealthConfig(), makeExec(output90));

      // 9/10 = 0.90 -> partial
      expect(report.overall).toBe('partial');
    });

    it('80% pass rate -> overall: "partial" (exactly at boundary)', async () => {
      const output80 = `
8 passed, 2 failed in 2.00s
`;
      const report = await runHealthCheck(makeHealthConfig(), makeExec(output80));

      // 8/10 = 0.80 -> partial
      expect(report.overall).toBe('partial');
    });

    it('79% pass rate -> overall: "fail" (below 80%)', async () => {
      // Need slightly below 80%. 79/100 = 0.79
      const output79 = `
79 passed, 21 failed in 15.00s
`;
      const report = await runHealthCheck(makeHealthConfig(), makeExec(output79));

      expect(report.overall).toBe('fail');
    });

    it('0 tests found (total: 0) -> overall: "fail" with warning', async () => {
      const report = await runHealthCheck(makeHealthConfig(), makeExec(PYTEST_NO_TESTS));

      expect(report.overall).toBe('fail');
      expect(report.warnings.some(w => w.toLowerCase().includes('no tests'))).toBe(true);
    });

    it('timeout -> overall: "fail" with warning "Test suite timed out"', async () => {
      const timeoutExec: CommandExecutor = async () => {
        throw new Error('Command timed out after 300000ms');
      };

      const report = await runHealthCheck(makeHealthConfig(), timeoutExec);

      expect(report.overall).toBe('fail');
      expect(report.warnings.some(w => w.toLowerCase().includes('timed out'))).toBe(true);
    });

    it('import error in output -> overall: "fail" with warning', async () => {
      const report = await runHealthCheck(makeHealthConfig(), makeExec(PYTEST_IMPORT_ERROR));

      expect(report.overall).toBe('fail');
      expect(report.warnings.some(w =>
        w.toLowerCase().includes('import') || w.toLowerCase().includes('module') || w.toLowerCase().includes('venv'),
      )).toBe(true);
    });
  });
});
