import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DiffSummary, FileDiff, GateDecision } from '../types.js';

// ---------------------------------------------------------------------------
// Mock child_process and fs before importing module under test
// ---------------------------------------------------------------------------

const { mockExecSync } = vi.hoisted(() => ({
  mockExecSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execSync: mockExecSync,
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
  appendFileSync: vi.fn(),
  readFileSync: vi.fn(() => JSON.stringify({
    repo: 'test-repo',
    upstream: 'https://github.com/upstream/repo.git',
    origin: 'https://github.com/user/repo.git',
    devBranch: 'dev',
    mainBranch: 'main',
    gates: { mergeToMain: true, prToUpstream: true },
    worktreeRoot: '/tmp/worktrees/test-repo',
    installedAt: '2026-02-26T10:00:00Z',
    lastSync: null,
  })),
}));

// Import after mocks are set up
import {
  groupFiles,
  generatePRDescription,
  presentMergeGate,
  presentPRGate,
} from './hitl-gate.js';
import type {
  GatePresentation,
  GatePromptFn,
  PRPromptFn,
  PRGateDecision,
  FileGroupDisplay,
} from './hitl-gate.js';
import type { CommitEntry } from './pre-flight.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFileDiff(overrides: Partial<FileDiff> = {}): FileDiff {
  return {
    path: 'src/git/types.ts',
    status: 'added',
    insertions: 42,
    deletions: 0,
    ...overrides,
  };
}

function makeDiffSummary(overrides: Partial<DiffSummary> = {}): DiffSummary {
  return {
    filesChanged: 3,
    insertions: 42,
    deletions: 7,
    files: [makeFileDiff()],
    ...overrides,
  };
}

function makeCommitEntry(overrides: Partial<CommitEntry> = {}): CommitEntry {
  return {
    hash: 'abc1234',
    subject: 'feat: add types',
    author: 'Alice',
    date: '2026-02-26T10:00:00Z',
    ...overrides,
  };
}

function setupCleanRepoMocks(): void {
  mockExecSync.mockImplementation((cmd: string) => {
    if (cmd.includes('rev-parse --git-dir')) return '.git';
    if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'dev';
    if (cmd.includes('status --porcelain=v2')) return '';
    if (cmd.includes('remote -v')) {
      return 'origin\thttps://github.com/user/repo.git (fetch)\nupstream\thttps://github.com/upstream/repo.git (fetch)\n';
    }
    if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
    if (cmd.includes('rev-list --left-right')) return '0\t0';
    if (cmd.includes('rev-list --count main..dev')) return '3';
    if (cmd.includes('rev-list --count dev..upstream/main')) return '0';
    if (cmd.includes('rev-list --count upstream/main..main')) return '3';
    if (cmd.includes('diff --stat')) {
      return ' src/foo.ts | 10 +++++++---\n src/bar.ts | 5 +++++\n 2 files changed, 12 insertions(+), 3 deletions(-)';
    }
    if (cmd.includes('diff --name-status')) return 'A\tsrc/foo.ts\nM\tsrc/bar.ts';
    if (cmd.includes('diff --numstat')) return '10\t3\tsrc/foo.ts\n5\t0\tsrc/bar.ts';
    if (cmd.includes('log --format=')) {
      return 'abc1234|feat: add foo|Alice|2026-02-26T10:00:00Z\ndef5678|fix: fix bar|Bob|2026-02-26T11:00:00Z\nghi9012|test: add tests|Alice|2026-02-26T12:00:00Z';
    }
    if (cmd.includes('merge --no-commit --no-ff')) return '';
    if (cmd.includes('merge --abort')) return '';
    if (cmd.includes('checkout')) return '';
    if (cmd.includes('cat-file -s')) return '500';
    return '';
  });
}

// ---------------------------------------------------------------------------
// groupFiles
// ---------------------------------------------------------------------------

