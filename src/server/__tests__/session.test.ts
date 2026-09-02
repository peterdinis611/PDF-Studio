import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ensureSessionDirs,
  pruneExpiredUploads,
  sessionPublicUrl,
  sessionUploadsDir,
  uploadsRoot,
} from "../session.js";

describe("sessionPublicUrl", () => {
  describe("positive", () => {
    it("builds file and font URLs under /uploads/sessions", () => {
      expect(sessionPublicUrl("abc", "img.png")).toBe("/uploads/sessions/abc/img.png");
      expect(sessionPublicUrl("abc", "f.ttf", "font")).toBe(
        "/uploads/sessions/abc/fonts/f.ttf",
      );
    });
  });
});

describe("ensureSessionDirs / pruneExpiredUploads", () => {
  const sid = "11111111-1111-4111-8111-111111111111";

  afterEach(() => {
    fs.rmSync(sessionUploadsDir(sid), { recursive: true, force: true });
  });

  describe("positive", () => {
    it("creates session upload directories under OS temp", () => {
      const dirs = ensureSessionDirs(sid);
      expect(dirs.uploads.startsWith(uploadsRoot)).toBe(true);
      expect(fs.existsSync(dirs.fonts)).toBe(true);
      expect(path.dirname(uploadsRoot)).toBe(os.tmpdir());
    });

    it("keeps fresh session directories when pruning", () => {
      ensureSessionDirs(sid);
      pruneExpiredUploads(24 * 60 * 60 * 1000);
      expect(fs.existsSync(sessionUploadsDir(sid))).toBe(true);
    });
  });

  describe("negative", () => {
    it("removes expired session directories", () => {
      ensureSessionDirs(sid);
      const dir = sessionUploadsDir(sid);
      const old = Date.now() - 48 * 60 * 60 * 1000;
      fs.utimesSync(dir, new Date(old), new Date(old));
      pruneExpiredUploads(24 * 60 * 60 * 1000);
      expect(fs.existsSync(dir)).toBe(false);
    });
  });
});
