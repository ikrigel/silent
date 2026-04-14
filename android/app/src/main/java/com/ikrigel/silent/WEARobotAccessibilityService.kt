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

        // Log window change with package and class info
        val source = event.source
        val pkgName = event.packageName?.toString() ?: "unknown"
        val className = source?.className?.toString() ?: "unknown"
        android.util.Log.d("WEARobotAccessibilityService", "Window changed: package=$pkgName className=$className")

        // Small delay to ensure UI is fully rendered before executing next step
        // This is especially important on Samsung devices which have slower rendering
        try {
            Thread.sleep(300)
        } catch (e: InterruptedException) {
            // Ignore
        }

        if (pendingSteps.isEmpty()) {
            state = RobotState.IDLE
            WEARobotAccessibilityService.cancelStateTimeout()
            onStepResult?.invoke(true, "Playback complete")
            return
        }

        val nextStep = pendingSteps.firstOrNull()
        android.util.Log.d("WEARobotAccessibilityService", "Next step: action=${nextStep?.action} text=${nextStep?.text}")

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

        android.util.Log.d("WEARobotAccessibilityService", "executeNextStep: action=${step.action} text='${step.text}' (${pendingSteps.size} steps remaining)")

        when (step.action) {
            "open_settings" -> {
                android.util.Log.d("WEARobotAccessibilityService", "Opening Settings app")
                val intent = Intent(Settings.ACTION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                startActivity(intent)
                // Next step will be triggered by the window-state-changed event
            }
            "quick_settings" -> {
                android.util.Log.d("WEARobotAccessibilityService", "Opening Quick Settings")
                performGlobalAction(GLOBAL_ACTION_QUICK_SETTINGS)
                // Next step will be triggered by the window-state-changed event
            }
            "click"         -> clickByText(step.text)
            "click_any"     -> clickByAnyLabel(step.text.split("|"))
            "toggle_off_any"-> toggleByAnyLabel(step.text.split("|"), targetState = false)
            "toggle_on_any" -> toggleByAnyLabel(step.text.split("|"), targetState = true)
            "scroll_down"   -> {
                android.util.Log.d("WEARobotAccessibilityService", "Scrolling down")
                scrollDown()
            }
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

        // Collect all discovered labels for debugging
        val discoveredLabels = mutableListOf<String>()
        collectAllLabels(root, discoveredLabels)

        android.util.Log.d("WEARobotAccessibilityService", "clickByAnyLabel: Looking for any of ${labels.size} labels. Discovered ${discoveredLabels.size} total labels on screen.")
        if (discoveredLabels.isNotEmpty()) {
            android.util.Log.d("WEARobotAccessibilityService", "All discovered labels: $discoveredLabels")
        }

        for (label in labels) {
            val node = findNodeByText(root, label.trim())
            if (node != null) {
                android.util.Log.d("WEARobotAccessibilityService", "Found match for label: '$label'")
                clickNode(node)
                return
            }
        }

        val errorMsg = "None of ${labels} found on screen. Discovered: $discoveredLabels"
        android.util.Log.e("WEARobotAccessibilityService", errorMsg)
        onStepResult?.invoke(false, errorMsg)
        state = RobotState.IDLE
    }

    private fun toggleByAnyLabel(labels: List<String>, targetState: Boolean) {
        val root = rootInActiveWindow ?: return

        // Collect all discovered labels for debugging
        val discoveredLabels = mutableListOf<String>()
        collectAllLabels(root, discoveredLabels)

        android.util.Log.d("WEARobotAccessibilityService", "toggleByAnyLabel: Looking for any of ${labels.size} labels. Discovered ${discoveredLabels.size} total labels on screen.")
        if (discoveredLabels.isNotEmpty()) {
            android.util.Log.d("WEARobotAccessibilityService", "All discovered labels: $discoveredLabels")
        }

        for (label in labels) {
            val node = findNodeByText(root, label.trim()) ?: continue
            android.util.Log.d("WEARobotAccessibilityService", "Found match for label: '$label'")

            // Strategy 1: Search UP the parent chain for Switch/CheckBox ancestor
            var switchAncestor = findToggleAncestor(node)

            // Strategy 2: If not found in parents, search siblings of ancestors
            // (Samsung Settings puts text in sibling container, switch in widget_frame sibling)
            if (switchAncestor == null) {
                switchAncestor = findToggleSibling(node)
            }

            // Strategy 3: Direct click if node itself is a switch
            if (switchAncestor == null && node.className?.toString()?.contains("Switch") == true) {
                switchAncestor = node
            }

            if (switchAncestor != null) {
                android.util.Log.d("WEARobotAccessibilityService", "Found toggle, attempting to click for targetState=$targetState")

                // Click regardless of current state - accessibility tree might be out of sync
                // Samsung devices often show stale isChecked values
                android.util.Log.d("WEARobotAccessibilityService", "Clicking toggle (current state may be stale)")
                clickNode(switchAncestor)

                // Wait for state change to propagate
                try {
                    Thread.sleep(300)
                } catch (e: InterruptedException) {
                    // Ignore
                }

                state = RobotState.IDLE
                WEARobotAccessibilityService.cancelStateTimeout()
                onStepResult?.invoke(true, "Toggled successfully")
                return
            }

            // Fall back to Quick Settings tile (ViewGroup with state in content-desc)
            // QS content-desc format: "Airplane,mode,Off,Button" or "Airplane,mode,On,Button"
            val desc = node.contentDescription?.toString() ?: ""
            val isOn = desc.contains(",On,", ignoreCase = true)
            val isOff = desc.contains(",Off,", ignoreCase = true)
            val hasQSFormat = isOn || isOff

            android.util.Log.d("WEARobotAccessibilityService", "Quick Settings tile check: desc='$desc' isOn=$isOn isOff=$isOff")

            if (hasQSFormat) {
                if ((isOn && !targetState) || (isOff && targetState)) {
                    // State mismatch — click to toggle
                    android.util.Log.d("WEARobotAccessibilityService", "Toggling Quick Settings tile from ${if (isOn) "ON" else "OFF"} to ${if (targetState) "ON" else "OFF"}")
                    clickNode(node)
                    Thread.sleep(200)
                } else {
                    android.util.Log.d("WEARobotAccessibilityService", "Quick Settings tile already in correct state")
                }
                state = RobotState.IDLE
                WEARobotAccessibilityService.cancelStateTimeout()
                onStepResult?.invoke(true, "Toggled successfully")
                return
            }
        }

        // Failed to find any label — log all discovered for user debugging
        val errorMsg = "Toggle not found for: $labels. Discovered on screen: $discoveredLabels"
        android.util.Log.e("WEARobotAccessibilityService", errorMsg)
        onStepResult?.invoke(false, errorMsg)
        state = RobotState.IDLE
    }

    /** Recursively collect all text and content description labels from tree */
    private fun collectAllLabels(node: AccessibilityNodeInfo, labels: MutableList<String>) {
        val nodeText = node.text?.toString()?.trim() ?: ""
        val nodeDesc = node.contentDescription?.toString()?.trim() ?: ""

        if (nodeText.isNotBlank()) labels.add("text:$nodeText")
        if (nodeDesc.isNotBlank()) labels.add("desc:$nodeDesc")

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            collectAllLabels(child, labels)
        }
    }

    private fun clickNode(node: AccessibilityNodeInfo) {
        val clickable = if (node.isClickable) node else findClickableParent(node)
        clickable?.performAction(AccessibilityNodeInfo.ACTION_CLICK)
    }

    /** DFS search for a node whose text or contentDescription contains [query] */
    private fun findNodeByText(node: AccessibilityNodeInfo, query: String): AccessibilityNodeInfo? {
        val nodeText = node.text?.toString()?.trim() ?: ""
        val nodeDesc = node.contentDescription?.toString()?.trim() ?: ""

        // Log every node's labels for debugging
        if (nodeText.isNotBlank() || nodeDesc.isNotBlank()) {
            android.util.Log.d("WEARobotAccessibilityService", "Searching node: text='$nodeText' desc='$nodeDesc' class='${node.className}'")
        }

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

        // Try to scroll the root window first
        if (root.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)) {
            android.util.Log.d("WEARobotAccessibilityService", "Scrolled root window successfully")
            return
        }

        // If root scroll failed, search for scrollable children (RecyclerView, ListView, etc.)
        val scrollableChild = findScrollableNode(root)
        if (scrollableChild != null && scrollableChild.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)) {
            android.util.Log.d("WEARobotAccessibilityService", "Scrolled child container successfully: ${scrollableChild.className}")
            return
        }

        // Scroll failed completely
        android.util.Log.w("WEARobotAccessibilityService", "Could not scroll: no scrollable container found")
        onStepResult?.invoke(false, "Could not scroll")
        state = RobotState.IDLE
        WEARobotAccessibilityService.cancelStateTimeout()
    }

    /** Find the first scrollable node (RecyclerView, ListView, ScrollView, etc.) */
    private fun findScrollableNode(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        if (node.isScrollable) return node
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val result = findScrollableNode(child)
            if (result != null) return result
        }
        return null
    }

    private fun findToggleAncestor(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        var current: AccessibilityNodeInfo? = node.parent
        var depth = 0
        while (current != null && depth < 5) {
            val cls = current.className?.toString() ?: ""
            val isCheckable = current.isCheckable

            // Standard Android toggle components
            if (cls.contains("Switch") || cls.contains("CheckBox")) {
                android.util.Log.d("WEARobotAccessibilityService", "Found toggle at depth $depth: class=$cls")
                return current
            }

            // Samsung custom toggles - look for checkable containers
            // Often wrapped in LinearLayout or RelativeLayout with isCheckable=true
            if (isCheckable && (cls.contains("LinearLayout") || cls.contains("RelativeLayout") || cls.contains("FrameLayout"))) {
                android.util.Log.d("WEARobotAccessibilityService", "Found checkable container at depth $depth: class=$cls isCheckable=$isCheckable")
                return current
            }

            current = current.parent
            depth++
        }

        // Last resort: look for any checkable parent (Samsung Quick Settings style)
        current = node.parent
        while (current != null) {
            if (current.isCheckable) {
                android.util.Log.d("WEARobotAccessibilityService", "Found checkable parent (fallback)")
                return current
            }
            current = current.parent
        }

        return null
    }

    /** Find Switch in sibling containers (Samsung Settings separates text and toggle into different branches) */
    private fun findToggleSibling(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        // Walk up to find a common parent with multiple children (usually LinearLayout with title_frame and widget_frame)
        var current: AccessibilityNodeInfo? = node.parent
        var depth = 0

        while (current != null && depth < 5) {
            // Search all children of this node for a Switch/CheckBox
            for (i in 0 until current.childCount) {
                val child = current.getChild(i) ?: continue
                val result = findSwitchInSubtree(child)
                if (result != null) {
                    android.util.Log.d("WEARobotAccessibilityService", "Found switch in sibling at depth $depth")
                    return result
                }
            }
            current = current.parent
            depth++
        }

        return null
    }

    /** Recursively search for Switch in a subtree */
    private fun findSwitchInSubtree(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        val cls = node.className?.toString() ?: ""

        // Found a switch
        if (cls.contains("Switch") || cls.contains("CheckBox")) {
            if (node.isCheckable) return node
        }

        // Recurse to children
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val result = findSwitchInSubtree(child)
            if (result != null) return result
        }

        return null
    }

    override fun onInterrupt() {
        state = RobotState.IDLE
        serviceScope.cancel()
    }
}
