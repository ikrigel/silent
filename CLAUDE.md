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

## Android Build

### Configuration
- **Build Config**: `android/app/build.gradle` with versionCode and versionName
- **Gradle Version**: 8.14.3 (via wrapper), requires Java 11+
- **Java Toolchain**: 
  - `gradle.jvm.version=21` in `gradle.properties` (Gradle daemon JVM)
  - `JavaVersion.VERSION_21` in `app/build.gradle` (compilation target)
  - `JavaVersion.VERSION_21` in `capacitor.build.gradle` (auto-generated, must be updated manually)
- **Kotlin**: 1.9.24 (gradle plugin), jvmTarget=21
- **Compilе SDK**: 36 (Android 6.0+)
- **Target SDK**: 36
- **Android Gradle Plugin**: 8.13.0
- **Capacitor**: Bridges React web app to native Android via Capacitor plugins

### Critical Dependencies
- **Firebase Auth**: 23.1.0 (explicitly pinned to prevent unwanted 24.x upgrades with Kotlin 2.1 metadata)
- **Firebase BOM**: 32.7.0 (compatible with Kotlin 1.9.24)
- **Play Services Auth**: 20.4.1

### Known Build Constraints
1. **JVM Target Alignment** — All layers must use Java 21:
   - Gradle daemon: `gradle.jvm.version=21`
   - Java compilation: `sourceCompatibility JavaVersion.VERSION_21`
   - Kotlin compilation: `jvmTarget = "21"`
   - Mismatch causes: "Inconsistent JVM-target compatibility" error

2. **Firebase Auth Pinning** — Must pin to 23.1.0 explicitly:
   - Capacitor Firebase plugin tries to pull in 24.x (Kotlin 2.1 metadata)
   - 24.x incompatible with project's Kotlin 1.9.24 compiler
   - Solution: `implementation 'com.google.firebase:firebase-auth:23.1.0'` in `app/build.gradle`

3. **Capacitor Auto-Generated Files** — `capacitor.build.gradle` is regenerated by `npx cap sync`:
   - Manual Java version updates may be overwritten
   - Document in team: re-apply after running Capacitor sync
   - Consider upstream contribution to Capacitor Android template for Java 21 default

4. **Gradle Cache Corruption in CI** — CI must clear cache before build:
   - Old Kotlin/Firebase metadata cached locally `.gradle` directory
   - CI reuses cache across builds → stale metadata errors
   - Solution: `rm -rf android/.gradle android/app/build` before each CI build

### Debugging
See [ANDROID_BUILD_DEBUGGING.md](ANDROID_BUILD_DEBUGGING.md) for:
- Commands to isolate Kotlin compilation errors
- How to read error messages correctly
- Common issues and fixes found during v1.0.54 builds

## Deployment
- **Web**: Vercel SPA (`.github/workflows/deploy.yml`) — tests must pass before deploy
- **APK**: GitHub Actions (`build-apk.yml`) — triggered by `git tag v*`
- **Build**: `npm run build` → `dist/` folder (web); `./gradlew assembleRelease` → APK (mobile)
- **Manual web deploy**: `npm run deploy` (runs `vercel --prod`)
- **Manual APK build**: `cd android && ./gradlew clean assembleRelease -x lint`
