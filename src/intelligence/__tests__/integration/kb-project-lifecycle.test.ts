/**
 * Phase 826 / C13 — I1: KB project lifecycle round-trip
 *
 * Register project → begin snapshot → write findings → commit snapshot →
 * list findings. Full end-to-end through KBStore using real SQLite.
 *
 * Phase 826 / D-26-19.
 */

import { describe, it, expect } from 'vitest';
import { createTestKB } from '../_harness/kb-factory.js';
import type { Finding, SnapshotId, ProjectId } from '../../types.js';

describe('I1: KB project lifecycle round-trip', () => {
  it('registers a project, writes findings under a snapshot, reads them back', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const project = await kb.registerProject({
        id: 'proj-lifecycle-test' as ProjectId,
        name: 'Lifecycle Test',
        path: `${kbHandle.projectDir}/lifecycle`, // unique subpath
        branch: 'main',
        kind: 'code',
        priority: 'high',
        last_activity_at: new Date().toISOString(),
      });
      expect(project.id).toBe('proj-lifecycle-test');

      const snapshotId: SnapshotId = 'S-lifecycle-001';
      await kb.beginSnapshot(snapshotId, 'proj-lifecycle-test');
      await kb.writeFindings(snapshotId, 'proj-lifecycle-test', [
        {
          id: 'F-001' as `F-${string}`,
          project_id: 'proj-lifecycle-test',
          kind: 'hot_spot',
          severity: 'high',
          confidence: 0.9,
          title: 'Hot spot in utils',
          rationale: 'High cyclomatic complexity',
          source_path: 'src/utils.ts',
          produced_by: 'analyzer',
          produced_at: new Date().toISOString(),
          snapshot_id: snapshotId,
          status: 'open',
        } satisfies Finding,
        {
          id: 'F-002' as `F-${string}`,
          project_id: 'proj-lifecycle-test',
          kind: 'dead_code',
          severity: 'low',
          confidence: 0.7,
          title: 'Unused export',
          rationale: 'Never imported',
          produced_by: 'analyzer',
          produced_at: new Date().toISOString(),
          snapshot_id: snapshotId,
          status: 'open',
        } satisfies Finding,
      ]);
      await kb.commitSnapshot(snapshotId);

      const findings = await kb.listOpenFindings('proj-lifecycle-test');
      expect(findings.length).toBeGreaterThanOrEqual(2);
      const ids = findings.map((f) => f.id);
      expect(ids).toContain('F-001');
      expect(ids).toContain('F-002');
      expect(findings.find((f) => f.id === 'F-001')?.kind).toBe('hot_spot');
    } finally {
      kbHandle.cleanup();
    }
  });

  it('getProject returns the registered project', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      await kb.registerProject({
        id: 'proj-get-test' as ProjectId,
        name: 'Get Test',
        path: `${kbHandle.projectDir}/get-test`,
        branch: 'dev',
        kind: 'planning',
        priority: 'med',
        last_activity_at: new Date().toISOString(),
      });

      const retrieved = await kb.getProject('proj-get-test');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Get Test');
      expect(retrieved?.kind).toBe('planning');
    } finally {
      kbHandle.cleanup();
    }
  });

  it('listProjects returns all registered projects', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      for (let i = 0; i < 3; i++) {
        await kb.registerProject({
          id: `proj-list-${i}` as ProjectId,
          name: `List Test ${i}`,
          path: `${kbHandle.projectDir}/sub-${i}`, // unique path per project
          branch: 'main',
          kind: 'code',
          priority: 'low',
          last_activity_at: new Date().toISOString(),
        });
      }

      const projects = await kb.listProjects();
      const ids = projects.map((p) => p.id);
      expect(ids).toContain('proj-list-0');
      expect(ids).toContain('proj-list-1');
      expect(ids).toContain('proj-list-2');
    } finally {
      kbHandle.cleanup();
    }
  });
});
