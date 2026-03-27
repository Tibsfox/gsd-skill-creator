/**
 * Tests for Gas City role parser.
 *
 * Covers:
 * - extractFrontmatter: splits YAML + body, rejects malformed
 * - parseGasCityRole: full parse with schema validation
 * - parseGasCityRoleFile: reads from disk
 * - discoverRoles: scans directory, collects roles and errors
 * - validateRole: checks spec compliance
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  extractFrontmatter,
  parseGasCityRole,
  parseGasCityRoleFile,
  discoverRoles,
  validateRole,
} from '../gas-city-role-parser.js';

// ============================================================================
// Fixtures
// ============================================================================

const VALID_ROLE = `---
name: reviewer
description: Reviews code for bugs and style issues.
tools:
  - Read
  - Grep
  - Glob
model: sonnet
---

# Reviewer

You are a code reviewer. Examine the provided code and report issues.

## Voice

- **Tone:** analytical
- **Style:** systematic
- **Signature:** "examining the evidence"

## Responsibilities

1. **Review** — Check code for bugs, style, and security
2. **Report** — Provide actionable feedback

## Protocol

When consulted:
1. Read the code
2. Identify issues
3. Report findings
`;

const MINIMAL_ROLE = `---
name: helper
description: A minimal helper agent.
---

You help with tasks.
`;

const ROLE_WITH_EXTRAS = `---
name: extended-agent
description: An agent with extra fields.
tools:
  - Read
  - Write
  - Bash
model: opus
color: "#ff6600"
skills:
  - code-review
  - security-scan
permissionMode: acceptEdits
custom_field: preserved
---

# Extended Agent

Body content.
`;

// ============================================================================
// extractFrontmatter
// ============================================================================

describe('extractFrontmatter', () => {
  it('splits YAML and body from valid frontmatter', () => {
    const result = extractFrontmatter(VALID_ROLE);
    expect(result).not.toBeNull();
    expect(result!.yaml).toContain('name: reviewer');
    expect(result!.body).toContain('# Reviewer');
  });

  it('returns null for content without frontmatter', () => {
    expect(extractFrontmatter('# Just Markdown')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractFrontmatter('')).toBeNull();
  });

  it('returns null for unclosed frontmatter', () => {
    expect(extractFrontmatter('---\nname: test\nno closing')).toBeNull();
  });

  it('handles leading whitespace before frontmatter', () => {
    const content = '\n  ---\nname: trimmed\ndescription: test\n---\nBody.';
    const result = extractFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.yaml).toContain('name: trimmed');
  });
});

// ============================================================================
// parseGasCityRole
// ============================================================================

describe('parseGasCityRole', () => {
  it('parses a valid role file', async () => {
    const role = await parseGasCityRole(VALID_ROLE);
    expect(role).not.toBeNull();
    expect(role!.frontmatter.name).toBe('reviewer');
    expect(role!.frontmatter.description).toBe('Reviews code for bugs and style issues.');
    expect(role!.frontmatter.tools).toEqual(['Read', 'Grep', 'Glob']);
    expect(role!.frontmatter.model).toBe('sonnet');
    expect(role!.body).toContain('# Reviewer');
    expect(role!.filePath).toBeNull();
  });

  it('parses a minimal role (only required fields)', async () => {
    const role = await parseGasCityRole(MINIMAL_ROLE);
    expect(role).not.toBeNull();
    expect(role!.frontmatter.name).toBe('helper');
    expect(role!.frontmatter.description).toBe('A minimal helper agent.');
    expect(role!.frontmatter.tools).toBeUndefined();
    expect(role!.frontmatter.model).toBeUndefined();
    expect(role!.body).toContain('You help with tasks.');
  });

  it('preserves unknown fields via passthrough', async () => {
    const role = await parseGasCityRole(ROLE_WITH_EXTRAS);
    expect(role).not.toBeNull();
    expect((role!.frontmatter as Record<string, unknown>).custom_field).toBe('preserved');
  });

  it('parses all optional fields', async () => {
    const role = await parseGasCityRole(ROLE_WITH_EXTRAS);
    expect(role).not.toBeNull();
    expect(role!.frontmatter.tools).toEqual(['Read', 'Write', 'Bash']);
    expect(role!.frontmatter.model).toBe('opus');
    expect(role!.frontmatter.color).toBe('#ff6600');
    expect(role!.frontmatter.skills).toEqual(['code-review', 'security-scan']);
    expect(role!.frontmatter.permissionMode).toBe('acceptEdits');
  });

  it('records filePath when provided', async () => {
    const role = await parseGasCityRole(VALID_ROLE, '/some/path/reviewer.md');
    expect(role!.filePath).toBe('/some/path/reviewer.md');
  });

  it('returns null for empty content', async () => {
    expect(await parseGasCityRole('')).toBeNull();
  });

  it('returns null for whitespace-only content', async () => {
    expect(await parseGasCityRole('   \n   ')).toBeNull();
  });

  it('returns null for content without frontmatter', async () => {
    expect(await parseGasCityRole('# Just markdown\n\nNo frontmatter.')).toBeNull();
  });

  it('returns null when required field "name" is missing', async () => {
    const content = '---\ndescription: no name\n---\nBody.';
    expect(await parseGasCityRole(content)).toBeNull();
  });

  it('returns null when required field "description" is missing', async () => {
    const content = '---\nname: no-desc\n---\nBody.';
    expect(await parseGasCityRole(content)).toBeNull();
  });

  it('returns null when name has invalid characters', async () => {
    const content = '---\nname: "Invalid Name!"\ndescription: bad name\n---\nBody.';
    expect(await parseGasCityRole(content)).toBeNull();
  });

  it('returns null when model is invalid', async () => {
    const content = '---\nname: test\ndescription: test\nmodel: gpt-4\n---\nBody.';
    expect(await parseGasCityRole(content)).toBeNull();
  });

  it('rejects YAML with !!js/function tag (safety)', async () => {
    const content = '---\nname: evil\ndescription: test\nhack: !!js/function "() => {}"\n---\nBody.';
    expect(await parseGasCityRole(content)).toBeNull();
  });

  it('handles MCP tool patterns', async () => {
    const content = `---
name: mcp-agent
description: Uses MCP tools.
tools:
  - Read
  - mcp__context7__query-docs
  - mcp__slack__send-message
---

Body.
`;
    const role = await parseGasCityRole(content);
    expect(role).not.toBeNull();
    expect(role!.frontmatter.tools).toEqual([
      'Read',
      'mcp__context7__query-docs',
      'mcp__slack__send-message',
    ]);
  });

  it('handles disallowedTools', async () => {
    const content = `---
name: safe-agent
description: No bash allowed.
disallowedTools:
  - Bash
  - Write
---

Body.
`;
    const role = await parseGasCityRole(content);
    expect(role).not.toBeNull();
    expect(role!.frontmatter.disallowedTools).toEqual(['Bash', 'Write']);
  });
});

// ============================================================================
// parseGasCityRoleFile
// ============================================================================

describe('parseGasCityRoleFile', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gc-parser-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns null for non-existent file', async () => {
    expect(await parseGasCityRoleFile(join(testDir, 'nope.md'))).toBeNull();
  });

  it('parses a valid role file from disk', async () => {
    const filePath = join(testDir, 'reviewer.md');
    await writeFile(filePath, VALID_ROLE, 'utf-8');

    const role = await parseGasCityRoleFile(filePath);
    expect(role).not.toBeNull();
    expect(role!.frontmatter.name).toBe('reviewer');
    expect(role!.filePath).toBe(filePath);
  });

  it('returns null for file with invalid content', async () => {
    const filePath = join(testDir, 'bad.md');
    await writeFile(filePath, '# No frontmatter here', 'utf-8');

    expect(await parseGasCityRoleFile(filePath)).toBeNull();
  });
});

// ============================================================================
// discoverRoles
// ============================================================================

describe('discoverRoles', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gc-discover-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns empty for non-existent directory', async () => {
    const result = await discoverRoles('/nonexistent/path/agents');
    expect(result.roles).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('returns empty for empty directory', async () => {
    const result = await discoverRoles(testDir);
    expect(result.roles).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('discovers valid role files', async () => {
    await writeFile(join(testDir, 'reviewer.md'), VALID_ROLE, 'utf-8');
    await writeFile(join(testDir, 'helper.md'), MINIMAL_ROLE, 'utf-8');

    const result = await discoverRoles(testDir);
    expect(result.roles).toHaveLength(2);
    expect(result.errors).toHaveLength(0);

    const names = result.roles.map(r => r.frontmatter.name).sort();
    expect(names).toEqual(['helper', 'reviewer']);
  });

  it('reports errors for invalid files', async () => {
    await writeFile(join(testDir, 'good.md'), VALID_ROLE, 'utf-8');
    await writeFile(join(testDir, 'bad.md'), '# No frontmatter', 'utf-8');

    const result = await discoverRoles(testDir);
    expect(result.roles).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toBe('parse-error');
  });

  it('skips non-.md files', async () => {
    await writeFile(join(testDir, 'reviewer.md'), VALID_ROLE, 'utf-8');
    await writeFile(join(testDir, 'notes.txt'), 'just notes', 'utf-8');
    await writeFile(join(testDir, 'config.yaml'), 'key: value', 'utf-8');

    const result = await discoverRoles(testDir);
    expect(result.roles).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });
});

// ============================================================================
// validateRole
// ============================================================================

describe('validateRole', () => {
  it('passes a fully compliant role', async () => {
    const role = await parseGasCityRole(VALID_ROLE);
    const result = validateRole(role!);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('warns about missing recommended sections', async () => {
    const role = await parseGasCityRole(MINIMAL_ROLE);
    const result = validateRole(role!);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Missing recommended section: Voice');
    expect(result.warnings).toContain('Missing recommended section: Responsibilities');
    expect(result.warnings).toContain('Missing recommended section: Protocol');
  });

  it('warns when filename does not match name field', async () => {
    const role = await parseGasCityRole(VALID_ROLE, '/path/to/wrong-name.md');
    const result = validateRole(role!);
    expect(result.warnings.some(w => w.includes('does not match'))).toBe(true);
  });

  it('warns about non-PascalCase tools', async () => {
    const content = `---
name: lowercase-tools
description: Has lowercase tool names.
tools:
  - read
  - grep
---

Body.
`;
    const role = await parseGasCityRole(content);
    const result = validateRole(role!);
    expect(result.warnings.some(w => w.includes('PascalCase'))).toBe(true);
  });

  it('does not warn about MCP tools starting with mcp__', async () => {
    const content = `---
name: mcp-user
description: Uses MCP tools.
tools:
  - Read
  - mcp__slack__send
---

## Voice

Test

## Responsibilities

Test

## Protocol

Test
`;
    const role = await parseGasCityRole(content);
    const result = validateRole(role!);
    expect(result.warnings.filter(w => w.includes('PascalCase'))).toHaveLength(0);
  });
});
