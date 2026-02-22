/**
 * MCP template system types and Zod schemas.
 *
 * Defines the configuration, file output, and result types used by all three
 * template generators (server, host, client) and the generator orchestrator.
 *
 * @module mcp/templates/types
 */

import { z } from 'zod';

// ============================================================================
// Template type enumeration
// ============================================================================

/** The three MCP project template types. */
export const McpTemplateTypeSchema = z.enum(['server', 'host', 'client']);

/** MCP project template type. */
export type McpTemplateType = z.infer<typeof McpTemplateTypeSchema>;

// ============================================================================
// Project configuration
// ============================================================================

/** Configuration for generating an MCP project from a template. */
export const McpProjectConfigSchema = z.object({
  /** Project name (used in package.json, server name, bin name). */
  name: z.string().min(1).regex(/^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/, {
    message: 'Name must be a valid npm package name (lowercase, no spaces)',
  }),

  /** Human-readable project description. */
  description: z.string().min(1).default('An MCP project'),

  /** Semantic version string. */
  version: z.string().default('0.1.0'),

  /** Template type to generate. */
  template: McpTemplateTypeSchema,

  /** Optional author name for package.json. */
  author: z.string().optional(),

  /** Default transport type for the generated project. */
  transport: z.enum(['stdio', 'streamable-http']).default('stdio'),
});

/** Configuration for generating an MCP project from a template. */
export type McpProjectConfig = z.infer<typeof McpProjectConfigSchema>;

// ============================================================================
// Generated file representation
// ============================================================================

/** A single file to be written by the generator. */
export interface TemplateFile {
  /** Relative path from project root (e.g. "src/server.ts"). */
  relativePath: string;

  /** File content as a string. */
  content: string;
}

// ============================================================================
// Generator result
// ============================================================================

/** Result from generateMcpProject. */
export interface GeneratorResult {
  /** All files that were written. */
  files: TemplateFile[];

  /** Absolute path to the generated project directory. */
  projectDir: string;

  /** Time taken to generate all files in milliseconds. */
  generationTimeMs: number;

  /** Any errors encountered during generation. */
  errors: string[];
}
