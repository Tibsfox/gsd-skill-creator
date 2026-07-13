import { exec } from 'child_process';
import { promisify } from 'util';
import { SkillVersion } from '../types/learning.js';
import type { RevertedCommitSignal } from '../types/learning.js';
import {
  resolveRevertsFromGit,
  type ResolveRevertsOptions,
} from './revert-resolver.js';
import {
  ensureProcessAllowed,
  ProcessContextDenied,
  type ProcessContext,
} from '../security/process-context.js';

const execAsync = promisify(exec);

export interface RollbackResult {
  success: boolean;
  previousHash?: string;
  newHash?: string;
  message?: string;
  error?: string;
}

/**
 * VersionManager provides git-based skill versioning and rollback.
 * Skills are already git-tracked (REG-04), so we leverage existing history.
 */
export class VersionManager {
  private skillsDir: string;
  private workDir: string;
  private ctx?: ProcessContext;

  constructor(skillsDir = '.claude/skills', workDir = '.', ctx?: ProcessContext) {
    this.skillsDir = skillsDir;
    this.workDir = workDir;
    this.ctx = ctx;
  }

  /**
   * Run a git command in the work directory
   */
  private async git(command: string): Promise<string> {
    // Security: hoisted ensureProcessAllowed at the single internal-helper
    // spawn site (#10433 internal-helper pattern). The full command string
    // is passed as argv to /bin/sh -c; the audit records the exec semantics.
    // ProcessContextDenied propagates per #10427 (no swallowing try/catch).
    ensureProcessAllowed(this.ctx, 'learning/version-manager', 'exec', 'sh', ['-c', command]);
    const { stdout } = await execAsync(command, {
      encoding: 'utf8',
      cwd: this.workDir,
    });
    return stdout;
  }

  /**
   * Resolve reverted-commit correction facts from real git history.
   *
   * Feeds the PURE CorrectionDetector's injected `reverts[]` (item-7). Git access
   * routes through the ProcessContext-gated `git` helper; `ProcessContextDenied`
   * propagates, ordinary git failures degrade to []. See revert-resolver.ts.
   */
  async resolveReverts(opts?: ResolveRevertsOptions): Promise<RevertedCommitSignal[]> {
    return resolveRevertsFromGit((command) => this.git(command), opts);
  }

  /**
   * Get version history for a skill
   */
  async getHistory(skillName: string): Promise<SkillVersion[]> {
    const skillPath = `${this.skillsDir}/${skillName}/SKILL.md`;

    try {
      const stdout = await this.git(
        `git log --format="%H|%h|%ai|%s" --follow -- "${skillPath}"`
      );

      if (!stdout.trim()) {
        return [];
      }

      const versions: SkillVersion[] = [];

      for (const line of stdout.trim().split('\n')) {
        const [hash, shortHash, dateStr, ...messageParts] = line.split('|');
        const message = messageParts.join('|');

        // Try to parse version from commit message (e.g., "v2" or "version 2")
        const versionMatch = message.match(/v(?:ersion)?\.?\s*(\d+)/i);
        const version = versionMatch ? parseInt(versionMatch[1], 10) : undefined;

        versions.push({
          hash,
          shortHash,
          date: new Date(dateStr),
          message,
          version,
        });
      }

      return versions;
    } catch (err) {
      // #10427: ProcessContextDenied is load-bearing — re-throw before the
      // swallow-everything fallthrough so security denials propagate.
      if (err instanceof ProcessContextDenied) throw err;
      const error = err as { code?: string; message?: string };
      if (error.code === 'ENOENT' || error.message?.includes('not a git repository')) {
        throw new Error('Git is not available or this is not a git repository');
      }
      // Empty history (file not tracked)
      return [];
    }
  }

  /**
   * Get skill content at a specific version
   */
  async getVersionContent(skillName: string, hash: string): Promise<string> {
    const skillPath = `${this.skillsDir}/${skillName}/SKILL.md`;

    try {
      return await this.git(`git show ${hash}:"${skillPath}"`);
    } catch (err) {
      if (err instanceof ProcessContextDenied) throw err;
      const error = err as { message?: string };
      if (error.message?.includes('does not exist') || error.message?.includes('invalid object name')) {
        throw new Error(`Version ${hash.slice(0, 7)} not found for skill ${skillName}`);
      }
      throw err;
    }
  }

  /**
   * Rollback a skill to a previous version
   * Creates a new commit (non-destructive)
   */
  async rollback(skillName: string, targetHash: string): Promise<RollbackResult> {
    const skillPath = `${this.skillsDir}/${skillName}/SKILL.md`;

    try {
      // Get current hash before rollback
      const previousHash = await this.getCurrentHash(skillName);
      if (!previousHash) {
        return { success: false, error: 'Skill is not tracked in git' };
      }

      // Verify target hash exists in history
      const history = await this.getHistory(skillName);
      const targetExists = history.some(v => v.hash === targetHash || v.shortHash === targetHash);
      if (!targetExists) {
        return { success: false, error: `Version ${targetHash.slice(0, 7)} not found in history` };
      }

      // Checkout the file at target version
      await this.git(`git checkout ${targetHash} -- "${skillPath}"`);

      // Stage the change
      await this.git(`git add "${skillPath}"`);

      // Commit the rollback
      const commitMessage = `rollback(${skillName}): revert to ${targetHash.slice(0, 7)}`;
      await this.git(`git commit -m "${commitMessage}"`);

      // Get new hash
      const newHash = await this.getCurrentHash(skillName);

      return {
        success: true,
        previousHash,
        newHash: newHash || undefined,
        message: commitMessage,
      };
    } catch (err) {
      // #10427: security denials propagate even from result-wrapping catches.
      if (err instanceof ProcessContextDenied) throw err;
      const error = err as { message?: string };
      return {
        success: false,
        error: error.message || 'Unknown error during rollback',
      };
    }
  }

  /**
   * Compare two versions of a skill
   */
  async compareVersions(skillName: string, hash1: string, hash2: string): Promise<string> {
    const skillPath = `${this.skillsDir}/${skillName}/SKILL.md`;

    try {
      return await this.git(`git diff ${hash1} ${hash2} -- "${skillPath}"`);
    } catch (err) {
      if (err instanceof ProcessContextDenied) throw err;
      const error = err as { message?: string };
      throw new Error(`Failed to compare versions: ${error.message}`);
    }
  }

  /**
   * Get the current (HEAD) hash for a skill
   */
  async getCurrentHash(skillName: string): Promise<string | null> {
    const skillPath = `${this.skillsDir}/${skillName}/SKILL.md`;

    try {
      const stdout = await this.git(`git log -1 --format="%H" -- "${skillPath}"`);
      return stdout.trim() || null;
    } catch (err) {
      // #10427: security denial is load-bearing even from getCurrentHash.
      if (err instanceof ProcessContextDenied) throw err;
      return null;
    }
  }
}
