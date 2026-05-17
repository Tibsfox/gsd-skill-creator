/**
 * tools/catalog-card-template/ps-spec.mjs — international-PS catalog-card
 * metadata schema (FA-663-7).
 *
 * Codified at v1.49.666 cc-3 Phase 1 to close FA-663-7 (inherited from
 * FA-662-7 v662 close + sustained through cc-1 + cc-2). Substrate-form
 * INTERNATIONAL-PS-NOT-CAPTURED-IN-CATALOG-CARD-METADATA opened at
 * v662 STS-51-G cohort entry (Baudry French CNES + Al-Saud Saudi KACST).
 *
 * Sibling of spec.mjs (degree-card spec). Degree-cards live on catalog
 * index pages; PS records live as structured data referenceable from
 * per-degree pages. Degree-card gate at pre-tag-gate step 8 is unrelated
 * to and untouched by this spec.
 *
 * Consumers (current): tests at __tests__/ps-spec.test.mjs.
 * Consumers (future, out-of-scope at v666): a backfill script that lifts
 * crew prose from per-degree index.html into structured records;
 * pre-tag-gate wiring at next degree-advance.
 */

export const PS_CARD_TEMPLATE_VERSION = '1.0';

/**
 * Canonical sponsoring organizations. Open enum — additions are expected
 * as cohort coverage grows. Values are short canonical labels chosen for
 * stability and disambiguation, not exhaustive country-code dereferencing.
 *
 * Examples in v666 fixture set:
 *   - CNES (France) — Centre National d'Études Spatiales
 *   - KACST (Saudi Arabia) — King Abdulaziz City for Science and Technology
 *     (note: STS-51-G Al-Saud's flight was via the Arab Satellite Communications
 *     Organization / Arabsat consortium, not KACST proper; KACST stands in as
 *     the canonical Saudi sponsoring agency. See `notes` for case-specific
 *     provenance.)
 *   - civilian-academic (USA) — university faculty flown as PS
 *
 * Forward additions: ESA, JAXA, CSA, ASI, DLR, INSA, etc. as cohort grows.
 */
export const KNOWN_SPONSORING_ORGS = [
  'NASA',
  'CNES',
  'KACST',
  'ESA',
  'civilian-academic',
  'civilian-commercial',
  'commercial-self',
  'DoD',
  'military',
  'politician-as-PS',
];

/**
 * mission_role_class enum. Closed — additions require schema-version bump.
 *
 * - 'PS' — standard payload specialist (any nationality)
 * - 'observer' — flown observer with no operational duties
 * - 'scientist-cosmonaut' — Soviet/Russian programme analog; for cross-programme records
 * - 'politician-as-PS' — political-oversight principal flown as PS (Garn v660, Glenn STS-95 future)
 * - 'commercial-as-PS' — commercial-partner-flown PS (Walker McDonnell Douglas v660)
 * - 'military-PS' — active-duty military flown as PS distinct from CDR/PLT/MS military career path
 */
export const MISSION_ROLE_CLASSES = [
  'PS',
  'observer',
  'scientist-cosmonaut',
  'politician-as-PS',
  'commercial-as-PS',
  'military-PS',
];

/**
 * Hard limits — mirror the spec.mjs convention so meta-tests can run a
 * uniform forbidden-content sweep across both card types.
 */
export const PS_HARD_LIMITS = {
  totalRecordBytes: 2000,
  nameChars: 120,
  payloadSpecialtyChars: 200,
  notesChars: 400,
  nameVariantChars: 120,
  maxNameVariants: 6,
  // Re-use spec.mjs forbidden patterns by intent: substrate-arc narratives,
  // lesson refs, FA-N-N RESOLVED markers, and obs#N first-instance markers
  // belong on per-degree pages, not on structured PS records.
  forbiddenContentPatterns: [
    /substrate-arc/i,
    /#1\d{4}\b/,
    /FA-\d+-\d+\s+RESOLVED/,
    /obs#\d+\s+first-instance/i,
    /cross-track\s+substrate-emergent/i,
  ],
};

