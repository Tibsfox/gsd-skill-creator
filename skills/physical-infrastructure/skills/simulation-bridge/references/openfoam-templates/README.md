# OpenFOAM Case Templates

Parameterized OpenFOAM case directory templates in YAML format. The simulation-bridge skill uses these templates to generate complete, runnable OpenFOAM case directories from verified engineering calculations.

## How It Works

1. The user provides engineering parameters (pipe diameter, flow rate, heat load, etc.)
2. The simulation-bridge skill selects the appropriate template
3. Parameter values are substituted into the template's `generated_files` section
4. Each entry in `generated_files` becomes an actual file in the OpenFOAM case directory
5. The user runs the case locally with their OpenFOAM installation

## Templates

| Template | Solver | Turbulence | Use Case |
|----------|--------|------------|----------|
| data-center-airflow | buoyantSimpleFoam | k-epsilon | Raised-floor data center thermal management and hot spot identification |
| pipe-flow-pressure-drop | simpleFoam | k-omega SST | Pipe sizing validation against Darcy-Weisbach analytical calculation |
| heat-exchanger-performance | chtMultiRegionFoam | k-omega SST | Counter-flow heat exchanger LMTD/epsilon-NTU verification |

## YAML Structure

Each template YAML file follows this schema:

```yaml
template:
  name: string           # Template identifier
  solver: string         # OpenFOAM solver name
  turbulence_model: string
  description: string
  scenario: string       # Engineering scenario this solves

parameters:              # User-configurable with defaults
  <group>:
    <param_name>:
      type: number | string | array
      default: <value>
      unit: string
      description: string

generated_files:         # OpenFOAM case files with content
  system/controlDict: |
    ...
  constant/physicalProperties: |
    ...
  0/U: |
    ...

run_instructions: |      # Exact commands to execute
  blockMesh
  checkMesh
  <solver>
  paraFoam

validation:
  expected_outputs: [string]
  convergence_criteria: string
```

## Parameter Substitution

Parameters use their default values in the template content. To customize:

1. Read the `parameters` section to see all configurable values
2. Recalculate derived values (e.g., inlet velocity from flow rate and diameter)
3. Replace the corresponding values in `generated_files` content
4. Write each `generated_files` entry as a file in the case directory

Example: changing pipe diameter from 100mm to 150mm in pipe-flow-pressure-drop requires updating:
- `0/U`: recalculate inlet velocity `v = Q / A = Q / (pi * (D/2)^2)`
- `system/blockMeshDict`: update mesh geometry dimensions

## Prerequisites

- **OpenFOAM v2112 or later** (ESI-OpenFOAM or Foundation version)
- **ParaView** for post-processing visualization
- **blockMesh** and **checkMesh** utilities (included with OpenFOAM)
- For heat-exchanger-performance: **snappyHexMesh** for multi-region meshing

## Run Times

| Template | Typical Mesh Size | Estimated Run Time |
|----------|------------------|--------------------|
| data-center-airflow | 500K-2M cells | 30-120 minutes |
| pipe-flow-pressure-drop | 50K-200K cells | 5-15 minutes |
| heat-exchanger-performance | 200K-1M cells (3 regions) | 2-6 hours |

All run times assume a modern multi-core workstation. Use `decomposePar` and `mpirun` for parallel execution on larger meshes.

---
*All simulation results must be verified by a licensed Professional Engineer before use in design decisions.*
