/**
 * Pre-install dry-run conflict detector.
 *
 * Runs package-manager dry-run/check commands without modifying any files,
 * then parses the output to detect environment conflicts.
 */

import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Ecosystem } from './types.js';

export interface DryRunResult {
  ecosystem: Ecosystem;
  hasConflicts: boolean;
  /** Human-readable conflict descriptions parsed from command output. */
  conflictSummary: string[];
  /** Raw combined stdout+stderr output from the dry-run command. */
  rawOutput: string;
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  commandNotFound: boolean;
}

function runCommand(cmd: string, cwd: string): Promise<ExecResult> {
  return new Promise((resolve) => {
    exec(cmd, { cwd, timeout: 30_000 }, (err, stdout, stderr) => {
      if (err) {
        const errCode = (err as NodeJS.ErrnoException).code;
        const isNotFound = errCode === 'ENOENT' ||
          (err.message ?? '').includes('not found') ||
          (err.message ?? '').includes('No such file');
        resolve({
          stdout: typeof stdout === 'string' ? stdout : '',
          stderr: typeof stderr === 'string' ? stderr : (err.message ?? ''),
          exitCode: typeof err.code === 'number' ? err.code : 1,
          commandNotFound: isNotFound,
        });
      } else {
        resolve({ stdout: stdout ?? '', stderr: stderr ?? '', exitCode: 0, commandNotFound: false });
      }
    });
  });
}

const COMMANDS: Record<Ecosystem, (projectRoot: string) => string | null> = {
  npm: () => 'npm install --dry-run',
  pypi: () => 'pip check',
  conda: (root) =>
    existsSync(join(root, 'environment.yml')) ? 'conda install --dry-run' : null,
  cargo: () => 'cargo check',
  rubygems: () => 'bundle check',
};

const CONFLICT_PATTERNS: Record<Ecosystem, RegExp[]> = {
  npm: [/ERESOLVE/i, /conflicting peer/i, /conflict/i],
  pypi: [/.+/], // any non-empty line on stderr → conflict
  conda: [/UnsatisfiableError/i, /conflict/i],
  cargo: [/error\[E/i],
  rubygems: [/.+/], // non-zero exit = conflict
};

export class DryRunGate {
  async check(projectRoot: string, ecosystem: Ecosystem): Promise<DryRunResult> {
    const cmdFactory = COMMANDS[ecosystem];
    const cmd = cmdFactory(projectRoot);

    if (!cmd) {
      return {
        ecosystem,
        hasConflicts: false,
        conflictSummary: [],
        rawOutput: '',
      };
    }

    const { stdout, stderr, exitCode, commandNotFound } = await runCommand(
      cmd,
      projectRoot,
    );

    if (commandNotFound) {
      const pmName = cmd.split(' ')[0];
      return {
        ecosystem,
        hasConflicts: false,
        conflictSummary: [`dry-run skipped: ${pmName} not installed`],
        rawOutput: stderr,
      };
    }

    const combined = [stdout, stderr].filter(Boolean).join('\n');
    const patterns = CONFLICT_PATTERNS[ecosystem];
    const hasConflicts = exitCode !== 0;

    const conflictSummary: string[] = hasConflicts
      ? combined
          .split('\n')
          .filter((line) => line.trim() && patterns.some((p) => p.test(line)))
          .slice(0, 10) // cap at 10 lines
      : [];

    // If no lines matched patterns but exit code was non-zero, include raw error
    if (hasConflicts && conflictSummary.length === 0) {
      const firstLine = combined.split('\n').find((l) => l.trim());
      if (firstLine) conflictSummary.push(firstLine.trim());
    }

    return {
      ecosystem,
      hasConflicts,
      conflictSummary,
      rawOutput: combined,
    };
  }
}
