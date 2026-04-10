import { describe, it, expect } from 'vitest';
import {
  isStorageAllowed,
  inferVisibility,
  routeToDatabase,
  STORAGE_POLICIES,
} from '../types.js';
import type { MemoryType, MemoryScope } from '../types.js';

// ─── STORAGE_POLICIES invariants ─────────────────────────────────────────────

describe('STORAGE_POLICIES', () => {
  it('HARD RULE: private never allows external sync', () => {
    expect(STORAGE_POLICIES.private.allowExternalSync).toBe(false);
  });

  it('HARD RULE: private never allows public site', () => {
    expect(STORAGE_POLICIES.private.allowPublicSite).toBe(false);
  });

  it('HARD RULE: private never allows git commit', () => {
    expect(STORAGE_POLICIES.private.allowGitCommit).toBe(false);
  });

  it('internal does not allow external sync', () => {
    expect(STORAGE_POLICIES.internal.allowExternalSync).toBe(false);
  });

  it('internal does not allow public site', () => {
    expect(STORAGE_POLICIES.internal.allowPublicSite).toBe(false);
  });

  it('internal allows git commit', () => {
    expect(STORAGE_POLICIES.internal.allowGitCommit).toBe(true);
  });

  it('public allows everything', () => {
    expect(STORAGE_POLICIES.public.allowExternalSync).toBe(true);
    expect(STORAGE_POLICIES.public.allowPublicSite).toBe(true);
    expect(STORAGE_POLICIES.public.allowGitCommit).toBe(true);
  });

  it('all visibility levels allow local storage', () => {
    for (const policy of Object.values(STORAGE_POLICIES)) {
      expect(policy.allowedLocalTiers.length).toBeGreaterThan(0);
    }
  });
});

// ─── isStorageAllowed() ──────────────────────────────────────────────────────

describe('isStorageAllowed()', () => {
  it('local storage always allowed for all visibility levels', () => {
    expect(isStorageAllowed('private', 'local')).toBe(true);
    expect(isStorageAllowed('internal', 'local')).toBe(true);
    expect(isStorageAllowed('public', 'local')).toBe(true);
  });

  it('external sync blocked for private', () => {
    expect(isStorageAllowed('private', 'external-sync')).toBe(false);
  });

  it('external sync blocked for internal', () => {
    expect(isStorageAllowed('internal', 'external-sync')).toBe(false);
  });

  it('external sync allowed for public', () => {
    expect(isStorageAllowed('public', 'external-sync')).toBe(true);
  });

  it('public site blocked for private and internal', () => {
    expect(isStorageAllowed('private', 'public-site')).toBe(false);
    expect(isStorageAllowed('internal', 'public-site')).toBe(false);
  });

  it('public site allowed for public', () => {
    expect(isStorageAllowed('public', 'public-site')).toBe(true);
  });

  it('git commit blocked for private', () => {
    expect(isStorageAllowed('private', 'git-commit')).toBe(false);
  });

  it('git commit allowed for internal and public', () => {
    expect(isStorageAllowed('internal', 'git-commit')).toBe(true);
    expect(isStorageAllowed('public', 'git-commit')).toBe(true);
  });
});

// ─── inferVisibility() ──────────────────────────────────────────────────────

