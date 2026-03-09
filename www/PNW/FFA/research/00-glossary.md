# Terminology Glossary

Shared terminology across all six research modules. Terms are organized by domain, with cross-references indicating which modules use each term.

---

## Biological Structure

- **Keratin** -- Structural protein forming hair, fur, feathers, claws, and hooves. Alpha-keratin (mammals) forms helical filaments; beta-keratin (birds/reptiles) forms pleated sheets. The primary building material of all animal coverings in this study. [CRAFT-BIO, CRAFT-RENDER, CRAFT-SEW]
- **Guard hair** -- Coarse outer hair in mammalian fur providing protection and coloration. Longer and thicker than underfur. Contains melanosomes that determine visible color. [CRAFT-BIO, CRAFT-SEW, CRAFT-SUIT]
- **Underfur** -- Dense, fine inner coat providing thermal insulation. Typically shorter, softer, and lighter in color than guard hairs. Critical for understanding fur density in rendering and pile selection in fabrication. [CRAFT-BIO, CRAFT-RENDER, CRAFT-SEW]
- **Cuticle** -- Outermost layer of a hair shaft, composed of overlapping scale-like cells. Scale pattern and condition determine surface reflectance (shine vs. matte). [CRAFT-BIO, CRAFT-RENDER]
- **Cortex** -- Middle layer of hair shaft containing melanin-bearing fibrous cells. Primary determinant of hair color and mechanical strength. [CRAFT-BIO, CRAFT-RENDER]
- **Medulla** -- Central channel of a hair shaft, may be hollow or filled with air pockets. Hollow medullae increase insulation and reduce weight; affect light transmission. [CRAFT-BIO, CRAFT-RENDER]
- **Melanocyte** -- Cell that produces melanin pigment. Located at the base of hair follicles and in feather follicle papillae. [CRAFT-BIO]
- **Melanosome** -- Organelle within melanocytes that synthesizes, stores, and transports melanin. Shape and arrangement determine both pigment color and structural color. In iridescent feathers, melanosomes function as nanostructural elements. [CRAFT-BIO, CRAFT-RENDER]
- **Rachis** -- Central shaft of a feather, continuous with the calamus (quill). Barbs branch from the rachis on both sides. [CRAFT-BIO]
- **Barb** -- Primary branch extending from feather rachis, forming the vane. Each barb bears barbules on both sides. [CRAFT-BIO, CRAFT-RENDER]
- **Barbule** -- Secondary branch extending from a feather barb. Distal barbules bear hooklets that interlock with proximal barbules of adjacent barbs, creating the coherent feather surface. [CRAFT-BIO, CRAFT-RENDER]
- **Hooklet** -- Microscopic hook on distal barbules that zips adjacent barbs together. Can be reset by preening. The mechanism that makes a feather a coherent aerodynamic surface rather than a loose collection of filaments. [CRAFT-BIO]

## Color Science

