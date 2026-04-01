# Blender Foundations & Interface

Module: **BLN-01** | Series: Blender User Manual | Status: Reference Document

> **Blender User Manual -- Document 01**
>
> Complete coverage of Blender's history, installation, workspace system, 3D Viewport navigation, Properties panel, object types, fundamental operations, keyboard shortcuts, preferences, and Blender 4.4-specific changes. This document establishes the foundational knowledge required before proceeding to modeling, sculpting, shading, or rendering workflows.

---

## Table of Contents

- [Part 1: History of Blender](#part-1-history-of-blender)
  - [1.1 NeoGeo and the Birth of Blender (1988--1998)](#11-neogeo-and-the-birth-of-blender-19881998)
  - [1.2 Not a Number Technologies (1998--2002)](#12-not-a-number-technologies-19982002)
  - [1.3 The Free Blender Campaign and GNU GPL Release](#13-the-free-blender-campaign-and-gnu-gpl-release)
  - [1.4 The Blender Foundation and Open Projects](#14-the-blender-foundation-and-open-projects)
  - [1.5 Major Version Milestones](#15-major-version-milestones)
  - [1.6 Blender Today](#16-blender-today)
- [Part 2: Installation](#part-2-installation)
  - [2.1 System Requirements](#21-system-requirements)
  - [2.2 Windows Installation](#22-windows-installation)
  - [2.3 macOS Installation](#23-macos-installation)
  - [2.4 Linux Installation](#24-linux-installation)
  - [2.5 Portable Builds](#25-portable-builds)
  - [2.6 Steam vs Direct Download](#26-steam-vs-direct-download)
- [Part 3: The Workspace System](#part-3-the-workspace-system)
  - [3.1 What Are Workspaces](#31-what-are-workspaces)
  - [3.2 Default Workspaces](#32-default-workspaces)
  - [3.3 Customizing Workspaces](#33-customizing-workspaces)
- [Part 4: The 3D Viewport](#part-4-the-3d-viewport)
  - [4.1 Navigation](#41-navigation)
  - [4.2 Shading Modes](#42-shading-modes)
  - [4.3 Gizmos](#43-gizmos)
  - [4.4 Overlays](#44-overlays)
  - [4.5 Header and Tool Settings](#45-header-and-tool-settings)
- [Part 5: The Properties Panel](#part-5-the-properties-panel)
  - [5.1 Scene-Level Properties](#51-scene-level-properties)
  - [5.2 Object-Level Properties](#52-object-level-properties)
  - [5.3 Data-Level Properties](#53-data-level-properties)
- [Part 6: Object Types](#part-6-object-types)
  - [6.1 Geometric Objects](#61-geometric-objects)
  - [6.2 Rigging and Deformation Objects](#62-rigging-and-deformation-objects)
  - [6.3 Scene and Rendering Objects](#63-scene-and-rendering-objects)
  - [6.4 Utility and Control Objects](#64-utility-and-control-objects)
- [Part 7: Fundamental Operations](#part-7-fundamental-operations)
- [Part 8: Essential Keyboard Shortcuts](#part-8-essential-keyboard-shortcuts)
- [Part 9: Preferences and Customization](#part-9-preferences-and-customization)
- [Part 10: Blender 4.4 Specific Changes](#part-10-blender-44-specific-changes)
- [Part 11: Common Pitfalls and Practical Tips](#part-11-common-pitfalls-and-practical-tips)
- [Sources](#sources)

---

## Part 1: History of Blender

### 1.1 NeoGeo and the Birth of Blender (1988--1998)

Blender's origins trace back to the Dutch animation studio NeoGeo. In 1988, Ton Roosendaal co-founded NeoGeo, which quickly grew to become the largest 3D animation studio in the Netherlands and one of the leading animation houses in Europe. The studio produced award-winning work for commercial clients throughout the early 1990s [1, 6].

Before Blender existed, Roosendaal had developed earlier 3D software called "Traces" for the Commodore Amiga platform between 1987 and 1991. This experience informed the design principles that would later shape Blender. By 1993, Roosendaal recognized that the existing in-house tooling at NeoGeo was aging and needed a fundamental rewrite. On January 2, 1994, Roosendaal wrote the first source files titled "Blender" -- a date still celebrated as Blender's official birthday [1, 6].

The rewrite progressed through 1995, and by January 1995 version 1.00 was released internally. The name "Blender" derives from a song by the Swiss electronic band Yello, from their album *Baby*, which NeoGeo had featured in promotional materials [6].

Throughout the mid-1990s, Blender matured as an in-house production tool at NeoGeo. The studio used it for commercial animation projects, and each production cycle drove improvements in the software's capabilities. By 1997, Blender had evolved from a simple tool into a capable 3D creation suite with modeling, animation, and rendering capabilities [1].

### 1.2 Not a Number Technologies (1998--2002)

In 1998, Ton Roosendaal decided to spin off Blender development from NeoGeo into a dedicated company. He founded Not a Number Technologies (NaN), a name referencing the computing term for an undefined numerical result. NaN's mission was to further develop and market Blender as a commercial product [1, 6].

On January 1, 1998, Blender was released publicly online as SGI freeware, marking the first time users outside NeoGeo could access the software. NaN distributed Blender as shareware, offering a free version with limited features and a paid professional version [6].

In 1999, NaN attended its first SIGGRAPH conference to promote Blender to the wider computer graphics community. The reception was enthusiastic. NaN secured venture capital funding and grew its team. At its peak, NaN employed over 50 people and had obtained 4.5 million euros in financing from venture capitalists [1, 6].

However, the ambitious business model struggled against market realities. The expected revenue from shareware sales did not materialize at the scale investors demanded. Combined with the broader dot-com bust affecting technology companies worldwide, NaN's financial position deteriorated rapidly. In 2002, NaN went bankrupt, and Blender development effectively halted [1, 6].

### 1.3 The Free Blender Campaign and GNU GPL Release

With NaN bankrupt, Blender's future appeared bleak. The software's source code and intellectual property rights were held by NaN's creditors and investors. Ton Roosendaal, unwilling to let Blender die, conceived a radical plan: buy back the source code and release it as open-source software [1, 2].

In March 2002, Roosendaal founded the non-profit Blender Foundation with the explicit goal of preserving and continuing Blender development. In July 2002, he negotiated a deal with NaN's investors: for 100,000 euros, they would release all rights to the Blender source code [1, 2].

The "Free Blender" campaign launched on July 18, 2002, reaching out to the worldwide community of Blender users. The campaign needed to raise 100,000 euros (approximately $100,670 USD at the time). The response was remarkable -- by September 7, 2002, the full amount had been raised through individual donations from thousands of users around the world [1, 2, 6].

On October 13, 2002, Blender was released to the world under the terms of the GNU General Public License (GPL). This was a watershed moment: a commercially-developed professional 3D creation suite had been liberated into open-source software through direct community action. The Foundation initially reserved dual-licensing rights but suspended this indefinitely in 2005. Today, Blender operates under GNU GPLv2-or-later, with binary releases under GPLv3 due to Apache library dependencies [2, 6].

### 1.4 The Blender Foundation and Open Projects

The Blender Foundation established a development model centered on community collaboration supplemented by a core team of paid developers. To drive development forward and demonstrate Blender's capabilities, the Foundation initiated a series of "Open Projects" -- professional-quality productions created entirely with Blender, with all assets and production files released openly [1].

These open projects served dual purposes: they pushed Blender's capabilities to professional limits (identifying and fixing weaknesses in the process) and they demonstrated to the industry what open-source 3D software could achieve.

**Open Movie Projects:**

| Year | Project | Significance |
|------|---------|--------------|
| 2006 | *Elephants Dream* | First open movie project; proved community-funded production model |
| 2008 | *Big Buck Bunny* | Animated comedy short; demonstrated cartoon rendering |
| 2010 | *Sintel* | Fantasy short film; pushed character animation and VFX |
| 2012 | *Tears of Steel* | Live-action/VFX hybrid; proved compositing pipeline |
| 2015 | *Cosmos Laundromat* | Pilot for feature-length ambitions |
| 2019 | *Spring* | Grease Pencil 2D-in-3D showcase |
| 2020 | *Sprite Fright* | Full short film production |

**Open Game Project:**
- *Yo Frankie!* (Project Apricot) -- An open game utilizing the Crystal Space engine, demonstrating Blender's game asset pipeline [6].

The Blender Institute (later Blender Studio) in Amsterdam served as the physical home for these productions, employing professional artists and developers who worked side by side [1].

### 1.5 Major Version Milestones

Blender's version history reflects a continuous evolution from a capable but niche tool into an industry-standard application:

| Version | Year | Key Changes |
|---------|------|-------------|
| 2.5x | 2011 | Complete UI rewrite, event system overhaul, RNA/DNA data system |
| 2.6x | 2012--2014 | Cycles renderer, motion tracking, dynamic paint |
| 2.7x | 2014--2018 | Freestyle NPR, PBR viewport, Grease Pencil |
| 2.80 | July 2019 | Major UI overhaul, EEVEE renderer, Collections, removed Blender Game Engine and Blender Internal renderer [6] |
| 2.90--2.93 | 2020--2021 | Geometry Nodes (2.92), sculpt improvements, EEVEE refinements |
| 3.0 | December 2021 | Cycles X (2-8x performance improvement), Asset Browser [6] |
| 3.3 LTS | 2022 | Hair curves, Intel Arc GPU support |
| 3.6 LTS | 2023 | Simulation nodes, USD improvements |
| 4.0 | November 2023 | AgX color management replacing Filmic, Principled BSDF overhaul, Hydra Storm renderer [6] |
| 4.1 | March 2024 | Bone collections, light linking |
| 4.2 LTS | July 2024 | EEVEE Next overhaul with SSGI, virtual shadow maps [8] |
| 4.3 | October 2024 | Grease Pencil v3, sculpt mode refactor |
| 4.4 | March 2025 | Action Slots, Vulkan backend, Winter of Quality [3, 4] |

### 1.6 Blender Today

As of 2025, Blender is developed by its community alongside 26 full-time employees and 12 freelancers employed by the Blender Institute. The Blender Development Fund receives corporate sponsorship from major technology and entertainment companies including NVIDIA, AMD, Intel, Epic Games, Meta, Apple, Google, and Unity, among many others [6].

Blender has achieved mainstream industry adoption. Notable professional uses include NASA's interactive *Experience Curiosity* rover application, the Academy Award-winning film *Flow* (2024, rendered entirely in EEVEE), *Spider-Man 2* (animatics and previsualization), *Captain America: The Winter Soldier* (previsualization), and television productions including *Red Dwarf* and *The Man in the High Castle* [6].

The software is written in C++ with Python scripting, offering native cross-platform support for Windows, macOS, Linux, BSD, Haiku, and IRIX [6].

---

## Part 2: Installation

### 2.1 System Requirements

Blender 4.4 requires modern hardware to take full advantage of its capabilities. The minimum and recommended specifications are:

**Minimum Requirements:**

| Component | Specification |
|-----------|---------------|
| OS | Windows 10/11 (64-bit), macOS 12.0+, Linux (64-bit, glibc 2.28+) |
| CPU | 64-bit quad-core with SSE4.2 support |
| RAM | 8 GB |
| GPU | OpenGL 4.3 compatible with 2 GB VRAM |
| Display | 1920 x 1080 |
| Storage | 4 GB free space |

**Recommended Requirements:**

| Component | Specification |
|-----------|---------------|
| CPU | 64-bit eight-core |
| RAM | 32 GB |
| GPU | 8+ GB VRAM (NVIDIA RTX, AMD RX 6000+, Apple M-series, Intel Arc) |
| Display | 2560 x 1440 or higher |
| Storage | SSD with 10+ GB free space |

For Cycles GPU rendering, specific GPU support is required: NVIDIA GPUs with CUDA compute capability 5.0+ (GeForce GTX 900 series or newer) for CUDA/OptiX, AMD GPUs with RDNA architecture for HIP, Intel Arc GPUs for oneAPI, and Apple Silicon or AMD GPUs on macOS for Metal [9].

### 2.2 Windows Installation

On Windows, Blender is available through multiple channels:

1. **MSI Installer** (recommended): Download the `.msi` file from blender.org/download. Run the installer, which places Blender in `C:\Program Files\Blender Foundation\Blender 4.4\` by default. This method integrates with Windows' Add/Remove Programs.

2. **ZIP Archive**: Download the `.zip` portable build. Extract to any location. No installation required -- run `blender.exe` directly from the extracted folder.

3. **Microsoft Store**: Available as a packaged app with automatic updates.

The default installation associates `.blend` files with Blender and adds the application to the Start menu. Multiple Blender versions can coexist on the same system -- each version installs to its own directory [3].

### 2.3 macOS Installation

On macOS, Blender ships as a standard `.dmg` disk image:

1. Download the `.dmg` from blender.org/download.
2. Open the disk image and drag `Blender.app` to the Applications folder.
3. On first launch, macOS may display a Gatekeeper warning -- right-click and select "Open" to bypass.

Apple Silicon (M1/M2/M3/M4) Macs run Blender natively as a universal binary. Metal is the GPU backend for both viewport rendering and Cycles. Rosetta 2 translation is not required [3].

### 2.4 Linux Installation

Linux users have several installation options:

1. **Official Tarball**: Download the `.tar.xz` from blender.org/download. Extract and run the `blender` binary directly. This is the Foundation's recommended method for ensuring the latest version.

2. **Snap Package**: `sudo snap install blender --classic` provides automatic updates through the Snap store.

3. **Flatpak**: Available on Flathub: `flatpak install flathub org.blender.Blender`.

4. **Distribution Packages**: Most major distributions (Ubuntu, Fedora, Arch) package Blender, though these may lag behind official releases.

The official tarball is self-contained with all required libraries, avoiding dependency conflicts. For GPU rendering with Cycles, appropriate drivers are needed: NVIDIA proprietary drivers for CUDA/OptiX, Mesa with RADV for AMD HIP, or Intel compute-runtime for oneAPI [3].

### 2.5 Portable Builds

Blender supports portable installations on all platforms. The ZIP/tarball builds are inherently portable -- they carry all dependencies internally and store user configuration within the Blender directory when a `config` folder is created alongside the executable.

To create a portable installation:
1. Download the ZIP (Windows) or tarball (Linux/macOS) build.
2. Extract to the desired location (e.g., a USB drive).
3. Create an empty folder named `config` in the extracted Blender directory (next to the `blender` executable on Linux, or inside the `4.4/` folder on Windows).
4. Blender will use this local `config` folder instead of the user's home directory for preferences, startup files, and add-ons.

This is particularly useful for carrying a customized Blender setup between workstations or for maintaining isolated configurations for different projects [3].

### 2.6 Steam vs Direct Download

Blender is available for free on Steam as well as directly from blender.org. Key differences:

| Aspect | Steam | Direct Download |
|--------|-------|-----------------|
| Updates | Automatic via Steam | Manual download required |
| Version availability | Current release only | All versions archived |
| Multiple versions | Not supported | Easy side-by-side |
| Configuration | Steam user data folder | System user profile |
| Cost | Free | Free |
| Platform integration | Steam overlay, hours tracking | None |

For professional work, the direct download is generally preferred because it allows running multiple versions simultaneously, offers immediate access to new releases (Steam sometimes lags by hours or days), and does not require the Steam client to be running [3].

---

## Part 3: The Workspace System

### 3.1 What Are Workspaces

Workspaces are predefined window layouts optimized for specific tasks. Each workspace consists of a set of Areas containing Editors, arranged to support a particular workflow. Workspaces are accessed via tabs at the top of the Blender window [5].

A workspace is not a mode -- it is a layout configuration. Switching workspaces changes which editors are visible and how they are arranged, but does not change the state of the scene or the mode of any object. You can model in the "Animation" workspace or animate in the "Modeling" workspace; the workspace names are conventions, not restrictions [5].

### 3.2 Default Workspaces

Blender 4.4 ships with the following default workspaces:

| Workspace | Primary Editors | Purpose |
|-----------|----------------|---------|
| **Layout** | 3D Viewport, Outliner, Properties, Timeline | General-purpose default; scene assembly and overview |
| **Modeling** | 3D Viewport (expanded), Properties | Mesh editing with maximized viewport space |
| **Sculpting** | 3D Viewport (Sculpt Mode), Properties | Organic modeling with brush-based tools |
| **UV Editing** | UV Editor, 3D Viewport | UV unwrapping and texture coordinate editing |
| **Texture Paint** | Image Editor, 3D Viewport (Texture Paint Mode) | Painting textures directly onto 3D surfaces |
| **Shading** | Shader Editor, 3D Viewport (Material Preview), Image Editor | Node-based material creation |
| **Animation** | 3D Viewport, Dope Sheet, Graph Editor, Timeline | Keyframe animation and curve editing |
| **Rendering** | Image Editor, Properties | Render output review and render settings |
| **Compositing** | Compositor, Image Editor | Node-based post-processing of rendered images |
| **Geometry Nodes** | Geometry Node Editor, 3D Viewport, Spreadsheet | Procedural geometry creation via node graphs |
| **Scripting** | Text Editor, Python Console, Info Editor, 3D Viewport | Python scripting and automation |

Each workspace opens its editors in a layout that prioritizes the given task. The Layout workspace, for example, provides a balanced view of the scene with the Outliner for hierarchy management, Properties for settings, and a Timeline for animation context [5].

### 3.3 Customizing Workspaces

Workspaces are fully customizable:

- **Adding workspaces**: Click the `+` button next to the workspace tabs and choose "Duplicate Current" or select a template.
- **Renaming**: Double-click the workspace tab name to rename it.
- **Reordering**: Drag workspace tabs to rearrange them.
- **Deleting**: Right-click a workspace tab and select "Delete."
- **Splitting areas**: Hover over the border between two areas until the cursor changes, then drag to split. Alternatively, right-click an area border and select "Split Area."
- **Joining areas**: Drag from one area's corner into an adjacent area to merge them.
- **Swapping editors**: Change an editor type using the dropdown in the top-left corner of any area.

Custom workspaces are saved in the `.blend` file. To make them available in all new files, configure workspaces in the startup file (File > Defaults > Save Startup File) [5].

---

## Part 4: The 3D Viewport

The 3D Viewport is Blender's central editor, where nearly all interactive 3D work takes place. It provides real-time visualization of the scene and serves as the primary interface for selecting, transforming, and editing objects.

### 4.1 Navigation

Blender's 3D Viewport supports three fundamental navigation operations:

**Orbit** rotates the view around a center point (by default, the scene origin or the selected object's origin).
- Middle Mouse Button (MMB) + Drag
- Numpad 2/4/6/8 for 15-degree increments
- Navigation gizmo in the top-right corner of the viewport

**Pan** translates the view without changing the viewing angle.
- Shift + MMB + Drag
- Ctrl + Numpad 2/4/6/8

**Zoom** moves the viewpoint closer to or farther from the center point.
- Scroll Wheel
- Ctrl + MMB + Drag
- Numpad + / Numpad -

**Standard Views** provide axis-aligned orthographic projections:

| Shortcut | View |
|----------|------|
| Numpad 1 | Front |
| Ctrl + Numpad 1 | Back |
| Numpad 3 | Right |
| Ctrl + Numpad 3 | Left |
| Numpad 7 | Top |
| Ctrl + Numpad 7 | Bottom |
| Numpad 5 | Toggle Perspective / Orthographic |
| Numpad 0 | Camera View |
| Numpad . (period) | Focus on selected object |
| Home | View All (fit entire scene) |

**Trackpad Navigation**: For laptops without a middle mouse button or numpad, Blender offers emulation options in Edit > Preferences > Input:
- "Emulate 3 Button Mouse" allows Alt + Left Click to substitute for MMB.
- "Emulate Numpad" maps the number row (1-0) to numpad functions.

**Navigation Gizmo**: The colored orientation widget in the top-right corner of the viewport shows the current viewing direction. Clicking the axis labels (X, Y, Z, or their negatives) snaps to axis-aligned views. Dragging on the gizmo orbits the view. The small camera icon below the gizmo switches to camera view [5].

### 4.2 Shading Modes

The 3D Viewport offers four shading modes, selectable from the header bar or via keyboard shortcuts:

**Wireframe (Z > 4)**
Displays only edges and vertices. Useful for seeing through objects, selecting occluded geometry, and checking topology. All objects are transparent, showing only their wireframe structure.

**Solid (Z > 2)**
The default shading mode. Renders objects with a basic material appearance using Matcap or Studio lighting. This mode is fast and provides enough visual information for modeling and scene assembly. Options include:
- Lighting: Studio, Matcap, or Flat
- Color: Material, Single, Object, Random, Vertex, or Texture
- Background: Theme, World, or Viewport
- Cavity and Shadow effects for enhanced depth perception

**Material Preview (Z > 3)**
Renders objects using the EEVEE engine in real-time, showing materials as they will appear in the final EEVEE render. This mode uses a default HDRI environment for lighting (configurable in the shading popover). It provides a good balance between speed and visual accuracy for material development.

**Rendered (Z > 1)**
Renders the viewport using the scene's active render engine (Cycles or EEVEE) with the scene's actual lighting setup. For Cycles, this produces a progressively-refined path-traced image directly in the viewport. For EEVEE, it matches the final render output. This mode is the slowest but most accurate [5].

### 4.3 Gizmos

Gizmos are interactive on-screen controls for transforming objects and adjusting parameters:

**Transform Gizmos** appear when Move (G), Rotate (R), or Scale (S) tools are active:
- Colored axes (Red = X, Green = Y, Blue = Z) allow constrained transformation along single axes.
- Colored planes between axes allow transformation along two axes simultaneously.
- The white circle (Rotate) or center point (Move/Scale) allows unconstrained transformation.

**Navigation Gizmo**: The orientation widget in the viewport corner (described in 4.1).

**Camera Gizmo**: In camera view, a rectangular border shows the render region. The gizmo allows panning the camera, adjusting focal length, and moving the camera by dragging elements of the border.

**Light Gizmos**: When a light is selected, gizmos display for adjusting light radius, cone angle (spotlights), and other parameters directly in the viewport.

Gizmos can be toggled globally via the "Show Gizmo" dropdown in the viewport header [5].

### 4.4 Overlays

Overlays are informational displays drawn on top of the 3D view. They are controlled via the "Show Overlays" dropdown in the viewport header:

- **Grid**: The reference grid on the floor plane, with subdivisions and scale display.
- **3D Cursor**: The red-and-white crosshair that serves as the placement origin for new objects (Shift + Right Click to position).
- **Annotations**: Freehand drawing visible in the viewport (useful for review notes).
- **Extras**: Display of empties, lights, cameras, and other non-renderable objects.
- **Relationship Lines**: Dashed lines showing parent-child relationships.
- **Origins**: Display of object origin points.
- **Motion Paths**: Visualization of animated object trajectories.
- **Edge Marks**: Seam, sharp, bevel weight, and crease displays in Edit Mode.
- **Face Orientation**: Blue (front) and red (back) face coloring to identify flipped normals.
- **Wireframe**: Overlay wireframe on top of solid shading.
- **Bone display types**: Various armature visualization options (Octahedral, Stick, B-Bone, Envelope, Wire).
- **Statistics**: Vertex, edge, face, triangle, and object counts [5].

### 4.5 Header and Tool Settings

The 3D Viewport header contains:

- **Mode selector**: Switch between Object Mode, Edit Mode, Sculpt Mode, Vertex Paint, Weight Paint, Texture Paint, and Pose Mode (for armatures).
- **Transform Orientation**: Global, Local, Normal, Gimbal, View, Cursor, or custom orientations. Determines the axes used for transformations.
- **Transform Pivot Point**: Active Element, Median Point, Individual Origins, 3D Cursor, Bounding Box Center. Determines the center point for rotations and scale operations.
- **Proportional Editing toggle**: Enable/disable soft-selection falloff for transformations.
- **Snap settings**: Target types (Vertex, Edge, Face, Grid, Increment) and snapping behavior.
- **Tool Settings bar**: Displays options for the currently active tool along the top of the viewport.

---

## Part 5: The Properties Panel

The Properties panel is the vertical panel on the right side of the default layout, identified by rows of icons along its left edge. Each icon represents a different tab, and the available tabs change based on the type of object selected. Properties are organized hierarchically: scene-level settings affect the entire file, object-level settings affect individual objects, and data-level settings affect the underlying data referenced by objects.

### 5.1 Scene-Level Properties

These tabs appear regardless of what object is selected:

**Active Tool and Workspace Properties** (wrench icon at top)
Settings for the currently active tool in the 3D Viewport. Changes based on the selected tool and mode.

**Render Properties** (camera icon)
Controls the render engine and its global settings:
- Render Engine selector (Cycles, EEVEE, Workbench)
- Sampling settings (render samples, viewport samples, adaptive sampling threshold)
- Denoising configuration
- Light Paths (bounce limits for diffuse, glossy, transmission, volume, transparent)
- Film (transparency, pixel filter)
- Performance (memory, threading, tile size for Cycles)
- Color Management (view transform, look, exposure, gamma)

**Output Properties** (printer icon)
Defines where and how renders are saved:
- Resolution (X, Y, percentage scale)
- Frame Rate
- Frame Range (start, end, step)
- Output Path
- File Format (PNG, JPEG, OpenEXR, TIFF, BMP, FFMPEG for video)
- Color Depth (8-bit, 16-bit, 32-bit for EXR)
- Encoding settings for video output (container, codec, bitrate)

**View Layer Properties** (stacked layers icon)
Controls render layer composition:
- View Layer name and selection
- Use for Rendering toggle
- Render Passes (Combined, Z, Mist, Normal, Diffuse Color, Glossy Color, Emission, AO, Shadow, Volume, Denoising Data, and more)
- Layer overrides for material and world

**Scene Properties** (cone/sphere/cylinder icon)
Global scene settings:
- Scene Camera
- Background Scene
- Active Collection
- Units (Metric, Imperial, None; unit scale, separate distance/rotation/mass/time/temperature)
- Gravity vector
- Keying Sets
- Audio settings (volume, distance model, Doppler)
- Rigid Body World settings

**World Properties** (globe icon)
Environment and atmospheric settings:
- Surface shader (Background node for color or HDRI)
- Volume shader (for global fog or atmosphere)
- Light Probe settings (screen-space effects)
- Mist Pass settings (start, depth, falloff)

### 5.2 Object-Level Properties

These tabs appear when an object is selected and pertain to that specific object:

**Object Properties** (orange square icon)
The selected object's transform and display settings:
- Transform (Location X/Y/Z, Rotation X/Y/Z, Scale X/Y/Z)
- Delta Transform (additive offsets)
- Relations (Parent, Parent Type, Pass Index)
- Collections membership
- Instancing (None, Verts, Faces, Collection)
- Motion Paths
- Visibility (renders, viewport, selectable)
- Custom Properties

**Modifier Properties** (blue wrench icon)
Non-destructive operations stacked on the object. Each modifier in the stack can be reordered, toggled for viewport/render visibility, and applied or deleted. Modifiers are categorized as Generate, Deform, Modify, or Physics. (See Document 02 for the complete modifier reference.)

**Particle Properties** (three dots icon)
Particle system settings for hair and emitter particles:
- Emission (count, frame range, lifetime)
- Hair settings (length, segments)
- Velocity, Rotation, Physics type
- Render settings (render as Object, Collection, Path)
- Children (Simple, Interpolated)
- Force Field Weights

**Physics Properties** (downward arrow icon)
Simulation and physics settings:
- Rigid Body (Active, Passive; mass, friction, bounciness)
- Cloth (quality, gravity, air drag, structural/bending stiffness)
- Soft Body
- Fluid (Domain, Flow, Effector; liquid and gas simulations via Mantaflow)
- Smoke
- Dynamic Paint (brush, canvas)
- Force Field settings

**Constraints Properties** (chain link icon)
Constraints that limit or drive object transforms:
- Motion Tracking constraints (Camera Solver, Follow Track, Object Solver)
- Transform constraints (Copy Location, Copy Rotation, Copy Scale, Copy Transforms)
- Relationship constraints (Child Of, Follow Path, Action, Armature)
- Limit constraints (Limit Location, Limit Rotation, Limit Scale)
- Tracking constraints (Track To, Damped Track, Clamp To, Stretch To, Locked Track)

### 5.3 Data-Level Properties

These tabs access the underlying data block referenced by the object:

**Object Data Properties** (green triangle for mesh, curve icon for curves, etc.)
The shape of the icon changes based on object type:
- **Mesh**: Vertex Groups, Shape Keys, UV Maps, Vertex Colors, Face Maps, Normals
- **Curve**: Shape (2D/3D, resolution), Path Animation, Active Spline
- **Camera**: Lens (Perspective/Orthographic/Panoramic), Depth of Field, Sensor Size, Safe Areas
- **Light**: Light Type (Point, Sun, Spot, Area), Color, Power/Watts, Shadow settings, Contact Shadow
- **Armature**: Display type, Bone Collections, Pose Libraries

**Material Properties** (checkered sphere icon)
Material slots and material settings:
- Material Slot list (an object can have multiple materials assigned to different faces)
- Surface shader (typically Principled BSDF)
- Volume shader
- Displacement method (Bump Only, Displacement Only, Displacement and Bump)
- Viewport Display color
- Pass Index and backface culling
- (See Document 03 for the complete material and shader reference.)

---

## Part 6: Object Types

All items in a Blender scene are objects. Objects contain a reference to underlying data (mesh data, curve data, etc.) along with transform information (location, rotation, scale), parenting relationships, constraints, and modifiers.

### 6.1 Geometric Objects

**Mesh**
The most common object type. Meshes are composed of vertices, edges, and polygonal faces. They support n-gon faces (polygons with more than four vertices) through the BMesh system. Meshes are the primary object type for detailed modeling and can be extensively edited in Edit Mode. They support modifiers, UV maps, vertex groups, shape keys, and vertex colors [6].

**Curve**
Mathematically defined curves manipulated through control points and handles rather than vertices. Blender supports Bezier curves (with handle types: Auto, Vector, Aligned, Free) and NURBS curves. Curves can be used for paths (animation follow), beveled/extruded profiles (creating pipe or ribbon shapes), or as input for other operations like the Curve modifier [6].

**Surface**
NURBS-based surface patches manipulated through control point grids. Surfaces are useful for smooth, mathematically precise forms. They are less commonly used than meshes but valuable for specific applications like car body panels or organic landscape forms [6].

**Metaball**
Implicit surface objects defined by mathematical functions rather than explicit geometry. When multiple metaballs are brought together, they merge smoothly, creating organic blob-like forms. Useful for quick organic prototyping, liquid-like effects, and generating base meshes for further sculpting. Each metaball element can be a Ball, Capsule, Plane, Ellipsoid, or Cube [6].

**Text**
3D text objects that can be extruded, beveled, and converted to meshes. Text objects support font selection, character spacing, word spacing, line spacing, and alignment. They can use any TrueType or OpenType font installed on the system. Text objects are commonly converted to meshes (Object > Convert > Mesh) for further editing [6].

**Volume**
OpenVDB-based volumetric data objects. Volumes can be imported from external simulation caches or generated procedurally. They render as fog, smoke, fire, or clouds depending on the shader applied. Volume objects are particularly useful for integrating external simulation data from Houdini or other packages [6].

### 6.2 Rigging and Deformation Objects

**Armature**
Skeletal structures used for rigging and character animation. An armature contains bones arranged in hierarchies. Bones can be connected (forming chains like arms or spines) or disconnected. Armatures support inverse kinematics (IK), forward kinematics (FK), bone constraints, custom bone shapes, and bone collections. They are essential for character animation, mechanical rigging, and facial rigging [6].

**Lattice**
Non-renderable 3D grids of control points used to deform other objects through the Lattice modifier. Moving lattice points deforms any object bound to the lattice. Lattices provide a coarse, easy-to-control deformation layer -- useful for squash-and-stretch effects, facial deformation, and broad shape adjustments without altering the underlying mesh topology [6].

### 6.3 Scene and Rendering Objects

**Camera**
The virtual camera that determines what appears in the rendered output. Cameras have properties for lens type (Perspective, Orthographic, Panoramic), focal length, sensor size, depth of field (f-stop, focus distance), clipping distances, and safe areas. Each scene has an active camera used for rendering. Multiple cameras can exist in a scene, and the active camera can be switched via markers in the timeline [6].

**Light**
Light objects illuminate the scene. Blender provides four light types:
- **Point**: Omnidirectional light from a single point (like a bare light bulb).
- **Sun**: Parallel rays from an infinitely distant source with constant intensity (no distance falloff).
- **Spot**: Cone-shaped light with configurable cone angle, blend, and optional shadow.
- **Area**: Light emitted from a rectangular or elliptical surface, producing natural soft shadows. Size affects shadow softness.

Each light type has properties for color, power (watts in Cycles), shadow settings, and contact shadows (EEVEE) [6].

**Light Probe**
Used by EEVEE to capture and store lighting information for indirect illumination. Three types exist:
- **Irradiance Volume**: Captures diffuse indirect lighting in a 3D grid of sample points.
- **Reflection Cubemap**: Captures specular reflections at a single point (replaced by Reflection Plane in EEVEE Next).
- **Reflection Plane**: Captures planar reflections for flat surfaces like floors and water.

Light probes are not used by Cycles, which computes global illumination through path tracing [6].

### 6.4 Utility and Control Objects

**Empty**
Null objects with no geometry or renderable content. Empties serve as transform nodes -- placeholders used to control other objects. Common uses include: parent objects for groups, targets for constraints (e.g., Track To), array offset references, force field locations, and instancing origins. Display types include Plain Axes, Arrows, Single Arrow, Circle, Cube, Sphere, Cone, and Image [6].

**Speaker**
Audio source objects for 3D spatialized sound. Speakers reference a sound file and have properties for volume, pitch, distance attenuation, and cone of influence. They are used in conjunction with Blender's audio system for animation previews and game-engine-style spatial audio [6].

**Force Field**
Objects that exert forces on particles, cloth, soft bodies, and rigid body simulations. Force field types include: Force, Wind, Vortex, Magnetic, Harmonic, Charge, Lennard-Jones, Texture, Curve Guide, Boid, Turbulence, Drag, and Fluid Flow. Any object type can act as a force field by enabling "Force Field" in its Physics properties [6].

---

## Part 7: Fundamental Operations

These operations form the basis of all scene assembly work in Object Mode:

**Adding Objects** (Shift + A)
Opens the Add menu, organized by object type. Objects are placed at the 3D Cursor position. The Adjust Last Operation panel (F9 or bottom-left popover) allows modifying creation parameters (e.g., number of segments for a UV Sphere) immediately after placement.

**Deleting Objects** (X or Delete)
Prompts a confirmation menu. "Delete" removes the object entirely. "Delete Hierarchy" removes the object and all its children. In Edit Mode, X provides additional options (Vertices, Edges, Faces, Dissolve Vertices, Dissolve Edges, Dissolve Faces, Collapse, Edge Loops).

**Duplicating Objects** (Shift + D)
Creates an independent copy of the selected objects, including a copy of the underlying data. The duplicate starts in grab mode for immediate placement.

**Linked Duplicating** (Alt + D)
Creates a new object that references the same underlying data as the original. Changes to the mesh data of either the original or the linked duplicate affect both. This is useful for repeated elements (e.g., bolts, windows) where a change to one should propagate to all.

**Parenting** (Ctrl + P)
Establishes a parent-child relationship. The child object's transforms become relative to the parent. Options include Object, Bone, Vertex, and various constraint-based parenting types. Clear parent with Alt + P.

**Grouping via Collections**
Collections are Blender's organizational system (replacing the older Layer and Group systems). Objects can belong to multiple collections. Collections can be nested hierarchically. Toggle visibility, selectability, and renderability per collection in the Outliner. Create new collections with right-click in the Outliner.

**Joining Objects** (Ctrl + J)
Merges multiple selected objects into one object. The active object (outlined in a lighter color) becomes the target, and all other selected objects' geometry is merged into it. Object-level data (modifiers, materials) from the active object is retained.

**Separating Geometry** (P, in Edit Mode)
Splits selected geometry from the current object into a new object. Options: Selection, By Material, By Loose Parts.

**Apply Transforms** (Ctrl + A)
"Bakes" the current Location, Rotation, or Scale into the object's data, resetting the displayed transform values to identity (0/0/0 for location, 0/0/0 for rotation, 1/1/1 for scale). This is critical before exporting, rigging, or applying certain modifiers that depend on the object's local coordinate system.

---

## Part 8: Essential Keyboard Shortcuts

### General Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + Z | Undo |
| Ctrl + Shift + Z | Redo |
| Ctrl + S | Save |
| Ctrl + Shift + S | Save As |
| Ctrl + N | New File |
| Ctrl + O | Open File |
| F1 | Open Blender Manual (in browser) |
| F2 | Rename active item |
| F3 | Operator Search (search any command by name) |
| F9 | Adjust Last Operation panel |
| F12 | Render Image |
| Ctrl + F12 | Render Animation |
| F11 | Show last render |
| Tab | Toggle Edit Mode / Object Mode |
| Ctrl + Tab | Mode pie menu (Object, Edit, Sculpt, etc.) |
| Z | Shading pie menu |
| Shift + A | Add menu |
| X / Delete | Delete |
| Shift + D | Duplicate |
| Alt + D | Linked Duplicate |
| H | Hide selected |
| Alt + H | Unhide all |
| Shift + H | Hide unselected |

### Transform Shortcuts

| Shortcut | Action |
|----------|--------|
| G | Grab (Move) |
| R | Rotate |
| S | Scale |
| G, X / Y / Z | Move constrained to axis |
| R, X / Y / Z | Rotate constrained to axis |
| S, X / Y / Z | Scale constrained to axis |
| G, Shift + Z | Move constrained to XY plane (exclude Z) |
| G, X, [number], Enter | Move exact amount on X axis |
| Alt + G | Clear Location (reset to 0,0,0) |
| Alt + R | Clear Rotation |
| Alt + S | Clear Scale |
| Ctrl + A | Apply menu (Location, Rotation, Scale, All Transforms) |

### Selection Shortcuts

| Shortcut | Action |
|----------|--------|
| Left Click | Select |
| Shift + Left Click | Extend selection |
| A | Select All |
| Alt + A | Deselect All |
| Ctrl + I | Invert Selection |
| B | Box Select |
| C | Circle Select (scroll to resize, right-click to exit) |
| L (in Edit Mode) | Select Linked (under cursor) |
| Ctrl + L (in Edit Mode) | Select Linked (all connected to selection) |
| Ctrl + Numpad + | Grow Selection |
| Ctrl + Numpad - | Shrink Selection |

### Edit Mode Shortcuts

| Shortcut | Action |
|----------|--------|
| 1 | Vertex select mode |
| 2 | Edge select mode |
| 3 | Face select mode |
| E | Extrude |
| Ctrl + R | Loop Cut |
| Ctrl + B | Bevel |
| I | Inset Faces |
| K | Knife tool |
| M | Merge menu |
| Ctrl + E | Edge menu (Bridge Edge Loops, etc.) |
| Ctrl + F | Face menu |
| O | Toggle Proportional Editing |
| Shift + N | Recalculate Normals Outside |
| P | Separate menu |
| Ctrl + J | Join (Object Mode) |
| U | UV Mapping menu |

### Viewport Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| MMB drag | Orbit |
| Shift + MMB drag | Pan |
| Scroll wheel | Zoom |
| Numpad 1 / 3 / 7 | Front / Right / Top views |
| Ctrl + Numpad 1/3/7 | Back / Left / Bottom views |
| Numpad 5 | Toggle Perspective / Orthographic |
| Numpad 0 | Camera view |
| Numpad . | Focus on selected |
| Home | View all objects |
| Shift + C | Center cursor and view all |
| / (Numpad) | Local View (isolate selected) |

---

## Part 9: Preferences and Customization

Blender's preferences are accessed via Edit > Preferences (or Ctrl + Comma on some systems). The preferences window contains several sections:

### Interface
- Resolution Scale: Adjust UI size for high-DPI displays.
- Line Width: Thin, Default, or Thick.
- Splash Screen toggle.
- Developer Extras: Enables additional options for script development.
- Region Overlap: Transparent sidebar and header overlays.

### Themes
Complete color customization of every UI element. Blender ships with several built-in themes (Blender Dark, Blender Light, Print Friendly, XSI). Themes can be installed from `.xml` files.

### Viewport
- Selection method (Auto, OpenGL Occlusion Queries).
- Multisampling (anti-aliasing quality for the viewport).
- Texture display limit.
- Subdivision Render Levels.

### Lights
Default studio lighting configuration for Solid viewport shading. Three adjustable lights with color, direction, specular, and diffuse toggles.

### Editing
- Undo Steps (default 32; increase for complex work at the cost of memory).
- Grease Pencil settings.
- Duplicate Data options (controls what data is copied with Shift+D).
- Default new object settings.

### Animation
- Keyframing defaults (Visual Keying, Needed toggle).
- Auto Keying mode.
- F-Curve defaults.

### Add-ons
Searchable list of all installed add-ons with enable/disable toggles. Add-ons are categorized by type (Animation, Import/Export, Mesh, Object, Render, etc.). Add-ons can be installed from `.py` or `.zip` files. In Blender 4.4, the Extensions platform is the primary distribution mechanism for add-ons.

### Input
- **Keyboard**: Keymap presets (Blender, Industry Compatible). The Industry Compatible keymap follows conventions shared with Maya, 3ds Max, and other DCC tools.
- **Mouse**: Left/Right click select. "Emulate 3 Button Mouse" and "Emulate Numpad" toggles for laptop users.
- **Tablet**: Pressure sensitivity curves for pen tablets.
- **NDOF**: 3D mouse (SpaceMouse) configuration.

### Navigation
- Orbit method (Turntable vs. Trackball).
- Zoom direction, zoom to mouse position.
- Auto Perspective: Automatically switches between perspective and orthographic when using numpad views.

### Keymap
Full keymap editor allowing customization of every shortcut in Blender. Keymaps can be exported and imported for sharing between installations.

### System
- GPU backend selection (OpenGL, Vulkan -- experimental in 4.4).
- Cycles Render Devices (CUDA, OptiX, HIP, oneAPI, Metal).
- Memory & Limits (undo memory limit, VBO timeout, texture collection rate).
- Sound device and mixing settings.

### File Paths
- Default locations for fonts, textures, scripts, sounds, temporary files, render output, and I/O paths.
- Asset Libraries: Named directories Blender indexes for the Asset Browser.

### Save & Load
- Auto Save interval and file count.
- Compress `.blend` files by default.
- Load UI from `.blend` files toggle.

---

## Part 10: Blender 4.4 Specific Changes

Blender 4.4 was released on March 18, 2025. This release prioritized stability and quality alongside several significant feature additions [3, 4].

### Action Slots (Animation)

The most prominent new feature in Blender 4.4 is the Action Slots system, which revolutionizes animation data organization. Previously, each Action could only store animation data for a single object. With Action Slots, a single Action can contain multiple named slots, each storing animation data for different data-blocks [3, 4].

Practical implications:
- An object's position keyframes and its material color keyframes can live in the same Action as separate slots.
- Multiple objects can share a single Action, each using a different slot.
- Slots can be merged from separate Actions into one, or split from one Action into many.
- The Python API for Actions has changed accordingly. Existing `.blend` files are updated automatically on load, though the change is not fully backwards-compatible [4].

### Vulkan Backend Update

The experimental Vulkan graphics backend received a major update in performance, stability, and compatibility [4]:
- Cold-start startup time is now approximately 5x faster than the OpenGL backend.
- Warm-start startup time is approximately 2x faster than OpenGL.
- Vulkan now displays Cycles rendered output in the viewport.
- Support extended to older GPUs: NVIDIA GTX 900 series and AMD Radeon 400 series.
- Limitations remain: no OpenXR or OpenSubdiv support yet.

### CPU Compositor Rewrite

The CPU compositor was rewritten for improved future development [4]:
- Blur, filter, and mask nodes are 2-10x faster.
- The Glare node was revamped with new controls for threshold, smoothness, strength, and saturation.
- Integer socket support added to the compositor.
- Fast Gaussian blur mode is now more accurate.

### VFX Reference Platform CY2025

Blender 4.4 updates dependencies to match the CY2025 VFX Reference Platform specification, ensuring compatibility with standard libraries used across VFX production pipelines including OpenColorIO, OpenEXR, and OpenVDB [4].

### Winter of Quality

Blender 4.4 represents a concentrated quality effort called the "Winter of Quality." Over 500 reported issues were fixed during January 2025 alone. Key areas of focus [3, 4]:
- Grease Pencil received the most fixes following its v3 overhaul.
- UI, viewport, and Geometry Nodes each received over 70 fixes.
- Sculpt mode stability improvements.

### Geometry Nodes Performance

- The Triangulate node was ported from BMesh to Mesh, yielding 30-100x performance improvements [3, 4].
- The Sort Elements node is approximately 50% faster in common scenarios [3, 4].
- New "Find in String" node.
- New input nodes: Collection and Object.
- New "Limit Surface" option in the Subdivision Surface node.

### Sculpt Mode

- New Plane brush: a generalization of the Flatten, Fill, and Scrape brushes with controls for stabilization and range of influence above and below the brush plane [3].

### Modeling

- New "Select by Trait" option for pole selection (vertices connected to more or fewer than 4 edges).
- Tris to Quads operation now favors maintaining quad topology [3].

### Video Sequencer Improvements

- Direct text editing within the preview window.
- Text alignment and rounded box corner options.
- Faster image sequence proxies.
- Enhanced playback for float/HDR content [3].

### Other Notable Changes

- H.265/HEVC video encoding support for render output [3].
- AMD HIP RT is no longer experimental [3].
- Improved NVIDIA OptiX denoising consistency.
- Grease Pencil: restored Simplify functions (Fixed and Merge modes), Smooth Points, Stroke Placement, and Auto-Masking [3].
- Asset Browser now defaults to sorting by Asset Catalog [3].

---

## Part 11: Common Pitfalls and Practical Tips

### Common Beginner Pitfalls

1. **Accidental transforms**: Pressing G, R, or S accidentally starts a transform. If you notice unwanted movement, press Escape or Right Click immediately to cancel. Check Undo (Ctrl+Z) if you confirmed accidentally.

2. **Objects invisible in render but visible in viewport**: Check the camera icon (render visibility) in the Outliner. Also check the Filter funnel in the Outliner header -- object types may be filtered out.

3. **Numpad vs Number Row**: The standard keymap uses the Numpad for view navigation. The number row above the keyboard serves different functions (in Edit Mode, 1/2/3 switch vertex/edge/face selection). Enable "Emulate Numpad" in Preferences > Input if your keyboard lacks a numpad.

4. **Scale not applied**: Many operations (modifiers, physics, UV unwrapping, export) produce unexpected results if the object's scale is not (1, 1, 1). Always apply scale (Ctrl+A > Scale) before these operations.

5. **Origin point confusion**: The object origin (orange dot) determines the center of rotation and scale operations. If an object rotates around an unexpected point, the origin may be misplaced. Use Object > Set Origin > Origin to Geometry to center it.

6. **3D Cursor placement**: New objects are added at the 3D Cursor location, not at the world origin. If objects appear in unexpected places, reset the cursor with Shift + C (cursor to world origin) or Shift + S > Cursor to World Origin.

7. **Normals flipped**: Objects appearing black or inside-out typically have inverted face normals. In Edit Mode, select all (A) and recalculate normals (Shift + N). Enable Face Orientation overlay to visualize normal directions (blue = correct, red = flipped).

8. **Materials not showing**: In Solid shading mode, materials are not displayed by default. Switch to Material Preview (Z > 3) or Rendered (Z > 1) to see materials. Alternatively, in Solid shading, change Color to "Material" in the shading popover.

### Productivity Tips

1. **F3 Search**: The Operator Search (F3) is the fastest way to find any command. Type any part of the command name. This is invaluable when learning Blender -- if you know what you want to do but not the shortcut, search for it.

2. **Pie Menus**: Z (shading), Shift+S (snap), period key (pivot point), and Ctrl+Tab (mode) are pie menus that appear around the cursor. Move the mouse toward the desired option without clicking for the fastest selection.

3. **Header clicks**: Numeric fields in any header or property panel accept direct keyboard input. Click a field and type a value. Right-click a field to copy, paste, or add a driver.

4. **Local View** (Numpad /): Isolates the selected object, hiding everything else. Press again to return to the full scene. Invaluable for working on detailed parts of complex scenes.

5. **Collection instancing**: Instead of duplicating heavy objects, create a collection and use "Instance Collection" on an empty to display it at multiple locations. This uses a fraction of the memory.

6. **Save startup file**: Once you have configured your preferred settings, workspace layout, and startup objects, use File > Defaults > Save Startup File to make this the default for all new files.

7. **Incremental saves**: Use Ctrl+Shift+S with version numbering, or enable Auto Save in Preferences to protect against data loss. Blender also creates numbered backups (`.blend1`, `.blend2`) automatically.

8. **Sidebar** (N): The N-panel in the 3D Viewport contains Item (precise transform values), Tool (active tool options), and View (camera, lock, clip) tabs. This is where you type exact coordinates.

---

## Sources

[1] "History -- Blender." Blender Foundation. https://www.blender.org/about/history/

[2] "Blender's History -- Blender Manual." docs.blender.org. https://docs.blender.org/manual/en/2.82/getting_started/about/history.html

[3] "Blender 4.4 Release Notes." Blender Developer Documentation. https://developer.blender.org/docs/release_notes/4.4/

[4] "5 Key Features in Blender 4.4." CG Channel. https://www.cgchannel.com/2025/03/5-key-features-in-blender-4-4/

[5] "Workspaces -- Blender Manual." docs.blender.org. https://docs.blender.org/manual/en/latest/interface/window_system/workspaces.html

[6] "Blender (software)." Wikipedia. https://en.wikipedia.org/wiki/Blender_(software)

[7] "Blender 4.4 Release Notes." Scenegraph Academy. https://scenegraph.academy/article/blender-4-4-release-notes/

[8] "EEVEE Next Generation in Blender 4.2 LTS." Blender Developers Blog. https://code.blender.org/2024/07/eevee-next-generation-in-blender-4-2-lts/

[9] "GPU Rendering -- Blender Manual." docs.blender.org. https://docs.blender.org/manual/en/latest/render/cycles/gpu_rendering.html

[10] "4.4 -- Blender." Blender Foundation. https://www.blender.org/download/releases/4-4/

[11] "Blender Hotkey Cheat Sheet -- 4.4." CG Cookie. https://cgcookie.com/downloads/blender-hotkey-cheat-sheet

[12] "Ton Roosendaal." Wikipedia. https://en.wikipedia.org/wiki/Ton_Roosendaal

[13] "Blender 4.4 Released with a Big Update for the Experimental Vulkan Backend." 9to5Linux. https://9to5linux.com/blender-4-4-released-with-a-big-update-for-the-experimental-vulkan-backend

[14] "Blender 4.4: Release Date and What Features Are New or Updated." CG Cookie. https://cgcookie.com/posts/what-to-expect-with-blender-4-4
