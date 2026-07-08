// === sc:learn CLI Command ===
//
// Top-level orchestrator for the knowledge ingestion pipeline. Ties together
// all pipeline stages (acquire -> sanitize -> HITL -> analyze -> extract ->
// wire deps -> dedup -> merge -> generate -> report) into a single user-facing
// command with options and progress output.
//
// Requirements: LEARN-10 (pipeline orchestration), LEARN-12 (provenance report)

import type { MathematicalPrimitive, PlanePosition } from '../types/mfe-types.js';
import type { AcquisitionResult } from '../learn/acquirer.js';
import type { SanitizationResult } from '../learn/sanitizer.js';
import type { HitlGateResult, PromptFn } from '../learn/hitl-gate.js';
import type { DocumentAnalysis } from '../learn/analyzer.js';
import type { CandidatePrimitive, ExtractionResult } from '../learn/extractor.js';
import type { WiringResult } from '../learn/dependency-wirer.js';
import type { PrefilterResult } from '../learn/dedup-prefilter.js';
import type { MergeEngine, MergeResult, ProvenanceEntry, MergeAction, ConflictPresentation } from '../learn/merge-engine.js';
import type { Changeset, ChangesetManager } from '../learn/changeset-manager.js';
import type { LearningReport, LearningReportInput } from '../learn/report-generator.js';
import type { LearnedSkillResult } from '../learn/generators/skill-generator.js';
import type { AgentGeneratorResult } from '../learn/generators/agent-generator.js';
import type { TeamGeneratorResult } from '../learn/generators/team-generator.js';

import { acquireSource } from '../learn/acquirer.js';
import { sanitizeContent } from '../learn/sanitizer.js';
import { hitlGate } from '../learn/hitl-gate.js';
import { analyzeDocument } from '../learn/analyzer.js';
import { extractPrimitives } from '../learn/extractor.js';
import { wireDependencies } from '../learn/dependency-wirer.js';
import { prefilterDuplicates } from '../learn/dedup-prefilter.js';
import { compareSemantically } from '../learn/semantic-comparator.js';
import { createMergeEngine } from '../learn/merge-engine.js';
import { createChangesetManager } from '../learn/changeset-manager.js';
import { generateLearnedSkill } from '../learn/generators/skill-generator.js';
import { generateAgent } from '../learn/generators/agent-generator.js';
import { generateTeam } from '../learn/generators/team-generator.js';
import { generateLearningReport } from '../learn/report-generator.js';
import { harvestAddedPrimitives } from '../scan-arxiv/aggregate-generators.js';
import { isCliEntrypoint } from '../cli/entrypoint-guard.js';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// === Exported Types ===

export interface ScLearnOptions {
  domain?: string;
  depth?: 'shallow' | 'standard' | 'deep';
  dryRun?: boolean;
  scope?: string[];
  existingPrimitives?: MathematicalPrimitive[];
  existingDomainCenters?: PlanePosition[];
  promptFn?: PromptFn;
  onProgress?: (stage: string, detail: string) => void;
  /**
   * Override the HITL hard-block on critical hygiene findings. Off by default;
   * even `--yes`/auto-approve callers are blocked on criticals unless this is
   * set (CLI: `--force-critical`, only after a human reviews the findings).
   */
  forceCritical?: boolean;
  /**
   * Path to a JSON primitive registry (an array of MathematicalPrimitive — a
   * DATA file, not installed skills). When set and `existingPrimitives` is not
   * supplied, the registry is loaded so dedup runs (LEARN-1); a non-dry-run
   * persists newly-added primitives back to it so re-ingesting dedups (LEARN-2).
   */
  registryPath?: string;
}

export interface ScLearnResult {
  success: boolean;
  sessionId: string;
  report: LearningReport;
  changeset: Changeset | null;
  errors: string[];
  /**
   * Conflicts (overlapping-distinct pairs) the merge engine flagged for a human
   * decision. Surfaced here so they are visible, not silently dropped (LEARN-7).
   * Empty/absent when none.
   */
  pendingConflicts?: ConflictPresentation[];
  /**
   * True when the pipeline had a registry to dedup against (existingPrimitives
   * supplied or registryPath given). When false, dedup did not run, so the
   * "skipped: 0" counts are not meaningful (LEARN-1).
   */
  dedupActive?: boolean;
  /** True when a non-dry-run persisted newly-added primitives to registryPath (LEARN-2). */
  registryUpdated?: boolean;
}

