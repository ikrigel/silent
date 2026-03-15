package com.ikrigel.silent

/**
 * Data models for the WEA Robot recording/playback system.
 *
 * RobotStep stores a SEMANTIC action (text-based, not coordinates) so recordings
 * work across different screen sizes and Android versions.
 */

/** A single step in a recorded UI automation sequence */
data class RobotStep(
    /** Action type: "open_settings" | "click" | "toggle_on" | "toggle_off" | "scroll_down" */
    val action: String,
    /** Primary text to search for on-screen (e.g. "Safety & Emergency") */
    val text: String,
    /** Fallback: content description of the element (accessibility label) */
    val description: String = "",
)

/** A complete recorded sequence of UI steps */
data class RobotRecording(
    val id: String,
    val name: String,
    val steps: List<RobotStep>,
    val createdAt: String,
    /** Built-in recordings cannot be deleted by the user */
    val isBuiltIn: Boolean = false,
)

/** Current state of the robot service */
enum class RobotState { IDLE, RECORDING, PLAYING }

/**
 * Pre-built silence sequences for major Android device families.
 * Text labels differ between manufacturers, so we provide multiple variants.
 * The service tries each variant in order until it finds a match.
 */
object BuiltInRecordings {
    // Labels used by different manufacturers for the WEA settings path
    private val safetyLabels  = listOf("Safety & emergency", "Safety and emergency", "Emergency alerts", "Safety")
    private val weaLabels     = listOf("Wireless Emergency Alerts", "Emergency alert settings", "Alerts")
    private val extremeLabels = listOf("Extreme threats", "Extreme alerts", "Extreme alert", "Extreme")

    val SILENCE_WEA = RobotRecording(
        id        = "builtin_silence",
        name      = "Silence WEA (Extreme Alerts)",
        isBuiltIn = true,
        createdAt = "built-in",
        steps     = listOf(
            RobotStep("open_settings",  ""),
            RobotStep("click_any",      safetyLabels.joinToString("|")),
            RobotStep("click_any",      weaLabels.joinToString("|")),
            RobotStep("toggle_off_any", extremeLabels.joinToString("|")),
        ),
    )

    val RESTORE_WEA = RobotRecording(
        id        = "builtin_restore",
        name      = "Re-enable WEA (Extreme Alerts)",
        isBuiltIn = true,
        createdAt = "built-in",
        steps     = listOf(
            RobotStep("open_settings",  ""),
            RobotStep("click_any",      safetyLabels.joinToString("|")),
            RobotStep("click_any",      weaLabels.joinToString("|")),
            RobotStep("toggle_on_any",  extremeLabels.joinToString("|")),
        ),
    )

    val AIRPLANE_ON = RobotRecording(
        id        = "builtin_airplane_on",
        name      = "Enable Airplane Mode",
        isBuiltIn = true,
        createdAt = "built-in",
        steps     = listOf(
            RobotStep("quick_settings", ""),
            RobotStep("click_any", "Airplane mode|Airplane|Flight mode|טיסה"),
        ),
    )

    val AIRPLANE_OFF = RobotRecording(
        id        = "builtin_airplane_off",
        name      = "Disable Airplane Mode",
        isBuiltIn = true,
        createdAt = "built-in",
        steps     = listOf(
            RobotStep("quick_settings", ""),
            RobotStep("click_any", "Airplane mode|Airplane|Flight mode|טיסה"),
        ),
    )

    val ALL = listOf(SILENCE_WEA, RESTORE_WEA, AIRPLANE_ON, AIRPLANE_OFF)
}
