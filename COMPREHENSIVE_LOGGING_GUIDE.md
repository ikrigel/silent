# Comprehensive Robot Action Execution Logging — v1.0.99+

**Purpose:** Track every step of robot action execution to identify why actions may not trigger despite scheduler detecting active schedules.

---

## Visual Log Structure

When a schedule becomes active, logs now show a clear visual execution tree:

```
════════════════════════════════════════════════════════
⚡ SCHEDULE ACTIVATION DETECTED: "Morning Silence"
════════════════════════════════════════════════════════
⚙️ PLATFORM CHECK: ✅ ANDROID - Robot actions WILL execute
✅ ROBOT ACTIONS ENABLED - Executing for "Morning Silence"

┌─────────────────────────────────────────────────────
│ 🚀 ROBOT ACTIONS EXECUTION START
│ Schedule: "Morning Silence"
│ Airplane Mode: ✅ YES
│ WEA Silence: ❌ NO
│ Recording: ❌ NO
└─────────────────────────────────────────────────────

  ├─ 📡 AIRPLANE MODE ACTION STARTED
  │  └─ 📡 Current state: ❌ OFF
  │  └─ State is OFF, calling airplaneModeService.enable()
  │  └─ 📡 AIRPLANE MODE: ✅ Enable completed - result: Airplane mode enabled
  │
  └─ 🏁 ROBOT ACTIONS EXECUTION COMPLETE
```

---

## Log Levels & What They Show

### 🟦 INFO Level (Default — Always Visible)

Shows major milestones and results:

```
════════════════════════════════════════════════════════
⚡ SCHEDULE ACTIVATION DETECTED: "Morning Silence"
════════════════════════════════════════════════════════
⚙️ PLATFORM CHECK: ✅ ANDROID - Robot actions WILL execute
✅ ROBOT ACTIONS ENABLED - Executing for "Morning Silence"
📊 SCHEDULER TICK v1.0.99 - 2 total schedules, 1 active
📡 AIRPLANE MODE: ✅ Enable completed - result: ...
🔇 WEA SILENCE: ✅ Success - result: ...
🎬 RECORDING: ✅ Completed - recordingId: builtin_airplane_on
✅ Async runScheduleActions() promise resolved successfully
📊 SCHEDULER TICK COMPLETE - Tracking active schedules: ...
```

### 🟪 ULTRAVERBOSE Level (Full Debugging)

Shows method calls, parameters, and execution context:

```json
{
  "method": "airplaneModeService.getState()",
  "scheduleId": "schedule-123",
  "timestamp": "2026-05-11T04:42:06.123Z"
}
```

---

## Key Logging Points

### 1. Schedule Activation Detection

```
════════════════════════════════════════════════════════
⚡ SCHEDULE ACTIVATION DETECTED: "Morning Silence"
════════════════════════════════════════════════════════
```

**What it means:** Schedule just transitioned from INACTIVE → ACTIVE  
**When to see it:** Moment the scheduler detects schedule time window has started  
**If missing:** Scheduler may not be detecting active schedules correctly

---

### 2. Platform Check

```
⚙️ PLATFORM CHECK: ✅ ANDROID - Robot actions WILL execute
```

**What it means:** Check if running on Android (APK) vs Web Browser  
**If shows ❌ WEB BROWSER:** Robot actions are skipped (expected on web)  
**If shows ✅ ANDROID:** Robot actions will execute next

---

### 3. Robot Action Handler Invocation

```
🚀 EXECUTING ROBOT ACTION HANDLER for "Morning Silence"
→ FIRING async runScheduleActions() function now
```

**What it means:** Async function is about to execute  
**Important:** This shows the function was called, not that it completed

---

### 4. Action Execution Tree

Each action (Airplane, WEA, Recording) shows:

```
├─ 📡 AIRPLANE MODE ACTION STARTED
│  └─ 📡 Current state: ❌ OFF
│  └─ Calling airplaneModeService.enable()
│  └─ 📡 AIRPLANE MODE: ✅ Enable completed - result: ...
```

**Breakdown:**
- `├─` — Action starting
- `│  └─` — Method call or status check
- `│  └─` — Result of method call

---

### 5. Promise Resolution Status

```
✅ Async runScheduleActions() promise resolved successfully
```

OR if failed:

```
❌ Async runScheduleActions() promise REJECTED: Error message here
```

**What it means:** Whether async execution completed or crashed  
**Critical:** If you see a REJECTION, the error details follow

---

### 6. Scheduler Tick Completion

```
📊 SCHEDULER TICK COMPLETE - Tracking active schedules: schedule-123, schedule-456
```

