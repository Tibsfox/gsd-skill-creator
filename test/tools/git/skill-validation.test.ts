/**
 * Skill validation tests (K-01..K-08) for the git-workflow skill.
 *
 * Tests verify: word count, registration, token budget,
 * progressive disclosure, trigger matching, and validate.sh.
 */
import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';

const SKILL_PATH = path.resolve(__dirname, '../../../skills/git-workflow/SKILL.md');
const REFERENCES_DIR = path.resolve(__dirname, '../../../skills/git-workflow/references');
const SCRIPTS_DIR = path.resolve(__dirname, '../../../skills/git-workflow/scripts');

// --- Parse YAML frontmatter helper ---

function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];

  // Simple YAML parser for flat/nested values
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let currentKey = '';
  let currentList: string[] | null = null;
  let inNestedBlock = false;
  let nestedDepth = 0;

  for (const line of lines) {
    // Detect list items under a key
    const listMatch = line.match(/^\s{2,}-\s+"(.+)"$/) || line.match(/^\s{2,}-\s+"?([^"]+)"?$/);
    if (listMatch && currentKey) {
      if (currentList) {
        currentList.push(listMatch[1]);
      }
      continue;
    }

    // Detect key: value
    const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.+)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        result[currentKey] = value.slice(1, -1);
      } else if (value === 'true') {
        result[currentKey] = true;
      } else if (value === 'false') {
        result[currentKey] = false;
      } else {
        result[currentKey] = value;
      }
      currentList = null;
      continue;
    }

    // Detect key with no value (start of nested/list)
    const keyOnly = line.match(/^(\w[\w-]*):\s*$/);
    if (keyOnly) {
      currentKey = keyOnly[1];
      currentList = null;
      continue;
    }
  }

  return result;
}

function extractIntents(content: string): string[] {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return [];
  const yaml = match[1];

  // Find the intents section and collect all list items until a non-list line
  const lines = yaml.split('\n');
  const intents: string[] = [];
  let inIntents = false;
  let intentsIndent = 0;

  for (const line of lines) {
    if (line.match(/^\s*intents:\s*$/)) {
      inIntents = true;
      intentsIndent = line.search(/\S/);
      continue;
    }
    if (inIntents) {
      const listMatch = line.match(/^\s+-\s+"([^"]+)"/);
      if (listMatch) {
        intents.push(listMatch[1]);
      } else if (line.trim() !== '' && !line.match(/^\s+-/)) {
        // Non-list, non-empty line — end of intents block
        break;
      }
    }
  }
  return intents;
}

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  }
  tempDirs.length = 0;
});

// --- Skill Validation Tests (K-01..K-08) ---

describe('Skill Validation (K-01..K-08)', () => {
  it('K-01: SKILL.md word count < 5000', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf-8');
    // Remove frontmatter for word count
    const body = content.replace(/^---[\s\S]*?---\n/, '');
    const words = body.split(/\s+/).filter(w => w.length > 0);
    expect(words.length).toBeLessThan(5000);
    // Also verify it's substantial (not empty)
    expect(words.length).toBeGreaterThan(100);
  });

  it('K-02: skill registration has name, version, and gsd-skill-creator metadata', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf-8');
    const fm = parseFrontmatter(content);

    expect(fm['name']).toBe('git-workflow');
    expect(fm['version']).toBeDefined();

    // Check for gsd-skill-creator extension block in raw YAML
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    expect(match).not.toBeNull();
    const yaml = match![1];
    expect(yaml).toContain('gsd-skill-creator');
  });

  it('K-03: token budget — summary tier < 3000 tokens', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf-8');
    const body = content.replace(/^---[\s\S]*?---\n/, '');
    const words = body.split(/\s+/).filter(w => w.length > 0);
    // Rough estimate: 1 word ~= 1.3 tokens
    const estimatedTokens = Math.ceil(words.length * 1.3);
    expect(estimatedTokens).toBeLessThan(3000);
  });

  it('K-04: progressive disclosure — references exist but are NOT inlined', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf-8');

    // SKILL.md should reference @references/ links
    expect(content).toContain('@references/');

    // Reference files must exist
    expect(fs.existsSync(path.join(REFERENCES_DIR, 'plumbing.md'))).toBe(true);
    expect(fs.existsSync(path.join(REFERENCES_DIR, 'workflows.md'))).toBe(true);
    expect(fs.existsSync(path.join(REFERENCES_DIR, 'safety.md'))).toBe(true);

    // SKILL.md should NOT contain the full content of reference files
    // Check for a distinctive line from plumbing.md that shouldn't be in SKILL.md
    const plumbingContent = fs.readFileSync(path.join(REFERENCES_DIR, 'plumbing.md'), 'utf-8');
    // plumbing.md has detailed tables — SKILL.md should not have the full plumbing table
    const plumbingLines = plumbingContent.split('\n').filter(l => l.length > 50);
    // At least some unique long lines from plumbing should NOT be in SKILL.md
    let inlinedCount = 0;
    for (const line of plumbingLines.slice(0, 10)) {
      if (content.includes(line.trim())) {
        inlinedCount++;
      }
    }
    // If more than half of distinctive lines are inlined, disclosure is broken
    expect(inlinedCount).toBeLessThan(plumbingLines.slice(0, 10).length / 2);
  });

  it('K-05: trigger intents include "git"', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf-8');
    const intents = extractIntents(content);
    expect(intents).toContain('git');
  });

  it('K-06: trigger intents include "branch"', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf-8');
    const intents = extractIntents(content);
    expect(intents).toContain('branch');
  });

  it('K-07: trigger intents do NOT include "database"', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf-8');
    const intents = extractIntents(content);
    expect(intents).not.toContain('database');
  });

  it('K-08: validate.sh on non-repo exits 1 with ready:false', () => {
    const validateScript = path.join(SCRIPTS_DIR, 'validate.sh');
    expect(fs.existsSync(validateScript)).toBe(true);

    // Create a temp dir that is NOT a git repo
    const nonRepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-skill-nonrepo-'));
    tempDirs.push(nonRepoDir);

    try {
      execSync(`bash "${validateScript}"`, {
        cwd: nonRepoDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      expect.unreachable('Expected exit code 1');
    } catch (err: unknown) {
      const error = err as { stdout: string; status: number };
      expect(error.status).toBe(1);
      const result = JSON.parse(error.stdout.trim());
      expect(result.ready).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
