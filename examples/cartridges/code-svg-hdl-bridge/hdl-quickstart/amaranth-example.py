"""Minimal Amaranth example: 32-bit adder.

Mission: SCRIBE (v1.49.621), Track T3 CODE-SVG-HDL-BRIDGE.
License: Apache-2.0.

Mirrors mission Doc 03 §6 reference example.

Usage (assumes Amaranth installed: ``pip install amaranth``):

    python amaranth-example.py > add32.v

The resulting ``add32.v`` is the Verilog SCRIBE consumes.

The viewer in ../viewer/index.html does NOT consume Amaranth directly --
full Amaranth-IR → SCRIBE round-trip is deferred per mission Doc 03 §10.

To use SCRIBE on this design:
    - emit Verilog via the Amaranth toolchain above
    - hand-paste the Verilog into a (future) Verilog-to-SCRIBE parser
      OR use it as a reference target for SCRIBE's own emission
"""

from amaranth import Module, Signal, Elaboratable
from amaranth.back import verilog


class Add32(Elaboratable):
    def __init__(self):
        self.a = Signal(32)
        self.b = Signal(32)
        self.sum = Signal(32)

    def elaborate(self, platform):
        m = Module()
        m.d.comb += self.sum.eq(self.a + self.b)
        return m


if __name__ == "__main__":
    dut = Add32()
    print(verilog.convert(dut, ports=[dut.a, dut.b, dut.sum]))
