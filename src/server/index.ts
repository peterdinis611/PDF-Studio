import express from "express";
import { engine } from "express-handlebars";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiRouter } from "./routes/api.js";
import { sessionMiddleware } from "./session.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const app = express();
const PORT = Number(process.env.PORT) || 3847;

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

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use("/public", express.static(path.join(root, "public")));
app.use("/uploads", express.static(path.join(root, "uploads")));

app.get("/", (_req, res) => {
  res.render("home", {
    title: "PDF Studio",
    tagline: "Design and customize PDFs in the browser",
  });
});

app.get("/editor", (_req, res) => {
  res.render("editor", {
    title: "Editor — PDF Studio",
    layout: "editor",
  });
});

app.use("/api", apiRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((_req, res) => {
  res.status(404).render("not-found", {
    title: "Page not found — PDF Studio",
  });
});

app.listen(PORT, () => {
  console.log(`PDF Studio running at http://localhost:${PORT}`);
});
