# Compositing, Post-Production & Video

Module: **COMP-POST-VID** | Series: Blender User Manual | Status: Reference Document

---

## Table of Contents

1. [Compositor Workspace and Architecture](#1-compositor-workspace-and-architecture)
2. [Render Passes](#2-render-passes)
3. [Multi-Layer EXR Workflow](#3-multi-layer-exr-workflow)
4. [Key Compositor Nodes](#4-key-compositor-nodes)
5. [Practical Compositing Workflow](#5-practical-compositing-workflow)
6. [Color Grading Fundamentals](#6-color-grading-fundamentals)
7. [Video Sequence Editor (VSE)](#7-video-sequence-editor-vse)
8. [VSE Editing Techniques](#8-vse-editing-techniques)
9. [H.265/HEVC Codec Support](#9-h265hevc-codec-support)
10. [Audio Synchronization](#10-audio-synchronization)
11. [Motion Tracking](#11-motion-tracking)
12. [VFX Compositing with Tracked Footage](#12-vfx-compositing-with-tracked-footage)
13. [Grease Pencil](#13-grease-pencil)
14. [2D/3D Hybrid Animation Workflows](#14-2d3d-hybrid-animation-workflows)
15. [Common Pitfalls and Practical Tips](#15-common-pitfalls-and-practical-tips)
16. [Sources](#16-sources)

---

## 1. Compositor Workspace and Architecture

### 1.1 Overview

Blender's **Compositor** is a node-based image processing system that operates on rendered images after the 3D render is complete. It allows post-production operations -- color correction, effects, compositing of multiple render layers, mixing CG with live footage -- entirely within Blender, without exporting to external software [1].

### 1.2 Accessing the Compositor

- Switch to the **Compositing** workspace (header tabs) or change any editor area to the Compositor editor type
- Enable **Use Nodes** checkbox in the Compositor header to activate node-based compositing
- Enable **Backdrop** to see the compositing result directly in the node editor background

### 1.3 Node Tree Architecture

The Compositor uses a **node tree** (directed acyclic graph) where:

- **Input nodes** provide data (Render Layers, Image, Movie Clip, Value, RGB)
- **Processing nodes** transform data (filters, color adjustments, masks, distortions)
- **Output nodes** display or save results (Composite, Viewer, File Output, Split Viewer)

Data flows left-to-right through node connections (noodles). Each connection carries one of several data types:

| Data Type | Color | Description |
|-----------|-------|-------------|
| **Color (RGBA)** | Yellow | Standard 4-channel color image |
| **Value (float)** | Grey | Single-channel grayscale data (depth, alpha, factors) |
| **Vector** | Blue | Multi-component data (normals, UV coordinates, speed) |

### 1.4 Real-Time Compositor

Blender 3.5+ includes a **Real-Time Compositor** that evaluates node trees in the viewport. As of Blender 4.4, the real-time compositor supports most common nodes with GPU acceleration, though some complex nodes (like Glare with certain modes) may fall back to CPU processing [2].

To enable: Render Properties > (checkbox) Compositor > Mode: Realtime.

### 1.5 Essential Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Shift+A** | Add Node menu |
| **Ctrl+Shift+Click** (on a node) | Connect node to Viewer for preview |
| **M** | Mute selected node (bypasses it) |
| **H** | Hide unused sockets (collapse node) |
| **Ctrl+J** | Join selected nodes into a Frame |
| **Ctrl+G** | Group selected nodes into a Node Group |
| **Tab** | Enter/exit Node Group |
| **Ctrl+H** | Hide/Show all unconnected sockets |
| **Backspace** (Viewer connected) | Recalculate |

---

## 2. Render Passes

### 2.1 What are Render Passes?

A **Render Pass** isolates a specific component of the rendered image -- diffuse color, specular highlights, shadows, depth, etc. By rendering these components separately, compositors can adjust each independently and recombine them for maximum control [3].

Render passes are enabled in **View Layer Properties > Passes** and appear as individual outputs on the **Render Layers** node in the Compositor.

### 2.2 Light Passes

Light passes separate the contribution of different shading components. In Cycles, the combined image is the sum of all light passes [3]:

| Pass | Description | Typical Use |
|------|-------------|-------------|
| **Diffuse Light** | Intensity and color of light hitting Diffuse/SSS BSDFs (excludes surface color) | Brighten/darken shadows without affecting material colors |
| **Diffuse Color** | The surface colors of Diffuse/SSS BSDFs (excludes lighting) | Adjust material colors in compositing |
| **Glossy Light** | Light reflected by Glossy BSDFs | Control specular highlight intensity |
| **Glossy Color** | Surface color of Glossy BSDFs | Tint or desaturate reflections |
| **Transmission Light** | Light passing through Transmission BSDFs (glass, translucency) | Control glass brightness |
| **Transmission Color** | Surface color of Transmission BSDFs | Tint glass colors |
| **Volume Light** | Light contribution from volume shaders | Control fog/volumetric brightness |
| **Emission** | Direct emission from surfaces (emissive materials, lights via shader) | Add bloom selectively to emissive objects |

**Recombination formula:**
```
Combined = (Diffuse Light x Diffuse Color) + (Glossy Light x Glossy Color) +
           (Transmission Light x Transmission Color) + Volume Light + Emission
```

### 2.3 Data Passes

| Pass | Description | Data Type | Typical Use |
|------|-------------|-----------|-------------|
| **Depth (Z)** | Distance from camera to surface per pixel | Value (float) | Depth of field in compositing, fog, distance-based effects |
| **Normal** | World-space surface normals per pixel | Vector (XYZ) | Relighting, normal-based masking, edge detection |
| **Mist** | Linear depth ramp based on Mist Pass settings in World Properties | Value (0-1) | Distance fog, aerial perspective |
| **Shadow** | Shadows collected by shadow catcher objects | Value | Compositing CG shadows onto live footage |
| **Ambient Occlusion** | Proximity-based self-shadowing per pixel | Value (0-1) | Enhance or reduce crevice darkening |
| **Denoising Data** | Albedo and Normal data used by the denoiser | Special | Required for Denoise node to function |

### 2.4 Cryptomatte Passes

| Pass | Description |
|------|-------------|
| **Object** | Per-object ID matte with anti-aliased edges, motion blur, and transparency support |
| **Material** | Per-material ID matte |
| **Asset** | Per-asset ID matte |

Cryptomatte passes are used with the **Cryptomatte node** in the Compositor to create perfect mattes for individual objects or materials without requiring any pre-scene setup (no Object Index assignments needed) [4].

### 2.5 Index Passes (Legacy)

| Pass | Description | Setup Required |
|------|-------------|----------------|
| **Object Index** | Integer ID per object | Must set Pass Index manually on each object in Object Properties |
| **Material Index** | Integer ID per material | Must set Pass Index manually on each material in Material Properties |

These are the older masking system, largely superseded by Cryptomatte. They produce hard edges (no anti-aliasing) and do not support motion blur or transparency in the mask. Still useful for simple ID-based operations [3].

### 2.6 Passes in Eevee vs. Cycles

Both Cycles and Eevee support render passes, but with differences:

| Feature | Cycles | Eevee |
|---------|--------|-------|
| Diffuse/Glossy/Transmission split | Full separation | Available (simplified model) |
| Cryptomatte | Object, Material, Asset | Object, Material, Asset |
| Shadow Catcher | Yes | Yes |
| Depth pass | Raytraced (accurate) | Rasterized (Z-buffer) |
| Denoising data | Yes (for NLM/OptiX/OID) | Not needed (no path tracing noise) |
| AO pass | Raytraced | Screen-space |

---

## 3. Multi-Layer EXR Workflow

### 3.1 What is Multi-Layer EXR?

**OpenEXR Multi-Layer** is a high dynamic range image format that stores multiple render passes in a single file. Each pass becomes a named layer within the EXR container, preserving full 32-bit float precision per channel [5].

### 3.2 Why Use Multi-Layer EXR?

| Benefit | Description |
|---------|-------------|
| **Non-destructive** | All passes preserved; you can change compositing decisions without re-rendering |
| **Full dynamic range** | 32-bit float data preserves highlights and shadows that 8-bit formats clip |
| **Single file** | All passes in one file instead of dozens of separate images |
| **Industry standard** | Compatible with Nuke, After Effects (via plugin), Fusion, Natron |
| **Re-renderable** | If one pass looks wrong, you can isolate which component needs fixing |

### 3.3 Exporting Multi-Layer EXR from Blender

1. **Output Properties > Output**
   - Set File Format to **OpenEXR MultiLayer**
   - Set Color Depth to **Float (Full)** for maximum precision
   - Set Codec to **DWAA** (lossy but small) or **ZIP** (lossless) or **PIZ** (lossless, good for noisy data)
2. **View Layer Properties > Passes**
   - Enable all desired passes (Diffuse Color, Diffuse Light, Glossy Light, etc.)
3. **Render** (F12 or Ctrl+F12 for animation)
4. Files are saved to the output path with all enabled passes embedded

### 3.4 Importing Multi-Layer EXR into the Compositor

1. Add an **Image node** (Shift+A > Input > Image)
2. Open the multi-layer EXR file
3. The Image node displays all stored passes as individual outputs
4. Connect passes to processing nodes as needed

### 3.5 File Output Node for Multi-Pass Export

The **File Output** node provides more control than the standard output:

1. Add a **File Output** node (Shift+A > Output > File Output)
2. In the node's properties sidebar (N), set format to **OpenEXR MultiLayer**
3. Add input slots for each pass you want to save
4. Connect render passes to the corresponding inputs
5. Each input becomes a named layer in the output EXR

This is useful for saving compositor-processed passes (e.g., denoised passes, recolored passes) back to EXR for use in external software [5].

---

## 4. Key Compositor Nodes

### 4.1 Color Adjustment Nodes

#### Color Balance (Lift/Gamma/Gain)

The **Color Balance** node provides three-way color correction -- the industry-standard method for color grading [6]:

| Control | Affects | Description |
|---------|---------|-------------|
| **Lift** | Shadows | Shifts the darkest values. Moving toward a color tints the shadows. |
| **Gamma** | Midtones | Adjusts the midrange brightness and color. The workhorse of color grading. |
| **Gain** | Highlights | Scales the brightest values. Moving toward a color tints the highlights. |

There are two modes:
- **Lift/Gamma/Gain** -- ASC CDL standard, additive lift
- **Offset/Power/Slope** -- alternative color science model

#### RGB Curves

The **RGB Curves** node provides per-channel curve adjustment, similar to Photoshop Curves [6]:

- **C (Combined)** -- adjusts all channels simultaneously (brightness/contrast)
- **R, G, B** -- adjusts individual color channels (color grading, cross-processing)

Use cases:
- S-curve on Combined channel for contrast boost
- Lift the R channel shadows for warm shadow tones
- Lower the B channel highlights for amber/warm highlights

#### Hue/Saturation/Value

The **Hue Saturation Value** node adjusts the HSV components of the image:

| Control | Range | Effect |
|---------|-------|--------|
| **Hue** | 0.0-1.0 (0.5 = no change) | Shifts all hues around the color wheel |
| **Saturation** | 0.0-2.0 (1.0 = no change) | Decreases or increases color intensity |
| **Value** | 0.0-2.0 (1.0 = no change) | Darkens or brightens the image |

### 4.2 Effect Nodes

#### Glare

The **Glare** node creates light bloom, streaks, and glow effects from bright areas of the image [6]:

| Mode | Effect | Use Case |
|------|--------|----------|
| **Bloom** | Soft glow around bright areas | General light glow, neon signs, magic effects |
| **Streaks** | Directional light streaks radiating from bright points | Lens artifacts, star filters, anamorphic streaks |
| **Fog Glow** | Soft, wide atmospheric glow | Dreamy atmosphere, fog, mist effects |
| **Ghost** | Concentric ring artifacts around bright points | Lens flare simulation |

Key parameters:
- **Threshold** -- minimum brightness to trigger glare (lower = more areas glow)
- **Quality** -- computation quality (High/Medium/Low)
- **Mix** -- blend amount with original image (-1 = glare only, 0 = add, 1 = original only)

#### Lens Distortion

The **Lens Distortion** node simulates camera lens imperfections:

| Parameter | Effect |
|-----------|--------|
| **Distortion** | Barrel (positive) or pincushion (negative) distortion |
| **Dispersion** | Chromatic aberration -- separates color channels at the edges |
| **Jitter** | Adds noise to the distortion for more organic results |
| **Projector** | Simulates projector-style distortion |

#### Defocus

The **Defocus** node creates depth-of-field blur in compositing using the Z-depth pass:

| Parameter | Effect |
|-----------|--------|
| **Use Z Buffer** | Whether to use the depth pass for variable blur |
| **Z Scale** | Scale factor for the depth values |
| **f-Stop** | Virtual aperture size (lower = shallower depth of field) |
| **Max Blur** | Maximum blur radius in pixels (limits computation time) |
| **Threshold** | Minimum difference in Z to apply blur (prevents halo artifacts) |
| **Bokeh Type** | Shape of the blur kernel (Disk, Triangle, Square, Pentagon, Hexagon, Heptagon, Octagon) |

### 4.3 Masking and Compositing Nodes

#### Cryptomatte

The **Cryptomatte** node extracts mattes from Cryptomatte render passes without requiring pre-render object index setup [4]:

1. Add Cryptomatte node (Shift+A > Matte > Cryptomatte)
2. Connect the Render Layers node's Image and Cryptomatte passes
3. Use the **eyedropper** tool (in the Cryptomatte node header) to click objects in the backdrop
4. Each clicked object is added to the matte. Click again to remove.
5. Outputs: **Image** (original), **Matte** (alpha mask), **Pick** (ID visualization)

Advantages over legacy Object/Material Index:
- Anti-aliased edges
- Motion blur and depth of field in the matte
- Transparency and overlapping objects handled correctly
- No per-object setup needed before rendering

#### Alpha Over

The **Alpha Over** node composites one image over another using alpha transparency:

| Input | Purpose |
|-------|---------|
| **Factor** | Overall blend strength (0 = show bottom only, 1 = show top with alpha) |
| **Image (bottom)** | Background image |
| **Image (top)** | Foreground image (with alpha channel) |

**Premultiplied vs. Straight Alpha:**
- Enable **Convert Premul** when the top image uses premultiplied alpha (most render output)
- Leave disabled for straight alpha images

#### Mix (Blend Modes)

The **Mix** node combines two images using standard blend modes:

| Blend Mode | Effect |
|------------|--------|
| **Mix** | Simple lerp blend between images |
| **Add** | Brightens by adding pixel values |
| **Subtract** | Darkens by subtracting pixel values |
| **Multiply** | Darkens; multiplies pixel values (good for shadows, AO) |
| **Screen** | Brightens; inverse of multiply (good for glow, light effects) |
| **Overlay** | Contrast boost: multiply for darks, screen for lights |
| **Soft Light** | Gentle contrast/color tinting |
| **Color** | Applies hue and saturation from top image with luminance from bottom |
| **Value** | Applies luminance from top image with hue/saturation from bottom |

#### Mask

The **Mask** node loads a mask created in the Movie Clip Editor's mask tools. Masks are vector-based (spline) shapes that can be animated and feathered. Used for rotoscoping, selective effects, and region-based adjustments.

#### Viewer

The **Viewer** node is a critical workflow tool. Connect any node's output to a Viewer to see its result in the backdrop (if Backdrop is enabled) or in the Image Editor. The shortcut **Ctrl+Shift+Click** on any node automatically inserts a Viewer connection.

### 4.4 Filter Nodes

| Node | Effect | Use Case |
|------|--------|----------|
| **Blur** | Gaussian, Box, or other blur kernel | Softening, glow base, pre-processing |
| **Denoise** | AI-based denoising (OptiX or OpenImageDenoise) | Removing path tracing noise from Cycles renders |
| **Sharpen** (via Filter node) | Unsharp mask sharpening | Final output sharpening |
| **Dilate/Erode** | Expands or contracts mask edges | Fixing edge fringing on mattes |
| **Bilateral Blur** | Edge-preserving blur | Smoothing without losing edges |
| **Pixelate** | Reduces resolution | Retro/pixel art effects |
| **Sun Beams** | Creates volumetric light rays from a source point | God rays, sunlight through windows |

---

## 5. Practical Compositing Workflow

### 5.1 Standard Post-Production Pipeline

```
Render (Cycles/Eevee)
    |
    v
Save as Multi-Layer EXR
    |
    v
Load into Compositor (Image node)
    |
    v
Denoise (Denoise node using Denoising Data passes)
    |
    v
Recombine passes (if adjusted individually)
    |
    v
Color Grade (Color Balance, RGB Curves)
    |
    v
Effects (Glare, Lens Distortion, Vignette)
    |
    v
Output (Composite node -> final format)
```

### 5.2 Denoising Workflow

1. Enable **Denoising Data** pass in View Layer Properties
2. Render and save as Multi-Layer EXR
3. In Compositor, add a **Denoise** node
4. Connect the Render Layers outputs:
   - **Image** -> Denoise **Image** input
   - **Denoising Normal** -> Denoise **Normal** input
   - **Denoising Albedo** -> Denoise **Albedo** input
5. Connect Denoise **Image** output to the rest of the node tree

The Denoise node uses Intel Open Image Denoise (OIDN) or NVIDIA OptiX for AI-based denoising that preserves detail while removing noise [1].

### 5.3 Pass Recombination Workflow

When you need to adjust individual light passes:

1. Separate passes using Render Layers node outputs
2. Adjust individual passes (e.g., multiply Glossy Light by 0.5 to reduce reflections)
3. Recombine using **Mix (Multiply)** for color x light pairs
4. Use **Mix (Add)** to sum all light contributions

Example node chain for selective adjustment:
```
Diffuse Light --(adjust)--> Mix Multiply <-- Diffuse Color
                                 |
Glossy Light --(adjust)-->  Mix Multiply <-- Glossy Color
                                 |
                           Mix Add (sum all) --> Color Grade --> Composite
```

### 5.4 Background Replacement Workflow

1. Render the scene with a transparent background (Film > Transparent in Render Properties)
2. Load a background image via an Image node
3. Use **Alpha Over** node: background on bottom input, render on top input
4. Add **Lens Distortion** to match camera characteristics
5. Add **Color Balance** to match color temperature between CG and background

---

## 6. Color Grading Fundamentals

### 6.1 The Three-Way Color Corrector

The **Color Balance** node in Lift/Gamma/Gain mode is the standard tool for color grading in Blender's compositor [6]:

**Shadows (Lift):** Controls the darkest areas. Pulling toward blue creates "cinematic" cool shadows. Pulling toward orange creates warm, nostalgic shadows.

**Midtones (Gamma):** The most visible adjustment. Affects the overall color cast of the image. Subtle shifts here change the entire mood.

**Highlights (Gain):** Controls bright areas. Warm highlights + cool shadows is the classic "teal and orange" look.

### 6.2 Common Color Grading Looks

| Look | Shadows | Midtones | Highlights | Additional |
|------|---------|----------|------------|------------|
| **Teal & Orange** | Teal/blue | Slight warm | Orange/warm | Increase contrast with RGB Curves |
| **Bleach Bypass** | Crushed blacks | Desaturated | Bright whites | Reduce saturation to 0.5, increase contrast |
| **Cross Process** | Green/yellow | Shift hue | Magenta | Use RGB Curves per-channel |
| **Day for Night** | Deep blue | Strong blue | Blue-purple | Reduce exposure significantly, heavy blue tint |
| **Vintage Film** | Lifted blacks (not true black) | Warm | Soft rolloff | Lift the bottom of RGB Curves; reduce contrast |

### 6.3 Scopes

Blender provides scopes in the Image Editor and compositor sidebar for evaluating color:

| Scope | Purpose |
|-------|---------|
| **Histogram** | Shows value distribution per channel. Identifies clipping. |
| **Waveform** | Shows luminance or RGB values across horizontal position. Standard for exposure evaluation. |
| **Vectorscope** | Shows hue and saturation distribution. Used for skin tone evaluation and color balance. |

---

## 7. Video Sequence Editor (VSE)

### 7.1 Overview

The **Video Sequence Editor (VSE)** is Blender's built-in non-linear video editor. It operates on **strips** (clips) arranged on **channels** (tracks). While not as feature-rich as dedicated NLEs like DaVinci Resolve or Premiere Pro, it handles basic to intermediate editing tasks entirely within Blender [7].

Access the VSE via the **Video Editing** workspace or by changing an editor area to Sequencer.

### 7.2 VSE Layout

The Video Editing workspace typically shows:

| Panel | Purpose |
|-------|---------|
| **Sequencer** | Timeline view with strips on channels |
| **Preview** | Visual preview of the current frame output |
| **Properties (N panel)** | Strip properties, proxy settings, modifiers |

### 7.3 Strip Types

| Strip Type | Description | Added Via |
|------------|-------------|-----------|
| **Movie** | Video file (MP4, AVI, MOV, MKV, etc.) | Add > Movie |
| **Image/Sequence** | Single image or numbered image sequence | Add > Image/Sequence |
| **Sound** | Audio file (WAV, MP3, FLAC, OGG, etc.) | Add > Sound |
| **Scene** | Renders a Blender scene inline | Add > Scene |
| **Color** | Solid color strip (backgrounds, fades) | Add > Color Strip |
| **Text** | Text overlay with font, size, color, shadow | Add > Text |
| **Adjustment Layer** | Applies effects to all strips below it | Add > Adjustment Layer |
| **Effect Strip** | Various effects (Cross, Wipe, Transform, Speed, Glow, etc.) | Add > Effect Strip |

### 7.4 Essential VSE Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Shift+A** | Add Strip menu |
| **G** | Grab (move) selected strips |
| **K** | Soft Cut (split strip at playhead, creates two strips) |
| **Shift+K** | Hard Cut |
| **X** / **Delete** | Delete selected strips |
| **Shift+D** | Duplicate strips |
| **E** | Extend strip (change end frame) |
| **H** | Mute selected strips |
| **Alt+H** | Unmute all strips |
| **Ctrl+C / Ctrl+V** | Copy / Paste strips |
| **Home** | View All strips |
| **Page Up / Page Down** | Move strip to higher/lower channel |

---

## 8. VSE Editing Techniques

### 8.1 Cutting and Trimming

**Soft Cut (K):** Splits a strip at the playhead into two strips. Both strips reference the same source media -- the first strip's end and the second strip's start are at the cut point. Non-destructive.

**Hard Cut (Shift+K):** Like Soft Cut, but creates independent strips.

**Trimming:** Drag the left or right handle of a strip to reveal more or less of the source media:
- Dragging the **left handle right** trims the beginning (clip starts later in the source)
- Dragging the **right handle left** trims the end (clip ends earlier in the source)
- Hold **Ctrl** while dragging to snap to the playhead or other strip edges

### 8.2 Transitions

**Cross Dissolve:**
1. Overlap two strips on adjacent channels
2. Select both strips
3. Add > Effect Strip > Cross
4. The Cross strip automatically spans the overlap region
5. The overlap duration controls the transition length

**Wipe:**
1. Same setup as Cross Dissolve
2. Add > Effect Strip > Wipe
3. Configure wipe type: Single, Double, Iris, Clock
4. Set direction and blur amount

**Gamma Cross:** Like Cross, but applies gamma correction during the dissolve for perceptually correct brightness transitions (avoids the "dark dip" of a linear cross dissolve).

### 8.3 Speed Effects

The **Speed Control** effect strip modifies playback speed:

1. Select a movie strip
2. Add > Effect Strip > Speed Control
3. Set speed factor: 2.0 = double speed, 0.5 = half speed
4. For smooth slow motion, enable **Interpolation** (blends between frames)

**Retiming (Blender 4.0+):**
Blender 4.0 introduced native **retiming** on strips:
1. Select a strip
2. Open the Retiming panel in strip properties
3. Add retiming keys at different points
4. Set different speeds between keys
5. Add speed transitions for smooth acceleration/deceleration between speed segments [7]

### 8.4 Color Grading in VSE

Each strip can have **Modifiers** applied (similar to shader nodes but for video strips):

| Modifier | Effect |
|----------|--------|
| **Color Balance** | Lift/Gamma/Gain three-way correction |
| **Curves** | Per-channel curve adjustment |
| **Hue Correct** | Adjusts properties (saturation, value) based on input hue |
| **Bright/Contrast** | Simple brightness and contrast |
| **White Balance** | Adjust white point temperature |
| **Tone Map** | HDR to SDR tone mapping |

Modifiers stack and process in order. Use **Adjustment Layer** strips to apply modifiers to multiple strips simultaneously.

### 8.5 Text Strips

Text strips create title cards, lower thirds, and text overlays:

| Property | Description |
|----------|-------------|
| **Text** | The text content (supports line breaks) |
| **Font** | Font family selection |
| **Size** | Font size in pixels |
| **Color** | Text color |
| **Shadow** | Drop shadow with offset and color |
| **Box** | Background box behind text |
| **Location** | X/Y position (0.5, 0.5 = centered) |
| **Alignment** | Left, Center, Right |

Text properties can be keyframed for animated titles.

---

## 9. H.265/HEVC Codec Support

### 9.1 New in Blender 4.4

Blender 4.4 added native support for **H.265/HEVC** (High Efficiency Video Coding) as an output codec. This was a long-requested feature that brings Blender's video encoding capabilities closer to industry standards [8].

### 9.2 Configuration

In **Output Properties > Output**:
- Set Container to **MPEG-4** or **Matroska**
- Set Video Codec to **H.265**
- Configure quality settings:
  - **Constant Rate Factor (CRF):** Lower = higher quality, larger file. 18-23 is visually lossless for most content.
  - **Encoding Speed:** Slower presets produce smaller files at higher quality but take longer.

### 9.3 Bit Depth Support

Blender 4.4 adds 10-bit and 12-bit per channel support:

| Codec | 8-bit | 10-bit | 12-bit |
|-------|-------|--------|--------|
| H.264 | Yes | Yes (4.4+) | No |
| H.265/HEVC | Yes | Yes (4.4+) | Yes (4.4+) |
| AV1 | Yes | Yes (4.4+) | Yes (4.4+) |

10-bit encoding reduces banding artifacts in gradients and provides better quality for professional workflows.

### 9.4 Color Space

Videos rendered from Blender 4.4 explicitly use the **BT.709** color space standard (used for HDTV and most web video), ensuring consistent color reproduction across players and platforms [8].

### 9.5 H.265 vs. H.264 Comparison

| Property | H.264 (AVC) | H.265 (HEVC) |
|----------|-------------|---------------|
| **Compression efficiency** | Baseline | 25-50% better at same quality |
| **File size** | Larger | Smaller for equivalent quality |
| **Encoding speed** | Faster | Slower |
| **Hardware decode support** | Universal | Widespread (most devices since ~2018) |
| **License** | Established | Patent pool (MPEG LA + others) |
| **Max resolution** | 4K (practical) | 8K+ |

---

## 10. Audio Synchronization

### 10.1 Audio in the VSE

Sound strips in the VSE support:

- WAV, MP3, FLAC, OGG, and other FFmpeg-supported formats
- Volume control per strip (dB scale)
- Pan (stereo left/right)
- Waveform display for visual reference
- Scrubbing (hearing audio as you drag the playhead) [7]

### 10.2 Audio Sync Settings

In the Timeline header or Playback menu:

| Setting | Behavior |
|---------|----------|
| **No Sync** | Audio plays without frame sync. May drift. |
| **Frame Dropping** | Drops visual frames to keep audio in sync. Audio is the master clock. |
| **AV-sync** | Blender adjusts playback to maintain audio/video sync. Recommended for editing. |

### 10.3 Audio Tips

- **Separate audio and video** before applying speed effects to avoid desync
- Use **Sound strip offset** to fine-tune sync (positive values delay audio)
- For lip sync work, use **AV-sync** mode and scrub through the audio waveform
- The **Mixdown** button (VSE header) renders audio to a single file for final export
- Audio can be cached in memory for faster scrubbing (User Preferences > System > Audio)

---

## 11. Motion Tracking

### 11.1 Overview

Blender includes a complete **motion tracking** system for reconstructing camera and object movement from video footage. This is essential for VFX work -- adding 3D elements to live-action footage [9].

Access the tracking workspace via the **Motion Tracking** workspace tab.

### 11.2 Camera Tracking Workflow

**Step 1: Import Footage**
- Open the Movie Clip Editor
- Open your footage file
- Set the camera intrinsics (focal length, sensor size) if known

**Step 2: Set Tracking Parameters**
- In the Track panel, set **Pattern Size** and **Search Size**
- Pattern: the area around the tracking point that is matched frame-to-frame
- Search: the area in the next frame where Blender looks for the pattern

**Step 3: Place and Track Markers**
- Place tracking markers on high-contrast features (corners, edges, distinct patterns)
- Need at minimum 8 markers, but 15-20 is recommended for robust solves
- Track forward/backward using the **Track** buttons or shortcuts:

| Shortcut | Action |
|----------|--------|
| **Ctrl+T** | Track selected markers forward |
| **Shift+Ctrl+T** | Track selected markers backward |
| **Alt+T** | Track all markers forward |
| **E** | Detect features (auto-place markers) |

**Step 4: Solve Camera Motion**
- Set two **Keyframes** (frames with good marker distribution and significant camera movement between them)
- Click **Solve Camera Motion**
- Check the **Solve Error** (reprojection error):
  - Below 0.3 = excellent
  - 0.3 to 3.0 = usable, may need marker refinement
  - Above 3.0 = poor; re-track or remove bad markers

**Step 5: Set Up Scene**
- Click **Set Up Tracking Scene** to create a 3D scene with the solved camera and a ground plane
- Or manually: **Set as Background** and **Set Origin** to align the 3D scene with the tracked footage [9]

### 11.3 Object Tracking

Object tracking follows the motion of a specific rigid object within the footage:

1. Create a new **Object** in the tracking settings
2. Place markers on the object (minimum 8 markers on the object)
3. Track markers
4. Solve the object's motion separately from the camera
5. The solved object appears as an Empty in the 3D scene

### 11.4 Plane Tracking

**Plane tracking** follows the motion of a flat surface (wall, floor, screen, sign):

1. Track at least 4 markers on the flat surface
2. Select those markers
3. Create a **Plane Track** (Header > Track > Plane Track > Create)
4. The plane track can be used with the **Plane Track Deform** compositor node to project images onto the tracked surface [9]

### 11.5 Masking

The Movie Clip Editor includes a **Mask** tool for rotoscoping:

- Create spline-based masks to isolate objects in footage
- Animate mask shape per-frame for moving objects
- Masks can be used in the compositor via the **Mask** node
- Feathering controls create soft mask edges

---

## 12. VFX Compositing with Tracked Footage

### 12.1 Standard VFX Pipeline in Blender

```
Footage Import
    |
    v
Motion Tracking (Movie Clip Editor)
    |
    v
Camera Solve (produces solved camera)
    |
    v
Scene Setup (3D scene aligned to footage)
    |
    v
3D Modeling & Animation (in the tracked scene)
    |
    v
Shadow Catchers & Holdout Objects
    |
    v
Render (with transparent Film)
    |
    v
Composite (Compositor: CG over footage)
    |
    v
Final Output
```

### 12.2 Shadow Catchers

A **Shadow Catcher** is an object that receives shadows from CG objects but is invisible in the final render. Used to cast CG shadows onto live-action surfaces:

1. Add a plane where the ground is in the footage
2. In Object Properties > Visibility, enable **Shadow Catcher**
3. Render with Film > Transparent
4. The Shadow pass captures shadows cast onto the catcher
5. In the compositor, multiply the shadow pass with the footage [10]

### 12.3 Holdout Objects

**Holdout** objects are invisible but block CG objects behind them. Used when a real-world object needs to occlude (be in front of) CG elements:

1. Create a rough model matching the real object's shape
2. In Material Properties, set the surface to **Holdout** shader
3. The holdout object cuts a hole in the CG render, letting the footage show through

### 12.4 Compositing CG with Footage

In the Compositor:

1. Add a **Movie Clip** node (the original footage)
2. Add the **Render Layers** node (the CG render)
3. Use **Alpha Over** to composite CG over footage
4. Add **Color Balance** to match CG color temperature to footage
5. Add **Lens Distortion** to match CG to the footage camera's distortion
6. Use the **Shadow** pass with a Mix (Multiply) node to overlay CG shadows
7. Add **Glare** sparingly for light integration
8. Final result goes to the **Composite** node [10]

---

## 13. Grease Pencil

### 13.1 Overview

**Grease Pencil** is Blender's 2D drawing and animation system that operates within 3D space. Each stroke has XYZ position data, allowing 2D art to interact with 3D scenes -- receiving lighting, casting shadows, being occluded by geometry, and participating in camera movement [11].

### 13.2 Grease Pencil 3.0 (Blender 4.3+)

Blender 4.3 introduced **Grease Pencil 3.0**, a complete rewrite with major improvements [11]:

| Feature | GP 2.x (Legacy) | GP 3.0 |
|---------|-----------------|--------|
| **Performance** | Python-heavy, slow with many strokes | C++ core, significantly faster |
| **Geometry Nodes** | Limited support | Full Geometry Nodes integration |
| **Data model** | Custom data format | Standard Blender data (compatible with other systems) |
| **Scalability** | Performance degraded with density | Handles high-density drawings and long timelines |

### 13.3 Drawing Tools

| Tool | Purpose |
|------|---------|
| **Draw** | Freehand stroke drawing with pressure sensitivity |
| **Fill** | Fills enclosed areas with color |
| **Erase** | Removes strokes or portions of strokes |
| **Tint** | Applies color tinting to existing strokes |
| **Cutter** | Cuts strokes at intersections |
| **Line** | Draws straight lines |
| **Arc** | Draws arcs and curves |
| **Box / Circle** | Draws rectangles and circles |
| **Polyline** | Draws connected line segments |

### 13.4 Stroke Sculpting

In Sculpt Mode, Grease Pencil strokes can be deformed using sculpt brushes:

| Brush | Effect |
|-------|--------|
| **Smooth** | Smooths stroke curves |
| **Thickness** | Adjusts stroke width |
| **Strength** | Adjusts stroke opacity |
| **Grab** | Moves strokes by dragging |
| **Push** | Pushes strokes in brush direction |
| **Twist** | Rotates strokes around brush center |
| **Pinch** | Pulls strokes toward brush center |
| **Randomize** | Adds random displacement |
| **Clone** | Stamps duplicates of selected strokes |

### 13.5 Grease Pencil Materials

Grease Pencil objects use their own material type with two components:

| Component | Purpose |
|-----------|---------|
| **Stroke** | Controls the outline/line appearance (color, opacity, style) |
| **Fill** | Controls the interior fill (solid color, gradient, texture, checker) |

Materials can use **Holdout** mode to erase underlying strokes, creating complex layered effects.

### 13.6 Grease Pencil Layers and Onion Skinning

- **Layers** organize strokes (like Photoshop layers). Each layer has opacity, blend mode, and lock settings.
- **Onion Skinning** displays adjacent frames as transparent overlays for animation reference. Configurable colors for before/after frames, number of visible frames, and opacity.

### 13.7 Animation

Grease Pencil animation is frame-by-frame:
- Each keyframe contains a **drawing** (set of strokes)
- Blank keyframes create holds (the drawing persists until the next keyframe)
- **Interpolation** between keyframes can be automatic (Blender attempts to morph between stroke shapes) or manual

---

## 14. 2D/3D Hybrid Animation Workflows

### 14.1 Grease Pencil in Production

Grease Pencil has been used in professional productions, most notably in *Spider-Man: Across the Spider-Verse* (2023), where Blender's Grease Pencil was used for freehand drawing by animators to add 2D strokes and line FX. These strokes were then transformed into meshes and exported to the main Maya pipeline via custom scripts [12].

### 14.2 Hybrid Workflow Approaches

**Approach 1: 3D Base with 2D Overlay**
1. Create 3D scene with characters and environments
2. Add Grease Pencil objects for 2D effects (speed lines, impact frames, expression marks)
3. Grease Pencil strokes exist in 3D space, so they move with the camera

**Approach 2: 2D Animation in 3D Environment**
1. Model a 3D environment (set, props)
2. Create Grease Pencil characters animated frame-by-frame
3. Characters benefit from 3D camera movement and lighting
4. Use Surface offset on Grease Pencil to prevent Z-fighting with 3D geometry

**Approach 3: Storyboard Animatic**
1. Draw storyboard frames with Grease Pencil
2. Time them on the Timeline
3. Add 3D camera moves for cinematic framing
4. Export as animatic video for editorial review before full production

### 14.3 Grease Pencil Modifiers

Grease Pencil objects support special modifiers:

| Modifier | Effect |
|----------|--------|
| **Noise** | Adds jitter to stroke position/thickness for a hand-drawn feel |
| **Smooth** | Smooths stroke curves |
| **Thickness** | Uniformly adjusts stroke width |
| **Tint** | Applies color overlay |
| **Color** | Modifies hue, saturation, value |
| **Opacity** | Adjusts transparency |
| **Build** | Progressively draws/reveals strokes over time |
| **Mirror** | Mirrors strokes across axes |
| **Array** | Repeats strokes in patterns |
| **Offset** | Translates strokes per-layer for parallax |
| **Lattice** | Deforms strokes using a Lattice object |
| **Armature** | Deforms strokes using an Armature (skeletal animation of 2D art) |

### 14.4 Shader Effects (Visual Effects for Grease Pencil)

| Effect | Description |
|--------|-------------|
| **Blur** | Blurs the Grease Pencil render |
| **Colorize** | Applies color filters (grayscale, sepia, duotone, etc.) |
| **Flip** | Mirrors the render |
| **Glow** | Adds outer glow to strokes |
| **Light** | Applies 2D lighting to Grease Pencil strokes |
| **Pixelate** | Reduces render resolution for pixel art look |
| **Rim** | Adds rim lighting effect |
| **Shadow** | Adds drop shadow to all strokes |
| **Swirl** | Applies swirl distortion |
| **Wave** | Applies wave distortion |

---

## 15. Advanced Compositing Techniques

### 15.1 Fog and Atmospheric Depth

Using the **Mist Pass** to create distance-based atmospheric effects:

1. Enable **Mist Pass** in View Layer Properties > Passes
2. Configure Mist settings in World Properties > Mist Pass:
   - **Start** -- distance from camera where mist begins
   - **Depth** -- distance over which mist fades from 0 to 1
   - **Falloff** -- curve type (Quadratic, Linear, Inverse Quadratic)
3. In the Compositor, use the Mist pass as a Factor input on a **Mix** node
4. Mix between the render and a fog color (typically desaturated blue-gray)

This creates realistic aerial perspective where distant objects fade into atmospheric haze. The technique is especially effective for landscape renders and urban scenes with depth.

### 15.2 Depth of Field in Compositing

While Cycles can render depth of field natively (Camera Properties > Depth of Field), compositing-based DOF offers more control after rendering:

1. Render with the **Z Depth** pass enabled
2. Add a **Defocus** node in the Compositor
3. Connect the Z pass to the Defocus node's Z input
4. Set the **f-Stop** to control blur intensity
5. Adjust **Max Blur** to prevent excessive computation
6. Use the **Bokeh Type** setting to match the desired lens character:
   - **Disk** -- smooth circular bokeh (modern lenses)
   - **Hexagon** -- classic 6-blade aperture look
   - **Pentagon** -- 5-blade aperture
   - **Heptagon / Octagon** -- more blade variations
7. Set **Z Scale** to fine-tune the depth range that appears in focus

**Tip:** For best results, render at a higher resolution than your final output and use **Map Value** or **Math** nodes to remap the Z-depth range before feeding it to Defocus.

### 15.3 Edge Detection and Outline Rendering

Creating NPR (Non-Photorealistic Rendering) outlines in the compositor:

**Method 1: Normal Pass Edge Detection**
1. Enable the **Normal** pass
2. Add a **Filter** node set to **Sobel** (edge detection)
3. Connect the Normal pass to the Filter node
4. The output highlights edges where surface normals change sharply
5. Invert and multiply over the render for an outline effect

**Method 2: Depth-Based Outlines**
1. Use the Z-Depth pass
2. Apply a **Filter (Sobel)** node to detect depth discontinuities
3. This creates outlines at silhouette edges (where depth changes abruptly)
4. Combine with Normal-based edges for both silhouette and surface detail outlines

**Method 3: Freestyle**
Blender's **Freestyle** line renderer (Render Properties > Freestyle) generates vector-quality edge lines. While not a compositor technique per se, the resulting line render can be composited over the main render using Alpha Over for maximum control over line weight, color, and style.

### 15.4 Vignette Effect

A simple but effective finishing touch:

1. Add an **Ellipse Mask** node (Shift+A > Matte > Ellipse Mask)
2. Set width and height to approximately 0.9 each
3. Add a **Blur** node and connect the mask output to it
4. Set Blur to Gaussian, high radius (200+ pixels) for smooth falloff
5. Use the blurred mask as a Factor in a **Mix** node
6. Mix between a darkened version of the image and the original
7. The edges darken while the center remains bright

### 15.5 Light Wrap

**Light Wrap** blends bright areas of a background plate into the edges of a composited foreground element, creating more natural integration:

1. Blur the background plate heavily (Blur node, 50-100+ px)
2. Use the foreground's alpha (dilated slightly with **Dilate/Erode**) as a mask
3. Mix the blurred background into the foreground edges using **Alpha Over** or **Mix (Screen)**
4. This simulates light bleeding from the background onto the foreground edges

### 15.6 Multi-Pass Color Correction Workflow

For maximum flexibility, correct color per-pass before recombining:

| Pass | Typical Adjustments |
|------|---------------------|
| **Diffuse Light** | Brighten fill light areas, cool shadow tones |
| **Diffuse Color** | Adjust skin tones, environment color matching |
| **Glossy Light** | Reduce or boost specular intensity; tint reflections |
| **Emission** | Bloom amount, glow color tinting |
| **AO** | Strengthen for stylistic darkness in crevices; weaken for flat/bright look |
| **Shadow** | Adjust shadow density for VFX matching |

This per-pass approach is standard in VFX pipelines and allows changes that would otherwise require re-rendering.

### 15.7 Node Groups and Reusability

Create reusable compositing setups with **Node Groups**:

1. Select a group of connected nodes
2. Press **Ctrl+G** to create a Node Group
3. The group becomes a single node with inputs and outputs
4. Name the group in the N-panel (e.g., "Color Grade - Warm")
5. Reuse the group in other compositing setups via **Shift+A > Group**
6. Groups are stored as data blocks and can be shared between .blend files via Append

Common reusable node groups:
- **Film Look** -- Curves + Color Balance + slight Glare for a cinematic finish
- **Shadow Composite** -- standardized shadow pass integration
- **Matte Edge Clean** -- Dilate/Erode + Blur for consistent matte edges
- **Vignette** -- parameterized vignette with adjustable size and falloff

### 15.8 Denoise Strategies

| Strategy | When to Use | Quality |
|----------|-------------|---------|
| **Cycles Denoiser (viewport)** | Quick preview during modeling | Low |
| **Denoise node (OIDN)** | General purpose post-render denoising | High |
| **Denoise node (OptiX)** | NVIDIA GPU acceleration | High (requires NVIDIA GPU) |
| **Higher sample count** | When denoising artifacts are unacceptable | Highest (slowest) |
| **Denoise per-pass** | Denoise individual passes before recombining for cleanest results | Very High |

When denoising individual passes, apply the Denoise node to each light pass separately before multiplying with the corresponding color pass. This prevents the denoiser from smearing fine color details.

---

## 16. Common Pitfalls and Practical Tips

### 15.1 Compositor Pitfalls

| Pitfall | Cause | Solution |
|---------|-------|----------|
| **Compositing not updating** | Use Nodes not enabled, or node tree disconnected | Check Use Nodes checkbox; ensure Composite node is connected |
| **Black output from Viewer** | No Viewer node connected | Ctrl+Shift+Click on a node to add Viewer connection |
| **EXR passes missing** | Passes not enabled before rendering | Enable passes in View Layer Properties BEFORE rendering |
| **Alpha fringing on composite** | Straight/premultiplied alpha mismatch | Enable Convert Premul on Alpha Over node; check image alpha type |
| **Denoise node does nothing** | Denoising Data passes not enabled | Enable Denoising Data in View Layer Properties > Passes |
| **Glare too strong** | Threshold too low | Increase Threshold value; reduce Mix amount |

### 15.2 VSE Pitfalls

| Pitfall | Cause | Solution |
|---------|-------|----------|
| **Audio out of sync** | Wrong sync mode | Set Sync Mode to AV-sync in Timeline header |
| **Video plays at wrong speed** | Source FPS different from project FPS | Match Output Properties > Frame Rate to footage frame rate |
| **Quality loss on export** | Encoding settings too aggressive | Lower CRF value (higher quality); check resolution matches |
| **Strips overlapping incorrectly** | Channel order confusion | Higher channel numbers render on top; reorganize strips |

### 15.3 Motion Tracking Pitfalls

| Pitfall | Cause | Solution |
|---------|-------|----------|
| **High solve error** | Bad tracking markers or incorrect camera parameters | Remove markers with high individual error; verify focal length |
| **Tracking markers slip** | Low-contrast features, motion blur | Choose high-contrast corners; increase Pattern Size; use Correlation tracking |
| **CG objects floating** | Origin not set correctly after solve | Use Set Origin to place the 3D origin on a tracked ground point |
| **Scale mismatch** | Scene scale incorrect | Use Set Scale on known-distance markers to calibrate |

### 15.4 Performance Tips

- **Compositor:** Use the Viewer node sparingly; disable Backdrop during complex edits to avoid constant recomputation
- **VSE:** Generate **Proxy** files for smooth playback of high-resolution footage (Properties > Proxy > Set Selected Strip Proxies)
- **Motion Tracking:** Track at half resolution first, then refine at full resolution
- **Rendering:** For iterative compositing, render to Multi-Layer EXR once, then work from the saved file rather than re-rendering each time you adjust compositing

---

## 16. Sources

1. Blender Foundation. "Compositing." *Blender Manual*. https://docs.blender.org/manual/en/latest/compositing/index.html
2. Blender Foundation. "Real-Time Compositor." *Blender Developers Blog*. https://code.blender.org/2022/07/real-time-compositor/
3. Blender Foundation. "Passes." *Blender Manual*. https://docs.blender.org/manual/en/latest/render/layers/passes.html
4. Blender Foundation. "Cryptomatte Node." *Blender Manual*. https://docs.blender.org/manual/en/latest/compositing/types/matte/cryptomatte.html
5. Blender Foundation. "Render Layers Node." *Blender Manual*. https://docs.blender.org/manual/en/latest/compositing/types/input/scene/render_layers.html
6. "Top 12 Post-Processing Effects to Enhance Your Blender Renders." *Artisticrender.com*. https://artisticrender.com/top-12-post-processing-effects-to-enhance-your-blender-renders/
7. Blender Foundation. "Video Editing." *Blender Manual*. https://docs.blender.org/manual/en/latest/video_editing/index.html
8. Blender Foundation. "Blender 4.4 Release Notes." *Blender.org*. https://www.blender.org/download/releases/4-4/
9. Blender Foundation. "Motion Tracking." *Blender Manual*. https://docs.blender.org/manual/en/latest/movie_clip/tracking/index.html
10. Blender Foundation. "VFX." *Blender.org*. https://www.blender.org/features/vfx/
11. Blender Foundation. "Grease Pencil 3.0." *Blender Developer Blog*. https://blog.3sfarm.com/blender-grease-pencil-3-0-a-game-changer-for-3d-animators
12. "Blender Used in Across the Spiderverse!" *BlenderNation*, June 11, 2023. https://www.blendernation.com/2023/06/11/blender-used-in-across-the-spiderverse/
13. Blender Foundation. "Supported Video & Audio Formats." *Blender Manual*. https://docs.blender.org/manual/en/latest/files/media/video_formats.html
14. Blender Foundation. "Render Passes in Blender Cycles: Complete Guide." *Artisticrender.com*. https://artisticrender.com/render-passes-in-blender-cycles-complete-guide/
