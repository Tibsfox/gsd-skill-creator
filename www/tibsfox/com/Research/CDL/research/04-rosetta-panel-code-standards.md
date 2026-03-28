# Rosetta Panel Code Example Standards

> **Domain:** Multi-Language Pedagogical Code
> **Module:** 4 -- Panel Verbosity Contracts, Real-Data Integration, and Auto-Grade Hooks
> **Through-line:** *Seven languages, one concept, seven ways of seeing.* Python shows you readability. C++ shows you precision. Perl shows you the bridge between documentation and execution. Lisp shows you code as data. Pascal shows you constraints as pedagogy. Fortran shows you scientific computing's roots. Java shows you encapsulation. Each panel is a different lens on the same mathematical truth -- and when you see the concept through all seven, you understand it in a way no single language can teach.

---

## Table of Contents

1. [The Panel Verbosity Contract](#1-the-panel-verbosity-contract)
2. [Panel Family Profiles](#2-panel-family-profiles)
3. [Python Panel Standards](#3-python-panel-standards)
4. [C++ Panel Standards](#4-c-panel-standards)
5. [Perl Panel Standards](#5-perl-panel-standards)
6. [Heritage Panel Standards: Lisp, Pascal, Fortran](#6-heritage-panel-standards-lisp-pascal-fortran)
7. [Java Panel Standards](#7-java-panel-standards)
8. [Real-Dataset Integration Patterns](#8-real-dataset-integration-patterns)
9. [Auto-Grade and LRS Hooks](#9-auto-grade-and-lrs-hooks)
10. [Cross-Panel Consistency Rules](#10-cross-panel-consistency-rules)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Panel Verbosity Contract

Every Rosetta Panel implementation for a concept node must satisfy a verbosity contract: a formal specification of minimum annotation density, required scaffolding elements, and integration points. The contract is the interface between the verbosity engine (Module C) and the panel implementations.

### Contract Elements

| Element | Requirement | Verified By |
|---|---|---|
| Glance annotation | Present for every function/block | Automated (line count) |
| Read annotation | Present with symbol-to-code mapping | Automated (mapping check) |
| Study annotation | Present for Bloom >= Analyze concepts | Manual review |
| FIB section | Present for Bloom Apply concepts | Automated (blank count) |
| Test assertion | Present for every FIB section | Automated (assertion exists) |
| Dataset reference | Present when real data used | Automated (DCAT link check) |
| xAPI hook | Present for tracked interactions | Automated (hook exists) |
| Complexity ceiling | Not exceeded for target Bloom | Automated (line/word count) |

### Contract Enforcement

The verbosity contract is enforced at two points:

1. **Seeding time:** When a new concept node is created, the seeding protocol (Module E) generates a contract checklist. The concept node cannot be published until all contract elements are satisfied.
2. **Update time:** When a panel expression is modified, the stale-link detection skill checks that the modification does not violate the contract (e.g., removing the dataset reference or deleting the FIB assertion).

---

## 2. Panel Family Profiles

Each of the seven Rosetta Panels has a distinct pedagogical identity based on the language's design philosophy, syntax characteristics, and historical role in computing education.

### Family Classification

| Panel | Family | Design Era | Verbosity Strength | Ideal Bloom Levels |
|---|---|---|---|---|
| Python | Systems | 1991/modern | Readable syntax mirrors pseudocode | Understand, Apply |
| C++ | Systems | 1985/modern | Explicit type declarations teach precision | Analyze, Evaluate |
| Java | Systems | 1995/modern | Object encapsulation teaches abstraction | Evaluate |
| Perl | Bridge | 1987/modern | POD blocks are native study-tier content | All (bridge) |
| Lisp | Heritage | 1958/modern | Homoiconicity teaches code-as-data | Create (Category Theory) |
| Pascal | Heritage | 1970 | Pedagogical constraints make structure explicit | Remember, Understand |
| Fortran | Heritage | 1957/modern | Scientific computing lineage connects to data | Apply (real data) |

### Panel Selection by Concept

Not every concept needs all seven panels. The panel selection follows the concept's pedagogical requirements:

- **Introductory concepts (Layer 1-2):** Python + Pascal (readability + structure)
- **Core computation (Layer 3-4):** Python + C++ + Fortran (readability + precision + data)
- **Abstract concepts (Layer 5-6):** Python + Lisp + Perl (readability + homoiconicity + bridge)
- **Cross-department concepts:** All seven (flagship examples)
- **Flagship example (exponential decay):** All seven (required by success criteria)

---

## 3. Python Panel Standards

Python serves as the College's primary teaching panel due to its syntax clarity and widespread adoption in scientific computing [1].

### Python Annotation Template

```
# GLANCE: [One-line concept summary with formula]
#
# READ: [Symbol-to-code mapping]
#   [Mathematical context -- what this computes and why]
#   [Dataset source if applicable]
#   [Connection to adjacent concepts]
#
# STUDY: See annotations/study.md section [X]

import math
from typing import List

def decay(N0: float, lam: float, t: float) -> float:
    """Compute exponential decay.

    Args:
        N0: Initial quantity (count or concentration)
        lam: Decay constant (1/time units)
        t: Elapsed time (same units as 1/lam)

    Returns:
        Remaining quantity at time t

    Dataset: CERN Cs-137 Open Data (DOI: 10.5281/zenodo.XXXXXXX)
    Bloom: Apply
    """
    return N0 * math.exp(-lam * t)
```

### Python-Specific Requirements

1. **Type hints required** for all function signatures (teaches concept precision)
2. **Docstring required** following Google or NumPy style (dual annotation with comments)
3. **Import statements** must be explicit, never `import *`
4. **Variable names** must match the symbol-to-code mapping (no abbreviations beyond the mapping)

---

## 4. C++ Panel Standards

C++ panels teach concept precision through explicit type declarations and memory management visibility [2].

### C++ Annotation Template

```
// GLANCE: [One-line concept summary with formula]
//
// READ: [Symbol-to-code mapping]
//   [Type choices and their mathematical significance]
//   [Performance characteristics: O(n) or constant time]
//   [Connection to adjacent concepts]

#include <cmath>
#include <vector>
#include <cassert>

/**
 * Compute exponential decay.
 * @param N0 Initial quantity (dimensionless count or SI units)
 * @param lam Decay constant (1/s or 1/year -- must match t units)
 * @param t Elapsed time
 * @return Remaining quantity at time t
 *
 * Note: double precision provides ~15 significant digits,
 * sufficient for decay calculations up to t/tau ~ 700
 * before underflow (IEEE 754 double minimum ~2.2e-308).
 */
double decay(double N0, double lam, double t) {
    return N0 * std::exp(-lam * t);
}
```

### C++ Specific Requirements

1. **Type justification** in Read annotation: why `double` not `float`? Why `size_t` not `int`?
2. **Precision analysis** for numerical code: significant digits, overflow/underflow bounds
3. **Const correctness** for all parameters that should not be modified
4. **No raw pointers** in teaching code unless pointer semantics are the concept being taught

---

## 5. Perl Panel Standards

Perl occupies a unique position as the bridge panel -- its POD documentation system makes it the only language where Study-tier annotations are syntactically part of the source code [3].

### Perl Annotation Template

```
#!/usr/bin/env perl
use strict;
use warnings;
use POSIX qw(exp);

=head1 NAME

decay - Exponential decay computation

=head1 SYNOPSIS

  my $remaining = decay(1000, 0.023, 30.17);
  # Returns approximately 500 (Cs-137 half-life)

=head1 DESCRIPTION

Computes N(t) = N0 * e^(-lambda * t), the universal
decay law governing radioactive disintegration, Newton's
cooling, and RC circuit discharge.

B<Symbol mapping:>

  N0     -> $N0     (initial quantity)
  lambda -> $lam    (decay constant, 1/time)
  t      -> $t      (elapsed time)
  e^(x)  -> exp($x) (POSIX builtin)

B<Dataset:> CERN Cs-137 Open Data (DOI: 10.5281/zenodo.XXXXXXX)

B<Bloom Level:> Apply

=cut

sub decay {
    my ($N0, $lam, $t) = @_;
    return $N0 * exp(-$lam * $t);
}

# TEST: Half-life of Cs-137
my $result = decay(1000, 0.023, 30.17);
die "Decay test failed: got $result" unless abs($result - 500) < 5;
```

### Perl-Specific Requirements

1. **POD documentation is mandatory** -- it IS the Study tier
2. **`use strict; use warnings;`** always present (teaches discipline)
3. **CPAN module references** where applicable (connects to the CPAN lineage)
4. **Regex teaching** when the concept involves pattern matching

---

## 6. Heritage Panel Standards: Lisp, Pascal, Fortran

### Lisp Panel

Lisp's homoiconicity (code and data share the same representation) makes it the natural panel for Category Theory and abstract mathematical concepts [4].

```
;; GLANCE: Exponential decay -- (decay N0 lam t) -> N(t) = N0 * e^(-lam*t)
;;
;; READ: In Lisp, the function IS the mathematical expression.
;;   The s-expression (decay N0 lam t) mirrors the mathematical notation
;;   N(t) directly. Code-as-data means the decay function can be passed
;;   to higher-order functions, composed, and transformed -- just as
;;   mathematical functions compose.

(defun decay (N0 lam tt)
  "Compute exponential decay N(t) = N0 * e^(-lambda * t)"
  (* N0 (exp (- (* lam tt)))))

;; TEST
(assert (< (abs (- (decay 1000 0.023 30.17) 500)) 5))
```

### Pascal Panel

Pascal's pedagogical design makes constraints explicit, teaching program structure before complexity [5]:

```
{ GLANCE: Exponential decay -- N(t) = N0 * e^(-lambda * t) }
{ READ: Pascal's explicit type system and block structure
  teach the concept's mathematical constraints:
  all parameters are Real (continuous), the function
  returns Real, and the structure mirrors the formula. }

program ExponentialDecay;

function Decay(N0, Lam, T: Real): Real;
begin
  Decay := N0 * Exp(-Lam * T);
end;

var
  Result: Real;
begin
  Result := Decay(1000.0, 0.023, 30.17);
  if Abs(Result - 500.0) > 5.0 then
    WriteLn('Test FAILED: ', Result:10:4)
  else
    WriteLn('Test PASSED: ', Result:10:4);
end.
```

### Fortran Panel

Fortran's scientific computing lineage connects directly to research datasets -- the language was literally built to compute formulas [6]:

```
! GLANCE: Exponential decay -- N(t) = N0 * e^(-lambda * t)
!
! READ: Fortran (FORmula TRANslation) was designed for scientific
!   computation. The EXP intrinsic maps directly to the mathematical
!   exponential. Double precision (REAL(8)) provides ~15 significant
!   digits -- matching IEEE 754 double.
!   Dataset: CERN Cs-137 Open Data (DOI: 10.5281/zenodo.XXXXXXX)

PROGRAM exponential_decay
  IMPLICIT NONE
  REAL(8) :: N0, lam, t, result

  N0 = 1000.0D0
  lam = 0.023D0
  t = 30.17D0

  result = decay(N0, lam, t)
  IF (ABS(result - 500.0D0) > 5.0D0) THEN
    PRINT *, 'Test FAILED:', result
  ELSE
    PRINT *, 'Test PASSED:', result
  END IF

CONTAINS

  FUNCTION decay(N0, lam, t) RESULT(Nt)
    REAL(8), INTENT(IN) :: N0, lam, t
    REAL(8) :: Nt
    Nt = N0 * EXP(-lam * t)
  END FUNCTION decay

END PROGRAM exponential_decay
```

---

## 7. Java Panel Standards

Java teaches object encapsulation -- wrapping the mathematical concept in a class that enforces its invariants [7]:

```
// GLANCE: Exponential decay -- N(t) = N0 * e^(-lambda * t)
//
// READ: The DecayModel class encapsulates the concept:
//   the decay constant is set at construction and cannot change,
//   teaching that physical constants are invariants.
//   evaluate(t) returns the quantity at time t.

public class DecayModel {
    private final double N0;
    private final double lambda;

    public DecayModel(double initialQuantity, double decayConstant) {
        this.N0 = initialQuantity;
        this.lambda = decayConstant;
    }

    public double evaluate(double t) {
        return N0 * Math.exp(-lambda * t);
    }

    public double halfLife() {
        return Math.log(2) / lambda;
    }

    public static void main(String[] args) {
        DecayModel cs137 = new DecayModel(1000, 0.023);
        double result = cs137.evaluate(30.17);
        assert Math.abs(result - 500) < 5 :
            "Decay test failed: " + result;
        System.out.println("Test PASSED: " + result);
    }
}
```

---

## 8. Real-Dataset Integration Patterns

When a panel expression uses data from a DCAT-linked dataset, the code must follow a standard integration pattern that handles fetching, caching, error handling, and provenance display.

### Integration Pattern (Python)

```
# Real-Dataset Integration Pattern
# Dataset: CERN Cs-137 Decay Series
# DOI: 10.5281/zenodo.XXXXXXX
# License: CC-BY 4.0
# Last verified: 2026-03-27

import json
import urllib.request
from pathlib import Path

DATASET_DOI = "10.5281/zenodo.XXXXXXX"
CACHE_PATH = Path(".cache/datasets/cs137-decay.json")
CACHE_TTL_DAYS = 7

def fetch_dataset():
    """Fetch dataset with local caching."""
    if CACHE_PATH.exists():
        age = (time.time() - CACHE_PATH.stat().st_mtime) / 86400
        if age < CACHE_TTL_DAYS:
            return json.loads(CACHE_PATH.read_text())

    url = f"https://zenodo.org/api/records/{DATASET_DOI.split('.')[-1]}"
    with urllib.request.urlopen(url) as resp:
        data = json.loads(resp.read())

    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(data))
    return data

def display_provenance(dataset):
    """Show dataset provenance to learner."""
    meta = dataset["metadata"]
    print(f"Dataset: {meta['title']}")
    print(f"Publisher: {meta['creators'][0]['name']}")
    print(f"DOI: {DATASET_DOI}")
    print(f"License: {meta['license']['id']}")
    print(f"Published: {meta['publication_date']}")
```

### Error Handling Requirements

Panel code that fetches real datasets must handle these failure modes:

| Failure | Handling | User Display |
|---|---|---|
| Network unreachable | Fall back to cached data | "Using cached data (offline)" |
| Dataset not found (404) | Fall back to embedded sample | "Dataset unavailable; using sample data" |
| Schema changed | Display warning, use last valid cache | "Dataset format changed; verify results" |
| Rate limited (429) | Retry with backoff | "Waiting for data portal..." |
| License changed | Block fetch, display warning | "License changed; manual review required" |

---

## 9. Auto-Grade and LRS Hooks

Every panel expression with a test assertion should emit an xAPI statement recording the learner's interaction:

### Auto-Grade Hook Pattern

```
# AUTO-GRADE HOOK (Python)
def emit_xapi(verb, concept, bloom_level, success, dataset_doi=None):
    """Emit xAPI statement to LRS."""
    statement = {
        "verb": {"id": f"https://college.gsd/vocab/{verb}"},
        "object": {
            "id": f"https://college.gsd/{concept}/panel/python",
            "definition": {
                "type": "https://college.gsd/vocab/activity-types/panel-expression"
            }
        },
        "result": {
            "success": success,
            "extensions": {
                "https://college.gsd/vocab/ext/bloom-level": bloom_level,
            }
        }
    }
    if dataset_doi:
        statement["result"]["extensions"][
            "https://college.gsd/vocab/ext/dataset-used"
        ] = dataset_doi
    # POST to LRS endpoint
    lrs_post(statement)
```

### Hook Trigger Points

| Event | Verb | Bloom Level | Trigger |
|---|---|---|---|
| Panel opened | `opened-panel` | Current level | Page load / panel expand |
| Code executed | `executed-code` | Current level | Run button / cell execution |
| FIB completed | `completed-bloom-level` | Apply | Assertion passes |
| Target hit | `completed-bloom-level` | Analyze | Target criterion met |
| Dataset fetched | `queried-dataset` | N/A | fetch_dataset() called |

---

## 10. Cross-Panel Consistency Rules

When a concept appears in multiple panels, the following consistency rules apply:

1. **Same variable names** across panels (following the symbol-to-code mapping from Module C)
2. **Same test assertion values** -- if the Python test expects `abs(result - 500) < 5`, all panels must test the same criterion
3. **Same dataset reference** -- all panels fetch from the same DCAT-linked source
4. **Same Bloom level** -- if the Python panel is at Apply, all panels for that concept are at Apply
5. **Consistent annotation structure** -- Glance/Read/Study tiers contain equivalent information adapted to the language's idioms

> **Related:** [COK College of Knowledge](../../../Research/COK/index.html), [WAL Weird Al / Rosetta Stone](../../../Research/WAL/index.html), [MPC Math Co-Processor](../../../Research/MPC/index.html)

---

## 11. Cross-References

| Topic | Appears In | Related Projects |
|---|---|---|
| Panel verbosity contract | M3, M4 | COK, WAL |
| Python panel | M4 | COK, ACE, MPC |
| Perl POD integration | M3, M4 | WAL, GSD2 |
| Lisp homoiconicity | M4 | SGM, MPC |
| Fortran scientific computing | M4 | MPC, GSD2 |
| Real-dataset fetch patterns | M1, M4 | COK, FEG |
| xAPI auto-grade hooks | M2, M4 | GSD2, ACE |
| Fill-in-the-blank | M3, M4 | COK, PMG |
| Cross-panel consistency | M4, M5 | WAL, COK |
| Symbol-to-code mapping | M3, M4 | MPC, SGM |

---

## 12. Sources

1. Van Rossum, G. et al. *Python Documentation -- Style Guide*. https://docs.python.org/3/
2. Stroustrup, B. (2013). *The C++ Programming Language* (4th ed.). Addison-Wesley.
3. Wall, L. et al. *perlpod -- the Plain Old Documentation format*. https://perldoc.perl.org/perlpod
4. McCarthy, J. (1960). Recursive Functions of Symbolic Expressions and Their Computation by Machine. *Communications of the ACM*, 3(4), 184-195.
5. Wirth, N. (1971). The Programming Language Pascal. *Acta Informatica*, 1, 35-63.
6. Backus, J. (1978). The History of FORTRAN I, II, and III. *ACM SIGPLAN Notices*, 13(8), 165-180.
7. Gosling, J. et al. (2014). *The Java Language Specification* (Java SE 8 ed.). Oracle.
8. IEEE. (2023). *IEEE 9274.1.1-2023: Standard for Learning Technology -- xAPI*. https://xapi.com/
9. Barba, L.A. et al. (2019). *Teaching and Learning with Jupyter*. https://jupyter4edu.github.io/jupyter-edu-book/
10. Foxglove, M.T. *The Space Between* (923 pp). https://tibsfox.com/media/The_Space_Between.pdf
11. CERN. *CERN Open Data Portal*. https://opendata.cern.ch
12. schema.org. *Dataset type specification*. https://schema.org/Dataset
13. W3C. (2020). *Data Catalog Vocabulary (DCAT) -- Version 2*. https://www.w3.org/TR/vocab-dcat-2/
14. Knuth, D.E. (1984). Literate Programming. *The Computer Journal*, 27(2), 97-111.
15. resources.data.gov. *DCAT-US Schema v1.1*. https://resources.data.gov/resources/dcat-us/
16. NIST. *Statistical Reference Datasets*. https://www.itl.nist.gov/div898/strd/
