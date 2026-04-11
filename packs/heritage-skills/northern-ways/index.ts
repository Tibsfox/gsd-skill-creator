/**
 * Northern Ways cross-cutting module.
 *
 * Provides typed access to the ethical backbone and reference framework for
 * all Indigenous content in the Heritage Skills Educational Pack.
 *
 * This module serves three functions:
 * 1. Reference — authoritative source for IQ, OCAP®, and CARE frameworks
 * 2. Educational — teaches users about these frameworks
 * 3. Enforcement backbone — provides classification data for the Cultural
 *    Sovereignty Warden (Component 03)
 *
 * @module heritage-skills-pack/northern-ways
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Type Definitions ─────────────────────────────────────────────────────────

/**
 * One of the six Inuit Qaujimajatuqangit (IQ) principles.
 *
 * IQ is the comprehensive Inuit knowledge system that forms the ethical
 * backbone for all Inuit content in the Heritage Skills pack.
 */
export interface IQPrinciple {
  /** Unique identifier in format IQ-01 through IQ-06. */
  id: string;
  /** Inuktitut name of the principle. */
  name: string;
  /** English translation / description of the principle. */
  englishName: string;
  /** Full definition of the principle and what it means in practice. */
  definition: string;
  /** Examples of this principle expressed through heritage skills. */
  heritageSkillExamples: string[];
  /** Parallels to this principle found in the Foxfire Core Practices. */
  foxfireParallels: string[];
  /** Practical notes for applying this principle when building heritage pack content. */
  applicationNotes: string;
}

/**
 * One of the four OCAP® principles.
 *
 * OCAP® (Ownership, Control, Access, Possession) is a registered trademark
 * of the First Nations Information Governance Centre (FNIGC).
 */
export interface OCAPPrinciple {
  /** Unique identifier in format OCAP-O, OCAP-C, OCAP-A, OCAP-P. */
  id: string;
  /** Name of the principle (Ownership, Control, Access, or Possession). */
  name: string;
  /** Full definition of the principle. */
  definition: string;
  /** Specific guidance for applying this principle in the Heritage Skills pack context. */
  implementationGuidance: string;
}

/**
 * The complete OCAP® framework document.
 */
export interface OCAPFramework {
  /** Framework identifier: 'OCAP'. */
  framework: string;
  /** Full name of the framework. */
  fullName: string;
  /** Originating organization (FNIGC). */
  origin: string;
  /** Version or date information. */
  version: string;
  /** Summary of the framework's purpose. */
  summary: string;
  /** The four OCAP® principles. */
  principles: OCAPPrinciple[];
  /** Legal note regarding the OCAP® trademark. */
  legalNote: string;
  /** Guidance specific to Heritage Skills pack application. */
  applicationToHeritageSkillsPack: string;
}

/**
 * One of the four CARE principles.
 *
 * CARE (Collective Benefit, Authority to Control, Responsibility, Ethics)
 * was developed by the Global Indigenous Data Alliance (GIDA).
 */
export interface CAREPrinciple {
  /** Unique identifier in format CARE-C, CARE-A, CARE-R, CARE-E. */
  id: string;
  /** Name of the principle. */
  name: string;
  /** Full definition of the principle. */
  definition: string;
  /** How this principle maps to Heritage Skills pack operations. */
  heritagePackMapping: string;
}

/**
 * The complete CARE framework document.
 */
export interface CAREFramework {
  /** Framework identifier: 'CARE'. */
  framework: string;
  /** Full name of the framework. */
  fullName: string;
  /** Originating organization (GIDA). */
  origin: string;
  /** Year of development. */
  year: number;
  /** Summary of the framework's purpose. */
  summary: string;
  /** The four CARE principles. */
  principles: CAREPrinciple[];
  /** Explanation of the relationship to the OCAP® framework. */
  relationshipToOCAP: string;
  /** Guidance specific to Heritage Skills pack application. */
  applicationToHeritageSkillsPack: string;
}

/**
 * Reference data for one Indigenous nation or regional group.
 *
 * Contains publicly available educational information about a nation's
 * heritage skills, traditional territories, and community resources.
 * No sacred, ceremonial, or Level 3-4 cultural sovereignty content
 * is included in these reference files.
 */
export interface NationReference {
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
  /** Which seasonal round applies to this nation ('woodland', 'subarctic', or 'arctic'). */
  seasonalPattern: string;
  /** Cultural sovereignty notes for content builders. */
  culturalSovereigntyNotes?: string;
}

/**
 * A single season within a seasonal round cycle.
 */
export interface SeasonalSeason {
  /** Name of the season (may include Indigenous-language name). */
  name: string;
  /** Approximate Western calendar months for this season. */
  westernMonths: string[];
  /** Natural/ecological signals that mark this season. */
  ecologicalMarkers?: string[];
  /** Heritage activities that occur during this season. */
  activities: string[];
  /** Heritage Skills Hall room numbers relevant to this season's activities. */
  heritageSkillRooms: number[];
  /** Cultural context for this season. */
  culturalContext?: string;
}

