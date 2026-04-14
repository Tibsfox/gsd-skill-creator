# Pic2Html

Reverse-engineering artifacts from a 2007 Visual Basic image-to-HTML
conversion tool originally authored while Foxy was at Philips Semiconductor
(foxglove@philips.com, June 2007).

## Files

- `Pic2Html-reconstructed.vb` — reconstructed Visual Basic source, recovered
  from the original binary (`Pic2Html.exe`).
- `pic2html.py` — Python 3 reconstruction of the same algorithm, runnable
  today. See `src/cli/commands/pic2html.ts` for the TypeScript port inside
  the main project.

## History

Pic2Html was a small utility for converting raster images into HTML tables
of coloured cells — a pre-CSS3 approach to rendering pixel art in a web
page. The original binary was recovered during the Artemis II mission
research work on rev-eng practices.

## Status

Historical artifact — not part of the active build. The TypeScript port
at `src/cli/commands/pic2html.ts` is the maintained implementation.
