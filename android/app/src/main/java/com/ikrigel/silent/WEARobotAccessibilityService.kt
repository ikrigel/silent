package com.ikrigel.silent

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.*

/**
 * WEA Robot Accessibility Service
 *
 * Provides two capabilities:
 *  1. RECORDING — captures each UI element the user taps (text + description)
 *     and stores it as a RobotStep list.
 *  2. PLAYBACK  — navigates through Android Settings using text-based element
 *     search (not pixel coordinates) to toggle Wireless Emergency Alert settings.
 *
 * Communication with WEARobotPlugin uses the companion object (static state).
 *
 * NOTE: User must enable this service once via:
 *   Settings → Accessibility → Silent Robot → Use Service
 */
class WEARobotAccessibilityService : AccessibilityService() {

    companion object {
        /** Plugin posts pending steps here; service drains them on window events */
        var pendingSteps: ArrayDeque<RobotStep> = ArrayDeque()
        var state: RobotState = RobotState.IDLE
        var recordedSteps: MutableList<RobotStep> = mutableListOf()
        /** Callback invoked by service after each step (success / error) */
        var onStepResult: ((ok: Boolean, msg: String) -> Unit)? = null
        /** Timeout job to reset stuck state */
        private var stateTimeoutJob: Job? = null
        private var globalServiceScope: CoroutineScope? = null

        fun setServiceScope(scope: CoroutineScope) {
            globalServiceScope = scope
        }

        /** Reset state to IDLE if stuck for 15 seconds */
        fun scheduleStateTimeout() {
            stateTimeoutJob?.cancel()
            stateTimeoutJob = globalServiceScope?.launch {
                delay(15000) // 15 second timeout
                if (state != RobotState.IDLE) {
                    android.util.Log.w("WEARobotAccessibilityService", "State timeout: resetting from $state to IDLE")
                    state = RobotState.IDLE
                    onStepResult?.invoke(false, "Timeout: robot was stuck, reset to idle")
                }
            }
        }

        /** Cancel timeout when state returns to IDLE */
        fun cancelStateTimeout() {
            stateTimeoutJob?.cancel()
            stateTimeoutJob = null
        }
    }

    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    override fun onServiceConnected() {
        super.onServiceConnected()
        WEARobotAccessibilityService.setServiceScope(serviceScope)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return
        when (state) {
            RobotState.RECORDING -> handleRecordingEvent(event)
            RobotState.PLAYING   -> handlePlaybackEvent(event)
            RobotState.IDLE      -> Unit
        }
    }

    // ── Recording ────────────────────────────────────────────────────────────

    private fun handleRecordingEvent(event: AccessibilityEvent) {
        if (event.eventType != AccessibilityEvent.TYPE_VIEW_CLICKED) return
        val node  = event.source ?: return
        val text  = node.text?.toString()?.trim() ?: ""
        val desc  = node.contentDescription?.toString()?.trim() ?: ""
        val label = text.ifBlank { desc }
        if (label.isNotBlank()) {
            recordedSteps.add(RobotStep(action = "click", text = label))
        }
    }

    // ── Playback ─────────────────────────────────────────────────────────────

    /** Called on every window-state-changed event during playback */
    private fun handlePlaybackEvent(event: AccessibilityEvent) {
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        if (pendingSteps.isEmpty()) {
            state = RobotState.IDLE
            WEARobotAccessibilityService.cancelStateTimeout()
            onStepResult?.invoke(true, "Playback complete")
            return
        }
        // Small delay so the new window fully renders before we search it
        serviceScope.launch {
            delay(600)
            executeNextStep()
        }
    }

