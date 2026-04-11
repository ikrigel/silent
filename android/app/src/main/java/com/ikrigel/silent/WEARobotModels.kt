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
    // Samsung uses commas in accessibility labels instead of spaces/ampersands
    private val safetyLabels  = listOf(
        "Safety & emergency", "Safety and emergency", "Emergency alerts", "Safety",
        "Safety,&,emergency", "Safety,and,emergency",  // Samsung comma format
        // Newline variants (some devices split text across lines)
        "Safety\n&\nemergency", "Safety\nand\nemergency",
        "התרעות"  // Hebrew: Alerts/Warnings section
    )
    private val weaLabels     = listOf(
        "Wireless Emergency Alerts", "Emergency alert settings", "Alerts",
        "Wireless,Emergency,Alerts", "Emergency,alert,settings",  // Samsung comma format
        "הצעות התרעות"  // Hebrew: Alerts/Notifications offers
    )
    private val extremeLabels = listOf(
        "Extreme threats", "Extreme alerts", "Extreme alert", "Extreme",
        "Extreme,threats", "Extreme,alerts",  // Samsung comma format
        "איומים קיצוניים", "איומים קיצוניים אחרים"  // Hebrew: Extreme threats (regular and "Other")
    )

    val SILENCE_WEA = RobotRecording(
        id        = "builtin_silence",
        name      = "Silence WEA (Extreme Alerts)",
        isBuiltIn = true,
        createdAt = "built-in",
        steps     = listOf(
            RobotStep("open_settings",  ""),
            RobotStep("scroll_down",    ""),  // Scroll to find Safety & Emergency section
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
            RobotStep("scroll_down",    ""),  // Scroll to find Safety & Emergency section
            RobotStep("click_any",      safetyLabels.joinToString("|")),
            RobotStep("click_any",      weaLabels.joinToString("|")),
            RobotStep("toggle_on_any",  extremeLabels.joinToString("|")),
        ),
    )

    // Airplane mode labels across different manufacturers and languages
    private val airplaneLabels = listOf(
        // English: Stock Android, Samsung, OnePlus, Pixel
        "Airplane mode", "Airplane", "Flight mode", "Plane mode",
        // Samsung uses commas in accessibility labels instead of spaces
        "Airplane,mode",
        // Newline variants (some devices split text across lines)
        "Airplane\nmode", "Airplane\nMode",
        // Hebrew
        "טיסה", "מצב טיסה",
        // Arabic
        "وضع الطائرة",
        // Russian (Huawei, some Xiaomi)
        "Режим полёта",
        // French
        "Mode avion",
        // German
        "Flugzeugmodus",
        // Spanish
        "Modo avión", "Modo avion",
        // Chinese (Xiaomi/MIUI)
        "飞行模式",
        // Korean (Samsung KR firmware)
        "비행기 모드", "비행기"
    )

    val AIRPLANE_ON = RobotRecording(
        id        = "builtin_airplane_on",
        name      = "Enable Airplane Mode",
        isBuiltIn = true,
        createdAt = "built-in",
        steps     = listOf(
            RobotStep("open_settings", ""),
            RobotStep("click_any",     "Connections|Connection|Network"),  // Find Connections section
            RobotStep("toggle_on_any", airplaneLabels.joinToString("|")),
        ),
    )

    val AIRPLANE_OFF = RobotRecording(
        id        = "builtin_airplane_off",
        name      = "Disable Airplane Mode",
        isBuiltIn = true,
        createdAt = "built-in",
        steps     = listOf(
            RobotStep("open_settings", ""),
            RobotStep("click_any",     "Connections|Connection|Network"),  // Find Connections section
            RobotStep("toggle_off_any", airplaneLabels.joinToString("|")),
        ),
    )

    val ALL = listOf(SILENCE_WEA, RESTORE_WEA, AIRPLANE_ON, AIRPLANE_OFF)
}
