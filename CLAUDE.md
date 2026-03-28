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
├── services/         — storage, logService, emailService, schedulerService
├── store/            — Zustand: settingsStore, schedulerStore, logStore
├── theme/            — colorInterpolation.ts, themes.ts
├── hooks/            — useAppTheme.ts
├── components/
│   ├── Layout/       — AppLayout (parallax bg), Sidebar, Header
│   └── LanguageSwitcher.tsx
└── pages/            — Dashboard, Scheduler, Logs, Settings, About, Help

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
└── language.spec.ts  — EN/HE switching + RTL direction tests
```

## Key Rules
1. **Max 250 lines per file** — split into sub-files if needed
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

## EmailJS Config
- Service ID: `service_eghiyme`
- Template ID: `template_4v9rsyj`
- Public Key: hardcoded in `src/services/emailService.ts` — NOT in Settings
- Contact form is in Help page; no user configuration required

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
- **Update Detection**: `apkVersionService.ts` checks GitHub Releases API for new versions
- **Update Banner**: Header shows "New version X.X.X available!" chip when newer version exists
- **APK Download**: Authenticated users only; backend (`/api/download-apk`) returns GitHub URL
- **GitHub Releases**: v1.0.30+ releases include pre-built APK files

## Android Build
- **Build Config**: `android/app/build.gradle` with versionCode and versionName
- **Java Toolchain**: `android/gradle.properties` explicitly sets `org.gradle.java.home` to Java 21
- **Gradle Wrapper**: Version 8.14.3, requires Java 11+ (GitHub Actions uses Java 21)
- **Capacitor**: Bridges React web app to native Android via Capacitor plugins

## Deployment
- **Web**: Vercel SPA (`.github/workflows/deploy.yml`) — tests must pass before deploy
- **APK**: GitHub Actions (`build-apk.yml`) — triggered by `git tag v*`
- **Build**: `npm run build` → `dist/` folder (web); `./gradlew assembleRelease` → APK (mobile)
- **Manual web deploy**: `npm run deploy` (runs `vercel --prod`)
- **Manual APK build**: `cd android && ./gradlew clean assembleRelease -x lint`
