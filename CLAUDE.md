# CLAUDE.md — Silent App

## Project Overview
**Silent** is a React SPA for scheduling emergency alert silencing periods.

## Tech Stack
- **React 18** + **TypeScript** (strict mode)
- **Vite** bundler
- **MUI v5** (Material-UI) for all UI components
- **Zustand** for state management (stores in `src/store/`)
- **React Router v6** for client-side routing
- **React Hook Form** for forms
- **EmailJS** for contact form
- **date-fns** for date formatting

## File Structure
- `src/types/index.ts` — all TypeScript types
- `src/services/` — business logic (storage, logging, scheduling, email)
- `src/store/` — Zustand stores (settings, scheduler, logs)
- `src/theme/` — MUI theme definitions + color interpolation
- `src/hooks/` — custom React hooks
- `src/components/Layout/` — AppLayout, Sidebar, Header
- `src/pages/` — one folder per page route

## Key Rules
1. **Max 250 lines per file** — split into sub-files if needed
2. All code files must have comments explaining logic
3. TypeScript strict mode — no `any`
4. Use `crypto.randomUUID()` for IDs
5. All persistence goes through `src/services/storage.ts` (typed localStorage wrapper)

## Theme System
- 3 modes: `light`, `dark`, `time`
- Time-based: sinusoidal cosine curve — 0 (lightest) at noon, 1 (darkest) at midnight
- Updates every 5 seconds via `useAppTheme` hook
- Theme preference persisted in localStorage via `settings.themeMode`

## Logging
- 4 levels: `none`, `error`, `info`, `verbose`
- Configured in Settings page
- All logs stored in localStorage (max 500 entries)
- Exportable as JSON from Logs page

## EmailJS Config
- Service ID: `service_eghiyme`
- Template ID: `template_4v9rsyj`
- Public Key: configured by user in Settings page (stored in localStorage)

## Deployment
- **Vercel**: `vercel.json` rewrites all routes to `/` for SPA routing
- **Build**: `npm run build` → `dist/` folder
