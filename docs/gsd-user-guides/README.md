# GSD User Guides Suite

Community documentation for [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done) v1.35.0. Released under **CC BY-SA 4.0** by Tibsfox. GSD itself is MIT-licensed.

## What's here

Five standalone XeLaTeX documents:

| Document | Pages | Audience |
|---|---|---|
| `tex/gsd-beginners-guide.tex` | 26 | New users — install, first project, core habits |
| `tex/gsd-intermediate-guide.tex` | 57 | Daily users — full workflow, configuration, recovery |
| `tex/gsd-advanced-guide.tex` | 38 | Senior engineers, leads — architecture, security, scale |
| `tex/gsd-command-reference.tex` | 19 | Everyone — pin-to-the-wall reference for all 75 commands |
| `tex/gsd-going-further-guide.tex` | 68 | Customizers — skills, MCP integration, multi-repo |

Plus shared LaTeX infrastructure in `shared/`:

- `gsd-guides-preamble.tex` — fonts, geometry, packages, headers, listings, semantic macros
- `gsd-color-scheme.tex` — color palette and 5 callout box environments
- `gsd-command-data.tex` — command/flag/file rendering macros
- `test-compile.tex` — Wave 0 test document exercising every shared macro

## Building

Compile with **XeLaTeX, 3 passes** (NOT pdflatex, NOT lualatex — the documents use `fontspec` and DejaVu fonts):

```bash
cd docs/gsd-user-guides/tex
xelatex -interaction=nonstopmode gsd-beginners-guide.tex
xelatex -interaction=nonstopmode gsd-beginners-guide.tex
xelatex -interaction=nonstopmode gsd-beginners-guide.tex
```

Each `.tex` file declares `\input@path{{../shared/}}` so the shared infrastructure resolves automatically when building from `tex/`.

Required system packages (Debian/Ubuntu): `texlive-xetex`, `texlive-fonts-extra` (for DejaVu Serif/Sans/Mono), `texlive-latex-extra` (for `tcolorbox`, `tabularx`, `booktabs`, `titlesec`).

## Output

Compiled PDFs are published to `www/tibsfox/com/Research/GSD/user-guides/pdf/` (gitignored — synced to tibsfox.com via FTP). To rebuild and publish:

```bash
cd docs/gsd-user-guides/tex
xelatex gsd-beginners-guide.tex && xelatex gsd-beginners-guide.tex && xelatex gsd-beginners-guide.tex
mv *.pdf ../../../www/tibsfox/com/Research/GSD/user-guides/pdf/
rm -f *.aux *.log *.toc *.out *.lot *.lof *.fdb_latexmk *.fls
```

## Design constraints

- **Standalone:** each guide reads coherently without the others. Cross-references are optional pointers, never required reading.
- **Safety-first:** the Beginner's Guide never recommends `--dangerously-skip-permissions`. Granular permissions (`permissions.allow`) is the recommended approach.
- **Defensive-only security:** the Advanced Guide describes how prompt-injection defenses work but does not document attack payloads or evasion techniques.
- **Single source of truth:** all command names, flags, and behaviors are verified against the upstream `gsd-build/get-shit-done` repository at v1.35.0.

## License

This documentation is licensed under [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/). You are free to share, adapt, and redistribute under the same license. Attribution: **Tibsfox**.
