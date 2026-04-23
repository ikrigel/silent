#!/usr/bin/env python3
"""
Generate Android launcher icons and splash screens from custom design PNG.
Creates regular, round, and foreground versions for all DPI densities.
Requires: pip install pillow
"""

from pathlib import Path
from PIL import Image, ImageDraw
import sys

# Icon sizes for each DPI density (matching safe zone constraints)
ICON_SIZES = {
    "mdpi": 72,          # 72×72 dp × 1.0x
    "hdpi": 108,         # 72×72 dp × 1.5x
    "xhdpi": 144,        # 72×72 dp × 2.0x
    "xxhdpi": 216,       # 72×72 dp × 3.0x
    "xxxhdpi": 288,      # 72×72 dp × 4.0x
}

# Splash screen sizes (landscape & portrait)
SPLASH_SIZES = {
    "mdpi": {"land": (480, 320), "port": (320, 470)},
    "hdpi": {"land": (800, 480), "port": (480, 800)},
    "xhdpi": {"land": (1280, 720), "port": (720, 1280)},
    "xxhdpi": {"land": (1600, 960), "port": (960, 1600)},
    "xxxhdpi": {"land": (1920, 1280), "port": (1280, 1920)},
}

SOURCE_ICON = Path("favicons/apk-favicon.png")
ANDROID_RES = Path("android/app/src/main/res")
SPLASH_DIR = ANDROID_RES / "drawable"


def load_source_icon():
    """Load the source icon design"""
    if not SOURCE_ICON.exists():
        print(f"[ERROR] Source icon not found: {SOURCE_ICON}")
        sys.exit(1)
    
    img = Image.open(SOURCE_ICON).convert("RGBA")
    print(f"[OK] Loaded source icon: {SOURCE_ICON.name} ({img.size})")
    return img


def resize_icon(source_img, size):
    """Resize icon to specific size, maintaining aspect ratio"""
    source_img_resized = source_img.copy()
    source_img_resized.thumbnail((size, size), Image.Resampling.LANCZOS)
    
    # Center on white canvas
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    offset = ((size - source_img_resized.width) // 2, 
              (size - source_img_resized.height) // 2)
    canvas.paste(source_img_resized, offset, source_img_resized)
    
    return canvas


def create_round_icon(icon_img):
    """Create circular masked version of icon"""
    size = icon_img.size[0]
    
    # Create circular mask
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([(0, 0), (size, size)], fill=255)
    
    # Apply mask
    icon_img_copy = icon_img.copy()
    icon_img_copy.putalpha(mask)
    return icon_img_copy


def create_foreground_icon(icon_img):
    """Create foreground version with transparency for adaptive icons"""
    # Foreground is same as regular icon (transparent background already handled)
    return icon_img.copy()


def generate_launcher_icons():
    """Generate all launcher icon variants"""
    print("\n[INFO] Generating launcher icons...")
    
    source = load_source_icon()
    
    for density, size in ICON_SIZES.items():
        print(f"\nGenerating {size}×{size} @ {density}...")
        
        # Create directory
        mipmap_dir = ANDROID_RES / f"mipmap-{density}"
        mipmap_dir.mkdir(parents=True, exist_ok=True)
        
        # Resize to target size
        resized = resize_icon(source, size)
        
        # 1. ic_launcher.png (full icon with white background)
        ic_launcher = resized.convert("RGB")
        launcher_path = mipmap_dir / "ic_launcher.png"
        ic_launcher.save(launcher_path, "PNG", optimize=True)
        file_size = launcher_path.stat().st_size / 1024
        print(f"  [OK] {launcher_path.name} ({file_size:.1f} KB)")
        
        # 2. ic_launcher_round.png (circular version)
        ic_launcher_round = create_round_icon(resized)
        launcher_round_path = mipmap_dir / "ic_launcher_round.png"
        ic_launcher_round.save(launcher_round_path, "PNG", optimize=True)
        file_size = launcher_round_path.stat().st_size / 1024
        print(f"  [OK] {launcher_round_path.name} ({file_size:.1f} KB)")
        
        # 3. ic_launcher_foreground.png (for adaptive icons)
        ic_launcher_foreground = create_foreground_icon(resized)
        launcher_fg_path = mipmap_dir / "ic_launcher_foreground.png"
        ic_launcher_foreground.save(launcher_fg_path, "PNG", optimize=True)
        file_size = launcher_fg_path.stat().st_size / 1024
        print(f"  [OK] {launcher_fg_path.name} ({file_size:.1f} KB)")


def generate_splash_screens():
    """Generate splash screen variants"""
    print("\n[INFO] Generating splash screens...")
    
    source = load_source_icon()
    SPLASH_DIR.mkdir(parents=True, exist_ok=True)
    
    for density, sizes in SPLASH_SIZES.items():
        print(f"\nGenerating splash screens @ {density}...")
        
        # Landscape
        land_size = sizes["land"]
        splash_land = Image.new("RGB", land_size, (255, 255, 255))
        
        # Resize icon to fit (80% of smaller dimension)
        icon_size = int(min(land_size) * 0.4)
        icon_resized = resize_icon(source, icon_size)
        icon_resized_rgb = icon_resized.convert("RGB")
        
        # Center on splash
        offset = ((land_size[0] - icon_size) // 2, 
                  (land_size[1] - icon_size) // 2)
        splash_land.paste(icon_resized_rgb, offset)
        
        splash_land_path = SPLASH_DIR / f"splash_land_{density}.png"
        splash_land.save(splash_land_path, "PNG", optimize=True)
        file_size = splash_land_path.stat().st_size / 1024
        print(f"  [OK] {splash_land_path.name} ({land_size[0]}×{land_size[1]}, {file_size:.1f} KB)")
        
        # Portrait
        port_size = sizes["port"]
        splash_port = Image.new("RGB", port_size, (255, 255, 255))
        
        icon_size = int(min(port_size) * 0.4)
        icon_resized = resize_icon(source, icon_size)
        icon_resized_rgb = icon_resized.convert("RGB")
        
        offset = ((port_size[0] - icon_size) // 2, 
                  (port_size[1] - icon_size) // 2)
        splash_port.paste(icon_resized_rgb, offset)
        
        splash_port_path = SPLASH_DIR / f"splash_port_{density}.png"
        splash_port.save(splash_port_path, "PNG", optimize=True)
        file_size = splash_port_path.stat().st_size / 1024
        print(f"  [OK] {splash_port_path.name} ({port_size[0]}×{port_size[1]}, {file_size:.1f} KB)")


def main():
    print("Generating Android icons from custom design...\n")
    
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("[ERROR] Pillow not installed!")
        print("Install with: pip install pillow")
        return 1
    
    try:
        generate_launcher_icons()
        generate_splash_screens()
        
        print("\n[SUCCESS] All icons and splash screens generated!")
        print("\nGenerated files:")
        print("  - 15 launcher icons (regular, round, foreground)")
        print("  - 10 splash screens (landscape & portrait)")
        print("\nNext steps:")
        print("  1. Verify icons look correct")
        print("  2. Run: npm run build:android")
        print("  3. Install APK: adb install android\app\build\outputs\apk\release\app-release.apk")
        
        return 0
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
