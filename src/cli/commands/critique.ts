/**
 * critique.ts — CLI handler for `gsd skill critique <name>`
 *
 * Runs: draft → [spec-compliance, code-quality, link-check] stages → revise loop
 * Writes: .critique-status.json (sidecar), .local/critique-logs/<skill>-<ts>.json
 * Exit: 0 on converged, 1 on max-iterations / stalled / error
 *
 * Flags:
 *   --user              Use user scope (~/.claude/skills) instead of project scope
 *   --max-iter <N>      Override max iterations (default 5)
 *   --check-external    Enable external HEAD checks in link-check stage
 *   --mock              Use MockSubagentClient (all stages return []) — immediate convergence
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { loadDraft } from '../../critique/draft.js';
import { runCritiqueLoop } from '../../critique/loop.js';
import { RealSubagentClient, MockSubagentClient } from '../../critique/subagent-client.js';
import { specComplianceStage } from '../../critique/stages/spec-compliance.js';
import { codeQualityStage } from '../../critique/stages/code-quality.js';
import { linkCheckStage } from '../../critique/stages/link-check.js';
import { reviseDraft } from '../../critique/revise.js';
import type { CritiqueFinding, CritiqueConfig, SkillDraft } from '../../critique/types.js';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// Public interface
// ============================================================================

export interface CritiqueOptions {
  skillsDir?: string;
  /** Override max iterations */
  maxIter?: number;
  /** Enable external HEAD checks */
  checkExternal?: boolean;
  /** Use MockSubagentClient (immediate convergence) */
  mock?: boolean;
  /** For tests: scripted findings override on mock client */
  _mockFindingsOverride?: CritiqueFinding[];
}

// ============================================================================
// Help text
// ============================================================================

function showCritiqueHelp(): void {
  console.log(`
skill-creator critique - Run iterative critique loop on a skill

Usage:
  skill-creator critique <skill-name> [options]
  skill-creator skill critique <skill-name> [options]

Options:
  --user                Read from user scope (~/.claude/skills/)
  --max-iter <N>        Override max iterations (default: 5)
  --check-external      Enable external HEAD checks in link-check stage
  --mock                Use mock subagent client (immediate convergence, CI-safe)
  --help, -h            Show this help message

The critique loop runs three stages per iteration:
  1. spec-compliance  — reviews skill body against spec requirements
  2. code-quality     — reviews clarity, structure, and maintainability
  3. link-check       — verifies all links in the skill body

Loop terminates on:
  - convergence: all stages pass for convergenceWindow consecutive iterations (exit 0)
  - max-iterations: cap reached without convergence (exit 1)
  - stalled: identical findings in consecutive iterations (exit 1)

Outputs:
  .critique-status.json     Sidecar file in the skill directory (read by publish gate)
  .local/critique-logs/     Per-run JSON log files
`);
}

// ============================================================================
// critiqueCommand
// ============================================================================

/**
 * Run the critique loop on a named skill.
 *
 * @param skillName - Skill name to critique
 * @param options - Command options
 * @returns Exit code (0 = converged, 1 = not converged / error)
 */
