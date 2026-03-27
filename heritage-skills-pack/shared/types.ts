/**
 * Shared type definitions for the Heritage Skills Educational Pack.
 *
 * These types form the canonical contract that every downstream component
 * in the Heritage Skills pack (safety wardens, cultural sovereignty wardens,
 * skill rooms, oral history, SUMO ontology, badge engine) builds against.
 *
 * Pure type definitions only -- no implementation.
 * Designed for Phase 2 extensibility: Tradition enum will gain SALISH_SEA,
 * Badge types will be added in Phase 35.
 *
 * @module heritage-skills-pack/shared/types
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

/**
 * Numeric identifier for each of the 14 skill rooms in the Heritage Skills Hall.
 *
 * Values 1-14 map directly to physical room numbers. Phase 2 will extend to 18
 * rooms when SALISH_SEA and marine-skills rooms are added.
 */
export enum RoomNumber {
  BUILDING = 1,
  FIBER = 2,
  ANIMALS = 3,
  WOODCRAFT = 4,
  FOOD = 5,
  MUSIC = 6,
  METALWORK = 7,
  POTTERY = 8,
  PLANTS = 9,
  COMMUNITY = 10,
  SEASONAL = 11,
  HISTORY = 12,
  NORTHERN_WATERCRAFT = 13,
  ARCTIC_LIVING = 14,
}

/**
 * String domain identifier for each skill room.
 *
 * Used in URL slugs, file paths, and human-readable labels. Each value
 * corresponds 1:1 with a RoomNumber enum value.
 */
export enum SkillDomain {
  BUILDING = 'building',
  FIBER = 'fiber',
  ANIMALS = 'animals',
  WOODCRAFT = 'woodcraft',
  FOOD = 'food',
  MUSIC = 'music',
  METALWORK = 'metalwork',
  POTTERY = 'pottery',
  PLANTS = 'plants',
  COMMUNITY = 'community',
  SEASONAL = 'seasonal',
  HISTORY = 'history',
  NORTHERN_WATERCRAFT = 'northern-watercraft',
  ARCTIC_LIVING = 'arctic-living',
}

/**
 * Cultural tradition a skill module or try-session originates from.
 *
 * CROSS_TRADITION is used for content that bridges or synthesizes practices
 * across multiple traditions. Phase 2 will add SALISH_SEA.
 */
export enum Tradition {
  APPALACHIAN = 'appalachian',
  FIRST_NATIONS = 'first-nations',
  INUIT = 'inuit',
  CROSS_TRADITION = 'cross-tradition',
}

/**
 * Safety handling level for a skill module or try-session step.
 *
 * - STANDARD: No additional safety annotation needed.
 * - ANNOTATED: A safety note is displayed inline.
 * - GATED: User must explicitly acknowledge the safety risk before proceeding.
 * - REDIRECTED: Cannot proceed; user is redirected to a professional or
 *   community resource. Used for content outside safe DIY scope.
 */
export enum SafetyLevel {
  STANDARD = 'standard',
  ANNOTATED = 'annotated',
  GATED = 'gated',
  REDIRECTED = 'redirected',
}

/**
 * Physical safety domain covered by a safety rule or skill room.
 *
 * 9 domains covering the full range of physical risks in heritage
 * skills practice (Phase 1). Phase 2 adds MARINE.
 */
export enum SafetyDomain {
  FOOD = 'food',
  PLANT = 'plant',
  TOOL = 'tool',
  MEDICAL = 'medical',
  STRUCTURAL = 'structural',
  FIRE = 'fire',
  CHEMICAL = 'chemical',
  ANIMAL = 'animal',
  ARCTIC_SURVIVAL = 'arctic-survival',
  /** Marine safety: cold water, tidal patterns, vessel stability, navigation (Phase 2). */
  MARINE = 'marine',
}

/**
 * Cultural sovereignty classification level for heritage content.
 *
 * Based on OCAP principles (Ownership, Control, Access, Possession) and
 * the NISR framework. Level 4 sacred content is an absolute hard block --
 * no override is permitted under any circumstances.
 *
 * Numeric values are ordered: 1 (most open) < 2 < 3 < 4 (most restricted).
 */
export enum CulturalSovereigntyLevel {
  /** Publicly shared knowledge, freely reproducible with attribution. */
  PUBLICLY_SHARED = 1,
  /** Contextually shared -- appropriate for educational settings with proper framing. */
  CONTEXTUALLY_SHARED = 2,
  /** Community restricted -- requires explicit community permission. */
  COMMUNITY_RESTRICTED = 3,
  /** Sacred or ceremonial -- absolute block, no override permitted. */
  SACRED_CEREMONIAL = 4,
}

