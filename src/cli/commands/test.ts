/**
 * CLI command for managing test cases for skill activation testing.
 *
 * Test cases define expected behavior: should the skill activate for
 * a given prompt? Supports both interactive prompts and flag-based modes.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  TestStore,
  TestRunner,
  ResultStore,
  ResultFormatter,
  TestGenerator,
  ReviewWorkflow,
  type TestCaseInput,
  type TestRunResult,
  type GeneratedTest,
  type GenerationResult,
} from '../../testing/index.js';
import { SkillStore } from '../../storage/skill-store.js';
import { parseScope, getSkillsBasePath, type SkillScope } from '../../types/scope.js';
import type { TestExpectation, TestDifficulty, TestCase } from '../../types/testing.js';
import { access } from 'fs/promises';
import { join } from 'path';

/**
 * Check if running in CI environment.
 */
function isCI(): boolean {
  return process.env.CI === 'true';
}

// ============================================================================
// Flag Parsing Helpers
// ============================================================================

/**
 * Parse a flag value from args.
 * Looks for --flag=value format.
 */
function parseFlag(args: string[], flag: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${flag}=`));
  if (arg) {
    return arg.slice(`--${flag}=`.length);
  }
  return undefined;
}

/**
 * Parse a numeric flag value from args.
 */
function parseNumericFlag(args: string[], flag: string): number | undefined {
  const value = parseFlag(args, flag);
  if (value !== undefined) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num;
    }
  }
  return undefined;
}

/**
 * Check if a boolean flag is present.
 */
function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some(
    (flag) => args.includes(`--${flag}`) || args.includes(`-${flag.charAt(0)}`)
  );
}

/**
 * Get non-flag arguments from args array.
 */
function getNonFlagArgs(args: string[]): string[] {
  return args.filter((a) => !a.startsWith('-'));
}

/**
 * Truncate text with ellipsis.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Pad string to fixed length.
 */
function padEnd(text: string, length: number): string {
  if (text.length >= length) {
    return text;
  }
  return text + ' '.repeat(length - text.length);
}

/**
 * Check if skill directory exists.
 */
async function skillExists(scope: SkillScope, skillName: string): Promise<boolean> {
  const basePath = getSkillsBasePath(scope);
  const skillPath = join(basePath, skillName);
  try {
    await access(skillPath);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Subcommand Handlers
// ============================================================================

/**
 * Handle 'test add <skill>' subcommand.
 */
async function handleAdd(args: string[], scope: SkillScope): Promise<number> {
  const nonFlagArgs = getNonFlagArgs(args);
  const skillName = nonFlagArgs[1];

  if (!skillName) {
    p.log.error('Usage: skill-creator test add <skill-name> [options]');
    p.log.message('');
    p.log.message('Options:');
    p.log.message('  --prompt="..."        Test prompt (required in flag mode)');
    p.log.message('  --expected=positive|negative|edge-case  Expected behavior');
    p.log.message('  --description="..."   Description of what test verifies');
    p.log.message('  --tags=tag1,tag2      Comma-separated tags');
    p.log.message('  --difficulty=easy|medium|hard  Test difficulty');
    p.log.message('  --min-confidence=0.8  Minimum confidence for positive tests');
    p.log.message('  --max-confidence=0.5  Maximum confidence for negative tests');
    p.log.message('  --reason="..."        Why skill should not activate (negative)');
    return 1;
  }

  // Check if skill exists
  const exists = await skillExists(scope, skillName);
  if (!exists) {
    p.log.warn(`Note: Skill '${pc.cyan(skillName)}' doesn't exist yet. Test will be saved anyway.`);
  }

  // Parse flags for direct mode
  const prompt = parseFlag(args, 'prompt');
  const expectedRaw = parseFlag(args, 'expected');
  const description = parseFlag(args, 'description');
  const tagsRaw = parseFlag(args, 'tags');
  const difficultyRaw = parseFlag(args, 'difficulty');
  const minConfidence = parseNumericFlag(args, 'min-confidence');
  const maxConfidence = parseNumericFlag(args, 'max-confidence');
  const reason = parseFlag(args, 'reason');

  let testPrompt: string;
  let expected: TestExpectation;
  let testDescription: string | undefined = description;
  let tags: string[] | undefined = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : undefined;
  let difficulty: TestDifficulty | undefined;
  let testMinConfidence: number | undefined = minConfidence;
  let testMaxConfidence: number | undefined = maxConfidence;
  let testReason: string | undefined = reason;

  // Validate expected value if provided
  if (expectedRaw) {
    if (!['positive', 'negative', 'edge-case'].includes(expectedRaw)) {
      p.log.error(`Invalid expected value: ${expectedRaw}`);
      p.log.message('Must be: positive, negative, or edge-case');
      return 1;
    }
    expected = expectedRaw as TestExpectation;
  }

  // Validate difficulty if provided
  if (difficultyRaw) {
    if (!['easy', 'medium', 'hard'].includes(difficultyRaw)) {
      p.log.error(`Invalid difficulty value: ${difficultyRaw}`);
      p.log.message('Must be: easy, medium, or hard');
      return 1;
    }
    difficulty = difficultyRaw as TestDifficulty;
  }

  // Check if we have required fields for direct mode
  const directMode = prompt !== undefined && expectedRaw !== undefined;

  if (directMode) {
    testPrompt = prompt;
  } else {
    // Interactive mode
    p.intro(pc.bgCyan(pc.black(' Add Test Case ')));
    p.log.message(pc.dim(`Skill: ${skillName} (${scope} scope)`));
    p.log.message('');

    // Prompt input
    const promptInput = await p.text({
      message: 'Test prompt:',
      placeholder: 'Full user scenario (e.g., "I made changes to auth, can you commit them?")',
      validate: (value) => {
        if (!value) return 'Prompt is required';
      },
    });

    if (p.isCancel(promptInput)) {
      p.cancel('Cancelled');
      return 0;
    }
    testPrompt = promptInput;

    // Expected behavior
    const expectedInput = await p.select({
      message: 'Expected behavior:',
      options: [
        { value: 'positive', label: 'Positive', hint: 'Skill SHOULD activate' },
        { value: 'negative', label: 'Negative', hint: 'Skill should NOT activate' },
        { value: 'edge-case', label: 'Edge Case', hint: 'Borderline scenario' },
      ],
    });

    if (p.isCancel(expectedInput)) {
      p.cancel('Cancelled');
      return 0;
    }
    expected = expectedInput as TestExpectation;

    // Description (optional)
    const descInput = await p.text({
      message: 'Description (optional):',
      placeholder: 'What does this test verify? (press Enter to skip)',
    });

    if (p.isCancel(descInput)) {
      p.cancel('Cancelled');
      return 0;
    }
    testDescription = descInput || undefined;

    // Tags (optional)
    const tagsInput = await p.text({
      message: 'Tags (optional, comma-separated):',
      placeholder: 'e.g., auth, regression, edge-case',
    });

    if (p.isCancel(tagsInput)) {
      p.cancel('Cancelled');
      return 0;
    }
    if (tagsInput) {
      tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    }

    // Difficulty (optional)
    const difficultyInput = await p.select({
      message: 'Difficulty (optional):',
      options: [
        { value: 'skip', label: 'Skip', hint: 'No difficulty set' },
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' },
      ],
    });

    if (p.isCancel(difficultyInput)) {
      p.cancel('Cancelled');
      return 0;
    }
    if (difficultyInput !== 'skip') {
      difficulty = difficultyInput as TestDifficulty;
    }

    // Confidence thresholds based on expected type
    if (expected === 'positive') {
      const minConfInput = await p.text({
        message: 'Minimum confidence threshold (optional):',
        placeholder: 'e.g., 0.8 (press Enter to skip)',
        validate: (value) => {
          if (value) {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 1) {
              return 'Must be a number between 0 and 1';
            }
          }
        },
      });

      if (p.isCancel(minConfInput)) {
        p.cancel('Cancelled');
        return 0;
      }
      if (minConfInput) {
        testMinConfidence = parseFloat(minConfInput);
      }
    } else if (expected === 'negative') {
      const maxConfInput = await p.text({
        message: 'Maximum confidence threshold (optional):',
        placeholder: 'e.g., 0.3 (press Enter to skip)',
        validate: (value) => {
          if (value) {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 1) {
              return 'Must be a number between 0 and 1';
            }
          }
        },
      });

      if (p.isCancel(maxConfInput)) {
        p.cancel('Cancelled');
        return 0;
      }
      if (maxConfInput) {
        testMaxConfidence = parseFloat(maxConfInput);
      }

      // Reason for negative tests
      const reasonInput = await p.text({
        message: 'Reason why skill should not activate (optional):',
        placeholder: 'e.g., "belongs to auth-skill", "too generic"',
      });

      if (p.isCancel(reasonInput)) {
        p.cancel('Cancelled');
        return 0;
      }
      testReason = reasonInput || undefined;
    }
  }

  // Build test case input
  const input: TestCaseInput = {
    prompt: testPrompt,
    expected: expected!,
    description: testDescription,
    tags: tags && tags.length > 0 ? tags : undefined,
    difficulty,
    minConfidence: testMinConfidence,
    maxConfidence: testMaxConfidence,
    reason: testReason,
  };

  // Create store and add test
  const store = new TestStore(scope);

  try {
    const test = await store.add(skillName, input);

    p.log.success(`Test case created: ${pc.dim(test.id.slice(0, 8))}`);
    p.log.message(`  Prompt: ${truncate(test.prompt, 50)}`);
    p.log.message(`  Expected: ${test.expected}`);
    if (test.tags && test.tags.length > 0) {
      p.log.message(`  Tags: ${test.tags.join(', ')}`);
    }

    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Check for specific error types
    if (message.includes('Duplicate test prompt')) {
      p.log.error('A test with this prompt already exists.');
    } else if (message.includes('Invalid test case input')) {
      p.log.error(message);
    } else {
      p.log.error(`Failed to add test: ${message}`);
    }

    return 1;
  }
}

