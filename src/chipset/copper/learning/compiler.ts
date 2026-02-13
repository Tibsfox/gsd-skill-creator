/**
 * Pipeline Learning Compiler -- transforms session observations into candidate Pipelines.
 *
 * Bridges the observation pipeline (sessions.jsonl, PatternAnalyzer) to the
 * Pipeline execution system. Detects recurring workflows from session data,
 * infers lifecycle synchronization points and skill activations, and produces
 * executable Pipelines with confidence scores derived from frequency and recency.
 *
 * Compilation pipeline:
 * 1. Extract workflow fingerprints from sessions (normalized tool+command keys)
 * 2. Group sessions by fingerprint, build WorkflowPatterns for groups >= minOccurrences
 * 3. Infer lifecycle events from command/tool keywords
 * 4. Calculate confidence from frequency + recency
 * 5. Filter, sort, and limit patterns
 * 6. Compile each pattern into a validated Pipeline
 */

import type { SessionObservation } from '../../../types/observation.js';
import type { SkillCandidate } from '../../../types/detection.js';
import type {
  Pipeline,
  PipelineInstruction,
  PipelineMetadata,
  GsdLifecycleEvent,
} from '../types.js';
import { PipelineSchema } from '../schema.js';
import type {
  ObservationInput,
  WorkflowPattern,
  CompilationResult,
  CompilerConfig,
} from './types.js';
import { DEFAULT_COMPILER_CONFIG } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Tools filtered from fingerprinting (too common to be distinctive). */
const COMMON_TOOLS = new Set([
  'Read', 'Write', 'Bash', 'Glob', 'Grep', 'Edit', 'Task',
]);

/** Command runner prefixes stripped to extract meaningful part. */
const RUNNER_PREFIXES = /^(npx|npm run|yarn|pnpm|node)\s+/i;

/** Commands that are purely infrastructure (filtered entirely). */
const INFRA_COMMANDS = new Set([
  'git', 'npm', 'node', 'npx', 'cd', 'ls', 'mkdir', 'rm', 'cat',
]);

/** Keyword-to-lifecycle-event mapping for inference. */
const LIFECYCLE_KEYWORD_MAP: Array<{ keywords: string[]; event: GsdLifecycleEvent }> = [
  {
    keywords: ['vitest', 'jest', 'pytest', 'test', 'spec'],
    event: 'tests-passing',
  },
  {
    keywords: ['tsc', 'build', 'compile', 'webpack', 'vite build'],
    event: 'code-complete',
  },
  {
    keywords: ['deploy', 'vercel', 'netlify'],
    event: 'end-of-frame',
  },
];

// ============================================================================
// LearningCompiler
// ============================================================================

/**
 * Compiles session observation data into candidate Pipelines.
 *
 * Groups sessions by workflow fingerprint, detects patterns above the
 * configured occurrence threshold, infers lifecycle events from commands
 * and tools, and produces validated Pipelines with confidence scores.
 */
export class LearningCompiler {
  private readonly config: CompilerConfig;

  constructor(config?: Partial<CompilerConfig>) {
    this.config = { ...DEFAULT_COMPILER_CONFIG, ...config };
  }

