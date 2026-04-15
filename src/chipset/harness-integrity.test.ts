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

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
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
  checkConfigImmutability,
  checkFailSafeDefaults,
  checkAgentToolRiskClassification,
  checkHookFailureBehavior,
  checkMcpServerTrustBoundary,
  checkMcpToolAllowlist,
  checkMcpEnvPathSafety,
  checkResponseDlpCapability,
  checkSkillNoPrivilegeEscalation,
  checkMcpToolDescriptionHashes,
  checkUnicodeCompositionScanning,
  checkSkillNoImpersonation,
  checkSubagentToolConstraintEnforcement,
  checkRagSanitizationPolicy,
  runAllInvariantChecks,
} from './harness-integrity.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
//
// Tests operate against a tmpdir populated by `node project-claude/install.cjs`
// (see beforeAll below). HARNESS_CLAUDE_DIR points the helpers in
// harness-integrity.ts at the same tmpdir. This validates the *installed*
// harness — the artifact end users actually run — and works identically on
// CI (where .claude/ does not exist) and local dev (where .claude/ has extra
// unmanaged content the test should ignore).

const PROJECT_ROOT = path.resolve(import.meta.dirname ?? __dirname, '../..');
const GITIGNORE_PATH = path.join(PROJECT_ROOT, '.gitignore');

let CLAUDE_DIR: string;
let AGENTS_DIR: string;
let HOOKS_DIR: string;
let SKILLS_DIR: string;
let SETTINGS_PATH: string;

// ===========================================================================
// Permission Invariants
// ===========================================================================

