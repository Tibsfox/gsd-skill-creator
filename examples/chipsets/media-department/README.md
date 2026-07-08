---
name: media-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-07-06
first_path: examples/chipsets/media-department/README.md
description: >
  Coordinated media production department -- six named agents, five knowledge
  skills, two teams. A production/tooling instantiation of the department
  template pattern covering audio, video, ffmpeg, document authoring, and
  publishing.
superseded_by: null
---

# Media Department

## 1. What is the Media Department?

The Media Department chipset is a coordinated set of specialist agents, domain
skills, and pre-composed teams that together provide structured media
**production** support across audio engineering, audio/video studio work,
FFmpeg processing, LaTeX document authoring, and the markdown->HTML/PDF publish
pipeline. Unlike the academic-persona departments (art, mathematics, chemistry,
...), this is a production/tooling department: its agents build and run real
media pipelines rather than teach a subject. Incoming requests are classified
by a router agent (audio-engineer), dispatched to the appropriate specialist,
and all work products are persisted as Grove records linked to the college
media department concept graph.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/media-department .claude/chipsets/media-department
```

The chipset is activated when any of the five skill trigger patterns match an
incoming query. The audio-engineer (the router agent) classifies the query
domain and dispatches to the appropriate specialist agent. No explicit
activation command is needed -- the skill-integration layer loads the chipset
based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/media-department/chipset.yaml', 'utf8')).name)"
# Expected output: media-department-v1.0
```

## 3. Agent Roster

Six agents form the department, running in a router topology. Five run on Sonnet
(for throughput-oriented production work), one on Haiku (for fast, well-bounded
audio analysis).

| Name            | Role                                                                                     | Model  | Tools                        |
|-----------------|------------------------------------------------------------------------------------------|--------|------------------------------|
| audio-engineer  | Department chair -- routing, synthesis, mastering/mixing, cross-cutting document authoring and publish coordination | sonnet | Bash, Read, Write, Glob, Grep |
| ffmpeg-processor| Media processor -- builds and executes ffmpeg commands for conversion, trimming, thumbnails, waveforms, streaming | sonnet | Bash, Read, Write, Glob, Grep |
| music-analyzer  | Audio analyst -- BPM/key detection, loudness measurement, spectrum analysis, waveform generation, fingerprinting | haiku  | Bash, Read, Write            |
| podcast-producer| Podcast producer -- recording, editing, mixing, mastering, ID3 tagging, chapter marks, RSS generation | sonnet | Bash, Read, Write, Glob      |
| stream-producer | Stream producer -- OBS-style capture, RTMP streaming, screencast production, presentation recording | sonnet | Bash, Read, Write            |
| video-editor    | Video editor -- trimming, transitions, color grading, titles, timeline assembly, YouTube-ready export | sonnet | Bash, Read, Write, Glob, Grep |

The audio-engineer is the CAPCOM (single point of contact for the user). All
other agents receive dispatched subtasks and return results through the
audio-engineer.

## 4. Skill Inventory

Five skills provide domain knowledge that agents draw on during execution.

| Skill             | Domain | Trigger Patterns                                                          | Agent Affinity                                  |
|-------------------|--------|---------------------------------------------------------------------------|-------------------------------------------------|
| audio-engineering | media  | audio, mastering, mixing, EQ, compression, loudness, LUFS, podcast, spectrum, synthesis | audio-engineer, music-analyzer, podcast-producer |
| av-studio         | media  | video editing, color grading, motion graphics, compositing, green screen, screen recording, OBS, streaming, YouTube publish, timeline | video-editor, stream-producer |
| ffmpeg-media      | media  | ffmpeg, transcode, encode, codec, h264, h265, webm, mp4, aac, opus         | ffmpeg-processor, video-editor                  |
| latex-authoring   | media  | latex, tex, arxiv, overleaf, bibtex, biblatex, xelatex, beamer, tikz, document class | audio-engineer                        |
| publish-pipeline  | media  | publish, pandoc, markdown to pdf, HTML build, FTP sync, deploy, xelatex template, branded output, build chain | podcast-producer, audio-engineer |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to more
than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                 | Agents                                                                     | Use When                                                    |
|----------------------|----------------------------------------------------------------------------|-------------------------------------------------------------|
| media-production-team| audio-engineer, ffmpeg-processor, music-analyzer, podcast-producer, stream-producer, video-editor | Multi-format production spanning audio, video, streaming, and publishing |
| av-post-team         | video-editor, stream-producer, ffmpeg-processor, audio-engineer            | Editing, color grading, encoding, and export of captured footage and audio |

