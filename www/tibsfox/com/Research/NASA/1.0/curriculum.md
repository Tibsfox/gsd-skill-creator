# Mission 1.0 -- NASA Agency Founding: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects, Fox Companies Pathways

**Mission:** NASA Agency Founding (October 1, 1958)
**Primary Departments:** Aeronautics, Organizational Theory, Ecology
**Secondary Departments:** History, Mathematics, Music Theory, Creative Arts
**Organism:** Armillaria ostoyae (Honey Mushroom)

---

## Department Deposits

### Aeronautics (Primary)

**Wing:** Airfoil Design and Wind Tunnel Testing
**Concept:** Systematic parameter variation — the NACA methodology that defined 20th century aerodynamics

**Deposit:** The NACA 4-digit airfoil series is a complete curriculum in parameter-space exploration:
- How to encode a complex shape (airfoil) as a small number of parameters (M, P, XX)
- How to vary parameters systematically to map a design space
- How to use wind tunnels to validate mathematical models
- Why dimensional analysis (Reynolds number, Mach number) allows lab results to predict full-scale behavior

### Organizational Theory (Primary)

**Wing:** Institutional Transformation
**Concept:** How invisible infrastructure becomes visible during crisis — the hidden network thesis

**Deposit:** The NACA→NASA transition as a case study in organizational transformation:
- 43 years of quiet research (invisible network, underground)
- Crisis event (Sputnik, October 4, 1957) that revealed the network's extent
- Transformation: committee → agency, research → operations, invisible → visible
- Personnel continuity: the same 8,000 people doing expanded work
- The pattern: hidden infrastructure + crisis = rapid visible transformation

### Ecology (Primary)

**Wing:** Mycology and Network Ecology
**Concept:** Distributed organisms without central control — mycelial intelligence

**Deposit:** Armillaria ostoyae as the world's largest living organism:
- 2,385 acres, 2,400 years old, Malheur National Forest, Oregon
- Growth through rhizomorphs (underground root-like structures)
- Resource allocation without a brain — chemical gradients guide growth
- Network topology: how branching decisions are made at hyphal tips
- The parallel to NACA's three-lab network: distributed, autonomous, effective

### History (Secondary)

**Wing:** Cold War Science and Technology Policy
**Deposit:** The political architecture of NASA's founding — from NACA rider bill (1915) to National Aeronautics and Space Act (1958).

### Mathematics (Secondary)

**Wing:** Parametric Functions and Dimensional Analysis
**Deposit:** The NACA airfoil equations as parametric curves. Reynolds number as dimensional analysis. Both are about encoding complex phenomena in compact mathematical representations.

### Music Theory (Secondary)

**Wing:** Dynamics and the Crescendo
**Concept:** The 43-year crescendo — NACA's slow build from pianissimo to fortissimo

**Deposit:** NACA's history is a musical dynamics map:
- 1915-1940: pianissimo — quiet research, small budgets, invisible
- 1940-1945: crescendo — WWII demands, rapid lab expansion, louder
- 1945-1957: mezzo-piano — postwar, back to steady research, but with more capability
- 1957 (Sputnik): sforzando — sudden, shocking accent
- 1958 (NASA): fortissimo — full volume, national priority, visible to everyone
- The NACA cowling moment (1928): a grace note — small, elegant, technically perfect
- Connection to S36 (Seattle 360): the Seattle jazz scene has the same dynamic — decades of quiet excellence, then a moment of visibility (Quincy Jones, Ray Charles coming up through the scene)

### Creative Arts (Secondary)

**Wing:** Generative Systems and Network Art
**Deposit:** Mycelial networks as generative art algorithms — space colonization algorithms that produce organic branching patterns matching real fungal growth.

---

## TRY Sessions

### TRY 1: Generate Your Own NACA Airfoil

**Duration:** 30 minutes
**Difficulty:** Beginner
**Department:** Aeronautics / Mathematics
**What You Need:** Python 3.8+ with numpy and matplotlib (or graph paper and a calculator)