/**
 * Source type for knowledge or content referenced in the Heritage Skills pack.
 *
 * Used to track provenance and fair-use compliance.
 */
export enum KnowledgeSource {
  PUBLISHED_BOOK = 'published-book',
  MUSEUM_EXHIBITION = 'museum-exhibition',
  COMMUNITY_PROGRAM = 'community-program',
  ACADEMIC_RESEARCH = 'academic-research',
  DOCUMENTARY = 'documentary',
  COMMUNITY_AUTHORIZED = 'community-authorized',
}

// ─── Core Skill Types ─────────────────────────────────────────────────────────

/**
 * A thematic content module within a skill room.
 *
 * ContentModules are the building blocks of skill rooms, grouping related
 * try-sessions and resources by theme and cultural context.
 */
export interface ContentModule {
  /** Unique module identifier within the pack. */
  id: string;
  /** Human-readable module title. */
  title: string;
  /** Primary cultural tradition this module represents. */
  tradition: Tradition;
  /** Description of the module's educational scope. */
  description: string;
  /** Safety handling level for this module's content. */
  safetyLevel: SafetyLevel;
  /** Cultural sovereignty level for this module's content. */
  culturalLevel: CulturalSovereigntyLevel;
  /** SUMO class identifiers relevant to this module's concepts. */
  sumoMappings: string[];
}

/**
 * A complete skill room module in the Heritage Skills Hall.
 *
 * Each SkillModule represents one of the 14 physical skill rooms and contains
 * all try-sessions, content modules, ontological bridges, and metadata for
 * that room.
 */
export interface SkillModule {
  /** Unique module identifier. */
  id: string;
  /** Numeric room identifier. */
  room: RoomNumber;
  /** Domain string for this room. */
  domain: SkillDomain;
  /** Human-readable room title. */
  title: string;
  /** Cultural traditions represented in this room. */
  traditions: Tradition[];
  /** SUMO class identifiers used in this room's ontology. */
  sumoClasses: string[];
  /** SUMO .kif files referenced by this room. */
  sumoFile: string[];
  /** Description of the room's educational scope and cultural context. */
  description: string;
  /** Physical safety domains addressed in this room. */
  safetyDomains: SafetyDomain[];
  /** Available guided try-sessions for this room. */
  trySessions: TrySession[];
  /** Thematic content modules within this room. */
  modules: ContentModule[];
  /** Optional ontological bridge sidebars for this room. */
  ontologicalBridges?: OntologicalBridge[];
}

/**
 * A guided hands-on learning session within a skill room.
 *
 * TrySessions provide step-by-step instructions for practicing a heritage
 * skill, with safety annotations and cultural context at each step.
 */
export interface TrySession {
  /** Unique session identifier. */
  id: string;
  /** Human-readable session title. */
  title: string;
  /** Cultural tradition this session represents. */
  tradition: Tradition;
  /** Skill difficulty level. */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Estimated completion time in minutes. */
  estimatedMinutes: number;
  /** Description of what the session teaches and covers. */
  description: string;
  /** Prerequisite session IDs or skill descriptions. */
  prerequisites: string[];
  /** Safety handling level for this session. */
  safetyLevel: SafetyLevel;
  /** Cultural sovereignty level for this session's content. */
  culturalLevel: CulturalSovereigntyLevel;
  /** Ordered steps in this session. */
  steps: SessionStep[];
  /** Primary SUMO process class for this session's activity. */
  sumoProcessClass: string;
}

/**
 * A single step within a TrySession.
 *
 * Steps carry safety notes, cultural context, nation-specific attribution,
 * and optional SUMO mapping to enable ontological traceability.
 */
export interface SessionStep {
  /** Ordinal position of this step (1-indexed). */
  order: number;
  /** Primary instruction text for the learner. */
  instruction: string;
  /** Optional safety warning or precaution for this step. */
  safetyNote?: string;
  /** Optional cultural framing or context for this step. */
  culturalContext?: string;
  /** Optional attribution to a specific nation or community for this knowledge. */
  nationAttribution?: string;
  /** Optional SUMO class or instance term for this step's activity. */
  sumoMapping?: string;
}

/**
 * A sidebar that makes ontological tensions between SUMO and Indigenous
 * knowledge systems visible as a teaching tool.
 *
 * Rather than forcing a mapping where SUMO and Indigenous frameworks diverge,
 * OntologicalBridges surface the tension explicitly and treat it as educational.
 */
