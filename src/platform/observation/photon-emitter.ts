import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, relative } from 'node:path';
import { PhotonPathSchema, PhotonEchoSchema, PhotonBatchSchema } from '../../core/types/photon.js';
import type { PhotonPath, PhotonEcho, PhotonBatch } from '../../core/types/photon.js';

const execFileAsync = promisify(execFile);

export class PhotonEmitter {
  /**
   * Fire a single photon along a path and return its echo.
   * Each firing is independent — no instance state.
   */
  async fire(path: PhotonPath): Promise<PhotonEcho> {
    const parsed = PhotonPathSchema.parse(path);
    const content = await this.readPath(parsed.type, parsed.target);
    const hash = content !== null ? this.hash(content) : null;
    const signal = parsed.expectedHash === null
      ? 'same' as const    // baseline measurement — no expected hash means first read
      : hash === parsed.expectedHash ? 'same' as const : 'different' as const;

    return PhotonEchoSchema.parse({
      signal,
      hash,
      pathType: parsed.type,
      target: parsed.target,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Fire a batch of photons in parallel. Each path is independent.
   */
  async fireBatch(batchId: string, paths: PhotonPath[]): Promise<PhotonBatch> {
    const echoes = await Promise.all(paths.map(p => this.fire(p)));
    const differenceCount = echoes.filter(e => e.signal === 'different').length;

    return PhotonBatchSchema.parse({
      batchId,
      paths,
      echoes,
      differenceCount,
      completedAt: new Date().toISOString(),
    });
  }

  /**
   * Read content from a path based on its type.
   * Returns null if path is unreachable — absence IS difference.
   */
  private async readPath(type: PhotonPath['type'], target: string): Promise<string | null> {
    try {
      switch (type) {
        case 'file':
          return await readFile(target, 'utf-8');

        case 'glob': {
          // Use the target as a base directory pattern
          // Returns sorted file listing
          const files = await this.listFilesRecursive(target);
          return files.sort().join('\n');
        }

        case 'git-status': {
          const { stdout } = await execFileAsync('git', ['status', '--porcelain'], { cwd: target });
          return stdout;
        }

        case 'git-hash': {
          const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: target });
          return stdout.trim();
        }

        case 'test-suite': {
          const { stdout, stderr } = await execFileAsync('sh', ['-c', target], { timeout: 60_000 });
          return stdout + stderr;
        }

        case 'tree': {
          const files = await this.listFilesRecursive(target);
          return files.sort().join('\n');
        }

        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * SHA-256 hash of content string.
   */
  private hash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Recursively list all files in a directory, returning relative paths.
   */
  private async listFilesRecursive(dir: string): Promise<string[]> {
    const results: string[] = [];
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          const subFiles = await this.listFilesRecursive(fullPath);
          results.push(...subFiles);
        } else {
          results.push(relative(dir, fullPath));
        }
      }
    } catch {
      // Directory unreachable
    }
    return results;
  }
}
