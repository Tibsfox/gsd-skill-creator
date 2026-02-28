import { describe, it, expect, vi, beforeEach } from 'vitest';

// === Hoisted mock variables ===

const {
  mockInstallRepo,
  mockIsInstalled,
  mockLoadConfig,
  mockSaveConfig,
  mockDetectState,
  mockAssertClean,
  mockLogOperation,
  mockExecSync,
  mockMkdirSync,
  mockExistsSync,
} = vi.hoisted(() => ({
  mockInstallRepo: vi.fn(),
  mockIsInstalled: vi.fn(),
  mockLoadConfig: vi.fn(),
  mockSaveConfig: vi.fn(),
  mockDetectState: vi.fn(),
  mockAssertClean: vi.fn(),
  mockLogOperation: vi.fn(),
  mockExecSync: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockExistsSync: vi.fn(),
}));

// === Mock all external dependencies ===

vi.mock('../core/repo-manager.js', () => ({
  installRepo: mockInstallRepo,
  isInstalled: mockIsInstalled,
  loadConfig: mockLoadConfig,
  saveConfig: mockSaveConfig,
}));

vi.mock('../core/state-machine.js', () => ({
  detectState: mockDetectState,
  assertClean: mockAssertClean,
}));

vi.mock('../core/logger.js', () => ({
  logOperation: mockLogOperation,
}));

vi.mock('node:child_process', () => ({
  execSync: mockExecSync,
}));

vi.mock('node:fs', () => ({
  default: {
    mkdirSync: mockMkdirSync,
    existsSync: mockExistsSync,
  },
  mkdirSync: mockMkdirSync,
  existsSync: mockExistsSync,
}));

import type { ScGitConfig, GitStateReport } from '../types.js';

// Will import from the implementation once it exists
import { parseRepoUrl, install, resolveInstallPaths } from './install.js';

// === Test Data ===

const cleanStateReport: GitStateReport = {
  state: 'CLEAN',
  branch: 'dev',
  remotes: [
    { name: 'upstream', url: 'https://github.com/gsd-build/get-shit-done.git', fetch: '+refs/heads/*:refs/remotes/upstream/*' },
    { name: 'origin', url: 'https://github.com/gsd-build/get-shit-done.git', fetch: '+refs/heads/*:refs/remotes/origin/*' },
  ],
  ahead: 0,
  behind: 0,
  staged: [],
  unstaged: [],
  untracked: [],
};

const sampleConfig: ScGitConfig = {
  repo: 'get-shit-done',
  upstream: 'https://github.com/gsd-build/get-shit-done.git',
  origin: 'https://github.com/gsd-build/get-shit-done.git',
  devBranch: 'dev',
  mainBranch: 'main',
  gates: { mergeToMain: true, prToUpstream: true },
  worktreeRoot: '/tmp/test-project/worktrees/get-shit-done',
  installedAt: '2026-01-01T00:00:00.000Z',
  lastSync: null,
};

// === URL Parsing Tests ===

describe('parseRepoUrl', () => {
  it('parses HTTPS GitHub URL', () => {
    const result = parseRepoUrl('https://github.com/gsd-build/get-shit-done');
    expect(result.owner).toBe('gsd-build');
    expect(result.repo).toBe('get-shit-done');
    expect(result.host).toBe('github.com');
    expect(result.protocol).toBe('https');
    expect(result.cloneUrl).toBe('https://github.com/gsd-build/get-shit-done.git');
  });

  it('parses HTTPS URL with .git suffix', () => {
    const result = parseRepoUrl('https://github.com/gsd-build/get-shit-done.git');
    expect(result.owner).toBe('gsd-build');
    expect(result.repo).toBe('get-shit-done');
    expect(result.host).toBe('github.com');
    expect(result.protocol).toBe('https');
    expect(result.cloneUrl).toBe('https://github.com/gsd-build/get-shit-done.git');
  });

  it('parses SSH URL', () => {
    const result = parseRepoUrl('git@github.com:gsd-build/get-shit-done.git');
    expect(result.owner).toBe('gsd-build');
    expect(result.repo).toBe('get-shit-done');
    expect(result.host).toBe('github.com');
    expect(result.protocol).toBe('ssh');
    expect(result.cloneUrl).toBe('https://github.com/gsd-build/get-shit-done.git');
  });

  it('parses GitLab URL', () => {
    const result = parseRepoUrl('https://gitlab.com/user/project');
    expect(result.host).toBe('gitlab.com');
    expect(result.owner).toBe('user');
    expect(result.repo).toBe('project');
    expect(result.protocol).toBe('https');
  });

  it('rejects invalid URL', () => {
    expect(() => parseRepoUrl('not-a-url')).toThrow(/invalid.*url/i);
  });

  it('rejects URL without owner/repo', () => {
    expect(() => parseRepoUrl('https://github.com/')).toThrow();
  });

  it('handles trailing slashes', () => {
    const result = parseRepoUrl('https://github.com/owner/repo/');
    expect(result.owner).toBe('owner');
    expect(result.repo).toBe('repo');
  });

  it('parses Bitbucket URL', () => {
    const result = parseRepoUrl('https://bitbucket.org/team/project.git');
    expect(result.host).toBe('bitbucket.org');
    expect(result.owner).toBe('team');
    expect(result.repo).toBe('project');
  });
});

