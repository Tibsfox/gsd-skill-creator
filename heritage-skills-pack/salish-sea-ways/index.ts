/**
 * Salish Sea Ways cross-cutting module.
 *
 * Provides typed access to the ethical backbone and reference framework for
 * all PNW Coast content in the Heritage Skills Educational Pack.
 *
 * This module serves three functions:
 * 1. Reference — authoritative source for 53 nations across 5 provinces
 * 2. Educational — watershed identity, potlatch history, reconnecting terminology
 * 3. Enforcement backbone — provides classification data for the Cultural
 *    Sovereignty Warden (Component 03) via getSalishCulturalSovereigntyHooks()
 *
 * Loaded by all PNW Coast rooms (15-18) and is the ethical backbone for
 * SALISH_SEA tradition content.
 *
 * @module heritage-skills-pack/salish-sea-ways
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Type Definitions ─────────────────────────────────────────────────────────

/**
 * Reference data for one Salish Sea nation.
 *
 * Contains publicly available educational information about a nation's
 * heritage skills, traditional territories, and community resources.
 * No sacred, ceremonial, or Level 3-4 cultural sovereignty content
 * is included in these reference files.
 *
 * Extends the NationReference pattern from Northern Ways with a province field
 * for the 5-province Salish Sea organization.
 */
export interface SalishNationReference {
  /** Unique identifier in format nation-[name]. */
  id: string;
  /** Primary name of the nation. */
  name: string;
  /** Alternative names, colonial names, and related nation names. */
  alternateNames?: string[];
  /** Language family classification. */
  languageFamily: string;
  /** Primary language or languages. */
  language?: string;
  /** Description of traditional territories. */
  traditionalTerritories: string;
  /** Cultural notes for context (general, publicly shared information). */
  culturalNotes?: string;
  /** Heritage skills relevant to this nation's traditions. */
  heritageSkillRelevance?: string[];
  /** Community-authorized public resources for learning more. */
  communityAuthorizedResources?: string[];
  /** Heritage Skills Hall room numbers relevant to this nation's content. */
  roomConnections: number[];
  /** Which seasonal round applies to this nation ('coastal' or 'plateau-river'). */
  seasonalPattern: string;
  /** Cultural sovereignty notes for content builders. */
  culturalSovereigntyNotes?: string;
  /** Province classification for this nation. */
  province?: 'coast-salish-chinook' | 'wakashan' | 'northern-coast' | 'nw-california' | 'western-slope-cascade';
}

/**
 * The watershed identity framework for Salish Sea peoples.
 *
 * Organizes peoples by their primary ecological relationship:
 * Saltwater People (coastal) or River/Mountain People (Cascade/Plateau).
 */
export interface WatershedIdentityFramework {
  id: string;
  version: string;
  description: string;
  saltwaterPeoples: {
    id: string;
    watershedType: string;
    description: string;
    characteristicPractices: string[];
    representativeNations: string[];
    heritageSkillRooms: number[];
  };
  riverMountainPeoples: {
    id: string;
    watershedType: string;
    description: string;
    characteristicPractices: string[];
    representativeNations: string[];
    heritageSkillRooms: number[];
  };
  sharedSalmonBond: {
    description: string;
    educationalNote: string;
    heritageSkillRooms: number[];
  };
  contentHooks: Record<string, unknown>;
}

/**
 * Potlatch historical context document.
 *
 * Covers potlatch as a social technology (Level 1 publicly shared framing)
 * and the criminalization history 1884-1951 (NON-OPTIONAL context).
 */
export interface PotlatchContext {
  id: string;
  culturalSovereigntyLevel: number;
  culturalSovereigntyNote: string;
  preContactFunction: {
    description: string;
    socialMechanisms: string[];
    participatingNations: string;
    heritageSkillRooms: number[];
  };
  criminalizationHistory: {
    banStart: number;
    banEnd: number;
    legislation: string;
    politicalContext: string;
    enforcementConsequences: string;
    regialiaDisbursement: string;
    educationalNote: string;
  };
  revival: {
    legalRestoration: number;
    revivalContext: string;
    repatriationStatus: string;
  };
  contentHook: Record<string, unknown>;
}

/**
 * Terminology guide for people reconnecting to Salish Sea heritage
 * after family separation through adoption, Sixties Scoop, or other
 * colonial disruptions.
 */
