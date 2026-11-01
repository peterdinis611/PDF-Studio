import {
  formatDateline,
  formatDateTime,
  formatEditionNumber,
  formatIsoDay,
  formatIssued,
  formatLongDate,
  formatRelativeShort,
  formatTime,
} from "../dates.js";

describe("dates (date-fns)", () => {
  const noon = new Date("2026-10-17T12:00:00.000Z");

  it("formats dateline / issued / long date", () => {
    expect(formatDateline(noon)).toMatch(/October 2026/);
    expect(formatIssued(noon)).toBe("17 Oct 2026");
    expect(formatLongDate(noon)).toBe("17 October 2026");
  });

  it("formats ISO day and edition number", () => {
    expect(formatIsoDay(noon)).toBe("2026-10-17");
    expect(formatEditionNumber(noon)).toMatch(/^\d{3}$/);
  });

  it("formats time and datetime", () => {
    expect(formatTime(noon)).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(formatDateTime(noon)).toMatch(/Oct 17/);
  });

  it("formats relative short ages", () => {
    const now = new Date("2026-10-17T12:00:00.000Z");
    expect(formatRelativeShort(new Date("2026-10-17T11:59:40.000Z"), now)).toBe("20s");
    expect(formatRelativeShort(new Date("2026-10-17T11:50:00.000Z"), now)).toBe("10m");
    expect(formatRelativeShort(new Date("2026-10-17T09:00:00.000Z"), now)).toBe("3h");
    expect(formatRelativeShort(new Date("2026-10-15T12:00:00.000Z"), now)).toBe("2d");
  });

  it("tolerates invalid input", () => {
    expect(formatLongDate("not-a-date")).toBe("");
    expect(formatRelativeShort("bad", noon)).toBe("bad");
  });
});
