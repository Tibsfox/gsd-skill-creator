function showDacpHelp(): void {
  console.log(`
skill-creator dacp - Manage DACP communication protocol

Usage:
  skill-creator dacp <command> [options]
  skill-creator dp <command> [options]

Commands:
  status, s             Show DACP state (bundles, fidelity, drift)
  set-level, sl         Set fidelity level override for a pattern
  history, h            Show handoff history for a pattern
  analyze, a            Trigger retrospective analysis
  export-templates, et  Export bundle templates

Examples:
  skill-creator dacp status
  skill-creator dp s --json
  skill-creator dacp set-level "planner->executor:task" 3
  skill-creator dacp history "planner->executor:task" --last 5
  skill-creator dacp analyze --milestone v1.49
  skill-creator dacp export-templates --format=yaml

Use 'skill-creator dacp <command> --help' for command-specific help.
`);
}

export async function dacpCommand(args: string[]): Promise<number> {
  const subcommand = args[1];
  const subArgs = args.slice(2);

  switch (subcommand) {
    case 'status':
    case 's': {
      const { dacpStatusCommand } = await import('./dacp-status.js');
      return dacpStatusCommand(subArgs);
    }
    case 'set-level':
    case 'sl': {
      const { dacpSetLevelCommand } = await import('./dacp-set-level.js');
      return dacpSetLevelCommand(subArgs);
    }
    case 'history':
    case 'h': {
      const { dacpHistoryCommand } = await import('./dacp-history.js');
      return dacpHistoryCommand(subArgs);
    }
    case 'analyze':
    case 'a': {
      const { dacpAnalyzeCommand } = await import('./dacp-analyze.js');
      return dacpAnalyzeCommand(subArgs);
    }
    case 'export-templates':
    case 'et': {
      const { dacpExportTemplatesCommand } = await import('./dacp-export-templates.js');
      return dacpExportTemplatesCommand(subArgs);
    }
    default:
      showDacpHelp();
      return 0;
  }
}