export interface ReconnectingTerminologyGuide {
  id: string;
  culturalSovereigntyLevel: number;
  disclaimer: string;
  protocolPhrase: {
    verbatim: string;
    usageContext: string;
    pretendianNote: string;
  };
  terms: Array<{
    term: string;
    definition: string;
    usageGuidance: string;
    culturalSensitivity?: string;
    culturalSovereigntyLevel?: number;
  }>;
  resourcesForReconnecting: Array<{
    name: string;
    url: string;
    description: string;
  }>;
}

/**
 * Notes on cross-border sovereignty for nations whose traditional territories
 * span the US-Canada international boundary.
 */
export interface CrossBorderSovereigntyNotes {
  id: string;
  culturalSovereigntyLevel: number;
  educationalPosition: string;
  borderNotes: Array<{
    nationGroup: string;
    crossBorderSituation: string;
    sovereigntyNote: string;
  }>;
  contentHook: Record<string, unknown>;
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
    throw new Error(`Salish Sea Ways: failed to read '${fullPath}': ${String(err)}`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(`Salish Sea Ways: invalid JSON in '${fullPath}': ${String(err)}`);
  }
}

// ─── Loader Functions ─────────────────────────────────────────────────────────

/**
 * Load all nations for a specific province.
 *
 * @param province - The province to load nations for.
 * @returns Array of SalishNationReference objects for the province.
 * @throws Error if the province file is missing, malformed, or empty.
 */
export function loadAllNationsByProvince(
  province: 'coast-salish-chinook' | 'wakashan' | 'northern-coast' | 'nw-california' | 'western-slope-cascade'
): SalishNationReference[] {
  const nations = readJSON<SalishNationReference[]>(`nations-reference/${province}.json`);
  if (!Array.isArray(nations) || nations.length === 0) {
    throw new Error(`Salish Sea Ways: province '${province}' must be a non-empty array`);
  }
  for (const nation of nations) {
    if (!nation.id) {
      throw new Error(`Salish Sea Ways: nation in '${province}' missing required field 'id'`);
    }
    if (!nation.name) {
      throw new Error(`Salish Sea Ways: nation '${nation.id}' in '${province}' missing required field 'name'`);
    }
    if (!nation.languageFamily) {
      throw new Error(`Salish Sea Ways: nation '${nation.id}' in '${province}' missing required field 'languageFamily'`);
    }
    if (!Array.isArray(nation.roomConnections) || nation.roomConnections.length === 0) {
      throw new Error(`Salish Sea Ways: nation '${nation.id}' in '${province}' missing or empty 'roomConnections'`);
    }
    // Annotate each nation with its province for callers
    nation.province = province;
  }
  return nations;
}

/**
 * Load all nations across all 5 provinces as a flat array.
 *
 * @returns Flat array of all SalishNationReference objects (minimum 40).
 * @throws Error if total count is below 40 or any province fails validation.
 */
export function loadAllNations(): SalishNationReference[] {
  const provinces = [
    'coast-salish-chinook',
    'wakashan',
    'northern-coast',
    'nw-california',
    'western-slope-cascade',
  ] as const;

  const allNations: SalishNationReference[] = [];
  for (const province of provinces) {
    allNations.push(...loadAllNationsByProvince(province));
  }

  if (allNations.length < 40) {
    throw new Error(
      `Salish Sea Ways: expected at least 40 nations total, got ${allNations.length}. ` +
      `Module requires comprehensive coverage of Salish Sea cultural region.`
    );
  }

  return allNations;
}

/**
 * Load a single nation by its unique ID.
 *
 * Searches all 5 provinces for the matching nation.
 *
 * @param nationId - The nation ID (e.g., 'nation-lummi', 'nation-haida').
 * @returns The matching SalishNationReference.
 * @throws Error if the nation ID is not found in any province.
 */
export function loadNationById(nationId: string): SalishNationReference {
  const allNations = loadAllNations();
  const found = allNations.find(n => n.id === nationId);
  if (!found) {
    throw new Error(
      `Salish Sea Ways: nation ID '${nationId}' not found. ` +
      `Use loadAllNations() to browse available nations.`
    );
  }
  return found;
}

/**
 * Load the watershed identity framework.
 *
 * Provides the Saltwater People / River-Mountain People organizational
 * framework for Salish Sea heritage content.
 *
 * @returns The WatershedIdentityFramework object.
 * @throws Error if the framework file is missing or malformed.
 */
export function loadWatershedIdentity(): WatershedIdentityFramework {
  const framework = readJSON<WatershedIdentityFramework>('watershed-identity.json');
  if (!framework.saltwaterPeoples) {
    throw new Error(`Salish Sea Ways: watershed-identity.json missing 'saltwaterPeoples' key`);
  }
  if (!framework.riverMountainPeoples) {
    throw new Error(`Salish Sea Ways: watershed-identity.json missing 'riverMountainPeoples' key`);
  }
  return framework;
}

