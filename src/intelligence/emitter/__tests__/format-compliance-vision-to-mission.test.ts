/**
 * C10 / T9 — Format compliance: vision-to-mission contract (S4 — CAPCOM gate G1).
 *
 * The vision-to-mission skill at `.claude/skills/vision-to-mission/SKILL.md`
 * activates from human conversation and consumes vision documents from the
 * staging area. The structural compliance contract:
 *
 *   - Vision document is a Markdown file with:
 *       1. Top-level `# {title}` heading
 *       2. `## Vision` section (the narrative — Step 3 of the skill workflow)
 *       3. `## Source findings` section listing motivating findings
 *       4. `## Provenance` section recording approval context
 *   - meta.json sidecar carries:
 *       - request_id (request-routing key)
 *       - kind = 'mission_seed'
 *       - skill = 'vision-to-mission' (downstream activation key)
 *       - speed_hint matching the skill's pipeline-speed table
 *         ('full' / 'fast' / 'mission-only')
 *       - project + branch (so skill knows where to write mission files)
 *       - provenance.{source_findings, meeting_id, developer_approved_at}
 *         (so skill can preserve "user voice" — Step 1 conversation harvest)
 *       - constraints.crew_profile + output_format
 *
 * This test mirrors what vision-to-mission would extract from a seed pair
 * and asserts no mismatch between emitter output and skill expectations.
 *
 * Failure here BLOCKS CAPCOM gate G1.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MissionEmitter } from '../compose.js';
import { buildPopulatedKB, makeDecision } from './_fixtures.js';
import type { VisionSeedMeta } from '../../types.js';

let stagingRoot: string;

beforeEach(() => {
  stagingRoot = mkdtempSync(join(tmpdir(), 'c10-fc-vtm-'));
});

afterEach(() => {
  try {
    rmSync(stagingRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

/**
 * Parser mirroring what `vision-to-mission` would extract from the seed pair.
 * Returns a structured view; throws on missing required pieces.
 */
interface VisionToMissionInput {
  title: string;
  visionBody: string;
  sourceFindings: Array<{ id: string; rationale: string }>;
  provenance: {
    meeting_id: string;
    developer_approved_at: string;
  };
  meta: VisionSeedMeta;
  speedHint: 'full' | 'fast' | 'mission-only';
}

function parseVisionToMissionInput(args: {
  visionDocPath: string;
  metaPath: string;
}): VisionToMissionInput {
  if (!existsSync(args.visionDocPath)) {
    throw new Error(`vision doc missing at ${args.visionDocPath}`);
  }
  if (!existsSync(args.metaPath)) {
    throw new Error(`meta missing at ${args.metaPath}`);
  }
  const md = readFileSync(args.visionDocPath, 'utf8');
  const metaText = readFileSync(args.metaPath, 'utf8');
  const meta = JSON.parse(metaText) as VisionSeedMeta;

  // Extract title (first H1)
  const titleMatch = /^# (.+)$/m.exec(md);
  if (!titleMatch) {
    throw new Error('vision doc missing top-level # title heading');
  }
  const title = titleMatch[1].trim();

  // Extract Vision section
  const visionMatch = /## Vision\n([\s\S]*?)(?=\n## |\n---|\n$)/.exec(md);
  if (!visionMatch) {
    throw new Error('vision doc missing ## Vision section');
  }
  const visionBody = visionMatch[1].trim();

  // Extract Source findings list — an empty list is acceptable for some
  // decisions, but the section MUST be present.
  const sourceFindingsSection = /## Source findings\n([\s\S]*?)(?=\n## |\n---|\n$)/.exec(md);
  if (!sourceFindingsSection) {
    throw new Error('vision doc missing ## Source findings section');
  }
  const sourceFindings: Array<{ id: string; rationale: string }> = [];
  for (const m of sourceFindingsSection[1].matchAll(
    /- \*\*(F-[^*]+)\*\*[^\n]*\n\s+(.+)/g,
  )) {
    sourceFindings.push({ id: m[1].trim(), rationale: m[2].trim() });
  }

  // Provenance section
  const provenanceMatch = /## Provenance\n([\s\S]*?)$/.exec(md);
  if (!provenanceMatch) {
    throw new Error('vision doc missing ## Provenance section');
  }

  return {
    title,
    visionBody,
    sourceFindings,
    provenance: {
      meeting_id: meta.provenance.meeting_id,
      developer_approved_at: meta.provenance.developer_approved_at,
    },
    meta,
    speedHint: meta.speed_hint,
  };
}

