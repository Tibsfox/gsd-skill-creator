import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../src/integrations/upstream');

describe('Upstream Intelligence Pack — Documentation', () => {
  it('README.md exists at src/integrations/upstream/README.md', () => {
    const readmePath = resolve(ROOT, 'README.md');
    expect(existsSync(readmePath)).toBe(true);
  });

  it('README contains required sections', () => {
    const readmePath = resolve(ROOT, 'README.md');
    const content = readFileSync(readmePath, 'utf-8');

    const requiredSections = [
      'Architecture',
      'Pipeline',
      'Agent',
      'Team',
      'Safety',
      'Usage',
    ];

    for (const section of requiredSections) {
      expect(content.toLowerCase()).toContain(section.toLowerCase());
    }
  });

  it('README word count > 500', () => {
    const readmePath = resolve(ROOT, 'README.md');
    const content = readFileSync(readmePath, 'utf-8');
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    expect(wordCount).toBeGreaterThan(500);
  });
});

describe('Upstream Intelligence Pack — Master Barrel', () => {
  it('index.ts exports all module entry points including pipeline', () => {
    const indexPath = resolve(ROOT, 'index.ts');
    const content = readFileSync(indexPath, 'utf-8');

    // All modules that should be exported
    const expectedExports = [
      './registry',
      './monitor',
      './classifier',
      './briefer',
      './dashboard-alerts',
      './tracer',
      './patcher',
      './persistence',
      './channel-state',
      './pipeline',
    ];

    for (const exportRef of expectedExports) {
      expect(content).toContain(exportRef);
    }
  });
});
