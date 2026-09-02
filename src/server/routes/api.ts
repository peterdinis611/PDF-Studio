import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { imageSize } from "image-size";
import { exportPdf } from "../services/pdfExport.js";
import type { ExportPayload } from "../../shared/types.js";
import { PAGE_SIZES } from "../../shared/types.js";
import { ensureSessionDirs, sessionPublicUrl } from "../session.js";
import { audit, listAuditEvents, requestContext, type AuditLevel } from "../audit.js";
import { requireAuditAccess } from "../auditAccess.js";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg"]);

function imageStorage() {
  return multer.diskStorage({
    destination: (req, _file, cb) => {
      const { uploads } = ensureSessionDirs(req.sessionId);
      cb(null, uploads);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safe = ALLOWED_EXT.has(ext) ? ext : ".png";
      cb(null, `${randomUUID()}${safe}`);
    },
  });
}

const upload = multer({
  storage: imageStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpeg|jpg)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG and JPEG images are allowed"));
    }
  },
});

export const apiRouter = Router();

apiRouter.get("/audit-logs", requireAuditAccess, (req, res) => {
  const level = typeof req.query.level === "string" ? (req.query.level as AuditLevel) : undefined;
  const action = typeof req.query.action === "string" ? req.query.action : undefined;
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 100;

  const result = listAuditEvents({
    level: level === "info" || level === "warn" || level === "error" ? level : undefined,
    action,
    q,
    limit: Number.isFinite(limit) ? limit : 100,
  });

  res.json(result);
});

apiRouter.post("/export", async (req, res) => {
  try {
    const payload = req.body as ExportPayload;
    if (!payload?.pages?.length) {
      audit("warn", "pdf.export.fail", "Export rejected: no pages", {
        sessionId: req.sessionId,
        req: requestContext(req, 400),
      });
      res.status(400).json({ error: "Document needs at least one page" });
      return;
    }
    if (!(payload.pageSize in PAGE_SIZES)) {
      audit("warn", "pdf.export.fail", "Export rejected: invalid page size", {
        sessionId: req.sessionId,
        req: requestContext(req, 400),
        meta: { pageSize: payload.pageSize },
      });
      res.status(400).json({ error: "Invalid page size" });
      return;
    }

    const bytes = await exportPdf(payload);
    const filename = `${(payload.name || "document").replace(/[^\w.-]+/g, "_")}.pdf`;
    const elementCount = payload.pages.reduce((n, p) => n + (p.elements?.length ?? 0), 0);

    audit("info", "pdf.export", `Exported “${payload.name || "document"}”`, {
      sessionId: req.sessionId,
      req: requestContext(req, 200),
      meta: {
        name: payload.name || "document",
        filename,
        pages: payload.pages.length,
        elements: elementCount,
        pageSize: payload.pageSize,
        bytes: bytes.byteLength,
        hasImportedPdf: Boolean(payload.importedPdfData),
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(bytes));
  } catch (err) {
    audit("error", "pdf.export.fail", "Export failed", {
      sessionId: req.sessionId,
      req: requestContext(req, 500),
      meta: { error: err instanceof Error ? err.message : "unknown" },
    });
    res.status(500).json({ error: "Failed to export PDF" });
  }
});

apiRouter.post("/upload", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      audit("warn", "image.upload.fail", err.message || "Upload failed", {
        sessionId: req.sessionId,
        req: requestContext(req, 400),
      });
      res.status(400).json({ error: err.message || "Upload failed" });
      return;
    }
    if (!req.file) {
      audit("warn", "image.upload.fail", "No image uploaded", {
        sessionId: req.sessionId,
        req: requestContext(req, 400),
      });
      res.status(400).json({ error: "No image uploaded" });
      return;
    }

    let width = 240;
    let height = 180;
    try {
      const buffer = fs.readFileSync(req.file.path);
      const dims = imageSize(new Uint8Array(buffer));
      if (dims.width && dims.height) {
        const maxEdge = 360;
        const scale = Math.min(1, maxEdge / Math.max(dims.width, dims.height));
        width = Math.round(dims.width * scale);
        height = Math.round(dims.height * scale);
      }
    } catch {
      /* keep defaults */
    }

    audit("info", "image.upload", `Uploaded ${req.file.originalname}`, {
      sessionId: req.sessionId,
      req: requestContext(req, 200),
      meta: {
        name: req.file.originalname,
        mime: req.file.mimetype,
        storedAs: req.file.filename,
        bytes: req.file.size,
        width,
        height,
      },
    });

    res.json({
      url: sessionPublicUrl(req.sessionId, req.file.filename),
      name: req.file.originalname,
      width,
      height,
    });
  });
});
