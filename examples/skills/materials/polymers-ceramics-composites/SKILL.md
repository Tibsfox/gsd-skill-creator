---
name: polymers-ceramics-composites
description: Use when working with the non-metallic engineering materials — polymers, ceramics, or composites — and you need to reason about structure, processing, or properties. Covers thermoplastics versus thermosets, chain structure, glass transition, and viscoelasticity in polymers; ionic and covalent bonding, sintering, brittleness, and Weibull statistics in ceramics; and fiber-reinforced laminates, matrix and reinforcement roles, the rule of mixtures, and anisotropy in composites. Reach for it to choose a plastic, understand why a ceramic fails, or predict the stiffness of a laminate.
type: skill
category: materials
status: stable
origin: tibsfox
modified: false
first_seen: 2026-07-06
first_path: examples/skills/materials/polymers-ceramics-composites/SKILL.md
superseded_by: null
---
# Polymers, Ceramics, and Composites

Metals are only one leg of the materials triangle. The other three engineering classes — polymers, ceramics, and composites — occupy corners of property space that no metal reaches: polymers for low density, low cost, and formability; ceramics for hardness, chemical inertness, and high-temperature stability; composites for tailored stiffness-to-weight in a chosen direction. Each class is governed by a different bonding and microstructural story, and each carries a characteristic failure mode. This skill surveys the three non-metallic classes, the structure that gives them their properties, and the design rules that follow.

**Agent affinity:** ashby (cross-class selection and property indices), gordon (brittle fracture and failure modes in ceramics and composites)

**Concept IDs:** materials-polymer-structure, materials-ceramic-processing, materials-composite-mechanics

## Polymers

A polymer is a long-chain molecule built from repeating covalently bonded monomer units. A single chain may contain tens of thousands of carbon atoms. The engineering properties of a polymer come less from the strong bonds *along* the backbone than from the weak secondary forces (van der Waals, hydrogen bonding) *between* chains and from how the chains are arranged.

### Thermoplastics versus thermosets

The single most important classification splits on what happens to the material when it is heated.

- **Thermoplastics** consist of separate, un-cross-linked chains held together only by secondary forces and physical entanglement. Heating overcomes those weak forces, the chains slide past one another, and the material flows — so thermoplastics can be melted, molded, and remelted repeatedly. They are recyclable and easy to process by injection molding and extrusion. Polyethylene (PE), polypropylene (PP), polystyrene (PS), PVC, PET, and nylon are thermoplastics.
- **Thermosets** are cured into a single covalently cross-linked network. Curing (via heat, a catalyst, or mixing two parts) forms permanent primary bonds between chains, so the material cannot be remelted — heating it only degrades it. Thermosets are stiffer, more dimensionally stable, and more heat- and solvent-resistant than thermoplastics, but they cannot be reprocessed. Epoxies, phenolics, polyurethanes, and unsaturated polyesters are thermosets, and they are the usual matrix materials for high-performance composites.

A third practical category, **elastomers** (rubbers), are lightly cross-linked networks above their glass transition; the sparse cross-links let the chains stretch reversibly and then snap back.

### Chain structure and crystallinity

Chain architecture drives properties:

- **Molecular weight.** Longer chains entangle more; strength and melt viscosity both rise with average molecular weight.
- **Branching.** Linear chains (HDPE) pack closely and crystallize well, giving higher density and stiffness; branched chains (LDPE) pack poorly and stay softer and more flexible.
- **Tacticity.** The stereochemical regularity of side groups. Isotactic and syndiotactic chains are regular enough to crystallize; atactic chains stay amorphous.

Thermoplastics are either **semi-crystalline** (regular regions of folded, aligned chains embedded in an amorphous matrix — PE, PP, PET, nylon) or fully **amorphous** (random coil, no long-range order — PS, PMMA, PC). Crystallinity is never complete; a "crystalline" polymer is really semi-crystalline. Crystalline regions raise stiffness, strength, density, and solvent resistance, and they scatter light (semi-crystalline polymers are translucent, amorphous ones can be transparent).

### Glass transition and the modulus-temperature curve

The **glass transition temperature (Tg)** is the temperature at which the amorphous regions change between a hard, glassy state and a soft, rubbery/leathery state. It is not melting — melting (Tm) is the loss of crystalline order and only exists in semi-crystalline polymers. At Tg the free volume increases enough for large-scale chain-segment motion to switch on, and the elastic modulus of an amorphous polymer drops by two to three orders of magnitude over a narrow temperature window.

Design consequence: an amorphous thermoplastic must be used well *below* Tg to be rigid (polycarbonate, Tg ~ 150 C, is rigid at room temperature), while an elastomer must be used well *above* Tg to be rubbery (natural rubber, Tg ~ -70 C). Semi-crystalline polymers retain useful stiffness between Tg and Tm because the crystalline fraction carries load even when the amorphous fraction has softened.

