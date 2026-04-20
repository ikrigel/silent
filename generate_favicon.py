#!/usr/bin/env python3
"""
Generate favicon.png for Silent app.
Requires: pip install pillow
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Configuration
WHITE_BG = (240, 240, 245)  # Light white background
BLUE = (66, 133, 244)  # Google blue for Z letters
BLUE_DARK = (52, 99, 199)  # Darker blue for phone

# Favicon size
SIZE = 256

PUBLIC_DIR = Path("public")


def create_favicon():
    """Create favicon with white background and blue ZZZ design"""
    print("Creating favicon (256x256)...")

    img = Image.new("RGBA", (SIZE, SIZE), WHITE_BG)
    draw = ImageDraw.Draw(img)

    center = SIZE // 2
    margin = 20

    # Draw three Z letters (descending size) in blue
    # Large Z (left)
    z1_x = center - 40
    z1_y = center + 20
    draw.line([(z1_x - 20, z1_y - 25), (z1_x + 20, z1_y - 25)], fill=BLUE, width=8)
    draw.line([(z1_x + 20, z1_y - 25), (z1_x - 20, z1_y)], fill=BLUE, width=8)
    draw.line([(z1_x - 20, z1_y), (z1_x + 20, z1_y)], fill=BLUE, width=8)

    # Medium Z (center)
    z2_x = center
    z2_y = center
    draw.line([(z2_x - 16, z2_y - 20), (z2_x + 16, z2_y - 20)], fill=BLUE, width=7)
    draw.line([(z2_x + 16, z2_y - 20), (z2_x - 16, z2_y)], fill=BLUE, width=7)
    draw.line([(z2_x - 16, z2_y), (z2_x + 16, z2_y)], fill=BLUE, width=7)

    # Small Z (right)
    z3_x = center + 40
    z3_y = center - 20
    draw.line([(z3_x - 12, z3_y - 15), (z3_x + 12, z3_y - 15)], fill=BLUE, width=6)
    draw.line([(z3_x + 12, z3_y - 15), (z3_x - 12, z3_y)], fill=BLUE, width=6)
    draw.line([(z3_x - 12, z3_y), (z3_x + 12, z3_y)], fill=BLUE, width=6)

    # Phone handset (bottom-right) in darker blue
    phone_x = SIZE - margin - 28
    phone_y = SIZE - margin - 35
    phone_w = 28
    phone_h = 35

    draw.rectangle(
        [(phone_x, phone_y), (phone_x + phone_w, phone_y + phone_h)],
        outline=BLUE_DARK,
        width=2,
    )

    draw.rectangle(
        [(phone_x + 3, phone_y + 5), (phone_x + phone_w - 3, phone_y + phone_h - 5)],
        outline=BLUE_DARK,
        width=1,
    )

    return img


def main():
    print("Generating favicon for Silent app...\n")

    # Check if PIL is installed
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("[ERROR] Pillow not installed!")
        print("\nInstall with: pip install pillow")
        return 1

    # Create public directory if needed
    PUBLIC_DIR.mkdir(exist_ok=True)

    # Create favicon
    favicon = create_favicon()
    favicon_path = PUBLIC_DIR / "favicon.png"
    favicon.save(favicon_path, "PNG", optimize=True)
    size = favicon_path.stat().st_size / 1024
    print(f"[OK] {favicon_path} ({size:.1f} KB)")

    print("\n[SUCCESS] Favicon generated successfully!")
    print("\nNext steps:")
    print("1. Update index.html line 5:")
    print('   <link rel="icon" href="/favicon.png" />')
    print("\n2. Commit changes:")
    print("   git add public/favicon.png")
    print('   git commit -m "chore: add teal favicon with ZZZ design"')
    print("\n3. The browser cache will be cleared automatically on next visit")

    return 0


if __name__ == "__main__":
    exit(main())
