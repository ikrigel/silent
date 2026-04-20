#!/usr/bin/env python3
"""
Generate favicon.png for Silent app.
Requires: pip install pillow
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Configuration
WHITE_BG = (255, 255, 255)  # White background
TEAL = (38, 166, 154)  # Teal #26A69A for ZZZ and phone swoosh
PHONE_COLOR = (60, 60, 60)  # Dark gray for phone

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
    draw.line([(z1_x - 20, z1_y - 25), (z1_x + 20, z1_y - 25)], fill=TEAL, width=8)
    draw.line([(z1_x + 20, z1_y - 25), (z1_x - 20, z1_y)], fill=TEAL, width=8)
    draw.line([(z1_x - 20, z1_y), (z1_x + 20, z1_y)], fill=TEAL, width=8)

    # Medium Z (center)
    z2_x = center
    z2_y = center
    draw.line([(z2_x - 16, z2_y - 20), (z2_x + 16, z2_y - 20)], fill=TEAL, width=7)
    draw.line([(z2_x + 16, z2_y - 20), (z2_x - 16, z2_y)], fill=TEAL, width=7)
    draw.line([(z2_x - 16, z2_y), (z2_x + 16, z2_y)], fill=TEAL, width=7)

    # Small Z (right)
    z3_x = center + 40
    z3_y = center - 20
    draw.line([(z3_x - 12, z3_y - 15), (z3_x + 12, z3_y - 15)], fill=TEAL, width=6)
    draw.line([(z3_x + 12, z3_y - 15), (z3_x - 12, z3_y)], fill=TEAL, width=6)
    draw.line([(z3_x - 12, z3_y), (z3_x + 12, z3_y)], fill=TEAL, width=6)

    # Phone handset (bottom-right) with teal swoosh
    phone_x = SIZE - margin - 28
    phone_y = SIZE - margin - 35
    phone_w = 28
    phone_h = 35

    # Draw dark phone
    draw.rounded_rectangle(
        [(phone_x + 2, phone_y + 2), (phone_x + phone_w - 2, phone_y + phone_h - 2)],
        radius=2,
        fill=PHONE_COLOR,
    )

    # Phone screen/display
    draw.rounded_rectangle(
        [(phone_x + 4, phone_y + 5), (phone_x + phone_w - 4, phone_y + phone_h - 5)],
        radius=1,
        fill=(30, 30, 30),
    )

    # Teal curved swoosh around phone (large curved line)
    # Draw thick curved line using arc
    draw.arc(
        [(phone_x - 10, phone_y - 10), (phone_x + phone_w + 10, phone_y + phone_h + 10)],
        start=45,
        end=315,
        fill=TEAL,
        width=6,
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
