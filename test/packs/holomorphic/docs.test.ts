import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const HOLOMORPHIC_ROOT = join(__dirname, '../../../src/packs/holomorphic');
const README_PATH = join(HOLOMORPHIC_ROOT, 'README.md');
const TEST_ROOT = join(__dirname, '.');

describe('Holomorphic Dynamics Documentation', () => {
  it('README.md exists', () => {
    expect(existsSync(README_PATH), 'README.md should exist').toBe(true);
  });

  it('README contains required sections', () => {
    const content = readFileSync(README_PATH, 'utf-8');
    expect(content).toMatch(/## Overview/);
    expect(content).toMatch(/## Architecture/);
    expect(content).toMatch(/## Modules/);
    expect(content).toMatch(/## .*API/);
  });

  it('README word count exceeds 800', () => {
    const content = readFileSync(README_PATH, 'utf-8');
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeGreaterThan(800);
  });

  it('all holomorphic test files exist (>= 20)', () => {
    const testFiles = readdirSync(TEST_ROOT, { recursive: true })
      .filter((f): f is string => typeof f === 'string' && f.endsWith('.test.ts'));
    expect(testFiles.length).toBeGreaterThanOrEqual(20);
  });
});
