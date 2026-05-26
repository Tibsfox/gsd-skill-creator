import * as p from '@clack/prompts';
import { parseScope } from '../../types/scope.js';

export async function skillCommand(
  args: string[],
  parseSkillsDir: (args: string[], scope: ReturnType<typeof parseScope>) => string,
  parseStringFlag: (args: string[], name: string) => string | undefined,
): Promise<number> {
  // skill <subcommand> [args] — namespaced entry point for skill-level commands.
  // Provides `skill-creator skill test-triggering <name>` alongside the top-level
  // `skill-creator test-triggering <name>` (Q3 dual registration).
  const subcommand = args[1];
  const subArgs = args.slice(2);

  switch (subcommand) {
    case 'test-triggering': {
      const scope = parseScope(subArgs);
      const skillName = subArgs.filter((a) => !a.startsWith('-'))[0];
      const { testTriggeringCommand } = await import('./test-triggering.js');
      return testTriggeringCommand(skillName, {
        skillsDir: parseSkillsDir(subArgs, scope),
        mock: subArgs.includes('--mock'),
        overrideTriggering: parseStringFlag(subArgs, '--override-triggering'),
      });
    }

    default: {
      p.log.message('');
      p.log.message('Skill subcommands:');
      p.log.message('  test-triggering <name>   Run triggering test for a skill');
      p.log.message('');
      p.log.message('Examples:');
      p.log.message('  skill-creator skill test-triggering my-skill');
      p.log.message('  skill-creator skill test-triggering my-skill --mock');
      return 0;
    }
  }
}
