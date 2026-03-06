/**
 * photon-emitter.ts — Signal Intake: Measurement by Observation
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * PhotonEmitter measures the state of the filesystem, git repository, and test
 * suites by "firing photons" — reading paths and hashing their contents.
 * It returns "echoes" that tell you whether the measured state is 'same' or
 * 'different' from a previously recorded baseline hash.
 *
 * A photon is stateless: no memory between firings. The measurement exists only
 * in the echo it returns. This makes PhotonEmitter safe to use from any context
 * without initialization or cleanup.
 *
 * WHY THE METAPHOR
 * ----------------
 * In physics, measuring a quantum system changes it. Here, we adopt the
 * measurement metaphor without the disruption: firing a photon along a path
 * reads without modifying. The echo tells you what it found and whether it
 * changed since the last measurement.
 *
 * The metaphor grounds the system in rigorous measurement thinking:
 * - Absence of a file IS a measurement result (null hash, triggers 'different')
 * - Each firing is independent — results are not cached
 * - Batch firing is parallel — echoes do not depend on each other
 *
 * PATH TYPES
 * ----------
 * PhotonEmitter supports 6 path types, each measuring a different kind of state:
 *   'file'       — read a single file, hash its contents
 *   'glob'       — list all files under a path, hash the sorted listing
 *   'git-status' — run 'git status --porcelain', hash output (dirty = different)
 *   'git-hash'   — run 'git rev-parse HEAD', hash the commit SHA
 *   'test-suite' — execute a shell command, hash combined stdout+stderr
 *   'tree'       — recursively list all files under a directory
 *
 * 'glob' and 'tree' both return sorted file listings. Sorting is critical for
 * determinism: without it, directory enumeration order variation would produce
 * false 'different' echoes on identical filesystems.
 *
 * BASELINE MEASUREMENTS
 * ---------------------
 * When expectedHash is null, the signal is 'same' — this represents a baseline
 * measurement where no prior state exists to compare against. The caller stores
 * the returned hash as the new baseline for future comparisons.
 *
 * This design means "first measurement = always same" which is correct:
 * you can't have drift before you have a baseline.
 *
 * BATCH FIRING
 * ------------
 * fireBatch() runs all paths in parallel (Promise.all). Each photon is
 * independent, so parallelism is safe. differenceCount gives a quick summary
 * of how many paths have changed since their baselines.
 *
 * Batch firing is the intended production usage: measure a set of critical paths
 * at session start, compare against stored baselines, detect any changes.
 *
 * ERROR HANDLING
 * --------------
 * All path reading errors (file not found, git not available, command timeout)
 * return null from readPath(). A null content hash is treated as a missing/
 * different state — absence is difference. This means:
 * - A deleted file always reports 'different' (as expected)
 * - An unreachable git repo always reports 'different' (safe default)
 * - A failing test suite always reports 'different' (appropriate alarm)
 *
 * The test-suite type has a 60-second timeout enforced via execFile options.
 * Long-running suites will return null (treated as different) rather than
 * blocking the measurement indefinitely.
 *
 * HASHING
 * -------
 * SHA-256 is used throughout for content hashing. This matches the hashing
 * approach in DeterminismAnalyzer, FeedbackBridge, and DriftMonitor — consistent
 * algorithms across the observation stack make cross-module comparison possible
 * without normalization.
 *
 * @see DriftMonitor (drift-monitor.ts) — uses similar hash comparison logic
 *   for post-promotion output drift detection
 * @see DeterminismAnalyzer (determinism-analyzer.ts) — uses the same SHA-256
 *   approach for operation input hashing
 * @see core/types/photon.ts — PhotonPath, PhotonEcho, PhotonBatch schema definitions
 */

import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, relative } from 'node:path';
import { PhotonPathSchema, PhotonEchoSchema, PhotonBatchSchema } from '../../core/types/photon.js';
import type { PhotonPath, PhotonEcho, PhotonBatch } from '../../core/types/photon.js';

const execFileAsync = promisify(execFile);

/**
 * Stateless measurement instrument for filesystem and git state.
 *
 * Each instance shares no state — all state lives in PhotonPath inputs and
 * PhotonEcho outputs. Safe to use as a singleton or create per measurement.
 *
 * Usage pattern:
 *   const emitter = new PhotonEmitter();
 *   const echo = await emitter.fire({ type: 'file', target: '/path/to/file', expectedHash: null });
 *   // echo.hash is the baseline — store it
 *   // echo.signal is 'same' (always on first measurement with null expectedHash)
 *
 *   const echo2 = await emitter.fire({ type: 'file', target: '/path/to/file', expectedHash: echo.hash });
 *   // echo2.signal is 'same' if file unchanged, 'different' if modified
 */
export class PhotonEmitter {
  /**
   * Fire a single photon along a path and return its echo.
   * Each firing is independent — no instance state is modified.
   *
   * The schema validation via PhotonPathSchema/PhotonEchoSchema ensures that
   * all inputs and outputs conform to the defined photon contract. This prevents
   * silent data corruption from callers passing incorrect path objects.
   *
   * @param path - The path to measure, including the expected hash baseline
   * @returns Echo with 'same' or 'different' signal, the actual hash, and metadata
   */
  async fire(path: PhotonPath): Promise<PhotonEcho> {
    const parsed = PhotonPathSchema.parse(path);
    const content = await this.readPath(parsed.type, parsed.target);
    const hash = content !== null ? this.hash(content) : null;
    // When expectedHash is null, this is a baseline measurement — always 'same'.
    // This correctly models "no prior state to compare against."
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
   * differenceCount gives a quick summary: how many paths changed since baseline?
   *
   * Parallel execution (Promise.all) is safe because each photon is stateless.
   * No ordering constraints between measurements.
   *
   * @param batchId - Identifier for this batch measurement (for tracing)
   * @param paths - Array of paths to measure simultaneously
   * @returns Batch result with all echoes and summary statistics
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
   *
   * Each type reads a different kind of state:
   * - 'file': verbatim file content
   * - 'glob'/'tree': sorted file listing (sort ensures determinism)
   * - 'git-status': porcelain status (M = modified, ?? = untracked, empty = clean)
   * - 'git-hash': HEAD commit SHA (changes on every commit)
   * - 'test-suite': command output (includes stderr for test failures)
   *
   * All errors silently return null — the caller sees 'different' which is the
   * safest default. An unreachable resource should be treated as potentially changed.
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
          // 60-second timeout prevents indefinite blocking on slow test suites.
          // Test suites that exceed this are treated as null (different).
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
      // All errors return null — absence is difference, not silence
      return null;
    }
  }

  /**
   * SHA-256 hash of content string.
   * Consistent with hashing in DeterminismAnalyzer and FeedbackBridge.
   */
  private hash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Recursively list all files in a directory, returning relative paths.
   * Used by both 'glob' and 'tree' path types.
   *
   * Relative paths ensure hashes are stable across machine moves — the same
   * directory structure produces the same listing regardless of its absolute path.
   * Errors reading a directory silently result in empty results for that subtree.
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
      // Directory unreachable — return empty list for this subtree
    }
    return results;
  }
}