- **Eumelanin** -- Dark melanin pigment (black to brown). Granules are typically elongated/rod-shaped. The dominant pigment in dark-colored fur and feathers. [CRAFT-BIO, CRAFT-RENDER]
- **Pheomelanin** -- Light melanin pigment (yellow to reddish-brown). Granules are typically spherical. Responsible for reddish and golden tones. [CRAFT-BIO, CRAFT-RENDER]
- **Carotenoid** -- Diet-derived pigment producing yellows, oranges, and reds in feathers. Not synthesized by the bird; must be acquired through food. Flamingo pink derives from carotenoids in brine shrimp. [CRAFT-BIO]
- **Porphyrin** -- Pigment producing browns, reds, greens, and pinks in feathers. Fluoresces red under UV light. Produced by modifying amino acids. Less stable than melanin; degrades with sun exposure. [CRAFT-BIO]
- **Structural color** -- Color produced by physical interaction of light with nanostructures, not by chemical pigment. Includes iridescent (angle-dependent) and non-iridescent (angle-independent) mechanisms. [CRAFT-BIO, CRAFT-RENDER]
- **Thin-film interference** -- Structural color mechanism where light waves reflected from upper and lower surfaces of a thin layer interfere constructively or destructively. Responsible for iridescence in many feathers. [CRAFT-BIO, CRAFT-RENDER]
- **Mie scattering** -- Light scattering by particles comparable in size to the wavelength of light. Produces non-iridescent structural blues and greens in feather barbs via air-filled cavities. [CRAFT-BIO, CRAFT-RENDER]
- **Coherent scattering** -- Ordered arrangement of scattering elements producing reinforced wavelength-specific reflection. Distinguished from incoherent (random) scattering. Responsible for some non-iridescent structural colors. [CRAFT-BIO]
- **Photonic crystal** -- Material with periodic variation in refractive index at scales matching visible light wavelengths. Biological photonic crystals in feather barbules produce some of the most vivid colors in nature. [CRAFT-BIO, CRAFT-RENDER]
- **Turing pattern** -- Reaction-diffusion pattern (stripes, spots, rosettes) arising from spatiotemporal modulation during hair/feather growth. Named after Alan Turing's 1952 mathematical model. [CRAFT-BIO]

## Digital Rendering

- **PBR (Physically Based Rendering)** -- Rendering approach using parameters that correspond to measurable physical properties. Produces consistent results across lighting conditions. Standard in modern 3D production. [CRAFT-RENDER, CRAFT-BIO]
- **Albedo map** -- Texture map defining diffuse reflectance color without lighting information. In fur/feather rendering, corresponds to pigment color and structural color hue. [CRAFT-RENDER]
- **Normal map** -- Texture encoding surface micro-normals to simulate detail without geometry. For fur, corresponds to cuticle scale orientation; for feathers, to barbule angle. [CRAFT-RENDER]
- **Roughness map** -- Texture defining micro-surface smoothness. Low roughness = glossy (wet fur, oily feathers); high roughness = matte (dry fur, powder down). [CRAFT-RENDER]
- **Displacement map** -- Texture encoding surface height for geometric deformation. Represents fur pile depth or feather vane relief. [CRAFT-RENDER]
- **Ambient occlusion (AO)** -- Pre-computed self-shadowing approximation. Represents light blocked by dense underfur or barb occlusion in feathers. [CRAFT-RENDER]
- **Subsurface scattering (SSS)** -- Light penetrating a translucent surface, scattering internally, and exiting at a different point. Visible in thin ear fur, feather vanes, and translucent feather barbs. [CRAFT-RENDER, CRAFT-BIO]
- **BSDF (Bidirectional Scattering Distribution Function)** -- Mathematical function describing how light scatters from a surface. Blender's Hair BSDF and Principled BSDF are specific implementations. [CRAFT-RENDER]
- **Anisotropic reflection** -- Directional reflection from surfaces with oriented microstructure. Hair and feathers reflect light differently along vs. across the fiber axis. [CRAFT-RENDER, CRAFT-BIO]

## Textile Craft

- **Pile** -- Raised fiber surface of a fabric. In faux fur, pile fibers simulate guard hairs. Pile direction affects cutting layout, seam visibility, and final appearance. [CRAFT-SEW, CRAFT-SUIT, CRAFT-PLUSH]
- **Pile direction** -- The natural lay direction of pile fibers on a fabric. All pattern pieces must be oriented to match pile direction unless deliberate contrast is intended. [CRAFT-SEW, CRAFT-SUIT]
- **Nap** -- The directional quality of a pile fabric. Cutting "with the nap" (pile laying downward) produces a darker, smoother appearance; "against the nap" appears lighter and rougher. [CRAFT-SEW]
- **Backing** -- The woven or knitted base fabric of faux fur. Cut backing only (not pile fibers) using a razor blade or rotary cutter. [CRAFT-SEW]
- **Seam allowance** -- Extra fabric beyond the seam line. Faux fur requires wider allowances (minimum 3/4 inch) to fold under without exposing backing. [CRAFT-SEW, CRAFT-PLUSH]
- **Pile extraction** -- Process of pulling trapped pile fibers out of seam lines using a pin or seam ripper after sewing. Essential for invisible seams in faux fur work. [CRAFT-SEW, CRAFT-SUIT]

