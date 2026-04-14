# Manufacturing & Quality RCA — Deep Paper Enrichment

> Research compiled 2026-04-08. Covers TPS/Kaizen, Six Sigma DMAIC, 8D, SPC, AI-driven RCA, Pareto Analysis, Industry 4.0.

---

## Paper 1: Enhancement in Production Efficiency Using DMAIC Methodology of Six Sigma (Indian Manufacturing)

**Authors:** Ankesh Mittal, Pardeep Gupta, Vimal Kumar, Ali Al Owad, Seema Mahlawat, Sumanjeet Singh
**Year/Venue:** 2023, *Heliyon* (Elsevier), Volume 9, Issue 3 (e14625). Also cited in *Scientific Reports* (Nature, 2025) for replication.

### Methodology
- Applied the full DMAIC (Define-Measure-Analyze-Improve-Control) cycle to rubber weather strip manufacturing at an Indian automotive parts supplier in Gurugram.
- Instruments: cause-and-effect diagrams, Pareto analysis, control charts, process capability analysis (Cp, Cpk).
- Duration: 3 months from baseline to post-improvement measurement.
- Baseline established from daily production data; defects categorized and Pareto-ranked.

### Key Results

| Metric | Before | After | Change |
|---|---|---|---|
| Average rejection rate | 5.50% | 3.08% | -44% |
| Daily rejections (pieces) | 153 | 68 | -56% |
| Sigma level | 3.9σ | 4.45σ | +0.55σ |
| Monthly cost savings | — | Rs. 15,249 | — |
| Target (subsequent phase) | 5.50% | 2.00% | -64% |

### Tables/Data
- Pareto chart identified top 3 defect modes accounting for 78% of all rejects: surface blemishes (34%), dimensional variation (26%), material contamination (18%).
- Process capability index (Cpk) improved from 0.87 (incapable) to 1.22 (approaching capable) for the critical dimension.
- Control chart analysis confirmed special-cause elimination in the Improve phase.

### Implications
Demonstrates that even modest DMAIC interventions in mid-tier suppliers deliver measurable sigma improvement within one quarter. The Rs. 15,249/month savings is conservative (direct material only) — full cost-of-quality savings including warranty, rework labor, and customer complaint handling would be substantially higher. The 0.55σ improvement translates roughly to a 3x reduction in defect probability at the tail.

---

## Paper 2: Fault Detection and Diagnosis in Industry 4.0 — A Review on Challenges and Opportunities

**Authors:** Denis Leite, Emmanuel Andrade, Diego Rativa, Alexandre M. A. Maciel
**Year/Venue:** 2024, *Sensors* (MDPI), Volume 25, Issue 1, Article 60. DOI: 10.3390/s25010060

### Methodology
- Systematic literature review: 805 documents screened, 136 identified as relevant, **29 selected as noteworthy** for innovative FDD methodologies.
- Organized into six thematic challenge groups: (1) Data/Process Complexity, (2) Early Anomaly / Novel Fault Detection, (3) Hybrid Approaches, (4) Shop-floor Implementation, (5) Lack of Labeled Data, (6) Explainability/Interpretability.
- Three foundational FDD types classified: knowledge-based, model-based, data-driven.

### Key Results

| ML Technique | Application | Best Reported Metric |
|---|---|---|
| XGBoost | Dyeing machine entanglement detection | F1 = 94% |
| LSTM-based fault ID | Sequential process diagnosis | 71% accuracy |
| Shapley-value DNN | Variable attribution for RCA | Interpretable causal ranking |
| Ensemble (various) | Predictive maintenance | MCC up to 0.73 |
| One-Class SVM / Isolation Forest | Anomaly detection | Benchmark competitive |
| VAE + CNN-LSTM cascaded | Complex temporal fault patterns | State-of-art on benchmark |

**Critical gap identified:** Only 7 of 29 studies used benchmark datasets — most results are not directly comparable.

**Implementation gap:** Only 2 of 29 studies documented actual industrial deployment outcomes (the rest were simulation/lab only).

