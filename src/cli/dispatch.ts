import type { SkillStore } from '../storage/skill-store.js';
import type { SkillIndex } from '../storage/skill-index.js';
import type { SkillScope } from '../types/scope.js';
import { suggestCommand, suggestionsCommand } from './commands/suggest.js';
import { feedbackCommand } from './commands/feedback.js';
import { refineCommand } from './commands/refine.js';
import { deleteCommand } from './commands/delete.js';
import { invokeCommand } from './commands/invoke.js';
import { agentsCommand } from './commands/agents.js';

export interface CliContext {
  args: string[];
  skillStore: SkillStore;
  skillIndex: SkillIndex;
  parseScope: (args: string[]) => SkillScope;
  parseSkillsDir: (args: string[], scope: SkillScope) => string;
  parseStringFlag: (args: string[], name: string) => string | undefined;
}

export type CommandHandler = (ctx: CliContext) => Promise<number | void>;

export interface CommandEntry {
  readonly aliases: readonly string[];
  readonly handler: CommandHandler;
}

// Edit this array to register a new command. Each entry maps a set of
// alias strings (the command word + short aliases) to a single handler.
// Lookup is O(n) over entries; n is small enough that a flat scan beats
// a Map for the constant-factor cost of the few-dozen-command surface.
export const REGISTRY: readonly CommandEntry[] = [
  { aliases: ['suggest', 'sg'], handler: () => suggestCommand() },
  { aliases: ['suggestions', 'sgs'], handler: (ctx) => suggestionsCommand(ctx.args) },
  { aliases: ['feedback', 'fb'], handler: (ctx) => feedbackCommand(ctx.args) },
  { aliases: ['refine', 'rf'], handler: (ctx) => refineCommand(ctx.args) },
  { aliases: ['delete', 'del', 'rm'], handler: (ctx) => deleteCommand(ctx.args) },
  { aliases: ['invoke', 'i'], handler: (ctx) => invokeCommand(ctx.args) },
  { aliases: ['agents', 'ag'], handler: (ctx) => agentsCommand(ctx.args) },
];

export function lookup(command: string | undefined): CommandHandler | undefined {
  if (!command) return undefined;
  for (const entry of REGISTRY) {
    if (entry.aliases.includes(command)) return entry.handler;
  }
  return undefined;
}
