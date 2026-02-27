"""
Infrastructure Engineering Materials Library
For use with the Physical Infrastructure Engineering Pack (v1.48)

How to use:
1. Open Blender's Scripting workspace (or switch to Scripting tab)
2. Click "New" to create a new text block
3. Paste this entire script
4. Click "Run Script" (or Alt+P)
5. All 7 materials will appear in the Material Properties panel
6. Assign to objects via Object Properties > Material > [Select material]

Requires: Blender 3.6+ (tested with 3.6, 4.0, 4.1)
Dependencies: bpy (built into Blender — no external imports)

Materials follow PBR (Physically Based Rendering) conventions using
the Principled BSDF shader node for physically correct rendering
in both EEVEE and Cycles render engines.
"""

import bpy


# ════════════════════════════════════════════════════════════════
# Helper Functions
# ════════════════════════════════════════════════════════════════

def clear_existing(name: str) -> "bpy.types.Material":
    """Remove existing material with same name to prevent duplicates.

    Returns a fresh material with use_nodes enabled and all default
    nodes cleared (ready for custom node setup).
    """
    if name in bpy.data.materials:
        bpy.data.materials.remove(bpy.data.materials[name])
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    return mat


def add_principled_bsdf(
    mat,
    base_color,
    metallic=0.0,
    roughness=0.5,
    ior=1.45,
    alpha=1.0,
    transmission=0.0,
    emission_color=(0, 0, 0, 1),
    emission_strength=0.0,
):
    """Add and configure a Principled BSDF node connected to Material Output.

    Parameters:
        mat: bpy.types.Material with use_nodes=True and cleared node tree
        base_color: (R, G, B, A) tuple, values 0-1
        metallic: 0.0 = dielectric (plastic, glass), 1.0 = metal
        roughness: 0.0 = mirror smooth, 1.0 = completely rough
        ior: Index of refraction (glass=1.5, water=1.33, diamond=2.42)
        alpha: 1.0 = opaque, 0.0 = fully transparent
        transmission: 0.0 = opaque, 1.0 = glass-like transmission
        emission_color: (R, G, B, A) for self-illumination color
        emission_strength: Watts of emitted light (0 = no emission)

    Returns:
        The Principled BSDF node for further customization.
    """
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Material Output node
    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (400, 0)

    # Principled BSDF node — the universal PBR shader
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)

    # Set core PBR properties
    bsdf.inputs['Base Color'].default_value = base_color
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['IOR'].default_value = ior
    bsdf.inputs['Alpha'].default_value = alpha

    # Transmission (glass-like transparency) — input name varies by Blender version
    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = transmission  # Blender 4.x
    elif 'Transmission' in bsdf.inputs:
        bsdf.inputs['Transmission'].default_value = transmission  # Blender 3.x

    # Emission (self-illumination)
    if 'Emission Color' in bsdf.inputs:
        bsdf.inputs['Emission Color'].default_value = emission_color  # Blender 4.x
    elif 'Emission' in bsdf.inputs:
        bsdf.inputs['Emission'].default_value = emission_color  # Blender 3.x
    bsdf.inputs['Emission Strength'].default_value = emission_strength

    # Connect BSDF output to Material Output surface input
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

    return bsdf


# ════════════════════════════════════════════════════════════════
# Material 1: Copper Pipe
# ════════════════════════════════════════════════════════════════
# Use: Copper tubing, heat exchanger tubes, refrigerant lines
# Engineering context: Type K/L/M copper tubing per ASTM B88
# Visual: Warm orange-brown metallic with slight polish
# ────────────────────────────────────────────────────────────────
mat_copper = clear_existing("Infra_CopperPipe")
add_principled_bsdf(
    mat_copper,
    base_color=(0.83, 0.48, 0.22, 1.0),  # Orange-brown copper color
    metallic=1.0,       # Pure metal
    roughness=0.2,      # Slightly polished new copper
)


# ════════════════════════════════════════════════════════════════
# Material 2: PVC Pipe
# ════════════════════════════════════════════════════════════════
# Use: Drain/waste/vent (DWV) piping, electrical conduit
# Engineering context: Schedule 40/80 PVC per ASTM D1785
# Visual: Off-white matte plastic
# ────────────────────────────────────────────────────────────────
mat_pvc = clear_existing("Infra_PVCPipe")
add_principled_bsdf(
    mat_pvc,
    base_color=(0.9, 0.9, 0.88, 1.0),  # Off-white PVC
    metallic=0.0,       # Non-metallic
    roughness=0.85,     # Matte plastic surface
)