/**
 * Handle 'test list <skill>' subcommand.
 */
async function handleList(args: string[], scope: SkillScope): Promise<number> {
  const nonFlagArgs = getNonFlagArgs(args);
  const skillName = nonFlagArgs[1];

  if (!skillName) {
    p.log.error('Usage: skill-creator test list <skill-name> [options]');
    p.log.message('');
    p.log.message('Options:');
    p.log.message('  --expected=positive|negative|edge-case  Filter by expected');
    p.log.message('  --tags=tag1,tag2      Filter by tags (match any)');
    p.log.message('  --json                Output as JSON');
    return 1;
  }

  const expectedFilter = parseFlag(args, 'expected') as TestExpectation | undefined;
  const tagsFilter = parseFlag(args, 'tags')?.split(',').map((t) => t.trim()).filter(Boolean);
  const jsonOutput = hasFlag(args, 'json');

  // Validate expected filter
  if (expectedFilter && !['positive', 'negative', 'edge-case'].includes(expectedFilter)) {
    p.log.error(`Invalid expected value: ${expectedFilter}`);
    p.log.message('Must be: positive, negative, or edge-case');
    return 1;
  }

  const store = new TestStore(scope);
  let tests = await store.list(skillName);

  // Apply filters
  if (expectedFilter) {
    tests = tests.filter((t) => t.expected === expectedFilter);
  }
  if (tagsFilter && tagsFilter.length > 0) {
    tests = tests.filter((t) => t.tags?.some((tag) => tagsFilter.includes(tag)));
  }

  // JSON output mode
  if (jsonOutput) {
    console.log(JSON.stringify(tests, null, 2));
    return 0;
  }

  // Check for empty results
  if (tests.length === 0) {
    const exists = await skillExists(scope, skillName);
    if (!exists) {
      p.log.info(`No tests found for '${pc.cyan(skillName)}' (skill doesn't exist yet).`);
    } else {
      p.log.info(`No tests found for '${pc.cyan(skillName)}'.`);
    }
    p.log.message(`Run ${pc.cyan(`skill-creator test add ${skillName}`)} to create one.`);
    return 0;
  }

  // Display header
  p.log.message('');
  p.log.message(pc.bold(`Tests for ${pc.cyan(skillName)} (${scope} scope):`));
  p.log.message('');

  // Table header
  const header = `${padEnd('ID', 10)} ${padEnd('Expected', 12)} ${padEnd('Prompt', 50)} ${padEnd('Tags', 20)}`;
  p.log.message(pc.dim(header));
  p.log.message(pc.dim('─'.repeat(92)));

  // Table rows
  for (const test of tests) {
    const id = pc.dim(test.id.slice(0, 8));
    const expected = test.expected === 'positive'
      ? pc.green(padEnd(test.expected, 12))
      : test.expected === 'negative'
        ? pc.red(padEnd(test.expected, 12))
        : pc.yellow(padEnd(test.expected, 12));
    const prompt = truncate(test.prompt, 50);
    const tags = test.tags?.join(', ') || pc.dim('-');

    p.log.message(`${padEnd(id, 10)} ${expected} ${padEnd(prompt, 50)} ${truncate(tags, 20)}`);
  }

  p.log.message('');
  p.log.message(pc.dim(`Total: ${tests.length} test${tests.length === 1 ? '' : 's'}`));

  return 0;
}