describe('groupFiles', () => {
  it('groups source files (src/, lib/) under "Source files"', () => {
    const files: FileDiff[] = [
      makeFileDiff({ path: 'src/git/types.ts', status: 'added' }),
      makeFileDiff({ path: 'lib/utils.ts', status: 'modified' }),
    ];
    const groups = groupFiles(files);
    const source = groups.find((g: FileGroupDisplay) => g.name === 'Source files');
    expect(source).toBeDefined();
    expect(source!.files).toHaveLength(2);
  });

  it('groups test files under "Tests"', () => {
    const files: FileDiff[] = [
      makeFileDiff({ path: 'test/unit/foo.test.ts', status: 'added' }),
      makeFileDiff({ path: 'src/git/types.test.ts', status: 'added' }),
      makeFileDiff({ path: '__tests__/bar.spec.ts', status: 'modified' }),
    ];
    const groups = groupFiles(files);
    const tests = groups.find((g: FileGroupDisplay) => g.name === 'Tests');
    expect(tests).toBeDefined();
    expect(tests!.files).toHaveLength(3);
  });

  it('groups config files under "Configuration"', () => {
    const files: FileDiff[] = [
      makeFileDiff({ path: 'package.json', status: 'modified' }),
      makeFileDiff({ path: 'tsconfig.json', status: 'modified' }),
      makeFileDiff({ path: 'vitest.config.ts', status: 'added' }),
    ];
    const groups = groupFiles(files);
    const config = groups.find((g: FileGroupDisplay) => g.name === 'Configuration');
    expect(config).toBeDefined();
    expect(config!.files).toHaveLength(3);
  });

  it('groups documentation under "Documentation"', () => {
    const files: FileDiff[] = [
      makeFileDiff({ path: 'README.md', status: 'modified' }),
      makeFileDiff({ path: 'docs/guide.md', status: 'added' }),
      makeFileDiff({ path: 'CHANGELOG.md', status: 'modified' }),
    ];
    const groups = groupFiles(files);
    const docs = groups.find((g: FileGroupDisplay) => g.name === 'Documentation');
    expect(docs).toBeDefined();
    expect(docs!.files).toHaveLength(3);
  });

  it('groups scripts under "Scripts"', () => {
    const files: FileDiff[] = [
      makeFileDiff({ path: 'scripts/build.sh', status: 'added' }),
      makeFileDiff({ path: 'bin/cli.js', status: 'added' }),
    ];
    const groups = groupFiles(files);
    const scripts = groups.find((g: FileGroupDisplay) => g.name === 'Scripts');
    expect(scripts).toBeDefined();
    expect(scripts!.files).toHaveLength(2);
  });

  it('groups unknown files under "Other"', () => {
    const files: FileDiff[] = [
      makeFileDiff({ path: 'Makefile', status: 'modified' }),
      makeFileDiff({ path: '.gitignore', status: 'added' }),
    ];
    const groups = groupFiles(files);
    const other = groups.find((g: FileGroupDisplay) => g.name === 'Other');
    expect(other).toBeDefined();
    expect(other!.files).toHaveLength(2);
  });

  it('omits empty groups', () => {
    const files: FileDiff[] = [
      makeFileDiff({ path: 'src/main.ts', status: 'added' }),
    ];
    const groups = groupFiles(files);
    // Should only have Source files, no Tests/Config/Docs/Scripts/Other
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Source files');
  });

  it('each file entry has path, status icon, and delta string', () => {
    const files: FileDiff[] = [
      makeFileDiff({ path: 'src/foo.ts', status: 'added', insertions: 10, deletions: 0 }),
      makeFileDiff({ path: 'src/bar.ts', status: 'modified', insertions: 5, deletions: 3 }),
      makeFileDiff({ path: 'src/baz.ts', status: 'deleted', insertions: 0, deletions: 20 }),
      makeFileDiff({ path: 'src/old.ts', status: 'renamed', insertions: 2, deletions: 2 }),
    ];
    const groups = groupFiles(files);
    const source = groups.find((g: FileGroupDisplay) => g.name === 'Source files')!;

    for (const file of source.files) {
      expect(file).toHaveProperty('path');
      expect(file).toHaveProperty('icon');
      expect(file).toHaveProperty('delta');
      expect(typeof file.path).toBe('string');
      expect(typeof file.icon).toBe('string');
      expect(typeof file.delta).toBe('string');
    }

    // Check specific icons
    const addedFile = source.files.find(f => f.path === 'src/foo.ts')!;
    expect(addedFile.icon).toBe('+');
    const modifiedFile = source.files.find(f => f.path === 'src/bar.ts')!;
    expect(modifiedFile.icon).toBe('*');
    const deletedFile = source.files.find(f => f.path === 'src/baz.ts')!;
    expect(deletedFile.icon).toBe('-');
    const renamedFile = source.files.find(f => f.path === 'src/old.ts')!;
    expect(renamedFile.icon).toBe('>');
  });
});

