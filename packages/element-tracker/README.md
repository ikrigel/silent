# silent-element-tracker

A TypeScript library for tracking UI element selections and state changes, enabling reliable macro recording and playback.

## Installation

```bash
npm install silent-element-tracker
```

## Usage

```typescript
import { ElementTracker, TrackedElement } from 'silent-element-tracker';

const tracker = new ElementTracker();

// Start recording
tracker.startRecording();

// Record an element interaction
const element: TrackedElement = {
  text: 'Airplane mode',
  contentDesc: 'Toggle airplane mode',
  resourceId: 'com.android.settings:id/airplane_toggle',
};

tracker.record(element, 'toggle', false, true); // toggle: false → true

// Stop recording and get steps
const steps = tracker.stopRecording();

// Build a session
const session = tracker.buildSession('My Macro', steps);

// Serialize/deserialize
const json = tracker.serialize(session);
const loaded = tracker.deserialize(json);
```

## Features

- **Element tracking** — Record which UI elements are interacted with
- **State change capture** — Track `before` and `after` state (useful for toggles, inputs)
- **Timestamping** — All interactions timestamped in milliseconds
- **Session management** — Group recordings into named sessions with unique IDs
- **Serialization** — Convert sessions to/from JSON for storage or transmission

## API

### `ElementTracker`

#### Methods

- `startRecording()` — Start a new recording session
- `record(element, action, before?, after?)` — Record an interaction
- `stopRecording()` — Stop recording and return steps
- `isRecording()` — Check if currently recording
- `buildSession(name, steps)` — Create a TrackingSession from steps
- `serialize(session)` — Convert session to JSON string
- `deserialize(json)` — Parse JSON string to TrackingSession

### Types

```typescript
interface TrackedElement {
  text?: string;           // visible text label
  contentDesc?: string;    // accessibility description
  resourceId?: string;     // unique Android ID
  className?: string;      // widget class (e.g. android.widget.Switch)
  bounds?: [number, number, number, number]; // [left, top, right, bottom]
}

type InteractionAction = 'click' | 'toggle' | 'scroll' | 'input';

interface ElementInteraction {
  element: TrackedElement;
  action: InteractionAction;
  before?: unknown;        // state before
  after?: unknown;         // state after
  timestamp: number;       // ms since epoch
}

interface TrackingSession {
  id: string;
  name: string;
  steps: ElementInteraction[];
  createdAt: string;       // ISO timestamp
}
```

## Use Case: Robot Automation

The Silent app uses `silent-element-tracker` to record user interactions with Android Settings for automation:

1. User enables "Record" mode
2. User taps elements in Settings (toggles, menu items, etc.)
3. Tracker captures `element` + `action` + state changes
4. Tracker stores session with unique ID
5. User clicks "Save Recording"
6. Later, user plays back the recording — robot automation re-executes the stored steps

This avoids brittle pixel-coordinate-based automation and enables reliable cross-device playback.

## License

MIT
