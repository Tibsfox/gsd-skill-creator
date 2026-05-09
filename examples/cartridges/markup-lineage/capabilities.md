# Per-Format Capability Matrix

**Cartridge:** markup-lineage · **Mission:** SCRIBE (v1.49.621) · **Track:** T1

This matrix is the per-format companion to `lineage.json`. Downstream tracks (T2 SVG-substrate, T3 code-svg-hdl-bridge, T4 dashboard-lod-rendering, T5 retrieval-provenance) and the SCRIBE convergence synthesis can cite-by-row.

---

## Capability axes

| Axis | What it measures |
|---|---|
| **schema** | Does the format support a formal schema? (DTD, XSD, prose content model, none) |
| **math** | Native mathematical typesetting? |
| **vector** | Native vector graphics? |
| **xref** | Cross-references / citations supported in the spec? |
| **exec** | Executable code blocks (literate programming)? |
| **lossless** | Round-trips losslessly through Pandoc AST? |
| **streaming** | Can be parsed in a single forward pass? |
| **author-density** | Keystrokes per semantic unit (lower = denser; relative scale H/M/L) |

## Matrix

| Format | Branch | Year | schema | math | vector | xref | exec | lossless | streaming | author-density |
|---|---|---|---|---|---|---|---|---|---|---|
| **GML** | generic | 1969 | implicit | no | no | yes | no | no (no AST round-trip) | no (DCF batch) | M |
| **SCRIPT** | procedural | 1968 | none | partial | no | macros | no | no | yes | H (procedural) |
| **SCRIBE** | generic | 1980 | doc-database | no | no | yes | no | no | yes | L (lightest 1980 surface) |
| **SGML** | generic | 1986 | DTD (mandatory) | via DTD | via DTD | yes | no | yes (via parser) | no (per-doc Decl) | H (verbose) |
| **TeX** | procedural | 1977 | none | best-in-class | via packages | yes | macros | partial (Pandoc lossy on macros) | yes | M (math) / H (prose) |
| **LaTeX** | procedural | 1985 | docclass-as-schema | best-in-class | via TikZ | yes | listings/Sweave | partial (Pandoc lossy on macros) | yes | M (math) / M (prose) |
| **HTML 4.01** | generic | 1999 | DTD | no native | via embed | partial (`<a name>`) | scripts | yes | yes | M |
| **HTML5** | generic | 2014 | prose content model | via MathML | via SVG | partial | scripts | yes | yes | M |
| **XML 1.0** | generic | 1998 | DTD/XSD/RNG | via MathML | via SVG | via XLink | no | yes | yes | H |
| **XHTML 1.0** | generic | 2000 | DTD | via MathML embed | via SVG embed | partial | scripts | yes | yes | H |
| **MathML** | generic | 1998 | XSD | yes (its purpose) | no | xref attribute | no | yes | yes | H (verbose) |
| **SVG** | generic | 2001 | XSD/RNG | partial (text/path) | yes (its purpose) | via xlink | scripts | yes | yes | M |
| **XSLT/XPath** | generic | 1999 | XSD | no | no | yes | yes (templates) | n/a (transform) | n/a | H |
| **DocBook** | generic | 1991/XML | DTD/XSD/RNG | via MathML | via SVG | yes | code blocks | yes | yes | H |
| **JATS** | generic | 2003 | DTD | via MathML | via TIFF/SVG | yes | no | yes | yes | H |
| **EPUB** | generic | 2007 | XHTML+OPF | via MathML | via SVG | yes | scripts | yes | yes | M |
| **Markdown** | generic | 2004 | none → CommonMark | via $...$ ext | via embed | autolinks | code fences | yes | yes | L |
| **CommonMark** | generic | 2014 | normative parser | via ext | via embed | autolinks | code fences | yes | yes | L |
| **GFM** | generic | 2009 | CommonMark + ext | via $...$ | via embed | autolinks | yes | yes | yes | L |
| **reStructuredText** | generic | 2002 | directive registry | via :math: | via .. image:: | yes (rich) | code blocks | yes | yes | M |
| **AsciiDoc** | generic | 2002 | DocBook is schema | via stem:[] | via image:: | yes (rich) | code blocks | yes | yes | M |
| **Org-mode** | generic | 2003 | none | via $...$ | via #+caption | yes | Babel (full exec) | yes | yes (Emacs) | L |
| **Pandoc AST** | bridge | 2006 | pandoc-types | yes (Math) | partial (Image) | yes (Link) | partial | n/a (it IS the AST) | n/a | n/a |
| **Typst** | procedural | 2023 | analyzable lang | yes (TeX-like) | yes (native) | yes | yes (programmable) | partial (early) | yes | L (math) / L (prose) |
| **KaTeX** | procedural | 2014 | TeX subset spec | yes (Appendix G) | no | yes | no | n/a (renderer) | n/a | n/a |
| **MathJax** | procedural | 2009 | TeX + MathML | yes | no | yes | no | n/a (renderer) | n/a | n/a |

## Capability gaps the matrix exposes

1. **Native math + native vector + low author-density is rare.** Typst is currently the only modern format that scores well on all three. LaTeX scores well on math but high on author density (verbose). Markdown is low density but has no native math/vector.
2. **Lossless Pandoc round-trip is broad but not universal.** TeX/LaTeX lose on arbitrary macros; Org-mode loses on Emacs-specific properties; Markdown variants lose on inline HTML. The "modulo extensions" caveat in T1 doc 06 §8 cashes out as concrete capability gaps in this matrix.
3. **Executable-code support split is an axis the family tree does not draw out.** Org-mode, Typst, AsciiDoc, RST, GFM all support executable code blocks; Markdown vanilla does not. The Wave-2 dashboard track (T4) will need this split when designing the "rendered + executable" code-document substrate.
4. **Streaming-parse is universal among modern descendants.** SGML's per-doc SGML Declaration was the only family member that broke streaming; its absence from the matrix is part of why the rest of the family won.

## Cross-track pointers

- **T2 SVG-substrate:** rows for SVG, MathML, KaTeX, MathJax, Typst are the relevant capability inputs.
- **T3 code-svg-hdl-bridge:** rows for SVG (as IR) and Markdown/GFM (as authoring surface for the round-trip viewer's docs) are the inputs.
- **T4 dashboard-lod-rendering:** rows for HTML5 (as semantic layer) and SVG (as primary rendering surface) are the inputs.
- **T5 retrieval-provenance:** rows for JATS, EPUB, DocBook are the inputs (those formats have explicit document-metadata / provenance vocabularies that PROV-O / OpenLineage map to cleanly).
