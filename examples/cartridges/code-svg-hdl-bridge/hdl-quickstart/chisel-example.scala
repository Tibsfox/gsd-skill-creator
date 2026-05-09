// Minimal Chisel example: 32-bit adder.
//
// Mission: SCRIBE (v1.49.621), Track T3 CODE-SVG-HDL-BRIDGE.
// License: Apache-2.0.
//
// Mirrors mission Doc 03 §5 reference example.
//
// Usage (assumes Chisel 6.x + sbt set up per chisel-lang.org getting-started):
//
//   1. cd to a directory with a build.sbt that lists Chisel as a dep.
//   2. Place this file in src/main/scala/Add32.scala
//   3. sbt run                       -> elaborates to FIRRTL
//   4. firtool target/Add32.fir      -> emits Verilog (Add32.v)
//
// The Verilog output is what SCRIBE consumes. The viewer in
// ../viewer/index.html does NOT consume Chisel directly — full FIRRTL
// → SCRIBE round-trip is deferred per mission Doc 03 §10.
//
// To use SCRIBE on this design:
//   - emit Verilog via the Chisel toolchain above
//   - hand-paste the Verilog into a (future) Verilog-to-SCRIBE parser
//     OR use it as a reference target for SCRIBE's own emission

import chisel3._

class Add32 extends Module {
  val io = IO(new Bundle {
    val a   = Input(UInt(32.W))
    val b   = Input(UInt(32.W))
    val sum = Output(UInt(32.W))
  })
  io.sum := io.a + io.b
}

object Add32App extends App {
  // Chisel 6 uses circt.stage.ChiselStage; older versions used
  // chisel3.stage.ChiselStage. Adjust per your Chisel version.
  // import circt.stage.ChiselStage
  // ChiselStage.emitSystemVerilogFile(new Add32, args)
  println("Build/elaborate via your project's sbt/Chisel pipeline.")
  println("Example sbt commands: 'sbt run' then 'firtool target/Add32.fir'")
}