### Viscoelasticity

Polymers are **viscoelastic**: their mechanical response is part elastic (spring-like, instantaneous, recoverable) and part viscous (dashpot-like, time-dependent, permanent). Three consequences dominate polymer engineering:

- **Creep.** Under constant load, a polymer keeps deforming with time as chains slowly disentangle and flow. A plastic shelf sags over months.
- **Stress relaxation.** Under constant strain, the stress needed to hold that strain decays with time. A press-fit or gasket loses clamping force.
- **Time–temperature superposition.** Raising temperature and lengthening time are equivalent — behavior at high temperature over a short time matches behavior at low temperature over a long time. This lets short high-temperature tests predict long-term room-temperature performance. Loading rate also matters: a polymer that is ductile when pulled slowly can be brittle under impact.

Simple mechanical analogs — the Maxwell model (spring and dashpot in series, captures stress relaxation) and the Kelvin–Voigt model (spring and dashpot in parallel, captures creep recovery) — are the starting point for describing this behavior.

## Ceramics

A ceramic is an inorganic, non-metallic compound — typically an oxide, nitride, or carbide — held together by ionic and covalent bonds. Traditional ceramics are clay-based (brick, porcelain, tile); engineering ceramics are high-purity compounds such as alumina (Al2O3), zirconia (ZrO2), silicon carbide (SiC), and silicon nitride (Si3N4).

### Bonding and its consequences

Ceramic bonding is a mixture of **ionic** (electron transfer between a metal and a non-metal, e.g. Mg-O) and **covalent** (shared electrons, e.g. Si-C) character; the more electronegativity difference between the atoms, the more ionic the bond. Both bond types are strong and directional, and both localize the electrons — there is no sea of free electrons as in a metal. This single fact explains most ceramic properties:

- **Hardness and stiffness** are high because the bonds are strong.
- **High melting points and chemical inertness** follow from the same bond strength and stability.
- **Electrical and thermal insulation** follow from the absence of free electrons (with notable exceptions — some ceramics are semiconductors or ionic conductors).
- **Brittleness** follows because there is no easy dislocation glide: moving a dislocation would force like charges together or break directional covalent bonds, so ceramics cannot relieve stress concentrations by plastic flow the way metals do.

### Processing and sintering

Because engineering ceramics melt at very high temperatures and are brittle, they are usually **not** cast or machined from a melt. Instead they are formed from powder and consolidated below the melting point by **sintering**: a compacted "green body" of fine particles is heated so that atoms diffuse across particle contacts, necks grow between particles, and porosity is progressively eliminated as the part densifies and shrinks. The driving force is the reduction of total surface energy. Finer starting powders, higher purity, and applied pressure (hot pressing, hot isostatic pressing) all promote densification. Residual porosity is the enemy — pores are both stress concentrators and strength-limiting flaws — so full-density processing is central to structural ceramics.

### Brittleness, flaws, and Weibull statistics

A ceramic fails by fast fracture from its largest flaw, with essentially no warning and no plastic yielding. Because it cannot blunt a crack tip by plastic flow, its measured strength is governed by the **worst pre-existing defect** — a pore, an inclusion, a surface scratch, a large grain. Flaw size and location vary randomly from specimen to specimen, so ceramic strength is **statistical, not deterministic**: nominally identical parts break at different loads.

The strength distribution is described by **Weibull statistics**. The probability of survival at stress σ is

`P_s(σ) = exp[ -(V/V_0) (σ/σ_0)^m ]`

where m is the **Weibull modulus**, σ_0 a normalizing strength, and V the stressed volume. The Weibull modulus m measures scatter: a high m (~20+) means tightly clustered strengths and predictable parts; a low m (~5) means wide scatter and unreliable parts. Two design consequences fall out of the equation:

- **Size effect.** Larger parts contain more volume and therefore a higher chance of a large flaw, so bigger ceramic components are statistically *weaker*. This is why proof-testing and volume scaling matter.
- **Design to a survival probability, not to a single strength.** Ceramic components are designed to an acceptable failure probability (e.g. one in a million) rather than to a mean strength, because the tail of the distribution — not the average — governs safe service.

**Transformation toughening** (as in partially stabilized zirconia, where a stress-induced phase change absorbs crack energy) is the main route to making ceramics less catastrophically brittle.

## Composites

A composite combines two or more distinct materials to obtain properties that neither constituent has alone, while keeping them physically separate at a macroscopic or microscopic scale. The most important engineering composites are **fiber-reinforced**: strong, stiff fibers embedded in a continuous matrix.

### Matrix and reinforcement roles

The two phases play complementary roles:

