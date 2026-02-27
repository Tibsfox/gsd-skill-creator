# FFmpeg Pipeline Reference

How `render-video.sh` encodes Gource output into MP4 and WebM video files.

## How It Works

Gource renders repository history as an animated visualization using OpenGL, then writes raw PPM frames to stdout. FFmpeg reads those frames from stdin and encodes them into a compressed video file. The pipeline looks like:

```
gource [options] -o - <repo> | ffmpeg -y -r <fps> -f image2pipe -vcodec ppm -i - [encoding options] output.mp4
```

Key ffmpeg input flags:

| Flag | Purpose |
|------|---------|
| `-y` | Overwrite output file without prompting |
| `-r <fps>` | Input framerate (must match Gource `output-framerate`) |
| `-f image2pipe` | Read raw image frames from a pipe |
| `-vcodec ppm` | Input codec is PPM (portable pixmap) |
| `-i -` | Read from stdin |

## MP4 Encoding (H.264)

The default format. Uses libx264 for broad compatibility.

```bash
ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - \
  -vcodec libx264 -preset medium -pix_fmt yuv420p \
  -crf 18 -threads 0 -bf 0 output.mp4
```

| Flag | Purpose | Notes |
|------|---------|-------|
| `-vcodec libx264` | H.264 encoder | Requires ffmpeg built with libx264 |
| `-preset medium` | Encoding speed/quality tradeoff | Options: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow. Slower = smaller file, same quality |
| `-pix_fmt yuv420p` | Pixel format for compatibility | Required for playback on most devices, browsers, and players. Without this, some players show green/corrupt video |
| `-crf 18` | Constant Rate Factor (quality) | Range: 0 (lossless) to 51 (worst). 18 = visually lossless. 23 = default. 28 = acceptable for previews |
| `-threads 0` | Auto-detect CPU threads | Uses all available cores |
| `-bf 0` | No B-frames | Reduces encoding complexity and latency. Slight file size increase |

### CRF Guidelines

| CRF | Quality | Use Case |
|-----|---------|----------|
| 15-17 | Near-lossless | Archival, source material |
| 18-20 | High quality | Presentations, showcases |
| 21-23 | Good quality | General use, sharing |
| 24-28 | Acceptable | Quick previews, drafts |

## WebM Encoding (VP9)

Open format, good for web embedding. Larger files than H.264 at equivalent quality.

```bash
ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - \
  -vcodec libvpx -b:v 10000K output.webm
```

| Flag | Purpose | Notes |
|------|---------|-------|
| `-vcodec libvpx` | VP9 encoder | Requires ffmpeg built with libvpx |
| `-b:v 10000K` | Target video bitrate | 10 Mbps gives high quality for 1080p60. Adjust: 5000K for 720p, 15000K for 1440p |

## Resolution and Framerate

Gource output resolution is set by the `viewport` config option in preset `.conf` files. The `output-framerate` setting controls how many PPM frames per second Gource writes.

The ffmpeg `-r` flag **must match** the Gource framerate to avoid speed drift:

| Preset | Viewport | FPS | Notes |
|--------|----------|-----|-------|
| quick | 1280x720 | 30 | Lower resolution for speed |
| standard | 1920x1080 | 60 | Full HD |
| cinematic | 1920x1080 | 60 | Same resolution, richer effects |
| thumbnail | 1920x1080 | -- | Single frame, no FPS needed |

If Gource outputs at 60fps but ffmpeg reads at 30fps, the video will play at half speed.

## Thumbnail Extraction

Extract a single frame from an existing video:

```bash
ffmpeg -y -i output.mp4 -vf "select=eq(n\,0)" -frames:v 1 thumbnail.png
```

| Flag | Purpose |
|------|---------|
| `-vf "select=eq(n\,0)"` | Select frame number 0 (first frame) |
| `-frames:v 1` | Output exactly 1 frame |

To extract a frame from the middle of the video:

```bash
ffmpeg -y -ss 00:01:30 -i output.mp4 -frames:v 1 thumbnail.png
```

## Troubleshooting

### "Unknown encoder 'libx264'"

FFmpeg was built without H.264 support. Fix:

```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# Verify
ffmpeg -codecs 2>/dev/null | grep libx264
```

### "Pipe broken" or "Broken pipe"

Gource crashed before ffmpeg finished reading. Common causes:
- Repository path is wrong or has no commits
- OpenGL initialization failed (headless without xvfb)
- Gource ran out of memory on very large repos

Check: run `gource <repo>` standalone first to verify it works.

### "yuv420p not supported"

The libx264 build may not support the pixel format. Verify:

```bash
ffmpeg -h encoder=libx264 2>/dev/null | grep pix_fmts
```

If yuv420p is not listed, try building ffmpeg from source with full x264 support.

### Output file is 0 bytes

The pipeline failed silently. Run the Gource and ffmpeg commands separately to isolate which stage fails:

```bash
# Test Gource alone (writes raw PPM)
gource --load-config preset.conf -o frames.ppm .

# Test ffmpeg alone
ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i frames.ppm output.mp4
```

## Advanced

### Two-Pass Encoding (smaller files)

Two-pass encoding analyzes the video first, then encodes with optimal bitrate allocation:

```bash
# Pass 1 (analysis)
gource [options] -o - . | ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - \
  -vcodec libx264 -preset medium -b:v 5000K -pass 1 -f mp4 /dev/null

# Pass 2 (encode)
gource [options] -o - . | ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - \
  -vcodec libx264 -preset medium -b:v 5000K -pass 2 output.mp4
```

Note: requires running Gource twice. Only worthwhile for very large renders where file size matters.

### Audio Overlay

Add background music to a render:

```bash
ffmpeg -y -i output.mp4 -i music.mp3 \
  -c:v copy -c:a aac -shortest combined.mp4
```

| Flag | Purpose |
|------|---------|
| `-c:v copy` | Copy video stream without re-encoding |
| `-c:a aac` | Encode audio as AAC |
| `-shortest` | Stop when the shortest stream ends |

### Custom Resolution

Override preset viewport by setting resolution in the Gource command:

```bash
gource --viewport 3840x2160 --load-config preset.conf -o - . | \
  ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - \
  -vcodec libx264 -preset slow -crf 16 output-4k.mp4
```

Use `-preset slow` for 4K to get better compression at high resolution.
