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
        /** Tracks open screens; must be 0 at completion or on failure cleanup */
        var windowDepth: Int = 0
        /** Service instance for plugin to trigger global actions */
        var serviceInstance: WEARobotAccessibilityService? = null
        /** Timeout job to reset stuck state */
        private var stateTimeoutJob: Job? = null
        private var globalServiceScope: CoroutineScope? = null

        fun setServiceScope(scope: CoroutineScope) {
            globalServiceScope = scope
        }

        /** Open Quick Settings panel (called from plugin for first-step quick_settings) */
        fun launchQuickSettings() {
            globalServiceScope?.launch {
                serviceInstance?.performGlobalAction(
                    android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_QUICK_SETTINGS
                )
            }
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
        WEARobotAccessibilityService.serviceInstance = this
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
            delay(1000)
            executeNextStep()
        }
    }

    private fun executeNextStep() {
        val step = pendingSteps.removeFirstOrNull() ?: run {
            if (windowDepth != 0) {
                android.util.Log.w(
                    "WEARobotAccessibilityService",
                    "⚠ Completed with windowDepth=$windowDepth (expected 0) — screen imbalance"
                )
            }
            state = RobotState.IDLE
            WEARobotAccessibilityService.cancelStateTimeout()
            onStepResult?.invoke(true, "Done")
            return
        }

        android.util.Log.d("WEARobotAccessibilityService", "executeNextStep: action=${step.action} text='${step.text}' (${pendingSteps.size} steps remaining)")

        when (step.action) {
            "open_settings" -> {
                windowDepth++
                android.util.Log.d("WEARobotAccessibilityService", "Opening Settings app, depth=$windowDepth")
                val intent = Intent(Settings.ACTION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                startActivity(intent)
                // Next step will be triggered by the window-state-changed event
            }
            "quick_settings" -> {
                windowDepth++
                android.util.Log.d("WEARobotAccessibilityService", "Opening Quick Settings, depth=$windowDepth")
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
            "press_back" -> {
                windowDepth = maxOf(0, windowDepth - 1)
                android.util.Log.d("WEARobotAccessibilityService", "Pressing Back, depth=$windowDepth")
                performGlobalAction(GLOBAL_ACTION_BACK)
                serviceScope.launch {
                    delay(500)
                    executeNextStep()
                }
            }
        }
    }

    // ── Node search helpers ───────────────────────────────────────────────────

    private fun clickByText(text: String) {
        val root = rootInActiveWindow ?: return
        val node = findNodeByText(root, text)
        if (node != null) {
            windowDepth++
            clickNode(node)
        } else {
            cleanupAndFail("Node not found: $text")
        }
    }

    private fun clickByAnyLabel(labels: List<String>) {
        var root = rootInActiveWindow ?: run { cleanupAndFail("No active window"); return }
        var waitMs = 0
        while (root.childCount == 0 && waitMs < 2000) {
            try { Thread.sleep(300) } catch (e: InterruptedException) { }
            waitMs += 300
            root = rootInActiveWindow ?: run { cleanupAndFail("No active window"); return }
        }
        android.util.Log.d("WEARobotAccessibilityService", "clickByAnyLabel: tree ready after ${waitMs}ms wait")

        var discoveredLabels = mutableListOf<String>()

        for (pass in 0..3) {
            discoveredLabels = mutableListOf()
            collectAllLabels(root, discoveredLabels)
            android.util.Log.d("WEARobotAccessibilityService", "clickByAnyLabel pass $pass: ${labels.size} labels, ${discoveredLabels.size} discovered")
            if (discoveredLabels.isNotEmpty()) {
                android.util.Log.d("WEARobotAccessibilityService", "Discovered: $discoveredLabels")
            }

            for (label in labels) {
                val node = findNodeByText(root, label.trim()) ?: continue
                android.util.Log.d("WEARobotAccessibilityService", "Found '$label' on pass $pass")
                windowDepth++
                clickNode(node)
                return
            }

            if (pass < 3) {
                android.util.Log.d("WEARobotAccessibilityService", "clickByAnyLabel: not found on pass $pass, scrolling...")
                val scrolled = root.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD) ||
                    (findScrollableNode(root)?.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD) == true)
                if (!scrolled) {
                    android.util.Log.w("WEARobotAccessibilityService", "clickByAnyLabel: cannot scroll, stopping")
                    break
                }
                try { Thread.sleep(600) } catch (e: InterruptedException) { }
                root = rootInActiveWindow ?: break
            }
        }

        val errorMsg = "None of $labels found on screen (${discoveredLabels.size} labels). Discovered: $discoveredLabels"
        android.util.Log.e("WEARobotAccessibilityService", errorMsg)
        cleanupAndFail(errorMsg)
    }

    private fun toggleByAnyLabel(labels: List<String>, targetState: Boolean) {
        var root = rootInActiveWindow ?: return
        var discoveredLabels = mutableListOf<String>()

        for (pass in 0..2) {
            discoveredLabels = mutableListOf()
            collectAllLabels(root, discoveredLabels)
            android.util.Log.d("WEARobotAccessibilityService", "toggleByAnyLabel pass $pass: ${labels.size} labels, ${discoveredLabels.size} discovered")
            if (discoveredLabels.isNotEmpty()) {
                android.util.Log.d("WEARobotAccessibilityService", "All discovered labels: $discoveredLabels")
            }

            for (label in labels) {
                val node = findNodeByText(root, label.trim()) ?: continue
                android.util.Log.d("WEARobotAccessibilityService", "Found match for label: '$label' on pass $pass")

                var switchAncestor = findToggleAncestor(node)
                if (switchAncestor == null) switchAncestor = findToggleSibling(node)
                if (switchAncestor == null && node.className?.toString()?.contains("Switch") == true) {
                    switchAncestor = node
                }

                if (switchAncestor != null) {
                    android.util.Log.d("WEARobotAccessibilityService", "Found toggle, clicking for targetState=$targetState")
                    clickNode(switchAncestor)
                    try { Thread.sleep(300) } catch (e: InterruptedException) { }
                    if (pendingSteps.isNotEmpty()) executeNextStep()
                    else {
                        state = RobotState.IDLE
                        WEARobotAccessibilityService.cancelStateTimeout()
                        onStepResult?.invoke(true, "Toggled successfully")
                    }
                    return
                }

                val desc = node.contentDescription?.toString() ?: ""
                val isOn = desc.contains(",On,", ignoreCase = true)
                val isOff = desc.contains(",Off,", ignoreCase = true)
                android.util.Log.d("WEARobotAccessibilityService", "QS tile check: desc='$desc' isOn=$isOn isOff=$isOff")

                if (isOn || isOff) {
                    if ((isOn && !targetState) || (isOff && targetState)) {
                        android.util.Log.d("WEARobotAccessibilityService", "Toggling QS tile: ${if (isOn) "ON" else "OFF"} → ${if (targetState) "ON" else "OFF"}")
                        clickNode(node)
                        try { Thread.sleep(200) } catch (e: InterruptedException) { }
                    } else {
                        android.util.Log.d("WEARobotAccessibilityService", "QS tile already in correct state")
                    }
                    if (pendingSteps.isNotEmpty()) executeNextStep()
                    else {
                        state = RobotState.IDLE
                        WEARobotAccessibilityService.cancelStateTimeout()
                        onStepResult?.invoke(true, "Toggled successfully")
                    }
                    return
                }
            }

            if (pass < 2) {
                android.util.Log.d("WEARobotAccessibilityService", "toggleByAnyLabel: not found on pass $pass, scrolling...")
                val scrolled = root.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD) ||
                    (findScrollableNode(root)?.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD) == true)
                if (!scrolled) {
                    android.util.Log.w("WEARobotAccessibilityService", "toggleByAnyLabel: cannot scroll")
                    break
                }
                try { Thread.sleep(600) } catch (e: InterruptedException) { }
                root = rootInActiveWindow ?: break
            }
        }

        val errorMsg = "Toggle not found for: $labels. Discovered on screen: $discoveredLabels"
        android.util.Log.e("WEARobotAccessibilityService", errorMsg)
        cleanupAndFail(errorMsg)
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
            cleanupAndFail("No active window for scrolling")
            return
        }

        // Try to scroll the root window first
        if (root.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)) {
            android.util.Log.d("WEARobotAccessibilityService", "Scrolled root window successfully")
            // Schedule next step after scroll animation completes
            serviceScope.launch {
                delay(800) // Wait for scroll to settle
                executeNextStep()
            }
            return
        }

        // If root scroll failed, search for scrollable children (RecyclerView, ListView, etc.)
        val scrollableChild = findScrollableNode(root)
        if (scrollableChild != null && scrollableChild.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)) {
            android.util.Log.d("WEARobotAccessibilityService", "Scrolled child container successfully: ${scrollableChild.className}")
            // Schedule next step after scroll animation completes
            serviceScope.launch {
                delay(800) // Wait for scroll to settle
                executeNextStep()
            }
            return
        }

        // Scroll failed completely
        android.util.Log.w("WEARobotAccessibilityService", "Could not scroll: no scrollable container found")
        cleanupAndFail("Could not scroll")
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

    /** Fail and cleanup: press Back [windowDepth] times to close open Settings screens */
    private fun cleanupAndFail(reason: String) {
        val depth = windowDepth
        windowDepth = 0
        state = RobotState.IDLE
        WEARobotAccessibilityService.cancelStateTimeout()
        android.util.Log.e(
            "WEARobotAccessibilityService",
            "⚠ CLEANUP FAIL: closing $depth screen(s). Reason: $reason"
        )
        if (depth > 0) {
            serviceScope.launch {
                repeat(depth) { i ->
                    android.util.Log.d(
                        "WEARobotAccessibilityService",
                        "Cleanup back-press ${i + 1}/$depth"
                    )
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    delay(400)
                }
                onStepResult?.invoke(false, "FAILED [$depth screen(s) closed]: $reason")
            }
        } else {
            onStepResult?.invoke(false, reason)
        }
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

    /** Find a scrollable container (ListView, ScrollView, etc.) in the tree */
    private fun findScrollableNode(root: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(root)
        while (queue.isNotEmpty()) {
            val node = queue.removeFirst()
            if (node.isScrollable) return node
            for (i in 0 until node.childCount) {
                queue.addLast(node.getChild(i) ?: continue)
            }
        }
        return null
    }

    override fun onInterrupt() {
        state = RobotState.IDLE
        serviceScope.cancel()
    }
}
