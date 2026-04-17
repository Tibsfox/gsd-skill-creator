# Retrospective — v1.49.203

## Lessons Learned

1. **Parallel research fleets scale.** 5 research agents running simultaneously produced 107K words of sourced material. The furry arts doc (14,154 words) was the most thorough because the agent had the clearest audience context.
2. **History woven through > history front-loaded.** The decision to spread historical context through every chapter (via callout boxes rather than a standalone history chapter) makes the book readable cover-to-cover instead of reference-only.
3. **Furry arts as primary use case, not appendix.** Framing through the community's lens produced better, more practical content than treating furry workflows as a special case of general 3D.
4. **The mission pack pattern works for books.** The original 31-page mission pack (vision + research + execution plan) provided the structure that 10 research agents and 6 writing agents could execute against in parallel.
5. **LaTeX chapter splitting is essential at scale.** Moving from one monolithic .tex to \input{chapters/ch0X.tex} kept the build manageable and enabled parallel writing.
6. **FTP path mapping matters.** The FTP root maps to /Research/ on the web, not /. First upload went to /Research/BLN (double-nested, 404). Fixed to /BLN.
