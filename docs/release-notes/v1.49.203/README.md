# v1.49.203 -- Thicc Splines Save Lives: BLN Blender User Manual

**Released:** 2026-04-01
**Project:** BLN (Blender User Manual)
**Cluster:** Graphics (4th project, joining NEH, VKD, VKS)
**Book Title:** Thicc Splines Save Lives
**Series:** PNW Research Series -- Graphics Cluster

## Summary

The largest single research project in the series to date. **Thicc Splines Save Lives** is a 329-page comprehensive Blender user manual delivered as a XeLaTeX textbook PDF, backed by 106,828 words of deep research across 10 markdown documents, served as a full web project at tibsfox.com/Research/BLN/.

The book covers every major domain of Blender 4.4 -- modeling, sculpting, Geometry Nodes, shading, materials, rendering (EEVEE and Cycles), animation, rigging, simulation, compositing, video editing, Python scripting, and pipeline integration -- with dedicated first-class coverage of furry arts and creative community workflows. The history of 3D modeling and software is woven throughout every chapter, from Sutherland's Sketchpad (1963) through the Amiga/LightWave revolution to Blender winning the Oscar for Best Animated Feature with Flow (2024).

This is not a reference manual that sits on a shelf. It is a textbook that reads cover to cover, where every technical chapter opens with the lineage of its tools and closes with practical workflows that working creators -- fursuit makers, animators, VRChat avatar builders, convention artists -- can apply immediately.

## Key Features

| Metric | Value |
|--------|-------|
| PDF Pages | 329 |
| Research Words | 106,828 |
| Research Documents | 10 |
| Glossary Terms | 132 |
| Book Parts | 7 (Foundations, Creation, Motion, Output, Power, Community, Production) |
| Chapters | 9 + 2 appendices |
| LaTeX Source Lines | 12,953 (main + 6 chapter files) |
| Blender Version | 4.4 (stable, April 2026) |
| Custom Environments | historynote, furrybox, tipbox, warningbox, shortcutbox, codebox |
| Cross-References | 76+ index entries, 6+ inter-chapter refs per chapter |
| Live URL | tibsfox.com/Research/BLN/ |

### The Book: Thicc Splines Save Lives

**Part I: Foundations**
- Chapter 1: The Story of 3D Graphics -- from Sketchpad (1963) through SGI, LightWave/Amiga, OpenGL, Autodesk consolidation, to Blender's Oscar. Democratization timeline.
- Chapter 2: Foundations & Interface -- installation, workspaces, 3D Viewport, Properties Panel, object types, modes, essential shortcuts.

**Part II: Creation**
- Chapter 3: Modeling, Sculpting & Geometry Nodes -- Edit Mode (all operations), complete modifier stack (40+ modifiers), UV unwrapping, all sculpt brushes, Geometry Nodes (all node types, fields, attributes). 40-50 pages.

**Part III: Motion**
- Chapter 4: Shading, Materials & Rendering -- Principled BSDF (every parameter), shader nodes, procedural textures, EEVEE deep dive (EEVEE Next), Cycles deep dive (path tracing, GPU acceleration), 20-criterion EEVEE vs Cycles matrix, lighting, camera, color management (AgX vs Filmic). 35-45 pages.

**Part IV: Output**
- Chapter 5: Animation, Rigging & Simulation -- keyframes, F-Curves, NLA Editor, Action Slots (4.4), Rigify, digitigrade rigging, shape keys, drivers, complete walk cycle tutorial, Mantaflow, Bullet, cloth, hair particles. 35-45 pages.

**Part V: Power**
- Chapter 6: Compositing, Post-Production & Video -- all compositor nodes, render passes, multi-layer EXR, color grading, VSE, H.265, motion tracking, Grease Pencil 3.0, 2D/3D hybrid workflows. 28-33 pages.

**Part VI: Community**
- Chapter 7: Python Scripting & Pipeline -- bpy module, 6 complete runnable scripts, add-on development, USD/FBX/glTF, Flamenco, headless Blender, Docker. 28-32 pages.

**Part VII: Production**
- Chapter 8: Furry Arts & Creative Community Workflows -- fursona modeling (7 species), fur particles, toony/realistic shaders, anthro rigging, VRChat avatar pipeline (PC + Quest performance ranks), fursuit previsualization, community tools, commission workflow. 35-45 pages. FIRST-CLASS CHAPTER.
- Chapter 9: Production Workflows -- complete pipeline, file organization.

**Appendices:** Keyboard Shortcut Reference, Glossary (132 terms across 14 categories including furry/VRChat).

### Research Documents (106,828 words)

| Doc | Title | Words |
|-----|-------|-------|
| 00 | Terminology Glossary | 8,630 |
| 01 | Foundations & Interface | 8,175 |
| 02 | Modeling, Sculpting & Geometry Nodes | 10,862 |
| 03 | Shading, Materials & Rendering | 11,061 |
| 04 | Animation, Rigging & Simulation | 10,559 |
| 05 | Compositing, Post-Production & Video | 7,588 |
| 06 | Python Scripting & Pipeline | 7,429 |
| 07 | Furry Arts Blender Workflows | 14,154 |
| 08 | Production Workflows & Case Studies | 10,044 |
| 09 | History of 3D Modeling & Software | 18,326 |

### Web Project

