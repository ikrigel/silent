# ADB UIAutomator Accessibility Tree

## What is it?

When you run `adb shell uiautomator dump /sdcard/window_dump.xml`, you get a **UI hierarchy** — an XML snapshot of all currently visible Android views/widgets and their properties. This is the same tree that:
- Accessibility services (like Silent Robot) read to find clickable elements
- Screen readers use to describe the interface
- Automation frameworks use to interact with the app

Each `<node>` in the XML represents **one Android View** (a button, text field, switch, container, etc.).

---

## Structure

### Hierarchy
```xml
<hierarchy rotation="0">
  <node index="0" text="" class="android.widget.FrameLayout" package="...">
    <node index="0" text="Settings" class="android.widget.TextView">
      <!-- nested views... -->
    </node>
  </node>
</hierarchy>
```

Nesting follows the Android view tree: parent containers hold child views.

### Key Attributes

| Attribute | Meaning | Example |
|-----------|---------|---------|
| `text` | Visible text label on the element | `text="Airplane mode"` |
| `content-desc` | Accessibility description (for screen readers, icons without text) | `content-desc="Power settings, double tap to enable"` |
| `resource-id` | Android ID (unique identifier in the app/system) | `resource-id="com.android.settings:id/title_frame"` |
| `class` | Android widget type | `class="android.widget.Switch"`, `class="android.widget.TextView"` |
| `package` | Which app/system component owns this view | `package="com.android.settings"`, `package="com.android.systemui"` |
| `bounds` | Pixel coordinates `[left,top][right,bottom]` on screen | `bounds="[0,955][1080,1147]"` |
| `clickable` | Can this element be tapped? | `clickable="true"` or `clickable="false"` |
| `checkable` | Can this element be checked (checkbox, switch)? | `checkable="true"` |
| `checked` | Current state (for switches, checkboxes) | `checked="false"` (off) or `checked="true"` (on) |
| `scrollable` | Can this container scroll? | `scrollable="true"` or `scrollable="false"` |
| `enabled` | Is this element interactive? | `enabled="true"` (greyed out elements = false) |
| `focused` | Has input focus? | `focused="false"` |

---

## Example: Settings Preference Row

```xml
<node index="4" text="" class="android.widget.LinearLayout" package="com.android.settings"
      clickable="true" bounds="[0,955][1080,1147]">
  
  <!-- Container: left side (title + summary) -->
  <node index="0" text="" class="android.widget.RelativeLayout" package="com.android.settings"
        clickable="false" bounds="[63,955][888,1147]">
    
    <!-- Title frame with label -->
    <node index="0" text="" class="android.widget.RelativeLayout" package="com.android.settings"
          resource-id="com.android.settings:id/title_frame" bounds="[63,992][572,1058]">
      <node text="Ultra-wideband (UWB)" class="android.widget.TextView"
            resource-id="android:id/title" bounds="[63,992][572,1058]"/>
    </node>
    
    <!-- Summary/description -->
    <node text="Identify the precise location of nearby devices."
          class="android.widget.TextView"
          resource-id="android:id/summary" bounds="[63,1058][866,1110]"/>
  </node>
  
  <!-- Right side: toggle switch (sibling, not child of title frame!) -->
  <node index="1" text="" class="android.widget.LinearLayout" package="com.android.settings"
        resource-id="com.android.settings:id/widget_frame" bounds="[900,1000][1050,1080]">
    <node class="android.widget.Switch" checkable="true" checked="false"
          bounds="[920,1010][1040,1070]"/>
  </node>
</node>
```

**Key insight:** The toggle Switch is a **sibling** in `widget_frame`, not a child of the title. Silent Robot's `findToggleSibling()` method handles this pattern.

---

## How Silent Robot Uses the Tree

### 1. Finding elements by text (`findNodeByText`)
```kotlin
// Search: does any node.text or node.contentDescription contain "Airplane"?
fun findNodeByText(text: String): AccessibilityNodeInfo? {
  // Walk the tree DFS, case-insensitive contains match
  // Return first node where text or contentDesc matches
}
```