**What You'll Learn:**
The moment you realize that a wing shape is just a math formula — and that by changing three numbers, you can design any airfoil in the NACA 4-digit series.

**Entry Conditions:**
- [ ] Python 3.8+ with numpy, matplotlib
- [ ] Know what a coordinate system is

**The Exercise:**

**Step 1: Understand the code**

The NACA 4-digit airfoil is defined by three parameters encoded in a 4-digit number. NACA 2412 means:
- 2 = maximum camber is 2% of chord length
- 4 = maximum camber is at 40% of chord from leading edge
- 12 = maximum thickness is 12% of chord length

**Step 2: Compute the airfoil shape**

```python
import numpy as np
import matplotlib.pyplot as plt

def naca_4digit(code, n_points=200):
    """Generate NACA 4-digit airfoil coordinates."""
    m = int(code[0]) / 100.0    # max camber
    p = int(code[1]) / 10.0     # camber position
    t = int(code[2:]) / 100.0   # thickness

    x = np.linspace(0, 1, n_points)

    # Thickness distribution (symmetrical)
    yt = 5 * t * (0.2969*np.sqrt(x) - 0.1260*x - 0.3516*x**2
                  + 0.2843*x**3 - 0.1015*x**4)

    # Camber line
    yc = np.where(x < p,
                  m/(p**2) * (2*p*x - x**2) if p > 0 else 0,
                  m/((1-p)**2) * ((1-2*p) + 2*p*x - x**2) if p < 1 else 0)

    # Upper and lower surfaces
    xu, yu = x - yt*0, yc + yt   # simplified (no rotation)
    xl, yl = x + yt*0, yc - yt

    return xu, yu, xl, yl

# Generate and plot
for code in ['0012', '2412', '4412', '6412']:
    xu, yu, xl, yl = naca_4digit(code)
    plt.plot(xu, yu, label=f'NACA {code}')
    plt.plot(xl, yl, color=plt.gca().lines[-1].get_color())

plt.axis('equal')
plt.grid(True, alpha=0.3)
plt.legend()
plt.title('NACA 4-Digit Airfoil Family')
plt.xlabel('x/c')
plt.ylabel('y/c')
plt.show()
```

**Step 3: Change the numbers**

Try: 0012 (symmetric, zero camber), 2412 (standard), 4412 (more camber), 6412 (lots of camber). Watch how the shape changes. This is what NACA engineers did at Langley — systematic parameter variation.

**What Just Happened:**
You generated the same airfoil shapes that NACA published in Report 460 (1933). These shapes are STILL used on aircraft flying today. The NACA 23012 is on the Cessna 172 — the most produced aircraft in history. You just did, in 30 seconds of Python, what took NACA engineers weeks of wind tunnel time.

**The NASA Connection:**
The NACA airfoil series was NACA's single greatest contribution to aviation. When people ask "what did NACA do for 43 years?", the answer includes these shapes. They are encoded in every aircraft design textbook on Earth.

---

### TRY 2: Build a Wind Tunnel from Cardboard

**Duration:** 2 hours
**Difficulty:** Beginner
**Department:** Aeronautics / Engineering
**What You Need:** Large cardboard box, box fan ($15), drinking straws (100), tape, tissue paper strips

**What You'll Learn:**
The moment you see airflow become visible — tissue paper strips attached to a model show exactly where the air goes, including separation and turbulence. NACA engineers used smoke and tufts for the same purpose.

