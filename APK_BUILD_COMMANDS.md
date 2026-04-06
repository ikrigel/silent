# APK Build & Release Commands

**For detailed debugging commands and common issues, see [ANDROID_BUILD_DEBUGGING.md](ANDROID_BUILD_DEBUGGING.md)**

## Quick Reference

### Build & Release (Complete Workflow)

Push a tag to trigger automatic APK build on GitHub Actions:

## Bash / Git Bash (Recommended)

```bash
cd c:\silent\android && ./gradlew clean assembleRelease && cd .. && \
git tag -a v1.0.54 -m "build: APK release v1.0.54" && \
git push origin v1.0.54
```

**Or as a single line:**
```bash
cd c:\silent\android && ./gradlew clean assembleRelease && cd .. && git tag -a v1.0.54 -m "build: APK release v1.0.54" && git push origin v1.0.54
```

---

## PowerShell

```powershell
cd c:\silent\android; .\gradlew clean assembleRelease; cd ..; git tag -a v1.0.54 -m "build: APK release v1.0.54"; git push origin v1.0.54
```

---

## Windows Command Prompt (CMD)

```cmd
cd c:\silent\android && gradlew clean assembleRelease && cd .. && git tag -a v1.0.54 -m "build: APK release v1.0.54" && git push origin v1.0.54
```

---

## Kotlin Compilation Debugging

If the full APK build fails, isolate the Kotlin compiler error:

### Bash
```bash
cd c:\silent\android && ./gradlew app:compileReleaseKotlin --stacktrace --info
```

### PowerShell
```powershell
cd android; .\gradlew app:compileReleaseKotlin --stacktrace --info
```

**What to look for:**
- Lines starting with `e:` (errors) with file path and line number
- Lines starting with `w:` (warnings)
- These appear ABOVE the long Java stack trace
- Example: `e: /path/to/File.kt: (42, 13): Unresolved reference: someClass`

**Why this is useful:**
- Much faster than full build (30-60 sec vs 2-5 min)
- Shows exact file, line, and error message
- No need to build resources or APK
- Great for iterating on fixes

---

## Full Local Build

To test the complete build chain end-to-end:

### Bash
```bash
cd c:\silent\android && ./gradlew clean assembleRelease
```

### PowerShell
```powershell
cd android; .\gradlew clean assembleRelease
```

**Output:** `app/build/outputs/apk/release/app-release.apk`

---

## Clear Gradle Cache (When Stuck)

If build behaves oddly or has stale metadata errors:

### Bash
```bash
rm -rf android/.gradle android/app/build android/build
```

### PowerShell
```powershell
Remove-Item -Recurse -Force android\.gradle
Remove-Item -Recurse -Force android\app\build
Remove-Item -Recurse -Force android\build
```

**Warning:** This forces re-download of all dependencies (~2-3 min added to next build)

---

## What This Does

1. **Navigate to android directory** — `cd c:\silent\android`
2. **Build APK** — `./gradlew clean assembleRelease`
3. **Return to root** — `cd ..`
4. **Create git tag** — `git tag -a v1.0.54 -m "build message"`
5. **Push tag to GitHub** — `git push origin v1.0.54`

This automatically triggers the GitHub Actions APK build workflow.

---

## Key Differences by Shell

| Shell | Separator | Directory | Executable |
|-------|-----------|-----------|-----------|
| **Bash** | `&&` | `/c/silent/android` | `./gradlew` |
| **PowerShell** | `;` | `c:\silent\android` | `.\gradlew` |
| **CMD** | `&&` | `c:\silent\android` | `gradlew` |

---

## Monitor the Build

After pushing the tag, GitHub Actions should start a build automatically within 10-30 seconds.

### Monitor build progress:

```bash
# View GitHub Actions workflow
open https://github.com/ikrigel/silent/actions

# Or check git tag locally
git describe --tags
git log --oneline -5
```

APK will be available at: https://github.com/ikrigel/silent/releases

---

## Troubleshooting

### Build fails locally?
```bash
cd c:\silent\android
./gradlew clean assembleRelease --stacktrace --info
```

### Tag already exists?
```bash
git tag -d v1.0.54                    # Delete local tag
git push origin --delete v1.0.54      # Delete remote tag
git tag -a v1.0.54 -m "new message"  # Create new tag
git push origin v1.0.54               # Push
```

### Check current version
```bash
git describe --tags
cat package.json | grep version
cat android/app/build.gradle | grep versionName
```
