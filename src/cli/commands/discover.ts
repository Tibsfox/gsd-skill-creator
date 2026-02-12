/**
 * CLI command for the pattern discovery pipeline.
 *
 * Orchestrates the full scan -> extract -> filter -> cluster -> rank -> select
 * -> draft pipeline from Phases 30-35 into a single callable function with
 * progress output, flag handling, and interactive candidate selection.
 *
 * Pipeline stages:
 * 1. Scan corpus with progress spinner (tool patterns + prompt collection)
 * 2. Load existing skills for deduplication
 * 3. Filter framework noise from aggregated patterns
 * 4. Cluster user prompts via semantic embedding + DBSCAN
 * 5. Rank and score both tool pattern and cluster candidates
 * 6. Interactive multiselect for tool pattern candidates
 * 7. Interactive multiselect for prompt-based cluster candidates
 * 8. Generate and write skill drafts (workflow templates + activation templates)
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import {
  CorpusScanner,
  PatternAggregator,
  createPromptCollectingProcessor,
  rankCandidates,
  selectCandidates,
  generateSkillDraft,
  formatCandidateTable,
  PromptEmbeddingCache,
  clusterPrompts,
  rankClusterCandidates,
  generateClusterDraft,
} from '../../discovery/index.js';
import type {
  SessionProcessor,
  SessionInfo,
  ParsedEntry,
  ExistingSkill,
  ClusterCandidate,
  PromptCollectorResult,
} from '../../discovery/index.js';
import { EmbeddingService } from '../../embeddings/embedding-service.js';
import { SkillStore } from '../../storage/skill-store.js';
import { getSkillsBasePath } from '../../types/scope.js';
import { checkGsdInstalled } from '../../detection/gsd-reference-injector.js';

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
  skill-creator discover --allow=project1,project2    Only scan these projects
  skill-creator discover --dry-run    Show what would be scanned without reading content

Options:
  --exclude=<projects>  Comma-separated project slugs to skip
  --allow=<projects>    Comma-separated project slugs to scan (allowlist)
  --rescan              Force full rescan, ignore watermarks
  --dry-run             Enumerate sessions and show stats without processing
  --help, -h            Show this help

Examples:
  skill-creator discover
  skill-creator disc --rescan
  skill-creator discover --exclude=node_modules,temp
  skill-creator discover --allow=my-project,other-project
  skill-creator discover --dry-run
`);
}

// ============================================================================
// discoverCommand
// ============================================================================

/**
 * CLI command for pattern discovery pipeline.
 *
 * Orchestrates the full pipeline: scan with progress -> load skills ->
 * filter noise -> cluster prompts -> rank both -> interactive select both ->
 * generate drafts -> write to disk.
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
    const allowArg = parseFlag(args, 'allow');
    const allowProjects = allowArg ? allowArg.split(',') : undefined;
    const forceRescan = args.includes('--rescan');
    const dryRun = args.includes('--dry-run');

    p.intro(pc.bgCyan(pc.black(' Skill Discovery ')));

    // -----------------------------------------------------------------------
    // 1. Setup: aggregator + prompt-collecting session processor
    // -----------------------------------------------------------------------
    const aggregator = new PatternAggregator();
    const promptStore: PromptCollectorResult = { prompts: new Map() };
    const collectingProcessor = createPromptCollectingProcessor(aggregator, promptStore);

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

      // Delegate to prompt-collecting pattern extraction processor
      await collectingProcessor(session, entries);

      // Update progress
      processedCount++;
      spin.message(`Scanning: ${processedCount} sessions processed`);
    };

    // -----------------------------------------------------------------------
    // 3. Scan corpus
    // -----------------------------------------------------------------------
    const scanner = new CorpusScanner({
      excludeProjects,
      allowProjects,
      forceRescan,
      dryRun,
    });
    const scanResult = await scanner.scan(progressProcessor);

    const scanSummaryPrefix = dryRun ? '[DRY RUN] ' : '';
    spin.stop(`${scanSummaryPrefix}Scanned ${scanResult.totalSessions} sessions across ${scanResult.totalProjects} projects`);

    // In dry-run mode: show stats and exit without processing candidates
    if (dryRun) {
      p.log.info(
        `${scanSummaryPrefix}Would process: ` +
        `${pc.bold(String(scanResult.newSessions))} new, ` +
        `${pc.bold(String(scanResult.modifiedSessions))} modified, ` +
        `${pc.bold(String(scanResult.skippedSessions))} skipped, ` +
        `${pc.bold(String(scanResult.excludedSessions))} excluded`,
      );
      p.outro(`${scanSummaryPrefix}Discovery complete (no content was read).`);
      return 0;
    }

    // -----------------------------------------------------------------------
    // 4. Load existing skills for deduplication (before both pipelines)
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
    // 5. Filter framework noise
    // -----------------------------------------------------------------------
    aggregator.filterNoise(aggregator.getTotalProjectsTracked());
    const patterns = aggregator.getResults();

    // -----------------------------------------------------------------------
    // 5b. Cluster user prompts (if any collected)
    // -----------------------------------------------------------------------
    let clusterCandidates: ClusterCandidate[] = [];
    const totalCollectedPrompts = Array.from(promptStore.prompts.values())
      .reduce((sum, arr) => sum + arr.length, 0);

    if (totalCollectedPrompts > 0) {
      spin.start('Clustering user prompts...');
      try {
        const embeddingService = EmbeddingService.getInstance();
        const promptCache = new PromptEmbeddingCache('bge-small-en-v1.5-v1');
        await promptCache.load();

        const clusterResult = await clusterPrompts(
          promptStore.prompts,
          embeddingService,
          promptCache,
        );

        if (clusterResult.clusters.length > 0) {
          clusterCandidates = rankClusterCandidates(
            clusterResult.clusters,
            totalCollectedPrompts,
            aggregator.getTotalProjectsTracked(),
            existingSkills,
          );
          spin.stop(`Found ${clusterResult.clusters.length} prompt clusters (${clusterCandidates.length} after dedup)`);
        } else {
          spin.stop('No prompt clusters found');
        }

        if (clusterResult.skippedProjects.length > 0) {
          p.log.info(pc.dim(`Skipped ${clusterResult.skippedProjects.length} project(s) with < 10 prompts`));
        }
      } catch {
        // Clustering is supplementary -- don't fail the whole command
        spin.stop('Prompt clustering skipped (embedding unavailable)');
      }
    }

    // -----------------------------------------------------------------------
    // 6. Early exit if no patterns and no clusters
    // -----------------------------------------------------------------------
    if (patterns.size === 0 && clusterCandidates.length === 0) {
      p.log.info('No patterns found after noise filtering.');
      p.outro('Nothing to discover.');
      return 0;
    }

    // -----------------------------------------------------------------------
    // 7. Rank tool pattern candidates
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
    // 8. Early exit if no candidates of either type
    // -----------------------------------------------------------------------
    if (candidates.length === 0 && clusterCandidates.length === 0) {
      p.log.info('No skill candidates found after ranking and deduplication.');
      p.outro('Nothing to discover.');
      return 0;
    }

    // -----------------------------------------------------------------------
    // 9. Display summary and select tool pattern candidates
    // -----------------------------------------------------------------------
    p.log.info(
      `Scan summary: ${pc.bold(String(totalProjects))} projects, ` +
      `${pc.bold(String(processedCount))} sessions processed, ` +
      `${pc.bold(String(patterns.size))} patterns found, ` +
      `${pc.bold(String(candidates.length))} candidates ranked` +
      (clusterCandidates.length > 0
        ? `, ${pc.bold(String(clusterCandidates.length))} prompt clusters`
        : ''),
    );

    const selected = await selectCandidates(candidates);

    // -----------------------------------------------------------------------
    // 9b. Display and select prompt-based cluster candidates
    // -----------------------------------------------------------------------
    let selectedClusters: ClusterCandidate[] = [];
    if (clusterCandidates.length > 0) {
      p.log.message('');
      p.log.message(pc.bold('Prompt-based Candidates:'));
      const clusterTableLines = clusterCandidates.map((c, i) => {
        const idx = pc.dim(String(i + 1).padStart(2));
        const score = pc.cyan(c.score.toFixed(3).padStart(6));
        const type = pc.dim('cluster'.padEnd(8));
        const label = c.label.slice(0, 50).padEnd(50);
        const projects = pc.dim(`${c.evidence.projects.length}p`);
        const size = pc.dim(`${c.clusterSize}m`);
        return `  ${idx}  ${score}  ${type}  ${label}  ${projects}  ${size}`;
      });
      p.log.message(clusterTableLines.join('\n'));
      p.log.message('');

      const clusterSelected = await p.multiselect({
        message: 'Select prompt-based patterns to generate skills from (space to toggle):',
        options: clusterCandidates.map((c, i) => ({
          value: i,
          label: c.label.slice(0, 60),
          hint: `score: ${c.score.toFixed(3)} | ${c.evidence.projects.length} projects | ${c.clusterSize} prompts`,
        })),
        required: false,
      });

      if (!p.isCancel(clusterSelected)) {
        selectedClusters = (clusterSelected as number[]).map(i => clusterCandidates[i]);
      }
    }

    // -----------------------------------------------------------------------
    // 10. Early exit if nothing selected from either pipeline
    // -----------------------------------------------------------------------
    if (selected.length === 0 && selectedClusters.length === 0) {
      p.log.info('No candidates selected.');
      p.outro('Discovery complete.');
      return 0;
    }

    // -----------------------------------------------------------------------
    // 11. Generate and write tool pattern skill drafts
    // -----------------------------------------------------------------------
    const gsdInstalled = await checkGsdInstalled();
    for (const candidate of selected) {
      const draft = generateSkillDraft(candidate, gsdInstalled);
      const skillDir = join(homedir(), '.claude', 'skills', draft.name);
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(skillDir, 'SKILL.md'), draft.content, 'utf-8');
      p.log.success(`Created skill: ${pc.green(draft.name)}`);
    }

    // -----------------------------------------------------------------------
    // 11b. Generate and write cluster-based skill drafts
    // -----------------------------------------------------------------------
    for (const candidate of selectedClusters) {
      const draft = generateClusterDraft(candidate);
      const skillDir = join(homedir(), '.claude', 'skills', draft.name);
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(skillDir, 'SKILL.md'), draft.content, 'utf-8');
      p.log.success(`Created skill: ${pc.green(draft.name)} ${pc.dim('(from prompt cluster)')}`);
    }

    // -----------------------------------------------------------------------
    // 12. Summary outro
    // -----------------------------------------------------------------------
    const totalGenerated = selected.length + selectedClusters.length;
    p.outro(`Generated ${totalGenerated} skill draft(s). Review and customize in ~/.claude/skills/`);

    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    p.log.error(`Discovery failed: ${message}`);
    return 1;
  }
}
