/**
 * Structured data types for parsed .planning/ artifacts.
 */

export interface Section {
  title: string;
  level: number;
  content: string;
}

export interface TableRow {
  [key: string]: string;
}

export interface ProjectData {
  name: string;
  description: string;
  currentMilestone: {
    name: string;
    version: string;
  };
  context: string[];
  constraints: string[];
  decisions: {
    decision: string;
    rationale: string;
    outcome: string;
  }[];
}

export interface Requirement {
  id: string;
  text: string;
}

export interface RequirementGroup {
  name: string;
  requirements: Requirement[];
}

export interface RequirementsData {
  goal: string;
  groups: RequirementGroup[];
}

export interface Phase {
  number: number;
  name: string;
  status: string;
  goal: string;
  requirements: string[];
  deliverables: string[];
}

export interface RoadmapData {
  phases: Phase[];
  totalPhases: number;
}

export interface StateData {
  milestone: string;
  phase: string;
  status: string;
  progress: string;
  focus: string;
  blockers: string[];
  metrics: { [key: string]: string };
  nextAction: string;
}

export interface MilestoneData {
  version: string;
  name: string;
  goal: string;
  shipped: string;
  stats: {
    requirements?: number;
    phases?: number;
    plans?: number;
  };
  accomplishments?: string[];
}

export interface MilestonesData {
  milestones: MilestoneData[];
  totals: {
    milestones: number;
    phases: number;
    plans: number;
  };
}

export interface DashboardData {
  project?: ProjectData;
  requirements?: RequirementsData;
  roadmap?: RoadmapData;
  state?: StateData;
  milestones?: MilestonesData;
  generatedAt: string;
}
