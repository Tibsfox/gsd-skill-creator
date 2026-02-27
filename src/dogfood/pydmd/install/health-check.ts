/**
 * Health check runner: executes a Python project's test suite and produces
 * a structured report with pass/fail/skip/error counts and gate classification.
 *
 * Part of the PyDMD dogfood install pipeline (Phase 404).
 */

import type { HealthCheckConfig, HealthReport } from '../types.js';
import type { CommandExecutor } from './venv-manager.js';

// --- Default executor (real subprocess -- tests always inject mock) ---

const defaultExec: CommandExecutor = async (cmd, args, opts) => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);

  try {
    const result = await execFileAsync(cmd, args, {
      cwd: opts?.cwd,
      timeout: opts?.timeout,
    });
    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? String(err),
      exitCode: e.code ?? 1,
    };
  }
};

// --- Parsing helpers ---

interface ParsedSummary {
  passed: number;
  failed: number;
  skipped: number;
  errors: number;
  duration: number;
  total: number;
}

/**
 * Parse the pytest summary line, e.g.:
 *   "42 passed, 3 failed, 5 skipped in 12.34s"
 *   "10 passed, 2 errors in 5.00s"
 *   "42 passed in 8.00s"
 *   "no tests ran in 0.01s"
 */
function parsePytestSummary(output: string): ParsedSummary {
  const result: ParsedSummary = {
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: 0,
    duration: 0,
    total: 0,
  };

  // Extract duration from "in X.XXs"
  const durationMatch = output.match(/in\s+([\d.]+)s/);
  if (durationMatch) {
    result.duration = parseFloat(durationMatch[1]);
  }

  // Extract individual counts
  const passedMatch = output.match(/(\d+)\s+passed/);
  if (passedMatch) result.passed = parseInt(passedMatch[1], 10);

  const failedMatch = output.match(/(\d+)\s+failed/);
  if (failedMatch) result.failed = parseInt(failedMatch[1], 10);

  const skippedMatch = output.match(/(\d+)\s+skipped/);
  if (skippedMatch) result.skipped = parseInt(skippedMatch[1], 10);

  const errorsMatch = output.match(/(\d+)\s+errors?(?:\s+in|\s*,)/);
  if (errorsMatch) result.errors = parseInt(errorsMatch[1], 10);

  result.total = result.passed + result.failed + result.skipped + result.errors;

  return result;
}

/**
 * Parse unittest summary, e.g.:
 *   "Ran 10 tests in 2.50s"
 *   "OK" or "FAILED (failures=2, errors=1)"
 */
function parseUnittestSummary(output: string): ParsedSummary {
  const result: ParsedSummary = {
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: 0,
    duration: 0,
    total: 0,
  };

  const ranMatch = output.match(/Ran\s+(\d+)\s+tests?\s+in\s+([\d.]+)s/);
  if (ranMatch) {
    result.total = parseInt(ranMatch[1], 10);
    result.duration = parseFloat(ranMatch[2]);
  }

  const failuresMatch = output.match(/failures=(\d+)/);
  if (failuresMatch) result.failed = parseInt(failuresMatch[1], 10);

  const errorsMatch = output.match(/errors=(\d+)/);
  if (errorsMatch) result.errors = parseInt(errorsMatch[1], 10);

  const skippedMatch = output.match(/skipped=(\d+)/);
  if (skippedMatch) result.skipped = parseInt(skippedMatch[1], 10);

  result.passed = result.total - result.failed - result.errors - result.skipped;
  if (result.passed < 0) result.passed = 0;

  return result;
}

/**
 * Extract failed test names and reasons from pytest short traceback output.
 * Looks for lines like: "FAILED tests/test_dmd.py::TestDMD::test_svd - AssertionError: ..."
 */
function parseFailedTests(output: string): { name: string; reason: string }[] {
  const failed: { name: string; reason: string }[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    const match = line.match(/^FAILED\s+(\S+)\s*-\s*(.+)$/);
    if (match) {
      const name = match[1];
      let reason = match[2].trim();
      if (reason.length > 200) {
        reason = reason.substring(0, 200);
      }
      failed.push({ name, reason });
    }
  }

  return failed;
}

