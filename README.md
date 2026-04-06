# 💤 Silent

> Schedule emergency alert silencing periods on your phone.

**Silent** is a React + TypeScript single-page application (SPA) that helps you manage when you want to silence government emergency notifications (like Israel's Home Front Command alerts). Set schedules by time, day of week, or date range — view logs, switch between English and Hebrew, and enjoy a time-aware theme.

---

## Features

### Core Functionality
- 📅 **Scheduler** — Create silencing schedules: daily, weekly, custom date range, overnight spans
- 🤖 **Robot Automation** (Android) — Accessibility service integration for automated alert silencing
- 🌓 **Time-based Theme** — Sinusoidal transition from light (noon) → dark (midnight), updates every 5s
- 🖼️ **Parallax Background** — Subtle depth-effect background image
- 🌐 **Hebrew / English** — Full i18n with RTL layout support for Hebrew
- 📋 **Logs** — Verbose/Info/Error/None logging; export JSON, delete selected or all
- ⚙️ **Settings** — Theme mode, log level, browser notification permission, menu customization
- 👤 **About** — Developer bio, experience, skills, social links, version display
- ❓ **Help** — FAQ accordion + contact form (EmailJS, pre-configured)

### Authentication & APK Management
- 🔐 **Google OAuth** — Sign in with Google via Firebase Authentication
- 👥 **User Registration** — Automatically saved to Firestore database
- 📲 **APK Versioning** — In-app version display with automatic update detection
- 🔔 **Update Notifications** — Smart per-version dismissal with global toggle in Settings
  - Click X to dismiss notifications for a specific version
  - Dismissal persists across reloads
  - New versions automatically re-trigger notifications
  - Global on/off toggle in Settings → Notifications
- 🔒 **Registered User APK Download** — Only authenticated users can download APK
- 🚀 **GitHub Releases Integration** — Automatic APK distribution via GitHub Actions

### Quality & Deployment
- 🧪 **Playwright Tests** — 312+ test cases covering all pages, language switching, authentication, notifications
- 🚀 **CI/CD** — GitHub Actions: tests → Vercel deploy (web) + automatic APK builds on git tags
- 📦 **Firebase Integration** — Firestore database, Google Authentication, serverless functions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict) |
| UI Library | MUI v5 (Material-UI) |
| State | Zustand |
| Routing | React Router v6 |
| i18n | react-i18next (EN + HE/RTL) |
| Forms | React Hook Form |
| Authentication | Firebase Auth (Google OAuth) |
| Database | Firestore |
| Backend Functions | Vercel Serverless Functions |
| Email | EmailJS (pre-configured) |
| Testing | Playwright (292+ tests) |
| Bundler | Vite |
| Mobile | Capacitor (Android) |
| CI/CD | GitHub Actions → Vercel (web) + Auto APK builds |

---

## Getting Started

```bash
# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install --with-deps

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + Vite bundle |
| `npm run preview` | Preview production build locally |
| `npm test` | Run Playwright tests (headless) |
| `npm run test:ui` | Playwright interactive UI |
| `npm run test:headed` | Watch tests run in a browser |
| `npm run test:report` | Open last HTML test report |
| `npm run deploy` | Deploy to Vercel production |

---

## Firebase Setup

The app uses Firebase for authentication and user registration:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google Authentication** in Auth providers
3. Create a **Firestore database** (production mode, nearest region)
4. Add environment variables to `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
5. Set **Firestore security rules**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

Users can now sign in with Google and their profile is automatically saved to Firestore.

---

## APK Builds & Distribution

### Build Requirements
- **Java 21** (Gradle daemon JVM, compilation target, all toolchain layers)
- **Android SDK 36** (`compileSdk = 36`, `targetSdk = 36`)
- **Kotlin 1.9.24** (stable, well-tested, Firebase auth 23.1.0 compatible)
- **Firebase Auth 23.1.0** (explicitly pinned to prevent Kotlin 2.1 metadata conflicts)
- **Gradle 8.14.3+**
- **Android Gradle Plugin 8.13.0**

### Automatic Builds (Recommended)

The `build-apk.yml` GitHub Actions workflow automatically builds APK when you:

**Option 1: Push a git tag**
```bash
cd c:\silent
git tag -a v1.0.54 -m "build: APK release v1.0.54"
git push origin v1.0.54
```

**Option 2: Manually trigger via GitHub Actions UI**
- Go to: https://github.com/ikrigel/silent/actions
- Select "Build Android APK" workflow
- Click "Run workflow" button
- Downloads at: https://github.com/ikrigel/silent/releases

### Local Builds

Test locally before pushing (requires Java 21+ and Android SDK):

```bash
# Navigate to android directory
cd c:\silent\android

# Build APK
./gradlew clean assembleRelease

# APK output
ls -lh app/build/outputs/apk/release/app-release.apk
```

### Build & Release Workflow (Complete)

```bash
# 1. Commit your changes
git add -A
git commit -m "your changes"

# 2. Test the build locally
cd c:\silent\android && ./gradlew clean assembleRelease

# 3. If successful, create and push tag (increments version)
cd c:\silent
git tag -a v1.0.54 -m "build: APK release v1.0.54 with [feature description]"
git push origin v1.0.54

# 4. Monitor the build
# Go to: https://github.com/ikrigel/silent/actions
```

