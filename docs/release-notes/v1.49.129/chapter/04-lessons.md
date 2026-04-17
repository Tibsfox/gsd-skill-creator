# Lessons — v1.49.129

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **ComfyUI's DAG execution model (partial re-execution, node-level caching) is architecturally identical to build systems like Bazel or Nx -- the insight that "image generation is a build graph problem**
   ComfyUI's DAG execution model (partial re-execution, node-level caching) is architecturally identical to build systems like Bazel or Nx -- the insight that "image generation is a build graph problem" unlocks an entire tooling ecosystem for optimization.
   _🤖 Status: `investigate` · lesson #749 · needs review_
   > LLM reasoning: Ecosystem alignment snippet doesn't directly address ComfyUI DAG/build-graph insight.

2. **Custom node security is the critical unsolved problem in the ComfyUI ecosystem: any node can execute arbitrary Python, install packages at runtime, and access the host filesystem unless explicitly san**
   Custom node security is the critical unsolved problem in the ComfyUI ecosystem: any node can execute arbitrary Python, install packages at runtime, and access the host filesystem unless explicitly sandboxed via Docker.
   _⚙ Status: `applied` (applied in `v1.49.195`) · lesson #750_

3. **The DACP three-part bundle (human intent, workflow JSON, executable trigger) maps cleanly to the separation of concerns in any generation pipeline: what you want, how to get it, and when to start.**
   _⚙ Status: `investigate` · lesson #751_

4. **Audio generation models (e.g., Stable Audio, MusicGen) are not covered -- adding a third media pipeline would complete the multimedia production stack**
   _⚙ Status: `investigate` · lesson #752_

5. **The MCP bridge specification is a design document rather than a working implementation, leaving integration validation for a future build phase**
   _⚙ Status: `investigate` · lesson #753_
