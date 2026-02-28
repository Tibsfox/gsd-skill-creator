/**
 * Workflow engine for the GSD-OS MCP gateway.
 *
 * Simulates GSD pipeline stage execution for gateway tool consumers.
 * Each stage produces structured results matching the GSD pipeline output
 * format. Invocations are recorded for audit and status tracking.
 *
 * In a future phase, this engine will delegate to actual GSD pipeline
 * operations against .planning/ filesystem state.
 *
 * @module mcp/gateway/tools/workflow-engine
 */

import { randomUUID } from 'node:crypto';
import type {
  ExecuteResult,
  PlanResult,
  RequirementsResult,
  ResearchResult,
  WorkflowInvocation,
  WorkflowStage,
} from './workflow-types.js';

// ── Workflow Engine ─────────────────────────────────────────────────────────

/**
 * Simulates GSD pipeline stage execution for gateway tools.
 *
 * Records all invocations and produces structured results for each stage.
 */
export class WorkflowEngine {
  private readonly invocations: WorkflowInvocation[] = [];

  /**
   * Execute the research stage for a project.
   */
  async research(project: string, domain: string, depth: number = 1): Promise<ResearchResult> {
    const now = Date.now();
    this.recordInvocation(project, 'research', true);

    return {
      project,
      domain,
      depth,
      findings: [
        {
          title: `${domain} ecosystem overview`,
          description: `Comprehensive analysis of the ${domain} landscape for project "${project}". Key technologies, patterns, and best practices identified.`,
          source: 'gsd-research-pipeline',
          relevance: 0.95,
        },
        {
          title: `${domain} integration patterns`,
          description: `Common integration approaches for ${domain} in production systems. Trade-offs between performance, maintainability, and complexity analyzed.`,
          source: 'gsd-research-pipeline',
          relevance: 0.85,
        },
        {
          title: `${domain} risk assessment`,
          description: `Potential risks and mitigations for adopting ${domain} patterns. Security, scalability, and maintenance considerations.`,
          source: 'gsd-research-pipeline',
          relevance: 0.75,
        },
      ].slice(0, depth + 1),
      recommendations: [
        `Start with a minimal ${domain} integration and expand incrementally`,
        `Establish automated testing before building ${domain} features`,
        ...(depth >= 2 ? [`Consider ${domain} caching strategies for performance`] : []),
        ...(depth >= 3 ? [`Plan for ${domain} horizontal scaling from day one`] : []),
      ],
      completedAt: now,
    };
  }

  /**
   * Generate requirements for a project.
   */
  async requirements(project: string, scope: string | null = null): Promise<RequirementsResult> {
    const now = Date.now();
    this.recordInvocation(project, 'requirements', true);

    const scopeLabel = scope ?? 'full';
    const reqs = [
      {
        id: 'REQ-001',
        category: 'core',
        description: `${project} must support the primary use case end-to-end`,
        priority: 'must-have' as const,
      },
      {
        id: 'REQ-002',
        category: 'core',
        description: `${project} must handle errors gracefully with structured responses`,
        priority: 'must-have' as const,
      },
      {
        id: 'REQ-003',
        category: 'testing',
        description: `${project} must have comprehensive test coverage (>85%)`,
        priority: 'must-have' as const,
      },
      {
        id: 'REQ-004',
        category: 'performance',
        description: `${project} operations must complete within acceptable latency bounds`,
        priority: 'should-have' as const,
      },
      {
        id: 'REQ-005',
        category: 'documentation',
        description: `${project} must include inline documentation and usage examples`,
        priority: 'should-have' as const,
      },
      {
        id: 'REQ-006',
        category: 'extensibility',
        description: `${project} architecture must support future extension without breaking changes`,
        priority: 'nice-to-have' as const,
      },
    ];

    // Filter by scope if provided
    const filtered = scope
      ? reqs.filter((r) => r.category === scope)
      : reqs;

    // Build category counts
    const categories: Record<string, number> = {};
    for (const r of filtered) {
      categories[r.category] = (categories[r.category] ?? 0) + 1;
    }

    return {
      project,
      scope: scope,
      requirements: filtered,
      categories,
      completedAt: now,
    };
  }

