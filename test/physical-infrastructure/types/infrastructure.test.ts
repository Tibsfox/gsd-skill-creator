import { describe, it, expect } from 'vitest';
import type {
  InfrastructureRequest,
  BlueprintPackage,
  SafetyReviewResult,
  SimulationPackage,
  BillOfMaterials,
  BoundingBox,
  TitleBlock,
  UnitValue,
  CalculationRecord,
  DrawingSpec,
  SafetyFinding,
  BomItem,
} from '../../../skills/physical-infrastructure/types/infrastructure.js';

describe('InfrastructureRequest', () => {
  it('constructs a minimal cooling request', () => {
    const req: InfrastructureRequest = {
      type: 'cooling',
      constraints: { heatLoad_kW: 400, rackCount: 10 },
      safetyClass: 'data-center',
      outputFormat: ['calculations', 'blueprint'],
    };
    expect(req).toBeDefined();
    expect(req.type).toBe('cooling');
  });

  it('constructs a combined request', () => {
    const req: InfrastructureRequest = {
      type: 'combined',
      constraints: {},
      safetyClass: 'commercial',
      outputFormat: ['simulation'],
    };
    expect(req).toBeDefined();
    expect(req.type).toBe('combined');
  });

  it('safetyClass accepts all four values', () => {
    const classes: InfrastructureRequest['safetyClass'][] = [
      'residential', 'commercial', 'industrial', 'data-center',
    ];
    for (const sc of classes) {
      const req: InfrastructureRequest = {
        type: 'cooling',
        constraints: {},
        safetyClass: sc,
        outputFormat: ['calculations'],
      };
      expect(req.safetyClass).toBe(sc);
    }
  });

  it('outputFormat accepts all five values', () => {
    const formats: InfrastructureRequest['outputFormat'] = [
      'calculations', 'blueprint', 'simulation', 'construction', 'render',
    ];
    const req: InfrastructureRequest = {
      type: 'power',
      constraints: {},
      safetyClass: 'industrial',
      outputFormat: formats,
    };
    expect(req.outputFormat).toHaveLength(5);
  });

  it('redundancyLevel accepts N, N+1, 2N, 2N+1', () => {
    const levels: Array<NonNullable<InfrastructureRequest['constraints']['redundancyLevel']>> = [
      'N', 'N+1', '2N', '2N+1',
    ];
    for (const lvl of levels) {
      const req: InfrastructureRequest = {
        type: 'power',
        constraints: { redundancyLevel: lvl },
        safetyClass: 'data-center',
        outputFormat: ['calculations'],
      };
      expect(req.constraints.redundancyLevel).toBe(lvl);
    }
  });

  it('voltageClass accepts all six values', () => {
    const voltages: Array<NonNullable<InfrastructureRequest['constraints']['voltageClass']>> = [
      '120V', '208V', '240V', '277V', '400V', '480V',
    ];
    for (const vc of voltages) {
      const req: InfrastructureRequest = {
        type: 'power',
        constraints: { voltageClass: vc },
        safetyClass: 'commercial',
        outputFormat: ['calculations'],
      };
      expect(req.constraints.voltageClass).toBe(vc);
    }
  });
});

describe('SafetyReviewResult', () => {
  it('status accepts passed, flagged, blocked', () => {
    const statuses: SafetyReviewResult['status'][] = ['passed', 'flagged', 'blocked'];
    for (const status of statuses) {
      const result: SafetyReviewResult = {
        status,
        findings: [],
        reviewedBy: 'safety-warden',
        timestamp: '2026-02-26T12:00:00Z',
      };
      expect(result.status).toBe(status);
    }
  });

  it('reviewedBy is the literal "safety-warden"', () => {
    const result: SafetyReviewResult = {
      status: 'passed',
      findings: [],
      reviewedBy: 'safety-warden',
      timestamp: '2026-02-26T12:00:00Z',
    };
    expect(result.reviewedBy).toBe('safety-warden');
  });

  it('SafetyFinding with severity blocking and domain pressure constructs correctly', () => {
    const finding: SafetyFinding = {
      severity: 'blocking',
      domain: 'pressure',
      description: 'Pipe pressure exceeds rated maximum',
      threshold: '150 PSI max working pressure',
      actualValue: '165 PSI calculated',
      recommendation: 'Upgrade to Schedule 80 pipe',
      requiresHumanReview: true,
    };
    expect(finding.severity).toBe('blocking');
    expect(finding.domain).toBe('pressure');
    expect(finding.requiresHumanReview).toBe(true);
  });

  it('requiresHumanReview is boolean', () => {
    const finding: SafetyFinding = {
      severity: 'info',
      domain: 'temperature',
      description: 'Operating within safe range',
      threshold: '200°F maximum',
      actualValue: '150°F calculated',
      recommendation: 'No action required',
      requiresHumanReview: false,
    };
    expect(typeof finding.requiresHumanReview).toBe('boolean');
  });

  it('SafetyReviewResult with empty findings array constructs correctly', () => {
    const result: SafetyReviewResult = {
      status: 'passed',
      findings: [],
      reviewedBy: 'safety-warden',
      timestamp: '2026-02-26T12:00:00Z',
    };
    expect(result.findings).toHaveLength(0);
  });
});

