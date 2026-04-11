---
name: ffmpeg-media
description: FFmpeg media processing — video/audio conversion, trimming, encoding, filters, streaming. CLI and ffmpeg.wasm patterns.
activationKeywords:
  - ffmpeg
  - video
  - audio
  - transcode
  - encode
  - codec
  - h264
  - h265
  - hevc
  - webm
  - mp4
  - mkv
  - wav
  - mp3
  - aac
  - opus
  - thumbnail
  - waveform
  - concat
  - trim
  - crop
  - scale
  - filter
  - subtitle
  - hls
  - dash
  - streaming
type: skill
category: media
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-10
first_path: examples/skills/ffmpeg-media
superseded_by: null
---
# FFmpeg Media Processing Skill

*Dedicated to [sudokku](https://github.com/sudokku), creator of [micro-ffmpeg](https://github.com/sudokku/micro-ffmpeg) — the in-browser video editor that proved ffmpeg.wasm is production-ready. Built in 2 days, 2,489 LOC, 93 commits. The patterns in this skill are drawn from that work.*

Expert-level ffmpeg command construction, media pipeline design, and ffmpeg.wasm integration patterns. Covers CLI ffmpeg, Node.js ffmpeg bindings, and browser-side ffmpeg.wasm.

## Core Principle

> Build the filter graph first, then wrap it in the ffmpeg command. Never guess at flags — construct from codec specs.

## Quick Reference

### Probe a File
```bash
# Full probe (JSON output)
ffprobe -v quiet -print_format json -show_format -show_streams input.mp4

# Quick summary
ffprobe -v error -show_entries format=duration,bit_rate -show_entries stream=codec_name,width,height,r_frame_rate input.mp4
```

### Common Conversions
```bash
# MP4 (H.264 + AAC) — universal compatibility
ffmpeg -i input.mkv -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k output.mp4

# WebM (VP9 + Opus) — web-optimized, smaller files
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 128k output.webm

# H.265/HEVC — 50% smaller than H.264 at same quality
ffmpeg -i input.mp4 -c:v libx265 -preset medium -crf 28 -c:a aac -b:a 128k output.mp4

# AV1 — best compression, slow encoding
ffmpeg -i input.mp4 -c:v libaom-av1 -crf 30 -b:v 0 -c:a libopus output.mkv

# Audio only (MP3)
ffmpeg -i input.mp4 -vn -c:a libmp3lame -q:a 2 output.mp3

# Audio only (high quality FLAC)
ffmpeg -i input.wav -c:a flac output.flac
```

### Trim / Cut
```bash
# Trim from 00:01:30 for 60 seconds (fast, no re-encode)
ffmpeg -ss 00:01:30 -i input.mp4 -t 60 -c copy output.mp4

# Trim with re-encode (frame-accurate)
ffmpeg -i input.mp4 -ss 00:01:30 -to 00:02:30 -c:v libx264 -c:a aac output.mp4
```

### Scale / Resize
```bash
# Scale to 1280x720 (maintain aspect ratio)
ffmpeg -i input.mp4 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1" output.mp4

# Scale to 50%
ffmpeg -i input.mp4 -vf "scale=iw/2:ih/2" output.mp4

# Scale for social media (vertical 9:16)
ffmpeg -i input.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" output.mp4
```

### Filters
```bash
# Blur
ffmpeg -i input.mp4 -vf "boxblur=5:1" output.mp4

# Brightness/Contrast/Saturation
ffmpeg -i input.mp4 -vf "eq=brightness=0.1:contrast=1.2:saturation=1.3" output.mp4

# Speed up 2x (video + audio)
ffmpeg -i input.mp4 -vf "setpts=0.5*PTS" -af "atempo=2.0" output.mp4

# Slow down 0.5x
ffmpeg -i input.mp4 -vf "setpts=2.0*PTS" -af "atempo=0.5" output.mp4

# Rotate 90 degrees clockwise
ffmpeg -i input.mp4 -vf "transpose=1" output.mp4

# Crop (center crop to 640x480)
ffmpeg -i input.mp4 -vf "crop=640:480" output.mp4

# Overlay watermark
ffmpeg -i input.mp4 -i watermark.png -filter_complex "overlay=W-w-10:H-h-10" output.mp4

# Text overlay
ffmpeg -i input.mp4 -vf "drawtext=text='Title':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=50" output.mp4
```

### Concatenation
```bash
# Create file list
echo "file 'clip1.mp4'" > list.txt
echo "file 'clip2.mp4'" >> list.txt
echo "file 'clip3.mp4'" >> list.txt

# Concat (same codec — fast)
ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4

# Concat (different codecs — re-encode)
ffmpeg -f concat -safe 0 -i list.txt -c:v libx264 -c:a aac output.mp4
```

### Thumbnails / Stills
```bash
# Single frame at 5 seconds
ffmpeg -i input.mp4 -ss 00:00:05 -frames:v 1 thumb.jpg

# Thumbnail grid (4x4)
ffmpeg -i input.mp4 -vf "select=not(mod(n\,300)),scale=320:180,tile=4x4" -frames:v 1 grid.jpg

# Extract frame every N seconds
ffmpeg -i input.mp4 -vf "fps=1/10" frames/frame_%04d.jpg
```

### Audio Waveform Visualization
```bash
# PNG waveform
ffmpeg -i input.mp3 -filter_complex "showwavespic=s=1920x200:colors=white" -frames:v 1 waveform.png

# Video waveform
ffmpeg -i input.mp3 -filter_complex "showwaves=s=1280x720:mode=line:colors=white" waveform.mp4
```

### Streaming (HLS/DASH)
```bash
# HLS output (adaptive bitrate)
ffmpeg -i input.mp4 -c:v libx264 -c:a aac \
  -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename "segment_%03d.ts" playlist.m3u8

# Multiple quality HLS
ffmpeg -i input.mp4 \
  -map 0:v -map 0:a -map 0:v -map 0:a \
  -c:v libx264 -c:a aac \
  -b:v:0 5M -s:v:0 1920x1080 \
  -b:v:1 1M -s:v:1 640x360 \
  -var_stream_map "v:0,a:0 v:1,a:1" \
  -hls_time 6 -hls_playlist_type vod \
  -master_pl_name master.m3u8 \
  -hls_segment_filename "v%v/seg_%03d.ts" "v%v/playlist.m3u8"
```

### Subtitles
```bash
# Burn subtitles into video
ffmpeg -i input.mp4 -vf "subtitles=subs.srt" output.mp4

# Extract subtitles
ffmpeg -i input.mkv -map 0:s:0 subs.srt
```

## ffmpeg.wasm Integration (Browser)

### Setup (from micro-ffmpeg pattern)
```typescript
// ffmpegSingleton.ts — main-thread singleton (no Comlink)
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  
  await ffmpeg.load({
    coreURL: await toBlobURL('/ffmpeg-core.js', 'text/javascript'),
    wasmURL: await toBlobURL('/ffmpeg-core.wasm', 'application/wasm'),
  });
  
  return ffmpeg;
}

// Usage
const ff = await getFFmpeg();
await ff.writeFile('input.mp4', await fetchFile(file));
await ff.exec(['-i', 'input.mp4', '-vf', 'scale=640:360', 'output.mp4']);
const data = await ff.readFile('output.mp4');
```

### Progress Tracking
```typescript
ff.on('progress', ({ progress, time }) => {
  console.log(`${Math.round(progress * 100)}% (${time}μs)`);
});
```

### Extract Thumbnails (Browser)
```typescript
async function extractThumbnail(file: File, timeSeconds: number): Promise<Blob> {
  const ff = await getFFmpeg();
  await ff.writeFile('input', await fetchFile(file));
  await ff.exec([
    '-i', 'input',
    '-ss', String(timeSeconds),
    '-frames:v', '1',
    '-f', 'image2',
    'thumb.jpg'
  ]);
  const data = await ff.readFile('thumb.jpg');
  return new Blob([data], { type: 'image/jpeg' });
}
```

## Codec Reference

| Codec | Use Case | Quality/Size | Speed |
|-------|----------|-------------|-------|
| H.264 (libx264) | Universal playback | Good/Medium | Fast |
| H.265 (libx265) | Storage, streaming | Better/Small | Slow |
| VP9 (libvpx-vp9) | Web delivery | Better/Small | Slow |
| AV1 (libaom-av1) | Archive, future web | Best/Smallest | Very slow |
| ProRes (prores_ks) | Editing intermediate | Lossless/Huge | Fast |
| AAC | Universal audio | Good | Fast |
| Opus | Web audio, VoIP | Better at low bitrates | Fast |
| FLAC | Lossless audio | Lossless/Large | Fast |

## CRF Quality Guide (H.264)

| CRF | Quality | Use Case |
|-----|---------|----------|
| 0 | Lossless | Archival |
| 18 | Visually lossless | High-quality master |
| 23 | Default | Good balance |
| 28 | Lower quality | Web/mobile delivery |
| 35+ | Very compressed | Thumbnails, previews |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `-ss` after `-i` (slow seek) | Put `-ss` before `-i` for fast seek |
| Missing `-movflags +faststart` | Add for web-playable MP4 |
| Using `-b:v` with CRF | CRF and bitrate are mutually exclusive |
| Forgetting `-pix_fmt yuv420p` | Required for broad compatibility |
| Concat without same codecs | Re-encode or use filter_complex |
| Not setting thread count | Add `-threads 0` for auto |

## Gource Pipeline Integration

The `gource-visualizer` skill (`skills/gource-visualizer/`) produces PPM frame streams that pipe through ffmpeg. Key patterns:

```bash
# Standard Gource → ffmpeg pipeline (headless with xvfb)
xvfb-run -a gource --output-ppm-stream - \
  --viewport 1920x1080 -s 0.5 --auto-skip-seconds 1 \
  --stop-at-end /path/to/repo | \
ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - \
  -vcodec libx264 -preset medium -crf 18 \
  -pix_fmt yuv420p -movflags +faststart output.mp4

# Cinematic preset (from skills/gource-visualizer/configs/preset-cinematic.conf)
xvfb-run -a gource --load-config skills/gource-visualizer/configs/preset-cinematic.conf \
  --output-ppm-stream - /path/to/repo | \
ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - \
  -vcodec libx264 -preset slow -crf 15 \
  -pix_fmt yuv420p -movflags +faststart cinematic.mp4

# Multi-repo combined visualization
gource --output-custom-log - /repo1 | sed "s|/|/repo1/|2" > /tmp/combined.log
gource --output-custom-log - /repo2 | sed "s|/|/repo2/|2" >> /tmp/combined.log
sort -t\| -k1,1 /tmp/combined.log > /tmp/sorted.log
xvfb-run -a gource /tmp/sorted.log --output-ppm-stream - | \
ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - \
  -vcodec libx264 -preset medium -crf 18 -pix_fmt yuv420p output.mp4
```

**Gource agents:** `skills/gource-visualizer/agents/` — installer, log-generator, renderer, deliverer.
**Presets:** quick (preview), standard (demo), cinematic (publication), thumbnail (still frame).

## When This Skill Activates

- Building ffmpeg commands for media processing
- Video/audio conversion, trimming, concatenation
- Generating thumbnails, waveforms, previews
- Building streaming pipelines (HLS/DASH)
- Working with ffmpeg.wasm in browser contexts
- Codec selection and quality optimization
- Filter graph construction
- Subtitle handling
- Gource visualization pipeline (PPM → MP4)
- Repository history videos
