/**
 * MCP template generator orchestrator.
 *
 * Validates configuration, routes to the correct template generator,
 * writes all files to disk, and returns a structured result.
 *
 * @module mcp/templates/generator
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { McpProjectConfigSchema } from './types.js';
import type { McpProjectConfig, TemplateFile, GeneratorResult } from './types.js';
import { generateServerFiles } from './server-template.js';
import { generateHostFiles } from './host-template.js';
import { generateClientFiles } from './client-template.js';

/**
 * Generate a complete MCP project from a template configuration.
 *
 * Validates the config, generates all template files, writes them to disk
 * under `outputDir/config.name/`, and returns a result with timing and errors.
 *
 * @param config - Project configuration (validated with Zod)
 * @param outputDir - Parent directory where the project folder will be created
 * @returns Generator result with files, timing, and errors
 */
export async function generateMcpProject(
  config: McpProjectConfig,
  outputDir: string,
): Promise<GeneratorResult> {
  const startTime = performance.now();
  const errors: string[] = [];

  // Step 1: Validate configuration
  const parseResult = McpProjectConfigSchema.safeParse(config);
  if (!parseResult.success) {
    const validationErrors = parseResult.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    return {
      files: [],
      projectDir: join(outputDir, config.name ?? 'unknown'),
      generationTimeMs: performance.now() - startTime,
      errors: validationErrors,
    };
  }

  const validConfig = parseResult.data;
  const projectDir = join(outputDir, validConfig.name);

  // Step 2: Generate files based on template type
  let files: TemplateFile[];
  switch (validConfig.template) {
    case 'server':
      files = generateServerFiles(validConfig);
      break;
    case 'host':
      files = generateHostFiles(validConfig);
      break;
    case 'client':
      files = generateClientFiles(validConfig);
      break;
    default: {
      const _exhaustive: never = validConfig.template;
      return {
        files: [],
        projectDir,
        generationTimeMs: performance.now() - startTime,
        errors: [`Unknown template type: ${String(_exhaustive)}`],
      };
    }
  }

  // Step 3: Write files to disk
  for (const file of files) {
    const filePath = join(projectDir, file.relativePath);
    try {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, file.content, 'utf-8');
    } catch (err) {
      errors.push(
        `Failed to write ${file.relativePath}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return {
    files,
    projectDir,
    generationTimeMs: performance.now() - startTime,
    errors,
  };
}