// === Progress Helper ===

function progress(
  callback: ScLearnOptions['onProgress'],
  stage: string,
  detail: string,
): void {
  if (callback) {
    callback(stage, detail);
  }
}

// === Registry persistence (LEARN-1 / LEARN-2) ===
//
// The primitive registry is a plain JSON array of MathematicalPrimitive — a DATA
// file, not installed skills. Loading it lights up dedup on the CLI / arxiv paths
// (which previously always passed an empty registry, so every candidate was
// classified add-new); persisting the added primitives back closes the cross-run
// loop so re-ingesting the same source dedups.

async function loadRegistry(registryPath: string): Promise<MathematicalPrimitive[]> {
  if (!existsSync(registryPath)) return [];
  try {
    const parsed = JSON.parse(await readFile(registryPath, 'utf-8'));
    return Array.isArray(parsed) ? (parsed as MathematicalPrimitive[]) : [];
  } catch {
    // A malformed registry must not break ingestion; treat as empty (first run).
    return [];
  }
}

async function saveRegistry(
  registryPath: string,
  primitives: MathematicalPrimitive[],
): Promise<void> {
  await writeFile(registryPath, JSON.stringify(primitives, null, 2), 'utf-8');
}

// Append `added` primitives to `existing`, skipping ids already present so a
// re-run over the same source is idempotent.
function mergeRegistryById(
  existing: MathematicalPrimitive[],
  added: MathematicalPrimitive[],
): MathematicalPrimitive[] {
  const seen = new Set(existing.map((p) => p.id));
  const merged = [...existing];
  for (const p of added) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      merged.push(p);
    }
  }
  return merged;
}

// === Main Function ===

