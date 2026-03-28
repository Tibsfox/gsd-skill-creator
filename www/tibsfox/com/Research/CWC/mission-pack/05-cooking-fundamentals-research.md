# Cooking with Claude — Cooking Fundamentals Research Reference

**Date:** March 1, 2026
**Status:** Research Compilation / Teaching Content Draft
**Source Document:** 00-vision-cooking-with-claude.md
**Purpose:** Professional source material for all seven wings of the Culinary Arts department. Every scientific claim, temperature, and safety boundary is grounded in food science research, FDA/USDA standards, or established culinary science. Mission agents use this to populate the Cooking Department's concept files with accurate, calibration-ready content.

---

## How to Use This Document

This is the reference layer beneath the vision document. Where the vision doc says "food science wing," this document provides the exact chemistry, physics, and biology. Where the vision doc says "safety boundaries are absolute," this document provides the specific temperatures and times. Content here seeds the Cooking Department's seven wings and the Calibration Engine's cooking domain models.

**Key source standards:**
- **FDA Food Code** — Federal food safety standards, temperature requirements, storage limits
- **USDA FoodData Central** — Nutritional composition database
- **Harold McGee, "On Food and Cooking"** — Foundational food science reference (2004 revised edition)
- **J. Kenji López-Alt, "The Food Lab"** — Applied food science with systematic experimentation
- **Michael Ruhlman, "Ratio"** — Baker's percentages and fundamental cooking ratios
- **Shirley Corriher, "CookWise" / "BakeWise"** — Kitchen chemistry and troubleshooting

---

## Wing 1: Food Science Fundamentals

### The Maillard Reaction

The Maillard reaction, named after French chemist Louis-Camille Maillard who described it in 1912, is the non-enzymatic browning reaction between amino acids and reducing sugars. It is responsible for the characteristic flavors and colors of seared meat, toasted bread, roasted coffee, and baked goods.

**Key parameters for the Calibration Engine:**
- Onset temperature: ~140°C (280°F) for most foods; proceeds rapidly at 140-165°C (280-330°F)
- Surface moisture is the primary inhibitor — wet surfaces cannot exceed 100°C (212°F) until water evaporates
- pH sensitivity: alkaline conditions accelerate the reaction (why pretzels are dipped in lye)
- Sugar type matters: reducing sugars (glucose, fructose) react readily; sucrose does not participate directly
- Amino acid type determines flavor profile: different amino acids produce different flavor compound families

**Calibration implications:** When a user reports "no crust" or "grey meat," the engine should diagnose: insufficient surface drying, inadequate heat, overcrowding (trapped steam). The adjustment model: ensure surface is patted dry, increase heat, reduce batch size, extend preheat time.

### Emulsification

An emulsion is a stable mixture of two immiscible liquids (typically oil and water), stabilized by an emulsifier. In cooking, emulsifiers include lecithin (egg yolks), casein (dairy), and mustard.

**Types:** Oil-in-water (vinaigrette, milk, mayonnaise) and water-in-oil (butter, margarine).

**Breaking conditions:** Excessive heat, acid shock, or insufficient emulsifier causes separation.

**Calibration implications:** When a user reports "sauce broke" or "separated," diagnose: temperature too high, added acid too fast, insufficient emulsifier. Adjustment: lower heat, temper additions, add back emulsifier (egg yolk, mustard, or a small amount of the stable phase).

### Protein Denaturation

Heat, acid, mechanical action, and salt all change protein structure. In cooking, this governs:
- Egg cookery: albumin denatures at 62-65°C (whites begin setting), ovalbumin at 80°C (whites fully set), yolk proteins at 65-70°C
- Meat tenderness: collagen begins converting to gelatin at ~70°C (160°F) but requires sustained time; myosin denatures at 50°C, actin at 65-70°C
- Gluten formation: mechanical action (kneading) aligns glutenin and gliadin proteins into elastic networks

### Starch Gelatinization

When starch granules absorb water and are heated (typically 60-80°C depending on starch type), they swell, lose crystalline structure, and thicken the surrounding liquid. This is the basis of sauce thickening, pudding, gravy, and baked good structure.

