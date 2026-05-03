/**
 * Phase 826 / C13 — I16: Batch hints in commitBundle output
 *
 * After commitBundle, the returned Bundle's batch_hints must contain
 * all decision IDs in suggested_order and parallelizable groups.
 *
 * Also tests parseBundleManifest round-trip with a hand-crafted YAML.
 *
 * Phase 826 / D-26-34.
 */

import { describe, it, expect } from 'vitest';
import { createTestKB } from '../_harness/kb-factory.js';

describe('I16: batch hint propagation in commitBundle', () => {
  it('commitBundle batch_hints.suggested_order contains all bundled decisions', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-hints-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,1000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const meeting = await kb.startMeeting('test-proj', snapshotId);
      const d1 = await kb.addDecision(meeting.id, {
        state: 'pending',
        kind: 'vision_mission',
        ai_draft: { title: 'D1', body: 'B1' },
        developer_modifications: [],
        source_findings: ['F-shared' as `F-${string}`],
        emitted_at: null,
        emission_path: null,
        approved_at: new Date().toISOString(),
      });
      const d2 = await kb.addDecision(meeting.id, {
        state: 'pending',
        kind: 'research_mission',
        ai_draft: { title: 'D2', body: 'B2' },
        developer_modifications: [],
        source_findings: ['F-shared' as `F-${string}`],
        emitted_at: null,
        emission_path: null,
        approved_at: new Date().toISOString(),
      });
      const d3 = await kb.addDecision(meeting.id, {
        state: 'pending',
        kind: 'analysis_run',
        ai_draft: { title: 'D3', body: 'B3' },
        developer_modifications: [],
        source_findings: ['F-isolated' as `F-${string}`],
        emitted_at: null,
        emission_path: null,
        approved_at: new Date().toISOString(),
      });

      const bundle = await kb.commitBundle(meeting.id);

      // All decisions are in the bundle
      expect(bundle.decisions).toContain(d1.id);
      expect(bundle.decisions).toContain(d2.id);
      expect(bundle.decisions).toContain(d3.id);

      // batch_hints must be present with all decisions
      expect(bundle.batch_hints).toBeDefined();
      expect(bundle.batch_hints.suggested_order).toContain(d1.id);
      expect(bundle.batch_hints.suggested_order).toContain(d2.id);
      expect(bundle.batch_hints.suggested_order).toContain(d3.id);

      // parallelizable groups present
      expect(Array.isArray(bundle.batch_hints.parallelizable)).toBe(true);
      expect(Array.isArray(bundle.batch_hints.shared_context)).toBe(true);
    } finally {
      kbHandle.cleanup();
    }
  });

  it('parseBundleManifest round-trips batch_hints from YAML', async () => {
    const { parseBundleManifest } = await import('../../emitter/manifest.js');

    const yaml = [
      'bundle_id: M-20260502-hints-rt',
      'emitted_at: 2026-05-02T10:00:00.000Z',
      'seeds:',
      '  - request_id: req_2026-05-02_1000_aaaa',
      '    vision_doc: "# Vision"',
      'batch_hints:',
      '  suggested_order:',
      '    - req_2026-05-02_1000_aaaa',
      '  parallelizable:',
      '    - [req_2026-05-02_1000_aaaa]',
      '  shared_context: []',
    ].join('\n');

    const parsed = parseBundleManifest(yaml);
    expect(parsed.batch_hints).toBeDefined();
    expect(parsed.batch_hints.suggested_order).toContain('req_2026-05-02_1000_aaaa');
    expect(Array.isArray(parsed.batch_hints.parallelizable)).toBe(true);
    expect(Array.isArray(parsed.batch_hints.shared_context)).toBe(true);
  });
});
