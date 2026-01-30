import * as p from '@clack/prompts';
import pc from 'picocolors';
import { SkillStore } from '../storage/skill-store.js';
import { validateSkillInput } from '../validation/skill-validation.js';
import type { SkillTrigger, SkillMetadata } from '../types/skill.js';

// Parse comma-separated string into array
function parseCommaSeparated(input: string | undefined): string[] {
  if (!input) return [];
  return input.split(',').map(s => s.trim()).filter(Boolean);
}

// Format triggers for preview display
function formatTriggerPreview(triggers: SkillTrigger | undefined): string {
  if (!triggers) return '  (none)';
  const lines: string[] = [];
  if (triggers.intents?.length) lines.push(`  intents: [${triggers.intents.join(', ')}]`);
  if (triggers.files?.length) lines.push(`  files: [${triggers.files.join(', ')}]`);
  if (triggers.contexts?.length) lines.push(`  contexts: [${triggers.contexts.join(', ')}]`);
  return lines.length ? lines.join('\n') : '  (none)';
}

// Suggest file patterns based on description keywords (CREATE-02)
function suggestFilePatterns(description: string): string {
  const lower = description.toLowerCase();
  const suggestions: string[] = [];
  if (lower.includes('typescript') || lower.includes(' ts ')) suggestions.push('*.ts', '*.tsx');
  if (lower.includes('javascript') || lower.includes(' js ')) suggestions.push('*.js', '*.jsx');
  if (lower.includes('test') || lower.includes('spec')) suggestions.push('*test*', '*spec*');
  if (lower.includes('react')) suggestions.push('*.tsx', '*.jsx');
  if (lower.includes('style') || lower.includes('css')) suggestions.push('*.css', '*.scss');
  return suggestions.join(', ');
}

export async function createSkillWorkflow(skillStore: SkillStore): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' Create a New Skill ')));

  // Step 1: Collect basic info
  const basicInfo = await p.group(
    {
      name: () =>
        p.text({
          message: 'Skill name:',
          placeholder: 'my-skill-name',
          validate: (value) => {
            if (!value) return 'Name is required';
            if (value.length > 64) return 'Name must be 64 characters or less';
            if (!/^[a-z0-9-]+$/.test(value)) {
              return 'Name must be lowercase letters, numbers, and hyphens only';
            }
          },
        }),
      description: () =>
        p.text({
          message: 'Description (what triggers this skill):',
          placeholder: 'Guide for working with TypeScript projects',
          validate: (value) => {
            if (!value) return 'Description is required';
            if (value.length > 1024) return 'Description must be 1024 characters or less';
          },
        }),
      enabled: () =>
        p.confirm({
          message: 'Enable this skill immediately?',
          initialValue: true,
        }),
    },
    {
      onCancel: () => {
        p.cancel('Skill creation cancelled');
        process.exit(0);
      },
    }
  );

  const { name, description, enabled } = basicInfo;

  // Step 2: Check if skill already exists
  const exists = await skillStore.exists(name);
  if (exists) {
    p.log.error(`Skill "${name}" already exists. Choose a different name.`);
    return;
  }

  // Step 3: Trigger configuration (optional)
  let triggers: SkillTrigger | undefined;

  const addTriggers = await p.confirm({
    message: 'Add trigger conditions?',
    initialValue: false,
  });

  if (p.isCancel(addTriggers)) {
    p.cancel('Skill creation cancelled');
    return;
  }

  if (addTriggers) {
    const suggestedPatterns = suggestFilePatterns(description);

    const triggerInfo = await p.group(
      {
        intents: () =>
          p.text({
            message: 'Intent patterns (comma-separated, optional):',
            placeholder: 'e.g., debug.*error, fix.*bug',
          }),
        files: () =>
          p.text({
            message: 'File patterns (comma-separated, optional):',
            placeholder: suggestedPatterns || 'e.g., *.ts, *.tsx, src/**/*.ts',
          }),
        contexts: () =>
          p.text({
            message: 'Context patterns (comma-separated, optional):',
            placeholder: 'e.g., in GSD planning, during refactoring',
          }),
      },
      {
        onCancel: () => {
          p.cancel('Skill creation cancelled');
          process.exit(0);
        },
      }
    );

    const intents = parseCommaSeparated(triggerInfo.intents as string | undefined);
    const files = parseCommaSeparated(triggerInfo.files as string | undefined);
    const contexts = parseCommaSeparated(triggerInfo.contexts as string | undefined);

    if (intents.length || files.length || contexts.length) {
      triggers = {};
      if (intents.length) triggers.intents = intents;
      if (files.length) triggers.files = files;
      if (contexts.length) triggers.contexts = contexts;
    }
  }

  // Step 4: Content
  const content = await p.text({
    message: 'Skill content (Markdown):',
    placeholder: '# Instructions\n\nDescribe what this skill does...',
    validate: (v) => {
      if (!v) return 'Content is required';
      // SKILL-05: Warn about absolute paths
      if (v.includes('/home/') || v.includes('/Users/') || v.includes('C:\\')) {
        return 'Avoid absolute paths - use relative paths or general patterns for portability';
      }
    },
  });

  if (p.isCancel(content)) {
    p.cancel('Skill creation cancelled');
    return;
  }

  // Step 5: Preview
  p.log.message(pc.bold('\n--- Preview ---'));
  p.log.message(`name: ${pc.cyan(name)}`);
  p.log.message(`description: ${description}`);
  p.log.message(`enabled: ${enabled ? pc.green('true') : pc.dim('false')}`);
  p.log.message(`triggers:\n${formatTriggerPreview(triggers)}`);
  p.log.message(pc.bold('---'));
  p.log.message(`Content:\n${pc.dim((content as string).slice(0, 200))}${(content as string).length > 200 ? '...' : ''}`);
  p.log.message(pc.bold('---------------\n'));

  // Step 6: Confirm
  const confirm = await p.confirm({
    message: 'Create this skill?',
    initialValue: true,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel('Skill creation cancelled');
    return;
  }

  // Step 7: Validate with Zod and save
  const s = p.spinner();
  s.start('Creating skill...');

  try {
    // Build metadata
    const metadata: SkillMetadata = {
      name,
      description,
      enabled,
    };
    if (triggers) {
      metadata.triggers = triggers;
    }

    // Validate with Zod for safety
    validateSkillInput(metadata);

    // Create skill
    await skillStore.create(name, metadata, content as string);

    s.stop('Skill created!');
    p.outro(`Skill "${name}" created at ${pc.cyan(`.claude/skills/${name}/SKILL.md`)}`);
  } catch (error) {
    s.stop('Failed to create skill');
    const message = error instanceof Error ? error.message : String(error);
    p.log.error(message);
  }
}
