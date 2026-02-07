/**
 * CLI command for the pattern discovery pipeline.
 *
 * Orchestrates the full scan -> extract -> filter -> rank -> select -> draft
 * pipeline from Phases 30-33 into a single callable function with progress
 * output, flag handling, and interactive candidate selection.
 *
 * Pipeline stages:
 * 1. Scan corpus with progress spinner
 * 2. Filter framework noise from aggregated patterns
 * 3. Load existing skills for deduplication
 * 4. Rank and score candidates
 * 5. Interactive multiselect for candidate selection
 * 6. Generate and write skill drafts to disk
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import {
  CorpusScanner,
  PatternAggregator,
  createPatternSessionProcessor,
  rankCandidates,
  selectCandidates,
  generateSkillDraft,
  formatCandidateTable,
} from '../../discovery/index.js';
import type {
  SessionProcessor,
  SessionInfo,
  ParsedEntry,
  ExistingSkill,
} from '../../discovery/index.js';
import { SkillStore } from '../../storage/skill-store.js';
import { getSkillsBasePath } from '../../types/scope.js';

// ============================================================================
// Flag parsing
// ============================================================================

/**
 * Parse a flag value from args in --key=value format.
 */
function parseFlag(args: string[], flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

// ============================================================================
// Help
// ============================================================================

/**
 * Show help text for the discover command.
 */
function showDiscoverHelp(): void {
  console.log(`
skill-creator discover - Discover skill candidates from session history

Usage:
  skill-creator discover              Scan and present candidates
  skill-creator discover --rescan     Force full rescan
  skill-creator discover --exclude=project1,project2  Skip projects

Options:
  --exclude=<projects>  Comma-separated project slugs to skip
  --rescan              Force full rescan, ignore watermarks
  --help, -h            Show this help

Examples:
  skill-creator discover
  skill-creator disc --rescan
  skill-creator discover --exclude=node_modules,temp
`);
}

// ============================================================================
// discoverCommand
// ============================================================================

/**
 * CLI command for pattern discovery pipeline.
 *
 * Orchestrates the full pipeline: scan with progress -> filter noise ->
 * rank with dedup -> interactive select -> generate drafts -> write to disk.
 *
 * @param args - Command-line arguments (after 'discover')
 * @returns Exit code (0 for success, 1 for error)
 */
export async function discoverCommand(args: string[]): Promise<number> {
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showDiscoverHelp();
    return 0;
  }

  try {
    // Parse flags
    const excludeArg = parseFlag(args, 'exclude');
    const excludeProjects = excludeArg ? excludeArg.split(',') : [];
    const forceRescan = args.includes('--rescan');

    p.intro(pc.bgCyan(pc.black(' Skill Discovery ')));

    // -----------------------------------------------------------------------
    // 1. Setup: aggregator + base session processor
    // -----------------------------------------------------------------------
    const aggregator = new PatternAggregator();
    const baseProcessor = createPatternSessionProcessor(aggregator);

    // -----------------------------------------------------------------------
    // 2. Progress wrapper: tracks session count and timestamps
    // -----------------------------------------------------------------------
    let processedCount = 0;
    const sessionTimestamps = new Map<string, number>();

    const spin = p.spinner();
    spin.start('Scanning sessions...');

    const progressProcessor: SessionProcessor = async (
      session: SessionInfo,
      entries: AsyncGenerator<ParsedEntry>,
    ): Promise<void> => {
      // Record timestamp for recency scoring
      sessionTimestamps.set(session.sessionId, session.fileMtime);

      // Delegate to pattern extraction processor
      await baseProcessor(session, entries);

      // Update progress
      processedCount++;
      spin.message(`Scanning: ${processedCount} sessions processed`);
    };

    // -----------------------------------------------------------------------
    // 3. Scan corpus
    // -----------------------------------------------------------------------
    const scanner = new CorpusScanner({
      excludeProjects,
      forceRescan,
    });
    const scanResult = await scanner.scan(progressProcessor);
    spin.stop(`Scanned ${scanResult.totalSessions} sessions across ${scanResult.totalProjects} projects`);

    // -----------------------------------------------------------------------
    // 4. Filter framework noise
    // -----------------------------------------------------------------------
    aggregator.filterNoise(aggregator.getTotalProjectsTracked());
    const patterns = aggregator.getResults();

    // -----------------------------------------------------------------------
    // 5. Early exit if no patterns
    // -----------------------------------------------------------------------
    if (patterns.size === 0) {
      p.log.info('No patterns found after noise filtering.');
      p.outro('Nothing to discover.');
      return 0;
    }

    // -----------------------------------------------------------------------
    // 6. Load existing skills for deduplication
    // -----------------------------------------------------------------------
    const existingSkills: ExistingSkill[] = [];
    for (const scope of ['user', 'project'] as const) {
      const store = new SkillStore(getSkillsBasePath(scope));
      const names = await store.list();
      for (const name of names) {
        try {
          const skill = await store.read(name);
          existingSkills.push({ name, description: String(skill.metadata.description ?? '') });
        } catch { /* skip unreadable */ }
      }
    }

    // -----------------------------------------------------------------------
    // 7. Rank candidates
    // -----------------------------------------------------------------------
    const totalProjects = aggregator.getTotalProjectsTracked();
    const totalSessions = scanResult.totalSessions;

    const candidates = rankCandidates(
      patterns,
      totalProjects,
      totalSessions,
      sessionTimestamps,
      { existingSkills },
    );

    // -----------------------------------------------------------------------
    // 8. Early exit if no candidates
    // -----------------------------------------------------------------------
    if (candidates.length === 0) {
      p.log.info('No skill candidates found after ranking and deduplication.');
      p.outro('Nothing to discover.');
      return 0;
    }

    // -----------------------------------------------------------------------
    // 9. Display summary and select candidates
    // -----------------------------------------------------------------------
    p.log.info(
      `Scan summary: ${pc.bold(String(totalProjects))} projects, ` +
      `${pc.bold(String(processedCount))} sessions processed, ` +
      `${pc.bold(String(patterns.size))} patterns found, ` +
      `${pc.bold(String(candidates.length))} candidates ranked`,
    );

    const selected = await selectCandidates(candidates);

    // -----------------------------------------------------------------------
    // 10. Early exit if nothing selected
    // -----------------------------------------------------------------------
    if (selected.length === 0) {
      p.log.info('No candidates selected.');
      p.outro('Discovery complete.');
      return 0;
    }

    // -----------------------------------------------------------------------
    // 11. Generate and write skill drafts
    // -----------------------------------------------------------------------
    for (const candidate of selected) {
      const draft = generateSkillDraft(candidate);
      const skillDir = join(homedir(), '.claude', 'skills', draft.name);
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(skillDir, 'SKILL.md'), draft.content, 'utf-8');
      p.log.success(`Created skill: ${pc.green(draft.name)}`);
    }

    // -----------------------------------------------------------------------
    // 12. Summary outro
    // -----------------------------------------------------------------------
    p.outro(`Generated ${selected.length} skill draft(s). Review and customize in ~/.claude/skills/`);

    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    p.log.error(`Discovery failed: ${message}`);
    return 1;
  }
}