// ---------------------------------------------------------------------------
// generatePRDescription
// ---------------------------------------------------------------------------

describe('generatePRDescription', () => {
  it('5 commits across 2 features produce coherent summary, not raw commit log', () => {
    const commits: CommitEntry[] = [
      makeCommitEntry({ hash: 'a1', subject: 'feat: add authentication module' }),
      makeCommitEntry({ hash: 'a2', subject: 'feat: add session management' }),
      makeCommitEntry({ hash: 'a3', subject: 'fix: correct token expiration logic' }),
      makeCommitEntry({ hash: 'a4', subject: 'test: add auth test suite' }),
      makeCommitEntry({ hash: 'a5', subject: 'docs: update API documentation' }),
    ];
    const diff = makeDiffSummary({ filesChanged: 8, insertions: 200, deletions: 15 });

    const description = generatePRDescription(commits, diff);

    // Contains structured sections
    expect(description).toContain('## Summary');
    expect(description).toContain('## Changes');
    expect(description).toContain('## Testing');

    // Is NOT just a raw commit log (should not have all commit hashes listed raw)
    expect(description).not.toMatch(/a1\na2\na3\na4\na5/);
  });

  it('single-commit PR produces simpler description', () => {
    const commits: CommitEntry[] = [
      makeCommitEntry({ hash: 'x1', subject: 'fix: correct null check in parser' }),
    ];
    const diff = makeDiffSummary({ filesChanged: 1, insertions: 3, deletions: 1 });

    const description = generatePRDescription(commits, diff);

    expect(description).toContain('## Summary');
    // Should be relatively short/simple
    expect(description.length).toBeLessThan(1000);
  });

  it('large PR (20+ commits) organized by theme', () => {
    const commits: CommitEntry[] = [];
    for (let i = 0; i < 25; i++) {
      const types = ['feat', 'fix', 'test', 'docs', 'refactor'];
      const type = types[i % types.length];
      commits.push(makeCommitEntry({
        hash: `h${i}`,
        subject: `${type}: change ${i}`,
      }));
    }
    const diff = makeDiffSummary({ filesChanged: 30, insertions: 1500, deletions: 200 });

    const description = generatePRDescription(commits, diff);

    expect(description).toContain('## Summary');
    expect(description).toContain('## Changes');
    // Should include file count stats for large PRs
    expect(description).toMatch(/\d+ files? changed/i);
  });
});

// ---------------------------------------------------------------------------
// presentMergeGate
// ---------------------------------------------------------------------------

