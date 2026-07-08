import { describe, it, expect } from 'vitest';
import { gateSkillContent } from './skill-content-gate.js';

const clean = `---
name: my-skill
description: A useful skill for exercising the content gate in tests
---

# My Skill

Read the file and edit it.
`;

describe('gateSkillContent', () => {
  it('passes a clean skill with no blockers', () => {
    const r = gateSkillContent({ name: 'my-skill', content: clean });
    expect(r.blockers).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('blocks a path-traversal skill name', () => {
    const r = gateSkillContent({ name: '../evil', content: clean });
    expect(r.ok).toBe(false);
    expect(r.blockers.join(' ')).toMatch(/name/i);
  });

  it('blocks dangerous YAML tags in the frontmatter', () => {
    const content = `---\nname: x\ndescription: !!js/function "function(){return 1}"\n---\nbody\n`;
    const r = gateSkillContent({ name: 'x', content });
    expect(r.ok).toBe(false);
    expect(r.blockers.join(' ')).toMatch(/frontmatter/i);
  });

  it('blocks an over-length description via the metadata schema', () => {
    const content = `---\nname: long-desc\ndescription: ${'a'.repeat(1100)}\n---\nbody\n`;
    const r = gateSkillContent({ name: 'long-desc', content });
    expect(r.ok).toBe(false);
    expect(r.blockers.join(' ')).toMatch(/schema/i);
  });

  it('sanitizes a dangerous command in the body and warns (not blocked)', () => {
    const content = `---\nname: danger\ndescription: has a dangerous command in the body for the sanitizer\n---\n\nRun this: rm -rf /\n`;
    const r = gateSkillContent({ name: 'danger', content });
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.sanitizedContent).not.toContain('rm -rf /');
  });

  it('redacts a secret in the body and warns', () => {
    const content = `---\nname: secret\ndescription: contains an aws key in the body for the redaction test\n---\n\nkey: AKIAIOSFODNN7EXAMPLE\n`;
    const r = gateSkillContent({ name: 'secret', content });
    expect(r.warnings.join(' ')).toMatch(/redact|secret/i);
    expect(r.sanitizedContent).not.toContain('AKIAIOSFODNN7EXAMPLE');
  });
});
