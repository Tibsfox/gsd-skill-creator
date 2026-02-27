# Spatial Constraint Verification -- Deep Reference

*Dimensional Analysis Skill -- Collision detection, NEC 110.26 full table, cable tray, pipe routing*

---

## AABB Collision Detection Algorithm

### Axis-Aligned Bounding Box (AABB)

The AABB is a rectangular box aligned to the coordinate axes that fully encloses an object. For infrastructure equipment (panels, racks, CDUs, pipe runs), AABB is the natural representation because equipment is almost always axis-aligned.

### Complete Implementation

```typescript
interface BoundingBox {
  x_min: number; x_max: number;
  y_min: number; y_max: number;
  z_min: number; z_max: number;
}

function aabbOverlap(a: BoundingBox, b: BoundingBox): boolean {
  const xOverlap = a.x_max >= b.x_min && a.x_min <= b.x_max;
  const yOverlap = a.y_max >= b.y_min && a.y_min <= b.y_max;
  const zOverlap = a.z_max >= b.z_min && a.z_min <= b.z_max;
  return xOverlap && yOverlap && zOverlap;
}

function clearanceCheck(
  a: BoundingBox,
  b: BoundingBox,
  minClearance: number
): boolean {
  // Expand box b by minClearance in all directions
  const expanded: BoundingBox = {
    x_min: b.x_min - minClearance,
    x_max: b.x_max + minClearance,
    y_min: b.y_min - minClearance,
    y_max: b.y_max + minClearance,
    z_min: b.z_min - minClearance,
    z_max: b.z_max + minClearance
  };
  // If expanded box overlaps a, clearance is insufficient
  return !aabbOverlap(a, expanded);
}

function minimumGap(a: BoundingBox, b: BoundingBox): number {
  // Returns the minimum distance between two non-overlapping AABBs
  // Returns 0 if they overlap
  const dx = Math.max(0, Math.max(b.x_min - a.x_max, a.x_min - b.x_max));
  const dy = Math.max(0, Math.max(b.y_min - a.y_max, a.y_min - b.y_max));
  const dz = Math.max(0, Math.max(b.z_min - a.z_max, a.z_min - b.z_max));
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
```

### Performance Considerations

| Item Count | Brute Force O(n^2) | Spatial Hash O(n) avg | BVH Tree O(n log n) |
|------------|-------------------|----------------------|---------------------|
| 10 | 45 pairs | Not needed | Not needed |
| 100 | 4,950 pairs | ~100 lookups | ~700 comparisons |
| 1,000 | 499,500 pairs | ~1,000 lookups | ~10,000 comparisons |
| 10,000 | 49,995,000 pairs | ~10,000 lookups | ~133,000 comparisons |

For typical infrastructure projects (< 1,000 items), brute-force O(n^2) is acceptable -- completing in under 1 second. For large campus or industrial facility layouts with thousands of items, spatial hashing or a Bounding Volume Hierarchy (BVH) tree reduces comparisons dramatically.

### Spatial Hashing

Divide the 3D space into a uniform grid of cells. Assign each AABB to all cells it overlaps. Only check pairs of objects that share at least one cell.

Cell size should be approximately 2x the average object size for best performance. Too small: objects span many cells (overhead). Too large: many objects per cell (no filtering benefit).

---

## OBB Separating Axis Theorem (SAT)

### When AABB Is Not Enough

Oriented Bounding Boxes (OBB) handle rotated equipment: angled cable runs, non-orthogonal mechanical rooms, equipment installed at compound angles.

### The Separating Axis Theorem

Two convex shapes do NOT intersect if and only if there exists a separating axis -- an axis along which the projections of the two shapes do not overlap.

For two OBBs in 3D, test 15 potential separating axes:
- 3 face normals of box A
- 3 face normals of box B
- 9 cross products of edges: (A_edge_1 x B_edge_1), (A_edge_1 x B_edge_2), ..., (A_edge_3 x B_edge_3)

### Algorithm Outline

