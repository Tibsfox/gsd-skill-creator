import { describe, it, expect, vi } from 'vitest';
import { CorrectionDetector } from './correction-detector.js';
import type { TranscriptEntry, ContentBlock } from '../types/observation.js';
import type { RevertedCommitSignal } from '../types/learning.js';

// --- fixture builders (real Claude Code transcript shape) --------------------

let seq = 0;
function uuid(prefix = 'u'): string {
  return `${prefix}-${++seq}`;
}

function edit(
  filePath: string,
  oldString: string,
  newString: string,
  opts: { name?: 'Edit' | 'Write'; attributionSkill?: string; uuid?: string } = {},
): TranscriptEntry {
  const name = opts.name ?? 'Edit';
  const input: Record<string, unknown> =
    name === 'Write'
      ? { file_path: filePath, content: newString }
      : { file_path: filePath, old_string: oldString, new_string: newString };
  const block: ContentBlock = { type: 'tool_use', name, input };
  return {
    uuid: opts.uuid ?? uuid('a'),
    parentUuid: null,
    isSidechain: false,
    sessionId: 'sess',
    timestamp: new Date(0).toISOString(),
    type: 'assistant',
    attributionSkill: opts.attributionSkill,
    message: { role: 'assistant', content: [block] },
  };
}

function userTurn(text: string): TranscriptEntry {
  return {
    uuid: uuid('user'),
    parentUuid: null,
    isSidechain: false,
    sessionId: 'sess',
    timestamp: new Date(0).toISOString(),
    type: 'user',
    userType: 'external',
    message: { role: 'user', content: text },
  };
}

function toolResultTurn(): TranscriptEntry {
  return {
    uuid: uuid('tr'),
    parentUuid: null,
    isSidechain: false,
    sessionId: 'sess',
    timestamp: new Date(0).toISOString(),
    type: 'user',
    userType: 'external',
    sourceToolAssistantUUID: 'a-x',
    toolUseResult: { filePath: '/f.ts', oldString: 'x', newString: 'y' },
    message: { role: 'user', content: [{ type: 'tool_result', text: 'ok' } as ContentBlock] },
  };
}

function skillActivation(skill: string): TranscriptEntry {
  return {
    uuid: uuid('sk'),
    parentUuid: null,
    isSidechain: false,
    sessionId: 'sess',
    timestamp: new Date(0).toISOString(),
    type: 'assistant',
    message: { role: 'assistant', content: [{ type: 'tool_use', name: 'Skill', input: { skill } }] },
  };
}

// A significant correction pair (0 shared words, >=3 changed, not formatting-only).
const OLD = 'alpha beta gamma delta epsilon';
const NEW = 'one two three four five six seven';

