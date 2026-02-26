import { describe, it, expect, vi, beforeEach } from 'vitest';

// === Hoisted mock variables ===

const { mockInstall } = vi.hoisted(() => ({
  mockInstall: vi.fn(),
}));

// === Mock the install workflow ===

vi.mock('../git/workflows/install.js', () => ({
  install: mockInstall,
  parseRepoUrl: vi.fn().mockReturnValue({
    owner: 'gsd-build',
    repo: 'get-shit-done',
    host: 'github.com',
    protocol: 'https',
    cloneUrl: 'https://github.com/gsd-build/get-shit-done.git',
  }),
}));

import { installCommand } from './sc-install.js';

describe('installCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses URL from positional argument', async () => {
    mockInstall.mockResolvedValue({
      success: true,
      alreadyInstalled: false,
      repoName: 'get-shit-done',
      repoPath: '/tmp/projects/get-shit-done',
    });

    await installCommand(['https://github.com/gsd-build/get-shit-done']);

    expect(mockInstall).toHaveBeenCalledWith(
      'https://github.com/gsd-build/get-shit-done',
      expect.objectContaining({}),
    );
  });

  it('passes --main-branch option through', async () => {
    mockInstall.mockResolvedValue({
      success: true,
      alreadyInstalled: false,
      repoName: 'repo',
      repoPath: '/tmp/projects/repo',
    });

    await installCommand([
      'https://github.com/owner/repo',
      '--main-branch',
      'master',
    ]);

    expect(mockInstall).toHaveBeenCalledWith(
      'https://github.com/owner/repo',
      expect.objectContaining({ mainBranch: 'master' }),
    );
  });

  it('passes --dev-branch option through', async () => {
    mockInstall.mockResolvedValue({
      success: true,
      alreadyInstalled: false,
      repoName: 'repo',
      repoPath: '/tmp/projects/repo',
    });

    await installCommand([
      'https://github.com/owner/repo',
      '--dev-branch',
      'develop',
    ]);

    expect(mockInstall).toHaveBeenCalledWith(
      'https://github.com/owner/repo',
      expect.objectContaining({ devBranch: 'develop' }),
    );
  });

  it('reports success message on completion', async () => {
    mockInstall.mockResolvedValue({
      success: true,
      alreadyInstalled: false,
      repoName: 'get-shit-done',
      repoPath: '/tmp/projects/get-shit-done',
      config: {
        repo: 'get-shit-done',
        devBranch: 'dev',
        mainBranch: 'main',
        gates: { mergeToMain: true, prToUpstream: true },
      },
    });

    // Should not throw
    const result = await installCommand(['https://github.com/gsd-build/get-shit-done']);
    expect(result.success).toBe(true);
  });

  it('reports error message on failure', async () => {
    mockInstall.mockResolvedValue({
      success: false,
      alreadyInstalled: false,
      error: 'git: command not found',
    });

    const result = await installCommand(['https://github.com/gsd-build/get-shit-done']);
    expect(result.success).toBe(false);
    expect(result.message).toContain('error');
  });

  it('throws when no URL provided', async () => {
    await expect(installCommand([])).rejects.toThrow(/url.*required/i);
  });
});
