# Android Robot Automation Debugging Guide

## Quick Links
- **Accessibility Inspector**: Inspect UI hierarchy to see what labels exist
- **Logcat Filter**: Filter robot service and accessibility logs
- **Emulator**: Test on Android 14 emulator with predictable UI

---

## Setup: Android Studio + Device

### Step 1: Install Android Studio & Connect Device
1. Download [Android Studio](https://developer.android.com/studio)
2. Open the `android/` folder in Silent project
3. Connect your device via USB or use Android Emulator
4. Verify device is detected: `adb devices`

### Step 2: Open the Project
```bash
cd silent/android
open . # or use Android Studio → File → Open → select android folder
```

### Step 3: Run the APK with Debugger
1. In Android Studio: **Run → Run 'app'**
2. Select your device
3. Wait for APK to install and app to launch

---

## Debugging Robot Automation Issues

### Problem: "Toggle not found for: [Airplane mode, Airplane, ...]"

This means the accessibility service can't find the UI element. The device's Settings screen uses different labels than expected.

### Solution A: Use Accessibility Inspector (Easiest)

1. **Enable Accessibility Inspector**:
   - On device: Settings → Developer Options → Enable "Accessibility Inspector"
   - Or in emulator: AVD Manager → Advanced Settings → Enable Accessibility

2. **Open Silent and navigate to Settings**:
   - Settings → Network → Airplane Mode (or Safety & Emergency)

3. **Open Accessibility Inspector**:
   - Device: Swipe from bottom-right corner to open recent apps
   - Find "Accessibility Inspector" app, tap it
   - It will show the **exact UI labels and hierarchy**

4. **Look for the toggle**:
   - Inspect each UI element
   - Find the exact text label (e.g., "Airplane mode", "Flight mode", etc.)
   - Note the content description if available

5. **Add missing label to code**:
   - File: `android/app/src/main/java/com/ikrigel/silent/WEARobotModels.kt`
   - Find the `airplaneLabels` or `safetyLabels` list (lines 84-104)
   - Add your device's exact label text

### Solution B: Use logcat to See What Robot Found

1. **Open Android Studio Logcat**:
   - Android Studio → View → Tool Windows → Logcat
   - Or press `⌘ K` (Mac) or `Ctrl Shift 5` (Windows)

2. **Filter for robot logs**:
   - Search box: `robotService` or `WEARobot`
   - Set log level to **Verbose**

3. **Run a robot action**:
   - In Silent: Robot → Quick Actions → Enable Airplane Mode
   - Watch logcat for errors like:
     ```
     robotService: enableAirplaneMode failed: Toggle not found for: [...]
     ```

4. **Add debugging**:
   - Check what elements ARE on screen by looking for `findToggleAncestor` logs
   - The toggle text that WAS found will show nearby in logs

### Solution C: Inspect Raw Accessibility Tree

**For advanced debugging**, use Android's `adb shell` to dump the accessibility hierarchy:

```bash
adb shell dumpsys accessibility > accessibility_dump.txt
# or for specific app:
adb shell "dumpsys accessibility | grep -A 200 'com.ikrigel.silent'"
```

This shows the exact text and content descriptions available to accessibility services.

---

## Common Issues & Fixes

### Issue 1: "Airplane mode" toggle not found
- **Device may use**: "Flight mode", "Plane mode", or different language
- **Fix**: Find exact label using Accessibility Inspector, add to `airplaneLabels` list

### Issue 2: "Safety & emergency" not found  
- **Device may use**: "Safety and emergency", "Emergency alerts", or different language
- **Fix**: Add to `safetyLabels` list in WEARobotModels.kt

### Issue 3: Robot can't navigate to Settings
- **May need to record custom sequence** instead of using built-in
- **Fix**: Robot → Record New Sequence → manually tap through Settings

### Issue 4: Accessibility service reports as disabled
- **Fix**: Go to Robot page → Follow setup guide → Enable in Accessibility settings

---

## Recording Custom Sequences (Most Reliable)

If built-in sequences don't work, record your device's exact UI flow:

1. **Enable accessibility service**:
   - Robot page → Follow setup wizard
   - Grant all permissions

2. **Start recording**:
   - Robot page → "Record New Sequence"
   - Name: "Airplane Mode Toggle"

3. **Manually do the action**:
   - Tap through: Settings → Network → Airplane Mode → Toggle ON
   - Each tap is captured with exact coordinates and text

4. **Save the recording**:
   - Tap "Stop"
   - Name the sequence
   - Now you can run it anytime

**Why this works**: Records actual coordinates + text, not just text labels.

---

## Verifying Capacitor Config

The logs show `Capacitor.config` is empty at runtime. This is expected behavior - the config should be embedded in native code, not exposed to JavaScript.

To verify Firebase plugin IS configured:

1. **Check native files**:
   ```bash
   grep -r "FirebaseAuthentication" android/app/src/main/
   cat android/app/src/main/AndroidManifest.xml | grep firebase
   ```

2. **Check build output**:
   - Run: `./gradlew clean assembleRelease --info` 
   - Search output for "firebase" or "FirebaseAuthentication"

3. **Rebuild with fresh sync**:
   ```bash
   npm run build
   npx cap sync android
   cd android && ./gradlew clean assembleRelease
   ```

---

## Logcat Filter Expressions

### For Robot Service
```
robotService
```

### For Accessibility Events
```
WEARobotAccessibilityService
```

### For Firebase Auth
```
FirebaseAuthentication
```

### For All Silent logs
```
com.ikrigel.silent
```

### Combined (show all at once)
```
(robotService|WEARobot|FirebaseAuthentication|com.ikrigel.silent)
```

---

## Next Steps

1. **Use Accessibility Inspector** to find exact UI labels on your device
2. **Record custom sequences** if built-in labels don't match your device
3. **Share findings**: Tell us the exact labels and manufacturer/Android version
4. **Contribute**: Your labels can help other users with similar devices

