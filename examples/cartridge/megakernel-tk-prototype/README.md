# megakernel-tk-prototype (placeholder, v1.49.574 HB-06)

**Documentation only. No CUDA. No build.** This directory exists as the
canonical pointer for a future engineering mission to plant a Stage 1
ThunderKittens prototype against. The mission scope is laid out in
`docs/cartridge/megakernel/thunderkittens-reference-example.md`.

The substrate v1.49.574 ships:

- HB-01 instruction-tensor schema (`src/cartridge/megakernel/instruction-tensor-schema.ts`)
- HB-02 execution-trace telemetry hook (`src/traces/megakernel-trace/`)
- HB-03 JEPA-as-planner typed-interface stub (`src/orchestration/jepa-planner/`)
- HB-04 LoRA-adapter-selection schema (`src/cartridge/megakernel/adapter-selection-schema.ts`)
- HB-05 SOL budget-guidance hook (`src/orchestration/sol-budget/`)
- HB-07 verification doctrine (`docs/cartridge/megakernel/verification-doctrine.md`
  + `src/cartridge/megakernel/verification-spec.ts`)

A future engineering mission ships the actual CUDA prototype here, consumes
the schemas above, and emits trace events through HB-02.
