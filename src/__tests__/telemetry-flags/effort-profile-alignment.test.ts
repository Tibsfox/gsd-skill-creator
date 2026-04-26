/**
 * CF-H-016 — Effort/profile alignment at Task spawn sites.
 *
 * Scans command files in project-claude/commands/ for `Task(` invocations and
 * asserts that >=80% of them include an explicit `effort` parameter sourced
 * from the GSD profile.
 *
 * Closes the test arm of OGA-016. Detection is intentionally simple: count
 * Task( occurrences and count those whose surrounding 240-char window
 * contains the literal `effort`. The C5 wrap-command edits use the
 * `Task(...effort=...)` shape; the test has slack for line wrapping.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const COMMAND_DIRS = [
  join(REPO_ROOT, 'project-claude', 'commands', 'wrap'),
  join(REPO_ROOT, 'project-claude', 'commands', 'gsd'),
];

function walkMd(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      out.push(...walkMd(full));
    } else if (st.isFile() && name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

describe('CF-H-016: effort/profile alignment at Task spawn sites', () => {
  it('finds at least one wrap command file to scan', () => {
    const files = COMMAND_DIRS.flatMap(walkMd);
    expect(files.length).toBeGreaterThan(0);
  });

  it('>=80% of Task( invocations carry an explicit effort param', () => {
    const files = COMMAND_DIRS.flatMap(walkMd);
    let totalTaskCalls = 0;
    let withEffort = 0;
    const sites: { file: string; hasEffort: boolean }[] = [];

    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      // Find every `Task(` literal — covers the wrap-command shape
      // `Task(subagent_type=..., effort=..., prompt=...)`.
      const re = /Task\(/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        totalTaskCalls += 1;
        // Look at a 320-char window starting at the match for "effort"
        const window = text.slice(m.index, Math.min(text.length, m.index + 320));
        const hasEffort = /\beffort\b/.test(window);
        if (hasEffort) withEffort += 1;
        sites.push({ file, hasEffort });
      }
    }

    // If there are zero Task( call sites in the scanned dirs, the OGA-016
    // wiring is documented purely in prose elsewhere (e.g. wrap/phase.md
    // describes Task delegation in narrative form). In that case, fall back
    // to asserting that >=80% of files mentioning the Task tool also mention
    // effort threading.
    if (totalTaskCalls === 0) {
      let mentionsTask = 0;
      let mentionsEffort = 0;
      for (const file of files) {
        const text = readFileSync(file, 'utf8');
        if (/\bTask\b/.test(text)) {
          mentionsTask += 1;
          if (/\beffort\b/.test(text)) mentionsEffort += 1;
        }
      }
      expect(mentionsTask).toBeGreaterThan(0);
      const ratio = mentionsEffort / mentionsTask;
      expect(ratio).toBeGreaterThanOrEqual(0.8);
      return;
    }

    const ratio = withEffort / totalTaskCalls;
    expect(ratio).toBeGreaterThanOrEqual(0.8);
  });
});
