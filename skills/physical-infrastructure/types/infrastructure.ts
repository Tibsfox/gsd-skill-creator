/**
 * Shared type definitions for the Physical Infrastructure Engineering Pack (v1.48).
 *
 * These interfaces form the data contracts between all pipeline layers:
 *   InfrastructureRequest  -> consumed by every domain skill and the Architect agent
 *   SafetyReviewResult     -> produced by the Safety Warden, consumed by all output skills
 *   BlueprintPackage       -> produced by Draftsman, consumed by Construction Docs and Renderer
 *   SimulationPackage      -> produced by Simulator, consumed by downstream validation
 *   BillOfMaterials        -> embedded in BlueprintPackage
 */

/** Three-dimensional bounding box in meters. Used for spatial constraint checking. */
export interface BoundingBox {
  width_m: number;
  depth_m: number;
  height_m: number;
}

/** Drawing title block per ANSI/ASME Y14.1 conventions. */
export interface TitleBlock {
  projectName: string;
  drawingNumber: string;
  revision: string;
  date: string;
  drawnBy: string;
  checkedBy?: string;
  approvedBy?: string;
  scale: string;
  sheet: string;
}

/** A numeric value with its unit label. The atomic building block for typed calculations. */
export interface UnitValue {
  value: number;
  unit: string;
}

/** A single line item in a Bill of Materials. */
export interface BomItem {
  lineNumber: number;
  description: string;
  partNumber?: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  supplier?: string;
  notes?: string;
}

/** Bill of Materials aggregating all material requirements from a design. */
export interface BillOfMaterials {
  items: BomItem[];
  totalEstimatedCost?: number;
  currency?: string;
  generatedAt: string;
}

/** A single finding from the Safety Warden's review. */
export interface SafetyFinding {
  severity: 'info' | 'warning' | 'critical' | 'blocking';
  domain: 'pressure' | 'voltage' | 'temperature' | 'chemical' | 'structural';
  description: string;
  threshold: string;
  actualValue: string;
  recommendation: string;
  requiresHumanReview: boolean;
}

/** Engineering drawing specification for P&ID, SLD, floor plan, etc. */
export interface DrawingSpec {
  type: 'P&ID' | 'SLD' | 'floor_plan' | 'isometric' | 'detail';
  format: 'svg' | 'dxf' | 'pdf';
  scale: string;
  revisionNumber: number;
  titleBlock: TitleBlock;
  content: string;
}

/** A single calculation record documenting inputs, outputs, and method used. */
export interface CalculationRecord {
  domain: string;
  inputs: Record<string, UnitValue>;
  outputs: Record<string, UnitValue>;
  method: string;
  safetyMargin: number;
}

/** Simulation input package for downstream analysis tools. */
export interface SimulationPackage {
  type: 'openfoam' | 'ngspice' | 'freecad-fem' | 'react-artifact';
  description: string;
  files: Record<string, string>;
  runInstructions: string;
}

/**
 * Primary skill input -- consumed by every domain skill and the Architect agent.
 * Describes what infrastructure needs to be designed, including physical constraints,
 * safety classification, and desired output formats.
 */
export interface InfrastructureRequest {
  type: 'cooling' | 'power' | 'thermal' | 'plumbing' | 'combined';
  constraints: {
    heatLoad_kW?: number;
    powerBudget_kW?: number;
    rackCount?: number;
    rackDensity_kW?: number;
    availableSpace?: BoundingBox;
    ambientTemp_C?: number;
    altitude_m?: number;
    redundancyLevel?: 'N' | 'N+1' | '2N' | '2N+1';
    voltageClass?: '120V' | '208V' | '240V' | '277V' | '400V' | '480V';
    solarAvailable_m2?: number;
    batteryRuntime_min?: number;
  };
  safetyClass: 'residential' | 'commercial' | 'industrial' | 'data-center';
  outputFormat: ('calculations' | 'blueprint' | 'simulation' | 'construction' | 'render')[];
}

/**
 * Safety Warden output -- consumed by all output skills.
 * The reviewedBy field is typed as the literal 'safety-warden' to enforce provenance.
 */
export interface SafetyReviewResult {
  status: 'passed' | 'flagged' | 'blocked';
  findings: SafetyFinding[];
  reviewedBy: 'safety-warden';
  timestamp: string;
}

/**
 * Composite output package from the blueprint engine.
 * Contains drawings, calculations, bill of materials, safety review, and optional simulation inputs.
 */
export interface BlueprintPackage {
  drawings: DrawingSpec[];
  calculations: CalculationRecord[];
  bom: BillOfMaterials;
  safetyReview: SafetyReviewResult;
  simulationInputs?: SimulationPackage;
}