**media-production-team** is the full department. Use it for productions that
span multiple media formats or require the broadest set of production
capabilities.

**av-post-team** is the finishing pipeline. Use it when the primary goal is
post-production and export of already-captured audio and video footage.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`media-department` namespace. Five record types are defined:

| Record Type       | Description                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| MediaAsset        | Source or rendered media file with format, codec, and duration metadata     |
| RenderJob         | Encode/transcode/render job specification with settings and result          |
| AudioAnalysis     | BPM, key, loudness (LUFS), and spectrum measurement result                  |
| PublishArtifact   | Built and deployed HTML/PDF document or media output                        |
| ProductionSession | Session log linking deliverables to interaction context                     |

Records are content-addressed and immutable once written. ProductionSession
records link all deliverables from a single interaction, providing an audit
trail from request to result.

## 7. College Integration

The chipset connects to the college media department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Session generation**: The chipset can generate practice sessions based on
  produced artifacts and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed productions update progress along
  college-defined pathways.
- **Five wings** map to the college media department structure:
  1. Audio Engineering
  2. Video Production
  3. Media Processing
  4. Document Authoring
  5. Publishing & Distribution

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The media department follows the same department template pattern as the other
department chipsets. The `customization` block in `chipset.yaml` marks it as
forkable: agents can be renamed, skills replaced, Grove types swapped, and the
college department remapped. To create a production department for another
domain:

- **Agent names** describe production roles (audio-engineer, video-editor, ...)
  rather than historical figures -- this is a tooling department, so roles are
  functional. Replace with the target domain's production roles.
- **Skills** cover the five wings of the college media department. Replace with
  the target domain's wings.
- **Grove record types** reflect media-specific outputs (assets, render jobs,
  analyses, publish artifacts). Replace with domain-appropriate types.
- **Model assignment** follows task shape: throughput-oriented production work
  gets Sonnet; fast, well-bounded analysis (music-analyzer) gets Haiku.

## 9. Architecture Notes

### Why these six agents

The six agents cover the five wings of the college media department, with the
audio-engineer spanning both Audio Engineering and the cross-cutting Document
Authoring / Publishing & Distribution wings:

| Wing                        | Primary agent(s)                    |
|-----------------------------|-------------------------------------|
| Audio Engineering           | audio-engineer, music-analyzer, podcast-producer |
| Video Production            | video-editor, stream-producer       |
| Media Processing            | ffmpeg-processor                    |
| Document Authoring          | audio-engineer                      |
| Publishing & Distribution   | podcast-producer, audio-engineer    |

### Why 5 Sonnet / 1 Haiku

Model assignment follows the work shape of each role:

- **Sonnet agents** (audio-engineer, ffmpeg-processor, podcast-producer,
  stream-producer, video-editor): production work benefits from Sonnet's balance
  of capability and throughput -- building ffmpeg pipelines, assembling
  timelines, and coordinating publish chains.
- **Haiku agent** (music-analyzer): BPM/key detection, loudness measurement, and
  spectrum analysis are well-bounded analytical tasks where fast turnaround
  matters more than depth.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only the audio-engineer speaks
to the user. Other agents communicate through the audio-engineer via internal
dispatch. This is enforced by the `is_capcom: true` flag -- only one agent in
the chipset may carry it, and the `router_agent_is_capcom` evaluation gate
verifies the router and CAPCOM are the same agent.

### Relationship to other departments

The media department is a production/tooling counterpart to the academic-persona
departments:

- **Art**: Shared concerns of composition, color, and visual design (video
  editing and color grading overlap with the art department's compositional
  skills).
- **Music**: Audio analysis (BPM, key, loudness) overlaps with music theory and
  performance concepts.
- **Publishing**: The LaTeX authoring and publish-pipeline skills serve any
  department that needs branded HTML/PDF output.
