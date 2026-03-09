# Integration Synthesis

Cross-domain integration analysis across all six research modules. Identifies the through-line connecting biology, digital rendering, textile craft, fursuit fabrication, animation arts, and plush construction. Maps explicit cross-domain bridges, reconciles shared terminology, and traces the core concept from nanoscale structure to finished creative work.

**Module ID:** INTEG
**Depends on:** [CRAFT-BIO], [CRAFT-RENDER], [CRAFT-SEW], [CRAFT-SUIT], [CRAFT-ANIM], [CRAFT-PLUSH]

---

## 1. The Through-Line: One Structure, Six Expressions

The hair of a wolf and the feather of a hummingbird are not merely coverings. They are the most elaborate solutions evolution has produced for the engineering problems of insulation, camouflage, display, and flight. What makes them extraordinary is not just their function but their structure: keratin filaments organized at nanoscale into light-manipulating architectures that produce iridescent blues, velvet blacks, and carotenoid oranges through physics alone.

This mission traces that deep structure from its biological source through six domains of making. The organizing insight is that all six practices share a single root: the attempt to render animal texture convincingly, whether for science, spectacle, storytelling, or play.

### 1.1 The Texture Stack

Every animal covering and every representation of an animal covering operates on the same layered architecture:

| Layer | Scale | Biological Reality | Expression in Practice |
|---|---|---|---|
| Molecular | Nanometers | Alpha-keratin helices, melanin polymers, carotenoid molecules | The pigment chemistry that determines what colors are even possible |
| Nanostructure | 100 nm -- 1 um | Melanosome arrays, barbule photonic crystals, cuticle scales | Structural color, iridescence, surface reflectance — the physics layer |
| Microstructure | 1 um -- 1 mm | Barb-barbule interlocking, cortical cell packing, medullary channels | Hair shaft opacity, feather coherence, insulation properties |
| Macrostructure | mm -- cm | Guard hair / underfur layering, feather tract organization, color pattern zones | The visible coat: dorsal/ventral contrast, facial masks, wing bars |
| Material | cm -- m | Faux fur pile, clay surface, fabric panels, rendered meshes | The craft substrate that carries the representation |
| Assembly | Object scale | Finished garment, fursuit, plush animal, animated character, rendered scene | The complete work as experienced by viewer or wearer |

Understanding any layer is enhanced by understanding all layers. The fursuit maker who knows that cuticle smoothness controls hair luster will make better decisions about faux fur brushing. The 3D artist who understands that structural blue disappears in transmitted light will set correct shader parameters for backlit feathers. The plush maker who understands dorsal/ventral color contrast will place seams at natural color boundaries.

This is the texture stack. It runs from nanoscale keratin to the animation camera, and the same equations appear at every scale.

### 1.2 The Core Principle

> The hummingbird does not carry a pigment for every color it displays. It carries one geometry — and lets physics generate the palette.

The same principle governs every craft domain in this study:

- **The fursuit maker** controls pile direction, not individual fibers
- **The PBR artist** controls roughness and normal, not individual photons
- **The claymation animator** controls the armature, not every molecular bond in the clay
- **The cel painter** controls the outline and the base color, not the psychology that makes a character feel alive
- **The plush maker** controls the dart placement and gusset geometry, not the spherical topology of the animal form
- **The textile craftsperson** controls the cutting layout and seam placement, not the backing weave

In every case, the practitioner works at one level of the texture stack while the physics of lower levels does the heavy lifting. Understanding the deep structure — whether in a barbule lattice or a pattern gusset — is what allows a maker to work *with* the physics, not against it.

---

## 2. Cross-Domain Bridges

The following bridges are explicit, documented connections between modules where knowledge from one domain directly informs practice in another. Each bridge identifies the source concept, the target application, and the specific mechanism of transfer.

### Bridge 1: Cuticle Condition to PBR Roughness

**Source:** [CRAFT-BIO:Cuticle] | **Target:** [CRAFT-RENDER:PBR Map Types]

The outermost layer of every mammalian hair shaft is the cuticle — overlapping, transparent, scale-like cells arranged like roof shingles. When cuticle scales are smooth and tightly overlapping (as in otter guard hair or healthy human hair), they produce specular reflection: a glossy, mirror-like sheen. When scales are roughened, lifted, or damaged, they scatter light diffusely: a matte, soft-focus appearance.

