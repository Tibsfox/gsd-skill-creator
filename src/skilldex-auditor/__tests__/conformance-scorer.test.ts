/**
 * conformance-scorer test suite.
 *
 * Covers parse + score for ≥3 SKILL.md fixtures, plus PASS / FAIL / WARN
 * paths called out in the Phase 765 acceptance criteria.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  parseSkillContent,
  parseSkillFile,
  scoreSpec,
} from '../conformance-scorer.js';

function fixture(content: string): string {
  const tmp = path.join(
    os.tmpdir(),
    `skilldex-fixture-${Date.now()}-${Math.random().toString(36).slice(2)}.md`,
  );
  fs.writeFileSync(tmp, content);
  return tmp;
}

const VALID_FIXTURE = `---
name: example-skill
description: A perfectly conformant SKILL.md fixture.
version: 1.0.0
---

# Example

## Usage

Body content here.
`;

const MISSING_NAME_FIXTURE = `---
description: Missing the name field.
version: 1.0.0
---

# Body
`;

const MALFORMED_YAML_FIXTURE = `---
this is not valid yaml at all !!!
no colon at all here
---

# Body
`;

const NO_FRONTMATTER_FIXTURE = `# Just a body

No frontmatter at all.
`;

const NO_VERSION_FIXTURE = `---
name: no-version-skill
description: Recommended field missing — should warn.
---

# Body
`;

describe('parseSkillContent', () => {
  it('parses a fully-formed SKILL.md', () => {
    const spec = parseSkillContent('mem://valid', VALID_FIXTURE);
    expect(spec.hasFrontmatter).toBe(true);
    expect(spec.frontmatter['name']).toBe('example-skill');
    expect(spec.frontmatter['description']).toBe(
      'A perfectly conformant SKILL.md fixture.',
    );
    expect(spec.frontmatter['version']).toBe('1.0.0');
    expect(spec.headings.length).toBeGreaterThanOrEqual(2);
  });

  it('flags a missing-frontmatter SKILL.md', () => {
    const spec = parseSkillContent('mem://no-fm', NO_FRONTMATTER_FIXTURE);
    expect(spec.hasFrontmatter).toBe(false);
    expect(Object.keys(spec.frontmatter).length).toBe(0);
  });

  it('reports parseError on malformed YAML frontmatter', () => {
    const spec = parseSkillContent('mem://bad', MALFORMED_YAML_FIXTURE);
    expect(spec.hasFrontmatter).toBe(false);
    expect(spec.parseError).toBeDefined();
  });

  it('returns file-not-found marker when path does not exist', () => {
    const spec = parseSkillFile(
      path.join(os.tmpdir(), 'definitely-does-not-exist-skilldex.md'),
    );
    expect(spec.parseError).toBe('file-not-found');
    expect(spec.hasFrontmatter).toBe(false);
  });
});

describe('scoreSpec — PASS path', () => {
  it('emits PASS findings for a fully-formed SKILL.md', () => {
    const spec = parseSkillContent('mem://valid', VALID_FIXTURE);
    const findings = scoreSpec(spec);
    const required = findings.filter((f) =>
      f.ruleId.endsWith('.required'),
    );
    expect(required.length).toBeGreaterThanOrEqual(2);
    for (const f of required) expect(f.severity).toBe('pass');
    expect(findings.find((f) => f.ruleId === 'frontmatter.present')?.severity).toBe(
      'pass',
    );
  });
});

describe('scoreSpec — FAIL paths', () => {
  it('emits FAIL when required field is missing', () => {
    const spec = parseSkillContent('mem://no-name', MISSING_NAME_FIXTURE);
    const findings = scoreSpec(spec);
    const fail = findings.find(
      (f) => f.ruleId === 'frontmatter.name.required',
    );
    expect(fail?.severity).toBe('fail');
  });

  it('emits FAIL when frontmatter block is malformed', () => {
    const spec = parseSkillContent('mem://bad', MALFORMED_YAML_FIXTURE);
    const findings = scoreSpec(spec);
    const presence = findings.find((f) => f.ruleId === 'frontmatter.present');
    expect(presence?.severity).toBe('fail');
    // Both required fields will also fail because frontmatter is empty.
    const nameRule = findings.find(
      (f) => f.ruleId === 'frontmatter.name.required',
    );
    expect(nameRule?.severity).toBe('fail');
  });

  it('emits FAIL when no frontmatter block exists', () => {
    const spec = parseSkillContent('mem://no-fm', NO_FRONTMATTER_FIXTURE);
    const findings = scoreSpec(spec);
    expect(
      findings.find((f) => f.ruleId === 'frontmatter.present')?.severity,
    ).toBe('fail');
  });
});

describe('scoreSpec — WARN path', () => {
  it('emits WARN when an optional field is absent', () => {
    const spec = parseSkillContent('mem://no-version', NO_VERSION_FIXTURE);
    const findings = scoreSpec(spec);
    const warn = findings.find(
      (f) => f.ruleId === 'frontmatter.version.recommended',
    );
    expect(warn?.severity).toBe('warn');
  });
});

describe('scoreSpec — composition closure', () => {
  it('preserves report invariants when combining multiple scoring runs', () => {
    const a = scoreSpec(parseSkillContent('mem://a', VALID_FIXTURE));
    const b = scoreSpec(parseSkillContent('mem://b', MISSING_NAME_FIXTURE));
    const combined = [...a, ...b];
    // Every finding still has all required keys.
    for (const f of combined) {
      expect(typeof f.skillPath).toBe('string');
      expect(typeof f.ruleId).toBe('string');
      expect(['pass', 'warn', 'fail']).toContain(f.severity);
      expect(typeof f.message).toBe('string');
    }
    // PASS findings from a + b still present.
    expect(combined.some((f) => f.skillPath === 'mem://a' && f.severity === 'pass'))
      .toBe(true);
    expect(combined.some((f) => f.skillPath === 'mem://b' && f.severity === 'fail'))
      .toBe(true);
  });
});

describe('scoreSpec — read-only on FAIL path', () => {
  it('does not write to the fixture path during scoring', () => {
    const fp = fixture(MISSING_NAME_FIXTURE);
    const before = fs.statSync(fp);
    scoreSpec(parseSkillFile(fp));
    const after = fs.statSync(fp);
    expect(after.mtimeMs).toBe(before.mtimeMs);
    expect(after.size).toBe(before.size);
    fs.unlinkSync(fp);
  });
});