```
function obbOverlap(a: OBB, b: OBB): boolean {
  // Generate 15 test axes
  axes = [a.axis_x, a.axis_y, a.axis_z,
          b.axis_x, b.axis_y, b.axis_z,
          cross(a.axis_x, b.axis_x), cross(a.axis_x, b.axis_y), cross(a.axis_x, b.axis_z),
          cross(a.axis_y, b.axis_x), cross(a.axis_y, b.axis_y), cross(a.axis_y, b.axis_z),
          cross(a.axis_z, b.axis_x), cross(a.axis_z, b.axis_y), cross(a.axis_z, b.axis_z)]

  for each axis in axes:
    if axis is zero vector: skip (parallel edges)
    [a_min, a_max] = projectOBB(a, axis)
    [b_min, b_max] = projectOBB(b, axis)
    if a_max < b_min or b_max < a_min:
      return false  // Found a separating axis -- no overlap
  return true  // No separating axis found -- boxes overlap
}
```

**Infrastructure application:** Most infrastructure is axis-aligned, making OBB unnecessary. Use OBB only for: angled pipe penetrations through walls, skewed equipment in non-rectangular rooms, diagonal cable tray runs, and equipment on elevated platforms with non-orthogonal supports.

---

## Full NEC 110.26 Working Space Table

### Working Space Depth (NEC 110.26(A))

The minimum clear distance measured from the exposed live parts (or from the front of the enclosure if live parts are not exposed) to the boundary of the working space.

| Nominal Voltage to Ground | Condition 1 | Condition 2 | Condition 3 |
|---------------------------|-------------|-------------|-------------|
| 0-150V | 3 ft (914 mm) | 3 ft (914 mm) | 3 ft (914 mm) |
| 151-600V | 3 ft (914 mm) | 3.5 ft (1067 mm) | 4 ft (1219 mm) |
| 601-2500V | 3 ft (914 mm) | 4 ft (1219 mm) | 5 ft (1524 mm) |
| 2501-9000V | 4 ft (1219 mm) | 5 ft (1524 mm) | 6 ft (1829 mm) |
| 9001-25,000V | 5 ft (1524 mm) | 6 ft (1829 mm) | 9 ft (2743 mm) |
| Over 25,000V | 6 ft (1829 mm) | 8 ft (2438 mm) | 12 ft (3658 mm) |

### Condition Definitions

**Condition 1:** Exposed live parts on one side of the working space and no live or grounded parts on the other side. Concrete, brick, or tile walls are considered grounded surfaces.

**Condition 2:** Exposed live parts on one side and grounded parts on the other side. This includes concrete walls, metal surfaces, and metal equipment cases.

**Condition 3:** Exposed live parts on both sides of the working space. This is the most restrictive condition.

### Working Space Width (NEC 110.26(A)(2))

The width of the working space in front of electrical equipment shall not be less than 30 inches (762 mm) or the width of the equipment, whichever is greater. In all cases, the work space shall permit at least a 90-degree opening of equipment doors or hinged panels.

### Working Space Height (NEC 110.26(A)(3))

The work space shall not be less than 6.5 ft (1981 mm) in height, or the height of the equipment, whichever is greater. Where the electrical equipment exceeds 6.5 ft in height, the required work space shall not be less than the height of the equipment.

### Dedicated Equipment Space (NEC 110.26(E))

The footprint area of the equipment (width x depth, extending from floor to a height of 6 ft above the equipment or to the structural ceiling, whichever is lower) is dedicated space. This space:

- **Shall not** be used for storage
- **Shall not** contain piping, ducts, or equipment foreign to the electrical installation
- **Exception:** Suspended ceilings with removable panels are permitted above the dedicated space
- **Sprinkler protection** is permitted if piping is installed outside the dedicated space (piping routed around, not through)

### Illumination (NEC 110.26(D))

Illumination shall be provided for all working spaces about service equipment, switchboards, switchgear, panelboards, and motor control centers installed indoors. Additional lighting outlets are not required where the working space is illuminated by adjacent light sources. Control by automatic means only is not permitted.

### Entrance and Egress (NEC 110.26(C))

For equipment rated 1200A or more and over 6 ft wide:
- At least one entrance of minimum 24" wide and 6.5 ft high shall be provided at each end of the working space
- Exception: Where the location permits a continuous and unobstructed way of exit travel, one entrance is permitted

