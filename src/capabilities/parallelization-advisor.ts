/**
 * ParallelizationAdvisor service.
 *
 * Analyzes plan frontmatter (files_modified, depends_on) to produce
 * wave-based parallelization recommendations with conservative defaults
 * and rationale strings. Output is advisory only -- recommendations
 * with explanations, never automatic changes.
 *
 * Algorithm:
 * 1. Parse plan frontmatter to extract dependency info
 * 2. Build file conflict map (files touched by 2+ plans)
 * 3. Use modified Kahn's algorithm for topological wave assignment
 * 4. Conservative default: plans without files_modified get sequential waves
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';

// ============================================================================
// Types
// ============================================================================

/**
 * Parsed dependency information from a plan's frontmatter.
 */
export interface PlanDependencyInfo {
  planId: string;
  filesModified: string[];
  dependsOn: string[];
  currentWave: number | null;
}

/**
 * A recommended wave assignment for a single plan.
 */
export interface WaveAssignment {
  planId: string;
  recommendedWave: number;
  currentWave: number | null;
  rationale: string;
}

/**
 * The full advisory report for a set of plans.
 */
export interface AdvisoryReport {
  phaseId: string;
  assignments: WaveAssignment[];
  totalWaves: number;
  warnings: string[];
  fileConflicts: Array<{ file: string; plans: string[] }>;
}

// ============================================================================
// Service
// ============================================================================

/**
 * Stateless service that analyzes plan dependencies and recommends
 * wave-based parallel execution assignments.
 */
export class ParallelizationAdvisor {
  /**
   * Parse a plan's frontmatter to extract dependency information.
   *
   * @param planPath - Absolute path to a PLAN.md file
   * @returns PlanDependencyInfo or null if file cannot be read/parsed
   */
  async parsePlanFrontmatter(planPath: string): Promise<PlanDependencyInfo | null> {
    let raw: string;
    try {
      raw = await readFile(planPath, 'utf-8');
    } catch {
      return null;
    }

    try {
      const parsed = matter(raw);
      const data = parsed.data;

      const phase = String(data.phase ?? '').replace(/-.*$/, '');
      const plan = String(data.plan ?? '');
      const planId = `${phase}-${plan}`;

      const filesModified: string[] = Array.isArray(data.files_modified)
        ? data.files_modified.map(String)
        : [];

      const dependsOn: string[] = Array.isArray(data.depends_on)
        ? data.depends_on.map(String)
        : [];

      const currentWave: number | null =
        data.wave != null ? Number(data.wave) : null;

      return { planId, filesModified, dependsOn, currentWave };
    } catch {
      return null;
    }
  }

  /**
   * Build a map of files that appear in 2+ plans (actual conflicts).
   *
   * @param plans - Array of parsed plan dependency info
   * @returns Map where keys are conflicting file paths and values are plan IDs
   */
  buildFileConflictMap(plans: PlanDependencyInfo[]): Map<string, string[]> {
    const fileToPlans = new Map<string, string[]>();

    for (const plan of plans) {
      for (const file of plan.filesModified) {
        const existing = fileToPlans.get(file);
        if (existing) {
          existing.push(plan.planId);
        } else {
          fileToPlans.set(file, [plan.planId]);
        }
      }
    }

    // Only keep entries where file appears in 2+ plans
    const conflicts = new Map<string, string[]>();
    for (const [file, planIds] of fileToPlans) {
      if (planIds.length >= 2) {
        conflicts.set(file, planIds);
      }
    }

    return conflicts;
  }

