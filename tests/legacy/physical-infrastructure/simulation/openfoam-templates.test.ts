import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const TEMPLATES_DIR = resolve(
  'skills/physical-infrastructure/skills/simulation-bridge/references/openfoam-templates'
);

describe('Template files exist', () => {
  it('data-center-airflow.yaml exists', () => {
    expect(() => readFileSync(`${TEMPLATES_DIR}/data-center-airflow.yaml`)).not.toThrow();
  });
  it('pipe-flow-pressure-drop.yaml exists', () => {
    expect(() => readFileSync(`${TEMPLATES_DIR}/pipe-flow-pressure-drop.yaml`)).not.toThrow();
  });
  it('heat-exchanger-performance.yaml exists', () => {
    expect(() => readFileSync(`${TEMPLATES_DIR}/heat-exchanger-performance.yaml`)).not.toThrow();
  });
  it('README.md exists', () => {
    expect(() => readFileSync(`${TEMPLATES_DIR}/README.md`)).not.toThrow();
  });
});

describe('Template structure — data-center-airflow', () => {
  let raw: string;
  beforeAll(() => {
    raw = readFileSync(`${TEMPLATES_DIR}/data-center-airflow.yaml`, 'utf-8');
  });

  it('has template section with name', () => expect(raw).toContain('name: data-center-airflow'));
  it('specifies buoyantSimpleFoam solver', () => expect(raw).toContain('buoyantSimpleFoam'));
  it('has parameters section', () => expect(raw).toContain('parameters:'));
  it('has room parameters', () => expect(raw).toContain('length_m:'));
  it('has rack parameters', () => expect(raw).toContain('heat_load_kW_per_rack:'));
  it('has cooling parameters', () => expect(raw).toContain('supply_temp_C:'));
  it('has generated_files section', () => expect(raw).toContain('generated_files:'));
  it('generates controlDict', () => expect(raw).toContain('system/controlDict:'));
  it('generates fvSchemes', () => expect(raw).toContain('system/fvSchemes:'));
  it('generates physical properties', () => expect(raw).toContain('physicalProperties:'));
  it('generates turbulence properties', () => expect(raw).toContain('turbulenceProperties:'));
  it('has run_instructions', () => expect(raw).toContain('run_instructions:'));
  it('run_instructions include blockMesh', () => expect(raw).toContain('blockMesh'));
  it('run_instructions include solver command', () => expect(raw).toContain('buoyantSimpleFoam'));
  it('run_instructions include paraFoam', () => expect(raw).toContain('paraFoam'));
  it('has validation section with convergence criteria', () =>
    expect(raw).toContain('convergence_criteria:'));
});

describe('Template structure — pipe-flow-pressure-drop', () => {
  let raw: string;
  beforeAll(() => {
    raw = readFileSync(`${TEMPLATES_DIR}/pipe-flow-pressure-drop.yaml`, 'utf-8');
  });

  it('has template section with name', () =>
    expect(raw).toContain('name: pipe-flow-pressure-drop'));
  it('specifies simpleFoam solver', () => expect(raw).toContain('simpleFoam'));
  it('specifies kOmegaSST turbulence', () => expect(raw).toContain('kOmegaSST'));
  it('has pipe diameter parameter', () => expect(raw).toContain('diameter_mm:'));
  it('has fluid flow rate parameter', () => expect(raw).toContain('flow_rate_LPM:'));
  it('has generated velocity field (0/U)', () => expect(raw).toContain('0/U:'));
  it('has generated pressure field (0/p)', () => expect(raw).toContain('0/p:'));
  it('has run_instructions with simpleFoam', () => expect(raw).toContain('simpleFoam'));
  it('references Darcy-Weisbach in validation', () => expect(raw).toContain('Darcy-Weisbach'));
});

describe('Template structure — heat-exchanger-performance', () => {
  let raw: string;
  beforeAll(() => {
    raw = readFileSync(`${TEMPLATES_DIR}/heat-exchanger-performance.yaml`, 'utf-8');
  });

  it('has template section with name', () =>
    expect(raw).toContain('name: heat-exchanger-performance'));
  it('specifies chtMultiRegionFoam solver', () => expect(raw).toContain('chtMultiRegionFoam'));
  it('has hot_side parameters', () => expect(raw).toContain('hot_side:'));
  it('has cold_side parameters', () => expect(raw).toContain('cold_side:'));
  it('has region properties', () => expect(raw).toContain('regionProperties:'));
  it('run_instructions include snappyHexMesh or blockMesh', () => {
    expect(raw.includes('snappyHexMesh') || raw.includes('blockMesh')).toBe(true);
  });
  it('run_instructions include chtMultiRegionFoam', () =>
    expect(raw).toContain('chtMultiRegionFoam'));
  it('references epsilon-NTU in validation', () => expect(raw).toContain('NTU'));
});

describe('README content', () => {
  let readme: string;
  beforeAll(() => {
    readme = readFileSync(`${TEMPLATES_DIR}/README.md`, 'utf-8');
  });

  it('mentions all three templates', () => {
    expect(readme).toContain('data-center-airflow');
    expect(readme).toContain('pipe-flow-pressure-drop');
    expect(readme).toContain('heat-exchanger-performance');
  });
  it('mentions OpenFOAM', () => expect(readme).toContain('OpenFOAM'));
  it('mentions parameter substitution or usage', () => {
    expect(readme.toLowerCase()).toMatch(/parameter|usage|how to/);
  });
});