export interface OntologicalBridge {
  /** Unique bridge identifier. */
  id: string;
  /** Human-readable title for the bridge sidebar. */
  title: string;
  /** SUMO's formal ontological view of the concept. */
  sumoView: string;
  /** Indigenous knowledge system's view of the same concept. */
  indigenousView: string;
  /** Cultural tradition providing the indigenous perspective. */
  tradition: Tradition;
  /** The educational insight or lesson this tension reveals. */
  teachingPoint: string;
}

// ─── Safety Types ─────────────────────────────────────────────────────────────

/**
 * A safety rule that triggers an annotation, gate, or redirect when matched.
 *
 * Safety rules are evaluated by the Safety Warden against content patterns.
 * Critical rules (e.g., food safety in Room 05, plant safety in Room 09)
 * cannot be overridden.
 */
export interface SafetyRule {
  /** Unique rule identifier. */
  id: string;
  /** Physical safety domain this rule applies to. */
  domain: SafetyDomain;
  /** Pattern (regex or keyword) that triggers this rule. */
  pattern: string;
  /** Safety level to apply when this rule is triggered. */
  level: SafetyLevel;
  /** The annotation to display when this rule fires. */
  annotation: SafetyAnnotation;
  /** Optional: restrict this rule to specific traditions. */
  traditions?: Tradition[];
}

/**
 * A safety annotation displayed to the user when a SafetyRule fires.
 */
export interface SafetyAnnotation {
  /** Physical safety domain this annotation belongs to. */
  domain: SafetyDomain;
  /** Safety handling level for this annotation. */
  level: SafetyLevel;
  /** The safety message shown to the user. */
  message: string;
  /** Whether this is a critical safety concern (e.g., food-borne illness, toxic plants). */
  isCritical: boolean;
  /** Whether the user can override this annotation (false for GATED/REDIRECTED). */
  canOverride: boolean;
  /** Optional: source or authority behind this safety guidance. */
  source?: string;
}

/**
 * A cultural sovereignty rule defining how content at a given level should
 * be handled for a specific tradition and domain.
 *
 * Level 4 rules always use action 'block' -- this is enforced by the
 * Cultural Sovereignty Warden and cannot be overridden.
 */
export interface CulturalSovereigntyRule {
  /** Unique rule identifier. */
  id: string;
  /** Cultural sovereignty classification level. */
  level: CulturalSovereigntyLevel;
  /** The tradition this rule applies to. */
  tradition: Tradition;
  /** The knowledge domain this rule applies to. */
  domain: string;
  /** Action to take when this rule matches. */
  action: 'include' | 'summarize-and-refer' | 'acknowledge-and-redirect' | 'block';
  /** Optional: target resource or community contact to refer the user to. */
  referralTarget?: string;
  /** Explanation of why this rule exists and the cultural reasoning behind it. */
  explanation: string;
}

// ─── Content Library Types ────────────────────────────────────────────────────

/**
 * A canonical reference work used as a source for the Heritage Skills pack.
 *
 * All content derived from CanonicalWorks must be fair-use compliant and
 * properly attributed. Creator-direct purchase links are prioritized.
 */
export interface CanonicalWork {
  /** Unique work identifier. */
  id: string;
  /** Title of the work. */
  title: string;
  /** Authors or editors. */
  authors: string[];
  /** Primary cultural tradition this work documents. */
  tradition: Tradition;
  /** ISBN if applicable. */
  isbn?: string;
  /** Ordered list of purchase links, prioritized creator-direct. */
  purchaseLinks: PurchaseLink[];
  /** Whether all use of this work in the pack is fair-use compliant. */
  fairUseCompliant: boolean;
  /** Description of the work's scope and relevance. */
  description: string;
  /** Volume references for multi-volume works (e.g., Foxfire series). */
  volumeRefs?: VolumeReference[];
  /** How this knowledge was originally sourced. */
  knowledgeSource: KnowledgeSource;
  /** Optional: statement of community endorsement or authorization. */
  communityEndorsement?: string;
}

/**
 * A purchase link for a CanonicalWork, prioritizing creator-direct sales.
 */
export interface PurchaseLink {
  /** Vendor name (e.g., 'Publisher Direct', 'Amazon', 'Bookshop.org'). */
  vendor: string;
  /** URL to purchase the work. */
  url: string;
  /** Whether this link goes directly to the creator or publisher. */
  isCreatorDirect: boolean;
  /** Sort priority (lower = higher priority in display). */
  priority: number;
}