## Fursuit Construction

- **Head base** -- The structural foundation of a fursuit head. Types: hand-carved foam, 3D-printed (PLA/TPU/resin), expanding foam, balaclava-based. [CRAFT-SUIT]
- **Tape patterning** -- Method of creating 2D sewing patterns from a 3D form by covering it in masking tape, drawing cut lines, cutting off panels, and flattening. Standard technique for creating fur covering patterns. [CRAFT-SUIT, CRAFT-PLUSH]
- **Digitigrade padding** -- Foam padding extending behind the calf to create the illusion of a backward-bending animal knee joint. Characteristic feature of digitigrade-style fursuits. [CRAFT-SUIT]
- **EVA foam** -- Ethylene-vinyl acetate craft foam, heat-formable and lightweight. Used for ears, structural elements, and details. Available in various thicknesses. [CRAFT-SUIT]
- **DTD (Duct Tape Dummy)** -- A body cast made by wrapping the wearer in duct tape over a base layer, then cutting off. Used to create custom-fitted bodysuit patterns. [CRAFT-SUIT]

## Animation

- **Stop motion** -- Animation technique capturing objects in small incremental movements, photographing each position, and playing the sequence as continuous motion. [CRAFT-ANIM]
- **Claymation** -- Stop motion animation using malleable clay/plasticine figures. Clay can be reshaped between frames for organic movement and expression changes. [CRAFT-ANIM]
- **Armature** -- Internal skeleton providing structural support and posability for stop motion puppets and plush animals. Types: ball-and-socket, wire, plug-in modular. [CRAFT-ANIM, CRAFT-PLUSH]
- **Cel** -- Transparent acetate sheet used in traditional animation. Character elements are painted on cels and composited over painted backgrounds. Named from "celluloid." [CRAFT-ANIM]
- **Dope sheet (exposure sheet)** -- Technical blueprint specifying frame-by-frame instructions: which cel goes on which frame, camera instructions, timing, and layer ordering. [CRAFT-ANIM]
- **Inbetween** -- Transitional drawing between key poses (keyframes). Inbetweening is the process of generating these transitional frames. [CRAFT-ANIM]
- **Onion skin** -- Semi-transparent overlay showing previous frame(s) to guide incremental movement. Available in physical (lightbox) and digital (app overlay) forms. [CRAFT-ANIM]
- **Leica reel (animatic)** -- Assembled sequence of storyboard panels with timing, used to preview animation before full production. [CRAFT-ANIM]

## Plush Construction

- **Gusset** -- Fabric panel inserted to add three-dimensional shape. Head gussets (crown-to-nose) add width and dome shape. Belly gussets add body volume. Side gussets broaden the face. [CRAFT-PLUSH, CRAFT-SEW]
- **Dart** -- Triangular fold sewn into flat fabric to create a curve. Removes fabric to shape a flat panel into a three-dimensional surface. [CRAFT-PLUSH, CRAFT-SEW]
- **Jointing** -- Method of attaching limbs to allow posability. Types: fixed seam (rigid), button joint (simple rotation), lock-nut joint (tighter rotation), ball-socket joint (professional-grade, full movement). [CRAFT-PLUSH]
- **Safety eyes** -- Plastic eyes with a washer backing that locks through fabric. Child-safe; standard for toys sold commercially. Distinguished from glass eyes (collectible) and embroidered eyes (child-safe alternative). [CRAFT-PLUSH]

---

## Cross-Reference Format

Inter-module citations use the format: `[Module:Section]` -- for example, `[CRAFT-BIO:Structural Color]` or `[CRAFT-RENDER:PBR Map Types]`. This format is consistent across all research documents and resolves to specific headings within each module.
