/**
 * Reconnecting Descendant Pathway module.
 *
 * Provides typed access to the full reconnecting descendant toolkit:
 * terminology, watershed investigation, resource directory, cultural
 * immersion guidance, and Heritage Book template variant.
 *
 * This pathway serves people with Indigenous ancestry who were separated
 * from their communities — through adoption, residential schools, or the
 * Sixties Scoop — and who are now seeking to learn about and connect with
 * their heritage.
 *
 * Every word in this module requires extreme emotional care. This is not
 * a special feature; it is a first-class use case.
 *
 * @module heritage-skills-pack/reconnecting-pathway
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Type Definitions ─────────────────────────────────────────────────────────

/**
 * Extended terminology guide for the Reconnecting Descendant Pathway.
 *
 * Extends and deepens the existing salish-sea-ways/reconnecting-terminology.json
 * into a full guide with Pretendian guidance, protocol phrasing, and 8+ terms.
 */
export interface ReconnectingTerminologyGuideExtended {
  id: string;
  culturalSovereigntyLevel: number;
  version: string;
  disclaimer: string;
  pretendianGuidance: {
    concern: string;
    honestApproach: string;
    resourceCheck: string;
  };
  protocolPhrasing: {
    verbatim: string;
    adaptationGuidance: string;
    whenToUse: string;
  };
  terms: Array<{
    term: string;
    definition: string;
    usageGuidance: string;
    culturalSensitivity?: string;
    culturalSovereigntyLevel?: number;
  }>;
  acknowledgements: string;
}

/**
 * Watershed investigation tool for ancestry research.
 *
 * Organizes Salish Sea heritage through the two primary ecological
 * relationships: Saltwater Peoples (coastal) and River-Mountain Peoples
 * (Cascade-slope and interior river nations).
 */
export interface WatershedInvestigationTool {
  id: string;
  culturalSovereigntyLevel: number;
  version: string;
  introduction: string;
  watershedTypes: Record<string, unknown>;
  investigationSteps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    sources: string[];
    evidenceType: string;
  }>;
  evidenceTypes: Array<{
    type: string;
    description: string;
  }>;
  interpretationGuidance: {
    saltwaterIndicators: string[];
    riverMountainIndicators: string[];
    unknownGuidance: string;
  };
  limitations: string;
}

/**
 * Resource directory for reconnecting descendants.
 *
 * Categorized directory of organizations serving people reconnecting to
 * Indigenous heritage. All URLs are public-facing organizational websites —
 * no personal contact information.
 */
export interface ResourceDirectory {
  id: string;
  culturalSovereigntyLevel: number;
  version: string;
  disclaimer: string;
  lastReviewNote: string;
  categories: Array<{
    categoryId: string;
    title: string;
    description: string;
    resources: Array<{
      name: string;
      url: string;
      description: string;
    }>;
  }>;
  securityNote: string;
}

/**
 * Cultural immersion guidance for reconnecting descendants.
 *
 * Covers how to begin engaging with culture before formal enrollment or
 * community membership. Core message: you do not need a tribal ID to begin
 * learning.
 */
export interface CulturalImmersionGuidance {
  id: string;
  culturalSovereigntyLevel: number;
  version: string;
  coreMessage: string;
  approachPrinciples: Array<{
    principle: string;
    explanation: string;
  }>;
  immersionTypes: Array<{
    type: string;
    title: string;
    description: string;
    examples: string[];
    protocolNote: string;
  }>;
  protocolGuidance: {
    introductionPhrase: string;
    whenToUseIt: string;
    followUp: string;
  };
  whatToExpect: Record<string, string>;
}

/**
 * Heritage Book "Reconnecting" template variant (Homecoming Journal).
 *
 * Template for a specific kind of Heritage Book — a homecoming journal
 * documenting a lineage investigation. Extends the Heritage Book pipeline
 * from Phase 33 without modifying it.
 */
