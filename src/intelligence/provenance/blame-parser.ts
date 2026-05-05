/**
 * `git blame --porcelain` parser — pure-function (v1.49.607 W1 Track B).
 *
 * The porcelain format (per `git-blame(1)`):
 *
 *   For each blamed line, an initial header line:
 *     <40-hex SHA> <orig-line-no> <final-line-no> [<group-size>]
 *   Followed by zero or more metadata lines (author, author-mail,
 *   author-time, summary, filename, …).
 *   Followed by exactly one content line prefixed with a TAB.
 *
 *   When the same commit appears as the source of multiple consecutive
 *   lines, only the first occurrence carries the full metadata block;
 *   subsequent lines emit a "shorthand" header (just the SHA + line
 *   numbers) followed by the content line.
 *
 * The `filename` metadata line is the file-as-of-the-source-commit; with
 * `-CCC` (cross-file copy detection) this can differ from the blamed
 * file when content was moved/copied from another file.
 *
 * This parser is intentionally I/O-free so it can be unit-tested against
 * canned fixtures and never needs a real git invocation.
 */

import type { BlameLine } from './types.js';

const HEX40 = /^[0-9a-f]{40}$/;

/**
 * Parse `git blame --porcelain` (or `--line-porcelain`) stdout.
 * Returns one `BlameLine` per blamed final-file line, in order.
 *
 * The parser is forgiving: malformed metadata lines are skipped; only
 * the header + filename + content sequence is required for correctness.
 */
export function parseBlamePorcelain(stdout: string): BlameLine[] {
  if (!stdout) return [];

  // Strip a leading UTF-8 BOM if present (some shells emit one).
  let text = stdout;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  // Split on \n; keep \r out of any captured field. We intentionally do
  // NOT split on \r\n — porcelain output is LF on every platform git
  // supports, but the captured *content* line CAN contain a CR which
  // we preserve as-is (the test suite covers this).
  const lines = text.split('\n');

  const out: BlameLine[] = [];

  // Tracks per-commit metadata so the shorthand header path can fall
  // back to the most-recent filename for that commit. The porcelain
  // format guarantees the full block on the first appearance of each SHA.
  const commitFilename = new Map<string, string>();

  let pendingSha: string | null = null;
  let pendingOrigLine = 0;
  let pendingFinalLine = 0;
  let pendingFilename: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // The content line is the only one prefixed with a TAB.
    if (line.startsWith('\t')) {
      if (pendingSha !== null) {
        const fname =
          pendingFilename ?? commitFilename.get(pendingSha) ?? '';
        out.push({
          line_no: pendingFinalLine,
          commit_sha: pendingSha,
          original_line_no: pendingOrigLine,
          original_file_path: fname,
        });
        // Cache filename for shorthand reuse.
        if (pendingFilename !== null) {
          commitFilename.set(pendingSha, pendingFilename);
        }
      }
      pendingSha = null;
      pendingFilename = null;
      continue;
    }

    // Metadata line — parse only the keys we care about.
    if (line.startsWith('filename ')) {
      pendingFilename = line.slice('filename '.length);
      continue;
    }
    // Skip every other metadata key (author, author-mail, summary, …)
    if (
      line.startsWith('author ') ||
      line.startsWith('author-mail') ||
      line.startsWith('author-time') ||
      line.startsWith('author-tz') ||
      line.startsWith('committer ') ||
      line.startsWith('committer-mail') ||
      line.startsWith('committer-time') ||
      line.startsWith('committer-tz') ||
      line.startsWith('summary ') ||
      line.startsWith('previous ') ||
      line === 'boundary'
    ) {
      continue;
    }

    // Otherwise it must be a header. Header shapes:
    //   <sha> <orig> <final>
    //   <sha> <orig> <final> <group-size>
    const parts = line.split(' ');
    if (parts.length < 3 || !HEX40.test(parts[0])) {
      // Not a header we recognize — skip.
      continue;
    }
    const orig = parseInt(parts[1], 10);
    const final = parseInt(parts[2], 10);
    if (!Number.isFinite(orig) || !Number.isFinite(final)) continue;

    pendingSha = parts[0];
    pendingOrigLine = orig;
    pendingFinalLine = final;
    pendingFilename = null;
  }

  return out;
}
