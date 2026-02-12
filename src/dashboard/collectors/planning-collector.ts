/**
 * Planning metrics collector.
 *
 * Scans phase directories for PLAN.md/SUMMARY.md pairs and computes
 * structural diffs using the existing {@link diffPlanVsSummary} function
 * from the monitoring module. Returns typed {@link PlanningCollectorResult}.
 *
 * Fault-tolerant: returns empty result on failures, never throws.
 *
 * @module dashboard/collectors/planning-collector
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { diffPlanVsSummary } from '../../integration/monitoring/plan-summary-differ.js';
import type { PlanningCollectorResult, PlanningCollectorOptions } from './types.js';
import type { PlanSummaryDiff } from '../../integration/monitoring/types.js';

/** Regex to match PLAN.md filenames and extract the prefix. */
const PLAN_FILE_RE = /^(\d+-\d+)-PLAN\.md$/;

/**
 * Scan a single phase subdirectory for PLAN/SUMMARY pairs.
 *
 * Returns plan file info with whether a matching summary exists.
 */
async function scanPhaseDir(
  dirPath: string,
): Promise<Array<{ prefix: string; planPath: string; summaryPath: string | null }>> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const fileNames = entries.filter((e) => e.isFile()).map((e) => e.name);
  const fileSet = new Set(fileNames);

  const pairs: Array<{ prefix: string; planPath: string; summaryPath: string | null }> = [];

  for (const name of fileNames) {
    const match = name.match(PLAN_FILE_RE);
    if (!match) continue;

    const prefix = match[1];
    const summaryName = `${prefix}-SUMMARY.md`;
    const hasSummary = fileSet.has(summaryName);

    pairs.push({
      prefix,
      planPath: join(dirPath, name),
      summaryPath: hasSummary ? join(dirPath, summaryName) : null,
    });
  }

  return pairs;
}

/**
 * Collect planning metrics from all phase directories.
 *
 * Scans the phases directory for subdirectories, finds PLAN.md files,
 * checks for matching SUMMARY.md files, and computes structural diffs
 * for each pair using the existing diffPlanVsSummary function.
 *
 * Fault-tolerant: returns empty result on any failure instead of throwing.
 *
 * @param options - Collector options (phasesDir, cwd)
 * @returns Planning metrics with diffs, plan counts, and summary counts
 */
export async function collectPlanningMetrics(
  options: PlanningCollectorOptions = {},
): Promise<PlanningCollectorResult> {
  const { phasesDir = '.planning/phases' } = options;

  try {
    // Read top-level phase subdirectories
    const topEntries = await readdir(phasesDir, { withFileTypes: true });
    const subdirs = topEntries.filter((e) => e.isDirectory());

    let totalPlans = 0;
    let totalWithSummary = 0;
    const diffs: PlanSummaryDiff[] = [];

    for (const subdir of subdirs) {
      const subdirPath = join(phasesDir, subdir.name);

      try {
        const pairs = await scanPhaseDir(subdirPath);
        totalPlans += pairs.length;

        for (const pair of pairs) {
          if (!pair.summaryPath) continue;
          totalWithSummary++;

          try {
            const [planContent, summaryContent] = await Promise.all([
              readFile(pair.planPath, 'utf-8'),
              readFile(pair.summaryPath, 'utf-8'),
            ]);

            const diff = diffPlanVsSummary(planContent, summaryContent);
            diffs.push(diff);
          } catch {
            // Skip individual pair read errors
          }
        }
      } catch {
        // Skip subdirectory read errors
      }
    }

    return { diffs, totalPlans, totalWithSummary };
  } catch {
    // ENOENT on phases dir or other top-level error
    return { diffs: [], totalPlans: 0, totalWithSummary: 0 };
  }
}
