# ADB Element Discovery Guide

Complete guide to finding and inspecting Android UI elements using ADB and command-line tools.

## Quick Start

### Method 1: UI Hierarchy Dump (Fastest)

**Bash/Linux/Mac:**
```bash
# Capture current screen hierarchy
adb shell uiautomator dump /sdcard/window_dump.xml

# Pull to your computer
adb pull /sdcard/window_dump.xml

# View in text editor or grep for elements
grep -i "airplane" window_dump.xml
```

**PowerShell (Windows):**
```powershell
# Capture current screen hierarchy
adb shell uiautomator dump /sdcard/window_dump.xml

# Pull to your computer
adb pull /sdcard/window_dump.xml

# View in text editor or search for elements
Select-String -Path window_dump.xml -Pattern "airplane" -CaseSensitive:$false

# Or open in default text editor
notepad window_dump.xml

# Or open in VS Code
code window_dump.xml
```

#---

## PowerShell Quick Reference (Windows Users)

### Most Common Commands

```powershell
# Dump screen and pull file
adb shell uiautomator dump /sdcard/window_dump.xml; adb pull /sdcard/window_dump.xml

# Search for text (case-insensitive)
Select-String -Path window_dump.xml -Pattern "airplane" -CaseSensitive:$false

# Shortcut alias
Set-Alias ss Select-String
ss window_dump.xml -Pattern "airplane"

# View in Notepad
notepad window_dump.xml

# View in VS Code
code window_dump.xml

# Calculate tap coordinates from bounds
$bounds = "[880,1199][1017,1346]"
if ($bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
  $centerX = ([int]$matches[1] + [int]$matches[3]) / 2
  $centerY = ([int]$matches[2] + [int]$matches[4]) / 2
  "adb shell input tap $centerX $centerY"
}

# Watch for changes (refresh every 2 seconds)
while($true) { 
  Clear-Host
  "Updated: $(Get-Date)"
  adb shell uiautomator dump /sdcard/window_dump.xml | Out-Null
  adb pull /sdcard/window_dump.xml | Out-Null
  Select-String -Path window_dump.xml -Pattern "airplane"
  Start-Sleep -Seconds 2
}
```

### PowerShell vs Bash Equivalents

| Task | Bash | PowerShell |
|------|------|-----------|
| **Search** | `grep -i "text"` | `Select-String -Pattern "text" -CaseSensitive:$false` |
| **Search with context** | `grep -B5 -A5 "text"` | `Select-String -Pattern "text" -Context 5,5` |
| **Extract groups** | `sed 's/.*text="\([^"]*\)".*/\1/'` | `Matches.Groups[1].Value` |
| **Pipe results** | `grep "x" \| grep "y"` | `Select-String "x" \| Select-String "y"` |
| **Count matches** | `grep -c "pattern"` | `@(Select-String -Pattern "pattern").Count` |
| **Open file** | `cat file.xml` | `Get-Content file.xml` |
| **Append to file** | `echo "text" >> file.txt` | `"text" >> file.txt` |
| **Save output** | `command > output.txt` | `command | Out-File output.txt` |

---

## Method 2: Live Inspection (Interactive)
```bash
# Open Android Device Monitor
android studio → Tools → Device Manager → Device Explorer
# Navigate to /sdcard/window_dump.xml and view in real-time
```

---

## Detailed Methods

### Method 1: UIAutomator Dump (Recommended)

**Pros:** Fastest, complete hierarchy, exact bounds and properties
**Cons:** Static snapshot, requires manual refresh

#### Basic Usage

```bash
# Dump current screen
adb shell uiautomator dump /sdcard/window_dump.xml

# Pull to computer
adb pull /sdcard/window_dump.xml

# Open in text editor
notepad window_dump.xml
# or
code window_dump.xml
```

#### Search for Elements

**Bash/Linux/Mac:**
```bash
# Find all nodes with "Airplane" text
grep -i "airplane" window_dump.xml

# Find by class type
grep "class=\"android.widget.Switch\"" window_dump.xml

# Find by resource ID
grep "resource-id=\"android:id/title\"" window_dump.xml

# Complex search - find all checkable elements
grep "checkable=\"true\"" window_dump.xml

# Find by content description
grep "content-desc=\"Airplane mode\"" window_dump.xml
```

