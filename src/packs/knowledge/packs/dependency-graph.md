# Knowledge Pack Dependency Graph

Visual map of all 35 foundational knowledge packs showing prerequisite relationships and learning pathways.

## Legend

- **Solid lines** (→): Hard prerequisites (must have foundational knowledge)
- **Dashed lines** (⇢): Recommended prior knowledge (helpful background, not required)

## Graph

```mermaid
graph TD
    subgraph core["Core Academic (15 packs)"]
        MATH-101["Mathematics"]
        SCI-101["Science Method"]
        READ-101["Reading Foundations"]
        COMM-101["Communication"]
        CRIT-101["Critical Thinking"]
        PHYS-101["Physics"]
        CHEM-101["Chemistry"]
        GEO-101["Geography"]
        HIST-101["History"]
        PROB-101["Probability & Logic"]
        STAT-101["Statistics"]
        BUS-101["Business Fundamentals"]
        ENGR-101["Engineering"]
        MFAB-101["Materials & Fabrication"]
        TECH-101["Technology"]
    end

    subgraph applied["Applied & Practical (10 packs)"]
        CODE-101["Computer Science & Coding"]
        DATA-101["Data Science"]
        DIGLIT-101["Digital Literacy"]
        WRIT-101["Writing"]
        LANG-101["Language Learning"]
        LOG-101["Logic & Formal Reasoning"]
        ECON-101["Economics"]
        ENVR-101["Environmental Science"]
        PSYCH-101["Psychology"]
        NUTR-101["Nutrition & Health"]
    end

    subgraph specialized["Specialized & Deepening (10 packs)"]
        ART-101["Visual Arts"]
        PHILO-101["Philosophy"]
        NATURE-101["Nature Studies"]
        PE-101["Physical Education"]
        DOMESTIC-101["Home Economics & Life Skills"]
        THEO-101["Theology & Religious Studies"]
        ASTRO-101["Astronomy"]
        LEARN-101["Learning & Metacognition"]
        MUSIC-101["Music"]
        TRADE-101["Trades & Applied Skills"]
    end

    %% Core Academic → Applied
    MATH-101 --> PHYS-101
    MATH-101 --> CODE-101
    MATH-101 --> DATA-101
    MATH-101 --> ECON-101
    MATH-101 --> ASTRO-101
    MATH-101 --> LOG-101

    SCI-101 --> PHYS-101
    SCI-101 --> CHEM-101
    SCI-101 --> ENVR-101
    SCI-101 --> NATURE-101

    READ-101 --> WRIT-101
    READ-101 --> CRIT-101
    READ-101 --> HIST-101
    READ-101 --> COMM-101

    COMM-101 --> WRIT-101
    COMM-101 --> BUS-101
    COMM-101 --> LANG-101

    CRIT-101 --> LOG-101
    CRIT-101 --> PHILO-101
    CRIT-101 --> PROB-101

    PHYS-101 --> ASTRO-101
    PHYS-101 --> ENGR-101
    PHYS-101 --> CHEM-101

    CHEM-101 --> ENVR-101
    CHEM-101 --> NUTR-101
    CHEM-101 --> NATURE-101

    GEO-101 --> ENVR-101
    GEO-101 --> ASTRO-101
    GEO-101 --> NATURE-101

    HIST-101 --> PHILO-101
    HIST-101 --> GEO-101

    PROB-101 --> CODE-101
    PROB-101 --> ENGR-101
    PROB-101 --> DATA-101

    STAT-101 --> DATA-101
    STAT-101 --> ECON-101

    BUS-101 --> ECON-101

    ENGR-101 --> MFAB-101
    ENGR-101 --> TRADE-101

    MFAB-101 --> TRADE-101

    TECH-101 --> CODE-101
    TECH-101 --> ENGR-101
    TECH-101 --> DIGLIT-101
    TECH-101 --> TRADE-101

    %% Applied Practical relationships
    CODE-101 --> DATA-101
    CODE-101 --> DIGLIT-101

    DIGLIT-101 --> CODE-101
    DIGLIT-101 --> DATA-101

    WRIT-101 --> COMM-101
    WRIT-101 --> PHILO-101
    WRIT-101 --> HIST-101

    LOG-101 --> CODE-101
    LOG-101 --> PHILO-101

    ECON-101 --> BUS-101

    ENVR-101 --> NATURE-101
    ENVR-101 --> ASTRO-101

    NUTR-101 --> ENVR-101
    NUTR-101 --> PE-101
    NUTR-101 --> DOMESTIC-101

    PSYCH-101 --> LEARN-101

    %% Recommended prior knowledge (dashed)
    MATH-101 -.-> SCI-101
    MATH-101 -.-> STAT-101
    MATH-101 -.-> PROB-101
    MATH-101 -.-> BUS-101
    MATH-101 -.-> MUSIC-101
    MATH-101 -.-> TRADE-101

    SCI-101 -.-> GEO-101
    SCI-101 -.-> PHYS-101
    SCI-101 -.-> CHEM-101
    SCI-101 -.-> ENVR-101
    SCI-101 -.-> NATURE-101
    SCI-101 -.-> PSYCH-101
    SCI-101 -.-> NUTR-101

    READ-101 -.-> COMM-101
    READ-101 -.-> CRIT-101
    READ-101 -.-> HIST-101
    READ-101 -.-> PHILO-101
    READ-101 -.-> LANG-101
    READ-101 -.-> DIGLIT-101
    READ-101 -.-> WRIT-101

    COMM-101 -.-> WRIT-101
    COMM-101 -.-> LANG-101
    COMM-101 -.-> BUS-101
    COMM-101 -.-> PSYCH-101

    READ-101 -.-> CRIT-101
    CRIT-101 -.-> PHILO-101
    CRIT-101 -.-> LOG-101
    CRIT-101 -.-> PROB-101

    PHYS-101 -.-> MATH-101
    PHYS-101 -.-> SCI-101
    PHYS-101 -.-> TRADE-101
    PHYS-101 -.-> ASTRO-101

    CHEM-101 -.-> MATH-101
    CHEM-101 -.-> SCI-101

    GEO-101 -.-> MATH-101
    GEO-101 -.-> SCI-101

    ENGR-101 -.-> MATH-101
    ENGR-101 -.-> SCI-101
    ENGR-101 -.-> MFAB-101
    ENGR-101 -.-> TRADE-101

    MFAB-101 -.-> SCI-101
    MFAB-101 -.-> ENGR-101

    CODE-101 -.-> MATH-101
    CODE-101 -.-> PROB-101

    DIGLIT-101 -.-> READ-101

    DATA-101 -.-> MATH-101
    DATA-101 -.-> STAT-101

    LOG-101 -.-> MATH-101
    LOG-101 -.-> CRIT-101

    ECON-101 -.-> MATH-101

    LANG-101 -.-> READ-101
    LANG-101 -.-> COMM-101

    WRIT-101 -.-> READ-101
    WRIT-101 -.-> COMM-101

    ENVR-101 -.-> SCI-101
    ENVR-101 -.-> CHEM-101
    ENVR-101 -.-> GEO-101

    ASTRO-101 -.-> PHYS-101
    ASTRO-101 -.-> MATH-101
    ASTRO-101 -.-> SCI-101

    NUTR-101 -.-> SCI-101
    NUTR-101 -.-> CHEM-101

    NATURE-101 -.-> SCI-101
    NATURE-101 -.-> ENVR-101

    PE-101 -.-> NUTR-101

    DOMESTIC-101 -.-> NUTR-101
    DOMESTIC-101 -.-> ECON-101

    PHILO-101 -.-> CRIT-101
    PHILO-101 -.-> READ-101

    MUSIC-101 -.-> MATH-101

    TRADE-101 -.-> MATH-101
    TRADE-101 -.-> PHYS-101
    TRADE-101 -.-> ENGR-101

    PSYCH-101 -.-> SCI-101
    PSYCH-101 -.-> COMM-101

    %% Styling by tier
    classdef coreStyle fill:#4A90E2,stroke:#1e3a8a,stroke-width:2px,color:#fff
    classdef appliedStyle fill:#7CB342,stroke:#2e5c17,stroke-width:2px,color:#fff
    classdef specStyle fill:#9C27B0,stroke:#4a148c,stroke-width:2px,color:#fff
    classdef specDeepStyle fill:#E91E63,stroke:#880E4F,stroke-width:2px,color:#fff

    class MATH-101,SCI-101,READ-101,COMM-101,CRIT-101,PHYS-101,CHEM-101,GEO-101,HIST-101,PROB-101,STAT-101,BUS-101,ENGR-101,MFAB-101,TECH-101 coreStyle
    class CODE-101,DATA-101,DIGLIT-101,WRIT-101,LANG-101,LOG-101,ECON-101,ENVR-101,PSYCH-101,NUTR-101 appliedStyle
    class ART-101,PHILO-101,NATURE-101,PE-101,DOMESTIC-101,THEO-101 specStyle
    class ASTRO-101,LEARN-101,MUSIC-101,TRADE-101 specDeepStyle
```

