import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { parseRetroArgs, collectGitMetrics } from '../../src/cli/commands/retro.js';

// CI checks out shallow (actions/checkout@v5 defaults to fetch-depth: 1), so the
// HEAD~1 parent this range test relies on may not exist. Detect that and skip
// rather than assert a commit range git provably cannot resolve in a 1-deep clone.
function hasParentCommit(): boolean {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', 'HEAD~1'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('parseRetroArgs', () => {
  it('parses the subcommand and space-separated flags', () => {
    const p = parseRetroArgs([
      'milestone',
      '--since',
      'abc123',
      '--out',
      'out.md',
      '--name',
      'My Milestone',
      '--ver',
      'v1.2.3',
    ]);
    expect(p.subcommand).toBe('milestone');
    expect(p.since).toBe('abc123');
    expect(p.out).toBe('out.md');
    expect(p.name).toBe('My Milestone');
    expect(p.version).toBe('v1.2.3');
    expect(p.json).toBe(false);
    expect(p.help).toBe(false);
  });

  it('parses the --flag=value form', () => {
    const p = parseRetroArgs([
      'milestone',
      '--since=deadbeef',
      '--changelog=CHANGELOG.md',
      '--sessions=/tmp/s.jsonl',
      '--json',
    ]);
    expect(p.since).toBe('deadbeef');
    expect(p.changelog).toBe('CHANGELOG.md');
    expect(p.sessions).toBe('/tmp/s.jsonl');
    expect(p.json).toBe(true);
  });

  it('recognises help', () => {
    expect(parseRetroArgs(['--help']).help).toBe(true);
    expect(parseRetroArgs([]).subcommand).toBeUndefined();
  });
});

describe('collectGitMetrics (real git, no ProcessContext)', () => {
  it.skipIf(!hasParentCommit())('derives commit count and source LOC for a range', () => {
    // HEAD~1..HEAD exists whenever the checkout has history (skipped under a
    // shallow depth-1 CI checkout, where HEAD has no parent).
    const m = collectGitMetrics({ since: 'HEAD~1', name: 'test', version: 'v0' });
    expect(m.milestone_name).toBe('test');
    expect(m.milestone_version).toBe('v0');
    expect(m.commits).toBeGreaterThanOrEqual(1);
    expect(m.source_loc).toBeGreaterThanOrEqual(0);
    // Fields git cannot supply default to 0.
    expect(m.total_tokens).toBe(0);
    expect(m.phases).toBe(0);
  });
});
