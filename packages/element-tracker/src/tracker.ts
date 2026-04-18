import type { TrackedElement, ElementInteraction, InteractionAction, TrackingSession } from './types';

/** Tracks UI element selections and state changes for macro recording/playback */
export class ElementTracker {
  private steps: ElementInteraction[] = [];
  private recording = false;

  /** Start a new recording session, clearing previous steps */
  startRecording(): void {
    this.steps = [];
    this.recording = true;
  }

  /** Record a single element interaction (only if actively recording) */
  record(
    element: TrackedElement,
    action: InteractionAction,
    before?: unknown,
    after?: unknown,
  ): void {
    if (!this.recording) return;
    this.steps.push({ element, action, before, after, timestamp: Date.now() });
  }

  /** Stop recording and return the captured steps */
  stopRecording(): ElementInteraction[] {
    this.recording = false;
    return [...this.steps];
  }

  /** Check if currently recording */
  isRecording(): boolean {
    return this.recording;
  }

  /** Build a TrackingSession from a name and steps */
  buildSession(name: string, steps: ElementInteraction[]): TrackingSession {
    return {
      id: crypto.randomUUID(),
      name,
      steps,
      createdAt: new Date().toISOString(),
    };
  }

  /** Serialize a session to JSON string */
  serialize(session: TrackingSession): string {
    return JSON.stringify(session);
  }

  /** Deserialize a JSON string to a TrackingSession */
  deserialize(json: string): TrackingSession {
    return JSON.parse(json) as TrackingSession;
  }
}