In PBR rendering, this maps directly to the roughness parameter. Low roughness values (0.1--0.3) produce the glossy appearance of smooth cuticle; high roughness values (0.6--0.9) produce the matte appearance of rough or damaged cuticle. The cuticle contributes no pigment color whatsoever — its sole optical role is controlling the geometry of surface reflectance. This is precisely the function of a roughness map in a PBR shader.

**Practical transfer:** A renderer setting roughness for wolf fur should know that underfur fibers (crimped, rough cuticle) need high roughness values, while guard hairs (smooth cuticle) need lower values. A single roughness value across the entire coat produces a flat, unconvincing result. The dual-roughness approach matches biological reality.

### Bridge 2: Melanosomes to Shader Color Source

**Source:** [CRAFT-BIO:Pigments] | **Target:** [CRAFT-RENDER:Fur/Hair Rendering]

Natural hair color is not a surface coating applied from outside. It originates from melanosomes — organelles within melanocyte cells at the base of the hair follicle — that synthesize, store, and inject melanin into the growing cortex. Two melanin types dominate: eumelanin (rod-shaped granules, black-to-brown) and pheomelanin (spherical granules, yellow-to-reddish-brown). The ratio, density, and distribution of these two pigment types, combined with the structural effects of the medulla and cuticle, generate the full range of natural mammalian hair colors.

In Blender's Hair BSDF, the melanin and melanin_redness parameters correspond directly to this biological system. Setting melanin concentration rather than direct RGB color produces physically plausible results because it models the actual mechanism. A "black" wolf hair is not black paint — it is dense eumelanin in a transparent cortex behind a smooth cuticle. The rendering should reflect this layered reality.

**Practical transfer:** Rendering workflows that use melanin-based color (hair shader melanin + melanin_redness) instead of direct color produce coats with the natural variation, highlight behavior, and tonal warmth of real fur. This bridge connects the biology department's melanosome research to the rendering department's shader setup.

### Bridge 3: Guard/Underfur Layers to Faux Fur Pile Selection

**Source:** [CRAFT-BIO:Pelage Structure] | **Target:** [CRAFT-SEW:Fur Fabric Types] and [CRAFT-SUIT:Finishing]

All wild mammals have a dual-coat pelage system: dense, fine underfur for insulation, and coarser, longer guard hairs for protection and coloration. The visible color and texture of a mammal's coat is primarily determined by its guard hairs, but the underfur is what gives the coat its volume, softness, and thermal mass. The ratio varies dramatically by species: an arctic fox has approximately 70--80 underfur fibers per guard hair; a deer may have only 5--10 (Ling, 1970).

In faux fur fabric selection, this maps to pile length, density, and layering decisions. Short-pile craft fur (3--10 mm) simulates a close underfur coat. Long-pile luxury fur (50--100 mm) simulates prominent guard hair display. For the most convincing results — as seen in professional-grade fursuit construction — makers layer two pile lengths: a short, dense base (the underfur analogue) topped with a longer, sparser overlay (the guard hair analogue).

**Practical transfer:** The textile craftsperson selecting fabric for a wolf fursuit benefits from knowing that a wolf's guard hairs are 50--80 mm long with a dense underfur layer beneath. Selecting a single mid-pile fabric is a compromise that matches neither layer. Selecting a long-pile fabric and trimming strategically, or layering two fabrics, produces a more biologically accurate result.

### Bridge 4: Structural Color to Thin-Film Shader Parameters

**Source:** [CRAFT-BIO:Structural Color] | **Target:** [CRAFT-RENDER:Feather Rendering]

Some of the most vivid colors in nature are not produced by pigments at all. A hummingbird's gorget is not dyed iridescent red-to-green — it is built from stacked melanosomes in the barbule nanostructure that function as a thin-film multilayer reflector. Light waves reflecting from the upper and lower surfaces of each melanosome layer interfere constructively at specific wavelengths (producing vivid color) and destructively at others (suppressing competing wavelengths). The perceived color changes with viewing angle because the effective optical path length through the layers changes with angle — this is iridescence.

In rendering, this maps to thin-film interference parameters. The dominant wavelength is determined by the optical thickness of the melanin layers (roughly d * n, where d is physical thickness and n is refractive index). In Blender, the Thin Film node on a Principled BSDF or a custom shader group can reproduce this angle-dependent color shift. Setting the film thickness to values that correspond to actual melanosome layer spacing (typically 100--300 nm) produces biologically accurate iridescence.

