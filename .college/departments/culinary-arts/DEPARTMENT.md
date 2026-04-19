# Culinary Arts Department

**Domain:** culinary-arts
**Source:** Cooking fundamentals research (05-cooking-fundamentals-research.md)
**Status:** Active
**Purpose:** Seven wings of culinary knowledge grounded in food science, thermodynamics, and technique, explorable as College code with calibration-aware feedback loops

## Wings

- Food Science -- Maillard reactions, emulsification, protein denaturation, starch gelatinization, caramelization, fermentation
- Thermodynamics -- heat transfer modes, specific heat capacity, altitude adjustments, Newton's law of cooling
- Nutrition -- macronutrient roles, micronutrient bioavailability, preparation-nutrition effects
- Technique -- dry heat methods, wet heat methods, combination methods and knife skills
- Baking Science -- baker's ratios, gluten development, yeast biology, sugar chemistry
- Food Safety -- temperature danger zone, cross-contamination prevention, safe storage times, allergen management
- Home Economics -- meal planning, budget management, pantry management, preservation techniques

## Entry Point

cook-dry-heat-methods

## Concepts

### Food Science (6 concepts)
- cook-maillard-reaction -- Amino acid + reducing sugar browning (onset 140C/280F)
- cook-emulsification -- Oil-in-water and water-in-oil stable mixtures
- cook-protein-denaturation -- Heat/acid/mechanical unfolding of protein structure
- cook-starch-gelatinization -- Starch granule swelling and thickening in heated moisture
- cook-caramelization -- Sugar pyrolysis without amino acids (fructose 110C, sucrose 160C)
- cook-fermentation -- Anaerobic metabolism by yeast/bacteria for leavening and flavor

### Thermodynamics (4 concepts)
- cook-heat-transfer-modes -- Conduction, convection, radiation in cookware and methods
- cook-specific-heat-capacity -- Energy per gram per degree (water 4.18 J/gC)
- cook-altitude-adjustments -- Boiling point reduction and baking modifications at elevation
- cook-newtons-cooling -- Exponential decay model for food temperature over time

### Nutrition (3 concepts)
- cook-macronutrient-roles -- Protein (4 cal/g), carbs (4 cal/g), fat (9 cal/g) functions
- cook-micronutrient-bioavailability -- Cooking effects on vitamin and mineral absorption
- cook-preparation-nutrition -- How cooking methods affect nutrient retention and loss

### Technique (3 concepts)
- cook-dry-heat-methods -- Sauteing, roasting, grilling, frying (above 140C for Maillard)
- cook-wet-heat-methods -- Poaching, simmering, boiling, steaming (capped at 100C)
- cook-combination-methods -- Braising, stewing, knife skills hierarchy

### Baking Science (4 concepts)
- cook-bakers-ratios -- Flour=100% base for recipe scaling and troubleshooting
- cook-gluten-development -- Protein network from kneading, hydration, and resting
- cook-yeast-biology -- Saccharomyces cerevisiae lifecycle (active 35-46C)
- cook-sugar-chemistry -- Hygroscopy, crystallization, spread effects in baking

### Food Safety (4 concepts)
- cook-temperature-danger-zone -- 40-140F zone, 2-hour rule, minimum internal temperatures
- cook-cross-contamination -- Pathogen transfer prevention protocols
- cook-safe-storage-times -- Refrigerator, freezer, and shelf-stable storage guidelines
- cook-allergen-management -- Big 9 allergens, label reading, substitutions

### Home Economics (4 concepts)
- cook-meal-planning -- Weekly planning, batch cooking, leftover repurposing
- cook-budget-management -- Cost-per-serving analysis, seasonal buying, waste reduction
- cook-pantry-management -- FIFO rotation, staple inventory, storage conditions
- cook-preservation-techniques -- Canning, freezing, dehydrating, fermenting

## Calibration Models

- Temperature (thermodynamics) -- Newton's law of cooling, safety boundaries
- Timing (reaction kinetics) -- Exponential heat penetration, danger zone limits
- Seasoning (taste perception) -- Weber-Fechner logarithmic perception model
- Texture (protein/starch science) -- Protein denaturation temperature models

## Cross-references — Adaptive Systems

**Department:** `.college/departments/adaptive-systems/`  
**Connection type:** Physical analogy bridge — Culinary Arts Thermodynamics provides the pedagogically accessible version of the same Gibbs-distribution physics that Panel C formalises; the Seasoning calibration model uses Weber-Fechner, which Panel D derives mechanistically.

**`cook-specific-heat-capacity` (Thermodynamics wing).**  
Specific heat capacity (energy per gram per degree) governs how much thermal energy must be added to raise a system's temperature. In statistical physics, temperature controls the width of the Boltzmann distribution over states: p(s) ∝ exp(−E(s)/kT). Neural network training operates under the same structure: the mini-batch gradient noise is thermal, and the learning rate η sets the effective temperature T = η·σ²/2 (Welling & Teh 2011). High learning rate = high temperature = broad exploration of the loss landscape; low learning rate = low temperature = exploitation of the current basin. The `cook-specific-heat-capacity` concept is the culinary instantiation of the same thermodynamic parameter. Physical-systems analogy: Adaptive Systems Panel C (`C-physical-systems-roots.md`), §4 on noise-as-temperature.

**`cook-newtons-cooling` (Thermodynamics wing).**  
Newton's law of cooling — exponential decay of temperature difference toward ambient — is the physical model for simulated annealing cooling schedules (Kirkpatrick, Gelatt & Vecchi 1983). Simulated annealing starts at high temperature and reduces it according to a cooling schedule to find the global minimum of a loss function. Gradient descent with a decaying learning rate schedule is the neural-network instantiation of the same process. The exponential decay familiar from this concept is the cooling schedule's mathematical form. Physical-systems analogy: Adaptive Systems Panel C (`C-physical-systems-roots.md`), §4.

**Seasoning calibration model (Weber-Fechner).**  
The Culinary Arts seasoning calibration model is explicitly noted as following the Weber-Fechner logarithmic perception law. Weber (1834) established empirically that the just-noticeable difference in stimulus intensity is proportional to the baseline intensity, giving a log-linear perceived-magnitude function. Lanzara (2023, Appendix III) derives this law mechanistically from two-state receptor kinetics: the net-shift equation ΔR_H = R_T·[L]·(K_H−K_L)/((1+K_H·[L])·(1+K_L·[L])) recovers the Weber-Fechner log-linear regime in the mid-concentration range as a consequence of receptor biophysics, not a curve fit. The culinary calibration model uses Weber-Fechner empirically; Panel D gives the mechanistic derivation. Biological-roots connection: Adaptive Systems Panel D (`D-biological-roots.md`), §1–2.

## Safety Boundaries

Absolute limits enforced by Safety Warden:
- Poultry internal temp >= 165F / 74C
- Ground meat internal temp >= 160F / 71C
- Whole cuts internal temp >= 145F / 63C
- Cold storage temp <= 40F / 4C
- Temperature danger zone: 40-140F (2hr max)