  /**
   * Create an execution plan for a project.
   */
  async plan(project: string, phaseNumber: number | null = null): Promise<PlanResult> {
    const now = Date.now();
    this.recordInvocation(project, 'plan', true);

    const allPhases = [
      { phase: 1, title: 'Foundation types and schemas', wave: 1, taskCount: 4, dependencies: [] },
      { phase: 2, title: 'Core implementation', wave: 1, taskCount: 6, dependencies: [] },
      { phase: 3, title: 'Integration layer', wave: 2, taskCount: 5, dependencies: [1, 2] },
      { phase: 4, title: 'Testing and validation', wave: 3, taskCount: 4, dependencies: [3] },
      { phase: 5, title: 'Documentation and polish', wave: 3, taskCount: 3, dependencies: [3] },
    ];

    const phases = phaseNumber !== null
      ? allPhases.filter((p) => p.phase === phaseNumber)
      : allPhases;

    const totalWaves = phases.reduce((max, p) => Math.max(max, p.wave), 1);
    const totalTasks = phases.reduce((sum, p) => sum + p.taskCount, 0);

    return {
      project,
      phaseNumber,
      phases,
      totalWaves,
      totalTasks,
      completedAt: now,
    };
  }

  /**
   * Execute the full GSD pipeline for a project.
   */
  async execute(
    project: string,
    options: { dryRun?: boolean; phaseFilter?: number | null } = {},
  ): Promise<ExecuteResult> {
    const now = Date.now();
    const dryRun = options.dryRun ?? false;
    const phaseFilter = options.phaseFilter ?? null;

    this.recordInvocation(project, 'execute', true);

    const stages = [
      {
        stage: 'research' as const,
        success: true,
        durationMs: dryRun ? 0 : 150,
        summary: dryRun
          ? `Would research project "${project}" domain`
          : `Completed research for project "${project}"`,
      },
      {
        stage: 'requirements' as const,
        success: true,
        durationMs: dryRun ? 0 : 100,
        summary: dryRun
          ? `Would generate requirements for project "${project}"`
          : `Generated 6 requirements for project "${project}"`,
      },
      {
        stage: 'plan' as const,
        success: true,
        durationMs: dryRun ? 0 : 120,
        summary: dryRun
          ? `Would create execution plan${phaseFilter !== null ? ` for phase ${phaseFilter}` : ''}`
          : `Created plan with 5 phases in 3 waves${phaseFilter !== null ? ` (filtered to phase ${phaseFilter})` : ''}`,
      },
      {
        stage: 'execute' as const,
        success: true,
        durationMs: dryRun ? 0 : 500,
        summary: dryRun
          ? `Would execute pipeline for project "${project}"`
          : `Executed all phases for project "${project}" successfully`,
      },
    ];

    const totalDurationMs = stages.reduce((sum, s) => sum + s.durationMs, 0);
    const success = stages.every((s) => s.success);

    return {
      project,
      dryRun,
      phaseFilter,
      stages,
      success,
      totalDurationMs,
      completedAt: now,
    };
  }

  /**
   * Get all recorded invocations.
   */
  getInvocations(): WorkflowInvocation[] {
    return [...this.invocations];
  }

  /**
   * Get invocations for a specific project.
   */
  getProjectInvocations(project: string): WorkflowInvocation[] {
    return this.invocations.filter((i) => i.project === project);
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private recordInvocation(project: string, stage: WorkflowStage, success: boolean): void {
    this.invocations.push({
      id: randomUUID(),
      project,
      stage,
      timestamp: Date.now(),
      success,
    });
  }
}
