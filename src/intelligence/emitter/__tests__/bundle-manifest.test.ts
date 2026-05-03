/**
 * C10 / T5 — Bundle manifest YAML composer.
 *
 * Verifies the YAML matches the PRD example, parses round-trip, and
 * passes the bundle-pickup format check (T11).
 */
import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  composeBundleManifest,
  parseBundleManifest,
  type BundleManifestData,
} from '../manifest.js';
import { MissionEmitter } from '../compose.js';
import { buildPopulatedKB, makeDecision } from './_fixtures.js';
import type { BundleId, MeetingId } from '../../types.js';

const SAMPLE_DATA: BundleManifestData = {
  bundle_id: 'M-20260502-a7f2' as BundleId,
  meeting_id: 'M-20260502-a7f2' as MeetingId,
  emitted_at: '2026-05-02T14:47:00Z',
  project: 'gsd-skill-creator',
  branch: 'dev',
  kb_snapshot: 'v1.49+local',
  decisions: [
    {
      request_id: 'req_2026-05-02_1447_a0c1',
      skill: 'research-mission-generator',
      speed_hint: 'full',
      title: 'Investigate DACP/chipset coupling spike',
    },
    {
      request_id: 'req_2026-05-02_1447_b3d4',
      skill: 'vision-to-mission',
      speed_hint: 'fast',
      title: 'Pick up the orphaned silicon-perf draft',
    },
    {
      request_id: 'req_2026-05-02_1447_c8e1',
      skill: 'analyze',
      speed_hint: 'fast',
      title: 'Snapshot diff since v1.49',
    },
  ],
  batch_hints: {
    parallelizable: [
      ['req_2026-05-02_1447_a0c1', 'req_2026-05-02_1447_b3d4'],
    ],
    shared_context: ['DACP', 'chipset', 'calibration'],
    suggested_order: [
      'req_2026-05-02_1447_c8e1',
      'req_2026-05-02_1447_a0c1',
      'req_2026-05-02_1447_b3d4',
    ],
  },
  excluded_from_bundle: [
    {
      request_id: 'req_2026-05-02_1424_b3a1',
      title: 'Clear or escalate the held CAPCOM gate',
      reason: 'sent_now',
      sent_at: '2026-05-02T14:24:00Z',
    },
  ],
};

describe('C10 / T5 — bundle manifest YAML composer', () => {
  it('produces valid YAML that round-trips to identical structure', () => {
    const yamlText = composeBundleManifest(SAMPLE_DATA);
    const parsed = yaml.load(yamlText) as BundleManifestData;
    expect(parsed.bundle_id).toBe(SAMPLE_DATA.bundle_id);
    expect(parsed.decisions.length).toBe(3);
    expect(parsed.decisions[0].request_id).toBe('req_2026-05-02_1447_a0c1');
    expect(parsed.batch_hints.parallelizable[0].length).toBe(2);
    expect(parsed.batch_hints.shared_context).toEqual(['DACP', 'chipset', 'calibration']);
    expect(parsed.excluded_from_bundle[0].reason).toBe('sent_now');
  });

  it('parses back via parseBundleManifest with same data', () => {
    const yamlText = composeBundleManifest(SAMPLE_DATA);
    const parsed = parseBundleManifest(yamlText);
    expect(parsed.bundle_id).toBe(SAMPLE_DATA.bundle_id);
    expect(parsed.decisions.length).toBe(3);
    expect(parsed.batch_hints.suggested_order).toEqual(
      SAMPLE_DATA.batch_hints.suggested_order,
    );
  });

  it('contains required PRD top-level keys', () => {
    const yamlText = composeBundleManifest(SAMPLE_DATA);
    expect(yamlText).toContain('bundle_id:');
    expect(yamlText).toContain('meeting_id:');
    expect(yamlText).toContain('emitted_at:');
    expect(yamlText).toContain('project:');
    expect(yamlText).toContain('branch:');
    expect(yamlText).toContain('kb_snapshot:');
    expect(yamlText).toContain('decisions:');
    expect(yamlText).toContain('batch_hints:');
    expect(yamlText).toContain('excluded_from_bundle:');
  });

  it('0-decision bundle → still produces valid YAML with empty decisions list', () => {
    const empty: BundleManifestData = {
      ...SAMPLE_DATA,
      decisions: [],
      excluded_from_bundle: [],
      batch_hints: {
        parallelizable: [],
        shared_context: [],
        suggested_order: [],
      },
    };
    const yamlText = composeBundleManifest(empty);
    const parsed = yaml.load(yamlText) as BundleManifestData;
    expect(parsed.decisions).toEqual([]);
  });

  it('manifest from MissionEmitter.composeBundleManifestYaml round-trips', () => {
    const f = buildPopulatedKB();
    const stagingRoot = mkdtempSync(join(tmpdir(), 'c10-bm-'));
    const emitter = new MissionEmitter({
      kb: f.kb,
      stagingRoot,
      now: () => new Date('2026-05-03T12:00:00Z'),
    });

    const d1 = makeDecision({ id: 'd1' });
    const d2 = makeDecision({
      id: 'd2',
      kind: 'vision_mission',
      ai_draft: { title: 'Pick up orphan', body: 'b' },
    });

    const yamlText = emitter.composeBundleManifestYaml({
      bundleId: f.meeting.id as unknown as BundleId,
      meetingId: f.meeting.id,
      project: f.project,
      decisions: [
        { requestId: 'req_2026-05-03_1200_d1xx', decision: d1 },
        { requestId: 'req_2026-05-03_1200_d2xx', decision: d2 },
      ],
      excluded: [],
      kbSnapshot: 'v1.49+local',
    });
    const parsed = yaml.load(yamlText) as BundleManifestData;
    expect(parsed.decisions.length).toBe(2);
    expect(parsed.decisions[0].skill).toBe('research-mission-generator');
    expect(parsed.decisions[1].skill).toBe('vision-to-mission');
    expect(parsed.decisions[1].speed_hint).toBe('fast');
  });
});
