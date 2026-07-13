import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CorrectionQuarantineStore } from './correction-quarantine.js';
import { FeedbackStore } from './feedback-store.js';
import { RefinementEngine } from './refinement-engine.js';
import { SkillStore } from '../storage/skill-store.js';
import type { CorrectionCandidateInput } from '../types/learning.js';

function makeCandidate(over: Partial<CorrectionCandidateInput> = {}): CorrectionCandidateInput {
  return {
    kind: 'correction-candidate',
    schemaVersion: 1,
    sessionId: 'sess',
    transcriptPath: '/t.jsonl',
    signal: 'user-interposed-edit',
    filePath: '/f.ts',
    mistakeAssistantUuid: 'w1',
    fixerAssistantUuid: 'e2',
    skillName: null,
    skillHints: [{ skill: 'my-skill', source: 'session-active-skill', ambient: false }],
    interposingUserText: 'redo this properly',
    original: 'alpha beta gamma delta',
    corrected: 'one two three four five',
    diff: [],
    preSimilarity: 0,
    ...over,
  };
}

describe('CorrectionQuarantineStore', () => {
  let root: string;
  let patternsDir: string;
  let skillsDir: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'correction-quarantine-'));
    patternsDir = join(root, 'patterns');
    skillsDir = join(root, 'skills');
    await mkdir(join(skillsDir, 'my-skill'), { recursive: true });
    await writeFile(
      join(skillsDir, 'my-skill', 'SKILL.md'),
      '---\nname: my-skill\ndescription: a test skill used for refinement-isolation checks\n---\nbody\n',
    );
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  const store = () => new CorrectionQuarantineStore(patternsDir);
  const qFile = () => join(patternsDir, 'correction-quarantine.jsonl');
  const fFile = () => join(patternsDir, 'feedback.jsonl');

  it('round-trips: addMany then listPending; missing file -> []; corrupt line skipped', async () => {
    expect(await store().readAll()).toEqual([]); // ENOENT
    const added = await store().addMany([makeCandidate(), makeCandidate({ filePath: '/g.ts' })]);
    expect(added).toHaveLength(2);
    expect(added[0].id).toBeTruthy();
    expect(added[0].status).toBe('pending');
    expect(await store().listPending()).toHaveLength(2);

    await appendFile(qFile(), 'not-json-garbage\n', 'utf-8');
    expect(await store().readAll()).toHaveLength(2); // garbage skipped
  });

  it('writes only correction-quarantine.jsonl, never feedback.jsonl', async () => {
    await store().add(makeCandidate());
    expect(existsSync(qFile())).toBe(true);
    expect(existsSync(fFile())).toBe(false);
  });

  it('every persisted record uses kind:correction-candidate, never type:correction', async () => {
    await store().add(makeCandidate());
    const raw = await readFile(qFile(), 'utf-8');
    const rec = JSON.parse(raw.trim().split('\n')[0]);
    expect(rec.kind).toBe('correction-candidate');
    expect(rec.type).toBeUndefined();
  });

  it('refuses to transition a non-pending candidate (no double-promote)', async () => {
    const c = await store().add(makeCandidate());
    await store().updateStatus(c.id, { status: 'dismissed', dismissedReason: 'x' });
    await expect(
      store().updateStatus(c.id, { status: 'promoted', promotedFeedbackId: 'fake' }),
    ).rejects.toThrow();
  });

  // KEYSTONE: quarantine is structurally invisible to the refinement pipeline.
  it('is invisible to FeedbackStore/RefinementEngine even with >=3 candidates', async () => {
    await store().addMany([makeCandidate(), makeCandidate({ filePath: '/g.ts' }), makeCandidate({ filePath: '/h.ts' })]);
    expect(existsSync(qFile())).toBe(true);

    const feedbackStore = new FeedbackStore(patternsDir);
    expect(await feedbackStore.getCorrections('my-skill')).toEqual([]);
    expect(await feedbackStore.count()).toBe(0);
    expect(existsSync(fFile())).toBe(false);

    const engine = new RefinementEngine(feedbackStore, new SkillStore(skillsDir));
    const elig = await engine.checkEligibility('my-skill');
    expect(elig.eligible).toBe(false);
    expect(elig.reason).toBe('insufficient_feedback');
  });

  it('is idempotent: re-detecting the same correction returns the existing record, no duplicate', async () => {
    const first = await store().add(makeCandidate());
    const second = await store().add(makeCandidate()); // identical content → same dedupKey
    expect(second.id).toBe(first.id);
    expect(await store().readAll()).toHaveLength(1);
  });

  it('dedup is content-keyed, not blanket: a genuinely different correction still persists', async () => {
    await store().add(makeCandidate());
    await store().add(makeCandidate({ corrected: 'a genuinely different correction body' }));
    expect(await store().readAll()).toHaveLength(2);
  });

  it('addMany dedups within the incoming batch AND against the existing ledger', async () => {
    await store().add(makeCandidate()); // seed the ledger with the plain candidate
    const res = await store().addMany([
      makeCandidate(), // dup of the seed
      makeCandidate({ filePath: '/g.ts' }), // new
      makeCandidate(), // in-batch dup
    ]);
    expect(res).toHaveLength(3); // a record returned per input (dups point to the existing one)
    expect(res[0].id).toBe(res[2].id); // both plain candidates resolve to the same record
    expect(await store().readAll()).toHaveLength(2); // only seed + /g.ts on disk
  });

  it('cross-instance FileLock serializes a concurrent append + rewrite so neither is lost', async () => {
    const a = store();
    const b = store(); // distinct instance over the SAME dir — per-instance WriteQueues do NOT
    const seed = await a.add(makeCandidate({ filePath: '/seed.ts' }));
    // Fire an append (new candidate, via b) and a status rewrite (via a) concurrently.
    // Without the cross-process lock the rewrite could clobber the append.
    await Promise.all([
      b.addMany([makeCandidate({ filePath: '/new.ts' })]),
      a.updateStatus(seed.id, { status: 'dismissed', dismissedReason: 'x' }),
    ]);
    const all = await store().readAll();
    expect(all.map((c) => c.filePath).sort()).toEqual(['/new.ts', '/seed.ts']);
    expect(all.find((c) => c.filePath === '/seed.ts')!.status).toBe('dismissed');
  });
});