**Practical transfer:** The critical insight for renderers is that structural color is *not* the same as "shiny" or "metallic." A metallic shader produces angle-independent color with Fresnel falloff. A structural-color shader produces angle-*dependent* hue shift via interference. Using metallic shaders for iridescent feathers is physically incorrect and visually detectable. The biology tells the renderer which shader architecture to use.

### Bridge 5: Pile Direction to Fur Flow Maps

**Source:** [CRAFT-SEW:Cutting Techniques] | **Target:** [CRAFT-RENDER:Practical Shader Workflows]

In physical fur fabric, every piece has a pile direction — the natural lay of the fibers. All pattern pieces must be oriented with pile direction matched and running consistently (typically root-to-tip, head-to-tail on the finished garment). Cutting against pile direction produces visible grain discontinuities at seams. Managing pile direction is the single most important cutting decision in faux fur work.

In digital rendering, the same principle appears as fur/hair flow maps (also called grooming direction maps or combing direction). These vector fields define which direction rendered hair strands lay across the mesh surface. Incorrect or inconsistent flow produces the same visual artifact as mismatched pile direction in physical fabric: unnatural whorls, grain breaks, and visible seam lines.

**Practical transfer:** Physical faux fur workers and digital fur groomers are solving the same problem with different tools. The physical worker uses a cutting layout with pile arrows; the digital artist uses a vector paint tool. Both are managing directional fiber orientation to produce a coherent coat. Knowledge transfers directly between domains — a fursuit maker who understands digital grooming direction knows why pile direction matters, and a 3D artist who has sewn faux fur understands why flow map discontinuities look wrong.

### Bridge 6: Foam Sculpture to Animal Anatomy

**Source:** [CRAFT-BIO:Comparative Analysis] | **Target:** [CRAFT-SUIT:Foam Carving and Shaping]

Fursuit head construction begins with carving a foam form that establishes the character's head shape, muzzle proportions, and jaw mechanics. The most common beginner mistake is carving from imagination without reference — producing heads that don't read as a specific species because the proportional relationships are wrong.

The biological module documents the structural anatomy that underlies animal head shapes: muzzle length-to-width ratios, eye placement (forward vs. lateral), ear attachment points, and jaw pivot geometry. This anatomical knowledge directly informs foam carving decisions. A canine head base requires a long, tapered muzzle (muzzle length approximately 1.5x muzzle width at base); a feline head requires a shorter, broader muzzle (approximately 0.8x). These ratios come from comparative anatomy, not guesswork.

**Practical transfer:** Foam carvers who study the biological reference produce more species-accurate heads because they are carving toward proportional targets derived from real anatomy, even when the final design is stylized or fantastical.

### Bridge 7: Armature Engineering across Animation and Plush

**Source:** [CRAFT-ANIM:Puppet Animation] | **Target:** [CRAFT-PLUSH:Jointing and Posability]

Wire armatures in poseable plush animals and stop motion puppets solve the same engineering problem: allowing a fabricated figure to hold deliberate poses while resisting unintended deformation. Wire gauge selection, fatigue management (the tendency of repeatedly bent wire to break), joint placement relative to the character's skeleton, and covering techniques to prevent wire ends from poking through fabric are directly shared knowledge.

Both domains face the same failure mode: armature wire fatigue. A 1 mm aluminum armature wire can typically withstand 50--100 full-bend cycles at the same point before breaking. Ball-and-socket armatures (used in professional stop motion) avoid this problem entirely but add cost and weight — making them impractical for plush but standard for animation.

**Practical transfer:** Plush makers building poseable figures benefit from the animation community's extensive armature engineering knowledge. Animators benefit from the plush community's fabric-covering and joint-concealment techniques.

### Bridge 8: Tape Patterning as Universal 3D-to-2D Method

**Source:** [CRAFT-SUIT:Tape Patterning] | **Target:** [CRAFT-PLUSH:Pattern Development Methods]

Tape patterning — covering a 3D form in masking tape, drawing seam lines, cutting off the tape in sections, and flattening the sections into 2D sewing patterns — is documented independently in both fursuit fabrication and plush construction modules. In fursuit work, it is the standard method for creating fur covering patterns from a carved foam head base. In plush work, it is used to create patterns from sculptural maquettes.