## Tier Definitions

### Core Academic (15 packs)
Foundation packs that serve as prerequisites for other packs. These cover essential knowledge and skills across major disciplines:
- **Mathematics**: MATH-101
- **Science Fundamentals**: SCI-101
- **Literacy & Communication**: READ-101, COMM-101, CRIT-101
- **Physical Sciences**: PHYS-101, CHEM-101
- **Social Sciences**: HIST-101, GEO-101
- **Quantitative Reasoning**: PROB-101, STAT-101
- **Applied Core**: BUS-101, ENGR-101, MFAB-101, TECH-101

### Applied & Practical (10 packs)
Packs that apply core academic knowledge to practical, real-world domains:
- **Computing**: CODE-101, DATA-101, DIGLIT-101
- **Communication & Language**: WRIT-101, LANG-101, LOG-101
- **Economics & Environment**: ECON-101, ENVR-101
- **Human Sciences**: PSYCH-101, NUTR-101

### Specialized & Deepening (10 packs)
Elective packs that deepen understanding in specific domains or offer alternative entry points. Subdivided into:

**Specialized (6 packs):**
- **Arts & Wellness**: ART-101, PE-101
- **Humanities & Culture**: PHILO-101, THEO-101
- **Natural World**: NATURE-101
- **Life Skills**: DOMESTIC-101