---

## Cable Tray Fill Detailed Rules (NEC 392)

### NEC 392.22(A) -- Cables 4/0 AWG and Larger

Large power cables must be arranged in a single layer. Maximum fill is determined by the number of cables that can physically fit in a single layer across the tray width, with maintained spacing per the derating tables.

### NEC 392.22(B) -- Cables Smaller Than 4/0 AWG

The sum of the cross-sectional areas of all cables shall not exceed the maximum allowable fill area for the tray type.

**NEC 392.22(B)(1)(c) -- Ladder or ventilated trough cable tray:**
Where all cables are 4/0 AWG or smaller, the sum of the cross-sectional areas of all cables shall not exceed 50% of the usable interior cross-sectional area of the cable tray.

### NEC 392.22(C) -- Multiconductor Cables

Multiconductor cables of 2000 kcmil or smaller: sum of cross-sectional areas shall not exceed 40% of the usable interior cross-sectional area of the cable tray. For single-conductor cables, see 392.22(A) and (B).

### Per-Cable Cross-Sectional Area

For circular cables: A = pi x (OD / 2)^2

Use the overall cable OD (including jacket), not the individual conductor area. This is the correct method per NEC commentary.

### Tray Size Selection Table

| Tray Width | Depth | Total C.S. Area | 50% Fill Area | 40% Fill Area |
|------------|-------|-----------------|---------------|---------------|
| 6" | 3" | 18 in^2 | 9.0 in^2 | 7.2 in^2 |
| 6" | 4" | 24 in^2 | 12.0 in^2 | 9.6 in^2 |
| 12" | 4" | 48 in^2 | 24.0 in^2 | 19.2 in^2 |
| 12" | 6" | 72 in^2 | 36.0 in^2 | 28.8 in^2 |
| 18" | 4" | 72 in^2 | 36.0 in^2 | 28.8 in^2 |
| 18" | 6" | 108 in^2 | 54.0 in^2 | 43.2 in^2 |
| 24" | 4" | 96 in^2 | 48.0 in^2 | 38.4 in^2 |
| 24" | 6" | 144 in^2 | 72.0 in^2 | 57.6 in^2 |
| 30" | 6" | 180 in^2 | 90.0 in^2 | 72.0 in^2 |
| 36" | 6" | 216 in^2 | 108.0 in^2 | 86.4 in^2 |

### Common Cable Cross-Sectional Areas

| Cable | Approx OD (inches) | C.S. Area (in^2) |
|-------|--------------------|--------------------|
| 14 AWG THWN-2 | 0.21 | 0.035 |
| 12 AWG THWN-2 | 0.24 | 0.045 |
| 10 AWG THWN-2 | 0.27 | 0.057 |
| 8 AWG THWN-2 | 0.33 | 0.086 |
| 6 AWG THWN-2 | 0.38 | 0.113 |
| 4 AWG THWN-2 | 0.42 | 0.139 |
| 2 AWG THWN-2 | 0.48 | 0.181 |
| 1/0 AWG THWN-2 | 0.56 | 0.246 |
| 4/0 AWG THWN-2 | 0.69 | 0.374 |
| 250 kcmil THWN-2 | 0.78 | 0.478 |
| 500 kcmil THWN-2 | 1.00 | 0.785 |
| 12/3 MC cable | 0.55 | 0.238 |
| 10/3 MC cable | 0.61 | 0.292 |
| Cat6 UTP | 0.25 | 0.049 |
| Cat6A UTP | 0.30 | 0.071 |

### Fill Calculation Example

**Problem:** How many Cat6A cables fit in a 12" x 4" ladder tray?

Available fill area at 50%: 24.0 in^2
Per-cable area: 0.071 in^2
Maximum cables: 24.0 / 0.071 = 338 cables

**With bundling factor:** Cables do not pack perfectly. Apply a 0.7 packing efficiency factor for round cables in a rectangular tray:
Effective maximum: 338 x 0.7 = 236 cables (practical limit)

---

## Pipe Routing Interference Algorithm

### Step-by-Step Routing Verification

