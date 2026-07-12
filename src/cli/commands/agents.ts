import * as p from '@clack/prompts';
import pc from 'picocolors';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createStores } from '../../index.js';
import { listAgentsInDir } from './migrate-agent.js';
import { validateAgentFrontmatter } from '../../validation/agent-validation.js';
import { ensureProcessAllowed, type ProcessContext } from '../../security/process-context.js';

export async function agentsCommand(args: string[], ctx?: ProcessContext): Promise<number> {
  const subcommand = args[1];
  const { skillStore } = createStores();
  const { AgentSuggestionManager } = await import('../../agents/index.js');
  const manager = new AgentSuggestionManager('.planning/patterns', skillStore);
  const matter = await import('gray-matter');

  switch (subcommand) {
    case 'suggest':
    case 'sg': {
      p.intro('Analyzing skill co-activations...');

      const result = await manager.analyze();

      if (result.totalPending === 0) {
        p.log.success('No agent suggestions at this time.');
        p.log.message('Keep using skills together - suggestions appear when patterns stabilize.');
        return 0;
      }

      p.log.info(`Found ${result.newSuggestions} new clusters, ${result.totalPending} pending.`);

      for (const suggestion of result.suggestions) {
        const cluster = suggestion.cluster;

        p.log.message('');
        p.log.message(pc.bold(`Agent Suggestion: ${cluster.suggestedName}`));
        p.log.message(`Skills: ${cluster.skills.join(', ')}`);
        p.log.message(`Co-activation score: ${(cluster.coActivationScore * 100).toFixed(0)}%`);
        p.log.message(`Stable for: ${cluster.stabilityDays} days`);

        const action = await p.select({
          message: 'What would you like to do?',
          options: [
            { value: 'accept', label: 'Accept - Create this agent' },
            { value: 'preview', label: 'Preview - See agent content' },
            { value: 'defer', label: 'Defer - Ask me later' },
            { value: 'dismiss', label: "Dismiss - Don't suggest again" },
            { value: 'skip', label: 'Skip - Next suggestion' },
            { value: 'quit', label: 'Quit - Exit review' },
          ],
        });

        if (p.isCancel(action) || action === 'quit') break;
        if (action === 'skip') continue;

        if (action === 'preview') {
          const preview = await manager.preview(suggestion.id);
          if (preview) {
            p.log.message(pc.bold('Agent Preview:'));
            p.log.message('─'.repeat(50));
            p.log.message(preview.content.slice(0, 1000));
            p.log.message('─'.repeat(50));
          }
          continue;
        }

        if (action === 'accept') {
          const acceptResult = await manager.accept(suggestion.id);
          if (acceptResult.success) {
            p.log.success(`Created agent: ${acceptResult.agentName}`);
            p.log.message(`File: .claude/agents/${acceptResult.agentName}.md`);
          } else {
            p.log.error(`Failed: ${acceptResult.error}`);
          }
        } else if (action === 'defer') {
          await manager.defer(suggestion.id);
          p.log.info('Deferred for later.');
        } else if (action === 'dismiss') {
          await manager.dismiss(suggestion.id);
          p.log.info('Dismissed.');
        }
      }

      p.outro('Done reviewing agent suggestions.');
      return 0;
    }

    case 'create':
    case 'c': {
      const { AgentGenerator, DEFAULT_AGENT_GENERATOR_CONFIG } = await import('../../agents/index.js');
      const getFlag = (name: string): string | undefined => {
        const pfx = `--${name}=`;
        const a = args.find((x) => x.startsWith(pfx));
        return a ? a.slice(pfx.length) : undefined;
      };
      const scope: 'user' | 'project' = args.includes('--user') ? 'user' : 'project';
      let name = getFlag('name');
      let description = getFlag('description');
      const skillsFlag = getFlag('skills');
      const toolsFlag = getFlag('tools');
      const available = await skillStore.list();
      let skills = skillsFlag ? skillsFlag.split(',').map((s) => s.trim()).filter(Boolean) : [];

      // Interactive wizard when name/description are not supplied (mirrors team create).
      if (!name || !description) {
        p.intro('Create an agent');
        if (!name) {
          const r = await p.text({ message: 'Agent name (lowercase-hyphen)', validate: (v) => (v ? undefined : 'Required') });
          if (p.isCancel(r)) { p.cancel('Cancelled.'); return 1; }
          name = r;
        }
        if (!description) {
          const r = await p.text({ message: 'What does this agent do?', validate: (v) => (v ? undefined : 'Required') });
          if (p.isCancel(r)) { p.cancel('Cancelled.'); return 1; }
          description = r;
        }
        if (skills.length === 0 && available.length > 0) {
          const r = await p.multiselect({
            message: 'Member skills (space to toggle, optional)',
            options: available.map((s) => ({ value: s, label: s })),
            required: false,
          });
          if (!p.isCancel(r)) skills = r as string[];
        }
      }

      if (!name || !description) {
        p.log.error('agents create requires --name and --description (or run interactively).');
        return 1;
      }

      const agentsDir = scope === 'user' ? join(homedir(), '.claude', 'agents') : '.claude/agents';
      const config = {
        ...DEFAULT_AGENT_GENERATOR_CONFIG,
        agentsDir,
        scope,
        ...(toolsFlag ? { tools: toolsFlag.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
      };
      const generator = new AgentGenerator(skillStore, config);
      const cluster = {
        id: `manual-${name}`,
        skills,
        coActivationScore: 1,
        stabilityDays: 0,
        suggestedName: name,
        suggestedDescription: description,
      };
      try {
        const agent = await generator.create(cluster);
        p.log.success(`Created agent: ${pc.green(agent.filePath)}`);
        if (agent.warning) p.log.warn(agent.warning);
        return 0;
      } catch (e) {
        p.log.error(`Failed to create agent: ${(e as Error).message}`);
        return 1;
      }
    }

    case 'validate':
    case 'v': {
      const agentsDir = '.claude/agents';
      const agents = await listAgentsInDir(agentsDir);

      if (agents.length === 0) {
        p.log.info(`No agents found in ${agentsDir}`);
        return 0;
      }

      const { readFile } = await import('fs/promises');

      p.log.message(pc.bold('Agent Validation Results:'));
      p.log.message('');

      let validCount = 0;
      let needsMigrationCount = 0;

      for (const agent of agents) {
        try {
          const content = await readFile(agent.path, 'utf-8');
          const parsed = matter.default(content);
          const validation = validateAgentFrontmatter(parsed.data);

          if (agent.needsMigration) {
            needsMigrationCount++;
            p.log.message(`  ${pc.yellow('!')} ${agent.name}`);
            for (const issue of agent.issues) {
              p.log.message(`    ${pc.dim(issue)}`);
            }
            p.log.message(`    ${pc.dim('Run: skill-creator migrate-agent ' + agent.name)}`);
          } else if (!validation.valid) {
            needsMigrationCount++;
            p.log.message(`  ${pc.red('x')} ${agent.name}`);
            for (const error of validation.errors) {
              p.log.message(`    ${pc.red(error)}`);
            }
          } else {
            validCount++;
            if (validation.warnings.length > 0) {
              p.log.message(`  ${pc.green('+')} ${agent.name} ${pc.yellow('(warnings)')}`);
              for (const warning of validation.warnings) {
                p.log.message(`    ${pc.dim(warning)}`);
              }
            } else {
              p.log.message(`  ${pc.green('+')} ${agent.name}`);
            }
          }
        } catch {
          needsMigrationCount++;
          p.log.message(`  ${pc.red('x')} ${agent.name}`);
          p.log.message(`    ${pc.dim('Could not read or parse file')}`);
        }
      }

      p.log.message('');
      p.log.message(pc.bold('Summary:'));
      p.log.message(`  ${pc.green('Valid:')} ${validCount}`);
      if (needsMigrationCount > 0) {
        p.log.message(`  ${pc.yellow('Needs migration:')} ${needsMigrationCount}`);
        p.log.message('');
        p.log.message(`Run ${pc.cyan('skill-creator migrate-agent')} to fix issues.`);
      }
      // Exit non-zero on any invalid/needs-migration agent so `agents validate`
      // is a real gate (tools-as-array etc. fail AgentFrontmatterSchema).
      return needsMigrationCount > 0 ? 1 : 0;
    }

    case 'list':
    case 'ls': {
      const agentsDir = '.claude/agents';
      const agents = await listAgentsInDir(agentsDir);

      if (agents.length > 0) {
        p.log.message(pc.bold('Agents in .claude/agents/:'));

        const valid = agents.filter((a) => !a.needsMigration);
        const needsMigration = agents.filter((a) => a.needsMigration);

        if (valid.length > 0) {
          for (const a of valid) {
            p.log.message(`  ${pc.green('+')} ${a.name}`);
          }
        }

        if (needsMigration.length > 0) {
          for (const a of needsMigration) {
            p.log.message(`  ${pc.yellow('!')} ${a.name} ${pc.dim('(needs migration)')}`);
          }
        }
        p.log.message('');
      }

      const pending = await manager.getPending();
      if (pending.length > 0) {
        p.log.message(pc.bold('Pending Agent Suggestions:'));
        for (const s of pending) {
          p.log.message(`  - ${s.cluster.suggestedName}`);
          p.log.message(pc.dim(`    Skills: ${s.cluster.skills.join(', ')}`));
        }
      } else if (agents.length === 0) {
        p.log.info('No agents found and no pending suggestions.');
        p.log.message('Run skill-creator agents suggest to analyze patterns.');
      }
      return 0;
    }

    case 'adoption':
    case 'ad': {
      // Repo-maintainer / self-audit command: the agent-tier sibling of
      // `npm run adoption-report`. Thin, faithful wrapper over the standalone
      // scanner tool so there is no format drift — it forwards every flag
      // after `adoption` (--json, --dormant-threshold N, --no-allowlist,
      // --root, --agents-dir) and inherits the tool's stdio + exit code.
      const { spawnSync } = await import('node:child_process');
      const { existsSync } = await import('node:fs');
      const { join } = await import('node:path');
      const toolPath = join(process.cwd(), 'tools', 'agent-adoption-scan.mjs');
      if (!existsSync(toolPath)) {
        p.log.warn('agent adoption scan is a repo-maintainer command.');
        p.log.message(`  Run it from the gsd-skill-creator repo root (not found: ${pc.dim('tools/agent-adoption-scan.mjs')}).`);
        p.log.message(`  See ${pc.cyan('docs/AGENT-ADOPTION-VERDICTS.md')} for the per-agent disposition.`);
        return 1;
      }
      const forwarded = args.slice(2);
      // Route through the ProcessContext chokepoint (src/security/process-context.ts).
      // ctx is undefined at the dispatch boundary today (no-op), but threading it
      // keeps this caller inside the governed surface rather than bypassing it.
      ensureProcessAllowed(ctx, 'cli/commands/agents', 'spawn-sync', process.execPath, [toolPath, ...forwarded]);
      const result = spawnSync(process.execPath, [toolPath, ...forwarded], {
        stdio: 'inherit',
      });
      return result.status ?? 1;
    }

    default: {
      // Bare `agents` prints help (exit 0); unknown subcommand is a usage
      // error (exit 1). (CLI-4)
      if (subcommand !== undefined) {
        p.log.error(`Unknown agents subcommand: ${subcommand}`);
      }
      p.log.message('');
      p.log.message(pc.bold('Agent Management:'));
      p.log.message('');
      p.log.message('  The "agents" command manages agent suggestions from skill clusters.');
      p.log.message('  Generated agents use official Claude Code format with comma-separated');
      p.log.message('  tools field.');
      p.log.message('');
      p.log.message(pc.yellow('  Note: User-level agents (~/.claude/agents/) have a known discovery'));
      p.log.message(pc.yellow('  bug (GitHub #11205). Consider using project-level agents instead.'));
      p.log.message('');
      p.log.message('  Subcommands:');
      p.log.message(`    ${pc.cyan('agents create')}     Create an agent (interactive or --name/--description)`);
      p.log.message(`    ${pc.cyan('agents suggest')}    Analyze co-activations, suggest agents`);
      p.log.message(`    ${pc.cyan('agents list')}       List agents with validation status`);
      p.log.message(`    ${pc.cyan('agents validate')}   Check all agent files for format issues`);
      p.log.message(`    ${pc.cyan('agents adoption')}   Scan dispatch sites: living vs dormant agents`);
      p.log.message('');
      p.log.message('  Examples:');
      p.log.message('    skill-creator agents create --name=my-agent --description="..."');
      p.log.message('    skill-creator agents suggest');
      p.log.message('    skill-creator agents list');
      p.log.message('    skill-creator agents validate');
      p.log.message('    skill-creator agents adoption');
      p.log.message('    skill-creator agents adoption --json');
      return subcommand === undefined ? 0 : 1;
    }
  }
}
