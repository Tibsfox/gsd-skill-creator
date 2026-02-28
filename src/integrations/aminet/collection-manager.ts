/**
 * Collection manager for CRUD operations on custom Aminet collections.
 *
 * Provides functions to create, read, update, and delete user-curated
 * collections stored as YAML files. All file writes use atomic
 * write-then-rename to prevent corruption. All functions take a
 * collectionsDir parameter for dependency injection (no global state).
 *
 * @module
 */

import {
  readFileSync,
  writeFileSync,
  renameSync,
  readdirSync,
  unlinkSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { importCollection, exportCollection } from './collection.js';
import type { CollectionManifest, CollectionEntry } from './types.js';

/**
 * Slugify a string for use as a filename.
 *
 * Lowercases, replaces spaces and special characters with hyphens,
 * collapses multiple hyphens, and trims leading/trailing hyphens.
 *
 * @param name - Human-readable name to slugify
 * @returns URL/filename-safe slug
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Write content to a file atomically using write-then-rename.
 *
 * Writes to a temporary .tmp file first, then renames to the final
 * path. This ensures the target file is never in a partially-written
 * state.
 *
 * @param filePath - Final destination path
 * @param content - Content to write
 */
function atomicWrite(filePath: string, content: string): void {
  const tmpPath = filePath + '.tmp';
  writeFileSync(tmpPath, content, 'utf-8');
  renameSync(tmpPath, filePath);
}

/**
 * Get the YAML file path for a collection name within a directory.
 *
 * @param collectionsDir - Directory containing collection YAML files
 * @param name - Slugified collection name (without .yaml extension)
 * @returns Full file path
 */
function collectionPath(collectionsDir: string, name: string): string {
  return join(collectionsDir, `${name}.yaml`);
}

/**
 * Create a new custom collection.
 *
 * Creates a CollectionManifest with version 1, current ISO timestamps,
 * and the provided packages (or empty array). The manifest is written
 * atomically to a YAML file with a slugified filename.
 *
 * @param collectionsDir - Directory to store the collection file
 * @param name - Human-readable collection name
 * @param description - Description of the collection
 * @param packages - Optional initial package entries
 * @returns The created CollectionManifest
 */
export function createCollection(
  collectionsDir: string,
  name: string,
  description: string,
  packages: CollectionEntry[] = [],
): CollectionManifest {
  const now = new Date().toISOString();
  const manifest: CollectionManifest = {
    name,
    description,
    version: 1,
    createdAt: now,
    updatedAt: now,
    packages,
  };

  if (!existsSync(collectionsDir)) {
    mkdirSync(collectionsDir, { recursive: true });
  }

  const slug = slugify(name);
  const yaml = exportCollection(manifest);
  atomicWrite(collectionPath(collectionsDir, slug), yaml);

  return manifest;
}

/**
 * Save a CollectionManifest to disk atomically.
 *
 * Serializes the manifest to YAML and writes it using write-then-rename.
 *
 * @param collectionsDir - Directory containing collection YAML files
 * @param name - Slugified collection name (without .yaml extension)
 * @param manifest - The manifest to persist
 */
export function saveCollection(
  collectionsDir: string,
  name: string,
  manifest: CollectionManifest,
): void {
  const yaml = exportCollection(manifest);
  atomicWrite(collectionPath(collectionsDir, name), yaml);
}

/**
 * Load a CollectionManifest from disk.
 *
 * Reads the YAML file and validates it via importCollection.
 *
 * @param collectionsDir - Directory containing collection YAML files
 * @param name - Slugified collection name (without .yaml extension)
 * @returns Validated CollectionManifest
 * @throws Error if the file doesn't exist or fails validation
 */
export function loadCollection(
  collectionsDir: string,
  name: string,
): CollectionManifest {
  const filePath = collectionPath(collectionsDir, name);
  const content = readFileSync(filePath, 'utf-8');
  return importCollection(content);
}

/**
 * List all collection names in a directory.
 *
 * Reads the directory, filters for .yaml files, strips the extension,
 * and returns the names sorted alphabetically.
 *
 * @param collectionsDir - Directory containing collection YAML files
 * @returns Sorted array of collection names (without .yaml extension)
 */
export function listCollections(collectionsDir: string): string[] {
  if (!existsSync(collectionsDir)) {
    return [];
  }
  const entries = readdirSync(collectionsDir);
  return entries
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.replace(/\.yaml$/, ''))
    .sort();
}

/**
 * Add a package entry to a collection.
 *
 * Loads the collection, checks for duplicate fullPath, adds the entry
 * if new, updates the timestamp, and saves. Returns the updated manifest.
 *
 * @param collectionsDir - Directory containing collection YAML files
 * @param name - Slugified collection name
 * @param entry - CollectionEntry to add
 * @returns Updated CollectionManifest
 */
export function addPackage(
  collectionsDir: string,
  name: string,
  entry: CollectionEntry,
): CollectionManifest {
  const manifest = loadCollection(collectionsDir, name);
  const isDuplicate = manifest.packages.some(
    (p) => p.fullPath === entry.fullPath,
  );
  if (!isDuplicate) {
    manifest.packages.push(entry);
    manifest.updatedAt = new Date().toISOString();
  }
  saveCollection(collectionsDir, name, manifest);
  return manifest;
}

/**
 * Remove a package from a collection by fullPath.
 *
 * Loads the collection, filters out the matching entry, updates the
 * timestamp, and saves. If the fullPath is not found, this is a no-op.
 *
 * @param collectionsDir - Directory containing collection YAML files
 * @param name - Slugified collection name
 * @param fullPath - Aminet full path to remove (e.g., "util/dir/DOpus550.lha")
 * @returns Updated CollectionManifest
 */
export function removePackage(
  collectionsDir: string,
  name: string,
  fullPath: string,
): CollectionManifest {
  const manifest = loadCollection(collectionsDir, name);
  const originalLength = manifest.packages.length;
  manifest.packages = manifest.packages.filter(
    (p) => p.fullPath !== fullPath,
  );
  if (manifest.packages.length !== originalLength) {
    manifest.updatedAt = new Date().toISOString();
  }
  saveCollection(collectionsDir, name, manifest);
  return manifest;
}

/**
 * Delete a collection from disk.
 *
 * Removes the YAML file from the collections directory. Throws if the
 * collection does not exist.
 *
 * @param collectionsDir - Directory containing collection YAML files
 * @param name - Slugified collection name
 * @throws Error if the collection file does not exist
 */
export function deleteCollection(
  collectionsDir: string,
  name: string,
): void {
  const filePath = collectionPath(collectionsDir, name);
  if (!existsSync(filePath)) {
    throw new Error(`Collection not found: "${name}"`);
  }
  unlinkSync(filePath);
}

/**
 * Get all package fullPath strings from a collection.
 *
 * Returns an array of fullPath values suitable for feeding to
 * bulkDownload(). Empty collections return an empty array.
 *
 * @param collectionsDir - Directory containing collection YAML files
 * @param name - Slugified collection name
 * @returns Array of Aminet full path strings
 */
export function getCollectionPaths(
  collectionsDir: string,
  name: string,
): string[] {
  const manifest = loadCollection(collectionsDir, name);
  return manifest.packages.map((p) => p.fullPath);
}
