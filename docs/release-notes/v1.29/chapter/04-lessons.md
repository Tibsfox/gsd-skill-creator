# Lessons — v1.29

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Circuit simulators need stamp logging for educational use.**
   Showing students how each component contributes to the MNA matrix transforms the simulator from a black box into a teaching tool. The matrix construction process IS the lesson.
   _🤖 Status: `investigate` · lesson #152 · needs review_
   > LLM reasoning: Holomorphic Dynamics pack title alone doesn't evidence MNA stamp-logging in a circuit simulator.

2. **Safety warden modes should escalate based on voltage classification, not user preference.**
   IEC 60449 voltage tiers determine whether safety content is annotated (informational) or gated (mandatory). This removes the user's ability to disable safety for high-voltage content -- the right default.
   _🤖 Status: `investigate` · lesson #153 · needs review_
   > LLM reasoning: Git workflow skill is unrelated to IEC 60449 voltage-based safety warden escalation.

3. **4-bit ripple-carry adder with 256 exhaustive combination verification is the right test strategy for logic simulators.**
   Exhaustive testing at small scale (4 bits) catches all edge cases. Extrapolating to larger bit widths relies on the same gate primitives, so the 4-bit verification covers the foundation.
   _🤖 Status: `investigate` · lesson #154 · needs review_
   > LLM reasoning: PyDMD knowledge extraction is unrelated to 4-bit ripple-carry adder exhaustive testing strategy.

4. **PLC scan cycle simulation bridges industrial and educational computing.**
   Ladder logic, Modbus, and PID control are rarely taught alongside digital logic and DSP. Including them in the same curriculum shows that computing isn't just software -- it's also the control systems that run physical infrastructure.
---
   _🤖 Status: `investigate` · lesson #155 · needs review_
   > LLM reasoning: PyDMD dogfood is unrelated to PLC/ladder logic curriculum integration.

5. **17 phases is a large scope for one release.**
   Circuit simulator (4 phases), logic simulator (2 phases), safety warden, learn mode, 15 modules (4 phases), 5 specialized engines (3 phases), and integration (2 phases). The breadth is impressive but the per-engine depth may be uneven.
- **H&H citation lookup with 3-level system assumes access to *The Art of Electronics*.** The L3 mathematical depth level references H&H directly. Users without the book get citation pointers to content they can't read. A fallback to freely available references would improve accessibility.
   _🤖 Status: `investigate` · lesson #156 · needs review_
   > LLM reasoning: Upstream intelligence pack doesn't address scope/depth concerns or H&H accessibility fallback.
