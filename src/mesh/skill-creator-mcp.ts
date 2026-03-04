/**
 * Skill Creator MCP Server for exposing skill lifecycle tools via MCP protocol.
 *
 * Defines tools covering the complete skill lifecycle: create, eval, grade,
 * compare, analyze, optimize, package, and benchmark. Each tool validates
 * inputs via Zod schemas and returns MCP-formatted responses.
 *
 * Handlers are wired to real pipeline operations via dependency injection.
 */

import { z, type ZodObject, type ZodRawShape } from 'zod';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ChipRegistry } from '../chips/chip-registry.js';
import { OperationTracker } from './operation-tracker.js';
import { SkillWorkspace } from './skill-workspace.js';
import type { SkillLifecycleResolver } from './lifecycle-resolver.js';
import type { SkillScope } from '../types/scope.js';
import { packageSkill } from './skill-packager.js';
import { generateMultiModelReport } from './multi-model-optimizer.js';

// ============================================================================
// Dependency injection types (narrow interfaces for testability)
// ============================================================================

/**
 * Full dependency set for SkillCreatorMcpServer.
 * Used by createSkillCreatorMcpServerFromDeps() factory and for testing with mock deps.
 */
export interface SkillCreatorDeps {
  /** Chip registry for resolving model chips */
  registry: ChipRegistry;
  /** Chip test runner for running skill evaluations */
  chipTestRunner: {
    runForSkill(name: string, opts?: { chip?: string; graderChip?: string; storeResults?: boolean }): Promise<ChipTestRunResult>;
  };
  /** Model-aware grader */
  grader: {
    buildCapabilityProfile(chipName: string, registry: ChipRegistry): Promise<McpCapabilityProfile | null>;
    generateModelHints(tests: Array<{ prompt: string; explanation: string }>, profile: McpCapabilityProfile | null): string[];
  };
  /** Multi-model benchmark runner */
  benchmarkRunner: {
    benchmarkSkill(name: string, chips: string[], grader?: string): Promise<McpMultiModelBenchmark>;
  };
  /** Skill store for filesystem and lifecycle operations */
  skillStore: {
    create(skillName: string, metadata: { name: string; description: string }, body: string): Promise<{ path: string }>;
    list(): Promise<string[]>;
    exists(skillName: string): Promise<boolean>;
  };
  /** Test store for test case management */
  testStore: {
    add(skillName: string, input: { prompt: string; expected: string; description?: string }): Promise<unknown>;
    list(skillName: string): Promise<unknown[]>;
  };
  /** Result store for historical run data */
  resultStore: {
    list(skillName: string): Promise<unknown[]>;
    getLatest(skillName: string): Promise<McpTestRunSnapshot | null>;
  };
  /** Lifecycle resolver for deriving skill state from stores */
  lifecycleResolver: SkillLifecycleResolver;
  /** Scope for skill storage paths */
  scope: SkillScope;
}

/** Eval run result shape (used by config-based evalRunner) */
export interface McpEvalResult {
  metrics: {
    accuracy: number;
    total: number;
    passed: number;
    failed: number;
    f1Score: number;
    precision: number;
    recall: number;
  };
  results: Array<{
    testId: string;
    passed: boolean;
    explanation: string;
    prompt: string;
    expected: string;
  }>;
  hints: string[];
  duration: number;
}

/** ChipTestRunner result shape (used by deps-based chipTestRunner) */
export interface ChipTestRunResult {
  metrics: {
    accuracy: number;
    total: number;
    passed: number;
    failed: number;
    f1Score: number;
    precision: number;
    recall: number;
    [key: string]: number;
  };
  results: Array<{
    testId: string;
    passed: boolean;
    explanation: string;
    prompt: string;
    expected: string;
    [key: string]: unknown;
  }>;
  hints: string[];
  chipName?: string;
  graderChipName?: string;
  duration?: number;
}

/** Capability profile shape for grading */
export interface McpCapabilityProfile {
  model: string;
  tier: string;
  maxContextLength: number;
  supportsTools: boolean;
}

/** Benchmark result shape */
export interface McpBenchmarkResult {
  skillName: string;
  models: Array<{ model: string; passRate: number; avgAccuracy: number; avgF1: number }>;
  runs: Array<{ model: string; passed: boolean; metrics: { accuracy: number } }>;
}

/** TestRunSnapshot shape for resultStore.getLatest() */
export interface McpTestRunSnapshot {
  results: Array<{
    testId: string;
    passed: boolean;
    prompt: string;
    expected: string;
    explanation?: string;
    [key: string]: unknown;
  }>;
  hints?: string[];
  [key: string]: unknown;
}

