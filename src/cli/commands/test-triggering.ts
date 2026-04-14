/**
 * test-triggering CLI command.
 *
 * Spawns a subagent with the naive prompt from triggering.test.md, checks
 * whether the right skill activated (substring match on rawResponse), and
 * writes two artifacts:
 *   - .triggering-status.json  sibling of SKILL.md (cache key: triggeringTestHash)
 *   - .local/triggering-logs/<skillName>-<timestamp>.json  detailed run log
 *
 * Security notes (inherited from Phase A SubagentClient):
 *   - T-CRIT-05: Never log ANTHROPIC_API_KEY
 *   - T-CRIT-06: Skill body wrapped in untrusted delimiters by RealSubagentClient
 */

import { readFile, writeFile, mkdir, appendFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import * as p from '@clack/prompts';
import { validateTriggeringTestFile } from '../../validation/triggering-validation.js';
import { RealSubagentClient, MockSubagentClient } from '../../critique/subagent-client.js';
import type { SubagentClient } from '../../critique/types.js';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// Public interface
// ============================================================================

export interface TestTriggeringOptions {
  skillsDir?: string;
  /** Use MockSubagentClient with scripted pass response (for CLI --mock flag). */
  mock?: boolean;
  /** Bypass test execution and write audit entry to overrides.log instead. */
  overrideTriggering?: string;
  /** Injected store (for testing; production resolves via filesystem). */
  _store?: { exists: (name: string) => Promise<boolean> };
  /** Injected SubagentClient (for testing; production uses RealSubagentClient). */
  _client?: SubagentClient;
}

interface TriggeringStatus {
  skillHash: string;
  triggeringTestHash: string;
  status: 'passed' | 'failed';
  lastRun: string;
  naivePrompt: string;
  expectedSkill: string;
  actualResponse: string;
  passed: boolean;
  durationMs: number;
}

// ============================================================================
// Helpers
// ============================================================================

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Extract the body of a level-2 section from markdown content.
 * Returns empty string if section not found.
 */
function extractSection(content: string, sectionName: string): string {
  // Match ## <sectionName> at line start, capture until next ## or end
  const escaped = sectionName.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
  const re = new RegExp(`^##\\s+${escaped}\\s*$([\\s\\S]*?)(?=^##\\s|$)`, 'm');
  const m = content.match(re);
  return m ? m[1].trim() : '';
}

/**
 * Extract the expected skill name from the "Expected Skill Activation" section.
 * Heuristic: the first word that looks like a skill identifier (lowercase with
 * optional hyphens and numbers). Falls back to skillName if nothing found.
 */
function extractExpectedSkill(sectionBody: string, fallback: string): string {
  const match = sectionBody.match(/\b([a-z][a-z0-9-]*)\b/);
  return match ? match[1] : fallback;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// testTriggeringCommand
// ============================================================================

/**
 * Test whether the naive prompt in triggering.test.md causes the expected skill
 * to activate. Returns 0 on success, 1 on failure or structural error.
 *
 * @param skillName - Name of the skill to test
 * @param options   - Options including DI hooks for testability
 * @returns Exit code (0 = pass, 1 = fail / error)
 */
export async function testTriggeringCommand(
  skillName: string | undefined,
  options: TestTriggeringOptions = {},
): Promise<number> {
  if (!skillName) {
    p.log.error(
      'Usage: skill-creator test-triggering <skill-name> [--mock] [--override-triggering <reason>]',
    );
    return 1;
  }

  const skillsDir = resolve(options.skillsDir ?? '.claude/skills');
  const skillDir = join(skillsDir, skillName);

  // Verify skill exists
  const store =
    options._store ??
    { exists: async (n: string) => fileExists(join(skillsDir, n, 'SKILL.md')) };

  if (!(await store.exists(skillName))) {
    p.log.error(`Skill "${skillName}" not found in ${skillsDir}`);
    return 1;
  }

  // --- Override path ---
  if (options.overrideTriggering) {
    await mkdir(join('.local', 'triggering-logs'), { recursive: true });
    const overridesLog = join('.local', 'triggering-logs', 'overrides.log');
    await appendFile(
      overridesLog,
      `${new Date().toISOString()}\t${skillName}\t${options.overrideTriggering}\n`,
      'utf8',
    );
    p.log.warn(
      `Triggering test bypassed via --override-triggering: ${options.overrideTriggering}`,
    );
    return 0;
  }

  // --- Read triggering.test.md ---
  const triggeringPath = join(skillDir, 'triggering.test.md');
  if (!(await fileExists(triggeringPath))) {
    p.log.error(`triggering.test.md not found at ${triggeringPath}`);
    return 1;
  }

  const triggeringContent = await readFile(triggeringPath, 'utf8');

  // --- Structural validation ---
  const structural = validateTriggeringTestFile(triggeringContent);
  if (!structural.valid) {
    for (const err of structural.errors) {
      p.log.error(err);
    }
    return 1;
  }

  // --- Extract sections ---
  const naivePrompt = extractSection(triggeringContent, 'Naive Prompt');
  const expectedSkillSection = extractSection(triggeringContent, 'Expected Skill Activation');
  const expectedSkill = extractExpectedSkill(expectedSkillSection, skillName);

  // --- Compute hashes ---
  const triggeringHash = sha256(triggeringContent);

  let skillBody = '';
  try {
    skillBody = await readFile(join(skillDir, 'SKILL.md'), 'utf8');
  } catch {
    // Non-fatal — hash will be empty string
  }
  const skillHash = sha256(skillBody);

  // --- Cache check ---
  const statusPath = join(skillDir, '.triggering-status.json');
  if (await fileExists(statusPath)) {
    try {
      const cached = JSON.parse(await readFile(statusPath, 'utf8')) as TriggeringStatus;
      if (cached.triggeringTestHash === triggeringHash && cached.status === 'passed') {
        p.log.success(
          `Cached pass for ${skillName} (triggering hash ${triggeringHash.slice(0, 8)})`,
        );
        return 0;
      }
    } catch {
      // Corrupt cache — re-run
    }
  }

  // --- Build SubagentClient ---
  let client: SubagentClient;
  if (options._client) {
    client = options._client;
  } else if (options.mock) {
    // MockSubagentClient with bodyOverride = expectedSkill → rawResponse will contain it
    client = new MockSubagentClient([[]], expectedSkill);
  } else {
    client = new RealSubagentClient(new Anthropic());
  }

  // --- Run subagent ---
  const routingPrompt =
    'Given this user message, which skill should activate? Answer with the skill name only.';

  const start = Date.now();
  let actualResponse = '';
  let passed = false;

  try {
    const result = await client.review(routingPrompt, naivePrompt);
    actualResponse = result.rawResponse ?? '';
    passed = actualResponse.toLowerCase().includes(expectedSkill.toLowerCase());
  } catch (err) {
    actualResponse = err instanceof Error ? err.message : String(err);
    passed = false;
  }

  const durationMs = Date.now() - start;

  // --- Build status object ---
  const status: TriggeringStatus = {
    skillHash,
    triggeringTestHash: triggeringHash,
    status: passed ? 'passed' : 'failed',
    lastRun: new Date().toISOString(),
    naivePrompt,
    expectedSkill,
    actualResponse,
    passed,
    durationMs,
  };

  // --- Write sidecar ---
  await writeFile(statusPath, JSON.stringify(status, null, 2), 'utf8');

  // --- Write detailed log ---
  await mkdir(join('.local', 'triggering-logs'), { recursive: true });
  const logPath = join('.local', 'triggering-logs', `${skillName}-${Date.now()}.json`);
  await writeFile(logPath, JSON.stringify(status, null, 2), 'utf8');

  // --- Report result ---
  if (passed) {
    p.log.success(`Triggering test PASSED for ${skillName} (${durationMs}ms)`);
    return 0;
  } else {
    p.log.error(
      `Triggering test FAILED for ${skillName}: expected "${expectedSkill}" in response`,
    );
    p.log.message(`Actual: ${actualResponse.slice(0, 200)}`);
    return 1;
  }
}
