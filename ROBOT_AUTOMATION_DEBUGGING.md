# Robot Automation Debugging Guide

## Overview

The Silent Robot accessibility service automates UI navigation by **searching for UI elements by text labels** rather than pixel coordinates. This approach works across different screen sizes but fails when device-specific or locale-specific labels don't match our predefined list.

## Quick Diagnosis

1. **Enable Ultra Verbose Logging**:
   - Open Silent app → Settings → Log Level → **Ultra Verbose (APK debug)**

2. **Run the failing action**:
   - Robot page → Quick Actions → Silence WEA / Enable Airplane Mode / etc.

3. **Check for errors** in the app Logs page:
   - If you see "Toggle not found for:" or "None of [...] found on screen"
   - The element exists but its label isn't in our list

## Step-by-Step Debugging

### Step 1: Enable Logging
1. Open Silent app
2. Go to **Settings → Logging**
3. Change **Log Level** to **Ultra Verbose (APK debug)**
4. This enables detailed accessibility service logging

### Step 2: Capture Logcat Output
Open Android Studio or terminal:
```bash
adb logcat | grep WEARobotAccessibilityService
```

Or use Android Studio's Logcat viewer (Device Manager → your device → Logcat tab)

### Step 3: Run the Robot Action
1. Go to Robot page
2. Click the failing action (e.g., "Silence WEA")
3. Watch logcat for messages like:
```
Searching node: text='טיסה' desc='מצב טיסה' class='android.widget.TextView'
clickByAnyLabel: Looking for any of 5 labels. Discovered 47 total labels on screen.
All discovered labels: [text:טיסה, desc:מצב טיסה, text:..., ...]
```

### Step 4: Check Silent App Logs
1. Go to **Logs page** in Silent app
2. Look for error messages with "discovered" labels
3. Scroll through recent logs to find the failure
4. **Export JSON** to get complete structured logs

### Step 5: Extract Actual Labels
From logcat or exported JSON, identify what labels your device actually uses:
- **Hebrew device**: Shows "טיסה" instead of "Airplane mode"
- **Samsung device**: Shows "Airplane,mode" instead of "Airplane mode"
- **Some devices**: Show "Airplane\nmode" (label split across lines)

## Understanding Logcat Output

### Successful Match
```
Searching node: text='Safety & emergency' desc='' class='android.widget.TextView'
Found match for label: 'Safety & emergency'
Found Switch/CheckBox ancestor, state=true, target=false
Toggling Switch/CheckBox
```

### Failed Match (Element Not Found)
```
clickByAnyLabel: Looking for any of 5 labels. Discovered 47 total labels on screen.
All discovered labels: [text:בטיחות וחירום, desc:..., text:..., ...]
None of [Safety & emergency, Safety and emergency, ...] found on screen.
```
**Action**: Add "בטיחות וחירום" to the safety label list

### Failed Match (Toggle Not Found)
```
toggleByAnyLabel: Looking for any of 18 labels. Discovered 23 total labels on screen.
All discovered labels: [text:Airplane mode, desc:Airplane mode, ...]
Found match for label: 'Airplane mode'
Quick Settings tile check: desc='Airplane,mode,Off,Button' isOn=false isOff=true
Toggle not found for: [Airplane mode, ...]
```
**Meaning**: Found the element but couldn't find a clickable toggle

## Common Patterns by Device

### Samsung Devices
- Use **commas** instead of spaces: "Airplane,mode" instead of "Airplane mode"
- Content descriptions include state: "Airplane,mode,Off,Button"
- Example labels:
  ```
  "Safety,&,emergency"
  "Wireless,Emergency,Alerts"
  "Extreme,threats"
  ```

### Newline-Split Labels
Some devices split labels across multiple lines:
- "Airplane\nmode" instead of "Airplane mode"
- "Safety\n&\nemergency" instead of "Safety & emergency"

### Locale-Specific Labels
- **Hebrew**: "טיסה" (airplane), "בטיחות וחירום" (safety and emergency), "התרעות קיצוניות" (extreme threats)
- **Arabic**: "وضع الطائرة" (airplane mode)
- **Russian**: "Режим полёта" (airplane mode)
- **Chinese**: "飞行模式" (airplane mode)
- **Korean**: "비행기 모드" (airplane mode)

## Adding New Labels

### 1. Identify the Label
From logcat or app logs, find the exact text:
```
Discovered on screen: [..., text:'בטיחות וחירום', ...]
```

