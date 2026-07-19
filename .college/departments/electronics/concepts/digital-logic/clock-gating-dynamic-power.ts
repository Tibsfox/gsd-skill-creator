/**
 * Clock Gating For Dynamic Power Reduction concept — electronics digital-logic wing (June-2026 EE-scan, T2).
 *
 * Source: arXiv:2606.17461v1 (2026).
 *
 * @module departments/electronics/concepts/digital-logic/clock-gating-dynamic-power
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 1 * 2 * Math.PI / 29;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const clockGatingDynamicPower: RosettaConcept = {
  id: 'elec-clock-gating-dynamic-power',
  name: 'Clock Gating For Dynamic Power Reduction',
  domain: 'electronics',
  description: 'Clock gating is the most widely used technique for cutting dynamic (switching) power in synchronous CMOS logic. In a CMOS circuit the dominant switching-power term is P = alpha*C*V^2*f, where C is the switched capacitance, V the supply voltage, f the clock frequency, and alpha the activity factor (the average fraction of cycles on which a node toggles). The clock network is the busiest net on a chip: it toggles every cycle (alpha near 1) and fans out to every flip-flop, so clock distribution and the registers it drives can consume 30 to 50 percent of total dynamic power. Clock gating attacks this by inserting an enable-controlled gate in a local clock branch, so registers receive clock edges only when their stored data can actually change; when a block is idle its clock is held static, its flip-flops stop toggling, and the downstream combinational logic they feed also stops switching. To avoid injecting glitches on the clock, designers use an integrated clock-gating (ICG) cell -- a level-sensitive latch that samples the enable while the clock is low, feeding an AND gate -- rather than a bare AND. Gating can be coarse-grain (whole modules) or fine-grain (individual registers), the latter derived from enable conditions already present in the RTL. Because it lowers effective alpha without altering function, clock gating is inserted automatically by synthesis tools and, increasingly, by ML/LLM-driven RTL-rewriting flows guided by measured workload toggling traces. The AUTOGATE flow is a concrete instance: because an LLM cannot ingest raw multi-million-cycle waveforms, an ML clustering stage first distills the toggling traces into compact representations, then an LLM rewrites the RTL to add enables in a hierarchical multi-agent loop -- a division of labor that is why waveform-aware gating was previously hand-done. It reports roughly 49.31% average dynamic-power reduction on small designs, 19.34% on NVDLA, 7.96% on BlackParrot, and up to 6.86% even on already power-optimized production designs.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-sequential-logic-design',
      description: 'Clock gating operates on clocked sequential elements: it inserts an enable in the local clock path of flip-flops and registers, so understanding synchronous sequential logic and clock distribution is a prerequisite.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-low-power-bus-encoding',
      description: 'Both are dynamic-power-reduction techniques that attack the activity-factor term alpha in P = alpha*C*V^2*f -- clock gating by suppressing idle clock edges, bus encoding by reducing signal transitions on high-capacitance interconnect.',
    },
    {
      type: 'dependency',
      targetId: 'elec-semiconductor-physics',
      description: 'The quadratic V^2 dependence and the fact that CMOS burns switching energy (roughly C*V^2 per transition) come from the underlying transistor/capacitor charge-discharge physics that clock gating exploits.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
