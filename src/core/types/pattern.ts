// Pattern categories for different observation types
export type PatternCategory = 'commands' | 'decisions' | 'workflows' | 'contexts' | 'sessions' | 'events' | 'executions' | 'feedback' | 'lineage';

// Base pattern structure
export interface Pattern {
  timestamp: number;      // Unix timestamp ms
  category: PatternCategory;
  data: Record<string, unknown>;  // Category-specific payload
}

// Specific pattern types (extend as needed)
export interface CommandPattern extends Pattern {
  category: 'commands';
  data: {
    command: string;
    args?: string[];
    context?: Record<string, unknown>;
  };
}

export interface DecisionPattern extends Pattern {
  category: 'decisions';
  data: {
    decision: string;
    options?: string[];
    chosen?: string;
    rationale?: string;
  };
}
