Silent APK Distribution
=======================

APK files are now distributed via GitHub Releases instead of static files.

This folder is kept for documentation purposes only.

## How APKs are Built and Distributed

The APK is automatically built and published to GitHub Releases when you create a git tag.

### Build Process:
1. The GitHub Actions workflow (.github/workflows/build-apk.yml) is triggered on:
   - Tag push: `git tag v1.0.0 && git push origin v1.0.0`
   - Manual trigger: Go to GitHub → Actions → Build Android APK → Run workflow

2. The workflow:
   - Checks out code
   - Installs dependencies
   - Builds web app (npm run build)
   - Syncs Capacitor (npx cap sync android)
   - Builds Android release APK (./gradlew assembleRelease)
   - Uploads APK to GitHub Release

3. Users download from:
   - https://github.com/ikrigel/silent/releases

### Manual Build (Local):
If you need to build manually:

  cd android
  ./gradlew assembleRelease

Output: android/app/build/outputs/apk/release/app-release.apk

Then upload to GitHub Releases manually via:
  https://github.com/ikrigel/silent/releases/new

### Notes:
- APK files should NOT be committed to Git (they're large)
- GitHub Releases provides version history and download tracking
- Users always get the latest version from GitHub
- Vercel serves only the web app, not APKs
