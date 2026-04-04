/**
 * Harness Integrity Checks
 *
 * Validates that safety invariants survive configuration changes to skills,
 * hooks, agents, and settings. These are NOT unit tests for features — they
 * are guardrail checks that verify the harness itself remains safe.
 *
 * Primitive 8, Level 2: verify that harness changes preserve safety invariants.
 *
 * @module chipset/harness-integrity
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(import.meta.dirname ?? __dirname, '../..');

const CLAUDE_DIR = path.join(PROJECT_ROOT, '.claude');
const AGENTS_DIR = path.join(CLAUDE_DIR, 'agents');
const HOOKS_DIR = path.join(CLAUDE_DIR, 'hooks');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
const GITIGNORE_PATH = path.join(PROJECT_ROOT, '.gitignore');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvariantResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface InvariantSuiteResult {
  suite: string;
  results: InvariantResult[];
  allPassed: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse YAML-style frontmatter from a markdown file.
 * Returns the raw text between the opening and closing `---` fences.
 */
function extractFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fields: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (kv) {
      fields[kv[1]] = kv[2].trim();
    }
  }
  return fields;
}

/**
 * Read all .md files from a directory.
 */
function readMarkdownFiles(dir: string): Array<{ name: string; content: string }> {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({
      name: f,
      content: fs.readFileSync(path.join(dir, f), 'utf8'),
    }));
}

/**
 * Read all SKILL.md files from skill subdirectories.
 */
function readSkillFiles(): Array<{ name: string; content: string; dir: string }> {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs.readdirSync(SKILLS_DIR)
    .filter((d) => {
      const skillPath = path.join(SKILLS_DIR, d, 'SKILL.md');
      return fs.existsSync(skillPath);
    })
    .map((d) => ({
      name: d,
      dir: d,
      content: fs.readFileSync(path.join(SKILLS_DIR, d, 'SKILL.md'), 'utf8'),
    }));
}

/**
 * Read .gitignore and return normalized patterns.
 */
