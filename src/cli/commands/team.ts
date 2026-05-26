function showTeamHelp(): void {
  console.log(`
skill-creator team - Manage agent teams

Usage:
  skill-creator team <command> [options]
  skill-creator tm <command> [options]

Commands:
  create, c     Create a new team (interactive wizard or flags)
  list, l       List all teams with member counts
  validate, v   Validate team config(s) with detailed report
  spawn, sp     Check team readiness (agent resolution)
  status, s     Show team details and validation summary
  estimate, e   Show projected token usage and cost

Examples:
  skill-creator team create                    Interactive team creation
  skill-creator tm c --pattern=leader-worker --name=research
  skill-creator team list                      List all teams
  skill-creator tm l --scope=project           List project teams only
  skill-creator team validate my-team          Validate single team
  skill-creator tm v --all                     Validate all teams
  skill-creator team spawn my-team             Check readiness
  skill-creator tm s my-team                   Show team details

Use 'skill-creator team <command> --help' for command-specific help.
`);
}

export async function teamCommand(args: string[]): Promise<number> {
  const subcommand = args[1];
  const subArgs = args.slice(2);

  switch (subcommand) {
    case 'create':
    case 'c': {
      const { teamCreateCommand } = await import('./team-create.js');
      return teamCreateCommand(subArgs);
    }
    case 'list':
    case 'l': {
      const { teamListCommand } = await import('./team-list.js');
      return teamListCommand(subArgs);
    }
    case 'validate':
    case 'v': {
      const { teamValidateCommand } = await import('./team-validate.js');
      return teamValidateCommand(subArgs);
    }
    case 'spawn':
    case 'sp': {
      const { teamSpawnCommand } = await import('./team-spawn.js');
      return teamSpawnCommand(subArgs);
    }
    case 'status':
    case 's': {
      const { teamStatusCommand } = await import('./team-status.js');
      return teamStatusCommand(subArgs);
    }
    case 'estimate':
    case 'e': {
      const { teamEstimateCommand } = await import('./team-estimate.js');
      return teamEstimateCommand(subArgs);
    }
    default:
      showTeamHelp();
      return 0;
  }
}
