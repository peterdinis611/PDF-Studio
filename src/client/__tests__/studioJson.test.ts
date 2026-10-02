/**
 * @jest-environment jsdom
 */
import {
  collectSessionAssetUrls,
  isDataUrl,
  isSessionUploadUrl,
  persistErrorMessage,
} from "../studioJson.js";
import { docNeedsPdfReattach } from "../pdfReattach.js";
import type { PdfDocument } from "../../shared/types.js";

describe("isSessionUploadUrl", () => {
  it("accepts session upload paths", () => {
    expect(isSessionUploadUrl("/uploads/sessions/abc/file.png")).toBe(true);
  });

  it("rejects data and external urls", () => {
    expect(isSessionUploadUrl("data:image/png;base64,xx")).toBe(false);
    expect(isSessionUploadUrl("https://cdn.example/a.png")).toBe(false);
    expect(isSessionUploadUrl(undefined)).toBe(false);
  });
});

describe("isDataUrl", () => {
  it("detects data urls", () => {
    expect(isDataUrl("data:image/png;base64,AAA")).toBe(true);
    expect(isDataUrl("/uploads/sessions/x/a.png")).toBe(false);
  });
});

describe("collectSessionAssetUrls", () => {
  it("walks pages, master, and watermark", () => {
    const doc = {
      pages: [
        {
          id: "p1",
          elements: [
            {
              id: "i1",
              type: "image",
              src: "/uploads/sessions/s/a.png",
              x: 0,
              y: 0,
              width: 10,
              height: 10,
              rotation: 0,
              opacity: 1,
              locked: false,
              name: "a",
            },
          ],
        },
      ],
      master: {
        header: [],
        footer: [
          {
            id: "s1",
            type: "signature",
            src: "/uploads/sessions/s/sig.png",
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            rotation: 0,
            opacity: 1,
            locked: false,
            name: "sig",
          },
        ],
      },
      watermark: {
        type: "image",
        src: "/uploads/sessions/s/wm.jpg",
        opacity: 0.1,
        rotation: 0,
      },
    } as unknown as PdfDocument;

    const urls = collectSessionAssetUrls(doc);
    expect(urls).toHaveLength(3);
    expect(urls).toContain("/uploads/sessions/s/a.png");
    expect(urls).toContain("/uploads/sessions/s/sig.png");
    expect(urls).toContain("/uploads/sessions/s/wm.jpg");
  });
});

describe("persistErrorMessage", () => {
  it("detects quota exceeded", () => {
    const err = new DOMException("quota", "QuotaExceededError");
    expect(persistErrorMessage(err)).toMatch(/Storage full/);
  });

  it("returns a generic message otherwise", () => {
    expect(persistErrorMessage(new Error("nope"))).toMatch(/Could not save/);
  });
});

describe("docNeedsPdfReattach", () => {
  it("is true when any page has sourcePageIndex", () => {
    expect(docNeedsPdfReattach([{ sourcePageIndex: 0 }, {}])).toBe(true);
  });

  it("is false for overlay-only docs", () => {
    expect(docNeedsPdfReattach([{}, { id: "x" } as never])).toBe(false);
  });
});
