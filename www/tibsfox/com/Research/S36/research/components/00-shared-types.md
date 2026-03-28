# Shared Types — Component Specification

**Milestone:** Seattle 360 Continuous Artist Release Engine
**Wave:** 0 | **Track:** Foundation
**Model Assignment:** Haiku
**Estimated Tokens:** ~4K (generated once; cached for all 360 cycles)
**Dependencies:** None — this is Wave 0 foundation
**Produces:** TypeScript type definitions + JSON schema files consumed by all components

---

## Objective

Define all shared data structures used across the 360-artist pipeline. Every component in
this mission consumes one or more types defined here. No component may define its own
conflicting schema for types defined in this file. Created once at engine initialization;
never modified during the 360-cycle run.

---

## Context

This engine processes 360 artists sequentially. Data flows through 8 components per artist
cycle. Without a shared type contract, components will make incompatible assumptions about
data shapes. These types are the contract that makes the pipeline composable.

The pipeline has 4 primary data objects that flow between components:
1. `ArtistProfile` — derived from CSV; flows through all components
2. `TheoryNodeList` — produced by component 02; consumed by 03
3. `CollegeLinkList` — produced by component 04; consumed by 03
4. `KnowledgeState` — accumulated across all 360 releases; read in Wave 0, written in Wave 3d

---

## Technical Specification

### Core Types

```typescript
// From CSV row — Wave 0 foundation
interface ArtistProfile {
  degree: number;          // 0–359 (unit circle position)
  name: string;            // Full display name
  slug: string;            // URL-safe: "quincy-jones" (lowercase, spaces→hyphens, parens removed)
  genre: string;           // Primary genre from CSV
  energy: number;          // 1–10 intensity scale
  era: string;             // Date range string, e.g. "1950s-2024"
  neighborhood: string;    // Seattle area from CSV
  label: string;           // Record label(s); may be "local" or "self-released"
  lat: number;
  lon: number;
  curriculumDepth: 'foundational' | 'intermediate' | 'advanced';
  // Derived from energy: 1-3=foundational, 4-6=intermediate, 7-10=advanced
  isDeceased?: boolean;    // Set by Safety Warden if determinable
  isLiving?: boolean;
}

// Produced by component 02
interface TheoryNode {
  conceptId: string;       // Unique slug: "ii-v-i-progression"
  conceptName: string;     // Display: "ii–V–I Progression"
  definition: string;      // 1–2 sentence definition
  curriculumLevel: 'foundational' | 'intermediate' | 'advanced';
  audibleEvidence: string; // Track name or structural description with this artist
  collegeNodePath: string; // Target: ".college/music/theory/harmony/ii-v-i.md"
  genealogyLinks: string[];// Prior artist degrees that used this concept: ["0", "7"]
  mathematicsBridge?: string; // Optional: ".college/mathematics/number-theory/ratios/"
}

interface TheoryNodeList {
  artistDegree: number;
  artistSlug: string;
  nodes: TheoryNode[];     // Min 3, max 8
  primaryDomain: string;   // "jazz-harmony" | "blues" | "folk" | "grunge" | etc.
  crossEraConnections: Array<{fromDegree: number; conceptId: string; connectionNote: string}>;
}

// Produced by component 04
interface CollegeLink {
  path: string;            // ".college/music/theory/harmony/ii-v-i.md"
  linkType: 'CREATE' | 'ENRICH';
  description: string;     // What this artist contributes to this node
  departmentPrimary: string; // "music" | "mathematics" | "history" | "mind-body"
  isMathBridge: boolean;   // True if connects to mathematics department
  section?: string;        // For ENRICH: which section of existing node gets the example
}

interface CollegeLinkList {
  artistDegree: number;
  artistSlug: string;
  links: CollegeLink[];    // Min 3, max 12
  newNodesCount: number;   // Count of CREATE links
  enrichedNodesCount: number; // Count of ENRICH links
}

// Accumulated across the 360-cycle run
interface TheoryGenealogy {
  [conceptId: string]: {
    conceptName: string;
    artistDegrees: number[];   // All artists who exhibited this concept
    firstArtist: number;       // Degree of first occurrence
    occurrenceCount: number;
    promotionCandidate: boolean; // True when occurrenceCount >= 5
    collegePath: string;
  };
}

interface KnowledgeState {
  version: string;             // "1.0.0"
  lastCompletedDegree: number; // -1 if none; 359 if complete
  totalReleasesComplete: number;
  theoryConcepts: TheoryGenealogy;
  collegeNodeIndex: string[];  // All .college/ paths created/enriched
  surpriseRegister: Array<{
    degree: number;
    surprise: string;
    carryWeight: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  activeSummary: string;       // ≤2K token plain-text summary for next Wave 0 seed
  tokenLedger: Array<{
    degree: number;
    tokensUsed: number;
    waveBreakdown: Record<string, number>;
  }>;
}

// Produced by component 06
interface CarryItem {
  tier: 'IMMEDIATE' | 'PATTERN' | 'ARCHITECTURAL';
  status: 'CONFIRMED' | 'INFERRED';
  situation: string;
  rootCause: string;
  recommendation: string;
  affectsNextN: number;      // How many upcoming artists this affects
}

interface RetrospectiveRecord {
  artistDegree: number;
  artistSlug: string;
  timestamp: string;         // ISO 8601
  surprises: string[];
  theoryConnectionsFound: string[];  // Concepts linking to prior artists
  collegeNodesCreated: number;
  collegeNodesEnriched: number;
  promotionCandidates: string[];    // conceptIds ready for full lesson
  carryItems: CarryItem[];
}

// Safety Warden output
interface SafetySignal {
  signal: 'PASS' | 'GATE' | 'BLOCK';
  artistDegree: number;
  artistSlug: number;
  findings: Array<{
    testId: string;           // e.g. "SC-01"
    severity: 'BLOCK' | 'GATE' | 'ANNOTATE';
    description: string;
    location: string;         // "Stage 2, paragraph 3" or "TheoryNode: blues-scale"
    remediation: string;
  }>;
  annotations: string[];      // ANNOTATE-level notes for human awareness
}

// Progress tracking
interface ProgressEntry {
  degree: number;
  slug: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'BLOCKED' | 'FAILED';
  startedAt?: string;         // ISO 8601
  completedAt?: string;
  blockedReason?: string;
  tokensUsed?: number;
}

interface ProgressLedger {
  engineVersion: string;
  startedAt: string;
  lastUpdatedAt: string;
  artists: ProgressEntry[];
  totalComplete: number;
  totalBlocked: number;
  cycleComplete: boolean;
}
```

