# Silent Robot — Accessibility Service Setup Guide

## Overview

The Silent Robot feature requires **Accessibility Service** permissions to automatically navigate your Android device's Settings and control emergency alerts. This guide walks you through the complete setup process for different Android versions.

## Quick Setup (4 Steps)

1. **Open Accessibility Settings** — Tap the "Open Accessibility Settings" button in the app
2. **Find Silent Robot** — Scroll to find "Silent Robot" under Installed Services
3. **Allow Restricted Settings (Android 13+ only)** — Go to Settings → Apps → Silent → "Allow restricted settings"
4. **Enable & Confirm** — Toggle Silent Robot ON and tap "Allow" when prompted for full control

---

## Samsung Android 13+ — Complete Flow

Samsung devices running Android 13+ have stricter security. Sideloaded APKs cannot use accessibility services without explicit permission.

### Prerequisites
- Silent app installed from APK (sideloaded)
- Android 13 or later
- Samsung device (or similar Android 13+ behavior)

### Step-by-Step

#### Step 1: Open Accessibility Settings
**In the app:** Tap **"Open Accessibility Settings"** button → the Accessibility Settings page opens

**Manual alternative:**
- Settings → Accessibility (or Accessibility and display)
- Scroll to **Installed Services** or **Downloaded Apps**

#### Step 2: Find Silent Robot Service
- You'll see "Silent Robot" in the list
- It should show status: **OFF** or **Not enabled**

**Important:** You may see a dialog that says:
> "**Restricted setting**  
> Restricted settings require additional permission from the user. Some features will be unavailable."

- Tap **OK** to dismiss it (don't worry, the next step enables it)

#### Step 3: Allow Restricted Settings ⭐ CRITICAL
This is the Samsung Android 13+ requirement. Without this step, Silent Robot cannot be enabled.

1. **Go back** to the main Settings screen
2. Find **Apps** (or Application Manager)
3. Find **Silent** in the list
4. Tap **Silent** to open its app info page
5. **Scroll down** on the app info page until you see:
   > **Allow restricted settings**
6. **Toggle the switch ON** (it should turn blue)
7. A dialog may appear asking for confirmation — **tap OK**

#### Step 4: Return to Accessibility & Enable Silent Robot
1. Go back to **Settings → Accessibility → Installed Services**
2. Find **Silent Robot** again
3. **Toggle the switch ON** (it should turn blue)
4. A dialog will appear:
   > **Allow full control?**  
   > Grant Silent Robot full control over your device? […] **Allow**
5. **Tap "Allow"** to grant full control

#### ✅ Success!
The app should now show: **"Robot is ready!"**  
The accessibility service is active and you can use Quick Actions or record custom sequences.

---

## Troubleshooting

### Problem: "Restricted setting" Dialog Appears Again
**Cause:** You didn't complete Step 3 (Allow Restricted Settings)

**Solution:**
1. Dismiss the dialog (tap OK)
2. Go to Settings → Apps → Silent
3. Scroll down and toggle **"Allow restricted settings"** ON
4. Return to Accessibility and try again

### Problem: Silent Robot Toggle Won't Turn On
**Cause:** Missing the "Allow restricted settings" permission

**Solution:**
- Complete Step 3 of the guide above

### Problem: "This Feature Requires Accessibility Service"
**Cause:** Service isn't fully enabled or polling hasn't detected it yet

**Solution:**
1. Close the app completely
2. Go to Settings → Accessibility → Installed Services
3. Verify Silent Robot shows as **enabled** (toggle is ON and blue)
4. Reopen the Silent app

### Problem: Polling Stuck on "Waiting for you to enable the service…"
**Cause:** The app hasn't detected the service as enabled yet

**Solution:**
1. Force close the app: Settings → Apps → Silent → **Force Stop**
2. Reopen the app
3. The polling should now detect the enabled service

---

## Android 12 and Earlier

Android 12 and earlier don't have the "Allow restricted settings" requirement. The setup is simpler:

1. **Open Accessibility Settings**
2. **Scroll to find Silent Robot** under Installed Services
3. **Toggle ON** and confirm

---

## Permissions Granted

When you enable Silent Robot, the accessibility service gets these permissions:
- **Read device screen** — to detect the current screen and navigate
- **Navigate via button press** — to simulate taps and button presses
- **Access notification content** — to monitor system state changes

The app runs **only on your device** — no data is sent to external servers.

---

## If You Still Have Issues

1. **Check the app's diagnostic logs:**
   - Open app → Settings → Logging (set to "Verbose")
   - Reproduce the issue
   - Go to Logs page → Export Failure Report
   - Check for error messages starting with "robot:" or "accessibility:"

2. **Verify capacitor.config.json:**
   - The app internally checks that the Capacitor config includes `"providers": ["google"]`
   - If Firebase authentication is also failing, this may indicate a deployment issue

3. **Report the issue:**
   - Open Help page → Contact the Developer
   - Include your device model, Android version, and the error from step 1

---

## Quick Reference

| Step | What | Where | Expected Result |
|------|------|-------|-----------------|
| 1 | Open accessibility | Tap button in app | Accessibility Settings page opens |
| 2 | Find Silent Robot | Settings → Accessibility → Installed Services | See "Silent Robot" listed (OFF) |
| 3️⃣ | Allow restricted settings | Settings → Apps → Silent → scroll down → toggle ON | "Allow restricted settings" is enabled |
| 4 | Enable service | Accessibility → Installed Services → Silent Robot → toggle ON | Tap "Allow" in confirmation dialog |
| ✅ | Success | App shows "Robot is ready!" | Can use Quick Actions and recording |
