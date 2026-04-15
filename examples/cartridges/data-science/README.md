# Data Science

A full cartridge for data science — the discipline of turning raw
data into decisions. Covers the full pipeline from problem framing
to delivered insight, tooling-agnostic across Python, R, SQL, and
Julia.

- Slug: `data-science`
- Trust: `user`
- Template: `department`

## Shape

- **12 skills** — problem framing and success metrics, data
  acquisition and ingestion, cleaning and validation, exploratory
  data analysis, feature engineering, statistical modeling, machine
  learning modeling, model evaluation and validation,
  experimentation and A/B testing, visualization and storytelling,
  pipeline and reproducibility, ethics / privacy / governance
- **5 agents** — `ds-lead` (Opus capcom), `data-wrangler`,
  `statistician`, `ml-modeler`, `insights-communicator`
- **4 teams** — discovery, modeling, experiment, delivery
- **6 grove record types** — `Dataset`, `FeatureSet`, `ModelCard`,
  `ExperimentResult`, `Visualization`, `InsightReport`

## Load + validate

```
skill-creator cartridge load ./cartridge.yaml
skill-creator cartridge validate ./cartridge.yaml
skill-creator cartridge eval ./cartridge.yaml
skill-creator cartridge dedup ./cartridge.yaml
skill-creator cartridge metrics ./cartridge.yaml
```

## Design notes

- **Framing is a gate.** `problem-framing-and-success-metrics` runs
  before any data is loaded — projects that can't define success
  get stopped here, not after three weeks of modeling.
- **Statistics and ML are separate skills with different agents.**
  Classical statistics (interpretability, uncertainty, causal) and
  ML (predictive accuracy, automation) are distinct disciplines
  with distinct tradeoffs — the cartridge keeps them separate so
  the right one is picked for the question.
- **Reproducibility is not optional.** `pipeline-and-reproducibility`
  exists as its own skill because a result that can't be rerun is
  not a result.
- **Ethics is a first-class skill, not an afterthought.**
  `ethics-privacy-and-governance` ships with the cartridge, not in
  a separate compliance bolt-on.