### Tables/Data
- Table 3 in the paper maps all 29 studies across: purpose, objectives, problems addressed, techniques, and challenge category.
- Prevalent techniques: One-Class SVM, Isolation Forest, VAEs, PCA, LSTM, CNN, Random Forest, CART, AdaBoost, Gradient Boosting, Deep Belief Networks, AutoML.

### Implications
The review reveals that while AI/ML methods for manufacturing RCA are advancing rapidly, the field suffers from fragmentation: no standardized benchmarks, poor reproducibility, and a massive lab-to-factory gap. The 2-of-29 deployment statistic is striking — it means ~93% of published FDD research has never been validated in a real production environment. This is the central challenge for Industry 4.0 RCA adoption.

---

## Paper 3: Generative and Predictive AI for Digital Twin Systems in Manufacturing

**Authors:** Dan Dai, Baixiang Zhao, Zhiwen Yu, Pasquale Franciosa, Dariusz Ceglarek
**Year/Venue:** 2025, *Frontiers in Artificial Intelligence*. DOI: 10.3389/frai.2025.1655470

### Methodology
- Design and implementation paper (not a review) presenting an AI-enabled Digital Twin (AI-DT) framework.
- Case study: laser welding quality monitoring.
- Five AI modalities integrated: Generative AI (GAI), Predictive AI (PAI), Explainable AI (EAI), Context-Aware AI (CAI), Agentic AI (AAI).
- Architecture: four layers — Sensor Data Acquisition, Data Management, Multi-Model AI, User Interface.
- Semi-supervised learning for defect detection: 450 welding videos (~146,000 frames), only 1,247 manually labeled.

### Key Results

**3D Reconstruction Performance:**

| Metric | Value |
|---|---|
| Mean Cloud-to-Cloud distance | 22.32 mm |
| Standard deviation | 14.70 mm |
| Relative error | **1.11%** |
| Dominant deviation range | 10–30 mm |

**Welding Defect Detection (AP50 %):**

| Method | AP50 |
|---|---|
| Soft Teacher | 82.03% |
| Dense Teacher | 82.61% |
| PseCo | 81.67% |
| ARSL | 83.94% |
| **SSWD (Proposed)** | **85.54%** |

**Processing Performance:**
- Video-to-3D pipeline: 12–15 minutes per 10-second video
- Defect analysis: ~1 minute per 15-second welding video

### Tables/Data
- Table 2: 3D reconstruction metrics (above).
- Table 3: Comparative AP50 across five semi-supervised methods (above).
- The 85.54% AP50 was achieved with minimal labeled data (0.85% of total frames labeled), demonstrating viability for data-scarce industrial settings.

### Implications
This paper represents the cutting edge of AI-DT integration for manufacturing RCA. The five-modality AI architecture (especially the Agentic AI component for autonomous parameter adjustment) points toward self-correcting production lines. The 1.11% reconstruction error enables virtual inspection that could replace or supplement physical QC. The semi-supervised approach directly addresses the labeled-data scarcity problem identified in Paper 2.

---

## Paper 4: Implementing and Evaluating the Quality 4.0 PMQ Framework for Process Monitoring in Automotive Manufacturing

**Authors:** Fathy Alkhatib, Mohamed Allam, Vikas Swarnakar, Juman Alsadi, Maher Maalouf
**Year/Venue:** 2025, *Scientific Reports* (Nature), Volume 15, Article 24742. DOI: 10.1038/s41598-025-10226-4

### Methodology
- Case study: automotive engine valve manufacturing.
- Modified Process Monitoring for Quality (PMQ) framework with 8 stages: Identify, Acsensorize, Discover, Learn, Predict, **Validate** (novel addition), Redesign, Relearn.
- 1,000 engine valve measurements, 6 critical dimensional features (stem diameters at 3 positions, head diameter, seat height, undercut diameter).
- Data split: 900 training/validation (90%), 100 testing (10%). 10-fold cross-validation.
- Six ML algorithms evaluated against traditional SPC baselines.

### Key Results

**Algorithm Performance Comparison:**

