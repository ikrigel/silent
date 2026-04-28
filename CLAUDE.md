# CLAUDE.md — Silent App

## Project Overview
**Silent** is a React SPA for scheduling emergency alert silencing periods.
Developer: **Igal Krigel** | Location: Ramat Zvi, Israel

## Tech Stack
- **React 18** + **TypeScript** (strict mode)
- **Vite** bundler
- **MUI v5** (Material-UI) — all UI components, RTL-aware
- **Zustand** — state management (`src/store/`)
- **React Router v6** — client-side routing
- **react-i18next** — English + Hebrew (RTL) translations (`src/i18n/`)
- **React Hook Form** — all forms
- **EmailJS** — contact form (`service_eghiyme` / `template_4v9rsyj`)
- **date-fns** — date formatting
- **Playwright** — UI test suite (`tests/`)
- **GitHub Actions** — CI: tests → deploy to Vercel

## File Structure
```
src/
├── i18n/             — i18next config + en.json + he.json translations
├── types/index.ts    — all TypeScript types
├── services/         — storage, logService, emailService, schedulerService, apkVersionService
├── store/            — Zustand: settingsStore, schedulerStore, logStore, authStore
├── theme/            — colorInterpolation.ts, themes.ts
├── hooks/            — useAppTheme.ts
├── components/
│   ├── Layout/       — AppLayout (parallax bg), Sidebar, Header
│   └── LanguageSwitcher.tsx
└── pages/            — Dashboard, Scheduler, Logs, Settings, About, Help, Login, Robot, Donate

public/
└── silent.png        — parallax background image

tests/
├── navigation.spec.ts
├── dashboard.spec.ts
├── scheduler.spec.ts
├── logs.spec.ts
├── settings.spec.ts
├── about.spec.ts
├── help.spec.ts      — includes mocked EmailJS submit test
├── language.spec.ts  — EN/HE switching + RTL direction tests
└── robot.spec.ts     — Android Robot accessibility automation tests
```

## Key Rules

### Clean Architecture & File Size Limits
1. **Max 250 lines per file** — this is a hard limit for maintainability
   - When a file approaches 250 lines, refactor into smaller, focused modules
   - Split by responsibility: separate components, hooks, utilities, services
   - Examples:
     - Large page components → extract sub-components, hooks, helpers
     - Utility files → split into domain-specific modules
     - Store files → keep each Zustand store focused on one domain
   - **Why**: Smaller files are easier to test, reuse, and maintain; clearer responsibility; reduces cognitive load

### Code Quality
2. All code files must have JSDoc/inline comments
3. TypeScript strict mode — no `any`
4. Use `crypto.randomUUID()` for IDs
5. All persistence through `src/services/storage.ts` (typed localStorage wrapper)
6. All user-facing strings must use `useTranslation()` / `t()` — never hardcode

## Theme System
- 3 modes: `light`, `dark`, `time`
- Time-based: sinusoidal cosine curve — 0 (lightest) at noon, 1 (darkest) at midnight
- Updates every 5 seconds via `useAppTheme` hook
- Preference persisted in `localStorage` via `settings.themeMode`
- Parallax background in `AppLayout`: `backgroundAttachment: fixed`, opacity adapts to mode

## Icons & Branding (v1.0.88+)

### Adaptive Icon System (Android 8+)

**Two-Layer Architecture (PNG-based, v1.0.88+):**
- **Background layer:** Solid white color from `android/app/src/main/res/values/ic_launcher_background.xml`
  - Current: `#FFFFFF` (white)
  - Provides the background canvas for the adaptive icon system
  - Used by: `mipmap-anydpi-v26/ic_launcher.xml` and `mipmap-anydpi-v26/ic_launcher_round.xml`
- **Foreground layer:** PNG files with custom icon design (teal ZZZ letters + phone)
  - Files: `mipmap-{dpi}/ic_launcher_foreground.png`
  - Sized to match safe zone (72×72 dp) for proper adaptive icon display
  - Custom artwork with transparent background

