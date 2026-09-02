import {
  audit,
  clearAuditEvents,
  listAuditEvents,
  shortSessionId,
} from "../audit.js";

describe("audit ring buffer", () => {
  beforeEach(() => clearAuditEvents());

  describe("positive", () => {
    it("records events newest-first with full session and counts", () => {
      const sid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      audit("info", "pdf.export", "Exported invoice", {
        sessionId: sid,
        req: { method: "POST", path: "/api/export", status: 200, ip: "127.0.0.1" },
        meta: { pages: 2 },
      });
      audit("warn", "image.upload.fail", "Too large");

      const { events, total, capacity, counts } = listAuditEvents();
      expect(capacity).toBeGreaterThan(0);
      expect(total).toBe(2);
      expect(counts).toEqual({ info: 1, warn: 1, error: 0, all: 2 });
      expect(events[0].action).toBe("image.upload.fail");
      expect(events[1].action).toBe("pdf.export");
      expect(events[1].sessionId).toBe(sid);
      expect(shortSessionId(events[1].sessionId)).toBe("a0eebc99…");
      expect(events[1].req?.method).toBe("POST");
      expect(events[1].meta).toEqual({ pages: 2 });
    });

    it("filters by level, action, and search across request fields", () => {
      audit("info", "pdf.export", "Exported A");
      audit("error", "pdf.export.fail", "Boom", {
        req: { path: "/api/export", status: 500 },
      });
      audit("info", "image.upload", "photo.png", {
        req: { ip: "10.0.0.9" },
      });

      expect(listAuditEvents({ level: "error" }).events).toHaveLength(1);
      expect(listAuditEvents({ action: "image" }).events[0].action).toBe("image.upload");
      expect(listAuditEvents({ q: "boom" }).events[0].message).toBe("Boom");
      expect(listAuditEvents({ q: "10.0.0.9" }).events[0].action).toBe("image.upload");
    });
  });

  describe("negative", () => {
    it("returns an empty list when nothing matches", () => {
      audit("info", "server.start", "up");
      expect(listAuditEvents({ q: "zzzz-no-match" }).events).toEqual([]);
      expect(listAuditEvents({ level: "error" }).total).toBe(0);
    });
  });
});
