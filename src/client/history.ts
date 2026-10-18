import type { PdfDocument } from "../shared/types.js";

const MAX = 60;

export type HistoryEntry = {
  label: string;
  at: number;
  snapshot: string;
};

export class HistoryStack {
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private lastPushed = "";
  private lastLabel = "Open";

  reset(doc: PdfDocument) {
    this.past = [];
    this.future = [];
    this.lastPushed = JSON.stringify(doc);
    this.lastLabel = "Open";
  }

  push(doc: PdfDocument, snapshot?: string, label = "Edit") {
    const next = snapshot ?? JSON.stringify(doc);
    if (next === this.lastPushed) return;
    this.past.push({
      label: this.lastLabel,
      at: Date.now(),
      snapshot: this.lastPushed,
    });
    if (this.past.length > MAX) this.past.shift();
    this.future = [];
    this.lastPushed = next;
    this.lastLabel = label;
  }

  undo(current: PdfDocument): PdfDocument | null {
    if (!this.past.length) return null;
    this.future.push({
      label: this.lastLabel,
      at: Date.now(),
      snapshot: JSON.stringify(current),
    });
    const prev = this.past.pop()!;
    this.lastPushed = prev.snapshot;
    this.lastLabel = prev.label;
    return JSON.parse(prev.snapshot) as PdfDocument;
  }

  redo(current: PdfDocument): PdfDocument | null {
    if (!this.future.length) return null;
    this.past.push({
      label: this.lastLabel,
      at: Date.now(),
      snapshot: JSON.stringify(current),
    });
    const next = this.future.pop()!;
    this.lastPushed = next.snapshot;
    this.lastLabel = next.label;
    return JSON.parse(next.snapshot) as PdfDocument;
  }

  /** Newest-first list of undoable states. `pastIndex` indexes into the past array. */
  list(): { label: string; at: number; pastIndex: number }[] {
    return this.past
      .map((e, pastIndex) => ({ label: e.label, at: e.at, pastIndex }))
      .reverse();
  }

  /** Restore a past snapshot; newer states move to the redo stack. */
  jumpToPastIndex(current: PdfDocument, pastIndex: number): PdfDocument | null {
    if (pastIndex < 0 || pastIndex >= this.past.length) return null;
    const removed = this.past.splice(pastIndex);
    const target = removed[0];
    const newer = removed.slice(1);
    this.future.unshift(
      ...newer.reverse(),
      {
        label: this.lastLabel,
        at: Date.now(),
        snapshot: JSON.stringify(current),
      },
    );
    this.lastPushed = target.snapshot;
    this.lastLabel = target.label;
    return JSON.parse(target.snapshot) as PdfDocument;
  }

  get canUndo() {
    return this.past.length > 0;
  }

  get canRedo() {
    return this.future.length > 0;
  }
}