### Raster PNG Files (All Android versions)

**15 PNG files** across 5 DPI densities with correct safe-zone-aligned sizing:

| DPI | File Size | Safe Zone | Files |
|-----|-----------|-----------|-------|
| mdpi | 72×72 | 72×72 dp × 1.0x | ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png |
| hdpi | 108×108 | 72×72 dp × 1.5x | ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png |
| xhdpi | 144×144 | 72×72 dp × 2.0x | ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png |
| xxhdpi | 216×216 | 72×72 dp × 3.0x | ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png |
| xxxhdpi | 288×288 | 72×72 dp × 4.0x | ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png |

**File descriptions:**
- `ic_launcher.png` — Full icon with white background
- `ic_launcher_round.png` — Circular masked version
- `ic_launcher_foreground.png` — Foreground layer for adaptive icons (used on Android 8+)

**Generate with:**
```bash
python generate_launcher_icons.py
```

### Splash Screens (v1.0.84+)

**Design:** Teal background with white ZZZ + phone outline  
**Variants:** Landscape & portrait at 5 DPI densities

**Generate with:**
```bash
python generate_splash_pngs.py
```

### Icon Design Reference

| Element | Size | Stroke Width | Color |
|---------|------|--------------|-------|
| Large Z | 60×40 | 12 | White |
| Medium Z | 50×30 | 10 | White |
| Small Z | 36×20 | 8 | White |
| Phone outline | 40×50 | 3 | White |
| Phone screen | 32×34 | 2 | White |
| Background | — | — | Teal (#26A69A) |

### Regenerating Icons

**When:**
1. Design changes (colors, shapes, sizes)
2. After updating generation scripts
3. Before major version release

**Steps:**
```bash
python generate_launcher_icons.py
git add android/app/src/main/res/mipmap-*/ic_launcher*.png
git commit -m "chore: regenerate launcher icons"
npm run build && npx cap sync android && cd android && ./gradlew assembleRelease
```

### Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| White square icon on home screen | `ic_launcher_background.xml` is white | Change to `#26A69A` |
| Icon blurry on small screens | Raster PNGs outdated | Run script + rebuild APK |
| Adaptive icon missing on Android 8+ | Vector file syntax error | Validate `drawable-v24/ic_launcher_foreground.xml` |
| Old icon after APK update | App cache stale | `adb uninstall com.ikrigel.silent` then reinstall |

## i18n
- Languages: `en` (LTR) and `he` (RTL Hebrew)
- Translation files: `src/i18n/en.json` and `src/i18n/he.json`
- Language stored in `localStorage` under key `lang`
- RTL: `document.documentElement.dir` set to `rtl`/`ltr`, MUI theme `direction` rebuilt on language change
- Language switcher: `src/components/LanguageSwitcher.tsx` (EN / עב button group in header)

## Logging
- **5 levels**: `none`, `error`, `info`, `verbose`, `ultraverbose`
  - `none` — no logging
  - `error` — errors only
  - `info` — info + errors (default)
  - `verbose` — all levels
  - `ultraverbose` — ultra-detailed APK debugging (native auth, robot automation)
- Configured in Settings page
- All logs stored in localStorage (max 500 entries)
- Exportable as JSON from Logs page
- **Ultraverbose logs** (v1.0.70+):
  - Capture every step of native Firebase auth in APK
  - Full Capacitor config dump for troubleshooting
  - Complete error objects with stack traces
  - Robot automation label discovery and matching logs

## Email & Version Services
### EmailJS Config
- Service ID: `service_eghiyme`
- Template ID: `template_4v9rsyj`
- Public Key: hardcoded in `src/services/emailService.ts` — NOT in Settings
- Contact form is in Help page; no user configuration required

### APK Version Service (`src/services/apkVersionService.ts`)
- Fetches latest GitHub release from `https://api.github.com/repos/ikrigel/silent/releases/latest`
- Module-level cache prevents duplicate API calls (Header + About pages share cached result)
- Exports `getLatestApkVersion()` and `isNewerVersion(current, remote)` functions
- Semantic versioning: strips `v` prefix, compares major.minor.patch numerically

## Testing
- Framework: Playwright
- Config: `playwright.config.ts` — Chromium, Firefox, WebKit, mobile Chrome
- Dev server auto-started before tests via `webServer` config
- Email form test mocks `api.emailjs.com` network calls
- Run: `npm test` (headless) | `npm run test:ui` (interactive)

## Firebase Integration

### Authentication Flow
- **Authentication**: Google OAuth via Firebase Auth (`src/services/authService.ts`)
- **User Storage**: Firestore database auto-creates `users` collection on first sign-in
- **Security Rules**: Users can only read/write their own documents
- **Zustand Store**: `useAuthStore` manages authentication state globally
- **Protected Routes**: Login page at `/login`, APK download gated to authenticated users
- **Vercel Functions**: `/api/download-apk` verifies Firebase tokens server-side

### Web Authentication (Vercel)
- Uses **redirect-based OAuth** (`signInWithRedirect` + `getRedirectResult`) to avoid COOP header blocking
- Requires environment variable: `VITE_FIREBASE_API_KEY` (set in Vercel Secrets)
- OAuth consent screen must be configured in Google Cloud Console (see setup instructions below)

### Mobile Authentication (APK)
- Uses **native Firebase authentication** via `@capacitor-firebase/authentication@8.2.0`
- Configured in `capacitor.config.ts` with `providers: ['google']` and `skipNativeAuth: false`
- Requires `google-services.json` in `android/app/` with Android OAuth clients
- **Critical**: `google-services.json` must include:
  - Android OAuth client (type 1) with correct SHA-1 fingerprints
  - API key for Firebase services
  - Web OAuth client (type 3) for backend calls
- SHA-1 fingerprints must match release and debug keystores

### OAuth Consent Screen Setup (v1.0.60+)
**Required for both web and mobile authentication to work:**
1. **Google Cloud Console** → **APIs & Services** → **OAuth consent screen**
2. Configure **Branding**:
   - **App domain**: `silent-please.firebaseapp.com`
   - **Application home page**: `https://silent-eight.vercel.app`
   - **Authorized domains**: 
     - `silent-please.firebaseapp.com` (Firebase)
     - `silent-eight.vercel.app` (Vercel web app)
3. Add **Scopes** (if using OAuth consent screen): `openid`, `email`, `profile`
4. **Developer contact info**: Your email address

**Without OAuth consent screen configured, Firebase authentication will fail with:**
- Web: `"auth/api-key-expired"` or OAuth redirect errors
- APK: `"Google sign-in provider is not enabled"`

## APK Versioning & Distribution
- **Version Injection**: `vite.config.ts` injects `__APP_VERSION__` from `package.json`
- **Version Display**: About page shows current version with `__APP_VERSION__` global
- **Update Detection**: `apkVersionService.ts` checks GitHub Releases API for new versions (module-level cached)
- **Update Banner**: Header shows "New version X.X.X available!" chip when newer version exists
  - X dismiss button persists dismissal to `dismissedUpdateVersion` in localStorage
  - Dismissal survives across reloads
  - New releases automatically show notification again
  - Global toggle in Settings → Notifications (`showUpdateNotifications`)
- **APK Download**: Authenticated users only; backend (`/api/download-apk`) returns GitHub URL
- **GitHub Releases**: v1.0.30+ releases include pre-built APK files
- **Settings**:
  - `showUpdateNotifications: boolean` (default true) — controls visibility of update notifications
  - `dismissedUpdateVersion: string | undefined` — tracks dismissed version for per-version dismiss functionality

## Android Accessibility Service & Robot Automation

### Accessibility Service Setup (Android 13+)
- **Samsung and Android 13+ devices** require explicit "Allow restricted settings" permission before accessibility services can be used
- This is a system security measure for sideloaded apps
- Users must go to **Settings → Apps → Silent → Allow restricted settings** before enabling Silent Robot
- See [ROBOT_ACCESSIBILITY_SETUP.md](ROBOT_ACCESSIBILITY_SETUP.md) for the complete setup guide
- **Important:** The app's `SetupGuide.tsx` component walks users through this 4-step process

### Robot Automation Debugging (v1.0.71+)
**Challenge**: Device-specific accessibility labels prevent cross-device UI automation

The robot automation uses **text-based element search** (not pixel coordinates) by matching accessibility labels. Samsung devices and different locales have different label text, causing automation failures.

**Debugging Process**:

1. **Enable Ultra Verbose Logging** (v1.0.70+):
   - **Settings → Log Level → Ultra Verbose (APK debug)**
   - This enables comprehensive logging of:
     - Every accessibility node encountered during navigation
     - All discovered labels on the current screen
     - Window changes with package/class names
     - Step execution with remaining steps count

2. **Run Robot Actions**:
   - Robot page → Quick Actions → Silence WEA / Enable Airplane Mode / etc.
   - Watch logcat: `adb logcat | grep WEARobotAccessibilityService`

3. **Analyze Logcat Output**:
   ```
   Searching node: text='טיסה' desc='מצב טיסה' class='android.widget.TextView'
   clickByAnyLabel: Looking for any of 5 labels. Discovered 47 total labels on screen.
   All discovered labels: [text:טיסה, desc:מצב טיסה, text:..., ...]
   ```

4. **Extract Device-Specific Labels**:
   - Copy all discovered labels from logcat
   - Identify which ones correspond to the missing UI element
   - Example: Device shows "טיסה" (Hebrew for "airplane") instead of English "Airplane mode"

5. **Add Missing Labels** to `android/app/src/main/java/com/ikrigel/silent/WEARobotModels.kt`:
   ```kotlin
   private val airplaneLabels = listOf(
       "Airplane mode", "Airplane", "Flight mode",  // English
       "טיסה", "מצב טיסה",  // Hebrew (discovered from logcat)
       // ... other variants
   )
   ```

6. **Rebuild APK** and test

**Common Issues & Solutions**:

| Issue | Cause | Solution |
|-------|-------|----------|
| "Toggle not found" after opening Settings | UI element label not in predefined list | Extract actual label from logcat, add to list |
| Robot can find element but toggle fails | Element is not Switch/CheckBox or Quick Settings tile | Check accessibility class hierarchy in logcat |
| Settings page never opens | `open_settings` Intent not working | Ensure accessibility service has proper permissions |
| Window change detected but no elements found | Page still loading or crashed | Increase delay in `handlePlaybackEvent` (currently 600ms) |

**Label Files** (v1.0.71+):
- `WEARobotModels.kt` — predefined label lists for WEA, airplane mode, safety sections
- Supports multiple languages: English, Hebrew, Arabic, Russian, French, German, Spanish, Chinese, Korean
- Samsung devices use comma separators in accessibility text (e.g., "Airplane,mode" instead of "Airplane mode")
- Some devices split labels across lines (e.g., "Airplane\nmode")

**Accessibility Service Logging** (`WEARobotAccessibilityService.kt`):
- `findNodeByText()` — logs every node's text and contentDescription
- `collectAllLabels()` — recursively gathers all labels on current screen for debugging
- `toggleByAnyLabel()` / `clickByAnyLabel()` — log match attempts and discovered alternatives
- `handlePlaybackEvent()` — logs window changes with package/class for navigation tracking
- `executeNextStep()` — logs step action and remaining steps count

### Airplane Mode Learning Mode (v1.0.93+)

**Problem Solved**: Device-specific timing and state validation issues made airplane mode automation unreliable. The plugin's `getAirplaneModeState()` method returns false negatives on some devices even when airplane mode is ON. Additionally, `enableAirplaneMode()` sometimes navigated to the wrong screen (WEA settings instead of airplane settings) depending on device state and timing.

**Solution**: Learning mode lets users calibrate which attempt timing works on their specific device by watching each retry iteration and confirming when it works. Once confirmed, that timing is saved and reused for all future runs, bypassing unreliable state validation entirely.

**Architecture**:

1. **New Zustand store** (`src/store/airplaneLearningStore.ts`):
   - Persists: `learned: boolean`, `learnedDelay: number` (0, 3000, or 5000 ms)
   - Session-only: `isLearning: boolean`, `pendingFeedbackAttempt: number | null`
   - Actions: `startLearning()`, `resetLearning()`, `setPendingFeedback()`, `saveLearned()`

2. **Modified service** (`src/services/airplaneModeService.ts`):
   - **Learned mode** (Branch A): Apply saved delay, call once, return — no state validation, no retries
   - **Learning mode** (Branch B): Retry loop with user feedback prompts after each attempt. When user confirms it worked, save that timing
   - **Default mode** (Branch C): Original retry + validation logic (unchanged)
   - Exported `provideFeedback(confirmed: boolean)` function for UI to confirm/deny attempts

3. **New dialog component** (`src/pages/Robot/AirplaneLearningDialog.tsx`):
   - Shows "Calibrate Airplane Mode" button when not yet learned
   - Shows feedback dialog on each pending attempt: "Attempt [N]: Did airplane mode turn ON?"
   - Shows "✓ Calibrated (delay: Xms)" + Reset button once learned
   - All strings translated in `en.json` and `he.json` under `robot.learning.*`

**User Flow**:

| Step | Action | Result |
|------|--------|--------|
| 1 | Tap "Calibrate Airplane Mode" on Robot page | Enters learning mode |
| 2 | Tap "Enable Airplane Mode" quick action | Attempt #1 runs, pauses for feedback |
| 3 | Dialog: "Attempt 1: Did airplane mode turn ON?" | User taps YES/NO |
| 4 (if YES) | Saves learned timing, shows confirmation | Future runs use this timing |
| 4 (if NO) | Tries attempt #2 (waits 3s first), pauses again | User feedback loop continues |
| 5 (reset) | Tap "Reset" button | Clears learned data, ready for recalibration |

**Benefits**:

- **Per-device calibration**: Each device learns its own optimal timing based on Accessibility Service response
- **Eliminates false negatives**: Once calibrated, trusts the first attempt worked (no unreliable state checking)
- **Eliminates retries**: Learned mode runs once per activation, 1.5–7s faster than 3-attempt fallback
- **User agency**: Users watch and confirm which attempt actually works, building confidence in the automation
- **Persistence**: Learned delay persists across app restarts via Zustand `persist` middleware

**Related Files**:

- `src/store/airplaneLearningStore.ts` — learning state + actions
- `src/services/airplaneModeService.ts` — three-branch enable() logic
- `src/pages/Robot/AirplaneLearningDialog.tsx` — UI feedback dialog + calibration UI
- `src/pages/Robot/index.tsx` — integrated dialog into Android flow
- `src/i18n/en.json`, `src/i18n/he.json` — translation keys under `robot.learning`
- `src/pages/Dashboard/index.tsx` — fixed parallel execution bug (sequence airplane mode before recording)

---

## Android Build

### Configuration
- **Build Config**: `android/app/build.gradle` with versionCode and versionName
- **Gradle Version**: 9.3.1 (via wrapper), requires Java 11+
- **Java Toolchain**: 
  - `gradle.jvm.version=21` in `gradle.properties` (Gradle daemon JVM)
  - `JavaVersion.VERSION_21` in `app/build.gradle` (compilation target)
  - `JavaVersion.VERSION_21` in `capacitor.build.gradle` (auto-generated, must be updated manually)
- **Kotlin**: 2.1.0 (gradle plugin), jvmTarget=21
- **Compile SDK**: 36 (Android 6.0+)
- **Target SDK**: 36
- **Android Gradle Plugin**: 8.13.0
- **Capacitor**: Bridges React web app to native Android via Capacitor plugins
- **Network Timeout**: 120s for Gradle downloads (configured in `gradle-wrapper.properties`)

### Critical Dependencies
- **Firebase Auth**: 24.0.1 (via Firebase BOM, compatible with Kotlin 2.1.0)
- **Firebase BOM**: 33.0.0 (supports Kotlin 2.1.0 and firebase-auth:24.0.1)
- **Play Services Auth**: 20.4.1+ (pulled by Firebase BOM)

### Known Build Constraints
1. **JVM Target Alignment** — All layers must use Java 21:
   - Gradle daemon: `gradle.jvm.version=21`
   - Java compilation: `sourceCompatibility JavaVersion.VERSION_21`
   - Kotlin compilation: `jvmTarget = "21"`
   - Mismatch causes: "Inconsistent JVM-target compatibility" error

2. **Kotlin 2.1.0 Metaspace Requirements** — Kotlin 2.1.0 linting phase requires increased heap:
   - JVM args in `gradle.properties`: `-Xmx4g -XX:MaxMetaspaceSize=1g`
   - Without these, lint tasks fail with Metaspace OutOfMemory errors
   - Local builds may succeed with smaller heap; CI/CD builds require full allocation

3. **Capacitor Auto-Generated Files** — `capacitor.build.gradle` is regenerated by `npx cap sync`:
   - Manual Java version updates may be overwritten
   - Document in team: re-apply after running Capacitor sync
   - Consider upstream contribution to Capacitor Android template for Java 21 default

4. **Gradle Cache Corruption in CI** — CI must clear cache before build:
   - Old Kotlin/Firebase metadata cached in `.gradle` directory
   - CI reuses cache across builds → stale metadata errors
   - Solution: `rm -rf android/.gradle android/app/build` before each CI build

### Debugging
See [ANDROID_BUILD_DEBUGGING.md](ANDROID_BUILD_DEBUGGING.md) for:
- Commands to isolate Kotlin compilation errors
- How to read error messages correctly
- Common issues and fixes found during v1.0.54 builds

## Deployment

### Web (Vercel)
- **SPA**: `.github/workflows/deploy.yml` at https://silent-eight.vercel.app
- **Triggers**: Automatically on push to master (tests must pass)
- **Important**: Vercel uses COOP headers that block popup-based OAuth
  - Solution: Use redirect-based auth (`signInWithRedirect`) instead of `signInWithPopup`
- **Manual deploy**: `npm run deploy` (runs `vercel --prod`)

### APK (GitHub Actions)
- **Build trigger**: `git tag v*` (e.g., `git tag v1.0.89 && git push origin v1.0.89`)
- **Workflow**: `.github/workflows/build-apk.yml`
- **Output**: Release APK in [GitHub Releases](https://github.com/ikrigel/silent/releases)
- **Manual build**: `npm run build:android` (opens Android Studio)
  - Or: `cd android && ./gradlew assembleRelease`

### APK Installation
See [APK_INSTALLATION.md](APK_INSTALLATION.md) for detailed instructions on:
- Building APK locally
- Installing via ADB: `adb install android\app\build\outputs\apk\release\app-release.apk`
- Using Android Studio
- Troubleshooting device connection & installation issues

## OAuth Authentication Architecture

### Web (Vercel)
- Uses **redirect-based OAuth** (`signInWithRedirect` + `getRedirectResult`)
- Does NOT use popup auth (blocked by COOP headers on Vercel)
- Flow: Click Sign In → Redirect to Google → User signs in → Redirects back → App handles result
- **Enhanced Logging** (v1.0.59+): Detailed console logs for debugging redirect flow
  - Logs provider config, auth domain, and current URL
  - Traces `handleRedirectResult()` execution step-by-step

### Mobile (APK)
- Uses **native Firebase authentication** via `@capacitor-firebase/authentication`
- Native plugin handles Google Sign-In via Android system
- Direct credential exchange to Firebase
- No popup or redirect needed
- **Requires**: SHA-1 fingerprints in `google-services.json` matching APK signing key

### Critical Issues Resolved

#### Issue 1: COOP Headers Blocking Web Auth (v1.0.59)
- **Problem**: Vercel's COOP header blocks `window.closed` checks used by popup auth
- **Symptoms**: Console error "Cross-Origin-Opener-Policy policy would block the window.closed call"
- **Solution**: Switch to redirect-based OAuth which avoids `window.closed` polling
- **Fix**: Changed `signInWithPopup(auth, provider)` → `signInWithRedirect(auth, provider)`

#### Issue 2: OAuth Consent Screen Missing (v1.0.60)
- **Problem**: Firebase OAuth fails when consent screen not configured in Google Cloud
- **Symptoms**: 
  - Web: `"auth/api-key-expired"` or redirect loops
  - APK: `"Google sign-in provider is not enabled"`
- **Solution**: Configure OAuth consent screen with app domains and authorized domains in Google Cloud Console
- **Fix**: Added setup instructions to Firebase Integration section

#### Issue 3: Firebase API Key Expiration (v1.0.60)
- **Problem**: Firebase API key expired, blocking all authentication
- **Symptoms**: Console error `"auth/api-key-expired.-please-renew-the-api-key."`
- **Solution**: Updated Vercel environment secret with new Firebase API key
- **Fix**: Used Vercel Secrets for API key management instead of `.env.local`

#### Issue 4: Robot Automation Service Stuck (v1.0.67)
- **Problem**: Robot service got stuck in RECORDING/PLAYING state, blocking all further automation
- **Symptoms**: "Robot is busy" errors on every attempt to run actions
- **Solution**: Added 15-second timeout to auto-reset state if no activity detected
- **Fix**: Implemented `scheduleStateTimeout()` and `cancelStateTimeout()` in `WEARobotAccessibilityService.kt`

#### Issue 5: WebView User-Agent Rejection (v1.0.62)
- **Problem**: APK native OAuth was rejected with "Error 403: disallowed_useragent"
- **Symptoms**: Google rejected OAuth request from WebView with non-Chrome User-Agent
- **Solution**: Hardcode Chrome User-Agent in WebView to pass Google's security policy
- **Fix**: Modified `MainActivity.java` to set User-Agent: `"Mozilla/5.0 (Linux; Android 14; ...) Chrome/..."`

#### Issue 6: Session Persistence on App Close (v1.0.61)
- **Problem**: User was logged out after closing and reopening the APK
- **Symptoms**: Custom token login didn't populate email/displayName in Firebase User object
- **Solution**: Asynchronously fetch full user profile from Firestore on auth state change
- **Fix**: Modified `onUserChanged()` in `authService.ts` to call `getDoc()` and restore user data

#### Issue 7: Device-Specific Accessibility Labels (v1.0.71)
- **Problem**: Robot automation couldn't find UI elements on device with non-English labels
- **Symptoms**: "Toggle not found" or "Element not found" errors even when manually toggling works
- **Solution**: Implement comprehensive accessibility label logging to discover device-specific text
- **Fix**: Enhanced `WEARobotAccessibilityService.kt` with `collectAllLabels()` and detailed logcat output for label discovery

#### Issue 8: Airplane Mode Label Extraction (v1.0.74)
- **Problem**: Need to verify exact accessibility label for airplane mode toggle on target devices
- **Symptoms**: Robot automation would fail if predefined labels didn't match device-specific variants
- **Solution**: Extract accessibility labels directly from device using ADB uiautomator dump
- **Fix**: Verified "Airplane mode" label via XML accessibility dump; documented label variants and extraction process
- **Documentation**: See [AIRPLANE_MODE_LABEL_DISCOVERY.md](AIRPLANE_MODE_LABEL_DISCOVERY.md)