export async function scLearn(
  source: string,
  options: ScLearnOptions = {},
): Promise<ScLearnResult> {
  const sessionId = `learn-${Date.now()}`;
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  const depth = options.depth ?? 'standard';
  const existingDomainCenters = options.existingDomainCenters ?? [];

  // LEARN-1: load the persisted primitive registry so dedup actually runs. The
  // CLI / arxiv paths historically passed no registry, so existingPrimitives was
  // always [], the pre-filter never flagged, and every candidate was add-new.
  let existingPrimitives = options.existingPrimitives ?? [];
  let dedupActive = existingPrimitives.length > 0;
  if (!options.existingPrimitives && options.registryPath) {
    existingPrimitives = await loadRegistry(options.registryPath);
    dedupActive = true; // a registry is wired (may be empty on the very first run)
  }

  // === Stage 1: ACQUIRE ===
  progress(options.onProgress, 'acquire', `Acquiring ${source}...`);

  let acquisitionResult: AcquisitionResult;
  try {
    acquisitionResult = await acquireSource(source, {
      githubScope: options.scope,
    });
  } catch (err) {
    const errMsg = (err as Error).message;
    errors.push(errMsg);
    const completedAt = new Date().toISOString();
    return {
      success: false,
      sessionId,
      report: generateLearningReport({
        sessionId,
        sourcePath: source,
        startedAt,
        completedAt,
        provenanceChain: [],
        mergeActions: [],
        skillsGenerated: [],
        agentsGenerated: [],
        teamsGenerated: [],
        errors,
        options: {
          domain: options.domain,
          depth,
          dryRun: options.dryRun,
          scope: options.scope,
        },
      }),
      changeset: null,
      errors,
    };
  }

  // Check for fatal acquisition errors
  const fatalErrors = acquisitionResult.errors.filter(e => e.fatal);
  if (fatalErrors.length > 0) {
    for (const fe of fatalErrors) {
      errors.push(`${fe.file}: ${fe.reason}`);
    }
    const completedAt = new Date().toISOString();
    return {
      success: false,
      sessionId,
      report: generateLearningReport({
        sessionId,
        sourcePath: source,
        startedAt,
        completedAt,
        provenanceChain: [],
        mergeActions: [],
        skillsGenerated: [],
        agentsGenerated: [],
        teamsGenerated: [],
        errors,
        options: {
          domain: options.domain,
          depth,
          dryRun: options.dryRun,
          scope: options.scope,
        },
      }),
      changeset: null,
      errors,
    };
  }

  // === Stage 2: SANITIZE ===
  progress(options.onProgress, 'sanitize', 'Running hygiene checks...');

  const sanitizationResult: SanitizationResult = await sanitizeContent(acquisitionResult);

  // === Stage 3: HITL GATE ===
  progress(options.onProgress, 'hitl', 'Checking approval...');

  const hitlResult: HitlGateResult = await hitlGate(
    sanitizationResult,
    options.promptFn,
    { forceCritical: options.forceCritical },
  );

  if (!hitlResult.proceed) {
    const completedAt = new Date().toISOString();
    return {
      success: true,
      sessionId,
      report: generateLearningReport({
        sessionId,
        sourcePath: source,
        startedAt,
        completedAt,
        provenanceChain: [],
        mergeActions: [],
        skillsGenerated: [],
        agentsGenerated: [],
        teamsGenerated: [],
        errors: ['Content rejected at HITL gate'],
        options: {
          domain: options.domain,
          depth,
          dryRun: options.dryRun,
          scope: options.scope,
        },
      }),
      changeset: null,
      errors: ['Content rejected at HITL gate'],
    };
  }

  // === Stage 4: ANALYZE ===
  progress(options.onProgress, 'analyze', 'Analyzing document structure...');

  const analyses: DocumentAnalysis[] = [];
  for (const staged of hitlResult.sanitizationResult.staged) {
    const analysis = analyzeDocument(staged.content);
    analyses.push(analysis);
  }

  // === Stage 5: EXTRACT + WIRE ===
  progress(options.onProgress, 'extract', 'Extracting primitives...');

  const allCandidates: CandidatePrimitive[] = [];
  for (const analysis of analyses) {
    const extraction: ExtractionResult = extractPrimitives(analysis, {
      domain: options.domain,
    });
    allCandidates.push(...extraction.candidates);
  }

  // Wire dependencies (skip for shallow depth)
  let wiredCandidates: CandidatePrimitive[];
  if (depth === 'shallow') {
    wiredCandidates = allCandidates;
  } else {
    const wiringResult: WiringResult = wireDependencies(allCandidates);
    wiredCandidates = wiringResult.wiredPrimitives;
  }

  // === Stage 6: DEDUP + MERGE ===
  progress(options.onProgress, 'dedup', 'Deduplicating against registry...');

  const mergeEngine: MergeEngine = createMergeEngine(sessionId);
  const changesetManager: ChangesetManager = createChangesetManager(sessionId);

  for (const candidate of wiredCandidates) {
    const prefilterResult: PrefilterResult = prefilterDuplicates(
      candidate,
      existingPrimitives,
    );

    let mergeResult: MergeResult;

    if (prefilterResult.flagged) {
      const semanticResult = compareSemantically(
        candidate,
        existingPrimitives,
        prefilterResult.matches,
      );

      const bestMatch = semanticResult.bestMatch;
      const existingPrimitive = bestMatch
        ? existingPrimitives.find(p => p.id === bestMatch.existingId) ?? null
        : null;

      mergeResult = mergeEngine.merge(candidate, bestMatch, existingPrimitive);
    } else {
      mergeResult = mergeEngine.merge(candidate, null, null);
    }

    // Record to changeset unless dry run
    if (!options.dryRun) {
      for (const mod of mergeResult.modifications) {
        changesetManager.record(mod);
      }
    }
  }

  // === Stage 7: GENERATE + REPORT ===
  progress(options.onProgress, 'generate', 'Generating artifacts...');

  // Group merged primitives by domain
  const provenanceChain = mergeEngine.getProvenanceChain();
  const domainGroups = new Map<string, MathematicalPrimitive[]>();

  for (const entry of provenanceChain) {
    if (entry.action.includes('add') || entry.action.includes('update')) {
      const candidate = wiredCandidates.find(c => c.id === entry.candidateId);
      if (candidate) {
        const domain = candidate.domain;
        if (!domainGroups.has(domain)) {
          domainGroups.set(domain, []);
        }
        domainGroups.get(domain)!.push(candidate);
      }
    }
  }

  // Generate artifacts for each domain group
  const skillsGenerated: LearningReportInput['skillsGenerated'] = [];
  const agentsGenerated: LearningReportInput['agentsGenerated'] = [];
  const teamsGenerated: LearningReportInput['teamsGenerated'] = [];

  for (const [domainName, primitives] of domainGroups) {
    const skillResult: LearnedSkillResult = generateLearnedSkill(
      domainName,
      primitives,
    );
    if (skillResult.generated && skillResult.skill) {
      skillsGenerated.push({
        domainName: skillResult.skill.domainName,
        primitiveCount: skillResult.skill.primitiveCount,
        fileName: skillResult.skill.fileName,
      });
    }

    const agentResult: AgentGeneratorResult = generateAgent(
      domainName,
      primitives,
      existingDomainCenters,
    );
    if (agentResult.generated && agentResult.agent) {
      agentsGenerated.push({
        agentName: agentResult.agent.agentName,
        fileName: agentResult.agent.fileName,
      });
    }

    const teamResult: TeamGeneratorResult = generateTeam(domainName, primitives);
    if (teamResult.generated && teamResult.team) {
      teamsGenerated.push({
        teamName: teamResult.team.teamName,
        fileName: teamResult.team.fileName,
        agentCount: teamResult.team.agentCount,
      });
    }
  }

  // Generate report
  progress(options.onProgress, 'report', 'Generating learning report...');

  const completedAt = new Date().toISOString();
  const report = generateLearningReport({
    sessionId,
    sourcePath: source,
    startedAt,
    completedAt,
    provenanceChain,
    mergeActions: [],
    skillsGenerated,
    agentsGenerated,
    teamsGenerated,
    errors,
    options: {
      domain: options.domain,
      depth,
      dryRun: options.dryRun,
      scope: options.scope,
    },
  });

  // Get changeset (null if dryRun)
  const changeset = options.dryRun
    ? null
    : changesetManager.getChangeset(sessionId);

  // LEARN-7: surface the conflicts the merge engine flagged. Overlapping-distinct
  // pairs get action:'conflict' with empty modifications, so the record loop above
  // never touched them — without this they vanish while the report still counts them.
  const pendingConflicts = mergeEngine.getPendingConflicts();

  // LEARN-2: persist newly-added primitives back to the registry so a re-run dedups.
  // Data-only — generated skills/agents/teams stay in-memory previews and are NOT
  // installed (skill installation is a separate, gated step).
  let registryUpdated = false;
  if (!options.dryRun && options.registryPath && changeset) {
    const added = harvestAddedPrimitives(changeset);
    if (added.length > 0) {
      await saveRegistry(options.registryPath, mergeRegistryById(existingPrimitives, added));
      registryUpdated = true;
    }
  }

  return {
    success: true,
    sessionId,
    report,
    changeset,
    errors,
    pendingConflicts,
    dedupActive,
    registryUpdated,
  };
}