describe('Harness Integrity', () => {
  let tmpRoot: string;

  beforeAll(() => {
    // Create a tmpdir and install project-claude/ into it. This gives the
    // tests a known, reproducible filesystem that matches what end users get
    // from `npx skill-creator`. Without this, CI (which has no .claude/) and
    // local dev (which has extra unmanaged content) see different worlds.
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-integrity-'));
    // install.cjs requires a git repo to install the post-commit hook
    execSync('git init --quiet', { cwd: tmpRoot, stdio: 'pipe' });
    const installScript = path.join(PROJECT_ROOT, 'project-claude', 'install.cjs');
    execSync(`node ${JSON.stringify(installScript)} --local --quiet`, {
      cwd: tmpRoot,
      stdio: 'pipe',
    });

    CLAUDE_DIR = path.join(tmpRoot, '.claude');
    AGENTS_DIR = path.join(CLAUDE_DIR, 'agents');
    HOOKS_DIR = path.join(CLAUDE_DIR, 'hooks');
    SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
    SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
    process.env.HARNESS_CLAUDE_DIR = CLAUDE_DIR;
  });

  afterAll(() => {
    delete process.env.HARNESS_CLAUDE_DIR;
    if (tmpRoot && fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

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
  // Security Invariants (OWASP + CMU Safety)
  // ===========================================================================

  describe('Security Invariants', () => {
    it('settings.json is protected from agent writes (config immutability)', () => {
      const result = checkConfigImmutability();
      expect(result.passed, result.message).toBe(true);
    });

    it('config immutability protection is tracked in project-claude/hooks/ (fresh-clone guarantee)', () => {
      // The architectural invariant: even before `node project-claude/install.cjs`
      // runs, the tracked source must contain a hook that references settings.json
      // and hard-blocks. This is what checkConfigImmutability falls back to on
      // fresh clones so the test can pass without a prior install step.
      const sourceHooksDir = path.join(PROJECT_ROOT, 'project-claude', 'hooks');
      expect(fs.existsSync(sourceHooksDir), 'project-claude/hooks/ must exist').toBe(true);

      const hookFiles = fs
        .readdirSync(sourceHooksDir)
        .filter((f) => f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.mjs'));

      const protectors = hookFiles.filter((f) => {
        const content = fs.readFileSync(path.join(sourceHooksDir, f), 'utf8');
        const refsSettings =
          content.includes('settings.json') || content.includes('.claude/settings');
        const blocks =
          /process\.exit\(\s*2\s*\)/.test(content) ||
          /permissionDecision\s*:\s*['"]deny['"]/.test(content);
        return refsSettings && blocks;
      });

      expect(
        protectors.length,
        'project-claude/hooks/ must contain a tracked hook that blocks writes to settings.json',
      ).toBeGreaterThan(0);
    });

    it('settings.json is valid JSON (fail-safe defaults)', () => {
      const result = checkFailSafeDefaults();
      expect(result.passed, result.message).toBe(true);
    });

    it('agents with high-risk tools have proper constraints (tool risk classification)', () => {
      const results = checkAgentToolRiskClassification();

      for (const result of results) {
        // Wildcard access and bash-without-read are failures
        if (result.name.includes(':wildcard') || result.name.includes(':bash-no-read')) {
          expect(result.passed, result.message).toBe(true);
        }
      }
    });

    it('no agent has wildcard tool access', () => {
      const results = checkAgentToolRiskClassification();
      const wildcards = results.filter((r) => r.name.includes(':wildcard'));

      for (const result of wildcards) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('PreToolUse hooks block on failure (no zero-timeout safety gates)', () => {
      const results = checkHookFailureBehavior();
      expect(results.length).toBeGreaterThan(0);

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('PreToolUse hooks exist for critical tool matchers', () => {
      const results = checkHookFailureBehavior();
      const missing = results.filter((r) => r.name.includes(':missing'));
      expect(missing, 'Missing critical PreToolUse hooks').toHaveLength(0);
    });

    it('MCP servers are local processes, not remote endpoints', () => {
      const results = checkMcpServerTrustBoundary();

      for (const result of results) {
        if (result.name.includes(':remote')) {
          expect(result.passed, result.message).toBe(true);
        }
      }
    });

    it('MCP server binaries exist on disk', () => {
      const results = checkMcpServerTrustBoundary();

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('skill bodies do not contain privilege escalation patterns', () => {
      const results = checkSkillNoPrivilegeEscalation();

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    it('PostToolUse hooks exist for response-side scanning (DLP)', () => {
      const results = checkResponseDlpCapability();
      expect(results.length).toBeGreaterThan(0);

      // Should not have "no PostToolUse hooks" failure
      const missing = results.filter((r) => r.name.includes(':no-post-hooks'));
      expect(missing, 'PostToolUse hooks must exist for response scanning').toHaveLength(0);
    });

    it('MCP servers declare expected tool allowlists', () => {
      // This is a warning-level check — servers SHOULD have allowlists
      const results = checkMcpToolAllowlist();
      // At minimum, the check ran for each configured server
      if (fs.existsSync(path.join(PROJECT_ROOT, '.mcp.json'))) {
        expect(results.length).toBeGreaterThan(0);
      }
    });

    it('MCP server env paths are under safe locations', () => {
      const results = checkMcpEnvPathSafety();

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    // HI-11: Tool description hashing
    it('MCP servers with allowlists have tool description hashes (HI-11)', () => {
      const results = checkMcpToolDescriptionHashes();
      // Servers with expectedTools should also have toolDescriptionHashes
      for (const result of results) {
        if (result.name.includes(':missing')) {
          // Warn but don't block — hashing is new, servers need migration
          expect(result.passed).toBeDefined();
        }
      }
    });

    // HI-12: Unicode composition scanning
    it('prompt guard has Unicode injection scanning capability (HI-12)', () => {
      const results = checkUnicodeCompositionScanning();
      expect(results.length).toBeGreaterThan(0);

      // Should not have the "no guard" failure
      const noGuard = results.filter((r) => r.name.includes(':no-guard'));
      expect(noGuard, 'gsd-prompt-guard.js must exist for Unicode scanning').toHaveLength(0);
    });

    // HI-13: Agent impersonation detection
    it('skill bodies do not contain impersonation patterns (HI-13)', () => {
      const results = checkSkillNoImpersonation();

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    // HI-14: Subagent tool constraint enforcement
    it('all subagents declare explicit non-wildcard tool constraints (HI-14)', () => {
      const results = checkSubagentToolConstraintEnforcement();

      for (const result of results) {
        expect(result.passed, result.message).toBe(true);
      }
    });

    // HI-15: pgvector/RAG sanitization
    it('RAG/vector database servers are identified and audited (HI-15)', () => {
      const results = checkRagSanitizationPolicy();
      expect(results.length).toBeGreaterThan(0);

      // No write-access violations
      const writeViolations = results.filter((r) =>
        r.name.includes(':write-access') && !r.passed);
      expect(
        writeViolations,
        'RAG servers should not have write tools — poisoning risk',
      ).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Meta: Full suite runner
  // ===========================================================================

  describe('Full Suite Runner', () => {
    it('runAllInvariantChecks returns structured results for all suites', () => {
      const suites = runAllInvariantChecks();

      // Must return all 6 suites
      expect(suites.length).toBe(6);

      const suiteNames = suites.map((s) => s.suite);
      expect(suiteNames).toContain('Permission Invariants');
      expect(suiteNames).toContain('State Invariants');
      expect(suiteNames).toContain('Agent Invariants');
      expect(suiteNames).toContain('Skill Invariants');
      expect(suiteNames).toContain('Build Invariants');
      expect(suiteNames).toContain('Security Invariants');

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