**PowerShell (Windows):**
```powershell
# Find all nodes with "Airplane" text (case-insensitive)
Select-String -Path window_dump.xml -Pattern "airplane" -CaseSensitive:$false

# Find by class type
Select-String -Path window_dump.xml -Pattern 'class="android.widget.Switch"'

# Find by resource ID
Select-String -Path window_dump.xml -Pattern 'resource-id="android:id/title"'

# Find all checkable elements
Select-String -Path window_dump.xml -Pattern 'checkable="true"'

# Find by content description
Select-String -Path window_dump.xml -Pattern 'content-desc="Airplane mode"'

# Quick alias - shorten Select-String to ss
Set-Alias ss Select-String
ss -Path window_dump.xml -Pattern "airplane"
```

#### Parse Specific Attributes

**Bash/Linux/Mac:**
```bash
# Extract all text labels
grep "text=\"" window_dump.xml | sed 's/.*text="\([^"]*\)".*/\1/'

# Find bounds of element
grep -A5 "text=\"Airplane mode\"" window_dump.xml | grep "bounds"

# Get class name
grep -A2 "text=\"Airplane mode\"" window_dump.xml | grep "class"
```

**PowerShell (Windows):**
```powershell
# Extract all text labels
Select-String -Path window_dump.xml -Pattern 'text="([^"]*)"' | ForEach-Object { 
  $_.Matches.Groups[1].Value 
}

# Find bounds of element (with context)
Select-String -Path window_dump.xml -Pattern "Airplane mode" -Context 5,5 | 
  Select-String -Pattern 'bounds'

# Get class name for Airplane mode
Select-String -Path window_dump.xml -Pattern "Airplane mode" -Context 2 | 
  Select-String -Pattern 'class'

# Find all resource IDs
Select-String -Path window_dump.xml -Pattern 'resource-id="([^"]*)"' | ForEach-Object {
  $_.Matches.Groups[1].Value
}

# Extract bounds and calculate center coordinates
$line = Select-String -Path window_dump.xml -Pattern "Airplane mode"
if ($line -match 'bounds="(\[\d+,\d+\]\[\d+,\d+\])"') {
  $bounds = $matches[1]
  Write-Host "Bounds: $bounds"
  # Parse and calculate center: bounds="[880,1199][1017,1346]"
  if ($bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
    $x1, $y1, $x2, $y2 = [int]$matches[1], [int]$matches[2], [int]$matches[3], [int]$matches[4]
    $centerX = ($x1 + $x2) / 2
    $centerY = ($y1 + $y2) / 2
    Write-Host "Center coordinates: ($centerX, $centerY)"
    Write-Host "For tap: adb shell input tap $centerX $centerY"
  }
}
```

#### Format Output for Readability

```bash
# Pretty-print XML (requires xmllint)
xmllint --format window_dump.xml > formatted.xml

# Or use online XML formatter
```

---

### Method 2: Accessibility Inspector (Real-time)

**Pros:** Live inspection, see changes immediately, interactive
**Cons:** Requires Android Studio, slower than dump

#### Setup

```bash
# 1. Open Android Studio
# 2. Tools → Device Manager
# 3. Select your device
# 4. Click "Device Explorer"
# 5. Navigate to sdcard/window_dump.xml
```

#### Live Inspection

```bash
# 1. Enable accessibility debugging (if needed)
adb shell settings put secure accessibility_enabled 1

# 2. Dump and auto-refresh
adb shell uiautomator dump /sdcard/window_dump.xml && \
adb pull /sdcard/window_dump.xml && \
# Watch in real-time as you interact with device
```

---

### Method 3: Logcat Tracing

**Pros:** Shows runtime events, debug messages
**Cons:** Verbose, requires filtering

#### Capture Accessibility Events

```bash
# Start logcat with filter
adb logcat | grep "AccessibilityEvent"

# Or capture to file
adb logcat > logcat.txt &
# Then interact with device
# Press Ctrl+C to stop
```

#### Capture Custom App Logs