describe('BlueprintPackage', () => {
  it('constructs a minimal BlueprintPackage', () => {
    const pkg: BlueprintPackage = {
      drawings: [],
      calculations: [],
      bom: {
        items: [],
        generatedAt: '2026-02-26T12:00:00Z',
      },
      safetyReview: {
        status: 'passed',
        findings: [],
        reviewedBy: 'safety-warden',
        timestamp: '2026-02-26T12:00:00Z',
      },
    };
    expect(pkg).toBeDefined();
    expect(pkg.drawings).toHaveLength(0);
  });

  it('simulationInputs is optional', () => {
    const pkg: BlueprintPackage = {
      drawings: [],
      calculations: [],
      bom: {
        items: [],
        generatedAt: '2026-02-26T12:00:00Z',
      },
      safetyReview: {
        status: 'passed',
        findings: [],
        reviewedBy: 'safety-warden',
        timestamp: '2026-02-26T12:00:00Z',
      },
    };
    expect(pkg.simulationInputs).toBeUndefined();
  });

  it('DrawingSpec with type P&ID and format svg constructs correctly', () => {
    const drawing: DrawingSpec = {
      type: 'P&ID',
      format: 'svg',
      scale: '1:50',
      revisionNumber: 1,
      titleBlock: {
        projectName: 'Test Project',
        drawingNumber: 'PID-001',
        revision: 'A',
        date: '2026-02-26',
        drawnBy: 'Claude',
        scale: '1:50',
        sheet: '1 of 1',
      },
      content: '<svg></svg>',
    };
    expect(drawing.type).toBe('P&ID');
    expect(drawing.format).toBe('svg');
  });

  it('CalculationRecord with method Darcy-Weisbach constructs correctly', () => {
    const calc: CalculationRecord = {
      domain: 'fluid',
      inputs: {
        flowRate: { value: 100, unit: 'GPM' },
        pipeSize: { value: 4, unit: 'in' },
      },
      outputs: {
        pressureDrop: { value: 2.5, unit: 'PSI' },
      },
      method: 'Darcy-Weisbach',
      safetyMargin: 15,
    };
    expect(calc.method).toBe('Darcy-Weisbach');
    expect(calc.safetyMargin).toBe(15);
  });
});

describe('BillOfMaterials', () => {
  it('constructs a minimal BillOfMaterials with empty items', () => {
    const bom: BillOfMaterials = {
      items: [],
      generatedAt: '2026-02-26T12:00:00Z',
    };
    expect(bom.items).toHaveLength(0);
    expect(bom.totalEstimatedCost).toBeUndefined();
  });

  it('BomItem with all optional fields constructs correctly', () => {
    const item: BomItem = {
      lineNumber: 1,
      description: '4" Schedule 40 Carbon Steel Pipe',
      partNumber: 'CS-A53-4-40',
      quantity: 100,
      unit: 'ft',
      unitCost: 12.50,
      supplier: 'Ferguson',
      notes: 'Cut to 20ft lengths',
    };
    expect(item.lineNumber).toBe(1);
    expect(item.supplier).toBe('Ferguson');
  });

  it('BomItem with only required fields constructs correctly', () => {
    const item: BomItem = {
      lineNumber: 2,
      description: 'Gate Valve 4"',
      quantity: 5,
      unit: 'ea',
    };
    expect(item.lineNumber).toBe(2);
    expect(item.partNumber).toBeUndefined();
    expect(item.unitCost).toBeUndefined();
  });
});

describe('SimulationPackage variants', () => {
  it('type accepts openfoam', () => {
    const sim: SimulationPackage = {
      type: 'openfoam',
      description: 'Data center airflow CFD',
      files: { controlDict: 'FoamFile...' },
      runInstructions: 'blockMesh && simpleFoam',
    };
    expect(sim.type).toBe('openfoam');
  });

  it('type accepts ngspice', () => {
    const sim: SimulationPackage = {
      type: 'ngspice',
      description: 'Power distribution circuit',
      files: { 'circuit.cir': '.title power dist\n.end' },
      runInstructions: 'ngspice circuit.cir',
    };
    expect(sim.type).toBe('ngspice');
  });

  it('type accepts freecad-fem and react-artifact', () => {
    const fem: SimulationPackage = {
      type: 'freecad-fem',
      description: 'Structural analysis',
      files: {},
      runInstructions: 'Open in FreeCAD FEM workbench',
    };
    const react: SimulationPackage = {
      type: 'react-artifact',
      description: 'Interactive pipe network visualization',
      files: { 'App.tsx': 'export default ...' },
      runInstructions: 'npm start',
    };
    expect(fem.type).toBe('freecad-fem');
    expect(react.type).toBe('react-artifact');
  });

  it('files is Record<string, string>', () => {
    const sim: SimulationPackage = {
      type: 'openfoam',
      description: 'Test',
      files: {
        controlDict: 'content1',
        fvSchemes: 'content2',
        fvSolution: 'content3',
      },
      runInstructions: 'run',
    };
    expect(Object.keys(sim.files)).toHaveLength(3);
  });
});

describe('Supporting types', () => {
  it('BoundingBox constructs correctly', () => {
    const box: BoundingBox = { width_m: 10, depth_m: 20, height_m: 3 };
    expect(box.width_m).toBe(10);
  });

  it('TitleBlock constructs with optional fields', () => {
    const tb: TitleBlock = {
      projectName: 'DC Cooling',
      drawingNumber: 'PID-001',
      revision: 'A',
      date: '2026-02-26',
      drawnBy: 'Claude',
      checkedBy: 'Reviewer',
      approvedBy: 'Engineer',
      scale: '1:50',
      sheet: '1 of 3',
    };
    expect(tb.checkedBy).toBe('Reviewer');
  });

  it('UnitValue constructs correctly', () => {
    const uv: UnitValue = { value: 42.5, unit: 'kW' };
    expect(uv.value).toBe(42.5);
    expect(uv.unit).toBe('kW');
  });
});
