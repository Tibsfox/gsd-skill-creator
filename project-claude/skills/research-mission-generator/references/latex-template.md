# LaTeX Template Reference — Research Mission Generator

Read this file before generating any LaTeX. It contains the complete document structure, color scheme, package configuration, and formatting patterns.

## Table of Contents

1. [Preamble and Packages](#preamble)
2. [Color Scheme](#colors)
3. [Section Formatting](#sections)
4. [Custom Environments](#environments)
5. [Table Patterns](#tables)
6. [Title Page](#title-page)
7. [Stage Headers](#stage-headers)
8. [ASCII Diagram Boxes](#ascii-boxes)
9. [Full Document Skeleton](#skeleton)

---

## Preamble

Use XeLaTeX for Unicode support and system fonts. Required packages:

```latex
\documentclass[11pt,letterpaper]{article}

\usepackage[top=1in, bottom=1in, left=1in, right=1in, headheight=14pt]{geometry}
\usepackage{fontspec}
\setmainfont{DejaVu Serif}
\setsansfont{DejaVu Sans}
\setmonofont{DejaVu Sans Mono}

\usepackage{xcolor}
\usepackage{titlesec}
\usepackage{fancyhdr}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{booktabs}
\usepackage{tabularx}
\usepackage{longtable}
\usepackage{colortbl}
\usepackage{multirow}
\usepackage{array}
\usepackage{parskip}
\usepackage{tcolorbox}
\usepackage{graphicx}
\usepackage{lastpage}
```

**Font selection:** DejaVu is pre-installed on Ubuntu and has excellent Unicode coverage. If unavailable, fall back to Liberation Serif/Sans/Mono.

---

## Color Scheme

Choose a THREE-COLOR scheme that reflects the research domain. Each scheme needs a primary (sections), secondary (subsections), and tertiary (subsubsections) color plus their light variants.

### Domain-Adaptive Color Selection

| Domain | Primary | Secondary | Tertiary | Mood |
|--------|---------|-----------|----------|------|
| Ecology/Nature | Forest green `#1B5E20` | River blue `#1565C0` | Earth brown `#4E342E` | Organic, grounded |
| Ocean/Marine | Deep blue `#0D47A1` | Teal `#00695C` | Sand `#5D4037` | Depth, mystery |
| Technology | Steel blue `#263238` | Electric `#1565C0` | Graphite `#37474F` | Precision, modern |
| History | Burgundy `#4A148C` | Gold `#F57F17` | Parchment `#4E342E` | Gravitas, age |
| Medical/Health | Clinical blue `#1565C0` | Life green `#2E7D32` | Warm gray `#455A64` | Trust, care |
| Space/Physics | Cosmic purple `#311B92` | Nebula blue `#0277BD` | Star gold `#F9A825` | Wonder, scale |
| Social Science | Warm indigo `#283593` | Coral `#D84315` | Slate `#37474F` | Human, analytical |

Define colors in LaTeX:

```latex
\definecolor{primary}{HTML}{1B5E20}       % Section headers
\definecolor{secondary}{HTML}{1565C0}     % Subsection headers
\definecolor{tertiary}{HTML}{4E342E}      % Subsubsection headers
\definecolor{accent}{HTML}{2E7D32}        % Highlights, pipeline arrows
\definecolor{lightprimary}{HTML}{E8F5E9}  % Quote boxes, highlights
\definecolor{lightsecondary}{HTML}{E3F2FD}
\definecolor{lighttertiary}{HTML}{EFEBE9}
\definecolor{rowgray}{HTML}{F5F5F5}       % Alternating table rows
\definecolor{bordergray}{HTML}{BDBDBD}    % Rules, borders
\definecolor{subtlegray}{HTML}{757575}    % Footer text, metadata
\definecolor{darktext}{HTML}{212121}      % Body text
```

---

## Section Formatting

```latex
\titleformat{\section}
  {\Large\bfseries\sffamily\color{primary}}
  {\thesection}{1em}{}
  [\vspace{-0.5em}\textcolor{bordergray}{\rule{\textwidth}{0.4pt}}]

\titleformat{\subsection}
  {\large\bfseries\sffamily\color{secondary}}
  {\thesubsection}{1em}{}

\titleformat{\subsubsection}
  {\normalsize\bfseries\sffamily\color{tertiary}}
  {\thesubsubsection}{1em}{}

\titlespacing*{\section}{0pt}{1.5em}{0.8em}
\titlespacing*{\subsection}{0pt}{1.2em}{0.5em}
\titlespacing*{\subsubsection}{0pt}{0.8em}{0.3em}
```

---

## Custom Environments

### Stage Header Banner

```latex
\newcommand{\stageheader}[2]{%
  \noindent\colorbox{#2}{\makebox[\textwidth][l]{%
    \textcolor{white}{\bfseries\sffamily\hspace{6pt}#1\hspace{6pt}}}}%
  \vspace{0.5em}\par%
}

% Usage:
\stageheader{STAGE 1 --- VISION DOCUMENT}{primary}
\stageheader{STAGE 2 --- RESEARCH REFERENCE}{secondary}
\stageheader{STAGE 3 --- MISSION PACKAGE}{tertiary}
```

### ASCII Diagram Box

```latex
\newtcolorbox{asciibox}{
  colback=rowgray, colframe=bordergray,
  arc=1pt, boxrule=0.5pt,
  left=6pt, right=6pt, top=4pt, bottom=4pt,
  fontupper=\small\ttfamily,
  breakable
}
```

### Quote Box

```latex
\newtcolorbox{quotebox}{
  colback=lightprimary, colframe=primary,
  arc=2pt, boxrule=0.5pt,
  left=12pt, right=12pt, top=8pt, bottom=8pt,
  breakable
}
```

### Metadata Field

```latex
\newcommand{\metafield}[2]{\textbf{\sffamily #1} #2\par}

% Usage:
\metafield{Date:}{March 7, 2026}
\metafield{Status:}{Initial Vision / Pre-Research}
```

---

## Table Patterns

### Standard Data Table

```latex
\newcolumntype{L}[1]{>{\raggedright\arraybackslash}p{#1}}
\newcolumntype{C}[1]{>{\centering\arraybackslash}p{#1}}
\newcommand{\tableheader}[1]{\textbf{\sffamily\textcolor{white}{#1}}}

\begin{center}
\rowcolors{2}{rowgray}{white}
\begin{tabularx}{\textwidth}{L{3cm}XC{2cm}}
\toprule
\rowcolor{primary}
\tableheader{Column A} & \tableheader{Column B} & \tableheader{Column C} \\
\midrule
Data 1 & Description & Value \\
Data 2 & Description & Value \\
\bottomrule
\end{tabularx}
\end{center}
```

Key rules:
- Always use `\rowcolors{2}{rowgray}{white}` for alternating rows
- Header row uses `\rowcolor{primary}` with white text via `\tableheader{}`
- Use `tabularx` with `X` columns for flexible widths
- Use `booktabs` rules (`\toprule`, `\midrule`, `\bottomrule`)
- Never use vertical rules

---

## Title Page

```latex
\thispagestyle{empty}
\begin{center}
\vspace*{3cm}

{\small\sffamily\textcolor{primary}{\textbf{GSD RESEARCH MISSION PACKAGE}}}

\vspace{0.3cm}
\textcolor{bordergray}{\rule{8cm}{0.4pt}}

\vspace{1.5cm}
{\fontsize{28}{34}\selectfont\bfseries\sffamily\textcolor{primary}{[TITLE]\\[0.3em][SUBTITLE]}}

\vspace{0.8cm}
{\Large\sffamily\textcolor{secondary}{[SCOPE / GEOGRAPHY / DOMAIN]}}

\vspace{0.5cm}
{\large\sffamily\itshape\textcolor{tertiary}{A Deep Research Study}}

\vspace{3cm}
{\sffamily\textcolor{accent}{Vision $\rightarrow$ Research $\rightarrow$ Mission}}\\[0.3em]
{\small\sffamily\textcolor{accent}{Full Pipeline Execution}}

\vspace{3cm}
{\small\sffamily\textcolor{subtlegray}{Date: [DATE]  |  Status: Ready for GSD Orchestrator}}\\[0.3em]
{\small\sffamily\textcolor{subtlegray}{Activation Profile: [PROFILE]  |  Estimated: [WINDOWS] context windows across [SESSIONS] sessions}}
\end{center}
\newpage
```

---

## Full Document Skeleton

The complete document follows this structure:

```
Title Page
Table of Contents

STAGE 1 — VISION DOCUMENT
├── [Topic] — Vision Guide
│   ├── Metadata (date, status, depends on, context)
│   ├── Vision (2–4 narrative paragraphs)
│   ├── Problem Statement (3–5 numbered problems)
│   ├── Core Concept (one-line model + explanation)
│   │   ├── Study Region / Domain Map (ASCII diagram)
│   │   └── Module Architecture (ASCII diagram)
│   ├── Research Modules (one subsubsection per module)
│   ├── Chipset Configuration (asciibox with YAML)
│   ├── Scope Boundaries
│   │   ├── In Scope (v1.0) — bullet list
│   │   └── Out of Scope — bullet list
│   ├── Success Criteria (8–12 numbered, testable)
│   ├── Relationship to Other Documents (table)
│   └── The Through-Line (1–2 paragraphs, philosophical)

STAGE 2 — RESEARCH REFERENCE
├── [Topic] — Research Reference
│   ├── How to Use This Document
│   │   └── Key source organizations (bullet list)
│   ├── [Module 1] Reference
│   │   ├── [Subtopic] with findings and data
│   │   └── [Subtopic] with tables of species/items/data
│   ├── [Module 2] Reference
│   ├── ... (one section per module)
│   ├── Safety and Sensitivity Considerations (table)
│   └── Source Bibliography
│       ├── Government & Agency Sources
│       ├── Peer-Reviewed Research
│       └── Professional Organizations

STAGE 3 — MISSION PACKAGE
├── Milestone Specification
│   ├── Mission Objective (2–3 sentences)
│   ├── Architecture Overview (ASCII wave diagram)
│   ├── System Layers (numbered list)
│   ├── Deliverables (table: #, name, criteria, spec)
│   ├── Component Breakdown (table: component, deps, model, tokens)
│   └── Model Assignment Rationale (table)
├── Wave Execution Plan
│   ├── Wave Summary (table)
│   ├── Wave 0: Foundation (table)
│   ├── Wave 1: Parallel tracks A and B (tables)
│   ├── Wave 2: Synthesis (table)
│   ├── Wave 3: Publication + Verification (table)
│   ├── Cache Optimization Strategy (bullets)
│   ├── Token Budget (table with totals)
│   └── Dependency Graph (ASCII art)
├── Test Plan
│   ├── Test Categories (table: category, count, priority, action)
│   ├── Safety-Critical Tests (table: ID, verifies, expected)
│   └── Verification Matrix (table: criterion, test IDs, status)
├── Mission Crew Manifest (table: role, agent, responsibility)
├── Execution Summary (table: metric, value)
└── Closing Quote Box (domain-relevant quote + through-line echo)
```

---

## Headers and Footers

```latex
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\small\sffamily\textcolor{subtlegray}{[SHORT TOPIC NAME]}}
\fancyhead[R]{\small\sffamily\textcolor{subtlegray}{GSD Mission Package}}
\fancyfoot[C]{\small\sffamily\textcolor{subtlegray}{Page \thepage\ of \pageref{LastPage}}}
\renewcommand{\headrulewidth}{0.4pt}
\renewcommand{\footrulewidth}{0pt}
```

---

## Hyperlinks

```latex
\hypersetup{
  colorlinks=true,
  linkcolor=secondary,
  urlcolor=secondary,
  pdfauthor={GSD Ecosystem},
  pdftitle={[TOPIC] -- Mission Package},
  pdfsubject={Vision to Mission Pipeline},
}
```

---

## Compilation

Always compile with XeLaTeX, three passes:

```bash
xelatex -interaction=nonstopmode mission.tex
xelatex -interaction=nonstopmode mission.tex
xelatex -interaction=nonstopmode mission.tex
```

Three passes are required to resolve: table of contents, cross-references, `lastpage` counter, and hyperlink destinations.

---

## Index Page Template

After producing the PDF and .tex source, generate an `index.html` with:

- A header reflecting the topic's color scheme
- Two file cards (darker background, clickable download links with `download` attribute)
- Contents breakdown listing all three stages
- Numbered usage instructions
- LaTeX recompilation instructions
- A closing quote from the document

Use Google Fonts (Libre Baskerville + DM Sans or similar distinctive pairing). Match the card and header colors to the LaTeX color scheme for visual continuity.
