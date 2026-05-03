/**
 * C10 / T10 — Format compliance: research-mission-generator contract
 * (S5 — CAPCOM gate G1).
 *
 * The research-mission-generator skill at
 * `.claude/skills/research-mission-generator/SKILL.md` activates from human
 * conversation and consumes vision documents that describe research intent.
 * Structural compliance contract:
 *
 *   - Vision document is a Markdown file with:
 *       1. `# {title}` — research mission title
 *       2. `## Vision` section — narrative establishing topic + scope
 *       3. `## Source findings` — motivating evidence
 *       4. `## Provenance` — meeting attribution
 *   - meta.json sidecar carries:
 *       - skill = 'research-mission-generator'
 *       - speed_hint = 'full' (PRD §Pipeline Speed Detection: research missions
 *         require "Full (Vision → Research → Mission)")
 *       - constraints.crew_profile (Patrol/Squadron/Fleet — drives crew sizing)
 *       - constraints.output_format = 'three-file-pdf' (skill produces PDF + .tex
 *         + index.html — Step 5 of skill workflow)
 *       - constraints.max_research_searches (gap-fill budget — Step 2a)
 *       - provenance.{source_findings, ai_rationale, meeting_id}
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
  stagingRoot = mkdtempSync(join(tmpdir(), 'c10-fc-rmg-'));
});

afterEach(() => {
  try {
    rmSync(stagingRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

interface ResearchMissionInput {
  title: string;
  topicScope: string;
  sourceFindings: string[];
  meta: VisionSeedMeta;
  crewProfile?: string;
  outputFormat?: string;
  maxResearchSearches?: number;
}

function parseResearchMissionInput(args: {
  visionDocPath: string;
  metaPath: string;
}): ResearchMissionInput {
  const md = readFileSync(args.visionDocPath, 'utf8');
  const meta = JSON.parse(readFileSync(args.metaPath, 'utf8')) as VisionSeedMeta;

  const titleMatch = /^# (.+)$/m.exec(md);
  if (!titleMatch) throw new Error('vision doc missing # title heading');
  const title = titleMatch[1].trim();

  const visionMatch = /## Vision\n([\s\S]*?)(?=\n## |\n---|\n$)/.exec(md);
  if (!visionMatch) throw new Error('vision doc missing ## Vision section');
  const topicScope = visionMatch[1].trim();

  if (!/## Source findings/.test(md)) {
    throw new Error('vision doc missing ## Source findings section');
  }
  const sourceFindings = (meta.provenance.source_findings as string[]) ?? [];

  if (!/## Provenance/.test(md)) {
    throw new Error('vision doc missing ## Provenance section');
  }

  return {
    title,
    topicScope,
    sourceFindings,
    meta,
    crewProfile: meta.constraints.crew_profile,
    outputFormat: meta.constraints.output_format,
    maxResearchSearches: meta.constraints.max_research_searches,
  };
}

describe('CAPCOM G1 / S5 — research-mission-generator format compliance', () => {
  it('emitted research-mission seed parses without error', async () => {
    const f = buildPopulatedKB();
    const researchDecision = makeDecision({
      kind: 'research_mission',
      ai_draft: {
        title: 'Investigate DACP/chipset coupling spike',
        body:
          'A 2.3× coupling baseline between DACP and chipset modules suggests ' +
          'architectural drift. Determine whether to refactor the boundary or ' +
          'absorb the spike as a deliberate cross-cutting concern. Sources should ' +
          'come from the per-project KB, not raw source files.',
      },
    });
    f.kb._state.decisions.set(researchDecision.id, researchDecision);
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitSendNow(researchDecision.id);

    expect(() =>
      parseResearchMissionInput({
        visionDocPath: result.vision_doc_path,
        metaPath: result.meta_path,
      }),
    ).not.toThrow();
  });

  it('skill, speed_hint, and constraints align with research-mission-generator pipeline', async () => {
    const f = buildPopulatedKB();
    const researchDecision = makeDecision({
      kind: 'research_mission',
      ai_draft: { title: 'Topic A', body: 'Topic A body.' },
    });
    f.kb._state.decisions.set(researchDecision.id, researchDecision);
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitSendNow(researchDecision.id);
    const parsed = parseResearchMissionInput({
      visionDocPath: result.vision_doc_path,
      metaPath: result.meta_path,
    });

    // Skill activation key
    expect(parsed.meta.skill).toBe('research-mission-generator');
    // Speed hint per PRD: full (Vision → Research → Mission)
    expect(parsed.meta.speed_hint).toBe('full');
    // Output format per skill Step 5 (LaTeX PDF + .tex + index.html)
    expect(parsed.outputFormat).toBe('three-file-pdf');
    // Crew profile in the skill's table (Patrol/Squadron/Fleet)
    expect(['patrol', 'squadron', 'fleet']).toContain(parsed.crewProfile);
    // Research-search budget present (skill's gap-fill budget cap)
    expect(parsed.maxResearchSearches).toBeGreaterThan(0);
  });

  it('source findings list propagates from KB into meta.provenance', async () => {
    const f = buildPopulatedKB();
    const researchDecision = makeDecision({
      kind: 'research_mission',
      ai_draft: { title: 'Topic B', body: 'Body.' },
      source_findings: [
        'F-2026-0501-0023' as never,
        'F-2026-0501-0024' as never,
      ],
    });
    f.kb._state.findings.set(
      'F-2026-0501-0024' as never,
      {
        ...f.finding,
        id: 'F-2026-0501-0024' as never,
        rationale: 'second finding rationale',
      },
    );
    f.kb._state.decisions.set(researchDecision.id, researchDecision);
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitSendNow(researchDecision.id);
    const parsed = parseResearchMissionInput({
      visionDocPath: result.vision_doc_path,
      metaPath: result.meta_path,
    });

    expect(parsed.sourceFindings).toContain('F-2026-0501-0023');
    expect(parsed.sourceFindings).toContain('F-2026-0501-0024');
  });

  it('vision doc contains user-voice content from the AI draft body', async () => {
    const f = buildPopulatedKB();
    const customBody =
      'The whitebox-compute thread has been opening fault domains. We should investigate whether the Bilocon-era PIC code resurfaces in the chipset abstraction.';
    const researchDecision = makeDecision({
      kind: 'research_mission',
      ai_draft: { title: 'Investigate fault domain drift', body: customBody },
    });
    f.kb._state.decisions.set(researchDecision.id, researchDecision);
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitSendNow(researchDecision.id);
    const parsed = parseResearchMissionInput({
      visionDocPath: result.vision_doc_path,
      metaPath: result.meta_path,
    });
    expect(parsed.topicScope).toContain('whitebox-compute thread');
    expect(parsed.topicScope).toContain('Bilocon-era PIC');
  });

  it('bundle-emitted research seed has bundle_id matching the meeting', async () => {
    const f = buildPopulatedKB();
    const researchDecision = makeDecision({
      id: 'd-research',
      kind: 'research_mission',
      state: 'bundled',
      ai_draft: { title: 'Bundle research', body: 'Body.' },
    });
    // Replace the pending decision with this bundled one
    f.kb._state.decisions.delete(f.decision.id);
    f.kb._state.decisions.set(researchDecision.id, researchDecision);

    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitBundle(f.meeting.id);
    const meta = JSON.parse(
      readFileSync(result.emissions[0].meta_path, 'utf8'),
    ) as VisionSeedMeta;
    expect(meta.bundle_id).toBe(f.meeting.id);
  });
});