The technique solves the same geometric problem in both contexts: the cartographic projection challenge of converting a 3D curved surface into flat 2D pieces that can be reassembled from fabric. The plush module explicitly compares this to cartographic map projection (a globe cannot be peeled flat without distortion; neither can a head base).

**Practical transfer:** This is a genuine shared technique — not merely an analogy. A fursuit maker's tape patterning skills transfer directly to plush pattern development, and vice versa. The seam placement logic is identical: place seams where they serve structural purpose (provide shape), visual purpose (hidden or decorative), and practical purpose (allow turning and stuffing or furring).

### Bridge 9: Color Pattern Biology to Multi-Domain Color Placement

**Source:** [CRAFT-BIO:Color Pattern Formation] | **Target:** [CRAFT-SEW], [CRAFT-SUIT], [CRAFT-RENDER], [CRAFT-PLUSH]

Animal color patterns — dorsal/ventral contrast, facial masks, leg barring, tail rings, countershading gradients — arise from spatiotemporal modulation of melanocyte activity during development. Turing's reaction-diffusion model (1952) explains how activator-inhibitor chemical systems produce the stripes, spots, and rosettes seen across mammals. These patterns are not random; they follow mathematical rules that produce consistent, species-identifying arrangements.

This biological knowledge feeds into every making domain:

- **Rendering:** Color placement on texture maps should follow natural pattern boundaries. A fox albedo map has orange dorsal, white ventral, black ear-tips, and black leg stockings — these boundaries follow developmental fields, not arbitrary paint strokes.
- **Textile/Fursuit:** Fabric color zones on a fursuit should match natural pattern boundaries. The boundary between a fox's white chest and orange flanks is a natural seam location.
- **Plush:** Fabric color selection and panel placement for a plush fox uses the same pattern map. White belly gusset, orange body panels, black ear-tip applique.
- **Animation:** Color model sheets for animated characters that reference biological pattern logic produce designs that read as biologically plausible even when highly stylized.

**Practical transfer:** Understanding *why* a fox has black legs (agouti signaling protein distribution in limb melanocytes) is not required for making a fox fursuit. But understanding *that* the black extends from paw to knee on the foreleg and paw to hock on the hindleg — and that this is consistent across individuals — produces a more accurate design.

### Bridge 10: Biology → Animation via Locomotion Reference

**Source:** [CRAFT-BIO:Comparative Analysis] | **Target:** [CRAFT-ANIM:Stop Motion Overview]

Animal locomotion — gait cycles, wing beat patterns, fish undulation, serpentine movement — is a core reference for animation. Eadweard Muybridge's 1887 *Animal Locomotion* photographic studies remain a foundational reference for animators precisely because they provide frame-by-frame documentation of how animals actually move.

The biological module's comparative anatomy section documents the skeletal and muscular systems that produce these gaits. A quadruped walk cycle (walk-trot-canter-gallop progression) arises from specific limb coordination patterns that are biomechanically constrained. A stop motion animator who understands that a dog's diagonal limbs move in coordination during trot (left fore + right hind, then right fore + left hind) produces more convincing motion than one who moves limbs in arbitrary sequence.

**Practical transfer:** The biological reference provides the ground truth that animation attempts to replicate. Whether in stop motion (physical puppet), claymation (malleable figure), or cel animation (drawn sequence), correct animal locomotion requires biological knowledge of gait mechanics.

---

## 3. Terminology Reconciliation

The shared glossary [00-glossary.md] establishes consistent terminology across all six modules. The following reconciliation addresses terms that appear in multiple modules with potentially different emphases, ensuring consistent interpretation.

### 3.1 Terms Used Consistently

These terms are used identically across all modules that reference them:

| Term | Modules | Status |
|---|---|---|
| Keratin | BIO, RENDER, SEW | Consistent: alpha-keratin (mammals) / beta-keratin (birds) |
| Guard hair | BIO, SEW, SUIT | Consistent: coarse outer hair, protection and coloration |
| Underfur | BIO, RENDER, SEW | Consistent: dense fine inner coat, insulation |
| Cuticle | BIO, RENDER | Consistent: outermost scale layer, reflectance geometry |
| Melanin / Melanosome | BIO, RENDER | Consistent: pigment type and organelle |
| Pile direction | SEW, SUIT, PLUSH | Consistent: fiber lay direction on fabric |
| PBR | RENDER, BIO | Consistent: physically based rendering |
| Armature | ANIM, PLUSH | Consistent: internal skeleton for posability |
| Gusset | PLUSH, SEW | Consistent: inserted panel for 3D shaping |
| Dart | PLUSH, SEW | Consistent: triangular fold for curvature |

