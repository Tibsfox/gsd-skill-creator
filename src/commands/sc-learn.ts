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
import type { MergeEngine, MergeResult, ProvenanceEntry, MergeAction } from '../learn/merge-engine.js';
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
}

export interface ScLearnResult {
  success: boolean;
  sessionId: string;
  report: LearningReport;
  changeset: Changeset | null;
  errors: string[];
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

// === Main Function ===

export async function scLearn(
  source: string,
  options: ScLearnOptions = {},
): Promise<ScLearnResult> {
  const sessionId = `learn-${Date.now()}`;
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  const depth = options.depth ?? 'standard';
  const existingPrimitives = options.existingPrimitives ?? [];
  const existingDomainCenters = options.existingDomainCenters ?? [];

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

  const hitlResult: HitlGateResult = await hitlGate(sanitizationResult, options.promptFn);

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

  return {
    success: true,
    sessionId,
    report,
    changeset,
    errors,
  };
}
