// ProgressState — master state for entire dogfood pipeline
export interface ProgressState {
  missionId: 'v1.40';
  startedAt: string;           // ISO timestamp
  lastUpdatedAt: string;       // ISO timestamp
  extraction: {
    status: 'pending' | 'running' | 'complete' | 'failed';
    chaptersExtracted: number; // out of 33
    chunksGenerated: number;
    totalPages: number;
    errors: string[];
  };
  learning: {
    trackA: TrackProgress;     // Parts I-V
    trackB: TrackProgress;     // Parts VI-X
  };
  verification: {
    status: 'pending' | 'running' | 'complete';
    conceptsVerified: number;
    gapsFound: number;
    gapsByType: Record<string, number>;
  };
  refinement: {
    status: 'pending' | 'running' | 'complete';
    patchesGenerated: number;
    ticketsGenerated: number;
    skillsUpdated: number;
    reportComplete: boolean;
  };
}

export interface TrackProgress {
  status: 'pending' | 'running' | 'complete';
  currentPart: number;
  currentChapter: number;
  chunksProcessed: number;
  chunksTotal: number;
  conceptsLearned: number;
  tokensUsed: number;
  errors: string[];
}

// Checkpoint — written at every chapter boundary for resume
export interface Checkpoint {
  waveId: string;
  componentId: string;
  lastCompletedItem: string;   // chunk or chapter ID
  timestamp: string;           // ISO timestamp
  stateHash: string;           // SHA-256 hex of JSON state (integrity check)
  resumeInstructions: string;  // human-readable
}

// Metrics types (used by Plan 02 but defined here for sharing)
export interface IngestionMetrics {
  chapters: ChapterMetrics[];
  totals: {
    tokensUsed: number;
    tokensPerChapter: number;
    tokensPerConcept: number;
    conceptsPerChapter: number;
    gapsPerChapter: number;
    processingTimeMs: number;
    wallClockTimeMs: number;
  };
  performance: {
    extractionTokensPerPage: number;
    learningTokensPerChunk: number;
    verificationTokensPerConcept: number;
    checkpointOverheadMs: number;
    mathDensityCorrelation: number;
  };
}

export interface ChapterMetrics {
  chapter: number;
  part: number;
  chunksGenerated: number;
  conceptsDetected: number;
  mathDensity: number;
  tokensUsed: number;
  processingTimeMs: number;
  errorsEncountered: number;
  gapsFound: number;
}
