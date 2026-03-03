/**
 * DiagnosticsOrchestrator — the top-level entry point for Phase 45.
 *
 * Wires together:
 *  1. ConflictDetector  — find cross-dependency version range conflicts
 *  2. PythonCompatMatrix — build Python version compatibility matrix
 *  3. Classifier         — classify each HealthSignal (with conflict injection)
 *  4. SeverityScorer     — assign P0-P3 severity
 *
 * Returns a DiagnosisReport covering every dependency in the AuditSnapshot.
 */

import type { AuditSnapshot, RegistryHealth } from '../dependency-auditor/types.js';
import type {
  DiagnosisReport,
  DiagnosisResult,
  HealthClassification,
  SeverityLevel,
} from './types.js';
import { classifySignal } from './classifier.js';
import { buildCompatMatrix } from './python-compat-matrix.js';
import { detectConflicts } from './conflict-detector.js';
import { scoreSignal } from './severity-scorer.js';
import type { ConflictFinding } from './conflict-detector.js';

function emptyReport(): DiagnosisReport {
  return {
    results: [],
    pythonCompat: null,
    conflicts: [],
    summary: {
      total: 0,
      byClassification: {
        healthy: 0,
        aging: 0,
        stale: 0,
        abandoned: 0,
        vulnerable: 0,
        conflicting: 0,
      },
      byPriority: { P0: 0, P1: 0, P2: 0, P3: 0 },
    },
  };
}

export class DiagnosticsOrchestrator {
  /**
   * Diagnose all dependencies in an AuditSnapshot.
   *
   * Algorithm:
   * 1. detectConflicts(deps) → build a set of conflicting dep names
   * 2. buildCompatMatrix(signals) → python compat (if any pypi deps present)
   * 3. For each signal: inject _conflict marker → classify → score
   * 4. Build summary statistics
   */
  diagnose(snapshot: AuditSnapshot): DiagnosisReport {
    if (snapshot.signals.length === 0) return emptyReport();

    // Step 1: Detect conflicts
    const conflictFindings: ConflictFinding[] = detectConflicts(snapshot.dependencies);
    const conflictingNames = new Set(
      conflictFindings.flatMap((f) => [f.packageA, f.packageB]),
    );

    // Step 2: Python compat matrix (only when pypi deps exist)
    const hasPypi = snapshot.signals.some((s) => s.dependency.ecosystem === 'pypi');
    const pythonCompat = hasPypi ? buildCompatMatrix(snapshot.signals) : null;

    // Step 3: Classify and score each signal
    const results: DiagnosisResult[] = snapshot.signals.map((signal) => {
      // Inject _conflict marker so classifier can pick it up
      const signalWithConflict = conflictingNames.has(signal.dependency.name)
        ? {
            ...signal,
            registryHealth: {
              ...signal.registryHealth,
              _conflict: true,
            } as RegistryHealth & { _conflict?: boolean },
          }
        : signal;

      const diagnosed = classifySignal(signalWithConflict);
      const severity = scoreSignal(
        signalWithConflict,
        diagnosed.classification,
        conflictFindings,
      );

      return {
        ...diagnosed,
        severity,
      };
    });

    // Step 4: Build summary
    const byClassification = {
      healthy: 0,
      aging: 0,
      stale: 0,
      abandoned: 0,
      vulnerable: 0,
      conflicting: 0,
    } as Record<HealthClassification, number>;

    const byPriority = { P0: 0, P1: 0, P2: 0, P3: 0 } as Record<SeverityLevel, number>;

    for (const result of results) {
      byClassification[result.classification]++;
      byPriority[result.severity]++;
    }

    return {
      results,
      pythonCompat,
      conflicts: conflictFindings,
      summary: { total: results.length, byClassification, byPriority },
    };
  }
}