/**
 * A complete seasonal cycle for one ecological/cultural zone.
 */
export interface SeasonalRound {
  /** Unique identifier: 'seasonal-woodland', 'seasonal-subarctic', 'seasonal-arctic'. */
  id: string;
  /** Name of the seasonal round. */
  name: string;
  /** Description of the ecological and cultural zone. */
  description: string;
  /** Tradition types ('first-nations', 'inuit'). */
  traditions: string[];
  /** Nation IDs that follow this seasonal pattern. */
  applicableNations: string[];
  /** Ordered seasons in the cycle (4-6 seasons). */
  seasons: SeasonalSeason[];
}

/**
 * A public institutional resource in the Knowledge Keepers Directory.
 *
 * SECURITY INVARIANT: This type MUST NOT contain personal data.
 * Only public institutions, cultural centers, educational programs,
 * and published resources are included. No individual names, email
 * addresses, or phone numbers.
 */
export interface KnowledgeKeeperResource {
  /** Unique identifier in format KK-NNN. */
  id: string;
  /** Name of the institution or organization. */
  name: string;
  /** Type of resource. */
  type: 'museum' | 'cultural-center' | 'community-organization' | 'educational-program' | 'published-resource' | 'governance-organization';
  /** Public URL for the institution. */
  url: string;
  /** Cultural traditions this resource covers. */
  traditions: string[];
  /** Description of the resource and its relevance. */
  description: string;
}

/**
 * The complete Knowledge Keepers Directory.
 */
export interface KnowledgeKeepersDirectory {
  /** Required disclaimer about the nature of the directory (no personal data). */
  disclaimer: string;
  /** Date this directory was last reviewed. */
  lastReviewed?: string;
  /** List of public institutional resources. */
  resources: KnowledgeKeeperResource[];
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
    throw new Error(`Northern Ways: failed to read '${fullPath}': ${String(err)}`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(`Northern Ways: invalid JSON in '${fullPath}': ${String(err)}`);
  }
}

/**
 * Validate that an array has at least one element.
 */
function assertNonEmpty<T>(arr: T[], fieldName: string, context: string): void {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(`Northern Ways: '${fieldName}' must be a non-empty array in ${context}`);
  }
}

// ─── Loader Functions ─────────────────────────────────────────────────────────

/**
 * Load all six Inuit Qaujimajatuqangit (IQ) principles.
 *
 * @returns Array of exactly 6 IQ principles, each with heritage skill examples
 *          and Foxfire Core Practices parallels.
 * @throws Error if the data file is missing or malformed, or if the count is wrong.
 */
export function loadIQPrinciples(): IQPrinciple[] {
  const principles = readJSON<IQPrinciple[]>('iq-principles.json');
  if (!Array.isArray(principles)) {
    throw new Error('Northern Ways: iq-principles.json must be a JSON array');
  }
  if (principles.length !== 6) {
    throw new Error(`Northern Ways: expected exactly 6 IQ principles, got ${principles.length}`);
  }
  for (const p of principles) {
    if (!p.id || !p.name || !p.englishName || !p.definition) {
      throw new Error(`Northern Ways: IQ principle missing required fields: ${JSON.stringify(p)}`);
    }
    assertNonEmpty(p.heritageSkillExamples, 'heritageSkillExamples', p.id);
    assertNonEmpty(p.foxfireParallels, 'foxfireParallels', p.id);
  }
  return principles;
}

/**
 * Load the OCAP® (Ownership, Control, Access, Possession) framework.
 *
 * OCAP® is a registered trademark of the First Nations Information
 * Governance Centre (FNIGC).
 *
 * @returns The complete OCAP® framework with all 4 principles and
 *          implementation guidance for the Heritage Skills pack.
 * @throws Error if the data file is missing or malformed.
 */
export function loadOCAPFramework(): OCAPFramework {
  const framework = readJSON<OCAPFramework>('ocap-framework.json');
  if (!framework.principles || !Array.isArray(framework.principles)) {
    throw new Error('Northern Ways: ocap-framework.json missing principles array');
  }
  if (framework.principles.length !== 4) {
    throw new Error(`Northern Ways: expected 4 OCAP principles, got ${framework.principles.length}`);
  }
  if (!framework.legalNote) {
    throw new Error('Northern Ways: ocap-framework.json missing legalNote');
  }
  return framework;
}

/**
 * Load the CARE (Collective Benefit, Authority, Responsibility, Ethics) framework.
 *
 * Developed by the Global Indigenous Data Alliance (GIDA).
 *
 * @returns The complete CARE framework with all 4 principles mapped to
 *          heritage pack operations.
 * @throws Error if the data file is missing or malformed.
 */
export function loadCAREPrinciples(): CAREFramework {
  const framework = readJSON<CAREFramework>('care-principles.json');
  if (!framework.principles || !Array.isArray(framework.principles)) {
    throw new Error('Northern Ways: care-principles.json missing principles array');
  }
  if (framework.principles.length !== 4) {
    throw new Error(`Northern Ways: expected 4 CARE principles, got ${framework.principles.length}`);
  }
  return framework;
}

