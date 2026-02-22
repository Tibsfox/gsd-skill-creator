/**
 * Unit tests for project.* gateway tools.
 *
 * Tests project discovery, detail retrieval, creation, and phase
 * execution triggering against temp directories with mock GSD structures.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  discoverProjects,
  getProjectDetails,
  createProject,
  triggerPhaseExecution,
  type ProjectSummary,
} from './project-tools.js';

// ── Helpers ─────────────────────────────────────────────────────────────

let tempDir: string;

/** Create a mock GSD project in the temp directory. */
async function createMockProject(
  root: string,
  name: string,
  options?: {
    roadmapContent?: string;
    projectContent?: string;
    stateContent?: string;
    phaseCount?: number;
  },
): Promise<string> {
  const projectDir = join(root, name);
  const planningDir = join(projectDir, '.planning');
  const phasesDir = join(planningDir, 'phases');
  await mkdir(phasesDir, { recursive: true });

  const projectMd = options?.projectContent ?? `# ${name}\n\n## What This Is\nA test project.\n\n## Core Value\nTesting.`;
  await writeFile(join(planningDir, 'PROJECT.md'), projectMd);

  const phaseCount = options?.phaseCount ?? 3;
  const phases = Array.from({ length: phaseCount }, (_, i) => `- [ ] Phase ${i + 1}: Task ${i + 1}`).join('\n');
  const roadmap = options?.roadmapContent ?? `# Roadmap\n\n## Phases\n\n${phases}\n\n## Progress\n\n| Phase | Status |\n|-------|--------|\n| 1 | In progress |\n`;
  await writeFile(join(planningDir, 'ROADMAP.md'), roadmap);

  const state = options?.stateContent ?? `# State\n\n## Current Position\n\nPhase: 1\nStatus: In progress\n`;
  await writeFile(join(planningDir, 'STATE.md'), state);

  return projectDir;
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('Project Tools', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'project-tools-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // ── discoverProjects ────────────────────────────────────────────────

  describe('discoverProjects', () => {
    it('returns empty array for empty directory', async () => {
      const projects = await discoverProjects(tempDir);
      expect(projects).toEqual([]);
    });

    it('discovers a single GSD project', async () => {
      await createMockProject(tempDir, 'my-project');
      const projects = await discoverProjects(tempDir);
      expect(projects).toHaveLength(1);
      expect(projects[0]!.name).toBe('my-project');
    });

    it('discovers multiple projects', async () => {
      await createMockProject(tempDir, 'alpha');
      await createMockProject(tempDir, 'beta');
      await createMockProject(tempDir, 'gamma');
      const projects = await discoverProjects(tempDir);
      expect(projects).toHaveLength(3);
      const names = projects.map((p) => p.name).sort();
      expect(names).toEqual(['alpha', 'beta', 'gamma']);
    });

    it('ignores directories without .planning/ROADMAP.md', async () => {
      await mkdir(join(tempDir, 'not-a-project'));
      await createMockProject(tempDir, 'real-project');
      const projects = await discoverProjects(tempDir);
      expect(projects).toHaveLength(1);
      expect(projects[0]!.name).toBe('real-project');
    });

    it('returns phaseCount from roadmap', async () => {
      await createMockProject(tempDir, 'counted', { phaseCount: 5 });
      const projects = await discoverProjects(tempDir);
      expect(projects[0]!.phaseCount).toBe(5);
    });

    it('returns lastActivity from STATE.md mtime', async () => {
      await createMockProject(tempDir, 'active');
      const projects = await discoverProjects(tempDir);
      expect(projects[0]!.lastActivity).toBeTypeOf('string');
      // Should be a valid ISO date string
      expect(new Date(projects[0]!.lastActivity).getTime()).toBeGreaterThan(0);
    });

    it('returns status from roadmap', async () => {
      await createMockProject(tempDir, 'with-status');
      const projects = await discoverProjects(tempDir);
      expect(projects[0]!.status).toBeTypeOf('string');
    });
  });

  // ── getProjectDetails ───────────────────────────────────────────────

  describe('getProjectDetails', () => {
    it('returns full project details', async () => {
      const projectDir = await createMockProject(tempDir, 'detailed');
      const details = await getProjectDetails(projectDir);
      expect(details.name).toBe('detailed');
      expect(details.config).toBeDefined();
      expect(details.roadmap).toBeTypeOf('string');
      expect(details.state).toBeTypeOf('string');
    });

    it('returns config parsed from PROJECT.md', async () => {
      const projectDir = await createMockProject(tempDir, 'configured', {
        projectContent: '# My Configured Project\n\n## Core Value\nBe awesome.\n\n## What This Is\nA configured test.',
      });
      const details = await getProjectDetails(projectDir);
      expect(details.config?.name).toBe('My Configured Project');
      expect(details.config?.coreValue).toBe('Be awesome.');
    });

    it('returns null config when PROJECT.md is missing', async () => {
      const projectDir = join(tempDir, 'no-project-md');
      const planningDir = join(projectDir, '.planning');
      await mkdir(planningDir, { recursive: true });
      await writeFile(join(planningDir, 'ROADMAP.md'), '# Roadmap\n');
      await writeFile(join(planningDir, 'STATE.md'), '# State\n');
      const details = await getProjectDetails(projectDir);
      expect(details.config).toBeNull();
    });

    it('returns deliverables from completed plan summaries', async () => {
      const projectDir = await createMockProject(tempDir, 'delivered');
      // Create a phase directory with a summary
      const phaseDir = join(projectDir, '.planning', 'phases', '01-foundation');
      await mkdir(phaseDir, { recursive: true });
      await writeFile(join(phaseDir, '01-01-SUMMARY.md'), '---\nphase: 1\nplan: 1\n---\n# Summary\nDelivered X.');
      const details = await getProjectDetails(projectDir);
      expect(details.deliverables).toHaveLength(1);
      expect(details.deliverables[0]).toContain('01-01-SUMMARY.md');
    });
  });

  // ── createProject ───────────────────────────────────────────────────

  describe('createProject', () => {
    it('creates a new project with .planning structure', async () => {
      const result = await createProject(tempDir, 'new-project', 'Build something great');
      expect(result.created).toBe(true);
      expect(result.name).toBe('new-project');
      expect(result.path).toContain('new-project');

      // Verify project is discoverable
      const projects = await discoverProjects(tempDir);
      expect(projects).toHaveLength(1);
      expect(projects[0]!.name).toBe('new-project');
    });

    it('rejects duplicate project names', async () => {
      await createProject(tempDir, 'existing', 'First');
      const result = await createProject(tempDir, 'existing', 'Second');
      expect(result.created).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('writes vision content to PROJECT.md', async () => {
      await createProject(tempDir, 'visionary', 'My vision document content');
      const details = await getProjectDetails(join(tempDir, 'visionary'));
      expect(details.config?.name).toBe('visionary');
    });
  });

  // ── triggerPhaseExecution ───────────────────────────────────────────

  describe('triggerPhaseExecution', () => {
    it('returns acknowledgment for valid project and phase', async () => {
      await createMockProject(tempDir, 'executable', { phaseCount: 3 });
      const result = await triggerPhaseExecution(tempDir, 'executable', 1);
      expect(result.triggered).toBe(true);
      expect(result.project).toBe('executable');
      expect(result.phase).toBe(1);
      expect(result.status).toBe('queued');
    });

    it('returns error for nonexistent project', async () => {
      const result = await triggerPhaseExecution(tempDir, 'nonexistent', 1);
      expect(result.triggered).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns error for invalid phase number', async () => {
      await createMockProject(tempDir, 'limited', { phaseCount: 2 });
      const result = await triggerPhaseExecution(tempDir, 'limited', 99);
      expect(result.triggered).toBe(false);
      expect(result.error).toContain('phase');
    });
  });
});
