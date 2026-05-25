# Silent App — Implementation Summary

## Project Overview
**Silent** is a React SPA for scheduling emergency alert silencing periods on Android devices.

**Latest Version:** 1.0.113 (2026-05-25)

---

## Major Features & Implementations

### 1. Android Accessibility Service Robot (v1.0.60+)

**Purpose:** Automate emergency alert silencing on Android devices via accessibility service.

**Key Components:**
- `WEARobotAccessibilityService.kt` — Native accessibility service capturing device automation
- `robotService.ts` — TypeScript service exposing actions (enable/disable airplane mode, silence WEA, etc.)
- Robot page UI for manual controls and quick actions
- Multi-language label support (English, Hebrew, Arabic, Russian, French, German, Spanish, Chinese, Korean)

**Capabilities:**
- Toggle airplane mode (with safe-state tracking)
- Silence WEA (Wireless Emergency Alerts)
- Access system settings pages
- Capture accessibility tree for debugging
- Device-specific label discovery and matching

**Label Discovery (v1.0.71+):**
- Ultra-verbose logging captures all accessibility nodes encountered
- Helps debug cross-device UI automation issues
- Labels vary by device, language, and Samsung/stock Android differences
- See [ROBOT_ACCESSIBILITY_SETUP.md](ROBOT_ACCESSIBILITY_SETUP.md) and [ADB_ACCESSIBILITY_TREE.md](ADB_ACCESSIBILITY_TREE.md)

**Multi-Page Navigation with Scroll-Retry (v1.0.110+, Enhanced v1.0.112+):**
- **Problem Solved:** Robot automation failed when target UI was on second/third pages of scrollable containers (QS panels, Settings screens)
- **Solution v1.0.110:** Implemented scroll-retry loops in `clickByAnyLabel()` and `toggleByAnyLabel()` with vertical scrolling
- **Solution v1.0.112:** Added 3-scroll strategy for horizontal pagination:
  1. Try ACTION_SCROLL_FORWARD on root (vertical)
  2. Try ACTION_SCROLL_FORWARD on scrollable node (vertical)
  3. Try ACTION_SCROLL_BACKWARD on scrollable node (horizontal pagination to next page)
- **Features:**
  - `clickByAnyLabel()`: Empty-tree wait (0–2s) + 7-pass scroll-retry with 3-scroll strategy
  - `toggleByAnyLabel()`: 7-pass outer loop with 3-scroll strategy and 600ms delays between passes
  - `findScrollableNode()` helper finds next scrollable container via accessibility tree
  - Detailed logging shows scroll results and which pass element was found on
- **Benefits:**
  - Handles horizontally-paginated QS panels (Samsung Quick Settings pages 1-3)
  - Eliminates "element not found" failures for multi-page screens
  - Configurable pass counts (7) balance thoroughness vs. speed
  - Supports both vertical and horizontal pagination on same device

---

### 2. Schedule Management System (v1.0.60+)

**Features:**
- Create, read, update, delete schedules
- Validate schedule names (required field) — v1.0.82
- Time-based triggers for automatic silencing
- Airplane mode state snapshot and restore — v1.0.82
- Form re-sync on edit dialog open — v1.0.82
- Zustand state management with persist middleware

**Form Validation (v1.0.82):**
- Schedule name field: required with i18n error message
- SchedulerForm uses React Hook Form with proper error handling
- Error messages display in TextField `helperText`

**Schedule Edit Re-sync (v1.0.82):**
- Form resets to initial values when dialog opens
- Prevents stale form state on subsequent edits
- useEffect monitors `open` and `initial` props

**State Persistence (v1.0.82):**
- robotStateStore persists device snapshots in localStorage
- Snapshots survive page refreshes
- Used by schedule end handler to restore airplane mode state

---

### 3. OAuth Authentication System (v1.0.59+)

**Web Authentication:**
- Redirect-based OAuth flow (`signInWithRedirect` → Google → `/api/auth/callback`)
- Server-side token exchange (no COOP header blocking)
- Firebase custom token minting
- Error handling with i18n messages

**Mobile Authentication (APK):**
- Native Firebase auth via `@capacitor-firebase/authentication`
- Google OAuth through Android system
- SHA-1 fingerprints in `google-services.json` for signing validation

**Critical Setup:**
- OAuth consent screen configured in Google Cloud Console
- Vercel secrets for server-side credentials
- See [FIREBASE_INTEGRATION.md](FIREBASE_INTEGRATION.md)

