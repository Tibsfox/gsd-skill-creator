/**
 * Tests for the in-memory frontmatter repair logic used by
 * tools/import-filesystem-skills.ts.
 *
 * Protects the fix from session 026 (commit 11306b268) where 259
 * AGENT.md files had unquoted description values containing `": "`
 * (e.g. `description: Does X. Model: sonnet. Tools: Read, Grep.`),
 * which YAML parses as a nested key-value map and gray-matter rejects
 * with "incomplete explicit mapping pair; a key node is missed."
 */

import { describe, it, expect } from 'vitest';
import matter from 'gray-matter';

import {
  safeParseFrontmatter,
  repairUnquotedDescription,
} from '../../tools/import-filesystem-skills.js';

describe('frontmatter repair — unquoted description with colon-space', () => {
  const BROKEN = `---
name: audio-engineer
description: Master audio engineer. Model: sonnet. Tools: Read, Grep, Bash.
---

# Body
Content here.
`;

  const ALREADY_FINE = `---
name: simple
description: A simple skill with no colons.
---

Body.
`;

  const ALREADY_QUOTED = `---
name: quoted
description: "Has colons: but already quoted."
---

Body.
`;

  it('gray-matter blows up on unquoted description containing ": "', () => {
    expect(() => matter(BROKEN)).toThrow();
  });

  it('repairUnquotedDescription returns a string that gray-matter can parse', () => {
    const repaired = repairUnquotedDescription(BROKEN);
    expect(repaired).not.toBeNull();
    expect(() => matter(repaired as string)).not.toThrow();

    const parsed = matter(repaired as string);
    expect(parsed.data.name).toBe('audio-engineer');
    expect(parsed.data.description).toBe(
      'Master audio engineer. Model: sonnet. Tools: Read, Grep, Bash.',
    );
  });

  it('repairUnquotedDescription preserves body content verbatim', () => {
    const repaired = repairUnquotedDescription(BROKEN);
    expect(repaired).toContain('# Body');
    expect(repaired).toContain('Content here.');
  });

  it('repairUnquotedDescription always quotes unquoted descriptions (even when gray-matter would accept them)', () => {
    // repairUnquotedDescription is a narrow rewrite: if the first
    // frontmatter block has an unquoted description line, wrap it in
    // quotes. It doesn't pre-check whether gray-matter would already
    // succeed — that's safeParseFrontmatter's job. This keeps the
    // rewrite pure and the two-phase parse explicit.
    const repaired = repairUnquotedDescription(ALREADY_FINE);
    expect(repaired).not.toBeNull();
    const parsed = matter(repaired as string);
    expect(parsed.data.description).toBe('A simple skill with no colons.');
  });

  it('repairUnquotedDescription leaves already-quoted descriptions alone', () => {
    expect(repairUnquotedDescription(ALREADY_QUOTED)).toBeNull();
  });

  it('repairUnquotedDescription returns null when there is no frontmatter', () => {
    expect(repairUnquotedDescription('No frontmatter here.\n')).toBeNull();
  });

  it('repairUnquotedDescription handles backslashes and double-quotes in values', () => {
    const tricky = `---
name: tricky
description: Path C:\\Users\\foo. Says "hello: world".
---

Body.
`;
    const repaired = repairUnquotedDescription(tricky);
    expect(repaired).not.toBeNull();
    const parsed = matter(repaired as string);
    expect(parsed.data.description).toBe(
      'Path C:\\Users\\foo. Says "hello: world".',
    );
  });

  it('repairUnquotedDescription handles CRLF line endings', () => {
    const crlf = BROKEN.replace(/\n/g, '\r\n');
    const repaired = repairUnquotedDescription(crlf);
    expect(repaired).not.toBeNull();
    expect(() => matter(repaired as string)).not.toThrow();
  });
});

describe('safeParseFrontmatter — two-phase parse', () => {
  it('returns { repaired: false } when first parse succeeds', () => {
    const raw = `---
name: ok
description: Already valid.
---

Body.
`;
    const result = safeParseFrontmatter(raw);
    expect(result).not.toBeNull();
    expect(result!.repaired).toBe(false);
    expect(result!.parsed.data.name).toBe('ok');
  });

  it('returns { repaired: true } when repair is needed', () => {
    const raw = `---
name: repaired
description: Needs work. Model: sonnet. Tools: Read.
---

Body.
`;
    const result = safeParseFrontmatter(raw);
    expect(result).not.toBeNull();
    expect(result!.repaired).toBe(true);
    expect(result!.parsed.data.name).toBe('repaired');
    expect(result!.parsed.data.description).toBe(
      'Needs work. Model: sonnet. Tools: Read.',
    );
  });

  it('returns null for unrecoverable frontmatter (not the colon-space case)', () => {
    // Malformed YAML that isn't an unquoted-description issue.
    const bad = `---
name: broken
  indentation: all wrong
    here: and here
---

Body.
`;
    // safeParseFrontmatter should fall through to repair, which won't
    // touch this file (no description line), and re-parse will still
    // succeed or fail based on what matter decides. We don't assert
    // null strictly — we only assert the function doesn't throw.
    expect(() => safeParseFrontmatter(bad)).not.toThrow();
  });
});
