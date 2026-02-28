import { describe, it, expect, vi } from 'vitest';
import type { VenvConfig, VenvResult, PythonProjectInfo, DependencySpec } from '../../../../../src/packs/dogfood/pydmd/types.js';
import { createVenv, cleanupVenv } from '../../../../../src/packs/dogfood/pydmd/install/venv-manager.js';
import type { CommandExecutor } from '../../../../../src/packs/dogfood/pydmd/install/venv-manager.js';

// --- Factories ---

function makeVenvConfig(overrides: Partial<VenvConfig> = {}): VenvConfig {
  return {
    projectPath: '/tmp/pydmd',
    venvPath: '/tmp/pydmd/.venv',
    pythonVersion: '3.11',
    installGroups: ['core', 'test'],
    ...overrides,
  };
}

function makeProjectInfo(overrides: Partial<PythonProjectInfo> = {}): PythonProjectInfo {
  return {
    isPython: true,
    buildSystem: 'pyproject-setuptools',
    pythonRequires: '>=3.9',
    testFramework: 'pytest',
    dependencyGroups: {
      core: [{ name: 'numpy', versionConstraint: '>=1.20', optional: false }],
      test: [{ name: 'pytest', versionConstraint: '>=7.0', optional: false }],
      dev: [],
      extras: {},
    },
    directories: {
      source: 'pydmd/',
      tests: 'tests/',
      tutorials: null,
      docs: null,
    },
    entryPoints: ['pydmd'],
    ...overrides,
  };
}

function makeSuccessExec(overrides: Record<string, { stdout?: string; stderr?: string; exitCode?: number }> = {}): CommandExecutor {
  return async (cmd: string, args: string[]) => {
    const key = `${cmd} ${args.join(' ')}`;

    // Check for overrides matching a substring of the command
    for (const [pattern, result] of Object.entries(overrides)) {
      if (key.includes(pattern)) {
        return {
          stdout: result.stdout ?? '',
          stderr: result.stderr ?? '',
          exitCode: result.exitCode ?? 0,
        };
      }
    }

    // Default: pip freeze returns package list
    if (key.includes('pip freeze')) {
      return { stdout: 'numpy==1.24.0\nscipy==1.11.0\npytest==7.4.0\n', stderr: '', exitCode: 0 };
    }

    // Default: du -sb returns size
    if (key.includes('du -sb')) {
      return { stdout: '104857600\t/tmp/pydmd/.venv', stderr: '', exitCode: 0 };
    }

    return { stdout: '', stderr: '', exitCode: 0 };
  };
}

function makeFailingExec(failPattern: string, error: string = 'Command failed'): CommandExecutor {
  return async (cmd: string, args: string[]) => {
    const key = `${cmd} ${args.join(' ')}`;

    if (key.includes(failPattern)) {
      return { stdout: '', stderr: error, exitCode: 1 };
    }

    // pip freeze still works for other commands
    if (key.includes('pip freeze')) {
      return { stdout: 'numpy==1.24.0\n', stderr: '', exitCode: 0 };
    }

    if (key.includes('du -sb')) {
      return { stdout: '104857600\t/tmp/pydmd/.venv', stderr: '', exitCode: 0 };
    }

    return { stdout: '', stderr: '', exitCode: 0 };
  };
}