**Entry Conditions:**
- [ ] Cardboard box (at least 18" x 12" x 12")
- [ ] Box fan or desk fan
- [ ] 100 drinking straws (flow straightener)
- [ ] Tissue paper strips + tape
- [ ] A small model to test (toy car, carved balsa wood airfoil)

**The Exercise:**

**Step 1: Build the tunnel**
- Cut both ends off the cardboard box
- Bundle 100 straws together and tape into one end (this is the flow straightener — it makes the air flow in parallel streams instead of tumbling)
- Mount the fan at the same end, blowing through the straws
- The other end is open (exhaust)

**Step 2: Make flow visible**
- Cut tissue paper into thin strips (2mm x 50mm)
- Tape strips to the test model at several locations
- Place model in the middle of the tunnel on a mount (dowel or wire)

**Step 3: Observe**
- Turn on the fan
- Watch the tissue strips: they show airflow direction
- Strips lying flat = smooth attached flow
- Strips fluttering = turbulent or separated flow
- Rotate the model to different angles — watch flow separate at high angles (stall)

**What Just Happened:**
You built a working wind tunnel. NACA's first tunnel at Langley (1920) used the exact same principle: a fan, a flow straightener, a test section. Your cardboard version tests at lower speeds, but the physics is identical. Flow visualization with tufts (tissue strips) is still used on real aircraft during flight testing.

---

### TRY 3: Map a Network

**Duration:** 45 minutes
**Difficulty:** Beginner
**Department:** Ecology / Computer Science
**What You Need:** Paper, pencil, a park or forest to walk through

**What You'll Learn:**
How to see the hidden network — the connections between organisms that aren't visible on the surface.

**Entry Conditions:**
- [ ] Access to a park, forest, or even a yard with trees
- [ ] Paper and pencil (or phone for notes)

**The Exercise:**

**Step 1:** Walk to a tree. Note its species (or just "deciduous" / "conifer"). Draw it as a circle on your paper.

**Step 2:** Look at the ground around the tree. Are there mushrooms? Lichens? What's growing within 2 meters? Draw each organism as a smaller circle connected to the tree.

**Step 3:** Walk to the next tree. Repeat. If both trees have the same type of mushroom, draw a dashed line between them — they may share a mycelial network underground.

**Step 4:** After mapping 10-15 trees, look at your network diagram. Which trees are most connected? Which seem isolated? The most connected tree is probably the hub of an underground fungal network — just like the most connected lab (Langley) was the hub of NACA.

**What Just Happened:**
You mapped a hidden network. Mycologists use exactly this technique — mapping above-ground fruiting bodies to infer below-ground mycelial connections. The network you drew IS the forest's internet. Armillaria ostoyae's 2,385-acre network was discovered this way — by Catherine Parks mapping mushroom locations and then using DNA analysis to confirm they were all one organism.

---

## DIY Projects

### DIY 1: Build a Functional Wind Tunnel

**Department:** Aeronautics / Engineering
**Difficulty:** Intermediate
**Estimated Cost:** $60-100
**Duration:** Weekend project (10-15 hours)

**What You Build:**
An upgraded wind tunnel using plywood, a bathroom exhaust fan, and a honeycomb flow straightener. Test section large enough for airfoil models cut from foam or balsa.

**Materials:**
- Plywood sheets (1/4" birch, 2x4 feet) — $15
- Bathroom exhaust fan (80 CFM) — $25
- Honeycomb core (aluminum or cardboard from packaging) — $5-10
- Clear acrylic sheet (for viewing window) — $8
- Incense sticks (smoke visualization) — $3
- Balsa wood for airfoil models — $5

**Fox Companies Connection:**
STEM education service offering wind tunnel workshops. Each participant builds a small tunnel and tests airfoil shapes. Monthly sessions at a makerspace. Revenue: $40/session. After 6 months, participants understand aerodynamics well enough to explain it to others. Advanced workshops: build a smoke tunnel, test real model aircraft, measure forces with a simple balance.

---

### DIY 2: Grow Mushrooms from Spawn

**Department:** Ecology / Biology
**Difficulty:** Beginner
**Estimated Cost:** $20-30
**Duration:** 2-4 weeks (ongoing observation)

**What You Build:**
A mushroom growing kit. While Armillaria ostoyae is a forest pathogen and not practical for home cultivation, oyster mushrooms (Pleurotus ostreatus) are in the same fungal kingdom and demonstrate the same mycelial network growth visible through a clear container.

**Materials:**
- Oyster mushroom spawn ($10 from online supplier)
- Straw or coffee grounds (substrate) — free or $2
- Clear plastic container with holes — $3
- Spray bottle — $2

**The learning:** Watch the mycelium colonize the substrate over 2-3 weeks. The white threads spreading through the straw ARE the hidden network. When mushrooms finally appear (the fruiting bodies), you're seeing Sputnik — the moment the hidden network becomes visible.

**Fox Companies Connection:**
Mushroom cultivation service. Gourmet oyster mushrooms grown on coffee grounds from local cafes. Sold at farmers' markets. Revenue: oyster mushrooms sell for $12-18/pound, one 5-pound bucket of coffee grounds can produce 1-2 pounds of mushrooms. Scale: 50 buckets = 50-100 lbs/month. Knowledge base: this mission's mycology content.

---

### DIY 3: Arduino Wind Speed Station

**Department:** Electronics / Aeronautics
**Difficulty:** Beginner-Intermediate
**Estimated Cost:** $44-86
**Duration:** Weekend project (4-6 hours)

**What You Build:**
The Arduino wind speed indicator from Simulation A6. Measures and displays wind speed, Reynolds number, and Mach number.

**Fox Companies Connection:**
Weather monitoring service for local farms, marinas, and outdoor events. Arduino-based stations log wind speed, temperature, and humidity. Monthly data reports for clients. Revenue: station installation ($200), monthly monitoring ($25). Knowledge base accumulates with each mission's sensor projects.

---

## Rosetta Stone Connections

| From | To | Connection |
|------|-----|-----------|
| Aeronautics (airfoil parameters) | Ecology (mycelial growth) | Both are about encoding complex shapes/behaviors in a small number of parameters. NACA: 4 digits → wing shape. Armillaria: chemical gradients → branching pattern |
| Organizational Theory (NACA→NASA) | Ecology (hidden network → fruiting body) | The organism was always there. The crisis (Sputnik/favorable conditions) triggered the visible transformation (NASA/mushrooms). The pattern is identical |
| History (43 years) | Music Theory (crescendo) | NACA's dynamic arc from pianissimo to fortissimo matches a musical crescendo. The sforzando of Sputnik is the accent that changes everything |
| Mathematics (parametric curves) | Creative Arts (generative art) | Airfoil shapes are parametric curves. Mycelial networks are generative patterns. Both produce organic forms from mathematical rules |
| Computer Science (network analysis) | Ecology (mycelial network) | Same graph theory tools analyze both. Degree centrality, betweenness, clustering coefficient — applicable to organism networks and organizational networks |

### GSD-OS Integration Points

**Screensaver contribution:** Hidden Network (mycelial growth visualization)
- Golden rhizomorphs on dark earth
- XScreenSaver module + GSD-OS animated wallpaper
- Configurable: growth speed, branching density, nutrient pulse frequency

**Desktop widget:** NACA Airfoil Explorer
- Small panel showing airfoil profile
- Click digits to change parameters (0-9)
- See shape update in real time
- Right-click: open research.md, simulation.md

**Control surface:** Systematic Parameter Explorer
- Template for methodical testing in GSD workflows
- Inspired by NACA's one-parameter-at-a-time methodology
- Shows parameter matrix with tested/untested cells highlighted

---

## Community Business Pathways (Fox Companies)

### Pathway 1: Aerodynamics Education

**From:** TRY 1 + TRY 2 + DIY 1 → wind tunnel workshops
**Business model:** Monthly STEM workshops at makerspace ($40/person, 10-15 participants)
**Revenue:** $400-600/month part-time

### Pathway 2: Mushroom Cultivation

**From:** DIY 2 + organism research → gourmet mushroom farm
**Business model:** Oyster mushrooms on coffee grounds, farmers market sales ($12-18/lb)
**Revenue:** $600-1,800/month at scale

### Pathway 3: Environmental Monitoring

**From:** DIY 3 + sensor knowledge → weather/wind monitoring service
**Business model:** Arduino stations for farms/marinas ($200 install + $25/month)
**Revenue:** 20 clients = $500/month recurring