---

### 4. Logging System (v1.0.60+)

**Levels:** none, error, info, verbose, ultraverbose
- **ultraverbose (v1.0.70+):** Captures every accessibility node, label, window change, and auth step
- Used for debugging robot automation and native Firebase auth
- All logs stored in localStorage (max 500 entries)
- Exportable as JSON from Logs page

**Logs Page UI (v1.0.110+):**
- **Search:** Real-time text search with yellow highlighting across message + metadata
- **Level Filters:** Chips for all, error, failures, info, verbose, ultraverbose
- **Sort Toggle:** Switch between newest (default) and oldest first
- **Count Display:** "Showing X of Y" when filters active
- **Index Column:** Row numbers (#) for easy log reference
- **Components:**
  - `src/pages/Logs/LogFilterBar.tsx` — Filter controls
  - `src/pages/Logs/LogList.tsx` — Enhanced table with highlighting
  - `src/pages/Logs/index.tsx` — Filter state + useMemo for `filteredLogs`

---

### 5. Theme System (v1.0.60+)

**Modes:** light, dark, time
- **Time mode:** Sinusoidal brightness curve — light at noon, dark at midnight
- Updates every 5 seconds
- Parallax background with opacity adaptation
- Persisted in localStorage

---

### 6. Internationalization (i18n) (v1.0.60+)

**Languages:** English (LTR) and Hebrew (RTL)
- Translation files: `src/i18n/en.json` and `src/i18n/he.json`
- RTL support with MUI theme direction
- Language switcher in header

---

### 7. Element Tracker Library (v1.0.82)

**Purpose:** Record and replay UI interactions for testing/analysis.

**Package Location:** `packages/element-tracker/`

**Exports:**
- `ElementTracker` class with recording/playback lifecycle
- `TrackedElement`, `ElementInteraction`, `InteractionAction` types
- Session serialization/deserialization
- Full TypeScript strict mode support

**Usage:**
```typescript
import { ElementTracker } from 'silent-element-tracker';

const tracker = new ElementTracker();
tracker.startRecording();
// ... user interactions ...
const session = tracker.stopRecording();
const json = tracker.serialize(session);
```

---

### 8. Android Build Configuration (v1.0.54+)

**Build Tools:**
- Gradle 9.3.1 (Java 21 toolchain)
- Android Gradle Plugin 8.13.0
- Kotlin 2.1.0 (compatible with Firebase BOM 33.0.0)
- Capacitor 8.2.0

**ProGuard Config (v1.0.86):**
- Fixed: Changed `proguard-android.txt` → `proguard-android-optimize.txt`
- Required for Android Gradle Plugin 7.0+

**Firebase Dependencies:**
- Firebase BOM 33.0.0 (supports Kotlin 2.1.0)
- Firebase Auth 24.0.1
- Capacitor Firebase Auth 8.2.0

---

### 9. App Icons & Branding (v1.0.87)

**Adaptive Icon System (Android 8+):**
- **Background:** Teal color (#26A69A) from `values/ic_launcher_background.xml`
- **Foreground:** Vector drawable with white ZZZ letters + phone outline
- File: `drawable-v24/ic_launcher_foreground.xml`

**Raster Fallback (Android < 8):**
- 15 PNG files generated at all DPI densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- **ic_launcher.png** — Full icon (teal background + white foreground)
- **ic_launcher_round.png** — Circular masked version
- **ic_launcher_foreground.png** — Transparent background for safe zone
- Generated by `generate_launcher_icons.py` (Python/Pillow)

**Splash Screens (v1.0.84):**
- Teal background with white ZZZ letters + phone outline
- Landscape and portrait variants at all DPI densities
- Generated by `generate_splash_pngs.py` (Python/Pillow)

**Critical Fix (v1.0.87):**
- Icon was rendering as white square because `ic_launcher_background.xml` was set to `#FFFFFF`
- Fixed: Changed to `#26A69A` (teal) to match vector foreground
- All 15 launcher icon PNGs regenerated with correct design

---

### 10. Scheduler Robot Action Execution (v1.0.96+)

**Problem Solved:** Scheduler correctly detected active schedules but did NOT execute robot actions (airplane mode, WEA silence, custom recordings) on the phone.

**Root Cause:** `prevActiveIds` state in Dashboard was initialized as empty `Set()`, preventing action execution when a schedule was already active at component mount time.

**Solution:** Initialize `prevActiveIds` with currently active schedules at component mount:
```typescript
useEffect(() => {
  const initialActive = getActiveSchedules();
  prevActiveIds.current = new Set(initialActive.map((s) => s.id));
}, [loadSchedules]);
```

**Verification:** 
- Added emoji-prefixed logging to track action execution:
  - `🚀 STARTING ROBOT ACTIONS` — action execution triggered
  - `📡 AIRPLANE MODE: Enabling` — airplane mode action running
  - `🔇 WEA SILENCE: Starting` — WEA silence action running
  - `🏁 ALL ROBOT ACTIONS COMPLETED` — all actions finished
- Created Playwright test: "Robot actions fire when schedule with useAirplaneMode becomes active"
- Test verifies logs appear when schedule becomes active

**Features Enabled:**
- `useAirplaneMode?: boolean` — toggle airplane mode when schedule starts
- `silenceWEAOnStart?: boolean` — silence WEA alerts when schedule starts
- `robotRecordingId?: string` — execute custom robot recordings
- `restoreOnEnd?: boolean` — restore airplane mode state after schedule ends
- `unsilenceWEAOnEnd?: boolean` — restore WEA when schedule ends

---

### 11. WEA Silence Calibration (v1.0.95+)

**Problem:** Device-specific timing prevents reliable WEA silencing via accessibility service.

**Solution:** Learning mode mirrors airplane mode — users calibrate by watching and confirming which timing works on their device.

**Components:**
- `src/store/weaLearningStore.ts` — persist learned timing
- `src/services/weaSilenceService.ts` — three-branch silence() with learned/learning/default modes
- `src/pages/Robot/WeaLearningDialog.tsx` — calibration UI and feedback prompts

---

### 12. Airplane Mode Learning Mode (v1.0.93+)

**Problem:** Airplane mode automation had unreliable state validation — `getAirplaneModeState()` returns false negatives; retries often navigate to wrong screen.

**Solution:** User-calibrated timing — watch attempts and confirm which one works, then save that timing for future runs.

**Components:**
- `src/store/airplaneLearningStore.ts` — persist learned timing (0, 3000, or 5000 ms)
- `src/services/airplaneModeService.ts` — three-branch enable() with learned/learning/default modes
- `src/pages/Robot/AirplaneLearningDialog.tsx` — "Calibrate Airplane Mode" button + feedback UI

---

### 13. Documentation & Guides

**Available Markdown Files:**
- [ANDROID_BUILD_DEBUGGING.md](ANDROID_BUILD_DEBUGGING.md) — Kotlin/Gradle troubleshooting
- [ROBOT_ACCESSIBILITY_SETUP.md](ROBOT_ACCESSIBILITY_SETUP.md) — Accessibility service setup & permissions
- [ADB_ACCESSIBILITY_TREE.md](ADB_ACCESSIBILITY_TREE.md) — UIAutomator dump format and usage
- [AIRPLANE_MODE_LABEL_DISCOVERY.md](AIRPLANE_MODE_LABEL_DISCOVERY.md) — Label extraction via ADB
- [WINDOWS_SPLASH_README.md](WINDOWS_SPLASH_README.md) — Python splash screen generation for Windows
- [FIREBASE_INTEGRATION.md](FIREBASE_INTEGRATION.md) — OAuth consent screen & authentication setup

---

## File Structure

```
src/
├── i18n/                    — en.json + he.json translations
├── types/index.ts           — All TypeScript types
├── services/                — Auth, storage, robot, logging, etc.
├── store/                   — Zustand: auth, scheduler, robot, logs, settings
├── theme/                   — Colors, theming logic
├── hooks/                   — useAppTheme, useTranslation integration
├── components/
│   ├── Layout/              — AppLayout, Sidebar, Header
│   └── LanguageSwitcher.tsx
└── pages/                   — Dashboard, Scheduler, Logs, Settings, Robot, etc.

android/
├── app/src/main/
│   ├── java/com/ikrigel/silent/
│   │   ├── WEARobotAccessibilityService.kt  — Robot automation service
│   │   ├── WEARobotModels.kt                — Predefined label lists
│   │   ├── MainActivity.java
│   │   └── ...
│   └── res/
│       ├── drawable-v24/ic_launcher_foreground.xml  — Vector icon
│       ├── mipmap-*/ic_launcher*.png                — Raster icons (15 files)
│       ├── drawable*/splash.png                     — Splash screens
│       └── values/ic_launcher_background.xml        — Adaptive icon background
├── build.gradle             — Gradle config with Java 21 toolchain
└── gradle.properties        — Kotlin/JVM settings

packages/
└── element-tracker/         — NPM library for interaction tracking
    ├── src/
    │   ├── types.ts
    │   ├── tracker.ts
    │   └── index.ts
    ├── package.json
    └── README.md

tests/
├── navigation.spec.ts
├── dashboard.spec.ts
├── scheduler.spec.ts
├── logs.spec.ts
├── settings.spec.ts
├── about.spec.ts
├── help.spec.ts
├── language.spec.ts
└── robot.spec.ts

.github/workflows/
├── deploy.yml               — Web: tests → Vercel
└── build-apk.yml            — APK: triggered by git tag v*
```

---

## Version History & Key Changes

### v1.0.98 (2026-05-08) — Comprehensive Diagnostic Logging & Version Display
- ✅ Added: Extensive emoji-prefixed logging throughout robot action execution (⚡, ⚙️, 🚀, 📡, 🔇, 🏁)
- ✅ Added: Error stacks in all catch blocks for detailed debugging
- ✅ Added: Outer error handlers to catch unexpected failures
- ✅ Fixed: Version display in About page — clearly shows current vs available
- ✅ Added: Quick version check in header (click ℹ️ icon)
- ✅ Shows: Environment (Web Browser or APK) with each version

### v1.0.97 (2026-05-08) — Robot Action Execution Fix & Version Sync
- ✅ Fixed: Robot actions (airplane mode, WEA silence) now execute when schedules become active
- ✅ Fixed: prevActiveIds initialization bug — now tracks currently active schedules at mount
- ✅ Added: Emoji-prefixed logging (🚀, 📡, 🔇, 🏁) for robot action verification
- ✅ Added: Comprehensive test for robot action execution verification
- ✅ Updated: Android versionCode 73 → 97, versionName 1.0.73 → 1.0.97 (now synced with web)

### v1.0.96 (2026-05-07) — WEA Silence Calibration & Learning Mode
- ✅ Implemented: WEA silence learning mode (mirrors airplane mode calibration)
- ✅ Added: Three-branch weaSilenceService with learned/learning/default modes
- ✅ Added: WeaLearningDialog for calibration UI and feedback prompts
- ✅ Fixed: WEA learning mode feedback loop — always shows dialog even on error
- ✅ Updated: weaSilenceService error handling for reliable feedback prompts

### v1.0.95 (2026-05-05) — Scheduler Integration & WEA Auto-Silencing
- ✅ Added: `silenceWEAOnStart` field to ScheduleEntry
- ✅ Updated: SchedulerForm with checkbox for WEA silencing option
- ✅ Integrated: weaSilenceService into Dashboard robot action execution
- ✅ Added: i18n strings for WEA silence option in scheduler form

### v1.0.94 (2026-05-02) — Ultraverbose Logging & Scheduler Debugging
- ✅ Added: Extensive ultraverbose logging to isScheduleActive()
- ✅ Added: Schedule detection logs to getActiveSchedules()
- ✅ Improved: Debugging visibility for scheduler tick loop

### v1.0.93 (2026-04-28) — Airplane Mode Learning Mode
- ✅ Implemented: Airplane mode calibration system (learned/learning/default branches)
- ✅ Added: airplaneLearningStore with persistence (0, 3000, 5000 ms timing)
- ✅ Added: AirplaneLearningDialog for calibration UI
- ✅ Added: provideAirplaneFeedback() for async user feedback integration
- ✅ Updated: airplaneModeService with three-branch enable() logic

### v1.0.87 (2026-04-20) — Launcher Icons & Background Color
- ✅ Fixed: Adaptive icon background color (#FFFFFF → #26A69A teal)
- ✅ Generated: All 15 raster launcher icon PNGs (mdpi through xxxhdpi)
- ✅ Updated: `generate_launcher_icons.py` for all 3 variants (ic_launcher, ic_launcher_round, ic_launcher_foreground)
- ✅ Fixed: ic_launcher_foreground.xml removed invalid fillColor="none"
- ✅ Home screen icon now displays teal circle with white ZZZ + phone

### v1.0.86 (2026-04-20) — Icon & Splash Screen Foundation
- ✅ Created: `generate_launcher_icons.py` for icon generation
- ✅ Created: `generate_splash_pngs.py` for splash screen generation
- ✅ Updated: ic_launcher_foreground.xml with stroked paths (ZZZ + phone)
- ✅ Windows compatibility: Python/Pillow instead of Bash/ImageMagick

### v1.0.85 & Earlier
- Airplane mode automation (v1.0.77)
- Robot state persistence (v1.0.82)
- Scheduler form validation & re-sync (v1.0.82)
- Element tracker library (v1.0.82)
- ProGuard config fix (v1.0.86)
- Splash screen regeneration (v1.0.84)
- Firebase OAuth implementation (v1.0.59–1.0.60)
- Accessibility service (v1.0.60+)
- Theme system & i18n (v1.0.60+)
- Logging system (v1.0.60+)
- Kotlin 2.1.0 upgrade (v1.0.54+)

---

## Testing

**Framework:** Playwright (Chromium, Firefox, WebKit, mobile Chrome)

**Test Coverage:**
- Navigation between pages
- Dashboard schedule actions
- Scheduler form validation & submission
- Logs viewing & export
- Settings theme/language switching
- Language RTL support
- Helper page EmailJS submit
- Robot automation (accessibility service mocking)

**Run Tests:**
```bash
npm test              # Headless
npm run test:ui       # Interactive mode
npm run test:headed   # Browser visible
npm run test:report   # View HTML report
```

---

## Deployment

**Web:** GitHub Actions (`deploy.yml`)
- Tests pass → Build (`tsc && vite build`) → Deploy to Vercel
- URL: https://silent-eight.vercel.app

**APK:** GitHub Actions (`build-apk.yml`)
- Triggered by: `git tag v*`
- Build: `npm run build && npx cap sync android && ./gradlew assembleRelease`
- Output: `android/app/build/outputs/apk/release/app-release.apk`
- Distribution: GitHub Releases with pre-built APK

**Manual Web Deploy:**
```bash
npm run deploy  # runs vercel --prod
```

---

## Known Issues & Constraints

### 1. JVM Target Alignment (v1.0.54+)
All layers must use Java 21:
- Gradle daemon: `gradle.jvm.version=21`
- Kotlin: `jvmTarget = "21"`
- Java compilation: `sourceCompatibility JavaVersion.VERSION_21`

### 2. Kotlin 2.1.0 Heap Requirements
Linting phase needs: `-Xmx4g -XX:MaxMetaspaceSize=1g` in gradle.properties

### 3. Accessibility Labels Are Device-Specific (v1.0.71+)
- Samsung devices use different separators (`,` instead of space)
- Different locales have different label text
- Solution: Enable Ultra Verbose logging and extract labels from logcat

### 4. Capacitor Auto-Generated Files
`capacitor.build.gradle` is regenerated by `npx cap sync`
- Manual Java version updates may be overwritten
- Document and re-apply after Capacitor sync

---

## Security Considerations

- ✅ Firebase security rules: Users can only access their own documents
- ✅ Server-side OAuth: Client secret never exposed to frontend
- ✅ Custom tokens: Minted server-side by Firebase Admin SDK
- ✅ APK signing: Release builds use stored keystore
- ✅ Environment secrets: Vercel Secrets for all sensitive values
- ⚠️ **ProGuard:** Enabled for release builds (obfuscation + optimization)

---

## Contributing Guidelines

1. **Max 250 lines per file** — refactor if approaching limit
2. **TypeScript strict mode** — no `any`
3. **User-facing strings:** Use `useTranslation()` and i18n keys
4. **State management:** Zustand with persist middleware for localStorage
5. **File storage:** All persistence through `src/services/storage.ts`
6. **IDs:** Use `crypto.randomUUID()`
7. **Commit messages:** Clear, concise, reference version if applicable
8. **Tests:** Playwright for UI, with mocked external services

---

## Quick Reference

### Generate Assets (Windows)
```powershell
# Splash screens
python generate_splash_pngs.py

# Launcher icons
python generate_launcher_icons.py
```

### Build APK (Local)
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```

### Run Tests
```bash
npm test           # Headless
npm run test:ui    # Interactive
```

### Deploy Web
```bash
npm run deploy     # Vercel production
```

### Trigger APK Build
```bash
git tag v1.0.XX
git push origin master v1.0.XX
```

---

**Last Updated:** 2026-05-08 (v1.0.98)
