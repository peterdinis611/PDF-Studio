import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { imageSize } from "image-size";
import { exportPdf } from "../services/pdfExport.js";
import type { ExportPayload } from "../../shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../../../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = ALLOWED_EXT.has(ext) ? ext : ".png";
    cb(null, `${randomUUID()}${safe}`);
  },
});

const upload = multer({
  storage,
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

apiRouter.post("/export", async (req, res) => {
  try {
    const payload = req.body as ExportPayload;
    if (!payload?.pages?.length) {
      res.status(400).json({ error: "Document needs at least one page" });
      return;
    }
    if (!["a4", "a5", "letter", "legal", "square"].includes(payload.pageSize)) {
      res.status(400).json({ error: "Invalid page size" });
      return;
    }

    const bytes = await exportPdf(payload);
    const filename = `${(payload.name || "document").replace(/[^\w.-]+/g, "_")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(bytes));
  } catch (err) {
    console.error("Export failed:", err);
    res.status(500).json({ error: "Failed to export PDF" });
  }
});

apiRouter.post("/upload", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || "Upload failed" });
      return;
    }
    if (!req.file) {
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

    res.json({
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      width,
      height,
    });
  });
});
