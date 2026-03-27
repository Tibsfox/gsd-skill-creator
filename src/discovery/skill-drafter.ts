/**
 * SKILL.md draft generation from ranked pattern candidates.
 *
 * Converts RankedCandidate objects into complete, substantive SKILL.md content
 * with pre-filled workflow steps (not placeholder TODOs). Uses template
 * strategies per pattern type: tool bigram/trigram get numbered workflow steps,
 * bash patterns get category guidelines and common commands.
 *
 * Generated content includes valid YAML frontmatter (name + description),
 * workflow steps with tool descriptions, "When to Use" context, and pattern
 * evidence metadata (project/session counts, date range).
 */

import { parsePatternKey } from './pattern-scorer.js';
import type { RankedCandidate, ParsedPatternKey } from './pattern-scorer.js';
import { injectGsdReferences } from '../detection/gsd-reference-injector.js';
import { sanitizeGeneratedContent } from '../validation/generation-safety.js';

// ============================================================================
// Exported constants
// ============================================================================

/** Descriptions for each standard Claude Code tool used in workflow steps */
export const TOOL_DESCRIPTIONS: Record<string, string> = {
  Read: 'Read file contents to understand code structure and existing patterns',
  Edit: 'Edit file with targeted string replacements for precise modifications',
  Write: 'Write new file contents when creating files from scratch',
  Bash: 'Execute shell commands for builds, tests, and system operations',
  Glob: 'Find files by pattern to locate relevant source files',
  Grep: 'Search file contents to find specific code patterns and references',
  WebSearch: 'Search the web for documentation, solutions, and current information',
  WebFetch: 'Fetch URL content for API docs, references, and web resources',
  NotebookEdit: 'Edit Jupyter notebook cells for data analysis and scientific computing',
  Skill: 'Invoke a skill for specialized domain-specific workflows',
  TaskCreate: 'Create a task to track work items and progress',
  TaskUpdate: 'Update a task status or details as work progresses',
  TaskList: 'List tasks to see current work items and their status',
  TaskGet: 'Get task details for full context on a specific work item',
};

/** Descriptions for each BashCategory used in bash pattern drafts */
export const BASH_DESCRIPTIONS: Record<string, string> = {
  'git-workflow': 'Git version control operations (staging, committing, branching, merging)',
  'test-command': 'Running test suites and verifying code correctness',
  'build-command': 'Building and compiling projects, running type checks',
  'package-management': 'Managing package dependencies (install, update, remove)',
  'file-operation': 'File system operations (create, copy, move, delete files)',
  'search': 'Searching files and content across the codebase',
  'scripted': 'Inline scripting operations for quick data processing',
  'other': 'General shell commands and system utilities',
};

// ============================================================================
// Internal constants
// ============================================================================

/** Category-specific guidelines for bash pattern drafts */
const BASH_GUIDELINES: Record<string, string[]> = {
  'git-workflow': [
    'Stage files individually rather than using git add -A to avoid committing unintended files',
    'Write descriptive commit messages that explain the "why" not just the "what"',
    'Check git status before committing to verify staged changes are correct',
    'Use feature branches for non-trivial changes to keep main clean',
  ],
  'test-command': [
    'Run the full test suite before committing to catch regressions',
    'Use focused test runs during development for faster feedback loops',
    'Check test output for warnings even when tests pass',
    'Run tests with coverage when validating completeness of new features',
  ],
  'build-command': [
    'Run type checks before integration to catch type errors early',
    'Use incremental builds during development for faster iteration',
    'Verify build output matches expected artifacts before deployment',
    'Check for build warnings that may indicate future breaking changes',
  ],
  'package-management': [
    'Pin dependency versions in lock files for reproducible builds',
    'Audit packages for security vulnerabilities after installation',
    'Remove unused dependencies to reduce bundle size and attack surface',
    'Check for breaking changes in changelogs before major version upgrades',
  ],
  'file-operation': [
    'Verify target paths exist before moving or copying files',
    'Use recursive flags carefully to avoid unintended directory operations',
    'Check file permissions after creation to ensure correct access levels',
    'Prefer atomic operations (write to temp, then rename) for critical files',
  ],
  'search': [
    'Use file type filters to narrow search scope for faster results',
    'Combine glob patterns with content search for precise file discovery',
    'Use case-insensitive search when the exact casing is uncertain',
    'Search from project root to avoid missing files in subdirectories',
  ],
  'scripted': [
    'Keep inline scripts short and focused on a single transformation',
    'Prefer dedicated script files for complex multi-step operations',
    'Use error handling in scripts to fail fast on unexpected input',
    'Log intermediate results when debugging data processing pipelines',
  ],
  'other': [
    'Document unusual shell commands with inline comments for clarity',
    'Use absolute paths when the working directory may be ambiguous',
    'Check command availability before running platform-specific utilities',
    'Prefer standard POSIX commands for cross-platform compatibility',
  ],
};

