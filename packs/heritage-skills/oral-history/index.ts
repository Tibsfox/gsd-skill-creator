/**
 * Oral History Studio — methodology module for ethical oral history
 * documentation across Appalachian, First Nations, and Inuit traditions.
 *
 * Four methodologies: OHA best practices, Smithsonian Folklife standards,
 * IQ-Pilimmaksarniq (Inuit learning through practice), Foxfire student-interviewer.
 *
 * Consent protocols: Standard, OCAP-compliant (FNIGC), NISR-compliant (ITK),
 * Community-consent. OCAP® is a registered trademark of the First Nations
 * Information Governance Centre.
 *
 * @module heritage-skills-pack/oral-history
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ─── Type Imports ─────────────────────────────────────────────────────────────

import type { CorePractice, ConsentProtocol, InterviewGuide } from '../shared/types.js';

// ─── Extended Types ────────────────────────────────────────────────────────────

/**
 * ConsentProtocol extended with an id field for lookup and reference.
 */
export type ConsentProtocolWithId = ConsentProtocol & { id: string };

/**
 * InterviewGuide extended with consentProtocolId for data-driven reference
 * (the JSON stores the protocol by ID, resolved by getInterviewGuide).
 */
export type InterviewGuideWithRef = Omit<InterviewGuide, 'corePractices' | 'consentProtocol'> & {
  corePracticeIds: string[];
  consentProtocolId: string;
  notes?: string;
};

// ─── Data Loaders ─────────────────────────────────────────────────────────────

/**
 * Load all 12 core oral history practices with IQ-Pilimmaksarniq alignment.
 */
export function getCorePractices(): CorePractice[] {
  return require('./core-practices.json') as CorePractice[];
}

/**
 * Return only practices that have an IQ principle alignment.
 * These are the practices most directly shaped by Inuit epistemology.
 */
export function getIQAlignedPractices(): CorePractice[] {
  return getCorePractices().filter(p => p.iqPrinciple !== undefined);
}

/**
 * Get a specific consent protocol by ID.
 * Valid IDs: 'standard', 'ocap-compliant', 'nisr-compliant', 'community-consent'
 */
export function getConsentProtocol(id: string): ConsentProtocolWithId {
  const protocols = require('./consent-protocols.json') as ConsentProtocolWithId[];
  const protocol = protocols.find(p => p.id === id);
  if (!protocol) {
    throw new Error(
      `Unknown consent protocol ID: ${id}. Valid IDs: standard, ocap-compliant, nisr-compliant, community-consent`,
    );
  }
  return protocol;
}

/**
 * Get all consent protocols.
 */
export function getAllConsentProtocols(): ConsentProtocolWithId[] {
  return require('./consent-protocols.json') as ConsentProtocolWithId[];
}

/**
 * Get all interview guides (raw, with consentProtocolId reference).
 */
export function getAllInterviewGuides(): InterviewGuideWithRef[] {
  return require('./interview-guides.json') as InterviewGuideWithRef[];
}

/**
 * Get a specific interview guide by methodology.
 * Returns the raw guide with consentProtocolId reference (not resolved protocol object).
 */
export function getInterviewGuide(
  methodology: InterviewGuide['methodology'],
): InterviewGuideWithRef {
  const guides = getAllInterviewGuides();
  const guide = guides.find(g => g.methodology === methodology);
  if (!guide) {
    throw new Error(
      `Unknown methodology: ${methodology}. Valid values: OHA, Smithsonian, IQ-Pilimmaksarniq, Foxfire`,
    );
  }
  return guide;
}

/**
 * Return interview guides that use the NISR-compliant consent protocol.
 * These are the guides appropriate for Inuit oral history work.
 */
export function getNISRGuides(): InterviewGuideWithRef[] {
  return getAllInterviewGuides().filter(g => g.consentProtocolId === 'nisr-compliant');
}

/**
 * Return interview guides that are OCAP-compliant (includes NISR-compliant guides).
 * These are the guides appropriate for First Nations and Inuit oral history work.
 */
export function getOCAPGuides(): InterviewGuideWithRef[] {
  const ocapProtocolIds = getAllConsentProtocols()
    .filter(p => p.ocapCompliant)
    .map(p => p.id);
  return getAllInterviewGuides().filter(g => ocapProtocolIds.includes(g.consentProtocolId));
}
