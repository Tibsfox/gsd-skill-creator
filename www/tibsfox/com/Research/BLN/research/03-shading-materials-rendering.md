# Shading, Materials & Rendering

Module: **BLN-03** | Series: Blender User Manual | Status: Reference Document

> **Blender User Manual -- Document 03**
>
> Complete coverage of Blender's material and shader system, the Principled BSDF node, procedural and image-based texturing, PBR workflows, EEVEE and Cycles render engines, lighting techniques, camera settings, render output configuration, and color management. This document provides the technical foundation for achieving photorealistic and stylized renders in Blender 4.4.

---

## Table of Contents

- [Part 1: The Shader Editor](#part-1-the-shader-editor)
  - [1.1 Node-Based Materials](#11-node-based-materials)
  - [1.2 Material Slots and Assignment](#12-material-slots-and-assignment)
  - [1.3 Shader Editor Interface](#13-shader-editor-interface)
- [Part 2: The Principled BSDF Shader](#part-2-the-principled-bsdf-shader)
  - [2.1 Overview and Design Philosophy](#21-overview-and-design-philosophy)
  - [2.2 Base Layer Parameters](#22-base-layer-parameters)
  - [2.3 Subsurface Scattering Parameters](#23-subsurface-scattering-parameters)
  - [2.4 Specular Parameters](#24-specular-parameters)
  - [2.5 Transmission Parameters](#25-transmission-parameters)
  - [2.6 Coat Parameters](#26-coat-parameters)
  - [2.7 Sheen Parameters](#27-sheen-parameters)
  - [2.8 Emission Parameters](#28-emission-parameters)
  - [2.9 Normal and Displacement](#29-normal-and-displacement)
  - [2.10 Thin Film Parameters](#210-thin-film-parameters)
- [Part 3: Mixing and Combining Shaders](#part-3-mixing-and-combining-shaders)
- [Part 4: Procedural Textures](#part-4-procedural-textures)
  - [4.1 Noise Texture](#41-noise-texture)
  - [4.2 Voronoi Texture](#42-voronoi-texture)
  - [4.3 Wave Texture](#43-wave-texture)
  - [4.4 Gradient Texture](#44-gradient-texture)
  - [4.5 Magic Texture](#45-magic-texture)
  - [4.6 Checker Texture](#46-checker-texture)
  - [4.7 Brick Texture](#47-brick-texture)
  - [4.8 White Noise Texture](#48-white-noise-texture)
  - [4.9 Gabor Texture](#49-gabor-texture)
  - [4.10 Musgrave Texture (Deprecated)](#410-musgrave-texture-deprecated)
- [Part 5: Image Textures and UV Mapping](#part-5-image-textures-and-uv-mapping)
  - [5.1 Image Texture Node](#51-image-texture-node)
  - [5.2 Texture Coordinate Systems](#52-texture-coordinate-systems)
  - [5.3 Texture Painting](#53-texture-painting)
- [Part 6: PBR Workflow](#part-6-pbr-workflow)
  - [6.1 PBR Fundamentals](#61-pbr-fundamentals)
  - [6.2 Standard PBR Texture Maps](#62-standard-pbr-texture-maps)
  - [6.3 Metallic vs Specular Workflow](#63-metallic-vs-specular-workflow)
  - [6.4 Connecting PBR Maps in Blender](#64-connecting-pbr-maps-in-blender)
- [Part 7: Bump vs Displacement](#part-7-bump-vs-displacement)
- [Part 8: Specialized Material Techniques](#part-8-specialized-material-techniques)
  - [8.1 Subsurface Scattering Materials](#81-subsurface-scattering-materials)
  - [8.2 Glass, Water, and Transparent Materials](#82-glass-water-and-transparent-materials)
  - [8.3 Fur and Hair Rendering](#83-fur-and-hair-rendering)
- [Part 9: EEVEE Render Engine](#part-9-eevee-render-engine)
  - [9.1 EEVEE Architecture](#91-eevee-architecture)
  - [9.2 EEVEE Next (Blender 4.2+)](#92-eevee-next-blender-42)
  - [9.3 EEVEE Specific Settings](#93-eevee-specific-settings)
- [Part 10: Cycles Render Engine](#part-10-cycles-render-engine)
  - [10.1 Path Tracing Fundamentals](#101-path-tracing-fundamentals)
  - [10.2 Sampling and Adaptive Sampling](#102-sampling-and-adaptive-sampling)
  - [10.3 Denoising](#103-denoising)
  - [10.4 GPU Acceleration](#104-gpu-acceleration)
  - [10.5 Light Paths and Bounces](#105-light-paths-and-bounces)
  - [10.6 Caustics](#106-caustics)
- [Part 11: EEVEE vs Cycles Comparison](#part-11-eevee-vs-cycles-comparison)
- [Part 12: Lighting](#part-12-lighting)
  - [12.1 HDRI Environment Lighting](#121-hdri-environment-lighting)
  - [12.2 Light Types](#122-light-types)
  - [12.3 IES Profiles](#123-ies-profiles)
  - [12.4 Three-Point Lighting](#124-three-point-lighting)
  - [12.5 Studio and Product Lighting](#125-studio-and-product-lighting)
  - [12.6 Mesh Emission Lighting](#126-mesh-emission-lighting)
- [Part 13: Camera Settings](#part-13-camera-settings)
  - [13.1 Lens Types](#131-lens-types)
  - [13.2 Depth of Field](#132-depth-of-field)
  - [13.3 Motion Blur](#133-motion-blur)
  - [13.4 Sensor and Framing](#134-sensor-and-framing)
- [Part 14: Render Output](#part-14-render-output)
  - [14.1 Resolution and Frame Settings](#141-resolution-and-frame-settings)
  - [14.2 File Formats](#142-file-formats)
  - [14.3 Color Management](#143-color-management)
- [Part 15: Practical Tips and Common Pitfalls](#part-15-practical-tips-and-common-pitfalls)
- [Sources](#sources)

---

## Part 1: The Shader Editor

### 1.1 Node-Based Materials

Blender uses a node-based system for material and shader creation. Instead of adjusting a fixed set of material parameters, users build shader networks by connecting nodes -- each node performs a specific operation (mathematical function, texture lookup, color manipulation, or shading computation), and the connections between nodes determine how data flows from textures through processing to final surface appearance [1].

This approach provides unlimited flexibility: any combination of textures, color operations, and shader types can be wired together to create materials ranging from simple solid colors to complex multi-layered surfaces with procedurally-driven variation.

Every material in Blender consists of at least one shader node connected to the Material Output node. The Material Output node has three inputs:
- **Surface**: Defines the surface appearance (color, reflectivity, transparency, etc.)
- **Volume**: Defines volumetric effects within the object (fog, smoke, subsurface scattering media)
- **Displacement**: Defines physical surface displacement for rendering (Cycles only in most cases)

### 1.2 Material Slots and Assignment

Objects can have multiple materials. The Material Properties panel (checkered sphere icon) contains the material slot list:

- **Adding materials**: Click the `+` button to add a new slot, then create a new material or link an existing one.
- **Assigning materials to faces**: In Edit Mode, select faces, choose the target material slot, and click "Assign."
- **Material pass index**: Each material can have a pass index for compositing identification.
- **Viewport display color**: A separate simple color displayed in Solid viewport shading mode (does not affect rendering).

A single material can be shared across multiple objects. Changing the material affects all objects using it. To make an independent copy, click the number next to the material name (indicating how many users share it) to create a single-user copy [1].

### 1.3 Shader Editor Interface

The Shader Editor is accessed from the Shading workspace or by changing any editor type to "Shader Editor." It displays the node tree of the selected object's active material.

**Key Operations**:
- Shift + A: Add node menu
- Ctrl + T (with Principled BSDF selected): Adds Texture Coordinate, Mapping, and Image Texture nodes automatically (requires Node Wrangler add-on)
- Ctrl + Shift + Left Click on a node (Node Wrangler): Preview that node's output by connecting it to the Material Output
- Ctrl + Right Click drag: Cut links (disconnect connections)
- M: Mute/unmute selected node (bypasses it in the chain)
- H: Hide/collapse node
- Ctrl + G: Group selected nodes into a reusable node group
- Tab: Enter/exit a node group

The **Node Wrangler** add-on (included with Blender, enable in Preferences > Add-ons) provides essential quality-of-life features and is considered nearly mandatory for shader work [1].

---

## Part 2: The Principled BSDF Shader

### 2.1 Overview and Design Philosophy

The Principled BSDF is Blender's primary physically-based shader, designed to handle the vast majority of real-world materials through a single unified node. It was originally based on the Disney Principled BSDF model and has been significantly extended in Blender 4.0 and later [1, 2].

The shader is organized in layers, evaluated from bottom to top:
1. **Base layer**: Diffuse and metallic reflection (Base Color, Metallic, Roughness)
2. **Subsurface scattering**: Light transport beneath the surface
3. **Specular**: Dielectric (non-metallic) reflection adjustment
4. **Transmission**: Glass-like transparency
5. **Coat**: Clear coat or lacquer layer
6. **Sheen**: Fuzzy cloth and dust layer (topmost)
7. **Emission**: Self-illumination (additive)

This layered architecture means that increasing the Coat Weight, for example, physically occludes the base layer appropriately, maintaining energy conservation. The shader is energy-conserving by design -- the total light leaving the surface never exceeds the light arriving [1, 2].

### 2.2 Base Layer Parameters

**Base Color** (Color, default: 0.8, 0.8, 0.8)
The diffuse surface color for non-metallic materials, or the reflected specular color for metallic materials. For PBR workflows, connect an Albedo/Base Color texture map here. Avoid pure black (0,0,0) or pure white (1,1,1) -- real-world materials always have some color value between approximately 0.02 and 0.95 [1, 2].

**Metallic** (Float, 0.0--1.0, default: 0.0)
Blends between dielectric (non-metallic, 0.0) and metallic (1.0) shading models. At 0.0, the material uses the Base Color for diffuse reflection and has a white specular reflection. At 1.0, there is no diffuse component -- the Base Color determines the specular reflection color, matching real metal behavior. In PBR workflows, this should be either 0.0 (dielectric) or 1.0 (metal), with intermediate values used only for transition zones like worn paint over metal [1, 2].

**Roughness** (Float, 0.0--1.0, default: 0.5)
Controls the microscopic surface roughness that determines how blurry or sharp reflections appear. At 0.0, the surface is perfectly smooth (mirror-like reflection). At 1.0, reflections are completely diffused. For PBR, connect a Roughness texture map here. Common values: polished metal 0.05--0.2, brushed metal 0.3--0.5, plastic 0.3--0.6, rough wood 0.6--0.9 [1, 2].

**IOR** (Float, default: 1.5)
Index of Refraction. Controls the strength of dielectric (non-metallic) specular reflection and the refraction angle for transmissive materials. Real-world IOR values: air 1.0, water 1.33, glass 1.5, diamond 2.42. The default of 1.5 is a good approximation for most common materials including glass, plastic, and gemstones. This single parameter now controls both specular reflection intensity and transmission refraction (Blender 4.0 change) [2].

**Alpha** (Float, 0.0--1.0, default: 1.0)
Surface transparency for alpha blending or alpha clipping. At 1.0, the surface is fully opaque. At 0.0, fully transparent (invisible). Used for cutout effects (leaves, chain-link fences) via the Alpha Clip blend mode, or for gradual transparency via Alpha Blend or Alpha Hashed [1].

### 2.3 Subsurface Scattering Parameters

Subsurface scattering (SSS) simulates light entering a translucent material, scattering beneath the surface, and exiting at a different point. Essential for organic materials like skin, wax, marble, milk, and plant leaves [1, 2].

**Subsurface Weight** (Float, 0.0--1.0, default: 0.0)
Controls the blend between pure surface diffuse (0.0) and subsurface scattering (1.0). At 1.0, all diffuse light is processed through the SSS model instead of the Lambertian/Oren-Nayar model.

**Subsurface Radius** (Vector, default: 1.0, 0.2, 0.1)
The RGB scattering radius -- how far light travels beneath the surface for each color channel. Red light typically scatters farthest in skin (explaining the warm glow of backlighting on ears and fingers), followed by green and blue. The default (1.0, 0.2, 0.1) approximates Caucasian skin.

**Subsurface Scale** (Float, default: 0.05)
Global multiplier for the Subsurface Radius values. Adjusts the overall scattering distance without changing the color ratio. Increase for larger objects or more translucent materials; decrease for smaller objects or more opaque materials. This was added in Blender 4.0 to replace the previous separate color input [2].

**Subsurface IOR** (Float, default: 1.4)
Index of refraction for the subsurface medium. Affects how light refracts as it enters the surface. The default of 1.4 is appropriate for most organic materials.

**Subsurface Anisotropy** (Float, -1.0--1.0, default: 0.0)
Controls the directional bias of subsurface scattering. Positive values cause forward scattering (light passes through more easily), negative values cause back-scattering. Most materials use values near 0.0. Skin typically uses a slight forward scatter (0.0--0.3).

### 2.4 Specular Parameters

**Specular IOR Level** (Float, 0.0--1.0, default: 0.5)
A multiplier on the specular reflection intensity derived from the IOR. At 0.5 (default), the reflection intensity matches the physical IOR value. At 0.0, there is no specular reflection. At 1.0, the reflection is doubled. This provides artistic control over reflection brightness without changing the IOR that affects transmission [1, 2].

**Specular Tint** (Color, default: white)
Tints the specular reflection color for dielectric materials. Real dielectric materials have white specular reflections, but this parameter allows artistic coloring. Metallic materials inherently use Base Color for specular tint and ignore this input.

**Anisotropic** (Float, 0.0--1.0, default: 0.0)
Controls the elongation of specular highlights along one axis. At 0.0, highlights are circular (isotropic). At 1.0, highlights are maximally stretched. Used for brushed metal, hair, satin, and CDs. Requires proper tangent direction to orient the stretch direction [1, 2].

**Anisotropic Rotation** (Float, 0.0--1.0, default: 0.0)
Rotates the anisotropic stretch direction. 0.0 and 1.0 are identical (full rotation). 0.5 is a 90-degree rotation. Connect a texture to vary the rotation across the surface for effects like fingerprint patterns in brushed metal.

**Tangent** (Vector)
Defines the reference direction for anisotropic reflections. Defaults to the UV map tangent. Can be overridden with a Tangent node set to UV Map or Radial mode.

### 2.5 Transmission Parameters

**Transmission Weight** (Float, 0.0--1.0, default: 0.0)
Blends between opaque (0.0) and transmissive/refractive (1.0) behavior. At 1.0 with Roughness 0.0, the material appears as clear glass. At 1.0 with higher roughness, it appears as frosted glass. The IOR parameter controls the refraction angle [1, 2].

Transmission interacts with the following settings:
- IOR determines refraction bending
- Roughness controls the blur of transmitted light
- Base Color tints the transmitted light (colored glass)
- Alpha controls overall surface visibility (separate from transmission)

**Common Glass Setup**: Base Color white or tinted, Metallic 0.0, Roughness 0.0, IOR 1.5, Transmission Weight 1.0.

### 2.6 Coat Parameters

The Coat layer simulates a clear coating on top of the base material -- clear lacquer on wood, automotive clearcoat, varnish on paintings, or the protective layer on electronics. It sits above the base material in the layer stack [1, 2].

**Coat Weight** (Float, 0.0--1.0, default: 0.0)
Intensity of the coat layer. At 0.0, no coat effect. At 1.0, full coat strength.

**Coat Roughness** (Float, 0.0--1.0, default: 0.03)
Roughness of the coat layer, independent of the base material roughness. Low values (default 0.03) create a glossy clearcoat over a rough base material.

**Coat IOR** (Float, default: 1.5)
Index of refraction for the coat layer. Controls reflection intensity. Default 1.5 matches standard clear lacquer.

**Coat Tint** (Color, default: white)
Colors the coat layer. Useful for tinted varnish or colored lacquer effects. The tint absorbs light passing through it, affecting both the base material appearance and the coat reflection.

**Coat Normal** (Vector)
Allows the coat layer to have a different normal direction than the base material. Connect a separate normal map for orange-peel texture on the coat while the base material has its own surface detail.

### 2.7 Sheen Parameters

Sheen simulates the soft, fuzzy reflection seen on cloth, velvet, and dusty surfaces. In Blender 4.0+, the sheen layer uses a microfiber shading model and sits at the top of the material layer stack [1, 2].

**Sheen Weight** (Float, 0.0--1.0, default: 0.0)
Intensity of the sheen effect. At 0.0, no sheen. At 1.0, full sheen.

**Sheen Roughness** (Float, 0.0--1.0, default: 0.5)
Controls the spread of the sheen highlight. Low values create a tight edge highlight (silk), high values create a broad fuzzy appearance (felt, dust).

**Sheen Tint** (Color, default: white)
Colors the sheen reflection. Fabrics often have a lighter or different-colored sheen than their base color.

### 2.8 Emission Parameters

Emission makes the material self-luminous, emitting light. Emission is additive -- it does not replace the base material but adds light on top of it [1, 2].

**Emission Color** (Color, default: black/off)
The color of emitted light. Black means no emission.

**Emission Strength** (Float, default: 1.0)
Multiplier for emission intensity. In Cycles, emission with sufficient strength actually illuminates surrounding objects. In EEVEE, emission contributes to bloom and can illuminate nearby surfaces through screen-space effects. Values above 1.0 are common for practical light sources.

### 2.9 Normal and Displacement

**Normal** (Vector)
Connects a Normal Map or Bump node to perturb the surface normals, creating the illusion of surface detail without changing the actual geometry. This is the most common method for adding fine detail (pores, scratches, fabric weave, stone texture) to materials.

- **Normal Map Node**: Takes a tangent-space normal map texture (the blue/purple images) and converts it to the format expected by the Principled BSDF Normal input. Set the Color Space of the Image Texture node to Non-Color.
- **Bump Node**: Converts a grayscale height map into normal perturbation. Inputs for Strength (intensity) and Distance (physical scale). Can be chained with Normal Map nodes.

**Displacement** (via Material Output node, not Principled BSDF)
Physical displacement of the surface geometry during rendering:
- **Bump Only** (default): Only normal perturbation, no actual geometry change
- **Displacement Only**: Geometry is physically displaced based on the displacement texture. Requires the mesh to have sufficient subdivision (use Subdivision Surface modifier with Adaptive Subdivision in Cycles).
- **Displacement and Bump**: Combines physical displacement for large forms with bump mapping for fine detail -- the recommended approach for maximum quality.

Connect a Displacement node to the Material Output's Displacement input. The Displacement node takes a Height texture and outputs the displacement vector [1].

### 2.10 Thin Film Parameters

Added in Blender 4.0, thin film interference simulates iridescent effects caused by thin transparent layers (soap bubbles, oil slicks, beetle shells) [2].

**Thin Film Thickness** (Float, default: 0.0 nm)
Thickness of the thin film in nanometers. Different thicknesses produce different interference colors. At 0.0, thin film is disabled. Typical values range from 100 to 1000 nm.

**Thin Film IOR** (Float, default: 1.33)
Index of refraction for the thin film layer. Affects which wavelengths constructively and destructively interfere.

---

## Part 3: Mixing and Combining Shaders

Beyond the Principled BSDF (which handles most materials), Blender provides specialized shader nodes and mixing capabilities:

**Mix Shader**
Blends two shader outputs based on a factor (0.0 = first shader only, 1.0 = second shader only). Used when a single Principled BSDF is insufficient -- for example, mixing a Principled BSDF with a Translucent shader for leaf materials. Connect a texture to the Factor input for spatially-varying material transitions (e.g., rust over metal, moss over stone) [1].

**Add Shader**
Adds two shader outputs together without energy conservation. Unlike Mix Shader, which blends, Add Shader combines both shaders at full strength. Primarily used for adding Emission to another shader (though the Principled BSDF now has built-in emission, making this less necessary).

**Other Shader Nodes**:
- **Diffuse BSDF**: Pure Lambertian diffuse reflection (for specialized/stylized use)
- **Glossy BSDF**: Pure specular reflection with roughness (GGX, Beckmann, or Ashikhmin-Shirley distribution)
- **Glass BSDF**: Combined reflection and refraction
- **Refraction BSDF**: Pure refraction without reflection
- **Translucent BSDF**: Light passes through without refraction (for thin translucent surfaces like paper or leaves)
- **Transparent BSDF**: Perfectly transparent (used for alpha masking in custom setups)
- **Subsurface Scattering**: Standalone SSS node (Principled BSDF includes this)
- **Emission**: Pure emission shader
- **Volume Absorption**: Absorbs light within a volume (tinted glass interior, deep water)
- **Volume Scatter**: Scatters light within a volume (fog, smoke, clouds)
- **Principled Volume**: Combines absorption and scattering for volumetric materials
- **Hair BSDF / Principled Hair BSDF**: Specialized shaders for strand-based hair rendering
- **Toon BSDF**: Non-photorealistic cartoon-style shading

**Shader-to-RGB Node** (EEVEE only): Converts shader output to a color, enabling post-processing of lighting results for NPR (non-photorealistic rendering) effects like cel shading, outline detection, and custom ramp shading [1].

---

## Part 4: Procedural Textures

Procedural textures are generated mathematically rather than loaded from image files. They have infinite resolution, no UV seam issues, and can be easily varied with mathematical operations. Blender 4.4 provides the following procedural texture nodes [1]:

### 4.1 Noise Texture

Generates fractal Perlin noise -- the workhorse of procedural texturing. Produces smooth, organic, cloud-like patterns used for surface variation, terrain displacement, rust patterns, and countless other effects.

**Parameters**:
- **Scale**: Frequency of the noise pattern (higher = smaller features)
- **Detail**: Number of fractal octaves (higher = more fine-grained detail layered on top)
- **Roughness**: How much each octave contributes relative to the previous (affects the roughness of the fractal)
- **Lacunarity**: Frequency multiplier between octaves
- **Distortion**: Warps the noise coordinates for more organic patterns
- **Noise Dimensions**: 1D, 2D, 3D, or 4D (4D adds animation capability via W coordinate)
- **Type**: fBM (fractional Brownian motion), Multifractal, Hybrid Multifractal, Ridged Multifractal, Hetero Terrain (these correspond to the former Musgrave types, merged into Noise in 4.1) [14]

**Outputs**: Fac (grayscale, 0-1 range) and Color (colored noise pattern).

### 4.2 Voronoi Texture

Generates Worley noise (cell noise) -- patterns based on distance to random feature points. Produces cellular, scale-like, cracked, or mosaic patterns [1].

**Parameters**:
- **Scale**: Density of cells
- **Randomness**: How randomly cells are distributed (0 = regular grid, 1 = fully random)
- **Feature**: F1 (distance to nearest point), F2 (distance to second nearest), Smooth F1, Distance to Edge
- **Distance**: Euclidean, Manhattan, Chebychev, Minkowski (with Exponent parameter)
- **Voronoi Dimensions**: 1D, 2D, 3D, or 4D

**Outputs**: Distance, Color, Position, W (all vary by mode). The Distance output creates cell patterns; the Color output assigns random colors to each cell; the Position output provides the feature point location.

**Common Uses**: Scales (reptile skin), cobblestones, cracked mud, cellular structures, stained glass, tile patterns.

### 4.3 Wave Texture

Generates procedural bands or rings with optional noise distortion [1].

**Parameters**:
- **Type**: Bands (parallel stripes) or Rings (concentric circles)
- **Bands/Rings Direction**: X, Y, Z, or Diagonal
- **Wave Profile**: Sine, Saw, Triangle
- **Scale**: Frequency of the wave pattern
- **Distortion**: Amount of noise-based distortion applied to the wave
- **Detail, Detail Scale, Detail Roughness**: Control the noise distortion characteristics
- **Phase Offset**: Shifts the wave pattern (useful for animation)

**Common Uses**: Wood grain (bands with noise distortion), water ripples (rings), fabric patterns, terrain layers.

### 4.4 Gradient Texture

Generates a smooth gradient based on position [1].

**Types**: Linear, Quadratic, Easing, Diagonal, Spherical, Quadratic Sphere, Radial.

- Linear: Straight gradient from 0 to 1
- Quadratic: Curved gradient (squared falloff)
- Easing: Smooth ease-in/ease-out gradient
- Spherical: Distance from center in a sphere
- Radial: Angle-based gradient around a center

**Common Uses**: Vignette effects, falloff masks for mixing materials by position, elevation-based material blending (grass to rock to snow).

### 4.5 Magic Texture

Generates complex, colorful patterns through trigonometric function interference. Produces psychedelic, tie-dye-like patterns [1].

**Parameters**:
- **Depth**: Number of trigonometric iterations (higher = more complex pattern)
- **Scale**: Frequency of the base pattern
- **Distortion**: Amount of displacement applied

**Common Uses**: Exotic alien surfaces, marble veining (when combined with color ramps), abstract textures, iridescent effects.

### 4.6 Checker Texture

Generates an alternating checkerboard pattern [1].

**Parameters**:
- **Color1, Color2**: The two alternating colors
- **Scale**: Size of the checker squares

**Common Uses**: Reference/measurement textures for UV distortion checking, tile floors, chess boards, fabric patterns.

### 4.7 Brick Texture

Generates a customizable brick wall pattern [1].

**Parameters**:
- **Color1, Color2**: Alternating brick colors
- **Mortar**: Mortar/grout color
- **Scale**: Overall pattern scale
- **Mortar Size**: Width of mortar lines
- **Mortar Smooth**: Softness of mortar edges
- **Brick Width, Row Height**: Brick proportions
- **Offset**: Brick stagger amount per row
- **Frequency**: How often the offset resets

**Common Uses**: Brick walls, tile patterns, stone masonry, parquet flooring.

### 4.8 White Noise Texture

Generates pure random values based on input coordinates. Unlike Noise Texture (which produces smooth, coherent noise), White Noise produces completely uncorrelated random values at each point [1].

**Parameters**:
- **Dimensions**: 1D, 2D, 3D, or 4D
- **Outputs**: Value (random float) and Color (random RGB)

**Common Uses**: Random ID generation per instance, seed values for other procedural effects, completely random per-face or per-vertex values.

### 4.9 Gabor Texture

Generates noise characterized by random interleaved bands, visually resembling oriented wave patterns. Added in recent Blender versions [14].

**Parameters**:
- **Scale**: Frequency of the pattern
- **Frequency**: Band frequency
- **Anisotropy**: Directional bias of the bands
- **Orientation**: Base angle of the bands

**Common Uses**: Fabric weave patterns, brushed surfaces, anisotropic material textures.

### 4.10 Musgrave Texture (Deprecated)

The Musgrave Texture node was merged into the Noise Texture node starting in Blender 4.1. The Musgrave types -- fBM, Multifractal, Hybrid Multifractal, Ridged Multifractal, and Hetero Terrain -- are now accessible as Type options within the Noise Texture node. Existing `.blend` files that used the Musgrave node are automatically converted on load [14].

The Musgrave types remain available and useful:
- **fBM**: Standard fractal Brownian motion (same as traditional Noise)
- **Multifractal**: Multiplied octaves producing more varied amplitude
- **Hybrid Multifractal**: Weighted combination of additive and multiplicative octaves
- **Ridged Multifractal**: Absolute value creates ridge-like features (mountain ridges, veins)
- **Hetero Terrain**: Erosion-like effects with plateau and valley characteristics

---

## Part 5: Image Textures and UV Mapping

### 5.1 Image Texture Node

The Image Texture node loads and samples an external image file. It is the primary method for applying photographic textures, painted textures, and baked maps [1].

**Parameters**:
- **Image**: The image data-block (loaded from file or created internally)
- **Color Space**: sRGB (for color textures like albedo), Non-Color (for data textures like normal maps, roughness, metallic), Linear
- **Interpolation**: Linear, Closest (no filtering), Cubic, Smart
- **Projection**: Flat (UV-based), Box (triplanar), Sphere, Tube
- **Extension**: Repeat, Extend (clamp edges), Clip (transparent outside 0-1)

**Box Projection**: Projects the texture from six orthogonal directions, blending between projections based on face normal. This eliminates the need for UV unwrapping and avoids seam artifacts. The Blend parameter controls the transition smoothness between projection directions. Box projection is ideal for terrain, architectural surfaces, and any object where UV unwrapping is impractical [1].

### 5.2 Texture Coordinate Systems

The Texture Coordinate node provides different coordinate systems for sampling textures:

| Output | Description | Use Case |
|--------|-------------|----------|
| Generated | 0--1 range based on bounding box | Quick texturing without UVs |
| Normal | Surface normal direction | Environment-sensitive effects |
| UV | UV map coordinates | Standard image texture mapping |
| Object | Object-space coordinates | Scale-independent procedural textures |
| Camera | Camera-space coordinates | View-dependent effects |
| Window | Screen-space coordinates | Overlay effects |
| Reflection | Reflected view direction | Fake environment reflections |

The **Mapping Node** is typically placed between the Texture Coordinate node and the texture node to transform coordinates: translate (offset the texture), rotate, and scale [1].

### 5.3 Texture Painting

Blender supports painting textures directly onto 3D surfaces in Texture Paint mode (enter from the mode selector or use the Texture Paint workspace):

- **Brush types**: Draw, Soften, Smear, Clone, Fill, Mask
- **Color source**: Foreground/Background color picker, gradient, or texture
- **Blending modes**: Mix, Darken, Multiply, Add, Subtract, Screen, Overlay, and others
- **Stencil**: Overlay an image as a reference guide
- **Texture Mask**: Use a texture to control brush opacity
- **Symmetry**: Paint symmetrically across X, Y, or Z axes
- **Slots**: Paint to different texture slots (Base Color, Roughness, Normal, etc.) simultaneously

For texture painting to work, the object must have UV coordinates and an image texture assigned to the material. Create a blank texture in the Image Editor (Image > New) and assign it to the relevant Image Texture node [1].

---

## Part 6: PBR Workflow

### 6.1 PBR Fundamentals

Physically Based Rendering (PBR) is a material authoring paradigm that constrains shader parameters to physically plausible ranges. PBR materials look correct under any lighting condition because they follow the fundamental principles of energy conservation and microfacet theory [1, 4].

The two core principles:
1. **Energy conservation**: A surface cannot reflect more light than it receives. If a material is highly reflective, its diffuse component must be correspondingly reduced.
2. **Fresnel effect**: All materials become more reflective at grazing angles. At head-on viewing angles, non-metals reflect approximately 2-5% of light; at near-parallel angles, they approach 100% reflection.

The Principled BSDF automatically handles both principles. PBR workflows are about providing accurate input data (textures) that describe the physical properties of the surface.

### 6.2 Standard PBR Texture Maps

A standard PBR material uses the following texture maps:

| Map | Color Space | Connects To | Description |
|-----|-------------|-------------|-------------|
| **Albedo / Base Color** | sRGB | Base Color | Surface color without lighting information. No shadows, no highlights -- just pure color. |
| **Roughness** | Non-Color | Roughness | Grayscale map. Black = smooth/glossy, White = rough/matte. |
| **Metallic** | Non-Color | Metallic | Grayscale map. Black = dielectric, White = metal. Should be binary (0 or 1) except at transition zones. |
| **Normal** | Non-Color | Normal (via Normal Map node) | Tangent-space normal map (blue/purple appearance). Encodes surface detail as directional perturbation. |
| **Height / Displacement** | Non-Color | Displacement (via Displacement node) | Grayscale map. Physically displaces geometry. Gray = neutral, White = raised, Black = lowered. |
| **Ambient Occlusion** | Non-Color | Multiply with Base Color | Grayscale map of contact shadows. Not physically needed (renderers compute AO), but can add subtle detail. |
| **Emission** | sRGB | Emission Color | Color map for self-illuminated areas (screens, lights, glowing elements). |
| **Opacity / Alpha** | Non-Color | Alpha | Grayscale map for transparency (leaves, chain-link, lace). |

### 6.3 Metallic vs Specular Workflow

Two PBR workflow variants exist in the industry:

**Metallic/Roughness Workflow** (Blender's default via Principled BSDF):
- Uses Metallic map (binary: 0 or 1) to classify surfaces
- Uses Roughness map for surface smoothness
- Simpler, fewer maps, industry standard for games (glTF, Unreal Engine, Unity)
- The Principled BSDF is designed around this workflow

**Specular/Glossiness Workflow** (alternative, used in some older pipelines):
- Uses Specular Color map (replaces Metallic and Base Color for reflective surfaces)
- Uses Glossiness map (inverse of Roughness)
- More flexible but harder to keep physically accurate
- Supported in Blender through custom node setups

For most Blender work, the Metallic/Roughness workflow with the Principled BSDF is the correct approach [4].

### 6.4 Connecting PBR Maps in Blender

Standard PBR material setup with the Principled BSDF:

1. Add an Image Texture node (Shift+A > Texture > Image Texture) for each map.
2. Load each texture file.
3. Set Color Space:
   - Base Color texture: sRGB
   - All other textures (Roughness, Metallic, Normal, Height, AO): Non-Color
4. Connect:
   - Base Color texture Color output > Principled BSDF Base Color
   - Roughness texture Color output > Principled BSDF Roughness
   - Metallic texture Color output > Principled BSDF Metallic
   - Normal texture Color output > Normal Map node Color > Principled BSDF Normal
   - Height texture Color output > Bump node Height > Principled BSDF Normal (or chain: Bump > Normal Map if using both)

5. For AO: Multiply the AO map with the Base Color using a MixRGB node set to Multiply, then connect the result to Base Color.

6. For displacement: Connect Height texture to a Displacement node, connect that to Material Output Displacement. Set Material Displacement Method to "Displacement and Bump" or "Displacement Only" in Material Properties > Settings > Surface.

**Node Wrangler Shortcut**: Select the Principled BSDF, press Ctrl+Shift+T, and select all texture files at once. Node Wrangler will automatically create Image Texture nodes, set color spaces, add Normal Map and Mapping nodes, and connect everything correctly [1].

---

## Part 7: Bump vs Displacement

Bump mapping and displacement mapping both add surface detail, but they work fundamentally differently:

**Bump Mapping**:
- Perturbs surface normals based on a height map, creating the illusion of depth
- Does not change the actual geometry -- the silhouette of the object remains smooth
- Very fast (no additional geometry needed)
- Visible artifacts at grazing angles and silhouette edges where the flat surface is evident
- Good for fine detail like pores, fabric weave, and subtle textures
- Works in both EEVEE and Cycles
- Connect via: Image Texture > Bump Node > Principled BSDF Normal input

**Normal Mapping**:
- Similar to bump mapping but uses a pre-computed normal map (tangent-space encoded as RGB)
- Can represent more complex surface detail than a simple height-based bump map
- Standard workflow for game assets: bake high-poly detail onto low-poly mesh
- Same silhouette limitation as bump mapping
- Connect via: Image Texture > Normal Map Node > Principled BSDF Normal input

**True Displacement**:
- Physically moves vertices during rendering based on a height map
- Changes the actual geometry, including silhouette and self-shadowing
- Requires sufficient mesh subdivision (use Adaptive Subdivision in Cycles: Render Properties > Subdivision > Dicing Rate)
- Significantly more expensive (more geometry = more memory and render time)
- Only works in Cycles (EEVEE does not support true displacement)
- Connect via: Image Texture > Displacement Node > Material Output Displacement input
- Set displacement method: Material Properties > Settings > Surface > Displacement Method

**Best Practice**: Use "Displacement and Bump" mode. Apply displacement for large-scale deformation (brick protrusion, cobblestone depth) and bump mapping for fine detail (mortar texture, surface scratches). This balances geometry cost with visual quality [1].

---

## Part 8: Specialized Material Techniques

### 8.1 Subsurface Scattering Materials

Subsurface scattering (SSS) is essential for realistic rendering of organic and translucent materials. Light enters the surface, bounces around internally, and exits at a different point, creating soft, glowing transitions.

**Skin**:
- Subsurface Weight: 0.3--0.7 (partial SSS, not fully translucent)
- Subsurface Radius: (1.0, 0.2, 0.1) for Caucasian skin; adjust hue for other skin tones
- Subsurface Scale: 0.01--0.05 (depends on object scale)
- Base Color: Skin albedo texture
- Roughness: 0.3--0.5

**Wax / Candle**:
- Subsurface Weight: 0.8--1.0
- Subsurface Radius: (1.0, 0.5, 0.3) -- warmer, more uniform scattering
- Subsurface Scale: 0.05--0.2
- Base Color: Warm off-white or cream
- Roughness: 0.4--0.6

**Marble**:
- Subsurface Weight: 0.3--0.5
- Subsurface Radius: (0.8, 0.6, 0.4) -- relatively uniform
- Base Color: Veined marble texture
- Roughness: 0.1--0.3 (polished marble is quite smooth)

**Milk**:
- Subsurface Weight: 1.0
- Subsurface Radius: (1.0, 0.8, 0.6)
- Transmission Weight: 0.1--0.3 (slight transparency)
- Base Color: Pure white or very slightly warm

**Leaves**:
- Use a Mix Shader blending Principled BSDF (top side) with Translucent BSDF (bottom side)
- The Translucent BSDF allows light to pass through without refraction
- Connect a leaf texture to both shaders
- Use a Fresnel or Layer Weight node as the Mix factor for angle-dependent blending [1]

### 8.2 Glass, Water, and Transparent Materials

**Clear Glass**:
- Base Color: White (or slight tint for colored glass)
- Metallic: 0.0
- Roughness: 0.0 (for clear glass) or 0.1--0.3 (for frosted glass)
- IOR: 1.5 (standard glass), 1.52 (crown glass), 1.62 (flint glass)
- Transmission Weight: 1.0
- In EEVEE: Set material Blend Mode to Alpha Hashed or Alpha Blend; enable Screen Space Refraction

**Colored Glass / Stained Glass**:
- Same as clear glass but with Base Color set to the desired tint
- For deeply colored glass, use a Volume Absorption node in the Volume socket of the Material Output for physically accurate coloring (thicker sections are darker)

**Water**:
- IOR: 1.33
- Transmission Weight: 1.0
- Roughness: 0.0 (calm water surface) or use a Noise Texture connected to Normal for wave distortion
- Base Color: Very slight blue-green tint or white
- For a water body, model the water surface as a thin shell and use Volume Absorption in the volume for depth coloring

**Thin Glass** (windows without modeling interior volume):
- Enable "Thin Walled" in the Principled BSDF settings (available as a checkbox in the shader node)
- This disables refraction distortion while keeping reflections, appropriate for flat window panes where the thickness is negligible

**Alpha-Based Transparency** (chain-link, lace, leaves):
- Connect an alpha/mask texture to the Alpha input
- In Material Properties > Settings > Surface, set Blend Mode to Alpha Clip (hard cutout) or Alpha Hashed (dithered, noise-based transparency)
- Set Shadow Mode to match the Blend Mode for correct shadows
- Enable Backface Culling if the material should not be visible from behind [1]

### 8.3 Fur and Hair Rendering

Blender offers two approaches to hair/fur rendering:

**Principled Hair BSDF** (for strand-based hair):
Used with Blender's Hair particle system or Hair Curves objects. The Principled Hair BSDF is specifically designed for cylindrical strand geometry.
- **Color**: Direct coloring, Melanin, or Absorption
- **Melanin concentration**: Controls hair color from blonde (low) through brown to black (high)
- **Melanin Redness**: Shifts toward red/auburn tones
- **Roughness**: Longitudinal and azimuthal roughness
- **Radial Roughness**: Controls light scattering around the hair strand
- **Coat**: Adds a coat layer on hair strands
- **IOR**: Default 1.55 for human hair
- **Random**: Per-strand random variation for Color, Roughness

**Hair Particle System / Hair Curves rendering**:
- **Cycles**: Renders individual hair strands as curves. Supports both Principled Hair BSDF and standard Principled BSDF. Strand shape (root/tip width), random length, and clumping affect appearance.
- **EEVEE**: Renders hair as strands or strips. More limited in quality than Cycles but significantly faster. EEVEE Next (4.2+) improved strand rendering with better transparency sorting.

**Material Setup for Hair**:
1. On the Hair particle system or Hair Curves, assign a material.
2. Use Principled Hair BSDF for physically-based hair (recommended).
3. Or use Principled BSDF with strand-aware texture coordinates for more artistic control.
4. Hair Info node provides per-strand data: Is Strand (boolean), Intercept (position along strand from root to tip), Length, Thickness, Tangent Normal, Random.
5. Use Hair Info > Intercept to create root-to-tip color gradients [1].

---

## Part 9: EEVEE Render Engine

### 9.1 EEVEE Architecture

EEVEE (Extra Easy Virtual Environment Engine) is Blender's real-time render engine. It uses rasterization -- the same technique used by game engines -- rather than ray tracing. Objects are drawn to the screen by projecting their triangles through a virtual camera, with lighting calculated per-pixel using screen-space approximations [1, 7].

EEVEE's speed makes it ideal for:
- Real-time viewport previewing while building materials
- Animation playback and previsualization
- Stylized and non-photorealistic rendering
- Projects where render time is a critical constraint
- Game asset development and visualization

EEVEE's limitations relative to path tracing:
- No true global illumination (approximated via screen-space techniques and light probes)
- No true reflections of objects not visible on screen
- Limited transparency sorting (alpha blending order issues)
- Approximated subsurface scattering
- No true caustics

### 9.2 EEVEE Next (Blender 4.2+)

Blender 4.2 LTS introduced EEVEE Next, a complete rewrite of the EEVEE engine that addresses many long-standing limitations [7, 8]:

**Virtual Shadow Maps**:
Shadows are now rendered using virtual shadow maps with dramatically higher resolution (4096 vs previous 1024). Light visibility is computed using Shadow Map Ray Tracing, providing plausible soft shadows without shadow jittering. This eliminates the need for careful per-light shadow map configuration [8].

**Screen-Space Global Illumination (SSGI)**:
EEVEE Next traces rays in screen space for every BSDF, with no limitation on the number of BSDFs. Indirect light bounces off walls, floors, and objects, illuminating areas that would otherwise be in shadow. This is not true global illumination but is a significant improvement over the previous probe-only approach [8].

**Unlimited Lights**:
There is no longer a hard limit on the number of lights in a scene (previously limited). Up to 4,096 lights can be visible simultaneously.

**Light Probes Overhaul**:
- **Irradiance Volumes**: Capture diffuse indirect lighting in a 3D grid (unchanged concept, improved quality)
- **Reflection Probes**: Replaced Reflection Cubemaps with a more streamlined system
- Screen-space ray tracing now handles most reflection cases, reducing dependence on probes

**Displacement Support**:
EEVEE Next supports displacement mapping (previously Cycles-only for true displacement), though with performance characteristics suited to real-time constraints.

**Other EEVEE Next Changes**:
- Ambient occlusion is now part of SSGI rather than a separate effect
- Bloom is now a compositor effect (removed from render settings)
- Subsurface scattering uses a new screen-space diffusion model
- Volumetrics improvements with better quality and performance
- Transparent surface rendering improvements [7, 8]

### 9.3 EEVEE Specific Settings

Key EEVEE-specific render settings (Render Properties panel):

**Sampling**:
- Render Samples: Number of temporal anti-aliasing samples (higher = cleaner, slower). 64--256 typical.
- Viewport Samples: Samples for viewport rendering (16--64 typical).

**Bloom** (pre-4.2: Render Settings; 4.2+: Compositor):
Adds a glow around bright areas. Threshold, Intensity, Radius, and Color Tint controls.

**Screen Space Reflections**:
- Refraction: Enable for refractive materials (glass)
- Half Resolution: Trade quality for speed
- Trace Precision: Ray marching step accuracy

**Volumetrics**:
- Start/End Distance: Range of volume rendering
- Tile Size: Resolution of volume sampling
- Samples: Quality of volume lighting
- Distribution: Exponential falloff

**Film**:
- Overscan: Renders a larger area than the frame to reduce edge artifacts in screen-space effects
- Filter Size: Anti-aliasing filter width

---

## Part 10: Cycles Render Engine

### 10.1 Path Tracing Fundamentals

Cycles is Blender's physically-based path tracing render engine. It simulates light transport by tracing rays from the camera through each pixel into the scene, bouncing them off surfaces according to the material's BSDF, and accumulating the lighting contributions from all paths that reach light sources [1, 9].

Path tracing produces physically accurate results including:
- True global illumination (light bouncing between surfaces)
- Accurate reflections and refractions
- Physically correct soft shadows from area lights
- Caustics (focused light patterns through refractive surfaces)
- Subsurface scattering
- Volumetric lighting (god rays, fog, smoke)

The trade-off is noise: because each pixel samples a limited number of random light paths, the initial result is noisy. More samples reduce noise but increase render time linearly. Denoising algorithms provide the practical solution -- rendering with moderate sample counts and using AI-based denoisers to clean the remaining noise [1, 9].

### 10.2 Sampling and Adaptive Sampling

**Render Samples** (Render Properties > Sampling > Render):
The maximum number of light paths traced per pixel. Higher values = less noise, longer render time. Practical ranges:
- Quick preview: 32--128 samples
- Draft quality: 128--512 samples
- Production quality: 512--2048 samples
- Complex interiors with caustics: 2048--4096+ samples

**Viewport Samples**:
Samples for the viewport rendered preview. Typically 32--128 for interactive work.

**Adaptive Sampling**:
Blender's adaptive sampling system detects when individual pixels have converged (noise is below a threshold) and stops tracing additional samples for those pixels. This concentrates computation on noisy areas.
- **Noise Threshold**: The convergence threshold. Lower values = cleaner image, more computation. A value of 0.01 is a good starting point. Values of 0.001 are suitable for very clean production renders.
- **Min Samples**: Minimum samples before adaptive sampling can stop a pixel. Prevents premature convergence detection.

With adaptive sampling, the Render Samples value acts as a maximum. Simple areas (flat surfaces with direct lighting) converge quickly, while complex areas (glass caustics, deep shadows) use more samples. This can reduce render time by 50% or more compared to fixed sampling [1, 9].

**Scrambling Distance**:
A form of multi-resolution sampling that can improve convergence in scenes with many lights. Automatic mode handles most cases.

### 10.3 Denoising

Denoising removes noise from rendered images using AI-trained algorithms. Blender supports several denoisers [1, 9]:

**OpenImageDenoise (OIDN)**:
- Open-source, CPU-based (with GPU acceleration on supported hardware)
- Developed by Intel, integrated into Blender
- Works with all GPU backends and CPU rendering
- Produces clean results with minimal detail loss
- Recommended as the default denoiser for most workflows

**OptiX Denoiser**:
- NVIDIA proprietary, GPU-accelerated using Tensor Cores on RTX GPUs
- Very fast, near-instant for viewport denoising
- Requires NVIDIA RTX GPU
- Improved consistency in Blender 4.4 [3]
- Excellent for viewport preview denoising during interactive work

**Denoising Data Passes**:
When rendering for compositing, enable "Denoising Data" in View Layer Properties > Passes. This generates albedo, normal, and noise-level auxiliary passes that the denoiser uses for better results. These passes can also be fed to external denoisers or custom compositing workflows.

**Compositor Denoising**:
The Denoise node in the Compositor allows post-render denoising with full control. Connect the Noisy Image along with Denoising Normal and Denoising Albedo passes for optimal results. This approach allows rendering once and experimenting with denoising settings without re-rendering.

**Practical Tip**: Render at 256--512 samples with adaptive sampling (threshold 0.01) and apply OIDN denoising. This combination produces results nearly indistinguishable from thousands of samples at a fraction of the render time.

### 10.4 GPU Acceleration

Cycles supports GPU rendering through multiple compute backends [9]:

| Backend | GPU Vendor | Requirements | Features |
|---------|------------|--------------|----------|
| **CUDA** | NVIDIA | Compute Capability 5.0+ (GTX 900+) | Full feature support, stable |
| **OptiX** | NVIDIA | RTX GPUs (hardware RT cores) | Fastest on RTX hardware, AI denoising via Tensor Cores |
| **HIP** | AMD | RDNA+ architecture (RX 5000+) | Full feature support; HIP RT no longer experimental in 4.4 [3] |
| **oneAPI** | Intel | Arc GPUs (Alchemist+) | Full feature support |
| **Metal** | Apple | M-series and AMD GPUs on macOS | Full feature support on Apple Silicon |

**Configuration**: Edit > Preferences > System > Cycles Render Devices. Select the compute backend and check the GPUs to use. Multiple GPUs can be used simultaneously. CPU + GPU rendering is also possible (the CPU processes tiles alongside the GPU).

**Memory Management**: If GPU VRAM is insufficient for the scene, Cycles will automatically fall back to system RAM. This avoids out-of-memory failures but is significantly slower than pure GPU rendering. Strategies to reduce VRAM usage:
- Reduce texture resolution
- Disable unnecessary render passes
- Reduce geometry complexity
- Use OptiX (uses less VRAM than CUDA for the same scene)
- Close other GPU-intensive applications [9]

**OptiX vs CUDA Performance**: OptiX leverages dedicated RT cores on RTX GPUs for hardware-accelerated ray-BVH intersection, typically providing 20-50% faster rendering than CUDA on the same hardware. OptiX also benefits from Tensor Core-accelerated denoising, making interactive viewport rendering faster [9].

### 10.5 Light Paths and Bounces

Light paths in Cycles are controlled via Render Properties > Light Paths. These settings determine how many times light can bounce before a path is terminated [1, 9]:

**Max Bounces** (Total): The absolute maximum number of bounces for any light path. Default: 12.

**Per-Type Bounce Limits**:

| Type | Default | Description |
|------|---------|-------------|
| Diffuse | 4 | Bounces off diffuse (matte) surfaces. Affects color bleeding and indirect illumination. |
| Glossy | 4 | Bounces off reflective surfaces. Affects mirror reflections and metallic inter-reflections. |
| Transmission | 12 | Bounces through transmissive materials. Needs to be high for nested glass (a glass inside a water volume). |
| Volume | 0 | Bounces within volumetric materials. Increase for complex fog/cloud lighting. |
| Transparent | 8 | Passes through fully transparent surfaces. Needs to be high for scenes with many transparent layers (foliage). |

**Clamping**:
- **Clamp Direct**: Limits the maximum brightness of a single direct lighting sample. Reduces fireflies (extremely bright pixels from small light sources or specular highlights). A value of 0 disables clamping. Start with 10.0 and reduce if fireflies persist.
- **Clamp Indirect**: Same for indirect (bounced) lighting. More commonly needed than direct clamping. Start with 10.0.

**Filter Glossy**: Blurs glossy reflections after blurry bounces to reduce noise. A value of 1.0 is a good starting point. This trades slight inaccuracy for significantly reduced noise in glossy inter-reflections.

**Light Tree**: An acceleration structure that helps the renderer choose which lights to sample for each shading point. Enabled by default; improves performance in scenes with many lights.

### 10.6 Caustics

Caustics are focused light patterns created when light passes through or reflects off curved transparent or reflective surfaces (the bright pattern at the bottom of a pool, the focused spot from a magnifying glass). They are physically important but computationally expensive for path tracers [9].

**Reflective Caustics**: Focused light from curved mirrors. Enabled by default in Cycles.

**Refractive Caustics**: Focused light through glass or water. Disabled by default because they require many samples to resolve without noise.

**Enabling Caustics**: Render Properties > Light Paths > Caustics. Enable Reflective and/or Refractive. Expect significantly more noise and longer render times. Use high sample counts (2048+) and denoising.

**Caustic Alternatives**:
- Fake caustics with projected texture patterns (much faster, artistic control)
- Light Paths > Caustics > Caustic Refractive: The dedicated caustic algorithm (when available) uses specialized sampling to resolve caustics more efficiently
- For most production work, disable refractive caustics unless they are a key visual element

---

## Part 11: EEVEE vs Cycles Comparison

| Criterion | EEVEE | Cycles |
|-----------|-------|--------|
| **Rendering Method** | Rasterization (real-time) | Path tracing (offline) |
| **Render Speed** | Seconds to minutes | Minutes to hours |
| **Global Illumination** | Screen-space (SSGI in EEVEE Next) | True path-traced GI |
| **Reflections** | Screen-space + probes | True ray-traced reflections |
| **Refractions** | Screen-space approximation | True ray-traced refraction |
| **Shadows** | Virtual shadow maps (EEVEE Next) | True ray-traced shadows |
| **Subsurface Scattering** | Screen-space approximation | Physically accurate |
| **Caustics** | Not supported | Supported (expensive) |
| **Volumetrics** | Supported (approximated) | Physically accurate |
| **Hair/Fur** | Supported (simplified) | Full strand rendering |
| **Displacement** | Supported in EEVEE Next | Full adaptive subdivision |
| **Motion Blur** | Post-process based | True ray-traced |
| **Depth of Field** | Post-process based | True ray-traced bokeh |
| **GPU Memory** | Low requirements | High requirements for complex scenes |
| **Animation Render** | Fast (real-time per frame) | Slow (full render per frame) |
| **Material Compatibility** | Most Principled BSDF features | All shader features |
| **Light Count** | Up to 4,096 visible | Unlimited |
| **Best For** | Previsualization, stylized renders, animation, game assets | Photorealistic stills, VFX, product visualization, architectural visualization |
| **Academy Award Film** | *Flow* (2024) -- rendered entirely in EEVEE [6] | Industry standard for VFX |

**Practical Decision Guide**:
- Choose EEVEE when speed matters more than absolute physical accuracy, for animations with tight deadlines, for stylized/NPR work, or when the scene lighting is simple enough that EEVEE's approximations are indistinguishable from path tracing.
- Choose Cycles when physical accuracy is essential, for complex indoor lighting, for product/architectural visualization where clients expect photorealism, or when caustics, true DOF, or complex transparency are needed [7].

---

## Part 12: Lighting

### 12.1 HDRI Environment Lighting

HDRI (High Dynamic Range Image) environment lighting provides both illumination and a background in a single step. An HDRI is a 360-degree panoramic photograph captured with a wide dynamic range, containing real-world lighting information [11].

**Setup**:
1. Go to World Properties (globe icon).
2. Click "Use Nodes" (if not already enabled).
3. Add an Environment Texture node (Shift+A > Texture > Environment Texture).
4. Load an HDRI file (.hdr or .exr format).
5. Connect the Color output to the Background node's Color input.
6. The Background node's Strength controls the overall brightness.
7. Add a Mapping node between Texture Coordinate (Generated) and Environment Texture to rotate the HDRI.

**Tips**:
- HDRI resolution affects shadow sharpness and reflection detail. 4K (4096x2048) is minimum for production; 8K or higher for close-up reflections.
- Use a separate sun lamp synchronized to the HDRI's sun position for sharper sun shadows (the HDRI's sun is spread across multiple pixels, producing soft shadows). EEVEE Next's sun extraction feature can do this automatically [8].
- For indoor scenes, HDRIs provide fill light through windows, but additional interior lights are usually needed.
- Free HDRI libraries: Poly Haven (polyhaven.com), HDRI Haven, ambientCG [11].

### 12.2 Light Types

Blender provides four light object types, each simulating a different real-world light source:

**Point Light**
Emits light equally in all directions from a single point (bare bulb, candle flame).
- **Power**: Light intensity in Watts
- **Radius**: Physical size of the light source (larger = softer shadows; 0 = infinitely small point)
- **Shadow**: Soft shadows when Radius > 0

**Sun Light**
Parallel rays from an infinitely distant source. No distance falloff -- the light intensity is identical everywhere in the scene (simulating the actual sun).
- **Strength**: Light intensity
- **Angle**: Angular size of the sun disc (affects shadow softness; real sun is approximately 0.53 degrees)
- Rotation of the sun object determines light direction; its position in the scene does not matter

**Spot Light**
Cone-shaped light emission (stage light, flashlight, recessed ceiling light).
- **Power**: Light intensity in Watts
- **Radius**: Physical size for shadow softness
- **Spot Size**: Cone angle (full width)
- **Blend**: Softness of the cone edge (0 = sharp edge, 1 = fully soft)
- **Show Cone**: Visual display of the light cone in the viewport

**Area Light**
Light emitted from a rectangular, square, elliptical, or disc-shaped surface. Produces the most natural soft shadows of any light type because it simulates actual surface-area light sources (windows, softboxes, LED panels).
- **Power**: Light intensity in Watts
- **Shape**: Square, Rectangle, Disk, Ellipse
- **Size / Size X / Size Y**: Physical dimensions of the light surface
- **Spread**: Angular spread of light emission (180 = full hemisphere, lower = more focused)
- Larger area lights produce softer shadows; smaller ones produce sharper shadows [11]

### 12.3 IES Profiles

IES (Illuminating Engineering Society) profiles are data files that describe the photometric distribution pattern of real-world light fixtures. Each profile defines exactly how light is emitted in each direction, producing the characteristic patterns of specific lights (wall washers, track lights, recessed cans, etc.) [11].

**Using IES in Blender** (Cycles only):
1. Add a Point or Spot light.
2. In the Shader Editor (with the light selected), the light's node tree is visible.
3. Add an IES Texture node (Shift+A > Texture > IES Texture).
4. Load the .ies file.
5. Connect the IES Texture Fac output to the Emission node's Strength input.

IES profiles are available from lighting manufacturers (Philips, GE, Lithonia) and online databases. They are essential for architectural visualization where specific fixture appearances must be matched.

**Limitation**: IES profiles work only in Cycles. EEVEE does not support them [11].

### 12.4 Three-Point Lighting

The classic three-point lighting setup is the foundation of portrait, character, and product lighting:

**Key Light**: The main light source, positioned approximately 45 degrees to one side and 45 degrees above the subject. This is the dominant light that defines the primary shadow direction. Typically the brightest light.
- Use an Area Light for natural soft shadows
- Position at roughly 2x the subject's height above the ground plane

**Fill Light**: A softer, dimmer light positioned on the opposite side from the key light. It reduces the contrast of shadows created by the key light without eliminating them. Typically 50-70% the intensity of the key light.
- Use a larger Area Light or diffused light source
- Position slightly lower than the key light

**Back Light (Rim Light)**: Positioned behind and above the subject, pointing toward the camera. Creates a bright edge highlight that separates the subject from the background and adds depth.
- Position directly behind the subject or slightly to one side
- Adjust intensity to create a subtle rim or dramatic glow

**In Blender**: Create three Area Lights, position them as described, and adjust their power until the lighting looks balanced. Use Material Preview or Rendered viewport mode to see the effect in real-time. HDRI environment lighting can serve as a global fill, reducing the number of explicit lights needed [11].

### 12.5 Studio and Product Lighting

For product visualization and studio-style renders:

**Infinite Background (Cyclorama)**:
- Model a curved plane that transitions from floor to backdrop without a visible seam.
- Assign a neutral material (white or light gray, Roughness 0.8--1.0).
- This prevents hard floor-to-wall shadow lines.

**Softbox Simulation**:
- Create a plane with an Emission material (high Emission Strength, white color).
- Position it as you would a physical softbox.
- The emission plane functions as an area light with complete control over shape and position.
- In Cycles, this works naturally. In EEVEE, mesh emission contributes to lighting through SSGI.

**Light Tent / Diffusion**:
- For high-reflectivity products (jewelry, cars), surround the object with large emission planes to create smooth, continuous reflections.
- A common technique: three to five large emission planes arranged in a rough sphere around the product, with gaps for the camera to shoot through.

**Gradient Backgrounds**:
- Use a large plane behind the subject with a gradient material (Gradient Texture > ColorRamp > Emission) to create a smooth background gradient [11].

### 12.6 Mesh Emission Lighting

Any mesh can become a light source by adding an Emission shader or increasing the Emission Strength in the Principled BSDF:

- **Cycles**: Mesh emission is fully supported. The mesh emits light that bounces around the scene naturally. This is ideal for neon signs, TV screens, practical lamp shades, and decorative lighting. More geometry means more noise to resolve.
- **EEVEE**: Mesh emission contributes to bloom and SSGI in EEVEE Next. It does not produce hard shadows. For EEVEE, combine mesh emission with actual light objects for best results.
- **Light Power**: Emission Strength values above 1.0 produce practical lighting. Typical values range from 5 to 1000+ depending on the desired brightness and scene scale [11].

---

## Part 13: Camera Settings

### 13.1 Lens Types

**Perspective** (default):
Simulates a standard photographic lens. Objects farther from the camera appear smaller. Controlled by Focal Length (in mm) or Field of View (in degrees):
- 16--24mm: Wide angle (architecture, interiors, landscape)
- 35--50mm: Standard (close to human vision)
- 85--135mm: Portrait (flattering facial proportions, background compression)
- 200mm+: Telephoto (wildlife, sports, extreme background compression)

**Orthographic**:
No perspective distortion -- parallel lines remain parallel. Objects maintain the same size regardless of distance. Controlled by Orthographic Scale (meters).
- Used for: Architectural drawings, isometric game art, technical illustrations, 2D animation backgrounds

**Panoramic** (Cycles only):
Renders a panoramic image type:
- Equirectangular: 360-degree spherical panorama (for VR and HDRI creation)
- Fisheye Equidistant/Equisolid: Extreme wide-angle lens simulation
- Mirror Ball: Simulates photographing a reflective sphere [1]

### 13.2 Depth of Field

Depth of field (DOF) simulates the selective focus of a camera lens, blurring objects that are not at the focus distance:

**Settings** (Camera Object Data Properties > Depth of Field):
- **Focus Object**: An object whose position determines the focus distance (useful for tracked focus in animations)
- **Focus Distance**: Manual distance from camera to focal plane (if no focus object is set)
- **F-Stop**: Aperture size (lower values = more blur/bokeh, narrower depth of field)
  - f/1.4: Extreme shallow DOF (portrait photography)
  - f/2.8--f/4: Moderate DOF (general photography)
  - f/8--f/11: Deep DOF (landscape photography)
  - f/22+: Nearly everything in focus

**Cycles DOF**: True ray-traced DOF produces physically accurate bokeh with correct shapes, aberrations, and falloff. Blades setting controls the bokeh shape (0 = circular, 5+ = polygonal).

**EEVEE DOF**: Post-process based, applied after rendering. Faster but less physically accurate, with potential artifacts around high-contrast edges [1].

### 13.3 Motion Blur

Motion blur simulates the streak created by moving objects during the camera's exposure time:

**Cycles Motion Blur** (Render Properties > Motion Blur):
- **Position**: Start, Center, or End of frame (determines when the shutter opens relative to the frame time)
- **Shutter**: Exposure time as fraction of frame (1.0 = full frame, 0.5 = half frame)
- **Rolling Shutter**: Simulates the sequential scanline exposure of CMOS sensors
- True geometric motion blur -- objects are actually traced at sub-frame positions

**EEVEE Motion Blur**: Post-process based using velocity vectors. Faster but limited to screen-space information. Does not handle rotation or complex deformations as accurately as Cycles [1].

### 13.4 Sensor and Framing

**Sensor Size** (Camera Object Data Properties > Camera):
Simulates the physical sensor dimensions of a real camera. Affects the field of view for a given focal length. Common presets match real cameras (Full Frame 36mm, APS-C 23.6mm, Micro Four Thirds 17.3mm). Custom sizes are supported.

**Clip Start / End**: Near and far clipping distances. Objects closer than Clip Start or farther than Clip End are not rendered. Default: 0.1m to 100m. Adjust for very small or very large scenes.

**Safe Areas**: Overlays showing title-safe and action-safe regions for broadcast standards. Configured per camera.

**Passepartout**: The dark overlay outside the camera frame. Adjustable alpha (transparency) helps distinguish the rendered region from the surrounding viewport [1].

---

## Part 14: Render Output

### 14.1 Resolution and Frame Settings

**Resolution** (Output Properties > Format):
- Resolution X / Y: Pixel dimensions of the output image. Common values: 1920x1080 (Full HD), 3840x2160 (4K UHD), 2560x1440 (QHD).
- Resolution %: Scale factor applied to the resolution (useful for test renders at 50% or 25% resolution).
- Aspect Ratio X / Y: Pixel aspect ratio (1:1 for square pixels, used for most displays; non-square for anamorphic formats).

**Frame Rate**: 24 (film), 25 (PAL), 30 (NTSC), 60 (smooth video), or custom.

**Frame Range**: Start Frame, End Frame, Frame Step (render every Nth frame for previews).

### 14.2 File Formats

**Image Formats**:

| Format | Bit Depth | Features | Best For |
|--------|-----------|----------|----------|
| **PNG** | 8/16-bit | Lossless, alpha channel | Web, UI, general purpose |
| **JPEG** | 8-bit | Lossy compression, small files | Quick previews, web delivery |
| **OpenEXR** | 16/32-bit float | HDR, multi-layer, lossless | Compositing, VFX, professional pipeline |
| **TIFF** | 8/16-bit | Lossless, industry standard | Print, archival |
| **BMP** | 8-bit | Uncompressed | Legacy compatibility |
| **WebP** | 8-bit | Lossy/lossless, small files | Web delivery |

**Video Formats** (via FFMPEG):

| Container | Codec | Notes |
|-----------|-------|-------|
| MP4 | H.264 | Universal compatibility, good quality |
| MP4 | H.265/HEVC | Better compression than H.264 (new in 4.4) [3] |
| MKV | Various | Flexible container |
| AVI | Raw | Uncompressed, very large files |
| WebM | VP9 | Web-optimized |

**Best Practice for Animation**: Render individual frames as PNG or OpenEXR image sequences, not as video files. If Blender crashes mid-render, you only lose the current frame rather than the entire video. Assemble the image sequence into a video file afterward using the Video Sequence Editor or external software (FFmpeg) [1].

### 14.3 Color Management

Blender uses OpenColorIO (OCIO) for color management, ensuring consistent color throughout the pipeline from texturing to rendering to output [12].

**Display Device**: The type of display (sRGB for standard monitors, Display P3 for wide-gamut displays).

**View Transform**: How the scene's high-dynamic-range data is mapped to the display's limited range:

| Transform | Description | Best For |
|-----------|-------------|----------|
| **AgX** (default since 4.0) | Desaturates bright areas toward white, similar to film response. Excellent handling of saturated highlights without hue shifting. Named after silver halide (AgX) in photographic film. | General-purpose rendering, photorealism [12] |
| **Filmic** (legacy) | Expanded dynamic range with filmic tone mapping. Previously the default before AgX. | Legacy compatibility, older projects [12] |
| **Standard** | sRGB display transfer function, no tone mapping. Highlights clip harshly. | Data visualization, texture baking, non-photographic output |
| **Raw** | No color management. Linear data displayed directly. | Inspecting raw render data, debugging |

**AgX vs Filmic**: AgX replaced Filmic as the default in Blender 4.0. AgX handles saturated highlights more gracefully -- bright colored light desaturates toward white naturally, matching real camera behavior. Filmic tended to shift hues in over-exposed areas. AgX is an OCIOv2 config supporting sRGB, Display P3, and BT.1886 displays, while Filmic was OCIOv1 with only sRGB support [12].

**Look**: Additional contrast curves applied on top of the view transform:
- None (default)
- Very High Contrast / High Contrast / Medium High Contrast
- Medium Low Contrast / Low Contrast / Very Low Contrast
- Punchy (AgX-specific)

**Exposure**: Global exposure adjustment in stops (1 stop = 2x brightness).

**Gamma**: Display gamma correction (default 1.0).

**Sequencer / Compositing Color Space**: Determines the working color space for the VSE and Compositor.

**Best Practice**: Use AgX for all new projects. Set View Transform to AgX, Look to None (or adjust for artistic preference). Ensure all non-color textures (Normal, Roughness, Metallic, Height) are set to Non-Color in their Image Texture nodes to prevent double-correction [12].

---

## Part 15: Practical Tips and Common Pitfalls

### Material Pitfalls

1. **Color space errors**: The most common material mistake. Normal maps, roughness maps, metallic maps, and height maps MUST be set to Non-Color in the Image Texture node. Only albedo/base color and emission textures use sRGB. Incorrect color space produces washed-out normals, exaggerated roughness, and incorrect metallic behavior.

2. **Missing normal map node**: Connecting an image texture directly to the Normal input of the Principled BSDF does not work correctly. Always insert a Normal Map node between the texture and the shader.

3. **Principled BSDF parameter ranges**: Metallic should be 0 or 1 (not in between, except at material transitions). Base Color should never be pure black or pure white -- real materials range from approximately 0.02 to 0.95.

4. **Alpha transparency not showing**: Enable the appropriate Blend Mode in Material Properties > Settings > Surface (Alpha Clip, Alpha Hashed, or Alpha Blend). Also set Shadow Mode accordingly.

### Rendering Pitfalls

5. **Fireflies (bright pixel speckles)**: Caused by rare high-energy light paths (caustics, small bright reflections). Solutions: Clamp Indirect to 10.0, enable Filter Glossy at 1.0, increase samples, use denoising.

6. **Cycles renders black**: GPU not selected in Preferences > System > Cycles Render Devices, or the GPU driver is outdated. Also check that Render Engine is set to Cycles (not Workbench) in Render Properties.

7. **EEVEE materials look flat**: Enable Screen Space Reflections for reflective materials. Use Light Probes (Irradiance Volume) to capture indirect lighting. In EEVEE Next (4.2+), SSGI handles much of this automatically.

8. **Render output too dark or too bright**: Check Color Management settings. The View Transform should be AgX (or Filmic for older projects). Exposure defaults to 0.0 -- adjust if needed. A common mistake is leaving View Transform on "Standard" which clips highlights.

### Lighting Pitfalls

9. **Indoor scenes too dark in Cycles**: Interior scenes need high bounce counts (Diffuse bounces 8+, Total bounces 12+). Also ensure lights have sufficient power -- Area Light watts in Cycles should be 100--1000W for room lighting.

10. **HDRI not affecting scene**: Check that the HDRI is connected to the World's Background node. In EEVEE, ensure Light Probes are baked if using irradiance volumes.

### Performance Tips

11. **Reduce Cycles render time**: Use adaptive sampling (threshold 0.01), enable denoising (OIDN), lower bounce counts for test renders, use OptiX if on NVIDIA, render at lower resolution with higher percentage for previews.

12. **Reduce EEVEE artifacts**: Increase shadow map resolution, increase SSR trace precision, add light probes in areas with complex indirect lighting, enable Overscan to reduce edge artifacts.

13. **Test renders**: Use F12 for single-frame test renders. Ctrl+F12 renders the full animation. For quick tests, reduce Resolution % to 25-50% and lower Samples.

14. **Render layers and passes**: Use View Layers to separate foreground, background, and effects. Render passes (Diffuse, Glossy, Emission, Shadow, AO) allow post-render compositing adjustments without re-rendering.

15. **OpenEXR for compositing**: Always render to OpenEXR (Multilayer) for professional compositing workflows. The 32-bit float HDR data preserves maximum flexibility for color grading and effects in the Compositor or external tools (Nuke, DaVinci Resolve, After Effects).

---

## Sources

[1] "Blender Manual -- Rendering." docs.blender.org. https://docs.blender.org/manual/en/latest/render/

[2] "Shading & Texturing -- Blender 4.0 Release Notes." Blender Developer Documentation. https://developer.blender.org/docs/release_notes/4.0/shading/

[3] "Blender 4.4 Release Notes." Blender Developer Documentation. https://developer.blender.org/docs/release_notes/4.4/

[4] "PBR and the Principled BSDF Shader in Blender Explained." Artisticrender.com. https://artisticrender.com/physically-based-rendering-and-blender-materials/

[5] "Principled BSDF -- Blender Manual." docs.blender.org. https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html

[6] "Blender (software)." Wikipedia. https://en.wikipedia.org/wiki/Blender_(software)

[7] "EEVEE vs Cycles: Which Blender Render Engine is Right for You?" Fox Render Farm. https://www.foxrenderfarm.com/share/blender-eevee-vs-cycles/

[8] "EEVEE Next Generation in Blender 4.2 LTS." Blender Developers Blog. https://code.blender.org/2024/07/eevee-next-generation-in-blender-4-2-lts/

[9] "GPU Rendering -- Blender Manual." docs.blender.org. https://docs.blender.org/manual/en/latest/render/cycles/gpu_rendering.html

[10] "Light Paths -- Blender Manual." docs.blender.org. https://docs.blender.org/manual/en/latest/render/cycles/render_settings/light_paths.html

[11] "How to Add and Adjust Light Sources in Blender 3D." brandon3d.com. https://brandon3d.com/blender-lighting-manual/

[12] "Color Management -- Filmic AgX." Blender Developer Documentation. https://developer.blender.org/docs/release_notes/4.0/color_management/

[13] "Blender Principled BSDF." Gordon Brander. https://gordonbrander.com/pattern/blender-principled-bsdf/

[14] "Merging the Musgrave Texture and Noise Texture Nodes." Blender Developer Forum. https://devtalk.blender.org/t/merging-the-musgrave-texture-and-noise-texture-nodes/30646

[15] "Blender: A Cycles Render Settings Guide." Artisticrender.com. https://artisticrender.com/blender-a-cycles-render-settings-guide/

[16] "Filmic's Successor: New AGX View Transform in Blender 4.0." BlenderNation. https://www.blendernation.com/2023/09/05/filmics-successor-new-agx-view-transform-in-blender-4-0/

[17] "IES Lighting in Blender." Blendergrid. https://blendergrid.com/articles/ies-lighting-in-blender

[18] "Understanding Color Management in Blender." Blendergrid. https://blendergrid.com/articles/color-management-in-blender

[19] "5 Key Features in Blender 4.4." CG Channel. https://www.cgchannel.com/2025/03/5-key-features-in-blender-4-4/

[20] "EEVEE vs Cycles." Garagefarm.net. https://garagefarm.net/blog/eevee-vs-cycles

[21] "Blender Render Settings Optimization Guide." SuperRenders. https://superrendersfarm.com/article/blender-render-settings-optimization-guide
