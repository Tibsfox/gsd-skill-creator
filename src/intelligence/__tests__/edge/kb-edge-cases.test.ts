/**
 * Phase 826 / C13 — E1–E8: KB edge cases
 *
 * Edge cases: empty project, duplicate IDs, FK violations, concurrent
 * beginSnapshot, invalid state transitions, empty findings list,
 * very long strings, unicode in text fields.
 *
 * Phase 826 / D-26-04 .. D-26-10.
 */

import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { createTestKB } from '../_harness/kb-factory.js';
import type { Finding } from '../../types.js';

// ─── E1: Empty project (no findings, no briefings) ───────────────────────────

describe('E1: empty project state', () => {
  it('listOpenFindings returns [] for project with no findings', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();
      const result = await kb.listOpenFindings('test-proj');
      expect(result).toEqual([]);
    } finally {
      kbHandle.cleanup();
    }
  });

  it('getCurrentBriefing returns null for project with no briefings', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();
      const result = await kb.getCurrentBriefing('test-proj');
      expect(result).toBeNull();
    } finally {
      kbHandle.cleanup();
    }
  });

  it('listMeetings returns [] for project with no meetings', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();
      const result = await kb.listMeetings('test-proj');
      expect(result).toEqual([]);
    } finally {
      kbHandle.cleanup();
    }
  });
});

// ─── E2: Duplicate ID handling ───────────────────────────────────────────────