/**
 * Handle 'test edit <skill> <id>' subcommand.
 */
async function handleEdit(args: string[], scope: SkillScope): Promise<number> {
  const nonFlagArgs = getNonFlagArgs(args);
  const skillName = nonFlagArgs[1];
  const testId = nonFlagArgs[2];

  if (!skillName || !testId) {
    p.log.error('Usage: skill-creator test edit <skill-name> <test-id>');
    return 1;
  }

  const store = new TestStore(scope);

  // Find test by partial or full ID
  const tests = await store.list(skillName);
  const matchingTests = tests.filter(
    (t) => t.id === testId || t.id.startsWith(testId)
  );

  if (matchingTests.length === 0) {
    p.log.error(`Test '${testId}' not found for skill '${skillName}'.`);
    return 1;
  }

  if (matchingTests.length > 1) {
    p.log.error(`Multiple tests match '${testId}'. Please be more specific.`);
    return 1;
  }

  const test = matchingTests[0];

  p.intro(pc.bgCyan(pc.black(' Edit Test Case ')));
  p.log.message(pc.dim(`Skill: ${skillName}, Test: ${test.id.slice(0, 8)}`));
  p.log.message('');
  p.log.message(pc.dim('Current values (press Enter to keep):'));
  p.log.message('');

  // Edit prompt
  const promptInput = await p.text({
    message: 'Test prompt:',
    initialValue: test.prompt,
    validate: (value) => {
      if (!value) return 'Prompt is required';
    },
  });

  if (p.isCancel(promptInput)) {
    p.cancel('Cancelled');
    return 0;
  }

  // Edit expected
  const expectedInput = await p.select({
    message: 'Expected behavior:',
    initialValue: test.expected,
    options: [
      { value: 'positive', label: 'Positive', hint: 'Skill SHOULD activate' },
      { value: 'negative', label: 'Negative', hint: 'Skill should NOT activate' },
      { value: 'edge-case', label: 'Edge Case', hint: 'Borderline scenario' },
    ],
  });

  if (p.isCancel(expectedInput)) {
    p.cancel('Cancelled');
    return 0;
  }

  // Edit description
  const descInput = await p.text({
    message: 'Description:',
    initialValue: test.description || '',
    placeholder: 'Leave empty to clear',
  });

  if (p.isCancel(descInput)) {
    p.cancel('Cancelled');
    return 0;
  }

  // Edit tags
  const tagsInput = await p.text({
    message: 'Tags (comma-separated):',
    initialValue: test.tags?.join(', ') || '',
    placeholder: 'Leave empty to clear',
  });

  if (p.isCancel(tagsInput)) {
    p.cancel('Cancelled');
    return 0;
  }

  // Build updates
  const updates: Partial<TestCaseInput> = {
    prompt: promptInput,
    expected: expectedInput as TestExpectation,
    description: descInput || undefined,
    tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
  };

  try {
    const updated = await store.update(skillName, test.id, updates);

    if (updated) {
      p.log.success('Test case updated.');
      p.log.message(`  ID: ${pc.dim(updated.id.slice(0, 8))}`);
      p.log.message(`  Prompt: ${truncate(updated.prompt, 50)}`);
      p.log.message(`  Expected: ${updated.expected}`);
    } else {
      p.log.error('Test case not found (may have been deleted).');
      return 1;
    }

    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    p.log.error(`Failed to update test: ${message}`);
    return 1;
  }
}

