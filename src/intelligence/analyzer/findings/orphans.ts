/**
 * C03 — Orphan draft detection (T7).
 *
 * Reads .planning/staging/inbox/ directory.
 * For each *.meta.json where provenance.developer_approved_at > 14 days ago
 * AND bundle_id is null → orphan_draft finding.
 *
 * Respects .gsdkeep: if present in the vision doc's directory, the doc is excluded.
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { IntelligenceKB } from '../../types.js';
import type { RawFinding } from './aggregator.js';

const ORPHAN_THRESHOLD_DAYS = 14;

export async function detectOrphanDrafts(
  stagingInboxPath: string,
  kb: IntelligenceKB,
  projectId: string,
  snapshotId: string,
): Promise<RawFinding[]> {
  const findings: RawFinding[] = [];

  if (!existsSync(stagingInboxPath)) {
    return findings; // non-existent path → empty (never crash)
  }

  let entries: string[];
  try {
    entries = await readdir(stagingInboxPath);
  } catch {
    return findings;
  }

  const cutoffTime = Date.now() - ORPHAN_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

  for (const entry of entries) {
    const entryPath = join(stagingInboxPath, entry);

    // Try to read a meta.json directly or descend into sub-directories
    await scanForMeta(entryPath, entryPath, cutoffTime, snapshotId, findings);
  }

  return findings;
}

async function scanForMeta(
  entryPath: string,
  basePath: string,
  cutoffTime: number,
  snapshotId: string,
  findings: RawFinding[],
): Promise<void> {
  try {
    const subEntries = await readdir(entryPath);

    // Check for .gsdkeep in this directory
    if (subEntries.includes('.gsdkeep')) {
      return; // developer marked intentionally pending — skip
    }

    for (const sub of subEntries) {
      if (!sub.endsWith('.meta.json')) continue;

      const metaPath = join(entryPath, sub);
      try {
        const content = await readFile(metaPath, 'utf-8');
        const meta = JSON.parse(content) as {
          request_id?: string;
          kind?: string;
          provenance?: { developer_approved_at?: string };
          bundle_id?: string | null;
        };

        const approvedAt = meta.provenance?.developer_approved_at;
        if (!approvedAt) continue;

        const approvedTime = new Date(approvedAt).getTime();
        if (approvedTime >= cutoffTime) continue; // not old enough

        // If bundle_id is set, the draft was bundled — not an orphan
        if (meta.bundle_id != null) continue;

        const ageDays = Math.floor((Date.now() - approvedTime) / (24 * 60 * 60 * 1000));
        findings.push({
          kind: 'orphan_draft',
          severity: 'med',
          confidence: 1.0,
          title: `Orphan draft: ${sub.replace('.meta.json', '')} (${ageDays} days old)`,
          rationale: `Vision seed meta at ${metaPath} was developer-approved ${ageDays} days ago but has never been linked to a bundle (bundle_id: null). Threshold: ${ORPHAN_THRESHOLD_DAYS} days. Snapshot ${snapshotId}.`,
          source_path: metaPath,
        });
      } catch {
        // Malformed meta — skip
      }
    }
  } catch {
    // Not a directory or unreadable — skip
  }
}