describe('venv-manager', () => {
  describe('INS-03: Venv creation and dep installation', () => {
    it('creates venv via python -m venv command', async () => {
      const calls: string[] = [];
      const exec: CommandExecutor = async (cmd, args) => {
        calls.push(`${cmd} ${args.join(' ')}`);
        if (args.join(' ').includes('pip freeze')) {
          return { stdout: 'numpy==1.24.0\n', stderr: '', exitCode: 0 };
        }
        if (args.join(' ').includes('du -sb')) {
          return { stdout: '104857600\t/tmp/pydmd/.venv', stderr: '', exitCode: 0 };
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      };

      await createVenv(makeVenvConfig(), makeProjectInfo(), exec);

      const venvCall = calls.find(c => c.includes('-m venv'));
      expect(venvCall).toBeDefined();
      expect(venvCall).toContain('/tmp/pydmd/.venv');
    });

    it('upgrades pip after venv creation', async () => {
      const calls: string[] = [];
      const exec: CommandExecutor = async (cmd, args) => {
        calls.push(`${cmd} ${args.join(' ')}`);
        if (args.join(' ').includes('pip freeze')) {
          return { stdout: 'numpy==1.24.0\n', stderr: '', exitCode: 0 };
        }
        if (args.join(' ').includes('du -sb')) {
          return { stdout: '104857600\t/tmp/pydmd/.venv', stderr: '', exitCode: 0 };
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      };

      await createVenv(makeVenvConfig(), makeProjectInfo(), exec);

      const pipUpgrade = calls.find(c => c.includes('pip install --upgrade pip'));
      expect(pipUpgrade).toBeDefined();
    });

    it('installs core+test deps via pip install -e ".[test]"', async () => {
      const calls: string[] = [];
      const exec: CommandExecutor = async (cmd, args) => {
        calls.push(`${cmd} ${args.join(' ')}`);
        if (args.join(' ').includes('pip freeze')) {
          return { stdout: 'numpy==1.24.0\npytest==7.4.0\n', stderr: '', exitCode: 0 };
        }
        if (args.join(' ').includes('du -sb')) {
          return { stdout: '104857600\t/tmp/pydmd/.venv', stderr: '', exitCode: 0 };
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      };

      await createVenv(makeVenvConfig({ installGroups: ['core', 'test'] }), makeProjectInfo(), exec);

      const installCall = calls.find(c => c.includes('pip install') && c.includes('.[test]'));
      expect(installCall).toBeDefined();
    });

    it('returns VenvResult with success and correct fields', async () => {
      const result = await createVenv(
        makeVenvConfig(),
        makeProjectInfo(),
        makeSuccessExec(),
      );

      expect(result.success).toBe(true);
      expect(result.venvPath).toBe('/tmp/pydmd/.venv');
      expect(result.pythonPath).toContain('/tmp/pydmd/.venv');
      expect(result.pythonPath).toContain('python');
      expect(result.installedPackages).toContain('numpy==1.24.0');
      expect(result.installedPackages).toContain('pytest==7.4.0');
      expect(result.installErrors).toHaveLength(0);
    });

    it('records sizeBytes from venv directory', async () => {
      const result = await createVenv(
        makeVenvConfig(),
        makeProjectInfo(),
        makeSuccessExec({ 'du -sb': { stdout: '209715200\t/tmp/pydmd/.venv' } }),
      );

      expect(result.sizeBytes).toBe(209715200);
    });
  });

  describe('INS-04: Failure handling and cleanup', () => {
    it('returns failure and calls cleanup when pip install fails', async () => {
      const calls: string[] = [];
      const exec: CommandExecutor = async (cmd, args) => {
        const key = `${cmd} ${args.join(' ')}`;
        calls.push(key);

        if (key.includes('pip install') && key.includes('.[test]')) {
          return { stdout: '', stderr: 'ERROR: Could not find version', exitCode: 1 };
        }
        if (key.includes('du -sb')) {
          return { stdout: '104857600\t/tmp/pydmd/.venv', stderr: '', exitCode: 0 };
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      };

      const result = await createVenv(makeVenvConfig(), makeProjectInfo(), exec);

      expect(result.success).toBe(false);
      expect(result.installErrors.length).toBeGreaterThan(0);
      // Should have called cleanup (rm -rf)
      const cleanupCall = calls.find(c => c.includes('rm') && c.includes('/tmp/pydmd/.venv'));
      expect(cleanupCall).toBeDefined();
    });

    it('returns failure when venv creation itself fails', async () => {
      const exec = makeFailingExec('-m venv', 'python3.11 not found');

      const result = await createVenv(makeVenvConfig(), makeProjectInfo(), exec);

      expect(result.success).toBe(false);
      expect(result.installErrors.some(e => e.includes('venv') || e.includes('python'))).toBe(true);
    });

    it('cleanup removes venv directory via rm -rf', async () => {
      const calls: string[] = [];
      const exec: CommandExecutor = async (cmd, args) => {
        calls.push(`${cmd} ${args.join(' ')}`);
        return { stdout: '', stderr: '', exitCode: 0 };
      };

      await cleanupVenv('/tmp/pydmd/.venv', exec);

      const rmCall = calls.find(c => c.includes('rm') && c.includes('-rf') && c.includes('/tmp/pydmd/.venv'));
      expect(rmCall).toBeDefined();
    });

    it('returns failure with timeout error when pip install exceeds timeout', async () => {
      const exec: CommandExecutor = async (cmd, args, opts) => {
        const key = `${cmd} ${args.join(' ')}`;

        if (key.includes('pip install') && key.includes('.[test]')) {
          // Simulate timeout by throwing
          throw new Error('Command timed out after 300000ms');
        }
        if (key.includes('du -sb')) {
          return { stdout: '104857600\t/tmp/pydmd/.venv', stderr: '', exitCode: 0 };
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      };

      const result = await createVenv(makeVenvConfig(), makeProjectInfo(), exec);

      expect(result.success).toBe(false);
      expect(result.installErrors.some(e => e.toLowerCase().includes('timeout') || e.toLowerCase().includes('timed out'))).toBe(true);
    });

    it('warns at 500MB disk usage', async () => {
      const result = await createVenv(
        makeVenvConfig(),
        makeProjectInfo(),
        makeSuccessExec({ 'du -sb': { stdout: '524288001\t/tmp/pydmd/.venv' } }),
      );

      // 500MB+ should still succeed but with a warning in errors
      expect(result.success).toBe(true);
      expect(result.installErrors.some(e => e.toLowerCase().includes('warn') || e.toLowerCase().includes('500'))).toBe(true);
    });

    it('hard fails at 2GB disk usage', async () => {
      const calls: string[] = [];
      const exec: CommandExecutor = async (cmd, args) => {
        const key = `${cmd} ${args.join(' ')}`;
        calls.push(key);

        if (key.includes('pip freeze')) {
          return { stdout: 'numpy==1.24.0\n', stderr: '', exitCode: 0 };
        }
        if (key.includes('du -sb')) {
          return { stdout: '2147483649\t/tmp/pydmd/.venv', stderr: '', exitCode: 0 };
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      };

      const result = await createVenv(makeVenvConfig(), makeProjectInfo(), exec);

      expect(result.success).toBe(false);
      expect(result.installErrors.some(e => e.toLowerCase().includes('2gb') || e.toLowerCase().includes('budget') || e.toLowerCase().includes('disk'))).toBe(true);
      // Should have cleaned up
      const cleanupCall = calls.find(c => c.includes('rm') && c.includes('/tmp/pydmd/.venv'));
      expect(cleanupCall).toBeDefined();
    });
  });
});