/**
 * A reference to a specific volume within a multi-volume canonical work.
 */
export interface VolumeReference {
  /** Volume number. */
  volume: number;
  /** Volume title or subtitle. */
  title: string;
  /** Year of publication. */
  year: number;
  /** Skill rooms that draw from this volume. */
  relevantRooms: RoomNumber[];
}

// ─── Documentation Pipeline Types ─────────────────────────────────────────────

/**
 * A structured oral history interview guide for a specific tradition.
 *
 * Based on established oral history methodologies (OHA, Smithsonian,
 * IQ-Pilimmaksarniq, Foxfire) with appropriate consent protocols.
 */
export interface InterviewGuide {
  /** Unique guide identifier. */
  id: string;
  /** Methodology framework this guide follows. */
  methodology: 'OHA' | 'Smithsonian' | 'IQ-Pilimmaksarniq' | 'Foxfire';
  /** Title of this interview guide. */
  title: string;
  /** Cultural tradition this guide is designed for. */
  tradition: Tradition;
  /** Core interview practices included in this guide. */
  corePractices: CorePractice[];
  /** Ethics framework reference (e.g., 'OCAP', 'NISR'). */
  ethicsFramework: string;
  /** Consent protocol required before conducting interviews. */
  consentProtocol: ConsentProtocol;
}

/**
 * A core practice within an oral history interview methodology.
 */
export interface CorePractice {
  /** Unique practice identifier. */
  id: string;
  /** Human-readable practice name. */
  name: string;
  /** Description of the practice and how to implement it. */
  description: string;
  /** Optional: corresponding Inuit Qaujimajatuqangit (IQ) principle. */
  iqPrinciple?: string;
}

/**
 * Consent protocol requirements for oral history documentation.
 *
 * OCAP-compliant protocols are required for First Nations and Inuit content.
 * NISR compliance is required for content that may be shared digitally.
 */
export interface ConsentProtocol {
  /** Scope of consent required. */
  type: 'individual' | 'community' | 'both';
  /** Specific consent requirements to fulfill. */
  requirements: string[];
  /** Whether this protocol is compliant with OCAP principles. */
  ocapCompliant: boolean;
  /** Whether this protocol is compliant with NISR framework. */
  nisrCompliant: boolean;
}

/**
 * Front matter for a Heritage Book publication.
 */
export interface FrontMatter {
  /** Title page content. */
  titlePage: string;
  /** Optional dedication. */
  dedication?: string;
  /** Optional acknowledgments section. */
  acknowledgments?: string;
  /** Whether to include a table of contents. */
  tableOfContents: boolean;
  /** Optional territorial acknowledgment statement. */
  territorialAcknowledgment?: string;
  /** Required cultural sovereignty statement for all Heritage Books. */
  culturalSovereigntyStatement: string;
}

/**
 * Back matter for a Heritage Book publication.
 */
export interface BackMatter {
  /** Optional glossary of terms. */
  glossary?: Record<string, string>;
  /** Optional directory of community resources. */
  resourceDirectory?: string[];
  /** Required fair use notice. */
  fairUseNotice: string;
  /** Optional community contacts for follow-up or permissions. */
  communityContacts?: string[];
  /** Whether to include an index. */
  index?: boolean;
}

/**
 * A published Heritage Book compiling skills, interviews, and cultural
 * documentation for one or more traditions.
 */
export interface HeritageBook {
  /** Unique book identifier. */
  id: string;
  /** Book title. */
  title: string;
  /** Cultural traditions covered in this book. */
  traditions: Tradition[];
  /** Ordered chapters in this book. */
  chapters: HeritageChapter[];
  /** Front matter content. */
  frontMatter: FrontMatter;
  /** Back matter content. */
  backMatter: BackMatter;
  /** Bibliography entries for all sources cited. */
  bibliography: BibliographyEntry[];
  /** Attributions to contributors, communities, and tradition bearers. */
  attributions: Attribution[];
}

/**
 * A chapter within a HeritageBook.
 */
export interface HeritageChapter {
  /** Chapter order (1-indexed). */
  order: number;
  /** Chapter title. */
  title: string;
  /** Primary tradition this chapter documents. */
  tradition: Tradition;
  /** Type of content in this chapter. */
  contentType:
    | 'skill-documentation'
    | 'interview-transcript'
    | 'photo-essay'
    | 'cultural-context'
    | 'how-to-guide'
    | 'ontological-bridge';
  /** Estimated page count for layout planning. */
  estimatedPages: number;
}