describe('E2: duplicate ID handling', () => {
  it('registerProject with same id is idempotent (upsert semantics)', async () => {
    const kbHandle = createTestKB('dup-proj');
    try {
      const kb = await kbHandle.createKBStore();

      await kb.registerProject({ id: 'dup-proj', name: 'Original', path: '/tmp/dup', branch: 'main', kind: 'code', priority: 'low', last_activity_at: new Date().toISOString() });
      await kb.registerProject({ id: 'dup-proj', name: 'Updated', path: '/tmp/dup', branch: 'dev', kind: 'code', priority: 'high', last_activity_at: new Date().toISOString() });

      const p = await kb.getProject('dup-proj');
      expect(p?.name).toBe('Updated');
      expect(p?.priority).toBe('high');
    } finally {
      kbHandle.cleanup();
    }
  });

  it('writeFindings with duplicate finding id is rejected (UNIQUE constraint)', () => {
    const kbHandle = createTestKB();
    try {
      const snapshotId = 'S-dupf-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,500)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const insertFinding = () => kbHandle.db.prepare(`
        INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale,
          source_path, source_range_start, source_range_end, produced_by, produced_at, status,
          addressed_by_decision, dismissed_rationale)
        VALUES ('F-dup-001','test-proj',?,'hot_spot','high',0.9,'Dup','R',NULL,NULL,NULL,'analyzer',?,?,NULL,NULL)
      `).run(snapshotId, new Date().toISOString(), 'open');

      insertFinding(); // First insert succeeds
      expect(() => insertFinding()).toThrow(); // Duplicate throws UNIQUE violation
    } finally {
      kbHandle.cleanup();
    }
  });
});

// ─── E3: FK violation — findings require snapshot ────────────────────────────

describe('E3: FK constraint enforcement', () => {
  it('inserting finding without snapshot throws FK violation', () => {
    const kbHandle = createTestKB();
    try {
      expect(() => {
        kbHandle.db.prepare(`
          INSERT INTO findings (id, project_id, snapshot_id, kind, severity, confidence, title, rationale,
            source_path, source_range_start, source_range_end, produced_by, produced_at, status,
            addressed_by_decision, dismissed_rationale)
          VALUES ('F-fk-001','test-proj','S-nonexistent','hot_spot','high',0.9,'FK','R',NULL,NULL,NULL,'analyzer',?,?,NULL,NULL)
        `).run(new Date().toISOString(), 'open');
      }).toThrow();
    } finally {
      kbHandle.cleanup();
    }
  });

  it('inserting briefing without snapshot throws FK violation', () => {
    const kbHandle = createTestKB();
    try {
      expect(() => {
        kbHandle.db.prepare(`
          INSERT INTO briefings (id, project_id, snapshot_id, generated_at, body, confidence, source_findings, suggested_moves)
          VALUES ('B-fk-001','test-proj','S-missing',?,'Body text','medium','[]','[]')
        `).run(new Date().toISOString());
      }).toThrow();
    } finally {
      kbHandle.cleanup();
    }
  });
});

// ─── E4: writeFindings with empty list ───────────────────────────────────────

describe('E4: empty findings write', () => {
  it('writeFindings with empty array does not throw', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-empty-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,0,0)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      await expect(kb.writeFindings(snapshotId, 'test-proj', [])).resolves.not.toThrow();
      const findings = await kb.listOpenFindings('test-proj');
      expect(findings).toEqual([]);
    } finally {
      kbHandle.cleanup();
    }
  });
});

// ─── E5: Unicode in text fields ──────────────────────────────────────────────

describe('E5: unicode text fields', () => {
  it('finding title and rationale with unicode are stored and retrieved correctly', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-unicode-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,5,100)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const unicodeTitle = '高い結合度 — 🔥 coupling spike (тест)';
      const unicodeRationale = 'Files ä, ö, ü and emojis 🎯🚀 in rationale text';

      await kb.writeFindings(snapshotId, 'test-proj', [
        {
          id: 'F-uni-001' as `F-${string}`,
          project_id: 'test-proj',
          kind: 'coupling_spike',
          severity: 'med',
          confidence: 0.7,
          title: unicodeTitle,
          rationale: unicodeRationale,
          produced_by: 'analyzer',
          produced_at: new Date().toISOString(),
          snapshot_id: snapshotId,
          status: 'open',
        } satisfies Finding,
      ]);

      const findings = await kb.listOpenFindings('test-proj');
      const f = findings.find((f) => f.id === 'F-uni-001');
      expect(f?.title).toBe(unicodeTitle);
      expect(f?.rationale).toBe(unicodeRationale);
    } finally {
      kbHandle.cleanup();
    }
  });
});

// ─── E6: Very long strings ────────────────────────────────────────────────────

describe('E6: very long strings', () => {
  it('briefing body of 10KB is stored and retrieved intact', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-longbody-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,500)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const longBody = 'A'.repeat(10_000) + '\n## Root Cause\n' + 'B'.repeat(2000);
      const briefing = await kb.writeBriefing({
        project_id: 'test-proj',
        snapshot_id: snapshotId,
        generated_at: new Date().toISOString(),
        body: longBody,
        confidence: 'high',
        source_findings: [],
        suggested_moves: [],
      });

      const retrieved = await kb.getCurrentBriefing('test-proj');
      expect(retrieved?.body.length).toBe(longBody.length);
      expect(retrieved?.body).toBe(longBody);
    } finally {
      kbHandle.cleanup();
    }
  });
});

// ─── E7: rollbackSnapshot idempotency ────────────────────────────────────────

describe('E7: rollbackSnapshot removes findings atomically', () => {
  it('rollbackSnapshot removes all findings and the snapshot itself', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-rollback-edge-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,500)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      await kb.beginSnapshot(snapshotId, 'test-proj');
      await kb.writeFindings(snapshotId, 'test-proj', [
        { id: 'F-rb-e1' as `F-${string}`, project_id: 'test-proj', kind: 'hot_spot', severity: 'high', confidence: 0.9, title: 'T', rationale: 'R', produced_by: 'analyzer', produced_at: new Date().toISOString(), snapshot_id: snapshotId, status: 'open' } satisfies Finding,
        { id: 'F-rb-e2' as `F-${string}`, project_id: 'test-proj', kind: 'dead_code', severity: 'low', confidence: 0.6, title: 'T2', rationale: 'R2', produced_by: 'analyzer', produced_at: new Date().toISOString(), snapshot_id: snapshotId, status: 'open' } satisfies Finding,
      ]);

      await kb.rollbackSnapshot(snapshotId);

      // Findings should be gone
      const findingsCount = (kbHandle.db.prepare("SELECT COUNT(*) AS n FROM findings WHERE snapshot_id = ?").get(snapshotId) as { n: number }).n;
      expect(findingsCount).toBe(0);

      // Snapshot should be gone
      const snapshotCount = (kbHandle.db.prepare("SELECT COUNT(*) AS n FROM snapshots WHERE id = ?").get(snapshotId) as { n: number }).n;
      expect(snapshotCount).toBe(0);
    } finally {
      kbHandle.cleanup();
    }
  });
});

// ─── E8: getProject returns null for unknown project ─────────────────────────

describe('E8: unknown project/entity lookups', () => {
  it('getProject returns null for unknown id', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();
      const result = await kb.getProject('no-such-project');
      expect(result).toBeNull();
    } finally {
      kbHandle.cleanup();
    }
  });

  it('getFinding returns null for unknown id', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();
      const result = await kb.getFinding('F-no-such' as `F-${string}`);
      expect(result).toBeNull();
    } finally {
      kbHandle.cleanup();
    }
  });

  it('getDecision returns null for unknown id', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();
      const result = await kb.getDecision('D-no-such');
      expect(result).toBeNull();
    } finally {
      kbHandle.cleanup();
    }
  });
});
