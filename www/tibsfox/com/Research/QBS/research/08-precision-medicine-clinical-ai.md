# M8: Precision Medicine & Clinical AI

## From Population Statistics to Individual Prediction

The twentieth century of medicine was built on population averages: clinical trials measured mean responses, treatment protocols assumed typical patients, and "evidence-based medicine" meant applying group-level evidence to individual decisions. The twenty-first century is inverting this — not abandoning evidence, but refining it to the resolution of a single person.

Three forces converge: multi-omic measurement (the ability to measure tens of thousands of molecular features simultaneously), machine learning (the ability to find patterns in those measurements that exceed human analytical capacity), and clinical informatics (the ability to deploy those patterns as decision support at the point of care). Together, they create what the field calls precision medicine — though "personalized medicine" and "data-driven clinical decision support" describe the same trajectory.

---

## The Aging Clock Revolution

### From Chronological to Biological Time

Jessica Lasky-Su (Associate Professor, Harvard Medical School, Department of Epidemiology; Cornell BS in Biostatistics, Purdue MS in Statistics, Harvard PhD in Epidemiology) presented the most complete view of multi-omic aging at Thayer School's Jones Seminar Series.

The core insight: chronological age is a crude proxy for biological state. Two 60-year-olds may differ by decades in their biological age — one showing molecular signatures of a 45-year-old, the other of a 75-year-old. The question is how to measure this.

**DNA methylation clocks** were the first generation: specific CpG sites across the genome change their methylation status with age in predictable patterns. Steve Horvath's 2013 clock used 353 CpG sites to predict chronological age with a median absolute deviation of ~3.6 years. But predicting chronological age isn't the point — the clinically meaningful quantity is the *residual*, the difference between predicted and actual age. A positive residual (biologically older than chronologically) predicts accelerated disease onset and mortality.

**OMIC Age** represents the second generation: instead of one molecular layer, it integrates across proteomics (protein abundance), metabolomics (small molecule profiles), epigenomics (DNA methylation), and standard clinical labs (CBC, metabolic panel, lipid panel). The integrated model achieves approximately 90% accuracy for 10-year mortality prediction — substantially better than any single-omic clock alone.

### The Autoantibody Surprise

Perhaps the most provocative finding: autoantibody profiles — the pattern of self-reactive antibodies circulating in blood — show associations with Alzheimer's disease that exceed those of APOE4, the strongest known genetic risk factor for late-onset AD. This suggests a non-genetic, immune-mediated component to neurodegeneration that has been largely invisible because autoantibodies weren't measured in standard clinical panels.

The measurement platform: high-throughput protein arrays measuring IgG and IgA reactivity against >20,000 human proteins. Linear mixed models correct for population structure. The resulting "autoantibody reactome" is a new omic layer — one that captures the adaptive immune system's history of self-recognition errors.

### Clinical Implications

Multi-omic aging clocks enable:
- **Pre-symptomatic disease detection:** Accelerated biological aging in specific organ systems (liver, kidney, immune) years before clinical symptoms
- **Treatment monitoring:** Interventions that slow biological aging can be measured in months rather than waiting years for clinical endpoints
- **Risk stratification:** Population-level screening for individuals on accelerated aging trajectories who would benefit most from preventive intervention

---

## Data-Driven Clinical Decision Support

### Optimization Under Uncertainty

Dr. Gang Gabriel Garcia (University of Washington, Department of Industrial and Systems Engineering; PhD and MS from University of Michigan) works at the intersection of optimization, machine learning, and AI — motivated by high-impact problems in medical decision-making, health policy, and healthcare operations.

The core problem: clinical decisions are sequential, partially observable, and subject to uncertainty at every level. A cancer treatment decision depends on tumor stage (partially observed via biopsy), patient response (uncertain, heterogeneous), treatment toxicity (stochastic), and downstream outcomes (long-term, partially observed). Traditional clinical trials provide population-level evidence, but the optimal treatment for *this* patient depends on *their* specific state trajectory.

**Technical framework:** Partially Observable Markov Decision Processes (POMDPs) model sequential clinical decisions under partial observability. Reinforcement learning from observational health records (claims data, EHRs) can learn treatment policies that outperform clinical guidelines in retrospective evaluation. Causal inference methods (instrumental variables, difference-in-differences, synthetic control) bridge from observational correlation to actionable clinical recommendations.

**Healthcare operations optimization:** Beyond individual treatment decisions, the same framework applies to system-level problems — emergency department staffing, surgical scheduling, hospital bed allocation, pandemic resource distribution. These are high-stakes scheduling and resource allocation problems under uncertainty.

---

## Musculoskeletal Assessment: Engineering Meets Orthopedics

### Quantitative Imaging for Surgical Decision Support