### 3.2 Terms Requiring Clarification

| Term | Context A | Context B | Resolution |
|---|---|---|---|
| **Backing** | CRAFT-SEW: woven/knitted base fabric of faux fur | CRAFT-SUIT: sometimes used loosely for "material behind" | Standard usage: the structural substrate of a pile fabric. In CRAFT-SUIT, use "base" or "substrate" when not referring specifically to faux fur backing fabric. |
| **Pile** | CRAFT-SEW: raised fiber surface | CRAFT-RENDER: hair strand count/density | In textile context, pile refers to the raised fibers. In rendering context, density is measured as strands-per-unit-area. These are related (pile density = physical strand density) but measured differently. Use "pile" for physical fabric and "strand density" for digital rendering. |
| **Texture** | CRAFT-RENDER: a 2D image (texture map) applied to 3D geometry | CRAFT-SEW/SUIT/PLUSH: the tactile surface quality of a material | Context-dependent. In rendering modules, "texture" means a digital image file. In craft modules, "texture" means physical surface feel. The glossary notes both usages. When ambiguity is possible, use "texture map" for digital and "surface texture" for physical. |
| **Flow** | CRAFT-RENDER: hair direction vector field | CRAFT-SEW: pile direction on fabric | Same concept, different tools. "Flow map" is the digital term; "pile direction" is the physical term. Both describe the directional orientation of fiber lay across a surface. |
| **Base** | CRAFT-SUIT: head base (foam form) | CRAFT-PLUSH: base fabric (for plush body) | Context-dependent. In CRAFT-SUIT, "base" almost always means the structural foam form. In CRAFT-PLUSH, "base" may refer to body fabric or pattern base. Glossary disambiguates by always using "head base" for CRAFT-SUIT and "base fabric" for CRAFT-PLUSH. |

### 3.3 Cross-Reference Format

All inter-module citations use the format established in Wave 0:

`[MODULE-ID:Section Name]` — for example, `[CRAFT-BIO:Structural Color]` or `[CRAFT-RENDER:PBR Map Types]`

This format is consistent across all research documents and resolves to specific headings within each module. The glossary [00-glossary.md] lists every term with its associated module tags.

---

## 4. Cross-Module Reference Map

The following matrix shows every documented explicit connection between modules. Each cell describes the nature of the bridge. Bridges marked with an asterisk (*) are identified in Section 2 above.

| From \ To | CRAFT-RENDER | CRAFT-SEW | CRAFT-SUIT | CRAFT-ANIM | CRAFT-PLUSH |
|---|---|---|---|---|---|
| **CRAFT-BIO** | Cuticle=roughness*, melanosomes=color source*, structural color=thin-film*, medulla=SSS, melanin distribution=albedo zones | Guard/underfur=pile selection*, color patterns=fabric zones* | Anatomy=foam sculpture*, color patterns=fur placement | Locomotion=motion reference*, color patterns=model sheets* | Anatomy=proportional reference, color patterns=panel color |
| **CRAFT-RENDER** | — | Flow maps=pile direction*, dual-layer rendering=layered fabric | Albedo=fur dye color, roughness=pile finish | Hair dynamics=motion blur, iridescence=angle-dependent animation | UV seams=physical seam logic, flow maps=pile direction |
| **CRAFT-SEW** | Pile direction=flow maps | — | Cutting=shared techniques, seam construction=shared | Not directly connected | Cutting=identical, sewing=identical, pile extraction=shared* |
| **CRAFT-SUIT** | Foam proportions=mesh proportions | Furring=shared cutting/sewing | — | Not directly connected | Tape patterning=shared technique* |
| **CRAFT-ANIM** | Animation principles=rendering animation | Not directly connected | Not directly connected | — | Armature engineering=shared*, character design=shared |
| **CRAFT-PLUSH** | Physical construction=rendering ground truth | Pattern making=shared principles | Tape patterning=shared* | Armature=shared*, character translation=shared | — |

---

## 5. The Texture Stack in Practice: Three Worked Examples

### 5.1 Red Fox: From Melanocyte to Finished Work