# ════════════════════════════════════════════════════════════════
# Material 3: Carbon/Stainless Steel (Brushed)
# ════════════════════════════════════════════════════════════════
# Use: Steel pipe, structural steel, equipment enclosures
# Engineering context: ASTM A53/A312 pipe, A36/A992 structural
# Visual: Cool grey metallic with directional brush marks
# ────────────────────────────────────────────────────────────────
mat_steel = clear_existing("Infra_BrushedSteel")
add_principled_bsdf(
    mat_steel,
    base_color=(0.6, 0.6, 0.62, 1.0),  # Cool grey steel
    metallic=1.0,       # Pure metal
    roughness=0.3,      # Brushed finish (between polished and matte)
)


# ════════════════════════════════════════════════════════════════
# Material 4: Pipe Insulation (Fiberglass / Mineral Wool)
# ════════════════════════════════════════════════════════════════
# Use: Hot and cold pipe insulation jacket, duct wrap
# Engineering context: ASTM C547 (mineral fiber pipe insulation)
# Visual: Yellow-grey fibrous texture, very rough surface
# ────────────────────────────────────────────────────────────────
mat_insulation = clear_existing("Infra_PipeInsulation")
add_principled_bsdf(
    mat_insulation,
    base_color=(0.72, 0.62, 0.35, 1.0),  # Yellow-grey fiberglass
    metallic=0.0,       # Non-metallic
    roughness=1.0,      # Maximum roughness (fibrous surface)
)


# ════════════════════════════════════════════════════════════════
# Material 5: Coolant / Water (Translucent)
# ════════════════════════════════════════════════════════════════
# Use: Coolant visualization inside transparent pipe sections,
#      CDU heat exchanger internals, flow animation particles
# Engineering context: Chilled water, glycol-water mix, liquid coolant
# Visual: Translucent blue with water-like refraction
# ────────────────────────────────────────────────────────────────
mat_coolant = clear_existing("Infra_Coolant")
# Enable alpha hashing for correct transparency in EEVEE
mat_coolant.blend_method = 'HASHED'
mat_coolant.shadow_method = 'HASHED'
add_principled_bsdf(
    mat_coolant,
    base_color=(0.2, 0.5, 1.0, 0.7),  # Translucent blue
    metallic=0.0,       # Non-metallic
    roughness=0.0,      # Perfectly smooth liquid surface
    ior=1.33,           # Water index of refraction
    alpha=0.5,          # 50% transparent
    transmission=0.8,   # High transmission for glass-like look
)


# ════════════════════════════════════════════════════════════════
# Material 6: Concrete / Raised Floor
# ════════════════════════════════════════════════════════════════
# Use: Data center slab, concrete walls, raised floor panels,
#      equipment pads, foundations
# Engineering context: Normal weight concrete, f'c = 4000 PSI
# Visual: Medium grey with very rough surface texture
# ────────────────────────────────────────────────────────────────
mat_concrete = clear_existing("Infra_Concrete")
add_principled_bsdf(
    mat_concrete,
    base_color=(0.5, 0.5, 0.5, 1.0),  # Medium grey concrete
    metallic=0.0,       # Non-metallic
    roughness=0.95,     # Very rough concrete surface
)


# ════════════════════════════════════════════════════════════════
# Material 7: Cable Tray (Painted/Galvanized Steel)
# ════════════════════════════════════════════════════════════════
# Use: Open cable trays, wire management, ladder rack,
#      conduit support channels (Unistrut)
# Engineering context: Hot-dip galvanized per NEMA VE 1
# Visual: Light grey metallic with slight sheen
# ────────────────────────────────────────────────────────────────
mat_cable_tray = clear_existing("Infra_CableTray")
add_principled_bsdf(
    mat_cable_tray,
    base_color=(0.75, 0.75, 0.72, 1.0),  # Galvanized grey-white
    metallic=0.8,       # Mostly metallic (galvanized coating)
    roughness=0.4,      # Moderate roughness
)


# ════════════════════════════════════════════════════════════════
# Verification: Print created materials
# ════════════════════════════════════════════════════════════════

MATERIAL_NAMES = [
    "Infra_CopperPipe",
    "Infra_PVCPipe",
    "Infra_BrushedSteel",
    "Infra_PipeInsulation",
    "Infra_Coolant",
    "Infra_Concrete",
    "Infra_CableTray",
]

print("\n" + "=" * 60)
print("Infrastructure Materials Library — Creation Report")
print("=" * 60)

all_ok = True
for name in MATERIAL_NAMES:
    mat = bpy.data.materials.get(name)
    if mat:
        node_count = len(mat.node_tree.nodes)
        print(f"  [OK] {name} ({node_count} nodes)")
    else:
        print(f"  [MISSING] {name}")
        all_ok = False

if all_ok:
    print(f"\nAll {len(MATERIAL_NAMES)} materials created successfully.")
    print("Assign to objects: Object Properties > Material > Browse (dropdown)")
else:
    print("\nWARNING: Some materials failed to create. Check Blender console for errors.")

print("=" * 60 + "\n")