/**
 * Handle 'test delete <skill> <id>' subcommand.
 */
async function handleDelete(args: string[], scope: SkillScope): Promise<number> {
  const nonFlagArgs = getNonFlagArgs(args);
  const skillName = nonFlagArgs[1];
  const testId = nonFlagArgs[2];
  const force = hasFlag(args, 'force', 'f');

  if (!skillName || !testId) {
    p.log.error('Usage: skill-creator test delete <skill-name> <test-id> [--force]');
    return 1;
  }

  const store = new TestStore(scope);

  // Find test by partial or full ID
  const tests = await store.list(skillName);
  const matchingTests = tests.filter(
    (t) => t.id === testId || t.id.startsWith(testId)
  );

  if (matchingTests.length === 0) {
    p.log.error(`Test '${testId}' not found for skill '${skillName}'.`);
    return 1;
  }

  if (matchingTests.length > 1) {
    p.log.error(`Multiple tests match '${testId}'. Please be more specific.`);
    return 1;
  }

  const test = matchingTests[0];

  // Confirm deletion unless --force
  if (!force) {
    p.log.message('');
    p.log.message(`Test: ${pc.dim(test.id.slice(0, 8))}`);
    p.log.message(`Prompt: ${truncate(test.prompt, 60)}`);
    p.log.message(`Expected: ${test.expected}`);
    p.log.message('');

    const confirm = await p.confirm({
      message: `Delete this test case?`,
      initialValue: false,
    });

    if (p.isCancel(confirm) || !confirm) {
      p.log.info('Deletion cancelled.');
      return 0;
    }
  }

  const deleted = await store.delete(skillName, test.id);

  if (deleted) {
    p.log.success(`Test case deleted: ${pc.dim(test.id.slice(0, 8))}`);
  } else {
    p.log.error('Test case not found (may have already been deleted).');
    return 1;
  }

  return 0;
}

