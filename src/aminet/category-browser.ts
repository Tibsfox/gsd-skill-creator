/**
 * Category tree browser for navigating Aminet's hierarchical structure.
 *
 * Provides functions to build a category/subcategory tree from package
 * lists, filter by category, and narrow results by architecture or OS
 * version using .readme metadata.
 *
 * All functions are pure -- no side effects, no mutation.
 *
 * @module
 */

import type { AminetPackage, PackageReadme, CategoryNode, SubcategoryNode } from './types.js';

/**
 * Build a hierarchical category tree from a flat list of packages.
 *
 * Groups packages by category and subcategory, computing accurate counts
 * at both levels. Returns categories sorted alphabetically, each with
 * its subcategories also sorted alphabetically.
 *
 * Uses O(n) aggregation via nested Maps.
 *
 * @param packages - Flat array of AminetPackage entries
 * @returns Sorted array of CategoryNode with nested SubcategoryNode arrays
 */
export function buildCategoryTree(packages: AminetPackage[]): CategoryNode[] {
  // Map<category, Map<subcategory, count>>
  const categoryMap = new Map<string, Map<string, number>>();

  for (const pkg of packages) {
    let subMap = categoryMap.get(pkg.category);
    if (!subMap) {
      subMap = new Map<string, number>();
      categoryMap.set(pkg.category, subMap);
    }
    subMap.set(pkg.subcategory, (subMap.get(pkg.subcategory) ?? 0) + 1);
  }

  const nodes: CategoryNode[] = [];

  for (const [categoryName, subMap] of categoryMap) {
    const subcategories: SubcategoryNode[] = [];
    let totalCount = 0;

    for (const [subName, count] of subMap) {
      subcategories.push({
        name: subName,
        path: `${categoryName}/${subName}`,
        packageCount: count,
      });
      totalCount += count;
    }

    subcategories.sort((a, b) => a.name.localeCompare(b.name));

    nodes.push({
      name: categoryName,
      packageCount: totalCount,
      subcategories,
    });
  }

  nodes.sort((a, b) => a.name.localeCompare(b.name));

  return nodes;
}

/**
 * List packages within a specific category and optional subcategory.
 *
 * @param packages - Flat array of AminetPackage entries
 * @param category - Top-level category name (e.g., "game")
 * @param subcategory - Optional subcategory name (e.g., "shoot")
 * @returns Filtered array of matching packages
 */
export function listPackages(
  packages: AminetPackage[],
  category: string,
  subcategory?: string,
): AminetPackage[] {
  return packages.filter((pkg) => {
    if (pkg.category !== category) return false;
    if (subcategory !== undefined && pkg.subcategory !== subcategory) return false;
    return true;
  });
}

/**
 * Filter packages by hardware architecture using readme metadata.
 *
 * Packages whose readme lists the specified architecture in their
 * `architecture` array are included. Packages without a readme entry
 * in the index are also included (unknown architecture = show by default).
 *
 * @param packages - Flat array of AminetPackage entries
 * @param readmeIndex - Map from fullPath to PackageReadme
 * @param architecture - Architecture string to match (e.g., "m68k-amigaos")
 * @returns Filtered array of matching packages
 */
export function filterByArchitecture(
  packages: AminetPackage[],
  readmeIndex: Map<string, PackageReadme>,
  architecture: string,
): AminetPackage[] {
  return packages.filter((pkg) => {
    const readme = readmeIndex.get(pkg.fullPath);
    if (!readme) return true; // No readme = include by default
    return readme.architecture.includes(architecture);
  });
}

/**
 * Filter packages by OS version requirement using readme metadata.
 *
 * Packages whose readme `requires` array contains an item with the
 * specified OS version as a substring are included. Packages without
 * a readme entry are also included (unknown requirements = show by default).
 *
 * @param packages - Flat array of AminetPackage entries
 * @param readmeIndex - Map from fullPath to PackageReadme
 * @param osVersion - OS version substring to match (e.g., "OS 3.0")
 * @returns Filtered array of matching packages
 */
export function filterByOsVersion(
  packages: AminetPackage[],
  readmeIndex: Map<string, PackageReadme>,
  osVersion: string,
): AminetPackage[] {
  return packages.filter((pkg) => {
    const readme = readmeIndex.get(pkg.fullPath);
    if (!readme) return true; // No readme = include by default
    return readme.requires.some((req) => req.includes(osVersion));
  });
}
