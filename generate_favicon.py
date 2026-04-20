#!/usr/bin/env python3
"""
Generate favicon.png for Silent app.
Requires: pip install pillow
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Configuration
TEAL = (38, 166, 154)  # #26A69A
WHITE = (255, 255, 255)

# Favicon size
SIZE = 256

PUBLIC_DIR = Path("public")


def create_favicon():
    """Create favicon with teal background and sleep emoji"""
    print("Creating favicon (256x256)...")

    img = Image.new("RGBA", (SIZE, SIZE), TEAL)
    draw = ImageDraw.Draw(img)

    center = SIZE // 2
    margin = 20

    # Draw three Z letters (descending size)
    # Large Z (left)
    z1_x = center - 40
    z1_y = center + 20
    draw.line([(z1_x - 20, z1_y - 25), (z1_x + 20, z1_y - 25)], fill=WHITE, width=8)
    draw.line([(z1_x + 20, z1_y - 25), (z1_x - 20, z1_y)], fill=WHITE, width=8)
    draw.line([(z1_x - 20, z1_y), (z1_x + 20, z1_y)], fill=WHITE, width=8)

    # Medium Z (center)
    z2_x = center
    z2_y = center
    draw.line([(z2_x - 16, z2_y - 20), (z2_x + 16, z2_y - 20)], fill=WHITE, width=7)
    draw.line([(z2_x + 16, z2_y - 20), (z2_x - 16, z2_y)], fill=WHITE, width=7)
    draw.line([(z2_x - 16, z2_y), (z2_x + 16, z2_y)], fill=WHITE, width=7)

    # Small Z (right)
    z3_x = center + 40
    z3_y = center - 20
    draw.line([(z3_x - 12, z3_y - 15), (z3_x + 12, z3_y - 15)], fill=WHITE, width=6)
    draw.line([(z3_x + 12, z3_y - 15), (z3_x - 12, z3_y)], fill=WHITE, width=6)
    draw.line([(z3_x - 12, z3_y), (z3_x + 12, z3_y)], fill=WHITE, width=6)

    # Phone handset (bottom-left)
    phone_x = margin
    phone_y = SIZE - margin - 35
    phone_w = 28
    phone_h = 35

    draw.rectangle(
        [(phone_x, phone_y), (phone_x + phone_w, phone_y + phone_h)],
        outline=WHITE,
        width=2,
    )

    draw.rectangle(
        [(phone_x + 3, phone_y + 5), (phone_x + phone_w - 3, phone_y + phone_h - 5)],
        outline=WHITE,
        width=1,
    )

    return img


def main():
    print("🎨 Generating favicon for Silent app...\n")

    # Check if PIL is installed
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("❌ ERROR: Pillow not installed!")
        print("\nInstall with: pip install pillow")
        return 1

    # Create public directory if needed
    PUBLIC_DIR.mkdir(exist_ok=True)

    # Create favicon
    favicon = create_favicon()
    favicon_path = PUBLIC_DIR / "favicon.png"
    favicon.save(favicon_path, "PNG", optimize=True)
    size = favicon_path.stat().st_size / 1024
    print(f"✓ {favicon_path} ({size:.1f} KB)")

    print("\n✅ Favicon generated successfully!")
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