/**
 * Handle 'test generate <skill>' subcommand.
 */
async function handleGenerate(args: string[], scope: SkillScope): Promise<number> {
  const nonFlagArgs = getNonFlagArgs(args);
  const skillName = nonFlagArgs[1];

  if (!skillName) {
    p.log.error('Usage: gsd-skill test generate <skill-name> [options]');
    p.log.message('');
    p.log.message('Options:');
    p.log.message('  --count=N       Number of tests to generate per type (default: 5)');
    p.log.message('  --no-review     Save all tests without review');
    p.log.message('  --no-llm        Skip LLM generation, use heuristic only');
    return 1;
  }

  const count = parseNumericFlag(args, 'count') ?? 5;
  const noReview = hasFlag(args, 'no-review');
  const noLLM = hasFlag(args, 'no-llm');

  // Validate count (per RESEARCH.md pitfall 6)
  if (count > 50) {
    p.log.error('Maximum count is 50 per type');
    return 1;
  }
  if (count < 1) {
    p.log.error('Count must be at least 1');
    return 1;
  }

  // Load skill to verify it exists and get description
  const basePath = getSkillsBasePath(scope);
  const skillStore = new SkillStore(basePath);
  const testStore = new TestStore(scope);

  let skill;
  try {
    skill = await skillStore.read(skillName);
  } catch {
    p.log.error(`Skill '${skillName}' not found in ${scope} scope`);
    return 1;
  }

  const skillInfo = {
    name: skillName,
    description: skill.metadata.description,
    // Extract "when to use" from body if present
    whenToUse: extractWhenToUse(skill.body),
  };

  // Generate tests
  p.intro(pc.bgCyan(pc.black(' Generate Test Cases ')));
  p.log.message(pc.dim(`Skill: ${skillName} (${scope} scope)`));
  p.log.message('');

  const generator = new TestGenerator(skillStore, scope);
  const llmAvailable = generator.getLLMAvailability();

  if (llmAvailable && !noLLM) {
    p.log.message(pc.green('LLM generation enabled (Claude Haiku)'));
  } else if (noLLM) {
    p.log.message(pc.yellow('LLM generation disabled (--no-llm)'));
  } else {
    p.log.message(pc.yellow('LLM not available, using heuristic generation'));
  }
  p.log.message('');

  const spin = p.spinner();
  spin.start(`Generating ${count} positive and ${count} negative tests...`);

  let result: GenerationResult;
  try {
    result = await generator.generate(skillInfo, {
      positiveCount: count,
      negativeCount: count,
      useLLM: !noLLM,
    });
  } catch (err) {
    spin.stop('Generation failed');
    const message = err instanceof Error ? err.message : String(err);
    p.log.error(message);
    return 1;
  }

  spin.stop(`Generated ${result.tests.length} tests`);

  // Show source breakdown (per RESEARCH.md pitfall 5)
  p.log.message(
    pc.dim(
      `Sources: ${result.sources.llm} LLM, ${result.sources.heuristic} heuristic, ${result.sources.crossSkill} cross-skill`
    )
  );

  // Show any warnings
  for (const warning of result.warnings) {
    p.log.warn(warning);
  }

  if (result.tests.length === 0) {
    p.log.warn('No tests generated');
    return 0;
  }

  // Review or save directly
  let testsToSave: GeneratedTest[];
  let editedCount = 0;

  if (noReview) {
    testsToSave = result.tests;
    p.log.message(pc.dim('Skipping review (--no-review)'));
  } else {
    const workflow = new ReviewWorkflow();
    const reviewResult = await workflow.review(result.tests, skillName);

    if (reviewResult.cancelled) {
      p.log.info('Generation cancelled');
      return 0;
    }

    testsToSave = reviewResult.approved;
    editedCount = reviewResult.edited.length;

    if (testsToSave.length === 0) {
      p.log.info('No tests selected for saving');
      return 0;
    }
  }

  // Save approved tests
  const saveSpin = p.spinner();
  saveSpin.start(`Saving ${testsToSave.length} tests...`);

  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const test of testsToSave) {
    try {
      const input: TestCaseInput = {
        prompt: test.prompt,
        expected: test.expected,
        description: test.description,
        reason: test.reason,
      };
      await testStore.add(skillName, input);
      added++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Duplicate test prompt')) {
        skipped++;
      } else {
        errors.push(message);
      }
    }
  }

  saveSpin.stop('Save complete');

  // Summary
  p.log.message('');
  p.log.success(`Added: ${added} tests`);
  if (skipped > 0) {
    p.log.warn(`Skipped: ${skipped} (duplicate prompts)`);
  }
  if (editedCount > 0) {
    p.log.message(pc.dim(`Edited: ${editedCount} tests modified before saving`));
  }
  if (errors.length > 0) {
    p.log.error(`Errors: ${errors.length}`);
    for (const err of errors) {
      p.log.message(pc.red(`  - ${err}`));
    }
  }

  return errors.length > 0 ? 1 : 0;
}