describe('presentMergeGate', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    setupCleanRepoMocks();
  });

  it('calls preFlightMerge first and returns GatePresentation', async () => {
    const promptFn: GatePromptFn = vi.fn().mockResolvedValue({
      gate: 'merge-to-main',
      approved: true,
      timestamp: new Date().toISOString(),
      summary: makeDiffSummary(),
    } satisfies GateDecision);

    const result = await presentMergeGate('/repo', promptFn);

    // promptFn was called with a presentation
    expect(promptFn).toHaveBeenCalledTimes(1);
    const presentation = (promptFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as GatePresentation;
    expect(presentation).toHaveProperty('title');
    expect(presentation).toHaveProperty('summary');
    expect(presentation).toHaveProperty('stats');
    expect(presentation).toHaveProperty('fileGroups');
    expect(presentation).toHaveProperty('commits');
  });

  it('if pre-flight has blockers, gate presentation includes blockers list', async () => {
    // Setup dirty repo
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'dev';
      if (cmd.includes('status --porcelain=v2')) return '1 .M N... 100644 100644 100644 abc def src/dirty.ts';
      if (cmd.includes('remote -v')) return 'origin\thttps://x (fetch)\nupstream\thttps://y (fetch)\n';
      if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
      if (cmd.includes('rev-list')) return '0';
      return '';
    });

    const promptFn: GatePromptFn = vi.fn().mockResolvedValue({
      gate: 'merge-to-main',
      approved: false,
      timestamp: new Date().toISOString(),
      summary: makeDiffSummary(),
    } satisfies GateDecision);

    const result = await presentMergeGate('/repo', promptFn);

    const presentation = (promptFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as GatePresentation;
    expect(presentation.blockers).toBeDefined();
    expect(presentation.blockers!.length).toBeGreaterThan(0);
  });

  it('approve decision: returns GateDecision with approved: true', async () => {
    const approveDecision: GateDecision = {
      gate: 'merge-to-main',
      approved: true,
      timestamp: new Date().toISOString(),
      summary: makeDiffSummary(),
    };
    const promptFn: GatePromptFn = vi.fn().mockResolvedValue(approveDecision);

    const result = await presentMergeGate('/repo', promptFn);
    expect(result.approved).toBe(true);
    expect(result.gate).toBe('merge-to-main');
  });

  it('reject decision: returns GateDecision with approved: false', async () => {
    const rejectDecision: GateDecision = {
      gate: 'merge-to-main',
      approved: false,
      timestamp: new Date().toISOString(),
      summary: makeDiffSummary(),
    };
    const promptFn: GatePromptFn = vi.fn().mockResolvedValue(rejectDecision);

    const result = await presentMergeGate('/repo', promptFn);
    expect(result.approved).toBe(false);
  });

  it('sync-first decision: returns decision with action sync', async () => {
    const syncDecision: GateDecision = {
      gate: 'merge-to-main',
      approved: false,
      timestamp: new Date().toISOString(),
      summary: makeDiffSummary(),
      humanNotes: 'sync',
    };
    const promptFn: GatePromptFn = vi.fn().mockResolvedValue(syncDecision);

    const result = await presentMergeGate('/repo', promptFn);
    expect(result.approved).toBe(false);
    expect(result.humanNotes).toBe('sync');
  });
});

// ---------------------------------------------------------------------------
// presentPRGate
// ---------------------------------------------------------------------------

