import express, { type Request, type Response, type NextFunction } from "express";
import { engine } from "express-handlebars";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAssetUrls, publicCacheControl } from "./assets.js";
import { apiRouter } from "./routes/api.js";
import { pruneExpiredUploads, sessionMiddleware, uploadsRoot } from "./session.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");
const isProd = process.env.NODE_ENV === "production";

const app = express();
const PORT = Number(process.env.PORT) || 3847;
const HOST = process.env.HOST || "0.0.0.0";

if (isProd) {
  app.set("trust proxy", 1);
}

pruneExpiredUploads();
setInterval(() => pruneExpiredUploads(), 60 * 60 * 1000).unref();

app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(root, "views/layouts"),
    partialsDir: path.join(root, "views/partials"),
  }),
);
app.set("view engine", "hbs");
app.set("views", path.join(root, "views"));

app.use(express.json({ limit: "40mb" }));
app.use(express.urlencoded({ extended: true, limit: "40mb" }));
app.use(sessionMiddleware);

app.use((_req, res, next) => {
  res.locals.assets = getAssetUrls(root, isProd);
  next();
});

const staticOpts = isProd
  ? {
      etag: true,
      lastModified: true,
      setHeaders(res: Response, filePath: string) {
        res.setHeader("Cache-Control", publicCacheControl(filePath));
      },
    }
  : { maxAge: 0 };

app.use("/public", express.static(path.join(root, "public"), staticOpts));
app.use("/uploads", express.static(uploadsRoot, { maxAge: 0 }));

function noStoreHtml(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("Cache-Control", "no-store");
  next();
}

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "pdf-studio" });
});

app.get("/", noStoreHtml, (_req, res) => {
  res.render("home", {
    title: "PDF Studio",
    tagline: "Design and customize PDFs in the browser",
  });
});

app.get("/editor", noStoreHtml, (_req, res) => {
  res.render("editor", {
    title: "Editor — PDF Studio",
    layout: "editor",
  });
});

app.use("/api", apiRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(noStoreHtml, (_req, res) => {
  res.status(404).render("not-found", {
    title: "Page not found — PDF Studio",
  });
});

app.listen(PORT, HOST, () => {
  console.log(`PDF Studio listening on http://${HOST}:${PORT} (${isProd ? "production" : "development"})`);
});
