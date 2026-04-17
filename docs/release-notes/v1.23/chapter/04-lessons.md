# Lessons — v1.23

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **CPU emulators are the ultimate test of architectural precision.**
   Every instruction, every flag, every timing quirk must be exact. The discipline required for AGC Block II fidelity transfers directly to building reliable state machines elsewhere in the system.
   _🤖 Status: `investigate` · lesson #120 · needs review_
   > LLM reasoning: v1.42 git workflow skill doesn't demonstrate CPU emulator precision discipline transfer to state machines.

2. **Educational content needs a capstone exercise.**
   The 1202 alarm reproduction ties the entire AGC curriculum together -- number systems, memory, instructions, Executive, Waitlist, interrupts, and I/O all converge in one scenario. Without it, the 11 chapters are disconnected knowledge.
   _🤖 Status: `investigate` · lesson #121 · needs review_
   > LLM reasoning: v1.29 Electronics Educational Pack snippet is too thin to confirm a 1202-alarm-style capstone tying AGC chapters together.

3. **Commons engines need attribution from day one.**
   The CE-1 attribution ledger with weighting engine and dividend calculator establishes that contributions are tracked and valued. Retrofitting attribution into an existing system is orders of magnitude harder.
   _🤖 Status: `applied` (applied in `v1.36`) · lesson #122 · needs review_
   > LLM reasoning: v1.36 citation management and source attribution directly addresses early attribution tracking.

4. **Executive/Waitlist/BAILOUT maps directly to modern scheduling.**
   Priority-based cooperative scheduling (Executive), timer-driven task dispatch (Waitlist), and restart protection with alarm codes (BAILOUT) are the same patterns used in operating systems and distributed systems today. The AGC just did it in 36K words of rope memory.
---
   _⚙ Status: `investigate` · lesson #123_

5. **24 phases is enormous scope.**
   Mission infrastructure (10 phases), AGC simulator (8 phases), AGC curriculum (3 phases), RFC skill (1 phase), plus supporting phases. This could easily have been 3 separate releases with clearer boundaries.
   _⚙ Status: `investigate` · lesson #124_

6. **AGC development tools (assembler, debugger, disassembler, rope loader) are powerful but niche.**
   The educational value is clear, but the audience for yaYUL-compatible assembly tooling is small. The learn mode and AGC-to-GSD pattern mapping in the curriculum bridge this gap partially.
   _🤖 Status: `investigate` · lesson #125 · needs review_
   > LLM reasoning: v1.45 agent-ready static site doesn't directly address AGC tooling niche audience concerns.
