/**
 * `skill-creator git <subcommand>` — router for the deterministic git
 * workflow commands (Phase 395-397).
 *
 * The git module (src/git/) ships a complete CLI surface via
 * registerGitCommands() but was never wired into the dispatch registry, so it
 * read as living-but-unreachable in the reachability-v2 adoption scan
 * (Ship 3.1). This router completes that authored intent: it surfaces the
 * descriptors under `sc git <sub>` rather than as top-level commands, because
 * the repo-`install` descriptor would collide with the existing skill-installer
 * `install` command.
 *
 * Subcommands: install, status, sync, work, gate merge, gate pr, worktree list.
 *
 * @module cli/commands/git
 */

import { registerGitCommands } from '../../git/cli.js';

const HELP = `skill-creator git - deterministic git workflow

Usage:
  skill-creator git install <url> [--main-branch <name>] [--dev-branch <name>]
  skill-creator git status [path]
  skill-creator git sync [--strategy merge|rebase] [--dry-run]
  skill-creator git work <name> [--type feature|fix|docs|refactor] [--worktree]
  skill-creator git gate merge
  skill-creator git gate pr
  skill-creator git worktree list`;

/**
 * Route `git` subcommand args to the matching GitCommand descriptor.
 *
 * @param args - CLI args after `git` (e.g. ['status', '/path'] or ['gate', 'merge'])
 * @returns process exit code (0 on success, 1 on failure / unknown subcommand)
 */
export async function gitCommand(args: string[]): Promise<number> {
  const sub = args[0];
  if (!sub || sub === '--help' || sub === '-h' || sub === 'help') {
    console.log(HELP);
    return 0;
  }

  const commands = registerGitCommands();
  const byName = new Map(commands.map((c) => [c.name, c]));

  // Resolve subcommand → descriptor name, accounting for two-word groups.
  let name: string;
  let rest: string[];
  if (sub === 'gate') {
    const verb = args[1];
    if (verb !== 'merge' && verb !== 'pr') {
      console.error(`Unknown git gate subcommand: ${verb ?? '<none>'}\n\n${HELP}`);
      return 1;
    }
    name = `git-gate-${verb}`;
    rest = args.slice(2);
  } else if (sub === 'worktree') {
    if (args[1] !== 'list') {
      console.error(`Unknown git worktree subcommand: ${args[1] ?? '<none>'}\n\n${HELP}`);
      return 1;
    }
    name = 'git-worktree-list';
    rest = args.slice(2);
  } else if (sub === 'install') {
    name = 'install';
    rest = args.slice(1);
  } else {
    name = `git-${sub}`;
    rest = args.slice(1);
  }

  const command = byName.get(name);
  if (!command) {
    console.error(`Unknown git subcommand: ${sub}\n\n${HELP}`);
    return 1;
  }

  const result = await command.handler(rest);
  if (result.success) {
    console.log(result.message);
    return 0;
  }
  console.error(result.message);
  return 1;
}