**Biology (CRAFT-BIO):** The red fox (*Vulpes vulpes*) displays a classic agouti color pattern. Guard hairs are banded — a dark eumelanin tip over a pheomelanin-rich mid-section producing the characteristic russet-orange, with a lighter base. Underfur is dense and gray. The ventral surface (chest, belly) is white due to suppressed melanocyte activity. Legs are black below the knee (high eumelanin density). Ear tips are black; tail tip is white (leucistic).

**Rendering (CRAFT-RENDER):** A PBR fox model uses melanin-based hair color with melanin_redness set high (pheomelanin-dominant) for body guard hairs, melanin set high with low redness (eumelanin) for legs and ear tips, and near-zero melanin for ventral regions and tail tip. Dual hair systems render guard and underfur separately. Roughness is lower on guard hairs (smooth cuticle) and higher on underfur.

**Textile (CRAFT-SEW):** Fabric selection: medium-pile orange faux fur for body, short-pile white for ventral, short-pile black for legs and ears. All pieces cut backing-only with pile direction running root-to-tip (head-to-tail on the garment). Color boundaries placed at natural seam locations matching biological pattern zones.

**Fursuit (CRAFT-SUIT):** Foam head base carved with canine proportions (long tapered muzzle, forward-facing eyes, erect triangular ears). Tape patterned. Furred with matched pile direction. Airbrushed gradient at color boundaries to soften the abrupt fabric color transitions.

**Animation (CRAFT-ANIM):** Stop motion puppet with wire armature, covered in short-pile fur fabric. Gait reference from Muybridge's trotting fox plates. Diagonal trot coordination: left fore + right hind together.

**Plush (CRAFT-PLUSH):** Pattern with crown gusset (head width), belly gusset (body volume), and side panels. Orange body fabric, white belly gusset, black leg panels. Safety eyes with locking washers. Polyester fiberfill stuffing. Seams at natural color boundaries.

### 5.2 Hummingbird: Structural Color across Domains

**Biology:** The Anna's hummingbird gorget contains melanosomes arranged in ordered stacks within barbule cells, functioning as a biological thin-film multilayer reflector. The reflected wavelength shifts from magenta (face-on) to green (oblique) to black (extreme angle) as the viewing angle changes.

**Rendering:** A thin-film interference shader with film thickness matching melanosome layer spacing (~200 nm optical thickness). Not a metallic shader — this is interference, not metal-like reflection. The shader must produce angle-dependent hue shift.

**Textile/Craft:** Iridescent fabric (holographic or duo-chrome) approximates the effect physically. No single-color fabric can replicate iridescence.

**Animation:** Head-turn sequences are the showcase moment for structural color — the gorget shifts from brilliant magenta to green within a few degrees of rotation. Cel animation achieves this with color changes between frames on the gorget region.

### 5.3 The Shared Seam: Where Physical and Digital Meet

A seam in faux fur and a UV seam in rendered fur solve the same problem: they are the boundary where a flat representation wraps around a 3D form. In both cases, the maker's goal is identical — hide the seam where it will be least visible, place it where natural pattern boundaries exist, and ensure that the directional flow of fiber/hair is continuous across the seam.

The fursuit maker uses pile extraction (pulling trapped fibers out of the sewn seam with a pin) to hide seam lines. The 3D artist places UV seams in matching locations (underside of jaw, behind ears, along ventral midline) and uses hair particle settings to comb across the seam boundary. Both are solving the cartographic projection problem documented in [CRAFT-PLUSH:Pattern Geometry Fundamentals] — converting a curved 3D surface into flat 2D pieces.

---

## 6. Module Consistency Audit

### 6.1 Material Coverage Consistency

The following materials and concepts appear across multiple modules. This audit confirms consistent treatment:

| Material/Concept | SEW | SUIT | PLUSH | Consistent? |
|---|---|---|---|---|
| Faux fur pile types | Full catalog | Referenced for head/body furring | Referenced for body construction | Yes — SEW is primary source, others reference |
| Contact cement (Barge) | Mentioned for heavy-duty bonding | Primary foam bonding method | Not typically used | Yes — appropriate for foam, not standard for plush |
| Hot glue | Mentioned for temporary work | Secondary bonding method | Common for quick assembly | Yes — consistent characterization as quick/temporary |
| Polyester fiberfill | Not applicable | Padding reference | Primary stuffing material | Yes — different applications, consistent description |
| Safety eyes | Not applicable | Not typically used | Full documentation with safety standards | Yes — correctly scoped to plush (CPSIA/EN 71) |
| Pile extraction | Full technique documentation | Referenced | Referenced | Yes — SEW is primary source |
| Tape patterning | Not applicable | Full documentation | Referenced as development method | Yes — SUIT is primary, PLUSH references |