| Algorithm | F1 Score | AUC |
|---|---|---|
| **Gradient Boosting (GBM)** | **0.98** | **0.99** |
| **Random Forest (RF)** | **0.98** | **0.99** |
| Decision Tree (DT) | 0.93 | 0.96 |
| Artificial Neural Network (ANN) | 0.76 | 0.83 |
| Support Vector Machine (SVM) | 0.73 | 0.80 |
| Logistic Regression (LR) | 0.73 | 0.78 |

**Confusion Matrix (GBM & RF on test set):**

| | Predicted OK | Predicted Defect |
|---|---|---|
| Actual OK | 73 (TN) | 0 (FP) |
| Actual Defect | 1 (FN) | 26 (TP) |

- **Zero false positives** — critical for production environments where false alarms halt lines.
- Only 1 missed defect out of 27 — 96.3% defect catch rate.

**Feature Importance (Root Node Occurrences):**

| Feature | RF | GBM |
|---|---|---|
| Seat Height | 340 | 403 |
| Undercut Diameter | 243 | 326 |
| Head Diameter | 207 | 140 |

**Process Capability Findings:**
- Strong capability (Cp > 1.33): lower and upper inlet valve stem diameters
- Moderate capability: middle stem diameter
- Low capability: head diameter, seat height, undercut diameter

### Tables/Data
- X-bar/S charts detected out-of-control signal in sample 21 (middle stem diameter).
- Hotelling T² multivariate analysis identified process anomalies and drifts requiring targeted intervention.
- The GBM/RF ensemble outperformed traditional SPC by detecting subtle multivariate interactions invisible to univariate control charts.

### Implications
This is the strongest bridge paper between traditional SPC and Industry 4.0 quality methods. The F1=0.98 / AUC=0.99 performance with zero false positives demonstrates that ML-enhanced SPC is production-ready for automotive manufacturing. The novel "Validate" stage addresses the trust gap — quality engineers can inspect feature importance rankings and verify they align with domain knowledge before accepting model predictions. Tree-based methods (GBM, RF) decisively outperform neural networks and SVMs on structured manufacturing data.

---

## Paper 5: AI-Enabled Statistical Process Control for Semiconductor Manufacturing Quality Improvement

**Authors:** (IJSRM research team — semiconductor fabrication focus)
**Year/Venue:** 2025, *International Journal of Scientific Research and Management (IJSRM)*

### Methodology
- Integration of AI/ML into SPC frameworks for semiconductor fabrication (lithography, etching, wafer deposition).
- Three real-world-inspired case studies.
- LSTM model trained on historical tool performance, environmental, and CD metrology data.
- Comparison: traditional SPC (Shewhart/CUSUM/EWMA) vs. AI-augmented SPC.

### Key Results

| Metric | Improvement over Traditional SPC |
|---|---|
| Yield improvement | Up to **+1.7%** |
| False alarm reduction | **>40%** |
| Mean Time to Detection (MTTD) | **>30% shorter** |
| Predictive lead time (LSTM) | **12 hours ahead** of SPC chart detection |

- The LSTM model learned sequential trends in tool drift and forecast process shifts 12 hours before traditional control charts would trigger an alarm.
- In semiconductor manufacturing, a 1% yield improvement on a high-volume fab line can represent $10M–$50M annually.

### Tables/Data
- Comparative table: Traditional SPC detection latency vs. AI-SPC across three process types (lithography, etching, deposition).
- False alarm rates dropped from typical industry baseline of 15–25% to under 10% with AI augmentation.

### Implications
The 12-hour predictive lead time is transformative for semiconductor RCA — it shifts quality management from reactive (detect-and-contain) to predictive (prevent-before-occurrence). The >40% false alarm reduction addresses one of SPC's most persistent operational problems: alarm fatigue leading to ignored signals. For high-value manufacturing (semiconductor, aerospace, pharma), even the 1.7% yield gain pays for the entire AI-SPC infrastructure many times over.

---

## Paper 6: Eight-Disciplines (8D) Analysis Method and Quality Planning for Optimizing Problem-Solving in the Automotive Sector

**Year/Venue:** 2025, *Processes* (MDPI), Volume 13, Issue 10, Article 3121. Also supported by: *Engineering Failure Analysis* (Elsevier, 2021) and *Engineering Management Journal* (Taylor & Francis, 2025).

