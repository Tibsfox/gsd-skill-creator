# hdl-quickstart

Quickstart examples for using "real" HDLs alongside the SCRIBE bridge.

The viewer (`../viewer/`) emits Verilog directly. If you want to use Chisel (Scala-as-HDL) or Amaranth (Python-as-HDL) — both produce Verilog as a backend — these quickstarts show the entry points.

## Files

- `chisel-example.scala` — Minimal Chisel module + sbt invocation
- `amaranth-example.py` — Minimal Amaranth module + Verilog conversion

## When to use

- **Pure SCRIBE viewer (no quickstart needed):** if your goal is round-trip from a TypeScript-toy-subset source. The viewer handles the whole pipeline.
- **Chisel quickstart:** if you have an existing Chisel design and want to render it via SCRIBE. The Chisel → FIRRTL → Verilog → SCRIBE pipeline is the right path; the cartridge does not implement FIRRTL parsing yet (deferred per mission Doc 03 §10).
- **Amaranth quickstart:** if you have an existing Amaranth (or Migration-from-nMigen) design. Same caveat — Amaranth → Verilog → SCRIBE is the path; full Amaranth-IR consumption is deferred.

## What's deferred

These quickstarts are *entry points*, not full integrations. The SCRIBE round-trip viewer (`../viewer/`) does NOT consume Chisel or Amaranth source directly. To bridge the gap:

1. Run the Chisel/Amaranth source through its native toolchain to produce Verilog
2. Open the resulting Verilog in your editor
3. (Future cartridge work) feed the Verilog into a SCRIBE Verilog parser

The Verilog parser side is the deferred capability (CAP-T3-XXX in mission REPORT). For now, the viewer handles only TypeScript-toy-subset → Verilog (forward direction). The reverse Verilog → TypeScript exists as a stub but only handles the constructs the viewer itself emits.

## See also

- mission Doc 03: HDL landscape (full survey of Verilog, VHDL, SystemVerilog, Chisel, Amaranth, SpinalHDL)
- mission Doc 04: Code → HDL pipelines
- [chisel-lang.org](https://www.chisel-lang.org)
- [amaranth-lang.org](https://amaranth-lang.org)
