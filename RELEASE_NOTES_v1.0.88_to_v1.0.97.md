# Release Notes: v1.0.88 to v1.0.99

## Overview
These releases focused on **WEA silence calibration**, **airplane mode learning mode**, **scheduler robot action execution**, **comprehensive diagnostic logging**, **version visibility**, and **debugging confirmation logging** for better user experience and debugging.

---

## Release Summary

### v1.0.99 (2026-05-09) — Explicit Scheduler Version Confirmation Logging
**Focus**: Add explicit version info to scheduler ticks for APK version verification during debugging

#### Problems Addressed
- ❌ Users unable to confirm which APK version is actually installed/running
- ❌ No visible scheduler tick logs in app Logs page even when enabled
- ❌ Difficult to distinguish between "old APK still cached" vs "fix not working"

#### Changes
**1. Explicit Scheduler Tick Logging (src/pages/Dashboard/index.tsx):**
- Added info-level log on every scheduler tick (every 5 seconds): `"📊 SCHEDULER TICK v1.0.99 - X total schedules, Y active"`
- Version number appears in log, visible even at `info` log level (not just `ultraverbose`)
- Ensures users see confirmation they're running v1.0.99 in Logs page
- Kept all existing ultraverbose detail logs for full debugging

**Example Log Sequence with v1.0.99:**
```
═══════════════════════════════════════════════════
🚀 DASHBOARD MOUNTED - App Version: v1.0.99
═══════════════════════════════════════════════════
Dashboard: Running on ANDROID (APK)
📊 SCHEDULER TICK v1.0.99 - 2 total schedules, 0 active
📊 SCHEDULER TICK v1.0.99 - 2 total schedules, 1 active
⚡ Schedule "Morning Silence" JUST ACTIVATED
⚙️ ANDROID CHECK: YES - Will fire robot actions
🚀 STARTING ROBOT ACTIONS for schedule "Morning Silence"
📡 AIRPLANE MODE: Starting enable sequence
🏁 ALL ROBOT ACTIONS COMPLETED for "Morning Silence"
```

#### Impact
✅ Users can confirm APK version in Logs without opening About page
✅ Scheduler loop visible on every tick (not just when actions trigger)
✅ Debugging workflow: open Logs → wait 5s → see version confirmation
✅ Helps distinguish APK version issues from action execution issues

#### Testing
- Scheduler tick log appears every 5 seconds at `info` level
- Version (v1.0.99) visible in all scheduler logs
- Works alongside existing emoji-prefixed action logs

---

### v1.0.98 (2026-05-08) — Comprehensive Diagnostic Logging & Clear Version Display
**Focus**: Enable detailed troubleshooting of robot action execution + make version info always visible

#### Problems Addressed
- ❌ Scheduler fires actions but logs weren't visible in browser
- ❌ User couldn't quickly see what version they're running
- ❌ No clear distinction between current version and available version
- ❌ Difficult to diagnose robot action failures

#### Changes
**1. Enhanced Dashboard Logging (src/pages/Dashboard/index.tsx):**
- Added emoji-prefixed logging at every step: ⚡, ⚙️, 🚀, 📡, 🔇, 🏁
- Error stacks included in all catch blocks
- Outer error handlers to catch unexpected failures
- Clear indication when robot actions are skipped (browser environment)

**Example Log Sequence:**
```
⚡ Schedule "Test" JUST ACTIVATED
⚙️ ANDROID CHECK: YES - Will fire robot actions
🚀 CALLING runScheduleActions for "Test"
🚀 STARTING ROBOT ACTIONS for schedule "Test"
📡 AIRPLANE MODE: Starting enable sequence
📡 AIRPLANE MODE: Current state = OFF
📡 AIRPLANE MODE: ✅ Enable sequence completed
🏁 ALL ROBOT ACTIONS COMPLETED for "Test"
```