/**
 * A bibliography entry for a source cited in the Heritage Skills pack.
 *
 * All entries must include a fair-use notice and a creator-first purchase link.
 */
export interface BibliographyEntry {
  /** Unique entry identifier. */
  id: string;
  /** Full formatted citation. */
  citation: string;
  /** Fair use rationale for use in this educational pack. */
  fairUseNotice: string;
  /** URL to the creator's or publisher's direct sales page (creator-first principle). */
  creatorFirstLink: string;
  /** Whether this source originated from an Indigenous community or knowledge holder. */
  isIndigenousSource: boolean;
  /** Optional: documentation of community permission for use. */
  communityPermission?: string;
}

/**
 * An attribution to a contributor, community, elder, or institution.
 */
export interface Attribution {
  /** Type of contributor. */
  type: 'author' | 'community' | 'elder' | 'tradition-bearer' | 'institution';
  /** Name of the contributor or community. */
  name: string;
  /** Optional: specific nation or community affiliation. */
  nation?: string;
  /** Role in this project or publication. */
  role: string;
  /** Consent status for this attribution. */
  consent: 'documented' | 'presumed-public' | 'community-endorsed';
}

// ─── Project Types ────────────────────────────────────────────────────────────

/**
 * A community-contributed heritage documentation project.
 */
export interface HeritageProject {
  /** Unique project identifier. */
  id: string;
  /** Project title. */
  title: string;
  /** Primary cultural tradition this project documents. */
  tradition: Tradition;
  /** Creator or lead contributor name. */
  creator: string;
  /** Optional geographic location of the project. */
  location?: GeoLocation;
  /** Current project status. */
  status: 'planning' | 'in-progress' | 'completed' | 'published';
  /** Optional Creative Commons attribution metadata. */
  commonsAttribution?: CommonsAttribution;
}

/**
 * Geographic location metadata for a HeritageProject.
 */
export interface GeoLocation {
  /** Named geographic region (e.g., 'Appalachian Mountains', 'Nunavut'). */
  region: string;
  /** Optional traditional territory name. */
  territory?: string;
  /** Optional GPS coordinates. */
  coordinates?: { lat: number; lng: number };
}

/**
 * Creative Commons attribution record for community contributions.
 */
export interface CommonsAttribution {
  /** Contributor identifier in the commons system. */
  contributorId: string;
  /** Pack identifier this contribution belongs to. */
  packId: string;
  /** Type of contribution made. */
  contributionType: 'content' | 'review' | 'translation' | 'community-liaison';
  /** Contribution value in community value units. */
  valueUnits: number;
}

// ─── SUMO Integration Types ───────────────────────────────────────────────────

/**
 * A mapping between a Heritage Skills concept and a SUMO ontology term.
 *
 * Enables formal ontological grounding of heritage knowledge, making the
 * educational content interoperable with the broader SUMO knowledge graph.
 */
export interface SUMOMapping {
  /** Identifier of the heritage concept being mapped. */
  heritageConceptId: string;
  /** The SUMO term this concept maps to. */
  sumoTerm: string;
  /** The SUMO .kif file that defines this term. */
  sumoFile: string;
  /** Type of ontological relationship between the heritage concept and SUMO term. */
  mappingType: 'instance' | 'subclass' | 'equivalent' | 'related';
  /** The formal KIF statement expressing this mapping in SUO-KIF syntax. */
  kifStatement: string;
  /** Natural language paraphrase of the KIF statement. */
  naturalLanguage: string;
  /** Optional: ID of an OntologicalBridge that surfaces tension with this mapping. */
  ontologicalBridge?: string;
}

/**
 * A path through the SUMO class hierarchy for a given term.
 *
 * Used to display the ontological classification chain to learners
 * (e.g., Canoe → WaterVehicle → TransportationDevice → Device → Artifact → Object → Physical → Entity).
 */
export interface SUMOHierarchyPath {
  /** The SUMO term at the bottom of this hierarchy path. */
  term: string;
  /** Ordered path from the term to the SUMO root (Entity). */
  path: string[];
  /** Depth of the term in the SUMO hierarchy. */
  depth: number;
}

/**
 * A bridge between a natural language word and its SUMO ontology term
 * via WordNet synset mapping.
 *
 * Enables natural language entry into the SUMO knowledge graph.
 */
export interface WordNetBridge {
  /** The natural language word or phrase. */
  word: string;
  /** WordNet synset identifier. */
  synsetId: string;
  /** The SUMO term this synset maps to. */
  sumoTerm: string;
  /** WordNet gloss (definition) for this synset. */
  gloss: string;
}