For Silent Robot specifically:
```bash
adb logcat | grep "WEARobotAccessibilityService"

# See all discovered labels
adb logcat | grep "All discovered labels"

# See exact nodes being searched
adb logcat | grep "Searching node"
```

#### Save and Analyze

```bash
# Capture logcat to file
adb logcat > logcat_$(date +%s).txt &

# Run your action on device

# Kill logcat
kill %1

# Search logs
grep "Airplane mode" logcat_*.txt

# Extract just errors
grep "ERROR\|WARN" logcat_*.txt
```

---

### Method 4: dumpsys (System Services)

**Pros:** Low-level system information
**Cons:** Complex output, hard to parse

#### Window Manager Dump

```bash
# See active window
adb shell dumpsys window | grep "mCurrentFocus"

# See window stack
adb shell dumpsys window | grep "Window"
```

#### Activity Manager

```bash
# See current activity
adb shell dumpsys activity | grep "mResumedActivity"

# See all activities
adb shell dumpsys activity | grep "Activity"
```

#### Accessibility Service State

```bash
# Check enabled accessibility services
adb shell dumpsys accessibility | grep "Service"

# Get accessibility settings
adb shell dumpsys settings | grep -i "accessibility"
```

---

### Method 5: Input Events (Monkey Testing)

**Pros:** Simulate user interactions
**Cons:** Random, hard to control

#### Tap a Specific Location

```bash
# Tap at coordinates (x, y)
adb shell input tap 500 1000

# Long press
adb shell input swipe 500 1000 500 1000 2000

# Swipe
adb shell input swipe 500 1000 500 500
```

#### Keyboard Input

```bash
# Type text
adb shell input text "hello"

# Press key
adb shell input keyevent 66  # ENTER

# Common keys:
# 66 = ENTER
# 4 = BACK
# 3 = HOME
# 187 = POWER
```

#### From Bounds (Extract Coordinates)

```bash
# Extract center coordinates from bounds="[880,1199][1017,1346]"
# Center X = (880 + 1017) / 2 = 948
# Center Y = (1199 + 1346) / 2 = 1272

adb shell input tap 948 1272
```

---

## Workflow: Find and Debug Elements

### Step 1: Capture Hierarchy

```bash
# Navigate to the screen you want to inspect
# Then dump the hierarchy

adb shell uiautomator dump /sdcard/window_dump.xml
adb pull /sdcard/window_dump.xml
```

### Step 2: Search for Target Element

```bash
# Open in text editor
# Search for your target text (Ctrl+F)

# OR use grep
grep -i "your text" window_dump.xml

# Look for these properties:
# - text="..."          (visible text)
# - content-desc="..."  (accessibility label)
# - class="..."         (component type)
# - bounds="..."        (coordinates)
# - checkable="true"    (can be toggled)
# - clickable="true"    (can be clicked)
```

### Step 3: Trace Parent/Sibling Structure

```bash
# Copy the element and surrounding context
# Example: If you found Switch at line 500, look at:
# - Lines 480-520 (surrounding context)
# - Find parent containers (LinearLayout, RelativeLayout, etc.)
# - Find siblings (elements under same parent)
```

### Step 4: Identify Unique Paths

```bash
# Create a unique path to the element:
# Option A: Text path
#   Find "Airplane mode" text → search up to LinearLayout (widget_frame)

# Option B: Resource ID path
#   Start from root → android:id/content → android:id/list_container → ...

# Option C: Structure path
#   LinearLayout (outer) → RelativeLayout (title_frame) → TextView (text)
```

### Step 5: Verify with Tap

```bash
# Extract bounds: bounds="[880,1199][1017,1346]"
# Calculate center: X = 948, Y = 1272

adb shell input tap 948 1272

# Check if correct element responded (logcat, visual feedback, etc.)
```

---

## Practical Examples

### Example 1: Find Airplane Mode Toggle

**Bash:**
```bash
# 1. Navigate to Settings → Connections
adb shell am start -n com.android.settings/com.android.settings.Settings

# 2. Dump hierarchy
adb shell uiautomator dump /sdcard/window_dump.xml

# 3. Search for airplane
grep -i "airplane" window_dump.xml

# 4. Look for the Switch element
grep -B5 -A5 "text=\"Airplane mode\"" window_dump.xml

# 5. Extract bounds
# bounds="[880,1199][1017,1346]"
# Center: (948, 1272)

# 6. Test tap
adb shell input tap 948 1272

# 7. Verify in logcat
adb logcat | grep -i "airplane"
```

