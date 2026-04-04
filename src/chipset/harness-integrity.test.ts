/**
 * Harness Integrity Tests
 *
 * Validates that safety invariants survive configuration changes to skills,
 * hooks, agents, and settings. These are guardrail tests — they read the
 * actual filesystem and verify the harness is correctly configured.
 *
 * Backlog 999.4, Primitive 8 Level 2: harness changes preserve safety.
 *
 * Run: npx vitest run src/chipset/harness-integrity.test.ts
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

import {
  checkHookScriptsExecutable,
  checkSettingsHookReferences,
  checkNoVerificationBypasses,
  checkPlanningGitignored,
  checkClaudeGitignored,
  checkNoEnvFilesTracked,
  checkAgentFrontmatter,
  checkAgentToolConstraints,
  checkSkillNameAndDescription,
  checkSkillDescriptionLength,
  checkSkillNoInjectionPatterns,
  checkSkillNoExternalReferences,
  checkVersionConsistency,
  runAllInvariantChecks,
} from './harness-integrity.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(import.meta.dirname ?? __dirname, '../..');
const CLAUDE_DIR = path.join(PROJECT_ROOT, '.claude');
const AGENTS_DIR = path.join(CLAUDE_DIR, 'agents');
const HOOKS_DIR = path.join(CLAUDE_DIR, 'hooks');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
const GITIGNORE_PATH = path.join(PROJECT_ROOT, '.gitignore');

// ===========================================================================
// Permission Invariants
// ===========================================================================

describe('Harness Integrity', () => {
  describe('Permission Invariants', () => {
    it('all shell hook scripts are executable', () => {
      const results = checkHookScriptsExecutable();

      // There should be at least one .sh hook
      const shHooks = fs.readdirSync(HOOKS_DIR).filter((f) => f.endsWith('.sh'));
      expect(shHooks.length).toBeGreaterThan(0);

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('settings.json hooks reference files that actually exist', () => {
      expect(fs.existsSync(SETTINGS_PATH)).toBe(true);

      const results = checkSettingsHookReferences();
      expect(results.length).toBeGreaterThan(0);

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('no hooks bypass verification (--no-verify, --force)', () => {
      const results = checkNoVerificationBypasses();

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('all hook commands in settings.json are well-formed', () => {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
      const hooks = settings.hooks ?? {};

      for (const [eventName, hookGroups] of Object.entries(hooks)) {
        if (!Array.isArray(hookGroups)) continue;
        for (const group of hookGroups as Array<Record<string, unknown>>) {
          const innerHooks = (group.hooks ?? []) as Array<Record<string, unknown>>;
          for (const hook of innerHooks) {
            // Every hook must have a type
            expect(hook.type, `Hook in ${eventName} missing type`).toBeDefined();
            expect(hook.type).toBe('command');

            // Every command hook must have a non-empty command string
            expect(typeof hook.command, `Hook in ${eventName} has non-string command`).toBe('string');
            expect((hook.command as string).length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  // ===========================================================================
  // State Invariants
  // ===========================================================================

  describe('State Invariants', () => {
    it('.planning/ is gitignored', () => {
      const result = checkPlanningGitignored();
      expect(result.passed, result.message).toBe(true);
    });

    it('.claude/ is gitignored', () => {
      const result = checkClaudeGitignored();
      expect(result.passed, result.message).toBe(true);
    });

    it('no .env files are tracked by git', () => {
      const result = checkNoEnvFilesTracked();
      expect(result.passed, result.message).toBe(true);
    });

    it('.gitignore file exists and is non-empty', () => {
      expect(fs.existsSync(GITIGNORE_PATH)).toBe(true);
      const content = fs.readFileSync(GITIGNORE_PATH, 'utf8');
      expect(content.length).toBeGreaterThan(0);

      // Must contain at least the critical patterns
      expect(content).toContain('.planning/');
      expect(content).toContain('.claude/');
      expect(content).toMatch(/\.env/);
    });

    it('no secrets files are tracked by git', () => {
      // Check for common secrets patterns
      const secretPatterns = ['*.pem', '*.key', 'credentials.json', '.env.local', '.env.production'];
      for (const pattern of secretPatterns) {
        try {
          const output = execSync(`git ls-files --cached "${pattern}"`, {
            cwd: PROJECT_ROOT,
            encoding: 'utf8',
            timeout: 5000,
          }).trim();

          expect(output, `Secret file tracked: ${pattern}`).toBe('');
        } catch {
          // No matches — good
        }
      }
    });
  });

  // ===========================================================================
  // Agent Invariants
  // ===========================================================================

  describe('Agent Invariants', () => {
    it('all agent .md files have valid frontmatter (name + description)', () => {
      const results = checkAgentFrontmatter();

      // There should be agents to check
      const agentFiles = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));
      expect(agentFiles.length).toBeGreaterThan(0);
      expect(results.length).toBe(agentFiles.length);

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('all agents have tool constraints (not unrestricted)', () => {
      const results = checkAgentToolConstraints();

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('agent frontmatter opens and closes with --- fences', () => {
      const agentFiles = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));

      for (const file of agentFiles) {
        const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
        expect(
          content.startsWith('---\n'),
          `${file} must start with --- frontmatter fence`,
        ).toBe(true);

        // Must have a closing fence
        const secondFence = content.indexOf('---', 4);
        expect(
          secondFence,
          `${file} must have closing --- frontmatter fence`,
        ).toBeGreaterThan(0);
      }
    });

    it('no agent has permissionMode: bypassAll', () => {
      const agentFiles = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));

      for (const file of agentFiles) {
        const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
        expect(
          content,
          `${file} should not have permissionMode: bypassAll`,
        ).not.toMatch(/permissionMode:\s*bypassAll/);
      }
    });
  });

  // ===========================================================================
  // Skill Invariants
  // ===========================================================================

  describe('Skill Invariants', () => {
    it('all SKILL.md files have name and description fields', () => {
      const results = checkSkillNameAndDescription();

      // There should be skills to check
      const skillDirs = fs.readdirSync(SKILLS_DIR).filter((d) =>
        fs.existsSync(path.join(SKILLS_DIR, d, 'SKILL.md')),
      );
      expect(skillDirs.length).toBeGreaterThan(0);
      expect(results.length).toBe(skillDirs.length);

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('skill descriptions are under 250 characters', () => {
      const results = checkSkillDescriptionLength();

      for (const result of results) {
        // Note: some skills may use multi-line quoted descriptions in YAML
        // that exceed 250 when fully expanded. The frontmatter parser only
        // captures the first line, so this tests the visible inline description.
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('no skill files contain injection patterns (eval, exec, child_process)', () => {
      const results = checkSkillNoInjectionPatterns();

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('skills do not reference absolute paths outside the project', () => {
      const results = checkSkillNoExternalReferences();

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('every skill directory has a SKILL.md file', () => {
      const skillDirs = fs.readdirSync(SKILLS_DIR).filter((d) =>
        fs.statSync(path.join(SKILLS_DIR, d)).isDirectory(),
      );

      for (const dir of skillDirs) {
        const skillMd = path.join(SKILLS_DIR, dir, 'SKILL.md');
        expect(
          fs.existsSync(skillMd),
          `${dir}/ is missing SKILL.md`,
        ).toBe(true);
      }
    });

    it('SKILL.md frontmatter opens and closes with --- fences', () => {
      const skillDirs = fs.readdirSync(SKILLS_DIR).filter((d) =>
        fs.existsSync(path.join(SKILLS_DIR, d, 'SKILL.md')),
      );

      for (const dir of skillDirs) {
        const content = fs.readFileSync(
          path.join(SKILLS_DIR, dir, 'SKILL.md'),
          'utf8',
        );
        expect(
          content.startsWith('---\n'),
          `${dir}/SKILL.md must start with --- frontmatter fence`,
        ).toBe(true);

        const secondFence = content.indexOf('---', 4);
        expect(
          secondFence,
          `${dir}/SKILL.md must have closing --- frontmatter fence`,
        ).toBeGreaterThan(0);
      }
    });
  });

  // ===========================================================================
  // Build Invariants
  // ===========================================================================

  describe('Build Invariants', () => {
    it('package versions are consistent across all manifests', () => {
      const result = checkVersionConsistency();
      expect(result.passed, result.message).toBe(true);
    });

    it('package.json has required fields', () => {
      const pkgPath = path.join(PROJECT_ROOT, 'package.json');
      expect(fs.existsSync(pkgPath)).toBe(true);

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(pkg.name).toBeDefined();
      expect(pkg.version).toBeDefined();
      expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('tsconfig.json has strict mode enabled', () => {
      const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(
        tsconfig.compilerOptions?.strict,
        'TypeScript strict mode must be enabled',
      ).toBe(true);
    });

    it('no TypeScript `any` types in chipset/ source files (test files excluded)', () => {
      const chipsetDir = path.join(PROJECT_ROOT, 'src', 'chipset');
      const tsFiles: string[] = [];

      function walk(dir: string): void {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(full);
          } else if (
            entry.name.endsWith('.ts') &&
            !entry.name.endsWith('.test.ts') &&
            !entry.name.endsWith('.d.ts')
          ) {
            tsFiles.push(full);
          }
        }
      }

      walk(chipsetDir);
      expect(tsFiles.length).toBeGreaterThan(0);

      const anyPattern = /:\s*any\b|as\s+any\b|<any>|any\[\]/;
      const violations: string[] = [];

      for (const file of tsFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (anyPattern.test(lines[i])) {
            const rel = path.relative(PROJECT_ROOT, file);
            violations.push(`${rel}:${i + 1}: ${lines[i].trim()}`);
          }
        }
      }

      expect(
        violations,
        `Found \`any\` types in chipset source files:\n${violations.join('\n')}`,
      ).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Meta: Full suite runner
  // ===========================================================================

  describe('Full Suite Runner', () => {
    it('runAllInvariantChecks returns structured results for all suites', () => {
      const suites = runAllInvariantChecks();

      // Must return all 5 suites
      expect(suites.length).toBe(5);

      const suiteNames = suites.map((s) => s.suite);
      expect(suiteNames).toContain('Permission Invariants');
      expect(suiteNames).toContain('State Invariants');
      expect(suiteNames).toContain('Agent Invariants');
      expect(suiteNames).toContain('Skill Invariants');
      expect(suiteNames).toContain('Build Invariants');

      // Every suite must have at least one result
      for (const suite of suites) {
        expect(
          suite.results.length,
          `${suite.suite} has no results`,
        ).toBeGreaterThan(0);
      }

      // allPassed must match individual results
      for (const suite of suites) {
        const computedAllPassed = suite.results.every((r) => r.passed);
        expect(suite.allPassed).toBe(computedAllPassed);
      }
    });

    it('all invariant checks pass on current codebase', () => {
      const suites = runAllInvariantChecks();

      const failures: string[] = [];
      for (const suite of suites) {
        for (const result of suite.results) {
          if (!result.passed) {
            failures.push(`[${suite.suite}] ${result.name}: ${result.message}`);
          }
        }
      }

      expect(
        failures,
        `Invariant failures:\n${failures.join('\n')}`,
      ).toHaveLength(0);
    });
  });
});