describe('inferVisibility()', () => {
  it('session scope is always private', () => {
    expect(inferVisibility('user', 'session')).toBe('private');
    expect(inferVisibility('feedback', 'session')).toBe('private');
    expect(inferVisibility('project', 'session')).toBe('private');
    expect(inferVisibility('semantic', 'session')).toBe('private');
  });

  it('private tags force private regardless of type/scope', () => {
    expect(inferVisibility('semantic', 'global', ['credentials'])).toBe('private');
    expect(inferVisibility('reference', 'global', ['personal'])).toBe('private');
    expect(inferVisibility('project', 'project', ['ip'])).toBe('private');
    expect(inferVisibility('feedback', 'global', ['classified'])).toBe('private');
    expect(inferVisibility('semantic', 'domain', ['secret'])).toBe('private');
  });

  it('user type memories are private (personal information)', () => {
    expect(inferVisibility('user', 'global')).toBe('private');
    expect(inferVisibility('user', 'project')).toBe('private');
  });

  it('published/research tags make things public', () => {
    expect(inferVisibility('project', 'project', ['published'])).toBe('public');
    expect(inferVisibility('feedback', 'global', ['research'])).toBe('public');
    expect(inferVisibility('episodic', 'project', ['documentation'])).toBe('public');
    expect(inferVisibility('project', 'project', ['www'])).toBe('public');
  });

  it('domain semantic knowledge is public', () => {
    expect(inferVisibility('semantic', 'domain')).toBe('public');
  });

  it('global references are public', () => {
    expect(inferVisibility('reference', 'global')).toBe('public');
  });

  it('project memories are internal by default', () => {
    expect(inferVisibility('project', 'project')).toBe('internal');
  });

  it('feedback memories are internal by default', () => {
    expect(inferVisibility('feedback', 'project')).toBe('internal');
    expect(inferVisibility('feedback', 'branch')).toBe('internal');
  });

  it('episodic memories are private', () => {
    expect(inferVisibility('episodic', 'project')).toBe('private');
    expect(inferVisibility('episodic', 'global')).toBe('private');
  });

  it('private tags override public tags (conservative)', () => {
    // Both private and public tags — private wins because it's checked first
    expect(inferVisibility('semantic', 'domain', ['credentials', 'published'])).toBe('private');
  });

  it('default is internal (conservative)', () => {
    // Unusual combination that doesn't match specific rules
    expect(inferVisibility('semantic', 'branch')).toBe('internal');
  });
});

// ─── routeToDatabase() ──────────────────────────────────────────────────────

describe('routeToDatabase()', () => {
  it('private routes to local only', () => {
    const route = routeToDatabase('private');
    expect(route.local.host).toBe('localhost');
    expect(route.local.schema).toBe('artemis');
    expect(route.external).toBeNull();
  });

  it('internal routes to local only', () => {
    const route = routeToDatabase('internal');
    expect(route.local.host).toBe('localhost');
    expect(route.external).toBeNull();
  });

  it('public routes to local AND external', () => {
    const route = routeToDatabase('public');
    expect(route.local.host).toBe('localhost');
    expect(route.external).not.toBeNull();
    expect(route.external!.host).toBe('tibsfox.com');
  });

  it('all routes include local database', () => {
    for (const vis of ['private', 'internal', 'public'] as const) {
      const route = routeToDatabase(vis);
      expect(route.local).toBeDefined();
      expect(route.local.schema).toBe('artemis');
    }
  });
});

// ─── Visibility ordering ─────────────────────────────────────────────────────

describe('Visibility ordering', () => {
  it('private is most restrictive, public is least', () => {
    // Private blocks the most
    const privateBlocks = [
      !isStorageAllowed('private', 'external-sync'),
      !isStorageAllowed('private', 'public-site'),
      !isStorageAllowed('private', 'git-commit'),
    ].filter(Boolean).length;

    const internalBlocks = [
      !isStorageAllowed('internal', 'external-sync'),
      !isStorageAllowed('internal', 'public-site'),
      !isStorageAllowed('internal', 'git-commit'),
    ].filter(Boolean).length;

    const publicBlocks = [
      !isStorageAllowed('public', 'external-sync'),
      !isStorageAllowed('public', 'public-site'),
      !isStorageAllowed('public', 'git-commit'),
    ].filter(Boolean).length;

    expect(privateBlocks).toBeGreaterThan(internalBlocks);
    expect(internalBlocks).toBeGreaterThan(publicBlocks);
    expect(publicBlocks).toBe(0);
  });
});