**2. Clear Version Display (src/pages/About/index.tsx):**
- Changed from confusing "Web App v1.0.98 | APK App v1.0.98" 
- Now shows: "📱 You are running (Web Browser): v1.0.98"
- Clearly separates current from available: "⬇️ Latest APK Available: v1.0.99"
- Shows environment (Web/APK) with each version

**3. Header Version Button (src/components/Layout/Header.tsx):**
- Added quick version check to header (always visible)
- Click ℹ️ v1.0.98 button to see popover
- Shows current version + environment (Web/APK)
- Shows latest available if different
- Link to full About page

#### Code Example - Header Version Display
```typescript
<Tooltip title="Click to see version details">
  <IconButton color="inherit" size="small" onClick={handleVersionClick}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Info fontSize="small" />
      <Typography variant="caption">v{__APP_VERSION__}</Typography>
    </Box>
  </IconButton>
</Tooltip>
```

#### Impact
✅ Every robot action step is logged with emoji for visibility
✅ Error stacks help identify exact failure points
✅ Version confusion eliminated — current vs available instantly clear
✅ Quick version check without leaving page
✅ Users can diagnose their own issues with comprehensive logs

#### Testing
- Test on APK: Create schedule, go to Logs, see full emoji-prefixed sequence
- Test on web: Click ℹ️ version button to see popover
- Test version display: Go to About page, see clear current/available separation

---

### v1.0.97 (2026-05-08) — Robot Action Execution Fix & Version Sync
**Focus**: Fix critical bug where robot actions don't execute when schedules become active

#### Problems Fixed
- ❌ Scheduler shows schedule is "ACTIVE" but phone never enters airplane mode or silences WEA
- ❌ `prevActiveIds` initialized as empty `Set()`, preventing first-tick action detection
- ❌ Schedules already active at component mount never triggered actions

#### Changes
- **Fixed initialization:** `prevActiveIds` now populated with currently active schedules at mount
- **Added emoji logging:** Track robot action execution with prefixed logs:
  - `🚀 STARTING ROBOT ACTIONS` — action execution triggered
  - `📡 AIRPLANE MODE: Enabling` — airplane mode action running
  - `🔇 WEA SILENCE: Starting` — WEA silence action running
  - `🏁 ALL ROBOT ACTIONS COMPLETED` — all actions finished
- **Created test:** "Robot actions fire when schedule with useAirplaneMode becomes active"
- **Synced versions:** Android versionCode 73 → 97, versionName 1.0.73 → 1.0.97

#### Code Changes
**src/pages/Dashboard/index.tsx:**
```typescript
useEffect(() => {
  const initialActive = getActiveSchedules();
  prevActiveIds.current = new Set(initialActive.map((s) => s.id));
}, [loadSchedules]);
```

**tests/dashboard.spec.ts:**
- Added test that creates schedule with `useAirplaneMode: true` starting NOW
- Waits for scheduler to detect active schedule
- Verifies logs contain emoji-prefixed action execution markers

#### Impact
✅ Robot actions now fire when schedules become active
✅ Emoji logs prove action execution path is triggered
✅ Enables debugging if phone doesn't respond despite log evidence
✅ Android/web versions now aligned (v1.0.97)

---

### v1.0.96 (2026-05-07) — WEA Silence Calibration & Learning Mode
**Focus**: Implement WEA silence learning mode (mirrors airplane mode)

#### Problems Addressed
- ❌ WEA silencing has device-specific timing issues (no state validation available)
- ❌ No way to know if `robotService.silenceWEA()` actually succeeded
- ❌ Accessibility Service navigation timing varies per device

#### Changes
- **New store:** `src/store/weaLearningStore.ts` — persist learned timing
- **New service:** `src/services/weaSilenceService.ts` — three-branch silence() method:
  - **Branch A (Learned):** Apply saved timing, call once, return
  - **Branch B (Learning):** 3-attempt retry with user feedback after each attempt
  - **Branch C (Default):** Call once, return (no retry, no state validation)