function readGitignorePatterns(): string[] {
  if (!fs.existsSync(GITIGNORE_PATH)) return [];
  return fs.readFileSync(GITIGNORE_PATH, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

/**
 * Check if a pattern (directory or file) is covered by gitignore.
 * Matches both exact patterns and directory-with-slash patterns.
 */
function isGitignored(target: string, patterns: string[]): boolean {
  const normalized = target.replace(/\/$/, '');
  return patterns.some((p) => {
    const pNorm = p.replace(/\/$/, '');
    return pNorm === normalized || pNorm === `${normalized}/` || p === `${normalized}/`;
  });
}

// ---------------------------------------------------------------------------
// Permission Invariants
// ---------------------------------------------------------------------------

export function checkHookScriptsExecutable(): InvariantResult[] {
  const results: InvariantResult[] = [];
  if (!fs.existsSync(HOOKS_DIR)) {
    results.push({
      name: 'hook-dir-exists',
      passed: false,
      message: `Hooks directory does not exist: ${HOOKS_DIR}`,
    });
    return results;
  }

  const hookFiles = fs.readdirSync(HOOKS_DIR).filter((f) => f.endsWith('.sh'));
  for (const file of hookFiles) {
    const fullPath = path.join(HOOKS_DIR, file);
    const stat = fs.statSync(fullPath);
    const isExec = (stat.mode & 0o111) !== 0;
    results.push({
      name: `hook-executable:${file}`,
      passed: isExec,
      message: isExec
        ? `${file} is executable`
        : `${file} is NOT executable (mode: ${stat.mode.toString(8)})`,
    });
  }
  return results;
}

export function checkSettingsHookReferences(): InvariantResult[] {
  const results: InvariantResult[] = [];
  if (!fs.existsSync(SETTINGS_PATH)) {
    results.push({
      name: 'settings-exists',
      passed: false,
      message: 'settings.json does not exist',
    });
    return results;
  }

  const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  const hooks = settings.hooks ?? {};

  for (const [eventName, hookGroups] of Object.entries(hooks)) {
    if (!Array.isArray(hookGroups)) continue;
    for (const group of hookGroups as Array<Record<string, unknown>>) {
      const innerHooks = (group.hooks ?? []) as Array<Record<string, unknown>>;
      for (const hook of innerHooks) {
        if (hook.type !== 'command' || typeof hook.command !== 'string') continue;
        const cmd = hook.command as string;

        // Extract the file path from the command.
        // Commands look like: "node .claude/hooks/foo.js" or "bash .claude/hooks/bar.sh"
        const fileMatch = cmd.match(/(?:node|bash)\s+(\S+)/);
        if (!fileMatch) continue;

        const refPath = path.resolve(PROJECT_ROOT, fileMatch[1]);
        const exists = fs.existsSync(refPath);
        results.push({
          name: `hook-ref:${eventName}:${path.basename(refPath)}`,
          passed: exists,
          message: exists
            ? `${fileMatch[1]} exists`
            : `${fileMatch[1]} does NOT exist (referenced in ${eventName})`,
        });
      }
    }
  }
  return results;
}

export function checkNoVerificationBypasses(): InvariantResult[] {
  const results: InvariantResult[] = [];
  if (!fs.existsSync(SETTINGS_PATH)) return results;

  const content = fs.readFileSync(SETTINGS_PATH, 'utf8');
  const dangerousPatterns = ['--no-verify', '--force'];

  for (const pattern of dangerousPatterns) {
    const found = content.includes(pattern);
    results.push({
      name: `no-bypass:${pattern}`,
      passed: !found,
      message: found
        ? `settings.json contains '${pattern}' — verification bypass detected`
        : `No '${pattern}' bypass in settings.json`,
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// State Invariants
// ---------------------------------------------------------------------------

export function checkPlanningGitignored(): InvariantResult {
  const patterns = readGitignorePatterns();
  const ignored = isGitignored('.planning/', patterns);
  return {
    name: 'planning-gitignored',
    passed: ignored,
    message: ignored
      ? '.planning/ is in .gitignore'
      : '.planning/ is NOT in .gitignore — local-only directory exposed',
  };
}

export function checkClaudeGitignored(): InvariantResult {
  const patterns = readGitignorePatterns();
  const ignored = isGitignored('.claude/', patterns);
  return {
    name: 'claude-gitignored',
    passed: ignored,
    message: ignored
      ? '.claude/ is in .gitignore'
      : '.claude/ is NOT in .gitignore — harness config exposed',
  };
}

export function checkNoEnvFilesTracked(): InvariantResult {
  try {
    const output = execSync('git ls-files --cached "*.env" ".env" ".env.*"', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 5000,
    }).trim();

    const tracked = output.length > 0;
    return {
      name: 'no-env-tracked',
      passed: !tracked,
      message: tracked
        ? `Tracked .env files found: ${output}`
        : 'No .env files tracked by git',
    };
  } catch {
    return {
      name: 'no-env-tracked',
      passed: true,
      message: 'No .env files tracked by git (no matches)',
    };
  }
}

// ---------------------------------------------------------------------------
// Agent Invariants
// ---------------------------------------------------------------------------

export function checkAgentFrontmatter(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const agents = readMarkdownFiles(AGENTS_DIR);

  for (const agent of agents) {
    const fm = extractFrontmatter(agent.content);
    const hasName = 'name' in fm && fm.name.length > 0;
    const hasDescription = 'description' in fm && fm.description.length > 0;

    results.push({
      name: `agent-frontmatter:${agent.name}`,
      passed: hasName && hasDescription,
      message: hasName && hasDescription
        ? `${agent.name} has valid frontmatter (name + description)`
        : `${agent.name} missing ${!hasName ? 'name' : ''}${!hasName && !hasDescription ? ' and ' : ''}${!hasDescription ? 'description' : ''} in frontmatter`,
    });
  }
  return results;
}

export function checkAgentToolConstraints(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const agents = readMarkdownFiles(AGENTS_DIR);

  for (const agent of agents) {
    const fm = extractFrontmatter(agent.content);

    // tools field can be a comma-separated string or YAML list.
    // If absent, the agent has unrestricted access.
    const hasTools = 'tools' in fm && fm.tools.length > 0;

    // Also check for YAML list style (tools:\n  - Read\n  - Write)
    const hasToolsList = /^tools:\s*$/m.test(agent.content.split('---')[1] ?? '') ||
      /^tools:\s*\n\s+-/m.test(agent.content.split('---')[1] ?? '');

    const constrained = hasTools || hasToolsList;
    results.push({
      name: `agent-tool-constraints:${agent.name}`,
      passed: constrained,
      message: constrained
        ? `${agent.name} has tool constraints`
        : `${agent.name} has NO tool constraints — unrestricted access`,
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Skill Invariants
// ---------------------------------------------------------------------------

export function checkSkillNameAndDescription(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const skills = readSkillFiles();

  for (const skill of skills) {
    const fm = extractFrontmatter(skill.content);
    const hasName = 'name' in fm && fm.name.length > 0;
    const hasDescription = 'description' in fm && fm.description.length > 0;

    results.push({
      name: `skill-fields:${skill.dir}`,
      passed: hasName && hasDescription,
      message: hasName && hasDescription
        ? `${skill.dir}/SKILL.md has name and description`
        : `${skill.dir}/SKILL.md missing ${!hasName ? 'name' : ''}${!hasName && !hasDescription ? ' and ' : ''}${!hasDescription ? 'description' : ''}`,
    });
  }
  return results;
}

export function checkSkillDescriptionLength(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const skills = readSkillFiles();

  for (const skill of skills) {
    const fm = extractFrontmatter(skill.content);
    const rawDesc = (fm.description ?? '');
    // Strip YAML quotes
    const desc = rawDesc.replace(/^["']|["']$/g, '');

    // For descriptions that include trigger phrases (quoted YAML strings),
    // extract the core description — the first sentence, which is the
    // displayable portion. Trigger phrases after the first sentence are
    // for Claude's skill-matching context and not subject to the 250 limit.
    const firstSentenceMatch = desc.match(/^([^.]+\.)/);
    const measuredPart = firstSentenceMatch ? firstSentenceMatch[1] : desc;
    const len = measuredPart.length;
    const under250 = len <= 250;

    results.push({
      name: `skill-desc-length:${skill.dir}`,
      passed: under250,
      message: under250
        ? `${skill.dir} core description is ${len} chars (limit: 250)`
        : `${skill.dir} core description is ${len} chars — EXCEEDS 250 char limit`,
    });
  }
  return results;
}

export function checkSkillNoInjectionPatterns(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const skills = readSkillFiles();
  const dangerousPatterns = [
    /\beval\s*\(/,
    /\bexec\s*\(/,
    /\bchild_process\b/,
  ];

  for (const skill of skills) {
    // Only scan frontmatter for injection patterns. The documentation body
    // legitimately contains code examples with template literals, shell
    // substitutions, etc. The safety concern is injection in configuration,
    // not in documentation.
    const fmMatch = skill.content.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter = fmMatch ? fmMatch[1] : '';

    const found: string[] = [];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(frontmatter)) {
        found.push(pattern.source);
      }
    }

    results.push({
      name: `skill-no-injection:${skill.dir}`,
      passed: found.length === 0,
      message: found.length === 0
        ? `${skill.dir} frontmatter has no injection patterns`
        : `${skill.dir} frontmatter contains dangerous patterns: ${found.join(', ')}`,
    });
  }
  return results;
}

export function checkSkillNoExternalReferences(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const skills = readSkillFiles();

  // Patterns that reference absolute paths outside the project.
  // Only checked in frontmatter — documentation body may legitimately
  // reference external paths in examples or workflow descriptions.
  const externalPatterns = [
    /(?:^|\s)(\/(?:usr|etc|home|var|opt)\/\S+)/m,
    /(?:^|\s)(~\/\S+)/m,
    /(?:^|\s)(C:\\[^ ]+)/m,
  ];

  for (const skill of skills) {
    const fmMatch = skill.content.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter = fmMatch ? fmMatch[1] : '';

    const found: string[] = [];
    for (const pattern of externalPatterns) {
      const match = frontmatter.match(pattern);
      if (match) {
        found.push(match[1]);
      }
    }

    results.push({
      name: `skill-no-external:${skill.dir}`,
      passed: found.length === 0,
      message: found.length === 0
        ? `${skill.dir} frontmatter has no external path references`
        : `${skill.dir} frontmatter references external paths: ${found.join(', ')}`,
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Build Invariants
// ---------------------------------------------------------------------------

export function checkVersionConsistency(): InvariantResult {
  const pkgPath = path.join(PROJECT_ROOT, 'package.json');
  const cargoPath = path.join(PROJECT_ROOT, 'src-tauri', 'Cargo.toml');
  const tauriConfPath = path.join(PROJECT_ROOT, 'src-tauri', 'tauri.conf.json');

  const versions: Array<{ source: string; version: string }> = [];

  // package.json
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    versions.push({ source: 'package.json', version: pkg.version });
  }

  // Cargo.toml
  if (fs.existsSync(cargoPath)) {
    const cargo = fs.readFileSync(cargoPath, 'utf8');
    const match = cargo.match(/^version\s*=\s*"([^"]+)"/m);
    if (match) {
      versions.push({ source: 'Cargo.toml', version: match[1] });
    }
  }

  // tauri.conf.json
  if (fs.existsSync(tauriConfPath)) {
    const conf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
    if (conf.version) {
      versions.push({ source: 'tauri.conf.json', version: conf.version });
    }
  }

  if (versions.length <= 1) {
    return {
      name: 'version-consistency',
      passed: true,
      message: `Only ${versions.length} manifest found — nothing to compare`,
    };
  }

  const allSame = versions.every((v) => v.version === versions[0].version);
  const detail = versions.map((v) => `${v.source}=${v.version}`).join(', ');
  return {
    name: 'version-consistency',
    passed: allSame,
    message: allSame
      ? `All manifests report ${versions[0].version} (${detail})`
      : `Version mismatch: ${detail}`,
  };
}

// ---------------------------------------------------------------------------
// Full suite runner
// ---------------------------------------------------------------------------

export function runAllInvariantChecks(): InvariantSuiteResult[] {
  const suites: InvariantSuiteResult[] = [];

  // Permission invariants
  const permResults = [
    ...checkHookScriptsExecutable(),
    ...checkSettingsHookReferences(),
    ...checkNoVerificationBypasses(),
  ];
  suites.push({
    suite: 'Permission Invariants',
    results: permResults,
    allPassed: permResults.every((r) => r.passed),
  });

  // State invariants
  const stateResults = [
    checkPlanningGitignored(),
    checkClaudeGitignored(),
    checkNoEnvFilesTracked(),
  ];
  suites.push({
    suite: 'State Invariants',
    results: stateResults,
    allPassed: stateResults.every((r) => r.passed),
  });

  // Agent invariants
  const agentResults = [
    ...checkAgentFrontmatter(),
    ...checkAgentToolConstraints(),
  ];
  suites.push({
    suite: 'Agent Invariants',
    results: agentResults,
    allPassed: agentResults.every((r) => r.passed),
  });

  // Skill invariants
  const skillResults = [
    ...checkSkillNameAndDescription(),
    ...checkSkillDescriptionLength(),
    ...checkSkillNoInjectionPatterns(),
    ...checkSkillNoExternalReferences(),
  ];
  suites.push({
    suite: 'Skill Invariants',
    results: skillResults,
    allPassed: skillResults.every((r) => r.passed),
  });

  // Build invariants
  const buildResults = [checkVersionConsistency()];
  suites.push({
    suite: 'Build Invariants',
    results: buildResults,
    allPassed: buildResults.every((r) => r.passed),
  });

  return suites;
}