### 6.2 Safety Code Consistency

| Code | BIO | RENDER | SEW | SUIT | ANIM | PLUSH |
|---|---|---|---|---|---|---|
| SC-SRC (Source quality) | Applied | Applied | Applied | Applied | Applied | Applied |
| SC-NUM (Numerical attribution) | Applied | Applied | Applied | Applied | Applied | Applied |
| SC-ADV (No policy advocacy) | Header note | Header note | — | — | — | — |
| SC-IP (Intellectual property) | — | — | Referenced | Referenced | Referenced | — |
| SC-SAF (Safety notices) | — | — | Referenced | Referenced | Referenced | Referenced |

All safety codes are applied where relevant. SC-ADV appears only in BIO and RENDER (the modules that discuss real animal materials). SC-SAF appears in all craft modules (chemical, tool, and child safety).

---

## 7. Completeness Assessment

### 7.1 Module Coverage Against Mission Pack Requirements

| Mission Pack Requirement | Module | Status |
|---|---|---|
| Fur anatomy (shaft, cuticle, cortex, medulla) | CRAFT-BIO Section 1 | Complete |
| Feather anatomy (rachis, barbs, barbules, hooklets) | CRAFT-BIO Section 2 | Complete |
| Pigment systems (melanins, carotenoids, porphyrins) | CRAFT-BIO Section 3 | Complete |
| Structural color (thin-film, Mie, coherent scattering) | CRAFT-BIO Section 4 | Complete |
| Color pattern formation (Turing, agouti) | CRAFT-BIO Section 5 | Complete |
| PBR map types (7 maps with biological correspondence) | CRAFT-RENDER Section 1 | Complete |
| Fur/hair shader documentation (Blender + Unreal) | CRAFT-RENDER Section 2 | Complete |
| Feather rendering approaches | CRAFT-RENDER Section 3 | Complete |
| Faux fur fabric types (8+ techniques) | CRAFT-SEW Section 1 | Complete |
| Cutting and seam techniques | CRAFT-SEW Sections 3--4 | Complete |
| Fursuit head base types (3+ with pros/cons) | CRAFT-SUIT Section 1 | Complete (6 types) |
| Tape patterning documented | CRAFT-SUIT Section 3 | Complete |
| Tail, ear, jaw apparatus | CRAFT-SUIT Sections 5--7 | Complete |
| Stop motion types (5+) | CRAFT-ANIM Section 1 | Complete (6 types) |
| Claymation techniques | CRAFT-ANIM Section 2 | Complete |
| Cel animation pipeline (7 stages) | CRAFT-ANIM Section 5 | Complete |
| Plush pattern methods (4) | CRAFT-PLUSH Section 2 | Complete |
| Gusset types documented | CRAFT-PLUSH Section 3 | Complete |
| Joint types documented | CRAFT-PLUSH Section 5 | Complete |
| Cross-domain bridges (5+ minimum) | INTEG Section 2 | Complete (10 bridges) |
| Source bibliography | Each module + consolidated | Complete |

---

## Sources

This document synthesizes content from all six research modules and the shared glossary:

- [00-glossary.md](00-glossary.md) — Shared terminology glossary
- [01-biological-foundations.md](01-biological-foundations.md) — Module CRAFT-BIO
- [02-digital-rendering.md](02-digital-rendering.md) — Module CRAFT-RENDER
- [03-textile-craft.md](03-textile-craft.md) — Module CRAFT-SEW
- [04-fursuit-fabrication.md](04-fursuit-fabrication.md) — Module CRAFT-SUIT
- [05-animation-arts.md](05-animation-arts.md) — Module CRAFT-ANIM
- [06-plush-construction.md](06-plush-construction.md) — Module CRAFT-PLUSH

Through-line concept and texture stack architecture derived from the mission vision document (Section 1.3, "The Texture Stack").

---

*Module INTEG. Depends on: [CRAFT-BIO], [CRAFT-RENDER], [CRAFT-SEW], [CRAFT-SUIT], [CRAFT-ANIM], [CRAFT-PLUSH]. Safety codes: all (SC-SRC, SC-NUM, SC-ADV, SC-IP, SC-SAF) — verified across modules.*