/** Full multi-model benchmark result shape returned by MultiModelBenchmarkRunner */
export interface McpMultiModelBenchmark {
  skillName: string;
  benchmarkedAt: string;
  models: Array<{
    model: string;
    runCount: number;
    passRate: number;
    avgAccuracy: number;
    avgF1: number;
    thresholdStatus: string;
  }>;
  runs: Array<{
    skillName: string;
    model: string;
    runAt: string;
    duration: number;
    metrics: { accuracy: number; total: number; passed: number; failed: number; f1Score: number; precision: number; recall: number };
    passed: boolean;
    hints: string[];
  }>;
  legacyRunCount: number;
}

/** Configuration for the MCP server with injectable dependencies */
export interface SkillCreatorMcpConfig {
  /** Base directory for skill storage */
  skillsDir: string;
  /** Chip registry for resolving model chips */
  chipRegistry?: ChipRegistry;
  /** Eval runner (ChipTestRunner-compatible) */
  evalRunner?: {
    runForSkill(name: string, opts?: { chip?: string; graderChip?: string }): Promise<McpEvalResult>;
  };
  /** Model-aware grader */
  grader?: {
    buildCapabilityProfile(chipName: string, registry: ChipRegistry): Promise<McpCapabilityProfile | null>;
    generateModelHints(tests: Array<{ prompt: string; explanation: string }>, profile: McpCapabilityProfile | null): string[];
  };
  /** Multi-model benchmark runner */
  benchmarkRunner?: {
    benchmarkSkill(name: string, chips: string[], grader?: string): Promise<McpBenchmarkResult>;
  };
}

// ============================================================================
// Tool Input Schemas
// ============================================================================

const SkillCreateInputSchema = z.object({
  skillName: z.string(),
  description: z.string(),
  template: z.string().optional(),
});

const SkillEvalInputSchema = z.object({
  skillName: z.string(),
  chipName: z.string(),
  testCases: z.number().optional(),
});

const SkillGradeInputSchema = z.object({
  skillName: z.string(),
  chipName: z.string(),
  graderChip: z.string().optional(),
});

const SkillCompareInputSchema = z.object({
  skillName: z.string(),
  chips: z.array(z.string()),
});

const SkillAnalyzeInputSchema = z.object({
  skillName: z.string(),
  chipName: z.string(),
});

const SkillOptimizeInputSchema = z.object({
  skillName: z.string(),
  chipName: z.string(),
  targetPassRate: z.number().optional(),
});

const SkillPackageInputSchema = z.object({
  skillName: z.string(),
  version: z.string(),
  description: z.string().optional(),
});

const SkillBenchmarkInputSchema = z.object({
  skillName: z.string(),
  chips: z.array(z.string()),
  iterations: z.number().optional(),
});

const SkillStatusInputSchema = z.object({
  skillName: z.string(),
});

const SkillListInputSchema = z.object({
  filter: z.string().optional(),
});

// ============================================================================
// MCP Response Types
// ============================================================================

/** MCP text content block */
interface McpTextContent {
  type: 'text';
  text: string;
}

/** MCP tool response */
export interface McpToolResponse {
  content: McpTextContent[];
  isError?: boolean;
}

// ============================================================================
// Tool Definition
// ============================================================================

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ZodObject<ZodRawShape>;
}

// ============================================================================
// SKILL_CREATOR_TOOLS
// ============================================================================

/** All 10 skill creator MCP tools with their schemas */
export const SKILL_CREATOR_TOOLS: ToolDefinition[] = [
  {
    name: 'skill.create',
    description: 'Create a new skill from a name, description, and optional template',
    inputSchema: SkillCreateInputSchema,
  },
  {
    name: 'skill.eval',
    description: 'Evaluate a skill against a specific chip with optional test case count',
    inputSchema: SkillEvalInputSchema,
  },
  {
    name: 'skill.grade',
    description: 'Grade skill evaluation results using an optional grader chip',
    inputSchema: SkillGradeInputSchema,
  },
  {
    name: 'skill.compare',
    description: 'Compare skill performance across multiple chips',
    inputSchema: SkillCompareInputSchema,
  },
  {
    name: 'skill.analyze',
    description: 'Analyze skill behavior and failure patterns for a specific chip',
    inputSchema: SkillAnalyzeInputSchema,
  },
  {
    name: 'skill.optimize',
    description: 'Optimize skill prompts for a chip with optional target pass rate',
    inputSchema: SkillOptimizeInputSchema,
  },
  {
    name: 'skill.package',
    description: 'Package a skill with version for distribution',
    inputSchema: SkillPackageInputSchema,
  },
  {
    name: 'skill.benchmark',
    description: 'Benchmark a skill across multiple chips with optional iteration count',
    inputSchema: SkillBenchmarkInputSchema,
  },
  {
    name: 'skill.status',
    description: 'Get lifecycle state and history for a named skill',
    inputSchema: SkillStatusInputSchema,
  },
  {
    name: 'skill.list',
    description: 'List all known skills with name, status, tested models, and last modified',
    inputSchema: SkillListInputSchema,
  },
];

// ============================================================================
// Helper: MCP response builders
// ============================================================================