### 2. Collecting all labels (`collectAllLabels`)
```kotlin
// For debugging: what labels are on the current screen?
fun collectAllLabels(): List<String> {
  val labels = mutableListOf<String>()
  // Walk tree, collect every non-empty text and contentDesc
  // Used in ultraverbose logs to diagnose missing elements
}
```

### 3. Toggling switches (`toggleByAnyLabel`)
Three strategies in order:
1. **Walk up:** From the matched node, walk parent chain looking for an ancestor Switch/CheckBox
2. **Search siblings:** If a parent is found but it's not a Switch, search siblings (handles Samsung `widget_frame` pattern)
3. **Direct click:** If the matched node itself is a Switch, click it directly

---

## Extracting the Dump

### One-liner commands

**Capture from device:**
```bash
adb shell uiautomator dump /sdcard/window_dump.xml
```

**Pull to computer:**
```bash
adb pull /sdcard/window_dump.xml
```

**View it (macOS/Linux):**
```bash
cat window_dump.xml | less
```

**Or pretty-print with xmllint:**
```bash
xmllint --format window_dump.xml | less
```

**Search for a label (e.g. "Airplane"):**
```bash
grep -i "airplane" window_dump.xml
```

**Search for a resource ID:**
```bash
grep 'resource-id="com.android.settings:id/title"' window_dump.xml
```

**One combined command:**
```bash
adb shell uiautomator dump /sdcard/window_dump.xml && adb pull /sdcard/window_dump.xml && grep -i "airplane" window_dump.xml
```

---

## Device-Specific Variants

Different manufacturers and Android versions use different label text for the same UI element:

| Feature | English | Hebrew | Samsung |
|---------|---------|--------|---------|
| Airplane Mode | "Airplane mode" | "טיסה" / "מצב טיסה" | "Airplane,mode" (comma instead of space) |
| Wireless Emergency Alerts | "Wireless Emergency Alerts" | "התרעות חירום אלחוטיות" | Same labels + status variants |

Silent Robot maintains label lists in [WEARobotModels.kt:90+](android/app/src/main/java/com/ikrigel/silent/WEARobotModels.kt#L90) to handle these variants.

---

## Debugging Robot Automation Failures

If robot automation can't find an element:

1. **Capture the current screen:**
   ```bash
   adb shell uiautomator dump /sdcard/window_dump.xml
   adb pull /sdcard/window_dump.xml
   ```

2. **Search the dump for clues:**
   ```bash
   # Look for partial matches
   grep -i "wireless\|emergency\|alert" window_dump.xml
   
   # Look for Switch elements
   grep 'class="android.widget.Switch"' window_dump.xml
   ```

3. **Check ultraverbose logs:**
   ```bash
   adb logcat | grep -i "WEARobotAccessibilityService"
   ```

   Look for:
   - `Discovered labels:` — what text/contentDesc the robot found
   - `clickByAnyLabel:` — which of your predefined labels it tried to match
   - `Toggle not found` — the element exists but isn't a Switch in the expected position

4. **Report a new label variant:**
   - Go to Silent app → Help page
   - Include the dump output + logcat snippet + your device model
   - The label will be added in the next release

---

## Performance Notes

- **UIAutomator dump is snapshot-only** — it captures the tree at one moment in time. Dynamic UI (lists scrolling, animations) may cause elements to appear/disappear between dumps.
- **Silent Robot adds 600ms delay** after window changes to let the new screen settle before executing the next step.
- **DFS is slow on large trees** — but typical Settings screens have <100 nodes, so it's instant.

---

## Related Files

- [WEARobotAccessibilityService.kt](android/app/src/main/java/com/ikrigel/silent/WEARobotAccessibilityService.kt) — Tree walking logic
- [WEARobotModels.kt](android/app/src/main/java/com/ikrigel/silent/WEARobotModels.kt) — Label lists (Airplane, WEA, Connections, etc.)
- [AIRPLANE_MODE_LABEL_DISCOVERY.md](AIRPLANE_MODE_LABEL_DISCOVERY.md) — Example label discovery for one feature
- [ROBOT_AUTOMATION_DEBUGGING.md](ROBOT_AUTOMATION_DEBUGGING.md) — Full debugging guide
