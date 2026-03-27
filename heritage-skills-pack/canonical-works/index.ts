/**
 * Canonical Works Library — typed access module.
 *
 * Provides loader functions and lookup utilities for the three tradition
 * catalogs (Appalachian/Foxfire, First Nations, Inuit), fair use notice
 * templates, and room/tradition-based filtering.
 *
 * Creator-first purchase links are the primary ethical commitment of this
 * module: all Foxfire catalog entries prioritize foxfire.org, and Indigenous
 * catalogs prioritize Indigenous-owned publishers (Inhabit Media, ITK, etc.).
 *
 * Nation context enrichment: getWorksByTradition() enriches Indigenous works
 * with nation reference metadata from the Northern Ways module, enabling
 * callers to surface nation-specific heritage skill relevance and seasonal
 * patterns alongside each work.
 *
 * @module heritage-skills-pack/canonical-works
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllNationReferences } from '../northern-ways/index.js';
import type { CanonicalWork, Tradition, RoomNumber } from '../shared/types.js';

// Resolve __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Public Interfaces ─────────────────────────────────────────────────────────

/**
 * Fair use notice template for a given tradition.
 *
 * Used by the Bibliography Engine (Plan 05) to generate attributed
 * citations that comply with 17 U.S.C. § 107 and, for Indigenous
 * traditions, OCAP® and NISR frameworks.
 */
export interface FairUseNotice {
  /** Tradition this notice applies to. */
  tradition: string;
  /** Template string with {work_title}, {authors}, {additional_notes},
   *  and {creator_link} placeholders. */
  noticeTemplate: string;
  /** Additional notes dictionary for each fair-use factor. */
  additionalNotes: Record<string, string>;
  /** Statement directing learners to purchase from creators. */
  creatorSupportStatement: string;
  /** Cultural sovereignty statement (Indigenous traditions only). */
  culturalSovereigntyStatement?: string;
  /** OCAP® compliance note (Indigenous traditions only). */
  ocapComplianceNote?: string;
  /** Community consultation acknowledgment (Indigenous traditions only). */
  communityConsultationAcknowledgment?: string;
}

/**
 * A canonical work enriched with nation context from Northern Ways.
 *
 * For First Nations and Inuit works, nationContext is populated from
 * loadAllNationReferences() in the northern-ways module, providing
 * heritage skill relevance and seasonal patterns for relevant nations.
 * Appalachian works do not receive nationContext.
 */
