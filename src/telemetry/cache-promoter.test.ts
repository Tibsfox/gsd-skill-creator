import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CachePromoter } from './cache-promoter.js';
import type { SkillStore } from '../storage/skill-store.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSkillData(cacheTier?: string, useLegacyFormat = false) {
  if (useLegacyFormat && cacheTier) {
    return {
      body: 'skill content',
      metadata: {
        name: 'test-skill',
        description: 'A test skill',
        cacheTier, // legacy root-level format
      },
    };
  }
  if (cacheTier) {
    return {
      body: 'skill content',
      metadata: {
        name: 'test-skill',
        description: 'A test skill',
        metadata: {
          extensions: {
            'gsd-skill-creator': { cacheTier, enabled: true, version: 1 },
          },
        },
      },
    };
  }
  return {
    body: 'skill content',
    metadata: {
      name: 'test-skill',
      description: 'A test skill',
      metadata: {
        extensions: {
          'gsd-skill-creator': { enabled: true, version: 1 },
        },
      },
    },
  };
}

function makeMockStore(overrides: Partial<SkillStore> = {}): SkillStore {
  return {
    read: vi.fn().mockResolvedValue(makeSkillData()),
    update: vi.fn().mockResolvedValue(undefined),
    create: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    exists: vi.fn(),
    ...overrides,
  } as unknown as SkillStore;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CachePromoter.promote()', () => {
  let mockStore: SkillStore;

  beforeEach(() => {
    mockStore = makeMockStore();
    vi.clearAllMocks();
  });

  it('promotes skill with no cacheTier to static and records in promoted[]', async () => {
    (mockStore.read as ReturnType<typeof vi.fn>).mockResolvedValue(makeSkillData());
    const promoter = new CachePromoter(mockStore);
    const result = await promoter.promote(['skill-a']);

    expect(result.promoted).toContain('skill-a');
    expect(result.alreadyStatic).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(mockStore.update).toHaveBeenCalledOnce();
  });

  it('records update call with cacheTier=static in the extension metadata', async () => {
    (mockStore.read as ReturnType<typeof vi.fn>).mockResolvedValue(makeSkillData());
    const promoter = new CachePromoter(mockStore);
    await promoter.promote(['skill-a']);

    const [, updatedMeta] = (mockStore.update as ReturnType<typeof vi.fn>).mock.calls[0];
    const ext = updatedMeta?.metadata?.extensions?.['gsd-skill-creator'];
    expect(ext?.cacheTier).toBe('static');
  });

  it('skips skill already at cacheTier=static (new format) and records in alreadyStatic[]', async () => {
    (mockStore.read as ReturnType<typeof vi.fn>).mockResolvedValue(makeSkillData('static'));
    const promoter = new CachePromoter(mockStore);
    const result = await promoter.promote(['already-static']);

    expect(result.alreadyStatic).toContain('already-static');
    expect(result.promoted).toHaveLength(0);
    expect(mockStore.update).not.toHaveBeenCalled();
  });

  it('skips skill already at cacheTier=static (legacy root-level format) and records in alreadyStatic[]', async () => {
    (mockStore.read as ReturnType<typeof vi.fn>).mockResolvedValue(makeSkillData('static', true));
    const promoter = new CachePromoter(mockStore);
    const result = await promoter.promote(['legacy-static']);

    expect(result.alreadyStatic).toContain('legacy-static');
    expect(result.promoted).toHaveLength(0);
    expect(mockStore.update).not.toHaveBeenCalled();
  });

  it('records error when skillStore.read() throws, continues with other skills', async () => {
    (mockStore.read as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('Skill not found: missing-skill'))
      .mockResolvedValue(makeSkillData());

    const promoter = new CachePromoter(mockStore);
    const result = await promoter.promote(['missing-skill', 'good-skill']);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].skillName).toBe('missing-skill');
    expect(result.errors[0].error).toContain('Skill not found');
    expect(result.promoted).toContain('good-skill');
  });

  it('records error when skillStore.update() throws, continues with other skills', async () => {
    (mockStore.read as ReturnType<typeof vi.fn>).mockResolvedValue(makeSkillData());
    (mockStore.update as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('Write failed'))
      .mockResolvedValue(undefined);

    const promoter = new CachePromoter(mockStore);
    const result = await promoter.promote(['fail-skill', 'good-skill']);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].skillName).toBe('fail-skill');
    expect(result.promoted).toContain('good-skill');
  });

  it('returns empty result for empty highValueSkills array', async () => {
    const promoter = new CachePromoter(mockStore);
    const result = await promoter.promote([]);

    expect(result.promoted).toHaveLength(0);
    expect(result.alreadyStatic).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(mockStore.read).not.toHaveBeenCalled();
    expect(mockStore.update).not.toHaveBeenCalled();
  });

  it('handles mixed result: 1 promoted + 1 already static + 1 error', async () => {
    (mockStore.read as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(makeSkillData())            // will be promoted
      .mockResolvedValueOnce(makeSkillData('static'))    // already static
      .mockRejectedValueOnce(new Error('Not found'));    // error

    const promoter = new CachePromoter(mockStore);
    const result = await promoter.promote(['to-promote', 'already-static', 'missing']);

    expect(result.promoted).toEqual(['to-promote']);
    expect(result.alreadyStatic).toEqual(['already-static']);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].skillName).toBe('missing');
  });
});
