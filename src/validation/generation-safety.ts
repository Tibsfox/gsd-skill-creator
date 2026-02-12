/**
 * Generation safety functions for the skill creation pipeline.
 *
 * Prevents generated skills from:
 * - Containing dangerous bash commands (deny list with pattern matching)
 * - Having overly permissive tool access (allowed-tools inference)
 * - Embedding complex scripts inline (script wrapping with shebangs)
 *
 * Implements: SEC-05 (dangerous command deny list), SEC-06 (script extraction),
 * SEC-07 (allowed-tools restrictions).
 */

// ============================================================================
// Dangerous Command Detection
// ============================================================================

/** A dangerous command pattern with name and description. */
export interface DangerousCommandPattern {
  pattern: RegExp;
  name: string;
  description: string;
}

/** Result of scanning content for dangerous commands. */
export interface DangerousFinding {
  name: string;
  match: string;
  line: number;
  description: string;
}

/**
 * Deny list of dangerous bash command patterns.
 *
 * Patterns are precise to avoid false positives on safe commands.
 * For example, `rm -rf node_modules` and `rm -rf ./dist` are safe
 * and common; only `rm -rf /`, `rm -rf ~`, `rm -rf *`, and
 * `rm -rf $HOME` are flagged.
 */
export const DANGEROUS_COMMANDS: DangerousCommandPattern[] = [
  {
    name: 'recursive-delete',
    pattern: /rm\s+(?:-[a-zA-Z]*)?r[a-zA-Z]*\s+(?:-[a-zA-Z]*\s+)?[\/~*]|rm\s+(?:-[a-zA-Z]*)?r[a-zA-Z]*\s+\$HOME/,
    description: 'Recursive delete of root, home, or wildcard paths',
  },
  {
    name: 'recursive-delete-rf',
    pattern: /rm\s+-rf\s+[\/~*]|rm\s+-rf\s+\$HOME/,
    description: 'Forced recursive delete of root, home, or wildcard paths',
  },
  {
    name: 'piped-download',
    pattern: /(?:curl|wget)\s+[^|]*\|\s*(?:ba)?sh/,
    description: 'Download piped directly to shell execution',
  },
  {
    name: 'sudo-usage',
    pattern: /\bsudo\s+/,
    description: 'Elevated privilege command execution',
  },
  {
    name: 'credential-manipulation',
    pattern: /chmod\s+777|\.ssh\/|\/etc\/passwd|\/etc\/shadow/,
    description: 'Modification of credentials, SSH keys, or system auth files',
  },
  {
    name: 'disk-destroy',
    pattern: /\bdd\s+if=/,
    description: 'Low-level disk write that can destroy data',
  },
  {
    name: 'mkfs',
    pattern: /\bmkfs\s+/,
    description: 'Filesystem format that destroys all data on target',
  },
  {
    name: 'fork-bomb',
    pattern: /:\(\)\s*\{.*\|.*&\s*\}\s*;/,
    description: 'Fork bomb that exhausts system resources',
  },
  {
    name: 'env-destroy',
    pattern: /\bunset\s+PATH\b/,
    description: 'Unsetting PATH renders the shell unusable',
  },
  {
    name: 'env-overwrite',
    pattern: /\bexport\s+PATH\s*=/,
    description: 'Overwriting PATH can break all command resolution',
  },
  {
    name: 'wget-pipe',
    pattern: /wget\s+.*-O\s*-\s*\|\s*(?:ba)?sh/,
    description: 'Download piped to shell via wget -O-',
  },
];

/**
 * Scan content for dangerous bash commands.
 *
 * Splits content by newlines and tests each line against all
 * DANGEROUS_COMMANDS patterns. Returns findings with match details.
 */
export function scanForDangerousCommands(content: string): DangerousFinding[] {
  const findings: DangerousFinding[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { pattern, name, description } of DANGEROUS_COMMANDS) {
      // Reset lastIndex for reused regexes
      pattern.lastIndex = 0;
      const match = pattern.exec(line);
      if (match) {
        findings.push({
          name,
          match: match[0],
          line: i + 1, // 1-based line numbers
          description,
        });
      }
    }
  }

  return findings;
}

// ============================================================================
// Allowed Tools Inference
// ============================================================================

/** Candidate shape for allowed-tools inference. */
export interface ToolInferenceCandidate {
  type: string;
  pattern: string;
  suggestedDescription: string;
}

