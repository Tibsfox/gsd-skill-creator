import { describe, it, expect } from 'vitest';
import { updateFrontmatterField, removeFrontmatterField, setSkillStatus } from './frontmatter-edit.js';

const DOC = `---
name: demo-skill
description: a demo
status: active
version: 1.0.0
---

# Body

Some content.
`;

describe('updateFrontmatterField', () => {
  it('updates an existing key in place (no duplicate)', () => {
    const out = updateFrontmatterField(DOC, 'status', 'retired');
    expect(out).toContain('status: retired');
    expect(out).not.toContain('status: active');
    // exactly one status line
    expect(out.match(/^status:/gm)).toHaveLength(1);
    // body untouched
    expect(out).toContain('# Body');
    expect(out).toContain('version: 1.0.0');
  });

  it('appends when the key is absent', () => {
    const out = updateFrontmatterField(DOC, 'retired', '2026-07-12');
    expect(out).toContain('retired: 2026-07-12');
    // inserted inside the frontmatter block, before the closing ---
    const fmEnd = out.indexOf('\n---', 4);
    expect(out.indexOf('retired: 2026-07-12')).toBeLessThan(fmEnd);
  });

  it('is idempotent on re-run with the same value', () => {
    const once = updateFrontmatterField(DOC, 'status', 'retired');
    const twice = updateFrontmatterField(once, 'status', 'retired');
    expect(twice).toBe(once);
  });

  it('quotes a value that would otherwise mis-parse (colon)', () => {
    const out = updateFrontmatterField(DOC, 'retire_reason', 'superseded by: other-skill');
    expect(out).toContain('retire_reason: "superseded by: other-skill"');
  });

  it('throws on content without frontmatter', () => {
    expect(() => updateFrontmatterField('# just a heading\n', 'status', 'x')).toThrow(/no leading frontmatter/);
  });
});

describe('removeFrontmatterField', () => {
  it('removes a present key and is a no-op when absent', () => {
    const withKey = updateFrontmatterField(DOC, 'retired', '2026-07-12');
    const removed = removeFrontmatterField(withKey, 'retired');
    expect(removed).not.toContain('retired:');
    expect(removeFrontmatterField(removed, 'retired')).toBe(removed);
  });
});

describe('setSkillStatus', () => {
  it('stamps retirement metadata on retire', () => {
    const out = setSkillStatus(DOC, 'retired', { retiredAt: '2026-07-12', reason: 'zero activations' });
    expect(out).toContain('status: retired');
    expect(out).toContain('retired: 2026-07-12');
    expect(out).toContain('retire_reason: zero activations');
  });

  it('clears retirement metadata on restore, round-tripping cleanly', () => {
    const retired = setSkillStatus(DOC, 'retired', { retiredAt: '2026-07-12', reason: 'zero activations' });
    const restored = setSkillStatus(retired, 'active');
    expect(restored).toContain('status: active');
    expect(restored).not.toContain('retired:');
    expect(restored).not.toContain('retire_reason:');
    // structurally back to a single active status
    expect(restored.match(/^status:/gm)).toHaveLength(1);
  });
});
