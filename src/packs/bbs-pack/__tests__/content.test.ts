/**
 * BBS Pack content validation tests.
 *
 * Validates that all 5 modules have complete educational content
 * with no remaining placeholders, sufficient topic depth, inline
 * citations, cross-module references, assessments with answer keys,
 * and the Dancer annotated source corpus.
 *
 * Covers requirements: BBS-03, BBS-04, BBS-05, BBS-06, BBS-07, BBS-09, BBS-10
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(packRoot, '..', '..', '..');

// ============================================================================
// Module directory names
// ============================================================================

const MODULE_DIRS = [
  '01-terminal-modem',
  '02-ansi-art',
  '03-fidonet',
  '04-irc-dancer',
  '05-door-games',
];

// ============================================================================
// Group 1: Content files exist and are non-placeholder (BBS-03 to BBS-07)
// ============================================================================

describe('Content files are non-placeholder', () => {
  for (const dir of MODULE_DIRS) {
    it(`${dir}/content.md has real content (no placeholder)`, () => {
      const filePath = path.join(packRoot, 'modules', dir, 'content.md');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('populated in Phase 520');
      expect(content).not.toContain('Content populated in Phase');
      expect(content).toContain('## Overview');
      expect(content).toContain('## Topics');
      expect(content).toContain('## Learn Mode Depth Markers');
    });
  }
});

// ============================================================================
// Group 2: Content has sufficient depth (8+ topics, 2000+ chars)
// ============================================================================

describe('Content has sufficient depth', () => {
  for (const dir of MODULE_DIRS) {
    it(`${dir}/content.md has at least 8 topics and 2000+ characters`, () => {
      const filePath = path.join(packRoot, 'modules', dir, 'content.md');
      const content = fs.readFileSync(filePath, 'utf-8');
      const topicCount = (content.match(/^### Topic \d+/gm) || []).length;
      expect(topicCount, `${dir} should have >= 8 topics, found ${topicCount}`).toBeGreaterThanOrEqual(8);
      expect(content.length, `${dir} content should be >= 2000 chars, found ${content.length}`).toBeGreaterThanOrEqual(2000);
    });
  }
});

// ============================================================================
// Group 3: Assessment files exist and have answer keys (BBS-09)
// ============================================================================

describe('Assessment files have questions and answer keys', () => {
  for (const dir of MODULE_DIRS) {
    it(`${dir}/assessment.md has 5 questions and an Answer Key`, () => {
      const filePath = path.join(packRoot, 'modules', dir, 'assessment.md');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('populated in Phase 520');
      expect(content).not.toContain('Assessment populated');
      expect(content).toContain('## Answer Key');
      const questionCount = (content.match(/^## Question \d+/gm) || []).length;
      expect(questionCount, `${dir} should have exactly 5 questions`).toBe(5);
    });
  }
});

// ============================================================================
// Group 4: Content has inline citations
// ============================================================================

describe('Content has inline citations', () => {
  for (const dir of MODULE_DIRS) {
    it(`${dir}/content.md contains at least one inline citation`, () => {
      const filePath = path.join(packRoot, 'modules', dir, 'content.md');
      const content = fs.readFileSync(filePath, 'utf-8');
      // Citations use "-- Source" convention from bibliography.md
      const citationCount = (content.match(/-- [A-Z]/gm) || []).length;
      expect(citationCount, `${dir} should have inline citations using -- convention`).toBeGreaterThan(0);
    });
  }
});

// ============================================================================
// Group 5: Cross-module references
// ============================================================================

describe('Cross-module references', () => {
  it('Module 02 (ANSI Art) references Module 01 (serial connection context)', () => {
    const content = fs.readFileSync(
      path.join(packRoot, 'modules', '02-ansi-art', 'content.md'),
      'utf-8'
    );
    expect(content).toContain('Module 1');
  });

  it('Module 03 (FidoNet) references Module 01 (ZMODEM transport)', () => {
    const content = fs.readFileSync(
      path.join(packRoot, 'modules', '03-fidonet', 'content.md'),
      'utf-8'
    );
    expect(content).toContain('Module 1');
  });

  it('Module 04 (IRC/Dancer) references data/bbs/dancer-irc/ files', () => {
    const content = fs.readFileSync(
      path.join(packRoot, 'modules', '04-irc-dancer', 'content.md'),
      'utf-8'
    );
    expect(content).toContain('data/bbs/dancer-irc/');
  });

  it('Module 05 (Door Games) references Module 01 and Module 02', () => {
    const content = fs.readFileSync(
      path.join(packRoot, 'modules', '05-door-games', 'content.md'),
      'utf-8'
    );
    expect(content).toContain('Module 1');
    expect(content).toContain('Module 2');
  });
});

// ============================================================================
// Group 6: Dancer corpus exists and is properly marked (BBS-10)
// ============================================================================

describe('Dancer annotated source corpus', () => {
  const dancerDir = path.join(projectRoot, 'data', 'bbs', 'dancer-irc');

  it('data/bbs/dancer-irc/ directory exists with README.md and 4 .c files', () => {
    expect(fs.existsSync(dancerDir), 'dancer-irc directory should exist').toBe(true);
    expect(fs.existsSync(path.join(dancerDir, 'README.md'))).toBe(true);
    expect(fs.existsSync(path.join(dancerDir, 'dancer-main.c'))).toBe(true);
    expect(fs.existsSync(path.join(dancerDir, 'parse-irc.c'))).toBe(true);
    expect(fs.existsSync(path.join(dancerDir, 'flood-protection.c'))).toBe(true);
    expect(fs.existsSync(path.join(dancerDir, 'command-dispatch.c'))).toBe(true);
  });

  it('all .c files contain EDUCATIONAL ANNOTATION marker', () => {
    const cFiles = ['dancer-main.c', 'parse-irc.c', 'flood-protection.c', 'command-dispatch.c'];
    for (const file of cFiles) {
      const content = fs.readFileSync(path.join(dancerDir, file), 'utf-8');
      expect(content, `${file} should contain EDUCATIONAL ANNOTATION`).toContain('EDUCATIONAL ANNOTATION');
    }
  });

  it('README.md states NOT FOR COMPILATION', () => {
    const content = fs.readFileSync(path.join(dancerDir, 'README.md'), 'utf-8');
    expect(content).toContain('NOT FOR COMPILATION');
  });

  it('no Makefile exists in dancer directory', () => {
    expect(fs.existsSync(path.join(dancerDir, 'Makefile'))).toBe(false);
    expect(fs.existsSync(path.join(dancerDir, 'makefile'))).toBe(false);
  });
});
