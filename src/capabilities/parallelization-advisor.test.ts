/**
 * Tests for ParallelizationAdvisor service.
 *
 * Validates plan frontmatter parsing, file conflict detection, wave assignment
 * via topological sort with conservative defaults, rationale generation, and
 * directory-based convenience method using real temp directories.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  ParallelizationAdvisor,
  type PlanDependencyInfo,
  type WaveAssignment,
  type AdvisoryReport,
} from './parallelization-advisor.js';

describe('ParallelizationAdvisor', () => {
  let advisor: ParallelizationAdvisor;
  let baseDir: string;

  beforeEach(async () => {
    advisor = new ParallelizationAdvisor();
    baseDir = join(
      tmpdir(),
      `parallel-advisor-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await mkdir(baseDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  /**
   * Helper: create a PLAN.md file with given frontmatter fields.
   */
  async function createPlan(
    dir: string,
    filename: string,
    frontmatter: Record<string, unknown>,
    body: string = 'Plan content'
  ): Promise<string> {
    const lines: string[] = ['---'];
    for (const [key, value] of Object.entries(frontmatter)) {
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${JSON.stringify(item)}`);
        }
      } else if (value === null || value === undefined) {
        // skip
      } else {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      }
    }
    lines.push('---');
    lines.push(body);
    const filePath = join(dir, filename);
    await writeFile(filePath, lines.join('\n'), 'utf-8');
    return filePath;
  }

  // ==========================================================================
  // parsePlanFrontmatter
  // ==========================================================================

  describe('parsePlanFrontmatter', () => {
    it('parses valid plan and returns PlanDependencyInfo with correct fields', async () => {
      const planPath = await createPlan(baseDir, '61-01-PLAN.md', {
        phase: '61-parallelization-advisor',
        plan: '01',
        wave: 1,
        depends_on: [],
        files_modified: [
          'src/capabilities/parallelization-advisor.ts',
          'src/capabilities/parallelization-advisor.test.ts',
        ],
      });

      const result = await advisor.parsePlanFrontmatter(planPath);

      expect(result).not.toBeNull();
      expect(result!.planId).toBe('61-01');
      expect(result!.filesModified).toEqual([
        'src/capabilities/parallelization-advisor.ts',
        'src/capabilities/parallelization-advisor.test.ts',
      ]);
      expect(result!.dependsOn).toEqual([]);
      expect(result!.currentWave).toBe(1);
    });

    it('returns null for missing file', async () => {
      const result = await advisor.parsePlanFrontmatter(
        join(baseDir, 'nonexistent.md')
      );
      expect(result).toBeNull();
    });

    it('defaults files_modified to empty array when missing', async () => {
      const planPath = await createPlan(baseDir, '61-02-PLAN.md', {
        phase: '61-parallelization-advisor',
        plan: '02',
      });

      const result = await advisor.parsePlanFrontmatter(planPath);

      expect(result).not.toBeNull();
      expect(result!.filesModified).toEqual([]);
    });

    it('defaults depends_on to empty array when missing', async () => {
      const planPath = await createPlan(baseDir, '61-02-PLAN.md', {
        phase: '61-parallelization-advisor',
        plan: '02',
        files_modified: ['src/foo.ts'],
      });

      const result = await advisor.parsePlanFrontmatter(planPath);

      expect(result).not.toBeNull();
      expect(result!.dependsOn).toEqual([]);
    });

    it('defaults currentWave to null when wave is missing', async () => {
      const planPath = await createPlan(baseDir, '61-02-PLAN.md', {
        phase: '61-parallelization-advisor',
        plan: '02',
      });

      const result = await advisor.parsePlanFrontmatter(planPath);

      expect(result).not.toBeNull();
      expect(result!.currentWave).toBeNull();
    });
  });

  // ==========================================================================
  // buildFileConflictMap
  // ==========================================================================

  describe('buildFileConflictMap', () => {
    it('returns empty map when no overlapping files', () => {
      const plans: PlanDependencyInfo[] = [
        { planId: '61-01', filesModified: ['src/a.ts'], dependsOn: [], currentWave: null },
        { planId: '61-02', filesModified: ['src/b.ts'], dependsOn: [], currentWave: null },
      ];

      const result = advisor.buildFileConflictMap(plans);

      expect(result.size).toBe(0);
    });

    it('returns map entry with both plans when a file overlaps', () => {
      const plans: PlanDependencyInfo[] = [
        { planId: '61-01', filesModified: ['src/shared.ts', 'src/a.ts'], dependsOn: [], currentWave: null },
        { planId: '61-02', filesModified: ['src/shared.ts', 'src/b.ts'], dependsOn: [], currentWave: null },
      ];

      const result = advisor.buildFileConflictMap(plans);

      expect(result.size).toBe(1);
      expect(result.get('src/shared.ts')).toEqual(['61-01', '61-02']);
    });
  });

  // ==========================================================================
  // advise
  // ==========================================================================

  describe('advise', () => {
    it('assigns both plans to Wave 1 when independent (no file overlap, no depends_on)', async () => {
      const path1 = await createPlan(baseDir, '10-01-PLAN.md', {
        phase: '10-test',
        plan: '01',
        files_modified: ['src/a.ts'],
        depends_on: [],
      });
      const path2 = await createPlan(baseDir, '10-02-PLAN.md', {
        phase: '10-test',
        plan: '02',
        files_modified: ['src/b.ts'],
        depends_on: [],
      });

      const report = await advisor.advise([path1, path2]);

      expect(report.phaseId).toBe('10');
      expect(report.totalWaves).toBe(1);
      const wave1 = report.assignments.find(a => a.planId === '10-01');
      const wave2 = report.assignments.find(a => a.planId === '10-02');
      expect(wave1!.recommendedWave).toBe(1);
      expect(wave2!.recommendedWave).toBe(1);
    });

    it('assigns sequential waves when two plans share a file', async () => {
      const path1 = await createPlan(baseDir, '10-01-PLAN.md', {
        phase: '10-test',
        plan: '01',
        files_modified: ['src/shared.ts'],
        depends_on: [],
      });
      const path2 = await createPlan(baseDir, '10-02-PLAN.md', {
        phase: '10-test',
        plan: '02',
        files_modified: ['src/shared.ts'],
        depends_on: [],
      });

      const report = await advisor.advise([path1, path2]);

      expect(report.totalWaves).toBe(2);
      const a1 = report.assignments.find(a => a.planId === '10-01');
      const a2 = report.assignments.find(a => a.planId === '10-02');
      expect(a1!.recommendedWave).toBe(1);
      expect(a2!.recommendedWave).toBe(2);
    });

    it('assigns B to Wave 2 when B depends_on A', async () => {
      const path1 = await createPlan(baseDir, '10-01-PLAN.md', {
        phase: '10-test',
        plan: '01',
        files_modified: ['src/a.ts'],
        depends_on: [],
      });
      const path2 = await createPlan(baseDir, '10-02-PLAN.md', {
        phase: '10-test',
        plan: '02',
        files_modified: ['src/b.ts'],
        depends_on: ['10-01'],
      });

      const report = await advisor.advise([path1, path2]);

      expect(report.totalWaves).toBe(2);
      const a1 = report.assignments.find(a => a.planId === '10-01');
      const a2 = report.assignments.find(a => a.planId === '10-02');
      expect(a1!.recommendedWave).toBe(1);
      expect(a2!.recommendedWave).toBe(2);
    });

    it('assigns chain A->B->C to waves 1, 2, 3', async () => {
      const path1 = await createPlan(baseDir, '10-01-PLAN.md', {
        phase: '10-test',
        plan: '01',
        files_modified: ['src/a.ts'],
        depends_on: [],
      });
      const path2 = await createPlan(baseDir, '10-02-PLAN.md', {
        phase: '10-test',
        plan: '02',
        files_modified: ['src/b.ts'],
        depends_on: ['10-01'],
      });
      const path3 = await createPlan(baseDir, '10-03-PLAN.md', {
        phase: '10-test',
        plan: '03',
        files_modified: ['src/c.ts'],
        depends_on: ['10-02'],
      });

      const report = await advisor.advise([path1, path2, path3]);

      expect(report.totalWaves).toBe(3);
      expect(report.assignments.find(a => a.planId === '10-01')!.recommendedWave).toBe(1);
      expect(report.assignments.find(a => a.planId === '10-02')!.recommendedWave).toBe(2);
      expect(report.assignments.find(a => a.planId === '10-03')!.recommendedWave).toBe(3);
    });

    it('assigns diamond dependency correctly: A,B=Wave 1, C=Wave 2', async () => {
      const pathA = await createPlan(baseDir, '10-01-PLAN.md', {
        phase: '10-test',
        plan: '01',
        files_modified: ['src/a.ts'],
        depends_on: [],
      });
      const pathB = await createPlan(baseDir, '10-02-PLAN.md', {
        phase: '10-test',
        plan: '02',
        files_modified: ['src/b.ts'],
        depends_on: [],
      });
      const pathC = await createPlan(baseDir, '10-03-PLAN.md', {
        phase: '10-test',
        plan: '03',
        files_modified: ['src/c.ts'],
        depends_on: ['10-01', '10-02'],
      });

      const report = await advisor.advise([pathA, pathB, pathC]);

      expect(report.totalWaves).toBe(2);
      expect(report.assignments.find(a => a.planId === '10-01')!.recommendedWave).toBe(1);
      expect(report.assignments.find(a => a.planId === '10-02')!.recommendedWave).toBe(1);
      expect(report.assignments.find(a => a.planId === '10-03')!.recommendedWave).toBe(2);
    });

    it('assigns conservative sequential wave to plan with no files_modified and warns', async () => {
      const path1 = await createPlan(baseDir, '10-01-PLAN.md', {
        phase: '10-test',
        plan: '01',
        files_modified: ['src/a.ts'],
        depends_on: [],
      });
      const path2 = await createPlan(baseDir, '10-02-PLAN.md', {
        phase: '10-test',
        plan: '02',
        depends_on: [],
        // no files_modified
      });

      const report = await advisor.advise([path1, path2]);

      const a2 = report.assignments.find(a => a.planId === '10-02');
      expect(a2!.recommendedWave).toBe(2);
      expect(a2!.rationale).toContain('Conservative');

      const warnings = report.warnings;
      expect(warnings.some(w => w.includes('10-02') && w.includes('files_modified'))).toBe(true);
    });

    it('generates rationale strings matching expected patterns', async () => {
      // Independent plan
      const pathA = await createPlan(baseDir, '10-01-PLAN.md', {
        phase: '10-test',
        plan: '01',
        files_modified: ['src/a.ts'],
        depends_on: [],
      });
      // Dependent plan
      const pathB = await createPlan(baseDir, '10-02-PLAN.md', {
        phase: '10-test',
        plan: '02',
        files_modified: ['src/b.ts'],
        depends_on: ['10-01'],
      });
      // File conflict plan
      const pathC = await createPlan(baseDir, '10-03-PLAN.md', {
        phase: '10-test',
        plan: '03',
        files_modified: ['src/a.ts'],
        depends_on: [],
      });

      const report = await advisor.advise([pathA, pathB, pathC]);

      const ratA = report.assignments.find(a => a.planId === '10-01')!.rationale;
      const ratB = report.assignments.find(a => a.planId === '10-02')!.rationale;
      const ratC = report.assignments.find(a => a.planId === '10-03')!.rationale;

      expect(ratA).toContain('Independent');
      expect(ratB).toContain('Depends on');
      expect(ratC).toContain('File conflict');
    });

    it('populates fileConflicts correctly', async () => {
      const path1 = await createPlan(baseDir, '10-01-PLAN.md', {
        phase: '10-test',
        plan: '01',
        files_modified: ['src/shared.ts', 'src/a.ts'],
        depends_on: [],
      });
      const path2 = await createPlan(baseDir, '10-02-PLAN.md', {
        phase: '10-test',
        plan: '02',
        files_modified: ['src/shared.ts', 'src/b.ts'],
        depends_on: [],
      });

      const report = await advisor.advise([path1, path2]);

      expect(report.fileConflicts.length).toBe(1);
      expect(report.fileConflicts[0].file).toBe('src/shared.ts');
      expect(report.fileConflicts[0].plans).toEqual(['10-01', '10-02']);
    });

    it('generates warning when current wave differs from recommended', async () => {
      const path1 = await createPlan(baseDir, '10-01-PLAN.md', {
        phase: '10-test',
        plan: '01',
        wave: 3,  // currently wave 3
        files_modified: ['src/a.ts'],
        depends_on: [],
      });

      const report = await advisor.advise([path1]);

      const a1 = report.assignments.find(a => a.planId === '10-01');
      expect(a1!.recommendedWave).toBe(1);
      expect(a1!.currentWave).toBe(3);
      expect(report.warnings.some(w => w.includes('10-01') && w.includes('wave'))).toBe(true);
    });
  });

  // ==========================================================================
  // adviseFromDirectory
  // ==========================================================================

  describe('adviseFromDirectory', () => {
    it('reads plans from directory and produces report', async () => {
      await createPlan(baseDir, '10-01-PLAN.md', {
        phase: '10-test',
        plan: '01',
        files_modified: ['src/a.ts'],
        depends_on: [],
      });
      await createPlan(baseDir, '10-02-PLAN.md', {
        phase: '10-test',
        plan: '02',
        files_modified: ['src/b.ts'],
        depends_on: [],
      });
      // Non-plan file should be ignored
      await writeFile(join(baseDir, 'README.md'), '# Phase docs', 'utf-8');

      const report = await advisor.adviseFromDirectory(baseDir);

      expect(report.phaseId).toBe('10');
      expect(report.assignments.length).toBe(2);
      expect(report.totalWaves).toBe(1);
    });
  });
});
