import { iconSvg, ICON_PATHS } from "../icons.js";
import type { IconKind } from "../../shared/types.js";

describe("ICON_PATHS", () => {
  it("covers every IconKind", () => {
    const kinds = Object.keys(ICON_PATHS) as IconKind[];
    expect(kinds).toEqual(
      expect.arrayContaining([
        "star",
        "calendar",
        "link",
        "globe",
        "file",
        "clock",
        "image",
      ]),
    );
    for (const kind of kinds) {
      expect(ICON_PATHS[kind].length).toBeGreaterThan(5);
    }
  });
});

describe("iconSvg", () => {
  describe("positive", () => {
    it("returns filled SVG for solid icons", () => {
      const svg = iconSvg("star", "#0f766e", 24);
      expect(svg).toContain("<svg");
      expect(svg).toContain('fill="#0f766e"');
      expect(svg).toContain('width="24"');
    });

    it("returns stroked SVG for outline icons", () => {
      const svg = iconSvg("calendar", "#14b8a6", 20);
      expect(svg).toContain('stroke="#14b8a6"');
      expect(svg).toContain('fill="none"');
    });
  });

  describe("negative", () => {
    it("falls back to star path for unknown icons", () => {
      const svg = iconSvg("not-real" as IconKind, "#000");
      expect(svg).toContain(ICON_PATHS.star);
    });
  });
});
