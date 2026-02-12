import { describe, it, expect, beforeEach } from 'vitest';
import {
  ContentAnalyzer,
  WORD_THRESHOLD_DECOMPOSE,
  WORD_THRESHOLD_WARNING,
} from './content-analyzer.js';
import type { AnalysisResult, DeterministicOp } from './content-analyzer.js';

describe('ContentAnalyzer', () => {
  let analyzer: ContentAnalyzer;

  beforeEach(() => {
    analyzer = new ContentAnalyzer();
  });

  describe('countWords', () => {
    it('returns 0 for empty string', () => {
      expect(analyzer.countWords('')).toBe(0);
    });

    it('returns 1 for a single word', () => {
      expect(analyzer.countWords('hello')).toBe(1);
    });

    it('counts words in multiline markdown correctly', () => {
      const text = `# Heading

This is a paragraph with several words.

- List item one
- List item two

Another paragraph here.`;
      // # + Heading + This is a paragraph with several words. + - List item one + - List item two + Another paragraph here.
      expect(analyzer.countWords(text)).toBe(20);
    });

    it('counts words inside code blocks', () => {
      const text = `Some intro text here.

\`\`\`bash
echo hello world
npm install
\`\`\`

More text after.`;
      // "Some intro text here." = 4
      // "```bash" = 1, "echo hello world" = 3, "npm install" = 2, "```" = 1
      // "More text after." = 3
      expect(analyzer.countWords(text)).toBe(14);
    });

    it('returns 0 for whitespace-only string', () => {
      expect(analyzer.countWords('   \n\t  \n  ')).toBe(0);
    });
  });

  describe('analyzeContent', () => {
    it('reports exceedsDecompose=false and exceedsWarning=false for body under 2000 words', () => {
      const body = 'word '.repeat(500).trim();
      const result = analyzer.analyzeContent(body);
      expect(result.exceedsDecompose).toBe(false);
      expect(result.exceedsWarning).toBe(false);
      expect(result.wordCount).toBe(500);
    });

    it('reports exceedsDecompose=true and exceedsWarning=false for body 2000-4999 words', () => {
      const body = 'word '.repeat(3000).trim();
      const result = analyzer.analyzeContent(body);
      expect(result.exceedsDecompose).toBe(true);
      expect(result.exceedsWarning).toBe(false);
      expect(result.wordCount).toBe(3000);
    });

    it('reports both true for body 5000+ words', () => {
      const body = 'word '.repeat(5500).trim();
      const result = analyzer.analyzeContent(body);
      expect(result.exceedsDecompose).toBe(true);
      expect(result.exceedsWarning).toBe(true);
      expect(result.wordCount).toBe(5500);
    });

    it('detects H2 sections', () => {
      const body = `## Overview

This is the overview section.

## Guidelines

These are the guidelines.

## Examples

Some examples here.`;
      const result = analyzer.analyzeContent(body);
      expect(result.sections).toHaveLength(3);
      expect(result.sections[0].heading).toBe('Overview');
      expect(result.sections[1].heading).toBe('Guidelines');
      expect(result.sections[2].heading).toBe('Examples');
    });

    it('includes section word counts and line ranges', () => {
      const body = `## First

One two three.

## Second

Four five six seven eight.`;
      const result = analyzer.analyzeContent(body);
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].wordCount).toBe(3);
      expect(result.sections[1].wordCount).toBe(5);
      expect(result.sections[0].startLine).toBeGreaterThanOrEqual(0);
      expect(result.sections[0].endLine).toBeGreaterThan(result.sections[0].startLine);
    });

    it('treats content before any H2 as intro section', () => {
      const body = `This is intro text.

## Section One

Section content here.`;
      const result = analyzer.analyzeContent(body);
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].heading).toBe('intro');
      expect(result.sections[0].wordCount).toBe(4);
      expect(result.sections[1].heading).toBe('Section One');
    });

    it('returns wordCount matching thresholds', () => {
      expect(WORD_THRESHOLD_DECOMPOSE).toBe(2000);
      expect(WORD_THRESHOLD_WARNING).toBe(5000);
    });
  });

  describe('detectDeterministicOps', () => {
    it('detects git command blocks', () => {
      const body = `## Setup

\`\`\`bash
git init
git remote add origin https://github.com/user/repo.git
git add .
git commit -m "initial"
\`\`\``;
      const ops = analyzer.detectDeterministicOps(body);
      expect(ops).toHaveLength(1);
      expect(ops[0].pattern).toBe('git');
      expect(ops[0].suggestedFilename).toMatch(/\.sh$/);
    });

    it('detects file manipulation blocks', () => {
      const body = `## Scaffold

\`\`\`bash
mkdir -p src/components
cp template.ts src/components/
chmod +x scripts/deploy.sh
\`\`\``;
      const ops = analyzer.detectDeterministicOps(body);
      expect(ops).toHaveLength(1);
      expect(ops[0].pattern).toBe('file-ops');
    });

    it('detects build command blocks', () => {
      const body = `## Build

\`\`\`bash
npm install
npm run build
npm test
\`\`\``;
      const ops = analyzer.detectDeterministicOps(body);
      expect(ops).toHaveLength(1);
      expect(ops[0].pattern).toBe('build');
    });

    it('returns empty array for content with no deterministic ops', () => {
      const body = `## Guidelines

Write clean code. Use meaningful names. Test everything.`;
      const ops = analyzer.detectDeterministicOps(body);
      expect(ops).toHaveLength(0);
    });

    it('does not match inline code (only fenced blocks)', () => {
      const body = `Use \`git commit\` to save changes. Run \`npm install\` first.`;
      const ops = analyzer.detectDeterministicOps(body);
      expect(ops).toHaveLength(0);
    });

    it('returns line ranges for detected ops', () => {
      const body = `Some text

\`\`\`bash
make build
make test
\`\`\`

More text`;
      const ops = analyzer.detectDeterministicOps(body);
      expect(ops).toHaveLength(1);
      expect(ops[0].lineStart).toBeGreaterThanOrEqual(0);
      expect(ops[0].lineEnd).toBeGreaterThan(ops[0].lineStart);
      expect(ops[0].content).toContain('make build');
    });

    it('detects multiple op blocks in one body', () => {
      const body = `## Setup

\`\`\`bash
git clone https://github.com/user/repo.git
\`\`\`

## Build

\`\`\`sh
npm install
npm run build
\`\`\``;
      const ops = analyzer.detectDeterministicOps(body);
      expect(ops.length).toBeGreaterThanOrEqual(2);
    });
  });
});