/** Common commands per bash category */
const BASH_COMMON_COMMANDS: Record<string, string[]> = {
  'git-workflow': [
    '`git status` - Check working tree state',
    '`git add <file>` - Stage specific files',
    '`git commit -m "message"` - Commit staged changes',
    '`git diff` - View unstaged changes',
    '`git log --oneline` - View recent commit history',
  ],
  'test-command': [
    '`npx vitest run` - Run test suite',
    '`npx jest --watch` - Run tests in watch mode',
    '`pytest` - Run Python test suite',
    '`npm test` - Run project test script',
  ],
  'build-command': [
    '`npx tsc --noEmit` - Type check without emitting',
    '`npm run build` - Run project build script',
    '`npx esbuild` - Bundle with esbuild',
  ],
  'package-management': [
    '`npm install <package>` - Add a dependency',
    '`npm install -D <package>` - Add a dev dependency',
    '`npm uninstall <package>` - Remove a dependency',
    '`npm ls` - List installed packages',
  ],
  'file-operation': [
    '`mkdir -p <dir>` - Create directory with parents',
    '`cp -r <src> <dst>` - Copy recursively',
    '`mv <src> <dst>` - Move or rename files',
    '`rm -rf <dir>` - Remove directory recursively',
  ],
  'search': [
    '`find . -name "*.ts"` - Find files by name pattern',
    '`grep -r "pattern" .` - Search file contents recursively',
    '`rg "pattern"` - Ripgrep search (faster)',
  ],
  'scripted': [
    '`node -e "console.log(...)"` - Quick Node.js evaluation',
    '`python3 -c "print(...)"` - Quick Python evaluation',
  ],
  'other': [
    '`echo $VAR` - Print environment variable',
    '`which <cmd>` - Find command location',
    '`env` - Print environment variables',
  ],
};

// ============================================================================
// generateSkillDraft
// ============================================================================

/**
 * Generate a complete SKILL.md draft from a ranked candidate.
 *
 * Returns an object with the suggested skill name and the full markdown
 * content including YAML frontmatter, workflow steps, usage guidance,
 * and pattern evidence metadata.
 */
export function generateSkillDraft(
  candidate: RankedCandidate,
  gsdInstalled = false,
): { name: string; content: string } {
  const parsed = parsePatternKey(candidate.patternKey);

  // Build frontmatter manually (no gray-matter dependency needed)
  const frontmatter =
    '---\n' +
    `name: ${candidate.suggestedName}\n` +
    `description: ${candidate.suggestedDescription}\n` +
    '---\n\n';

  // Generate body based on pattern type
  let body = parsed.type === 'bash-pattern'
    ? generateBashPatternBody(candidate, parsed)
    : generateToolPatternBody(candidate, parsed);

  // QOL-04: Inject GSD command references if applicable
  body = injectGsdReferences(body, candidate.suggestedDescription, gsdInstalled);

  // SEC-05: Sanitize generated content to block dangerous commands
  const { sanitized, findings } = sanitizeGeneratedContent(body);
  body = sanitized;
  if (findings.length > 0) {
    body += `\n<!-- Safety: ${findings.length} dangerous command(s) blocked during generation -->\n`;
  }

  return {
    name: candidate.suggestedName,
    content: frontmatter + body,
  };
}