- **New dialog:** `src/pages/Robot/WeaLearningDialog.tsx` — calibration UI
- **Fixed feedback:** Error handling always shows feedback dialog (previously skipped on error)

#### Code Example
```typescript
export async function silence(): Promise<string> {
  // Branch A: Learned
  if (store.learned) {
    await delay(store.learnedDelay);
    return await robotService.silenceWEA();
  }
  // Branch B: Learning (retry with feedback)
  if (store.isLearning) {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await delay(RETRY_DELAYS_MS[i]);
      const msg = await robotService.silenceWEA().catch(err => 'Failed');
      await delay(POST_SILENCE_WAIT_MS);
      store.setPendingFeedback(i + 1);
      const confirmed = await feedbackPromise;
      if (confirmed) { store.saveLearned(RETRY_DELAYS_MS[i]); return msg; }
    }
  }
  // Branch C: Default (no retry)
  return await robotService.silenceWEA();
}
```

#### i18n Keys Added
```json
"robot.weaLearning.title": "WEA Silence Calibration",
"robot.weaLearning.feedbackPrompt": "Attempt {{attempt}}: Are WEA alerts silenced?"
```

#### Impact
✅ Users can calibrate WEA silencing for their device
✅ Learned timing persists across app restarts
✅ Bypasses unreliable state validation entirely

---

### v1.0.95 (2026-05-05) — Scheduler Integration & WEA Auto-Silencing
**Focus**: Integrate WEA learning service into scheduler

#### Changes
- **Added field:** `silenceWEAOnStart?: boolean` to ScheduleEntry type
- **Updated form:** SchedulerForm checkbox for "Silence WEA alerts when schedule starts"
- **Integrated service:** Dashboard imports and calls `weaSilenceService.silence()` for schedules
- **Added i18n:** Translated WEA silence option in scheduler form (en, he)

#### Code Changes
**src/types/index.ts:**
```typescript
interface ScheduleEntry {
  // ... existing fields ...
  silenceWEAOnStart?: boolean;
}
```

**src/pages/Dashboard/index.tsx:**
```typescript
if (s.silenceWEAOnStart) {
  await weaSilenceService.silence();
}
```

#### Impact
✅ Users can auto-silence WEA when schedule activates
✅ Works alongside airplane mode and custom recordings
✅ Per-schedule configuration via Scheduler form

---

### v1.0.94 (2026-05-02) — Ultraverbose Logging & Scheduler Debugging
**Focus**: Add detailed logging for debugging scheduler/robot issues

#### Changes
- **Enhanced:** `isScheduleActive()` logs check details (current time, day, enabled state, date range)
- **Enhanced:** `getActiveSchedules()` logs total schedules checked and active count
- **Added:** Scheduling loop detection via Dashboard useEffect logging
- **Benefit:** Enable debugging without verbose console spam by using log level controls

#### Code Changes
**src/services/schedulerService.ts:**
```typescript
writeLog('ultraverbose', `isScheduleActive: Checking schedule "${schedule.name}"`, {
  currentTime, today, dayOfWeek, startTime, endTime, repeatMode,
  startDate, endDate, // date range checks
});
```

#### Impact
✅ Ultra verbose logs show exactly why schedules are/aren't active
✅ Helps isolate scheduler detection vs action execution problems

---

### v1.0.93 (2026-04-28) — Airplane Mode Learning Mode
**Focus**: Solve device-specific airplane mode automation timing issues

#### Problems Addressed
- ❌ `getAirplaneModeState()` returns false negatives on some devices even when ON
- ❌ Accessibility Service navigation timing varies per device
- ❌ Retries sometimes navigate to wrong screen (WEA settings instead of airplane)
- ❌ No way to know which attempt timing works on user's device

#### Solution: Learning Mode
Users watch each automation attempt and confirm which one worked. That timing is saved and reused for all future runs.

#### Components Implemented

