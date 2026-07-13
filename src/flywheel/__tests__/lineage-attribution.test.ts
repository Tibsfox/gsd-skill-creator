import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  skillsForTrace,
  traceToPrecedent,
  loadPrecedents,
  loadCitations,
} from '../lineage-attribution.js';
import { writeActivationTrace, writeCompositionTrace } from '../../traces/activation-writer.js';
import type { DecisionTrace } from '../../types/memory.js';

describe('skillsForTrace', () => {
  it('attributes an activation trace to its actor', () => {
    const trace = { actor: 'commit-style', constraints: [] } as unknown as DecisionTrace;
    expect(skillsForTrace(trace)).toEqual(['commit-style']);
  });

  it('parses selected-skills from a composition constraint (plus the actor)', () => {
    const trace = {
      actor: 'orchestrator',
      constraints: ['some other constraint', 'selected-skills: code-review, test-generator'],
    } as unknown as DecisionTrace;
    expect(skillsForTrace(trace)).toEqual(['orchestrator', 'code-review', 'test-generator']);
  });

  it('traceToPrecedent carries id, intent, actor, and derived skills', () => {
    const trace = {
      id: 't1',
      intent: 'commit the change',
      actor: 'commit-style',
      constraints: [],
    } as unknown as DecisionTrace;
    const p = traceToPrecedent(trace);
    expect(p).toMatchObject({ id: 't1', intent: 'commit the change', actor: 'commit-style' });
    expect(p.skills).toEqual(['commit-style']);
  });
});

describe('loadPrecedents (round-trip through the real trace writers)', () => {
  let dir: string;
  let logPath: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(join(tmpdir(), 'flywheel-prec-'));
    logPath = join(dir, 'decisions.jsonl');
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('loads activation + composition precedents with derived skills', async () => {
    await writeActivationTrace({ actor: 'commit-style', intent: 'commit', reasoning: 'r', logPath });
    await writeCompositionTrace({
      actor: 'orchestrator',
      intent: 'compose review',
      reasoning: 'r',
      selectedSkills: ['code-review', 'test-generator'],
      logPath,
    });

    const precedents = await loadPrecedents(logPath);
    expect(precedents).toHaveLength(2);
    const allSkills = precedents.flatMap((p) => p.skills ?? []);
    expect(allSkills).toContain('commit-style');
    expect(allSkills).toContain('code-review');
    expect(allSkills).toContain('test-generator');
  });

  it('returns [] for a missing trace log', async () => {
    expect(await loadPrecedents(join(dir, 'nope.jsonl'))).toEqual([]);
  });
});

describe('loadCitations (provenance by-source.jsonl)', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(join(tmpdir(), 'flywheel-cite-'));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  async function writeBySource(records: unknown[]): Promise<void> {
    await fs.writeFile(
      join(dir, 'by-source.jsonl'),
      records.map((r) => JSON.stringify(r)).join('\n') + '\n',
    );
  }

  it('attributes a citation to a skill by exact artifact_name', async () => {
    await writeBySource([
      { citation_id: 'cite-1', entries: [{ artifact_name: 'code-review', artifact_path: 'x/y.md' }] },
      { citation_id: 'cite-2', entries: [{ artifact_name: 'other-skill', artifact_path: 'a/b.md' }] },
    ]);
    const citations = await loadCitations(dir, 'code-review');
    expect(citations).toHaveLength(1);
    expect(citations[0]).toMatchObject({ citationId: 'cite-1', title: 'code-review' });
    expect(citations[0]!.skills).toEqual(['code-review']);
  });

  it('attributes by a skill path segment when artifact_name is absent', async () => {
    await writeBySource([
      { citation_id: 'cite-3', entries: [{ artifact_path: '.claude/skills/security-hygiene/SKILL.md' }] },
    ]);
    const citations = await loadCitations(dir, 'security-hygiene');
    expect(citations.map((c) => c.citationId)).toEqual(['cite-3']);
  });

  it('does not attribute unrelated citations, and tolerates corrupt lines', async () => {
    await fs.writeFile(
      join(dir, 'by-source.jsonl'),
      '{corrupt\n' +
        JSON.stringify({ citation_id: 'cite-4', entries: [{ artifact_name: 'unrelated' }] }) +
        '\n',
    );
    expect(await loadCitations(dir, 'code-review')).toEqual([]);
  });

  it('returns [] for a missing provenance dir', async () => {
    expect(await loadCitations(join(dir, 'absent'), 'code-review')).toEqual([]);
  });
});
