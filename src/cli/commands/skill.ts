import * as p from '@clack/prompts';
import pc from 'picocolors';
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

    case 'ship': {
      // Run the ship pipeline in order: validate -> critique -> test-triggering,
      // printing a per-gate verdict. Short-circuits on the first failure unless
      // --continue is given. --mock forwards to critique/triggering (no live calls).
      const scope = parseScope(subArgs);
      const skillName = subArgs.filter((a) => !a.startsWith('-'))[0];
      if (!skillName) {
        p.log.error('skill ship requires a skill name. Usage: skill-creator skill ship <name>');
        return 1;
      }
      const skillsDir = parseSkillsDir(subArgs, scope);
      const mock = subArgs.includes('--mock');
      const continueOnFail = subArgs.includes('--continue');
      const { validateCommand } = await import('./validate.js');
      const { critiqueCommand } = await import('./critique.js');
      const { testTriggeringCommand } = await import('./test-triggering.js');

      p.log.message(pc.bold(`Shipping ${skillName}: validate -> critique -> test-triggering`));
      let failed = 0;
      const gate = async (label: string, run: () => Promise<number>): Promise<boolean> => {
        const ok = (await run()) === 0;
        p.log.message(`  ${ok ? pc.green('PASS') : pc.red('FAIL')}  ${label}`);
        if (!ok) failed++;
        return ok;
      };

      const okValidate = await gate('validate', () => validateCommand(skillName, { skillsDir }));
      if (okValidate || continueOnFail) {
        const okCritique = await gate('critique', () => critiqueCommand(skillName, { skillsDir, mock }));
        if (okCritique || continueOnFail) {
          await gate('test-triggering', () => testTriggeringCommand(skillName, { skillsDir, mock }));
        }
      }

      if (failed === 0) {
        p.log.success(`${skillName} is ship-ready. Next: skill-creator publish ${skillName}`);
        return 0;
      }
      p.log.error(`${failed} gate(s) failed — fix and re-run \`skill-creator skill ship ${skillName}\`.`);
      return 1;
    }

    default: {
      // Bare `skill` prints help (exit 0); unknown subcommand is a usage
      // error (exit 1). (CLI-4)
      if (subcommand !== undefined) {
        p.log.error(`Unknown skill subcommand: ${subcommand}`);
      }
      p.log.message('');
      p.log.message('Skill subcommands:');
      p.log.message('  test-triggering <name>   Run triggering test for a skill');
      p.log.message('  ship <name>              Run validate -> critique -> test-triggering gates');
      p.log.message('');
      p.log.message('Examples:');
      p.log.message('  skill-creator skill test-triggering my-skill');
      p.log.message('  skill-creator skill ship my-skill --mock');
      return subcommand === undefined ? 0 : 1;
    }
  }
}