### JSON Schema Files to Produce

| File | Content |
|------|---------|
| `schemas/artist-profile.schema.json` | ArtistProfile JSON Schema (draft-07) |
| `schemas/theory-node-list.schema.json` | TheoryNodeList JSON Schema |
| `schemas/college-link-list.schema.json` | CollegeLinkList JSON Schema |
| `schemas/knowledge-state.schema.json` | KnowledgeState JSON Schema |
| `schemas/retrospective-record.schema.json` | RetrospectiveRecord JSON Schema |
| `schemas/safety-signal.schema.json` | SafetySignal JSON Schema |
| `schemas/progress-ledger.schema.json` | ProgressLedger JSON Schema |

---

## Implementation Steps

1. Create `types/index.ts` in the engine root with all TypeScript interfaces above.
2. Generate JSON Schema files from the TypeScript types using `ts-json-schema-generator`.
3. Write `types/validators.ts` — a validation function per type using the JSON schemas.
4. Write `types/slug.ts` — slug generation function: lowercase, spaces→hyphens, remove
   parenthetical content (e.g., "(blues context)" stripped), special chars removed.
5. Write `types/curriculum-depth.ts` — maps energy integer to curriculumDepth enum.
6. Run `npx tsc --noEmit` to verify no TypeScript errors.
7. Write unit tests for slug generation and curriculumDepth mapping.

---

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| ST-01 | energy=1 | curriculumDepth="foundational" | Exact match |
| ST-02 | energy=5 | curriculumDepth="intermediate" | Exact match |
| ST-03 | energy=9 | curriculumDepth="advanced" | Exact match |
| ST-04 | name="Jimi Hendrix (blues context)" | slug="jimi-hendrix-blues-context" | Parens content kept but parentheses removed |
| ST-05 | name="Death Cab for Cutie" | slug="death-cab-for-cutie" | Spaces→hyphens |
| ST-06 | ArtistProfile with missing lat | Schema validation fails | ValidationError thrown |
| ST-07 | SafetySignal with signal="PASS" | Schema validation passes | No error |

## Verification Gate

- [ ] `npx tsc --noEmit` exits 0 (no TypeScript errors)
- [ ] All 7 JSON schema files present in `schemas/`
- [ ] `validators.ts` exports one validation function per type
- [ ] ST-01 through ST-07 all pass
- [ ] `slug()` function handles all names in the 360-row CSV without error (batch test)

## Safety Boundaries

No domain-specific safety boundaries for this component.
All safety enforcement is in component 08 (Safety Warden).
