/**
 * C01 — AnalyzerCore: language-agnostic dispatch loop.
 *
 * Responsibilities:
 *  1. Walk files via walkProject (respects .gitignore etc.)
 *  2. Detect language per file (detectLanguage)
 *  3. Skip binaries (isBinary)
 *  4. Dispatch to matching LanguageAnalyzer
 *  5. Wrap all writes in an atomic snapshot (beginSnapshot / commitSnapshot / rollbackSnapshot)
 *  6. Parse failures → parse_failed finding, never thrown (D-22-07)
 *  7. Progress callback every 100 files (D-22-06)
 */

import { readFile } from 'node:fs/promises';
import { nanoid } from 'nanoid';
import type {
  AnalyzerKB,
  AnalyzerMetrics,
  AnalyzerOutput,
  LanguageAnalyzer,
  ScanOptions,
  ScanResult,
} from './types.js';
import { walkProject } from './walk.js';
import { isBinary } from './walk.js';
import { detectLanguage } from './detect.js';
import { createPool } from './pool.js';
import { gitMetadata } from './git.js';

// ─── AnalyzerCore ─────────────────────────────────────────

export class AnalyzerCore {
  private readonly kb: AnalyzerKB;
  private readonly analyzers: Map<string, LanguageAnalyzer>;

  constructor(deps: { kb: AnalyzerKB; languageAnalyzers: LanguageAnalyzer[] }) {
    this.kb = deps.kb;
    this.analyzers = new Map(deps.languageAnalyzers.map(a => [a.language, a]));
  }

  /**
   * Run a full project scan.
   *
   * Atomic: all findings land under a single snapshotId.
   * On any unhandled error → rollbackSnapshot, re-throw.
   */
  async scan(opts: ScanOptions): Promise<ScanResult> {
    const start = Date.now();
    const snapshotId = `${opts.projectId}+${nanoid(8)}`;

    await this.kb.beginSnapshot(snapshotId, opts.projectId);

    let done = 0;
    let skipped = 0;
    let failed = 0;
    let findingsTotal = 0;

    try {
      // Walk the project
      const files = await walkProject(opts.projectPath, {
        excludePatterns: opts.excludePatterns,
        includePatterns: opts.includePatterns,
      });
      const total = files.length;

      const pool = createPool(opts.parallelism ?? 4);

      // filesProcessed counts every file that exits the per-file handler (for progress reporting)
      let filesProcessed = 0;

      await pool.runAllSettled(
        files.map(filePath => async () => {

          // Binary check
          let isBin = false;
          try {
            isBin = await isBinary(filePath);
          } catch {
            skipped++;
            filesProcessed++;
          if (filesProcessed % 100 === 0) opts.reportProgress?.(filesProcessed, total);
            return;
          }

          if (isBin) {
            skipped++;
            filesProcessed++;
          if (filesProcessed % 100 === 0) opts.reportProgress?.(filesProcessed, total);
            return;
          }

          // Language detection
          let source = '';
          try {
            source = await readFile(filePath, 'utf-8');
          } catch {
            skipped++;
            filesProcessed++;
          if (filesProcessed % 100 === 0) opts.reportProgress?.(filesProcessed, total);
            return;
          }

          const lang = detectLanguage(filePath, source);
          if (!lang) {
            skipped++;
            filesProcessed++;
          if (filesProcessed % 100 === 0) opts.reportProgress?.(filesProcessed, total);
            return;
          }

          const analyzer = this.analyzers.get(lang);
          if (!analyzer) {
            skipped++;
            filesProcessed++;
          if (filesProcessed % 100 === 0) opts.reportProgress?.(filesProcessed, total);
            return;
          }

          // Fetch git metadata (best-effort)
          const gitMd = await gitMetadata(filePath, opts.projectPath).catch(() => null);

          // Dispatch to language analyzer — per-file try/catch (D-22-07)
          let output: AnalyzerOutput;
          try {
            output = await analyzer.analyze({
              filePath,
              language: lang,
              source,
              gitMetadata: gitMd ?? undefined,
            });
            done++; // counts all dispatched files (including parse failures)
            if (output.parseStatus === 'failed') {
              failed++;
            }
          } catch (err) {
            done++; // still counts as dispatched/scanned
            failed++;
            output = {
              filePath,
              parseStatus: 'failed',
              parseError: String(err),
              findings: [
                {
                  kind: 'parse_failed',
                  severity: 'low',
                  confidence: 1.0,
                  title: 'Analyzer crashed',
                  rationale: `Analyzer for ${lang} threw: ${String(err)}`,
                },
              ],
              metrics: emptyMetrics(),
            };
          }

          await this.kb.writeFindings(snapshotId, opts.projectId, output);
          findingsTotal += output.findings.length;

          filesProcessed++;
          if (filesProcessed % 100 === 0) opts.reportProgress?.(filesProcessed, total);
        }),
      );

      await this.kb.commitSnapshot(snapshotId);
    } catch (err) {
      await this.kb.rollbackSnapshot(snapshotId);
      throw err;
    }

    return {
      snapshotId,
      filesScanned: done,
      filesSkipped: skipped,
      filesFailed: failed,
      findingsTotal,
      durationMs: Date.now() - start,
    };
  }
}

function emptyMetrics(): AnalyzerMetrics {
  return {
    loc: 0,
    functions: 0,
    exports: 0,
    cyclomatic_complexity_mean: 0,
    cyclomatic_complexity_max: 0,
  };
}
