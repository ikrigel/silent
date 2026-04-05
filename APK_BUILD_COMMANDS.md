# APK Build & Release Commands

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

After pushing the tag, check the build status:

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
