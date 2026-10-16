/**
 * Build browser bundles (app.js + export-worker.js).
 * Usage:
 *   node scripts/build-client.mjs
 *   node scripts/build-client.mjs --watch
 */
import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const stub = path.join(root, "src/client/node-stubs.ts");
const watch = process.argv.includes("--watch");

const contents = {
  "node:fs": `
import { fsStub } from ${JSON.stringify(stub)};
export const readFile = fsStub.readFile;
export const promises = fsStub.promises;
export const existsSync = fsStub.existsSync;
export const mkdirSync = fsStub.mkdirSync;
export const readdirSync = fsStub.readdirSync;
export const statSync = fsStub.statSync;
export const rmSync = fsStub.rmSync;
export default fsStub;
`,
  "node:fs/promises": `
import { fsStub } from ${JSON.stringify(stub)};
export const readFile = fsStub.promises.readFile;
export default fsStub.promises;
`,
  "node:path": `
import { pathStub } from ${JSON.stringify(stub)};
export const join = pathStub.join;
export const resolve = pathStub.resolve;
export const dirname = pathStub.dirname;
export const extname = pathStub.extname;
export const sep = pathStub.sep;
export default pathStub;
`,
  "node:os": `
import { osStub } from ${JSON.stringify(stub)};
export const tmpdir = osStub.tmpdir;
export default osStub;
`,
  "node:module": `
import { createRequire as cr } from ${JSON.stringify(stub)};
export const createRequire = cr;
export default { createRequire: cr };
`,
  "node:url": `
import { fileURLToPath as f } from ${JSON.stringify(stub)};
export const fileURLToPath = f;
export default { fileURLToPath: f };
`,
  "node:crypto": `
import { randomUUID as r } from ${JSON.stringify(stub)};
export const randomUUID = r;
export default { randomUUID: r };
`,
};
contents.fs = contents["node:fs"];
contents.path = contents["node:path"];
contents.os = contents["node:os"];
contents.url = contents["node:url"];
contents.crypto = contents["node:crypto"];

const nodeStubPlugin = {
  name: "node-stubs",
  setup(build) {
    build.onResolve({ filter: /^(node:)?(fs|fs\/promises|path|os|module|url|crypto)$/ }, (args) => {
      let key = args.path;
      if (!key.startsWith("node:")) key = `node:${key}`;
      return { path: key, namespace: "node-stub" };
    });
    build.onLoad({ filter: /.*/, namespace: "node-stub" }, (args) => {
      const body = contents[args.path];
      if (!body) return { contents: "export default {}", loader: "js" };
      return { contents: body, loader: "js", resolveDir: root };
    });
  },
};

const appOptions = {
  entryPoints: [path.join(root, "src/client/main.ts")],
  bundle: true,
  outfile: path.join(root, "public/js/app.js"),
  format: "esm",
  target: "es2020",
  minify: true,
  logLevel: "info",
};

const workerOptions = {
  entryPoints: [path.join(root, "src/client/exportWorker.ts")],
  bundle: true,
  outfile: path.join(root, "public/js/export-worker.js"),
  format: "esm",
  target: "es2020",
  platform: "browser",
  minify: true,
  plugins: [nodeStubPlugin],
  logLevel: "info",
};

if (watch) {
  const [appCtx, workerCtx] = await Promise.all([
    esbuild.context(appOptions),
    esbuild.context(workerOptions),
  ]);
  await Promise.all([appCtx.watch(), workerCtx.watch()]);
  console.log("watching client bundles (app.js + export-worker.js)");
} else {
  await Promise.all([esbuild.build(appOptions), esbuild.build(workerOptions)]);
  console.log("client bundles built");
}