**PowerShell:**
```powershell
# 1. Navigate to Settings
adb shell am start -n com.android.settings/com.android.settings.Settings

# Wait a moment for Settings to open
Start-Sleep -Seconds 2

# 2. Dump hierarchy
adb shell uiautomator dump /sdcard/window_dump.xml
adb pull /sdcard/window_dump.xml

# 3. Search for airplane (case-insensitive)
Select-String -Path window_dump.xml -Pattern "airplane" -CaseSensitive:$false

# 4. Look for the Switch element with context
Select-String -Path window_dump.xml -Pattern "Airplane mode" -Context 5

# 5. Extract bounds and calculate center
$content = Get-Content window_dump.xml | Select-String -Pattern "Airplane mode" -Context 2
$bounds = ($content | Select-String -Pattern 'bounds="([^"]*)"' | 
  ForEach-Object { $_.Matches.Groups[1].Value })[0]

Write-Host "Bounds: $bounds"

# Parse coordinates: bounds="[880,1199][1017,1346]"
if ($bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
  $x1, $y1, $x2, $y2 = [int]$matches[1], [int]$matches[2], [int]$matches[3], [int]$matches[4]
  $centerX = ($x1 + $x2) / 2
  $centerY = ($y1 + $y2) / 2
  Write-Host "Center: ($centerX, $centerY)"
  
  # 6. Test tap
  Write-Host "Tapping at ($centerX, $centerY)..."
  adb shell input tap $centerX $centerY
  
  Start-Sleep -Seconds 1
}

# 7. Verify in logcat
Write-Host "Checking logcat..."
adb logcat -e "airplane" | Select-String -Pattern "airplane"
```

### Example 2: Find Hebrew Labels

```bash
# 1. Dump with device in Hebrew
adb shell setprop persist.sys.locale he_IL
adb shell uiautomator dump /sdcard/window_dump.xml

# 2. Search for Hebrew text (טיסה = "airplane")
grep "טיסה" window_dump.xml

# 3. Get exact label
grep -B2 -A2 "טיסה" window_dump.xml | grep "text="

# 4. Copy label for robot automation
# Add to WEARobotModels.kt
```

### Example 3: Trace Element Hierarchy

```bash
# Goal: Find all ancestors of a specific element

# 1. Dump and find your element
adb shell uiautomator dump /sdcard/window_dump.xml
grep "Airplane mode" window_dump.xml

# 2. Look at surrounding indentation
# More indentation = deeper in hierarchy
# Parent = the next less-indented element above

# 3. Map the full path
# LinearLayout (main)
#   └─ RelativeLayout (title_frame)
#       └─ TextView (text="Airplane mode")  ← Target
#   └─ LinearLayout (widget_frame)
#       └─ Switch (widget)  ← Toggle to click
```

---

## Command Reference

### ADB Commands

| Command | Purpose |
|---------|---------|
| `adb shell uiautomator dump /sdcard/window_dump.xml` | Capture UI hierarchy |
| `adb pull /sdcard/window_dump.xml` | Download dump file |
| `adb shell input tap X Y` | Tap at coordinates |
| `adb shell input swipe X1 Y1 X2 Y2` | Swipe gesture |
| `adb shell input text "string"` | Type text |
| `adb logcat` | View system logs |
| `adb shell am start -n package/activity` | Start activity |
| `adb shell dumpsys window` | Window manager info |
| `adb shell dumpsys accessibility` | Accessibility info |

### Grep Patterns

| Pattern | Purpose |
|---------|---------|
| `grep -i "text"` | Case-insensitive search |
| `grep -B5 -A5 "pattern"` | Show context (5 lines before/after) |
| `grep "class=\"android.widget.Switch\""` | Find all Switch elements |
| `grep "checkable=\"true\""` | Find toggleable elements |
| `grep "bounds="` | Find element coordinates |

---

## Tips & Tricks

