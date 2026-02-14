// Detection types for pattern analysis and skill suggestion

// Suggestion state machine
export type SuggestionState = 'pending' | 'accepted' | 'deferred' | 'dismissed';

// Evidence explaining why a pattern is being suggested (DETECT-04)
export interface PatternEvidence {
  firstSeen: number;          // Timestamp of first occurrence
  lastSeen: number;           // Timestamp of most recent
  sessionIds: string[];       // Which sessions (up to 10 most recent)
  coOccurringFiles: string[]; // Files often seen with this pattern
  coOccurringTools: string[]; // Tools often seen with this pattern
}

// Skill candidate identified from patterns
export interface SkillCandidate {
  id: string;                   // Unique identifier, e.g., "cmd-prisma-migrate"
  type: 'command' | 'file' | 'tool' | 'workflow';
  pattern: string;              // The recurring pattern
  occurrences: number;          // Times seen
  confidence: number;           // 0-1 based on frequency and consistency
  suggestedName: string;        // Auto-generated skill name
  suggestedDescription: string; // Auto-generated description
  evidence: PatternEvidence;
}

// Suggestion with state tracking
export interface Suggestion {
  candidate: SkillCandidate;
  state: SuggestionState;
  createdAt: number;           // Timestamp when suggestion was created
  decidedAt?: number;          // When user decided
  deferredUntil?: number;      // Re-surface after this timestamp
  dismissReason?: string;      // Optional user explanation
  createdSkillName?: string;   // If accepted, link to created skill
  skillId?: string;            // Domain-prefixed skill identifier (e.g., I-0.prisma)
}

// Internal frequency counting structure
export interface FrequencyMap {
  commands: Map<string, number>;
  files: Map<string, number>;
  tools: Map<string, number>;
  coOccurrences: Map<string, Set<string>>;  // command -> files seen with it
  sessionTimestamps: Map<string, number[]>; // pattern -> session timestamps
  sessionIds: Map<string, string[]>;        // pattern -> session IDs
}

// Detection configuration
export interface DetectionConfig {
  threshold: number;     // Minimum occurrences to suggest (default 3)
  recencyDays: number;   // Weight recent sessions (default 14)
  deferDays: number;     // How long to defer suggestions (default 7)
  maxSuggestions: number; // Maximum suggestions to return (default 10)
}

// Default detection configuration
export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  threshold: 3,
  recencyDays: 14,
  deferDays: 7,
  maxSuggestions: 10,
};
