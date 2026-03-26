# Patent & IP Landscape

> **Domain:** AI-Powered Manufacturing Inspection
> **Module:** 3 -- Synsor Corp
> **Through-line:** *A German patent on compressed feature retention for temporal trend analysis. The core novelty is not seeing defects -- it is remembering what the process looked like yesterday and detecting the drift toward tomorrow's failures.*

---

## Table of Contents

1. [The Granted Patent](#1-the-granted-patent)
2. [Three Key Claims](#2-three-key-claims)
3. [The Core Novelty](#3-the-core-novelty)
4. [Prior Art Analysis](#4-prior-art-analysis)
5. [Synsor vs. Standard AOI](#5-synsor-vs-standard-aoi)
6. [Patent Defensibility](#6-patent-defensibility)
7. [Trademark Portfolio](#7-trademark-portfolio)
8. [International Filing Status](#8-international-filing-status)
9. [Freedom to Operate](#9-freedom-to-operate)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Granted Patent

Synsor.ai was granted a German patent titled:

> **"Verfahren zur Optimierung eines Produktionsprozesses auf Basis visueller Informationen und Vorrichtung zur Durchfuhrung des Verfahrens"**
>
> (Method for Optimizing a Production Process Based on Visual Information and Device for Carrying Out the Method)

The grant was announced publicly via the company's LinkedIn page in mid-2025. Nico Engelmann, co-founder and Geschaftsfuhrer, is listed as the named inventor. The patent was filed with the Deutsches Patent- und Markenamt (DPMA) -- the German Patent and Trademark Office [1][2].

The patent covers both the method (the software/algorithm approach) and the device (the hardware/software system implementing the method). This dual-scope structure is standard in German patent practice for systems patents and provides broader protection than a method-only or device-only claim [1].

---

## 2. Three Key Claims

Based on public descriptions, the patent addresses three key technical claims:

### Claim 1: Real-Time Image Capture

Real-time image capture from quality cameras in production environments, using both proprietary and third-party camera systems. This claim covers the I/O layer -- the systematic capture of visual data from production lines at speeds compatible with real-time inspection [1][2].

### Claim 2: Creeping Deterioration Detection

AI-driven monitoring for gradual quality degradation -- the system watches for "creeping deterioration" (schleichende Verschlechterung) rather than binary pass/fail inspection. This claim covers the analytical approach: instead of classifying each frame as good or bad, the system detects gradual trends toward failure. The German term "schleichende Verschlechterung" precisely captures the phenomenon -- deterioration that creeps, not jumps [1][2].

### Claim 3: Efficient Temporal Retention

A method for "keeping large volumes of images in memory without quality loss" using compressed feature representations, enabling over-time trend analysis that conventional systems perform only in batch (typically next-day or later). This is the core technical innovation: a learned compression that preserves anomaly-relevant information while discarding pixel-level redundancy, making temporal analysis computationally and storage-feasible in real time [1][2].

---

## 3. The Core Novelty

The third claim -- efficient temporal retention via compressed feature representations -- is the patent's core novelty and the foundation of Synsor's competitive differentiation.

The problem it solves is fundamental: industrial cameras at production line speeds generate enormous volumes of image data. A single camera at 30fps with 5MP resolution produces approximately 450MB/s of raw data. Retaining this for temporal analysis would require petabytes of storage per production line per month. Conventional AOI systems avoid this by analyzing each frame independently and discarding it after classification [1][2].

Synsor's approach extracts compact feature representations from each image -- learned compressed encodings that preserve the information relevant to anomaly detection while discarding pixel-level redundancy. These compressed features can be retained at a fraction of the raw image storage cost, enabling temporal analysis over hours, days, or weeks of production data [1][2].

The architectural significance extends beyond storage efficiency. By operating on compressed features rather than raw images, the trend analysis engine can compare production states across time at computational costs orders of magnitude lower than raw image comparison. This is what enables real-time trend detection -- the system is comparing compact feature vectors, not re-analyzing full images [2].

---

## 4. Prior Art Analysis

The automated optical inspection patent landscape is dense. A representative prior art reference is **US10964004B2** (Utechzone Co., Ltd., filed December 2018), which covers an automated optical inspection method using deep learning with paired defect-free/defect-containing training images [3].

### Utechzone Patent (US10964004B2)

The Utechzone patent focuses on the **training methodology**: how to train a deep learning model for defect detection using paired image combinations (good part paired with bad part). The claims center on the supervised learning approach -- using paired images to teach the model what defects look like [3].

### Differentiation

Synsor's patent appears to focus on a fundamentally different aspect of the inspection pipeline. Where Utechzone addresses **how to train the model** (paired image methodology), Synsor addresses **what to do with the model's output over time** (temporal trend analysis via compressed features). These are complementary rather than conflicting innovations [2][3].

Additional prior art context from academic literature:

- **Lo & Lin (2024)** in the Springer Journal of Intelligent Manufacturing examine "automated optical inspection based on synthetic mechanisms," exploring synthetic data generation for AOI model training -- again focused on the training side rather than temporal analysis [4]
- **Syntec Optics (2023)** provides an industry overview of deep learning AOI approaches, documenting the frame-by-frame analysis paradigm that Synsor's temporal approach extends [5]
- **Hailo (2025)** describes edge AI hardware for AOI applications, focused on inference acceleration hardware rather than temporal analysis methods [6]

---

## 5. Synsor vs. Standard AOI

The core patent differentiation can be mapped across five dimensions:

| Dimension | Standard AOI | Synsor Approach |
|-----------|-------------|-----------------|
| **Analysis unit** | Single frame | Temporal sequence |
| **Defect model** | Binary (pass/fail) | Gradient (trend toward failure) |
| **Data retention** | Raw images or none | Compressed features |
| **Timing** | Post-production batch | Real-time inline |
| **Value proposition** | Defect detection | Defect prediction |

The shift from "defect detection" to "defect prediction" is the fundamental value proposition change. Standard AOI tells you that a bad part was made. Synsor tells you that your process is heading toward making bad parts -- before the first bad part appears [2][3].

---

## 6. Patent Defensibility

Assessing patent defensibility from public descriptions alone has inherent limitations. However, several observations can be made:

**Strengths:**

- The temporal analysis approach is genuinely novel relative to the frame-by-frame AOI prior art
- The granted status (not just filed) indicates the DPMA examiner found the claims met patentability requirements
- The combination of method + device claims provides broader protection than either alone
- The "compressed feature retention" technique appears to be a specific, implementable innovation rather than an abstract concept [1][2]

**Uncertainties:**

- The full claim scope is not available from public descriptions alone
- Dependent claims (which define the boundaries of protection) are unknown
- The examination prosecution history (which reveals what the examiner required the applicant to narrow) is not publicly available without DPMA file access
- No information on international filing (PCT) status is publicly available [1]

---

## 7. Trademark Portfolio

Synsor.ai holds at least one registered trademark in the "Scientific and technological services" class, per IPqwery records. This trademark registration protects the brand identity and service description, complementing the patent protection on the underlying technology [7].

---

## 8. International Filing Status

No public information is available on whether Synsor has filed international patent applications (PCT) or national-phase entries outside Germany. For a Munich-based startup targeting European manufacturing, the most strategically important filings would be:

- **European Patent Office (EPO):** Covering EU manufacturing markets
- **USPTO:** Covering the US market
- **China (CNIPA):** Covering the world's largest manufacturing base

The absence of disclosed international filings may indicate limited IP resources at the seed stage, strategic focus on the German/European market, or simply that filings exist but have not yet been published [1].

---

## 9. Freedom to Operate

Synsor's freedom to operate in the temporal analysis space appears relatively clear based on available prior art. The key AOI patents (including Utechzone) focus on different aspects of the inspection pipeline (training methodology, defect classification) rather than temporal trend analysis. However, a comprehensive freedom-to-operate analysis would require:

- Full patent landscape search across DPMA, EPO, USPTO, and CNIPA
- Review of patents from incumbent vendors (Cognex, Keyence, Omron)
- Analysis of pending applications that may not yet be published

This analysis is outside the scope of public-source research [3][5].

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Bio-physics sensing -- signal compression, temporal analysis, feature extraction |
| [MPC](../MPC/index.html) | Math co-processor -- mathematical foundations of feature compression, information theory |
| [GSD2](../GSD2/index.html) | GSD architecture -- silicon manifest pattern, adapter configuration |
| [LED](../LED/index.html) | LED & controllers -- optical sensing, illumination engineering |
| [BLA](../BLA/index.html) | Business law -- patent prosecution, IP strategy, German patent law |

---

## 11. Sources

1. [LinkedIn: synsor.ai patent announcement](https://www.linkedin.com/company/synsor-ai/) -- Patent grant disclosure
2. [Startbase: Synsor.ai](https://www.startbase.com/profile/synsor-ai) -- Patent description
3. [Google Patents: US10964004B2](https://patents.google.com/patent/US10964004B2) -- Utechzone AOI patent
4. [Springer: Lo & Lin (2024)](https://link.springer.com/) -- AOI synthetic mechanisms
5. [Syntec Optics: Deep Learning AOI](https://syntecoptics.com/) -- Industry AOI overview (2023)
6. [Hailo: AOI with AI](https://hailo.ai/) -- Edge AI for manufacturing (2025)
7. [IPqwery: Synsor trademark](https://ipqwery.com/) -- Trademark records
