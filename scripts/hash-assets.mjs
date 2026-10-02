import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const targets = [
  { dir: "public/js", base: "app", ext: "js", key: "js" },
  { dir: "public/css", base: "app", ext: "css", key: "css" },
];

/** @type {Record<string, string>} */
const manifest = {};

for (const { dir, base, ext, key } of targets) {
  const absDir = path.join(root, dir);
  const src = path.join(absDir, `${base}.${ext}`);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing build output: ${src}`);
  }

  const buf = fs.readFileSync(src);
  const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 8);
  const hashedName = `${base}.${hash}.${ext}`;
  const hashedRe = new RegExp(`^${base}\\.[a-f0-9]{8}\\.${ext}$`, "i");

  for (const name of fs.readdirSync(absDir)) {
    if (hashedRe.test(name)) fs.unlinkSync(path.join(absDir, name));
  }

  fs.writeFileSync(path.join(absDir, hashedName), buf);
  manifest[key] = `/public/${path.basename(dir)}/${hashedName}`;
  console.log(`hashed ${dir}/${base}.${ext} → ${hashedName}`);
}

const manifestPath = path.join(root, "public/asset-manifest.json");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`wrote ${path.relative(root, manifestPath)}`);

// pdf.js worker for imported-PDF canvas underlays (not hashed — stable URL for GlobalWorkerOptions)
const workerSrc = path.join(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const workerDest = path.join(root, "public/js/pdf.worker.min.mjs");
if (fs.existsSync(workerSrc)) {
  fs.copyFileSync(workerSrc, workerDest);
  console.log("copied pdf.worker.min.mjs → public/js/");
} else {
  console.warn("pdfjs worker missing — PDF underlay preview will fail until pdfjs-dist is installed");
}

// Self-hosted Alpine (stable URL; also content-hash when present)
const alpineSrc = path.join(root, "node_modules/alpinejs/dist/cdn.min.js");
const alpineDest = path.join(root, "public/js/alpine.min.js");
if (fs.existsSync(alpineSrc)) {
  const buf = fs.readFileSync(alpineSrc);
  fs.writeFileSync(alpineDest, buf);
  const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 8);
  const hashedName = `alpine.${hash}.js`;
  const hashedRe = /^alpine\.[a-f0-9]{8}\.js$/i;
  for (const name of fs.readdirSync(path.join(root, "public/js"))) {
    if (hashedRe.test(name)) fs.unlinkSync(path.join(root, "public/js", name));
  }
  fs.writeFileSync(path.join(root, "public/js", hashedName), buf);
  manifest.alpine = `/public/js/${hashedName}`;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`copied alpine.min.js → public/js/ (+ ${hashedName})`);
} else {
  console.warn("alpinejs missing — layouts will 404 until alpinejs is installed");
}
