#!/usr/bin/env python3
"""
Generate favicon.png for Silent app.
Requires: pip install pillow
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

# Configuration
WHITE_BG = (255, 255, 255)  # White background
DARK_BLUE = (44, 95, 190)  # Dark blue for Z letters
GLOBE_BLUE = (66, 133, 244)  # Google blue for globe
WHITE = (255, 255, 255)  # White for details

SIZE = 256
PUBLIC_DIR = Path("public")


def load_font(size):
    """Load system font with fallback"""
    for path in [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]:
        try:
            return ImageFont.truetype(path, size)
        except:
            pass
    return ImageFont.load_default()


def create_favicon():
    """Create favicon with globe design"""
    print("Creating favicon (256x256)...")

    img = Image.new("RGBA", (SIZE, SIZE), WHITE_BG)
    draw = ImageDraw.Draw(img)

    center = SIZE // 2

    # Load fonts for Z letters
    font_large = load_font(90)
    font_medium = load_font(65)
    font_small = load_font(45)

    # Large Z (top-right)
    draw.text((center + 50, center - 50), "Z", fill=DARK_BLUE, font=font_large, anchor="mm")

    # Medium Z (center)
    draw.text((center, center), "Z", fill=DARK_BLUE, font=font_medium, anchor="mm")

    # Small Z (bottom-left)
    draw.text((center - 50, center + 50), "Z", fill=DARK_BLUE, font=font_small, anchor="mm")

    # Globe icon (center-right)
    globe_x = center + 50
    globe_y = center + 30
    globe_radius = 20

    # Globe main circle (filled)
    draw.ellipse(
        [(globe_x - globe_radius, globe_y - globe_radius),
         (globe_x + globe_radius, globe_y + globe_radius)],
        fill=GLOBE_BLUE,
    )

    # Equatorial line (white)
    draw.ellipse(
        [(globe_x - globe_radius + 2, globe_y - 3),
         (globe_x + globe_radius - 2, globe_y + 3)],
        fill=WHITE,
    )

    # Meridian arc (white vertical ellipse)
    draw.arc(
        [(globe_x - 8, globe_y - globe_radius),
         (globe_x + 8, globe_y + globe_radius)],
        start=0,
        end=180,
        fill=WHITE,
        width=2,
    )

    # Highlight (white circle, top-left for 3D effect)
    highlight_radius = 4
    draw.ellipse(
        [(globe_x - globe_radius + 6, globe_y - globe_radius + 6),
         (globe_x - globe_radius + 6 + highlight_radius, globe_y - globe_radius + 6 + highlight_radius)],
        fill=WHITE,
    )

    # Orbital ring around globe (blue ellipse, tilted)
    ring_offset = 10
    ring_width = 3

    # Draw tilted ellipse using arc
    bbox = [
        (globe_x - globe_radius - ring_offset, globe_y - globe_radius - ring_offset),
        (globe_x + globe_radius + ring_offset, globe_y + globe_radius + ring_offset)
    ]
    draw.ellipse(bbox, outline=GLOBE_BLUE, width=ring_width)

    return img


def main():
    print("Generating favicon for Silent app...\n")

    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("[ERROR] Pillow not installed!")
        print("\nInstall with: pip install pillow")
        return 1

    PUBLIC_DIR.mkdir(exist_ok=True)

    # Create favicon
    favicon = create_favicon()
    favicon_path = PUBLIC_DIR / "favicon.png"
    favicon.save(favicon_path, "PNG", optimize=True)
    size = favicon_path.stat().st_size / 1024
    print(f"[OK] {favicon_path} ({size:.1f} KB)")

    print("\n[SUCCESS] Favicon generated successfully!")

    return 0


if __name__ == "__main__":
    exit(main())
