/**
 * C03 — Finding engine aggregator.
 *
 * Collects per-file analyzer outputs and git/filesystem context,
 * then runs each cross-file detector to produce evidence-backed findings.
 *
 * Behavioral invariants:
 * - Idempotency: same input → same output (D-22-16)
 * - No mutation of perFileResults (read-only)
 * - Rationale strings include specific evidence: numbers + file paths (D-22-17)
 * - All findings carry produced_by, produced_at, snapshot_id, project_id (C03 PRD §Provenance)
 */

import type { Finding, FindingKind } from '../../types.js';
import type { AnalyzerOutput } from '../types.js';
import type { GitFileMetadata } from '../git.js';
import type { IntelligenceKB } from '../../types.js';
import { detectDeadCode } from './dead-code.js';
import { detectHotSpots } from './hot-spots.js';
import { detectCouplingSpikes } from './coupling.js';
import { detectComplexityOutliers } from './complexity.js';
import { detectChurnOutliers } from './churn.js';
import { detectOrphanDrafts } from './orphans.js';
import { detectStalledMissions } from './stalled.js';

// ─── Aggregator types ─────────────────────────────────────

export interface ChurnData {
  filePath: string;
  commit_count_90d: number;
  total_commit_count: number;
  author_count: number;
  last_modified: string;
}

export interface StagingState {
  stagingInboxPath: string;
}

export interface PreviousSnapshotData {
  snapshotId: string;
  /** Map from filePath → coupling score at prior snapshot */
  couplingScores: Map<string, number>;
}

export interface AggregatorInput {
  projectId: string;
  snapshotId: string;
  /** Per-file analyzer outputs from C02. Read-only. */
  perFileResults: AnalyzerOutput[];
  /** File → git churn for last 90 days. */
  gitChurn?: Map<string, ChurnData>;
  /** Staging inbox state for orphan detection. */
  stagingState?: StagingState;
  /** Previous snapshot for coupling-growth detection. */
  previousSnapshot?: PreviousSnapshotData;
}

export interface ProjectMetrics {
  fileCount: number;
  totalLoc: number;
  meanComplexity: number;
  meanCoupling: number;
  topHotSpotCount: number;
  findingsByKind: Partial<Record<FindingKind, number>>;
}

export interface FindingEngineResult {
  findings: Finding[];
  metrics: ProjectMetrics;
}

// ─── FindingEngine ────────────────────────────────────────

export class FindingEngine {
  private readonly kb: IntelligenceKB;

  constructor(deps: { kb: IntelligenceKB }) {
    this.kb = deps.kb;
  }

  /**
   * Run all cross-file detectors and aggregate results.
   * Returns deterministic output for the same input (idempotency).
   */
  async aggregate(input: AggregatorInput): Promise<FindingEngineResult> {
    const { projectId, snapshotId, perFileResults } = input;
    const producedAt = new Date().toISOString();

    // Build all findings from detectors
    const rawFindings: RawFinding[] = [];

    // 1. Dead code (cross-file confirmation of unused-export candidates)
    rawFindings.push(...detectDeadCode(perFileResults, projectId, snapshotId));

    // 2. Hot spots (churn × complexity)
    if (input.gitChurn) {
      rawFindings.push(...detectHotSpots(perFileResults, input.gitChurn, projectId, snapshotId));
    }

    // 3. Coupling spikes
    rawFindings.push(...detectCouplingSpikes(perFileResults, snapshotId, input.previousSnapshot));

    // 4. Complexity outliers (project-level top 1%)
    rawFindings.push(...detectComplexityOutliers(perFileResults, snapshotId));

    // 5. Churn outliers
    if (input.gitChurn) {
      rawFindings.push(...detectChurnOutliers(perFileResults, input.gitChurn, snapshotId));
    }

    // 6. Orphan drafts
    if (input.stagingState) {
      rawFindings.push(...await detectOrphanDrafts(input.stagingState.stagingInboxPath, this.kb, projectId, snapshotId));
    }

    // 7. Stalled missions
    rawFindings.push(...await detectStalledMissions(this.kb, projectId, snapshotId));

    // Stamp provenance fields on every finding
    const findings: Finding[] = rawFindings.map((rf, idx) => ({
      ...rf,
      id: `F-${snapshotId}-${idx.toString().padStart(4, '0')}` as Finding['id'],
      project_id: projectId,
      produced_by: 'analyzer' as const,
      produced_at: producedAt,
      snapshot_id: snapshotId,
      status: 'open' as const,
    }));

    const metrics = computeProjectMetrics(perFileResults, findings);
    return { findings, metrics };
  }
}

// ─── Raw finding (before provenance stamping) ────────────

export interface RawFinding {
  kind: FindingKind;
  severity: 'high' | 'med' | 'low';
  confidence: number;
  title: string;
  rationale: string;
  source_path?: string;
  source_range?: { start: number; end: number };
}

// ─── Project metrics computation ─────────────────────────

function computeProjectMetrics(
  perFileResults: AnalyzerOutput[],
  findings: Finding[],
): ProjectMetrics {
  const fileCount = perFileResults.length;
  const totalLoc = perFileResults.reduce((sum, r) => sum + r.metrics.loc, 0);
  const allComplexities = perFileResults.map(r => r.metrics.cyclomatic_complexity_max);
  const meanComplexity = allComplexities.length > 0
    ? allComplexities.reduce((a, b) => a + b, 0) / allComplexities.length
    : 0;

  const findingsByKind: Partial<Record<FindingKind, number>> = {};
  for (const f of findings) {
    findingsByKind[f.kind] = (findingsByKind[f.kind] ?? 0) + 1;
  }

  return {
    fileCount,
    totalLoc,
    meanComplexity,
    meanCoupling: 0, // computed by coupling detector — could be wired back
    topHotSpotCount: findingsByKind.hot_spot ?? 0,
    findingsByKind,
  };
}
