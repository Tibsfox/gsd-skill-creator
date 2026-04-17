# v1.49.110 — "Every Lesson a Handshake Between a Beginner and a Coordinate System"

**Released:** 2026-03-28
**Code:** NEH
**Scope:** Single-project research release — NeHe Productions OpenGL curriculum preservation and modernization, 48 lessons from window setup through ArcBall rotation, catalogued as machine-traversable intelligence with YAML taxonomy, JSON-LD concept DAG, deprecation map, and upstream integration schemas
**Branch:** dev
**Tag:** v1.49.110 (2026-03-28T02:24:21-07:00)
**Commits:** `7f37bb6c1` (1 commit)
**Files changed:** 14 · **Lines:** +3,043 / -0
**Series:** PNW Research Series (#110 of 167)
**Classification:** research release — graphics-programming curriculum foundations for the Rendering & Simulation cluster
**Dedication:** Jeff Molofee (NeHe) — and the generation of graphics programmers who learned OpenGL from a text file, a window handle, and one new concept per tutorial.
**Engine Position:** 10th release of the v1.49.101-131 research batch, 98th research release of the v1.49 publication arc, inaugurating the Graphics-Curriculum sub-cluster within the Rendering & Simulation cluster

> "Every lesson was a handshake between a beginner and a coordinate system. By lesson 48 the beginner could model cloth, simulate rope, load compressed textures, and rotate a world with one hand on a trackball. NeHe made 3D graphics legible to anyone with a C compiler and an afternoon."

## Summary

**NeHe Productions is the single most-translated graphics-programming curriculum ever written.** v1.49.110 ships the NEH research project — six research modules totaling roughly 912 lines of prose plus a 1,235-line LaTeX mission-pack compiled to a 227 KB PDF, the full HTML viewer stack, and the series registry entry. Jeff Molofee's NeHe (Neon Helium) Productions site published its first OpenGL tutorial in 1997 and reached 48 lessons by 2012. Between those two endpoints the corpus was ported to more than 43 languages and platforms — C, C++, Delphi, Visual Basic, Java, Python, Lua, C#, Managed DirectX, Mac OS X Carbon and Cocoa, Linux with GLX, Linux with SDL, PSP, Game Boy Advance, QNX, PowerBASIC, and dozens more — and taught OpenGL to hundreds of thousands of developers: the ones who went on to ship games, simulations, CAD tools, scientific visualizers, and demoscene productions. The research preserves the complete NeHe knowledge graph as executable intelligence inside skill-creator, not as a nostalgic archive.

**The curriculum is treated as a directed acyclic graph, not a reading list.** Module 1 (Taxonomy & Skill Mapping) ships a YAML taxonomy of all 48 lessons with concepts introduced, prerequisites required, and OpenGL API surface touched per lesson, plus a JSON-LD concept DAG with prerequisite edges between lessons. The skill definition for the "opengl-lesson" skill type lets agents query the graph directly: "what do I need to know before shadow volumes?" resolves to Lesson 26 prerequisites (stencil buffer, depth testing, vertex normals, Lesson 8 blending, Lesson 16 fog); "what builds on Lesson 6 texture mapping?" resolves to Lessons 7, 9, 17, 22, 24, 33, 35, and onward. The DAG is the intelligence backbone; every other module hangs off it.

**The four-track skill progression mirrors NeHe's original pedagogical arc.** Module 2 ships the Foundation Track (Lessons 1-12): window setup, first triangle, first polygon color, rotation, 3D shapes, texture mapping, filters and lighting, blending, moving bitmaps, 3D world loading, flag/wave effect, and display lists. Module 3 ships the Intermediate Track (Lessons 13-24): bitmap fonts, outline fonts, texture-mapped fonts, fog, quadrics, particle engine, line-based GL_EXT extensions, morphing between mesh states, OpenGL picking, reflections with the stencil buffer and arbitrary clipping planes, and Targa loading. Module 4 ships the Advanced Track (Lessons 25-36): OBJ loader with morphing, stencil-buffer reflections, shadow volumes, Bezier patches, BSP-style collision detection, heightmap terrain with frustum culling, render-to-texture text, multi-texturing with GL_ARB_multitexture, cel shading, S3TC compressed textures, and spring-mass physics for cloth. Module 5 ships the Expert Track (Lessons 37-48): advanced cel techniques, DXTC compressed-texture loading, rope physics with Verlet integration, virtual worlds with the ODE physics engine, multiple viewports, FreeType font rendering, 3D lens flare with occlusion testing, vertex buffer objects for performance, fullscreen antialiasing with multisample buffers, Cg high-level shader translation, and ArcBall rotation for trackball-style world manipulation. Each track is read as a coherent unit and as a sequence of one-delta-per-lesson steps.

**The deprecation map is the most immediately actionable deliverable.** Module 6 (Upstream Intelligence) ships a deprecation map flagging 15+ legacy patterns that appear in NeHe's original code but must be avoided or replaced in any modern implementation: `glBegin`/`glEnd` immediate mode, fixed-function lighting, display lists, `glVertex3f` and its family, built-in matrix stacks (`glLoadIdentity`, `glTranslatef`, `glRotatef`, `glPushMatrix`, `glPopMatrix`), per-vertex `glColor3f` in favor of attribute arrays, `glMatrixMode`, `glFrustum` in favor of a uniform-driven projection matrix, client-side vertex arrays in favor of VBO + VAO, `glEnableClientState`, fixed-function fog, `gluLookAt`, `gluPerspective`, `gluSphere`, and the entire fixed-function texture environment. Each deprecated pattern is paired with the modern equivalent (VBO + VAO + shader, explicit matrix math in-shader, GLSL-based lighting models). An agent asked to implement NeHe Lesson 6 can now quote the lesson's pedagogical content while generating modern core-profile code; the map is the translation layer.

**Upstream integration turns the research from a reference into a tool.** Module 6 also ships the DACP (Documentation Alignment and Compatibility Protocol) three-part bundle schema — reference, examples, and migration paths — for plugging NeHe lessons into agent query stacks; the intelligence index for agent queries with lesson IDs, concept IDs, and API-function IDs as first-class entities; and the documentation index searchable by concept (texture mapping, stencil buffer, shadow volume), by lesson number, by API function (`glGenTextures`, `glBindTexture`, `glTexImage2D`), and by platform port. The research is designed to be consumed by other skills and agents, not only read by humans. Any future skill that needs to teach OpenGL — from game-tutorial generators to visualization helpers to shader-porting assistants — can query the NEH corpus and receive typed, prerequisite-aware answers.

**The two-track structure continues the pattern validated by earlier v1.49.101-131 releases.** Track Alpha (pedagogical content, Modules 2-5) and Track Beta (intelligence and integration, Modules 1 and 6) let each track go deep without starving the other. A reader who wants to *learn* OpenGL reads Alpha. A reader who wants to *build tooling on top of OpenGL curricula* reads Beta. The two tracks cross-reference at specific join points (Lesson 26 shadow volumes → stencil-buffer concept node in DAG → GLSL migration path in deprecation map; Lesson 47 Cg shader translation → modern GLSL equivalent → shader-compatibility table) so the reference and the narrative reinforce rather than duplicate each other. This is the same two-track structure that worked for v1.49.101 (SST: states, symbols, tape) and v1.49.106 (AMR: station histories and regulation), now applied to graphics-programming pedagogy.

**The project sits at the intersection of Graphics, Simulation, and Education within the Rendering cluster.** The cross-reference block ties NEH to VKD (Vulkan Desktop — modern successor pipeline, texture mapping, lighting models, shader translation, VBO), WAL (Wall of Sound — compute shaders and GPU audio), VKS (Vulkan Screensaver — NeHe lesson translation to SPIR-V plugins), OCT (OctaMED — demoscene and demoparty culture overlap where NeHe tutorials fed a generation of demo authors), and SYS (Systems Administration — CMake build systems and cross-platform distribution). The chain is load-bearing: NeHe taught OpenGL, OpenGL begat Vulkan, Vulkan feeds modern compute and graphics workloads, and the demoscene community that NeHe tutorials fed is still shipping productions today. NEH is the curriculum-level capstone those projects point back to.

**Jeff Molofee's pedagogical achievement is worth naming explicitly.** NeHe tutorials introduced exactly one new concept per lesson on top of known-working code. Lesson 1 is a blank window. Lesson 2 adds a triangle. Lesson 3 adds color. Lesson 4 adds rotation. Lesson 5 adds 3D shapes. Lesson 6 adds texture mapping. By Lesson 12 the student has a textured, lit, rotating scene with display lists. By Lesson 48 the student has simulated cloth, loaded compressed textures, written shaders, and built a trackball-rotated world. No lesson ever introduced more than one new concept; no lesson ever broke the previous lesson's working code. That is an architectural property of the curriculum, not an accident of writing style, and treating it as such is how NEH preserves more than just the code — it preserves the teaching pattern.

## Key Features

**Location:** `www/tibsfox/com/Research/NEH/` · **Files:** 14 · **Lines:** +3,043 / -0
**Rosetta Stone cluster touched:** Rendering & Simulation / Graphics Curriculum (new sub-cluster)
**Publication pipeline:** research-mission-generator → tex-to-project → HTML viewer + compiled PDF
**Parallel tracks:** 2 (Alpha: pedagogical content Modules 2-5 · Beta: intelligence + integration Modules 1 and 6)
**Safety-critical tests:** 5 · **Estimated tokens:** ~350K · **Color theme:** deep-space indigo + shader purple + OpenGL green

| Code | Module / Artifact | Lines | Theme | Key Topics |
|------|-------------------|-------|-------|------------|
| NEH.M1 | Taxonomy & Skill Mapping | 133 | Intelligence Backbone | YAML taxonomy of all 48 lessons, JSON-LD concept DAG with prerequisite edges, `opengl-lesson` skill definition, lesson IDs, concept IDs, API-function IDs, prerequisite traversal queries |
| NEH.M2 | Foundation Track (L01-L12) | 119 | Graphics Primer | Window setup, first triangle, first color, rotation, 3D shapes (cube, pyramid), texture mapping, filters and lighting, blending (alpha), moving bitmaps, 3D world loader, flag/wave effect, display lists |
| NEH.M3 | Intermediate Track (L13-L24) | 89 | Text, Fog, Particles | Bitmap fonts, outline fonts, texture-mapped fonts, fog, quadrics (sphere, cylinder, disk), particle engine, line-based GL_EXT extensions, morphing, OpenGL picking, stencil reflections, clipping planes, TGA loading |
| NEH.M4 | Advanced Track (L25-L36) | 111 | Shading & Simulation | OBJ loader with morphing, stencil-buffer reflections, shadow volumes, Bezier patches, BSP collision detection, heightmap terrain, render-to-texture text, multi-texturing (GL_ARB_multitexture), cel shading, S3TC, spring-mass cloth physics |
| NEH.M5 | Expert Track (L37-L48) | 124 | Physics, Shaders, Performance | Advanced cel techniques, DXTC compression, Verlet rope physics, ODE virtual worlds, multiple viewports, FreeType fonts, 3D lens flare with occlusion, vertex buffer objects, fullscreen antialiasing, Cg shader translation, ArcBall trackball rotation |
| NEH.M6 | Upstream Intelligence | 136 | Integration Layer | Deprecation map (`glBegin`/`glEnd`, fixed-function lighting, display lists, client-side arrays, `gluLookAt`, `gluPerspective`, `glFrustum`, `glMatrixMode`, + 7 more), DACP three-part bundle schemas, intelligence index for agent queries, searchable documentation index |
| MP | Mission-Pack LaTeX | 1,235 | Publication | `nehe_mission.tex` full citation chain, compiled to 227 KB PDF, mission-pack HTML wrapper (496 lines) |
| Site | HTML Viewer Stack | 403 | UX | `index.html` (162), `page.html` with sticky TOC (124), `mission.html` PDF embed (117) |
| Theme | Palette + Stylesheet | 196 | Branding | Deep-space indigo `#1A237E` + shader purple `#4A148C` + OpenGL green `#1B5E20`, signals Graphics-Curriculum sub-cluster on the index |
| Series | Registry entry | 1 | Wayfinding | `series.js` receives NEH row tying the project to the PNW Research Series index |
| Total | Full release footprint | 3,043 | — | 14 files across one project directory, one clean `feat(www)` commit |

### The Through-Line

> Every lesson was a handshake between a beginner and a coordinate system. NeHe's achievement was not OpenGL — it was the sequencing. One new concept per lesson, on top of working code, for 48 lessons, in 43 languages, for 15 years. NEH writes that pattern down while it is still recoverable.

## Retrospective

### What Worked

- **Treating the curriculum as a directed acyclic graph paid off immediately.** Module 1's YAML taxonomy + JSON-LD concept DAG encode each of the 48 lessons with its prerequisites, introduced concepts, and OpenGL API surface. An agent asked "what do I need to know before Lesson 26 shadow volumes?" traverses the DAG and returns the actual prerequisite chain (stencil buffer from Lesson 22, depth testing from Lesson 1, vertex normals from Lesson 7, Lesson 8 blending, Lesson 16 fog). The graph is machine-traversable; the reading list is a consequence of the graph, not a substitute for it.
- **The four-tier skill progression (Foundation, Intermediate, Advanced, Expert) maps directly onto NeHe's original curriculum structure.** Preserving the original split into 12-lesson tracks keeps the pedagogical intent legible; a reader who remembers the NeHe site from 2003 will recognize the track boundaries. Restructuring the curriculum would have erased exactly the sequencing property that made NeHe work.
- **The deprecation map is the most immediately actionable deliverable.** Flagging `glBegin`/`glEnd` immediate mode, fixed-function lighting, display lists, client-side vertex arrays, `gluLookAt`, `gluPerspective`, and 9+ more deprecated patterns — with modern equivalents paired to each — lets an agent quote NeHe's pedagogical content while generating core-profile code. The research becomes a translation layer, not only an archive.
- **The two-track structure (pedagogical vs. integration) continues to hold.** Track Alpha (Modules 2-5) delivers the curriculum; Track Beta (Modules 1 and 6) delivers the intelligence and integration schemas. The same structure worked for v1.49.101 (SST) and v1.49.106 (AMR); it continues to work at graphics-curriculum grain. The pattern is a research-mission-generator primitive rather than a subject-specific accident.
- **Upstream integration (DACP bundle schemas + intelligence index + documentation index) turned the research from reference into tool.** The research is explicitly consumed by other skills and agents; future graphics-tutorial, shader-porting, and visualization skills can query the NEH corpus and receive typed answers. This is a higher bar than "write a good README," and meeting it is what keeps the research useful past publication.
- **Palette-as-cluster-marker continued to pay off.** Deep-space indigo + shader purple + OpenGL green signals the Graphics-Curriculum sub-cluster on the Research index at a glance. Any future reader scanning the index will be able to locate NEH and its future neighbors (shader pipelines, scene graphs, rendering algorithms) by color alone. Wayfinding infrastructure built earlier in the v1.49 arc keeps compounding.

### What Could Be Better

- **The 43 platform ports are catalogued but not deeply analyzed.** NeHe's tutorials were translated to C, C++, Delphi, Visual Basic, Java, Python, Lua, C#, Managed DirectX, Mac OS X Carbon and Cocoa, Linux with GLX, Linux with SDL, PSP, Game Boy Advance, QNX, PowerBASIC, and many more. The cross-language translation patterns — how Lesson 6 texture mapping moved from Win32 `LoadBitmap` to Java `ImageIO` to Python `pygame.image.load` — are architecturally interesting and not yet spelled out. A follow-up module on port-comparison would close that gap.
- **WebGL and WebGPU modernization paths are mentioned but not fully specified for each lesson.** Module 6 flags WebGL as a port target and WebGPU as the post-OpenGL future, but does not map each of the 48 lessons to its WebGL 2.0 equivalent or its WebGPU + WGSL equivalent. That mapping exists conceptually (Lesson 6 texture mapping in WebGL uses `gl.texImage2D` on a DOM image element; in WebGPU it uses `createTexture` + `writeTexture` with a GPUTexture descriptor) but shipping the full table would let an agent translate any NeHe lesson into a browser-native implementation automatically.
- **Vulkan translation is not yet end-to-end.** The cross-reference to VKD acknowledges Vulkan as the modern successor, but the NEH corpus does not ship per-lesson Vulkan implementations. VKS (Vulkan Screensaver) covers this angle for a subset of demos, but a systematic NeHe-to-Vulkan table would turn NEH into a Vulkan-curriculum onramp too.
- **No runnable code is shipped alongside the prose.** The research catalogues the curriculum and the deprecation map, but does not ship runnable Python / WebGL samples inside the project directory. Each lesson has enough prose to support reconstruction, but a companion `code/` subdirectory with actually-compilable modern core-profile samples would turn the research into an executable artifact. That is the natural next release for NEH.
- **Demoscene lineage could be deeper.** The cross-reference to OCT names the demoparty overlap, but the research does not yet connect specific NeHe-trained demoscene authors to specific productions. The connection is real — a generation of demo authors cite NeHe as their first 3D-graphics exposure — and writing down the specific lineage would strengthen both the NEH research and the OCT research.

## Lessons Learned

- **A curriculum is a directed acyclic graph.** Each lesson has defined prerequisites, concepts introduced, and successors. Treating the curriculum that way enables machine traversal, prerequisite-aware tutoring, and automatic generation of custom learning paths. Writing the curriculum as a flat reading list throws away the structure that made it teachable.
- **The deprecation map is a model of how APIs evolve.** It is not just a compatibility tool. Watching `glBegin`/`glEnd` immediate mode become VBO + VAO + shader, watching fixed-function lighting become GLSL, watching `glMatrixMode` become uniform-driven matrix math in-shader — that is the architectural story of graphics programming from 1997 to 2026. Writing the map down captures the trajectory, not just the snapshot.
- **NeHe's pedagogical success came from sequencing.** Each lesson introduced exactly one new concept on top of working code, reducing cognitive load to a single delta per step. That is the invariant. Twelve lessons in the Foundation Track, twelve more in Intermediate, twelve in Advanced, twelve in Expert — the rhythm is deliberate, and the rhythm is what made the corpus survive translation into 43 languages.
- **Platform ports preserve curricula the way translations preserve literature.** The fact that NeHe exists in C, Delphi, Java, Python, Lua, PSP, and Game Boy Advance — to pick seven of more than forty — means the *structure* of the curriculum is independent of the language of any particular port. The curriculum is the graph; every port is a serialization of the graph into a specific API surface.
- **One new concept per lesson is the real invariant.** Any tutorial that violates the rule — that introduces shadow volumes and stencil buffers and depth testing in one lesson — is unreadable. NeHe never violates it. That constraint is the architectural property worth preserving, regardless of which graphics API the curriculum is translated to next.
- **Upstream integration distinguishes research from archive.** Shipping the DACP bundle schemas, the intelligence index, and the searchable documentation index means the research is consumed by other skills rather than only read by humans. Any future graphics-tutorial skill, any shader-porting assistant, any visualization helper can query NEH and receive typed answers. Research that is queryable is research that compounds.
- **Deprecated patterns are pedagogically valuable if paired with modern equivalents.** Teaching `glBegin`/`glEnd` is useful because it explains what immediate-mode rendering meant; teaching it without the VBO + VAO migration path produces graphics programmers who write code that will not run on modern core profiles. The map makes the old code readable without making it the target.
- **The two-track research structure is a research-mission-generator primitive.** It worked for states-symbols-tape (v1.49.101), for AM-radio regulation and history (v1.49.106), and now for graphics-programming pedagogy (v1.49.110). Alpha is the domain content; Beta is the intelligence layer. Future releases should default to that split unless a specific reason argues for a single-track release.
- **Naming the dedication matters.** Jeff Molofee wrote the curriculum. Naming him in the release metadata, quoting the through-line that captures his pedagogical insight, and dedicating the release to "the generation of graphics programmers who learned OpenGL from a text file" is not decoration — it is the right way to cite the work. Research that names its sources is research that earns trust.
- **One commit per research project continues to hold at v1.49.110.** NEH shipped in a single `feat(www)` commit (`7f37bb6c1`) with no scaffolding commits, no WIP history, no squash-merge noise. The pattern that was validated at 49-project batch scale in v1.49.89 and at 1-project depth in v1.49.101 and v1.49.106 holds at v1.49.110 too. A convention that holds across two orders of magnitude of batch size is an invariant of the publication pipeline.

## Cross-References

| Related | Why |
|---------|-----|
| `www/tibsfox/com/Research/NEH/` | NeHe OpenGL curriculum research — release artifact, 6 modules + mission-pack + HTML viewer, 14 files |
| `www/tibsfox/com/Research/NEH/research/01-taxonomy-skill-mapping.md` | YAML taxonomy of 48 lessons, JSON-LD concept DAG, `opengl-lesson` skill definition |
| `www/tibsfox/com/Research/NEH/research/02-foundation-track.md` | Lessons 1-12: window, triangle, color, rotation, 3D shapes, texture mapping, lighting, blending, bitmaps, 3D world, wave, display lists |
| `www/tibsfox/com/Research/NEH/research/03-intermediate-track.md` | Lessons 13-24: fonts, fog, quadrics, particles, extensions, morphing, picking, stencil reflections, clipping, TGA |
| `www/tibsfox/com/Research/NEH/research/04-advanced-track.md` | Lessons 25-36: OBJ, shadow volumes, Bezier, collision, heightmap, render-to-texture, multi-texturing, cel, S3TC, cloth |
| `www/tibsfox/com/Research/NEH/research/05-expert-track.md` | Lessons 37-48: Verlet rope, ODE worlds, viewports, FreeType, lens flare, VBO, FSAA, Cg, ArcBall |
| `www/tibsfox/com/Research/NEH/research/06-upstream-integration.md` | Deprecation map (15+ legacy patterns), DACP three-part bundles, intelligence + documentation indices |
| `www/tibsfox/com/Research/NEH/mission-pack/nehe_mission.tex` | 1,235-line LaTeX source, full citation chain, compiled to 227 KB PDF |
| `www/tibsfox/com/Research/NEH/mission-pack/nehe_mission.pdf` | Compiled PDF, teaching artifact for the College of Knowledge |
| `www/tibsfox/com/Research/NEH/style.css` | Deep-space indigo + shader purple + OpenGL green palette, 196 lines, signals Graphics-Curriculum sub-cluster |
| VKD (research series) | Vulkan Desktop — modern successor pipeline, texture mapping, lighting, shader translation, VBO, deprecation map |
| WAL (research series) | Wall of Sound — OpenGL pipeline heritage, lighting models, compute shaders, GPU audio processing |
| VKS (research series) | Vulkan Screensaver — NeHe lesson translation to Vulkan / SPIR-V plugins |
| OCT (research series) | OctaMED — demoscene / demoparty lineage where NeHe tutorials fed a generation of demo authors |
| SYS (research series) | Systems Administration — CMake build systems and cross-platform distribution of graphics tutorials |
| [v1.49.101](../v1.49.101/) | States, Symbols, and Tape — two-track research structure that NEH inherits |
| [v1.49.106](../v1.49.106/) | The AM Radio Dial — immediate sibling in the v1.49.101-131 research batch, same research-mission-generator pipeline |
| [v1.49.109](../v1.49.109/) | Immediate predecessor in the research batch |
| [v1.49.111](../v1.49.111/) | Immediate successor in the research batch |
| [v1.49.89](../v1.49.89/) | Mega-batch that validated the research-mission pipeline at 49-project breadth |
| [v1.49.90](../v1.49.90/) | Drain-to-zero batch — every post-drain release including NEH is a chosen topic rather than an intake-queue sweep |
| [v1.0](../v1.0/) | The 6-step adaptive learning loop — NEH's module structure is one Observe / Detect pass over the graphics-curriculum domain |

## Engine Position

v1.49.110 is the **10th release of the v1.49.101-131 research batch** and the **98th research release of the v1.49 publication arc**. The v1.49.101-131 batch is the 31-project cohort shipped across the post-drain arc that began with v1.49.101 (SST). Series state at tag: approximately **157 `series.js` entries** after NEH registers, **148 real research directories**, **Graphics-Curriculum** inaugurated as a new sub-cluster within Rendering & Simulation (joined to VKD / WAL / VKS / OCT / SYS by cross-reference), approximately **263,400 cumulative lines shipped** across the v1.49 arc. NEH is the first graphics-curriculum entry in the library and sets the grain size — six modules, two parallel tracks, four-tier skill progression (Foundation / Intermediate / Advanced / Expert), deprecation map with 15+ legacy patterns paired to modern equivalents, LaTeX mission-pack plus HTML viewer plus compiled PDF — that future Graphics-Curriculum entries (shader pipelines, scene-graph architectures, real-time rendering algorithms, physically-based rendering, ray-tracing fundamentals) will inherit.

## Files

**14 files changed across one project directory. +3,043 insertions, -0 deletions in a single commit (`7f37bb6c1`).**

- `www/tibsfox/com/Research/NEH/index.html` — project landing page, cluster palette, TOC to all six modules, 162 lines
- `www/tibsfox/com/Research/NEH/page.html` — sticky-TOC Markdown viewer for the research modules, 124 lines
- `www/tibsfox/com/Research/NEH/mission.html` — mission-pack wrapper with PDF embed and LaTeX source link, 117 lines
- `www/tibsfox/com/Research/NEH/research/01-taxonomy-skill-mapping.md` — YAML taxonomy + JSON-LD concept DAG + `opengl-lesson` skill definition, 133 lines
- `www/tibsfox/com/Research/NEH/research/02-foundation-track.md` — Lessons 1-12, window through display lists, 119 lines
- `www/tibsfox/com/Research/NEH/research/03-intermediate-track.md` — Lessons 13-24, fonts through TGA loading, 89 lines
- `www/tibsfox/com/Research/NEH/research/04-advanced-track.md` — Lessons 25-36, OBJ through cloth physics, 111 lines
- `www/tibsfox/com/Research/NEH/research/05-expert-track.md` — Lessons 37-48, Verlet rope through ArcBall, 124 lines
- `www/tibsfox/com/Research/NEH/research/06-upstream-integration.md` — deprecation map + DACP bundles + intelligence index, 136 lines
- `www/tibsfox/com/Research/NEH/mission-pack/nehe_mission.tex` — full LaTeX source with citation chain, 1,235 lines
- `www/tibsfox/com/Research/NEH/mission-pack/nehe_mission.pdf` — compiled 227 KB PDF, teaching artifact
- `www/tibsfox/com/Research/NEH/mission-pack/nehe_index.html` — mission-pack HTML wrapper with navigation, 496 lines
- `www/tibsfox/com/Research/NEH/style.css` — deep-space indigo + shader purple + OpenGL green palette, 196 lines
- `www/tibsfox/com/Research/series.js` — registry entry tying NEH into the PNW Research Series index, 1 line

Cumulative series state at tag: **~157 `series.js` entries, ~148 real research directories, Graphics-Curriculum sub-cluster inaugurated within Rendering & Simulation, ~263,400 lines shipped across the v1.49 arc, 10th release of the 31-project v1.49.101-131 batch, 1 project chosen rather than processed.**

---

> *One project. Six modules. Forty-eight lessons. Forty-three platform ports. A 1997 tutorial on a blank window still compiles, and a 2012 tutorial on Cg shader translation still teaches the right concepts, and the graph between them is now a machine-traversable DAG that an agent can query. NEH is the attempt to preserve the curriculum's sequencing — one new concept per lesson, for forty-eight lessons — while it is still recoverable from the original author's text.*
