import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import {
  installRepo,
  isInstalled,
  loadConfig,
  saveConfig,
} from '../../../../src/git/core/repo-manager.js';
import type { ScGitConfig } from '../../../../src/git/types.js';

// --- Helpers ---

const tempDirs: string[] = [];

function createBareUpstream(branchName?: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-git-bare-'));
  tempDirs.push(dir);
  execSync(`git init --bare ${branchName ? `--initial-branch=${branchName}` : ''}`, {
    cwd: dir,
    stdio: 'pipe',
  });

  // Create a temporary clone to push an initial commit
  const tmpClone = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-git-tmpclone-'));
  tempDirs.push(tmpClone);
  execSync(`git clone "${dir}" "${tmpClone}"`, { stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: tmpClone, stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { cwd: tmpClone, stdio: 'pipe' });
  fs.writeFileSync(path.join(tmpClone, 'README.md'), '# Test upstream\n');
  execSync('git add README.md', { cwd: tmpClone, stdio: 'pipe' });
  execSync('git commit -m "initial commit"', { cwd: tmpClone, stdio: 'pipe' });
  execSync('git push', { cwd: tmpClone, stdio: 'pipe' });

  return dir;
}

function createTargetDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-git-target-'));
  tempDirs.push(dir);
  // installRepo expects a non-existent target path (git clone creates it)
  // so return a path that doesn't exist yet
  const target = path.join(dir, 'repo');
  return target;
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
  tempDirs.length = 0;
});

// --- C-08: Clone succeeds ---

describe('installRepo', () => {
  it('C-08: clones repo and creates .git directory', async () => {
    const bare = createBareUpstream();
    const target = createTargetDir();
    await installRepo(bare, target);
    expect(fs.existsSync(path.join(target, '.git'))).toBe(true);
  });

  // --- C-09: Remotes configured ---

  it('C-09: configures origin and upstream remotes', async () => {
    const bare = createBareUpstream();
    const target = createTargetDir();
    await installRepo(bare, target);
    const remotes = execSync('git remote -v', { cwd: target, encoding: 'utf-8' });
    expect(remotes).toContain('origin');
    expect(remotes).toContain('upstream');
  });

  // --- C-10: Dev branch created ---

  it('C-10: creates dev branch and checks it out', async () => {
    const bare = createBareUpstream();
    const target = createTargetDir();
    await installRepo(bare, target);
    const branches = execSync('git branch', { cwd: target, encoding: 'utf-8' });
    expect(branches).toContain('dev');
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: target,
      encoding: 'utf-8',
    }).trim();
    expect(currentBranch).toBe('dev');
  });

  // --- C-11: Config written ---

  it('C-11: writes .sc-git/config.json with all ScGitConfig fields', async () => {
    const bare = createBareUpstream();
    const target = createTargetDir();
    await installRepo(bare, target);
    const configPath = path.join(target, '.sc-git', 'config.json');
    expect(fs.existsSync(configPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as ScGitConfig;
    expect(config.repo).toBeTruthy();
    expect(config.upstream).toBeTruthy();
    expect(config.origin).toBeTruthy();
    expect(config.devBranch).toBe('dev');
    expect(config.mainBranch).toBeTruthy();
    expect(config.gates).toBeDefined();
    expect(config.gates.mergeToMain).toBe(true);
    expect(config.gates.prToUpstream).toBe(true);
    expect(config.worktreeRoot).toBeTruthy();
    expect(config.installedAt).toBeTruthy();
    expect(config.lastSync).toBeNull();
  });

  // --- C-12: Default branch detection ---

  it('C-12: detects master as default branch when upstream uses master', async () => {
    const bare = createBareUpstream('master');
    const target = createTargetDir();
    await installRepo(bare, target);
    const configPath = path.join(target, '.sc-git', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as ScGitConfig;
    expect(config.mainBranch).toBe('master');
  });

  // --- S-01: push.default = nothing ---

  it('S-01: sets push.default to nothing', async () => {
    const bare = createBareUpstream();
    const target = createTargetDir();
    await installRepo(bare, target);
    const pushDefault = execSync('git config push.default', {
      cwd: target,
      encoding: 'utf-8',
    }).trim();
    expect(pushDefault).toBe('nothing');
  });

  // --- S-02: dev pushRemote = origin ---

  it('S-02: sets branch.dev.pushRemote to origin', async () => {
    const bare = createBareUpstream();
    const target = createTargetDir();
    await installRepo(bare, target);
    const pushRemote = execSync('git config branch.dev.pushRemote', {
      cwd: target,
      encoding: 'utf-8',
    }).trim();
    expect(pushRemote).toBe('origin');
  });

  // --- Returns config ---

  it('returns the ScGitConfig object', async () => {
    const bare = createBareUpstream();
    const target = createTargetDir();
    const config = await installRepo(bare, target);
    expect(config).toBeDefined();
    expect(config.repo).toBeTruthy();
    expect(config.devBranch).toBe('dev');
  });
});

// --- isInstalled ---

describe('isInstalled', () => {
  it('returns true when .sc-git/config.json exists', async () => {
    const bare = createBareUpstream();
    const target = createTargetDir();
    await installRepo(bare, target);
    expect(await isInstalled(target)).toBe(true);
  });

  it('returns false for a plain git repo', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-git-plain-'));
    tempDirs.push(dir);
    execSync('git init', { cwd: dir, stdio: 'pipe' });
    expect(await isInstalled(dir)).toBe(false);
  });
});

// --- loadConfig / saveConfig ---

describe('loadConfig and saveConfig', () => {
  it('round-trips config faithfully', async () => {
    const bare = createBareUpstream();
    const target = createTargetDir();
    const originalConfig = await installRepo(bare, target);

    const loaded = await loadConfig(target);
    expect(loaded).toEqual(originalConfig);

    // Modify and save
    const modified: ScGitConfig = { ...loaded, lastSync: new Date().toISOString() };
    await saveConfig(target, modified);
    const reloaded = await loadConfig(target);
    expect(reloaded).toEqual(modified);
    expect(reloaded.lastSync).toBeTruthy();
  });

  it('loadConfig throws when config is missing', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-git-noconfig-'));
    tempDirs.push(dir);
    await expect(loadConfig(dir)).rejects.toThrow();
  });
});
