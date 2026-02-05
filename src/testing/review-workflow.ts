/**
 * ReviewWorkflow for interactive test case review.
 *
 * Provides a UI for reviewing generated tests before saving:
 * - Tabular display of all generated tests
 * - Quick actions: accept-all, reject-all, review individually
 * - Multiselect for individual selection
 * - Inline editing of test prompts
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { GeneratedTest } from '../types/test-generation.js';

/**
 * Result of the review workflow.
 */
export interface ReviewResult {
  /**
   * Tests approved for saving.
   */
  approved: GeneratedTest[];

  /**
   * Tests rejected (not saved).
   */
  rejected: GeneratedTest[];

  /**
   * Indices of tests that were edited (within approved array).
   */
  edited: number[];

  /**
   * Whether the user cancelled the workflow.
   */
  cancelled: boolean;
}

/**
 * Interactive review workflow for generated test cases.
 *
 * Uses @clack/prompts for all interactions. Stateless - each call
 * to review() is independent.
 *
 * @example
 * ```typescript
 * const workflow = new ReviewWorkflow();
 * const result = await workflow.review(generatedTests, 'my-skill');
 *
 * if (!result.cancelled) {
 *   console.log(`Approved: ${result.approved.length}`);
 *   console.log(`Rejected: ${result.rejected.length}`);
 *   console.log(`Edited: ${result.edited.length}`);
 * }
 * ```
 */
export class ReviewWorkflow {
  /**
   * Review generated tests interactively.
   *
   * @param tests - Generated tests to review
   * @param skillName - Name of the skill (for display)
   * @returns Review result with approved/rejected tests
   */
  async review(tests: GeneratedTest[], skillName: string): Promise<ReviewResult> {
    // Display intro and test table
    p.intro(pc.bgCyan(pc.black(' Review Generated Tests ')));
    p.log.message(pc.dim(`Skill: ${skillName}`));
    p.log.message('');
    this.displayTestTable(tests);
    p.log.message('');

    // Quick action selection
    const quickAction = await p.select({
      message: 'What would you like to do?',
      options: [
        { value: 'review', label: 'Review individually', hint: 'Select/edit each test' },
        { value: 'accept-all', label: 'Accept all', hint: `Save all ${tests.length} tests` },
        { value: 'reject-all', label: 'Reject all', hint: 'Discard all' },
      ],
    });

    if (p.isCancel(quickAction)) {
      return { approved: [], rejected: tests, edited: [], cancelled: true };
    }

    // Handle quick actions
    if (quickAction === 'accept-all') {
      return { approved: tests, rejected: [], edited: [], cancelled: false };
    }
    if (quickAction === 'reject-all') {
      return { approved: [], rejected: tests, edited: [], cancelled: false };
    }

    // Individual review via multiselect
    const selected = await p.multiselect({
      message: 'Select tests to keep (space to toggle, enter to confirm):',
      options: tests.map((t, i) => ({
        value: i,
        label: this.truncate(t.prompt, 55),
        hint: `${t.expected} | ${t.source}`,
      })),
      initialValues: tests.map((_, i) => i), // All selected by default
      required: false,
    });

    if (p.isCancel(selected)) {
      return { approved: [], rejected: tests, edited: [], cancelled: true };
    }

    const selectedIndices = selected as number[];
    const approved = selectedIndices.map((i) => ({ ...tests[i] })); // Clone for editing
    const edited: number[] = [];

    // Offer edit for selected tests
    if (approved.length > 0) {
      const wantEdit = await p.confirm({
        message: `Edit any of the ${approved.length} selected tests?`,
        initialValue: false,
      });

      if (!p.isCancel(wantEdit) && wantEdit) {
        for (let i = 0; i < approved.length; i++) {
          const test = approved[i];
          p.log.message('');
          p.log.message(pc.dim(`Test ${i + 1}/${approved.length}:`));
          p.log.message(`  Current: ${test.prompt}`);

          const newPrompt = await p.text({
            message: 'Edit prompt (Enter to keep):',
            initialValue: test.prompt,
          });

          if (!p.isCancel(newPrompt) && newPrompt !== test.prompt) {
            approved[i] = { ...test, prompt: newPrompt };
            edited.push(i);
            p.log.success('Updated');
          }
        }
      }
    }

    // Return result
    const rejected = tests.filter((_, i) => !selectedIndices.includes(i));
    return { approved, rejected, edited, cancelled: false };
  }

  /**
   * Display a tabular summary of generated tests.
   */
  private displayTestTable(tests: GeneratedTest[]): void {
    const header = `${this.padEnd('Type', 10)} ${this.padEnd('Source', 12)} ${this.padEnd('Prompt', 58)}`;
    p.log.message(pc.dim(header));
    p.log.message(pc.dim('\u2500'.repeat(80)));

    for (const test of tests) {
      const type =
        test.expected === 'positive'
          ? pc.green(this.padEnd('positive', 10))
          : pc.red(this.padEnd('negative', 10));
      const source = pc.dim(this.padEnd(test.source, 12));
      const prompt = this.truncate(test.prompt, 58);

      p.log.message(`${type} ${source} ${prompt}`);
    }
  }

  /**
   * Truncate text with ellipsis.
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength - 3) + '...';
  }

  /**
   * Pad string to fixed length.
   */
  private padEnd(text: string, length: number): string {
    if (text.length >= length) {
      return text;
    }
    return text + ' '.repeat(length - text.length);
  }
}