**Key starches and their gelatinization temperatures:**
- Cornstarch: 62-72°C
- Wheat starch: 52-85°C (wide range due to protein interference)
- Potato starch: 56-66°C (gelatinizes at lower temp, produces clearer gels)

### Caramelization

Distinct from the Maillard reaction, caramelization is the pyrolysis of sugars alone (no amino acids required). Onset temperatures vary by sugar type:
- Fructose: 110°C (230°F)
- Glucose: 150°C (302°F)
- Sucrose: 160°C (320°F)

Produces nutty, butterscotch, and bitter compounds depending on temperature and duration. Extended caramelization at high temperatures leads to burning and acrid flavors.

### Fermentation

Microbial transformation of sugars. Three major types in cooking:
- **Alcoholic:** Yeast converts sugars to ethanol and CO₂ (bread, beer, wine)
- **Lactic acid:** Bacteria convert sugars to lactic acid (yogurt, kimchi, sourdough)
- **Acetic acid:** Bacteria convert ethanol to acetic acid (vinegar)

Yeast (Saccharomyces cerevisiae) is most active at 35-46°C (95-115°F), dormant below 10°C, and dies above 60°C (140°F).

---

## Wing 2: Thermodynamics of Cooking

### Heat Transfer Modes

**Conduction** — Direct contact heat transfer. Pan to food. Governed by the material's thermal conductivity:
- Copper: 385 W/m·K (excellent, but reactive)
- Aluminum: 205 W/m·K (good, lightweight)
- Cast iron: 52 W/m·K (moderate, but high heat capacity = excellent heat retention)
- Stainless steel: 16 W/m·K (poor conductor, often clad with aluminum/copper cores)

**Convection** — Heat transfer via fluid movement. Oven air, boiling water, deep-frying oil. Forced convection (convection ovens with fans) transfers heat approximately 25-30% more efficiently than natural convection.

**Radiation** — Electromagnetic energy transfer. Broilers, grills, toasters. Infrared radiation heats surfaces directly without heating the air between source and food.

### Specific Heat Capacity

How much energy it takes to raise a food's temperature:
- Water: 4.18 J/g·°C (very high — why water-rich foods heat slowly)
- Fats/oils: ~2.0 J/g·°C (heat faster than water)
- Proteins: ~1.7 J/g·°C
- Air: 1.0 J/g·°C (very low — why ovens take longer than pans)

**Calibration implications:** A thick, water-rich item (potato) needs more total energy and time than a thin, dry item (cracker). When users report "outside burned, inside raw," the engine should diagnose heat-to-mass ratio issues: lower temperature, longer time, or reduce thickness.

### Altitude Adjustments

At altitude, atmospheric pressure decreases, causing:
- Water boils at lower temperatures (~95°C at 5,000 ft / 1,524m vs. 100°C at sea level)
- Leavening gases expand more (baked goods rise faster, then collapse)
- Moisture evaporates faster

**Standard adjustments per 1,000 ft above 3,000 ft:**
- Reduce sugar by 1-3 tablespoons per cup
- Increase liquid by 2-4 tablespoons per cup
- Increase oven temperature by 15-25°F
- Reduce leavening by ⅛ to ¼ teaspoon per teaspoon

### The Calibration Engine's Core Cooking Model

Newton's Law of Cooling provides the mathematical foundation:
```
T(t) = T_ambient + (T_initial - T_ambient) · e^(-kt)
```

This IS exponential decay — the same concept in the Mathematics Department. The cooling constant `k` depends on the food's mass, surface area, specific heat, and the cooking medium. The Calibration Engine adjusts `k` based on user feedback, essentially learning the thermal properties of the user's specific equipment and environment.

---

## Wing 3: Nutrition Science

### Macronutrients

- **Proteins** (4 cal/g): Amino acid chains. Complete proteins contain all 9 essential amino acids (meat, eggs, dairy, soy, quinoa). Incomplete proteins lack one or more (most plant sources — combine for completeness).
- **Carbohydrates** (4 cal/g): Simple (sugars) and complex (starches, fiber). Fiber is indigestible but essential for gut health.
- **Fats** (9 cal/g): Saturated (solid at room temp), unsaturated (liquid), and trans (artificially hydrogenated — avoid).

### How Cooking Affects Nutrition