    private fun executeNextStep() {
        val step = pendingSteps.removeFirstOrNull() ?: run {
            state = RobotState.IDLE
            WEARobotAccessibilityService.cancelStateTimeout()
            onStepResult?.invoke(true, "Done")
            return
        }

        when (step.action) {
            "open_settings" -> {
                val intent = Intent(Settings.ACTION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                startActivity(intent)
                // Next step will be triggered by the window-state-changed event
            }
            "quick_settings" -> {
                performGlobalAction(GLOBAL_ACTION_QUICK_SETTINGS)
                // Next step will be triggered by the window-state-changed event
            }
            "click"         -> clickByText(step.text)
            "click_any"     -> clickByAnyLabel(step.text.split("|"))
            "toggle_off_any"-> toggleByAnyLabel(step.text.split("|"), targetState = false)
            "toggle_on_any" -> toggleByAnyLabel(step.text.split("|"), targetState = true)
            "scroll_down"   -> scrollDown()
        }
    }

    // ── Node search helpers ───────────────────────────────────────────────────

    private fun clickByText(text: String) {
        val root = rootInActiveWindow ?: return
        val node = findNodeByText(root, text)
        if (node != null) {
            clickNode(node)
        } else {
            onStepResult?.invoke(false, "Node not found: $text")
            state = RobotState.IDLE
            WEARobotAccessibilityService.cancelStateTimeout()
        }
    }

    private fun clickByAnyLabel(labels: List<String>) {
        val root = rootInActiveWindow ?: return
        for (label in labels) {
            val node = findNodeByText(root, label.trim())
            if (node != null) { clickNode(node); return }
        }
        onStepResult?.invoke(false, "None of ${labels} found on screen")
        state = RobotState.IDLE
    }

    private fun toggleByAnyLabel(labels: List<String>, targetState: Boolean) {
        val root = rootInActiveWindow ?: return
        for (label in labels) {
            val node = findNodeByText(root, label.trim()) ?: continue

            // First try traditional Switch/CheckBox (Settings app)
            val switchAncestor = findToggleAncestor(node)
            if (switchAncestor != null) {
                if (switchAncestor.isChecked != targetState) {
                    clickNode(switchAncestor)
                }
                return
            }

            // Fall back to Quick Settings tile (ViewGroup with state in content-desc)
            // QS content-desc format: "Airplane,mode,Off,Button" or "Airplane,mode,On,Button"
            val desc = node.contentDescription?.toString() ?: ""
            val isOn = desc.contains(",On,", ignoreCase = true)
            val isOff = desc.contains(",Off,", ignoreCase = true)

            if ((isOn && !targetState) || (isOff && targetState)) {
                // State mismatch — click to toggle
                clickNode(node)
            }
            return
        }
        onStepResult?.invoke(false, "Toggle not found for: $labels")
        state = RobotState.IDLE
    }

    private fun clickNode(node: AccessibilityNodeInfo) {
        val clickable = if (node.isClickable) node else findClickableParent(node)
        clickable?.performAction(AccessibilityNodeInfo.ACTION_CLICK)
    }

    /** DFS search for a node whose text or contentDescription contains [query] */
    private fun findNodeByText(node: AccessibilityNodeInfo, query: String): AccessibilityNodeInfo? {
        val nodeText = node.text?.toString()?.trim() ?: ""
        val nodeDesc = node.contentDescription?.toString()?.trim() ?: ""
        if (nodeText.contains(query, ignoreCase = true) ||
            nodeDesc.contains(query, ignoreCase = true)) return node

        for (i in 0 until node.childCount) {
            val child  = node.getChild(i) ?: continue
            val result = findNodeByText(child, query)
            if (result != null) return result
        }
        return null
    }

    private fun findClickableParent(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        var current: AccessibilityNodeInfo? = node.parent
        while (current != null) {
            if (current.isClickable) return current
            current = current.parent
        }
        return null
    }

    private fun scrollDown() {
        val root = rootInActiveWindow ?: run {
            onStepResult?.invoke(false, "No active window for scrolling")
            state = RobotState.IDLE
            WEARobotAccessibilityService.cancelStateTimeout()
            return
        }
        // Try to scroll the root window or the first scrollable container found
        if (root.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)) {
            // Successfully scrolled; next step will be triggered by window event
        } else {
            onStepResult?.invoke(false, "Could not scroll")
            state = RobotState.IDLE
            WEARobotAccessibilityService.cancelStateTimeout()
        }
    }

    private fun findToggleAncestor(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        var current: AccessibilityNodeInfo? = node.parent
        while (current != null) {
            val cls = current.className?.toString() ?: ""
            if (cls.contains("Switch") || cls.contains("CheckBox")) return current
            current = current.parent
        }
        return null
    }

    override fun onInterrupt() {
        state = RobotState.IDLE
        serviceScope.cancel()
    }
}
