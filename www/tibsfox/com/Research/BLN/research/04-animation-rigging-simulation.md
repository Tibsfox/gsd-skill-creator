# Animation, Rigging & Simulation

Module: **ANIM-RIG-SIM** | Series: Blender User Manual | Status: Reference Document

---

## Table of Contents

1. [Animation Fundamentals](#1-animation-fundamentals)
2. [Animation Editors](#2-animation-editors)
3. [Non-Linear Animation (NLA) Editor](#3-non-linear-animation-nla-editor)
4. [Action Slots (Blender 4.4)](#4-action-slots-blender-44)
5. [Rigging Foundations](#5-rigging-foundations)
6. [Bone Collections](#6-bone-collections)
7. [Weight Painting](#7-weight-painting)
8. [Rigify](#8-rigify)
9. [Constraints](#9-constraints)
10. [Shape Keys](#10-shape-keys)
11. [Drivers and Expressions](#11-drivers-and-expressions)
12. [Walk Cycle Tutorial](#12-walk-cycle-tutorial)
13. [Character Rigging Walkthrough with Rigify](#13-character-rigging-walkthrough-with-rigify)
14. [Digitigrade Rigging](#14-digitigrade-rigging)
15. [Physics Simulations](#15-physics-simulations)
16. [Cloth Simulation](#16-cloth-simulation)
17. [Hair Particles](#17-hair-particles)
18. [Common Pitfalls and Practical Tips](#18-common-pitfalls-and-practical-tips)
19. [Sources](#19-sources)

---

## 1. Animation Fundamentals

### 1.1 Keyframes

Animation in Blender works by interpolating property values between user-defined **keyframes**. A keyframe stores a specific value for a property (location, rotation, scale, color, influence, or any animatable property) at a specific frame number. Blender computes all intermediate values automatically using F-Curves [1].

To insert a keyframe, select an object and press **I** to open the Insert Keyframe menu. You can keyframe individual channels or groups of channels.

| Shortcut | Action |
|----------|--------|
| **I** | Insert Keyframe (context-sensitive menu) |
| **Alt+I** | Delete Keyframe |
| **Shift+Alt+I** | Clear Keyframes (all keyframes on selected) |
| **Right Arrow / Left Arrow** | Next / Previous Frame |
| **Shift+Left / Shift+Right** | Jump to Start / End of Playback Range |
| **Up Arrow / Down Arrow** | Jump to Next / Previous Keyframe |

### 1.2 F-Curves

An **F-Curve** (function curve) is the mathematical function that defines how a property value changes over time between keyframes. Each animated property has its own F-Curve. F-Curves are composed of keyframe **control points** connected by **segments**, and each segment uses an interpolation method to compute intermediate values [1].

F-Curves have three core properties:

- **Interpolation mode** -- determines how values are computed between keyframes
- **Handle type** -- controls the shape of Bezier curve handles at each keyframe
- **Extrapolation mode** -- determines behavior before the first keyframe and after the last

### 1.3 Interpolation Types

Blender provides three categories of interpolation, selectable per-keyframe via **T** in the Graph Editor [1][2]:

#### Standard Interpolation

| Type | Behavior | Use Case |
|------|----------|----------|
| **Constant** | Holds the value of the previous keyframe with no transition. Creates a staircase-shaped curve. | Blocking passes in pose-to-pose animation, on/off switches, visibility toggles |
| **Linear** | Creates a straight line between keyframes. Constant velocity. | Mechanical motion, conveyor belts, clock hands |
| **Bezier** | Smooth curve with adjustable tangent handles. Default mode. | Most character animation, natural motion, organic movement |

#### Easing Interpolation (Robert Penner Equations)

These preset easing functions were added in Blender 2.71 and provide physically-inspired motion curves without manual handle adjustment [2][3]:

| Type | Behavior | Typical Application |
|------|----------|---------------------|
| **Sinusoidal** | Weakest easing, nearly linear with subtle curvature at endpoints | Gentle starts and stops |
| **Quadratic** | Moderate acceleration/deceleration following a parabolic curve | General-purpose easing |
| **Cubic** | Stronger acceleration than quadratic | Snappier motion |
| **Quartic** | Even stronger acceleration | Emphatic starts/stops |
| **Quintic** | Strongest polynomial easing | Very dramatic acceleration |
| **Exponential** | Exponential growth/decay curve | Rapid acceleration from standstill |
| **Circular** | Quarter-circle-based curve | Smooth but defined transitions |

#### Dynamic Easing

| Type | Behavior | Typical Application |
|------|----------|---------------------|
| **Back** | Cubic easing with overshoot and settle-back. The `Back` property controls overshoot amplitude. | Anticipation (windup), settle/overshoot, springy UI elements |
| **Bounce** | Exponentially decaying parabolic bounce, simulating object collision rebound | Bouncing balls, objects hitting surfaces, comedic impacts |
| **Elastic** | Exponentially decaying sine wave, like a vibrating elastic band | Wobbly motion, jelly, rubber-band snaps, springy deformations |

Each easing type supports an **Easing Mode** that controls which end of the segment is affected:

- **Ease In** -- effect builds toward the second keyframe (acceleration)
- **Ease Out** -- effect fades from the first keyframe (deceleration, physics-like)
- **Ease In-Out** -- effect on both ends (smooth start and stop)

### 1.4 Handle Types

Bezier interpolation uses handles at each keyframe to control curve shape. Handle types are changed with **V** in the Graph Editor [1]:

| Handle Type | Behavior |
|-------------|----------|
| **Automatic** | Blender computes smooth tangents. Handles adjust to maintain smooth flow. |
| **Auto Clamped** | Like Automatic, but prevents overshoot by clamping handles when the keyframe is a local extremum. |
| **Vector** | Handles point directly at adjacent keyframes. Creates sharp corners. |
| **Aligned** | Both handles move together, maintaining a straight line through the keyframe. Manual control. |
| **Free** | Each handle moves independently. Maximum control, but can create discontinuities. |

### 1.5 Extrapolation Modes

Extrapolation determines what happens outside the keyframed range. Set via **Shift+E** in the Graph Editor [1]:

| Mode | Behavior |
|------|----------|
| **Constant** (default) | Holds the value of the nearest keyframe |
| **Linear** | Extends the curve using the slope of the nearest segment |
| **Make Cyclic** (F-Curve Modifier) | Repeats the entire curve. Options include Repeat, Repeat with Offset, and Repeat Mirrored. |

---

## 2. Animation Editors

Blender provides four primary animation editors, each serving a distinct role in the animation workflow [4][5]:

### 2.1 Timeline

The **Timeline** is the simplest animation editor and serves as the primary playback control. It displays a horizontal bar with frame numbers, a playhead (current frame indicator), and basic playback controls.

**Purpose:** Preview animation playback, navigate frames, insert/delete keyframes at the most basic level.

| Shortcut | Action |
|----------|--------|
| **Space** | Play/Pause animation |
| **Shift+Left** | Jump to start frame |
| **Shift+Right** | Jump to end frame |
| **M** | Add Marker |
| **Ctrl+M** | Rename Marker |

The Timeline shows keyframe diamonds for the active object but offers limited editing capability. For detailed keyframe manipulation, use the Dope Sheet [4].

### 2.2 Dope Sheet

The **Dope Sheet** is the primary keyframe manipulation editor. It extends the Timeline with a channel list on the left, showing all animated properties organized by object, bone, or data-block. Each channel displays its keyframes as diamonds on the timeline [4][5].

**Purpose:** Retiming animation, selecting/moving/scaling groups of keyframes, managing channels, blocking passes.

| Shortcut | Action |
|----------|--------|
| **G** | Grab (move) selected keyframes |
| **S** | Scale selected keyframes (retime) |
| **B** | Box Select |
| **X** / **Delete** | Delete selected keyframes |
| **Shift+D** | Duplicate keyframes |
| **T** | Set interpolation type |
| **Ctrl+T** | Set handle type |

The Dope Sheet has several **modes** accessible from its header:

- **Dope Sheet** -- shows all object animation
- **Action Editor** -- shows the active Action for the active object
- **Shape Key Editor** -- shows shape key channels
- **Grease Pencil** -- shows Grease Pencil keyframes
- **Cache File** -- shows Alembic cache data

The Dope Sheet is considered the most important tool for character animation in Blender. Most keyframe editing (retiming, blocking, offset) happens here rather than in the Graph Editor [5].

### 2.3 Graph Editor

The **Graph Editor** displays F-Curves as 2D graphs where the X-axis is time (frames) and the Y-axis is the property value. This is the only editor where you can see and manipulate the actual interpolation curves and handles [1].

**Purpose:** Fine-tuning interpolation, adjusting easing, polishing motion arcs, adding F-Curve modifiers.

| Shortcut | Action |
|----------|--------|
| **T** | Set interpolation type |
| **V** | Set handle type |
| **Shift+E** | Set extrapolation mode |
| **N** | Toggle properties panel (shows exact values) |
| **Ctrl+Shift+M** | Add F-Curve Modifier |
| **Home** | View All (fit all curves in view) |
| **Numpad .** | View Selected |

**F-Curve Modifiers** can be stacked on curves to add procedural effects:

- **Generator** -- adds a polynomial function
- **Built-In Function** -- sine, cosine, tangent, etc.
- **Envelope** -- defines a value range envelope
- **Cycles** -- repeats the curve (alternative to cyclic extrapolation)
- **Noise** -- adds random variation
- **Limits** -- clamps values to a range
- **Stepped** -- quantizes to steps (useful for limited animation, stop-motion looks)

### 2.4 Comparison of Animation Editors

| Feature | Timeline | Dope Sheet | Graph Editor | NLA Editor |
|---------|----------|------------|--------------|------------|
| View keyframe timing | Yes | Yes | Yes | Strips only |
| Move/scale keyframes | Limited | Yes | Yes | Strip-level |
| Edit interpolation curves | No | No | Yes | No |
| Channel filtering | No | Yes | Yes | Track-based |
| Action management | No | Yes (Action Editor mode) | No | Yes |
| Playback controls | Yes | Inherited | Inherited | Inherited |

---

## 3. Non-Linear Animation (NLA) Editor

### 3.1 Overview

The **Non-Linear Animation (NLA) Editor** operates at a higher level than the other animation editors. Instead of working with individual keyframes, the NLA Editor works with **Action Strips** -- self-contained, reusable chunks of animation that can be layered, blended, and mixed like tracks in a music sequencer or layers in an image editor [6].

### 3.2 Core Concepts

**Actions:** Named, reusable animation data blocks. An Action contains a set of F-Curves for specific properties. Actions are created in the Action Editor (a Dope Sheet mode) and can be "stashed" or "pushed down" to the NLA stack [6].

**Tracks:** Horizontal lanes in the NLA Editor. Each track can hold one or more strips. Tracks layer like image editor layers -- the bottom track evaluates first, and higher tracks override or blend with lower ones [6].

**Strips:** There are three strip types:

| Strip Type | Purpose |
|------------|---------|
| **Action Strip** | An instance of an Action. The primary strip type. |
| **Transition Strip** | Automatically blends between two adjacent Action Strips on the same track. |
| **Meta Strip** | Groups multiple strips into a single manageable unit (like grouping layers). |

### 3.3 Strip Properties

Each Action Strip has configurable properties:

- **Action** -- which Action data block to use
- **Slot** -- which Slot within the Action (Blender 4.4+)
- **Animated Influence** -- a 0.0-1.0 value controlling how much this strip affects the result (can be keyframed for fades)
- **Animated Strip Time** -- remaps the internal time of the strip (for speed changes)
- **Blending Mode** -- how this strip combines with strips below it:
  - **Replace** (default) -- overwrites lower strips according to influence
  - **Combine** -- intelligently combines with lower strips
  - **Add** -- adds values on top of lower strips
  - **Subtract** -- subtracts values from lower strips
  - **Multiply** -- multiplies with lower strip values
- **Auto Blend In/Out** -- smoothly fades the strip's influence at its start/end

### 3.4 Workflow: Building a Character Performance

1. Animate a **walk cycle** as an Action in the Action Editor
2. Push it down to the NLA stack (Stash or Push Down button)
3. Animate a **wave gesture** as a separate Action
4. Push it down to a higher NLA track
5. Use **Blending Mode: Add** on the wave strip so it layers on top of the walk
6. Adjust **Influence** to control how strongly the wave shows through
7. Add **Transition Strips** between actions for smooth blending
8. Scale and repeat strips as needed

This non-destructive workflow means the original walk cycle and wave gesture Actions remain unmodified. All timing, blending, and layering adjustments happen in the NLA Editor [6].

### 3.5 Reusing and Instancing Animations

When an Action is used in multiple NLA strips, those strips are **instances** of the same Action. Editing the original Action (by entering "tweak mode" on any strip) updates all instances simultaneously. This is powerful for:

- Applying the same walk cycle to multiple characters
- Reusing animation libraries across projects
- Creating animation variation through different blending and timing [6]

---

## 4. Action Slots (Blender 4.4)

### 4.1 What Changed

Blender 4.4 introduced a fundamental restructuring of the Action system called **Slotted Actions** (also referred to as **Action Slots**). This is one of the most significant animation architecture changes in Blender's history [7][8].

Previously, each Action could only animate a single data-block type (one object, one armature, etc.). In Blender 4.4, Actions can contain **multiple Slots**, where each Slot represents a distinct "target" for animation data. Multiple data-blocks can share the same Action by subscribing to different Slots within it [7].

### 4.2 How Slots Work

Each Action now contains a set of Slots. Every piece of animation data (F-Curve, keyframe) within an Action is assigned to one specific Slot. When a data-block is animated, it subscribes to both an Action and a specific Slot within that Action [7][8].

**Key concepts:**

- **Slot** -- a named target within an Action. Has a type restriction (Object, Armature, Material, etc.)
- **Action assignment** -- data-blocks are assigned to an Action and a Slot simultaneously
- **Auto-assignment** -- when you assign an Action to a data-block, Blender automatically selects an appropriate Slot based on name and type matching. If no suitable Slot exists, the Slot selector remains empty [7]
- **Type restrictions** -- since a single Action can animate multiple data-block types, type restrictions moved from the Action level to the individual Slot level [7]

### 4.3 Practical Implications

| Scenario | Before 4.4 | After 4.4 (with Slots) |
|----------|------------|------------------------|
| Animate object + its material | Two separate Actions | One Action with two Slots (one for object, one for material) |
| Character with multiple meshes | Separate Action per mesh | Single Action with a Slot per mesh |
| Animation library organization | Many small, single-target Actions | Fewer, more organized multi-Slot Actions |
| NLA strip assignment | Strip references Action | Strip references Action + Slot |

### 4.4 NLA and Constraints with Slots

NLA strips and Action Constraints have been updated to support the Slot system. When assigning an Action to an NLA strip or Action Constraint, the Slot is auto-assigned just as with normal Action assignment [7].

### 4.5 Upgrading to 4.4

Files created in earlier Blender versions are automatically upgraded. Each legacy Action receives a single Slot corresponding to its original target. The upgrade process is documented in the Blender 4.4 release notes under "Slotted Actions: Upgrading to 4.4" [8].

### 4.6 Why Action Slots Matter

Action Slots address a long-standing organizational problem in Blender animation. Complex characters often have animation spread across dozens of Actions (one per material, one per mesh, one per armature). Slots allow all of a character's animation to live in a single Action, making it easier to:

- Keep character animation organized
- Reuse and share animations across characters
- Manage NLA stacks with fewer strips
- Build animation libraries that are more intuitive to browse [7][8]

---

## 5. Rigging Foundations

### 5.1 Armatures

An **Armature** is a skeleton structure used to deform meshes. It is a special object type in Blender (Add > Armature). An Armature contains **Bones**, which are arranged in parent-child hierarchies to form kinematic chains [9].

Armatures have three interaction modes:

| Mode | Purpose |
|------|---------|
| **Object Mode** | Transform the entire armature as a single object |
| **Edit Mode** | Add, delete, and position bones; define hierarchy |
| **Pose Mode** | Animate bones; apply constraints; adjust pose |

### 5.2 Bones

Each bone has three fundamental properties:

- **Head** (root) -- the thick end of the bone, the point closest to the parent
- **Tail** (tip) -- the thin end of the bone, the point farthest from the parent
- **Roll** -- the rotation of the bone around its own axis (head-to-tail axis). Roll determines the bone's local X and Z axes, which affects how constraints and rotation channels behave [9]

Bone properties in Edit Mode:

| Property | Meaning |
|----------|---------|
| **Connected** | When enabled, the bone's head is locked to its parent's tail. Moving the parent's tail moves this bone's head. Defines bone chains. |
| **Parent** | The parent bone in the hierarchy. Children inherit transforms from parents. |
| **Inherit Rotation** | Whether the bone rotates with its parent (default: on) |
| **Inherit Scale** | How scale is inherited: Full, Fix Shear, Aligned, Average, None, None (Legacy) |
| **Local Location** | Whether location offsets are in parent space or local space |

### 5.3 Bone Types in a Rig

Professional rigs organize bones into functional categories:

| Bone Type | Purpose | Typically Visible |
|-----------|---------|-------------------|
| **Deform bones** | Actually deform the mesh via vertex groups | Hidden from animators |
| **Control bones** | Visible bones that animators manipulate | Yes -- with custom shapes |
| **Mechanism bones** | Intermediate bones that transfer motion (IK targets, pole targets, helpers) | Hidden from animators |
| **Root bone** | The top-level parent; moves the entire character | Yes |

### 5.4 Custom Bone Shapes

Any mesh object can be used as a bone's display shape in Pose Mode. This replaces the default octahedral or stick display with a recognizable widget (circles for FK controls, boxes for IK targets, arrows for pole targets, etc.). Set via Properties > Bone > Viewport Display > Custom Object [9].

---

## 6. Bone Collections

### 6.1 Replacing Bone Layers

Blender 4.0 replaced the legacy 32-slot numbered bone layer system with **Bone Collections** -- named, nestable groups of bones with no fixed limit on the number of collections [10][11].

### 6.2 Working with Bone Collections

Bone Collections are managed from the Armature Properties panel (the green bone icon). You can:

- Create, rename, and delete collections
- Assign bones to collections (select bones, press **M** in Edit or Pose mode)
- Assign a bone to **multiple collections** (**Shift+M**)
- Toggle visibility per-collection using the **eye icon**
- Toggle selectability per-collection using the **cursor icon**
- Drag-and-drop collections to reorder them [10]

### 6.3 Nested Bone Collections (Blender 4.1+)

Blender 4.1 introduced **nested (hierarchical) bone collections**. You can drag any collection onto another to make it a child. This provides multi-level organization [11]:

```
Armature
  +-- Face Controls
  |     +-- Eyes
  |     +-- Mouth
  |     +-- Brows
  +-- Body Controls
  |     +-- Spine
  |     +-- Arms
  |     +-- Legs
  +-- Deform Bones (hidden)
  +-- Mechanism (hidden)
```

Toggling visibility on a parent collection affects all children. This makes it trivial to hide all face controls at once, for example.

### 6.4 Bone Collections in Rigify

Rigify was updated alongside Bone Collections. Generated rigs now use Bone Collections instead of layers, with automatically named collections for each body region. Rigify's UI panels let you toggle collection visibility from within the 3D Viewport's sidebar [10][11].

---

## 7. Weight Painting

### 7.1 Overview

**Weight Painting** is the process of defining how much influence each bone has over each vertex of a mesh. Weights are stored in **Vertex Groups** that share names with the deform bones in the armature. A weight of 0.0 means no influence (displayed as blue), and 1.0 means full influence (displayed as red) [12].

### 7.2 Automatic Weights

When you parent a mesh to an armature with **Ctrl+P > Armature Deform > With Automatic Weights**, Blender uses a heat-diffusion algorithm to compute initial weights based on bone proximity and mesh topology. This provides a reasonable starting point for most humanoid characters but rarely produces production-quality results without manual refinement [12].

Other parenting options:

| Option | Behavior |
|--------|----------|
| **With Automatic Weights** | Computes weights using bone proximity (heat map) |
| **With Empty Groups** | Creates vertex groups for each deform bone but assigns no weights |
| **With Envelope Weights** | Uses bone envelope sizes to determine influence |

### 7.3 Entering Weight Paint Mode

1. Select the mesh
2. **Ctrl+Tab** or select Weight Paint from the mode dropdown
3. To see which bone you are painting for, also select the armature and enter Pose Mode (**Ctrl+click** the armature while in Weight Paint on the mesh)

### 7.4 Weight Paint Tools and Brushes

| Tool | Shortcut | Purpose |
|------|----------|---------|
| **Draw** | (default brush) | Paints weight value directly |
| **Blur** | | Smooths weight transitions between vertices |
| **Average** | | Sets vertices to the average weight in the brush radius |
| **Smear** | | Smears existing weights in brush stroke direction |
| **Gradient** | | Applies a linear or radial weight gradient |
| **Sample Weight** | **Ctrl+Click** | Picks the weight value under the cursor |

**Brush settings:**

- **Weight** -- the target weight value (0.0 to 1.0)
- **Radius** -- brush size in pixels
- **Strength** -- how strongly the brush applies per stroke
- **Falloff** -- curve controlling brush intensity from center to edge

### 7.5 Auto Normalize

**Auto Normalize** (found in the Tool Settings header) ensures that the total weight of all vertex groups on each vertex always sums to 1.0. When you increase weight for one bone, other bones' weights on those same vertices automatically decrease. This is critical for deformation quality -- if weights do not sum to 1.0, vertices may appear to "float" or distort incorrectly [12].

### 7.6 Common Weight Painting Workflow

1. Parent mesh to armature with Automatic Weights
2. Enter Pose Mode and test deformations by rotating bones
3. Identify problem areas (stretching, tearing, volume loss)
4. Enter Weight Paint Mode (with armature in Pose Mode)
5. Select problem bone, paint corrections
6. Use Blur brush to smooth transitions at joint boundaries
7. Enable Auto Normalize to maintain weight balance
8. Repeat testing and painting until deformation is clean

---

## 8. Rigify

### 8.1 What is Rigify?

**Rigify** is Blender's built-in automated rigging add-on. It generates complete, production-ready rigs from simple **meta-rigs** -- template skeletons that define bone positions without the complexity of the final rig. Rigify handles all IK/FK switching, control bone creation, custom widget shapes, and UI panel generation automatically [13].

Enable Rigify: Edit > Preferences > Add-ons > search "Rigify" > enable the checkbox.

### 8.2 The Meta-Rig

A meta-rig is an assembly of **rig samples** -- predefined bone chain templates (spine, limb, face, etc.) connected together. Each bone chain is identified by the `Connected` attribute and a **rig type** property that tells Rigify what kind of control rig to generate for that chain [13].

To start: **Add > Armature > Human (Meta-Rig)**. This creates a standard biped skeleton.

### 8.3 Available Meta-Rig Types

| Meta-Rig | Description |
|----------|-------------|
| **Human** | Standard biped with face, spine, arms, legs, hands, feet |
| **Basic Human** | Simplified biped without face rig |
| **Wolf** | Quadruped with digitigrade legs, tail, ears |
| **Cat** | Quadruped variation |
| **Horse** | Quadruped with hooves |
| **Shark** | Aquatic creature |
| **Bird** | Avian with wings, digitigrade legs |

### 8.4 Rigify Workflow

1. **Add meta-rig** -- Add > Armature > choose template
2. **Fit to character** -- In Edit Mode, position meta-rig bones to match character mesh proportions. Only the bone positions matter; the final rig bone positions are generated from these.
3. **Configure rig types** -- In Pose Mode, select bones and check the Properties > Bone > Rigify Type panel to see and adjust the rig type for each bone chain
4. **Generate rig** -- In the Armature Properties panel, click **Generate Rig**. Rigify creates a new armature with all control bones, mechanism bones, deform bones, constraints, drivers, and UI panels
5. **Parent mesh** -- Select mesh, then **Ctrl+Click** the generated rig, press **Ctrl+P > Armature Deform > With Automatic Weights**
6. **Refine weights** -- Enter Weight Paint mode and clean up automatic weights

### 8.5 Rigify Rig Features

A generated Rigify rig includes:

- **IK/FK switching** per limb with seamless snapping
- **Rubber hose** (bendy bone) limb options for cartoony deformation
- **Face rig** with individual controls for eyes, eyelids, brows, jaw, lips, cheeks, nose
- **Finger controls** with curl operators
- **Pivot control** on the torso for hip-based vs. chest-based movement
- **Custom shape widgets** on all control bones
- **Bone Collection organization** (4.0+) with UI visibility toggles
- **Properties panel** in the 3D Viewport sidebar (N panel) with IK/FK sliders and snap buttons

### 8.6 Customizing Rigify

Advanced users can:

- Create **custom rig types** by writing Python scripts that follow the Rigify API
- Add custom **rig samples** to the Rigify sample library
- Modify the **UI script** that Rigify generates (stored as a text data-block in the .blend file)
- Combine rig samples from different meta-rigs (e.g., human torso with animal legs)

---

## 9. Constraints

Constraints are rules applied to bones or objects that limit or control their transforms based on other objects, bones, or mathematical expressions. Constraints evaluate in stack order (top to bottom) in the Constraint Properties panel [14].

### 9.1 Motion Tracking Constraints

| Constraint | Purpose | Key Properties |
|------------|---------|----------------|
| **IK Solver** | Makes a chain of bones rotate to reach a target. The solver works backwards from the tip bone to compute rotations. | Chain Length (0=all), Target, Pole Target, Pole Angle, Iterations |
| **Damped Track** | Rotates the bone to point at the target using the shortest rotation path (single-axis tracking). Numerically stable. | Target, Track Axis |
| **Track To** | Points one axis at the target and aligns another axis to "up". More control than Damped Track but can gimbal lock. | Target, Track Axis, Up Axis |
| **Stretch To** | Points at target AND scales the bone to reach it. Creates stretchy limbs. | Target, Rest Length, Volume Preservation |

### 9.2 Transform Constraints

| Constraint | Purpose | Key Properties |
|------------|---------|----------------|
| **Copy Location** | Copies all or individual axes of the target's position | Target, Axes (X/Y/Z), Space, Influence |
| **Copy Rotation** | Copies all or individual axes of the target's rotation | Target, Axes, Mix Mode (Replace/Add/Before/After), Space |
| **Copy Scale** | Copies the target's scale | Target, Axes, Power, Additive |
| **Copy Transforms** | Copies location, rotation, and scale simultaneously | Target, Mix Mode, Space |
| **Transformation** | Maps source transform channels to destination channels with configurable ranges | Source/Destination ranges, Map From/To |

### 9.3 Limit Constraints

| Constraint | Purpose |
|------------|---------|
| **Limit Location** | Restricts movement to a min/max range per axis |
| **Limit Rotation** | Restricts rotation to a min/max range per axis |
| **Limit Scale** | Restricts scale to a min/max range per axis |
| **Limit Distance** | Keeps the bone within, outside, or on a specified distance from the target |

### 9.4 Relationship Constraints

| Constraint | Purpose | Key Properties |
|------------|---------|----------------|
| **Child Of** | Dynamically parents the bone to a target. Can be keyframed on/off. | Target, Bone, Set/Clear Inverse |
| **Floor** | Prevents the bone from passing below (or above) a target surface. Creates ground contact. | Target, Sticky, Offset, Floor Direction |
| **Action** | Drives an entire Action's animation based on a transform channel of the bone. | Target, Action, Transform Channel, Start/End Frame |
| **Armature** | Allows a bone to be influenced by multiple armature targets simultaneously | Multiple targets with individual weights |

### 9.5 IK Solver Deep Dive

Inverse Kinematics is one of the most important rigging concepts. There are two IK solvers in Blender [14]:

**Standard (iTaSC) IK:**
- Default solver for most rigs
- Set chain length to define how many bones in the chain are affected
- Use a **Pole Target** to control the plane of the IK chain (e.g., which direction the elbow or knee points)
- **Pole Angle** adjusts the twist of the chain around the target axis
- **Iterations** controls solver accuracy (higher = more accurate, slower)

**iTaSC Full Solver:**
- Advanced solver with support for multiple IK targets per chain
- Simulation mode for physically-based IK
- Rarely needed for standard character animation

**Common IK setup pattern:**

1. Create an IK target bone (not connected to the chain, positioned at the wrist or ankle)
2. Create a pole target bone (positioned in front of the elbow or knee)
3. Add IK Solver constraint to the last bone of the chain
4. Set Target to the IK target bone
5. Set Pole Target to the pole target bone
6. Adjust Pole Angle until the chain points correctly (typically requires -90 or 90 degree adjustment)

---

## 10. Shape Keys

### 10.1 Overview

**Shape Keys** store alternative vertex positions for a mesh. They allow morph-target-based deformation -- the mesh smoothly interpolates between its basis shape and any number of deformed shapes. Shape Keys are essential for facial animation, corrective shapes, and muscle deformation [15].

Shape Keys are found in the Mesh Properties panel (green triangle icon) under Shape Keys.

### 10.2 Types of Shape Keys

| Type | Description |
|------|-------------|
| **Basis** | The default shape. All other shape keys define deltas (offsets) relative to this. Always created first. |
| **Relative** (default) | Each shape key is defined as an offset from the Basis and controlled by an independent Value slider (0.0 to 1.0 by default). Multiple relative shape keys can be active simultaneously. |
| **Absolute** | Shape keys are played back in sequence based on an Evaluation Time value. Used for predetermined shape animations like a flower opening. |

### 10.3 Creating Shape Keys

1. Add a **Basis** shape key (this saves the current mesh shape)
2. Add additional shape keys (click **+** button)
3. Select a non-Basis shape key and enter Edit Mode
4. Modify the mesh vertices
5. Exit Edit Mode -- the modifications are stored as the shape key's deformation
6. Adjust the **Value** slider to blend between Basis and the modified shape

### 10.4 Shape Keys for Facial Animation

Common facial shape keys (based on the Facial Action Coding System / FACS):

| Shape Key Name | Deformation |
|----------------|-------------|
| **brow_raise_L / R** | Raise left/right eyebrow |
| **brow_lower_L / R** | Lower/furrow brows |
| **eye_blink_L / R** | Close eyelids |
| **eye_wide_L / R** | Open eyes wide |
| **mouth_open** | Open jaw |
| **mouth_smile_L / R** | Raise lip corners |
| **mouth_frown_L / R** | Lower lip corners |
| **mouth_pucker** | Pucker/kiss lips |
| **cheek_puff_L / R** | Inflate cheeks |
| **nose_wrinkle** | Scrunch nose |

### 10.5 Corrective Shape Keys

Corrective shape keys fix deformation problems that occur at extreme bone rotations. For example, when an elbow bends past 90 degrees, the mesh might collapse. A corrective shape key restores proper volume at that rotation, driven by the bone's rotation angle via a Driver [15].

---

## 11. Drivers and Expressions

### 11.1 What are Drivers?

**Drivers** connect one property to another through a mathematical relationship. Instead of keyframing a property directly, you define a rule: "this property's value depends on that other property." Drivers enable **procedural animation** -- animation that responds dynamically to changes rather than following a fixed timeline [16].

A driven property displays with a **purple background** in the UI (as opposed to the yellow/green of keyframed properties).

### 11.2 Adding a Driver

- **Right-click** a property > **Add Driver**
- **Ctrl+D** over a property to add a single driver
- **Ctrl+D** then drag to another property for a quick copy-driver relationship

### 11.3 Driver Types

| Driver Type | Description |
|-------------|-------------|
| **Averaged Value** | Averages the values of all input variables |
| **Sum Values** | Sums all input variables |
| **Scripted Expression** | Evaluates a Python expression using variables as inputs |
| **Minimum Value** | Takes the minimum of all input variables |
| **Maximum Value** | Takes the maximum of all input variables |

### 11.4 Scripted Expressions

Scripted Expressions evaluate Python code to compute the driven value. Variables are defined in the Driver editor and referenced by name in the expression [16].

Available functions in expressions include:

| Function | Purpose |
|----------|---------|
| `sin(x)`, `cos(x)`, `tan(x)` | Trigonometric functions |
| `asin(x)`, `acos(x)`, `atan(x)`, `atan2(y, x)` | Inverse trigonometric |
| `sqrt(x)`, `pow(x, y)` | Power functions |
| `abs(x)`, `min(x, y)`, `max(x, y)` | Value functions |
| `clamp(x, min, max)` | Clamps x to range |
| `lerp(a, b, t)` | Linear interpolation |
| `log(x)`, `exp(x)` | Logarithmic/exponential |
| `radians(x)`, `degrees(x)` | Angle conversion |
| `noise.random()` | Random value (0-1) |
| `frame` | Current frame number |

**Example expressions:**

```
# Oscillating motion
sin(frame * 0.1) * 2.0

# Clamped bone rotation to shape key
clamp(var * 2.0, 0.0, 1.0)

# Conditional (if bone X > 0, drive Y)
var if var > 0 else 0

# Breathing cycle
(sin(frame * 0.15) + 1) * 0.5
```

### 11.5 Common Driver Patterns

**Shape Key driven by bone rotation:**
1. Add driver to shape key Value
2. Add a variable, set to Transform Channel
3. Set target to armature, specific bone, Rotation channel
4. Set expression: `clamp(var * -1.5, 0.0, 1.0)` (negative because rotation direction may be inverted)

**Procedural eye blink:**
1. Add driver to eye blink shape key
2. Use expression: `1.0 if (frame % 72 < 3) else 0.0` (blink for 3 frames every 72 frames at 24fps = blink every 3 seconds)

**Scale-compensated stretch:**
1. Drive bone scale based on distance to target
2. Expression: `(var / rest_length)` where `var` is the current distance

---

## 12. Walk Cycle Tutorial

### 12.1 The Four Key Poses

A walk cycle contains four key poses that repeat in a mirrored pattern. In a standard 24-frame cycle at 24fps (1 second per cycle) [17]:

| Pose | Frames | Body Position | Weight Distribution |
|------|--------|---------------|---------------------|
| **Contact** | 1 and 13 | Front foot heel strikes ground, back foot toe pushes off. Legs at widest spread. Arms at widest swing (opposite to legs). | Balanced between both feet |
| **Down** | 4 and 16 | Body at lowest point. Front knee bends to absorb weight. Back foot lifts off. | Shifting to front leg |
| **Passing** | 7 and 19 | Body rises. Back leg swings forward past the planted leg (knees close together). Planted leg straight. | Single leg (planted leg) |
| **Up** | 10 and 22 | Body at highest point. Planted leg pushes body up. Swing leg reaches forward. | Planted leg pushes off |

### 12.2 Step-by-Step Procedure

**Setup:**
1. Open a scene with a rigged character (Rigify rig recommended)
2. Set timeline to 24 frames
3. Enable **Cyclic** F-Curve modifier on all channels after completion

**Contact Pose (Frame 1):**
1. Position the left foot forward, heel touching ground, toes slightly up
2. Position the right foot behind, toes on ground, heel lifted
3. Tilt the hips slightly down on the left (forward) side
4. Rotate the spine slightly to the right
5. Swing the right arm forward, left arm back (counter to legs)
6. Tilt the head slightly forward
7. Key all bones (**A** to select all, **I** > Whole Character)

**Down Pose (Frame 4):**
1. Lower the hips (Y-axis down)
2. Bend the left (front) knee more to absorb impact
3. Begin lifting the right (back) foot
4. Arms pass through neutral
5. Head level
6. Key all bones

**Passing Pose (Frame 7):**
1. Raise hips back to neutral height
2. Straighten the left (planted) leg
3. Bring the right leg forward, knee bent, foot passing the planted leg
4. Arms near neutral, swinging through
5. Key all bones

**Up Pose (Frame 10):**
1. Raise hips to highest point
2. Left leg straight, pushing up on toes
3. Right leg reaching forward but not yet touching down
4. Arms at moderate swing (opposite to legs)
5. Key all bones

**Mirror for Second Half (Frames 13-22):**
Copy frames 1, 4, 7, 10 to frames 13, 16, 19, 22 but with left/right reversed. In Rigify, you can use **Ctrl+C** then **Ctrl+Shift+V** (Paste X-Flipped Pose) to mirror poses.

### 12.3 Polish Pass

After the four key poses are set:

1. Play back and check overall timing
2. Add **breakdowns** between keys for overlap and secondary motion
3. Offset arm swing slightly behind leg motion (drag, follow-through)
4. Add subtle head bob and torso twist
5. Add toe roll on the pushing foot
6. Apply **Cyclic** F-Curve modifiers (Shift+E > Make Cyclic in Graph Editor) for infinite looping

---

## 13. Character Rigging Walkthrough with Rigify

### 13.1 Prerequisites

- Character mesh in T-pose or A-pose
- Mesh topology with proper edge loops at joints (elbows, knees, shoulders, hips, fingers, neck)
- Rigify add-on enabled

### 13.2 Step-by-Step Process

**Step 1: Add the Human Meta-Rig**
- **Add > Armature > Human (Meta-Rig)**
- Scale and position the meta-rig to roughly match the character's proportions in Object Mode

**Step 2: Fit Bones to Character**
- Enter Edit Mode on the meta-rig
- Working from the **spine outward**, align each bone to the character mesh:
  - Spine bones centered on the torso, following the curve of the back
  - Shoulder bones at the shoulder joint centers
  - Arm bones: upper arm, forearm, hand, centered on the respective mesh geometry
  - Finger bones centered inside each finger
  - Leg bones: thigh, shin, foot, toes centered on joints
  - Head and neck bones centered on the neck/head
- **Critical:** Bone joint positions (heads and tails) must be at the **center of rotation** for each joint. The elbow bone joint should be at the point where the arm actually bends.

**Step 3: Adjust Bone Roll**
- Select all bones (**A**) and recalculate roll: **Shift+N** > choose an appropriate method (Global +Z or Active Element)
- Check bone rolls in the N-panel; incorrect roll causes IK flipping and rotation artifacts

**Step 4: Configure Rigify Options**
- In Pose Mode, check bone properties for each chain to ensure correct rig types
- Adjust options like limb rotation axis, IK stretch, FK hinge, rubber hose segments

**Step 5: Generate the Rig**
- In Armature Properties, click **Generate Rig**
- A new armature named "rig" is created with all controls, mechanisms, and a UI script

**Step 6: Parent the Mesh**
- Select the mesh, then **Shift+Click** the generated rig
- **Ctrl+P > Armature Deform > With Automatic Weights**

**Step 7: Refine Weights**
- Test deformations in Pose Mode
- Enter Weight Paint Mode to fix problem areas
- Pay special attention to: shoulder deformation, hip creasing, knee/elbow bending, hand deformation

**Step 8: Add Shape Keys (Optional)**
- Create corrective shape keys for extreme poses
- Drive them with bone rotation drivers
- Add facial shape keys if using the face rig

---

## 14. Digitigrade Rigging

### 14.1 What is Digitigrade Locomotion?

**Digitigrade** animals walk on their toes rather than the flat of their feet. This includes canines (wolves, dogs, foxes), felines (cats, lions), birds, and many dinosaurs. The visible "backward-bending knee" on these animals is actually the **ankle joint** -- the real knee is higher up, often hidden within the body mass [18].

### 14.2 Bone Chain for Digitigrade Legs

A digitigrade leg requires a **three-segment** IK chain (compared to two segments for plantigrade/human legs):

```
Hip Joint
  |
  +-- Upper Leg (femur) -- real knee bends FORWARD
        |
        +-- Lower Leg (tibia) -- real ankle bends BACKWARD
              |
              +-- Metatarsal (foot) -- elevated, connecting to toes
                    |
                    +-- Toes -- contact ground
```

### 14.3 Rigify Digitigrade Setup

Rigify includes a dedicated `limbs.super_limb` rig type with a digitigrade option [18]:

1. Add a Human Meta-Rig or start from a Wolf/Cat meta-rig
2. In Edit Mode, add an extra bone segment to each leg chain (upper leg, lower leg, foot, toes = 4 bones instead of 3)
3. In Pose Mode, select the upper leg bone and set the Rigify Type to `limbs.super_limb`
4. In the rig type options, set **Limb Type: Paw** (not Leg or Arm)
5. Generate the rig

The generated rig includes:

- IK target at the toe tip for ground-plane contact
- Automatic toe roll control
- Three-bone IK chain with proper joint angle management
- FK/IK switching

### 14.4 Reverse Foot Setup

The **reverse foot** technique uses a chain of bones that evaluates in reverse order (from toe to heel to ankle) to provide intuitive ground-contact controls:

```
IK Target (at toe)
  |
  +-- Heel Roll Bone (lifts from heel)
        |
        +-- Toe Roll Bone (lifts from toe)
              |
              +-- Ball Roll Bone (pivots on ball of foot)
                    |
                    +-- IK Target for leg chain
```

This setup allows the animator to:

- Plant the foot and have it stick to the ground
- Roll from heel to toe naturally during a walk
- Lift the heel while keeping toes planted
- Lift from the toe tip for push-off

### 14.5 Practical Tips for Digitigrade Rigs

- Keep IK chain length to 3 (upper leg, lower leg, metatarsal)
- Place the IK pole target in **front** of the knee (same as human legs)
- Use corrective shape keys at the ankle joint to prevent mesh collapse during extreme flexion
- For furry characters, ensure the metatarsal bone is long enough to account for fur volume
- Test locomotion early -- digitigrade walk cycles have a distinctly different rhythm than plantigrade [18]

---

## 15. Physics Simulations

### 15.1 Overview

Blender provides several physics simulation systems accessible from the Physics Properties panel. Each system computes physical behavior over a frame range and stores the results in a **cache** that can be baked for deterministic playback [19].

### 15.2 Mantaflow (Fluid, Smoke, and Fire)

**Mantaflow** is an open-source fluid simulation framework integrated into Blender for gas (smoke and fire) and liquid simulations [19].

**Domain Setup:**

Every Mantaflow simulation requires a **Domain** object -- a bounding box that defines the simulation space. The domain must be larger than all objects participating in the simulation.

| Component | Purpose |
|-----------|---------|
| **Domain** | Bounding volume for the entire simulation. Contains resolution, timing, and cache settings. |
| **Flow** | Objects that emit fluid, smoke, or fire into the domain. |
| **Effector** | Objects that interact with the simulation (collision obstacles, guides). |

**Gas Simulations (Smoke and Fire):**

| Setting | Purpose | Typical Values |
|---------|---------|----------------|
| **Resolution Divisions** | Voxel grid resolution. Higher = more detail, exponentially more memory/time. | 32-64 for preview, 128-256+ for final |
| **Noise Method** | Wavelet noise for adding small-scale detail at render time | Wavelet |
| **Time Scale** | Simulation speed multiplier | 1.0 = real time |
| **Vorticity** | Amount of turbulent swirling | 0.0-1.0 |
| **Dissolve** | Whether smoke/fire dissipates over time | Enable for most effects |
| **Dissolve Time** | Frames until dissipation | 25-80 for typical smoke |

**Liquid Simulations:**

Liquid simulations have three independently bakeable components:

1. **Liquid particles** -- the primary simulation
2. **Mesh** -- the surface mesh generated from particle data
3. **Secondary particles** -- Spray, Foam, and Bubble particles for surface detail

### 15.3 Rigid Body Physics

The **Rigid Body** system (based on the Bullet physics engine) simulates solid objects that collide, stack, tumble, and bounce. Objects maintain their shape during simulation [19].

| Object Type | Behavior |
|-------------|----------|
| **Active** | Fully simulated -- responds to gravity and collisions |
| **Passive** | Acts as an immovable collision surface (ground planes, walls) |

Key properties:

| Property | Purpose |
|----------|---------|
| **Mass** | Weight of the object. Heavier objects push lighter ones. |
| **Friction** | Surface friction coefficient (0=ice, 1=rubber) |
| **Bounciness** (Restitution) | How much energy is preserved on collision (0=dead stop, 1=perfect bounce) |
| **Collision Shape** | The simplified shape used for collision detection: Convex Hull, Mesh, Box, Sphere, Capsule, Cylinder, Cone |
| **Damping (Translation)** | Resistance to linear motion (air resistance) |
| **Damping (Rotation)** | Resistance to rotational motion |

### 15.4 Soft Body Physics

**Soft Body** simulation makes objects deform under forces while trying to maintain their shape. Used for jelly, rubber, cloth-like behavior, bouncing objects, and organic deformation [19].

Key properties:

| Property | Purpose |
|----------|---------|
| **Mass** | Object mass |
| **Friction** | Surface friction |
| **Goal (Stiffness)** | How strongly vertices try to return to their original position (0=fully simulated, 1=pinned) |
| **Edges (Springs)** | Use mesh edges as springs connecting vertices |
| **Push / Pull** | Spring compression/extension stiffness |
| **Damping** | Spring oscillation damping |
| **Bending** | Resistance to bending between connected edges |
| **Self Collision** | Prevents the soft body mesh from passing through itself |

### 15.5 Particle Systems

Blender's legacy particle system (Properties > Particles) supports two particle types [19]:

| Type | Purpose |
|------|---------|
| **Emitter** | Emits particles over time. Used for rain, sparks, dust, magic effects, snow. |
| **Hair** | Grows strands from the mesh surface. Used for hair, fur, grass, fibers. |

Emitter particle settings:

| Setting | Purpose |
|---------|---------|
| **Number** | Total particles emitted |
| **Lifetime** | Frames each particle exists |
| **Emit From** | Vertices, Faces, or Volume |
| **Velocity** | Initial particle velocity (Normal, Object, Random) |
| **Physics Type** | Newtonian (standard), Keyed (follow path), Boids (flocking/swarming), Fluid |
| **Force Field Weights** | Influence from wind, turbulence, vortex, and other force fields |
| **Render As** | Halo, Object, Collection, Path (for hair) |

**Boids Physics** deserves special mention for creature simulation -- it implements flocking behavior (birds, fish, insects) with rules for separation, alignment, cohesion, and goal-seeking [19].

---

## 16. Cloth Simulation

### 16.1 Overview

The **Cloth** simulation system models flexible fabric behavior. It computes how a mesh deforms under gravity, forces, and collisions with other objects and itself [20].

### 16.2 Physical Properties

| Property | Purpose | Typical Values |
|----------|---------|----------------|
| **Quality Steps** | Solver substeps per frame. Higher = more accurate, slower. | 5 for general use, 10-15 for fast-moving cloth |
| **Mass** | Fabric weight per area (kg/m^2) | 0.3 (silk) to 1.0 (denim) |
| **Air Viscosity** | Air resistance/drag | 1.0 for standard; higher for parachute effects |
| **Stiffness (Structural)** | Resistance to stretching along fabric threads | 5-15 (silk) to 40-80 (canvas) |
| **Stiffness (Shear)** | Resistance to diagonal distortion | Similar range to structural |
| **Stiffness (Bending)** | Resistance to folding/creasing | 0.01-0.5 (draping silk) to 5-50 (stiff cardboard) |
| **Damping (Spring)** | How quickly spring oscillations settle | 0-50; higher = less jiggle |
| **Damping (Compression)** | Damping for compression forces | 0-50 |

### 16.3 Presets

Blender includes fabric presets that configure realistic values for common materials:

| Preset | Characteristics |
|--------|----------------|
| **Cotton** | Medium stiffness, moderate draping |
| **Denim** | High stiffness, minimal draping |
| **Leather** | Very stiff, minimal flex |
| **Rubber** | Elastic, bouncy |
| **Silk** | Very low stiffness, flowing drape |

### 16.4 Collision Settings

**Object Collision** (the cloth interacting with other objects):

| Setting | Purpose |
|---------|---------|
| **Quality** | Number of collision substeps (higher = more accurate contact) |
| **Distance** | Minimum distance between cloth surface and collision object (prevents penetration) |
| **Impulse Clamping** | Limits collision force to prevent explosive corrections |
| **Single Sided** | Only detect collision from one side of the collision object |

**Self-Collision** (the cloth interacting with itself):

| Setting | Purpose |
|---------|---------|
| **Enable** | Toggle self-collision computation |
| **Quality** | Solver quality for self-collision (should be >= overall Quality) |
| **Distance** | Minimum distance between cloth faces to prevent self-penetration |

### 16.5 Pinning

Vertices can be **pinned** (fixed in place) using a vertex group. The vertex group's weights control how strongly each vertex is pinned (1.0 = fully fixed, 0.0 = fully simulated). This is how you attach cloth to a character's shoulders, waist, or wrists while letting the rest flow freely [20].

### 16.6 Wind

Wind effects are created using **Force Fields** (Add > Force Field > Wind) rather than cloth simulation settings directly. The wind force field has:

- **Strength** -- wind force magnitude
- **Flow** -- how much the wind follows the object's rotation
- **Noise** -- adds turbulence to the wind
- **Seed** -- random seed for noise variation

### 16.7 Cloth Workflow Tips

1. Start with a **low-polygon proxy** mesh for initial simulation testing
2. Use **Cloth > Shape > Pin Group** to define fixed areas
3. Bake the simulation (**Cache > Bake**) before rendering to ensure deterministic results
4. For character clothing, add the character body as a **Collision** object (Physics > Collision)
5. Enable **Self-Collision** for close-fitting garments (capes, skirts, loose sleeves)
6. Use **Shrink Wrap** modifier after cloth sim to prevent minor clipping artifacts

---

## 17. Hair Particles

### 17.1 Overview

Hair particles grow strands from a mesh surface. They are used for character hair, animal fur, grass, eyelashes, eyebrows, and any fibrous material. Hair particles do not emit over time -- they exist as a static set of strands that can optionally have dynamics [21].

### 17.2 Particle Hair Setup

1. Select the mesh (typically the character's head or body)
2. Add a Particle System (Properties > Particles > **+**)
3. Set Type to **Hair**
4. Set **Number** -- use as few parent strands as possible for control (500-2000 for a typical hairstyle)
5. Set **Hair Length** -- base strand length
6. Enter **Particle Edit Mode** to comb, cut, and style individual strands

### 17.3 Grooming Tools (Particle Edit Mode)

| Tool | Shortcut | Purpose |
|------|----------|---------|
| **Comb** | | Push strands in the brush direction |
| **Smooth** | | Even out strand direction differences |
| **Add** | | Add new guide strands |
| **Length** | | Grow or shrink strands |
| **Puff** | | Lift strands away from the surface |
| **Cut** | | Trim strands at the brush position |
| **Weight** | | Paint soft-body weights on strands (for dynamics pinning) |

### 17.4 Children Particles

**Children** multiply the visible strand count without increasing the number of manually-groomed parent strands. There are two interpolation methods [21]:

| Method | Behavior |
|--------|----------|
| **Simple** | Children are generated around each parent strand in a uniform pattern |
| **Interpolated** | Children are generated between parent strands, creating smoother, more natural density distribution |

Key child settings:

| Setting | Purpose |
|---------|---------|
| **Display Amount** | Children visible in viewport (keep low for performance) |
| **Render Amount** | Children rendered (set high for final quality) |
| **Clump** | How much children bunch together toward parent tips (negative = spread out, positive = clump in) |
| **Roughness (Uniform)** | Random positional offset for natural variation |
| **Roughness (Endpoint)** | Random offset at strand tips only |
| **Roughness (Random)** | Per-strand random length/direction variation |

### 17.5 Hair Dynamics

Enabling **Hair Dynamics** (checkbox in the Particle Properties panel) allows hair to respond to physics -- gravity, wind, and motion [21]:

| Setting | Purpose |
|---------|---------|
| **Mass** | Strand mass (heavier = less responsive to forces) |
| **Stiffness** | How rigidly strands hold their groomed shape |
| **Damping** | How quickly oscillations settle |
| **Internal Friction** | Friction between hair strands |
| **Collision** | Whether hair collides with other objects |

### 17.6 Hair Rendering

Hair can be rendered in Cycles and Eevee using the **Principled Hair BSDF** shader, which provides physically-accurate hair rendering with:

- **Color / Melanin** -- hair color via direct color or melanin concentration
- **Roughness** -- surface roughness of the strand cuticle
- **Radial Roughness** -- roughness variation around the strand circumference
- **Coat** -- clear coat layer for wet/glossy look
- **IOR** -- index of refraction (1.55 is physically accurate for human hair)
- **Random Color** -- per-strand color variation for natural look

### 17.7 Geometry Nodes Hair (Blender 3.3+)

Blender 3.3 introduced a new **Curves** object type and hair editing system based on **Geometry Nodes**. This newer system (accessed via Sculpt Mode on Curves objects) offers:

- Better viewport performance
- Procedural hair generation via node graphs
- Separation of hair data from particle systems
- More intuitive sculpting tools

The legacy particle hair system and the new Curves-based system coexist in Blender 4.4. The Curves system is the future direction [21].

---

## 18. Advanced Animation Techniques

### 18.1 Pose Libraries

Blender's **Pose Library** system (Asset Browser-based in 4.0+) allows animators to save and recall predefined poses:

1. Pose the character in Pose Mode
2. Select the bones you want to include
3. **Pose > Pose Library > Create Pose Asset**
4. The pose appears in the Asset Browser under the current file's library
5. To apply: select target bones, drag the pose from the Asset Browser, or right-click > Apply Pose

Pose Libraries are invaluable for:
- Storing commonly-used facial expressions
- Building libraries of hand poses (fist, point, spread, grip, pinch)
- Saving reference poses for animation blocking
- Sharing poses across multiple shots and characters with similar rigs

### 18.2 Animation Principles in Practice

The 12 Principles of Animation (Disney, Frank Thomas and Ollie Johnston) map directly to Blender tools:

| Principle | Blender Implementation |
|-----------|----------------------|
| **Squash and Stretch** | Scale keyframes on bones, Shape Keys for mesh-level deformation, bendy bones for hose-like stretching |
| **Anticipation** | Extra keyframes before main action; Back easing interpolation for wind-up |
| **Staging** | Camera placement, lighting, scene composition in Layout workspace |
| **Straight Ahead / Pose to Pose** | Straight Ahead: frame-by-frame in Grease Pencil. Pose to Pose: block key poses first, then in-between |
| **Follow Through / Overlapping Action** | Offset timing on secondary elements (hair, clothing, tail) using the Dope Sheet; time secondary bones 2-4 frames behind primaries |
| **Slow In / Slow Out** | Bezier interpolation handles; easing types (Sinusoidal, Quadratic, etc.) |
| **Arcs** | Check motion paths (Pose > Motion Paths) to verify arcs of motion; adjust in Graph Editor |
| **Secondary Action** | NLA layering: base action on lower track, secondary action (breathing, blinking, weight shift) on higher tracks |
| **Timing** | Dope Sheet retiming; keyframe spacing controls speed perception |
| **Exaggeration** | Scale up motion arcs, extend poses beyond realistic limits, use Back easing for overshoot |
| **Solid Drawing** | Proper mesh topology, weight painting, correct bone roll for consistent volumes |
| **Appeal** | Character design, silhouette clarity (check with Wireframe overlay), expressive shape key ranges |

### 18.3 Motion Paths

**Motion Paths** visualize the trajectory of bones or objects over time as lines in the 3D Viewport:

1. Select bones in Pose Mode
2. **Pose > Motion Paths > Calculate** (or **Object > Motion Paths > Calculate** for objects)
3. Colored dots show frame positions along the path
4. Verify arcs of motion -- clean arcs indicate smooth, natural movement
5. Erratic or jagged paths indicate problems to fix in the Graph Editor

| Setting | Purpose |
|---------|---------|
| **Frame Range** | Calculate for scene range or around current frame |
| **Display Path** | Show path in 3D Viewport |
| **Frame Numbers** | Display frame numbers along the path |
| **Keyframes** | Highlight keyframe positions on the path |
| **Keyframe Numbers** | Show keyframe numbers |

### 18.4 Bendy Bones

**Bendy Bones** (B-Bones) subdivide a single bone into multiple curved segments, providing smooth deformation without adding extra bones to the hierarchy:

| Property | Purpose |
|----------|---------|
| **Segments** | Number of subdivisions (2-32; more = smoother curve) |
| **Curve In X/Y** | Curvature at the bone's head |
| **Curve Out X/Y** | Curvature at the bone's tail |
| **Roll In/Out** | Twist at each end |
| **Scale In/Out** | Taper at each end |
| **Ease In/Out** | Controls the curvature distribution (0=even, 1=concentrated at end) |
| **Custom Handle** | Use specific bones as curve handles (Bezier-like control) |

Bendy Bones are used for:
- Rubber hose limbs (cartoony arm/leg deformation)
- Flexible spines and tails
- Tongue rigs
- Smooth neck deformation
- Facial muscle simulation (simplified)

### 18.5 Armature Display Types

| Display Type | Appearance | Use Case |
|--------------|------------|----------|
| **Octahedral** (default) | Diamond shapes | General purpose |
| **Stick** | Thin lines with dots at head/tail | Dense rigs where octahedral is cluttered |
| **B-Bone** | Shows bendy bone curvature | Rigs using B-Bones |
| **Envelope** | Spheres showing bone influence radius | Envelope-based skinning visualization |
| **Wire** | Minimal wireframe | Overlay on top of custom shapes |
| **Custom** | Uses the bone's Custom Object | Production rigs with artist-friendly widgets |

### 18.6 Layered Actions Workflow (Blender 4.4+)

The **Layered Actions** system introduced in Blender 4.4 alongside Action Slots allows animation to be organized into layers within a single Action, similar to how NLA strips layer but at the Action level [22]:

- Each Action can contain multiple **Layers**
- Layers stack with configurable blending modes
- Animators can work on body mechanics on one layer and facial animation on another
- Layers within an Action are more lightweight than NLA strips for iterative animation work
- This is designed for the "pose-to-pose then layer refinement" workflow common in production animation

### 18.7 Force Fields for Simulation

Force fields influence physics simulations. They are added as objects (Add > Force Field):

| Force Field | Effect | Common Use |
|-------------|--------|------------|
| **Wind** | Constant directional force | Wind effects on cloth, hair, particles |
| **Turbulence** | Random chaotic force | Adding natural variation to smoke, fire, particles |
| **Vortex** | Spinning force around the object axis | Tornado, whirlpool, spiral effects |
| **Magnetic** | Attracts or repels based on charge | Stylized effects, abstract motion |
| **Harmonic** | Spring-like restoring force | Keeping particles near a point |
| **Charge** | Radial attraction/repulsion | Particle clustering, explosion forces |
| **Lennard-Jones** | Molecular interaction force | Inter-particle collision avoidance |
| **Texture** | Force derived from a texture | Directional variation in force (terrain-driven wind) |
| **Curve Guide** | Forces particles along a curve | Predefined particle paths, channeled flow |
| **Boid** | AI-driven flocking forces | Bird flocks, fish schools, insect swarms |
| **Drag** | Slows particle velocity | Air/water resistance |
| **Fluid Flow** | Guides fluid simulation | Directing smoke and liquid flow |

Force fields have shared properties:
- **Strength** -- magnitude of the force
- **Flow** -- directional bias based on object rotation
- **Noise** -- randomness in force application
- **Falloff** -- how force diminishes with distance (Power, Linear, Inverse Square, Cone, Tube)
- **Effector Group** -- which particles/simulations are affected

---

## 19. Common Pitfalls and Practical Tips

### 18.1 Animation Pitfalls

| Pitfall | Cause | Solution |
|---------|-------|----------|
| **Gimbal lock** | Euler rotation at 90-degree extremes loses a degree of freedom | Use Quaternion (WXYZ) rotation mode for bones with wide rotation ranges |
| **Counter-animation / double transform** | Bone inherits parent rotation AND has its own rotation keyframed | Check Inherit Rotation setting; use constraints correctly |
| **Interpolation overshoot** | Bezier handles cause values to exceed min/max | Switch to Auto Clamped handles or add intermediate keyframes |
| **Cycle pop** | First and last frames of a walk cycle do not match | Ensure identical poses; use Cyclic F-Curve modifier with Repeat mode |
| **NLA evaluation order** | Strips overriding in unexpected ways | Check track order (lower tracks evaluate first); verify Blend Mode |

### 18.2 Rigging Pitfalls

| Pitfall | Cause | Solution |
|---------|-------|----------|
| **IK flip** | Pole target position or pole angle incorrect | Reposition pole target; adjust pole angle by +/- 90 degrees |
| **Broken deformation after generating** | Mesh parented to meta-rig instead of generated rig | Delete parent; re-parent mesh to the generated rig |
| **Weight painting on wrong vertex group** | Active bone and active vertex group mismatch | Always select the bone first in Pose Mode before painting |
| **Bone roll errors** | Incorrect bone roll causes twist artifacts | Recalculate bone roll (Shift+N in Edit Mode) |
| **Scale inheritance issues** | Non-uniform parent scale propagates to children | Set Inherit Scale to "Aligned" or "None" on problem bones |

### 18.3 Simulation Pitfalls

| Pitfall | Cause | Solution |
|---------|-------|----------|
| **Cloth explodes** | Timestep too large for collision geometry | Increase Quality Steps; decrease time step; simplify collision mesh |
| **Fluid simulation is empty** | Flow object is outside the domain | Ensure flow objects are fully inside the domain bounding box |
| **Rigid body falls through floor** | Floor not set as Passive rigid body | Add Rigid Body > Passive to ground plane; set correct collision shape |
| **Hair dynamics jitter** | Timestep too large or damping too low | Increase substeps; increase damping; decrease mass |
| **Simulation changes on replay** | Cache not baked | Always bake simulations (Cache > Bake) for deterministic results |

### 18.4 Performance Tips

- **Cloth:** Use a low-poly proxy for simulation, then apply a Subdivision Surface modifier above the Cloth modifier for smooth rendering
- **Fluid:** Start at Resolution Divisions 32-64 for testing; only increase for final bake
- **Hair:** Keep parent strand count low (500-2000); use Children for density
- **Rigid Body:** Use simple collision shapes (Box, Sphere) instead of Mesh for complex objects
- **General:** Bake simulations to disk (not memory) for large frame ranges
- **Animation:** Use proxy armatures or Simplify (Render Properties > Simplify) during viewport playback for better FPS

---

## 19. Sources

1. Blender Foundation. "F-Curves -- Introduction." *Blender Manual*. https://docs.blender.org/manual/en/latest/editors/graph_editor/fcurves/introduction.html
2. Blender Foundation. "Release Notes 2.71 -- Animation." *Blender Developer Wiki*. https://archive.blender.org/wiki/2015/index.php/Dev:Ref/Release_Notes/2.71/Animation/
3. Penner, Robert. "Robert Penner's Easing Equations." Referenced in Blender's F-Curve interpolation system. http://robertpenner.com/easing/
4. Blender Foundation. "Animation Editors." *Blender Manual*. https://docs.blender.org/manual/en/latest/animation/animation_editors.html
5. Blender Foundation. "Dope Sheet." *Blender Manual*. https://docs.blender.org/manual/en/latest/editors/dope_sheet/introduction.html
6. Blender Foundation. "NLA Editor -- Introduction." *Blender Manual*. https://docs.blender.org/manual/en/latest/editors/nla/introduction.html
7. Blender Foundation. "Actions." *Blender Manual*. https://docs.blender.org/manual/en/latest/animation/actions.html
8. Blender Foundation. "Slotted Actions: Upgrading to 4.4." *Blender Developer Documentation*. https://developer.blender.org/docs/release_notes/4.4/upgrading/slotted_actions/
9. Blender Foundation. "Armatures." *Blender Manual*. https://docs.blender.org/manual/en/latest/animation/armatures/index.html
10. Blender Foundation. "Blender 4.0: Animation & Rigging." *Blender Developer Documentation*. https://developer.blender.org/docs/release_notes/4.0/animation_rigging/
11. Blender Foundation. "Blender 4.1: Animation & Rigging -- Bone Collections." *Blender Developer Documentation*. https://developer.blender.org/docs/release_notes/4.1/animation_rigging/
12. Blender Foundation. "Weight Paint -- Introduction." *Blender Manual*. https://docs.blender.org/manual/en/latest/sculpt_paint/weight_paint/introduction.html
13. Blender Foundation. "Rigify." *Blender Manual*. https://docs.blender.org/manual/en/latest/addons/rigging/rigify/index.html
14. Blender Foundation. "Constraints." *Blender Manual*. https://docs.blender.org/manual/en/latest/animation/constraints/index.html
15. Blender Foundation. "Shape Keys." *Blender Manual*. https://docs.blender.org/manual/en/latest/animation/shape_keys/index.html
16. Blender Foundation. "Drivers." *Blender Manual*. https://docs.blender.org/manual/en/latest/animation/drivers/index.html
17. Williams, Richard. *The Animator's Survival Kit*. Faber & Faber, 2001. Walk cycle timing and poses.
18. Blender Artists Community. "Digitigrade Rigging Techniques." https://blenderartists.org/t/help-trying-to-use-rigify-on-a-digitigrade-character/642148
19. Blender Foundation. "Physics." *Blender Manual*. https://docs.blender.org/manual/en/latest/physics/index.html
20. Blender Foundation. "Cloth Simulation -- Physical Properties." *Blender Manual*. https://docs.blender.org/manual/en/latest/physics/cloth/settings/physical_properties.html
21. Blender Foundation. "Hair Particles." *Blender Manual*. https://docs.blender.org/manual/en/latest/physics/particles/hair/index.html
22. Blender Foundation. "Blender 4.4: Animation & Rigging." *Blender Developer Documentation*. https://developer.blender.org/docs/release_notes/4.4/animation_rigging/