  /**
   * Compile observation input into candidate Pipelines.
   */
  compile(input: ObservationInput): CompilationResult {
    const { sessions, candidates } = input;

    if (sessions.length === 0) {
      return { lists: [], patterns: [], sessionsAnalyzed: 0, filteredCount: 0 };
    }

    // Step 1: Group sessions by workflow fingerprint
    const groups = this.groupByFingerprint(sessions);

    // Step 2: Build WorkflowPatterns for each group
    const allPatterns: WorkflowPattern[] = [];
    let filteredCount = 0;

    for (const [fingerprint, groupSessions] of groups.entries()) {
      // Skip empty fingerprints (sessions with no distinctive tools/commands)
      if (fingerprint === '') {
        continue;
      }

      if (groupSessions.length < this.config.minOccurrences) {
        filteredCount++;
        continue;
      }

      const pattern = this.buildPattern(fingerprint, groupSessions);

      if (pattern.confidence < this.config.minConfidence) {
        filteredCount++;
        continue;
      }

      allPatterns.push(pattern);
    }

    // Step 3: Sort by confidence descending, limit to maxPatterns
    allPatterns.sort((a, b) => b.confidence - a.confidence);
    const acceptedPatterns = allPatterns.slice(0, this.config.maxPatterns);
    filteredCount += Math.max(0, allPatterns.length - this.config.maxPatterns);

    // Step 4: Compile each pattern into a Pipeline
    const lists: Pipeline[] = [];
    for (const pattern of acceptedPatterns) {
      const list = this.compilePattern(pattern, candidates);
      if (list !== null) {
        lists.push(list);
      }
    }

    return {
      lists,
      patterns: acceptedPatterns,
      sessionsAnalyzed: sessions.length,
      filteredCount,
    };
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Group sessions by their workflow fingerprint.
   *
   * A fingerprint is derived from the sorted unique set of distinctive
   * (non-common) tools and commands in a session.
   */
  private groupByFingerprint(sessions: SessionObservation[]): Map<string, SessionObservation[]> {
    const groups = new Map<string, SessionObservation[]>();

    for (const session of sessions) {
      const fp = this.getFingerprint(session);
      const group = groups.get(fp);
      if (group) {
        group.push(session);
      } else {
        groups.set(fp, [session]);
      }
    }

    return groups;
  }

  /**
   * Compute a workflow fingerprint for a session.
   *
   * Filters out common tools, normalizes commands by stripping runner
   * prefixes (npx, npm run, etc.) to extract the meaningful part, and
   * creates a sorted key from the remaining distinctive elements.
   */
  private getFingerprint(session: SessionObservation): string {
    const distinctiveTools = (session.topTools ?? [])
      .filter((t) => !this.isCommonTool(t));

    const normalizedCommands = (session.topCommands ?? [])
      .map((c) => this.normalizeCommand(c))
      .filter((c) => c.length > 0);

    const elements = [...distinctiveTools, ...normalizedCommands]
      .map((e) => e.toLowerCase().trim())
      .filter((e) => e.length > 0)
      .sort();

    // Deduplicate
    const unique = [...new Set(elements)];
    return unique.join('|');
  }

  /**
   * Normalize a command for fingerprinting.
   *
   * Strips runner prefixes (npx, npm run, etc.) to extract the meaningful
   * part. Returns empty string for pure infrastructure commands (git, cd, etc.).
   */
  private normalizeCommand(cmd: string): string {
    const trimmed = cmd.trim();
    // Strip runner prefix to get the actual tool name
    const stripped = trimmed.replace(RUNNER_PREFIXES, '');
    // Take the first word as the key command name
    const firstWord = stripped.split(/\s+/)[0].toLowerCase();
    // Filter out pure infrastructure commands
    if (INFRA_COMMANDS.has(firstWord)) {
      return '';
    }
    return firstWord;
  }

  /**
   * Build a WorkflowPattern from a group of sessions sharing a fingerprint.
   */
  private buildPattern(fingerprint: string, sessions: SessionObservation[]): WorkflowPattern {
    // Collect unions of tools, commands, files, and skills
    const toolSet = new Set<string>();
    const commandSet = new Set<string>();
    const fileSet = new Set<string>();
    const skillSet = new Set<string>();
    const sessionIds: string[] = [];

    for (const session of sessions) {
      for (const t of session.topTools ?? []) toolSet.add(t);
      for (const c of session.topCommands ?? []) commandSet.add(c);
      for (const f of session.topFiles ?? []) fileSet.add(f);
      for (const s of session.activeSkills ?? []) skillSet.add(s);
      sessionIds.push(session.sessionId);
    }

    const commands = [...commandSet];
    const tools = [...toolSet];
    const files = [...fileSet].slice(0, 10);
    const activeSkills = [...skillSet];

    const lifecycleEvents = this.inferLifecycleEvents(commands, tools);
    const confidence = this.calculateConfidence(sessions, this.config.recencyDays);
    const workflowType = this.deriveWorkflowType(commands, tools);
    const id = `wf-${this.slugify(workflowType)}`;

    return {
      id,
      workflowType,
      description: `Detected workflow: ${workflowType} (${sessions.length} sessions)`,
      tools,
      commands,
      files,
      activeSkills,
      occurrences: sessions.length,
      confidence,
      lifecycleEvents,
      sessionIds,
    };
  }

  /**
   * Infer lifecycle events from command and tool keywords.
   */
  private inferLifecycleEvents(commands: string[], tools: string[]): GsdLifecycleEvent[] {
    const events = new Set<GsdLifecycleEvent>();

    // Always start with phase-start
    events.add('phase-start');

    const allText = [...commands, ...tools].map((s) => s.toLowerCase()).join(' ');

    for (const mapping of LIFECYCLE_KEYWORD_MAP) {
      for (const keyword of mapping.keywords) {
        if (allText.includes(keyword.toLowerCase())) {
          events.add(mapping.event);
          break;
        }
      }
    }

    return [...events];
  }

  /**
   * Calculate confidence score from frequency and recency.
   *
   * - frequencyScore: min(occurrences / 10, 0.7)
   * - recencyScore: (recent sessions / total) * 0.3
   * - confidence: min(frequencyScore + recencyScore, 1.0)
   */
  private calculateConfidence(sessions: SessionObservation[], recencyDays: number): number {
    const occurrences = sessions.length;
    const frequencyScore = Math.min(occurrences / 10, 0.7);

    const now = Date.now();
    const recencyThreshold = now - recencyDays * 86400_000;
    const recentCount = sessions.filter((s) => s.endTime >= recencyThreshold).length;
    const recencyScore = (recentCount / occurrences) * 0.3;

    return Math.min(frequencyScore + recencyScore, 1.0);
  }

  /**
   * Compile a WorkflowPattern into a Pipeline.
   *
   * Returns null if the compiled pipeline fails schema validation.
   */
  private compilePattern(
    pattern: WorkflowPattern,
    candidates?: SkillCandidate[],
  ): Pipeline | null {
    const instructions: PipelineInstruction[] = [];

    // First lifecycle event as initial WAIT
    if (pattern.lifecycleEvents.length > 0) {
      instructions.push({
        type: 'wait' as const,
        event: pattern.lifecycleEvents[0],
      });
    }

    // MOVE instructions for each active skill (mode: 'full')
    const coveredSkills = new Set<string>();
    for (const skill of pattern.activeSkills) {
      instructions.push({
        type: 'move' as const,
        target: 'skill' as const,
        name: skill,
        mode: 'full' as const,
      });
      coveredSkills.add(skill);
    }

    // MOVE instructions for candidate skills not already covered (mode: 'lite')
    if (candidates) {
      for (const candidate of candidates) {
        if (!coveredSkills.has(candidate.suggestedName)) {
          instructions.push({
            type: 'move' as const,
            target: 'skill' as const,
            name: candidate.suggestedName,
            mode: 'lite' as const,
          });
          coveredSkills.add(candidate.suggestedName);
        }
      }
    }

    // Remaining lifecycle events as WAIT instructions
    for (let i = 1; i < pattern.lifecycleEvents.length; i++) {
      instructions.push({
        type: 'wait' as const,
        event: pattern.lifecycleEvents[i],
      });
    }

    // Safety: ensure at least one instruction
    if (instructions.length === 0) {
      instructions.push({
        type: 'wait' as const,
        event: 'phase-start',
      });
    }

    // Build metadata
    const metadata: PipelineMetadata = {
      name: `learning-${pattern.id}`,
      description: `Learned workflow: ${pattern.description}`,
      sourcePatterns: [pattern.workflowType],
      priority: 30,
      confidence: pattern.confidence,
      tags: ['learned', pattern.workflowType],
      version: 1,
    };

    const list: Pipeline = { metadata, instructions };

    // Validate against schema
    const result = PipelineSchema.safeParse(list);
    if (!result.success) {
      return null;
    }

    return result.data as Pipeline;
  }

  /**
   * Derive a meaningful workflow type name from commands and tools.
   *
   * Extracts the most distinctive command/tool names and slugifies them.
   */
  private deriveWorkflowType(commands: string[], tools: string[]): string {
    // Extract distinctive command names by normalizing
    const commandNames = commands
      .map((c) => this.normalizeCommand(c))
      .filter((c) => c.length > 0);

    // Extract distinctive tool names
    const toolNames = tools.filter((t) => !this.isCommonTool(t));

    // Combine and take top 3
    const parts = [...new Set([...commandNames, ...toolNames])].slice(0, 3);

    if (parts.length === 0) {
      // Fallback: use first available command or tool
      const fallback = commands[0] ?? tools[0] ?? 'unknown';
      return this.slugify(fallback);
    }

    return this.slugify(parts.join('-'));
  }

  /**
   * Check if a tool name is too common to be distinctive.
   */
  private isCommonTool(tool: string): boolean {
    return COMMON_TOOLS.has(tool);
  }

  /**
   * Check if a command is a pure infrastructure command (no distinctive info).
   */
  private isCommonCommand(cmd: string): boolean {
    return INFRA_COMMANDS.has(cmd.toLowerCase().trim());
  }

  /**
   * Slugify text: lowercase, replace non-alphanumeric with dashes, trim dashes.
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
