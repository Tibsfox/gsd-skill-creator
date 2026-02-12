/**
 * HandoffGenerator: produces a temporary SKILL.md file encoding session
 * state for transfer to another session or user.
 *
 * The generated skill uses gray-matter frontmatter with
 * `disable-model-invocation: true` so it provides context without
 * being invoked as an executable skill.
 *
 * Size limits prevent handoff bloat (Pitfall 2 from research):
 * - Files: max 10, sensitive paths filtered
 * - Decisions: max 5
 * - Blockers: max 5
 * - Open questions: max 5
 * - Body: max 2000 characters total
 *
 * Old handoff skills (>7 days) are automatically cleaned up on generation.
 */

import { mkdir, writeFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';
import { filterSensitivePaths } from './types.js';
import type { SessionSnapshot } from './types.js';

// Size limits per research guidance (Pitfall 2: Handoff Skill Size Bloat)
const MAX_FILES = 10;
const MAX_DECISIONS = 5;
const MAX_BLOCKERS = 5;
const MAX_QUESTIONS = 5;
const MAX_BODY_CHARS = 2000;
const HANDOFF_MAX_AGE_DAYS = 7;
const HANDOFF_DIR_PREFIX = 'session-handoff-';

interface ParsedStateContext {
  decisions?: string[];
  blockers?: string[];
}

export class HandoffGenerator {
  /**
   * Generate a handoff SKILL.md file from a session snapshot and optional
   * parsed state context.
   *
   * Creates `{outputDir}/session-handoff-YYYY-MM-DD/SKILL.md` with
   * gray-matter frontmatter and size-limited body sections.
   *
   * Automatically cleans up old handoff directories (>7 days).
   *
   * @param snapshot - Session snapshot with summary, skills, files, questions
   * @param stateContext - Optional parsed STATE.md context with decisions/blockers
   * @param outputDir - Directory to create the handoff skill directory in
   * @returns Path to generated SKILL.md and its full content string
   */
  async generate(
    snapshot: SessionSnapshot,
    stateContext: ParsedStateContext | null,
    outputDir: string,
  ): Promise<{ path: string; content: string }> {
    const dateStr = new Date().toISOString().split('T')[0];
    const skillName = `${HANDOFF_DIR_PREFIX}${dateStr}`;

    // Build frontmatter metadata
    const metadata = {
      name: skillName,
      description: `Resume session context from ${dateStr}. Contains decisions, recent files, and active skills.`,
      'disable-model-invocation': true,
    };

    // Build body with size limits
    const body = this.buildBody(snapshot, stateContext);

    // Serialize with gray-matter
    const content = matter.stringify(body, metadata);

    // Write to filesystem
    const skillDir = join(outputDir, skillName);
    await mkdir(skillDir, { recursive: true });
    const skillPath = join(skillDir, 'SKILL.md');
    await writeFile(skillPath, content, 'utf-8');

    // Clean up old handoffs
    await this.cleanupOldHandoffs(outputDir);

    return { path: skillPath, content };
  }

  /**
   * Remove handoff skill directories older than 7 days.
   *
   * Scans outputDir for directories matching `session-handoff-YYYY-MM-DD`,
   * parses the date suffix, and removes entries older than HANDOFF_MAX_AGE_DAYS.
   *
   * Silently ignores directories that cannot be read or removed.
   */
  async cleanupOldHandoffs(outputDir: string): Promise<void> {
    let entries: string[];
    try {
      entries = await readdir(outputDir);
    } catch {
      return; // Directory doesn't exist or not readable
    }

    const now = Date.now();
    const maxAge = HANDOFF_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    for (const entry of entries) {
      if (!entry.startsWith(HANDOFF_DIR_PREFIX)) continue;

      const dateStr = entry.slice(HANDOFF_DIR_PREFIX.length);
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) continue;

      if (now - date.getTime() > maxAge) {
        try {
          await rm(join(outputDir, entry), { recursive: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Build the markdown body string from snapshot and state data.
   *
   * Sections are included only when they have data.
   * Lists are capped at their respective maximums.
   * Total body is truncated to MAX_BODY_CHARS if needed.
   */
  private buildBody(
    snapshot: SessionSnapshot,
    state: ParsedStateContext | null,
  ): string {
    const sections: string[] = [];

    // Session State section (always present)
    sections.push('## Session State');
    sections.push(snapshot.summary.slice(0, 200));
    sections.push('');

    // Decisions (capped)
    const decisions = (state?.decisions ?? []).slice(0, MAX_DECISIONS);
    if (decisions.length > 0) {
      sections.push('## Decisions');
      decisions.forEach(d => sections.push(`- ${d}`));
      sections.push('');
    }

    // Blockers (capped)
    const blockers = (state?.blockers ?? []).slice(0, MAX_BLOCKERS);
    if (blockers.length > 0) {
      sections.push('## Blockers');
      blockers.forEach(b => sections.push(`- ${b}`));
      sections.push('');
    }

    // Active Skills
    if (snapshot.active_skills.length > 0) {
      sections.push('## Active Skills');
      snapshot.active_skills.forEach(s => sections.push(`- ${s}`));
      sections.push('');
    }

    // Recent Files (filtered for sensitive paths, capped)
    const safeFiles = filterSensitivePaths(snapshot.files_modified).slice(0, MAX_FILES);
    if (safeFiles.length > 0) {
      sections.push('## Recent Files');
      safeFiles.forEach(f => sections.push(`- ${f}`));
      sections.push('');
    }

    // Open Questions (capped)
    const questions = snapshot.open_questions.slice(0, MAX_QUESTIONS);
    if (questions.length > 0) {
      sections.push('## Open Questions');
      questions.forEach(q => sections.push(`- ${q}`));
      sections.push('');
    }

    // Truncate body if over limit
    let body = sections.join('\n');
    if (body.length > MAX_BODY_CHARS) {
      body = body.slice(0, MAX_BODY_CHARS - 3) + '...';
    }

    return body;
  }
}