/** Known Claude Code tool names for validation. */
const KNOWN_TOOLS = new Set([
  'Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep',
  'WebSearch', 'WebFetch', 'NotebookEdit',
]);

/**
 * Infer a narrow set of allowed tools based on candidate characteristics.
 *
 * Returns a sorted, deduplicated array of tool names proportional
 * to the candidate's scope. Never returns all tools. Capped at 7.
 */
export function inferAllowedTools(candidate: ToolInferenceCandidate): string[] {
  const tools = new Set<string>();

  // Base tool: skills always need to read context
  tools.add('Read');

  switch (candidate.type) {
    case 'command':
      tools.add('Bash');
      break;

    case 'file':
      tools.add('Write');
      tools.add('Edit');
      tools.add('Glob');
      break;

    case 'tool':
      // Add the specific tool if it's a known tool name
      if (KNOWN_TOOLS.has(candidate.pattern)) {
        tools.add(candidate.pattern);
      }
      break;

    case 'workflow': {
      // Analyze description keywords for tool inference
      const desc = candidate.suggestedDescription.toLowerCase();
      if (/\b(?:test|build|run|deploy|compile)\b/.test(desc)) {
        tools.add('Bash');
      }
      if (/\b(?:search|find|locate)\b/.test(desc)) {
        tools.add('Grep');
        tools.add('Glob');
      }
      if (/\b(?:edit|modify|create|write|update)\b/.test(desc)) {
        tools.add('Write');
        tools.add('Edit');
      }
      break;
    }
  }

  // Convert to sorted array, cap at 7
  const result = [...tools].sort();
  return result.slice(0, 7);
}

// ============================================================================
// Script Wrapping
// ============================================================================

/** Result of wrapping a command as a standalone script. */
export interface WrappedScript {
  filename: string;
  content: string;
  executable: boolean;
}

/**
 * Wrap a bash command as a standalone script with shebang and error handling.
 *
 * Sanitizes the name for safe filesystem usage, adds bash shebang,
 * strict mode (set -euo pipefail), and the command body.
 */
export function wrapAsScript(command: string, name: string): WrappedScript {
  // Sanitize name: lowercase, non-alphanumeric to hyphens, collapse hyphens
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '');

  const filename = `${sanitized}.sh`;

  const content = [
    '#!/usr/bin/env bash',
    '# Generated by gsd-skill-creator',
    `# Script: ${name}`,
    'set -euo pipefail',
    '',
    command,
    '',
  ].join('\n');

  return {
    filename,
    content,
    executable: true,
  };
}

// ============================================================================
// Content Sanitization
// ============================================================================

/** Result of sanitizing generated content. */
export interface SanitizeResult {
  sanitized: string;
  findings: DangerousFinding[];
  scriptsExtracted: number;
}

/**
 * Sanitize generated skill content by blocking dangerous commands
 * and replacing them with warning comments.
 *
 * Scans all lines (including inside fenced code blocks), replaces
 * lines containing dangerous commands with HTML comment warnings,
 * and counts code blocks that were modified.
 */
export function sanitizeGeneratedContent(content: string): SanitizeResult {
  const findings = scanForDangerousCommands(content);

  if (findings.length === 0) {
    return { sanitized: content, findings: [], scriptsExtracted: 0 };
  }

  // Build set of line numbers that need blocking
  const blockedLines = new Map<number, DangerousFinding>();
  for (const finding of findings) {
    // If multiple findings on same line, keep the first
    if (!blockedLines.has(finding.line)) {
      blockedLines.set(finding.line, finding);
    }
  }

  // Track code block modifications
  let inCodeBlock = false;
  let codeBlockModified = false;
  let scriptsExtracted = 0;

  const lines = content.split('\n');
  const sanitizedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    // Track code block boundaries
    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        // Closing fence
        if (codeBlockModified) {
          scriptsExtracted++;
          codeBlockModified = false;
        }
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
    }

    if (blockedLines.has(lineNum)) {
      const finding = blockedLines.get(lineNum)!;
      sanitizedLines.push(`<!-- BLOCKED: ${finding.name} - ${finding.description} -->`);
      if (inCodeBlock) {
        codeBlockModified = true;
      }
    } else {
      sanitizedLines.push(line);
    }
  }

  return {
    sanitized: sanitizedLines.join('\n'),
    findings,
    scriptsExtracted,
  };
}
