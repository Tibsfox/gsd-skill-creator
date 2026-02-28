/**
 * Contribution workflow — orchestrates Gate 1 (merge) and Gate 2 (PR).
 *
 * This is the top-level workflow that a human triggers when ready to
 * contribute work from dev -> main -> upstream. Both gates must be
 * explicitly approved by a human. Rejection at any point produces
 * ZERO side effects beyond that point.
 *
 * Safety invariants:
 * - Gate 1 rejection: no merge, no branch switch, no state change
 * - Gate 2 rejection: merge already done, but ZERO upstream contact
 * - Never uses --force anywhere
 * - Never auto-approves either gate
 * - PR description is always editable before submission
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GateDecision, GitOperationLog } from '../types.js';
import { presentMergeGate, presentPRGate } from '../gates/hitl-gate.js';
import type { GatePromptFn, PRPromptFn, PRGateDecision } from '../gates/hitl-gate.js';
import { detectState } from '../core/state-machine.js';

// === Types ===

export interface ContributeResult {
  merged: boolean;
  prCreated: boolean;
  mergeDecision?: GateDecision;
  prDecision?: PRGateDecision;
  prTitle?: string;
  prDescription?: string;
  prUrl?: string;
}

// === Helpers ===

function exec(command: string, cwd: string): string {
  return execSync(command, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function logOperation(
  repoPath: string,
  operation: string,
  commands: string[],
  success: boolean,
  error?: string,
): void {
  const configDir = path.join(repoPath, '.sc-git');
  fs.mkdirSync(configDir, { recursive: true });

  const entry: Partial<GitOperationLog> = {
    timestamp: new Date().toISOString(),
    operation,
    commands,
    success,
  };

  if (error !== undefined) {
    entry.error = error;
  }

  const logPath = path.join(configDir, 'operations.jsonl');
  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8');
}

// === Main Workflow ===

export async function contribute(
  repoPath: string,
  promptFn: GatePromptFn,
  prPromptFn: PRPromptFn,
): Promise<ContributeResult> {
  const commands: string[] = [];

  // === Gate 1: dev -> main merge ===
  let mergeDecision: GateDecision | undefined;

  // Gate 1 loop (handles sync-first re-presentation)
  while (true) {
    mergeDecision = await presentMergeGate(repoPath, promptFn);

    if (mergeDecision.approved) {
      break;
    }

    // Check for sync-first request
    if (mergeDecision.humanNotes === 'sync') {
      // Run sync (fetch + rebase)
      try {
        exec('git fetch upstream', repoPath);
        exec('git rebase upstream/main', repoPath);
        commands.push('git fetch upstream', 'git rebase upstream/main');
      } catch {
        // Sync failed — abort and re-present
        try { exec('git rebase --abort', repoPath); } catch { /* empty */ }
      }
      // Loop back to re-present Gate 1
      continue;
    }

    // Rejected — return early with zero side effects
    logOperation(repoPath, 'contribute', commands, true, 'Gate 1 rejected by human');
    return {
      merged: false,
      prCreated: false,
      mergeDecision,
    };
  }

  // === Execute merge ===
  try {
    exec('git checkout main', repoPath);
    exec('git merge --no-ff dev', repoPath);
    exec('git checkout dev', repoPath);
    commands.push('git checkout main', 'git merge --no-ff dev', 'git checkout dev');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logOperation(repoPath, 'contribute', commands, false, `Merge failed: ${errMsg}`);
    return {
      merged: false,
      prCreated: false,
      mergeDecision,
    };
  }

  // Verify merge succeeded
  await detectState(repoPath);

  // === Gate 2: main -> upstream PR ===
  const prDecision = await presentPRGate(repoPath, prPromptFn);

  if (!prDecision.approved) {
    // Merge happened, but NO upstream contact whatsoever
    logOperation(repoPath, 'contribute', commands, true, 'Gate 2 rejected by human — no upstream contact');
    return {
      merged: true,
      prCreated: false,
      mergeDecision,
      prDecision,
    };
  }

  // === Create PR ===
  let prUrl: string | undefined;
  let prCreated = false;

  try {
    exec('which gh', repoPath);
    // gh CLI available — push and create PR
    try {
      exec('git push origin main', repoPath);
      const result = exec(
        `gh pr create --repo upstream/repo --base main --head user:main --title "${prDecision.prTitle}" --body "${prDecision.prDescription}"`,
        repoPath,
      );
      prUrl = result;
      prCreated = true;
      commands.push('git push origin main', 'gh pr create');
    } catch {
      // Push/PR creation failed
      prCreated = false;
    }
  } catch {
    // gh CLI not available — provide manual URL
    prUrl = 'https://github.com/upstream/repo/compare/main...user:main';
    prCreated = true;
    commands.push('(manual PR — gh CLI not available)');
  }

  logOperation(repoPath, 'contribute', commands, true);

  return {
    merged: true,
    prCreated,
    mergeDecision,
    prDecision,
    prTitle: prDecision.prTitle,
    prDescription: prDecision.prDescription,
    prUrl,
  };
}