describe('presentPRGate', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    setupCleanRepoMocks();
  });

  it('calls preFlightPR and returns PRGateDecision with title and description', async () => {
    const prPromptFn: PRPromptFn = vi.fn().mockResolvedValue({
      gate: 'pr-to-upstream',
      approved: true,
      timestamp: new Date().toISOString(),
      summary: makeDiffSummary(),
      prTitle: 'feat: add foo support',
      prDescription: 'Generated description',
    } satisfies PRGateDecision);

    const result = await presentPRGate('/repo', prPromptFn);

    expect(prPromptFn).toHaveBeenCalledTimes(1);
    // promptFn receives presentation, title, description
    const callArgs = (prPromptFn as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs).toHaveLength(3);
    expect(typeof callArgs[1]).toBe('string'); // title
    expect(typeof callArgs[2]).toBe('string'); // description
  });

  it('approve as-is: uses generated title/description', async () => {
    const prPromptFn: PRPromptFn = vi.fn().mockResolvedValue({
      gate: 'pr-to-upstream',
      approved: true,
      timestamp: new Date().toISOString(),
      summary: makeDiffSummary(),
      prTitle: 'feat: add foo support',
      prDescription: 'Auto-generated description here',
    } satisfies PRGateDecision);

    const result = await presentPRGate('/repo', prPromptFn);
    expect(result.approved).toBe(true);
    expect(result.prTitle).toBeDefined();
    expect(result.prDescription).toBeDefined();
  });

  it('edit flow: promptFn receives title/description and returns modified versions', async () => {
    const prPromptFn: PRPromptFn = vi.fn().mockResolvedValue({
      gate: 'pr-to-upstream',
      approved: true,
      timestamp: new Date().toISOString(),
      summary: makeDiffSummary(),
      prTitle: 'edited: custom title',
      prDescription: 'Edited description by human',
    } satisfies PRGateDecision);

    const result = await presentPRGate('/repo', prPromptFn);
    expect(result.prTitle).toBe('edited: custom title');
    expect(result.prDescription).toBe('Edited description by human');
  });

  it('reject: returns approved false', async () => {
    const prPromptFn: PRPromptFn = vi.fn().mockResolvedValue({
      gate: 'pr-to-upstream',
      approved: false,
      timestamp: new Date().toISOString(),
      summary: makeDiffSummary(),
      prTitle: '',
      prDescription: '',
    } satisfies PRGateDecision);

    const result = await presentPRGate('/repo', prPromptFn);
    expect(result.approved).toBe(false);
  });

  it('bundled PR: multiple commits bundled into one coherent PR description', async () => {
    // Setup repo with many commits
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'main';
      if (cmd.includes('status --porcelain=v2')) return '';
      if (cmd.includes('remote -v')) return 'origin\thttps://x (fetch)\nupstream\thttps://y (fetch)\n';
      if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
      if (cmd.includes('rev-list --left-right')) return '0\t0';
      if (cmd.includes('rev-list --count upstream/main..main')) return '5';
      if (cmd.includes('diff --stat')) return ' src/a.ts | 10 +++\n src/b.ts | 20 +++\n 2 files changed, 30 insertions(+)';
      if (cmd.includes('diff --name-status')) return 'A\tsrc/a.ts\nA\tsrc/b.ts';
      if (cmd.includes('diff --numstat')) return '10\t0\tsrc/a.ts\n20\t0\tsrc/b.ts';
      if (cmd.includes('log --format=')) {
        return [
          'a1|feat: add module A|Alice|2026-02-26T10:00:00Z',
          'a2|feat: add module B|Bob|2026-02-26T11:00:00Z',
          'a3|fix: correct module A logic|Alice|2026-02-26T12:00:00Z',
          'a4|test: add module A tests|Alice|2026-02-26T13:00:00Z',
          'a5|test: add module B tests|Bob|2026-02-26T14:00:00Z',
        ].join('\n');
      }
      if (cmd.includes('merge --no-commit')) return '';
      if (cmd.includes('merge --abort')) return '';
      if (cmd.includes('checkout')) return '';
      if (cmd.includes('cat-file -s')) return '500';
      return '';
    });

    const prPromptFn: PRPromptFn = vi.fn().mockImplementation(
      (_presentation: GatePresentation, title: string, description: string) => {
        // Verify the generated description is coherent (not raw commit log)
        expect(description).toContain('## Summary');
        expect(description).toContain('## Changes');
        return Promise.resolve({
          gate: 'pr-to-upstream' as const,
          approved: true,
          timestamp: new Date().toISOString(),
          summary: makeDiffSummary(),
          prTitle: title,
          prDescription: description,
        });
      },
    );

    const result = await presentPRGate('/repo', prPromptFn);
    expect(result.approved).toBe(true);
    expect(result.prDescription).toContain('## Summary');
  });
});
