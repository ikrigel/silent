# 💤 Silent

> Schedule emergency alert silencing periods on your phone.

**Silent** is a React + TypeScript single-page application (SPA) that helps you manage when you want to silence government emergency notifications (like Israel's Home Front Command alerts). Set schedules by time, day of week, or date range — and view logs of all activity.

---

## Features

- 📅 **Scheduler** — Create silencing schedules with repeat modes (daily, weekly, custom date range, overnight spans)
- 🌓 **Time-based Theme** — Smooth sinusoidal transition from light (noon) to dark (midnight)
- 📋 **Logs** — Verbose/Info/Error/None logging with export and delete
- ⚙️ **Settings** — Theme, log level, EmailJS key, browser notifications
- 👤 **About** — Developer info and links
- ❓ **Help** — FAQ and contact form (EmailJS)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| UI Library | MUI v5 (Material-UI) |
| State | Zustand |
| Routing | React Router v6 |
| Forms | React Hook Form |
| Email | EmailJS |
| Bundler | Vite |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Deployment Options

### Option 1: Vercel (recommended for web)
1. Push to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Vercel auto-detects Vite — deploy!
4. `vercel.json` handles SPA routing

### Option 2: Netlify
1. Build: `npm run build`
2. Deploy `dist/` folder to Netlify
3. Add `_redirects` file: `/* /index.html 200`

### Option 3: GitHub Pages
1. Install: `npm install --save-dev gh-pages`
2. Add to package.json: `"homepage": "https://<user>.github.io/silent"` and `"deploy": "gh-pages -d dist"`
3. Run: `npm run build && npm run deploy`

### Option 4: Mobile (Android) via Capacitor
```bash
npm install @capacitor/core @capacitor/android
npx cap init
npx cap add android
npm run build && npx cap sync
npx cap open android
```
Then publish via Google Play Console.

### Option 5: React Native (separate codebase)
For native Android DND (Do Not Disturb) control — which can actually silence emergency alerts programmatically — a React Native app with `react-native-do-not-disturb` would be needed. This web app serves as the scheduler UI.

---

## EmailJS Setup

1. Create account at [emailjs.com](https://emailjs.com)
2. Add Service ID: `service_eghiyme`
3. Add Template ID: `template_4v9rsyj`
4. Copy your **Public Key** from Account → API Keys
5. Paste it in **Settings → EmailJS Public Key**

---

## ⚠️ Disclaimer

Emergency alerts exist to save lives. Silencing them may prevent you from receiving critical real-time safety information. Use responsibly.

---

## Developer

**Ilan Kri-Gel** — [Portfolio](https://portfolio-dusky-eight-77.vercel.app/#/) · [GitHub](https://github.com/ikrigel?tab=repositories) · [LinkedIn](https://www.linkedin.com/in/ikrigel/)

---

*Built with ❤️ using React + MUI + TypeScript*
