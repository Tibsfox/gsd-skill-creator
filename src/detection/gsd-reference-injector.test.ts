/**
 * Tests for GSD reference injection into generated skill bodies.
 *
 * Validates keyword matching (plan, execute, debug, research, verify, milestone),
 * deduplication, GSD-not-installed short-circuit, description scanning,
 * section format, and checkGsdInstalled filesystem detection.
 */

import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  injectGsdReferences,
  checkGsdInstalled,
  GSD_COMMAND_MAP,
} from './gsd-reference-injector.js';

// ============================================================================
// GSD_COMMAND_MAP structure
// ============================================================================

describe('GSD_COMMAND_MAP', () => {
  it('has expected keyword keys', () => {
    const expectedKeys = ['plan', 'execute', 'debug', 'research', 'verify', 'milestone', 'commit'];
    for (const key of expectedKeys) {
      expect(GSD_COMMAND_MAP).toHaveProperty(key);
    }
  });

  it('every entry has command starting with /gsd: and non-empty description', () => {
    for (const [_key, entries] of Object.entries(GSD_COMMAND_MAP)) {
      for (const entry of entries) {
        expect(entry.command).toMatch(/^\/gsd:/);
        expect(entry.description.length).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================================================
// injectGsdReferences: keyword matching
// ============================================================================

describe('injectGsdReferences keyword matching', () => {
  it('appends planning commands for "plan" keyword', () => {
    const body = 'This skill helps you plan your project structure.';
    const result = injectGsdReferences(body, 'A planning skill', true);
    expect(result).toContain('## Related GSD Commands');
    expect(result).toContain('/gsd:plan-phase');
    expect(result).toContain('/gsd:discuss-phase');
  });

  it('appends planning commands for "planning" keyword', () => {
    const body = 'Handles project planning workflows.';
    const result = injectGsdReferences(body, 'generic', true);
    expect(result).toContain('/gsd:plan-phase');
  });

  it('appends execute commands for "execute" keyword', () => {
    const body = 'Execute the build pipeline.';
    const result = injectGsdReferences(body, 'generic', true);
    expect(result).toContain('/gsd:execute-phase');
  });

  it('appends execute commands for "build" keyword', () => {
    const body = 'Build and deploy the application.';
    const result = injectGsdReferences(body, 'generic', true);
    expect(result).toContain('/gsd:execute-phase');
  });

  it('appends debug commands for "debug" keyword', () => {
    const body = 'Debug failing test suites.';
    const result = injectGsdReferences(body, 'generic', true);
    expect(result).toContain('/gsd:debug');
  });

  it('appends debug commands for "troubleshoot" keyword', () => {
    const body = 'Troubleshoot network connectivity issues.';
    const result = injectGsdReferences(body, 'generic', true);
    expect(result).toContain('/gsd:debug');
  });

  it('appends research commands for "research" keyword', () => {
    const body = 'Research the best approach for authentication.';
    const result = injectGsdReferences(body, 'generic', true);
    expect(result).toContain('/gsd:research-phase');
  });

  it('appends research commands for "investigate" keyword', () => {
    const body = 'Investigate the root cause of the regression.';
    const result = injectGsdReferences(body, 'generic', true);
    expect(result).toContain('/gsd:research-phase');
  });

  it('appends verify commands for "verify" keyword', () => {
    const body = 'Verify the deployment was successful.';
    const result = injectGsdReferences(body, 'generic', true);
    expect(result).toContain('/gsd:verify-work');
  });

  it('appends milestone commands for "milestone" keyword', () => {
    const body = 'Track milestone completion status.';
    const result = injectGsdReferences(body, 'generic', true);
    expect(result).toContain('/gsd:new-milestone');
    expect(result).toContain('/gsd:audit-milestone');
  });
});

// ============================================================================
// injectGsdReferences: multiple keywords and deduplication
// ============================================================================

describe('injectGsdReferences multiple keywords', () => {
  it('combines commands from multiple keyword matches', () => {
    const body = 'Plan the feature and then debug any issues found.';
    const result = injectGsdReferences(body, 'generic', true);
    expect(result).toContain('/gsd:plan-phase');
    expect(result).toContain('/gsd:discuss-phase');
    expect(result).toContain('/gsd:debug');
  });

  it('deduplicates commands even when keyword appears multiple times', () => {
    const body = 'Execute the build. Then execute the tests. Then execute deploy.';
    const result = injectGsdReferences(body, 'generic', true);
    // /gsd:execute-phase should appear only once
    const matches = result.match(/\/gsd:execute-phase/g);
    expect(matches).toHaveLength(1);
  });

  it('deduplicates across synonym keywords', () => {
    // "execute" and "build" both map to /gsd:execute-phase
    const body = 'Execute the build pipeline.';
    const result = injectGsdReferences(body, 'generic', true);
    const matches = result.match(/\/gsd:execute-phase/g);
    expect(matches).toHaveLength(1);
  });
});

// ============================================================================
// injectGsdReferences: no match / GSD not installed
// ============================================================================

describe('injectGsdReferences no-match and disabled cases', () => {
  it('returns body unchanged when no GSD keywords match', () => {
    const body = 'This skill handles TypeScript compilation.';
    const result = injectGsdReferences(body, 'Generic TS skill', true);
    expect(result).toBe(body);
    expect(result).not.toContain('## Related GSD Commands');
  });

  it('returns body unchanged when hasGsdInstalled is false', () => {
    const body = 'Plan and debug the entire project.';
    const result = injectGsdReferences(body, 'planning skill', false);
    expect(result).toBe(body);
    expect(result).not.toContain('## Related GSD Commands');
  });
});

// ============================================================================
// injectGsdReferences: description scanning
// ============================================================================

describe('injectGsdReferences description scanning', () => {
  it('matches keywords in description even when body has none', () => {
    const body = 'Generic skill content with no GSD words.';
    const description = 'Plan TypeScript projects efficiently';
    const result = injectGsdReferences(body, description, true);
    expect(result).toContain('## Related GSD Commands');
    expect(result).toContain('/gsd:plan-phase');
  });
});

// ============================================================================
// injectGsdReferences: section format
// ============================================================================

describe('injectGsdReferences section format', () => {
  it('appends section with correct markdown format', () => {
    const body = 'Debug failing tests.';
    const result = injectGsdReferences(body, 'generic', true);

    // Section starts with double newline + heading
    expect(result).toContain('\n\n## Related GSD Commands\n\n');

    // Each command is a list item: - `/gsd:command` - description
    expect(result).toMatch(/- `\/gsd:\S+` - .+/);

    // Section ends with newline
    expect(result.endsWith('\n')).toBe(true);
  });

  it('preserves original body before the appended section', () => {
    const body = 'Original body content here.';
    const result = injectGsdReferences(body, 'Plan something', true);
    expect(result.startsWith(body)).toBe(true);
  });
});

// ============================================================================
// checkGsdInstalled
// ============================================================================

describe('checkGsdInstalled', () => {
  it('returns true when .claude/commands/gsd/ directory exists', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'gsd-check-'));
    try {
      await mkdir(join(tmp, '.claude', 'commands', 'gsd'), { recursive: true });
      const result = await checkGsdInstalled(tmp);
      expect(result).toBe(true);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('returns false when .claude/commands/gsd/ directory does not exist', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'gsd-check-'));
    try {
      const result = await checkGsdInstalled(tmp);
      expect(result).toBe(false);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
