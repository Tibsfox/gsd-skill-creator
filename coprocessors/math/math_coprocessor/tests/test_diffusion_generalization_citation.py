"""
JP-024 — Diffusion generalization anchor citation test.

Verifies that coprocessors/math/REFERENCES.md exists and contains a
reference to arXiv:2603.03700 (Intrinsic Wasserstein Dimension and
Generalization Bounds for Diffusion-Based Models).

This test is intentionally lightweight: the deliverable for JP-024 is
the citation commitment, not a runtime implementation.  The test serves
as a regression gate ensuring the anchor is never accidentally removed
from the references file.
"""

import pathlib
import pytest


# Locate REFERENCES.md relative to this test file's package root.
# Layout: coprocessors/math/math_coprocessor/tests/test_*.py
#         coprocessors/math/REFERENCES.md
_MATH_COPROCESSOR_ROOT = pathlib.Path(__file__).parent.parent.parent
_REFERENCES_FILE = _MATH_COPROCESSOR_ROOT / "REFERENCES.md"

ANCHOR_ARXIV_ID = "arXiv:2603.03700"
ANCHOR_KEYWORD = "Wasserstein"


class TestDiffusionGeneralizationCitation:
    """Citation-presence tests for JP-024."""

    def test_references_file_exists(self) -> None:
        """REFERENCES.md must exist at coprocessors/math/REFERENCES.md."""
        assert _REFERENCES_FILE.exists(), (
            f"REFERENCES.md not found at {_REFERENCES_FILE}. "
            "JP-024 requires this file to anchor the diffusion generalization citation."
        )

    def test_references_file_is_not_empty(self) -> None:
        """REFERENCES.md must not be empty."""
        content = _REFERENCES_FILE.read_text(encoding="utf-8")
        assert len(content.strip()) > 0, "REFERENCES.md is empty."

    def test_diffusion_generalization_arxiv_id_present(self) -> None:
        """REFERENCES.md must reference arXiv:2603.03700."""
        content = _REFERENCES_FILE.read_text(encoding="utf-8")
        assert ANCHOR_ARXIV_ID in content, (
            f"Expected citation '{ANCHOR_ARXIV_ID}' not found in REFERENCES.md. "
            "JP-024 anchor: Intrinsic Wasserstein Dimension generalization bounds paper."
        )

    def test_wasserstein_keyword_present(self) -> None:
        """REFERENCES.md must mention 'Wasserstein' (narrative anchor check)."""
        content = _REFERENCES_FILE.read_text(encoding="utf-8")
        assert ANCHOR_KEYWORD in content, (
            f"Keyword '{ANCHOR_KEYWORD}' not found in REFERENCES.md. "
            "The Wasserstein-Everywhere narrative requires this anchor."
        )

    def test_references_file_path_is_canonical(self) -> None:
        """Sanity-check that we resolved the expected absolute path."""
        # The path should end with coprocessors/math/REFERENCES.md
        parts = _REFERENCES_FILE.parts
        assert parts[-1] == "REFERENCES.md"
        assert parts[-2] == "math"
        assert parts[-3] == "coprocessors"