### Faster Dumping Script

**Bash (macOS/Linux):**
```bash
#!/bin/bash
# save as dump.sh

adb shell uiautomator dump /sdcard/window_dump.xml
adb pull /sdcard/window_dump.xml -p > /dev/null
cat window_dump.xml

# Usage
chmod +x dump.sh
./dump.sh | grep -i "airplane"
```

**PowerShell (Windows):**
```powershell
# Save as dump.ps1
adb shell uiautomator dump /sdcard/window_dump.xml
adb pull /sdcard/window_dump.xml

# Display results
Get-Content window_dump.xml | Select-String -Pattern "airplane" -CaseSensitive:$false

# Usage in PowerShell
.\dump.ps1

# Or create a function for quick access
function Dump-Screen {
  param([string]$SearchPattern = "")
  adb shell uiautomator dump /sdcard/window_dump.xml
  adb pull /sdcard/window_dump.xml
  if ($SearchPattern) {
    Get-Content window_dump.xml | Select-String -Pattern $SearchPattern -CaseSensitive:$false
  } else {
    Get-Content window_dump.xml
  }
}

# Usage
Dump-Screen "airplane"
```

### Watch Hierarchy in Real-time

```bash
#!/bin/bash
# save as watch_hierarchy.sh

while true; do
  adb shell uiautomator dump /sdcard/window_dump.xml
  adb pull /sdcard/window_dump.xml -p > /dev/null
  clear
  echo "=== Updated $(date +%H:%M:%S) ==="
  cat window_dump.xml | grep -i "$1"
  sleep 2
done

# Usage: watch shows "Airplane" changes every 2 seconds
./watch_hierarchy.sh "Airplane"
```

### Extract Specific Element Info

```bash
#!/bin/bash
# save as find_element.sh

SEARCH_TEXT="$1"
adb shell uiautomator dump /sdcard/window_dump.xml
adb pull /sdcard/window_dump.xml -p > /dev/null

echo "=== Searching for: $SEARCH_TEXT ==="
grep -B2 -A10 "text=\"$SEARCH_TEXT\"" window_dump.xml | grep -E "class=|text=|bounds=|checkable=|content-desc="
```

---

## Troubleshooting

### Can't Find Element

```bash
# 1. Check if it's actually on screen
adb shell uiautomator dump /sdcard/window_dump.xml

# 2. Search case-insensitive
grep -i "your_text" window_dump.xml

# 3. Try similar text
grep -i "airplane\|flight\|mode" window_dump.xml

# 4. Check different locale
adb shell getprop persist.sys.locale

# 5. Scroll and retry
adb shell input swipe 500 1000 500 500
adb shell uiautomator dump /sdcard/window_dump.xml
```

### Coordinates Seem Off

```bash
# 1. Recalculate from bounds
# bounds="[880,1199][1017,1346]"
# Top-left: (880, 1199)
# Bottom-right: (1017, 1346)
# Center: ((880+1017)/2, (1199+1346)/2) = (948.5, 1272.5) ≈ (948, 1272)

# 2. Account for aspect ratio
# Some devices scale coordinates
# Try slightly offset: ±50 pixels

# 3. Test with visual feedback
adb shell input tap 948 1272
# Watch screen - did correct element respond?
```

### Element Disappeared

```bash
# 1. Activity changed - get current focus
adb shell dumpsys window | grep "mCurrentFocus"

# 2. Re-dump immediately
adb shell uiautomator dump /sdcard/window_dump.xml
adb pull /sdcard/window_dump.xml

# 3. Check if hidden/scrolled off screen
# Element bounds outside screen dimensions (1080x2340 typical)
grep "bounds=" window_dump.xml | head
```

---

## Related Documentation

- [ROBOT_AUTOMATION_DEBUGGING.md](ROBOT_AUTOMATION_DEBUGGING.md) — Robot automation troubleshooting
- [AIRPLANE_MODE_LABEL_DISCOVERY.md](AIRPLANE_MODE_LABEL_DISCOVERY.md) — Airplane mode element discovery
- [ANDROID_ROBOT_DEBUG.md](ANDROID_ROBOT_DEBUG.md) — Robot service architecture
