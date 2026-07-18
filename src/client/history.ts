import type { PdfDocument } from "../shared/types.js";

const MAX = 60;

export class HistoryStack {
  private past: string[] = [];
  private future: string[] = [];
  private lastPushed = "";

  reset(doc: PdfDocument) {
    this.past = [];
    this.future = [];
    this.lastPushed = JSON.stringify(doc);
  }

  push(doc: PdfDocument) {
    const snapshot = JSON.stringify(doc);
    if (snapshot === this.lastPushed) return;
    this.past.push(this.lastPushed);
    if (this.past.length > MAX) this.past.shift();
    this.future = [];
    this.lastPushed = snapshot;
  }

  undo(current: PdfDocument): PdfDocument | null {
    if (!this.past.length) return null;
    this.future.push(JSON.stringify(current));
    const prev = this.past.pop()!;
    this.lastPushed = prev;
    return JSON.parse(prev) as PdfDocument;
  }

  redo(current: PdfDocument): PdfDocument | null {
    if (!this.future.length) return null;
    this.past.push(JSON.stringify(current));
    const next = this.future.pop()!;
    this.lastPushed = next;
    return JSON.parse(next) as PdfDocument;
  }

  get canUndo() {
    return this.past.length > 0;
  }

  get canRedo() {
    return this.future.length > 0;
  }
}
