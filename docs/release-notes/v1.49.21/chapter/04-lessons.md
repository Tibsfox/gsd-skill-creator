# Lessons — v1.49.21

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Schema-first pipeline design**
   Defining all 14 interface schemas before writing any engine code eliminated the usual back-and-forth of integration. Each engine had an exact contract to implement against.
   _⚙ Status: `investigate` · lesson #357_

2. **Dual translation is the right split**
   Code and design translations have fundamentally different output shapes. Trying to unify them would have created an awkward abstraction. Two engines with shared input is simpler.
   _⚙ Status: `investigate` · lesson #358_

3. **Bridge scoring enables incremental complexity**
   Simple creative tasks (score < 4) get direct output. Complex ones (score >= 8) get routed to the full VTM pipeline. The bridge pattern avoids building a monolithic system.
   _⚙ Status: `investigate` · lesson #359_

4. **No real image input yet**
   The pipeline processes structured observation data, not raw images. Actual image analysis requires multimodal model integration
   _⚙ Status: `investigate` · lesson #360_

5. **Complexity scoring is heuristic**
   The 0-12 scale works for routing decisions but isn't calibrated against real project outcomes
   _⚙ Status: `investigate` · lesson #361_