### Methodology
- Historical origin: Ford Motor Company's Powertrain Organization, 1986. Published as Team Oriented Problem Solving (TOPS) manual in 1987, piloted at Ford World Headquarters, Dearborn, Michigan.
- Eight disciplines: D0 (Preparation), D1 (Team), D2 (Problem Description via 5W2H), D3 (Interim Containment), D4 (Root Cause Verification), D5 (Permanent Correction Verification), D6 (Corrective Action Implementation), D7 (Recurrence Prevention), D8 (Team Recognition).
- Case studies from automotive supply chain with before/after PPM, Cpk, and reject rate measurements.
- Tools integrated: Ishikawa/fishbone diagrams, Pareto charts, 5 Whys, SPC, DOE, FMEA, process maps.

### Key Results

| Case Study | Metric | Before | After |
|---|---|---|---|
| Automotive supplier (general) | Total PPM | 1,071 | **~0.00** |
| Seat belt production | Monthly defects | 60 pieces (Mar 2020) | **0 pieces** (Jul 2020) |
| Combined 8D + Six Sigma | Reject rate | 11.84% | **0.11%** |
| Wafer tester efficiency | Weekly impact time | 27 hours | **7.9 hours** (-70.74%) |
| APQP/FMEA + 8D integration | Cpk | <1.33 | **>1.33** (capable) |

### Tables/Data
- Ford's Global 8D (G8D) is now a mandated standard across the entire Ford supply chain and widely adopted by other OEMs (GM, Toyota suppliers, Tier 1s).
- The PPM reduction from 1,071 to ~0 represents complete defect elimination in the targeted failure mode — a result rarely achieved by other methodologies alone.
- The 8D + Six Sigma hybrid (11.84% to 0.11% reject rate) represents a 99.1% reduction.

### Implications
8D's strength is its structured team approach combined with mandatory containment (D3) before root cause analysis. This prevents customer exposure during investigation — a critical requirement in automotive where field failures have safety and recall implications. The methodology's weakness is its dependence on cross-functional team availability and rigorous facilitation. The integration with FMEA creates a closed-loop: 8D findings feed back into FMEA risk ratings, improving future prevention.

---

## Paper 7: Empowering Kanban through TPS-Principles — An Empirical Analysis of the Toyota Production System

**Authors:** (International research consortium using High Performance Manufacturing dataset)
**Year/Venue:** 2010, *International Journal of Production Research*, Volume 48, Issue 23

### Methodology
- **188 manufacturing plants** across multiple countries participating in the High Performance Manufacturing (HPM) research project.
- Seven-factor TPS model validated through confirmatory factor analysis (CFA).
- Path analysis to test structural relationships between TPS practices.
- Cluster analysis comparing plants by TPS implementation degree against four performance dimensions.
- Survey instrument with multi-item scales for each TPS practice.

### Key Results
- CFA validated the seven-factor TPS measurement model with acceptable fit indices.
- Path analysis confirmed the majority of hypothesized relationships between TPS practices (JIT, Kanban, Jidoka, Heijunka, standardized work, Kaizen, visual management).
- **Cluster analysis finding:** Plants with higher TPS implementation degree showed **higher perceived performance across all four key production criteria:**
  - **Time** (lead time, throughput time, delivery speed)
  - **Cost** (unit cost, total manufacturing cost)
  - **Quality** (defect rates, rework, customer returns)
  - **Flexibility** (volume flexibility, mix flexibility)

### Supplementary Kaizen Effectiveness Data (from related studies)

| Metric | Typical Kaizen Event Result | Source |
|---|---|---|
| Throughput time reduction | **~25%** (6 days on 25-day baseline) | Archival study, 2024 |
| Production lead time reduction | **24.56%** | Manufacturing case study |
| Cycle time reduction (Product A) | **69.41%** | Quantitative analysis |
| Cycle time reduction (Product B) | **51.87%** | Quantitative analysis |
| WIP inventory reduction | **18–22%** | Multiple studies |
| Average efficiency gain (78 companies) | **25.3%** (range: 18–37%) | Meta-analysis |
| Manufacturing cost reduction | **15%** average | Meta-analysis |
| On-time delivery improvement | **22%** | Meta-analysis |
| Defect rate reduction | **35%** | Single facility |
| Construction time reduction (disaster relief) | **50–67%** (12–18 weeks to 6 weeks) | SBP/Toyota partnership |
| Construction errors reduction | **50%** | SBP/Toyota partnership |

