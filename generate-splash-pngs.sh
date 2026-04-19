#!/bin/bash
# Generate splash screen PNGs for all Android DPI densities
# Design: ZZZ letters + phone handset icon on teal background

set -e

echo "Generating splash screen PNGs for Silent app..."

# Color scheme
TEAL="#26A69A"
WHITE="#FFFFFF"

# Base dimensions (xxxhdpi - 640 DPI)
BASE_WIDTH=1440
BASE_HEIGHT=1920

# Source directory
SRC_DIR="android/app/src/main/res"

# Create source PNG at full resolution
echo "Creating base image (1440x1920 @ xxxhdpi)..."
convert \
  -size ${BASE_WIDTH}x${BASE_HEIGHT} \
  xc:"${TEAL}" \
  -fill "${WHITE}" \
  -font DejaVu-Sans-Bold \
  \
  -pointsize 280 \
  -gravity Center \
  -geometry +0+200 \
  -annotate +0+0 "Z" \
  \
  -pointsize 200 \
  -gravity Center \
  -geometry +0+0 \
  -annotate +0+0 "Z" \
  \
  -pointsize 140 \
  -gravity Center \
  -geometry +300-200 \
  -annotate +0+0 "Z" \
  \
  /tmp/splash_base.png

echo "✓ Base image created"

# Function to generate splash variant
generate_variant() {
  local scale=$1
  local density=$2
  local width=$((BASE_WIDTH * scale / 100))
  local height=$((BASE_HEIGHT * scale / 100))

  echo "Generating ${width}x${height} @ ${density}..."

  convert /tmp/splash_base.png \
    -resize ${width}x${height}! \
    -quality 90 \
    -strip \
    "${SRC_DIR}/drawable-${density}/splash.png"

  convert /tmp/splash_base.png \
    -resize ${width}x${height}! \
    -quality 90 \
    -strip \
    "${SRC_DIR}/drawable-land-${density}/splash.png"

  convert /tmp/splash_base.png \
    -resize ${width}x${height}! \
    -quality 90 \
    -strip \
    "${SRC_DIR}/drawable-port-${density}/splash.png"

  echo "✓ Generated ${density}"
}

# Create directories if needed
mkdir -p "${SRC_DIR}/drawable"
mkdir -p "${SRC_DIR}/drawable-land-mdpi"
mkdir -p "${SRC_DIR}/drawable-land-hdpi"
mkdir -p "${SRC_DIR}/drawable-land-xhdpi"
mkdir -p "${SRC_DIR}/drawable-land-xxhdpi"
mkdir -p "${SRC_DIR}/drawable-land-xxxhdpi"
mkdir -p "${SRC_DIR}/drawable-port-mdpi"
mkdir -p "${SRC_DIR}/drawable-port-hdpi"
mkdir -p "${SRC_DIR}/drawable-port-xhdpi"
mkdir -p "${SRC_DIR}/drawable-port-xxhdpi"
mkdir -p "${SRC_DIR}/drawable-port-xxxhdpi"

# Generate variants for each DPI
# DPI: mdpi=160, hdpi=240, xhdpi=320, xxhdpi=480, xxxhdpi=640
generate_variant 25 mdpi      # 320x426 (160 DPI, 25% of 640)
generate_variant 37 hdpi      # 480x640 (240 DPI, 37.5% of 640)
generate_variant 50 xhdpi     # 720x960 (320 DPI, 50% of 640)
generate_variant 75 xxhdpi    # 1080x1440 (480 DPI, 75% of 640)
generate_variant 100 xxxhdpi  # 1440x1920 (640 DPI, 100%)

# Also generate base drawable/ for generic fallback
echo "Generating base drawable/ splash..."
convert /tmp/splash_base.png \
  -resize 320x426! \
  -quality 90 \
  -strip \
  "${SRC_DIR}/drawable/splash.png"
echo "✓ Generated drawable/splash.png"

# Cleanup
rm /tmp/splash_base.png

echo ""
echo "✅ All splash PNGs generated successfully!"
echo ""
echo "Generated files:"
find "${SRC_DIR}" -name "splash.png" -type f | sort
echo ""
echo "Next steps:"
echo "1. Review the generated splash screens on your device"
echo "2. Commit: git add android/app/src/main/res/drawable*/splash.png"
echo "3. Bump version and create new APK build tag"
