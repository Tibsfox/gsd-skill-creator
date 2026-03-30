#!/bin/bash
# Pioneer 0 / Fireweed Animated Wallpaper
# Sets the desktop background to an animated GLSL shader
#
# Usage:
#   ./animated-wallpaper.sh                  # Run with defaults
#   ./animated-wallpaper.sh --mode meadow    # Only fireweed meadow
#   ./animated-wallpaper.sh --mode seeds     # Only seed dispersal
#   ./animated-wallpaper.sh --mode exhaust   # Only rocket exhaust
#   ./animated-wallpaper.sh --mode cycle     # Cycle all modes (default)
#
# Requirements:
#   - glslViewer (https://github.com/nickverlaan/glslViewer or patriciogonzalezvivo)
#   - xdotool (for window management)
#   - X11 (Wayland: use mpvpaper instead)
#
# GSD-OS Integration:
#   Register this script as a wallpaper source in the GSD-OS wallpaper registry.
#   The registry calls this script with --mode and handles lifecycle.
#
# Install glslViewer:
#   git clone https://github.com/nickverlaan/glslViewer
#   cd glslViewer && mkdir build && cd build && cmake .. && make && sudo make install

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHADER="$SCRIPT_DIR/pioneer0-screensaver.frag"

MODE="${1:-cycle}"

# Get screen resolution
RES=$(xdpyinfo 2>/dev/null | grep dimensions | awk '{print $2}')
WIDTH=$(echo "$RES" | cut -d'x' -f1)
HEIGHT=$(echo "$RES" | cut -d'x' -f2)

# Default to 1920x1080 if detection fails
WIDTH="${WIDTH:-1920}"
HEIGHT="${HEIGHT:-1080}"

echo "Pioneer 0 Animated Wallpaper"
echo "Resolution: ${WIDTH}x${HEIGHT}"
echo "Mode: $MODE"
echo "Shader: $SHADER"
echo ""
echo "Press Ctrl+C to stop"

# Method 1: glslViewer with root window (X11)
if command -v glslViewer &>/dev/null; then
    glslViewer "$SHADER" \
        -w "$WIDTH" -h "$HEIGHT" \
        --headless \
        -e "u_resolution,$WIDTH,$HEIGHT" \
        2>/dev/null &
    VIEWER_PID=$!

    # Embed into root window using xdotool
    sleep 1
    if command -v xdotool &>/dev/null; then
        WID=$(xdotool search --pid "$VIEWER_PID" 2>/dev/null | head -1)
        if [ -n "$WID" ]; then
            xdotool set_window --name "Pioneer 0 Wallpaper" "$WID"
        fi
    fi

    echo "Wallpaper running (PID: $VIEWER_PID)"
    wait "$VIEWER_PID"
else
    echo "Error: glslViewer not found."
    echo "Install: https://github.com/nickverlaan/glslViewer"
    echo ""
    echo "Alternative: render to video and use mpvpaper (Wayland) or xwinwrap (X11)"
    echo "  glslViewer $SHADER -w $WIDTH -h $HEIGHT --headless -e 'record,pioneer0.mp4,80'"
    echo "  mpvpaper '*' pioneer0.mp4 --loop"
    exit 1
fi