/**
 * ISO 3166-1 alpha-3 country code regex. Strict — three uppercase letters.
 */
export const ISO_ALPHA3_RE = /^[A-Z]{3}$/;

/**
 * NASA degree ID regex. Matches the existing per-degree directory naming
 * convention (e.g., "1.120"); decimal-style degree numbering.
 */
export const NASA_DEGREE_RE = /^\d+\.\d+$/;

/**
 * Crew role regex. Matches CDR / PLT / MS<n> / PS<n> / observer / scientist.
 * Permissive on tail to admit observer / scientist roles for cross-programme
 * records without requiring schema bumps.
 */
export const CREW_ROLE_RE = /^(CDR|PLT|MS\d+|PS\d+|observer|scientist)$/;

/**
 * @typedef {Object} PsRecord
 * @property {string} name                  full name as flown (Latin script)
 * @property {string[]} [name_variants]     optional alternate spellings / formal names
 * @property {string} mission_id            NASA degree ref (e.g., "1.120")
 * @property {string} crew_role             "PS1" / "PS2" / "observer" / etc.
 * @property {string} nationality           ISO 3166-1 alpha-3 code (e.g., "FRA")
 * @property {string} sponsoring_organization
 * @property {string} mission_role_class    one of MISSION_ROLE_CLASSES
 * @property {string} payload_specialty     free-text, ≤200 chars
 * @property {number} [flight_count]        career flight number at this mission (1-based)
 * @property {number|null} [flight_career_total]  final career flight count if known
 * @property {string} [notes]               free-text, ≤400 chars, runs forbidden-pattern check
 */

/**
 * @typedef {Object} PsValidationResult
 * @property {boolean} pass
 * @property {string} name
 * @property {string} mission_id
 * @property {number} byteCount
 * @property {Array<{field: string, actual: number|string, limit: number|string, unit: string}>} fieldViolations
 * @property {string[]} forbiddenPatterns
 * @property {string[]} missingRequired
 * @property {string[]} enumViolations
 * @property {string} blockerMessage   single-line BLOCKER format when !pass
 */

const REQUIRED_FIELDS = [
  'name',
  'mission_id',
  'crew_role',
  'nationality',
  'sponsoring_organization',
  'mission_role_class',
  'payload_specialty',
];

/**
 * Validate a PsRecord against the spec.
 *
 * @param {PsRecord} record
 * @returns {PsValidationResult}
 */
