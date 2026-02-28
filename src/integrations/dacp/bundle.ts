/**
 * DACP bundle filesystem layout and creation utilities.
 *
 * Bundles are directory-based structures containing:
 *   manifest.json  - Bundle metadata and content manifest
 *   intent.md      - Human-readable intent description
 *   data/          - Structured JSON data files
 *   code/          - Executable scripts with provenance
 *   .complete      - Atomicity marker (written last)
 *
 * The .complete marker ensures consumers never read a partially-written
 * bundle. Creation always writes .complete last; readers always check
 * for .complete first.
 *
 * @module dacp/bundle
 */

import { mkdir, writeFile, readFile, readdir, stat, access } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { formatTimestamp } from '../den/encoder.js';
import { BundleManifestSchema } from './types.js';
import type { BundleManifest } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Size limits for bundle contents (in bytes). */
export const MAX_DATA_SIZE = 50 * 1024;    // 50KB total for data/ directory
export const MAX_SCRIPT_SIZE = 10 * 1024;  // 10KB per script in code/
export const MAX_MANIFEST_SIZE = 10 * 1024; // 10KB for manifest.json
export const MAX_INTENT_SIZE = 20 * 1024;  // 20KB for intent.md
export const MAX_BUNDLE_SIZE = 100 * 1024; // 100KB total bundle size

/**
 * Bundle directory layout specification.
 * Defines required and optional files/directories within a bundle.
 */
export const BUNDLE_LAYOUT = {
  required: {
    files: ['manifest.json', 'intent.md', '.complete'] as const,
    dirs: ['data', 'code'] as const,
  },
  optional: {
    dirs: ['data/fixtures', 'code/helpers', 'tests'] as const,
  },
} as const;

// ============================================================================
// Types
// ============================================================================

/** Options for creating a new bundle directory. */
export interface CreateBundleOptions {
  /** Directory where the bundle directory will be created */
  outputDir: string;
  /** Message priority (0-7) */
  priority: number;
  /** GSD bus operation code */
  opcode: string;
  /** Source agent identifier */
  sourceAgent: string;
  /** Target agent identifier */
  targetAgent: string;
  /** Bundle manifest (validated with Zod before writing) */
  manifest: BundleManifest;
  /** Human-readable intent markdown */
  intentMarkdown: string;
  /** Data files to include: filename -> JSON string content */
  dataFiles?: Record<string, string>;
  /** Code files to include: filename -> script content */
  codeFiles?: Record<string, string>;
  /** Optional timestamp (defaults to current time) */
  timestamp?: Date;
}

/** Structured listing of bundle directory contents. */
export interface BundleContents {
  /** Whether the bundle has a .complete marker */
  complete: boolean;
  /** Whether manifest.json exists */
  hasManifest: boolean;
  /** Whether intent.md exists */
  hasIntent: boolean;
  /** Filenames in data/ directory */
  dataFiles: string[];
  /** Filenames in code/ directory */
  codeFiles: string[];
  /** All files in the bundle root (excluding subdirectories) */
  rootFiles: string[];
}

// ============================================================================
// Bundle naming
// ============================================================================

/**
 * Generate a deterministic bundle directory name.
 *
 * Format: {priority}-{YYYYMMDD-HHMMSS}-{opcode}-{src}-{dst}.bundle
 *
 * @param priority - Message priority (0-7)
 * @param opcode - Bus operation code (uppercase)
 * @param src - Source agent identifier
 * @param dst - Target agent identifier
 * @param timestamp - Optional timestamp (defaults to current time)
 * @returns Bundle directory name
 */
export function generateBundleName(
  priority: number,
  opcode: string,
  src: string,
  dst: string,
  timestamp?: Date,
): string {
  const ts = formatTimestamp(timestamp ?? new Date());
  return `${priority}-${ts}-${opcode}-${src}-${dst}.bundle`;
}

// ============================================================================
// Bundle creation
// ============================================================================

/**
 * Create a DACP bundle directory with all required files.
 *
 * Writes files in this order for atomicity:
 * 1. Create bundle directory
 * 2. Write manifest.json
 * 3. Write intent.md
 * 4. Create data/ and write data files (if provided)
 * 5. Create code/ and write code files (if provided)
 * 6. Write .complete marker LAST
 *
 * @param options - Bundle creation options
 * @returns Full path to the created bundle directory
 * @throws Error if manifest validation fails or size limits are exceeded
 */