// ============================================================================
// Tool pattern body generation
// ============================================================================

/**
 * Generate the markdown body for a tool bigram or trigram pattern draft.
 *
 * Includes numbered workflow steps with descriptions from TOOL_DESCRIPTIONS,
 * a "When to Use" section, and pattern evidence metadata.
 */
function generateToolPatternBody(candidate: RankedCandidate, parsed: ParsedPatternKey): string {
  const tools = parsed.tools!;
  const title = `# ${tools.join(' -> ')} Workflow\n\n`;

  // Workflow section with numbered steps
  let workflow = '## Workflow\n\n';
  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    const desc = TOOL_DESCRIPTIONS[tool] ?? `Use the ${tool} tool`;
    workflow += `${i + 1}. **${tool}** - ${desc}\n`;
  }
  workflow += '\n';

  // When to Use section
  const whenToUse =
    '## When to Use\n\n' +
    `This workflow is effective when you need to ${candidate.suggestedDescription.toLowerCase()}. ` +
    `It was observed across ${candidate.evidence.projects.length} project(s) ` +
    `in ${candidate.evidence.sessions.length} session(s), ` +
    'indicating a consistent pattern in your development process.\n\n';

  // Pattern Evidence section
  const evidence = generateEvidenceSection(candidate);

  // Footer
  const footer = '---\n\n' +
    '*This skill draft was generated from observed usage patterns. ' +
    'Review and customize the workflow steps to match your specific needs.*\n';

  return title + workflow + whenToUse + evidence + footer;
}

// ============================================================================
// Bash pattern body generation
// ============================================================================

/**
 * Generate the markdown body for a bash pattern draft.
 *
 * Includes category description, common commands, numbered guidelines,
 * and pattern evidence metadata.
 */
function generateBashPatternBody(candidate: RankedCandidate, parsed: ParsedPatternKey): string {
  const category = parsed.category!;
  const categoryTitle = category
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const title = `# ${categoryTitle} Patterns\n\n`;

  // Workflow section (brief description)
  const desc = BASH_DESCRIPTIONS[category] ?? 'Shell command patterns';
  const workflow = '## Workflow\n\n' +
    `${desc}. These patterns were extracted from your recurring shell usage ` +
    `across ${candidate.evidence.projects.length} project(s).\n\n`;

  // Common Commands section
  const commands = BASH_COMMON_COMMANDS[category] ?? [];
  let commandsSection = '## Common Commands\n\n';
  for (const cmd of commands) {
    commandsSection += `- ${cmd}\n`;
  }
  commandsSection += '\n';

  // Guidelines section
  const guidelines = BASH_GUIDELINES[category] ?? [];
  let guidelinesSection = '## Guidelines\n\n';
  for (let i = 0; i < guidelines.length; i++) {
    guidelinesSection += `${i + 1}. ${guidelines[i]}\n`;
  }
  guidelinesSection += '\n';

  // Pattern Evidence section
  const evidence = generateEvidenceSection(candidate);

  // Footer
  const footer = '---\n\n' +
    '*This skill draft was generated from observed usage patterns. ' +
    'Review and customize the guidelines to match your specific needs.*\n';

  return title + workflow + commandsSection + guidelinesSection + evidence + footer;
}

// ============================================================================
// Shared evidence section
// ============================================================================

/**
 * Generate the Pattern Evidence section shared by all draft types.
 */
function generateEvidenceSection(candidate: RankedCandidate): string {
  const { evidence, score, scoreBreakdown } = candidate;

  return '## Pattern Evidence\n\n' +
    `| Metric | Value |\n` +
    `| --- | --- |\n` +
    `| Projects | ${evidence.projects.length} |\n` +
    `| Sessions | ${evidence.sessions.length} |\n` +
    `| Total occurrences | ${evidence.totalOccurrences} |\n` +
    `| First seen | ${evidence.firstSeen} |\n` +
    `| Last seen | ${evidence.lastSeen} |\n` +
    `| Confidence score | ${score.toFixed(2)} |\n\n`;
}