/**
 * Extract "when to use" text from skill body.
 * Looks for markdown headings like "## When to Use" or "### When to use"
 */
function extractWhenToUse(body: string): string | undefined {
  const match = body.match(/#+\s*when\s+to\s+use[:\s]*\n+([\s\S]*?)(?=\n#|\n\n\n|$)/i);
  if (match) {
    return match[1].trim();
  }
  return undefined;
}

/**
 * Handle 'test run <skill>' or 'test run --all' subcommand.
 */
async function handleRun(args: string[], scope: SkillScope): Promise<number> {
  const nonFlagArgs = getNonFlagArgs(args);
  const skillName = nonFlagArgs[1];
  const runAll = hasFlag(args, 'all', 'a');
  const verbose = hasFlag(args, 'verbose', 'v');
  const jsonModeRaw = parseFlag(args, 'json');
  const jsonMode = jsonModeRaw as 'compact' | 'pretty' | undefined;
  const threshold = parseNumericFlag(args, 'threshold');
  const minAccuracy = parseNumericFlag(args, 'min-accuracy');
  const maxFalsePositive = parseNumericFlag(args, 'max-false-positive');

  // Validate args
  if (!skillName && !runAll) {
    p.log.error('Usage: gsd-skill test run <skill-name> [options]');
    p.log.message('       gsd-skill test run --all [options]');
    p.log.message('');
    p.log.message('Options:');
    p.log.message('  --all, -a                Run tests for all skills');
    p.log.message('  --verbose, -v            Show confidence scores');
    p.log.message('  --json=compact|pretty    Output as JSON');
    p.log.message('  --threshold=N            Activation threshold (default: 0.75)');
    p.log.message('  --min-accuracy=N         Fail if accuracy below N%');
    p.log.message('  --max-false-positive=N   Fail if FPR above N%');
    return 1;
  }

  // Validate json mode if provided
  if (jsonModeRaw && !['compact', 'pretty'].includes(jsonModeRaw)) {
    p.log.error(`Invalid --json value: ${jsonModeRaw}`);
    p.log.message('Must be: compact or pretty');
    return 1;
  }

  // Auto-detect CI mode per CONTEXT.md
  const outputMode = jsonMode ?? (isCI() ? 'compact' : undefined);

  // Initialize stores
  const basePath = getSkillsBasePath(scope);
  const testStore = new TestStore(scope);
  const skillStore = new SkillStore(basePath);
  const resultStore = new ResultStore(scope);
  const formatter = new ResultFormatter();

  // Build list of skills to test
  let skillsToTest: string[] = [];
  if (runAll) {
    skillsToTest = await skillStore.list();
    if (skillsToTest.length === 0) {
      if (!outputMode) {
        p.log.warn(`No skills found in ${scope} scope`);
      }
      return 0;
    }
  } else {
    skillsToTest = [skillName];
  }

  // Run tests
  const runner = new TestRunner(testStore, skillStore, resultStore, scope);
  const allResults: TestRunResult[] = [];
  let hasFailures = false;

  const spin = outputMode ? null : p.spinner();
  spin?.start(`Running tests for ${skillsToTest.length} skill(s)...`);

  for (const skill of skillsToTest) {
    try {
      // Check if skill has tests
      const testCount = await testStore.count(skill);
      if (testCount === 0) {
        if (!outputMode) {
          spin?.stop(`No tests for ${skill}`);
          p.log.warn(`Skipping ${skill}: no test cases`);
          spin?.start(`Running tests...`);
        }
        continue;
      }

      spin?.message(`Testing ${skill}...`);

      const result = await runner.runForSkill(skill, {
        threshold: threshold ?? 0.75,
        storeResults: true,
      });

      // Regression detection: compare to previous run (before this one)
      // Note: The current run is already stored, so we need the second-to-last entry
      // For now, we'll get the latest and compare if it exists from a prior session
      if (!outputMode) {
        const history = await resultStore.list(skill);
        // If more than one entry, previous run is the second-to-last
        if (history.length > 1) {
          const previousRun = history[history.length - 2];
          const accuracyDiff = result.metrics.accuracy - previousRun.metrics.accuracy;
          if (accuracyDiff < -5) {
            spin?.stop('');
            p.log.warn(
              pc.yellow(`Regression detected for ${skill}: accuracy dropped ${Math.abs(accuracyDiff).toFixed(1)}% `) +
              pc.dim(`(${previousRun.metrics.accuracy.toFixed(1)}% -> ${result.metrics.accuracy.toFixed(1)}%)`)
            );
            spin?.start('Running tests...');
          } else if (accuracyDiff > 5) {
            spin?.stop('');
            p.log.success(
              pc.green(`Improvement for ${skill}: accuracy increased ${accuracyDiff.toFixed(1)}% `) +
              pc.dim(`(${previousRun.metrics.accuracy.toFixed(1)}% -> ${result.metrics.accuracy.toFixed(1)}%)`)
            );
            spin?.start('Running tests...');
          }
        }
      }

      allResults.push(result);

      if (result.metrics.failed > 0) {
        hasFailures = true;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!outputMode) {
        spin?.stop('');
        p.log.error(`Error testing ${skill}: ${message}`);
        spin?.start('Running tests...');
      }
      hasFailures = true;
    }
  }

  spin?.stop(hasFailures ? 'Tests completed with failures' : 'Tests completed');

  // Output results
  if (outputMode) {
    // JSON output
    for (const result of allResults) {
      console.log(formatter.formatJSON(result, outputMode));
    }
  } else {
    // Terminal output
    for (const result of allResults) {
      console.log(formatter.formatTerminal(result, { verbose, showHints: true }));
    }
  }

  // Check threshold flags (CI integration per CONTEXT.md)
  let exitCode = hasFailures ? 1 : 0;

  if (allResults.length > 0) {
    // Aggregate metrics for threshold checks
    const totalAccuracy = allResults.reduce((sum, r) => sum + r.metrics.accuracy, 0) / allResults.length;
    const totalFPR = allResults.reduce((sum, r) => sum + r.metrics.falsePositiveRate, 0) / allResults.length;

    if (minAccuracy !== undefined && totalAccuracy < minAccuracy) {
      if (!outputMode) {
        p.log.error(`Accuracy ${totalAccuracy.toFixed(1)}% below minimum ${minAccuracy}%`);
      }
      exitCode = 1;
    }

    if (maxFalsePositive !== undefined && totalFPR > maxFalsePositive) {
      if (!outputMode) {
        p.log.error(`False positive rate ${totalFPR.toFixed(1)}% exceeds maximum ${maxFalsePositive}%`);
      }
      exitCode = 1;
    }
  }

  return exitCode;
}

/**
 * Show help for the test command.
 */
function showTestHelp(): void {
  console.log(`
gsd-skill test - Manage skill test cases

Usage:
  gsd-skill test <subcommand> [options]

Subcommands:
  add <skill>            Add a test case (interactive or flags)
  list <skill>           List test cases for a skill
  ls <skill>             Alias for list
  run <skill>            Run tests for a skill
  run --all              Run tests for all skills
  edit <skill> <id>      Edit an existing test case
  delete <skill> <id>    Delete a test case
  rm <skill> <id>        Alias for delete
  generate <skill>       Generate test cases automatically
  gen <skill>            Alias for generate

Test Add Options:
  --prompt="..."         Test prompt
  --expected=VALUE       Expected behavior: positive, negative, edge-case
  --description="..."    Description of what test verifies
  --tags=tag1,tag2       Comma-separated tags
  --difficulty=VALUE     Test difficulty: easy, medium, hard
  --min-confidence=N     Minimum confidence for positive tests (0-1)
  --max-confidence=N     Maximum confidence for negative tests (0-1)
  --reason="..."         Why skill should not activate (negative tests)

Test List Options:
  --expected=VALUE       Filter by expected behavior
  --tags=tag1,tag2       Filter by tags (match any)
  --json                 Output as JSON

Test Run Options:
  --all, -a              Run tests for all skills
  --verbose, -v          Show confidence scores on all results
  --json=compact|pretty  Output as JSON (auto-detected in CI)
  --threshold=N          Activation threshold (default: 0.75)
  --min-accuracy=N       Fail if accuracy below N%
  --max-false-positive=N Fail if FPR above N%

Test Delete Options:
  --force, -f            Skip confirmation prompt

Test Generate Options:
  --count=N              Tests per type (default: 5, max: 50)
  --no-review            Save all tests without review
  --no-llm               Skip LLM, use heuristic only

Scope Options:
  --project, -p          Use project scope (.claude/skills/)
                         Default is user scope (~/.claude/skills/)

Examples:
  gsd-skill test add my-skill
  gsd-skill test add my-skill --prompt="commit changes" --expected=positive
  gsd-skill test list my-skill
  gsd-skill test list my-skill --expected=negative --json
  gsd-skill test run my-skill
  gsd-skill test run my-skill --verbose
  gsd-skill test run --all --json=compact
  gsd-skill test run my-skill --min-accuracy=90 --max-false-positive=5
  skill-creator test edit my-skill abc123
  skill-creator test delete my-skill abc123 --force
  gsd-skill test generate my-skill
  gsd-skill test generate my-skill --count=10
  gsd-skill test generate my-skill --no-review
`);
}

// ============================================================================
// Main Command Handler
// ============================================================================

/**
 * Main entry point for the test command.
 *
 * @param args - Command-line arguments after 'test'
 * @returns Exit code (0 for success)
 */
export async function testCommand(args: string[]): Promise<number> {
  const scope = parseScope(['test', ...args]);
  const subcommand = args[0];

  switch (subcommand) {
    case 'add':
      return handleAdd(args, scope);

    case 'list':
    case 'ls':
      return handleList(args, scope);

    case 'run':
      return handleRun(args, scope);

    case 'edit':
      return handleEdit(args, scope);

    case 'delete':
    case 'rm':
      return handleDelete(args, scope);

    case 'generate':
    case 'gen':
      return handleGenerate(args, scope);

    case 'help':
    case '--help':
    case '-h':
      showTestHelp();
      return 0;

    case undefined:
      showTestHelp();
      return 0;

    default:
      p.log.error(`Unknown subcommand: ${subcommand}`);
      p.log.message('');
      showTestHelp();
      return 1;
  }
}
