import type { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { SESSION_COOKIE, SESSION_HEADER, isValidSessionId } from "../shared/session.js";

/** Ephemeral storage — never lives in the project / deploy bundle. */
export const uploadsRoot = path.join(os.tmpdir(), "pdf-studio-uploads");

/** Session folders older than this are deleted on startup / periodic prune. */
const UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;

declare global {
  namespace Express {
    interface Request {
      sessionId: string;
    }
  }
}

function parseCookie(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

export function sessionUploadsDir(sessionId: string): string {
  return path.join(uploadsRoot, "sessions", sessionId);
}

export function sessionFontsDir(sessionId: string): string {
  return path.join(sessionUploadsDir(sessionId), "fonts");
}

export function ensureSessionDirs(sessionId: string): { uploads: string; fonts: string } {
  const uploads = sessionUploadsDir(sessionId);
  const fonts = sessionFontsDir(sessionId);
  fs.mkdirSync(fonts, { recursive: true });
  return { uploads, fonts };
}

export function sessionPublicUrl(
  sessionId: string,
  filename: string,
  kind: "file" | "font" = "file",
): string {
  if (kind === "font") return `/uploads/sessions/${sessionId}/fonts/${filename}`;
  return `/uploads/sessions/${sessionId}/${filename}`;
}

/** Remove expired session upload dirs so deploys don't accumulate files. */
export function pruneExpiredUploads(maxAgeMs = UPLOAD_TTL_MS): void {
  const sessionsRoot = path.join(uploadsRoot, "sessions");
  if (!fs.existsSync(sessionsRoot)) return;

  const now = Date.now();
  for (const name of fs.readdirSync(sessionsRoot)) {
    const dir = path.join(sessionsRoot, name);
    try {
      const stat = fs.statSync(dir);
      if (!stat.isDirectory()) continue;
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch {
      /* ignore */
    }
  }
}

/** Attach anonymous session id (no login). Isolates uploads between browsers/tabs. */
export function sessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.get(SESSION_HEADER);
  const cookie = parseCookie(req.headers.cookie)[SESSION_COOKIE];

  // Prefer client header (tab-scoped). Avoid minting a shared cookie on HTML navigations
  // so two tabs don't get locked to the same workspace.
  let sessionId: string;
  if (isValidSessionId(header)) {
    sessionId = header;
    if (cookie !== sessionId) {
      res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${sessionId}; Path=/; SameSite=Lax; HttpOnly`);
    }
  } else if (isValidSessionId(cookie)) {
    sessionId = cookie;
  } else {
    sessionId = randomUUID();
  }

  req.sessionId = sessionId;
  ensureSessionDirs(sessionId);
  next();
}