// === resolveInstallPaths Tests ===

describe('resolveInstallPaths', () => {
  it('resolves paths relative to project root', () => {
    const paths = resolveInstallPaths('my-repo', '/home/user/projects');
    expect(paths.repoPath).toBe('/home/user/projects/projects/my-repo');
    expect(paths.worktreePath).toBe('/home/user/projects/worktrees/my-repo');
    expect(paths.configDir).toBe('/home/user/projects/.sc-git');
  });

  it('uses process.cwd() when no project root given', () => {
    const paths = resolveInstallPaths('my-repo');
    expect(paths.repoPath).toContain('projects/my-repo');
    expect(paths.configDir).toContain('.sc-git');
  });
});

// === Install Flow Tests ===

describe('install', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsInstalled.mockResolvedValue(false);
    mockExistsSync.mockReturnValue(false);
    mockMkdirSync.mockReturnValue(undefined);
    mockInstallRepo.mockResolvedValue(sampleConfig);
    mockDetectState.mockResolvedValue(cleanStateReport);
    mockAssertClean.mockResolvedValue(undefined);
    mockSaveConfig.mockResolvedValue(undefined);
    mockLogOperation.mockResolvedValue(undefined);
    // Mock git remote show for default branch detection
    mockExecSync.mockReturnValue(Buffer.from('  HEAD branch: main\n'));
  });

  it('succeeds for fresh install with valid URL', async () => {
    const result = await install('https://github.com/gsd-build/get-shit-done', {
      projectRoot: '/tmp/test-project',
    });

    expect(result.success).toBe(true);
    expect(result.alreadyInstalled).toBe(false);
    expect(mockInstallRepo).toHaveBeenCalledOnce();
  });

  it('detects already-installed repos and returns early', async () => {
    mockIsInstalled.mockResolvedValue(true);
    mockLoadConfig.mockResolvedValue(sampleConfig);

    const result = await install('https://github.com/gsd-build/get-shit-done', {
      projectRoot: '/tmp/test-project',
    });

    expect(result.alreadyInstalled).toBe(true);
    expect(mockInstallRepo).not.toHaveBeenCalled();
  });

  it('auto-detects default branch from upstream', async () => {
    mockExecSync.mockReturnValue(Buffer.from('  HEAD branch: master\n'));

    const masterConfig = { ...sampleConfig, mainBranch: 'master' };
    mockInstallRepo.mockResolvedValue(masterConfig);

    const result = await install('https://github.com/gsd-build/get-shit-done', {
      projectRoot: '/tmp/test-project',
    });

    expect(result.success).toBe(true);
  });

  it('creates required directories', async () => {
    await install('https://github.com/gsd-build/get-shit-done', {
      projectRoot: '/tmp/test-project',
    });

    // Should create project dir, worktree dir, and config dir
    expect(mockMkdirSync).toHaveBeenCalled();
  });

  it('writes config after successful install', async () => {
    await install('https://github.com/gsd-build/get-shit-done', {
      projectRoot: '/tmp/test-project',
    });

    expect(mockSaveConfig).toHaveBeenCalledOnce();
    const savedConfig = mockSaveConfig.mock.calls[0][1];
    expect(savedConfig.repo).toBe('get-shit-done');
    expect(savedConfig.gates.mergeToMain).toBe(true);
    expect(savedConfig.gates.prToUpstream).toBe(true);
    expect(savedConfig.devBranch).toBe('dev');
    expect(savedConfig.lastSync).toBeNull();
    expect(savedConfig.installedAt).toBeTruthy();
  });

  it('verifies post-install state is clean', async () => {
    await install('https://github.com/gsd-build/get-shit-done', {
      projectRoot: '/tmp/test-project',
    });

    expect(mockDetectState).toHaveBeenCalled();
  });

  it('logs operation to JSONL', async () => {
    await install('https://github.com/gsd-build/get-shit-done', {
      projectRoot: '/tmp/test-project',
    });

    expect(mockLogOperation).toHaveBeenCalledOnce();
    const logArgs = mockLogOperation.mock.calls[0];
    expect(logArgs[1]).toBe('install');
    expect(logArgs[5]).toBe(true); // success
  });

  it('returns descriptive error when git is not found', async () => {
    mockInstallRepo.mockRejectedValue(new Error('git: command not found'));

    const result = await install('https://github.com/gsd-build/get-shit-done', {
      projectRoot: '/tmp/test-project',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns install result with parsed repo info', async () => {
    const result = await install('https://github.com/gsd-build/get-shit-done', {
      projectRoot: '/tmp/test-project',
    });

    expect(result.repoName).toBe('get-shit-done');
    expect(result.repoPath).toContain('get-shit-done');
  });

  it('does not use --force flag anywhere', async () => {
    await install('https://github.com/gsd-build/get-shit-done', {
      projectRoot: '/tmp/test-project',
    });

    // Verify no --force in any execSync call
    for (const call of mockExecSync.mock.calls) {
      const cmd = String(call[0]);
      expect(cmd).not.toContain('--force');
    }
  });
});