describe('CAPCOM G1 / S4 — vision-to-mission format compliance', () => {
  it('emitted seed for vision_mission decision parses without error', async () => {
    const f = buildPopulatedKB();
    // Replace fixture with a vision_mission decision
    const visionDecision = makeDecision({
      kind: 'vision_mission',
      ai_draft: {
        title: 'Build a dashboard widget for project health',
        body:
          'Users need an at-a-glance signal showing whether each tracked ' +
          'project is healthy. The widget surfaces three metrics: open ' +
          'finding count, briefing freshness, and last meeting outcome. ' +
          'When a project is parked or has stalled missions, the widget ' +
          'turns yellow; on a held gate it turns red.',
      },
    });
    f.kb._state.decisions.set(visionDecision.id, visionDecision);

    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitSendNow(visionDecision.id);

    expect(() =>
      parseVisionToMissionInput({
        visionDocPath: result.vision_doc_path,
        metaPath: result.meta_path,
      }),
    ).not.toThrow();
  });

  it('parsed input has all expected fields populated', async () => {
    const f = buildPopulatedKB();
    const visionDecision = makeDecision({
      kind: 'vision_mission',
      ai_draft: {
        title: 'Add per-project breadcrumbs to the dashboard header',
        body: 'When the developer drills into a project, the header should show ProjectList → ProjectDetail breadcrumbs they can tap to navigate back without losing scroll position.',
      },
    });
    f.kb._state.decisions.set(visionDecision.id, visionDecision);

    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitSendNow(visionDecision.id);
    const parsed = parseVisionToMissionInput({
      visionDocPath: result.vision_doc_path,
      metaPath: result.meta_path,
    });

    // Title preserved verbatim
    expect(parsed.title).toBe('Add per-project breadcrumbs to the dashboard header');
    // Vision body present
    expect(parsed.visionBody.length).toBeGreaterThan(20);
    expect(parsed.visionBody).toContain('breadcrumbs');
    // Source findings list parsed
    expect(parsed.sourceFindings.length).toBe(1);
    expect(parsed.sourceFindings[0].id).toMatch(/^F-/);
    // meta.skill is the right downstream activation key
    expect(parsed.meta.skill).toBe('vision-to-mission');
    // speedHint matches skill's pipeline-speed table
    expect(['full', 'fast', 'mission-only']).toContain(parsed.speedHint);
    // Provenance fields populated
    expect(parsed.provenance.meeting_id).toMatch(/^M-/);
    expect(parsed.provenance.developer_approved_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T/,
    );
    // Skill needs project + (optionally) branch
    expect(parsed.meta.project).toBeTruthy();
    expect(parsed.meta.branch).toBeTruthy();
    // Skill needs constraint hints
    expect(parsed.meta.constraints).toBeDefined();
  });

  it('output_format hint is markdown-package for vision-to-mission seeds', async () => {
    const f = buildPopulatedKB();
    const visionDecision = makeDecision({
      kind: 'vision_mission',
      ai_draft: { title: 'A vision', body: 'A body that covers the building intent.' },
    });
    f.kb._state.decisions.set(visionDecision.id, visionDecision);

    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitSendNow(visionDecision.id);
    const meta = JSON.parse(readFileSync(result.meta_path, 'utf8')) as VisionSeedMeta;
    expect(meta.constraints.output_format).toBe('markdown-package');
  });

  it('speed_hint defaults to "fast" for vision-to-mission decisions', async () => {
    const f = buildPopulatedKB();
    const visionDecision = makeDecision({
      kind: 'vision_mission',
      ai_draft: { title: 'A vision', body: 'A body.' },
    });
    f.kb._state.decisions.set(visionDecision.id, visionDecision);

    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitSendNow(visionDecision.id);
    const meta = JSON.parse(readFileSync(result.meta_path, 'utf8')) as VisionSeedMeta;
    // PRD's speed-hint table:
    //   fast → Vision + Mission, skip research (right call for software/tooling)
    expect(meta.speed_hint).toBe('fast');
  });

  it('meta.json validates against vision-seed-meta.schema.json', async () => {
    const f = buildPopulatedKB();
    const visionDecision = makeDecision({
      kind: 'vision_mission',
      ai_draft: { title: 'A vision', body: 'A body.' },
    });
    f.kb._state.decisions.set(visionDecision.id, visionDecision);

    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitSendNow(visionDecision.id);
    const meta = JSON.parse(readFileSync(result.meta_path, 'utf8'));
    // The composer validates before write, so reaching here is the proof.
    // Re-validate to be explicit:
    const { validateMeta } = await import('../meta-validator.js');
    expect(() => validateMeta(meta)).not.toThrow();
  });

  it('developer_modifications carry through into meta.json verbatim', async () => {
    const f = buildPopulatedKB();
    const visionDecision = makeDecision({
      kind: 'vision_mission',
      ai_draft: { title: 'A vision', body: 'A body.' },
      developer_modifications: [
        'tightened scope to single-file refactor',
        'added document the boundary',
      ],
    });
    f.kb._state.decisions.set(visionDecision.id, visionDecision);

    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitSendNow(visionDecision.id);
    const meta = JSON.parse(readFileSync(result.meta_path, 'utf8')) as VisionSeedMeta;
    expect(meta.provenance.developer_modifications).toEqual([
      'tightened scope to single-file refactor',
      'added document the boundary',
    ]);
  });
});
