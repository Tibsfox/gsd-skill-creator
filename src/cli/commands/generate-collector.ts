/**
 * CLI command for generating read-only collector agents.
 *
 * Creates a collector agent markdown file that gathers information
 * without modifying anything. Uses CollectorAgentGenerator from
 * capabilities barrel.
 *
 * Usage: skill-creator generate-collector <name> <description> <purpose>
 *
 * Flags:
 * - --output-dir=DIR: Output directory (default: .claude/agents)
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { CollectorAgentGenerator } from '../../capabilities/index.js';

// ============================================================================
// Types
// ============================================================================

export interface GenerateCollectorOptions {
  /** Output directory override (for testing) */
  outputDir?: string;
}

// ============================================================================
// Main Command
// ============================================================================

/**
 * Generate a read-only collector agent.
 *
 * @param args - CLI arguments: [name, description, purpose, ...flags]
 * @param options - Optional configuration (for testing)
 * @returns Exit code (0 success, 1 error)
 */
export async function generateCollectorCommand(
  args: string[],
  options?: GenerateCollectorOptions,
): Promise<number> {
  // Parse --output-dir flag
  const outputDirArg = args.find(a => a.startsWith('--output-dir='));
  const outputDir = options?.outputDir
    ?? (outputDirArg ? outputDirArg.split('=')[1] : '.claude/agents');

  // Filter out flags to get positional args
  const positional = args.filter(a => !a.startsWith('-'));

  const name = positional[0];
  const description = positional[1];
  const purpose = positional[2];

  if (!name || !description || !purpose) {
    p.log.error('Usage: skill-creator generate-collector <name> <description> <purpose> [--output-dir=DIR]');
    return 1;
  }

  p.intro(pc.bgCyan(pc.black(' Collector Agent Generator ')));

  // Default gather instructions if none provided
  const gatherInstructions = [
    'Scan the target directory or files',
    'Extract relevant information',
    'Organize findings by category',
  ];

  // Generate the collector agent
  const generator = new CollectorAgentGenerator(outputDir);
  const result = generator.generate({
    name,
    description,
    purpose,
    gatherInstructions,
    outputFormat: 'Return findings as a structured markdown report.',
  });

  // Write to disk
  try {
    await mkdir(dirname(result.filePath), { recursive: true });
    await writeFile(result.filePath, result.content, 'utf-8');
  } catch (err) {
    p.log.error(`Failed to write file: ${(err as Error).message}`);
    return 1;
  }

  // Report result
  if (result.valid) {
    p.log.success(pc.green(`Created collector agent: ${result.name}`));
  } else {
    p.log.warn(`Created collector agent with warnings: ${result.name}`);
    for (const error of result.validationErrors) {
      p.log.message(pc.yellow(`  Warning: ${error}`));
    }
  }

  p.log.message(`  File: ${result.filePath}`);
  p.log.message(pc.dim(`  Tools: ${['Read', 'Glob', 'Grep', 'WebFetch'].join(', ')}`));

  p.outro('Done.');
  return 0;
}