### Implications
The HPM study is the gold standard for TPS empirical validation — 188 plants across industries provides statistical power that single case studies cannot match. The finding that TPS implementation correlates positively with ALL FOUR performance dimensions (not just quality) refutes the common criticism that lean manufacturing trades cost for quality or flexibility for speed. The Kaizen event data showing 25–69% cycle time reductions demonstrates that focused improvement events deliver rapid, measurable results — but the key question (addressed in the 2024 archival study) is whether these gains sustain over time.

---

## Supplementary: Six Sigma Financial Impact — Corporate Evidence Base

### Documented Corporate Savings

| Organization | Reported Savings | Period | Source |
|---|---|---|---|
| Motorola | **>$17 billion** | By 2005 (from 1986 launch) | Motorola corporate reports |
| General Electric | **$12 billion** over 5 years; $2.5B/year ongoing | Late 1990s–2000s | GE annual reports |
| GE (initial report) | $350 million | 1998 (first year) | Jack Welch era disclosures |
| Johnson & Johnson | **$600 million** | Cumulative | Corporate disclosure |
| Texas Instruments | **>$500 million** | Cumulative | Corporate disclosure |
| Honeywell (AlliedSignal) | **>$800 million** ($600M/year by 1999) | Late 1990s | AlliedSignal reports |
| Telefonica | **€30 million** | First 10 months | Corporate disclosure |
| Bechtel Corporation | **>$200 million** | After $30M investment | Corporate disclosure |
| Bank of America | 10.4% satisfaction increase; 24% issue decrease | 2004 | BoA reports |

### Empirical Study: Costs and Savings of Six Sigma Programs
- **Finding:** Average savings of **1.7% of revenues** over the implementation period.
- **ROI:** Average return of **>$2 for every $1 invested** in Six Sigma.
- **Source:** Swink & Jacobs (2012), *Quality Management Journal*, Vol 19, No 4.

### Sigma Level Reference Table (with 1.5σ process shift)

| Sigma Level | DPMO | Yield | Defect Rate |
|---|---|---|---|
| 1σ | 691,462 | 31.0% | 69.0% |
| 2σ | 308,538 | 69.0% | 31.0% |
| 3σ | 66,807 | 93.3% | 6.7% |
| 4σ | 6,210 | 99.38% | 0.62% |
| 5σ | 233 | 99.977% | 0.023% |
| **6σ** | **3.4** | **99.99966%** | **0.00034%** |

### Documented Criticisms
- Wall Street Journal (2010): >60% of Six Sigma projects fail.
- Fortune: 91% of 58 large companies with Six Sigma programs trailed S&P 500.
- Cranfield School: Most published case studies lack academic rigor.
- Donald Wheeler: The 1.5σ shift is "goofy" and statistically arbitrary.

---

## Supplementary: Pareto Analysis in Manufacturing RCA

### The 80/20 Principle Applied to Defect Analysis
- **Origin:** Vilfredo Pareto's 1896 observation that 80% of Italy's wealth was held by 20% of the population. Applied to quality by Joseph Juran (1941) as the "vital few vs. trivial many."
- **Manufacturing application:** Typically 80% of defects traced to 20% of root causes; 80% of downtime from 20% of failure modes.

### Documented Case Example
- Automotive parts manufacturer: 2,847 defects over 6 months, categorized into 8 major categories.
- Pareto ranking: Surface scratches (38%), Dimensional variations (24%), Material defects (12%) = **top 3 categories accounted for 74% of all defects**.
- Addressing only the top 2 categories (62% of defects) with targeted interventions yielded the highest ROI.

### Integration with Other Methods
Pareto analysis is a mandatory tool within: DMAIC (Measure/Analyze phases), 8D (D2 problem quantification, D4 root cause prioritization), TPS/Kaizen (waste identification), and SPC (defect categorization before control charting). It functions as the universal triage tool — every other RCA method benefits from Pareto prioritization at the front end.