// === CLI Shell ===
//
// Thin arg-parsing wrapper so `sc-learn` is invokable as a first-class command
// (`skill-creator learn <source>`) and as a standalone `npx tsx` entrypoint —
// the latter is what `src/scan-arxiv/bridge.ts` generates into run-ingestion.sh.
// scLearn() above stays a pure library orchestrator; this is the only CLI layer.

const LEARN_HELP = `skill-creator learn — ingest a source into the skill-knowledge pipeline

Usage:
  skill-creator learn <source> [options]

Arguments:
  <source>                 Path or URL to the document/repo to learn from

Options:
  --domain <name>          Domain hint for primitive extraction (e.g. arxiv-cs)
  --depth <level>          Pipeline depth: shallow | standard | deep (default: standard)
  --scope <a,b,c>          Comma-separated GitHub sub-paths to scope a repo source
  --dry-run                Run the full pipeline but record no changeset
  --yes, -y                Auto-approve the HITL hygiene gate WITH warnings
                           (non-interactive; the caller accepts responsibility).
                           Content with CRITICAL findings is still rejected —
                           pass --force-critical to override. Without --yes,
                           internet/STRANGER content blocks for an interactive
                           decision and no-ops on a non-TTY (safe).
  --force-critical         With --yes, also auto-approve content that has
                           CRITICAL hygiene findings (default: reject critical).
  --registry <path>        JSON primitive registry to dedup against and persist
                           to (enables cross-run dedup; a data file, not skills).
                           Without it, dedup is disabled and nothing persists.
  --help, -h               Print this help text`;

/**
 * CLI entry point for `skill-creator learn`. Returns an exit code:
 * 0 = success (incl. a deliberate HITL rejection), 1 = pipeline error, 2 = bad args.
 */
