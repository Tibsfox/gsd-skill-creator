/**
 * Validation tests for RELEASE-HISTORY.md structure and cross-file references.
 *
 * Proves that docs/RELEASE-HISTORY.md exists with a valid table structure
 * and that all markdown references across the codebase resolve correctly.
 * Prevents future reference breakage when files move or get renamed.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

// Resolve project root (from test/gsd-tools/ go up 2 levels)
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const RELEASE_HISTORY_PATH = join(PROJECT_ROOT, 'docs', 'RELEASE-HISTORY.md');

describe('RELEASE-HISTORY.md structure and references', () => {
  it('docs/RELEASE-HISTORY.md exists', () => {
    expect(existsSync(RELEASE_HISTORY_PATH)).toBe(true);
  });

  it('has valid table header with Version, Name, Shipped columns', () => {
    const content = readFileSync(RELEASE_HISTORY_PATH, 'utf-8');

    // Check for table header row
    expect(content).toContain('| Version |');
    expect(content).toContain('| Name |');
    // All three columns must appear in the header line
    const headerLine = content.split('\n').find((line) => line.includes('| Version'));
    expect(headerLine).toBeTruthy();
    expect(headerLine).toContain('Version');
    expect(headerLine).toContain('Name');
    expect(headerLine).toContain('Shipped');
  });

  it('has at least 10 version data rows in the table', () => {
    const content = readFileSync(RELEASE_HISTORY_PATH, 'utf-8');
    const lines = content.split('\n');

    // Count table data rows (lines starting with |, excluding header and separator)
    const tableRows = lines.filter(
      (line) => line.startsWith('|') && !line.startsWith('|---') && !line.includes('| Version |'),
    );

    expect(tableRows.length).toBeGreaterThanOrEqual(10);
  });

  it('README.md link docs/RELEASE-HISTORY.md resolves to existing file', () => {
    const readmePath = join(PROJECT_ROOT, 'README.md');
    expect(existsSync(readmePath)).toBe(true);

    const content = readFileSync(readmePath, 'utf-8');
    expect(content).toContain('RELEASE-HISTORY.md');

    // Extract the link path from README.md (relative to repo root)
    const linkMatch = content.match(/\[.*?\]\((docs\/RELEASE-HISTORY\.md)\)/);
    expect(linkMatch).toBeTruthy();

    // Resolve from project root
    const resolvedPath = join(PROJECT_ROOT, linkMatch![1]);
    expect(existsSync(resolvedPath)).toBe(true);
  });

  it('docs/architecture/README.md link ../RELEASE-HISTORY.md resolves correctly', () => {
    const archReadmePath = join(PROJECT_ROOT, 'docs', 'architecture', 'README.md');
    expect(existsSync(archReadmePath)).toBe(true);

    const content = readFileSync(archReadmePath, 'utf-8');
    expect(content).toContain('RELEASE-HISTORY.md');

    // Extract the relative link
    const linkMatch = content.match(/\[.*?\]\((\.\.\/RELEASE-HISTORY\.md)\)/);
    expect(linkMatch).toBeTruthy();

    // Resolve from docs/architecture/ directory
    const resolvedPath = resolve(dirname(archReadmePath), linkMatch![1]);
    expect(existsSync(resolvedPath)).toBe(true);
  });

  it('docs/lessons-learned.md link RELEASE-HISTORY.md resolves correctly', () => {
    const lessonsPath = join(PROJECT_ROOT, 'docs', 'lessons-learned.md');
    expect(existsSync(lessonsPath)).toBe(true);

    const content = readFileSync(lessonsPath, 'utf-8');
    expect(content).toContain('RELEASE-HISTORY.md');

    // Extract the relative link (from docs/ to docs/RELEASE-HISTORY.md)
    const linkMatch = content.match(/\[.*?\]\((RELEASE-HISTORY\.md)\)/);
    expect(linkMatch).toBeTruthy();

    // Resolve from docs/ directory
    const resolvedPath = resolve(dirname(lessonsPath), linkMatch![1]);
    expect(existsSync(resolvedPath)).toBe(true);
  });

  it('complete-milestone.md workflow references docs/RELEASE-HISTORY.md', () => {
    const workflowPath = join(
      PROJECT_ROOT,
      '.claude',
      'get-shit-done',
      'workflows',
      'complete-milestone.md',
    );
    expect(existsSync(workflowPath)).toBe(true);

    const content = readFileSync(workflowPath, 'utf-8');
    // Workflow references RELEASE-HISTORY.md as a step (not a markdown link)
    expect(content).toContain('RELEASE-HISTORY.md');
  });
});
