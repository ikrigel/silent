package com.ikrigel.silent

import android.content.Intent
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import androidx.core.content.ContextCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "WEARobot")
class WEARobotPlugin : Plugin() {

    // ── Accessibility status ───────────────────────────────────────────────

    @PluginMethod
    fun isAccessibilityEnabled(call: PluginCall) {
        val am = ContextCompat.getSystemService(context, AccessibilityManager::class.java)
        val enabled = am?.isEnabled == true && isOurServiceEnabled()
        call.resolve(JSObject().put("enabled", enabled))
    }

    @PluginMethod
    fun openAccessibilitySettings(call: PluginCall) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        call.resolve()
    }

    private fun isOurServiceEnabled(): Boolean {
        val am = context.getSystemService(android.content.Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
            ?: return false
        val enabled = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        return enabled.contains("${context.packageName}/${WEARobotAccessibilityService::class.java.name}")
    }

    // ── Recording ─────────────────────────────────────────────────────────

    @PluginMethod
    fun startRecording(call: PluginCall) {
        if (WEARobotAccessibilityService.state != RobotState.IDLE) {
            call.reject("Robot is busy")
            return
        }
        WEARobotAccessibilityService.recordedSteps.clear()
        WEARobotAccessibilityService.state = RobotState.RECORDING
        call.resolve()
    }

    @PluginMethod
    fun stopRecording(call: PluginCall) {
        WEARobotAccessibilityService.state = RobotState.IDLE
        val steps = JSArray()
        WEARobotAccessibilityService.recordedSteps.forEach { step ->
            steps.put(JSObject().apply {
                put("action", step.action)
                put("text", step.text)
                put("description", step.description)
            })
        }
        call.resolve(JSObject().put("steps", steps))
    }

    @PluginMethod
    fun saveRecording(call: PluginCall) {
        val id   = call.getString("id") ?: java.util.UUID.randomUUID().toString()
        val name = call.getString("name") ?: "Recording"
        val arr  = call.getArray("steps") ?: JSArray()
        val steps = (0 until arr.length()).map { i ->
            val obj = arr.getJSONObject(i)
            RobotStep(
                action      = obj.optString("action", "click"),
                text        = obj.optString("text", ""),
                description = obj.optString("description", ""),
            )
        }
        val recording = RobotRecording(
            id        = id,
            name      = name,
            steps     = steps,
            createdAt = java.time.Instant.now().toString(),
        )
        WEARobotStorage.saveRecording(context, recording)
        call.resolve(JSObject().put("id", id))
    }

    // ── Stored recordings ─────────────────────────────────────────────────

    @PluginMethod
    fun getRecordings(call: PluginCall) {
        val all = BuiltInRecordings.ALL + WEARobotStorage.getRecordings(context)
        val arr = JSArray()
        all.forEach { rec ->
            val steps = JSArray()
            rec.steps.forEach { step ->
                steps.put(JSObject().apply {
                    put("action", step.action)
                    put("text", step.text)
                    put("description", step.description)
                })
            }
            arr.put(JSObject().apply {
                put("id",        rec.id)
                put("name",      rec.name)
                put("createdAt", rec.createdAt)
                put("isBuiltIn", rec.isBuiltIn)
                put("steps",     steps)
            })
        }
        call.resolve(JSObject().put("recordings", arr))
    }

    @PluginMethod
    fun deleteRecording(call: PluginCall) {
        val id = call.getString("id") ?: run { call.reject("id required"); return }
        WEARobotStorage.deleteRecording(context, id)
        call.resolve()
    }

    // ── Playback ──────────────────────────────────────────────────────────

    @PluginMethod
    fun executeRecording(call: PluginCall) {
        call.setKeepAlive(true)          // wait for async completion
        val id = call.getString("id") ?: run { call.reject("id required"); return }
        val recording = WEARobotStorage.findRecording(context, id)
            ?: run { call.reject("Recording not found: $id"); return }

        if (WEARobotAccessibilityService.state != RobotState.IDLE) {
            call.reject("Robot is busy")
            return
        }

        WEARobotAccessibilityService.pendingSteps.clear()
        WEARobotAccessibilityService.pendingSteps.addAll(recording.steps)
        WEARobotAccessibilityService.state = RobotState.PLAYING
        WEARobotAccessibilityService.onStepResult = { ok, msg ->
            WEARobotAccessibilityService.onStepResult = null
            if (ok) call.resolve(JSObject().put("message", msg))
            else    call.reject(msg)
        }
        // Kick off first step: open Settings (or wait for next window event)
        val first = WEARobotAccessibilityService.pendingSteps.firstOrNull()
        if (first?.action == "open_settings") {
            WEARobotAccessibilityService.pendingSteps.removeFirst()
            val intent = Intent(Settings.ACTION_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        }
    }

    @PluginMethod
    fun silenceWEA(call: PluginCall) {
        call.setKeepAlive(true)
        runRecording(call, BuiltInRecordings.SILENCE_WEA)
    }

    @PluginMethod
    fun unsilenceWEA(call: PluginCall) {
        call.setKeepAlive(true)
        runRecording(call, BuiltInRecordings.RESTORE_WEA)
    }

    @PluginMethod
    fun enableAirplaneMode(call: PluginCall) {
        call.setKeepAlive(true)
        runRecording(call, BuiltInRecordings.AIRPLANE_ON)
    }

    @PluginMethod
    fun disableAirplaneMode(call: PluginCall) {
        call.setKeepAlive(true)
        runRecording(call, BuiltInRecordings.AIRPLANE_OFF)
    }

    // ── Internal helpers ──────────────────────────────────────────────────

    private fun runRecording(call: PluginCall, recording: RobotRecording) {
        if (WEARobotAccessibilityService.state != RobotState.IDLE) {
            call.reject("Robot is busy")
            return
        }
        WEARobotAccessibilityService.pendingSteps.clear()
        WEARobotAccessibilityService.pendingSteps.addAll(recording.steps)
        WEARobotAccessibilityService.state = RobotState.PLAYING
        WEARobotAccessibilityService.onStepResult = { ok, msg ->
            WEARobotAccessibilityService.onStepResult = null
            if (ok) call.resolve(JSObject().put("message", msg))
            else    call.reject(msg)
        }
        val first = WEARobotAccessibilityService.pendingSteps.firstOrNull()
        if (first?.action == "open_settings") {
            WEARobotAccessibilityService.pendingSteps.removeFirst()
            val intent = Intent(Settings.ACTION_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        }
    }
}