  /**
   * Produce wave assignment recommendations for a set of plans.
   *
   * Uses topological sort with file conflict constraints:
   * - Plans with no depends_on and no file conflicts = Wave 1 candidates
   * - Plans depending on Wave N plans = Wave N+1 minimum
   * - Plans sharing files with Wave N plan = Wave N+1 minimum
   * - Conservative: no files_modified = sequential assignment
   *
   * @param planPaths - Array of absolute paths to PLAN.md files
   * @returns Advisory report with wave assignments, warnings, and conflicts
   */
  async advise(planPaths: string[]): Promise<AdvisoryReport> {
    // 1. Parse all plan frontmatter
    const plans: PlanDependencyInfo[] = [];
    for (const path of planPaths) {
      const info = await this.parsePlanFrontmatter(path);
      if (info) {
        plans.push(info);
      }
    }

    // Sort by planId for determinism
    plans.sort((a, b) => a.planId.localeCompare(b.planId));

    // 2. Build file conflict map
    const conflictMap = this.buildFileConflictMap(plans);

    // 3. Identify conservative plans (no files_modified, no depends_on)
    const conservativePlanIds = new Set<string>();
    for (const plan of plans) {
      if (plan.filesModified.length === 0 && plan.dependsOn.length === 0) {
        conservativePlanIds.add(plan.planId);
      }
    }

    // 4. Build adjacency list from depends_on
    const dependencyEdges = new Map<string, Set<string>>(); // planId -> set of plans it depends on
    for (const plan of plans) {
      dependencyEdges.set(plan.planId, new Set(plan.dependsOn));
    }

    // 5. Build file conflict edges (later-numbered plan depends on earlier-numbered plan)
    const fileConflictEdges = new Map<string, Set<string>>();
    for (const plan of plans) {
      fileConflictEdges.set(plan.planId, new Set());
    }
    for (const [, planIds] of conflictMap) {
      // Sort by planId to get deterministic ordering (earlier plan ID = earlier wave)
      const sorted = [...planIds].sort();
      for (let i = 1; i < sorted.length; i++) {
        // Each later plan depends on the one just before it in sorted order
        fileConflictEdges.get(sorted[i])?.add(sorted[i - 1]);
      }
    }

    // 6. Compute wave assignments using modified Kahn's algorithm
    const waveMap = new Map<string, number>();
    const rationales = new Map<string, string>();
    const planIdSet = new Set(plans.map(p => p.planId));

    // Merge all edges: dependency + file conflict
    const allDeps = new Map<string, Set<string>>();
    for (const plan of plans) {
      const deps = new Set<string>();
      const depEdges = dependencyEdges.get(plan.planId) ?? new Set();
      const fileEdges = fileConflictEdges.get(plan.planId) ?? new Set();
      for (const d of depEdges) {
        if (planIdSet.has(d)) deps.add(d);
      }
      for (const d of fileEdges) {
        if (planIdSet.has(d)) deps.add(d);
      }
      allDeps.set(plan.planId, deps);
    }

    // Track which kind of constraint determined wave
    const constraintType = new Map<string, 'independent' | 'depends' | 'file-conflict' | 'conservative'>();

    // BFS topological sort by layers
    const inDegree = new Map<string, number>();
    for (const plan of plans) {
      inDegree.set(plan.planId, allDeps.get(plan.planId)!.size);
    }

    let currentWave = 1;
    const assigned = new Set<string>();

    while (assigned.size < plans.length) {
      // Find all plans with in-degree 0 (all deps satisfied)
      const candidates: string[] = [];
      for (const plan of plans) {
        if (!assigned.has(plan.planId) && inDegree.get(plan.planId) === 0) {
          candidates.push(plan.planId);
        }
      }

      if (candidates.length === 0) {
        // Circular dependency -- assign remaining to next wave
        for (const plan of plans) {
          if (!assigned.has(plan.planId)) {
            waveMap.set(plan.planId, currentWave);
            constraintType.set(plan.planId, 'independent');
            assigned.add(plan.planId);
          }
        }
        break;
      }

      for (const planId of candidates) {
        // Conservative plans get sequential assignment
        if (conservativePlanIds.has(planId)) {
          // Don't assign yet -- handle after non-conservative plans
          continue;
        }

        waveMap.set(planId, currentWave);
        assigned.add(planId);

        // Determine constraint type
        const depEdges = dependencyEdges.get(planId) ?? new Set();
        const fileEdges = fileConflictEdges.get(planId) ?? new Set();
        if (depEdges.size > 0 && [...depEdges].some(d => planIdSet.has(d))) {
          constraintType.set(planId, 'depends');
        } else if (fileEdges.size > 0) {
          constraintType.set(planId, 'file-conflict');
        } else {
          constraintType.set(planId, 'independent');
        }
      }

      // Handle conservative plans: assign them sequentially after all non-conservative in this wave
      const conservativeCandidates = candidates.filter(
        id => conservativePlanIds.has(id) && !assigned.has(id)
      );

      // If only conservative candidates remain in this round but nothing was assigned,
      // we must assign them to avoid infinite loop
      if (conservativeCandidates.length > 0) {
        // Assign each conservative plan to incrementing waves starting after current
        // But first: if no non-conservative were assigned this wave, start at currentWave
        const baseWave = assigned.size === 0 ? currentWave :
          (candidates.some(c => !conservativePlanIds.has(c) && assigned.has(c)) ? currentWave + 1 : currentWave);

        let conservativeWave = baseWave;
        for (const planId of conservativeCandidates) {
          // Find the max wave of any already-assigned plan (to be safe, go after them)
          const maxAssignedWave = Math.max(currentWave, ...[...waveMap.values()]);
          conservativeWave = Math.max(conservativeWave, maxAssignedWave + 1);
          waveMap.set(planId, conservativeWave);
          constraintType.set(planId, 'conservative');
          assigned.add(planId);
          conservativeWave++;
        }
      }

      // Update in-degree: remove edges from assigned plans
      for (const plan of plans) {
        if (!assigned.has(plan.planId)) {
          const deps = allDeps.get(plan.planId)!;
          let remaining = 0;
          for (const d of deps) {
            if (!assigned.has(d)) remaining++;
          }
          inDegree.set(plan.planId, remaining);
        }
      }

      currentWave++;
    }

    // 7. Generate rationale strings
    for (const plan of plans) {
      const type = constraintType.get(plan.planId);
      const wave = waveMap.get(plan.planId)!;

      switch (type) {
        case 'independent':
          rationales.set(plan.planId, 'Independent: no file conflicts or dependencies');
          break;
        case 'depends': {
          const depEdges = dependencyEdges.get(plan.planId) ?? new Set();
          const depList = [...depEdges]
            .filter(d => planIdSet.has(d))
            .map(d => `${d} (wave ${waveMap.get(d)})`)
            .join(', ');
          rationales.set(plan.planId, `Depends on ${depList}`);
          break;
        }
        case 'file-conflict': {
          const fileEdges = fileConflictEdges.get(plan.planId) ?? new Set();
          // Find which files caused the conflict
          const conflictFiles: string[] = [];
          for (const [file, planIds] of conflictMap) {
            if (planIds.includes(plan.planId)) {
              const others = planIds.filter(p => fileEdges.has(p));
              if (others.length > 0) {
                conflictFiles.push(`${others[0]} on ${file}`);
              }
            }
          }
          const detail = conflictFiles.length > 0 ? conflictFiles[0] : 'shared files';
          rationales.set(plan.planId, `File conflict with ${detail}: must be sequential`);
          break;
        }
        case 'conservative':
          rationales.set(plan.planId, 'Conservative: no files_modified declared, assuming sequential');
          break;
        default:
          rationales.set(plan.planId, 'Unknown constraint');
      }
    }

    // 8. Generate warnings
    const warnings: string[] = [];

    // Plans with empty files_modified
    for (const plan of plans) {
      if (plan.filesModified.length === 0) {
        warnings.push(`Plan ${plan.planId} has no files_modified: cannot verify independence`);
      }
    }

    // Wave changes from current assignments
    for (const plan of plans) {
      const recommended = waveMap.get(plan.planId)!;
      if (plan.currentWave !== null && plan.currentWave !== recommended) {
        warnings.push(
          `Plan ${plan.planId} current wave ${plan.currentWave} differs from recommended wave ${recommended}`
        );
      }
    }

    // 9. Build assignments
    const assignments: WaveAssignment[] = plans.map(plan => ({
      planId: plan.planId,
      recommendedWave: waveMap.get(plan.planId)!,
      currentWave: plan.currentWave,
      rationale: rationales.get(plan.planId)!,
    }));

    // 10. Build file conflicts array
    const fileConflicts: Array<{ file: string; plans: string[] }> = [];
    for (const [file, planIds] of conflictMap) {
      fileConflicts.push({ file, plans: planIds });
    }
    fileConflicts.sort((a, b) => a.file.localeCompare(b.file));

    // 11. Derive phaseId from first plan
    const phaseId = plans.length > 0
      ? plans[0].planId.replace(/-\d+$/, '')
      : 'unknown';

    // 12. Compute totalWaves
    const totalWaves = assignments.length > 0
      ? Math.max(...assignments.map(a => a.recommendedWave))
      : 0;

    return {
      phaseId,
      assignments,
      totalWaves,
      warnings,
      fileConflicts,
    };
  }

  /**
   * Convenience method: scan a directory for PLAN.md files and advise.
   *
   * @param phaseDir - Absolute path to a phase directory
   * @returns Advisory report for all plans found
   */
  async adviseFromDirectory(phaseDir: string): Promise<AdvisoryReport> {
    const entries = await readdir(phaseDir);
    const planFiles = entries
      .filter(e => e.endsWith('-PLAN.md'))
      .sort()
      .map(e => join(phaseDir, e));

    return this.advise(planFiles);
  }
}
