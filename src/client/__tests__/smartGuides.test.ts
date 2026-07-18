import { computeSmartGuides } from "../smartGuides.js";
import { createRect } from "../factories.js";

describe("computeSmartGuides", () => {
  describe("positive", () => {
    it("snaps to the page center within tolerance", () => {
      const pageW = 600;
      const pageH = 800;
      const moving = { x: 298, y: 100, width: 100, height: 40 };
      const result = computeSmartGuides(moving, [], pageW, pageH, new Set());
      expect(result.guides.some((g) => g.axis === "x" && g.position === pageW / 2)).toBe(true);
      expect(result.x).toBe(300);
    });

    it("snaps to a sibling edge", () => {
      const sibling = createRect(200, 200, { width: 100, height: 50 });
      const moving = { x: 198, y: 300, width: 80, height: 40 };
      const result = computeSmartGuides(moving, [sibling], 600, 800, new Set());
      expect(result.guides.some((g) => g.axis === "x" && g.position === 200)).toBe(true);
    });
  });

  describe("negative", () => {
    it("does not snap when distance is outside tolerance", () => {
      const moving = { x: 50, y: 50, width: 40, height: 40 };
      const result = computeSmartGuides(moving, [], 600, 800, new Set());
      // Far from 0 / 300 / 600 edges for all moving edges → no guides
      expect(result.guides).toEqual([]);
      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });

    it("ignores excluded siblings", () => {
      const sibling = createRect(200, 200, { width: 100, height: 50 });
      const moving = { x: 198, y: 300, width: 80, height: 40 };
      const result = computeSmartGuides(moving, [sibling], 600, 800, new Set([sibling.id]));
      expect(result.guides.every((g) => g.position !== 200)).toBe(true);
    });
  });
});
