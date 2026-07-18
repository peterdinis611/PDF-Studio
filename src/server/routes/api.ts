import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { imageSize } from "image-size";
import { exportPdf } from "../services/pdfExport.js";
import { importPdfFromPath } from "../services/pdfImport.js";
import type { ExportPayload } from "../../shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../../../uploads");
const fontsDir = path.resolve(uploadsDir, "fonts");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg"]);
const FONT_EXT = new Set([".ttf", ".otf"]);

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

const pdfUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() === ".pdf" ? ".pdf" : ".pdf";
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

const fontUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, fontsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safe = FONT_EXT.has(ext) ? ext : ".ttf";
      cb(null, `${randomUUID()}${safe}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (FONT_EXT.has(ext) || /font|ttf|otf/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only TTF/OTF fonts are allowed"));
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

apiRouter.post("/import", (req, res) => {
  pdfUpload.single("pdf")(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message || "Import failed" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No PDF uploaded" });
      return;
    }
    try {
      const url = `/uploads/${req.file.filename}`;
      const doc = await importPdfFromPath(req.file.path, url, req.file.originalname);
      res.json({ document: doc });
    } catch (e) {
      console.error("Import failed:", e);
      res.status(500).json({ error: "Failed to import PDF" });
    }
  });
});

apiRouter.post("/fonts", (req, res) => {
  fontUpload.single("font")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || "Font upload failed" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No font uploaded" });
      return;
    }
    const name = path.basename(req.file.originalname, path.extname(req.file.originalname));
    res.json({
      id: path.basename(req.file.filename, path.extname(req.file.filename)),
      name,
      url: `/uploads/fonts/${req.file.filename}`,
    });
  });
});