export async function main(argv: string[]): Promise<number> {
  const options: ScLearnOptions = {};
  let source: string | undefined;
  let autoApprove = false;
  let forceCritical = false;

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];

    switch (flag) {
      case '--help':
      case '-h':
        console.log(LEARN_HELP);
        return 0;

      case '--domain':
        if (!next || next.startsWith('--')) {
          console.error('[learn] --domain requires a value');
          return 2;
        }
        options.domain = next;
        i++;
        break;

      case '--depth':
        if (next !== 'shallow' && next !== 'standard' && next !== 'deep') {
          console.error('[learn] --depth must be one of: shallow, standard, deep');
          return 2;
        }
        options.depth = next;
        i++;
        break;

      case '--scope':
        if (!next || next.startsWith('--')) {
          console.error('[learn] --scope requires a comma-separated value');
          return 2;
        }
        options.scope = next.split(',').map((s) => s.trim()).filter(Boolean);
        i++;
        break;

      case '--dry-run':
        options.dryRun = true;
        break;

      case '--yes':
      case '-y':
      case '--approve-warnings':
        autoApprove = true;
        break;

      case '--force-critical':
        forceCritical = true;
        break;

      case '--registry':
        if (!next || next.startsWith('--')) {
          console.error('[learn] --registry requires a path');
          return 2;
        }
        options.registryPath = next;
        i++;
        break;

      default:
        if (flag.startsWith('-')) {
          console.error(`[learn] unknown flag: ${flag}`);
          return 2;
        }
        if (source === undefined) {
          source = flag;
        } else {
          console.error(`[learn] unexpected extra argument: ${flag}`);
          return 2;
        }
        break;
    }
  }

  if (!source) {
    console.error(`[learn] missing <source>\n\n${LEARN_HELP}`);
    return 2;
  }

  // STRANGER/internet content is never auto-approved by the gate (Three Laws);
  // --yes injects an explicit auto-approve-with-warnings promptFn (mirroring the
  // tools/ingest-*.mts callers), printing findings so they stay visible. Without
  // --yes the gate falls back to its interactive default (safe no-op on non-TTY).
  // Thread --force-critical to the gate (default off). Even with --yes, content
  // carrying CRITICAL hygiene findings is rejected by hitlGate unless this is
  // set after a human has reviewed the findings. Safe to thread unconditionally.
  options.forceCritical = forceCritical;

  if (autoApprove) {
    options.promptFn = async (message, choices) => {
      console.log('[learn] --- sc:learn HITL gate findings ---');
      console.log(message);
      console.log(`[learn] --- auto-approving WITH warnings (--yes; choices were: ${choices.join('|')}) ---`);
      return 'approved-with-warnings';
    };
  }

  options.onProgress = (stage, detail) => {
    process.stdout.write(`[learn] [${stage}] ${detail}\n`);
  };

  const result = await scLearn(source, options);

  console.log(`\n[learn] success:            ${result.success}`);
  console.log(`[learn] sessionId:          ${result.sessionId}`);
  console.log(`[learn] primitives added:   ${result.report.primitivesAdded}`);
  console.log(`[learn] primitives updated: ${result.report.primitivesUpdated}`);
  console.log(`[learn] primitives skipped: ${result.report.primitivesSkipped}`);
  console.log(`[learn] conflicts:          ${result.report.conflictsPresented}`);
  console.log(`[learn] skills generated:   ${result.report.skillCount} (preview — not installed)`);
  console.log(`[learn] agents generated:   ${result.report.agentCount} (preview — not installed)`);
  console.log(`[learn] teams generated:    ${result.report.teamCount} (preview — not installed)`);
  if (!result.dedupActive) {
    console.log('[learn] dedup:              DISABLED — pass --registry <file.json> for cross-run dedup (counts above are all-added)');
  } else if (result.registryUpdated) {
    console.log(`[learn] registry updated:   ${options.registryPath}`);
  }
  const conflicts = result.pendingConflicts ?? [];
  if (conflicts.length > 0) {
    console.log('[learn] unresolved conflicts (overlapping-distinct — NOT added, decide manually):');
    for (const c of conflicts) {
      console.log(`  - ${c.conflictId}: candidate "${c.candidate.id}" vs existing "${c.existing.id}"`);
    }
  }
  if (result.errors.length > 0) {
    console.error(`[learn] errors: ${result.errors.length}`);
    result.errors.forEach((e, idx) => console.error(`  [${idx}] ${e}`));
  }

  return result.success ? 0 : 1;
}

// Entrypoint guard — do NOT call main at module load time (import-safe).
if (isCliEntrypoint(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