**What it means:** Tick cycle finished and updated which schedules are active  
**Shows:** IDs of currently active schedules for next cycle

---

## Troubleshooting Guide

### Symptom: No activation log appears

```
❌ Don't see: ⚡ SCHEDULE ACTIVATION DETECTED
```

**Possible causes:**
1. Schedule time window hasn't arrived yet — check start/end times
2. Schedule is disabled — verify "enabled" toggle is ON
3. Today is not included in schedule days — check day-of-week setting
4. Date range excluded today — check start/end dates

**What to check in logs:**
- Look for: `isScheduleActive: "schedule-name" time check`
- Should show: current time vs start/end times
- Should show: `"isActive":false` (before activation)

---

### Symptom: Platform check shows WEB BROWSER

```
⚙️ PLATFORM CHECK: ❌ WEB BROWSER - Robot actions skipped
```

**This is normal on:** Web browser, Vercel, desktop app  
**Expected:** Robot actions only run on Android APK  
**Solution:** Test on Android device, not web browser

---

### Symptom: Robot action handler not called

```
❌ Don't see: 🚀 EXECUTING ROBOT ACTION HANDLER
```

**Possible causes:**
1. Schedule detected as active but `isAndroid` returned false
2. Schedule has no robot actions configured (all disabled)
3. `prevActiveIds` already contains this schedule (won't trigger twice)

**What to check:**
- See `⚙️ PLATFORM CHECK` result
- See `✅ ROBOT ACTIONS ENABLED` log
- Check schedule config (useAirplaneMode, silenceWEAOnStart, robotRecordingId)

---

### Symptom: Method shows error

```
│  └─ 📡 AIRPLANE MODE: ❌ ERROR - Permission denied
│  └─ stack: at airplaneModeService.enable line 156
```

**What to do:**
1. Note the error message
2. Note the stack trace
3. Check if it's a permission issue or accessibility service issue
4. Look at ultraverbose logs for full context

---

### Symptom: Promise rejected

```
❌ Async runScheduleActions() promise REJECTED: Cannot read property 'isAndroid' of undefined
```

**Severity:** High — async execution crashed  
**What to do:**
1. Copy full error message
2. Check stack trace in ultraverbose logs
3. Look for null/undefined issues in robot service calls

---

## How to Collect Logs for Debugging

### Step 1: Set Log Level
Settings → Log Level → **Ultra Verbose**

### Step 2: Create Test Schedule
- Schedule name: "Test Debug"
- Start: NOW (current time)
- End: NOW + 5 minutes
- Enable: Airplane Mode
- Save

### Step 3: Wait for Activation
- Go to **Dashboard** page
- Wait for schedule to become active (check current time)
- See: "REMINDER ACTIVE" warning banner appear

### Step 4: Capture Logs
- Go to **Logs** page
- Look for: `⚡ SCHEDULE ACTIVATION DETECTED`
- Scroll down to see the full execution tree
- Export JSON if needed

### Step 5: Send for Analysis
Share:
- Screenshot of logs showing activation
- Log export JSON (from Export JSON button)
- What you expected vs what happened

---

## Expected Log Sequence (Success Case)

```
════════════════════════════════════════════════════════
⚡ SCHEDULE ACTIVATION DETECTED: "Test Debug"
════════════════════════════════════════════════════════
Dashboard: Running on ANDROID (APK)
⚙️ PLATFORM CHECK: ✅ ANDROID - Robot actions WILL execute
✅ ROBOT ACTIONS ENABLED - Executing for "Test Debug"

┌─────────────────────────────────────────────────────
│ 🚀 ROBOT ACTIONS EXECUTION START
│ Schedule: "Test Debug"
│ Airplane Mode: ✅ YES
│ WEA Silence: ❌ NO
│ Recording: ❌ NO
└─────────────────────────────────────────────────────

  ├─ 📡 AIRPLANE MODE ACTION STARTED
  │  └─ 📡 Current state: ❌ OFF
  │  └─ Calling airplaneModeService.enable()
  │  └─ 📡 AIRPLANE MODE: ✅ Enable completed
  │
  └─ 🏁 ROBOT ACTIONS EXECUTION COMPLETE

✅ Async runScheduleActions() promise resolved successfully
```

---

## Timestamps in All Logs

Every log entry now includes `"timestamp": "2026-05-11T04:42:06.123Z"` in ultraverbose metadata.

**Use timestamps to:**
- Correlate logs across multiple apps
- Measure execution time between steps
- Identify delays or hangs
- Timeline of events

---

**Version:** 1.0.99+  
**Last Updated:** 2026-05-11  
**For debugging:** Use this guide with Logs page to identify robot action execution failures
