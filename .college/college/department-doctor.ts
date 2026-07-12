/**
 * Department doctor -- read-only thin/stale coverage audit.
 *
 * Scores every department on three coverage dimensions -- concepts-per-wing,
 * try-session presence, and whether its `references/` directory carries real
 * material (vs. being `.gitkeep`-only or absent) -- flags departments below
 * configurable thresholds, and emits ranked fill proposals ("add N concepts
 * to wing X", "author a try-session"). It never writes: it only diagnoses and
 * proposes.
 *
 * The scoring and proposal-ranking core (`diagnoseDepartment`,
 * `buildDoctorReport`) is pure and takes plain audit inputs, so it can be
 * exercised against hand-built fixtures. `gatherAuditInputs` is the thin
 * filesystem adapter that turns a live CollegeLoader + departments path into
 * those inputs.
 *
 * @module college/department-doctor
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { DepartmentSummary } from './types.js';

// ─── Configuration ───────────────────────────────────────────────────────────

export interface DoctorThresholds {
  /** A wing with fewer than this many concepts is "thin". */
  minConceptsPerWing: number;
  /** A department with fewer than this many try-sessions is flagged. */
  minTrySessions: number;
  /** When true, a department whose references/ is empty/.gitkeep-only is flagged. */
  requirePopulatedReferences: boolean;
}

export const DEFAULT_THRESHOLDS: DoctorThresholds = {
  minConceptsPerWing: 3,
  minTrySessions: 1,
  requirePopulatedReferences: true,
};

// ─── Inputs & outputs ────────────────────────────────────────────────────────

/** State of a department's `references/` directory. */
export type ReferencesState = 'missing' | 'empty' | 'populated';

export interface WingCoverage {
  id: string;
  name: string;
  conceptCount: number;
}

/** Plain, filesystem-free description of one department's coverage. */
export interface DepartmentAuditInput {
  id: string;
  name: string;
  wings: WingCoverage[];
  trySessionCount: number;
  referencesState: ReferencesState;
}

export type ProposalKind = 'add-concepts' | 'author-try-session' | 'author-reference';

export interface FillProposal {
  departmentId: string;
  kind: ProposalKind;
  wingId?: string;
  message: string;
  /** Higher = more urgent. Drives global proposal ranking. */
  severity: number;
}

export interface DepartmentDiagnosis {
  id: string;
  name: string;
  wingCount: number;
  conceptCount: number;
  conceptsPerWing: number;
  trySessionCount: number;
  referencesState: ReferencesState;
  /** 0..1 health, higher = healthier. */
  score: number;
  flags: string[];
  healthy: boolean;
  proposals: FillProposal[];
}

export interface DoctorReport {
  thresholds: DoctorThresholds;
  /** Diagnoses ranked worst-first (lowest score first, then id). */
  departments: DepartmentDiagnosis[];
  /** Every proposal across departments, ranked most-urgent first. */
  proposals: FillProposal[];
  flaggedCount: number;
}

// ─── Scoring weights ─────────────────────────────────────────────────────────

const W_CONCEPTS = 0.5;
const W_TRY = 0.25;
const W_REFS = 0.25;

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

// ─── Pure scoring core ───────────────────────────────────────────────────────

/**
 * Diagnose a single department against the thresholds. Pure: no I/O.
 */
export function diagnoseDepartment(
  input: DepartmentAuditInput,
  thresholds: DoctorThresholds = DEFAULT_THRESHOLDS,
): DepartmentDiagnosis {
  const wingCount = input.wings.length;
  const conceptCount = input.wings.reduce((acc, w) => acc + w.conceptCount, 0);
  const conceptsPerWing = wingCount > 0 ? round3(conceptCount / wingCount) : 0;

  const thinWings = input.wings.filter((w) => w.conceptCount < thresholds.minConceptsPerWing);
  const coverageScore = wingCount > 0 ? (wingCount - thinWings.length) / wingCount : 0;

  const tryScore =
    thresholds.minTrySessions <= 0
      ? 1
      : Math.min(1, input.trySessionCount / thresholds.minTrySessions);

  const refsPopulated = input.referencesState === 'populated';
  const refScore = thresholds.requirePopulatedReferences ? (refsPopulated ? 1 : 0) : 1;

  const score = round3(W_CONCEPTS * coverageScore + W_TRY * tryScore + W_REFS * refScore);

  const flags: string[] = [];
  const proposals: FillProposal[] = [];

  for (const w of thinWings) {
    const deficit = Math.max(1, thresholds.minConceptsPerWing - w.conceptCount);
    proposals.push({
      departmentId: input.id,
      kind: 'add-concepts',
      wingId: w.id,
      message: `add ${deficit} concept(s) to wing '${w.id}' (has ${w.conceptCount})`,
      severity: deficit,
    });
  }
  if (thinWings.length > 0) {
    flags.push(`${thinWings.length} thin wing(s)`);
  }

  if (input.trySessionCount < thresholds.minTrySessions) {
    flags.push(
      input.trySessionCount === 0 ? 'no try-sessions' : 'thin try-sessions',
    );
    proposals.push({
      departmentId: input.id,
      kind: 'author-try-session',
      message: `author a try-session (has ${input.trySessionCount})`,
      severity: 2,
    });
  }

  if (thresholds.requirePopulatedReferences && !refsPopulated) {
    flags.push(`references ${input.referencesState}`);
    proposals.push({
      departmentId: input.id,
      kind: 'author-reference',
      message: `author a deep reference (references/ is ${input.referencesState})`,
      severity: 1,
    });
  }

  return {
    id: input.id,
    name: input.name,
    wingCount,
    conceptCount,
    conceptsPerWing,
    trySessionCount: input.trySessionCount,
    referencesState: input.referencesState,
    score,
    flags,
    healthy: flags.length === 0,
    proposals,
  };
}

