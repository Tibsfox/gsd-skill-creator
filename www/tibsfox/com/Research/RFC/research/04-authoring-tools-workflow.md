# Authoring Tools & Workflow

> **Domain:** Internet Standards Toolchain
> **Module:** 4 -- xml2rfc v3, idnits, Conversion Tools, and the Author Pipeline
> **Through-line:** *The toolchain for writing an Internet-Draft has evolved from manual typewriters and NROFF macros to a modern XML-based pipeline that produces valid HTML, PDF, and text from a single source. xml2rfc v3 is the canonical tool. idnits is the canonical validator. author-tools.ietf.org is the canonical web service. Together they form a complete authoring stack that requires nothing beyond a text editor, Python, and a terminal -- exactly the kind of simple, composable, freely available pipeline that the IETF's philosophy demands.*

---

## Table of Contents

1. [Authoring History](#1-authoring-history)
2. [xml2rfc v3 (RFCXML)](#2-xml2rfc-v3-rfcxml)
3. [Installation and Setup](#3-installation-and-setup)
4. [Output Generation](#4-output-generation)
5. [RFCXML Vocabulary](#5-rfcxml-vocabulary)
6. [idnits Validation](#6-idnits-validation)
7. [Author Tools Web Service](#7-author-tools-web-service)
8. [id2xml Conversion](#8-id2xml-conversion)
9. [Markdown to RFC](#9-markdown-to-rfc)
10. [GitHub Integration](#10-github-integration)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Authoring History

The RFC authoring toolchain has undergone three major transitions [1]:

| Era | Period | Primary Format | Tool |
|-----|--------|---------------|------|
| Manual | 1969-1980s | Typed/NROFF | Manual typesetting; 72-char ASCII |
| NROFF/xml2rfc v1-v2 | 1990s-2016 | Plain text / XML v2 | NROFF macros; xml2rfc v2 |
| xml2rfc v3 (current) | 2016-present | RFCXML v3 | xml2rfc v3; canonical XML source |

The transition to XML-based production was driven by RFC 7990 (2016), which established that the canonical format for new RFCs would be XML, with all other formats (TXT, HTML, PDF) derived from it. This eliminated the ambiguity of having multiple independently authored format variants [2].

### Why XML?

The RFC Editor's choice of XML as canonical source provides:

- **Single source of truth.** One XML file produces all output formats consistently.
- **Structured metadata.** Authors, dates, references, and cross-links are machine-parseable.
- **Automated validation.** Schema-based checking catches structural errors before submission.
- **Reproducible output.** Any reader with xml2rfc can regenerate the same outputs from the same source.
- **Accessibility.** HTML output meets modern web accessibility standards (screen readers, responsive layout).

---

## 2. xml2rfc v3 (RFCXML)

xml2rfc is the primary authoring and rendering tool for Internet-Drafts and RFCs. Version 3 implements the RFCXML vocabulary defined in RFC 7991 and updated by RFC 9280 [3][4].

### Key Capabilities

| Feature | Description |
|---------|-------------|
| Multi-format output | TXT, HTML, PDF from single XML source |
| Reference resolution | Automatic fetching of bibxml references |
| Table of contents | Auto-generated from section headings |
| Cross-references | `<xref>` elements resolve to anchors |
| v2-to-v3 conversion | `--v2v3` flag upgrades legacy XML |
| Schema validation | Built-in RELAX NG schema checking |
| Pre-processing | XInclude support for modular documents |

### System Requirements

- Python 3.8 or later (3.10+ recommended)
- pip (Python package manager)
- For PDF output: weasyprint (Python library with Cairo/Pango dependencies)
- For HTML/TXT: no additional dependencies

---

## 3. Installation and Setup

```
XML2RFC INSTALLATION
================================================================

  # Standard installation via pip
  pip install xml2rfc

  # Upgrade to latest version
  pip install xml2rfc --upgrade

  # Verify installation
  xml2rfc --version

  # Install with PDF support (requires weasyprint)
  pip install xml2rfc[pdf]

  # Virtual environment (recommended)
  python3 -m venv rfc-tools
  source rfc-tools/bin/activate
  pip install xml2rfc[pdf]
```

### Version History

| Version | RFCXML | Key Change |
|---------|--------|------------|
| v2.x | v2 vocabulary | Original XML format; NROFF-like |
| v3.0-3.12 | v3 vocabulary | New canonical format (RFC 7991) |
| v3.13+ | v3 + RFC 9280 | Updated editorial model support |
| v3.20+ (current) | v3 refined | Improved PDF, SVG, accessibility |

Always use the latest version. The IETF Datatracker submission tool expects documents produced by a current xml2rfc [5].

---

## 4. Output Generation

```
XML2RFC OUTPUT COMMANDS
================================================================

  # Generate plain text output (.txt)
  xml2rfc --text draft-example-00.xml

  # Generate HTML output (.html)
  xml2rfc --html draft-example-00.xml

  # Generate PDF output (.pdf) -- requires weasyprint
  xml2rfc --pdf draft-example-00.xml

  # Generate all three formats at once
  xml2rfc --text --html --pdf draft-example-00.xml

  # Convert v2 XML to v3 vocabulary
  xml2rfc --v2v3 old-draft.xml

  # Specify output filename
  xml2rfc --text -o my-output.txt draft-example-00.xml

  # Strict mode (recommended before submission)
  xml2rfc --text --strict draft-example-00.xml

  # Verbose output (debugging)
  xml2rfc --text -v draft-example-00.xml
```

### Output Format Details

| Format | Extension | Primary Use | Size (typical) |
|--------|-----------|-------------|----------------|
| Text | .txt | Submission; legacy readers | 30-100 KB |
| HTML | .html | Web reading; accessibility | 50-200 KB |
| PDF | .pdf | Print; archival | 100-500 KB |
| XML (source) | .xml | Canonical source; editing | 20-80 KB |

---

## 5. RFCXML Vocabulary

The RFCXML v3 vocabulary (RFC 7991) defines the XML elements and attributes used to author Internet-Drafts and RFCs [3].

### Document Structure

```
RFCXML v3 DOCUMENT STRUCTURE
================================================================

  <rfc>                        Root element
    <front>                    Front matter
      <title>                  Document title
      <seriesInfo>             Series (I-D or RFC) and version
      <author>                 Author information (max 5 on first page)
      <date>                   Publication date
      <area>                   IETF area (optional)
      <workgroup>              Working group (optional)
      <keyword>                Keywords for indexing
      <abstract>               Document abstract
    </front>
    <middle>                   Body content
      <section>                Numbered sections
        <t>                    Text paragraph
        <figure>               Figures with <artwork> or <sourcecode>
        <table>                Tables with <thead>, <tbody>, <tr>, <td>
        <ul>, <ol>, <dl>       Lists
        <xref>                 Cross-references
      </section>
    </middle>
    <back>                     Back matter
      <references>             Normative + Informative references
      <section>                Appendices (numbered="false")
    </back>
  </rfc>
```

### Key Elements

| Element | Purpose | Example |
|---------|---------|---------|
| `<t>` | Text paragraph | `<t>This is a paragraph.</t>` |
| `<xref>` | Cross-reference | `<xref target="RFC2119"/>` |
| `<eref>` | External reference | `<eref target="https://..."/>` |
| `<figure>` | Figure container | Contains `<artwork>` or `<sourcecode>` |
| `<artwork>` | ASCII art / diagrams | `<artwork type="ascii-art">` |
| `<sourcecode>` | Code listings | `<sourcecode type="python">` |
| `<table>` | Table | HTML-like table structure |
| `<dl>` | Definition list | Term/definition pairs |
| `<bcp14>` | Requirements keyword | `<bcp14>MUST</bcp14>` |

### Reference Management

xml2rfc automatically resolves RFC references via entity declarations or XInclude:

```
REFERENCE METHODS
================================================================

  <!-- Method 1: Entity declarations (traditional) -->
  <!DOCTYPE rfc [
    <!ENTITY RFC2119 SYSTEM
      "https://xml2rfc.ietf.org/public/rfc/bibxml/reference.RFC.2119.xml">
  ]>
  ...
  &RFC2119;  <!-- Expands to full reference -->

  <!-- Method 2: XInclude (modern) -->
  <xi:include
    href="https://xml2rfc.ietf.org/public/rfc/bibxml/reference.RFC.2119.xml"/>

  <!-- Method 3: Inline reference (manual) -->
  <reference anchor="RFC2119">
    <front>
      <title>Key words for use in RFCs to Indicate Requirement Levels</title>
      <author initials="S." surname="Bradner"/>
      <date year="1997" month="March"/>
    </front>
    <seriesInfo name="RFC" value="2119"/>
    <seriesInfo name="DOI" value="10.17487/RFC2119"/>
  </reference>
```

The bibxml repository at `xml2rfc.ietf.org/public/rfc/bibxml/` contains pre-formatted reference entries for all RFCs, making citation as simple as including the entity [6].

---

## 6. idnits Validation

idnits is the IETF's nit-checking tool for Internet-Drafts. It validates formatting, boilerplate, required sections, and structural compliance before submission [7].

### What idnits Checks

| Category | Checks |
|----------|--------|
| Boilerplate | IPR notice, Status of This Memo, Copyright Notice per current BCP |
| Required sections | Abstract, Introduction, Security Considerations, IANA Considerations, Author's Address |
| Formatting | Line length (72 chars for text), page breaks, section numbering |
| References | Normative vs. Informative split; reference format consistency |
| Version/date | I-D version number matches filename; date within acceptable range |
| Naming | Filename follows draft-author-topic-version pattern |

### Running idnits

```
IDNITS VALIDATION
================================================================

  # Web-based (recommended -- always current)
  # Upload at: https://author-tools.ietf.org

  # CLI (if installed locally)
  idnits draft-example-00.txt

  # Common output:
  #   0 errors
  #   3 warnings
  #   12 nits
  #
  # Errors:   MUST fix before submission
  # Warnings: SHOULD fix; may cause editorial delays
  # Nits:     MAY fix; stylistic suggestions
```

### Common idnits Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Missing IPR boilerplate | Wrong or missing `ipr=` attribute | Set `ipr="trust200902"` |
| Missing required section | No Security Considerations | Add section even if "no implications" |
| Wrong I-D naming | Filename doesn't match `<seriesInfo>` | Align filename and XML metadata |
| Expired submission date | Date >185 days old | Update `<date>` element |
| Normative/Informative confusion | Reference in wrong section | Move reference to correct subsection |

---

## 7. Author Tools Web Service

The IETF provides a comprehensive web service at `https://author-tools.ietf.org` that integrates all authoring tools without requiring local installation [8].

### Available Services

| Service | URL | Function |
|---------|-----|----------|
| XML to TXT/HTML/PDF | author-tools.ietf.org | Upload XML, download rendered outputs |
| idnits checker | author-tools.ietf.org | Validate I-D compliance |
| v2 to v3 converter | author-tools.ietf.org | Upgrade legacy XML format |
| API endpoint | author-tools.ietf.org/api/ | Programmatic access to all tools |
| SVG checker | author-tools.ietf.org | Validate SVG diagrams for inclusion |

The web service uses the same xml2rfc version as the RFC Editor, ensuring output matches what the editorial team will produce [8].

### API Usage

```
AUTHOR TOOLS API
================================================================

  # Convert XML to text via API
  curl -X POST \
    -F "file=@draft-example-00.xml" \
    -F "type=text" \
    https://author-tools.ietf.org/api/render \
    -o draft-example-00.txt

  # Run idnits via API
  curl -X POST \
    -F "file=@draft-example-00.txt" \
    https://author-tools.ietf.org/api/idnits
```

---

## 8. id2xml Conversion

For authors who prefer to write in plain text, id2xml converts text-format I-Ds to RFCXML v3 [9].

```
ID2XML USAGE
================================================================

  # Install
  pip install id2xml

  # Convert text to XML
  id2xml draft-example-00.txt
  # Produces: draft-example-00.xml

  # Then process normally with xml2rfc
  xml2rfc --text --html draft-example-00.xml
```

id2xml performs heuristic parsing of the text format -- it identifies section headings, references, author blocks, and boilerplate by pattern matching. The output is a valid xml2rfc v3 document, though manual cleanup is often needed for complex structures (tables, nested lists, artwork) [9].

---

## 9. Markdown to RFC

Several community tools enable writing I-Ds in Markdown and converting to RFCXML:

| Tool | Approach | Status |
|------|----------|--------|
| mmark | Markdown → RFCXML v3 | Active; IETF-aware |
| kramdown-rfc | Markdown → RFCXML | Active; Ruby-based |
| xml2rfc with i-d-template | Makefile-based build | Active; GitHub-friendly |

### mmark Workflow

```
MMARK WORKFLOW
================================================================

  # Install mmark (Go binary)
  go install github.com/mmarkdown/mmark/v2@latest

  # Write I-D in Markdown
  cat > draft-example-00.md << 'EOF'
  ---
  title: "Example Internet-Draft"
  abbrev: "Example"
  docname: draft-example-00
  category: info
  ipr: trust200902
  area: General
  date: 2026
  author:
    name: A. Author
    email: author@example.com
  ---

  # Introduction

  This is an example document.
  EOF

  # Convert to RFCXML
  mmark draft-example-00.md > draft-example-00.xml

  # Render with xml2rfc
  xml2rfc --text --html draft-example-00.xml
```

Markdown-based workflows lower the barrier to entry for authors unfamiliar with XML. However, the XML output should always be reviewed -- some Markdown constructs do not map cleanly to RFCXML semantics [10].

---

## 10. GitHub Integration

The IETF maintains guidance for hosting I-Ds on GitHub at `https://ietf-gitwg.github.io/`. Many Working Groups use GitHub for collaborative editing [11].

### Recommended GitHub Workflow

```
GITHUB I-D WORKFLOW
================================================================

  1. Create repository: github.com/org/draft-wgname-topic
  2. Add source XML file
  3. Configure GitHub Actions for automated builds:

  # .github/workflows/build.yml
  name: Build I-D
  on: [push, pull_request]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with:
            python-version: '3.12'
        - run: pip install xml2rfc
        - run: xml2rfc --text --html draft-*.xml
        - uses: actions/upload-artifact@v4
          with:
            name: draft-outputs
            path: |
              *.txt
              *.html

  4. PRs trigger automated builds
  5. Merge to main = new version candidate
  6. Submit via Datatracker when ready
```

### i-d-template

The `martinthomson/i-d-template` repository provides a complete GitHub-based build system with Makefile, CI/CD integration, and automated submission support. It is used by dozens of IETF Working Groups [11].

---

## 11. Cross-References

> **Related:** [RFC Archive & Local Mirror](02-rfc-archive-local-mirror.md) -- the bibxml reference library used by xml2rfc entity declarations. [I-D Submission Process](05-internet-draft-submission.md) -- idnits validation is step one before submission. [RFC Document Template](06-rfc-template-style-guide.md) -- the template is the input to xml2rfc.

**Series cross-references:**
- **SYS (Systems Administration):** pip installation, Python environment management, cron-based builds
- **K8S (Kubernetes):** CI/CD pipelines for automated I-D builds
- **CMH (Computational Mesh):** Distributed collaborative editing of standards documents
- **FCC (FCC Catalog):** FCC regulations reference IETF standards; toolchain compatibility matters
- **DNS:** Reference resolution in xml2rfc depends on DNS to reach xml2rfc.ietf.org
- **MCF (Multi-Cluster Federation):** Multi-author I-D collaboration across organizational boundaries

---

## 12. Sources

1. RFC Editor. "RFC Format Change FAQ." https://www.rfc-editor.org/rse/format-faq/
2. Flanagan, H. "RFC Format Framework." RFC 7990, December 2016.
3. Hoffman, P. "The 'xml2rfc' Version 3 Vocabulary." RFC 7991, December 2016.
4. Saint-Andre, P. "RFC Editor Model (Version 3)." RFC 9280, June 2022.
5. IETF Datatracker. "Submission Tool Instructions." https://datatracker.ietf.org/submit/tool-instructions/
6. IETF. "xml2rfc Reference Library." https://xml2rfc.ietf.org/public/rfc/bibxml/
7. IETF. "idnits." https://author-tools.ietf.org (integrated tool).
8. IETF. "Internet-Draft Author Resources." https://authors.ietf.org/
9. Levkowetz, H. "id2xml: Convert text I-Ds to XML." https://pypi.org/project/id2xml/
10. Gieben, R. "Writing I-Ds and RFCs Using mmark." https://github.com/mmarkdown/mmark
11. IETF. "Using GitHub for IETF Work." https://ietf-gitwg.github.io/
12. Thomson, M. "i-d-template: Template for IETF Internet-Drafts." https://github.com/martinthomson/i-d-template
13. IETF. "I-D Guidelines." https://ietf.github.io/id-guidelines/
14. xml2rfc Project. "xml2rfc on PyPI." https://pypi.org/project/xml2rfc/
15. IETF. "Internet-Draft Author Resources -- Getting Started." https://authors.ietf.org/en/getting-started

---

*RFC Archive & Authorship -- Module 4: Authoring Tools & Workflow. One XML file, one Python tool, three output formats. The pipeline is free, the specifications are public, and the barrier is exactly as low as it should be.*