/**
 * Load all 10 nation reference files (9 nations + Inuit regional reference).
 *
 * @returns Array of 10 nation reference objects.
 * @throws Error if any reference file is missing or malformed.
 */
export function loadAllNationReferences(): NationReference[] {
  const nationFiles = [
    'anishinaabe',
    'cree',
    'algonquin',
    'mikmaq',
    'abenaki',
    'innu',
    'attikamek',
    'haudenosaunee',
    'dene',
    'inuit-regions',
  ];

  return nationFiles.map(name => {
    const nation = readJSON<NationReference>(`nations-reference/${name}.json`);
    if (!nation.id || !nation.name || !nation.languageFamily) {
      throw new Error(`Northern Ways: nation reference '${name}.json' missing required fields`);
    }
    if (!Array.isArray(nation.roomConnections) || nation.roomConnections.length === 0) {
      throw new Error(`Northern Ways: nation reference '${name}.json' missing roomConnections`);
    }
    return nation;
  });
}

/**
 * Load the reference data for a specific nation by its ID.
 *
 * @param nationId - The nation ID (e.g., 'nation-anishinaabe', 'nation-inuit').
 * @returns The nation reference object.
 * @throws Error if the nation ID is not found or the data is malformed.
 */
export function loadNationReference(nationId: string): NationReference {
  // Map nation IDs to file names
  const idToFile: Record<string, string> = {
    'nation-anishinaabe': 'anishinaabe',
    'nation-cree': 'cree',
    'nation-algonquin': 'algonquin',
    'nation-mikmaq': 'mikmaq',
    'nation-abenaki': 'abenaki',
    'nation-innu': 'innu',
    'nation-attikamek': 'attikamek',
    'nation-haudenosaunee': 'haudenosaunee',
    'nation-dene': 'dene',
    'nation-inuit': 'inuit-regions',
  };

  const fileName = idToFile[nationId];
  if (!fileName) {
    throw new Error(`Northern Ways: unknown nation ID '${nationId}'. Valid IDs: ${Object.keys(idToFile).join(', ')}`);
  }

  const nation = readJSON<NationReference>(`nations-reference/${fileName}.json`);
  if (!nation.id || nation.id !== nationId) {
    throw new Error(`Northern Ways: nation reference '${fileName}.json' has unexpected id '${nation.id}'`);
  }
  return nation;
}

/**
 * Load the seasonal round for a specific ecological/cultural pattern.
 *
 * @param pattern - The seasonal pattern type.
 * @returns The complete seasonal round with all seasons and room mappings.
 * @throws Error if the data file is missing or malformed.
 */
export function loadSeasonalRounds(pattern: 'woodland' | 'subarctic' | 'arctic'): SeasonalRound {
  const round = readJSON<SeasonalRound>(`seasonal-rounds/${pattern}.json`);
  if (!round.seasons || !Array.isArray(round.seasons)) {
    throw new Error(`Northern Ways: seasonal-rounds/${pattern}.json missing seasons array`);
  }
  if (round.seasons.length < 4 || round.seasons.length > 6) {
    throw new Error(`Northern Ways: ${pattern} seasonal round should have 4-6 seasons, got ${round.seasons.length}`);
  }
  for (const season of round.seasons) {
    if (!season.heritageSkillRooms || season.heritageSkillRooms.length === 0) {
      throw new Error(`Northern Ways: season '${season.name}' in ${pattern} missing heritageSkillRooms`);
    }
  }
  return round;
}

/**
 * Load the Knowledge Keepers Directory.
 *
 * SECURITY INVARIANT: This function validates that no personal data is present
 * (no email addresses, no phone numbers) before returning the directory.
 *
 * @returns The directory of public institutional resources.
 * @throws Error if the data file is missing, malformed, or contains personal data.
 */
export function loadKnowledgeKeepersDirectory(): KnowledgeKeepersDirectory {
  const directory = readJSON<KnowledgeKeepersDirectory>('knowledge-keepers-directory.json');

  if (!directory.disclaimer) {
    throw new Error('Northern Ways: knowledge-keepers-directory.json missing disclaimer');
  }
  if (!Array.isArray(directory.resources) || directory.resources.length === 0) {
    throw new Error('Northern Ways: knowledge-keepers-directory.json has no resources');
  }

  // Security validation: scan the entire directory JSON for personal data patterns
  const serialized = JSON.stringify(directory);

  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailPattern.test(serialized)) {
    throw new Error('Northern Ways: SECURITY VIOLATION — knowledge-keepers-directory.json contains what appears to be an email address. Personal data is not permitted.');
  }

  const phonePattern = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  if (phonePattern.test(serialized)) {
    throw new Error('Northern Ways: SECURITY VIOLATION — knowledge-keepers-directory.json contains what appears to be a phone number. Personal data is not permitted.');
  }

  return directory;
}