/**
 * Load the potlatch historical context.
 *
 * STRUCTURAL INVARIANT: banStart must be 1884 and banEnd must be 1951.
 * These are historical facts. Any deviation from these dates indicates
 * data corruption and will cause a hard error.
 *
 * @returns The PotlatchContext object.
 * @throws Error if the file is missing, malformed, or contains incorrect historical dates.
 */
export function loadPotlatchContext(): PotlatchContext {
  const context = readJSON<PotlatchContext>('potlatch-context.json');
  if (context.criminalizationHistory.banStart !== 1884) {
    throw new Error(
      `Salish Sea Ways: STRUCTURAL INVARIANT VIOLATED — potlatch-context.json ` +
      `banStart must be 1884 (historical fact), got ${context.criminalizationHistory.banStart}`
    );
  }
  if (context.criminalizationHistory.banEnd !== 1951) {
    throw new Error(
      `Salish Sea Ways: STRUCTURAL INVARIANT VIOLATED — potlatch-context.json ` +
      `banEnd must be 1951 (historical fact), got ${context.criminalizationHistory.banEnd}`
    );
  }
  return context;
}

/**
 * Load the reconnecting terminology guide.
 *
 * Provides terminology and protocol phrases for people reconnecting to
 * Salish Sea heritage after family separation.
 *
 * SECURITY: Scans resources for email addresses (personal data not permitted).
 *
 * @returns The ReconnectingTerminologyGuide object.
 * @throws Error if the file is missing, malformed, or contains personal data.
 */
export function loadReconnectingTerminology(): ReconnectingTerminologyGuide {
  const guide = readJSON<ReconnectingTerminologyGuide>('reconnecting-terminology.json');

  if (!guide.protocolPhrase || !guide.protocolPhrase.verbatim) {
    throw new Error(`Salish Sea Ways: reconnecting-terminology.json missing protocolPhrase.verbatim`);
  }

  if (!Array.isArray(guide.terms) || guide.terms.length < 3) {
    throw new Error(
      `Salish Sea Ways: reconnecting-terminology.json must have at least 3 terms, ` +
      `got ${Array.isArray(guide.terms) ? guide.terms.length : 0}`
    );
  }

  // Security: scan resources for email addresses (personal data not permitted)
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  for (const resource of guide.resourcesForReconnecting) {
    // Only flag mailto: or bare email in URL — https:// URLs with @ (rare) are ok for display purposes
    if (resource.url.startsWith('mailto:') || (!resource.url.startsWith('https://') && !resource.url.startsWith('http://') && emailPattern.test(resource.url))) {
      throw new Error(
        `Salish Sea Ways: SECURITY VIOLATION — reconnecting-terminology.json resource ` +
        `'${resource.name}' contains an email address. Only public URLs are permitted.`
      );
    }
  }

  return guide;
}

/**
 * Load the cross-border sovereignty notes.
 *
 * Provides educational notes on nations whose traditional territories span
 * the US-Canada international boundary.
 *
 * @returns The CrossBorderSovereigntyNotes object.
 * @throws Error if the file is missing, malformed, or has no border notes.
 */
export function loadCrossBorderSovereigntyNotes(): CrossBorderSovereigntyNotes {
  const notes = readJSON<CrossBorderSovereigntyNotes>('cross-border-sovereignty.json');
  if (!Array.isArray(notes.borderNotes) || notes.borderNotes.length === 0) {
    throw new Error(`Salish Sea Ways: cross-border-sovereignty.json must have at least one borderNotes entry`);
  }
  return notes;
}

/**
 * Get cultural sovereignty hooks for the Cultural Sovereignty Warden.
 *
 * Returns domain identifier and a province map mapping each province name
 * to an array of nation names — used for warden routing when content
 * references specific nations.
 *
 * @returns Warden integration hooks for the 'salish-sea' domain.
 */
export function getSalishCulturalSovereigntyHooks(): {
  domain: string;
  provinceMap: Record<string, string[]>;
} {
  const provinces = [
    'coast-salish-chinook',
    'wakashan',
    'northern-coast',
    'nw-california',
    'western-slope-cascade',
  ] as const;

  const provinceMap: Record<string, string[]> = {};
  for (const province of provinces) {
    const nations = loadAllNationsByProvince(province);
    provinceMap[province] = nations.map(n => n.name);
  }

  return {
    domain: 'salish-sea',
    provinceMap,
  };
}
