import { exec } from 'child_process';
import { promisify } from 'util';
import { SkillVersion } from '../types/learning.js';

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

  constructor(skillsDir = '.claude/skills', workDir = '.') {
    this.skillsDir = skillsDir;
    this.workDir = workDir;
  }

  /**
   * Run a git command in the work directory
   */
  private async git(command: string): Promise<string> {
    const { stdout } = await execAsync(command, {
      encoding: 'utf8',
      cwd: this.workDir,
    });
    return stdout;
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
    } catch {
      return null;
    }
  }
}