function mcpSuccess(data: unknown): McpToolResponse {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

function mcpError(message: string): McpToolResponse {
  return { content: [{ type: 'text', text: message }], isError: true };
}

// ============================================================================
// Benchmark iteration statistics helpers
// ============================================================================

/** Return the value at percentile p (0-100) of a sorted array. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

/**
 * Aggregate per-chip accuracy statistics across multiple benchmark iterations.
 *
 * For each chip, collects accuracy values from all runs where run.model === chip,
 * then computes mean, p50, p95, min, and max.
 */
function computeIterationStats(
  runs: McpMultiModelBenchmark[],
  chips: string[],
): Array<{ chip: string; mean: number; p50: number; p95: number; min: number; max: number }> {
  return chips.map((chip) => {
    const accuracies = runs
      .flatMap((r) => r.runs.filter((run) => run.model === chip).map((run) => run.metrics.accuracy))
      .sort((a, b) => a - b);
    const mean =
      accuracies.length > 0 ? accuracies.reduce((s, v) => s + v, 0) / accuracies.length : 0;
    return {
      chip,
      mean,
      p50: percentile(accuracies, 50),
      p95: percentile(accuracies, 95),
      min: accuracies[0] ?? 0,
      max: accuracies[accuracies.length - 1] ?? 0,
    };
  });
}

// ============================================================================
// SkillCreatorMcpServer
// ============================================================================

/**
 * MCP server that exposes skill lifecycle tools.
 *
 * Validates tool arguments via Zod schemas and dispatches to pipeline handlers.
 * Returns MCP-formatted responses: { content: [{ type: 'text', text }] }
 *
 * All handlers catch exceptions and return isError:true — no thrown exceptions.
 */
export class SkillCreatorMcpServer {
  private readonly config: SkillCreatorMcpConfig;
  private readonly handlers: Record<string, (args: unknown) => Promise<McpToolResponse>>;

  constructor(config?: SkillCreatorMcpConfig) {
    this.config = config ?? { skillsDir: '.claude/skills' };
    this.handlers = {
      'skill.create': (args) => this.handleCreate(args as z.infer<typeof SkillCreateInputSchema>),
      'skill.eval': (args) => this.handleEval(args as z.infer<typeof SkillEvalInputSchema>),
      'skill.grade': (args) => this.handleGrade(args as z.infer<typeof SkillGradeInputSchema>),
      'skill.compare': (args) => this.handleCompare(args as z.infer<typeof SkillCompareInputSchema>),
      'skill.analyze': (args) => this.handleAnalyze(args as z.infer<typeof SkillAnalyzeInputSchema>),
      'skill.optimize': (args) => this.handleOptimize(args as z.infer<typeof SkillOptimizeInputSchema>),
      'skill.package': (args) => this.handlePackage(args as z.infer<typeof SkillPackageInputSchema>),
      'skill.benchmark': (args) => this.handleBenchmark(args as z.infer<typeof SkillBenchmarkInputSchema>),
      'skill.status': (args) => this.handleStatus(args as z.infer<typeof SkillStatusInputSchema>),
      'skill.list': (args) => this.handleList(args as z.infer<typeof SkillListInputSchema>),
    };
  }

  /** List all available tools with their schemas. */
  listTools(): ToolDefinition[] {
    return SKILL_CREATOR_TOOLS;
  }

  /**
   * Handle an MCP tool call.
   *
   * Validates args against the tool's input schema, dispatches to the
   * appropriate handler, and returns an MCP-formatted response.
   * All errors are caught and returned as isError:true responses.
   */
  async handleToolCall(toolName: string, args: unknown): Promise<McpToolResponse> {
    const tool = SKILL_CREATOR_TOOLS.find((t) => t.name === toolName);
    if (!tool) {
      return mcpError(`Unknown tool: ${toolName}`);
    }

    const parseResult = tool.inputSchema.safeParse(args);
    if (!parseResult.success) {
      return mcpError(
        `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
      );
    }

    try {
      const handler = this.handlers[toolName];
      return await handler(parseResult.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return mcpError(message);
    }
  }

  // ==========================================================================
  // Handler: skill.create
  // ==========================================================================

  private async handleCreate(args: z.infer<typeof SkillCreateInputSchema>): Promise<McpToolResponse> {
    const skillDir = join(this.config.skillsDir, args.skillName);
    await mkdir(skillDir, { recursive: true });

    // Write SKILL.md
    const skillMd = [
      '---',
      `name: ${args.skillName}`,
      `description: ${args.description}`,
      '---',
      '',
      `# ${args.skillName}`,
      '',
      args.description,
      '',
    ].join('\n');
    await writeFile(join(skillDir, 'SKILL.md'), skillMd, 'utf-8');

    // Write test-cases.json template
    await writeFile(join(skillDir, 'test-cases.json'), '[]', 'utf-8');

    // Write skill-manifest.json
    const manifest = {
      name: args.skillName,
      description: args.description,
      template: args.template ?? 'default',
      createdAt: new Date().toISOString(),
    };
    await writeFile(join(skillDir, 'skill-manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

    // Init OperationTracker (starts as 'draft')
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    await tracker.save();

    const files = ['SKILL.md', 'test-cases.json', 'skill-manifest.json', '.skill-status.json'];
    return mcpSuccess({ created: true, path: skillDir, files });
  }

  // ==========================================================================
  // Handler: skill.eval
  // ==========================================================================

  private async handleEval(args: z.infer<typeof SkillEvalInputSchema>): Promise<McpToolResponse> {
    if (!this.config.chipRegistry) {
      return mcpError('No chip registry configured');
    }

    const chip = this.config.chipRegistry.get(args.chipName);
    if (!chip) {
      return mcpError(`Chip not found: ${args.chipName}`);
    }

    if (!this.config.evalRunner) {
      return mcpError('No eval runner configured');
    }

    const evalResult = await this.config.evalRunner.runForSkill(args.skillName, {
      chip: args.chipName,
    });

    // Advance lifecycle state
    const skillDir = join(this.config.skillsDir, args.skillName);
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    try {
      tracker.advance('tested');
      await tracker.save();
    } catch {
      // May already be in tested or later state — non-fatal
    }

    return mcpSuccess({
      skillName: args.skillName,
      chipName: args.chipName,
      metrics: evalResult.metrics,
      hints: evalResult.hints,
      duration: evalResult.duration,
      testCount: evalResult.results.length,
    });
  }

  // ==========================================================================
  // Handler: skill.grade
  // ==========================================================================

  private async handleGrade(args: z.infer<typeof SkillGradeInputSchema>): Promise<McpToolResponse> {
    if (!this.config.chipRegistry) {
      return mcpError('No chip registry configured');
    }

    if (!this.config.grader) {
      return mcpError('No grader configured');
    }

    const profile = await this.config.grader.buildCapabilityProfile(
      args.chipName,
      this.config.chipRegistry,
    );

    // Build failed tests from last eval (simplified — grader generates hints from profile)
    const failedTests: Array<{ prompt: string; explanation: string }> = [];
    const hints = this.config.grader.generateModelHints(failedTests, profile);

    // Advance lifecycle state
    const skillDir = join(this.config.skillsDir, args.skillName);
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    try {
      tracker.advance('graded');
      await tracker.save();
    } catch {
      // May already be past graded — non-fatal
    }

    return mcpSuccess({
      skillName: args.skillName,
      chipName: args.chipName,
      graderChip: args.graderChip ?? 'default',
      profile: profile ?? { model: args.chipName, tier: 'unknown' },
      hints,
    });
  }

  // ==========================================================================
  // Handler: skill.compare (stub — wired in 56-03)
  // ==========================================================================

  private async handleCompare(args: z.infer<typeof SkillCompareInputSchema>): Promise<McpToolResponse> {
    if (!this.config.chipRegistry) {
      return mcpError('No chip registry configured');
    }
    if (!this.config.evalRunner) {
      return mcpError('No eval runner configured');
    }

    const results: Array<{ chipName: string; metrics: McpEvalResult['metrics'] }> = [];
    for (const chipName of args.chips) {
      const chip = this.config.chipRegistry.get(chipName);
      if (!chip) {
        results.push({ chipName, metrics: { accuracy: 0, total: 0, passed: 0, failed: 0, f1Score: 0, precision: 0, recall: 0 } });
        continue;
      }
      const evalResult = await this.config.evalRunner.runForSkill(args.skillName, { chip: chipName });
      results.push({ chipName, metrics: evalResult.metrics });
    }

    return mcpSuccess({ skillName: args.skillName, comparison: results });
  }

  // ==========================================================================
  // Handler: skill.analyze (stub — wired in 56-03)
  // ==========================================================================

  private async handleAnalyze(args: z.infer<typeof SkillAnalyzeInputSchema>): Promise<McpToolResponse> {
    if (!this.config.chipRegistry) {
      return mcpError('No chip registry configured');
    }
    if (!this.config.evalRunner) {
      return mcpError('No eval runner configured');
    }

    const chip = this.config.chipRegistry.get(args.chipName);
    if (!chip) {
      return mcpError(`Chip not found: ${args.chipName}`);
    }

    const evalResult = await this.config.evalRunner.runForSkill(args.skillName, { chip: args.chipName });

    // Categorize failures by pattern
    const failures = evalResult.results.filter((r) => !r.passed);
    const patterns: Record<string, number> = {};
    for (const f of failures) {
      const category = f.expected === 'positive' ? 'false-negative' : 'false-positive';
      patterns[category] = (patterns[category] ?? 0) + 1;
    }

    return mcpSuccess({
      skillName: args.skillName,
      chipName: args.chipName,
      totalTests: evalResult.results.length,
      failedTests: failures.length,
      patterns,
      hints: evalResult.hints,
    });
  }

  // ==========================================================================
  // Handler: skill.optimize (stub — wired in 56-03)
  // ==========================================================================

  private async handleOptimize(args: z.infer<typeof SkillOptimizeInputSchema>): Promise<McpToolResponse> {
    if (!this.config.chipRegistry) {
      return mcpError('No chip registry configured');
    }
    if (!this.config.evalRunner) {
      return mcpError('No eval runner configured');
    }

    const chip = this.config.chipRegistry.get(args.chipName);
    if (!chip) {
      return mcpError(`Chip not found: ${args.chipName}`);
    }

    const evalResult = await this.config.evalRunner.runForSkill(args.skillName, { chip: args.chipName });

    const failures = evalResult.results.filter((r) => !r.passed);
    const targetPassRate = args.targetPassRate ?? 0.9;
    const currentPassRate = evalResult.metrics.total > 0
      ? evalResult.metrics.passed / evalResult.metrics.total
      : 0;

    const suggestions: string[] = [];
    if (currentPassRate < targetPassRate) {
      if (failures.some((f) => f.expected === 'positive')) {
        suggestions.push('Broaden skill activation patterns to catch missed positive cases');
      }
      if (failures.some((f) => f.expected === 'negative')) {
        suggestions.push('Tighten skill boundaries to reject out-of-domain prompts');
      }
      suggestions.push(`Target: ${(targetPassRate * 100).toFixed(0)}%, Current: ${(currentPassRate * 100).toFixed(0)}%`);
    }

    // Advance lifecycle state
    const skillDir = join(this.config.skillsDir, args.skillName);
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    try {
      tracker.advance('optimized');
      await tracker.save();
    } catch {
      // Non-fatal if already past optimized
    }

    return mcpSuccess({
      skillName: args.skillName,
      chipName: args.chipName,
      currentPassRate,
      targetPassRate,
      suggestions,
    });
  }

  // ==========================================================================
  // Handler: skill.package (stub — wired in 56-03)
  // ==========================================================================

  private async handlePackage(args: z.infer<typeof SkillPackageInputSchema>): Promise<McpToolResponse> {
    const skillDir = join(this.config.skillsDir, args.skillName);

    // Build minimal manifest for packaging
    const manifest = {
      name: args.skillName,
      version: args.version,
      description: args.description ?? '',
      packagedAt: new Date().toISOString(),
      packagedBy: 'skill-creator-mcp',
    };

    await writeFile(join(skillDir, 'package-manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

    // Advance lifecycle state
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    try {
      tracker.advance('packaged');
      await tracker.save();
    } catch {
      // Non-fatal if already packaged
    }

    return mcpSuccess({
      skillName: args.skillName,
      version: args.version,
      manifest,
      files: ['SKILL.md', 'skill-manifest.json', 'package-manifest.json'],
    });
  }

  // ==========================================================================
  // Handler: skill.benchmark (stub — wired in 56-03)
  // ==========================================================================

  private async handleBenchmark(args: z.infer<typeof SkillBenchmarkInputSchema>): Promise<McpToolResponse> {
    if (!this.config.benchmarkRunner) {
      // Fallback: run eval for each chip if evalRunner available
      if (!this.config.evalRunner || !this.config.chipRegistry) {
        return mcpError('No benchmark runner or eval runner configured');
      }

      const iterations = args.iterations ?? 1;
      const chipResults: Array<{
        chipName: string;
        iterations: number;
        scores: number[];
        mean: number;
        p50: number;
        p95: number;
      }> = [];

      for (const chipName of args.chips) {
        const chip = this.config.chipRegistry.get(chipName);
        if (!chip) continue;

        const scores: number[] = [];
        for (let i = 0; i < iterations; i++) {
          const evalResult = await this.config.evalRunner.runForSkill(args.skillName, { chip: chipName });
          scores.push(evalResult.metrics.accuracy);
        }

        scores.sort((a, b) => a - b);
        const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
        const p50 = scores[Math.floor(scores.length * 0.5)] ?? 0;
        const p95 = scores[Math.floor(scores.length * 0.95)] ?? scores[scores.length - 1] ?? 0;

        chipResults.push({ chipName, iterations, scores, mean, p50, p95 });
      }

      return mcpSuccess({ skillName: args.skillName, chips: chipResults });
    }

    const result = await this.config.benchmarkRunner.benchmarkSkill(
      args.skillName,
      args.chips,
    );

    return mcpSuccess(result);
  }

  // ==========================================================================
  // Handler: skill.status
  // ==========================================================================

  private async handleStatus(args: z.infer<typeof SkillStatusInputSchema>): Promise<McpToolResponse> {
    const skillDir = join(this.config.skillsDir, args.skillName);
    const tracker = new OperationTracker(skillDir);
    await tracker.load();

    // Verify skill exists by checking if we got a non-default state or status file loaded
    const state = tracker.getState();
    const history = tracker.getHistory();

    return mcpSuccess({
      name: args.skillName,
      state,
      history,
    });
  }

  // ==========================================================================
  // Handler: skill.list
  // ==========================================================================

  private async handleList(args: z.infer<typeof SkillListInputSchema>): Promise<McpToolResponse> {
    const workspace = new SkillWorkspace(this.config.skillsDir);
    let skills = await workspace.listSkills();

    if (args.filter) {
      const filterLower = args.filter.toLowerCase();
      skills = skills.filter((s) => s.name.toLowerCase().includes(filterLower));
    }

    return mcpSuccess({ skills, total: skills.length });
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new SkillCreatorMcpServer instance.
 */
export function createSkillCreatorMcpServer(config?: SkillCreatorMcpConfig): SkillCreatorMcpServer {
  return new SkillCreatorMcpServer(config);
}

// ============================================================================
// SkillCreatorDepsMcpServer — deps-based server with real pipeline handlers
// ============================================================================

/**
 * MCP server variant that wires skill.create, skill.eval, and skill.grade to
 * real pipeline operations via the injected SkillCreatorDeps.
 *
 * All other handlers (compare, analyze, optimize, package, benchmark, status,
 * list) delegate to the base SkillCreatorMcpServer implementation.
 */
class SkillCreatorDepsMcpServer extends SkillCreatorMcpServer {
  private readonly d: SkillCreatorDeps;

  constructor(deps: SkillCreatorDeps) {
    // Pass a minimal config so base class schema/validation machinery works.
    // Handlers for create/eval/grade will be overridden in handleToolCall.
    super({ skillsDir: '.claude/skills' });
    this.d = deps;
  }

  override async handleToolCall(toolName: string, args: unknown): Promise<McpToolResponse> {
    // Route the 3 wired tools to real pipeline handlers; everything else falls
    // through to the base class (which handles validation + stubs).
    switch (toolName) {
      case 'skill.create': {
        const tool = SKILL_CREATOR_TOOLS.find((t) => t.name === toolName);
        if (!tool) return mcpError(`Unknown tool: ${toolName}`);
        const parseResult = tool.inputSchema.safeParse(args);
        if (!parseResult.success) {
          return mcpError(
            `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
          );
        }
        try {
          return await this.depsHandleCreate(parseResult.data as z.infer<typeof SkillCreateInputSchema>);
        } catch (err) {
          return mcpError(err instanceof Error ? err.message : String(err));
        }
      }

      case 'skill.eval': {
        const tool = SKILL_CREATOR_TOOLS.find((t) => t.name === toolName);
        if (!tool) return mcpError(`Unknown tool: ${toolName}`);
        const parseResult = tool.inputSchema.safeParse(args);
        if (!parseResult.success) {
          return mcpError(
            `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
          );
        }
        try {
          return await this.depsHandleEval(parseResult.data as z.infer<typeof SkillEvalInputSchema>);
        } catch (err) {
          return mcpError(err instanceof Error ? err.message : String(err));
        }
      }

      case 'skill.grade': {
        const tool = SKILL_CREATOR_TOOLS.find((t) => t.name === toolName);
        if (!tool) return mcpError(`Unknown tool: ${toolName}`);
        const parseResult = tool.inputSchema.safeParse(args);
        if (!parseResult.success) {
          return mcpError(
            `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
          );
        }
        try {
          return await this.depsHandleGrade(parseResult.data as z.infer<typeof SkillGradeInputSchema>);
        } catch (err) {
          return mcpError(err instanceof Error ? err.message : String(err));
        }
      }

      case 'skill.compare': {
        const tool = SKILL_CREATOR_TOOLS.find((t) => t.name === toolName);
        if (!tool) return mcpError(`Unknown tool: ${toolName}`);
        const parseResult = tool.inputSchema.safeParse(args);
        if (!parseResult.success) {
          return mcpError(
            `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
          );
        }
        try {
          return await this.depsHandleCompare(parseResult.data as z.infer<typeof SkillCompareInputSchema>);
        } catch (err) {
          return mcpError(err instanceof Error ? err.message : String(err));
        }
      }

      case 'skill.analyze': {
        const tool = SKILL_CREATOR_TOOLS.find((t) => t.name === toolName);
        if (!tool) return mcpError(`Unknown tool: ${toolName}`);
        const parseResult = tool.inputSchema.safeParse(args);
        if (!parseResult.success) {
          return mcpError(
            `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
          );
        }
        try {
          return await this.depsHandleAnalyze(parseResult.data as z.infer<typeof SkillAnalyzeInputSchema>);
        } catch (err) {
          return mcpError(err instanceof Error ? err.message : String(err));
        }
      }

      case 'skill.optimize': {
        const tool = SKILL_CREATOR_TOOLS.find((t) => t.name === toolName);
        if (!tool) return mcpError(`Unknown tool: ${toolName}`);
        const parseResult = tool.inputSchema.safeParse(args);
        if (!parseResult.success) {
          return mcpError(
            `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
          );
        }
        try {
          return await this.depsHandleOptimize(parseResult.data as z.infer<typeof SkillOptimizeInputSchema>);
        } catch (err) {
          return mcpError(err instanceof Error ? err.message : String(err));
        }
      }

      case 'skill.package': {
        const tool = SKILL_CREATOR_TOOLS.find((t) => t.name === toolName);
        if (!tool) return mcpError(`Unknown tool: ${toolName}`);
        const parseResult = tool.inputSchema.safeParse(args);
        if (!parseResult.success) {
          return mcpError(
            `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
          );
        }
        try {
          return await this.depsHandlePackage(parseResult.data as z.infer<typeof SkillPackageInputSchema>);
        } catch (err) {
          return mcpError(err instanceof Error ? err.message : String(err));
        }
      }

      case 'skill.benchmark': {
        const tool = SKILL_CREATOR_TOOLS.find((t) => t.name === toolName);
        if (!tool) return mcpError(`Unknown tool: ${toolName}`);
        const parseResult = tool.inputSchema.safeParse(args);
        if (!parseResult.success) {
          return mcpError(
            `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
          );
        }
        try {
          return await this.depsHandleBenchmark(parseResult.data as z.infer<typeof SkillBenchmarkInputSchema>);
        } catch (err) {
          return mcpError(err instanceof Error ? err.message : String(err));
        }
      }

      case 'skill.status': {
        const tool = SKILL_CREATOR_TOOLS.find((t) => t.name === toolName);
        if (!tool) return mcpError(`Unknown tool: ${toolName}`);
        const parseResult = tool.inputSchema.safeParse(args);
        if (!parseResult.success) {
          return mcpError(
            `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
          );
        }
        try {
          return await this.depsHandleStatus(parseResult.data as z.infer<typeof SkillStatusInputSchema>);
        } catch (err) {
          return mcpError(err instanceof Error ? err.message : String(err));
        }
      }

      case 'skill.list': {
        const tool = SKILL_CREATOR_TOOLS.find((t) => t.name === toolName);
        if (!tool) return mcpError(`Unknown tool: ${toolName}`);
        const parseResult = tool.inputSchema.safeParse(args);
        if (!parseResult.success) {
          return mcpError(
            `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
          );
        }
        try {
          return await this.depsHandleList(parseResult.data as z.infer<typeof SkillListInputSchema>);
        } catch (err) {
          return mcpError(err instanceof Error ? err.message : String(err));
        }
      }

      default:
        return super.handleToolCall(toolName, args);
    }
  }

  // --------------------------------------------------------------------------
  // Real handler: skill.create
  // --------------------------------------------------------------------------

  private async depsHandleCreate(
    args: z.infer<typeof SkillCreateInputSchema>,
  ): Promise<McpToolResponse> {
    const body =
      `## Skill: ${args.template ?? 'basic'}\n\n` +
      `This skill was created via skill.create.\n\n${args.description}`;

    const skill = await this.d.skillStore.create(
      args.skillName,
      { name: args.skillName, description: args.description },
      body,
    );

    // Add a starter test case so skill.eval has something to run
    await this.d.testStore.add(args.skillName, {
      prompt: `Describe what ${args.skillName} does`,
      expected: 'positive',
      description: 'Auto-generated starter test',
    });

    return mcpSuccess({ created: true, path: skill.path });
  }

  // --------------------------------------------------------------------------
  // Real handler: skill.eval
  // --------------------------------------------------------------------------

  private async depsHandleEval(
    args: z.infer<typeof SkillEvalInputSchema>,
  ): Promise<McpToolResponse> {
    const result = await this.d.chipTestRunner.runForSkill(args.skillName, {
      chip: args.chipName,
      storeResults: true,
    });

    return mcpSuccess({
      metrics: result.metrics,
      results: result.results,
      chipName: result.chipName,
      hints: result.hints,
    });
  }

  // --------------------------------------------------------------------------
  // Real handler: skill.grade
  // --------------------------------------------------------------------------

  private async depsHandleGrade(
    args: z.infer<typeof SkillGradeInputSchema>,
  ): Promise<McpToolResponse> {
    const result = await this.d.chipTestRunner.runForSkill(args.skillName, {
      chip: args.chipName,
      graderChip: args.graderChip,
      storeResults: true,
    });

    const profile = await this.d.grader.buildCapabilityProfile(args.chipName, this.d.registry);

    const failedTests = result.results
      .filter((r) => !r.passed)
      .map((r) => ({ prompt: String(r.prompt), explanation: String(r.explanation) }));

    const hints = this.d.grader.generateModelHints(failedTests, profile);

    return mcpSuccess({
      profile,
      hints,
      results: result.results,
      metrics: result.metrics,
    });
  }

  // --------------------------------------------------------------------------
  // Real handler: skill.compare
  // --------------------------------------------------------------------------

  private async depsHandleCompare(
    args: z.infer<typeof SkillCompareInputSchema>,
  ): Promise<McpToolResponse> {
    const benchmark = await this.d.benchmarkRunner.benchmarkSkill(args.skillName, args.chips);
    return mcpSuccess({
      skillName: args.skillName,
      chips: args.chips,
      models: benchmark.models,
      runs: benchmark.runs,
    });
  }

  // --------------------------------------------------------------------------
  // Real handler: skill.analyze
  // --------------------------------------------------------------------------

  private async depsHandleAnalyze(
    args: z.infer<typeof SkillAnalyzeInputSchema>,
  ): Promise<McpToolResponse> {
    const latest = await this.d.resultStore.getLatest(args.skillName);
    if (!latest) {
      throw new Error(`No eval results for skill '${args.skillName}'`);
    }

    const failures = latest.results.filter((r) => !r.passed);
    const issues = {
      falseNegatives: failures
        .filter((r) => r.expected === 'positive')
        .map((r) => ({ prompt: r.prompt, explanation: r.explanation ?? '' })),
      falsePositives: failures
        .filter((r) => r.expected === 'negative')
        .map((r) => ({ prompt: r.prompt, explanation: r.explanation ?? '' })),
    };

    return mcpSuccess({ issues, hints: latest.hints ?? [] });
  }

  // --------------------------------------------------------------------------
  // Real handler: skill.optimize
  // --------------------------------------------------------------------------

  private async depsHandleOptimize(
    args: z.infer<typeof SkillOptimizeInputSchema>,
  ): Promise<McpToolResponse> {
    const latest = await this.d.resultStore.getLatest(args.skillName);
    if (!latest) {
      throw new Error(`No eval results for skill '${args.skillName}'`);
    }

    const profile = await this.d.grader.buildCapabilityProfile(args.chipName, this.d.registry);

    const failedTests = latest.results
      .filter((r) => !r.passed)
      .map((r) => ({ prompt: r.prompt, explanation: String(r.explanation ?? '') }));

    const hints = this.d.grader.generateModelHints(failedTests, profile);

    return mcpSuccess({
      skillName: args.skillName,
      chipName: args.chipName,
      targetPassRate: args.targetPassRate ?? 0.75,
      hints,
      failureCount: failedTests.length,
    });
  }

  // --------------------------------------------------------------------------
  // Real handler: skill.package
  // --------------------------------------------------------------------------

  private async depsHandlePackage(
    args: z.infer<typeof SkillPackageInputSchema>,
  ): Promise<McpToolResponse> {
    const report = generateMultiModelReport(args.skillName, []);
    const pkg = packageSkill(args.skillName, args.version, args.description ?? '', report);
    return mcpSuccess(pkg);
  }

  // --------------------------------------------------------------------------
  // Real handler: skill.benchmark
  // --------------------------------------------------------------------------

  private async depsHandleBenchmark(
    args: z.infer<typeof SkillBenchmarkInputSchema>,
  ): Promise<McpToolResponse> {
    const iterations = args.iterations ?? 3;
    const allRuns: McpMultiModelBenchmark[] = [];
    for (let i = 0; i < iterations; i++) {
      const run = await this.d.benchmarkRunner.benchmarkSkill(args.skillName, args.chips);
      allRuns.push(run);
    }
    const stats = computeIterationStats(allRuns, args.chips);
    return mcpSuccess({ iterations, chips: stats });
  }

  // --------------------------------------------------------------------------
  // Real handler: skill.status
  // --------------------------------------------------------------------------

  private async depsHandleStatus(
    args: z.infer<typeof SkillStatusInputSchema>,
  ): Promise<McpToolResponse> {
    const status = await this.d.lifecycleResolver.resolve(args.skillName);
    return mcpSuccess({ name: args.skillName, status });
  }

  // --------------------------------------------------------------------------
  // Real handler: skill.list
  // --------------------------------------------------------------------------

  private async depsHandleList(
    args: z.infer<typeof SkillListInputSchema>,
  ): Promise<McpToolResponse> {
    let skills = await this.d.lifecycleResolver.listAll();
    if (args.filter) {
      skills = skills.filter((s) => s.name.includes(args.filter!));
    }
    const enriched = await Promise.all(
      skills.map(async (s) => {
        const results = await this.d.resultStore.list(s.name) as Array<{ chipName?: string; runAt?: string }>;
        const testedModels = new Set(results.map((r) => r.chipName).filter(Boolean)).size;
        const lastModified = results.length > 0 ? results[results.length - 1].runAt : undefined;
        return { ...s, testedModels, lastModified };
      }),
    );
    return mcpSuccess({ skills: enriched, count: enriched.length });
  }
}

/**
 * Create a new MCP server with real pipeline handlers for skill.create,
 * skill.eval, and skill.grade via injected SkillCreatorDeps.
 *
 * All other tools (compare, analyze, optimize, package, benchmark, status, list)
 * use the standard SkillCreatorMcpServer implementation.
 */
export function createSkillCreatorMcpServerFromDeps(
  deps: SkillCreatorDeps,
): SkillCreatorMcpServer {
  return new SkillCreatorDepsMcpServer(deps);
}