Dr. Nazarian (Harvard Faculty, Vice Chair for Research at Beth Israel Deaconess Medical Center) merges biomedical engineering, medical imaging, and translational science. His work spans the full pipeline from foundational science through clinical translation to commercial deployment — funded by NIH, DoD, and SBIR.

The rotator cuff assessment seminar demonstrates how quantitative imaging transforms surgical decision-making. Traditional rotator cuff assessment relies on MRI reading by radiologists and physical examination by orthopedic surgeons — both qualitative. Computational approaches extract quantitative features: fatty infiltration percentage, muscle atrophy indices, tendon retraction measurements, bone quality metrics. These features feed prediction models for surgical outcome.

**Translational pipeline:** Basic research (biomechanics modeling) → clinical imaging (quantitative MRI/CT) → decision support (prediction of repair success) → commercial deployment (SBIR-funded software). This NIH-to-SBIR pipeline is the standard biomedical commercialization path.

---

## Technical Architecture

### Multi-Omic Integration Pipeline

```
Sample Collection → Molecular Profiling → Feature Extraction → Integration → Clinical Score
   (Blood draw)     (DNA methylation,     (Age-associated    (Regularized    (Biological age,
                     proteomics,           features per       regression,     risk scores,
                     metabolomics,         omic layer)        neural network  treatment
                     clinical labs)                           ensembles)      recommendations)
```

### Clinical Decision Support Architecture

```
Patient State → Observation Model → Belief State → Policy → Action → Outcome
  (True state,    (Lab results,      (Probability    (Learned from    (Treatment    (Clinical
   partially       imaging,           distribution    observational    decision)     endpoint)
   hidden)         symptoms)          over states)    data via RL)
```

### Key Metrics

| Metric | Value | Source |
|--------|-------|--------|
| OMIC Age 10-year mortality prediction | ~90% accuracy | Lasky-Su, Harvard |
| DNA methylation clock (Horvath 2013) | 353 CpG sites, ~3.6 year MAD | Original publication |
| Autoantibody associations exceeding APOE4 | Multiple confirmed for AD | Lasky-Su |
| Autoantibody array coverage | >20,000 human proteins | High-throughput protein arrays |
| Rotator cuff imaging assessment | Quantitative fatty infiltration, atrophy indices | Nazarian, Harvard/BIDMC |

---

## Key Quotes

> "Longevity is a key buzzword these days... really the premise is we have often thought of aging just in terms of the chronological numbers of our years but as we are looking more into the biology of it we are really understanding that aging is really a biological process and we can quantify it and understand it in several ways." — Jessica Lasky-Su

> "His research interests are in the design, analysis, and optimization of data-driven frameworks at the intersection of optimization, machine learning, and AI as motivated by high-impact problems in medical decision-making, health policy, and healthcare operations." — Garcia introduction

---

## Cross-References

| Topic | Related QBS Modules | Related Projects |
|-------|-------------------|-----------------|
| Multi-omic aging clocks | M3 (Precision Medicine & Aging) | ECO, BPS |
| Autoantibody reactome | M3, M5 (Synthetic Cells) | BPS, ECO |
| Clinical decision support | M7 (Synthesis) | AIH, LLM |
| Musculoskeletal imaging | M4 (Multifunctional Materials) | LED, EMG |
| Healthcare operations optimization | M6 (Physics of Failure — startup) | ACC, BCM |

## College Department Mappings

| Department | Connection |
|-----------|-----------|
| **Mind-Body** | Biological aging as whole-organism process; autoimmune components of neurodegeneration; longevity as mind-body health trajectory |
| **Mathematics** | Regularized regression for multi-omic integration; POMDPs and reinforcement learning for sequential decisions; Bayesian inference for belief-state updates |
| **Culinary Arts** | Metabolomics includes dietary biomarkers; nutritional intervention as precision medicine; the "recipe" metaphor for personalized treatment protocols |

## Study Topics

1. Horvath clock: how does CpG methylation change with age, and what drives the tissue-specific clocks?
2. OMIC Age integration: what are the relative contributions of each omic layer to mortality prediction?
3. POMDP formulation for cancer treatment: how does the belief-state update change with different biopsy strategies?
4. Autoantibody-neurodegeneration connection: mechanism or biomarker?
5. Quantitative imaging for surgical decision support: how does prediction accuracy compare to surgeon clinical judgment?

## TRL Assessment

| Technology | TRL | Rationale |
|-----------|-----|-----------|
| DNA methylation clocks | 6 | Validated in large cohorts, commercial tests available, not yet standard of care |
| Multi-omic integration (OMIC Age) | 4 | Demonstrated in research cohorts, replication ongoing |
| Autoantibody screening | 3 | Proof-of-concept associations, clinical utility unproven |
| Clinical decision support via RL | 4-5 | Retrospective validation in claims data, no prospective RCT |
| Quantitative musculoskeletal imaging | 5-6 | SBIR-funded, clinical pilot stage |
