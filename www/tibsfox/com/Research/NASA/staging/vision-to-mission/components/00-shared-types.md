# Shared Types & Schemas — Component Specification

**Milestone:** NASA Mission Series
**Wave:** 0 | **Track:** —
**Model Assignment:** Haiku
**Estimated Tokens:** ~4K
**Dependencies:** None
**Produces:** `types/nasa-mission.ts`, `types/release-cycle.ts`, `types/pipeline-part.ts`, `types/retrospective.ts`

---

## Objective

Define all shared TypeScript interfaces and JSON schemas used across the NASA mission series infrastructure. Every downstream component consumes these types. They must be complete, locked, and validated before Wave 1 begins.

## Context

The NASA mission series requires consistent data structures across 73+ releases, 7 pipeline parts per release, and a retrospective chain spanning the entire run. Type safety prevents schema drift that would compound across hundreds of releases.

GSD pipeline discipline: shared types are always Wave 0, separate from implementation. The 5-minute cache TTL means these must be small, precise, and complete.

## Technical Specification

### Interfaces

```typescript
// types/nasa-mission.ts
interface NASAMission {
  id: string;                    // e.g., "mercury-freedom-7"
  version: string;               // e.g., "1.5"
  name: string;                  // e.g., "Freedom 7 (Mercury-Redstone 3)"
  epoch: 1 | 2 | 3 | 4 | 5 | 6;
  dateStart: string;             // ISO date
  dateEnd?: string;              // ISO date (optional for single-day missions)
  type: MissionType;
  crew?: CrewMember[];
  launchVehicle?: string;
  spacecraft?: string;
  objectives: string[];
  outcomes: string[];
  significance: string;
  predecessors: string[];        // mission IDs
  successors: string[];          // mission IDs
  safetyFlags: SafetyFlag[];
}

type MissionType = 'organization' | 'satellite' | 'probe' | 'crewed-suborbital' | 
  'crewed-orbital' | 'crewed-lunar' | 'space-station' | 'mars-lander' | 'mars-rover' |
  'outer-planet' | 'solar' | 'observatory' | 'commercial' | 'international' | 
  'tragedy' | 'planned';

interface CrewMember {
  name: string;
  role: string;
  notes?: string;
}

type SafetyFlag = 'disaster-narrative' | 'biosignature-boundary' | 
  'classified-adjacent' | 'cultural-sensitivity' | 'ongoing-mission';

// types/pipeline-part.ts
interface PipelinePart {
  part: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  missionId: string;
  version: string;
  status: 'pending' | 'in-progress' | 'complete' | 'blocked';
  artifacts: ArtifactManifest[];
  safetyWardenStatus: 'not-reviewed' | 'approved' | 'blocked';
  tokenEstimate: number;
  tokenActual?: number;
}

interface ArtifactManifest {
  path: string;
  type: 'study-guide' | 'skill' | 'chipset' | 'simulation' | 'try-session' |
    'diy-project' | 'capcom-script' | 'math-workbook' | 'dataset-connector' |
    'release-notes' | 'retrospective' | 'tspb-chapter';
  status: 'planned' | 'produced' | 'verified';
}

// types/release-cycle.ts
interface ReleaseCycle {
  version: string;               // e.g., "1.5"
  tag: string;                   // e.g., "nasa-v1.5"
  missionId: string;
  parts: PipelinePart[];
  releaseNotes: string;          // path to release notes
  retrospective: string;         // path to retrospective
  mainSyncStatus: 'pending' | 'clean' | 'conflicts-resolved' | 'failed';
  mainSyncConflicts?: string[];
  newSkills: string[];           // skill names created
  improvedSkills: string[];      // skill names updated
  tspbAdditions: string[];       // TSPB chapter/section paths
  lessonsApplied: LessonReference[];
  metrics: ReleaseMetrics;
}

interface ReleaseMetrics {
  totalTokens: number;
  opusTokens: number;
  sonnetTokens: number;
  haikuTokens: number;
  sessions: number;
  safetyWardenActions: number;
  templateChanges: number;
}

interface LessonReference {
  sourceVersion: string;
  lessonId: string;
  category: LessonCategory;
  description: string;
  applicationNote: string;
}

// types/retrospective.ts
interface Retrospective {
  version: string;
  missionId: string;
  passes: RetroPass[];
  lessons: Lesson[];
  templateDeltas: TemplateDelta[];
  tspbCandidates: TSPBCandidate[];
}

interface RetroPass {
  passNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  name: string;
  findings: string[];
  actions: string[];
}

type LessonCategory = 'template-improvement' | 'skill-improvement' | 
  'agent-improvement' | 'process-improvement' | 'safety-finding' |
  'chipset-improvement' | 'team-topology-improvement';

interface Lesson {
  id: string;
  category: LessonCategory;
  description: string;
  severity: 'critical' | 'important' | 'minor';
  forwardLinked: boolean;
  appliedInVersion?: string;
}

interface TemplateDelta {
  template: string;              // which template changed
  pass: number;                  // which pass identified it
  change: string;                // description of change
  before: string;                // previous state
  after: string;                 // new state
}

interface TSPBCandidate {
  mathLayer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  sourcePart: 'C' | 'D' | 'E' | 'F';
  topic: string;
  targetChapter: string;
  description: string;
}
```

### Behavioral Requirements

- All date strings in ISO 8601 format
- Mission IDs are kebab-case, unique, immutable once assigned
- Safety flags are additive — once set, never removed
- Lesson IDs follow pattern: `v{version}-L{number}` (e.g., `v1.5-L003`)
- Token counts are integers (no fractional tokens)

## Implementation Steps

1. Create `types/` directory under nasa branch root
2. Write all four type files with complete interfaces
3. Add JSON Schema equivalents for runtime validation
4. Run `npx tsc --noEmit` to verify compilation
5. Write a simple validation script that checks a sample mission entry against the schema

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| ST-01 | Sample NASAMission object (Freedom 7) | TypeScript compiles | Zero tsc errors |
| ST-02 | Invalid mission (missing `name`) | Schema validation fails | Error on missing required field |
| ST-03 | Complete ReleaseCycle object | TypeScript compiles; JSON Schema validates | Zero errors both |
| ST-04 | Retrospective with 8 passes | All passes validate | passNumber 1-8 accepted; 0 or 9 rejected |

## Verification Gate

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] All four type files present at expected paths
- [ ] JSON Schema validation script runs and catches intentional errors in test fixtures
- [ ] No circular dependencies between type files