**Step 1:** Define each pipe run as a sequence of line segments with an outer radius:
```
outer_radius = pipe_OD / 2 + insulation_thickness
```

**Step 2:** For each pair of pipe segments, compute the minimum distance between the two line segments.

**Step 3:** Compare minimum distance to the required minimum:
```
required_gap = outer_radius_a + outer_radius_b + min_clearance
```
Where min_clearance is typically 1" (or code-specified, whichever is greater).

**Step 4:** Flag any pair where the actual distance is less than required_gap.

### Line Segment Distance Computation

For orthogonal pipes (the common case in infrastructure), check each axis independently:

```
function orthogonalPipeDistance(
  pipe_a: { start: Vec3, end: Vec3, radius: number },
  pipe_b: { start: Vec3, end: Vec3, radius: number }
): number {
  // For axis-aligned pipes, one pipe runs along X and another along Y (or Z)
  // The minimum distance is computed per-axis and combined
  // Simplified: project onto the plane perpendicular to both pipe axes
  // The clearance is the distance in that plane minus both radii
}
```

For general (non-orthogonal) pipe segments, use the parametric line-segment distance algorithm:
1. Parameterize segment A as P(s) = A0 + s * (A1 - A0), s in [0,1]
2. Parameterize segment B as Q(t) = B0 + t * (B1 - B0), t in [0,1]
3. Minimize |P(s) - Q(t)|^2 with respect to s and t
4. Clamp s and t to [0,1] and re-minimize at the boundary if needed

Reference: Ericson, "Real-Time Collision Detection" (2005), Chapter 5.

---

## Seismic Bracing and Code Clearances

### NFPA 13 Seismic Bracing for Piping

**Longitudinal bracing:** One brace every 40 ft maximum along the pipe run direction. Brace resists axial force from seismic acceleration.

**Lateral bracing:** One brace every 40 ft maximum perpendicular to the pipe run. Brace resists transverse seismic force.

**4-way bracing:** Required within 24" of all direction changes (elbows, tees). A 4-way brace resists force in both longitudinal and lateral directions.

**Sway bracing loads:** Horizontal seismic force on piping:
```
F_p = 0.7 * S_DS * I_p * W_p
```
Where:
- S_DS = design spectral acceleration (from site-specific seismic hazard, ASCE 7-22)
- I_p = component importance factor (1.5 for essential facilities)
- W_p = weight of pipe + water + insulation per brace span

### IBC/ASCE 7-22 Equipment Anchorage

For mechanical and electrical equipment, the design seismic force:
```
F_p = (0.4 * a_p * S_DS * W_p) / (R_p / I_p) * (1 + 2 * z/h)
```

Where:
- a_p = component amplification factor (2.5 for most MEP)
- R_p = component response modification factor (varies by attachment; 2.5 for vibration-isolated, 6.0 for ductile anchors)
- z = height of attachment above base
- h = building height
- Minimum: F_p >= 0.3 * S_DS * I_p * W_p

### Clearances During Seismic Event

Equipment and piping move during an earthquake. Design clearances must account for relative displacement:

```
Delta = story_drift * C_d / I_e
```

Where:
- story_drift = calculated elastic story drift from structural analysis
- C_d = deflection amplification factor (from ASCE 7 Table 12.2-1)
- I_e = importance factor for the building

**Required seismic clearance between equipment and structure (or between independent systems):**
```
clearance >= Delta_a + Delta_b
```

Where Delta_a and Delta_b are the maximum displacements of systems A and B respectively. If both are on the same floor, their displacements may be correlated (conservative: assume additive).

**Typical seismic gaps:**
- Piping penetrations through walls: 2" minimum (with flexible fire stop)
- Equipment-to-wall clearance: 1.5" minimum for Seismic Design Category D and above
- Cable tray support: verify tray lateral displacement does not exceed support channel width

---

*Spatial Constraint Verification Deep Reference v1.0.0 -- Physical Infrastructure Engineering Pack*
*Sources: NEC 2023 (NFPA 70), NFPA 13, ASCE 7-22, IBC 2021, Ericson "Real-Time Collision Detection" (2005)*
