/**
 * File hotspots renderer for the historical trends section.
 *
 * Aggregates file modification counts across all git commits and renders
 * an ordered list of the top N most frequently modified files. Shows
 * modification count as a badge and last modification date.
 *
 * Pure renderer: typed data in, HTML string out.
 *
 * @module dashboard/metrics/history/file-hotspots
 */

import type { GitCommitMetric } from '../../collectors/types.js';
import type { FileHotspot } from './types.js';
import { escapeHtml } from '../../renderer.js';

// ============================================================================
// Computation
// ============================================================================

/**
 * Compute file hotspots from raw git commit metrics.
 *
 * Builds a frequency map of file paths across all commits, tracking the
 * latest timestamp for each file. Returns the top `limit` files sorted
 * by modification count descending. Ties are broken alphabetically by
 * path for deterministic output.
 *
 * @param commits - Array of parsed git commit metrics
 * @param limit   - Maximum number of hotspots to return (default: 10)
 * @returns FileHotspot[] sorted by modificationCount descending
 */
export function computeFileHotspots(
  commits: GitCommitMetric[],
  limit: number = 10,
): FileHotspot[] {
  const fileMap = new Map<string, { count: number; latestTimestamp: string }>();

  for (const commit of commits) {
    for (const filePath of commit.files) {
      const existing = fileMap.get(filePath);

      if (existing) {
        existing.count += 1;
        // Track latest timestamp via ISO string comparison
        if (commit.timestamp > existing.latestTimestamp) {
          existing.latestTimestamp = commit.timestamp;
        }
      } else {
        fileMap.set(filePath, {
          count: 1,
          latestTimestamp: commit.timestamp,
        });
      }
    }
  }

  // Convert to array, sort by count desc then alphabetically by path
  const entries: FileHotspot[] = [];
  for (const [path, data] of fileMap.entries()) {
    entries.push({
      path,
      modificationCount: data.count,
      lastModified: data.latestTimestamp,
    });
  }

  entries.sort((a, b) => {
    if (b.modificationCount !== a.modificationCount) {
      return b.modificationCount - a.modificationCount;
    }
    return a.path.localeCompare(b.path);
  });

  return entries.slice(0, limit);
}

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render a file hotspots ordered list as HTML.
 *
 * Produces an `<ol class="hotspot-list">` with each entry showing:
 * - File path in `<code>` (monospace, HTML-escaped)
 * - Modification count as a badge
 * - Last modification date (YYYY-MM-DD portion of ISO string)
 *
 * @param hotspots - Computed file hotspots
 * @returns HTML string for the file hotspots list
 */
export function renderFileHotspots(hotspots: FileHotspot[]): string {
  if (hotspots.length === 0) {
    return '<div class="history-empty">No file hotspot data available</div>';
  }

  const items = hotspots
    .map((h) => {
      const datePortion = h.lastModified.slice(0, 10); // YYYY-MM-DD
      return `<li class="hotspot-item"><code class="hotspot-path">${escapeHtml(h.path)}</code><span class="hotspot-count">${h.modificationCount} modifications</span><span class="hotspot-recency">last: ${datePortion}</span></li>`;
    })
    .join('');

  return `<div class="history-section"><h3>File Hotspots</h3><ol class="hotspot-list">${items}</ol></div>`;
}
