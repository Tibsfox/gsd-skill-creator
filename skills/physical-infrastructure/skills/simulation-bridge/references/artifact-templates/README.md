# Interactive React Artifact Templates

Self-contained React component templates for engineering visualization. These are Level 1/2 simulation tools from the simulation-bridge progressive fidelity hierarchy — interactive enough to be immediately useful, with real engineering solvers embedded.

## Templates

| Template | Engineering Domain | Solver | Visualization |
|----------|-------------------|--------|---------------|
| pipe-network-calculator | Fluid systems | Hardy-Cross iteration | Results table with velocity/pressure/Re per segment |
| electrical-load-balancer | Power systems | Phase load calculation | SVG bar chart of phase loads, interactive circuit table |
| thermal-comfort-map | Thermal engineering | Point-source thermal model | SVG color-coded 2D temperature grid |
| solar-array-sizer | Solar PV | Irradiance model with tilt/latitude correction | SVG monthly production bar chart |

## How to Deploy

These components are designed to run as Claude artifacts. To deploy:

1. Copy the entire contents of a `.tsx` file
2. Paste into a Claude artifact panel (type: `application/vnd.ant.react`)
3. The component renders immediately — no build step needed

**Requirements in the artifact environment:**
- `React` must be available as a global (standard in Claude artifacts)
- No npm packages are imported — all logic is self-contained
- Recharts components are available if the artifact environment provides them, but all templates use SVG as the primary visualization

## Component Architecture

Each template follows the same pattern:

```tsx
function ComponentName() {
  // 1. State: all tunable parameters with React.useState
  const [param, setParam] = React.useState(defaultValue);

  // 2. Pure solver function (no I/O, deterministic, bounded iterations)
  function solve(inputs) { /* engineering calculation */ }

  // 3. React.useEffect for auto-recalculation on parameter change
  React.useEffect(() => { /* recalculate */ }, [param]);

  // 4. JSX: parameter controls + visualization + PE disclaimer
  return (<div>...</div>);
}

export default ComponentName;
```

**Solver constraints:**
- Pure: same inputs produce same outputs every time
- Synchronous: no async, no promises, no setTimeout
- Bounded: maximum iteration count prevents infinite loops
- Self-contained: no external data, no fetch calls

## Customization Guide

| Template | Key State Variables | What to Modify |
|----------|-------------------|----------------|
| pipe-network-calculator | flowRate_LPM, pipeDiameter_mm, pipeLength_m | Add more pipes to the network array, change resistance coefficients |
| electrical-load-balancer | circuits[], voltage_LN, powerFactor | Change default circuits, add voltage drop calculation |
| thermal-comfort-map | sources[], ambientTemp_C, gridWidth/Height | Change thermal model coefficients, add containment boundaries |
| solar-array-sizer | panelCount, efficiency, latitude, tilt_deg | Update irradiance data for specific location, add shading model |

## Educational Use

These artifacts bridge the gap between game-based intuition (Level 1) and professional simulation (Level 3):

1. **Explore**: Adjust sliders to see how parameters affect results
2. **Validate**: Compare artifact results to hand calculations
3. **Upgrade**: When artifact results need more fidelity, use the simulation-bridge skill to generate OpenFOAM or ngspice inputs

---
*All results are approximate. Verify with a licensed Professional Engineer before use in design or construction decisions.*