- **Heat destroys some vitamins:** Vitamin C and B vitamins are heat-sensitive. Boiling leaches water-soluble vitamins into cooking liquid. Steaming preserves more nutrients than boiling.
- **Heat increases bioavailability of others:** Cooking tomatoes increases lycopene availability. Cooking carrots increases beta-carotene availability.
- **Fat enables absorption:** Fat-soluble vitamins (A, D, E, K) require dietary fat for absorption. A salad with oil dressing delivers more vitamin A from carrots than one without.

---

## Wing 4: Technique Taxonomy

### Wet Heat Methods
- **Boiling** (100°C / 212°F): Full rolling boil. Pasta, blanching vegetables.
- **Simmering** (85-95°C / 185-200°F): Gentle bubbles. Stocks, sauces, braises.
- **Poaching** (70-82°C / 160-180°F): No bubbles visible. Eggs, fish, delicate proteins.
- **Steaming** (100°C / 212°F): Steam heat, no direct water contact. Vegetables, dumplings.
- **Braising**: Combination — sear (dry heat) then cook in liquid (wet heat). Tough cuts of meat.

### Dry Heat Methods
- **Roasting/Baking** (150-230°C / 300-450°F): Oven, convection. Meats, vegetables, baked goods.
- **Grilling/Broiling**: Direct radiant heat. High temperature surface browning.
- **Sautéing**: Hot pan, small amount of fat, quick cooking. Vegetables, thin proteins.
- **Pan-frying**: More fat than sautéing, less than deep-frying. Cutlets, fish fillets.
- **Deep-frying** (175-190°C / 350-375°F): Full submersion in hot oil. Rapid, even browning.

### Knife Skills Hierarchy

The foundational physical technique of cooking:
1. **Grip**: Pinch grip (thumb and index finger on blade heel) for control
2. **Basic cuts**: Rough chop → dice → mince → julienne → brunoise
3. **Guiding hand**: Claw grip (tucked fingers) for safety
4. **Rocking motion**: Chef's knife pivots on tip for efficient mincing

---

## Wing 5: Baking Science

### Baker's Percentages (Ratios)

All ingredients expressed as a percentage of flour weight:

| Bread Type | Flour | Water | Salt | Yeast | Fat | Sugar |
|-----------|-------|-------|------|-------|-----|-------|
| Lean bread | 100% | 60-65% | 2% | 1-2% | 0% | 0% |
| Enriched bread | 100% | 55-60% | 2% | 2-3% | 5-10% | 5-10% |
| Brioche | 100% | 10-20% | 2% | 3-4% | 50-60% | 10-15% |

**Calibration implications:** Baker's percentages ARE ratios — the same mathematical concept in the Math Department. The Calibration Engine adjusts ratios based on feedback: "too dense" → increase hydration; "too flat" → reduce fat or increase gluten development; "too dry" → increase hydration or reduce bake time.

### Gluten Development

Gluten is formed when glutenin and gliadin proteins in wheat flour hydrate and are mechanically aligned through kneading. Key variables:
- **Flour protein content:** Bread flour (~12-14%) vs. all-purpose (~10-12%) vs. cake flour (~7-9%)
- **Hydration:** More water = more gluten development potential
- **Kneading time:** Develops gluten network (bread) vs. minimal mixing (tender pastry)
- **Fat and sugar:** Coat gluten strands, shortening them — hence "shortening" and "shortbread"

### Leavening

- **Chemical:** Baking soda (needs acid) and baking powder (self-contained acid + base). Produces CO₂ immediately on hydration and/or heat.
- **Biological:** Yeast fermentation produces CO₂ and ethanol. Requires time (proofing).
- **Mechanical:** Whipped eggs (meringue), creamed butter and sugar. Air incorporated physically.
- **Steam:** Water converts to steam at 100°C, expanding ~1,600x in volume. Primary leavener in puff pastry and choux.

---

## Wing 6: Food Safety

### Temperature Danger Zone

The FDA Food Code defines the danger zone as 40°F to 140°F (4°C to 60°C). Bacteria multiply rapidly in this range (doubling every 20 minutes under ideal conditions). Food should not remain in the danger zone for more than 2 hours total (1 hour if ambient temperature exceeds 90°F / 32°C).

