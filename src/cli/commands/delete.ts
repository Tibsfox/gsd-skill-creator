import * as p from '@clack/prompts';
import pc from 'picocolors';
import { SkillStore } from '../../storage/skill-store.js';
import { SkillIndex } from '../../storage/skill-index.js';
import { parseScope, getSkillsBasePath, type SkillScope } from '../../types/scope.js';

function createScopedStoreAndIndex(scope: SkillScope) {
  const skillsDir = getSkillsBasePath(scope);
  const skillStore = new SkillStore(skillsDir);
  const skillIndex = new SkillIndex(skillStore, skillsDir);
  return { skillStore, skillIndex, skillsDir };
}

export async function deleteCommand(args: string[]): Promise<number> {
  const scope = parseScope(args);
  const skillName = args.filter((a) => !a.startsWith('-'))[1];

  if (!skillName) {
    p.log.error('Usage: skill-creator delete <skill-name> [--project]');
    return 1;
  }

  const { skillStore: scopedStore } = createScopedStoreAndIndex(scope);
  const exists = await scopedStore.exists(skillName);
  if (!exists) {
    p.log.error(`Skill "${skillName}" not found at ${scope} scope.`);
    return 1;
  }

  const otherScope: SkillScope = scope === 'user' ? 'project' : 'user';
  const otherStore = new SkillStore(getSkillsBasePath(otherScope));
  const existsAtOther = await otherStore.exists(skillName);

  const confirmMsg = existsAtOther
    ? `Delete "${skillName}" from ${scope} scope? (${otherScope}-level version will become active)`
    : `Delete "${skillName}" from ${scope} scope?`;

  const confirm = await p.confirm({
    message: confirmMsg,
    initialValue: false,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.log.info('Deletion cancelled.');
    return 0;
  }

  await scopedStore.delete(skillName);

  if (existsAtOther) {
    p.log.success(`Deleted "${skillName}" from ${scope} scope.`);
    p.log.message(pc.dim(`The ${otherScope}-level version is now active.`));
  } else {
    p.log.success(`Deleted "${skillName}".`);
  }
  return 0;
}
