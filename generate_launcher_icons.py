#!/usr/bin/env python3
"""
Generate launcher icon PNGs for all Android DPI densities.
Requires: pip install pillow
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Configuration
WHITE_BG = (255, 255, 255)  # White background
TEAL = (38, 166, 154)  # Teal #26A69A
PHONE_DARK = (60, 60, 60)  # Dark phone body
PHONE_SCREEN = (30, 30, 30)  # Phone screen

BASE_SIZE = 192  # xxxhdpi base

VARIANTS = {
    "mdpi": 0.5,        # 96x96
    "hdpi": 0.75,       # 144x144
    "xhdpi": 1.0,       # 192x192
    "xxhdpi": 1.5,      # 288x288
    "xxxhdpi": 2.0,     # 384x384
}

SRC_DIR = Path("android/app/src/main/res")


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


def create_launcher_icon(size):
    """Create full launcher icon with white background"""
    img = Image.new("RGBA", (size, size), WHITE_BG)
    draw = ImageDraw.Draw(img)

    center = size // 2
    scale = size / 384  # scale relative to xxxhdpi

    # Load bold font for Z letters
    large_z_size = int(220 * scale)
    medium_z_size = int(160 * scale)
    small_z_size = int(110 * scale)

    font_large = load_font(large_z_size)
    font_medium = load_font(medium_z_size)
    font_small = load_font(small_z_size)

    # Large Z (top-right)
    z_large_x = int(center + 70 * scale)
    z_large_y = int(center - 60 * scale)
    draw.text((z_large_x, z_large_y), "Z", fill=TEAL, font=font_large, anchor="mm")

    # Medium Z (center)
    z_medium_x = center
    z_medium_y = center
    draw.text((z_medium_x, z_medium_y), "Z", fill=TEAL, font=font_medium, anchor="mm")

    # Small Z (bottom-left)
    z_small_x = int(center - 70 * scale)
    z_small_y = int(center + 60 * scale)
    draw.text((z_small_x, z_small_y), "Z", fill=TEAL, font=font_small, anchor="mm")

    # Phone icon (center-right)
    phone_w = int(40 * scale)
    phone_h = int(60 * scale)
    phone_x = int(center + 30 * scale)
    phone_y = int(center - 10 * scale)

    # Phone body (dark rounded rect)
    draw.rounded_rectangle(
        [(phone_x, phone_y), (phone_x + phone_w, phone_y + phone_h)],
        radius=max(2, int(4 * scale)),
        fill=PHONE_DARK,
    )

    # Phone screen
    screen_margin = max(2, int(3 * scale))
    draw.rounded_rectangle(
        [(phone_x + screen_margin, phone_y + screen_margin),
         (phone_x + phone_w - screen_margin, phone_y + phone_h - screen_margin)],
        radius=max(1, int(2 * scale)),
        fill=PHONE_SCREEN,
    )

    # Orbital ring around phone (teal ellipse, tilted)
    ring_offset = int(15 * scale)
    ring_width = max(2, int(6 * scale))

    # Draw ellipse arc for orbital effect
    bbox = [
        (phone_x - ring_offset, phone_y - ring_offset),
        (phone_x + phone_w + ring_offset, phone_y + phone_h + ring_offset)
    ]
    draw.ellipse(bbox, outline=TEAL, width=ring_width)

    return img


def create_launcher_icon_round(size):
    """Create launcher icon with circular mask"""
    img = create_launcher_icon(size)

    # Create circular mask
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([(0, 0), (size, size)], fill=255)

    img.putalpha(mask)
    return img


def create_foreground_icon(size):
    """Create icon foreground (transparent background for safe zone)"""
    # Scale up for foreground safe zone (108dp baseline)
    foreground_sizes = {
        "mdpi": 32,
        "hdpi": 48,
        "xhdpi": 64,
        "xxhdpi": 96,
        "xxxhdpi": 128,
    }

    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size // 2
    scale = size / 384

    # Load fonts
    large_z_size = int(220 * scale)
    medium_z_size = int(160 * scale)
    small_z_size = int(110 * scale)

    font_large = load_font(large_z_size)
    font_medium = load_font(medium_z_size)
    font_small = load_font(small_z_size)

    # Z letters
    z_large_x = int(center + 70 * scale)
    z_large_y = int(center - 60 * scale)
    draw.text((z_large_x, z_large_y), "Z", fill=TEAL, font=font_large, anchor="mm")

    z_medium_x = center
    z_medium_y = center
    draw.text((z_medium_x, z_medium_y), "Z", fill=TEAL, font=font_medium, anchor="mm")

    z_small_x = int(center - 70 * scale)
    z_small_y = int(center + 60 * scale)
    draw.text((z_small_x, z_small_y), "Z", fill=TEAL, font=font_small, anchor="mm")

    # Phone
    phone_w = int(40 * scale)
    phone_h = int(60 * scale)
    phone_x = int(center + 30 * scale)
    phone_y = int(center - 10 * scale)

    draw.rounded_rectangle(
        [(phone_x, phone_y), (phone_x + phone_w, phone_y + phone_h)],
        radius=max(2, int(4 * scale)),
        fill=PHONE_DARK,
    )

    screen_margin = max(2, int(3 * scale))
    draw.rounded_rectangle(
        [(phone_x + screen_margin, phone_y + screen_margin),
         (phone_x + phone_w - screen_margin, phone_y + phone_h - screen_margin)],
        radius=max(1, int(2 * scale)),
        fill=PHONE_SCREEN,
    )

    # Orbital ring
    ring_offset = int(15 * scale)
    ring_width = max(2, int(6 * scale))
    bbox = [
        (phone_x - ring_offset, phone_y - ring_offset),
        (phone_x + phone_w + ring_offset, phone_y + phone_h + ring_offset)
    ]
    draw.ellipse(bbox, outline=TEAL, width=ring_width)

    return img


def generate_variants(scale, density):
    """Generate all 3 icon variants for a specific DPI"""
    size = int(BASE_SIZE * scale)

    print(f"Generating {size}x{size} @ {density}...")

    dir_path = SRC_DIR / f"mipmap-{density}"
    dir_path.mkdir(parents=True, exist_ok=True)

    # ic_launcher (full icon)
    ic_launcher = create_launcher_icon(size)
    launcher_path = dir_path / "ic_launcher.png"
    ic_launcher.save(launcher_path, "PNG", optimize=True)
    print(f"  [OK] {launcher_path}")

    # ic_launcher_round (circular)
    ic_launcher_round = create_launcher_icon_round(size)
    launcher_round_path = dir_path / "ic_launcher_round.png"
    ic_launcher_round.save(launcher_round_path, "PNG", optimize=True)
    print(f"  [OK] {launcher_round_path}")

    # ic_launcher_foreground (for safe zone)
    foreground_size = int(size * 1.33)
    ic_launcher_foreground = create_foreground_icon(foreground_size)
    launcher_fg_path = dir_path / "ic_launcher_foreground.png"
    ic_launcher_foreground.save(launcher_fg_path, "PNG", optimize=True)
    print(f"  [OK] {launcher_fg_path}")


def main():
    print("Generating launcher icons for Silent app...\n")

    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("[ERROR] Pillow not installed!")
        print("\nInstall with: pip install pillow")
        return 1

    # Generate variants
    for density, scale in VARIANTS.items():
        generate_variants(scale, density)

    print("\n[SUCCESS] All launcher icons generated successfully!")
    print("\nGenerated files:")
    total_size = 0
    for path in sorted(SRC_DIR.glob("mipmap-*/ic_launcher*.png")):
        size = path.stat().st_size / 1024
        total_size += size
        print(f"  {path.relative_to('.')} ({size:.1f} KB)")

    print(f"\nTotal size: {total_size:.1f} KB")

    return 0


if __name__ == "__main__":
    exit(main())
