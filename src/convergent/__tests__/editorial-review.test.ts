// @ts-nocheck -- imports a .mjs script as runtime JS
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(here, '../../../scripts/convergent/editorial-review.mjs');

const mod = await import(scriptPath);
const {
  applyRigorScore,
  applySurfaceFit,
  applyReviewStatus,
  applyRigorConcerns,
  applyOpusNotes,
  reviewEntry,
  validateReviewCompleteness,
  TIER_RIGOR_DEFAULT,
  TIER_SURFACE_FIT_DEFAULT,
  ALLEGED_RIGOR_CONCERN,
  OPUS_NOTES_OVERRIDES,
} = mod;

describe('convergent editorial-review: applyRigorScore', () => {
  it('applies tier_s default rigor score', () => {
    const entry = { cite_key: 'k', tier: 'tier_s' };
    const out = applyRigorScore(entry);
    expect(out.rigor_score).toBe(TIER_RIGOR_DEFAULT.tier_s);
  });

  it('applies tier_a default rigor score', () => {
    const entry = { cite_key: 'k', tier: 'tier_a' };
    expect(applyRigorScore(entry).rigor_score).toBe(TIER_RIGOR_DEFAULT.tier_a);
  });

  it('applies tier_b default rigor score', () => {
    const entry = { cite_key: 'k', tier: 'tier_b' };
    expect(applyRigorScore(entry).rigor_score).toBe(TIER_RIGOR_DEFAULT.tier_b);
  });

  it('respects pre-existing rigor_score (no clobber)', () => {
    const entry = { cite_key: 'k', tier: 'tier_s', rigor_score: 2.0 };
    expect(applyRigorScore(entry).rigor_score).toBe(2.0);
  });

  it('returns null rigor_score for unknown tier', () => {
    const entry = { cite_key: 'k', tier: 'tier_z' };
    expect(applyRigorScore(entry).rigor_score).toBeNull();
  });
});

describe('convergent editorial-review: applySurfaceFit', () => {
  it('maps tier_s -> fit 5', () => {
    expect(applySurfaceFit({ cite_key: 'k', tier: 'tier_s' }).surface_fit).toBe(TIER_SURFACE_FIT_DEFAULT.tier_s);
  });

  it('maps tier_b -> fit 3', () => {
    expect(applySurfaceFit({ cite_key: 'k', tier: 'tier_b' }).surface_fit).toBe(TIER_SURFACE_FIT_DEFAULT.tier_b);
  });

  it('respects pre-existing surface_fit', () => {
    expect(applySurfaceFit({ cite_key: 'k', tier: 'tier_s', surface_fit: 2 }).surface_fit).toBe(2);
  });
});

describe('convergent editorial-review: applyReviewStatus', () => {
  it('marks alleged-authorship entries as alleged-authorship-unverified', () => {
    const entry = { cite_key: 'k', tier: 'tier_a', alleged_flag: true };
    expect(applyReviewStatus(entry).review_status).toBe('alleged-authorship-unverified');
  });

  it('marks Tier-S papers with opus notes override as verified', () => {
    const entry = { cite_key: 'liu2026wildskills', tier: 'tier_s', alleged_flag: false };
    expect(applyReviewStatus(entry).review_status).toBe('verified');
  });

  it('marks Tier-S alleged papers with opus notes as verified-with-authorship-caveat', () => {
    const entry = { cite_key: 'ni2026coevoskills', tier: 'tier_s', alleged_flag: true };
    expect(applyReviewStatus(entry).review_status).toBe('verified-with-authorship-caveat');
  });

  it('marks Tier-A papers without overrides as pending', () => {
    const entry = { cite_key: 'some_tier_a_paper', tier: 'tier_a', alleged_flag: false };
    expect(applyReviewStatus(entry).review_status).toBe('pending');
  });

  it('respects pre-existing review_status', () => {
    const entry = { cite_key: 'k', tier: 'tier_s', review_status: 'custom' };
    expect(applyReviewStatus(entry).review_status).toBe('custom');
  });
});

describe('convergent editorial-review: applyRigorConcerns', () => {
  it('sets standardized caveat when alleged_flag=true', () => {
    const entry = { cite_key: 'k', tier: 'tier_a', alleged_flag: true };
    expect(applyRigorConcerns(entry).rigor_concerns).toBe(ALLEGED_RIGOR_CONCERN);
  });

  it('sets null rigor_concerns when alleged_flag=false', () => {
    const entry = { cite_key: 'k', tier: 'tier_s', alleged_flag: false };
    expect(applyRigorConcerns(entry).rigor_concerns).toBeNull();
  });
});

