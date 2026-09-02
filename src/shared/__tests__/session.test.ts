import { isValidSessionId, SESSION_COOKIE, SESSION_HEADER } from "../session.js";

describe("isValidSessionId", () => {
  describe("positive", () => {
    it("accepts a valid UUID v4", () => {
      expect(isValidSessionId("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")).toBe(true);
    });

    it("accepts uppercase UUID", () => {
      expect(isValidSessionId("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11")).toBe(true);
    });
  });

  describe("negative", () => {
    it.each([
      ["null", null],
      ["undefined", undefined],
      ["number", 123],
      ["empty string", ""],
      ["random text", "not-a-uuid"],
      ["too short", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1"],
      ["invalid hex", "zzzzzzzz-9c0b-4ef8-bb6d-6bb9bd380a11"],
      ["uuid without dashes", "a0eebc999c0b4ef8bb6d6bb9bd380a11"],
    ])("rejects %s", (_label, value) => {
      expect(isValidSessionId(value)).toBe(false);
    });
  });
});

describe("session constants", () => {
  describe("positive", () => {
    it("exposes expected cookie and header names", () => {
      expect(SESSION_COOKIE).toBe("pdf-studio-sid");
      expect(SESSION_HEADER).toBe("X-Pdf-Studio-Session");
    });
  });
});
