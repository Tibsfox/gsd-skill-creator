# examples/chipsets/

Chipsets are not subcategorized. Each chipset lives in its own directory:

```
chipsets/
└── <name>/
    ├── chipset.yaml         — the chipset definition
    └── README.md            — overview, modules, status, usage
```

Deprecated chipsets live in `chipsets/deprecated/` and are preserved for reference.

## Stage 1 note

Existing chipsets are still in their original flat `.yaml` form at the top of this directory. Stage 2 wraps each into its own directory (`<name>/chipset.yaml + README.md`) using `git mv` to preserve history.

See [`../CHANGELOG.md`](../CHANGELOG.md) for the history of how chipsets arrived here.