### APK Versioning

- **Web app version**: `package.json` → shown in About page
- **APK version**: `android/app/build.gradle` → `versionCode` and `versionName`
- **SDK versions**: `android/variables.gradle` → `compileSdkVersion`, `targetSdkVersion`
- Keep all three in sync for consistency

### Known Issues & Fixes (v1.0.54+)

| Issue | Root Cause | Solution | Files |
|-------|-----------|----------|-------|
| **Kotlin metadata mismatch** | Firebase plugin pulls auth 24.x (Kotlin 2.1 metadata) with Kotlin 1.9 compiler | Pin to firebase-auth:23.1.0 explicitly | `app/build.gradle` |
| **JVM target inconsistency** | Gradle daemon (17), Java compilation (21), Kotlin target (21) all different | Align all to Java 21: `gradle.jvm.version=21` | `gradle.properties`, `app/build.gradle`, `capacitor.build.gradle` |
| **compileSdk incompatibility** | AGP 8.13.0 requires SDK 36+ | Update `compileSdk = 36`, `targetSdk = 36` | `variables.gradle` |
| **Gradle cache corruption in CI** | Stale Kotlin/Firebase metadata cached across builds | Clear `.gradle` and `build/` dirs before each build | `.github/workflows/build-apk.yml` |
| **Capacitor overrides Java version** | `capacitor.build.gradle` auto-generated with `VERSION_17` | Update to `VERSION_21` after sync | `capacitor.build.gradle` (manual sync required) |
| **Force Kotlin resolution harmful** | Force block doesn't fix metadata compatibility, only forces runtime | Remove entire resolutionStrategy block | `android/build.gradle` |
| **Conflicting kotlin-stdlib** | Direct dependency in app module overrides BOM selection | Remove explicit version, let BOM/force block manage | `app/build.gradle` |

### Debugging Guide

For complete build debugging commands and techniques, see [ANDROID_BUILD_DEBUGGING.md](ANDROID_BUILD_DEBUGGING.md)

---

## Deployment Options

### Option 1: Vercel (recommended — auto-deploys on push)
1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new) — Vite auto-detected
3. Add 3 repository secrets in GitHub → Settings → Secrets → Actions:
   - `VERCEL_TOKEN` — from vercel.com/account/tokens
   - `VERCEL_ORG_ID` — from `.vercel/project.json` after `vercel link`
   - `VERCEL_PROJECT_ID` — from `.vercel/project.json` after `vercel link`
4. Every `git push` to `master` runs tests → deploys on pass

### Option 2: Manual Vercel CLI
```bash
npm install -g vercel
vercel link      # one-time setup
npm run deploy   # runs: vercel --prod
```

### Option 3: Netlify
```bash
npm run build
# Drop dist/ into netlify.com or use Netlify CLI
```
Add redirect rule: `/* /index.html 200`

### Option 4: GitHub Pages
```bash
npm install --save-dev gh-pages
# Add to package.json scripts: "ghpages": "gh-pages -d dist"
npm run build && npm run ghpages
```

### Option 5: Android via Capacitor (Google Play)
```bash
npm install @capacitor/core @capacitor/android
npx cap init
npx cap add android
npm run build && npx cap sync
npx cap open android
# Build APK/AAB from Android Studio → upload to Google Play Console
```

### Option 6: iOS via Capacitor (App Store)
```bash
npm install @capacitor/core @capacitor/ios
npx cap init
npx cap add ios
npm run build && npx cap sync
npx cap open ios
# Build from Xcode → upload to App Store Connect
```

---

## i18n — Language Support

The app ships with **English** and **Hebrew** translations. Switch via the **EN / עב** buttons in the top-right of the header.

- Hebrew activates **RTL layout** (MUI direction + `document.dir`)
- Language preference is persisted in `localStorage`
- To add another language: create `src/i18n/<lang>.json` and register it in `src/i18n/index.ts`

---

## EmailJS — Contact Form

The contact form in the Help page is pre-configured and ready to use:

- **Service ID**: `service_eghiyme`
- **Template ID**: `template_4v9rsyj`
- **Public Key**: pre-configured in `src/services/emailService.ts`

No setup required. The form sends directly to the developer.

---

## Theme System

| Mode | Behaviour |
|------|-----------|
| Light | Always light |
| Dark | Always dark |
| Time-based | Cosine curve: lightest at 12:00 noon → darkest at 00:00 midnight |

Cycle through modes using the icon button in the header (☀️ → 🌙 → 🕐 → ☀️).
The parallax background image opacity adapts to light/dark mode automatically.

---

## ⚠️ Disclaimer

Emergency alerts exist to save lives. Silencing them may prevent you from receiving critical real-time safety information. Use responsibly and in accordance with local regulations.

---

## Developer

**Igal Krigel** — [Portfolio](https://portfolio-dusky-eight-77.vercel.app/#/) · [GitHub](https://github.com/ikrigel?tab=repositories) · [LinkedIn](https://www.linkedin.com/in/ikrigel/)

---

*Built with ❤️ using React + MUI + TypeScript*
