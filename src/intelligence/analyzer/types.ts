/**
 * Analyzer pipeline — type surface.
 *
 * Consumed by C01 (core), C02 (language analyzers), C03 (finding engine).
 * Module-boundary: MUST NOT import from @tauri-apps/api, desktop/, or any webview surface (D-22-18).
 */

import type { FindingKind, IntelligenceKB } from '../types.js';

// ─── Per-file analyzer input/output ──────────────────────

export interface AnalyzerInput {
  /** Absolute path to the file. */
  filePath: string;
  language: Language;
  /** UTF-8 source text. */
  source: string;
  /** Tree-sitter parse tree; populated by the language analyzer, absent on entry. */
  ast?: unknown;
  gitMetadata?: {
    /** ISO-8601 timestamp. */
    last_modified: string;
    commit_count: number;
    author_count: number;
  };
}

export interface AnalyzerOutput {
  filePath: string;
  parseStatus: 'ok' | 'failed' | 'skipped';
  parseError?: string;
  findings: AnalyzerFinding[];
  metrics: AnalyzerMetrics;
}

export interface AnalyzerFinding {
  kind: FindingKind | 'parse_failed' | 'unused_export' | 'unused_import' | 'large_file';
  severity: 'high' | 'med' | 'low';
  /** 0..1 inclusive. */
  confidence: number;
  title: string;
  rationale: string;
  source_range?: { start: number; end: number };
}

export interface AnalyzerMetrics {
  loc: number;
  functions: number;
  exports: number;
  cyclomatic_complexity_mean: number;
  cyclomatic_complexity_max: number;
}

// ─── Supported languages ─────────────────────────────────

export type Language =
  | 'typescript'
  | 'tsx'
  | 'javascript'
  | 'jsx'
  | 'rust'
  | 'python'
  | 'bash'
  | 'glsl';

// ─── Language analyzer contract ──────────────────────────

export interface LanguageAnalyzer {
  language: Language;
  /** Pure: no I/O. All required data comes through AnalyzerInput (D-22-11). */
  analyze(input: AnalyzerInput): Promise<AnalyzerOutput>;
}

// ─── Core scan options + result ──────────────────────────

export interface ScanOptions {
  projectPath: string;
  projectId: string;
  /** Default: 4. Capped at os.cpus().length (D-22-10). */
  parallelism?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  /** Invoked every 100 files. */
  reportProgress?: (done: number, total: number) => void;
}

export interface ScanResult {
  snapshotId: string;
  filesScanned: number;
  filesSkipped: number;
  filesFailed: number;
  findingsTotal: number;
  durationMs: number;
}

// ─── AnalyzerCore class signature ────────────────────────

/**
 * Language-agnostic backbone: walk → detect → dispatch → snapshot lifecycle.
 * Real implementation in core.ts.
 */
export declare class AnalyzerCore {
  constructor(deps: {
    kb: IntelligenceKB;
    languageAnalyzers: LanguageAnalyzer[];
  });

  scan(opts: ScanOptions): Promise<ScanResult>;
}

// ─── Extended KB interface for analyzer snapshot writes ──

/**
 * Augmented KB surface that the analyzer needs but isn't in the public IntelligenceKB
 * (those write methods land in Phase 823 / C04). The analyzer tests mock this shape.
 */
export interface AnalyzerKB extends IntelligenceKB {
  /** Open a new snapshot for an atomic write batch (D-22-06). */
  beginSnapshot(snapshotId: string, projectId: string): Promise<void>;
  /** Write per-file output under the open snapshot. */
  writeFindings(snapshotId: string, projectId: string, output: AnalyzerOutput): Promise<void>;
  /** Finalize the snapshot — visible to downstream queries. */
  commitSnapshot(snapshotId: string): Promise<void>;
  /** Roll back the snapshot on error — no partial state remains. */
  rollbackSnapshot(snapshotId: string): Promise<void>;
}
