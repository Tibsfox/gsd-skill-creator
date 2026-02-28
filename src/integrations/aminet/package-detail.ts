/**
 * Package detail builder -- merges INDEX, .readme, and mirror state.
 *
 * Produces a unified PackageDetail object for display in the package
 * detail view. The builder is a pure function with no side effects:
 * it takes an AminetPackage (from INDEX), an optional PackageReadme
 * (from .readme parsing), and an optional MirrorEntry (from mirror
 * state), and returns a single flat object with all relevant fields.
 *
 * @module
 */

import type {
  AminetPackage,
  PackageReadme,
  MirrorEntry,
  PackageDetail,
} from './types.js';

/**
 * Build a unified package detail view from its component data sources.
 *
 * @param pkg - Package metadata from the Aminet INDEX
 * @param readme - Parsed .readme content, or null if unavailable
 * @param mirrorEntry - Mirror state entry, or undefined if not mirrored
 * @returns A flat PackageDetail combining all available information
 */
export function buildPackageDetail(
  pkg: AminetPackage,
  readme: PackageReadme | null,
  mirrorEntry: MirrorEntry | undefined,
): PackageDetail {
  return {
    // INDEX fields -- always present
    filename: pkg.filename,
    directory: pkg.directory,
    category: pkg.category,
    subcategory: pkg.subcategory,
    sizeKb: pkg.sizeKb,
    ageDays: pkg.ageDays,
    description: pkg.description,
    fullPath: pkg.fullPath,

    // Readme fields -- nullable when readme is absent
    author: readme?.author ?? null,
    version: readme?.version ?? null,
    requires: readme?.requires ?? [],
    architecture: readme?.architecture ?? [],
    longDescription: readme?.description ?? null,

    // Mirror status -- defaults to 'not-mirrored' when no entry exists
    mirrorStatus: mirrorEntry?.status ?? 'not-mirrored',
  };
}
