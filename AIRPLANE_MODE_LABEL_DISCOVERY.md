# Airplane Mode Label Discovery (v1.0.74)

## Label Extracted from Device

**Device:** Samsung (Android 13+)  
**Language:** English  
**Date:** 2026-04-11  

### Extracted Label

| Property | Value |
|----------|-------|
| **Element Type** | `android.widget.Switch` |
| **Text Label** | `"Airplane mode"` |
| **Content Description** | `"Airplane mode"` |
| **Location in Settings** | Settings → Connections → Airplane mode |

### Extraction Method

Used ADB accessibility dump to extract all accessibility labels from Settings page:

```bash
adb shell uiautomator dump /sdcard/window_dump.xml
adb pull /sdcard/window_dump.xml
```

Parsed XML and located the airplane mode toggle switch with exact label text.

## Implementation in WEARobotModels.kt

The label is now included in the predefined list at [WEARobotModels.kt:90](android/app/src/main/java/com/ikrigel/silent/WEARobotModels.kt#L90):

```kotlin
private val airplaneLabels = listOf(
    // English: Stock Android, Samsung, OnePlus, Pixel
    "Airplane mode",        // ← Samsung device (extracted 2026-04-11)
    "Airplane",
    "Flight mode", 
    "Plane mode",
    // Samsung uses commas in accessibility labels instead of spaces
    "Airplane,mode",
    // Newline variants (some devices split text across lines)
    "Airplane\nmode",
    "Airplane\nMode",
    // Hebrew
    "טיסה",
    "מצב טיסה",
    // ... and other language variants
)
```

## Process to Toggle Airplane Mode

### Robot Automation Sequence

The Silent Robot uses this sequence to enable/disable airplane mode:

**Enable Airplane Mode (AIRPLANE_ON):**
```
1. open_settings                    → Opens Android Settings
2. click_any "Connections|..."      → Navigates to Connections/Network section
3. toggle_on_any "Airplane mode"... → Finds and enables airplane mode toggle
```

**Disable Airplane Mode (AIRPLANE_OFF):**
```
1. open_settings                    → Opens Android Settings
2. click_any "Connections|..."      → Navigates to Connections/Network section
3. toggle_off_any "Airplane mode"..→ Finds and disables airplane mode toggle
```

### Quick Actions

From the Silent app Robot page:

- **Enable Airplane Mode** → Quick Actions → "Enable Airplane Mode"
- **Disable Airplane Mode** → Quick Actions → "Disable Airplane Mode" (shown after enabling)

### Manual UI Navigation Path

1. **Open Settings** → Tap Settings icon or use Quick Settings
2. **Tap Connections** or **Connection** (label varies by device)
3. **Find Airplane mode** toggle in the Connections section
4. **Tap the toggle** to enable/disable

## Accessibility Label Variants Supported

The robot service automatically tries these variants (in order) to accommodate different devices and manufacturers:

| Language | Variants |
|----------|----------|
| **English** | "Airplane mode", "Airplane", "Flight mode", "Plane mode", "Airplane,mode", "Airplane\nmode" |
| **Hebrew** | "טיסה", "מצב טיסה" |
| **Arabic** | "وضع الطائرة" |
| **Russian** | "Режим полёта" |
| **French** | "Mode avion" |
| **German** | "Flugzeugmodus" |
| **Spanish** | "Modo avión", "Modo avion" |
| **Chinese** | "飞行模式" |
| **Korean** | "비행기 모드", "비행기" |

## Debugging If Robot Can't Find Airplane Mode

If you see "Toggle not found" or "Element not found" errors:

### 1. Enable Ultra Verbose Logging
- Open Silent app
- Settings → Log Level → **Ultra Verbose (APK debug)**

### 2. Run the Action Again
- Robot page → Enable/Disable Airplane Mode

### 3. Check the Logs
- Go to Logs page
- Look for "Discovered labels:" messages
- Search for labels containing "airplane", "flight", or "mode"

### 4. Extract Device-Specific Labels

If your device uses different labels:

```bash
# Capture accessibility dump
adb shell uiautomator dump /sdcard/window_dump.xml

# Extract to your computer
adb pull /sdcard/window_dump.xml

# Search for the label in the XML
# Look for: text="..." content-desc="..." near class="android.widget.Switch"
```

### 5. Report the Label

If your device shows a different label:

1. Go to Help page in Silent app
2. Contact form → Describe the issue
3. Include:
   - Device model (Samsung Galaxy S21, etc.)
   - Android version
   - Device language
   - Exact label text from logcat/dump
   - Attachment: `window_dump.xml` (optional)

The label will be added in the next release.

## Testing Airplane Mode Toggle

### Automated Test

```bash
# Run Playwright tests for robot automation
npm test -- tests/robot.spec.ts
```

### Manual Test

1. Open Silent app
2. Go to Robot page
3. Tap "Enable Airplane Mode"
4. Verify Settings opens and airplane mode is toggled ON
5. Verify status bar shows airplane icon
6. Tap "Disable Airplane Mode" to restore

## Related Documentation

- [ROBOT_AUTOMATION_DEBUGGING.md](ROBOT_AUTOMATION_DEBUGGING.md) — Comprehensive label discovery and debugging guide
- [ROBOT_ACCESSIBILITY_SETUP.md](ROBOT_ACCESSIBILITY_SETUP.md) — Initial accessibility service setup for Android 13+
- [ANDROID_ROBOT_DEBUG.md](ANDROID_ROBOT_DEBUG.md) — Low-level robot service architecture
- [CLAUDE.md](CLAUDE.md) — Project overview and constraints

## Version History

- **v1.0.74** (2026-04-11): Added "Airplane mode" label discovered from Samsung device accessibility dump
- **v1.0.71**: Added comprehensive accessibility label logging in robot service
- **v1.0.69**: Added newline label variants for airplane mode