export interface CanonicalWorkWithNationContext extends CanonicalWork {
  /**
   * For Indigenous traditions: nation metadata from northern-ways used
   * to select and rank sources. Populated by getWorksByTradition for
   * first-nations and inuit traditions only.
   */
  nationContext?: {
    nationId: string;
    nationName: string;
    heritageSkillRelevance: string[];
    seasonalPattern: string;
  }[];
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Read and parse a JSON file relative to this module's directory.
 * Throws a descriptive error if the file is missing or invalid JSON.
 */
function readJSON<T>(relativePath: string): T {
  const fullPath = join(__dirname, relativePath);
  let raw: string;
  try {
    raw = readFileSync(fullPath, 'utf-8');
  } catch (err) {
    throw new Error(`Canonical Works: failed to read '${fullPath}': ${String(err)}`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(`Canonical Works: invalid JSON in '${fullPath}': ${String(err)}`);
  }
}

// ─── Catalog Loaders ──────────────────────────────────────────────────────────

/**
 * Load the Foxfire canonical works catalog.
 *
 * Contains the 12-volume Foxfire series plus specialty titles.
 * All entries have creator-first purchase links with foxfire.org at priority 1.
 *
 * @returns Array of CanonicalWork entries for the Appalachian tradition.
 */
export function loadFoxfireCatalog(): CanonicalWork[] {
  const catalog = readJSON<CanonicalWork[]>('foxfire-catalog.json');
  if (!Array.isArray(catalog)) {
    throw new Error('Canonical Works: foxfire-catalog.json must be a JSON array');
  }
  return catalog;
}

/**
 * Load the First Nations canonical works catalog.
 *
 * Contains published works with community authorization or academic
 * cooperation. All entries have communityEndorsement metadata.
 *
 * @returns Array of CanonicalWork entries for the First Nations tradition.
 */
export function loadFirstNationsCatalog(): CanonicalWork[] {
  const catalog = readJSON<CanonicalWork[]>('first-nations-catalog.json');
  if (!Array.isArray(catalog)) {
    throw new Error('Canonical Works: first-nations-catalog.json must be a JSON array');
  }
  return catalog;
}

/**
 * Load the Inuit canonical works catalog.
 *
 * Contains ITK publications, Inhabit Media books, Government of Nunavut
 * educational materials, and community-authorized sources.
 *
 * @returns Array of CanonicalWork entries for the Inuit tradition.
 */
export function loadInuitCatalog(): CanonicalWork[] {
  const catalog = readJSON<CanonicalWork[]>('inuit-catalog.json');
  if (!Array.isArray(catalog)) {
    throw new Error('Canonical Works: inuit-catalog.json must be a JSON array');
  }
  return catalog;
}

/**
 * Load all canonical works from all three tradition catalogs combined.
 *
 * @returns Combined array of all CanonicalWork entries.
 */
export function loadAllCatalogs(): CanonicalWork[] {
  return [
    ...loadFoxfireCatalog(),
    ...loadFirstNationsCatalog(),
    ...loadInuitCatalog(),
  ];
}

// ─── Fair Use Notices ─────────────────────────────────────────────────────────

/**
 * Load the fair use notice template for a given tradition.
 *
 * Appalachian notice: standard fair use template with foxfire.org support statement.
 * Indigenous notices: include OCAP® compliance notes and cultural sovereignty statements.
 *
 * @param tradition - The tradition to load the notice for.
 * @returns The FairUseNotice for the given tradition.
 * @throws Error if the tradition is not one of 'appalachian', 'first-nations', 'inuit'.
 */
export function loadFairUseNotice(tradition: Tradition | string): FairUseNotice {
  const fileMap: Record<string, string> = {
    appalachian: 'fair-use-notices/appalachian-fair-use.json',
    'first-nations': 'fair-use-notices/first-nations-fair-use.json',
    inuit: 'fair-use-notices/inuit-fair-use.json',
  };
  const filePath = fileMap[tradition as string];
  if (!filePath) {
    throw new Error(
      `Canonical Works: no fair use notice for tradition '${String(tradition)}'. ` +
      `Valid traditions: ${Object.keys(fileMap).join(', ')}`,
    );
  }
  return readJSON<FairUseNotice>(filePath);
}

// ─── Lookup Functions ─────────────────────────────────────────────────────────

/**
 * Get all canonical works relevant to a given room number.
 *
 * Checks both:
 * 1. `volumeRefs[].relevantRooms` for multi-volume series entries
 * 2. `relevantRooms` top-level field for standalone works
 *
 * @param room - The room number to filter by.
 * @returns All CanonicalWork entries that include the given room number.
 */
export function getWorksByRoom(room: RoomNumber | number): CanonicalWork[] {
  const all = loadAllCatalogs();
  return all.filter(work => {
    // Check volumeRefs.relevantRooms for series works
    if (work.volumeRefs && work.volumeRefs.length > 0) {
      const inVolumes = work.volumeRefs.some(
        vr => Array.isArray(vr.relevantRooms) && vr.relevantRooms.includes(room as RoomNumber),
      );
      if (inVolumes) return true;
    }
    // Check top-level relevantRooms for standalone works
    const topLevel = (work as CanonicalWork & { relevantRooms?: number[] }).relevantRooms;
    if (Array.isArray(topLevel) && topLevel.includes(room as number)) {
      return true;
    }
    return false;
  });
}

/**
 * Get all canonical works for a given tradition, enriched with nation context
 * for Indigenous traditions.
 *
 * For 'first-nations' and 'inuit' traditions, each returned work is enriched
 * with a `nationContext` array from the Northern Ways nation reference data.
 * Nation entries are filtered to those with a seasonal pattern appropriate
 * for the tradition (woodland/subarctic for First Nations, arctic for Inuit).
 *
 * For 'appalachian', works are returned without nationContext enrichment.
 *
 * @param tradition - The tradition to filter and enrich by.
 * @returns Array of CanonicalWorkWithNationContext entries for the tradition.
 */
export function getWorksByTradition(tradition: Tradition | string): CanonicalWorkWithNationContext[] {
  const all = loadAllCatalogs();
  const filtered = all.filter(w => w.tradition === tradition);

  if (tradition === 'first-nations' || tradition === 'inuit') {
    const nations = loadAllNationReferences();

    // For first-nations: include nations with woodland or subarctic patterns
    // For inuit: include nations with arctic pattern
    const relevantPatterns: string[] =
      tradition === 'inuit'
        ? ['arctic']
        : ['woodland', 'subarctic'];

    const relevantNations = nations.filter(n =>
      relevantPatterns.includes(n.seasonalPattern),
    );

    return filtered.map(work => ({
      ...work,
      nationContext: relevantNations.map(n => ({
        nationId: n.id,
        nationName: n.name,
        heritageSkillRelevance: n.heritageSkillRelevance ?? [],
        seasonalPattern: n.seasonalPattern,
      })),
    }));
  }

  // Appalachian: no nation context
  return filtered;
}