export interface HeritagBookReconnectingTemplate {
  id: string;
  culturalSovereigntyLevel: number;
  version: string;
  variantTitle: string;
  variantDescription: string;
  emotionalFraming: string;
  frontMatter: Record<string, unknown>;
  chapters: Array<{
    contentType: string;
    title: string;
    guidanceNotes: string;
    requiredFields: string[];
    estimatedPages: number;
    culturalAttributionRequired: boolean;
    ocapReviewRequired?: boolean;
    reconnectingGuidance: string;
  }>;
  backMatter: Record<string, unknown>;
  exportNotes: Record<string, string>;
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
    throw new Error(
      `Reconnecting Pathway: failed to read '${fullPath}': ${String(err)}`
    );
  }
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(
      `Reconnecting Pathway: invalid JSON in '${fullPath}': ${String(err)}`
    );
  }
}

// ─── Loader Functions ─────────────────────────────────────────────────────────

/**
 * Load the extended terminology guide.
 *
 * Validates minimum term count and presence of verbatim protocol phrase.
 *
 * @returns The ReconnectingTerminologyGuideExtended object.
 * @throws Error if the file is missing, malformed, or fails validation.
 */
export function loadTerminologyGuide(): ReconnectingTerminologyGuideExtended {
  const guide = readJSON<ReconnectingTerminologyGuideExtended>('terminology-guide.json');

  if (!guide.id) {
    throw new Error(`Reconnecting Pathway: terminology-guide.json missing required field 'id'`);
  }
  if (guide.culturalSovereigntyLevel === undefined) {
    throw new Error(
      `Reconnecting Pathway: terminology-guide.json missing required field 'culturalSovereigntyLevel'`
    );
  }
  if (!guide.version) {
    throw new Error(`Reconnecting Pathway: terminology-guide.json missing required field 'version'`);
  }

  if (!Array.isArray(guide.terms) || guide.terms.length < 8) {
    throw new Error(
      `Reconnecting Pathway: terminology-guide.json must have at least 8 terms, ` +
      `got ${Array.isArray(guide.terms) ? guide.terms.length : 0}`
    );
  }

  if (!guide.protocolPhrasing || !guide.protocolPhrasing.verbatim) {
    throw new Error(
      `Reconnecting Pathway: terminology-guide.json missing protocolPhrasing.verbatim`
    );
  }

  if (!guide.protocolPhrasing.verbatim.includes('separated by adoption')) {
    throw new Error(
      `Reconnecting Pathway: STRUCTURAL INVARIANT VIOLATED — terminology-guide.json ` +
      `protocolPhrasing.verbatim must contain 'separated by adoption' (verbatim protocol phrase)`
    );
  }

  return guide;
}

/**
 * Load the watershed investigation tool.
 *
 * Validates minimum investigation step count.
 *
 * @returns The WatershedInvestigationTool object.
 * @throws Error if the file is missing, malformed, or fails validation.
 */
export function loadWatershedInvestigationTool(): WatershedInvestigationTool {
  const tool = readJSON<WatershedInvestigationTool>('watershed-investigation.json');

  if (!tool.id) {
    throw new Error(
      `Reconnecting Pathway: watershed-investigation.json missing required field 'id'`
    );
  }
  if (tool.culturalSovereigntyLevel === undefined) {
    throw new Error(
      `Reconnecting Pathway: watershed-investigation.json missing required field 'culturalSovereigntyLevel'`
    );
  }
  if (!tool.version) {
    throw new Error(
      `Reconnecting Pathway: watershed-investigation.json missing required field 'version'`
    );
  }

  if (!Array.isArray(tool.investigationSteps) || tool.investigationSteps.length < 5) {
    throw new Error(
      `Reconnecting Pathway: watershed-investigation.json must have at least 5 investigationSteps, ` +
      `got ${Array.isArray(tool.investigationSteps) ? tool.investigationSteps.length : 0}`
    );
  }

  return tool;
}

/**
 * Load the resource directory.
 *
 * SECURITY: Scans all resource URLs for email addresses (personal data not
 * permitted). Throws if any URL starts with mailto: or is a bare email address.
 * Matches the Salish Sea Ways security pattern exactly.
 *
 * @returns The ResourceDirectory object.
 * @throws Error if the file is missing, malformed, or fails security scan.
 */