/**
 * Parse coverage percentage from pytest-cov output.
 * Looks for: "TOTAL    205     30    85%"
 */
function parseCoverage(output: string): number | null {
  const match = output.match(/TOTAL\s+\d+\s+\d+\s+(\d+)%/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Extract warnings from the pytest warnings summary section.
 */
function parseWarnings(output: string): string[] {
  const warnings: string[] = [];
  const lines = output.split('\n');
  let inWarnings = false;

  for (const line of lines) {
    if (line.includes('warnings summary')) {
      inWarnings = true;
      continue;
    }

    if (inWarnings) {
      // End of warnings section -- next section marker or end-of-output marker
      if (line.includes('======') || line.includes('short test summary')) {
        break;
      }
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        warnings.push(trimmed);
      }
    }
  }

  return warnings;
}

/**
 * Classify the overall health status based on pass rate.
 */
function classifyOverall(
  summary: ParsedSummary,
): 'pass' | 'partial' | 'fail' {
  if (summary.total === 0) return 'fail';

  const passRate = summary.passed / summary.total;

  if (passRate >= 0.95) return 'pass';
  if (passRate >= 0.80) return 'partial';
  return 'fail';
}

// --- Public API ---

/**
 * Run the health check against a Python project's test suite.
 *
 * @param config - Health check configuration (venv, paths, framework, timeout)
 * @param exec - Optional command executor (injected in tests)
 * @returns Structured health report with pass/fail classification
 */
export async function runHealthCheck(
  config: HealthCheckConfig,
  exec: CommandExecutor = defaultExec,
): Promise<HealthReport> {
  const warnings: string[] = [];

  // Build command based on test framework
  let args: string[];
  if (config.testFramework === 'unittest') {
    args = ['-m', 'unittest', 'discover', '-s', 'tests/'];
  } else {
    // pytest (default)
    args = ['-m', 'pytest', 'tests/', '--tb=short', '--no-header', '-q', '--timeout=60'];
  }

  let stdout = '';
  let stderr = '';

  try {
    const result = await exec(config.venvResult.pythonPath, args, {
      cwd: config.projectPath,
      timeout: config.timeout * 1000,
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (err) {
    // Timeout or crash
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.toLowerCase().includes('timed out') || message.toLowerCase().includes('timeout');

    return {
      overall: 'fail',
      testResults: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        errors: 0,
        duration: 0,
      },
      failedTests: [],
      coverage: null,
      warnings: [isTimeout ? 'Test suite timed out' : `Test execution failed: ${message}`],
      timestamp: new Date().toISOString(),
    };
  }

  const combinedOutput = `${stdout}\n${stderr}`;

  // Check for import errors
  if (combinedOutput.includes('ModuleNotFoundError') || combinedOutput.includes('ImportError')) {
    warnings.push('Import error detected — possible venv or dependency problem');
  }

  // Parse results based on framework
  const summary = config.testFramework === 'unittest'
    ? parseUnittestSummary(combinedOutput)
    : parsePytestSummary(combinedOutput);

  // Check for no tests
  if (summary.total === 0) {
    warnings.push('No tests found');
  }

  // Parse failed tests (pytest-specific)
  const failedTests = config.testFramework === 'pytest'
    ? parseFailedTests(combinedOutput)
    : [];

  // Parse coverage
  const coverage = parseCoverage(combinedOutput);

  // Parse warnings from pytest output
  const pytestWarnings = parseWarnings(combinedOutput);
  warnings.push(...pytestWarnings);

  // Classify overall status
  const overall = classifyOverall(summary);

  return {
    overall,
    testResults: {
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      skipped: summary.skipped,
      errors: summary.errors,
      duration: summary.duration,
    },
    failedTests,
    coverage,
    warnings,
    timestamp: new Date().toISOString(),
  };
}