- **index.html** -- Project overview with card grid for all 10 research modules
- **page.html** -- Client-side markdown renderer with sticky TOC, section search, anchor links
- **style.css** -- Blender orange/navy theme (matches brand.css pattern)
- **mission-pack/** -- Original mission package (31-page PDF + LaTeX source + landing page)

### History Woven Throughout

The history of 3D is not quarantined in Chapter 1. It is woven through every technical chapter via `historynote` callout boxes:

- **Modeling:** Catmull-Clark subdivision surfaces, NURBS origins, ZBrush sculpting revolution, Houdini-to-GN lineage
- **Shading:** Cook-Torrance (1982), Disney Principled shader (2012), the rendering equation (Kajiya 1986), PBR revolution
- **Animation:** 12 Principles of Animation (Johnston & Thomas 1981), IK history, motion capture evolution
- **Compositing:** Optical printer to digital compositing, ILM, Shake/Nuke lineage
- **Scripting:** Blender Python API evolution from 2.3 to 4.x
- **Furry Arts:** Community founding era, democratization of creative tools

### Furry Arts as First-Class Content

The furry community framing is not "here's a 3D tool you can also use for furry art." It is "here's how one of the most creative communities on earth uses Blender as their primary content engine." In addition to the dedicated Chapter 8 (35-45 pages), every technical chapter includes `furrybox` callouts with community-specific guidance:

- Character topology for anthro heads and digitigrade legs
- Fur particle workflows for different body regions
- Eye shaders (multi-layer cornea), paw pad materials, emission markings
- Rigify modifications for tails, ears, wings
- VRChat avatar optimization checklists
- Fursuit design previsualization workflows

### The Amiga-to-Blender Lineage

A central through-line connects the Video Toaster (1990) democratizing broadcast production on a $3,000 Amiga to Blender (2024) winning the Oscar for Best Animated Feature at $0. The democratization thesis -- every generation makes professional 3D accessible to more people at lower cost -- runs through the entire book. LightWave 3D, SGI workstations, OpenGL, and the open-source movement are all covered in depth.

## Retrospective

This release was built in a single session using parallel agent fleets:

- **Wave 1:** 4 research agents (Track A: docs 01-03, Track B: docs 04-06, Furry Arts: doc 07, Production: docs 00+08) + 1 history agent (doc 09) running in parallel
- **Wave 2:** 6 chapter expansion agents (Modeling, Shading, Animation, Compositing, Scripting, Furry Arts) running in parallel, each reading its research doc and writing expanded LaTeX
- **Assembly:** Main .tex restructured with \input{} calls to expanded chapter files, three-pass XeLaTeX compilation

Total research output: 106,828 words across 10 documents. Total LaTeX: ~13,000 lines across 7 files. Final PDF: 329 pages. FTP sync to tibsfox.com completed.

## Lessons Learned

1. **Parallel research fleets scale.** 5 research agents running simultaneously produced 107K words of sourced material. The furry arts doc (14,154 words) was the most thorough because the agent had the clearest audience context.
2. **History woven through > history front-loaded.** The decision to spread historical context through every chapter (via callout boxes rather than a standalone history chapter) makes the book readable cover-to-cover instead of reference-only.
3. **Furry arts as primary use case, not appendix.** Framing through the community's lens produced better, more practical content than treating furry workflows as a special case of general 3D.
4. **The mission pack pattern works for books.** The original 31-page mission pack (vision + research + execution plan) provided the structure that 10 research agents and 6 writing agents could execute against in parallel.
5. **LaTeX chapter splitting is essential at scale.** Moving from one monolithic .tex to \input{chapters/ch0X.tex} kept the build manageable and enabled parallel writing.
6. **FTP path mapping matters.** The FTP root maps to /Research/ on the web, not /. First upload went to /Research/BLN (double-nested, 404). Fixed to /BLN.

## Files Produced

```
www/tibsfox/com/Research/BLN/
  index.html                          -- project overview
  page.html                           -- markdown renderer
  style.css                           -- Blender orange/navy theme
  thicc-splines-save-lives.tex        -- main LaTeX source
  thicc-splines-save-lives.pdf        -- 329-page textbook
  chapters/
    ch03-modeling.tex                  -- 1,838 lines
    ch04-shading.tex                   -- 2,277 lines
    ch05-animation.tex                 -- 2,058 lines
    ch06-compositing.tex               -- 1,693 lines
    ch07-scripting.tex                 -- 2,482 lines
    ch08-furryarts.tex                 -- 1,611 lines
  research/
    00-glossary.md                     -- 8,630 words, 132 terms
    01-foundations-interface.md         -- 8,175 words
    02-modeling-sculpting-geometry-nodes.md -- 10,862 words
    03-shading-materials-rendering.md  -- 11,061 words
    04-animation-rigging-simulation.md -- 10,559 words
    05-compositing-post-video.md       -- 7,588 words
    06-scripting-pipeline.md           -- 7,429 words
    07-furry-arts-blender-workflows.md -- 14,154 words
    08-production-workflows.md         -- 10,044 words
    09-history-of-3d-modeling.md       -- 18,326 words
  mission-pack/
    blender_mission.pdf                -- original 31-page mission pack
    blender_mission.tex                -- mission pack LaTeX source
    index.html                         -- mission pack landing page
```