/**
 * Compare proposals for global ranking: most urgent first, then by department,
 * then by wing (department-wide proposals sort after wing-scoped ones).
 */
function compareProposals(a: FillProposal, b: FillProposal): number {
  if (b.severity !== a.severity) return b.severity - a.severity;
  if (a.departmentId !== b.departmentId) return a.departmentId < b.departmentId ? -1 : 1;
  const aw = a.wingId ?? '￿';
  const bw = b.wingId ?? '￿';
  if (aw !== bw) return aw < bw ? -1 : 1;
  return a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0;
}

/**
 * Diagnose a set of departments and assemble a ranked report. Pure: no I/O.
 * Departments are ranked worst-first; proposals are ranked most-urgent first.
 */
export function buildDoctorReport(
  inputs: DepartmentAuditInput[],
  thresholds: DoctorThresholds = DEFAULT_THRESHOLDS,
): DoctorReport {
  const departments = inputs
    .map((i) => diagnoseDepartment(i, thresholds))
    .sort((a, b) => (a.score !== b.score ? a.score - b.score : a.id < b.id ? -1 : 1));

  const proposals = departments.flatMap((d) => d.proposals).sort(compareProposals);
  const flaggedCount = departments.filter((d) => !d.healthy).length;

  return { thresholds, departments, proposals, flaggedCount };
}

// ─── Text rendering ──────────────────────────────────────────────────────────

/**
 * Render a doctor report as a human-readable advisory. Pure: no I/O.
 */
export function formatDoctorReport(report: DoctorReport): string {
  const { departments, proposals, flaggedCount } = report;
  if (departments.length === 0) {
    return 'No departments found to audit.';
  }

  const lines: string[] = [];
  lines.push(
    `Department doctor: ${flaggedCount}/${departments.length} department(s) flagged below thresholds`,
  );
  lines.push(
    `Thresholds: >=${report.thresholds.minConceptsPerWing} concepts/wing, ` +
      `>=${report.thresholds.minTrySessions} try-session(s), ` +
      `references ${report.thresholds.requirePopulatedReferences ? 'required' : 'optional'}`,
  );
  lines.push('');

  for (const d of departments) {
    const mark = d.healthy ? 'ok  ' : 'FLAG';
    const detail = d.healthy ? '' : ` — ${d.flags.join('; ')}`;
    lines.push(
      `  [${mark}] ${d.id} (score ${d.score}) — ${d.wingCount} wings, ` +
        `${d.conceptCount} concepts (${d.conceptsPerWing}/wing), ` +
        `${d.trySessionCount} try-sessions, refs ${d.referencesState}${detail}`,
    );
  }

  if (proposals.length > 0) {
    lines.push('');
    lines.push(`Ranked fill proposals (${proposals.length}):`);
    for (const pr of proposals) {
      lines.push(`  ${pr.departmentId}: ${pr.message}`);
    }
  }

  return lines.join('\n');
}

// ─── Filesystem adapter ──────────────────────────────────────────────────────

/**
 * Classify a department's `references/` directory: 'missing' when there is no
 * directory, 'empty' when it holds nothing but a `.gitkeep` (or is empty), and
 * 'populated' when it carries real reference files.
 */
export function readReferencesState(departmentPath: string): ReferencesState {
  const refDir = join(departmentPath, 'references');
  if (!existsSync(refDir)) return 'missing';
  let entries: string[];
  try {
    entries = readdirSync(refDir);
  } catch {
    return 'missing';
  }
  const real = entries.filter((e) => e !== '.gitkeep' && !e.startsWith('.'));
  return real.length > 0 ? 'populated' : 'empty';
}

interface DoctorLoader {
  listDepartments(): string[];
  loadSummary(id: string): Promise<DepartmentSummary>;
  getDepartmentPath(id: string): string;
}

/**
 * Gather audit inputs from a live CollegeLoader. Reads each department's
 * summary (wings + concept counts + try-sessions) and inspects its
 * `references/` directory on disk. Read-only.
 */
export async function gatherAuditInputs(loader: DoctorLoader): Promise<DepartmentAuditInput[]> {
  const inputs: DepartmentAuditInput[] = [];
  for (const id of loader.listDepartments()) {
    let summary: DepartmentSummary;
    try {
      summary = await loader.loadSummary(id);
    } catch {
      continue;
    }
    let referencesState: ReferencesState = 'missing';
    try {
      referencesState = readReferencesState(loader.getDepartmentPath(id));
    } catch {
      referencesState = 'missing';
    }
    inputs.push({
      id: summary.id,
      name: summary.name,
      wings: summary.wings.map((w) => ({
        id: w.id,
        name: w.name,
        conceptCount: w.conceptCount,
      })),
      trySessionCount: summary.trySessions.length,
      referencesState,
    });
  }
  return inputs;
}

/**
 * Run the full audit against a live loader: gather + score + rank. Read-only.
 */
export async function runDepartmentDoctor(
  loader: DoctorLoader,
  thresholds: DoctorThresholds = DEFAULT_THRESHOLDS,
): Promise<DoctorReport> {
  const inputs = await gatherAuditInputs(loader);
  return buildDoctorReport(inputs, thresholds);
}
