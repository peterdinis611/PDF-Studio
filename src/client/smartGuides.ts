import type { PdfElement } from "../shared/types.js";

export interface SmartGuide {
  axis: "x" | "y";
  position: number;
}

const TOLERANCE = 4;

export function computeSmartGuides(
  moving: { x: number; y: number; width: number; height: number },
  siblings: PdfElement[],
  pageWidth: number,
  pageHeight: number,
  excludeIds: Set<string>,
): { x: number; y: number; guides: SmartGuide[] } {
  const targetsX: number[] = [0, pageWidth / 2, pageWidth];
  const targetsY: number[] = [0, pageHeight / 2, pageHeight];

  for (const el of siblings) {
    if (excludeIds.has(el.id)) continue;
    targetsX.push(el.x, el.x + el.width / 2, el.x + el.width);
    targetsY.push(el.y, el.y + el.height / 2, el.y + el.height);
  }

  const edgesX = [moving.x, moving.x + moving.width / 2, moving.x + moving.width];
  const edgesY = [moving.y, moving.y + moving.height / 2, moving.y + moving.height];

  let bestDx = 0;
  let bestDy = 0;
  let bestAbsDx = TOLERANCE + 1;
  let bestAbsDy = TOLERANCE + 1;
  let guideX: number | null = null;
  let guideY: number | null = null;

  for (const edge of edgesX) {
    for (const t of targetsX) {
      const d = t - edge;
      const ad = Math.abs(d);
      if (ad < bestAbsDx) {
        bestAbsDx = ad;
        bestDx = d;
        guideX = t;
      }
    }
  }

  for (const edge of edgesY) {
    for (const t of targetsY) {
      const d = t - edge;
      const ad = Math.abs(d);
      if (ad < bestAbsDy) {
        bestAbsDy = ad;
        bestDy = d;
        guideY = t;
      }
    }
  }

  const guides: SmartGuide[] = [];
  let x = moving.x;
  let y = moving.y;
  if (bestAbsDx <= TOLERANCE && guideX !== null) {
    x += bestDx;
    guides.push({ axis: "x", position: guideX });
  }
  if (bestAbsDy <= TOLERANCE && guideY !== null) {
    y += bestDy;
    guides.push({ axis: "y", position: guideY });
  }

  return { x, y, guides };
}