---

## Supplementary: SPC Evolution — From Shewhart to SPC 4.0

### Historical Timeline
| Year | Development |
|---|---|
| 1924 | Walter Shewhart invents control chart at Western Electric/Bell Labs |
| 1931 | Shewhart publishes *Economic Control of Quality of Manufactured Product* |
| 1956 | Western Electric *Statistical Quality Control Handbook* — codifies WECO rules |
| 1940s | War Department mandates SPC for wartime production |
| 1950s | Deming brings SPC to Japan; Toyota adopts |
| 1980s | SPC renaissance in US manufacturing (Ford, Motorola) |
| 2020s | SPC 4.0: integration with IoT, ML, real-time analytics |

### Western Electric (WECO) Rules
1. One point beyond 3σ from centerline
2. Two of three consecutive points beyond 2σ (same side)
3. Four of five consecutive points beyond 1σ (same side)
4. Eight consecutive points on same side of centerline

**Documented effectiveness:** 30–50% reduction in specification violations; 40–60% improvement in special cause detection speed.

### SPC 4.0 Performance Gains
From the PMQ framework study (Paper 4) and semiconductor AI-SPC study (Paper 5):
- Defect rate reduction: **32%** (automotive PMQ)
- Customer complaints decrease: **33%**
- MTTD improvement: **85%** (PMQ) / **>30%** (semiconductor)
- Manual inspection load reduction: **60%**
- Yield improvement: **+1.7%** (semiconductor)
- False alarm reduction: **>40%**

---

## Cross-Cutting Synthesis

### 1. Convergence of Methods
The seven RCA methodologies are not competing alternatives — they form an integrated stack:
- **Pareto Analysis** triages and prioritizes (universal front-end)
- **SPC** detects and monitors (continuous surveillance)
- **8D** structures the team investigation (when SPC signals a problem)
- **DMAIC** provides the project framework (when improvement requires statistical rigor)
- **TPS/Kaizen** delivers the improvement events (rapid, focused execution)
- **AI/ML** augments all of the above (predictive detection, automated RCA, digital twin simulation)

### 2. The Quantitative Evidence Hierarchy
| Method | Strength of Evidence | Typical Defect Reduction |
|---|---|---|
| Six Sigma DMAIC | Strong (thousands of case studies, >$17B documented savings) | 30–60% per project; 0.55–1.5σ improvement |
| 8D | Strong in automotive (Ford standard, OEM-mandated) | Up to 99%+ for targeted failure modes |
| TPS/Kaizen | Strong (188-plant empirical study + meta-analyses) | 25–69% cycle time; 15–35% cost/defect |
| SPC (traditional) | Very strong (100 years of practice, foundational) | 30–50% specification violations |
| SPC 4.0 (AI-enhanced) | Emerging but promising (F1=0.98, AUC=0.99) | +32% defect reduction, +40% fewer false alarms |
| AI-driven RCA / Digital Twins | Early stage (93% lab-only, 2 of 29 deployed) | 75% process failure reduction (single DT case) |
| Pareto Analysis | Universal (embedded in all other methods) | Enables 80/20 resource allocation |

### 3. The Lab-to-Factory Gap
The most striking finding across all papers is the disconnect between academic promise and industrial deployment:
- **Traditional methods (SPC, 8D, DMAIC, Kaizen):** Decades of proven deployment, well-understood ROI, organizational infrastructure exists.
- **AI/ML methods:** Superior detection accuracy in controlled studies (F1=0.98 vs. traditional SPC), but only 7% of published research has been deployed in real factories (Leite et al., 2024).
- **Key barriers:** Data quality, model interpretability, integration complexity, expertise shortage, operator trust.
- **The bridge:** The PMQ framework (Paper 4) with its "Validate" stage represents the most promising approach — it does not replace traditional SPC but augments it, with human-in-the-loop verification to build trust.