export function loadResourceDirectory(): ResourceDirectory {
  const directory = readJSON<ResourceDirectory>('resource-directory.json');

  if (!directory.id) {
    throw new Error(
      `Reconnecting Pathway: resource-directory.json missing required field 'id'`
    );
  }
  if (directory.culturalSovereigntyLevel === undefined) {
    throw new Error(
      `Reconnecting Pathway: resource-directory.json missing required field 'culturalSovereigntyLevel'`
    );
  }
  if (!directory.version) {
    throw new Error(
      `Reconnecting Pathway: resource-directory.json missing required field 'version'`
    );
  }

  // Security: scan all resource URLs for email addresses (personal data not permitted)
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  for (const category of directory.categories) {
    for (const resource of category.resources) {
      // Only flag mailto: or bare email in URL — https:// URLs with @ (rare) are ok
      if (
        resource.url.startsWith('mailto:') ||
        (!resource.url.startsWith('https://') &&
          !resource.url.startsWith('http://') &&
          emailPattern.test(resource.url))
      ) {
        throw new Error(
          `Reconnecting Pathway: SECURITY VIOLATION — resource-directory.json resource ` +
          `'${resource.name}' in category '${category.categoryId}' contains an email address. ` +
          `Only public URLs are permitted.`
        );
      }
    }
  }

  return directory;
}

/**
 * Load the cultural immersion guidance.
 *
 * @returns The CulturalImmersionGuidance object.
 * @throws Error if the file is missing or malformed.
 */
export function loadCulturalImmersionGuidance(): CulturalImmersionGuidance {
  const guidance = readJSON<CulturalImmersionGuidance>('cultural-immersion-guidance.json');

  if (!guidance.id) {
    throw new Error(
      `Reconnecting Pathway: cultural-immersion-guidance.json missing required field 'id'`
    );
  }
  if (guidance.culturalSovereigntyLevel === undefined) {
    throw new Error(
      `Reconnecting Pathway: cultural-immersion-guidance.json missing required field 'culturalSovereigntyLevel'`
    );
  }
  if (!guidance.version) {
    throw new Error(
      `Reconnecting Pathway: cultural-immersion-guidance.json missing required field 'version'`
    );
  }

  return guidance;
}

/**
 * Load the Heritage Book Reconnecting template (Homecoming Journal).
 *
 * @returns The HeritagBookReconnectingTemplate object.
 * @throws Error if the file is missing or malformed.
 */
export function loadHeritagBookReconnectingTemplate(): HeritagBookReconnectingTemplate {
  const template = readJSON<HeritagBookReconnectingTemplate>(
    'heritage-book-reconnecting-template.json'
  );

  if (!template.id) {
    throw new Error(
      `Reconnecting Pathway: heritage-book-reconnecting-template.json missing required field 'id'`
    );
  }
  if (template.culturalSovereigntyLevel === undefined) {
    throw new Error(
      `Reconnecting Pathway: heritage-book-reconnecting-template.json missing required field 'culturalSovereigntyLevel'`
    );
  }
  if (!template.version) {
    throw new Error(
      `Reconnecting Pathway: heritage-book-reconnecting-template.json missing required field 'version'`
    );
  }

  return template;
}

// ─── Summary Function ─────────────────────────────────────────────────────────

/**
 * Load all 5 Reconnecting Pathway documents in a single call.
 *
 * Convenience function for callers that need the complete pathway toolkit.
 * Each loader performs its own validation; errors from any loader propagate.
 *
 * @returns All 5 pathway documents as a typed object.
 */
export function getReconnectingPathwaySummary(): {
  terminologyGuide: ReconnectingTerminologyGuideExtended;
  watershedTool: WatershedInvestigationTool;
  resourceDirectory: ResourceDirectory;
  immersionGuidance: CulturalImmersionGuidance;
  heritageBookTemplate: HeritagBookReconnectingTemplate;
} {
  return {
    terminologyGuide: loadTerminologyGuide(),
    watershedTool: loadWatershedInvestigationTool(),
    resourceDirectory: loadResourceDirectory(),
    immersionGuidance: loadCulturalImmersionGuidance(),
    heritageBookTemplate: loadHeritagBookReconnectingTemplate(),
  };
}