export function validatePsRecord(record) {
  const fieldViolations = [];
  const forbiddenPatterns = [];
  const missingRequired = [];
  const enumViolations = [];

  if (!record || typeof record !== 'object') {
    return {
      pass: false,
      name: '',
      mission_id: '',
      byteCount: 0,
      fieldViolations: [],
      forbiddenPatterns: [],
      missingRequired: REQUIRED_FIELDS.slice(),
      enumViolations: [],
      blockerMessage: `[ps-card:BLOCKER] record is not an object`,
    };
  }

  for (const field of REQUIRED_FIELDS) {
    const v = record[field];
    if (v === undefined || v === null || v === '') missingRequired.push(field);
  }

  if (typeof record.name === 'string' && record.name.length > PS_HARD_LIMITS.nameChars) {
    fieldViolations.push({ field: 'name', actual: record.name.length, limit: PS_HARD_LIMITS.nameChars, unit: 'chars' });
  }

  if (typeof record.nationality === 'string' && !ISO_ALPHA3_RE.test(record.nationality)) {
    enumViolations.push(`nationality "${record.nationality}" is not ISO 3166-1 alpha-3 (expected /^[A-Z]{3}$/)`);
  }

  if (typeof record.mission_id === 'string' && !NASA_DEGREE_RE.test(record.mission_id)) {
    enumViolations.push(`mission_id "${record.mission_id}" does not match NASA degree pattern (expected /^\\d+\\.\\d+$/)`);
  }

  if (typeof record.crew_role === 'string' && !CREW_ROLE_RE.test(record.crew_role)) {
    enumViolations.push(`crew_role "${record.crew_role}" does not match expected role pattern`);
  }

  if (typeof record.mission_role_class === 'string' && !MISSION_ROLE_CLASSES.includes(record.mission_role_class)) {
    enumViolations.push(`mission_role_class "${record.mission_role_class}" not in known set`);
  }

  if (typeof record.payload_specialty === 'string' && record.payload_specialty.length > PS_HARD_LIMITS.payloadSpecialtyChars) {
    fieldViolations.push({ field: 'payload_specialty', actual: record.payload_specialty.length, limit: PS_HARD_LIMITS.payloadSpecialtyChars, unit: 'chars' });
  }

  if (typeof record.notes === 'string') {
    if (record.notes.length > PS_HARD_LIMITS.notesChars) {
      fieldViolations.push({ field: 'notes', actual: record.notes.length, limit: PS_HARD_LIMITS.notesChars, unit: 'chars' });
    }
    for (const pattern of PS_HARD_LIMITS.forbiddenContentPatterns) {
      const m = record.notes.match(pattern);
      if (m) forbiddenPatterns.push(m[0]);
    }
  }

  if (Array.isArray(record.name_variants)) {
    if (record.name_variants.length > PS_HARD_LIMITS.maxNameVariants) {
      fieldViolations.push({
        field: 'name_variants',
        actual: record.name_variants.length,
        limit: PS_HARD_LIMITS.maxNameVariants,
        unit: 'count',
      });
    }
    for (let i = 0; i < record.name_variants.length; i++) {
      const nv = record.name_variants[i];
      if (typeof nv !== 'string') {
        fieldViolations.push({ field: `name_variants[${i}]`, actual: typeof nv, limit: 'string', unit: 'type' });
      } else if (nv.length > PS_HARD_LIMITS.nameVariantChars) {
        fieldViolations.push({ field: `name_variants[${i}]`, actual: nv.length, limit: PS_HARD_LIMITS.nameVariantChars, unit: 'chars' });
      }
    }
  }

  const byteCount = Buffer.byteLength(JSON.stringify(record), 'utf8');
  if (byteCount > PS_HARD_LIMITS.totalRecordBytes) {
    fieldViolations.push({ field: 'total-record', actual: byteCount, limit: PS_HARD_LIMITS.totalRecordBytes, unit: 'bytes' });
  }

  const pass = fieldViolations.length === 0
    && forbiddenPatterns.length === 0
    && missingRequired.length === 0
    && enumViolations.length === 0;

  let blockerMessage = '';
  if (!pass) {
    const parts = [];
    if (fieldViolations.length > 0) {
      parts.push(`fields exceed: ${fieldViolations.map((v) => `${v.field} ${v.actual} ${v.unit} (limit ${v.limit})`).join(', ')}`);
    }
    if (forbiddenPatterns.length > 0) parts.push(`forbidden patterns: ${forbiddenPatterns.join(', ')}`);
    if (missingRequired.length > 0) parts.push(`missing required: ${missingRequired.join(', ')}`);
    if (enumViolations.length > 0) parts.push(`enum/format violations: ${enumViolations.join('; ')}`);
    const idLabel = `${record.name || '<unnamed>'} @ ${record.mission_id || '<no-mission>'}`;
    blockerMessage = `[ps-card:BLOCKER] ${idLabel} — ${parts.join('; ')}`;
  }

  return {
    pass,
    name: record.name || '',
    mission_id: record.mission_id || '',
    byteCount,
    fieldViolations,
    forbiddenPatterns,
    missingRequired,
    enumViolations,
    blockerMessage,
  };
}

/**
 * Validate a collection of PsRecords; returns per-record results plus an
 * overall pass flag. Useful for backfill scripts that load many records.
 *
 * @param {PsRecord[]} records
 * @returns {{ pass: boolean, results: PsValidationResult[], failureCount: number }}
 */
export function validatePsCollection(records) {
  if (!Array.isArray(records)) {
    return { pass: false, results: [], failureCount: 1 };
  }
  const results = records.map(validatePsRecord);
  const failureCount = results.filter((r) => !r.pass).length;
  return { pass: failureCount === 0, results, failureCount };
}