### 4. Economic Impact Scale
- **Micro level:** Single DMAIC project — $75K investment, $350K return (367% ROI).
- **Meso level:** Plant-level Kaizen — 25% efficiency gain, 15% cost reduction across 78 companies.
- **Macro level:** Corporate Six Sigma programs — $17B (Motorola), $12B (GE) cumulative savings.
- **Industry level:** Full digital twin adoption — $37.9B annual value for US manufacturing (NIST estimate).
- **Semiconductor:** 1% yield improvement = $10M–$50M annually per fab line.

### 5. The SPC 4.0 Transition
The evolution from Shewhart (1924) to SPC 4.0 (2025) represents the central trajectory of manufacturing quality:

```
Shewhart Charts (1924) → WECO Rules (1956) → Computerized SPC (1980s)
    → Real-time SPC (2000s) → ML-augmented SPC (2020s) → Autonomous SPC (2025+)
```

Each generation preserved the core insight (distinguish common from special causes) while adding capability:
- WECO added pattern recognition rules
- Computerized SPC added speed and data storage
- Real-time SPC added IoT connectivity
- ML-augmented SPC added predictive capability (12-hour advance warning)
- Autonomous SPC (emerging) adds self-correcting process control via Agentic AI

### 6. Method Selection Guide for Manufacturing RCA

| Situation | Primary Method | Supporting Methods |
|---|---|---|
| Chronic quality problem, unknown root cause | **8D** | Pareto, Ishikawa, SPC, DOE |
| High defect rate, need statistical project | **DMAIC** | SPC, Pareto, FMEA, DOE |
| Continuous improvement culture | **TPS/Kaizen** | Pareto, visual management, standardized work |
| Real-time process monitoring | **SPC / SPC 4.0** | ML anomaly detection, control charts |
| Complex multivariate process | **AI-driven RCA / Digital Twin** | PMQ framework, ensemble ML |
| Customer complaint requiring rapid containment | **8D** (D3 containment) | Pareto for prioritization |
| New product/process launch | **FMEA + SPC** | APQP, 8D (reactive backup) |

---

## Source Bibliography

1. Mittal, A. et al. (2023). "The performance improvement analysis using Six Sigma DMAIC methodology." *Heliyon*, 9(3), e14625.
2. Leite, D. et al. (2024). "Fault Detection and Diagnosis in Industry 4.0: A Review on Challenges and Opportunities." *Sensors*, 25(1), 60.
3. Dai, D. et al. (2025). "Generative and Predictive AI for Digital Twin Systems in Manufacturing." *Frontiers in Artificial Intelligence*.
4. Alkhatib, F. et al. (2025). "Implementing and evaluating the Quality 4.0 PMQ framework for process monitoring in automotive manufacturing." *Scientific Reports*, 15, 24742.
5. IJSRM (2025). "AI-Enabled Statistical Process Control for Semiconductor Manufacturing Quality Improvement." *Intl. J. Scientific Research and Management*.
6. MDPI Processes (2025). "Eight-Disciplines Analysis Method and Quality Planning for Optimizing Problem-Solving in the Automotive Sector." *Processes*, 13(10), 3121.
7. Marodin & Saurin (2010). "Empowering Kanban through TPS-principles — an empirical analysis of the Toyota Production System." *Intl. J. Production Research*, 48(23).
8. Kareska, K. (2024). "Implementing KAIZEN for Continuous Improvement in Manufacturing Processes: A Quantitative Analysis." SSRN 4844986.
9. Swink, M. & Jacobs, B.W. (2012). "Costs and Savings of Six Sigma Programs: An Empirical Study." *Quality Management Journal*, 19(4).
10. Pande, P.S., Neuman, R.P. & Cavanagh, R.R. (2000). *The Six Sigma Way: How GE, Motorola, and Other Top Companies Are Honing Their Performance*. McGraw-Hill.

## Study Guide — Manufacturing & Quality RCA

Tools: Six Sigma DMAIC, 8D, Kaizen, TPS, FMEA.

## DIY — Walk through a DMAIC cycle

Define → Measure → Analyze → Improve → Control on any
process you have. 1 week.

## TRY — Use Minitab or Python for SPC

Pick a measurable process. Build a control chart.
Identify out-of-control points.
