Silent APK Distribution
=======================

Place the built silent.apk here after building with Android Studio or Gradle.

To build:
  cd android
  ./gradlew assembleRelease

The APK will be at:
  android/app/build/outputs/apk/release/app-release.apk

Rename it to silent.apk and place it in this directory.
It will be served at: https://your-vercel-domain/downloads/silent.apk
