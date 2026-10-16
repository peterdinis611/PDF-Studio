/**
 * Backward-compatible wrapper — prefer `node scripts/build-client.mjs`.
 * Usage: node scripts/build-export-worker.mjs [--watch]
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");
const args = [path.join(__dirname, "build-client.mjs")];
if (watch) args.push("--watch");

const child = spawn(process.execPath, args, { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 0));
