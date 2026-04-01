# Modeling, Sculpting & Geometry Nodes

Module: **BLN-02** | Series: Blender User Manual | Status: Reference Document

> **Blender User Manual -- Document 02**
>
> Comprehensive coverage of mesh modeling in Edit Mode, the complete modifier stack, UV unwrapping, Sculpt Mode with all brush types and workflows, Geometry Nodes architecture and key nodes, curves, surfaces, and text objects. This document covers the core content-creation tools that transform Blender from a scene assembler into a production modeling environment.

---

## Table of Contents

- [Part 1: Edit Mode Fundamentals](#part-1-edit-mode-fundamentals)
  - [1.1 Entering Edit Mode](#11-entering-edit-mode)
  - [1.2 Selection Methods](#12-selection-methods)
  - [1.3 Selection Mode Interaction](#13-selection-mode-interaction)
- [Part 2: Mesh Operations](#part-2-mesh-operations)
  - [2.1 Extrude (E)](#21-extrude-e)
  - [2.2 Loop Cut (Ctrl+R)](#22-loop-cut-ctrlr)
  - [2.3 Bevel (Ctrl+B)](#23-bevel-ctrlb)
  - [2.4 Inset Faces (I)](#24-inset-faces-i)
  - [2.5 Knife Tool (K)](#25-knife-tool-k)
  - [2.6 Merge (M)](#26-merge-m)
  - [2.7 Subdivide](#27-subdivide)
  - [2.8 Bridge Edge Loops](#28-bridge-edge-loops)
  - [2.9 Fill and Grid Fill](#29-fill-and-grid-fill)
  - [2.10 Dissolve](#210-dissolve)
  - [2.11 Spin and Screw](#211-spin-and-screw)
  - [2.12 Additional Mesh Operations](#212-additional-mesh-operations)
- [Part 3: Proportional Editing](#part-3-proportional-editing)
- [Part 4: The Modifier Stack](#part-4-the-modifier-stack)
  - [4.1 Modifier Fundamentals](#41-modifier-fundamentals)
  - [4.2 Generate Modifiers](#42-generate-modifiers)
  - [4.3 Deform Modifiers](#43-deform-modifiers)
  - [4.4 Modify Modifiers](#44-modify-modifiers)
  - [4.5 Physics Modifiers](#45-physics-modifiers)
  - [4.6 Modifier Stack Order and Best Practices](#46-modifier-stack-order-and-best-practices)
- [Part 5: UV Unwrapping](#part-5-uv-unwrapping)
  - [5.1 UV Mapping Concepts](#51-uv-mapping-concepts)
  - [5.2 Seam Marking](#52-seam-marking)
  - [5.3 Unwrapping Methods](#53-unwrapping-methods)
  - [5.4 UV Editor Tools](#54-uv-editor-tools)
- [Part 6: Sculpt Mode](#part-6-sculpt-mode)
  - [6.1 Sculpt Mode Fundamentals](#61-sculpt-mode-fundamentals)
  - [6.2 Draw Brushes](#62-draw-brushes)
  - [6.3 Flatten and Contrast Brushes](#63-flatten-and-contrast-brushes)
  - [6.4 Move Brushes](#64-move-brushes)
  - [6.5 Specialized Sculpt Brushes](#65-specialized-sculpt-brushes)
  - [6.6 Masking and Face Sets](#66-masking-and-face-sets)
  - [6.7 Dyntopo, Multires, and Remesh](#67-dyntopo-multires-and-remesh)
  - [6.8 Mesh Filters](#68-mesh-filters)
  - [6.9 Sculpt Mode Shortcuts](#69-sculpt-mode-shortcuts)
- [Part 7: Geometry Nodes](#part-7-geometry-nodes)
  - [7.1 Architecture and Concepts](#71-architecture-and-concepts)
  - [7.2 Socket Types and Visual Language](#72-socket-types-and-visual-language)
  - [7.3 Fields and Attributes](#73-fields-and-attributes)
  - [7.4 Key Node Categories](#74-key-node-categories)
  - [7.5 Essential Node Reference](#75-essential-node-reference)
  - [7.6 Common Use Cases](#76-common-use-cases)
  - [7.7 Blender 4.4 Geometry Nodes Changes](#77-blender-44-geometry-nodes-changes)
- [Part 8: Curves, Surfaces, and Text](#part-8-curves-surfaces-and-text)
  - [8.1 Curve Objects](#81-curve-objects)
  - [8.2 Surface Objects](#82-surface-objects)
  - [8.3 Text Objects](#83-text-objects)
- [Part 9: Practical Tips and Common Pitfalls](#part-9-practical-tips-and-common-pitfalls)
- [Sources](#sources)

---

## Part 1: Edit Mode Fundamentals

### 1.1 Entering Edit Mode

Edit Mode is where direct mesh manipulation happens. To enter Edit Mode, select a mesh object and press Tab (or Ctrl+Tab to open the mode pie menu). Edit Mode reveals the underlying geometry -- vertices, edges, and faces -- and provides tools to modify them.

Only one object can be in Edit Mode at a time in normal workflow. However, Blender supports multi-object editing: select multiple mesh objects in Object Mode, then press Tab to enter Edit Mode for all of them simultaneously. Each object's geometry remains separate, but you can select and operate on vertices across all objects in the same session [1].

The header bar in Edit Mode shows the selection mode buttons and provides access to the Mesh, Vertex, Edge, and Face menus. The Tool Shelf on the left provides quick access to frequently used tools.

### 1.2 Selection Methods

Blender provides three primary selection modes in Edit Mode, switchable via the header buttons or keyboard shortcuts:

| Mode | Shortcut | Selects |
|------|----------|---------|
| Vertex | 1 | Individual vertices (points) |
| Edge | 2 | Edges (connections between two vertices) |
| Face | 3 | Faces (polygons bounded by edges) |

Multiple modes can be active simultaneously by holding Shift while clicking mode buttons. This allows selecting vertices, edges, and faces in a mixed selection.

**Basic Selection:**
- Left Click: Select single element
- Shift + Left Click: Add/remove from selection
- A: Select All
- Alt + A: Deselect All
- Ctrl + I: Invert Selection

**Region Selection:**
- B: Box Select -- draw a rectangular selection region
- C: Circle Select -- paint-style selection with adjustable radius (scroll wheel to resize, right-click or Escape to exit)
- Ctrl + Left Click: Lasso Select -- freeform selection boundary

**Topological Selection:**
- L (hover): Select Linked -- selects all geometry connected to the element under the cursor, without crossing seams or material boundaries
- Ctrl + L: Select Linked All -- selects all geometry connected to the current selection
- Alt + Left Click on edge: Select Edge Loop -- selects a continuous loop of edges following the flow of the topology
- Ctrl + Alt + Left Click on edge: Select Edge Ring -- selects parallel edges that form a ring perpendicular to the edge flow
- Ctrl + Numpad +: Grow Selection -- expands selection by one ring of elements
- Ctrl + Numpad -: Shrink Selection -- contracts selection by one ring

**Advanced Selection:**
- Select > Checker Deselect: Deselects every other element in the current selection, creating a checkered pattern. Useful for creating alternating selection patterns for operations like Poke Faces or Tris to Quads.
- Select > Select All by Trait: Provides sub-options to select by number of vertices, face sides, perimeter, area, and in Blender 4.4, by pole count (vertices connected to more or fewer than 4 edges) [3].
- Select > Select Similar: Selects elements similar to the current selection based on properties like normal direction, face area, edge length, or vertex group weight.
- Select > Select Loops > Select Loop Inner Region: Fills the region inside a selected edge loop.
- Select > Select Sharp Edges: Selects edges where the angle between adjacent faces exceeds a threshold.

### 1.3 Selection Mode Interaction

When switching between selection modes, Blender preserves and converts selections intelligently:

- **Vertex to Edge**: Edges where both vertices are selected become selected.
- **Vertex to Face**: Faces where all vertices are selected become selected.
- **Edge to Vertex**: All vertices of selected edges become selected.
- **Face to Edge**: All edges of selected faces become selected.
- **Face to Vertex**: All vertices of selected faces become selected.

This conversion behavior means that selecting two adjacent faces and switching to Edge mode will show the shared edge as selected -- useful for operations that require edge selections derived from face selections.

---

## Part 2: Mesh Operations

### 2.1 Extrude (E)

Extrusion is the most fundamental mesh-building operation. It duplicates selected geometry and immediately moves it, connected to the original by new faces.

**Extrude Region (E)**: The default extrude operation. Select faces (or edges, or vertices) and press E. New geometry is created and constrained to move along the average normal of the selection. Move the mouse to adjust distance, then Left Click or Enter to confirm. Right Click or Escape to cancel (the duplicated geometry remains at zero offset and should be deleted or undone).

**Extrude Along Normals (Alt + E > Extrude Faces Along Normals)**: Extrudes each face along its individual normal rather than the average normal. This produces more uniform results on curved surfaces where faces point in different directions.

**Extrude Individual (Alt + E > Extrude Individual Faces)**: Extrudes each selected face independently, each along its own normal. Creates separated extruded blocks -- useful for creating city-block-style geometry or panel effects.

**Extrude to Cursor (Ctrl + Right Click in Vertex mode)**: Creates a new vertex at the cursor position, connected to the selected vertex by a new edge.

| Extrude Variant | Shortcut | Behavior |
|----------------|----------|----------|
| Extrude Region | E | Average normal, connected |
| Extrude Along Normals | Alt + E > Along Normals | Per-face normal, connected |
| Extrude Individual | Alt + E > Individual | Per-face, disconnected |
| Extrude to Cursor | Ctrl + RMB | New vertex at cursor |

**Common Pitfall**: If you press E and then immediately cancel with Right Click, the extruded geometry still exists at zero offset -- it sits directly on top of the original faces, creating double geometry. This is invisible but causes rendering artifacts, shading errors, and export problems. Always Undo (Ctrl+Z) after a cancelled extrude rather than relying on Right Click to cancel cleanly.

### 2.2 Loop Cut (Ctrl+R)

Loop Cut inserts a new edge loop that follows the existing topology flow of the mesh. It is one of the most-used operations for adding resolution to specific areas of a mesh.

1. Press Ctrl+R.
2. Move the mouse over the mesh. A yellow preview line shows where the loop will be placed.
3. Scroll the mouse wheel to add multiple parallel cuts (Ctrl+R followed by a number key also works).
4. Left Click to confirm placement. The loop enters Slide mode, allowing you to position it between existing loops.
5. Left Click again to confirm the final position, or Right Click to center the loop evenly.

**Key Properties** (F9 / Adjust Last Operation):
- Number of Cuts: How many parallel loops to insert
- Smoothness: How much the new loop follows the surface curvature
- Falloff: Curve shape for multi-cut spacing (Smooth, Sphere, Root, Sharp, Linear, Inverse Square)
- Factor: Precise positioning between -1.0 and 1.0
- Even: Distribute cuts evenly
- Flipped: Mirror the distribution direction

Loop cuts respect the topology flow and cannot cross poles (vertices with more or fewer than 4 connecting edges). If a loop cut preview does not appear where expected, the topology likely contains poles or triangles that interrupt the loop [1].

### 2.3 Bevel (Ctrl+B)

Bevel replaces a sharp edge or vertex with a chamfered (angled) or rounded profile. It is essential for creating realistic hard-surface models, as real-world objects almost never have perfectly sharp 90-degree edges.

**Edge Bevel (Ctrl+B)**: Select edges, press Ctrl+B, and move the mouse to adjust the bevel width. Scroll the mouse wheel to add segments (more segments produce a smoother round).

**Vertex Bevel (Ctrl+Shift+B)**: Select vertices, press Ctrl+Shift+B. Creates a faceted cut around each vertex.

**Key Properties** (F9):
- Width: Size of the bevel
- Segments: Number of subdivisions (1 = simple chamfer, higher = rounder)
- Profile: Shape of the bevel curve (0.5 = circular arc, <0.5 = concave, >0.5 = convex)
- Miter Type: How the bevel handles corners (Sharp, Patch, Arc)
- Clamp Overlap: Prevents bevels from overlapping on adjacent edges
- Harden Normals: Adjusts custom normals to maintain a hard-surface appearance even with high segment counts
- Mark Seam / Mark Sharp: Automatically marks UV seams or sharp edges along the bevel boundary

Bevel with Harden Normals enabled is a key technique for game-ready hard-surface modeling: it creates the appearance of rounded edges while using minimal geometry [1].

### 2.4 Inset Faces (I)

Inset creates a smaller duplicate of selected faces inset within their boundaries, connected by new faces around the perimeter. This is commonly used to create windows, panels, or areas for subsequent extrusion.

1. Select faces.
2. Press I.
3. Move the mouse to adjust inset depth.
4. Left Click to confirm.

**Key Modifiers During Operation**:
- O (during inset): Toggle Outset mode (extrude outward instead of inset)
- I (press again during operation): Toggle Individual mode (each face insets independently)
- Ctrl (during inset): Toggle depth (push the inset faces in or out simultaneously)

**Key Properties** (F9):
- Thickness: Width of the inset border
- Depth: Perpendicular offset of the inset faces
- Individual: Inset each face separately
- Outset: Inset outward instead of inward
- Boundary: Whether to inset boundary edges (edges adjacent to non-selected faces)
- Even Offset: Maintain uniform inset width regardless of face angle
- Edge Rail: Inset follows edge slide behavior
- Interpolate: Interpolate data on new faces (UVs, vertex colors)

### 2.5 Knife Tool (K)

The Knife tool cuts new edges into existing geometry along a freehand path. Unlike Loop Cut, which follows topology flow, the Knife tool allows arbitrary cuts.

1. Press K to activate.
2. Click to place cut points. Each click creates a new vertex where the knife intersects the mesh surface.
3. Press Enter or Spacebar to confirm. Press Escape or Right Click to cancel.

**Key Modifiers During Operation**:
- C: Constrain cut to 45-degree angles
- Z: Cut Through -- the knife cuts through all visible geometry, not just the front-facing surface
- E: Start a new cut line without confirming the previous one
- Shift: Snap to midpoints of edges

**Knife Project** (Edit Mode > Mesh > Knife Project): Projects the outline of another object onto the selected mesh, cutting edges where the projection intersects the surface. Useful for cutting shapes like logos or window frames onto curved surfaces. The cutting object must be selected first (the mesh to be cut is the active object).

### 2.6 Merge (M)

Merge collapses selected vertices into a single vertex. Press M to open the merge menu:

| Option | Behavior |
|--------|----------|
| At Center | Merges to the average position of all selected vertices |
| At Cursor | Merges to the 3D Cursor position |
| Collapse | Merges each connected group of selected vertices to their respective centers |
| At First | Merges to the position of the first selected vertex |
| At Last | Merges to the position of the last selected vertex (the active vertex) |
| By Distance | Merges vertices that are within a specified distance threshold (the "Remove Doubles" operation) |

**Merge by Distance** (M > By Distance) is particularly important for cleaning up meshes. It removes overlapping vertices caused by cancelled extrusions, imported geometry with coincident vertices, or Boolean operations that leave near-identical vertex positions. The default threshold of 0.0001 is usually appropriate; increase it cautiously for meshes with larger tolerance needs [1].

### 2.7 Subdivide

Subdivide splits selected faces into smaller faces by adding vertices at edge midpoints and face centers.

- Right-click (context menu) > Subdivide in Edit Mode
- Or Mesh > Face > Subdivide

**Key Properties** (F9):
- Number of Cuts: How many times to subdivide (1 = each quad becomes 4 quads)
- Smoothness: Interpolation smoothing applied to new vertex positions (0 = flat, 1 = smooth)
- Fractal: Random offset applied to new vertices (creates rough, rocky surfaces)
- Along Normal: Fractal offset constrained to face normals

Subdivide is a simple operation -- for controlled subdivision with smoothing, the Subdivision Surface modifier is preferred because it is non-destructive and adjustable [1].

### 2.8 Bridge Edge Loops

Bridge Edge Loops connects two edge loops with new faces, creating a surface between them. This is one of the most powerful topology-building tools.

1. Select two edge loops (they must have the same number of vertices, or Blender will attempt interpolation).
2. Edge menu (Ctrl+E) > Bridge Edge Loops.

**Key Properties** (F9):
- Type: Open Loop (tube) or Closed Loop (capped)
- Number of Cuts: Additional loops between the bridged ends
- Interpolation: Linear or Blend Surface smoothing
- Smoothness: Curvature of intermediate loops
- Profile Factor and Profile Shape: Control the cross-section shape of the bridge

Bridge Edge Loops is commonly used for:
- Connecting separate mesh islands (e.g., two halves of a character model)
- Creating tubes and tunnels between openings
- Building topology bridges between complex shapes
- Joining limbs to body meshes [1]

### 2.9 Fill and Grid Fill

**Fill (F)**: Creates a face from selected vertices or edges that form a closed boundary. Simple fill creates a single n-gon face. Alt+F performs a "Beauty Fill" that triangulates the region, attempting to create uniform triangles.

**Grid Fill**: Fills a closed edge loop with a grid of quads. This produces clean topology ideal for subdivision surface modeling. The selected boundary must have an even number of vertices. Grid Fill is accessed from the Face menu (Ctrl+F > Grid Fill).

**Key Properties** (F9):
- Span: Number of rows of faces in one direction
- Offset: Rotates the grid orientation around the boundary

Grid Fill is particularly valuable for closing the tops of cylinders, filling holes in quad-based meshes, and creating clean pole-free patches in organic models [1].

### 2.10 Dissolve

Dissolve removes geometry while preserving the overall surface shape, unlike Delete which removes geometry and leaves holes.

| Operation | Shortcut | Behavior |
|-----------|----------|----------|
| Dissolve Vertices | Ctrl+X (vertices selected) | Removes vertices, merging connected edges |
| Dissolve Edges | Ctrl+X (edges selected) | Removes edges, merging connected faces into larger faces |
| Dissolve Faces | Ctrl+X (faces selected) | Removes internal edges between selected faces, creating a single face |
| Limited Dissolve | Mesh > Clean Up > Limited Dissolve | Removes edges and vertices below an angle threshold, simplifying flat regions |

Limited Dissolve is especially useful for cleaning up imported CAD geometry or high-poly meshes, reducing polygon count in flat areas while preserving curvature [1].

### 2.11 Spin and Screw

**Spin** (Mesh > Spin) rotates a profile around an axis to create rotational geometry -- like turning a shape on a lathe. Select the profile edges, set the axis direction via the 3D Cursor position and orientation, and execute Spin.

**Key Properties** (F9):
- Steps: Number of segments in the revolution
- Angle: Total angle of revolution (360 for a full circle)
- Auto Merge: Merge the first and last vertices if they overlap (for a closed revolution)
- Axis: X, Y, or Z orientation for the spin axis

**Screw** (Mesh > Screw) is similar to Spin but adds a linear offset along the spin axis with each revolution, creating helical geometry like screws, springs, and spiral staircases.

### 2.12 Additional Mesh Operations

| Operation | Access | Description |
|-----------|--------|-------------|
| Split | Y | Separates selected faces from surrounding geometry while keeping them in the same object |
| Rip | V | Tears vertices apart, creating a seam in the mesh |
| Rip Fill | Alt+V | Rips and fills the hole left behind |
| Edge Slide | G, G (with edge selected) | Slides edges along their connected face loops |
| Vertex Slide | G, G (with vertex selected) | Slides a vertex along its connected edges |
| Smooth Vertices | Mesh > Clean Up > Smooth Vertices | Relaxes vertex positions toward their neighbors |
| Poke Faces | Face menu > Poke Faces | Splits each selected face into triangles meeting at the face center |
| Triangulate | Ctrl+T | Converts all selected faces to triangles |
| Tris to Quads | Alt+J | Converts triangle pairs back to quads (improved in 4.4 to favor quad topology) [3] |
| Flip Normals | Mesh > Normals > Flip | Reverses face normal direction |
| Recalculate Outside | Shift+N | Unifies face normals to point outward |
| Mark Sharp | Ctrl+E > Mark Sharp | Marks edges as sharp for auto-smooth |
| Edge Crease | Shift+E | Sets crease weight for Subdivision Surface (0 = smooth, 1 = sharp) |
| Offset Edge Slide | Ctrl+Shift+R | Slides an edge loop while maintaining equidistant spacing from adjacent loops |

---

## Part 3: Proportional Editing

Proportional Editing (O to toggle) creates a soft-selection falloff around the selected elements, causing nearby unselected geometry to be affected by transformations to a decreasing degree. This is essential for organic modeling, terrain shaping, and any situation where abrupt transitions are undesirable.

When Proportional Editing is active, a gray circle appears during transformations (G, R, S) showing the falloff radius. Scroll the mouse wheel during the transformation to adjust the radius.

**Falloff Types** (Shift+O to cycle, or select from the header dropdown):

| Falloff | Shape | Best For |
|---------|-------|----------|
| Smooth | Gaussian-like bell curve | General organic deformation |
| Sphere | Circular cross-section | Even, dome-like deformations |
| Root | Steep near center, flat at edges | Sharp deformations with gentle fade |
| Inverse Square | Very steep near center | Concentrated effect with wide fade |
| Sharp | Steep with linear decay | Quick falloff, more localized |
| Linear | Straight diagonal | Even, predictable falloff |
| Constant | Flat (all affected equally) | Uniform effect within radius |
| Random | Noisy random | Organic surface roughening |

**Proportional Editing Modes**:
- **Disable** (default): No proportional effect
- **Enable**: Affects all vertices within the falloff radius, including those on other objects (in multi-object editing) and those occluded behind the mesh
- **Connected Only**: Only affects vertices connected to the selection through edges. This prevents deformations from "leaking" to nearby but topologically separate geometry -- critical for character faces where eyelids, lips, and ears are close in 3D space but topologically distinct
- **Projected (2D)**: Uses the screen-space distance for falloff calculation rather than 3D distance

---

## Part 4: The Modifier Stack

### 4.1 Modifier Fundamentals

Modifiers are non-destructive operations that automatically process an object's geometry without permanently changing the underlying mesh data. They are stacked in the Modifier Properties panel (blue wrench icon) and evaluated top-to-bottom. The order of modifiers matters: a Subdivision Surface applied before a Boolean produces different results than the same modifier applied after.

Key modifier stack controls:
- **Viewport / Render toggles**: Control whether a modifier is active in the viewport, in renders, in Edit Mode, and in Edit Mode cage display.
- **Reorder**: Drag modifiers up or down to change evaluation order.
- **Apply** (Ctrl+A on the modifier): Permanently bakes the modifier's effect into the mesh data, removing the modifier from the stack. This is irreversible (undo excluded).
- **Duplicate**: Creates a copy of the modifier in the stack.
- **Move to First / Move to Last**: Quickly repositions a modifier.

Blender organizes modifiers into four categories: Generate, Deform, Modify, and Physics [1, 5].

### 4.2 Generate Modifiers

Generate modifiers create new geometry or fundamentally alter the topology:

**Subdivision Surface**
The most commonly used modifier. Subdivides each face and smooths the result using Catmull-Clark or Simple subdivision algorithms. Controls:
- Levels Viewport / Render: Number of subdivision iterations (each level quadruples face count)
- UV Smooth: How UVs are interpolated (None, Keep Corners, All)
- Boundary Smooth: How mesh boundaries are smoothed (All, Keep Corners)
- Quality: Number of OpenSubdiv evaluations
- Optimal Display: Only shows new edges in wireframe overlay
- Use Creases: Respects edge crease weights for local sharpness
- Limit Surface: New in 4.4 -- evaluates the mathematical limit of infinite subdivision [3]

**Mirror**
Mirrors geometry across one or more axes (X, Y, Z), creating symmetric models while only editing one half. Options include:
- Axis (X, Y, Z, or combinations)
- Bisect: Cuts geometry at the mirror plane
- Flip: Reverses which side is source and which is mirror
- Mirror Object: Use another object's origin as the mirror center
- Clipping: Prevents vertices from crossing the mirror plane (essential for seamless center-line modeling)
- Merge: Automatically merges vertices within a threshold of the mirror plane
- Mirror U / Mirror V: Flips UV coordinates for the mirrored half

**Array**
Creates linear, radial, or path-based arrays of the object's geometry:
- Constant Offset: Fixed distance between copies
- Relative Offset: Distance as a multiple of the object's bounding box
- Object Offset: Each copy is offset by the transform of a reference object (rotation produces radial arrays)
- Fit Type: Fixed Count, Fit Length, or Fit Curve
- Merge: Fuse overlapping vertices between copies
- Caps: Attach a different object as the first and/or last element

**Boolean**
Combines the mesh with a target object using set operations:
- Intersect: Keeps only the volume shared by both meshes
- Union: Combines both volumes into one
- Difference: Subtracts the target volume from the modified mesh
- Solver: Fast (faster, less robust) or Exact (slower, handles complex intersections)
- Self Intersection: Handle self-overlapping geometry

**Solidify**
Adds thickness to surfaces by duplicating and offsetting geometry:
- Thickness: Wall thickness
- Offset: Direction of offset (-1 = inward, 0 = centered, 1 = outward)
- Even Thickness: Compensates for angle-based thickness variation
- Fill Rim: Creates faces along open edges to close the shell
- Material Offset: Assign a different material to inner/outer/rim faces

**Build**
Animates the appearance of geometry face by face, creating a construction animation effect.

**Decimate**
Reduces polygon count while preserving shape:
- Collapse: Edge collapse reduction (ratio-based)
- Un-Subdivide: Reverses subdivision operations
- Planar: Dissolves faces that are nearly coplanar

**Edge Split**
Splits edges by angle or mark for sharp shading transitions. Largely superseded by Auto Smooth and custom normals in modern Blender.

**Geometry Nodes**
Attaches a Geometry Nodes node tree as a modifier. This is the bridge between the modifier stack and the node-based procedural system (see Part 7).

**Mask**
Hides geometry based on vertex group membership or armature bone selection.

**Multiresolution**
Similar to Subdivision Surface but stores displacement data at each subdivision level, enabling sculpting at multiple resolutions. Supports:
- Sculpt level independent from preview and render levels
- Reshape and Apply Base operations
- External displacement file saving

**Remesh**
Regenerates the mesh with uniform topology:
- Voxel: Creates a voxel grid representation and extracts an isosurface (best for organic sculpts)
- Blocks / Smooth / Sharp: Different quad-remeshing strategies
- Voxel Size: Controls resolution (smaller = more detail, more polygons)

**Screw**
Creates rotational geometry from a profile, equivalent to the Edit Mode Screw operation but non-destructive.

**Skin**
Generates a mesh skin around a wireframe skeleton of vertices and edges. Useful for quick character blockouts and organic branching structures.

**Weld**
Merges vertices within a specified distance. Non-destructive equivalent of Merge by Distance.

**Wireframe**
Creates a wireframe mesh from the object's edges, replacing each edge with a tube.

### 4.3 Deform Modifiers

Deform modifiers change the shape of geometry without altering topology:

**Armature**
Deforms the mesh based on bone transforms in an armature. The primary modifier for character animation rigging. Vertex Groups or Bone Envelopes determine which vertices each bone affects.

**Cast**
Projects vertices toward a geometric target shape (Sphere, Cylinder, Cuboid).

**Curve**
Deforms the mesh along a curve object. The mesh follows the curve path, stretching and bending accordingly. Used for roads along terrain, cables, and other path-following shapes.

**Displace**
Offsets vertices along their normals based on a texture or image:
- Texture: Procedural or image texture driving displacement
- Strength: Amplitude of displacement
- Direction: Normal, X, Y, Z, or custom
- Midlevel: Texture value that produces zero displacement (0.5 for a 0-1 range)
- Texture Coordinates: Object, Global, UV, or Generated

**Hook**
Binds selected vertices to an external object (typically an Empty). Moving the hook object deforms the hooked vertices. Useful for facial animation controls and mechanical linkages.

**Laplacian Deform**
Deforms a mesh based on anchor point movements while preserving surface detail and curvature characteristics.

**Lattice**
Deforms the mesh based on a Lattice object's control points. The mesh is enclosed in the lattice grid, and moving lattice points smoothly deforms the mesh. Good for broad shape adjustments.

**Mesh Deform**
Similar to Lattice but uses an arbitrary mesh as the deformation cage. More flexible but slower to bind.

**Shrinkwrap**
Projects vertices onto the surface of a target object:
- Nearest Surface Point: Moves vertices to the closest point on the target
- Project: Projects along a specified axis
- Nearest Vertex: Snaps to the nearest target vertex
- Target Normal Project: Projects along the target's normals

**Simple Deform**
Applies basic geometric deformations:
- Twist: Rotates geometry around an axis
- Bend: Bends geometry around an axis
- Taper: Scales geometry along an axis with falloff
- Stretch: Stretches or compresses along an axis

**Smooth**
Smooths vertex positions by averaging with neighbors. Vertex Group support allows selective smoothing.

**Corrective Smooth**
Preserves surface detail during deformation. Applied after an Armature modifier, it reduces the volume loss and pinching that occurs at joint bends.

**Laplacian Smooth**
More geometrically-aware smoothing that preserves volume and curvature better than simple smoothing.

**Surface Deform**
Binds the mesh to a target surface. When the target surface deforms, the bound mesh follows. Useful for clothing, accessories, and facial detail meshes that need to follow a body mesh.

**Warp**
Warps geometry based on the transform difference between two objects (From and To). Moving the "To" object deforms the mesh relative to where "From" is.

**Wave**
Applies an animated wave deformation. Controls for speed, height, width, and damping produce ripple effects.

### 4.4 Modify Modifiers

Modify modifiers alter object data (normals, vertex groups, UVs) without changing geometry:

**Data Transfer**
Transfers data from a source object: vertex groups, custom normals, UV maps, vertex colors. Critical for transferring high-poly bake data to low-poly game meshes.

**Mesh Cache**
Loads external mesh animation data (MDD or PC2 format) to drive vertex positions per frame.

**Mesh Sequence Cache**
Loads Alembic (.abc) or USD cached geometry sequences.

**Normal Edit**
Overrides mesh normals based on a target object's direction. Used for custom shading effects like making flat surfaces appear round.

**UV Project**
Projects UV coordinates from one or more projector objects (similar to a real projector onto a surface).

**UV Warp**
Warps UV coordinates based on two objects' relative transforms. Used for animated texture scrolling and projection effects.

**Vertex Weight Edit / Mix / Proximity**
Three modifiers for procedurally modifying vertex group weights based on curves, mixing operations, or distance to target objects.

**Weighted Normal**
Recalculates custom normals based on face area, angle, or both. Produces better shading on hard-surface models than standard auto-smooth, particularly for surfaces with mixed large and small faces.

### 4.5 Physics Modifiers

Physics modifiers are typically added through the Physics Properties panel rather than the Modifier panel directly. They appear in the modifier stack for ordering purposes:

- **Cloth**: Fabric simulation (structural stiffness, bending, air resistance, collision, self-collision)
- **Collision**: Makes the object act as a collision boundary for cloth, soft body, and particle simulations
- **Dynamic Paint**: Vertex color or displacement driven by contact with brush objects
- **Explode**: Shatters the mesh into pieces based on a particle system
- **Fluid**: Mantaflow-based liquid and gas simulation (Domain, Flow, Effector types)
- **Ocean**: Generates animated ocean surface meshes using FFT-based wave simulation
- **Particle Instance**: Creates geometry instances at particle locations
- **Particle System**: Hair and emitter particle systems with physics, rendering, and children settings
- **Soft Body**: Elastic body simulation (mass, spring stiffness, damping, goal)

### 4.6 Modifier Stack Order and Best Practices

The order of modifiers in the stack determines the final result. General guidelines:

1. **Generate modifiers first** (Mirror, Array): These define the fundamental shape and repetition before other operations process the geometry.
2. **Topology-altering modifiers next** (Boolean, Remesh): These change the mesh structure and should operate on the fully-generated base.
3. **Subdivision Surface** (if used): Position before deform modifiers so deformations work on the smooth surface. Position after Booleans so the Boolean cut edges are smoothed.
4. **Deform modifiers after generation** (Armature, Shrinkwrap, Lattice): These bend and reshape the already-generated geometry.
5. **Modify modifiers** (Weighted Normal, Data Transfer): Apply normal corrections and data transfers last, as they depend on the final geometry state.
6. **Physics modifiers** typically go at the bottom of the stack.

**Common mistake**: Placing a Mirror modifier after a Subdivision Surface. The mirror seam will not merge properly because the subdivided vertices no longer align with the mirror plane. Always place Mirror before Subdivision Surface.

---

## Part 5: UV Unwrapping

### 5.1 UV Mapping Concepts

UV mapping assigns 2D texture coordinates (U and V axes) to every vertex of a 3D mesh. These coordinates determine how a 2D image texture wraps around the 3D surface. The UV Editor displays the 2D layout of the mesh's texture coordinates over the image texture.

Every face of a mesh maps to a corresponding region in UV space. UV space is normalized from 0.0 to 1.0 in both U and V axes. Coordinates can extend beyond this range (tiling), but the 0-1 range represents one full copy of the texture.

UV mapping is essential for:
- Applying image textures (photographs, painted textures, baked maps)
- Texture painting (painting directly onto the 3D surface)
- Baking (transferring lighting, normal, or ambient occlusion data to textures)
- Game engine integration (all real-time rendering requires explicit UVs)

### 5.2 Seam Marking

UV seams define where the mesh surface is "cut" to unfold into 2D. Marking seams is the most important step in UV unwrapping -- good seam placement produces low-distortion UVs with minimal stretching.

**Marking Seams**:
1. Enter Edit Mode, switch to Edge selection mode (2).
2. Select edges where you want seams.
3. UV menu (U) > Mark Seam, or Edge menu (Ctrl+E) > Mark Seam.
4. Seams appear as red lines on the mesh.

**Clearing Seams**: Select seam edges, then U > Clear Seam or Ctrl+E > Clear Seam.

**Seam Placement Guidelines**:
- Place seams along edges that will be hidden (backs of characters, undersides of objects, edges with material boundaries)
- Place seams at sharp edges where texture stretching would be most visible
- Minimize the number of UV islands -- each seam creates a separate island that must be packed
- Ensure each UV island is a reasonable shape that can flatten without excessive distortion
- For organic models (characters), place seams along the center back, around ears, along inner limbs, and at the scalp hairline
- For hard-surface models, place seams along sharp edges where the material changes direction [10]

### 5.3 Unwrapping Methods

Access unwrapping methods via U (UV Mapping menu) in Edit Mode:

**Unwrap (U > Unwrap)**: The primary unwrapping method. Uses the marked seams to cut the mesh and unfolds each island to minimize distortion. This produces the best results for most meshes when seams are properly marked. Method options include Angle Based (ABF) for most cases and Conformal for preserving angles.

**Smart UV Project (U > Smart UV Project)**: Automatically cuts the mesh based on face angle thresholds, without requiring manual seam placement:
- Angle Limit: Faces with angle differences above this threshold are split into separate islands. Higher values create more islands with less distortion; lower values create fewer islands with more distortion.
- Island Margin: Spacing between packed islands.
- Area Weight: Considers face area in the projection.
Best for: mechanical objects, architecture, and geometric forms where manual seam placement is not worth the effort [10].

**Lightmap Pack (U > Lightmap Pack)**: Packs each face (or selected faces) individually into UV space with no regard for connectivity. Maximizes UV space usage. Designed for light map baking in game engines where each face needs unique UV coverage but seam visibility does not matter.

**Cube / Cylinder / Sphere Projection**: Projects UVs from the shape's mathematical surface:
- Cube Projection: Projects from six orthogonal directions. Good for box-shaped objects.
- Cylinder Projection: Wraps UVs around a cylindrical projection. Good for tubes, bottles, tree trunks.
- Sphere Projection: Wraps UVs onto a spherical projection. Good for globes, eyeballs, round objects.

**Project from View (U > Project from View)**: Projects UVs from the current viewport angle. Useful for decals, flat surfaces seen from one angle, and objects that will only be viewed from one direction.

**Follow Active Quads**: Unwraps selected faces by following the active face's UV proportions through the quad topology. Produces perfectly straight, grid-aligned UVs -- ideal for tiled textures on walls, floors, and other geometric surfaces.

### 5.4 UV Editor Tools

The UV Editor provides tools for manipulating the 2D UV layout:

**Transform Tools**: Move (G), Rotate (R), Scale (S) work on UV vertices/edges/faces in the UV Editor, just like in the 3D Viewport.

**UV Menu Operations**:
- **Pack Islands** (UV > Pack Islands): Automatically arranges all UV islands within the 0-1 UV space for optimal coverage. Options for margin, shape method (Concave, Bounding Box), and rotation.
- **Average Islands Scale**: Normalizes all island sizes so that texel density (pixels per unit area) is uniform across the mesh.
- **Minimize Stretch**: Relaxes UV positions to reduce angular distortion.
- **Stitch** (V): Joins UV vertices that were split by seams.
- **Weld** (M): Merges selected UV vertices.
- **Pin** (P): Pins UV vertices in place during relax/unwrap operations. Pinned vertices do not move when re-unwrapping.
- **Live Unwrap**: When enabled, moving pinned UV vertices causes the rest of the UV layout to update in real-time.

**Texture Display**: The UV Editor can display an image texture as a background, with options for tiling, alpha display, and checkerboard patterns for distortion visualization.

**UV Sync Selection**: When enabled (button in the UV Editor header), selecting geometry in the 3D Viewport automatically selects corresponding UVs in the UV Editor and vice versa.

---

## Part 6: Sculpt Mode

### 6.1 Sculpt Mode Fundamentals

Sculpt Mode transforms the 3D Viewport into a digital sculpting environment where geometry is deformed using brush-based tools, similar to working with digital clay. Enter Sculpt Mode via the mode selector in the viewport header or via Ctrl+Tab pie menu.

Sculpt Mode operates directly on mesh vertices. The resolution of your mesh determines the level of detail you can sculpt -- more vertices allow finer detail. Three strategies exist for managing sculpt resolution:

1. **Dyntopo (Dynamic Topology)**: Automatically adds and removes vertices as you sculpt, tessellating areas where detail is needed. Toggle with Ctrl+D or from the header.
2. **Multiresolution Modifier**: Subdivides the entire mesh uniformly, allowing sculpting at different resolution levels. Add via the Modifier Properties panel.
3. **Voxel Remesh**: Rebuilds the entire mesh with uniform voxel-based topology at a specified resolution. Access via Ctrl+R in Sculpt Mode.

The **Brush Asset Shelf** at the bottom of the viewport displays all available brushes. Blender 4.4 ships with the Essentials library containing approximately 130 brush assets. Access the brush shelf popup anytime with Shift+Spacebar. Type a brush name to filter [7].

**Universal Brush Controls**:
- F: Adjust brush radius
- Shift+F: Adjust brush strength
- Ctrl: Invert brush direction (e.g., Draw brush pushes inward instead of outward)
- Shift (hold while sculpting): Smooth brush override (temporarily switch to Smooth regardless of active brush)

### 6.2 Draw Brushes

Draw brushes push vertices inward or outward and form the foundation of sculpting work. They are typically displayed without color coding in the brush shelf [7].

**Draw**
The standard sculpting brush. Pushes vertices outward along the surface normal. With Ctrl held, it carves inward. The most versatile brush for building and refining forms. Adjustable falloff, stroke method (Dots, Drag Dot, Space, Airbrush, Anchored, Line), and texture mask.

**Draw Sharp**
Similar to Draw but with a sharper falloff profile, creating more defined ridges and creases. Ideal for sharp surface details like wrinkles, cuts, and hard-edged features.

**Clay**
Adds volume with a flattening tendency. Unlike Draw, which pushes along the surface normal, Clay builds material up to a flat plane, creating a more uniform buildup. Includes subtle smoothing. Good for building broad forms and polishing volumes.

**Clay Strips**
The same concept as Clay but more aggressive, with a square (strip-like) falloff rather than circular. A standard workhorse brush for building rough volumes quickly. The strip shape allows directional strokes that suggest form planes.

**Clay Thumb**
Deforms the surface as though pressing a thumb into clay. Produces a dragging, smearing effect.

**Layer**
Adds a uniform layer of height. Unlike Draw which accumulates indefinitely, Layer creates a flat-topped plateau at the brush strength height. Subsequent strokes in the same area do not build higher until you release the mouse.

**Inflate**
Pushes vertices along their individual normals, causing the surface to expand or contract uniformly. Unlike Draw which pushes along the stroke normal, Inflate pushes each vertex along its own normal, making it effective for swelling or shrinking forms.

**Blob**
Similar to Inflate but with a more spherical, bulging effect. Creates rounded protrusions.

**Crease**
Pinches geometry together while pushing inward, creating sharp fold lines. Strokes produce parallel ridges along the stroke direction. Essential for clothing folds, skin wrinkles, and sharp creases.

**Multi-plane Scrape**
Scrapes the surface from two angled planes simultaneously, creating clean, defined edges where they meet. Excellent for hard-surface sculpting -- creating panel edges, armor plates, and mechanical forms.

### 6.3 Flatten and Contrast Brushes

These brushes modify the surface height distribution. They are recognizable by their red thumbnail/cursor in the brush shelf [7].

**Smooth**
The most frequently used brush. Averages vertex positions with their neighbors, reducing surface noise and softening forms. Almost always used in conjunction with other brushes via the Shift shortcut (holding Shift temporarily activates Smooth regardless of the active brush).

**Flatten**
Pushes vertices toward a plane defined by the average surface height within the brush radius. High points are pushed down and low points are pushed up. Creates flat surfaces from rough ones.

**Fill**
The upward-only companion to Flatten. Only pushes vertices upward toward the reference plane. Does not affect vertices already above the plane.

**Scrape**
The downward-only companion to Flatten. Only pushes vertices downward toward the reference plane. Does not affect vertices already below the plane.

**Plane** (New in Blender 4.4)
A generalization of Flatten, Fill, and Scrape. Provides controls for the stabilization of the reference plane and the range of influence above and below the brush plane. This single brush can replicate and extend the behavior of all three specialized brushes [3].

### 6.4 Move Brushes

Move brushes translate, pinch, and magnify geometry. They are recognizable by their yellow icon/cursor in the brush shelf [7].

**Grab**
Moves vertices with the mouse, as though grabbing and pulling the surface. An essential brush for building shapes, adjusting proportions, and posing. The area of influence moves with the stroke, creating a continuous deformation.

**Elastic Deform**
Similar to Grab but preserves volume through elastic energy minimization. Vertices resist compression and expansion, producing more natural-looking deformations. Good for posing and large-scale form adjustment where volume preservation is important.

**Snake Hook**
Pulls vertices along with the stroke, creating long, trailing forms. Geometry is rotated and scaled to enable continuous pulling without losing volume. Ideal for tentacles, hair strands, organic tendrils, and pulling geometry into sharp points.

**Thumb**
Similar to Grab but only moves the initial grab area, not dynamically adapting the influence area. Produces a smearing, thumbprint-like effect.

**Pose**
Rotates mesh regions around automatically detected pivot points, simulating limb posing. The algorithm detects the mesh structure and creates a natural-looking rotation as though bending a joint. Controls for segment count and pivot position.

**Nudge**
Pushes vertices in the direction of the brush stroke without lifting them from the surface. Similar to smearing paint -- the surface slides in the stroke direction.

**Rotate**
Rotates the mesh region around the brush center point.

**Slide Relax**
In topological mode, slides vertices along the surface while maintaining the surface shape, redistributing mesh density without changing form.

**Boundary**
Deforms mesh boundary edges (open edges at the perimeter of a mesh). Offers bend, expand, and inflate modes specifically for boundary manipulation.

**Pinch**
Pulls vertices toward the center of the brush radius, narrowing features and sharpening forms. Used for defining edges, narrowing limbs, and creating sharp ridges.

### 6.5 Specialized Sculpt Brushes

**Cloth**
Simulates cloth-like deformation, creating folds, wrinkles, and draping effects directly in Sculpt Mode without running a full cloth simulation. Controls for deformation type (Drag, Push, Pinch Point, Inflate, Grab, Expand), simulation limit, and simulation falloff.

**Simplify**
Reduces or collapses geometry in the sculpted area (only effective in Dyntopo mode). Removes unnecessary vertices in flat areas while preserving detail in complex areas.

**Mask** (M shortcut to quick-toggle)
Paints a masking weight (0 to 1) onto the mesh surface. Masked areas (dark) are protected from sculpting operations. Masking is essential for isolating regions of the mesh.

**Draw Face Sets**
Paints face set assignments onto the mesh. Face sets partition the mesh into named regions for visibility control, smoothing boundaries, and operations that should affect only specific areas.

**Multires Displacement Eraser**
Erases multires displacement data, reverting the surface to its lower-resolution shape in the painted area.

**Multires Displacement Smear**
Smears multires displacement data across the surface, blending high-frequency detail without removing it.

**Paint** (Color Painting)
Paints vertex colors or color attributes directly in Sculpt Mode. Recognizable by blue thumbnails in the brush shelf.

**Smear** (Color)
Smears existing vertex colors across the surface, blending them together.

### 6.6 Masking and Face Sets

**Masking Operations** (accessed via the Mask menu in Sculpt Mode header or via Alt+M):
- Invert Mask (Ctrl+I): Swaps masked and unmasked areas
- Clear Mask (Alt+M): Removes all masking
- Box Mask (B): Draw a box to mask a region
- Lasso Mask (Shift+Ctrl+LMB): Freeform lasso masking
- Mask by Normal: Mask faces based on normal direction
- Mask by Cavity: Mask concavities or convexities
- Grow/Shrink Mask: Expand or contract the masked region
- Sharpen/Smooth Mask: Adjust mask edge sharpness
- Mask Extract: Creates a new mesh from the masked region

**Face Sets** provide a more structured alternative to masking:
- Draw Face Sets brush assigns faces to color-coded groups
- Ctrl+Click on a face hides all other face sets (isolates one set)
- Shift+Click on a hidden face set reveals it
- Alt+H reveals all hidden face sets
- Face sets can be created from masking, loose parts, material slots, or sharp edges
- Face sets control boundary smoothing -- Smooth brush does not cross face set boundaries by default

### 6.7 Dyntopo, Multires, and Remesh

**Dyntopo (Dynamic Topology)** -- Ctrl+D to toggle:
Dynamically subdivides and decimates the mesh as you sculpt. Areas receiving brush strokes gain resolution; areas left alone can be simplified. This allows sculpting without pre-subdividing the entire mesh.
- Detail Type: Relative (brush-relative resolution), Constant (fixed triangle size), Brush (adapts to brush radius), Manual (no automatic tessellation)
- Detail Size: Resolution of generated triangles
- Refine Method: Subdivide Edges, Collapse Edges, or both
- Symmetrize: Mirror the sculpt across an axis

**Dyntopo limitation**: It generates triangulated topology, which is not suitable for subdivision surface workflows. Sculpts created with Dyntopo typically need remeshing before they can be used with the Multiresolution modifier or in production pipelines that require quad-based topology.

**Multiresolution Modifier**:
Adds subdivision levels to the mesh and stores displacement data at each level. Sculpting at a high level adds detail without affecting the low-resolution base mesh. Key operations:
- Subdivide: Add a new resolution level
- Unsubdivide: Remove the lowest level
- Delete Higher: Remove levels above the current sculpt level
- Reshape: Transfer the sculpted shape to the base mesh
- Apply Base: Move the base mesh to match the current sculpt

**Voxel Remesh** -- Ctrl+R in Sculpt Mode:
Rebuilds the entire mesh using a voxel-based algorithm that generates uniform quad-dominant topology. Adjust voxel size with Ctrl+R before confirming. This is essential for cleaning up Boolean operations, merging separate mesh regions, and preparing Dyntopo sculpts for further work.

### 6.8 Mesh Filters

Mesh Filters apply an effect uniformly to the entire visible (unmasked) mesh. They are accessed from the Mesh Filter menu in the header. Hold the mouse button and move up/down to adjust the effect strength:

- **Smooth**: Smooths the entire surface
- **Scale**: Scales vertex positions along their normals
- **Inflate**: Inflates the entire mesh along normals
- **Sphere**: Morphs the mesh toward a spherical shape
- **Random**: Applies random displacement to all vertices
- **Relax**: Relaxes mesh topology without changing the shape
- **Surface Smooth**: Smooth based on Laplacian, preserving volume
- **Relax Face Sets**: Smooths face set boundaries
- **Sharpen**: Enhances detail by amplifying curvature differences
- **Enhance Details**: Sharpens high-frequency detail

### 6.9 Sculpt Mode Shortcuts

| Shortcut | Action |
|----------|--------|
| F | Resize brush radius |
| Shift + F | Adjust brush strength |
| Ctrl | Invert brush (subtract instead of add) |
| Shift | Smooth brush override |
| Ctrl + D | Toggle Dyntopo |
| Ctrl + R | Voxel Remesh |
| M | Mask brush |
| Alt + M | Clear Mask |
| Ctrl + I | Invert Mask |
| B (in mask mode) | Box Mask |
| H | Hide Face Set |
| Shift + H | Isolate Face Set |
| Alt + H | Show All |
| Shift + Space | Brush popup shelf |
| X | Mirror toggle (X axis) |
| Y | Mirror toggle (Y axis) |
| Z | Mirror toggle (Z axis) |

---

## Part 7: Geometry Nodes

### 7.1 Architecture and Concepts

Geometry Nodes is Blender's node-based procedural geometry system, introduced in Blender 2.92 and substantially redesigned in Blender 3.0 with the field-based workflow. It provides a visual programming environment for generating, processing, and transforming geometry without manual modeling [6, 8].

A Geometry Nodes tree is attached to an object via the Geometry Nodes modifier. The node tree receives the object's geometry as input (via the Group Input node) and outputs modified or entirely new geometry (via the Group Output node). The entire process is non-destructive -- the original geometry is never altered.

Geometry Nodes operates on several geometry types:
- **Mesh**: Vertices, edges, faces
- **Curve**: Control points and spline segments
- **Point Cloud**: Unconnected points
- **Volume**: OpenVDB grids
- **Instances**: References to other geometry (lightweight copies)

### 7.2 Socket Types and Visual Language

Nodes communicate through sockets -- input connectors on the left side and output connectors on the right side. Socket colors indicate data types [8]:

| Socket Color | Data Type | Description |
|-------------|-----------|-------------|
| Green | Geometry | Mesh, curve, point cloud, volume, or instances |
| Gray | Float | Single decimal number |
| Purple | Vector | Three-component value (x, y, z) -- used for positions, directions, scales |
| Yellow | Color | RGBA four-component color value |
| Pink/Rose | Boolean | True/False value |
| Teal/Cyan | Integer | Whole number |
| Orange | String | Text data |
| White | Object | Reference to a scene object |
| White | Collection | Reference to a collection |
| Brown | Material | Reference to a material |
| Brown | Image | Reference to an image data-block |

**Connection Rules**: Only compatible socket types can be connected. Blender will automatically insert conversion nodes for some compatible type pairs (e.g., Integer to Float). Incompatible connections are rejected.

**Noodle Styles**: Solid lines indicate direct data flow. Dashed lines indicate field connections -- the data is not a single value but a function that will be evaluated per-element [8].

### 7.3 Fields and Attributes

The field system is the conceptual heart of modern Geometry Nodes. A field is a function that can produce different values for each element (vertex, edge, face, spline point, instance) of a geometry [8].

**Example**: The Position node outputs a field. When connected to a Set Position node, it does not output a single position -- it outputs a function that, when evaluated, returns the position of each individual vertex. The Set Position node evaluates this field for every vertex in the input geometry.

**Attributes** are named data stored on geometry elements:
- **Built-in Attributes**: Position, Normal, Index, ID, Radius (curves), Handle Position (Bezier curves)
- **Custom Attributes**: User-defined data attached to geometry elements via the Store Named Attribute node or Geometry Nodes outputs
- **Attribute Domains**: The element type an attribute is stored on -- Point (vertex), Edge, Face, Face Corner, Spline, or Instance

**The Spreadsheet Editor** displays attribute data in tabular form. It shows the value of every attribute for every element in the geometry, making it essential for debugging Geometry Nodes setups. Access it from the Geometry Nodes workspace or change any editor to Spreadsheet type.

### 7.4 Key Node Categories

Geometry Nodes organizes its nodes into categories accessible from the Add menu (Shift+A) in the Geometry Node Editor:

**Attribute Nodes**:
- Store Named Attribute: Saves a field value as a named attribute on the geometry
- Capture Attribute: Evaluates a field and stores the result, freezing it for downstream use
- Remove Named Attribute: Deletes a named attribute

**Input Nodes**:
- Group Input: Exposes parameters to the modifier panel (user-adjustable values)
- Collection Info: Access objects within a collection
- Object Info: Access transform, geometry, or name of a referenced object
- Value, Integer, Boolean, Vector, Color, String: Constant value inputs
- Index: Returns the element index (0, 1, 2, ...) as a field
- Position: Returns the position of each element as a field
- Normal: Returns the normal direction of each element as a field
- ID: Returns the element ID
- Scene Time: Returns the current frame number and seconds
- Random Value: Generates random numbers per element
- Named Attribute: Reads a named attribute from geometry
- Self Object: Returns a reference to the object the modifier is attached to
- Collection (new in 4.4) [3]
- Object (new in 4.4) [3]

**Geometry Nodes**:
- Join Geometry: Combines multiple geometry inputs into one
- Transform Geometry: Applies translation, rotation, scale
- Set Position: Moves vertices/points based on a field
- Set Material: Assigns a material to geometry
- Bounding Box: Outputs the axis-aligned bounding box
- Convex Hull: Creates the smallest convex mesh enclosing the geometry
- Separate Geometry: Splits geometry based on a boolean field (selection)
- Delete Geometry: Removes elements based on a boolean field
- Duplicate Elements: Duplicates elements a specified number of times
- Geometry to Instance: Converts geometry to a single instance

**Mesh Nodes**:
- Mesh Boolean: Union, Intersect, or Difference between meshes
- Mesh to Curve: Extracts edge loops as curves
- Subdivide Mesh: Subdivides faces
- Subdivision Surface: Catmull-Clark or Simple subdivision
- Triangulate: Converts faces to triangles (30-100x faster in 4.4) [3]
- Dual Mesh: Creates the topological dual (faces become vertices, vertices become faces)
- Extrude Mesh: Extrudes vertices, edges, or faces
- Flip Faces: Reverses face normal direction
- Scale Elements: Scales individual faces, edges, or vertices
- Split Edges: Splits edges based on selection
- Sort Elements: Reorders elements (50% faster in 4.4) [3]

**Curve Nodes**:
- Curve to Mesh: Generates a mesh tube along a curve with a profile shape
- Curve to Points: Samples points along a curve
- Fill Curve: Creates a face from a closed curve
- Fillet Curve: Rounds curve corners
- Resample Curve: Resamples curve points at uniform spacing
- Reverse Curve: Reverses spline direction
- Trim Curve: Cuts a curve to a specified range
- Set Curve Radius: Controls the per-point radius
- Set Handle Type: Changes Bezier handle types

**Point Nodes**:
- Distribute Points on Faces: Randomly or uniformly distributes points on mesh surfaces
- Points to Vertices: Converts point cloud points to mesh vertices
- Set Point Radius: Adjusts point cloud display radius

**Instance Nodes**:
- Instance on Points: Creates instances at point positions
- Realize Instances: Converts instances to real geometry
- Rotate Instances: Rotates each instance
- Scale Instances: Scales each instance
- Translate Instances: Moves each instance

**Volume Nodes**:
- Mesh to Volume: Converts a mesh to an OpenVDB volume
- Volume to Mesh: Extracts an isosurface mesh from a volume

**Material Nodes**:
- Set Material: Assigns material to all geometry
- Set Material Index: Sets per-face material index
- Material Selection: Boolean field for faces with a specific material

**Utilities**:
- Math: Arithmetic operations (Add, Subtract, Multiply, Divide, Power, Sine, Cosine, etc.)
- Vector Math: Vector operations (Add, Cross Product, Dot Product, Normalize, etc.)
- Boolean Math: AND, OR, NOT, NAND, NOR, XOR
- Compare: Greater Than, Less Than, Equal, etc.
- Map Range: Remaps a value from one range to another
- Clamp: Constrains a value between min and max
- Mix: Blends between two values based on a factor
- Switch: Selects between two inputs based on a boolean
- Accumulate Field: Running accumulation of field values
- Repeat Zone: Loops a section of nodes a specified number of times
- Simulation Zone: Maintains state across frames for simulation effects
- Find in String (new in 4.4) [3]

### 7.5 Essential Node Reference

The following node combinations form the foundation of most Geometry Nodes setups:

**Scatter System** (vegetation, rocks, debris):
```
Group Input > Distribute Points on Faces > Instance on Points > Group Output
                                              ^
                                        (Collection Info or Object Info for instances)
```

**Procedural Curve Mesh** (cables, pipes, fences):
```
Group Input > Curve to Mesh > Group Output
                ^
          (Curve Circle or custom profile for cross-section)
```

**Parametric Deformation**:
```
Group Input > Set Position > Group Output
                ^
          (Position + Math/Vector Math = computed offset)
```

**Selection-Based Operations**:
```
Group Input > Separate Geometry > [process each branch] > Join Geometry > Group Output
                 ^
           (Compare/Boolean Math field for selection criteria)
```

### 7.6 Common Use Cases

**Scatter Systems**: Distribute Points on Faces combined with Instance on Points creates vegetation distribution, rock placement, building facades, and any scenario requiring many copies of objects across a surface. Use Attribute Randomize or Random Value nodes to vary scale, rotation, and instance selection. Weight Paint a vertex group on the source mesh to control density.

**Procedural Terrain**: Use Noise Texture, Voronoi Texture, or other procedural textures as fields in a Set Position node to displace a subdivided plane. Combine multiple noise octaves with Math nodes for realistic terrain. Use Separate Geometry based on height to assign different materials to water, grass, rock, and snow regions.

**Parametric Modeling**: Expose dimensions, counts, and profiles as Group Input parameters. Build furniture, architectural elements, or mechanical parts that update instantly when parameters change. The Repeat Zone node (added in Blender 4.0) enables iterative constructions like spiral staircases and gear teeth.

**Animation and Simulation**: The Simulation Zone maintains state between frames, enabling particle-like simulations, growth effects, and accumulating phenomena within Geometry Nodes. Scene Time provides the current frame for time-dependent effects.

**Array and Pattern Generation**: Combine Mesh Line or Curve Resample with Instance on Points for regular arrays. Use Transform and Math nodes to create radial patterns, hexagonal grids, or custom distributions.

### 7.7 Blender 4.4 Geometry Nodes Changes

Blender 4.4 delivers significant improvements to the Geometry Nodes system [3]:

- **Triangulate Node Performance**: Ported from BMesh to Mesh internally, yielding 30x to 100x faster execution. This dramatically benefits procedural workflows that generate triangulated geometry for real-time applications or physics simulations.
- **Sort Elements Node Performance**: Approximately 50% faster in common scenarios, improving workflows that depend on element ordering for procedural effects.
- **New Find in String Node**: Searches for a substring within a string and returns the position. Enables text processing workflows in Geometry Nodes.
- **New Input Nodes**: Collection and Object input nodes allow selecting these data-blocks directly from the node editor.
- **Limit Surface Option**: The Subdivision Surface node now exposes a Limit Surface option that evaluates to the mathematical limit of infinite subdivision, producing perfectly smooth surfaces.
- **Over 70 Bug Fixes**: The Winter of Quality initiative resolved over 70 Geometry Nodes bugs during January 2025 alone [4].

---

## Part 8: Curves, Surfaces, and Text

### 8.1 Curve Objects

Curve objects are mathematically defined paths manipulated through control points rather than vertices. Blender supports two curve types:

**Bezier Curves**: Each control point has a position and two handles that control the tangent direction and curvature. Handle types:
- Auto: Handles are calculated automatically for smooth curvature
- Vector: Handles point toward adjacent control points, creating straight segments
- Aligned: Handles are locked to be collinear (smooth) but can have different lengths
- Free: Handles are independent (can break smoothness)

**NURBS Curves**: Non-Uniform Rational B-Spline curves defined by control points with weights. The curve does not pass through control points; instead, control points attract the curve. Order (complexity of the polynomial basis) and weight per control point provide fine control.

**Curve Properties**:
- 2D/3D toggle: 2D curves are constrained to a plane (useful for logo extrusion)
- Resolution Preview/Render: Number of intermediate points between control points
- Twist Method: How the curve normal rotates along the path (Minimum, Z-Up, Tangent)
- Fill Mode: Full, Back, Front, or None (for closed 2D curves)

**Curve Geometry (Bevel)**:
Curves can generate 3D geometry through beveling:
- Depth: Adds a circular cross-section, turning the curve into a tube
- Resolution: Smoothness of the circular cross-section
- Extrude: Extends the 2D curve profile into a ribbon
- Bevel Object: Uses another curve as the cross-section profile (e.g., a star-shaped profile creates a star-shaped tube)
- Taper Object: Uses another curve to control the radius along the path length

**Common Uses**: Animation paths (Follow Path constraint), cable/pipe modeling, text path (Text on Curve), Geometry Nodes input (Curve to Mesh), particle guide paths.

### 8.2 Surface Objects

NURBS Surface objects are 2D grids of control points defining smooth mathematical surfaces. They share properties with NURBS curves but extend into two dimensions (U and V).

Blender provides several surface primitives: Surface Curve, Surface Circle, Surface Surface, Surface Cylinder, Surface Sphere, and Surface Torus.

Surface objects are less commonly used in modern Blender workflows because:
- Subdivision Surface on mesh objects provides similar smooth results with more intuitive editing
- Geometry Nodes offers more flexible procedural surface generation
- Most import/export formats do not preserve NURBS surfaces

Surfaces remain useful for mathematically precise forms, CAD interoperability, and specialized modeling applications where exact curvature continuity is required [6].

### 8.3 Text Objects

Text objects (Shift+A > Text) create 3D text that can be styled, extruded, and animated.

**Editing Text**: Enter Edit Mode (Tab) to type and edit text content. Standard text editing shortcuts work (arrow keys, Home/End, Ctrl+A for select all, Ctrl+C/V for copy/paste).

**Font Properties**:
- Font Family: Any installed system font or loaded font file
- Bold / Italic / Bold Italic variants (requires the font to include these variants)
- Size: Base text size
- Shear: Italic angle for fonts without italic variants
- Object Font: Use another font object for a specific style

**Geometry Properties**:
- Extrude: Depth of the 3D text
- Offset: Expand or contract the text outline
- Bevel Depth and Resolution: Rounded edges on the extruded text
- Taper Object: Varies depth along a curve

**Layout Properties**:
- Horizontal / Center / Right / Justify / Flush alignment
- Character Spacing, Word Spacing, Line Spacing
- Text on Curve: Flows text along a curve object
- Text Boxes: Multiple text regions with overflow behavior

**Conversion**: Text objects can be converted to meshes (Object > Convert > Mesh from Curve/Text) or curves (Object > Convert > Curve) for further editing. This is commonly done when the text shape needs to be modified beyond what text properties allow.

---

## Part 9: Practical Tips and Common Pitfalls

### Modeling Pitfalls

1. **N-gons in subdivision surfaces**: Faces with more than 4 vertices (n-gons) produce artifacts when a Subdivision Surface modifier is applied. The smoothing algorithm handles quads best, tolerates triangles in some positions, but creates shading anomalies with n-gons. Strive for all-quad topology on surfaces that will be subdivided.

2. **Non-manifold geometry**: Edges shared by more than two faces, faces with zero area, or loose vertices cause problems with modifiers (Boolean, Solidify), physics simulations, and 3D printing. Use Select > Select All by Trait > Non-Manifold to identify problem areas.

3. **Forgotten Mirror modifier before applying**: If you model with a Mirror modifier and apply it too early, you lose the ability to work on one half. Apply Mirror only when you need asymmetric changes. Keep it non-destructive as long as possible.

4. **Boolean cleanup**: Boolean operations often leave messy topology with n-gons, non-planar faces, and zero-area faces. Clean up with Limited Dissolve, Merge by Distance, and manual edge loop insertion.

5. **Scale not applied before UV unwrapping**: Non-uniform object scale distorts UV unwrapping results. Always apply scale (Ctrl+A > Scale) before unwrapping.

### Sculpt Pitfalls

1. **Sculpting low-poly meshes**: Sculpt brushes move vertices -- if there are too few vertices, the result is faceted and blocky. Ensure adequate resolution before sculpting via Dyntopo, Multiresolution, or pre-subdivision.

2. **Dyntopo and symmetry**: Dyntopo can break perfect symmetry over time. Periodically use Mesh > Symmetrize to restore mirror symmetry.

3. **Performance in Sculpt Mode**: Very high-poly meshes (10M+ vertices) can cause viewport lag. Use Multires to sculpt at an appropriate level. Mask and hide regions you are not actively working on to improve performance.

### Geometry Nodes Pitfalls

1. **Realizing instances too early**: Realize Instances converts lightweight instances into full geometry, dramatically increasing memory usage and processing time. Keep instances as instances until you need to modify them individually.

2. **Domain mismatches**: Connecting a face-domain field to a point-domain input (or vice versa) causes automatic domain interpolation, which may produce unexpected results. Use the Spreadsheet editor to verify domains.

3. **Missing random seed variation**: If Random Value nodes across different parts of a tree use the same seed, they produce identical "random" values. Vary the Seed input for independent randomization.

---

## Sources

[1] "Blender Manual -- Modeling." docs.blender.org. https://docs.blender.org/manual/en/latest/modeling/

[2] "Blender Manual -- Modifiers." docs.blender.org. https://docs.blender.org/manual/en/latest/modeling/modifiers/introduction.html

[3] "Blender 4.4 Release Notes." Blender Developer Documentation. https://developer.blender.org/docs/release_notes/4.4/

[4] "5 Key Features in Blender 4.4." CG Channel. https://www.cgchannel.com/2025/03/5-key-features-in-blender-4-4/

[5] "All 54 Blender Modifiers Explained." brandon3d.com. https://brandon3d.com/modifiers/

[6] "Blender (software)." Wikipedia. https://en.wikipedia.org/wiki/Blender_(software)

[7] "Mesh Sculpt Brush Assets -- Blender Manual." docs.blender.org. https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/brushes/brushes.html

[8] "Fields -- Blender Manual." docs.blender.org. https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/fields.html

[9] "Geometry Nodes -- Blender 4.4." Blender Developer Documentation. https://developer.blender.org/docs/release_notes/4.4/geometry_nodes/

[10] "UV Unwrapping -- Blender Manual." docs.blender.org. https://docs.blender.org/manual/en/latest/modeling/meshes/uv/unwrapping/

[11] "Blender Geometry Nodes Fundamentals Guide." Artisticrender.com. https://artisticrender.com/blender-geometry-nodes-fundamentals-guide/

[12] "Sculpt, Paint, Texture -- Blender 4.3." Blender Developer Documentation. https://developer.blender.org/docs/release_notes/4.3/sculpt/

[13] "Blender's Sculpting Features." Blender Foundation. https://www.blender.org/features/sculpting/

[14] "UV Mapping Tutorial." RenderGuide.com. https://renderguide.com/blender-uv-mapping-tutorial/

[15] "Blender Modifiers Explained." BlenderDiplom.com. https://www.blenderdiplom.com/en/tutorials/406-ressource-blender-modifiers-explained.html

[16] "Blender 4.4 Release Notes." Scenegraph Academy. https://scenegraph.academy/article/blender-4-4-release-notes/

[17] "Attributes and Fields." Blender Developers Blog. https://code.blender.org/2021/08/attributes-and-fields/
