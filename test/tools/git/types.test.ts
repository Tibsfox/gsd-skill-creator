import { describe, it, expect } from 'vitest';
import type {
  GitState,
  GitStateReport,
  RemoteInfo,
  ScGitConfig,
  GateDecision,
  DiffSummary,
  FileDiff,
  GitOperationLog,
} from '../../../src/tools/git/types.js';
import { GIT_STATES } from '../../../src/tools/git/types.js';
import { ScGitConfigSchema, validateScGitConfig } from '../../../src/tools/git/schemas.js';

// --- Factories ---

function makeRemoteInfo(overrides: Partial<RemoteInfo> = {}): RemoteInfo {
  return {
    name: 'origin',
    url: 'https://github.com/user/repo.git',
    fetch: '+refs/heads/*:refs/remotes/origin/*',
    ...overrides,
  };
}

function makeGitStateReport(overrides: Partial<GitStateReport> = {}): GitStateReport {
  return {
    state: 'CLEAN',
    branch: 'dev',
    remotes: [makeRemoteInfo()],
    ahead: 0,
    behind: 0,
    staged: [],
    unstaged: [],
    untracked: [],
    ...overrides,
  };
}

function makeScGitConfig(overrides: Partial<ScGitConfig> = {}): ScGitConfig {
  return {
    repo: 'my-project',
    upstream: 'https://github.com/upstream/repo.git',
    origin: 'https://github.com/user/repo.git',
    devBranch: 'dev',
    mainBranch: 'main',
    gates: { mergeToMain: true, prToUpstream: true },
    worktreeRoot: '/home/user/projects/my-project',
    installedAt: '2026-02-26T22:00:00Z',
    lastSync: null,
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

function makeFileDiff(overrides: Partial<FileDiff> = {}): FileDiff {
  return {
    path: 'src/tools/git/types.ts',
    status: 'added',
    insertions: 42,
    deletions: 0,
    ...overrides,
  };
}

function makeGateDecision(overrides: Partial<GateDecision> = {}): GateDecision {
  return {
    gate: 'merge-to-main',
    approved: true,
    timestamp: '2026-02-26T22:00:00Z',
    summary: makeDiffSummary(),
    ...overrides,
  };
}

function makeGitOperationLog(overrides: Partial<GitOperationLog> = {}): GitOperationLog {
  return {
    timestamp: '2026-02-26T22:00:00Z',
    operation: 'sync',
    commands: ['git fetch upstream', 'git rebase upstream/main'],
    stateBefore: makeGitStateReport({ state: 'DIRTY' }),
    stateAfter: makeGitStateReport({ state: 'CLEAN' }),
    success: true,
    ...overrides,
  };
}

// --- Tests ---

describe('GitState', () => {
  it('covers all 6 states', () => {
    expect(GIT_STATES).toHaveLength(6);
    expect(GIT_STATES).toContain('CLEAN');
    expect(GIT_STATES).toContain('DIRTY');
    expect(GIT_STATES).toContain('MERGING');
    expect(GIT_STATES).toContain('REBASING');
    expect(GIT_STATES).toContain('DETACHED');
    expect(GIT_STATES).toContain('CONFLICT');
  });

  it('each state is a string', () => {
    for (const state of GIT_STATES) {
      expect(typeof state).toBe('string');
    }
  });
});

describe('GitStateReport', () => {
  it('has all required fields', () => {
    const report = makeGitStateReport();
    expect(report.state).toBe('CLEAN');
    expect(report.branch).toBe('dev');
    expect(report.remotes).toBeInstanceOf(Array);
    expect(typeof report.ahead).toBe('number');
    expect(typeof report.behind).toBe('number');
    expect(report.staged).toBeInstanceOf(Array);
    expect(report.unstaged).toBeInstanceOf(Array);
    expect(report.untracked).toBeInstanceOf(Array);
  });

  it('branch accepts null', () => {
    const report = makeGitStateReport({ branch: null });
    expect(report.branch).toBeNull();
  });

  it('remotes is an array of RemoteInfo', () => {
    const report = makeGitStateReport();
    expect(report.remotes).toHaveLength(1);
    expect(report.remotes[0].name).toBe('origin');
  });
});

describe('RemoteInfo', () => {
  it('has name, url, and fetch fields', () => {
    const remote = makeRemoteInfo();
    expect(remote.name).toBe('origin');
    expect(remote.url).toBe('https://github.com/user/repo.git');
    expect(remote.fetch).toBe('+refs/heads/*:refs/remotes/origin/*');
  });
});

describe('ScGitConfig', () => {
  it('has all required fields', () => {
    const config = makeScGitConfig();
    expect(config.repo).toBe('my-project');
    expect(config.upstream).toContain('https://');
    expect(config.origin).toContain('https://');
    expect(config.devBranch).toBe('dev');
    expect(config.mainBranch).toBe('main');
    expect(config.worktreeRoot).toContain('/');
    expect(config.installedAt).toContain('T');
  });

  it('gates has mergeToMain and prToUpstream as booleans', () => {
    const config = makeScGitConfig();
    expect(typeof config.gates.mergeToMain).toBe('boolean');
    expect(typeof config.gates.prToUpstream).toBe('boolean');
  });

  it('lastSync accepts null', () => {
    const config = makeScGitConfig({ lastSync: null });
    expect(config.lastSync).toBeNull();
  });

  it('lastSync accepts a datetime string', () => {
    const config = makeScGitConfig({ lastSync: '2026-02-26T22:30:00Z' });
    expect(config.lastSync).toBe('2026-02-26T22:30:00Z');
  });
});

describe('GateDecision', () => {
  it('gate is merge-to-main or pr-to-upstream', () => {
    const d1 = makeGateDecision({ gate: 'merge-to-main' });
    expect(d1.gate).toBe('merge-to-main');

    const d2 = makeGateDecision({ gate: 'pr-to-upstream' });
    expect(d2.gate).toBe('pr-to-upstream');
  });

  it('approved is boolean', () => {
    const decision = makeGateDecision();
    expect(typeof decision.approved).toBe('boolean');
  });

  it('summary has filesChanged, insertions, deletions, files', () => {
    const decision = makeGateDecision();
    expect(typeof decision.summary.filesChanged).toBe('number');
    expect(typeof decision.summary.insertions).toBe('number');
    expect(typeof decision.summary.deletions).toBe('number');
    expect(decision.summary.files).toBeInstanceOf(Array);
  });

  it('humanNotes is optional', () => {
    const without = makeGateDecision();
    expect(without.humanNotes).toBeUndefined();

    const withNotes = makeGateDecision({ humanNotes: 'LGTM' });
    expect(withNotes.humanNotes).toBe('LGTM');
  });
});

describe('DiffSummary and FileDiff', () => {
  it('files is array of FileDiff', () => {
    const diff = makeDiffSummary();
    expect(diff.files).toBeInstanceOf(Array);
    expect(diff.files[0].path).toBe('src/tools/git/types.ts');
  });

  it('status is one of added, modified, deleted, renamed', () => {
    const statuses: FileDiff['status'][] = ['added', 'modified', 'deleted', 'renamed'];
    for (const status of statuses) {
      const file = makeFileDiff({ status });
      expect(statuses).toContain(file.status);
    }
  });

  it('FileDiff has path, insertions, and deletions', () => {
    const file = makeFileDiff();
    expect(typeof file.path).toBe('string');
    expect(typeof file.insertions).toBe('number');
    expect(typeof file.deletions).toBe('number');
  });
});

describe('GitOperationLog', () => {
  it('has all required fields', () => {
    const log = makeGitOperationLog();
    expect(typeof log.timestamp).toBe('string');
    expect(typeof log.operation).toBe('string');
    expect(log.commands).toBeInstanceOf(Array);
    expect(typeof log.success).toBe('boolean');
  });

  it('commands is string array', () => {
    const log = makeGitOperationLog();
    for (const cmd of log.commands) {
      expect(typeof cmd).toBe('string');
    }
  });

  it('stateBefore and stateAfter are GitStateReport-shaped', () => {
    const log = makeGitOperationLog();
    expect(log.stateBefore.state).toBe('DIRTY');
    expect(log.stateAfter.state).toBe('CLEAN');
    expect(log.stateBefore.remotes).toBeInstanceOf(Array);
    expect(log.stateAfter.remotes).toBeInstanceOf(Array);
  });

  it('error is optional', () => {
    const logOk = makeGitOperationLog();
    expect(logOk.error).toBeUndefined();

    const logErr = makeGitOperationLog({ success: false, error: 'merge conflict' });
    expect(logErr.error).toBe('merge conflict');
    expect(logErr.success).toBe(false);
  });
});

// --- Schema Validation Tests ---

describe('ScGitConfigSchema', () => {
  function makeValidConfigData() {
    return {
      repo: 'my-project',
      upstream: 'https://github.com/upstream/repo.git',
      origin: 'https://github.com/user/repo.git',
      devBranch: 'dev',
      mainBranch: 'main',
      gates: { mergeToMain: true, prToUpstream: true },
      worktreeRoot: '/home/user/projects/my-project',
      installedAt: '2026-02-26T22:00:00Z',
      lastSync: null,
    };
  }

  it('valid config passes validation', () => {
    const result = validateScGitConfig(makeValidConfigData());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.repo).toBe('my-project');
      expect(result.config.gates.mergeToMain).toBe(true);
    }
  });

  it('missing repo field fails', () => {
    const data = makeValidConfigData();
    delete (data as Record<string, unknown>).repo;
    const result = validateScGitConfig(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('repo'))).toBe(true);
    }
  });

  it('invalid URL for upstream fails', () => {
    const data = makeValidConfigData();
    data.upstream = 'not-a-url';
    const result = validateScGitConfig(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('upstream'))).toBe(true);
    }
  });

  it('lastSync accepts null', () => {
    const data = makeValidConfigData();
    data.lastSync = null;
    const result = validateScGitConfig(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.lastSync).toBeNull();
    }
  });

  it('returns typed errors array on failure', () => {
    const result = validateScGitConfig({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.errors.length).toBeGreaterThan(0);
      for (const err of result.errors) {
        expect(typeof err).toBe('string');
      }
    }
  });

  it('applies defaults for devBranch and mainBranch', () => {
    const data = makeValidConfigData();
    delete (data as Record<string, unknown>).devBranch;
    delete (data as Record<string, unknown>).mainBranch;
    const result = validateScGitConfig(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.devBranch).toBe('dev');
      expect(result.config.mainBranch).toBe('main');
    }
  });
});