describe('CorrectionDetector', () => {
  const det = () => new CorrectionDetector();

  it('detects an interposed edit (Write -> user turn -> Edit same file)', () => {
    const entries = [
      edit('/f.ts', '', OLD, { name: 'Write', uuid: 'w1' }),
      userTurn('please rework the retry logic, it is wrong'),
      edit('/f.ts', OLD, NEW, { name: 'Edit', uuid: 'e2' }),
    ];
    const cands = det().detect(entries, 'sess', '/t.jsonl');
    expect(cands).toHaveLength(1);
    expect(cands[0].signal).toBe('user-interposed-edit');
    expect(cands[0].original).toBe(OLD);
    expect(cands[0].corrected).toBe(NEW);
    expect(cands[0].filePath).toBe('/f.ts');
    expect(cands[0].mistakeAssistantUuid).toBe('w1');
    expect(cands[0].fixerAssistantUuid).toBe('e2');
    expect(cands[0].kind).toBe('correction-candidate');
  });

  it('ignores self-iteration (two edits, no intervening human turn)', () => {
    const entries = [
      edit('/f.ts', '', OLD, { name: 'Write' }),
      edit('/f.ts', OLD, NEW, { name: 'Edit' }),
    ];
    expect(det().detect(entries, 'sess', '/t.jsonl')).toHaveLength(0);
  });

  it('does not treat a tool_result-carrying user turn as interposition', () => {
    const entries = [
      edit('/f.ts', '', OLD, { name: 'Write' }),
      toolResultTurn(),
      edit('/f.ts', OLD, NEW, { name: 'Edit' }),
    ];
    expect(det().detect(entries, 'sess', '/t.jsonl')).toHaveLength(0);
  });

  it('filters out non-substantive user turns (bare "continue")', () => {
    const entries = [
      edit('/f.ts', '', OLD, { name: 'Write' }),
      userTurn('continue'),
      edit('/f.ts', OLD, NEW, { name: 'Edit' }),
    ];
    expect(det().detect(entries, 'sess', '/t.jsonl')).toHaveLength(0);
  });

  it('always leaves skillName null regardless of active skills', () => {
    const entries = [
      skillActivation('typescript-patterns'),
      edit('/f.ts', '', OLD, { name: 'Write', attributionSkill: 'batch-rewrite-pattern' }),
      userTurn('this is not what I asked for, redo it'),
      edit('/f.ts', OLD, NEW, { name: 'Edit', attributionSkill: 'security-hygiene' }),
    ];
    const cands = det().detect(entries, 'sess', '/t.jsonl');
    expect(cands).toHaveLength(1);
    expect(cands[0].skillName).toBeNull();
  });

  it('draws hints from the MISTAKE turn, not the fixer turn', () => {
    const entries = [
      edit('/f.ts', '', OLD, { name: 'Write', attributionSkill: 'batch-rewrite-pattern' }),
      userTurn('this is not what I asked for, redo it'),
      edit('/f.ts', OLD, NEW, { name: 'Edit', attributionSkill: 'security-hygiene' }),
    ];
    const [c] = det().detect(entries, 'sess', '/t.jsonl');
    const skills = c.skillHints.map((h) => h.skill);
    expect(skills).toContain('batch-rewrite-pattern');
    // security-hygiene was on the FIXER turn and not session-active -> absent.
    expect(skills).not.toContain('security-hygiene');
    const hint = c.skillHints.find((h) => h.skill === 'batch-rewrite-pattern')!;
    expect(hint.source).toBe('attribution-skill-mistake-turn');
    expect(hint.ambient).toBe(false);
  });

  it('marks ambient skills and ranks them last', () => {
    const entries = [
      skillActivation('security-hygiene'), // session-active ambient
      edit('/f.ts', '', OLD, { name: 'Write', attributionSkill: 'batch-rewrite-pattern' }),
      userTurn('redo this properly, it is wrong'),
      edit('/f.ts', OLD, NEW, { name: 'Edit' }),
    ];
    const [c] = det().detect(entries, 'sess', '/t.jsonl');
    const ambient = c.skillHints.find((h) => h.skill === 'security-hygiene');
    expect(ambient?.ambient).toBe(true);
    // ambient hint ranked after the non-ambient one
    expect(c.skillHints[c.skillHints.length - 1].skill).toBe('security-hygiene');
    expect(c.skillHints[0].ambient).toBe(false);
  });

  it('strips wrapper skills (loop) from hints', () => {
    const entries = [
      edit('/f.ts', '', OLD, { name: 'Write', attributionSkill: 'loop' }),
      userTurn('that is wrong, please fix it'),
      edit('/f.ts', OLD, NEW, { name: 'Edit' }),
    ];
    const [c] = det().detect(entries, 'sess', '/t.jsonl');
    expect(c.skillHints.map((h) => h.skill)).not.toContain('loop');
  });

  it('drops non-significant edits (formatting / too-few-words)', () => {
    const entries = [
      edit('/f.ts', '', 'hello world foo', { name: 'Write' }),
      userTurn('add a word please to this file now'),
      edit('/f.ts', 'hello world foo', 'hello world foo bar', { name: 'Edit' }),
    ];
    expect(det().detect(entries, 'sess', '/t.jsonl')).toHaveLength(0);
  });

  it('caps candidates at maxCandidatesPerSession (most recent kept)', () => {
    const d = new CorrectionDetector({ maxCandidatesPerSession: 3 });
    const entries: TranscriptEntry[] = [];
    for (let i = 0; i < 10; i++) {
      const fp = `/f${i}.ts`;
      entries.push(edit(fp, '', OLD, { name: 'Write' }));
      entries.push(userTurn(`rework file number ${i} completely please`));
      entries.push(edit(fp, OLD, `${NEW} variant ${i}`, { name: 'Edit' }));
    }
    expect(d.detect(entries, 'sess', '/t.jsonl')).toHaveLength(3);
  });

  it('drops candidates on non-deliverable paths (.planning, node_modules, .git)', () => {
    for (const fp of [
      '/repo/.planning/HANDOFF-2026-07-12.md',
      '/repo/node_modules/pkg/index.js',
      '/repo/.git/COMMIT_EDITMSG',
    ]) {
      const entries = [
        edit(fp, '', OLD, { name: 'Write' }),
        userTurn('please rework this content, it is wrong'),
        edit(fp, OLD, NEW, { name: 'Edit' }),
      ];
      expect(det().detect(entries, 'sess', '/t.jsonl')).toHaveLength(0);
    }
  });

  it('keeps candidates on deliverable source paths', () => {
    const entries = [
      edit('/repo/src/foo.ts', '', OLD, { name: 'Write' }),
      userTurn('please rework this content, it is wrong'),
      edit('/repo/src/foo.ts', OLD, NEW, { name: 'Edit' }),
    ];
    expect(det().detect(entries, 'sess', '/t.jsonl')).toHaveLength(1);
  });

  it('honors an empty ignorePathSegments override (keeps .planning edits)', () => {
    const d = new CorrectionDetector({ ignorePathSegments: [] });
    const entries = [
      edit('/repo/.planning/x.md', '', OLD, { name: 'Write' }),
      userTurn('please rework this content, it is wrong'),
      edit('/repo/.planning/x.md', OLD, NEW, { name: 'Edit' }),
    ];
    expect(d.detect(entries, 'sess', '/t.jsonl')).toHaveLength(1);
  });

  it('reads ONLY nested content blocks, not top-level tool_use entries', () => {
    // Synthetic top-level tool_use entries (which real transcripts do NOT use
    // for Write/Edit) must yield nothing — guards the inert-detector trap.
    const entries: TranscriptEntry[] = [
      { uuid: 'x1', parentUuid: null, isSidechain: false, sessionId: 'sess',
        timestamp: new Date(0).toISOString(), type: 'tool_use', tool_name: 'Write',
        tool_input: { file_path: '/f.ts', content: OLD } },
      userTurn('please redo this file it is wrong'),
      { uuid: 'x2', parentUuid: null, isSidechain: false, sessionId: 'sess',
        timestamp: new Date(0).toISOString(), type: 'tool_use', tool_name: 'Edit',
        tool_input: { file_path: '/f.ts' } },
    ];
    expect(det().detect(entries, 'sess', '/t.jsonl')).toHaveLength(0);
  });

  // --- reverted-commit signal (injected git facts) -------------------------

  function revert(overrides: Partial<RevertedCommitSignal> = {}): RevertedCommitSignal {
    return {
      filePath: '/repo/src/foo.ts',
      original: NEW,
      corrected: OLD,
      revertedCommitHash: 'deadbeef',
      revertCommitHash: 'cafef00d',
      revertMessage: 'Revert "feat: bad change"',
      ...overrides,
    };
  }

  it('emits a null-attribution reverted-commit candidate from injected revert data', () => {
    const [c] = det().detect([], 'sess', '/t.jsonl', [revert()]);
    expect(c).toBeDefined();
    expect(c.signal).toBe('reverted-commit');
    expect(c.skillName).toBeNull();
    expect(c.kind).toBe('correction-candidate');
    expect(c.filePath).toBe('/repo/src/foo.ts');
    expect(c.original).toBe(NEW);
    expect(c.corrected).toBe(OLD);
    expect(c.revertedCommitHash).toBe('deadbeef');
    expect(c.revertCommitHash).toBe('cafef00d');
    expect(c.interposingUserText).toBe('Revert "feat: bad change"');
    expect(c.mistakeAssistantUuid).toBeNull();
    expect(c.fixerAssistantUuid).toBeNull();
  });

  it('applies the significance gate to reverts (drops trivial rollbacks)', () => {
    const cands = det().detect([], 'sess', '/t.jsonl', [
      revert({ original: 'hello world foo bar', corrected: 'hello world foo' }),
    ]);
    expect(cands).toHaveLength(0);
  });

  it('drops reverts on non-deliverable paths', () => {
    const cands = det().detect([], 'sess', '/t.jsonl', [
      revert({ filePath: '/repo/.planning/x.md' }),
    ]);
    expect(cands).toHaveLength(0);
  });

  it('dedups reverts by (revert commit, file)', () => {
    const cands = det().detect([], 'sess', '/t.jsonl', [revert(), revert()]);
    expect(cands).toHaveLength(1);
  });

  it('carries session-active skill hints on revert candidates, still null attribution', () => {
    const entries = [skillActivation('typescript-patterns')];
    const [c] = det().detect(entries, 'sess', '/t.jsonl', [revert()]);
    expect(c.skillName).toBeNull();
    expect(c.skillHints.map((h) => h.skill)).toContain('typescript-patterns');
    expect(c.skillHints.find((h) => h.skill === 'typescript-patterns')!.source).toBe(
      'session-active-skill',
    );
  });

  it('emits both signals together (interposed edit + revert)', () => {
    const entries = [
      edit('/f.ts', '', OLD, { name: 'Write', uuid: 'w1' }),
      userTurn('please rework the retry logic, it is wrong'),
      edit('/f.ts', OLD, NEW, { name: 'Edit', uuid: 'e2' }),
    ];
    const cands = det().detect(entries, 'sess', '/t.jsonl', [revert()]);
    expect(cands.map((c) => c.signal).sort()).toEqual(['reverted-commit', 'user-interposed-edit']);
  });

  it('degrades to transcript-only when no reverts are injected', () => {
    const entries = [
      edit('/f.ts', '', OLD, { name: 'Write' }),
      userTurn('please rework the retry logic, it is wrong'),
      edit('/f.ts', OLD, NEW, { name: 'Edit' }),
    ];
    expect(det().detect(entries, 'sess', '/t.jsonl')).toHaveLength(1);
  });

  it('is pure: never touches fs and never throws on malformed entries', () => {
    const fs = require('node:fs');
    const spy = vi.spyOn(fs, 'writeFileSync');
    const malformed = [
      {} as TranscriptEntry,
      { type: 'assistant', message: { role: 'assistant', content: 'not-an-array' } } as TranscriptEntry,
      { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use' }] } } as TranscriptEntry,
      { type: 'user' } as TranscriptEntry,
    ];
    expect(() => det().detect(malformed, 'sess', '/t.jsonl')).not.toThrow();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
