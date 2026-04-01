# Glossary of Blender Terms

Module: **00** | Series: Blender User Manual | Status: Reference Document

**Date:** 2026-04-01
**Scope:** Comprehensive glossary of 130+ terms covering all domains of Blender usage: interface, modeling, sculpting, UV/texturing, shading, rendering, animation, rigging, simulation, compositing, video editing, scripting, pipeline, and furry/VRChat avatar creation.
**Usage:** Cross-reference resource for all modules (A-F, 01-08). Terms are grouped by domain and alphabetized within each group.

---

## Table of Contents

1. [Interface Terms](#1-interface-terms)
2. [Modeling Terms](#2-modeling-terms)
3. [Sculpting Terms](#3-sculpting-terms)
4. [UV and Texture Terms](#4-uv-and-texture-terms)
5. [Shading Terms](#5-shading-terms)
6. [Rendering Terms](#6-rendering-terms)
7. [Animation Terms](#7-animation-terms)
8. [Rigging Terms](#8-rigging-terms)
9. [Simulation Terms](#9-simulation-terms)
10. [Compositing Terms](#10-compositing-terms)
11. [Video Editing Terms](#11-video-editing-terms)
12. [Scripting Terms](#12-scripting-terms)
13. [Pipeline Terms](#13-pipeline-terms)
14. [Furry and VRChat Avatar Terms](#14-furry-and-vrchat-avatar-terms)
15. [Sources](#15-sources)

---

## 1. Interface Terms

**3D Viewport** -- The primary workspace where you view and interact with your 3D scene. The viewport can display objects in multiple modes (Object Mode, Edit Mode, Sculpt Mode, etc.) and with multiple shading options (Wireframe, Solid, Material Preview, Rendered). Nearly all spatial manipulation in Blender happens here. *(Related: Editor Type, Workspace, Region)*

**Area** -- A rectangular section of the Blender window that contains a single editor. The Blender window is divided into areas, each of which can independently display any editor type. Areas can be resized by dragging their borders, split by dragging from a corner, or joined by dragging one area's corner into an adjacent area. *(Related: Region, Editor Type)*

**Editor Type** -- The kind of interface displayed within an area. Blender includes over 20 editor types: 3D Viewport, Outliner, Properties, Timeline, Dope Sheet, Graph Editor, NLA Editor, UV Editor, Shader Editor, Compositor, Video Sequencer, Text Editor, Python Console, and others. Each area's editor type is selected via the dropdown in its header. *(Related: Area, Workspace)*

**Header** -- The horizontal bar at the top (or bottom) of an editor area. Headers contain menus, mode selectors, and tool options specific to that editor. For example, the 3D Viewport header contains the mode dropdown (Object Mode, Edit Mode, etc.), shading mode buttons, and overlay toggles. *(Related: Region, Area)*

**N-Panel (Sidebar)** -- The collapsible panel on the right side of the 3D Viewport, toggled by pressing N. Contains transform values (Location, Rotation, Scale), item properties, tool settings, and add-on interfaces. Many add-ons place their UI in custom N-Panel tabs. *(Related: T-Panel, Properties Panel)*

**Outliner** -- The hierarchical tree view of all data in the current .blend file. Displays scenes, collections, objects, modifiers, materials, and other data-blocks. Used for selecting objects, managing visibility (eye icon), disabling in viewport (monitor icon), and disabling in render (camera icon). The Outliner is the organizational backbone of scene management. *(Related: Collection, Properties Panel)*

**Properties Panel** -- The editor (usually on the right side of the default layout) that displays detailed settings for the active object, scene, world, render engine, particles, physics, constraints, modifiers, materials, and other properties. Organized into vertical tabs with icons: Scene, World, Object, Modifiers, Particles, Physics, Constraints, Object Data, Material, Texture. *(Related: Outliner, N-Panel)*

**Region** -- A subdivision within an area. Most editors have a main region (the central working area), a header region, and optionally a sidebar (N-Panel) and/or toolbar (T-Panel). Regions can be shown or hidden independently. *(Related: Area, Header)*

**T-Panel (Toolbar)** -- The collapsible tool panel on the left side of the 3D Viewport, toggled by pressing T. Contains the active tool selector for the current mode (e.g., Move, Rotate, Scale in Object Mode; Draw, Smooth, Grab in Sculpt Mode). *(Related: N-Panel, Header)*

**Workspace** -- A named arrangement of areas and editor types optimized for a specific task. Blender ships with default workspaces: Layout, Modeling, Sculpting, UV Editing, Texture Paint, Shading, Animation, Rendering, Compositing, and Scripting. Custom workspaces can be created by duplicating and modifying existing ones. Workspaces are accessed via tabs at the top of the Blender window. *(Related: Area, Editor Type)*

---

## 2. Modeling Terms

**Boolean** -- A modifier that combines two meshes using set operations: Union (merge), Difference (subtract), or Intersect (keep only overlapping volume). Booleans are powerful for hard-surface modeling (mechanical parts, architectural elements) but can produce messy topology that requires cleanup. The Exact solver (Blender 3.0+) produces cleaner results than the older Fast solver. *(Related: Modifier, Mesh, Topology)*

**Edge** -- A line segment connecting two vertices. Edges define the boundaries of faces. In Edit Mode, edges can be selected, moved, dissolved, or beveled. An edge shared by exactly two faces is a "manifold" edge; edges shared by zero, one, or three+ faces are "non-manifold." *(Related: Vertex, Face, Edge Loop)*

**Edge Loop** -- A continuous chain of edges that forms a ring around a mesh, typically following the flow of the surface. Edge loops are critical for animation (they should follow muscle and joint deformation paths) and subdivision surface modeling (they control surface curvature). Select an edge loop with Alt+Click on an edge. *(Related: Edge Ring, Topology, Subdivision Surface)*

**Edge Ring** -- A chain of edges connected by faces, running perpendicular to edge loops. Where an edge loop circles around a limb, an edge ring runs along its length. Select an edge ring with Ctrl+Alt+Click. *(Related: Edge Loop, Face)*

**Face** -- A flat or curved surface bounded by three or more edges. Faces are the visible surfaces of a mesh. A face with three edges is a Triangle (Tri), four edges is a Quad, and five or more is an N-gon. *(Related: Quad, Triangle, N-gon, Mesh)*

**Manifold** -- A mesh is manifold if it forms a closed, watertight volume with no geometric ambiguities: every edge is shared by exactly two faces, every vertex connects to a ring of faces, and there are no internal faces. Manifold geometry is required for 3D printing, boolean operations, and some physics simulations. *(Related: Non-manifold, Mesh)*

**Mesh** -- The fundamental geometric data type in Blender, consisting of vertices, edges, and faces. A mesh defines the shape of a 3D object. Blender's mesh system supports arbitrary polygon types (triangles, quads, n-gons) and is the basis for nearly all visible geometry. *(Related: Vertex, Edge, Face, Polygon)*

**Modifier** -- A non-destructive operation applied to an object that alters its geometry, appearance, or behavior without permanently changing the underlying mesh data. Modifiers are stacked and evaluated in order. Common modifiers include Subdivision Surface, Mirror, Array, Boolean, Solidify, Bevel, and Decimate. Modifiers can be applied (made permanent) or removed at any time. *(Related: Subdivision Surface, Boolean)*

**N-gon** -- A face with five or more edges. N-gons are convenient for modeling flat surfaces but cause problems with subdivision surfaces (unpredictable smoothing), game engines (must be triangulated, often with ugly results), and sculpting. Best practice: use n-gons only on flat surfaces that will not deform or subdivide. *(Related: Quad, Triangle, Face, Topology)*

**Non-manifold** -- Geometry that violates manifold rules: edges with fewer than two or more than two adjacent faces, vertices connecting separate face regions, internal faces, or zero-area faces. Non-manifold geometry causes problems for 3D printing, physics simulation, and some rendering scenarios. Blender can select all non-manifold elements via Select > All by Trait > Non-Manifold in Edit Mode. *(Related: Manifold, Mesh)*

**Normal** -- A vector perpendicular to a surface at a given point. Normals determine which direction a face is "pointing" and control how light interacts with the surface. Face normals point outward from the surface; vertex normals are interpolated from surrounding face normals to create smooth shading. Flipped normals (pointing inward) cause faces to appear dark or invisible. *(Related: Face, Vertex, Normal Map)*

**Polygon** -- A general term for any face in a mesh, regardless of the number of edges. In common usage, "polygon count" (or "polycount") refers to the total number of faces in a mesh, often measured in triangles for game development contexts. *(Related: Face, Triangle, Quad, N-gon)*

**Quad** -- A four-sided face (quadrilateral). Quads are the preferred face type in professional 3D modeling because they subdivide predictably, deform cleanly during animation, and produce smooth results with subdivision surfaces. Quad-dominant topology is the standard for character and organic modeling. *(Related: Triangle, N-gon, Topology, Subdivision Surface)*

**Subdivision Surface** -- A modifier that smooths a mesh by subdividing each face into smaller faces and interpolating the resulting vertices. The algorithm (Catmull-Clark for quads, Simple for uniform subdivision) produces progressively smoother surfaces with each level of subdivision. This is the foundational technique for organic modeling: model a low-poly control cage, then subdivide to produce the smooth final shape. *(Related: Quad, Modifier, Topology)*

**Topology** -- The arrangement and flow of vertices, edges, and faces in a mesh. Good topology means: quads in areas that deform, edge loops that follow anatomical features, minimal poles (vertices where more or fewer than four edges meet), and appropriate polygon density. Topology directly affects subdivision quality, deformation during animation, and UV unwrapping. *(Related: Edge Loop, Quad, Manifold)*

**Triangle** -- A three-sided face. Triangles are the atomic rendering primitive (GPUs render everything as triangles internally), but they are generally avoided in modeling because they do not subdivide cleanly and create shading artifacts on curved surfaces. Exceptions: triangles are acceptable for flat surfaces, game assets (which are triangulated at export), and areas hidden from the camera. *(Related: Quad, N-gon, Face)*

**Vertex** -- The most fundamental geometric element: a point in 3D space defined by X, Y, Z coordinates. Vertices are connected by edges, and edges define faces. All mesh geometry is ultimately built from vertices. *(Related: Edge, Face, Mesh)*

---

## 3. Sculpting Terms

**Brush** -- A tool that applies a specific deformation or modification to the mesh surface when used in Sculpt Mode. Blender includes 25+ sculpt brushes: Draw, Clay, Clay Strips, Inflate, Blob, Crease, Smooth, Flatten, Fill, Scrape, Pinch, Grab, Snake Hook, Thumb, Pose, Elastic Deform, Cloth, and others. Each brush has settings for radius, strength, and falloff curve. *(Related: Dyntopo, Sculpt Mode)*

**Dyntopo (Dynamic Topology)** -- A sculpting mode that dynamically adds or removes mesh detail as you sculpt. When Dyntopo is enabled, brush strokes automatically subdivide (or simplify) the mesh locally, allowing you to add detail only where you need it. Dyntopo is useful for rough sculpting and concepting but has limitations: it destroys UV maps, vertex colors, and face sets. For this reason, many workflows use Dyntopo for initial blockout, then retopologize before adding final detail with Multires. *(Related: Multires, Remesh, Voxel Remesh)*

**Face Set** -- A named grouping of faces in Sculpt Mode that allows isolating and controlling visibility of mesh regions. Face sets enable you to hide parts of the mesh while sculpting, preventing accidental deformation of nearby geometry. They are color-coded in the viewport for visual identification and can be created from edit mode selections, visibility boundaries, or automatically by mesh connectivity. *(Related: Sculpt Mode, Brush)*

**Multires (Multiresolution)** -- A modifier that adds subdivision levels to a mesh while preserving the ability to sculpt at each level independently. Unlike Dyntopo, Multires maintains clean topology because it subdivides uniformly. The workflow is: create a clean base mesh with good topology, add a Multires modifier, subdivide to the desired level, then sculpt detail at the higher levels. Lower levels can still be edited for broad form changes. Multires is considered the "golden standard" of sculpting workflows. *(Related: Dyntopo, Subdivision Surface, Voxel Remesh)*

**Remesh** -- The process of regenerating a mesh with new, uniform topology. Blender offers two remesh approaches: Voxel Remesh (creates evenly distributed quads/tris based on a voxel grid) and QuadriFlow Remesh (attempts to create clean, flow-following quad topology). Remeshing is used to clean up Dyntopo meshes, prepare sculpts for Multires, or create retopology basemeshes. *(Related: Voxel Remesh, Dyntopo, Topology)*

**Voxel Remesh** -- A specific remeshing method that rebuilds the mesh based on a 3D voxel grid of a specified size. Larger voxel sizes produce lower-resolution meshes suitable for broad sculpting; smaller voxel sizes produce higher-resolution meshes for detail work. The recommended workflow is to start with a large voxel size for big shapes, decreasing incrementally as forms are finalized, then switch to Multires for fine detail. Accessed via the Remesh panel in Sculpt Mode header. *(Related: Remesh, Dyntopo, Multires)*

---

## 4. UV and Texture Terms

**Albedo** -- The base color of a surface without any lighting, shadow, or reflection information. In PBR workflows, the albedo map (or base color map) provides the pure diffuse color of the material. Albedo maps should not contain baked shadows or ambient occlusion; those are separate maps. The albedo connects to the Base Color input of the Principled BSDF. *(Related: PBR, Normal Map, Roughness Map)*

**Displacement Map** -- A grayscale texture that physically moves mesh geometry based on the texture's brightness values. Unlike normal maps (which fake surface detail through lighting tricks), displacement maps create actual geometric detail. Requires sufficient mesh resolution to capture the detail. In Cycles, displacement can be set to "Displacement Only" or "Displacement and Bump" in the Material Settings. EEVEE Next (4.2+) also supports real displacement. *(Related: Normal Map, Bump Map)*

**Normal Map** -- A texture that stores surface angle information as RGB color values (red=X, green=Y, blue=Z). When applied to a surface, a normal map tells the renderer how light should bounce at each point, creating the illusion of surface detail without additional geometry. Normal maps are the most important baked texture for game assets: they transfer all the detail from a high-poly sculpt to a low-poly game mesh. Connected via a Normal Map node to the Normal input of the Principled BSDF. *(Related: Albedo, Displacement Map, PBR)*

**PBR (Physically Based Rendering)** -- A rendering approach where material properties are defined based on real-world physical principles rather than artistic approximation. PBR materials are described by measurable properties: base color (albedo), metallicness (binary: metal or non-metal), roughness (microsurface scattering), and index of refraction. PBR materials look correct under any lighting condition because they obey conservation of energy. Blender's Principled BSDF is a PBR shader. *(Related: Albedo, Roughness Map, Principled BSDF)*

**Roughness Map** -- A grayscale texture that controls the microsurface roughness of a material. Black = perfectly smooth (mirror-like reflections), white = perfectly rough (diffuse, matte). Roughness maps are essential for realistic materials because real-world surfaces vary in roughness across their area (e.g., a scratched metal surface is rougher at the scratches). Connects to the Roughness input of the Principled BSDF. *(Related: PBR, Albedo, Normal Map)*

**Seam** -- A marked edge in a mesh that defines where the UV unwrapping algorithm "cuts" the 3D surface to lay it flat into a 2D UV map. Good seam placement follows natural breaks in the geometry (behind ears, along hair partings, under arms, at clothing boundaries) and hides seams where the camera will not see them. Seams are marked in Edit Mode via Edge menu > Mark Seam. *(Related: UV, UV Map, Unwrap)*

**Texel Density** -- The number of texture pixels (texels) per unit of 3D surface area. Consistent texel density across a model means that all surfaces display the same level of texture detail regardless of their size or UV island scaling. Inconsistent texel density is immediately noticeable: some areas will look sharp while others look blurry. The Texel Density Checker add-on helps maintain consistency. *(Related: UV Map, Texture Atlas)*

**Texture Atlas** -- A single large texture image that contains the UV-mapped textures for multiple objects or mesh components. Texture atlases reduce draw calls in game engines (one material instead of many), improving rendering performance. Creating an atlas involves arranging multiple objects' UV islands onto a shared texture space. *(Related: UV Map, Texel Density, PBR)*

**Unwrap** -- The process of projecting a 3D mesh surface onto a 2D plane to create UV coordinates. Blender provides several unwrapping methods: Unwrap (conformal, follows seams), Smart UV Project (automatic, creates many islands), Lightmap Pack, Project from View, and Cube/Cylinder/Sphere projections. Good unwrapping minimizes stretching and distortion while maximizing texture space utilization. *(Related: Seam, UV, UV Map)*

**UV** -- The two-dimensional coordinate system used to map 2D textures onto 3D surfaces. "U" and "V" represent the horizontal and vertical axes of the texture space (named U and V to distinguish them from the X, Y, Z axes of 3D space). Each vertex in a mesh has both 3D coordinates (X, Y, Z) and UV coordinates (U, V) that define where it samples the texture. *(Related: UV Map, Unwrap, Seam)*

**UV Map** -- A specific set of UV coordinates stored on a mesh. A single mesh can have multiple UV maps for different purposes (e.g., one for color textures, another for lightmaps). UV maps are created and managed in the Object Data Properties panel. The UV Editor displays the active UV map for editing. *(Related: UV, Unwrap, Seam)*

---

## 5. Shading Terms

**Anisotropic** -- A material property where the roughness of a surface varies depending on direction, creating elongated highlights. Examples: brushed metal, vinyl records, hair, satin fabric. In the Principled BSDF, the Anisotropic input controls the strength of this directional roughness effect, and the Anisotropic Rotation input controls the direction. *(Related: BSDF, Roughness Map, Principled BSDF)*

**BSDF (Bidirectional Scattering Distribution Function)** -- A mathematical function that describes how light scatters when it hits a surface, encompassing both reflection (BRDF) and transmission (BTDF). In Blender, BSDF is used in shader node names to indicate that they model physically based light interaction. The Principled BSDF combines multiple scattering models into a single, versatile shader. *(Related: Principled BSDF, Shader)*

**Emission** -- The property of a surface that emits light. Emissive surfaces glow and contribute illumination to the scene (in Cycles, they cast light on other objects; in EEVEE, they glow visually but require Irradiance Volumes or Screen Space Global Illumination to affect other surfaces). The Emission input on the Principled BSDF sets the emissive color and strength. *(Related: Principled BSDF, Shader)*

**Fresnel** -- The optical phenomenon where the amount of light reflected from a surface changes with the viewing angle: more reflection at grazing angles, less at perpendicular angles. All dielectric (non-metallic) surfaces exhibit Fresnel behavior. The Principled BSDF handles Fresnel automatically based on the IOR (Index of Refraction) value. Named after Augustin-Jean Fresnel (1788-1827). *(Related: IOR, Principled BSDF, BSDF)*

**IOR (Index of Refraction)** -- A value that describes how much light bends when passing through a material. Water: 1.33, glass: 1.5, diamond: 2.42. IOR also controls the amount of specular reflection at perpendicular viewing angles via the Fresnel equations. In Blender 4.0+, the Principled BSDF uses a single IOR input to control both refraction and specular reflection, with a separate "IOR Level" input for artistic adjustment. *(Related: Fresnel, Principled BSDF, Transmission)*

**Mix Shader** -- A shader node that blends two input shaders together based on a factor value (0 = only the top shader, 1 = only the bottom shader). Used to combine different material types on a single surface, such as mixing a glossy shader with a diffuse shader, or blending two Principled BSDFs with a mask texture. *(Related: Shader, Node Tree, Principled BSDF)*

**Node Tree** -- A visual programming graph consisting of connected nodes that defines a material, compositing operation, or geometry processing pipeline. In the Shader Editor, nodes are connected left-to-right, with data flowing from input nodes (textures, coordinates) through processing nodes (math, color operations) to output nodes (Material Output). Blender uses node trees for shading, compositing, Geometry Nodes, and texture generation. *(Related: Shader, Mix Shader, Principled BSDF)*

**Principled BSDF** -- Blender's primary PBR shader node, combining multiple material models into a single, artist-friendly interface. Based on the OpenPBR Surface shading model and compatible with the Disney Principled shader and Standard Surface models. Key inputs: Base Color, Metallic, Roughness, IOR, Subsurface, Coat, Sheen, Emission, Alpha, Normal. The Principled BSDF can represent almost any real-world material by adjusting its inputs. Revised in Blender 4.0 with a new layer structure (Coat on top, then Sheen, then Emission, then base material). *(Related: PBR, BSDF, Node Tree)*

**Shader** -- A program or node configuration that defines how a surface responds to light. In Blender, shaders are built in the Shader Editor using nodes. The term is used both for the overall material definition and for individual shader nodes (Principled BSDF, Glass BSDF, Diffuse BSDF, etc.). *(Related: BSDF, Node Tree, Material)*

**Subsurface Scattering (SSS)** -- A rendering technique that simulates light penetrating a translucent surface, scattering internally, and exiting at a different point. Essential for realistic rendering of skin, wax, marble, milk, leaves, and any material where light does not simply bounce off the surface. Controlled by the Subsurface input on the Principled BSDF (Blender 4.0+ uses the base color for SSS color and a separate Subsurface Scale input for the scattering radius). *(Related: Principled BSDF, BSDF)*

---

## 6. Rendering Terms

**Adaptive Sampling** -- A Cycles feature that concentrates rendering samples on noisy areas of the image while using fewer samples on already-clean areas. This can significantly reduce render times without sacrificing quality. Controlled by a noise threshold: lower threshold = cleaner result but more samples. Introduced in Blender 2.83 and enabled by default since Blender 3.0. *(Related: Samples, Denoising, Cycles)*

**AgX** -- The default view transform in Blender 4.0+, replacing Filmic. Named after the chemical notation for silver halide (AgX), the photosensitive compound in analog film. AgX provides 16.5 stops of dynamic range, improved handling of saturated colors in overexposed areas (bright colors go toward white rather than neon), and more natural highlight rolloff. AgX is a display transform, not a color space; it converts linear render data to screen-displayable imagery. *(Related: Filmic, HDRI, OCIO)*

**Caustics** -- Patterns of concentrated light created when light refracts through or reflects off a curved transparent or reflective surface (e.g., the rippling light patterns on the bottom of a swimming pool, the focused bright spot under a glass sphere). Cycles supports caustics through path tracing but they require many samples to resolve cleanly. Caustic-specific features (Manifold Next Event Estimation) were added in Blender 3.5. EEVEE does not support caustics. *(Related: Path Tracing, Light Bounce, Cycles)*

**Cycles** -- Blender's physically accurate, unbiased path-tracing render engine. Cycles simulates light transport by tracing rays from the camera through the scene, bouncing off surfaces according to their material properties. Supports GPU rendering (CUDA/OptiX for NVIDIA, HIP for AMD, oneAPI for Intel, Metal for Apple). Cycles X (Blender 3.0) was a complete rewrite delivering 2-7x performance improvement. *(Related: EEVEE, Path Tracing, Samples)*

**Denoising** -- Post-processing that removes noise (grain) from rendered images. Blender supports three denoisers: OpenImageDenoise (Intel, CPU-based, high quality), OptiX Denoiser (NVIDIA, GPU-based, very fast), and the legacy Blender denoiser. Denoising allows using fewer samples while maintaining clean final images, dramatically reducing render times. Applied either as a render setting or as a compositor node. *(Related: Samples, Adaptive Sampling, Cycles)*

**EEVEE** -- Blender's real-time PBR render engine, introduced in Blender 2.80 (2019). EEVEE uses rasterization rather than ray tracing, sacrificing physical accuracy for speed. EEVEE Next (Blender 4.2 LTS) was a complete rewrite adding screen-space global illumination (SSGI), unlimited lights (up to 4,096 visible simultaneously), real displacement, volumetric shadows, and viewport motion blur. Used by the Oscar-winning film *Flow* (2024). *(Related: Cycles, Path Tracing, HDRI)*

**Filmic** -- The predecessor to AgX as Blender's view transform (default in Blender 2.79-3.6). Developed by Troy Sobotka, Filmic provides a sigmoid-based tone mapping curve that compresses high dynamic range render data into displayable imagery with natural highlight rolloff and 12.5+ stops of dynamic range. Deprecated in favor of AgX in Blender 4.0 but still available. *(Related: AgX, HDRI, Color Management)*

**HDRI (High Dynamic Range Image)** -- A panoramic image (usually in .hdr or .exr format) that captures a full 360-degree view of a real-world environment with a wide range of light intensity values. Used as an environment map (World shader > Environment Texture) to provide realistic lighting and reflections. A single HDRI can provide convincing outdoor or indoor lighting with minimal setup. *(Related: Cycles, EEVEE, AgX)*

**Light Bounce** -- Each time a ray of light reflects off a surface in a path-traced renderer. The number of allowed light bounces controls rendering accuracy: more bounces = more realistic light transport (light bouncing around a room, color bleeding between surfaces) but slower rendering. Controlled in Cycles via Render Properties > Light Paths > Max Bounces. *(Related: Path Tracing, Cycles, Caustics)*

**Path Tracing** -- A rendering algorithm that simulates light transport by tracing random paths from the camera through the scene, bouncing off surfaces according to their material properties. Each path accumulates light contributions from emitters (lights, environment). Multiple paths per pixel are averaged to produce the final image; more paths (samples) = less noise. Cycles is a path tracer. *(Related: Cycles, Samples, Light Bounce)*

**Samples** -- The number of light paths traced per pixel in a path-traced renderer. More samples produce cleaner (less noisy) images but take longer to render. Typical values: 128-512 for preview, 1024-4096 for final renders, though with adaptive sampling and denoising, lower values often suffice. *(Related: Path Tracing, Adaptive Sampling, Denoising)*

---

## 7. Animation Terms

**Action** -- A named, reusable container for animation data (keyframes, F-Curves). Actions can be assigned to objects, stored in the Blend file's data, and reused across multiple objects or combined in the NLA Editor. For example, a "Walk" action and a "Wave" action can be blended in the NLA. In Blender 4.4+, Actions support Slots for multi-datablock animation. *(Related: Action Strip, NLA, Keyframe)*

**Action Slot** -- Introduced in Blender 4.4, a mechanism that allows a single Action to store distinct animation data for multiple data-blocks. Each slot within an Action is earmarked for a specific data-block (e.g., one slot for an object's transforms, another for its material's colors). This enables animating an object and its material in a single Action rather than requiring separate Actions. *(Related: Action, Action Strip, NLA)*

**Action Strip** -- An instance of an Action placed on a track in the NLA Editor. Action strips can be shortened, lengthened, scaled, repeated, blended, and layered with other strips. They function like clips in a video editor but contain animation data instead of video footage. *(Related: Action, NLA, Interpolation)*

**Dope Sheet** -- An animation editor that displays keyframes as dots on a timeline, organized by object and channel. The Dope Sheet provides an overview of when keyframes occur and allows batch timing adjustments: select multiple keyframes and move, scale, or delete them. The Dope Sheet is for "when things happen"; the Graph Editor is for "how things move between keyframes." *(Related: Keyframe, Graph Editor, F-Curve)*

**Ease (Easing)** -- Interpolation presets that control the acceleration and deceleration of animation between keyframes. Common easing types: Ease In (slow start, fast end), Ease Out (fast start, slow end), Ease In/Out (slow start, slow end, fast middle). In the Graph Editor, easing is controlled by the handles on F-Curve keyframes or via dedicated easing modes. *(Related: Interpolation, F-Curve, Keyframe)*

**F-Curve** -- A function curve that defines how an animated property changes over time. Every animated property (X location, rotation, scale, material color, etc.) has an F-Curve consisting of keyframes connected by interpolation curves. F-Curves are viewed and edited in the Graph Editor, where their shape directly controls the motion: steep = fast, flat = stopped, S-curve = ease in/out. *(Related: Keyframe, Graph Editor, Interpolation)*

**Graph Editor** -- An animation editor that displays F-Curves as visual graphs: time on the horizontal axis, value on the vertical axis. The Graph Editor provides precise control over animation timing and motion: adjust curve handles for smooth easing, add modifiers (noise, cycles), and fine-tune individual channels. *(Related: F-Curve, Dope Sheet, Keyframe)*

**Interpolation** -- The method used to calculate values between keyframes. Blender supports multiple interpolation types: Constant (no interpolation, value jumps), Linear (straight line between keyframes), Bezier (smooth curves with adjustable handles), and various easing presets (Sine, Quad, Cubic, Back, Bounce, Elastic). Set per-keyframe via right-click > Interpolation Mode in the Graph Editor. *(Related: Keyframe, F-Curve, Ease)*

**Keyframe** -- A stored value for a property at a specific frame of the timeline. Blender interpolates between keyframes to create animation. Keyframes can be set for any animatable property: transform (location, rotation, scale), material values, modifier settings, shape key weights, and more. Insert a keyframe by hovering over a property and pressing I, or by pressing I in the 3D Viewport for transform keyframes. *(Related: F-Curve, Dope Sheet, Interpolation)*

**NLA (Non-Linear Animation) Editor** -- An editor that allows combining, blending, and layering Actions as strips on a timeline, similar to a video editor. The NLA Editor enables non-destructive animation compositing: a walk cycle can be blended with a head-turn action without modifying either original animation. Higher tracks take precedence over lower tracks, with blending controlled per-strip. *(Related: Action, Action Strip, Dope Sheet)*

---

## 8. Rigging Terms

**Armature** -- Blender's skeleton object type, consisting of a hierarchy of bones. An armature is parented to a mesh to control its deformation. Armatures are edited in Edit Mode (bone placement), posed in Pose Mode (animation), and can contain constraints, drivers, and custom properties. A single armature typically controls one character. *(Related: Bone, Weight Paint, Constraint)*

**Bone** -- An individual element within an armature. Each bone has a head (root) and tail (tip), a roll angle, and can be parented to other bones to form chains. Bones deform the mesh vertices assigned to them via weight painting. In Blender 4.0+, bones are organized using Bone Collections instead of numbered layers. *(Related: Armature, Bone Collection, Weight Paint)*

**Bone Collection** -- Introduced in Blender 4.0, bone collections replace the legacy 32-layer bone visibility system and bone groups. Collections can be named (e.g., "FK Arm Left," "IK Controls," "Deform Bones"), have unlimited count, and support solo mode for quickly isolating specific bone sets during animation. *(Related: Bone, Armature, Rigify)*

**Constraint** -- A rule applied to a bone or object that limits or controls its transform based on other objects, bones, or custom conditions. Constraint types include: Copy Location/Rotation/Scale, Track To, Damped Track, Inverse Kinematics, Limit Location/Rotation/Scale, Floor, Clamp To, and many others. Constraints are the building blocks of complex rig behaviors. *(Related: IK, FK, Armature)*

**Driver** -- An expression that controls a property's value based on other properties, custom variables, or Python expressions. Drivers enable procedural animation: a character's eyelids can automatically follow gaze direction, corrective shape keys can activate when a joint bends past a threshold, or a gear can rotate proportionally to another gear. Drivers are defined in the Drivers Editor or by right-clicking a property and selecting "Add Driver." *(Related: Shape Key, Constraint, Bone)*

**FK (Forward Kinematics)** -- An animation method where each bone in a chain is rotated individually, starting from the root and working outward. The animator controls each joint directly (shoulder, then elbow, then wrist). FK provides precise artistic control over every joint angle and is preferred for arms during most animation tasks, overlapping action, and arcs. *(Related: IK, Armature, Bone)*

**IK (Inverse Kinematics)** -- An animation method where the end of a bone chain (e.g., the hand) is positioned, and the solver automatically calculates the rotation of all intermediate bones (elbow, shoulder) to reach that position. IK is preferred for legs (feet need to stay planted on the ground) and for any situation where the end-point is more important than the joint angles. Blender supports both standard IK and Spline IK (bone chain follows a curve). *(Related: FK, Constraint, Armature)*

**Rigify** -- Blender's built-in auto-rigging add-on. Rigify generates production-quality control rigs from simple "meta-rig" templates. The process: select a meta-rig template (Human, Quadruped, Bird, etc.), position the meta-rig bones to match your character, click "Generate Rig." The generated rig includes FK/IK switching, stretchy bones, Bendy Bones for smooth deformation, and a UI panel for rig controls. Rigify is used in professional productions and is compatible with Unity's Humanoid avatar system. *(Related: Armature, Bone, IK, FK)*

**Shape Key** -- A stored mesh deformation that can be blended on and off. Shape keys are commonly used for facial expressions (a "Smile" shape key, a "Blink_L" shape key), corrective deformations (fixing shoulder mesh collapse at extreme rotations), and morph targets for game engines. Shape keys interpolate between the Basis (default) shape and each target shape based on their Value slider (0 = no effect, 1 = full effect). *(Related: Driver, Armature, Weight Paint)*

**Weight Paint** -- A mode for painting vertex weights onto a mesh, defining how much each vertex is influenced by each bone in the armature. Displayed as a color gradient: blue = no influence (weight 0), green = half influence (weight 0.5), red = full influence (weight 1). Good weight painting is essential for clean deformation: shoulders, hips, and fingers typically require manual weight paint refinement after automatic weighting. *(Related: Bone, Armature, Vertex)*

---

## 9. Simulation Terms

**Bake** -- The process of pre-calculating and storing simulation results (fluid, smoke, cloth, rigid body, particles) as cached data. Baking converts a dynamic simulation into a fixed sequence of states, ensuring reproducible playback and enabling rendering without re-simulating. Baked data can be stored in memory or to disk. Baking is required before rendering any simulation that involves fluid or particle dynamics. *(Related: Mantaflow, Rigid Body, Cloth)*

**Bullet** -- The open-source physics engine used for Blender's rigid body simulations. Bullet handles collision detection, rigid body dynamics, and basic constraint solving. Named after the Bullet Physics SDK, it is the default solver for rigid body simulations in Blender and is widely used in game engines (including Unity and earlier versions of Unreal). *(Related: Rigid Body, Soft Body, Force Field)*

**Cloth** -- A physics simulation type that makes a mesh behave like fabric, responding to gravity, wind, collisions, and internal tension. Cloth simulation settings include structural stiffness, bending stiffness, damping, and air resistance. Objects in the scene can be marked as collision objects for the cloth to interact with. *(Related: Soft Body, Force Field, Bake)*

**Fire** -- A simulation type within Mantaflow that generates combustion effects. Fire simulations produce both flame geometry (emissive) and smoke (volumetric). Fire is created by designating an object as a Flow emitter with the type set to "Fire" or "Fire + Smoke" and a domain object to contain the simulation volume. *(Related: Smoke, Mantaflow, Bake)*

**Fluid** -- A liquid simulation type within Mantaflow. Fluid simulations model the behavior of liquids: splashing, pouring, pooling, and interaction with obstacle objects. The simulation uses a domain object (the bounding volume), flow objects (emitters/inflows), and effector objects (obstacles). Resolution is controlled by domain subdivisions. *(Related: Mantaflow, Smoke, Bake)*

**Force Field** -- An invisible influence that affects physics simulations (particles, cloth, fluid, rigid body, soft body). Blender includes force field types: Wind, Vortex, Turbulence, Drag, Magnetic, Harmonic, Charge, Lennard-Jones, and Boid. Force fields are added as empty objects and influence simulations within their falloff radius. *(Related: Particle System, Cloth, Rigid Body)*

**Mantaflow** -- Blender's physics-based fluid simulation framework for gas (smoke and fire) and liquid simulations. Mantaflow replaced the older fluid simulation system in Blender 2.82. It is an open-source framework (originally developed at TU Munich) that provides physically accurate fluid dynamics with support for adaptive resolution, particle-based detail enhancement, and viscosity. *(Related: Fluid, Smoke, Fire, Bake)*

**Particle System** -- A system for generating and controlling large numbers of small elements (particles) emitted from a mesh surface. Used for effects like rain, snow, sparks, debris, hair, grass, and abstract effects. Each particle has position, velocity, lifetime, and can be rendered as points, objects, or paths. Blender has both a legacy particle system and the newer Hair Curves system (Blender 3.3+) for hair specifically. *(Related: Force Field, Bake, Mantaflow)*

**Rigid Body** -- A physics simulation type where objects collide and interact as solid, non-deforming shapes. Rigid body objects have properties: mass, friction, bounciness (restitution), collision shape (convex hull, mesh, box, sphere). Used for simulations like falling objects, dominos, shattered fragments, and mechanical interactions. Uses the Bullet physics engine. *(Related: Bullet, Soft Body, Constraint)*

**Smoke** -- A volumetric gas simulation type within Mantaflow. Smoke simulations generate density fields that are rendered as volumetric media. Smoke responds to turbulence, buoyancy, temperature, and wind forces. Often combined with fire simulations. *(Related: Fire, Mantaflow, Fluid)*

**Soft Body** -- A physics simulation type where objects deform when they collide or are influenced by forces, simulating materials like rubber, jelly, or fat. Less computationally expensive than cloth simulation but with less control over fabric-like behavior. Useful for secondary motion on character rigs (jiggling flesh, bouncing accessories). *(Related: Rigid Body, Cloth, Bullet)*

---

## 10. Compositing Terms

**Alpha Over** -- A compositor node that layers one image over another using alpha (transparency) information. The foreground image's alpha channel determines which areas are transparent, revealing the background image beneath. This is the primary node for combining rendered elements with backgrounds, overlaying titles, or assembling multi-pass renders. *(Related: Render Pass, Compositor)*

**Color Balance** -- A compositor node that adjusts the color of an image using lift (shadows), gamma (midtones), and gain (highlights) controls, or via an alternative offset/power/slope model (the ASC-CDL color grading standard). Color Balance is the primary color grading tool in Blender's compositor. *(Related: Curves, Compositor)*

**Cryptomatte** -- A rendering and compositing standard (originally developed by Psyop) that creates automatic, anti-aliased matte selections based on object, material, or asset identity. In Blender, Cryptomatte render passes are generated during rendering, and the Cryptomatte compositor node allows clicking on specific objects in the rendered image to create precise selection masks without manual rotoscoping. Supports three selection modes: Object, Material, and Asset. *(Related: Render Pass, EXR, Alpha Over)*

**Curves** -- A compositor node that adjusts the brightness and contrast of an image using a spline curve. The curve maps input brightness values (horizontal axis) to output brightness values (vertical axis). Separate curves can be applied to the combined RGB channels or individual R, G, B channels. The Curves node provides finer control than Color Balance for targeted tonal adjustments. *(Related: Color Balance, Compositor)*

**EXR (OpenEXR)** -- A high dynamic range image format developed by Industrial Light & Magic. EXR files store floating-point color data (16-bit or 32-bit per channel), preserving the full range of render data without clipping highlights or crushing shadows. Multi-layer EXR files can store multiple render passes (Combined, Depth, Normal, AO, Cryptomatte, etc.) in a single file. EXR is the standard interchange format for professional VFX compositing. EXR files bypass the view transform (AgX/Filmic), storing raw linear data. *(Related: Render Pass, Cryptomatte, Compositor)*

**Glare** -- A compositor node that adds bloom, streaks, fog glow, or ghost effects to bright areas of the rendered image. Glare simulates lens artifacts and atmospheric diffusion, giving renders a cinematic quality. The Glare node operates on the combined image and is controlled by threshold (minimum brightness to affect), quality, and type (Bloom, Streaks, Fog Glow, Simple Star, Ghosts). *(Related: Compositor, Render Pass)*

**Render Pass** -- A specific component of the rendered image output separately from the combined result. Available passes include: Combined (final image), Depth (Z-buffer), Normal (surface direction), AO (ambient occlusion), Shadow, Emit, Environment, Diffuse Color/Direct/Indirect, Glossy Color/Direct/Indirect, Transmission, Volume, Cryptomatte, and Denoising Data. Render passes are enabled per-View Layer and accessed in the compositor via the Render Layers node. *(Related: EXR, Cryptomatte, Compositor)*

---

## 11. Video Editing Terms

**Codec** -- A compression/decompression algorithm used to encode and decode video files. Common codecs for Blender output include H.264 (widely compatible, good compression), H.265/HEVC (better compression than H.264, less compatible), FFV1 (lossless, large files), and PNG sequences (lossless, frame-by-frame). Codec selection is found in Output Properties > Encoding. *(Related: VSE, Strip)*

**H.265 (HEVC)** -- High Efficiency Video Coding, a video compression standard that provides approximately 50% better compression than H.264 at equivalent quality. H.265 is supported by Blender's FFmpeg-based video encoder. Useful for final delivery of long animations where file size matters, though H.264 remains more universally compatible. *(Related: Codec, VSE)*

**Keyframe (VSE)** -- In the Video Sequence Editor context, keyframes animate strip properties over time: opacity, position, volume, speed. VSE keyframes work independently from the main animation system's keyframes, though the concept is identical: stored values at specific frames with interpolation between them. *(Related: Strip, Transition, VSE)*

**Strip** -- The fundamental element in the Video Sequence Editor: a rectangular block on the timeline representing a piece of media. Strip types include: Movie (video file), Image (still or image sequence), Sound (audio), Scene (renders a Blender scene), Color (solid color), Text, Adjustment Layer, and Effect (transform, speed, blur). Strips can be trimmed, moved, overlapped, and cross-faded. *(Related: VSE, Transition, Keyframe)*

**Transition** -- An effect strip in the VSE that creates a visual change between two overlapping strips. Built-in transitions include Cross (dissolve), Gamma Cross (perceptually linear dissolve), and Wipe (directional reveal). More complex transitions can be built using the Transform effect and keyframed properties. *(Related: Strip, VSE)*

**VSE (Video Sequence Editor)** -- Blender's built-in non-linear video editor. The VSE supports multi-track video and audio editing, effects, transitions, color correction, text overlays, and speed control. While not as feature-rich as dedicated video editors (DaVinci Resolve, Premiere Pro), the VSE is capable of producing complete video projects without leaving Blender. Useful for animators who need to edit their rendered sequences, add sound effects, and produce final deliverables. *(Related: Strip, Transition, Codec)*

---

## 12. Scripting Terms

**Add-on** -- A Python module packaged for installation through Blender's Preferences > Add-ons interface. Add-ons extend Blender with new tools, operators, panels, importers/exporters, and render engines. Each add-on contains a `bl_info` dictionary with metadata (name, author, version, category) and `register()`/`unregister()` functions. As of Blender 4.2, add-ons are distributed through the Extensions platform. *(Related: bl_info, register, Operator, Panel)*

**bl_info** -- A Python dictionary at the top of an add-on's `__init__.py` file that provides metadata to Blender: name, author, version, blender version compatibility, description, category, and documentation URL. Blender reads `bl_info` to display add-on information in the Preferences panel and to determine compatibility. *(Related: Add-on, register)*

**bpy** -- Blender's primary Python API module. `bpy` provides access to all Blender data and operations: `bpy.data` (all data-blocks: objects, meshes, materials, etc.), `bpy.context` (current selection, active object, mode), `bpy.ops` (callable operators), `bpy.types` (class definitions for extending Blender), and `bpy.props` (property types for operator and panel creation). *(Related: Operator, Panel, mathutils)*

**mathutils** -- A standalone Python module bundled with Blender that provides math types and utilities: `Vector` (2D/3D/4D), `Matrix` (2x2 through 4x4), `Quaternion`, `Euler`, and `Color`. Includes operations like dot product, cross product, matrix multiplication, interpolation, and geometric utilities (ray-triangle intersection, Bezier interpolation). Used extensively in scripting for transform calculations. *(Related: bpy, Operator)*

**Operator** -- A callable action in Blender, defined as a Python class subclassing `bpy.types.Operator`. Operators perform specific tasks (e.g., `bpy.ops.mesh.extrude_region()`, `bpy.ops.object.modifier_apply()`). Custom operators define an `execute()` method that performs the operation and returns `{'FINISHED'}` or `{'CANCELLED'}`. Operators can have properties (defined via `bpy.props`) that appear as UI controls when invoked. *(Related: bpy, Panel, Add-on)*

**Panel** -- A UI element in Blender defined as a Python class subclassing `bpy.types.Panel`. Panels display controls, information, and operator buttons in the Properties editor, N-Panel, or other locations. Panels are defined by specifying their location (`bl_space_type`, `bl_region_type`), category, and a `draw()` method that builds the UI using Blender's layout system. *(Related: Operator, bpy, Add-on)*

**register** -- A function (`register()`) in a Blender add-on that registers all custom classes (operators, panels, menus, properties) with Blender, making them available for use. The complementary `unregister()` function removes them. These functions are called automatically when an add-on is enabled or disabled in Preferences. *(Related: Add-on, bl_info, Operator)*

---

## 13. Pipeline Terms

**Append** -- The operation of copying data-blocks (objects, materials, collections, etc.) from an external .blend file into the current file. Appended data becomes an independent copy with no connection to the source file. Use Append when you need to modify the imported data or when the source file will not be maintained. Accessed via File > Append. *(Related: Linked Library, USD, FBX)*

**FBX** -- A proprietary binary file format owned by Autodesk, widely used for 3D asset interchange between DCC tools and game engines. FBX supports geometry, materials (partially), animations, armatures, blend shapes (shape keys), and cameras. FBX is the preferred import format for Unity and Unreal Engine. Blender includes both FBX import and export. Limitations: FBX does not preserve Blender-specific features like modifiers, node-based materials, or Geometry Nodes. *(Related: glTF, USD, OBJ)*

**Flamenco** -- Blender's official open-source render farm manager. Consists of a Manager (coordinator), Workers (render nodes), and a web dashboard. Job types are defined in JavaScript, allowing TDs to customize render workflows. Used in Blender Studio productions. *(Related: Linked Library, OCIO)*

**glTF** -- Graphics Library Transmission Format, an open standard (Khronos Group) for real-time 3D asset delivery. glTF 2.0 supports PBR materials (metallic-roughness), skeletal animation, morph targets, and mesh compression (Draco). Output as .gltf (JSON + separate .bin) or .glb (single binary). Preferred format for web (Three.js, Babylon.js), Godot Engine, and AR/VR platforms. ISO/IEC 12113:2022. *(Related: FBX, USD, PBR)*

**Linked Library** -- Data referenced from an external .blend file via File > Link. Linked data appears in the current file but cannot be directly edited; changes to the source file are reflected when the referencing file is reloaded. Library Overrides (Blender 3.0+) allow specific, tracked modifications to linked data. Linking is the foundation of multi-artist production pipelines where characters, environments, and props are maintained in separate files. *(Related: Append, Library Override)*

**OBJ** -- Wavefront OBJ, one of the oldest and simplest 3D file formats. Stores geometry (vertices, faces, normals, UVs) in plain text with an optional .mtl companion file for basic materials. OBJ does not support animation, armatures, or PBR materials. Useful for simple geometry interchange when format compatibility is the primary concern. *(Related: FBX, glTF, USD)*

**OCIO (OpenColorIO)** -- An open-source color management framework used by Blender and many other DCC tools to ensure consistent color interpretation across the production pipeline. Blender's OCIO configuration defines available color spaces, display transforms (AgX, Filmic, Standard), and look transforms. Studios can load custom OCIO configurations (e.g., ACES) to match their pipeline's color management standard. *(Related: AgX, Filmic, VFX Reference Platform)*

**USD (Universal Scene Description)** -- A framework for describing, composing, and reading hierarchically organized scene data, originally developed by Pixar. USD supports geometry, materials (UsdPreviewSurface), animations, cameras, lights, and composition arcs (references, payloads, variants). Blender supports USD import/export (.usda, .usdc, .usdz) since version 3.0, enabling interoperability with Houdini, Unreal Engine, Maya, Katana, and other USD-compatible tools. *(Related: FBX, glTF, OCIO)*

**VFX Reference Platform** -- An annual specification of tool and library versions published by the Visual Effects Society Technology Committee. Compliance means software can interoperate without library version conflicts. Blender 4.2 LTS aligns with VFX Reference Platform 2024; Blender 4.4 aligns with 2025. VFX Reference Platform compliance is critical for studio adoption because it ensures Blender can coexist with Maya, Houdini, Nuke, and other tools in the same pipeline. *(Related: OCIO, USD, Pipeline)*

---

## 14. Furry and VRChat Avatar Terms

**Anthro (Anthropomorphic)** -- A character design that gives non-human characteristics (typically animal features) to a humanoid body plan. In the Blender context, anthro characters are modeled with humanoid proportions and posture but with animal heads, tails, fur, paws, and other species-specific features. Anthro character modeling requires decisions about digitigrade vs. plantigrade leg structure and fur rendering approach. *(Related: Fursona, Digitigrade, Plantigrade)*

**Base Mesh** -- A generic, pre-built character mesh used as a starting point for creating custom avatars. In the furry/VRChat community, base meshes (often called "bases") provide a complete rigged and weighted character body that artists customize with unique features, textures, and accessories. Popular bases include Rexouium, Wickerbeast, Protogen, and Avali. Using a base mesh dramatically reduces the technical skill required to create a functional VRChat avatar. *(Related: Anthro, VRChat Avatar, Fursona)*

**Digitigrade** -- A leg structure where the character walks on its toes, with the ankle elevated (like a dog, cat, or bird). In character modeling, digitigrade legs require a different bone structure than human legs: the visible "knee" is actually the ankle, and the actual knee is higher up, often hidden by the thigh. Digitigrade rigs are more complex than plantigrade rigs and require careful weight painting at the ankle joint. *(Related: Plantigrade, Anthro, Fursona)*

**Full Body Tracking (FBT)** -- A VRChat feature that tracks the user's full body movement (not just head and hands) using additional tracking devices (Vive Trackers, SlimeVR, Tundra Trackers). FBT requires the VRChat avatar to have properly configured hip, foot, and optional chest/elbow tracking points. Avatars designed for FBT need clean leg deformation (especially if digitigrade) and correct bone orientations for the tracking system to drive the rig accurately. *(Related: VRChat Avatar, PhysBones, Digitigrade)*

**Fursona** -- A furry community member's personal anthropomorphic character identity. In the 3D modeling context, creating a fursona involves designing and building a custom anthro character, often documented in a reference sheet (ref sheet) that specifies species, colors, markings, proportions, and accessories. The fursona is then modeled, rigged, and textured in Blender for use as a VRChat avatar, VTuber model, or illustration reference. *(Related: Anthro, Ref Sheet, VRChat Avatar)*

**PhysBones** -- VRChat's proprietary physics system for secondary motion on avatars. PhysBones components are added to bones in the Unity editor (after exporting from Blender) to make tails, ears, hair, clothing, and other elements respond to movement with physically simulated secondary motion: swaying, bouncing, and gravity response. PhysBones replaced the older Dynamic Bones system and are configurable per-bone with stiffness, elasticity, and collision settings. *(Related: VRChat Avatar, Full Body Tracking, Armature)*

**Plantigrade** -- A leg structure where the character walks on the full sole of the foot, with the heel touching the ground (like humans, bears, or raccoons). Plantigrade legs use a standard humanoid bone structure and are simpler to rig and animate than digitigrade legs. Most VRChat avatar bases use plantigrade legs because they are compatible with VRChat's built-in IK system without additional configuration. *(Related: Digitigrade, Anthro, Fursona)*

**Ref Sheet (Reference Sheet)** -- A document (typically a digital illustration) that defines a character's visual design from multiple angles: front, side, back, and three-quarter views, along with color palette, markings, distinguishing features, and accessory details. In the Blender workflow, the ref sheet is loaded as a background image in the 3D Viewport to guide modeling. A thorough ref sheet prevents inconsistencies and saves significant modeling time. *(Related: Fursona, Anthro, Base Mesh)*

**VRChat Avatar** -- A 3D character model prepared for use in VRChat, a social VR platform. The creation pipeline typically starts in Blender (modeling, UV unwrapping, texturing, rigging, weight painting), exports to FBX, and is finalized in Unity using the VRChat SDK (adding PhysBones, configuring performance rank, setting up viewpoint and visemes for lip sync). VRChat avatars have performance categories (Excellent, Good, Medium, Poor, Very Poor) based on polygon count, material count, bone count, and other metrics. *(Related: PhysBones, Full Body Tracking, Fursona)*

**VRM** -- An open file format (based on glTF 2.0) for 3D humanoid avatar models, developed by the VRM Consortium. VRM files contain a complete avatar: mesh, materials, rig, blend shapes for expressions, and metadata (author, license, usage permissions). VRM is used by VTuber software (VSeeFace, Warudo), some VR platforms, and social applications. Blender can import/export VRM via the VRM Add-on for Blender. *(Related: glTF, VRChat Avatar, Fursona)*

---

## 15. Sources

1. Blender Manual. "3D Viewport." https://docs.blender.org/manual/en/latest/editors/3dview/introduction.html
2. Blender Manual. "Sculpt Mode -- Adaptive Resolution." https://docs.blender.org/manual/en/3.6/sculpt_paint/sculpting/introduction/adaptive.html
3. Blender Manual. "Principled BSDF." https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html
4. Blender Developer Documentation. "Blender 4.0 -- Shading & Texturing." https://developer.blender.org/docs/release_notes/4.0/shading/
5. Blender Developer Documentation. "EEVEE Next Generation in Blender 4.2 LTS." https://code.blender.org/2024/07/eevee-next-generation-in-blender-4-2-lts/
6. Blender Manual. "NLA Editor -- Introduction." https://docs.blender.org/manual/en/latest/editors/nla/introduction.html
7. Blender Developer Documentation. "Layered Actions." https://developer.blender.org/docs/features/animation/animation_system/layered/
8. Blender Developer Documentation. "Animation & Rigging -- 4.4." https://developer.blender.org/docs/release_notes/4.4/animation_rigging/
9. Blender Manual. "Rigify." https://docs.blender.org/manual/en/2.81/addons/rigging/rigify.html
10. Blender Developer Documentation. "Animation & Rigging -- 4.0." https://developer.blender.org/docs/release_notes/4.0/animation_rigging/
11. Blender Manual. "Fluid Simulation." https://docs.blender.org/manual/en/latest/physics/fluid/index.html
12. Blender Manual. "Render Baking." https://docs.blender.org/manual/en/latest/render/cycles/baking.html
13. Graphics Programming Discord. "The one true guide to baking materials in Blender." https://graphics-programming.org/blog/blender-baking
14. Blender Manual. "Cryptomatte Node." https://docs.blender.org/manual/en/latest/compositing/types/mask/cryptomatte.html
15. Blender Manual. "Universal Scene Description." https://docs.blender.org/manual/en/latest/files/import_export/usd.html
16. Blender Developer Documentation. "Color Management -- Filmic AgX." https://developer.blender.org/docs/release_notes/4.0/color_management/
17. Blender Python API Documentation. "API Overview." https://docs.blender.org/api/current/info_overview.html
18. Khronos Group. "glTF -- Runtime 3D Asset Delivery." https://www.khronos.org/gltf/
19. VRChat Creation. "Creating Your First Avatar." https://creators.vrchat.com/avatars/creating-your-first-avatar/
20. VRChat Creation. "PhysBones." https://creators.vrchat.com/common-components/physbones/
21. Blender Studio. "Benchmarking Version Control Solutions." https://studio.blender.org/blog/benchmarking-version-control-git-lfs-svn-mercurial/
22. Wikipedia. "Blender (software)." https://en.wikipedia.org/wiki/Blender_(software)
23. Blender.org. "Blender Foundation." https://www.blender.org/about/foundation/
24. CGWire. "Kitsu." https://www.cg-wire.com/kitsu/
25. Blender Manual. "Add-on Tutorial." https://docs.blender.org/manual/en/latest/advanced/scripting/addon_tutorial.html