export async function createBundle(options: CreateBundleOptions): Promise<string> {
  // Validate manifest with Zod before writing anything
  const validatedManifest = BundleManifestSchema.parse(options.manifest);

  // Generate bundle directory name and full path
  const bundleName = generateBundleName(
    options.priority,
    options.opcode,
    options.sourceAgent,
    options.targetAgent,
    options.timestamp,
  );
  const bundlePath = join(options.outputDir, bundleName);

  // Serialize and check sizes
  const manifestJson = JSON.stringify(validatedManifest, null, 2);
  if (Buffer.byteLength(manifestJson, 'utf8') > MAX_MANIFEST_SIZE) {
    throw new Error(`Manifest exceeds ${MAX_MANIFEST_SIZE} byte limit`);
  }

  if (Buffer.byteLength(options.intentMarkdown, 'utf8') > MAX_INTENT_SIZE) {
    throw new Error(`Intent markdown exceeds ${MAX_INTENT_SIZE} byte limit`);
  }

  // Check data files total size
  if (options.dataFiles) {
    let totalDataSize = 0;
    for (const content of Object.values(options.dataFiles)) {
      totalDataSize += Buffer.byteLength(content, 'utf8');
    }
    if (totalDataSize > MAX_DATA_SIZE) {
      throw new Error(`Data files total (${totalDataSize} bytes) exceeds ${MAX_DATA_SIZE} byte limit`);
    }
  }

  // Check individual code file sizes
  if (options.codeFiles) {
    for (const [filename, content] of Object.entries(options.codeFiles)) {
      const size = Buffer.byteLength(content, 'utf8');
      if (size > MAX_SCRIPT_SIZE) {
        throw new Error(`Script "${filename}" (${size} bytes) exceeds ${MAX_SCRIPT_SIZE} byte limit`);
      }
    }
  }

  // Check total bundle size
  let totalSize = Buffer.byteLength(manifestJson, 'utf8')
    + Buffer.byteLength(options.intentMarkdown, 'utf8');
  if (options.dataFiles) {
    for (const content of Object.values(options.dataFiles)) {
      totalSize += Buffer.byteLength(content, 'utf8');
    }
  }
  if (options.codeFiles) {
    for (const content of Object.values(options.codeFiles)) {
      totalSize += Buffer.byteLength(content, 'utf8');
    }
  }
  if (totalSize > MAX_BUNDLE_SIZE) {
    throw new Error(`Total bundle size (${totalSize} bytes) exceeds ${MAX_BUNDLE_SIZE} byte limit`);
  }

  // Step 1: Create bundle directory
  await mkdir(bundlePath, { recursive: true });

  // Step 2: Write manifest.json
  await writeFile(join(bundlePath, 'manifest.json'), manifestJson, 'utf8');

  // Step 3: Write intent.md
  await writeFile(join(bundlePath, 'intent.md'), options.intentMarkdown, 'utf8');

  // Step 4: Create data/ and write data files
  const dataDir = join(bundlePath, 'data');
  await mkdir(dataDir, { recursive: true });
  if (options.dataFiles) {
    for (const [filename, content] of Object.entries(options.dataFiles)) {
      await writeFile(join(dataDir, filename), content, 'utf8');
    }
  }

  // Step 5: Create code/ and write code files
  const codeDir = join(bundlePath, 'code');
  await mkdir(codeDir, { recursive: true });
  if (options.codeFiles) {
    for (const [filename, content] of Object.entries(options.codeFiles)) {
      await writeFile(join(codeDir, filename), content, 'utf8');
    }
  }

  // Step 6: Write .complete marker LAST for atomicity
  await writeFile(join(bundlePath, '.complete'), '', 'utf8');

  return bundlePath;
}

// ============================================================================
// Bundle introspection
// ============================================================================

/**
 * Check whether a bundle directory has a .complete atomicity marker.
 *
 * @param bundlePath - Path to the bundle directory
 * @returns true if .complete exists, false otherwise
 */
export async function isBundleComplete(bundlePath: string): Promise<boolean> {
  try {
    await access(join(bundlePath, '.complete'));
    return true;
  } catch {
    return false;
  }
}

/**
 * List the contents of a bundle directory as a structured object.
 *
 * @param bundlePath - Path to the bundle directory
 * @returns Structured listing of bundle contents
 */
export async function listBundleContents(bundlePath: string): Promise<BundleContents> {
  const rootEntries = await readdir(bundlePath, { withFileTypes: true });

  const rootFiles = rootEntries
    .filter((e) => e.isFile())
    .map((e) => e.name);

  let dataFiles: string[] = [];
  try {
    const dataEntries = await readdir(join(bundlePath, 'data'), { withFileTypes: true });
    dataFiles = dataEntries.filter((e) => e.isFile()).map((e) => e.name);
  } catch {
    // data/ directory may not exist
  }

  let codeFiles: string[] = [];
  try {
    const codeEntries = await readdir(join(bundlePath, 'code'), { withFileTypes: true });
    codeFiles = codeEntries.filter((e) => e.isFile()).map((e) => e.name);
  } catch {
    // code/ directory may not exist
  }

  return {
    complete: rootFiles.includes('.complete'),
    hasManifest: rootFiles.includes('manifest.json'),
    hasIntent: rootFiles.includes('intent.md'),
    dataFiles,
    codeFiles,
    rootFiles,
  };
}
