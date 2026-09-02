import type { GuideLine, PdfElement, TableElement } from "../shared/types.js";
import { uid } from "./factories.js";

export const MARGIN_PRESETS = {
  none: 0,
  narrow: 24,
  normal: 40,
  wide: 56,
} as const;

export type MarginPreset = keyof typeof MARGIN_PRESETS;

/** Evenly space unlocked elements between first and last along an axis. */
export function distributeElements(
  els: PdfElement[],
  axis: "horizontal" | "vertical",
): void {
  if (els.length < 3) return;
  const sorted = [...els].sort((a, b) => (axis === "horizontal" ? a.x - b.x : a.y - b.y));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (axis === "horizontal") {
    const span = last.x + last.width - first.x;
    const totalW = sorted.reduce((s, e) => s + e.width, 0);
    const gap = (span - totalW) / (sorted.length - 1);
    let cursor = first.x;
    for (const el of sorted) {
      el.x = Math.round(cursor);
      cursor += el.width + gap;
    }
  } else {
    const span = last.y + last.height - first.y;
    const totalH = sorted.reduce((s, e) => s + e.height, 0);
    const gap = (span - totalH) / (sorted.length - 1);
    let cursor = first.y;
    for (const el of sorted) {
      el.y = Math.round(cursor);
      cursor += el.height + gap;
    }
  }
}

export function resizeTable(table: TableElement, rows: number, cols: number): void {
  const r = Math.max(1, Math.min(24, Math.round(rows)));
  const c = Math.max(1, Math.min(12, Math.round(cols)));
  const next: string[] = [];
  for (let i = 0; i < r * c; i++) {
    const oldR = Math.floor(i / c);
    const oldC = i % c;
    if (oldR < table.rows && oldC < table.cols) {
      next.push(table.cells[oldR * table.cols + oldC] ?? "");
    } else {
      next.push("");
    }
  }
  table.rows = r;
  table.cols = c;
  table.cells = next;
}

export function insertTableRow(table: TableElement, afterIndex: number): void {
  const at = Math.max(-1, Math.min(table.rows - 1, afterIndex));
  const insertAt = (at + 1) * table.cols;
  const blank = Array.from({ length: table.cols }, () => "");
  table.cells.splice(insertAt, 0, ...blank);
  table.rows += 1;
}

export function insertTableCol(table: TableElement, afterIndex: number): void {
  const at = Math.max(-1, Math.min(table.cols - 1, afterIndex));
  const next: string[] = [];
  for (let r = 0; r < table.rows; r++) {
    for (let c = 0; c < table.cols; c++) {
      next.push(table.cells[r * table.cols + c] ?? "");
      if (c === at) next.push("");
    }
  }
  table.cols += 1;
  table.cells = next;
}

export function deleteTableRow(table: TableElement, rowIndex: number): void {
  if (table.rows <= 1) return;
  const r = Math.max(0, Math.min(table.rows - 1, rowIndex));
  table.cells.splice(r * table.cols, table.cols);
  table.rows -= 1;
}

export function deleteTableCol(table: TableElement, colIndex: number): void {
  if (table.cols <= 1) return;
  const c = Math.max(0, Math.min(table.cols - 1, colIndex));
  const next: string[] = [];
  for (let r = 0; r < table.rows; r++) {
    for (let col = 0; col < table.cols; col++) {
      if (col === c) continue;
      next.push(table.cells[r * table.cols + col] ?? "");
    }
  }
  table.cols -= 1;
  table.cells = next;
}

export function marginGuideLines(
  width: number,
  height: number,
  margin: number,
): GuideLine[] {
  if (margin <= 0) return [];
  return [
    { id: uid(), axis: "x", position: margin, name: "Margin L" },
    { id: uid(), axis: "x", position: width - margin, name: "Margin R" },
    { id: uid(), axis: "y", position: margin, name: "Margin T" },
    { id: uid(), axis: "y", position: height - margin, name: "Margin B" },
  ];
}

export const SHORTCUT_GROUPS: { title: string; items: { keys: string; action: string }[] }[] = [
  {
    title: "Tools",
    items: [
      { keys: "V", action: "Select" },
      { keys: "T", action: "Text" },
      { keys: "R", action: "Rectangle" },
      { keys: "O", action: "Ellipse" },
      { keys: "L", action: "Line" },
      { keys: "/", action: "Search library" },
      { keys: "?", action: "This cheat sheet" },
      { keys: "Tour", action: "Product walkthrough" },
    ],
  },
  {
    title: "Edit",
    items: [
      { keys: "⌘Z", action: "Undo" },
      { keys: "⌘⇧Z / ⌘Y", action: "Redo" },
      { keys: "⌘C / X / V", action: "Copy / Cut / Paste" },
      { keys: "⌘⇧V", action: "Paste in place" },
      { keys: "⌘D", action: "Duplicate" },
      { keys: "⌫", action: "Delete" },
      { keys: "Arrows", action: "Nudge · Shift = fine" },
    ],
  },
  {
    title: "Arrange",
    items: [
      { keys: "⌘G", action: "Group" },
      { keys: "⌘⇧G", action: "Ungroup" },
      { keys: "Shift+click", action: "Multi-select" },
    ],
  },
  {
    title: "Document",
    items: [
      { keys: "⌘S", action: "Save now" },
      { keys: "⌘E", action: "Export" },
      { keys: "⌘F", action: "Find & replace" },
      { keys: "Esc", action: "Clear / exit modes" },
      { keys: "Space+drag", action: "Pan canvas" },
    ],
  },
];