describe('convergent editorial-review: applyOpusNotes', () => {
  it('applies Tier-S override note', () => {
    const entry = { cite_key: 'liu2026wildskills', tier: 'tier_s' };
    const note = applyOpusNotes(entry).opus_notes;
    expect(note).toBeTruthy();
    expect(note).toContain('34k-skill');
  });

  it('returns null opus_notes for keys without override', () => {
    const entry = { cite_key: 'some_tier_b_paper', tier: 'tier_b' };
    expect(applyOpusNotes(entry).opus_notes).toBeNull();
  });

  it('allows custom overrides to shadow defaults', () => {
    const entry = { cite_key: 'liu2026wildskills', tier: 'tier_s' };
    const custom = { liu2026wildskills: 'custom note' };
    expect(applyOpusNotes(entry, custom).opus_notes).toBe('custom note');
  });
});

describe('convergent editorial-review: reviewEntry (compose)', () => {
  it('applies all transforms in one shot', () => {
    const entry = { cite_key: 'liu2026wildskills', tier: 'tier_s', alleged_flag: false };
    const out = reviewEntry(entry);
    expect(out.rigor_score).toBe(4.5);
    expect(out.surface_fit).toBe(5);
    expect(out.review_status).toBe('verified');
    expect(out.rigor_concerns).toBeNull();
    expect(out.opus_notes).toContain('34k-skill');
  });

  it('produces idempotent output (running twice gives same fields)', () => {
    const entry = { cite_key: 'liu2026wildskills', tier: 'tier_s', alleged_flag: false };
    const once = reviewEntry(entry);
    const twice = reviewEntry(once);
    expect(twice).toEqual(once);
  });
});

describe('convergent editorial-review: validateReviewCompleteness', () => {
  it('passes when all entries have review fields populated and all Tier-S are verified', () => {
    const entries = Object.keys(OPUS_NOTES_OVERRIDES).map((cite_key) => reviewEntry({
      cite_key,
      tier: 'tier_s',
      alleged_flag: false,
    }));
    const res = validateReviewCompleteness(entries);
    expect(res.pass).toBe(true);
    expect(res.tier_s_verified).toBe(entries.length);
    expect(res.tier_s_total).toBe(entries.length);
  });

  it('fails when entries have missing review fields', () => {
    const entries = [
      { cite_key: 'k1', tier: 'tier_a', rigor_score: 4.0, surface_fit: 4, review_status: 'pending' },
      { cite_key: 'k2', tier: 'tier_a' /* no review fields */ },
    ];
    const res = validateReviewCompleteness(entries);
    expect(res.pass).toBe(false);
    expect(res.problems).toHaveLength(1);
    expect(res.problems[0].cite_key).toBe('k2');
    expect(res.problems[0].missing).toContain('rigor_score');
    expect(res.problems[0].missing).toContain('surface_fit');
    expect(res.problems[0].missing).toContain('review_status');
  });

  it('counts alleged entries correctly', () => {
    const entries = [
      reviewEntry({ cite_key: 'k1', tier: 'tier_a', alleged_flag: true }),
      reviewEntry({ cite_key: 'k2', tier: 'tier_a', alleged_flag: false }),
    ];
    const res = validateReviewCompleteness(entries);
    expect(res.alleged_pending).toBe(1);
  });

  it('fails when some Tier-S papers lack verified status', () => {
    const entries = [
      reviewEntry({ cite_key: 'liu2026wildskills', tier: 'tier_s', alleged_flag: false }),
      { cite_key: 'unknown_tier_s', tier: 'tier_s', rigor_score: 4.5, surface_fit: 5, review_status: 'pending' },
    ];
    const res = validateReviewCompleteness(entries);
    expect(res.pass).toBe(false);
    expect(res.tier_s_verified).toBe(1);
    expect(res.tier_s_total).toBe(2);
  });
});

describe('convergent editorial-review: OPUS_NOTES_OVERRIDES integrity', () => {
  it('has an entry for all 7 Tier-S cite_keys', () => {
    const expected = [
      'liu2026wildskills',
      'ni2026coevoskills',
      'shen2026compression',
      'qin2026ecm',
      'zhao2026safetyrisks',
      'liu2026claudecode',
      'jiang2026agentskills',
    ];
    for (const key of expected) {
      expect(OPUS_NOTES_OVERRIDES[key]).toBeTruthy();
      expect(OPUS_NOTES_OVERRIDES[key].length).toBeGreaterThan(80);
    }
  });

  it('every Tier-S note mentions at least one specific number or arxiv convention', () => {
    for (const [key, note] of Object.entries(OPUS_NOTES_OVERRIDES)) {
      const hasNumericOrConvention = /\d+|[kK]\b|CAPCOM|ECM|ASR|SD|pp|Tier-/.test(note);
      expect(hasNumericOrConvention, `note for ${key} lacks numeric/convention detail`).toBe(true);
    }
  });
});
