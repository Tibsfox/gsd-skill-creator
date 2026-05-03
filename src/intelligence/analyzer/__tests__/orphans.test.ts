/**
 * C03 T7 — Orphan draft detection tests.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectOrphanDrafts } from '../findings/orphans.js';
import type { IntelligenceKB } from '../../types.js';

// Minimal KB stub
const kbStub = {
  listProjects: () => Promise.reject(new Error('stub')),
  getProject: () => Promise.reject(new Error('stub')),
  getCurrentBriefing: () => Promise.reject(new Error('stub')),
  listOpenFindings: () => Promise.reject(new Error('stub')),
  listInFlightWork: () => Promise.reject(new Error('stub')),
  listMeetings: () => Promise.reject(new Error('stub')),
  startMeeting: () => Promise.reject(new Error('stub')),
  addDecision: () => Promise.reject(new Error('stub')),
  promoteToSendNow: () => Promise.reject(new Error('stub')),
  commitBundle: () => Promise.reject(new Error('stub')),
  parkMeeting: () => Promise.reject(new Error('stub')),
  dismissFinding: () => Promise.reject(new Error('stub')),
} as IntelligenceKB;

describe('detectOrphanDrafts', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = join(tmpdir(), `orphan-test-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('meta.json older than 14 days with no bundle → orphan_draft finding', async () => {
    const visionDir = join(tmpDir, 'old-vision');
    await mkdir(visionDir, { recursive: true });

    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const meta = {
      request_id: 'req-old-1',
      kind: 'mission_seed',
      provenance: {
        developer_approved_at: fifteenDaysAgo,
      },
      bundle_id: null, // never bundled
    };
    await writeFile(join(visionDir, 'vision.md'), '# Old Vision\nContent here.');
    await writeFile(join(visionDir, 'vision.meta.json'), JSON.stringify(meta));

    const findings = await detectOrphanDrafts(tmpDir, kbStub, 'proj', 'snap-1');
    const orphans = findings.filter(f => f.kind === 'orphan_draft');
    expect(orphans.length).toBeGreaterThanOrEqual(1);
    expect(orphans[0]!.confidence).toBe(1.0);
    expect(orphans[0]!.severity).toBe('med');
  });

  it('.gsdkeep present → vision doc excluded from orphan detection', async () => {
    const keepDir = join(tmpDir, 'intentional-pending');
    await mkdir(keepDir, { recursive: true });

    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const meta = {
      request_id: 'req-keep-1',
      kind: 'mission_seed',
      provenance: { developer_approved_at: fifteenDaysAgo },
      bundle_id: null,
    };
    await writeFile(join(keepDir, 'vision.md'), '# Intentionally Pending');
    await writeFile(join(keepDir, 'vision.meta.json'), JSON.stringify(meta));
    await writeFile(join(keepDir, '.gsdkeep'), ''); // mark as intentionally pending

    const findings = await detectOrphanDrafts(tmpDir, kbStub, 'proj', 'snap-2');
    // The keepDir vision should NOT be in findings
    const keepFindings = findings.filter(f =>
      f.rationale?.includes('intentional-pending') || f.source_path?.includes('intentional-pending')
    );
    expect(keepFindings.length).toBe(0);
  });

  it('5-day-old approval → no orphan finding', async () => {
    const newDir = join(tmpDir, 'new-vision');
    await mkdir(newDir, { recursive: true });

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const meta = {
      request_id: 'req-new-1',
      kind: 'mission_seed',
      provenance: { developer_approved_at: fiveDaysAgo },
      bundle_id: null,
    };
    await writeFile(join(newDir, 'vision.md'), '# New Vision');
    await writeFile(join(newDir, 'vision.meta.json'), JSON.stringify(meta));

    const findings = await detectOrphanDrafts(tmpDir, kbStub, 'proj', 'snap-3');
    const newFindings = findings.filter(f =>
      f.source_path?.includes('new-vision')
    );
    expect(newFindings.length).toBe(0);
  });

  it('non-existent staging path returns empty array gracefully', async () => {
    const findings = await detectOrphanDrafts('/tmp/nonexistent-orphan-staging', kbStub, 'proj', 'snap-4');
    expect(findings).toHaveLength(0);
  });
});
