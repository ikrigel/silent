# Generating Splash Screen PNGs

This guide explains how to regenerate the splash screen images for all Android DPI densities.

## Prerequisites

You need **ImageMagick** installed. Install it:

**macOS:**
```bash
brew install imagemagick
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install imagemagick
```

**Windows (WSL2):**
```bash
sudo apt-get update && sudo apt-get install imagemagick
```

**Windows (Git Bash):**
Download from [imagemagick.org](https://imagemagick.org/script/download.php#windows)

## Running the Script

From the project root:

```bash
chmod +x generate-splash-pngs.sh
./generate-splash-pngs.sh
```

**On Windows (WSL):**
```bash
bash generate-splash-pngs.sh
```

**On Windows (Git Bash):**
```bash
bash generate-splash-pngs.sh
```

## What It Does

The script:
1. Creates a base image at xxxhdpi resolution (1440×1920) with the design:
   - **Background**: Teal (#26A69A)
   - **Content**: Three ZZZ letters (descending sizes) in white
2. Scales down to create variants for all DPI densities:
   - mdpi (320×426)
   - hdpi (480×640)
   - xhdpi (720×960)
   - xxhdpi (1080×1440)
   - xxxhdpi (1440×1920)
3. Saves to `drawable/`, `drawable-land-*`, and `drawable-port-*` directories
4. Optimizes PNGs with quality=90 and strips metadata

## After Generation

```bash
# Review the generated files
ls -lh android/app/src/main/res/drawable*/splash.png

# Commit the changes
git add android/app/src/main/res/drawable*/splash.png
git commit -m "chore: regenerate splash screens with ZZZ + phone design"

# Bump version and create APK build tag
# (version should be auto-incremented)
```

## Customizing the Design

To modify the splash design, edit `generate-splash-pngs.sh`:

- **Change colors**: Modify `TEAL` and `WHITE` hex values
- **Change letter sizes**: Adjust `-pointsize` values (currently 280, 200, 140)
- **Change letter positions**: Adjust `-geometry` offsets (e.g., `+0+200` = x offset, y offset)
- **Add elements**: Use `convert` drawing operations (see ImageMagick docs)

## Troubleshooting

**Error: "convert: command not found"**
→ ImageMagick not installed; run `brew install imagemagick` or `apt-get install imagemagick`

**Error: "Permission denied"**
→ Make script executable: `chmod +x generate-splash-pngs.sh`

**Images look wrong**
→ The script uses DejaVu-Sans-Bold. For other fonts, modify the `-font` parameter in the script

## Alternative: Manual Generation

If you can't use ImageMagick, you can manually create splash images:

1. **Design once** at highest resolution (1440×1920) using any image editor (Photoshop, GIMP, etc.)
2. **Export as PNG** with quality=90
3. **Scale down** for each DPI:
   - xxxhdpi: 1440×1920 (keep original)
   - xxhdpi: 1080×1440 (75%)
   - xhdpi: 720×960 (50%)
   - hdpi: 480×640 (37.5%)
   - mdpi: 320×426 (25%)
4. **Copy** each variant to the corresponding `drawable-*` directory

## See Also

- [Android Documentation: Providing Multiple Screen Densities](https://developer.android.com/training/multiscreen/screendensities)
- [ImageMagick Convert Documentation](https://imagemagick.org/script/convert.php)