### 2. Locate the Label List
Edit `android/app/src/main/java/com/ikrigel/silent/WEARobotModels.kt`

### 3. Add the Label
```kotlin
// Before:
private val safetyLabels = listOf(
    "Safety & emergency",
    "Safety and emergency",
    // ... other variants
)

// After:
private val safetyLabels = listOf(
    "Safety & emergency",
    "Safety and emergency",
    "בטיחות וחירום",  // Hebrew: Safety and emergency (NEW)
    // ... other variants
)
```

### 4. Rebuild APK
```bash
npm run build
npx cap sync android
cd android
./gradlew clean assembleRelease
```

### 5. Test
Install the new APK and verify the action works.

## Troubleshooting Checklist

### "Robot is busy" Error
- [ ] Check that accessibility service is enabled in Settings → Accessibility
- [ ] Verify Silent Robot service is turned ON
- [ ] Try again after waiting a few seconds (15-second timeout auto-reset)
- [ ] Restart the app if error persists

### "Toggle not found" Error
- [ ] Enable Ultra Verbose logging
- [ ] Run the action again
- [ ] Check logcat for "Discovered on screen:" message
- [ ] Add the discovered labels to the appropriate list in `WEARobotModels.kt`

### "None of [...] found on screen" Error
- [ ] Verify you're at the correct Settings page (logcat should show window change)
- [ ] Check if page is in a different language (logs show actual device text)
- [ ] Try scrolling down if element is below current view
- [ ] Increase delay in `handlePlaybackEvent()` if page is slow to load

### Settings Page Won't Open
- [ ] Verify accessibility service is enabled
- [ ] Check device language/locale (affects Settings UI)
- [ ] Try opening Settings manually to ensure device supports it

## Architecture

### Key Classes

#### WEARobotAccessibilityService
- **Purpose**: Intercepts UI accessibility events and performs automation
- **Location**: `android/app/src/main/java/com/ikrigel/silent/WEARobotAccessibilityService.kt`
- **Key Methods**:
  - `findNodeByText(node, query)` — DFS search for element with matching text/description
  - `collectAllLabels(node)` — Recursively gather all labels on screen for debugging
  - `toggleByAnyLabel(labels, targetState)` — Find and toggle any element from list
  - `clickByAnyLabel(labels)` — Find and click any element from list

#### WEARobotModels
- **Purpose**: Predefined UI automation sequences and label lists
- **Location**: `android/app/src/main/java/com/ikrigel/silent/WEARobotModels.kt`
- **Contains**:
  - Label lists for Safety & Emergency, WEA, Airplane Mode (multi-language, multi-format)
  - Built-in recording definitions (SILENCE_WEA, RESTORE_WEA, AIRPLANE_ON, AIRPLANE_OFF)

#### WEARobotPlugin
- **Purpose**: Kotlin/JavaScript bridge for robot control
- **Location**: `android/app/src/main/java/com/ikrigel/silent/WEARobotPlugin.kt`
- **Exports**:
  - `startRecording()` / `stopRecording()` — User-recorded sequences
  - `executeRecording(id)` — Play any sequence (built-in or user-recorded)
  - `silenceWEA()` / `unsilenceWEA()` / `enableAirplaneMode()` / `disableAirplaneMode()`

### Logging Flow
1. **App Level** (v1.0.70+): `writeLog('ultraverbose', message)` to localStorage
2. **Accessibility Service**: `android.util.Log.d("WEARobotAccessibilityService", message)` to logcat
3. **User Export**: Download JSON from Logs page in app
4. **Debugging**: View logcat in Android Studio or `adb logcat`

## Version History

- **v1.0.67**: Added 15-second timeout to prevent service getting stuck
- **v1.0.69**: Added newline label variants for airplane mode and WEA
- **v1.0.70**: Added ultraverbose log level for native auth debugging
- **v1.0.71**: Added comprehensive accessibility label logging in robot service

## Support

If you're unable to get robot automation working:

1. **Collect all evidence**:
   - Full logcat output from `WEARobotAccessibilityService`
   - Exported logs JSON from app Logs page
   - Device model and Android version
   - Current app language/locale

2. **Share with developer**:
   - Go to Help page
   - Send the collected logs and device info
   - Describe which actions are failing

3. **Temporary Workaround**:
   - Use custom recordings (Robot → Record New Sequence)
   - Record exact steps to navigate to the settings you need
   - Use Quick Actions instead of built-in ones