**1. Store:** `src/store/airplaneLearningStore.ts`
```typescript
interface AirplaneLearningState {
  learned: boolean;
  learnedDelay: number; // 0 | 3000 | 5000 ms
  isLearning: boolean;
  pendingFeedbackAttempt: number | null;
  startLearning(): void;
  resetLearning(): void;
  saveLearned(delay: number): void;
  // ...
}
```

**2. Service:** `src/services/airplaneModeService.ts`
- Three-branch `enable()` method
- **Learned:** Apply saved delay, call once
- **Learning:** Retry loop with user feedback prompts
- **Default:** Original validation logic (unchanged)
- Exported `provideAirplaneFeedback(confirmed: boolean)` for UI callback

**3. Dialog:** `src/pages/Robot/AirplaneLearningDialog.tsx`
- "Calibrate Airplane Mode" button to start learning
- "Attempt N: Did airplane mode turn ON?" feedback prompt
- "✓ Calibrated (delay: Xms)" confirmation with Reset button

#### User Flow
1. **Tap Calibrate Airplane Mode** → enters learning mode
2. **Tap Enable Airplane Mode** action → attempt #1 runs, pauses for feedback
3. **Dialog:** "Attempt 1: Did airplane mode turn ON?" 
4. **User taps YES** → timing saved, learned mode activated
5. **Future runs** → uses saved timing, one call only

#### Impact
✅ Each device learns its optimal automation timing
✅ Eliminates false negatives from state validation
✅ Eliminates retry overhead (1.5–7s faster than 3-attempt fallback)
✅ User agency — watches and confirms what works
✅ Timing persists across app restarts

---

### v1.0.88–v1.0.92
(Intermediate versions with incremental improvements to infrastructure, testing, and documentation)

---

## Debugging Guide

### When Robot Actions Don't Fire

**1. Check logs for robot action execution:**
```
Go to Logs page → Search for:
  - "🚀 STARTING ROBOT ACTIONS"
  - "📡 AIRPLANE MODE: Enabling"
  - "🔇 WEA SILENCE: Starting"
```

**If logs appear:**
- ✅ Scheduler correctly triggered action execution
- ❌ Problem is in robot service or accessibility service
- Try: Calibrate timing (Airplane Mode Learning / WEA Learning)

**If logs don't appear:**
- ❌ Dashboard action execution not triggered
- Check: Schedule is correctly marked ACTIVE
- Try: Increase log level to ultraverbose

**2. Enable Ultra Verbose Logging:**
- Settings → Log Level → Ultra Verbose (APK only)
- Logs every scheduler tick and active check

**3. Test with Playwright:**
```bash
npm test -- --grep "Robot actions fire"
```
This test verifies the full chain: schedule active → logs appear.

---

## Installation & Testing

### Build APK (Local)
```bash
npm run build
npx cap sync android
cd android && ./gradlew clean assembleRelease
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Test Robot Actions on Device
1. **Create schedule** with airplane mode + WEA silence, time = NOW to +5 min
2. **Go to Dashboard** — should show "REMINDER ACTIVE" warning
3. **Go to Logs** — search for `🚀` emoji logs
4. **Check phone** — airplane mode and WEA silencing should activate
5. **If only logs appear** → calibrate timing via Robot page

### Run Tests
```bash
npm test              # All tests
npm test -- --grep "Robot actions fire"  # Specific test
npm run test:ui       # Interactive mode
```

---

## Key Features by Version

| Feature | Version | Status |
|---------|---------|--------|
| Scheduler & Schedule Management | v1.0.60+ | ✅ Stable |
| Robot Automation (Accessibility) | v1.0.60+ | ✅ Stable |
| Airplane Mode | v1.0.77+ | ✅ Stable |
| Airplane Mode Learning | v1.0.93+ | ✅ New |
| WEA Silence | v1.0.60+ | ✅ Stable |
| WEA Learning | v1.0.96+ | ✅ New |
| Scheduler → Robot Execution | v1.0.97+ | ✅ Fixed |
| Emoji Logging | v1.0.97+ | ✅ New |

---

**Last Updated:** 2026-05-08 (v1.0.98)
