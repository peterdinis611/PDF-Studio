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
