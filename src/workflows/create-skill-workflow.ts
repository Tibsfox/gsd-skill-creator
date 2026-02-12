import * as p from '@clack/prompts';
import pc from 'picocolors';
import matter from 'gray-matter';
import { SkillStore } from '../storage/skill-store.js';
import { validateSkillInput, suggestFixedName, validateDescriptionQuality } from '../validation/skill-validation.js';
import { ReservedNameValidator } from '../validation/reserved-names.js';
import { BudgetValidator, formatBudgetDisplay } from '../validation/budget-validation.js';
import { detectArguments, detectPreprocessing, checkInjectionRisk, suggestArgumentHint } from '../validation/arguments-validation.js';
import { ContentAnalyzer, WORD_THRESHOLD_WARNING } from '../disclosure/index.js';
import type { SkillTrigger, SkillMetadata } from '../types/skill.js';
import type { GsdSkillCreatorExtension, ForceOverrideReservedName, ForceOverrideBudget } from '../types/extensions.js';
import type { SkillScope } from '../types/scope.js';
import { getSkillsBasePath } from '../types/scope.js';

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

export async function createSkillWorkflow(
  skillStore: SkillStore,
  scope: SkillScope = 'user'
): Promise<void> {
  const scopePath = getSkillsBasePath(scope);
  const scopeLabel = scope === 'user' ? 'user-level' : 'project-level';
  p.intro(pc.bgCyan(pc.black(` Create a New Skill (${scopeLabel}) `)));
  p.log.message(pc.dim(`Target: ${scopePath}`));
  p.log.message('');

  // Step 1: Collect basic info
  const basicInfo = await p.group(
    {
      name: () =>
        p.text({
          message: 'Skill name:',
          placeholder: 'my-skill-name (lowercase, numbers, hyphens)',
          validate: (value) => {
            if (!value) return 'Name is required';

            // Check for specific issues and provide suggestions
            const suggestion = suggestFixedName(value);

            if (value.length > 64) {
              return suggestion
                ? `Max 64 characters. Suggestion: ${suggestion}`
                : 'Max 64 characters';
            }

            if (/[A-Z]/.test(value)) {
              return suggestion
                ? `Use lowercase. Suggestion: ${suggestion}`
                : 'Use lowercase letters only';
            }

            if (value.startsWith('-')) {
              return suggestion
                ? `Cannot start with hyphen. Suggestion: ${suggestion}`
                : 'Cannot start with hyphen';
            }

            if (value.endsWith('-')) {
              return suggestion
                ? `Cannot end with hyphen. Suggestion: ${suggestion}`
                : 'Cannot end with hyphen';
            }

            if (value.includes('--')) {
              return suggestion
                ? `Cannot have consecutive hyphens. Suggestion: ${suggestion}`
                : 'Cannot have consecutive hyphens';
            }

            // Catch-all for other invalid characters (underscores, spaces, etc.)
            if (!/^[a-z0-9-]+$/.test(value)) {
              return suggestion
                ? `Only lowercase letters, numbers, and hyphens. Suggestion: ${suggestion}`
                : 'Only lowercase letters, numbers, and hyphens allowed';
            }
          },
        }),
      description: () =>
        p.text({
          message: 'Description (what triggers this skill):',
          placeholder: 'Guides X workflow. Use when working with Y or Z.',
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

  // Check description quality and show warning if needed
  const descQuality = validateDescriptionQuality(description);
  if (!descQuality.hasActivationTriggers) {
    p.log.warn('');
    p.log.warn(pc.yellow('Description may not activate reliably.'));
    p.log.message(pc.dim('Tip: Add "Use when..." to specify activation triggers.'));
    if (descQuality.suggestions && descQuality.suggestions.length > 0) {
      p.log.message(pc.dim(`Example: "${descQuality.suggestions[2]}"`));
    }
    p.log.message('');
  }

  // Step 2: Check if skill already exists
  const exists = await skillStore.exists(name);
  if (exists) {
    p.log.error(`Skill "${name}" already exists at ${scope} scope. Choose a different name.`);
    return;
  }

  // Check for conflict at other scope
  const otherScope: SkillScope = scope === 'user' ? 'project' : 'user';
  const otherStore = new SkillStore(getSkillsBasePath(otherScope));
  const existsAtOther = await otherStore.exists(name);
  if (existsAtOther) {
    const precedenceNote = scope === 'user'
      ? 'The project-level version will take precedence.'
      : 'This will override the user-level version.';

    p.log.warn(`Skill "${name}" already exists at ${otherScope} scope.`);
    p.log.message(pc.dim(precedenceNote));

    const continueAnyway = await p.confirm({
      message: 'Create anyway?',
      initialValue: true,
    });

    if (p.isCancel(continueAnyway) || !continueAnyway) {
      p.cancel('Skill creation cancelled');
      return;
    }
  }

  // Step 2.5: Check if name is reserved
  let forceOverrideData: ForceOverrideReservedName | undefined;
  const validator = await ReservedNameValidator.load();
  const reservedCheck = validator.isReserved(name);

  if (reservedCheck.reserved && reservedCheck.entry) {
    const alternatives = validator.suggestAlternatives(name);

    p.log.error(`Cannot use "${name}" as skill name: ${reservedCheck.entry.reason}.`);
    p.log.message('');

    // Category-specific explanation
    const explanations: Record<string, string> = {
      'built-in-commands': 'This name is used by Claude Code for a built-in slash command.',
      'agent-types': 'This name is reserved for a built-in Claude Code agent type.',
      'system-skills': 'This name is reserved for a Claude Code system feature.',
    };
    p.log.message(explanations[reservedCheck.entry.category] ?? 'This name is reserved.');

    if (alternatives.length > 0) {
      p.log.message('');
      p.log.message('Suggested alternatives:');
      alternatives.forEach(alt => p.log.message(`  - ${alt}`));
    }

    p.log.message('');
    p.log.message(pc.dim('See: https://code.claude.com/docs/en/skills#naming'));
    p.log.message('');

    // Ask if user wants to force-override (power user escape hatch)
    const forceOverride = await p.confirm({
      message: 'Override and use this name anyway? (Not recommended)',
      initialValue: false,
    });

    if (p.isCancel(forceOverride) || !forceOverride) {
      p.cancel('Skill creation cancelled - choose a different name.');
      return;
    }

    // User chose to force - show prominent warning
    p.log.warn('');
    p.log.warn(pc.bold(pc.yellow('WARNING: Using reserved name may cause conflicts with Claude Code.')));
    p.log.warn(pc.yellow('This skill may not work correctly or may break other features.'));
    p.log.warn('');

    // Track force-override for future reference
    forceOverrideData = {
      reservedName: name,
      category: reservedCheck.entry.category,
      reason: reservedCheck.entry.reason,
      overrideDate: new Date().toISOString(),
    };
  }

  // Step 2.7: Check cumulative budget before proceeding
  let forceOverrideBudgetData: ForceOverrideBudget | undefined;
  const budgetValidator = BudgetValidator.load();
  const cumulativeCheck = await budgetValidator.checkCumulative(getSkillsBasePath(scope));

  if (cumulativeCheck.severity === 'warning' || cumulativeCheck.severity === 'error') {
    p.log.warn(`Budget warning: ${cumulativeCheck.usagePercent.toFixed(0)}% of cumulative limit used`);
    p.log.message(formatBudgetDisplay(cumulativeCheck));
    p.log.message('');

    if (cumulativeCheck.severity === 'error') {
      p.log.error('Adding a new skill may exceed Claude Code\'s character budget.');
      p.log.message('Some skills may be hidden by Claude Code if the budget is exceeded.');
      p.log.message('');

      const forceOverride = await p.confirm({
        message: 'Continue anyway? (Not recommended)',
        initialValue: false,
      });

      if (p.isCancel(forceOverride) || !forceOverride) {
        p.cancel('Skill creation cancelled - reduce skill sizes first.');
        return;
      }
    }
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

  // Step 4.1: Detect $ARGUMENTS and suggest argument-hint (SPEC-02)
  let argumentHint: string | undefined;
  const contentStr = content as string;
  const argDetection = detectArguments(contentStr);

  if (argDetection.found) {
    const suggestedHint = suggestArgumentHint(contentStr);
    const hintInput = await p.text({
      message: 'Skill uses $ARGUMENTS. Add an argument hint for autocomplete?',
      placeholder: suggestedHint ?? 'e.g., file-path or search-term',
      initialValue: suggestedHint ?? '',
    });

    if (!p.isCancel(hintInput) && hintInput) {
      argumentHint = hintInput as string;
    }
  }

  // Step 4.2: Check for injection risk (SPEC-07)
  const injectionRisk = checkInjectionRisk(contentStr);
  if (injectionRisk.risk === 'high') {
    p.log.error('');
    p.log.error(pc.bold(pc.red('SECURITY WARNING: This skill uses $ARGUMENTS inside !command preprocessing.')));
    p.log.error(pc.red('User-supplied arguments could execute arbitrary shell commands.'));
    p.log.error(pc.red('Consider separating $ARGUMENTS from shell command context.'));
    p.log.error('');
  }

  // Step 4.3: Detect preprocessing commands (SPEC-03)
  const preprocessing = detectPreprocessing(contentStr);
  if (preprocessing.found) {
    p.log.info(`Detected preprocessing commands: ${preprocessing.commands.join(', ')}`);
    p.log.message(pc.dim('These will run before Claude sees the skill content.'));

    // Suggest compatibility field for required tools
    const toolNames = preprocessing.commands
      .map(cmd => cmd.split(/\s+/)[0])
      .filter((v, i, a) => a.indexOf(v) === i); // deduplicate
    if (toolNames.length > 0) {
      p.log.message(pc.dim(`Consider adding compatibility: "Requires ${toolNames.join(', ')} CLI"`));
    }
  }

  // Step 4.4: Progressive disclosure analysis (DISC-01/DISC-02)
  const contentAnalyzer = new ContentAnalyzer();
  const disclosureAnalysis = contentAnalyzer.analyzeContent(contentStr);

  if (disclosureAnalysis.exceedsWarning) {
    // >5000 words: show warning suggesting split
    p.log.warn('');
    p.log.warn(pc.yellow(`This skill is very large (${disclosureAnalysis.wordCount.toLocaleString()} words). Consider splitting into a progressive disclosure structure.`));
    p.log.warn(pc.yellow(`Skills over ${WORD_THRESHOLD_WARNING.toLocaleString()} words may impact Claude's context window.`));
    p.log.warn('');
  } else if (disclosureAnalysis.exceedsDecompose && disclosureAnalysis.sections.length > 1) {
    // >2000 words with multiple sections: inform about auto-decomposition
    const refCount = disclosureAnalysis.sections.length - 1; // First section stays inline
    const scriptCount = disclosureAnalysis.deterministicOps.length;
    p.log.message('');
    p.log.message(pc.cyan('This skill will be auto-decomposed into SKILL.md + references/ for better token management.'));
    const parts: string[] = [];
    if (refCount > 0) parts.push(`${refCount} section${refCount > 1 ? 's' : ''} will be extracted to references/`);
    if (scriptCount > 0) parts.push(`${scriptCount} script${scriptCount > 1 ? 's' : ''} will be extracted to scripts/`);
    if (parts.length > 0) {
      p.log.message(pc.dim(parts.join('. ') + '.'));
    }
    p.log.message('');
  }

  // Step 4.5: Check single skill budget with actual content
  const skillContent = matter.stringify(content as string, {
    name,
    description,
  });
  const singleCheck = budgetValidator.checkSingleSkill(skillContent.length);

  if (singleCheck.severity === 'error') {
    p.log.error(`Skill exceeds character budget (${singleCheck.charCount.toLocaleString()} chars)`);
    p.log.message(`Budget: ${singleCheck.budget.toLocaleString()} characters`);
    if (singleCheck.suggestions) {
      p.log.message('');
      p.log.message('To fix:');
      singleCheck.suggestions.forEach(s => p.log.message(`  - ${s}`));
    }
    p.log.message('');

    const forceOverride = await p.confirm({
      message: 'Create anyway? (Skill may be hidden by Claude Code)',
      initialValue: false,
    });

    if (p.isCancel(forceOverride) || !forceOverride) {
      p.cancel('Skill creation cancelled - reduce content size.');
      return;
    }

    // Track force-override
    forceOverrideBudgetData = {
      charCount: singleCheck.charCount,
      budgetLimit: singleCheck.budget,
      usagePercent: singleCheck.usagePercent,
      overrideDate: new Date().toISOString(),
    };

    p.log.warn('');
    p.log.warn(pc.bold(pc.yellow('WARNING: Creating over-budget skill.')));
    p.log.warn(pc.yellow('This skill may be hidden or truncated by Claude Code.'));
    p.log.warn('');
  } else if (singleCheck.severity === 'warning') {
    p.log.warn(`Budget warning: ${singleCheck.usagePercent.toFixed(0)}% of character budget used`);
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
    // Build extension data
    const ext: GsdSkillCreatorExtension = {
      enabled,
    };
    if (triggers) {
      ext.triggers = triggers;
    }
    if (forceOverrideData) {
      ext.forceOverrideReservedName = forceOverrideData;
    }
    if (forceOverrideBudgetData) {
      ext.forceOverrideBudget = forceOverrideBudgetData;
    }

    // Build metadata with proper nested structure
    const metadata: SkillMetadata = {
      name,
      description,
      metadata: {
        extensions: {
          'gsd-skill-creator': ext,
        },
      },
    };

    // Add argument-hint if detected (SPEC-02)
    if (argumentHint) {
      metadata['argument-hint'] = argumentHint;
    }

    // Validate with Zod for safety
    validateSkillInput(metadata);

    // Determine if decomposition is needed
    const needsDecomposition = disclosureAnalysis.exceedsDecompose && disclosureAnalysis.sections.length > 1;

    // Create skill (with or without progressive disclosure)
    if (needsDecomposition) {
      await skillStore.createWithDisclosure(name, metadata, content as string);
    } else {
      await skillStore.create(name, metadata, content as string);
    }

    s.stop('Skill created!');
    const targetPath = scope === 'user'
      ? `~/.claude/skills/${name}/SKILL.md`
      : `.claude/skills/${name}/SKILL.md`;

    // Show file structure if decomposition happened
    if (needsDecomposition) {
      p.log.message('');
      p.log.message(pc.bold('Created file structure:'));
      p.log.message(`  ${targetPath}`);
      const refCount = disclosureAnalysis.sections.length - 1;
      if (refCount > 0) {
        const refDir = scope === 'user'
          ? `~/.claude/skills/${name}/references/`
          : `.claude/skills/${name}/references/`;
        p.log.message(`  ${refDir} (${refCount} file${refCount > 1 ? 's' : ''})`);
      }
      const scriptCount = disclosureAnalysis.deterministicOps.length;
      if (scriptCount > 0) {
        const scriptDir = scope === 'user'
          ? `~/.claude/skills/${name}/scripts/`
          : `.claude/skills/${name}/scripts/`;
        p.log.message(`  ${scriptDir} (${scriptCount} file${scriptCount > 1 ? 's' : ''})`);
      }
      p.log.message('');
    }

    p.outro(`Skill "${name}" created at ${pc.cyan(targetPath)}`);
  } catch (error) {
    s.stop('Failed to create skill');
    const message = error instanceof Error ? error.message : String(error);
    p.log.error(message);
  }
}