- **Reinforcement (the fibers)** carries the load. It supplies the strength and stiffness. Common fibers are glass (cheap, moderate stiffness), carbon (very high stiffness-to-weight), and aramid (Kevlar — tough, impact-resistant).
- **Matrix (the continuous phase)** binds the fibers, transfers load between them through shear at the fiber–matrix interface, spaces and aligns them, protects them from abrasion and environment, and — critically — blunts and deflects cracks so that a broken fiber does not immediately fail the whole part. Matrices are polymer (epoxy is the workhorse), metal, or ceramic.

The **interface** between fiber and matrix is where load transfer happens and is often the weakest link; too weak an interface fails to transfer load, too strong an interface makes the composite brittle by preventing the crack-deflecting fiber pull-out that gives composites their toughness.

### The rule of mixtures

For continuous, aligned fibers loaded **along** the fiber direction, both phases stretch together (equal strain, an "iso-strain" condition), and the composite stiffness is the volume-weighted average of the two moduli — the **rule of mixtures**:

`E_composite = V_f · E_f + (1 − V_f) · E_m`

where V_f is the fiber volume fraction and E_f, E_m are the fiber and matrix moduli. Because E_f >> E_m, the fibers dominate and stiffness rises nearly linearly with fiber content. The same volume-weighted average predicts longitudinal strength and density.

Loaded **across** (transverse to) the fibers, the phases instead share the same stress (iso-stress), and the composite is far more compliant — governed by the inverse rule of mixtures, `1/E_transverse = V_f/E_f + (1 − V_f)/E_m`, which the weak matrix dominates. The large gap between the longitudinal and transverse stiffness is the essence of the next point.

### Anisotropy and laminates

A single aligned-fiber layer (a **ply** or **lamina**) is strongly **anisotropic**: stiff and strong along the fibers, weak and compliant across them and in shear. This directionality is a feature, not a defect — it lets the designer put material exactly where the load path needs it. But a real structure sees loads in several directions, so plies are stacked at different fiber angles (for example 0°/±45°/90°) and bonded into a **laminate**. Classical **laminate theory** sums the stiffness contributions of the individual plies to predict the whole laminate's directional response. A **quasi-isotropic** layup (balanced plies at 0/±45/90) behaves nearly the same in every in-plane direction, trading peak directional performance for uniformity. The through-thickness direction, held together only by the matrix, remains the composite's weak axis and drives failure modes such as **delamination**.

## Selection Across the Non-Metallic Classes

A rough guide to which class relaxes which constraint.

| Need | Class | Representative material |
|---|---|---|
| Low cost, low density, easy forming | Thermoplastic | PP, PE, PET |
| Rigid, heat- and solvent-resistant, dimensionally stable | Thermoset | Epoxy, phenolic |
| Reversible large elastic strain | Elastomer | Natural rubber, silicone |
| Hardness, wear, high-temperature stability | Engineering ceramic | Alumina, silicon nitride |
| Chemical inertness and electrical insulation | Ceramic | Alumina, glass |
| Maximum stiffness- or strength-to-weight | Fiber-reinforced composite | Carbon/epoxy |
| Impact toughness at low weight | Aramid composite | Kevlar/epoxy |

The recurring trade-offs are the same each time: polymers are formable and cheap but soft, creep-prone, and temperature-limited; ceramics are hard and stable but brittle and statistically unreliable; composites are stiff and light but anisotropic, expensive, and hard to inspect and recycle. As always in materials selection, the right question is which constraint dominates and which class relaxes it at the least cost in the others.

## Cross-References

- **ashby agent:** Applies performance indices to decide among polymers, ceramics, composites, and metals on the same chart.
- **gordon agent:** Owns brittle fracture, flaw-driven strength, and the failure modes (delamination, fast fracture) that dominate ceramics and composites.
- **nonferrous-alloys skill:** The metallic classes these non-metals are weighed against in any real selection.
- **structural-failure-analysis skill:** Fracture, fatigue, and creep mechanisms — the ceramic and composite failure modes here are a specialization of that framework.
- **materials-characterization skill:** Crystallinity and Tg are measured by DSC; ceramic porosity and composite ply structure by microscopy and CT.

## References

- Callister, W. D., & Rethwisch, D. G. (2018). *Materials Science and Engineering: An Introduction*. 10th edition. Wiley.
- Ashby, M. F., & Jones, D. R. H. (2012). *Engineering Materials 2: An Introduction to Microstructures and Processing*. 4th edition. Butterworth-Heinemann.
- Ward, I. M., & Sweeney, J. (2013). *Mechanical Properties of Solid Polymers*. 3rd edition. Wiley.
- Barsoum, M. W. (2003). *Fundamentals of Ceramics*. Institute of Physics Publishing.
- Hull, D., & Clyne, T. W. (1996). *An Introduction to Composite Materials*. 2nd edition. Cambridge University Press.