**Specialized & Deepening (4 packs):**
- **Advanced Sciences**: ASTRO-101
- **Meta-Learning**: LEARN-101
- **Arts & Skills**: MUSIC-101
- **Applied Trades**: TRADE-101

## Common Learning Pathways

### STEM Pathway
MATH-101 → PHYS-101 → ASTRO-101
MATH-101 → SCI-101 → CHEM-101 → ENVR-101
MATH-101 → PROB-101 → CODE-101 → DATA-101

### Humanities Pathway
READ-101 → CRIT-101 → PHILO-101
READ-101 → HIST-101 → GEO-101
READ-101 → COMM-101 → WRIT-101

### Applied Technology Pathway
TECH-101 → CODE-101 → DATA-101
TECH-101 → ENGR-101 → TRADE-101

### Professional Skills Pathway
COMM-101 → BUS-101 → ECON-101
READ-101 → WRIT-101 → LANG-101

## Graph Properties

- **35 total nodes**: All foundational knowledge packs
- **3 tier groupings**: Core (15), Applied (10), Specialized (10)
- **Hard prerequisites**: Solid arrows representing required foundation
- **Recommended prior knowledge**: Dashed arrows representing helpful background
- **No circular dependencies**: Graph is acyclic (valid DAG)
- **Entry points**: 6 packs with no hard prerequisites (MATH-101, SCI-101, READ-101, ART-101, MUSIC-101, TECH-101)
- **Terminal packs**: 8 packs that don't enable others (ART-101, LANG-101, NATURE-101, PE-101, DOMESTIC-101, THEO-101, LEARN-101, MUSIC-101)
