/** Represents a tracked UI element with optional location and attributes */
export interface TrackedElement {
  text?: string;
  contentDesc?: string;
  resourceId?: string;
  className?: string;
  bounds?: [number, number, number, number]; // [left, top, right, bottom]
}

/** Type of interaction recorded for an element */
export type InteractionAction = 'click' | 'toggle' | 'scroll' | 'input';

/** Single recorded interaction with an element and its state change */
export interface ElementInteraction {
  element: TrackedElement;
  action: InteractionAction;
  before?: unknown;   // state before (e.g. false for a toggle off→on)
  after?: unknown;    // state after  (e.g. true)
  timestamp: number;  // ms since epoch
}

/** Named recording session containing ordered list of interactions */
export interface TrackingSession {
  id: string;
  name: string;
  steps: ElementInteraction[];
  createdAt: string; // ISO timestamp
}
