#!/usr/bin/env python3
"""
Generate splash screen PNGs for all Android DPI densities.
Requires: pip install pillow
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Configuration
TEAL = (38, 166, 154)  # #26A69A
WHITE = (255, 255, 255)

BASE_WIDTH = 1440
BASE_HEIGHT = 1920

# DPI variants (scale factor from base xxxhdpi)
VARIANTS = {
    "mdpi": 0.25,       # 320×426 (160 DPI)
    "hdpi": 0.375,      # 480×640 (240 DPI)
    "xhdpi": 0.50,      # 720×960 (320 DPI)
    "xxhdpi": 0.75,     # 1080×1440 (480 DPI)
    "xxxhdpi": 1.0,     # 1440×1920 (640 DPI)
}

SRC_DIR = Path("android/app/src/main/res")


def create_base_image():
    """Create base splash image at xxxhdpi (1440x1920)"""
    print("Creating base image (1440x1920 @ xxxhdpi)...")

    img = Image.new("RGB", (BASE_WIDTH, BASE_HEIGHT), TEAL)
    draw = ImageDraw.Draw(img)

    # Try to use a bold font, fall back to default if not available
    try:
        font_large = ImageFont.truetype("arial.ttf", 280)
        font_medium = ImageFont.truetype("arial.ttf", 200)
        font_small = ImageFont.truetype("arial.ttf", 140)
    except (IOError, OSError):
        # Fallback to default font (much smaller, but works on any system)
        print("⚠️  Note: Using default font (arial.ttf not found)")
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()

    center_x = BASE_WIDTH // 2
    center_y = BASE_HEIGHT // 2

    # Draw three Z letters in descending sizes
    # Large Z (bottom-center)
    draw.text((center_x - 140, center_y - 280), "Z", fill=WHITE, font=font_large, anchor="mm")

    # Medium Z (center)
    draw.text((center_x, center_y), "Z", fill=WHITE, font=font_medium, anchor="mm")

    # Small Z (top-right)
    draw.text((center_x + 200, center_y - 300), "Z", fill=WHITE, font=font_small, anchor="mm")

    # Draw phone handset outline (bottom-left corner)
    phone_x = 150
    phone_y = BASE_HEIGHT - 250
    phone_w = 180
    phone_h = 240

    # Phone body (rounded rectangle outline)
    draw.rectangle(
        [(phone_x, phone_y), (phone_x + phone_w, phone_y + phone_h)],
        outline=WHITE,
        width=12,
    )

    # Phone screen (inner rectangle)
    draw.rectangle(
        [(phone_x + 20, phone_y + 40), (phone_x + phone_w - 20, phone_y + phone_h - 40)],
        outline=WHITE,
        width=8,
    )

    return img


def generate_variant(base_img, scale, density):
    """Generate a splash image for a specific DPI variant"""
    width = int(BASE_WIDTH * scale)
    height = int(BASE_HEIGHT * scale)

    print(f"Generating {width}x{height} @ {density}...")

    # Resize image
    resized = base_img.resize((width, height), Image.Resampling.LANCZOS)

    # Create directories if needed
    for dir_type in ["drawable", f"drawable-land-{density}", f"drawable-port-{density}"]:
        dir_path = SRC_DIR / dir_type
        dir_path.mkdir(parents=True, exist_ok=True)

        # Save image
        output_path = dir_path / "splash.png"
        resized.save(output_path, "PNG", optimize=True, quality=90)
        print(f"  [OK] {output_path}")


def main():
    print("Generating Generating splash screen PNGs for Silent app...\n")

    # Check if PIL is installed
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("[ERROR] ERROR: Pillow not installed!")
        print("\nInstall with: pip install pillow")
        print("Or: python -m pip install pillow")
        return 1

    # Create base image
    base_img = create_base_image()
    print("[OK] Base image created\n")

    # Generate variants for each DPI
    for density, scale in VARIANTS.items():
        generate_variant(base_img, scale, density)

    print("\n[SUCCESS] All splash PNGs generated successfully!")
    print("\nGenerated files:")
    for path in sorted(SRC_DIR.glob("drawable*/splash.png")):
        size = path.stat().st_size / 1024
        print(f"  {path.relative_to('.')} ({size:.1f} KB)")

    print("\nNext steps:")
    print("1. Review the splash screens:")
    print("   git status")
    print("\n2. Commit the changes:")
    print("   git add android/app/src/main/res/drawable*/splash.png")
    print('   git commit -m "chore: regenerate splash screens with ZZZ + phone design"')
    print("\n3. Push and create APK build tag")
    print("   git push origin master")

    return 0


if __name__ == "__main__":
    exit(main())
