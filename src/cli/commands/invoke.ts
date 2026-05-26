import { createApplicationContext } from '../../index.js';

export async function invokeCommand(args: string[]): Promise<number> {
  const skillName = args[1];

  if (!skillName) {
    console.log('Usage: skill-creator invoke <skill-name>');
    console.log('');
    console.log('Manually invoke a skill and load it into the session.');
    console.log('');
    console.log('Examples:');
    console.log('  skill-creator invoke typescript-patterns');
    console.log('  skill-creator i react-hooks');
    return 0;
  }

  const { applicator } = createApplicationContext();
  await applicator.initialize();

  const result = await applicator.invoke(skillName);

  if (result.success) {
    console.log(`Skill '${skillName}' loaded successfully.`);
    console.log('');
    console.log('Token usage:', result.loadResult?.tokenCount ?? 'cached');
    console.log('Remaining budget:', result.loadResult?.remainingBudget ?? 'n/a');
    console.log('');
    console.log('Content preview:');
    console.log('─'.repeat(40));
    const preview = result.content?.slice(0, 500) ?? '';
    console.log(preview + (result.content && result.content.length > 500 ? '...' : ''));
    return 0;
  }

  console.error(`Failed to invoke skill: ${result.error}`);
  if (result.loadResult?.reason === 'budget_exceeded') {
    console.log('');
    console.log('Tip: Clear some active skills or increase the token budget.');
  }
  return 1;
}
