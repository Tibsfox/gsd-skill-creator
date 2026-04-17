# Retrospective — v1.49.110

## What Worked

- The four-tier skill progression (Foundation, Intermediate, Advanced, Expert) maps directly to the original NeHe curriculum structure -- the research preserves pedagogical intent
- Building the deprecation map as a first-class deliverable makes the research immediately actionable: agents know which OpenGL patterns to avoid and what modern equivalents to suggest
- The JSON-LD concept DAG with prerequisite edges enables traversal-based queries -- "what do I need to know before shadow volumes?" resolves automatically

## What Could Be Better

- The 43 platform ports (C, Java, Python, Delphi, etc.) are catalogued but not deeply analyzed -- the cross-language translation patterns are architecturally interesting
- WebGL and WebGPU modernization paths are mentioned but not fully specified for each lesson

## Lessons Learned

- A curriculum is a directed acyclic graph -- each lesson has defined prerequisites, concepts introduced, and successors -- and treating it that way enables machine traversal, not just human reading
- The deprecation map is not just a compatibility tool -- it is a model of how APIs evolve, how fixed-function pipelines become programmable shaders, how the architecture of graphics itself changed over two decades
- NeHe's pedagogical success came from sequencing: each lesson introduced exactly one new concept on top of working code, reducing cognitive load to a single delta per step

---
*Part of the v1.49.101-131 research batch -- 31 new projects in a single session.*
