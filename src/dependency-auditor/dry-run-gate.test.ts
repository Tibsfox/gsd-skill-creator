import { describe, it, expect, vi, afterEach } from 'vitest';
import { DryRunGate } from './dry-run-gate.js';

// We mock the child_process module to avoid running real commands
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

afterEach(() => {
  vi.resetAllMocks();
});

async function setupExecMock(stdout: string, stderr: string, exitCode: number) {
  const { exec } = await import('node:child_process');
  const mockExec = vi.mocked(exec);
  mockExec.mockImplementation(
    (_cmd: string, _opts: unknown, cb: unknown) => {
      const callback = cb as (err: { code: number; message: string } | null, result: { stdout: string; stderr: string }) => void;
      if (exitCode !== 0) {
        callback({ code: exitCode, message: stderr }, { stdout, stderr });
      } else {
        callback(null, { stdout, stderr });
      }
      // Return a fake child process object
      return {} as ReturnType<typeof exec>;
    }
  );
}

describe('DryRunGate', () => {
  it('returns no conflicts when npm install --dry-run succeeds', async () => {
    await setupExecMock('added 100 packages', '', 0);

    const gate = new DryRunGate();
    const result = await gate.check('/project', 'npm');

    expect(result.ecosystem).toBe('npm');
    expect(result.hasConflicts).toBe(false);
    expect(result.conflictSummary).toHaveLength(0);
  });

  it('returns conflicts when npm install --dry-run reports ERESOLVE', async () => {
    const errorOutput = 'npm ERR! code ERESOLVE\nnpm ERR! conflicting peer dependency';
    await setupExecMock('', errorOutput, 1);

    const gate = new DryRunGate();
    const result = await gate.check('/project', 'npm');

    expect(result.hasConflicts).toBe(true);
    expect(result.conflictSummary.length).toBeGreaterThan(0);
    expect(result.conflictSummary.some((s) => s.includes('ERESOLVE') || s.includes('conflict'))).toBe(true);
  });

  it('handles command not found gracefully', async () => {
    const { exec } = await import('node:child_process');
    const mockExec = vi.mocked(exec);
    mockExec.mockImplementation((_cmd: string, _opts: unknown, cb: unknown) => {
      const callback = cb as (err: { code: string; message: string } | null, result?: unknown) => void;
      callback({ code: 'ENOENT', message: 'command not found: npm' });
      return {} as ReturnType<typeof exec>;
    });

    const gate = new DryRunGate();
    const result = await gate.check('/project', 'npm');

    expect(result.hasConflicts).toBe(false);
    expect(result.conflictSummary.some((s) => s.includes('not installed') || s.includes('skipped'))).toBe(true);
  });

  it('returns no conflicts for pypi when pip check exits 0', async () => {
    await setupExecMock('No broken requirements found.', '', 0);

    const gate = new DryRunGate();
    const result = await gate.check('/project', 'pypi');

    expect(result.ecosystem).toBe('pypi');
    expect(result.hasConflicts).toBe(false);
  });

  it('returns conflicts for pypi when pip check exits non-zero', async () => {
    await setupExecMock('', 'flask 2.0.0 has requirement Werkzeug>=2.0, but you have Werkzeug 1.0.1.', 1);

    const gate = new DryRunGate();
    const result = await gate.check('/project', 'pypi');

    expect(result.hasConflicts).toBe(true);
  });
});
