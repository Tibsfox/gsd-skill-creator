# v1.44 Retrospective — SC Learn PyDMD Dogfood

## What Was Built

End-to-end dogfood of sc:learn against PyDMD: knowledge extraction, concept mapping, tutorial replay, accuracy checking, observation bridge, and comprehensive dogfood reporting.

## What Worked

- **Real-world dogfood**: PyDMD is a genuine scientific computing library — testing against it revealed extraction limitations that synthetic tests couldn't
- **Tutorial replay**: Replaying actual PyDMD tutorials validated that extracted knowledge matches practical usage
- **Report template**: Structured dogfood report creates a reusable format for future ingestion audits

## What Was Challenging

- **Mathematical notation**: PyDMD documentation contains heavy LaTeX notation that the extraction pipeline needed to handle
- **API surface coverage**: Ensuring extracted knowledge covers the full PyDMD API required comprehensive documentation parsing

## Key Lessons

1. Dogfooding against real libraries reveals edge cases that unit tests miss
2. Tutorial replay is a powerful verification technique — it tests practical relevance, not just extraction accuracy
3. Scientific computing libraries have dense mathematical content that pushes extraction pipelines
