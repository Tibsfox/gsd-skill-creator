/**
 * Instruction-Tensor Pattern concept — the megakernel "copper list" reborn.
 *
 * GPU-Architecture / Coordination-Primitive wing.
 *
 * The instruction-tensor pattern is the megakernel-era equivalent of the
 * Amiga Copper list: a CPU-produced sequence of (opcode, parameters,
 * sync-targets) tuples that an on-GPU interpreter consumes inside a single
 * persistent kernel. Documented in Hazy Research's "Look Ma, No Bubbles"
 * Llama-1B megakernel (arXiv:2505.22758, May 2025) and formalized at the
 * compiler IR level by Mirage MPK (arXiv:2512.22219) and Event Tensor
 * Compiler (arXiv:2604.13327, April 2026). For gsd-skill-creator, the
 * pattern is the M5 §1 Amiga ↔ megakernel mapping row 3 made operational
 * via HB-01 (src/cartridge/megakernel/instruction-tensor-schema.ts).
 *
 * Milestone: v1.49.574 megakernel-one-launch-one-chipset.
 *
 * @module departments/ai-computation/concepts/instruction-tensor-pattern
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~14*2pi/29, radius ~0.93 (instruction-coordination ring)
const theta = 14 * 2 * Math.PI / 29;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const instructionTensorPattern: RosettaConcept = {
  id: 'ai-computation-instruction-tensor-pattern',
  name: 'Instruction-Tensor Pattern',
  domain: 'ai-computation',
  description: 'An instruction tensor is a CPU-produced sequence of opcodes ' +
    'and parameters that an on-GPU interpreter consumes inside a single ' +
    'persistent CUDA kernel. The interpreter reads opcodes from the tensor ' +
    'and dispatches to a small set of CUDA templates (matmul, layer-norm, ' +
    'attention, RMS-norm, ...). Operations across instructions synchronize ' +
    'through global-memory counters: each instruction declares which counter ' +
    'it increments after completion and which counters it waits on before ' +
    'starting. The pattern collapses ~100 CUDA kernel launches per Llama-1B ' +
    'forward pass into one launch (Hazy Research, arXiv:2505.22758) and ' +
    'eliminates the ~50% memory-bandwidth gap that vLLM and SGLang leave on ' +
    'the table at low batch. The Amiga Copper list is the historical analog: ' +
    'a CPU-produced display list executed by a coprocessor without main-CPU ' +
    'intervention. For gsd-skill-creator, this concept is the chipset-format ' +
    'extension shipped in HB-01 ' +
    '(src/cartridge/megakernel/instruction-tensor-schema.ts): a typed Zod ' +
    'envelope with declared tensors, declared counters, instructions ' +
    '(opcode + operands + counter-sync + warp-role), and structural ' +
    'consistency validation. Default-off; opt-in via gsd-skill-creator.json ' +
    'megakernel-substrate.instruction-tensor-schema.enabled.',
  panels: new Map([
    ['typescript', {
      panelId: 'typescript',
      explanation: 'HB-01 ships InstructionTensor as a discriminated-union Zod schema. Opcodes are the canonical 18-element set: noop, matmul, matmul-tiled, layer-norm, rms-norm, attention, attention-flash, softmax, gelu, silu, add, mul, reduce-scatter, all-reduce, load-weights, store, barrier, host-callback. validateInstructionTensor() runs schema parse + structural-consistency checks (counter references match declared counters; tensor references match declared tensors; instruction IDs unique). serializeInstructionTensor / parseInstructionTensor round-trip lossless. See arXiv:2505.22758 + arXiv:2512.22219.',
    }],
    ['python', {
      panelId: 'python',
      explanation: 'The Mirage Persistent Kernel compiler (CMU Catalyst) lowers tensor programs into SM-level task graphs and generates optimized CUDA implementations for each instruction. The MPK in-kernel parallel runtime executes tasks within a single megakernel using decentralized scheduling across SMs. Event Tensor Compiler (arXiv:2604.13327) extends this to dynamic shapes and Mixture-of-Experts routing via the Event Tensor IR.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-megakernel-architecture-rhyme',
      description: 'The instruction-tensor-pattern is the megakernel-side instantiation of the architectural rhyme; counter-based synchronization is the minimum-viable coordination primitive that the typed envelope captures',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-jepa-kernel-planning',
      description: 'A future JEPA planner ranks candidate instruction-tensor variants in latent space; the typed schema is the action surface the planner emits transformations against',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
