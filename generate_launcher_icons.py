#!/usr/bin/env python3
"""
Generate launcher icon PNGs for all Android DPI densities.
Requires: pip install pillow
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw

# Configuration
TEAL = (38, 166, 154)  # #26A69A
WHITE = (255, 255, 255)

# Base size (xxxhdpi - 192x192)
BASE_SIZE = 192

# DPI variants (scale from base)
VARIANTS = {
    "mdpi": 0.5,        # 96x96 (160 DPI)
    "hdpi": 0.75,       # 144x144 (240 DPI)
    "xhdpi": 1.0,       # 192x192 (320 DPI)
    "xxhdpi": 1.5,      # 288x288 (480 DPI)
    "xxxhdpi": 2.0,     # 384x384 (640 DPI)
}

SRC_DIR = Path("android/app/src/main/res")


def create_icon_with_background(size):
    """Create icon with teal background"""
    img = Image.new("RGBA", (size, size), TEAL)
    return img


def draw_icon_elements(draw, size):
    """Draw ZZZ letters and phone on image"""
    center = size // 2
    margin = int(40 * (size / 384))  # Scale margin based on size

    # Scale stroke widths proportionally
    z1_width = max(2, int(12 * (size / 384)))
    z2_width = max(2, int(10 * (size / 384)))
    z3_width = max(2, int(8 * (size / 384)))
    phone_width = max(1, int(3 * (size / 384)))
    screen_width = max(1, int(2 * (size / 384)))

    # Scale Z sizes
    z1_scale = size / 384
    z2_scale = size / 384
    z3_scale = size / 384

    # Large Z (bottom-left)
    z1_x = int((center - 60) * z1_scale)
    z1_y = int((center + 40) * z1_scale)
    offset = int(30 * z1_scale)
    height = int(40 * z1_scale)
    draw.line([(z1_x - offset, z1_y - height), (z1_x + offset, z1_y - height)], fill=WHITE, width=z1_width)
    draw.line([(z1_x + offset, z1_y - height), (z1_x - offset, z1_y)], fill=WHITE, width=z1_width)
    draw.line([(z1_x - offset, z1_y), (z1_x + offset, z1_y)], fill=WHITE, width=z1_width)

    # Medium Z (center)
    z2_x = int((center + 10) * z2_scale)
    z2_y = int(center * z2_scale)
    offset = int(25 * z2_scale)
    height = int(30 * z2_scale)
    draw.line([(z2_x - offset, z2_y - height), (z2_x + offset, z2_y - height)], fill=WHITE, width=z2_width)
    draw.line([(z2_x + offset, z2_y - height), (z2_x - offset, z2_y)], fill=WHITE, width=z2_width)
    draw.line([(z2_x - offset, z2_y), (z2_x + offset, z2_y)], fill=WHITE, width=z2_width)

    # Small Z (top-right)
    z3_x = int((center + 70) * z3_scale)
    z3_y = int((center - 50) * z3_scale)
    offset = int(18 * z3_scale)
    height = int(20 * z3_scale)
    draw.line([(z3_x - offset, z3_y - height), (z3_x + offset, z3_y - height)], fill=WHITE, width=z3_width)
    draw.line([(z3_x + offset, z3_y - height), (z3_x - offset, z3_y)], fill=WHITE, width=z3_width)
    draw.line([(z3_x - offset, z3_y), (z3_x + offset, z3_y)], fill=WHITE, width=z3_width)

    # Phone handset (bottom-left corner)
    phone_x = margin
    phone_y = size - margin - int(50 * (size / 384))
    phone_w = int(40 * (size / 384))
    phone_h = int(50 * (size / 384))

    # Only draw phone if it's large enough
    if phone_w > 8 and phone_h > 8:
        draw.rectangle(
            [(phone_x, phone_y), (phone_x + phone_w, phone_y + phone_h)],
            outline=WHITE,
            width=phone_width,
        )

        # Only draw phone screen if there's enough space
        screen_padding = max(2, int(4 * (size / 384)))
        if phone_w > screen_padding * 2 and phone_h > screen_padding * 2:
            draw.rectangle(
                [(phone_x + screen_padding, phone_y + screen_padding),
                 (phone_x + phone_w - screen_padding, phone_y + phone_h - screen_padding)],
                outline=WHITE,
                width=screen_width,
            )


def create_foreground_icon(size):
    """Create icon foreground (transparent background, for safe zone)"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_icon_elements(draw, size)
    return img