export async function critiqueCommand(
  skillName: string | undefined,
  options: CritiqueOptions,
): Promise<number> {
  if (!skillName) {
    showCritiqueHelp();
    return 1;
  }

  const skillsDir = options.skillsDir ?? '.claude/skills';
  const maxIterations = options.maxIter ?? 5;
  const checkExternal = options.checkExternal ?? false;
  const useMock = options.mock ?? false;

  const skillDir = join(skillsDir, skillName);

  p.intro(pc.bgCyan(pc.black(` Critiquing skill: ${skillName} `)));

  // --- Load draft ---
  let draft: SkillDraft;
  try {
    draft = await loadDraft(skillDir, {
      readFile: async (p: string) => {
        const { readFile } = await import('node:fs/promises');
        return readFile(p, 'utf-8');
      },
      readDir: async (dir: string) => {
        const { readdir } = await import('node:fs/promises');
        try {
          const entries = await readdir(dir, { withFileTypes: true });
          return entries
            .filter((e) => e.isFile())
            .map((e) => e.name);
        } catch {
          return [];
        }
      },
    });
  } catch (err) {
    p.log.error(`Failed to load skill: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  // --- Build subagent client ---
  let client: RealSubagentClient | MockSubagentClient;
  if (useMock) {
    const scriptedFindings = options._mockFindingsOverride
      ? [options._mockFindingsOverride, options._mockFindingsOverride, options._mockFindingsOverride]
      : [];
    client = new MockSubagentClient(scriptedFindings);
  } else {
    try {
      const anthropic = new Anthropic();
      client = new RealSubagentClient(anthropic);
    } catch (err) {
      p.log.error(`Failed to initialize Anthropic client: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
  }

  // --- Build stages ---
  const linkOpts = {
    readFile: async (f: string) => {
      const { readFile } = await import('node:fs/promises');
      return readFile(f, 'utf-8');
    },
    walkDir: async (dir: string) => {
      const { readdir } = await import('node:fs/promises');
      try {
        const entries = await readdir(dir, { recursive: true, withFileTypes: true });
        return (entries as { isFile: () => boolean; name: string; parentPath?: string }[])
          .filter((e) => e.isFile())
          .map((e) => (e.parentPath ? `${e.parentPath}/${e.name}` : e.name).replace(`${dir}/`, ''));
      } catch {
        return [];
      }
    },
    checkExternal,
  };

  const stages = [
    specComplianceStage(client),
    codeQualityStage(client),
    linkCheckStage(linkOpts),
  ];

  // --- Build config ---
  const config: CritiqueConfig = {
    maxIterations,
    convergenceWindow: 2,
    stallDetection: true,
    logDir: '.local/critique-logs',
  };

  // --- Run loop ---
  p.log.message(pc.dim(`Running critique loop (max ${maxIterations} iterations)...`));

  let result;
  try {
    result = await runCritiqueLoop(draft, stages, config, {
      revise: (d: SkillDraft, findings: CritiqueFinding[]) =>
        reviseDraft(d, findings, {
          reviser: client,
          revisePrompt: 'Please revise the following skill to address these issues:\n\n{{findings}}',
        }),
      hashBody: (body: string) => createHash('sha256').update(body).digest('hex'),
    });
  } catch (err) {
    p.log.error(`Critique loop failed: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  // --- Render result ---
  if (result.status === 'converged') {
    p.log.success(`Converged after ${result.iterations} iteration(s) — 0 findings`);
  } else if (result.status === 'max-iterations') {
    p.log.warn(`Max iterations (${maxIterations}) reached — ${result.finalFindings.length} finding(s) remain`);
  } else {
    p.log.warn(`Stalled after ${result.iterations} iterations — findings unchanged`);
  }

  // --- Write log ---
  const logDir = config.logDir ?? '.local/critique-logs';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = join(logDir, `${skillName}-${timestamp}.json`);

  try {
    await mkdir(logDir, { recursive: true });
    await writeFile(logPath, JSON.stringify({
      skillName,
      skillDir,
      status: result.status,
      iterations: result.iterations,
      finalFindingCount: result.finalFindings.length,
      skillHash: result.skillHash,
      log: result.log,
      ranAt: new Date().toISOString(),
    }, null, 2));
    p.log.message(pc.dim(`Log: ${logPath}`));
  } catch (err) {
    p.log.warn(`Could not write log: ${err instanceof Error ? err.message : String(err)}`);
  }

  // --- Write .critique-status.json sidecar ---
  const statusPath = join(skillDir, '.critique-status.json');
  try {
    await writeFile(statusPath, JSON.stringify({
      lastRun: new Date().toISOString(),
      skillHash: result.skillHash,
      status: result.status,
      findings: result.finalFindings.length,
    }, null, 2));
    p.log.message(pc.dim(`Status: ${statusPath}`));
  } catch (err) {
    p.log.warn(`Could not write status file: ${err instanceof Error ? err.message : String(err)}`);
  }

  p.outro(result.status === 'converged'
    ? pc.green(`Skill "${skillName}" critique passed`)
    : pc.yellow(`Skill "${skillName}" critique incomplete — rerun to continue`));

  return result.status === 'converged' ? 0 : 1;
}
