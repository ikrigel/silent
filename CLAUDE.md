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

## i18n
- Languages: `en` (LTR) and `he` (RTL Hebrew)
- Translation files: `src/i18n/en.json` and `src/i18n/he.json`
- Language stored in `localStorage` under key `lang`
- RTL: `document.documentElement.dir` set to `rtl`/`ltr`, MUI theme `direction` rebuilt on language change
- Language switcher: `src/components/LanguageSwitcher.tsx` (EN / עב button group in header)

## Logging
- 4 levels: `none`, `error`, `info`, `verbose`
- Configured in Settings page
- All logs stored in localStorage (max 500 entries)
- Exportable as JSON from Logs page

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
- **Authentication**: Google OAuth via Firebase Auth (`src/services/authService.ts`)
- **User Storage**: Firestore database auto-creates `users` collection on first sign-in
- **Security Rules**: Users can only read/write their own documents
- **Zustand Store**: `useAuthStore` manages authentication state globally
- **Protected Routes**: Login page at `/login`, APK download gated to authenticated users
- **Vercel Functions**: `/api/download-apk` verifies Firebase tokens server-side
- **Capacitor Firebase Auth Plugin**: 
  - Configured in `capacitor.config.ts` with `providers: ['google']`
  - Enables native Google Sign-In on Android (via @capacitor-firebase/authentication@8.2.0)
  - `google-services.json` required in `android/app/` for native Firebase initialization
  - **Critical**: `google-services.json` must include Android OAuth client (type 1) with SHA-1 fingerprints
  - See [ANDROID_OAUTH_SETUP.md](ANDROID_OAUTH_SETUP.md) for configuration instructions

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

## Android Accessibility Service Setup

### Sideloaded APK Restriction (Android 13+)
- **Samsung and Android 13+ devices** require explicit "Allow restricted settings" permission before accessibility services can be used
- This is a system security measure for sideloaded apps
- Users must go to **Settings → Apps → Silent → Allow restricted settings** before enabling Silent Robot
- See [ROBOT_ACCESSIBILITY_SETUP.md](ROBOT_ACCESSIBILITY_SETUP.md) for the complete setup guide
- **Important:** The app's `SetupGuide.tsx` component walks users through this 4-step process

---

## Android Build

### Configuration
- **Build Config**: `android/app/build.gradle` with versionCode and versionName
- **Gradle Version**: 8.14.3 (via wrapper), requires Java 11+
- **Java Toolchain**: 
  - `gradle.jvm.version=21` in `gradle.properties` (Gradle daemon JVM)
  - `JavaVersion.VERSION_21` in `app/build.gradle` (compilation target)
  - `JavaVersion.VERSION_21` in `capacitor.build.gradle` (auto-generated, must be updated manually)
- **Kotlin**: 2.1.0 (gradle plugin), jvmTarget=21
- **Compile SDK**: 36 (Android 6.0+)
- **Target SDK**: 36
- **Android Gradle Plugin**: 8.13.0
- **Capacitor**: Bridges React web app to native Android via Capacitor plugins

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
- **Web**: Vercel SPA (`.github/workflows/deploy.yml`) at https://silent-eight.vercel.app
  - Tests must pass before deploy
  - IMPORTANT: Vercel uses COOP headers that block popup-based OAuth
  - Solution: Use redirect-based auth (`signInWithRedirect`) instead of `signInWithPopup`
- **APK**: GitHub Actions (`build-apk.yml`) — triggered by `git tag v*`
- **Build**: `npm run build` → `dist/` folder (web); `./gradlew assembleRelease` → APK (mobile)
- **Manual web deploy**: `npm run deploy` (runs `vercel --prod`)
- **Manual APK build**: `cd android && ./gradlew clean assembleRelease`

## OAuth Authentication Architecture

### Web (Vercel)
- Uses **redirect-based OAuth** (`signInWithRedirect` + `getRedirectResult`)
- Does NOT use popup auth (blocked by COOP headers on Vercel)
- Flow: Click Sign In → Redirect to Google → User signs in → Redirects back → App handles result

### Mobile (APK)
- Uses **native Firebase authentication** via `@capacitor-firebase/authentication`
- Native plugin handles Google Sign-In via Android system
- Direct credential exchange to Firebase
- No popup or redirect needed

### Critical Issue Resolved (v1.0.59)
- **Problem**: Vercel's COOP header blocks `window.closed` checks used by popup auth
- **Symptoms**: Console error "Cross-Origin-Opener-Policy policy would block the window.closed call"
- **Solution**: Switch to redirect-based OAuth which avoids `window.closed` polling
- **Fix**: Changed `signInWithPopup(auth, provider)` → `signInWithRedirect(auth, provider)`