### Safe Internal Temperatures (USDA)

| Food | Minimum Internal Temp | Rest Time |
|------|----------------------|-----------|
| Poultry (all cuts) | 165°F / 74°C | None required |
| Ground meats (beef, pork, lamb) | 160°F / 71°C | None required |
| Beef steaks, roasts, chops | 145°F / 63°C | 3 minutes |
| Pork (steaks, roasts, chops) | 145°F / 63°C | 3 minutes |
| Fish and shellfish | 145°F / 63°C | None required |
| Eggs | Cook until yolk and white are firm | — |
| Leftovers, casseroles | 165°F / 74°C | — |

**These are ABSOLUTE safety boundaries. The Calibration Engine never suggests temperatures below these minimums, regardless of user preference or feedback history.**

### Cross-Contamination Prevention

- Separate cutting boards for raw meat/poultry and ready-to-eat foods
- Wash hands for 20 seconds with soap after handling raw proteins
- Raw meat stored below ready-to-eat items in refrigerator
- Clean and sanitize surfaces that contacted raw proteins before using for other foods

### Safe Storage Times (Refrigerated at 40°F / 4°C)

| Food | Refrigerator | Freezer |
|------|-------------|---------|
| Raw poultry | 1-2 days | 9-12 months |
| Raw ground meat | 1-2 days | 3-4 months |
| Raw steaks, roasts | 3-5 days | 4-12 months |
| Cooked leftovers | 3-4 days | 2-3 months |
| Eggs (in shell) | 3-5 weeks | Not recommended |

---

## Wing 7: Home Economics Fundamentals

### Meal Planning Principles

- **Batch cooking:** Prepare staples (grains, proteins, roasted vegetables) once, assemble meals throughout the week
- **Flavor base preparation:** Make large batches of mirepoix, sofrito, curry paste — freeze in portions
- **Pantry rotation:** First in, first out (FIFO) to minimize waste
- **Seasonal purchasing:** Peak-season produce is cheaper, more nutritious, and better tasting

### Waste Reduction

- **Vegetable scraps → stock:** Onion skins, celery tops, carrot peels frozen and simmered into broth
- **Stale bread → breadcrumbs, croutons, bread pudding**
- **Overripe fruit → smoothies, baking, jam**
- **Proper storage:** Ethylene-producing fruits (apples, bananas, avocados) stored separately from ethylene-sensitive items (lettuce, broccoli, berries)

### Budget Management

- **Cost per serving** is more useful than cost per item
- **Protein cost comparison:** Dried beans and lentils are 5-10x cheaper per gram of protein than most meats
- **Store brands** are typically identical in quality to name brands for staple items
- **Loss leaders** (deeply discounted items stores use to attract shoppers) are genuine savings when you actually need the item

---

## Source Bibliography

**Professional Standards:**
- FDA Food Code (current edition)
- USDA Food Safety and Inspection Service guidelines
- USDA FoodData Central nutritional database
- Codex Alimentarius food safety standards

**Foundational Food Science:**
- McGee, Harold. "On Food and Cooking: The Science and Lore of the Kitchen." Scribner, 2004.
- López-Alt, J. Kenji. "The Food Lab: Better Home Cooking Through Science." W.W. Norton, 2015.
- Corriher, Shirley. "CookWise: The Secrets of Cooking Revealed." William Morrow, 2011.
- Corriher, Shirley. "BakeWise: The Hows and Whys of Successful Baking." Scribner, 2008.

**Baking Science:**
- Ruhlman, Michael. "Ratio: The Simple Codes Behind the Craft of Everyday Cooking." Scribner, 2009.
- Figoni, Paula. "How Baking Works." Wiley, 2010.

**Chemistry:**
- Maillard, L.C. "Action des acides aminés sur les sucres." Comptes Rendus, 1912.
- Hodge, J.E. "Dehydrated foods: Chemistry of browning reactions in model systems." J. Agric. Food Chem., 1953.

**Applied Food Science:**
- Myhrvold, Nathan et al. "Modernist Cuisine." The Cooking Lab, 2011.
- This, Hervé. "Molecular Gastronomy: Exploring the Science of Flavor." Columbia University Press, 2006.
