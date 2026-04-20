# APK Installation via ADB

## Prerequisites

1. **ADB installed** — Download from [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools)
2. **Device connected** — USB cable with USB debugging enabled
3. **APK built** — Available at `android/app/build/outputs/apk/release/app-release.apk`

## Verify Device Connection

Before installing, ensure your device is detected:

```powershell
C:\Users\ikrig\Downloads\platform-tools\adb devices
```

**Expected output:**
```
List of attached devices
emulator-5554          device
```

If your device doesn't appear:
- Enable USB debugging: Settings → Developer Options → USB Debugging
- Authorize the computer on the device (trust prompt)
- Try `adb devices` again

---

## Installation Steps

### Step 1: Uninstall Old Version (if present)

```powershell
C:\Users\ikrig\Downloads\platform-tools\adb uninstall com.ikrigel.silent
```

**Expected output:**
```
Success
```

**Note:** If the app isn't installed, you'll see `Error while executing: cmd 'package uninstall ...'` — this is safe to ignore.

### Step 2: Install New APK

```powershell
C:\Users\ikrig\Downloads\platform-tools\adb install "C:\silent\android\app\build\outputs\apk\release\app-release.apk"
```

**Expected output:**
```
Performing Streamed Install
Success
```

---

## Verify Installation

After installation succeeds, you should see:
1. **App icon** on home screen (teal circle with ZZZ + phone)
2. **Silent app** in Settings → Apps → App list
3. App launches when tapped

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `error: device not found` | Device not connected or not detected | Check USB connection, enable USB debugging, run `adb devices` |
| `INSTALL_FAILED_INVALID_APK` | APK is corrupted or unsigned | Rebuild APK: `cd android && ./gradlew assembleRelease` |
| `INSTALL_FAILED_APP_INCOMPATIBLE` | Device Android version too old | App requires Android 6.0+ (API 21+) |
| `INSTALL_FAILED_DUPLICATE_PACKAGE` | Old version still partially installed | Manually uninstall via Settings or use `adb shell pm uninstall -k com.ikrigel.silent` |
| `Permission denied` | ADB executable not in PATH | Use full path as shown above |

---

## Building APK Locally

If the APK doesn't exist at the expected path, build it first:

```powershell
cd C:\silent
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

This creates `android/app/build/outputs/apk/release/app-release.apk` (≈20-30 MB).

---

## Tips

- **Keep adb path handy:** Add `C:\Users\ikrig\Downloads\platform-tools\` to PATH environment variable for shorter commands
- **Force install:** Use `adb install -r` flag to reinstall over existing version (skips uninstall step)
  ```powershell
  C:\Users\ikrig\Downloads\platform-tools\adb install -r "C:\silent\android\app\build\outputs\apk\release\app-release.apk"
  ```
- **View install logs:** Use `adb logcat` to monitor installation and app startup
  ```powershell
  C:\Users\ikrig\Downloads\platform-tools\adb logcat | grep -i silent
  ```

---

## Quick Reference

**Full installation workflow:**
```powershell
# Build APK
cd C:\silent
npm run build && npx cap sync android
cd android && ./gradlew assembleRelease

# Install on device
C:\Users\ikrig\Downloads\platform-tools\adb uninstall com.ikrigel.silent
C:\Users\ikrig\Downloads\platform-tools\adb install "C:\silent\android\app\build\outputs\apk\release\app-release.apk"

# Check if running
C:\Users\ikrig\Downloads\platform-tools\adb logcat | grep -i silent
```

---

**Last Updated:** 2026-04-20 (v1.0.87)
