import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, promises as fsp, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseFlywheelArgs, buildConceptSkillMap, flywheelCommand } from './flywheel.js';

describe('parseFlywheelArgs — --allow-heuristic', () => {
  it('defaults allowHeuristic to false', () => {
    const p = parseFlywheelArgs(['status', 'commit-style']);
    expect(p.allowHeuristic).toBe(false);
    expect(p.subcommand).toBe('status');
    expect(p.skill).toBe('commit-style');
  });

  it('parses --allow-heuristic as a boolean flag', () => {
    const p = parseFlywheelArgs(['status', 'commit-style', '--allow-heuristic']);
    expect(p.allowHeuristic).toBe(true);
  });

  it('keeps positional and other flags intact alongside --allow-heuristic', () => {
    const p = parseFlywheelArgs(['status', '--allow-heuristic', 'commit-style', '--json']);
    expect(p.allowHeuristic).toBe(true);
    expect(p.skill).toBe('commit-style');
    expect(p.json).toBe(true);
  });
});

describe('buildConceptSkillMap — concept→skill back-link inversion', () => {
  it('inverts a skill-keyed mapping into concept→skills[]', () => {
    const map = buildConceptSkillMap({
      mappings: [
        { skill: 'code-review', concepts: ['code-peer-review'] },
        { skill: 'adversarial-pr-review', concepts: ['code-peer-review'] },
        { skill: 'security-hygiene', concepts: ['code-cybersecurity-basics'] },
      ],
    });
    expect(map.get('code-peer-review')).toEqual(['code-review', 'adversarial-pr-review']);
    expect(map.get('code-cybersecurity-basics')).toEqual(['security-hygiene']);
    expect(map.get('nope')).toBeUndefined();
  });

  it('is tolerant of null / malformed / missing fields', () => {
    expect(buildConceptSkillMap(null).size).toBe(0);
    expect(buildConceptSkillMap({}).size).toBe(0);
    expect(buildConceptSkillMap({ mappings: [{ concepts: ['x'] } as never] }).size).toBe(0);
    // duplicate concept under the same skill collapses
    const map = buildConceptSkillMap({ mappings: [{ skill: 's', concepts: ['c', 'c'] }] });
    expect(map.get('c')).toEqual(['s']);
  });

  it('the shipped .college/mappings/concept-skills.json parses and maps known dev pairs', () => {
    const raw = JSON.parse(
      readFileSync(join(process.cwd(), '.college/mappings/concept-skills.json'), 'utf8'),
    );
    const map = buildConceptSkillMap(raw);
    // code-peer-review is the upstream concept for both review skills.
    expect(map.get('code-peer-review')).toEqual(
      expect.arrayContaining(['code-review', 'adversarial-pr-review']),
    );
    expect(map.get('code-cybersecurity-basics')).toContain('security-hygiene');
  });
});

describe('parseFlywheelArgs — dev-memory flags', () => {
  it('defaults dev-memory flags to a safe dry run', () => {
    const p = parseFlywheelArgs(['dev-memory']);
    expect(p.subcommand).toBe('dev-memory');
    expect(p.execute).toBe(false);
    expect(p.includeCorrections).toBe(false);
    expect(p.minRecurrence).toBeUndefined();
  });

  it('parses --traces and --provenance status sources', () => {
    const p = parseFlywheelArgs(['status', 'code-review', '--traces', 't.jsonl', '--provenance', 'p/dir']);
    expect(p.traces).toBe('t.jsonl');
    expect(p.provenance).toBe('p/dir');
  });

  it('parses --execute, --include-corrections, --sessions-dir, --memory-dir, --min-recurrence', () => {
    const p = parseFlywheelArgs([
      'dev-memory',
      '--execute',
      '--include-corrections',
      '--sessions-dir', '/tmp/s',
      '--memory-dir', '/tmp/m',
      '--min-recurrence', '3',
    ]);
    expect(p.execute).toBe(true);
    expect(p.includeCorrections).toBe(true);
    expect(p.sessionsDir).toBe('/tmp/s');
    expect(p.memoryDir).toBe('/tmp/m');
    expect(p.minRecurrence).toBe(3);
  });
});

describe('flywheelCommand dev-memory — dry run (default) writes nothing', () => {
  const logs: string[] = [];
  afterEach(() => {
    vi.restoreAllMocks();
    logs.length = 0;
  });

  it('mines candidates and prints them without persisting to any memory dir', async () => {
    const dir = await fsp.mkdtemp(join(tmpdir(), 'flywheel-devmem-'));
    const sessionsDir = join(dir, 'sessions');
    const memDir = join(dir, 'mem');
    await fsp.mkdir(sessionsDir, { recursive: true });
    await fsp.writeFile(
      join(sessionsDir, 'current.jsonl'),
      [
        JSON.stringify({ t: 't1', kind: 'gap', label: 'no x', payload: { missing: 'x-skill' } }),
        JSON.stringify({ t: 't2', kind: 'gap', label: 'still no x', payload: { missing: 'x-skill' } }),
      ].join('\n') + '\n',
    );
    vi.spyOn(console, 'log').mockImplementation((m?: unknown) => {
      logs.push(String(m));
    });

    const code = await flywheelCommand([
      'dev-memory', '--sessions-dir', sessionsDir, '--memory-dir', memDir, '--json',
    ]);

    expect(code).toBe(0);
    const out = JSON.parse(logs.join('\n'));
    expect(out.dryRun).toBe(true);
    expect(out.count).toBeGreaterThan(0);
    // Dry run must not create the memory dir.
    expect(existsSync(memDir)).toBe(false);
    await fsp.rm(dir, { recursive: true, force: true });
  });
});