def create_launcher_icon(size):
    """Create full launcher icon (teal background + foreground)"""
    img = create_icon_with_background(size)
    draw = ImageDraw.Draw(img)
    draw_icon_elements(draw, size)
    return img


def create_launcher_icon_round(size):
    """Create launcher icon with circular mask"""
    img = create_launcher_icon(size)

    # Create circular mask
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([(0, 0), (size, size)], fill=255)

    # Apply mask
    img.putalpha(mask)
    return img


def generate_variants(scale, density):
    """Generate all 3 icon variants for a specific DPI"""
    size = int(BASE_SIZE * scale)

    print(f"Generating {size}x{size} @ {density}...")

    dir_path = SRC_DIR / f"mipmap-{density}"
    dir_path.mkdir(parents=True, exist_ok=True)

    # Generate ic_launcher (full icon with teal background)
    ic_launcher = create_launcher_icon(size)
    launcher_path = dir_path / "ic_launcher.png"
    ic_launcher.save(launcher_path, "PNG", optimize=True)
    print(f"  ✓ {launcher_path}")

    # Generate ic_launcher_round (circular mask)
    ic_launcher_round = create_launcher_icon_round(size)
    launcher_round_path = dir_path / "ic_launcher_round.png"
    ic_launcher_round.save(launcher_round_path, "PNG", optimize=True)
    print(f"  ✓ {launcher_round_path}")

    # Generate ic_launcher_foreground (oversized for safe zone - 108dp in 192dp canvas)
    # Foreground is 4/3 scale of base launcher (108/81 ratio in safe zone system)
    foreground_size = int(size * 1.33)
    ic_launcher_foreground = create_foreground_icon(foreground_size)

    # Resize to actual foreground density size (foreground is 108dp baseline, varies by density)
    # Map: mdpi=32dp, hdpi=48dp, xhdpi=64dp, xxhdpi=96dp, xxxhdpi=128dp
    foreground_sizes = {
        "mdpi": 32,
        "hdpi": 48,
        "xhdpi": 64,
        "xxhdpi": 96,
        "xxxhdpi": 128,
    }
    actual_foreground_size = foreground_sizes.get(density, 64)
    ic_launcher_foreground_resized = ic_launcher_foreground.resize(
        (actual_foreground_size, actual_foreground_size),
        Image.Resampling.LANCZOS
    )
    launcher_fg_path = dir_path / "ic_launcher_foreground.png"
    ic_launcher_foreground_resized.save(launcher_fg_path, "PNG", optimize=True)
    print(f"  ✓ {launcher_fg_path}")


def main():
    print("🎨 Generating launcher icons for Silent app...\n")

    # Check if PIL is installed
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("❌ ERROR: Pillow not installed!")
        print("\nInstall with: pip install pillow")
        return 1

    # Generate variants for each DPI
    for density, scale in VARIANTS.items():
        generate_variants(scale, density)

    print("\n✅ All launcher icons generated successfully!")
    print("\nGenerated files:")
    total_size = 0
    for path in sorted(SRC_DIR.glob("mipmap-*/ic_launcher*.png")):
        size = path.stat().st_size / 1024
        total_size += size
        print(f"  {path.relative_to('.')} ({size:.1f} KB)")

    print(f"\nTotal size: {total_size:.1f} KB")
    print("\nNext steps:")
    print("1. Commit the changes:")
    print("   git add android/app/src/main/res/mipmap-*/ic_launcher*.png")
    print('   git commit -m "chore: regenerate launcher icons with ZZZ + phone design"')
    print("\n2. Push to trigger APK build")
    print("   git push origin master")

    return 0


if __name__ == "__main__":
    exit(main())
