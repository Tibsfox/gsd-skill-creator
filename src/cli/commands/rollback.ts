import * as p from '@clack/prompts';
import { VersionManager } from '../../learning/index.js';

export async function rollbackCommand(args: string[]): Promise<number> {
  const skillName = args[1];
  const targetHash = args[2];

  if (!skillName) {
    p.log.error('Usage: skill-creator rollback <skill-name> [hash]');
    return 1;
  }

  const versionManager = new VersionManager();
  const history = await versionManager.getHistory(skillName);

  if (history.length === 0) {
    p.log.error(`No version history for '${skillName}'.`);
    return 1;
  }

  let selectedHash = targetHash;

  if (!selectedHash) {
    const selected = await p.select({
      message: 'Select version to rollback to:',
      options: history.map((v) => ({
        value: v.hash,
        label: `${v.shortHash} - ${v.date.toLocaleDateString()}`,
        hint: v.message.slice(0, 50),
      })),
    });

    if (p.isCancel(selected)) {
      p.cancel('Cancelled');
      return 0;
    }

    selectedHash = selected as string;
  }

  const confirm = await p.confirm({
    message: `Rollback '${skillName}' to ${selectedHash.slice(0, 7)}?`,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.log.info('Rollback cancelled.');
    return 0;
  }

  const result = await versionManager.rollback(skillName, selectedHash);

  if (result.success) {
    p.log.success(`Rolled back to ${selectedHash.slice(0, 7)}.`);
    p.log.message(`Commit: ${result.message}`);
    return 0;
  }

  p.log.error(`Rollback failed: ${result.error}`);
  return 1;
}
