#!/usr/bin/env python3
"""
pic2html — Convert images to HTML table art

Modern recreation of foxglove's 2007 Pic2Html.exe
Takes an input image and obfuscates it into an HTML table
where each pixel (or block of pixels) becomes a colored <td>.

Usage:
  python3 pic2html.py image.png                     # 1px cells, full color
  python3 pic2html.py image.png -s 24               # 24px cells (like AAAAAAAA.html)
  python3 pic2html.py image.png -s 4 -o output.html # 4px cells, named output
  python3 pic2html.py image.png --grayscale          # 16-level grayscale (like email.html)
  python3 pic2html.py image.png --grayscale -l 256   # 256-level grayscale
  python3 pic2html.py image.png --max-width 120      # scale down to 120 cells wide
  python3 pic2html.py image.png --quantize 16        # reduce to 16 colors
"""
import argparse, sys, os
from PIL import Image


def quantize_color(r, g, b, levels):
    """Snap RGB values to nearest level in a reduced palette."""
    step = 256 // levels
    r = (r // step) * step + step // 2
    g = (g // step) * step + step // 2
    b = (b // step) * step + step // 2
    return min(r, 255), min(g, 255), min(b, 255)


def to_grayscale_hex(r, g, b, levels):
    """Convert RGB to grayscale with N levels, return as hex pair repeated 3x."""
    gray = int(0.299 * r + 0.587 * g + 0.114 * b)
    step = 256 // levels
    gray = (gray // step) * step
    gray = min(gray, 255)
    # Map to the original Pic2Html pattern: 00, 11, 22, ... ff
    if levels <= 16:
        nibble = gray // 16
        val = nibble * 17  # 0→00, 1→11, 2→22, ... f→ff
    else:
        val = gray
    return f"{val:02x}{val:02x}{val:02x}"


def convert(image_path, cell_size=1, output=None, grayscale=False,
            gray_levels=16, max_width=None, quantize=None, bg="000000"):
    img = Image.open(image_path).convert("RGB")

    # Scale down if max_width specified
    if max_width and img.width > max_width:
        ratio = max_width / img.width
        new_h = int(img.height * ratio)
        img = img.resize((max_width, new_h), Image.LANCZOS)

    w, h = img.size
    pixels = img.load()

    if output is None:
        base = os.path.splitext(os.path.basename(image_path))[0]
        output = f"{base}.html"

    lines = []
    lines.append("<html>")
    lines.append(f"<body bgcolor={bg}>")
    lines.append(f"<table border=0 cellpadding=0 cellspacing=0>")

    for y in range(h):
        if cell_size == 1:
            lines.append(f"<tr hight={cell_size}>")
        else:
            lines.append(f"<tr height={cell_size}>")
        for x in range(w):
            r, g, b = pixels[x, y]

            if grayscale:
                hex_color = to_grayscale_hex(r, g, b, gray_levels)
            elif quantize:
                r, g, b = quantize_color(r, g, b, quantize)
                hex_color = f"{r:02x}{g:02x}{b:02x}"
            else:
                hex_color = f"{r:02x}{g:02x}{b:02x}"

            lines.append(f'<td width={cell_size} bgcolor="{hex_color}"></td>')

        lines.append("</tr>")

    lines.append("</table>")
    lines.append("</body>")
    lines.append("</html>")

    with open(output, "w") as f:
        f.write("\n".join(lines))

    unique_colors = set()
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            if grayscale:
                unique_colors.add(to_grayscale_hex(r, g, b, gray_levels))
            elif quantize:
                r, g, b = quantize_color(r, g, b, quantize)
                unique_colors.add(f"{r:02x}{g:02x}{b:02x}")
            else:
                unique_colors.add(f"{r:02x}{g:02x}{b:02x}")

    file_size = os.path.getsize(output)
    print(f"pic2html — {image_path}")
    print(f"  Grid: {w}x{h} ({w * h:,} cells)")
    print(f"  Cell size: {cell_size}px")
    print(f"  Render size: {w * cell_size}x{h * cell_size}px")
    print(f"  Colors: {len(unique_colors)}")
    print(f"  Mode: {'grayscale' if grayscale else 'quantized' if quantize else 'full color'}")
    print(f"  Output: {output} ({file_size:,} bytes)")


def main():
    parser = argparse.ArgumentParser(
        description="pic2html — Convert images to HTML table art",
        epilog="Recreation of foxglove's 2007 Pic2Html.exe")
    parser.add_argument("image", help="Input image file")
    parser.add_argument("-s", "--size", type=int, default=1,
                        help="Cell size in pixels (default: 1)")
    parser.add_argument("-o", "--output", help="Output HTML file")
    parser.add_argument("--grayscale", action="store_true",
                        help="Convert to grayscale (like email.html)")
    parser.add_argument("-l", "--levels", type=int, default=16,
                        help="Grayscale levels (default: 16)")
    parser.add_argument("--max-width", type=int,
                        help="Scale image down to this many cells wide")
    parser.add_argument("--quantize", type=int,
                        help="Reduce to N color levels per channel")
    parser.add_argument("--bg", default="000000",
                        help="Page background color (default: 000000)")
    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(f"Error: {args.image} not found")
        sys.exit(1)

    convert(args.image, cell_size=args.size, output=args.output,
            grayscale=args.grayscale, gray_levels=args.levels,
            max_width=args.max_width, quantize=args.quantize, bg=args.bg)


if __name__ == "__main__":
    main()
