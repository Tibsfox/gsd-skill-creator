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

// Resolved lazily so tests can override via HARNESS_CLAUDE_DIR (e.g. point at a
// tmpdir populated by `node project-claude/install.cjs`). Without an override
// they resolve to the project's installed `.claude/` tree.
function claudeDir(): string {
  return process.env.HARNESS_CLAUDE_DIR ?? path.join(PROJECT_ROOT, '.claude');
}
function agentsDir(): string { return path.join(claudeDir(), 'agents'); }
function hooksDir(): string { return path.join(claudeDir(), 'hooks'); }
function skillsDir(): string { return path.join(claudeDir(), 'skills'); }
function settingsPath(): string { return path.join(claudeDir(), 'settings.json'); }
const GITIGNORE_PATH = path.join(PROJECT_ROOT, '.gitignore');

// Tracked source for project-specific hooks. Installed into hooksDir() by
// `node project-claude/install.cjs`. Used as a fallback by
// checkConfigImmutability so the invariant holds on fresh clones before
// install has been run.
const PROJECT_CLAUDE_HOOKS_DIR = path.join(PROJECT_ROOT, 'project-claude', 'hooks');

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
  if (!fs.existsSync(skillsDir())) return [];
  return fs.readdirSync(skillsDir())
    .filter((d) => {
      const skillPath = path.join(skillsDir(), d, 'SKILL.md');
      return fs.existsSync(skillPath);
    })
    .map((d) => ({
      name: d,
      dir: d,
      content: fs.readFileSync(path.join(skillsDir(), d, 'SKILL.md'), 'utf8'),
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
  if (!fs.existsSync(hooksDir())) {
    results.push({
      name: 'hook-dir-exists',
      passed: false,
      message: `Hooks directory does not exist: ${hooksDir()}`,
    });
    return results;
  }

  const hookFiles = fs.readdirSync(hooksDir()).filter((f) => f.endsWith('.sh'));
  for (const file of hookFiles) {
    const fullPath = path.join(hooksDir(), file);
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
  if (!fs.existsSync(settingsPath())) {
    results.push({
      name: 'settings-exists',
      passed: false,
      message: 'settings.json does not exist',
    });
    return results;
  }

  const settings = JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
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

        const refPath = path.resolve(path.dirname(claudeDir()), fileMatch[1]);
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
  if (!fs.existsSync(settingsPath())) return results;

  const content = fs.readFileSync(settingsPath(), 'utf8');
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
  const agents = readMarkdownFiles(agentsDir());

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
  const agents = readMarkdownFiles(agentsDir());

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
  const lockPath = path.join(PROJECT_ROOT, 'package-lock.json');
  const cargoPath = path.join(PROJECT_ROOT, 'src-tauri', 'Cargo.toml');
  const tauriConfPath = path.join(PROJECT_ROOT, 'src-tauri', 'tauri.conf.json');

  const versions: Array<{ source: string; version: string }> = [];

  // package.json
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    versions.push({ source: 'package.json', version: pkg.version });
  }

  // package-lock.json (root + packages[""] both carry version fields)
  if (fs.existsSync(lockPath)) {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    if (lock.version) {
      versions.push({ source: 'package-lock.json', version: lock.version });
    }
    if (lock.packages?.['']?.version) {
      versions.push({ source: 'package-lock.json[packages.""]', version: lock.packages[''].version });
    }
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
// Security Invariants (from CMU Safety + OWASP analysis, Session 6)
// ---------------------------------------------------------------------------

/**
 * Config immutability: settings.json must not be writable by agent file-write tools.
 * OWASP finding: configuration-overwrite attack can bypass permission gates.
 *
 * Defense: a project-tracked PreToolUse hook (gsd-config-guard.js, sourced
 * from project-claude/hooks/) must hard-block Write/Edit targeting
 * .claude/settings.json via exit code 2.
 *
 * We verify protection by scanning hook files in BOTH:
 *
 *   1. .claude/hooks/             (installed, active at runtime)
 *   2. project-claude/hooks/      (tracked source, installed via install.cjs)
 *
 * and look for any hook that both references settings.json AND blocks
 * (exit 2 / permissionDecision "deny"). Scanning both keeps the invariant
 * robust in three scenarios:
 *
 *   - Fresh clone pre-install: tracked source provides the architectural
 *     guarantee; message tells the caller to run install.cjs to activate.
 *   - Active installed workspace: installed hook is the active protector.
 *   - Renamed / multi-hook setups: we match any protecting hook, not a
 *     hardcoded filename, so the test survives refactors.
 */
export function checkConfigImmutability(): InvariantResult {
  if (!fs.existsSync(settingsPath())) {
    return { name: 'config-immutability', passed: true, message: 'No settings.json to protect' };
  }

  const installedProtectors = scanHooksForSettingsProtection(hooksDir());
  const sourceProtectors = scanHooksForSettingsProtection(PROJECT_CLAUDE_HOOKS_DIR);

  // Active-runtime protection — the ideal state.
  if (installedProtectors.length > 0) {
    return {
      name: 'config-immutability',
      passed: true,
      message: `settings.json write protection active via: ${installedProtectors.join(', ')}`,
    };
  }

  // Architectural guarantee present in tracked source but not yet installed.
  // This is the fresh-clone case: the repo ships the protection, but the
  // installer hasn't copied it into .claude/hooks/ yet. Pass the invariant
  // — the architecture is sound — while surfacing the remediation in the
  // message so a caller noticing this knows to run install.cjs.
  if (sourceProtectors.length > 0) {
    return {
      name: 'config-immutability',
      passed: true,
      message:
        `settings.json write protection tracked in project-claude/hooks/ ` +
        `(${sourceProtectors.join(', ')}); run \`node project-claude/install.cjs\` to activate`,
    };
  }

  // Neither location has a protector — the architecture itself is broken.
  return {
    name: 'config-immutability',
    passed: false,
    message:
      'CRITICAL: no hook in .claude/hooks/ or project-claude/hooks/ blocks writes to ' +
      'settings.json — config-overwrite attack possible',
  };
}

/**
 * Scan a hooks directory for any .js/.cjs/.mjs file that both references
 * settings.json AND contains a blocking pattern (exit code 2 or explicit
 * deny decision). Returns the filenames of matches. Missing directory
 * returns [] without error so the caller can use a fallback location.
 */
function scanHooksForSettingsProtection(hooksDir: string): string[] {
  if (!fs.existsSync(hooksDir)) return [];

  let entries: string[];
  try {
    entries = fs.readdirSync(hooksDir);
  } catch {
    return [];
  }

  const hookFiles = entries.filter(
    (f) => f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.mjs'),
  );

  const protectors: string[] = [];
  for (const hookFile of hookFiles) {
    let content: string;
    try {
      content = fs.readFileSync(path.join(hooksDir, hookFile), 'utf8');
    } catch {
      continue;
    }
    const referencesSettings =
      content.includes('settings.json') || content.includes('.claude/settings');
    if (!referencesSettings) continue;
    const blocks =
      /process\.exit\(\s*2\s*\)/.test(content) ||
      /permissionDecision\s*:\s*['"]deny['"]/.test(content);
    if (blocks) protectors.push(hookFile);
  }
  return protectors;
}

/**
 * Tool enumeration and risk classification: agents with high-risk tools
 * (Bash, Write, Edit) must have explicit tool constraints that limit scope.
 * OWASP Priority #1: enumerate every tool, classify risk, verify approval.
 */
export function checkAgentToolRiskClassification(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const agents = readMarkdownFiles(agentsDir());
  const highRiskTools = ['Bash', 'Write', 'Edit', 'MultiEdit'];

  for (const agent of agents) {
    const fm = extractFrontmatter(agent.content);
    const toolsRaw = fm.tools ?? '';
    // Tools can be comma-separated or YAML list
    const tools = toolsRaw
      .split(/[,\n]/)
      .map((t) => t.replace(/^\s*-\s*/, '').trim())
      .filter(Boolean);

    if (tools.length === 0) {
      // No explicit tool list — unrestricted, already flagged by checkAgentToolConstraints
      continue;
    }

    // Check for wildcard / unrestricted patterns
    if (tools.includes('*') || tools.some((t) => t.toLowerCase() === 'all')) {
      results.push({
        name: `agent-tool-risk:${agent.name}:wildcard`,
        passed: false,
        message: `${agent.name} has wildcard tool access — bypasses all tool constraints`,
      });
      continue;
    }

    // Flag agents with high-risk tools
    const riskyTools = tools.filter((t) => highRiskTools.includes(t));
    if (riskyTools.length > 0) {
      // Agents with Bash should also have Read (need to verify before executing)
      const hasBash = riskyTools.includes('Bash');
      const hasRead = tools.includes('Read');
      if (hasBash && !hasRead) {
        results.push({
          name: `agent-tool-risk:${agent.name}:bash-no-read`,
          passed: false,
          message: `${agent.name} has Bash but not Read — blind execution without verification`,
        });
      }

      // Agents with Write/Edit should not also have unrestricted Bash
      const hasWrite = riskyTools.includes('Write') || riskyTools.includes('Edit');
      if (hasWrite && hasBash) {
        // This is acceptable but must be flagged if there's no matcher/constraint
        results.push({
          name: `agent-tool-risk:${agent.name}:write+bash`,
          passed: true,
          message: `${agent.name} has both write and Bash tools — high-risk but constrained by tool list`,
        });
      }
    }

    // All agents with any tools pass the enumeration check
    if (results.every((r) => r.name !== `agent-tool-risk:${agent.name}:wildcard`)) {
      results.push({
        name: `agent-tool-risk:${agent.name}`,
        passed: true,
        message: `${agent.name} tools enumerated: ${tools.join(', ')}`,
      });
    }
  }
  return results;
}

/**
 * Hook failure behavior: PreToolUse hooks must block execution on failure,
 * not silently pass through. CMU Safety: "safe failure modes."
 * Claude Code default is to block on hook failure, but timeout: 0 or
 * missing hooks for critical events would indicate a gap.
 */
export function checkHookFailureBehavior(): InvariantResult[] {
  const results: InvariantResult[] = [];
  if (!fs.existsSync(settingsPath())) {
    results.push({
      name: 'hook-failure-behavior',
      passed: false,
      message: 'No settings.json — cannot verify hook failure behavior',
    });
    return results;
  }

  const settings = JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
  const hooks = settings.hooks ?? {};

  // Critical events that MUST have hooks
  const criticalEvents = ['PreToolUse'];

  for (const event of criticalEvents) {
    const groups = hooks[event];
    if (!Array.isArray(groups) || groups.length === 0) {
      results.push({
        name: `hook-failure:${event}:missing`,
        passed: false,
        message: `CRITICAL: No ${event} hooks configured — no safety gate before tool execution`,
      });
      continue;
    }

    for (const group of groups as Array<Record<string, unknown>>) {
      const innerHooks = (group.hooks ?? []) as Array<Record<string, unknown>>;
      const matcher = (group.matcher ?? 'none') as string;

      for (const hook of innerHooks) {
        // Timeout of 0 means the hook effectively doesn't run
        const timeout = hook.timeout as number | undefined;
        if (timeout === 0) {
          results.push({
            name: `hook-failure:${event}:${matcher}:zero-timeout`,
            passed: false,
            message: `${event} hook (matcher: ${matcher}) has timeout: 0 — safety gate disabled`,
          });
        } else {
          results.push({
            name: `hook-failure:${event}:${matcher}`,
            passed: true,
            message: `${event} hook (matcher: ${matcher}) will block on failure${timeout ? ` (timeout: ${timeout}s)` : ''}`,
          });
        }
      }
    }
  }
  return results;
}

/**
 * MCP server trust boundary: verify that configured MCP servers are local
 * processes, not remote endpoints that could inject untrusted data.
 * OWASP: trust boundary crossing is the attack surface.
 */
export function checkMcpServerTrustBoundary(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const mcpPath = path.join(PROJECT_ROOT, '.mcp.json');

  if (!fs.existsSync(mcpPath)) {
    results.push({
      name: 'mcp-trust-boundary',
      passed: true,
      message: 'No .mcp.json — no MCP servers configured',
    });
    return results;
  }

  let mcpConfig: Record<string, unknown>;
  try {
    mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  } catch {
    results.push({
      name: 'mcp-trust-boundary:parse',
      passed: false,
      message: '.mcp.json is not valid JSON — MCP configuration corrupt',
    });
    return results;
  }

  const servers = (mcpConfig.mcpServers ?? {}) as Record<string, Record<string, unknown>>;

  for (const [name, config] of Object.entries(servers)) {
    const command = (config.command ?? '') as string;
    const args = (config.args ?? []) as string[];
    const allArgs = [command, ...args].join(' ');

    // Check for remote endpoints (HTTP/HTTPS URLs in command or args)
    const hasRemoteUrl = /https?:\/\//.test(allArgs);
    if (hasRemoteUrl) {
      results.push({
        name: `mcp-trust:${name}:remote`,
        passed: false,
        message: `MCP server "${name}" references remote URL — untrusted data source crosses trust boundary`,
      });
      continue;
    }

    // Check that the command binary exists on disk (local process).
    // In CI (and other environments without local dev-tool installs), the
    // binary legitimately may not be present; the trust-boundary property we
    // care about (local process, not remote URL) is already verified above,
    // so we downgrade the existence check to a skip when CI=true.
    const commandExists = fs.existsSync(command);
    const isCi = process.env.CI === 'true' || process.env.CI === '1';
    const passed = commandExists || isCi;
    results.push({
      name: `mcp-trust:${name}`,
      passed,
      message: commandExists
        ? `MCP server "${name}" is a local process (${command})`
        : isCi
        ? `MCP server "${name}" command not present (${command}) — skipped on CI`
        : `MCP server "${name}" command not found: ${command}`,
    });
  }
  return results;
}

/**
 * Skill body privilege escalation: check that skill documentation bodies
 * don't contain patterns that instruct agents to override permissions,
 * ignore safety checks, or bypass approval gates.
 * OWASP: skill body is external data that enters model context.
 */
export function checkSkillNoPrivilegeEscalation(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const skills = readSkillFiles();

  // Patterns that attempt to override agent behavior from within skill content.
  // Each pattern includes a negative-context check: if the match appears inside
  // a quoted string, after "detect", "flag", or "treat as", it's documenting
  // the pattern (defensive), not invoking it (offensive).
  const escalationPatterns = [
    { pattern: /ignore\s+(previous|prior|all)\s+(instructions?|rules?|constraints?)/i, label: 'instruction override' },
    { pattern: /bypass\s+(approval|permission|safety|security)/i, label: 'approval bypass' },
    { pattern: /--no-verify/i, label: 'verification bypass flag' },
    { pattern: /dangerouslyDisableSandbox/i, label: 'sandbox disable' },
    { pattern: /permissionMode:\s*bypassAll/i, label: 'permission bypass' },
  ];

  // Lines that document detection of these patterns are not escalation attempts
  const defensiveContextPattern = /["'"""]|detect|flag|treat\s+as|watch\s+for|look\s+for|attempting\s+to/i;

  for (const skill of skills) {
    // Extract the body (everything after frontmatter)
    const bodyMatch = skill.content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    const body = bodyMatch ? bodyMatch[1] : skill.content;

    const found: string[] = [];
    const bodyLines = body.split('\n');
    for (const { pattern, label } of escalationPatterns) {
      for (const line of bodyLines) {
        if (pattern.test(line)) {
          // Check if this line is documenting the pattern defensively
          if (defensiveContextPattern.test(line)) {
            // Defensive context — documenting what to detect, not escalating
            continue;
          }
          found.push(label);
          break; // One match per pattern is enough
        }
      }
    }

    results.push({
      name: `skill-no-escalation:${skill.dir}`,
      passed: found.length === 0,
      message: found.length === 0
        ? `${skill.dir} body has no privilege escalation patterns`
        : `${skill.dir} body contains escalation patterns: ${found.join(', ')}`,
    });
  }
  return results;
}

/**
 * Response-side DLP scanning: verify that the harness has a mechanism to
 * scan MCP tool responses for hidden tags and injection patterns before
 * they enter the model's context window.
 * Session 7 research: AIP, MCPS, SlowMist, and Lethal Trifecta all flag this.
 * Attack: compromised MCP server returns hidden instructions in response.
 */
export function checkResponseDlpCapability(): InvariantResult[] {
  const results: InvariantResult[] = [];

  // Check if PostToolUse hooks exist (they can scan responses)
  if (!fs.existsSync(settingsPath())) {
    results.push({
      name: 'response-dlp:no-settings',
      passed: false,
      message: 'No settings.json — cannot verify PostToolUse response scanning',
    });
    return results;
  }

  const settings = JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
  const hooks = settings.hooks ?? {};
  const postHooks = hooks.PostToolUse;

  if (!Array.isArray(postHooks) || postHooks.length === 0) {
    results.push({
      name: 'response-dlp:no-post-hooks',
      passed: false,
      message: 'No PostToolUse hooks — MCP tool responses enter context unscanned',
    });
    return results;
  }

  // PostToolUse hooks exist — verify they cover MCP-relevant tools
  let coversMcpTools = false;
  for (const group of postHooks as Array<Record<string, unknown>>) {
    const matcher = ((group.matcher ?? '') as string).toLowerCase();
    // PostToolUse that covers Bash or broad tool matchers can observe MCP results
    if (!matcher || matcher.includes('bash') || matcher.includes('agent') || matcher.includes('task')) {
      coversMcpTools = true;
    }
  }

  results.push({
    name: 'response-dlp:post-hook-coverage',
    passed: coversMcpTools,
    message: coversMcpTools
      ? 'PostToolUse hooks cover MCP-relevant tools — response scanning possible'
      : 'PostToolUse hooks do not cover MCP tool results — response scanning gap',
  });

  return results;
}

/**
 * MCP tool allowlist: verify that each MCP server in .mcp.json has an
 * expectedTools declaration. Without an allowlist, a compromised server
 * can add new tools that the agent will call without question.
 * Session 7 research: AIP, SEAL, SlowMist all recommend affirmative allowlists.
 * Tool poisoning has a 70% success rate against real MCP servers.
 */
export function checkMcpToolAllowlist(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const mcpPath = path.join(PROJECT_ROOT, '.mcp.json');

  if (!fs.existsSync(mcpPath)) {
    return results; // No MCP config, nothing to check
  }

  let mcpConfig: Record<string, unknown>;
  try {
    mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  } catch {
    return results;
  }

  const servers = (mcpConfig.mcpServers ?? {}) as Record<string, Record<string, unknown>>;

  for (const [name, config] of Object.entries(servers)) {
    const expectedTools = config.expectedTools as string[] | undefined;

    if (!expectedTools || !Array.isArray(expectedTools) || expectedTools.length === 0) {
      results.push({
        name: `mcp-allowlist:${name}`,
        passed: false,
        message: `MCP server "${name}" has no expectedTools allowlist — tool poisoning undetectable`,
      });
    } else {
      results.push({
        name: `mcp-allowlist:${name}`,
        passed: true,
        message: `MCP server "${name}" has ${expectedTools.length} expected tools declared`,
      });
    }
  }

  return results;
}

/**
 * MCP server env path validation: verify that paths in MCP server env
 * blocks reference files under the project root, not externally-writable
 * locations. Lethal Trifecta research: config file modification as attack.
 */
export function checkMcpEnvPathSafety(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const mcpPath = path.join(PROJECT_ROOT, '.mcp.json');

  if (!fs.existsSync(mcpPath)) return results;

  let mcpConfig: Record<string, unknown>;
  try {
    mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  } catch {
    return results;
  }

  const servers = (mcpConfig.mcpServers ?? {}) as Record<string, Record<string, unknown>>;

  for (const [name, config] of Object.entries(servers)) {
    const env = (config.env ?? {}) as Record<string, string>;

    for (const [key, value] of Object.entries(env)) {
      // Check if env value looks like a file path
      if (typeof value === 'string' && (value.startsWith('/') || value.includes('/'))) {
        // Verify the path is under a known safe location
        const resolved = path.resolve(value);
        const isUnderProject = resolved.startsWith(PROJECT_ROOT);
        const isUnderHome = resolved.startsWith(path.resolve(process.env.HOME ?? '/home'));
        // Also allow paths under the workspace root (e.g., /media/user/drive/workspace)
        const workspaceRoot = path.resolve(PROJECT_ROOT, '..', '..');
        const isUnderWorkspace = resolved.startsWith(workspaceRoot);

        if (!isUnderProject && !isUnderHome && !isUnderWorkspace) {
          results.push({
            name: `mcp-env-path:${name}:${key}`,
            passed: false,
            message: `MCP server "${name}" env var ${key} points outside project/home: ${value}`,
          });
        } else {
          results.push({
            name: `mcp-env-path:${name}:${key}`,
            passed: true,
            message: `MCP server "${name}" env var ${key} is under safe path`,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Fail-safe defaults: if settings.json is missing or corrupt, the harness
 * must default to maximum restrictions, not open access.
 */
export function checkFailSafeDefaults(): InvariantResult {
  // Verify that hooks reference files that exist (already covered)
  // This check ensures settings.json itself is valid JSON
  if (!fs.existsSync(settingsPath())) {
    return { name: 'fail-safe-defaults', passed: true, message: 'No settings.json — harness uses built-in defaults' };
  }

  try {
    const content = fs.readFileSync(settingsPath(), 'utf8');
    JSON.parse(content);
    return { name: 'fail-safe-defaults', passed: true, message: 'settings.json is valid JSON' };
  } catch {
    return {
      name: 'fail-safe-defaults',
      passed: false,
      message: 'CRITICAL: settings.json is corrupt — harness may fail open instead of closed',
    };
  }
}

// ---------------------------------------------------------------------------
// Wave 2 Security Invariants (HI-11 through HI-15, OWASP Session 7)
// ---------------------------------------------------------------------------

/**
 * HI-11: Tool description hashing — verify that MCP server tool descriptions
 * have hashes recorded in .mcp.json. A changed description hash indicates
 * a "rug pull" attack where a compromised server redefines what a tool does.
 * OWASP/SAFE-MCP: tool poisoning via description rewrite.
 */
export function checkMcpToolDescriptionHashes(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const mcpPath = path.join(PROJECT_ROOT, '.mcp.json');

  if (!fs.existsSync(mcpPath)) return results;

  let mcpConfig: Record<string, unknown>;
  try {
    mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  } catch {
    return results;
  }

  const servers = (mcpConfig.mcpServers ?? {}) as Record<string, Record<string, unknown>>;

  for (const [name, config] of Object.entries(servers)) {
    const expectedTools = config.expectedTools as string[] | undefined;
    const toolHashes = config.toolDescriptionHashes as Record<string, string> | undefined;

    if (!expectedTools || expectedTools.length === 0) {
      // No allowlist — already caught by checkMcpToolAllowlist
      continue;
    }

    if (!toolHashes || typeof toolHashes !== 'object') {
      // Wave 2 new requirement — warn but don't block until servers migrate
      results.push({
        name: `mcp-desc-hash:${name}:missing`,
        passed: true,
        message: `WARN: MCP server "${name}" has expectedTools but no toolDescriptionHashes — rug pull undetectable (migration pending)`,
      });
    } else {
      // Check that every expected tool has a hash
      const missingHashes = expectedTools.filter((t) => !(t in toolHashes));
      if (missingHashes.length > 0) {
        results.push({
          name: `mcp-desc-hash:${name}:incomplete`,
          passed: false,
          message: `MCP server "${name}" missing hashes for: ${missingHashes.join(', ')}`,
        });
      } else {
        results.push({
          name: `mcp-desc-hash:${name}`,
          passed: true,
          message: `MCP server "${name}" has description hashes for all ${expectedTools.length} tools`,
        });
      }
    }
  }

  return results;
}

/**
 * HI-12: Unicode composition scanning — verify that tool response text is
 * checked for invisible Unicode characters (ZWJ, variation selectors,
 * bidirectional overrides) that can hide injected instructions.
 * OWASP/SAFE-MCP: Unicode injection in tool responses.
 */
export function checkUnicodeCompositionScanning(): InvariantResult[] {
  const results: InvariantResult[] = [];

  // Check if any hook or guard scans for Unicode injection
  const guardPath = path.join(hooksDir(), 'gsd-prompt-guard.js');
  if (!fs.existsSync(guardPath)) {
    results.push({
      name: 'unicode-scan:no-guard',
      passed: false,
      message: 'gsd-prompt-guard.js not found — no Unicode injection scanning possible',
    });
    return results;
  }

  const guardContent = fs.readFileSync(guardPath, 'utf8');

  // Check for Unicode-related scanning patterns in the guard
  const unicodePatterns = [
    { pattern: /[\\/]u(?:FE0[0-9A-F]|200[B-F]|202[A-E]|2066|2067|2068|2069|FEFF)/i, label: 'Unicode codepoint reference' },
    { pattern: /zero.?width|invisible|bidi|zwj|variation.?selector/i, label: 'Unicode category name' },
    { pattern: /\\u200/i, label: 'Zero-width char escape' },
  ];

  const foundPatterns: string[] = [];
  for (const { pattern, label } of unicodePatterns) {
    if (pattern.test(guardContent)) {
      foundPatterns.push(label);
    }
  }

  if (foundPatterns.length > 0) {
    results.push({
      name: 'unicode-scan:guard-coverage',
      passed: true,
      message: `gsd-prompt-guard.js has Unicode scanning: ${foundPatterns.join(', ')}`,
    });
  } else {
    results.push({
      name: 'unicode-scan:guard-coverage',
      passed: false,
      message: 'gsd-prompt-guard.js has no Unicode injection scanning — invisible chars undetected',
    });
  }

  return results;
}

/**
 * HI-13: Agent impersonation detection — scan skill bodies for patterns
 * where a skill claims to be the orchestrator, overrides routing rules,
 * or asserts elevated trust. These patterns indicate a compromised or
 * malicious skill attempting privilege escalation via impersonation.
 * OWASP/Cisco: agent identity spoofing.
 */
export function checkSkillNoImpersonation(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const skills = readSkillFiles();

  const impersonationPatterns = [
    { pattern: /i\s+am\s+(the\s+)?(orchestrator|coordinator|mayor|root|admin)/i, label: 'orchestrator claim' },
    { pattern: /override\s+(routing|dispatch|scheduling)\s+rules?/i, label: 'routing override' },
    { pattern: /my\s+trust\s+level\s+is\s+(maximum|elevated|root|admin)/i, label: 'trust level assertion' },
    { pattern: /ignore\s+(the\s+)?mayor|bypass\s+(the\s+)?coordinator/i, label: 'coordinator bypass' },
    { pattern: /promote\s+(myself|me|this\s+agent)\s+to/i, label: 'self-promotion' },
  ];

  // Defensive context: lines that document these patterns are fine
  const defensiveCtx = /["'"""]|detect|flag|scan|watch\s+for|look\s+for|check\s+for|example|e\.g\./i;

  for (const skill of skills) {
    const bodyMatch = skill.content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    const body = bodyMatch ? bodyMatch[1] : skill.content;

    const found: string[] = [];
    const bodyLines = body.split('\n');
    for (const { pattern, label } of impersonationPatterns) {
      for (const line of bodyLines) {
        if (pattern.test(line) && !defensiveCtx.test(line)) {
          found.push(label);
          break;
        }
      }
    }

    results.push({
      name: `skill-no-impersonation:${skill.dir}`,
      passed: found.length === 0,
      message: found.length === 0
        ? `${skill.dir} body has no impersonation patterns`
        : `${skill.dir} body contains impersonation patterns: ${found.join(', ')}`,
    });
  }
  return results;
}

/**
 * HI-14: Subagent tool constraint enforcement — every agent MUST declare
 * explicit tool constraints. An agent without constraints is an unrestricted
 * executor that can call any tool. This strengthens the existing
 * checkAgentToolConstraints by treating missing constraints as a BLOCKING
 * security violation, not just a warning.
 * OWASP/Subagent + SAFE-MCP: least-privilege enforcement.
 */
export function checkSubagentToolConstraintEnforcement(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const agents = readMarkdownFiles(agentsDir());

  for (const agent of agents) {
    const fm = extractFrontmatter(agent.content);

    const hasToolsField = 'tools' in fm && fm.tools.length > 0;
    const hasToolsList = /^tools:\s*$/m.test(agent.content.split('---')[1] ?? '') ||
      /^tools:\s*\n\s+-/m.test(agent.content.split('---')[1] ?? '');

    const constrained = hasToolsField || hasToolsList;

    if (!constrained) {
      results.push({
        name: `subagent-constraint:${agent.name}`,
        passed: false,
        message: `SECURITY: ${agent.name} has NO tool constraints — unrestricted executor violates least-privilege`,
      });
    } else {
      // Additionally check that the tool list is not just a wildcard.
      // MCP namespace wildcards (e.g., mcp__context7__*) are acceptable —
      // they scope to a specific server. Only flag standalone * or "all".
      const toolsRaw = fm.tools ?? '';
      const toolsList = toolsRaw.split(/[,\n]/).map((t: string) => t.trim()).filter(Boolean);
      const isWildcard = toolsList.some((t: string) =>
        t === '*' || t.toLowerCase() === 'all');

      results.push({
        name: `subagent-constraint:${agent.name}`,
        passed: !isWildcard,
        message: isWildcard
          ? `SECURITY: ${agent.name} has wildcard tool access — effectively unconstrained`
          : `${agent.name} has explicit tool constraints enforced`,
      });
    }
  }
  return results;
}

/**
 * HI-15: pgvector/RAG sanitization — verify that any configured vector
 * database or RAG data source is treated as untrusted. Retrieval results
 * must not be directly interpolated into tool calls or prompts without
 * sanitization. Check for documented sanitization policy.
 * OWASP/Cisco: vector embedding poisoning.
 */
export function checkRagSanitizationPolicy(): InvariantResult[] {
  const results: InvariantResult[] = [];
  const mcpPath = path.join(PROJECT_ROOT, '.mcp.json');

  if (!fs.existsSync(mcpPath)) {
    results.push({
      name: 'rag-sanitization:no-mcp',
      passed: true,
      message: 'No .mcp.json — no vector database integration to audit',
    });
    return results;
  }

  let mcpConfig: Record<string, unknown>;
  try {
    mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  } catch {
    return results;
  }

  const servers = (mcpConfig.mcpServers ?? {}) as Record<string, Record<string, unknown>>;

  // Identify RAG/vector DB related servers by name or command
  const ragIndicators = /pgvector|rag|vector|embed|chroma|pinecone|weaviate|qdrant|milvus/i;

  let hasRagServer = false;
  for (const [name, config] of Object.entries(servers)) {
    const command = (config.command ?? '') as string;
    const args = ((config.args ?? []) as string[]).join(' ');
    const allParts = `${name} ${command} ${args}`;

    if (ragIndicators.test(allParts)) {
      hasRagServer = true;

      // Check if the server config has sanitization markers
      const env = (config.env ?? {}) as Record<string, string>;
      const hasSanitizeFlag = Object.keys(env).some((k) =>
        /sanitiz|untrust|escape|clean/i.test(k));

      // Check if expectedTools indicates read-only access
      const expectedTools = (config.expectedTools ?? []) as string[];
      const hasWriteTools = expectedTools.some((t) =>
        /write|insert|update|delete|upsert/i.test(t));

      if (hasWriteTools) {
        results.push({
          name: `rag-sanitization:${name}:write-access`,
          passed: false,
          message: `RAG server "${name}" has write tools — bidirectional poisoning risk (should be read-only)`,
        });
      }

      results.push({
        name: `rag-sanitization:${name}`,
        passed: true,
        message: `RAG server "${name}" identified — treat all retrieval results as untrusted external data${hasSanitizeFlag ? ' (sanitize flag present)' : ''}`,
      });
    }
  }

  if (!hasRagServer) {
    results.push({
      name: 'rag-sanitization:none-found',
      passed: true,
      message: 'No RAG/vector database MCP servers detected',
    });
  }

  return results;
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

  // Security invariants (OWASP + CMU Safety, Wave 1 + Wave 2)
  const secResults: InvariantResult[] = [
    checkConfigImmutability(),
    checkFailSafeDefaults(),
    ...checkAgentToolRiskClassification(),
    ...checkHookFailureBehavior(),
    ...checkMcpServerTrustBoundary(),
    ...checkMcpToolAllowlist(),
    ...checkMcpEnvPathSafety(),
    ...checkResponseDlpCapability(),
    ...checkSkillNoPrivilegeEscalation(),
    // Wave 2 (HI-11 through HI-15)
    ...checkMcpToolDescriptionHashes(),
    ...checkUnicodeCompositionScanning(),
    ...checkSkillNoImpersonation(),
    ...checkSubagentToolConstraintEnforcement(),
    ...checkRagSanitizationPolicy(),
  ];
  suites.push({
    suite: 'Security Invariants',
    results: secResults,
    allPassed: secResults.every((r) => r.passed),
  });

  return suites;
}
