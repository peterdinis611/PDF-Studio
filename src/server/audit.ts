import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { logger } from "./logger.js";

export type AuditLevel = "info" | "warn" | "error";

export type AuditAction =
  | "server.start"
  | "pdf.export"
  | "pdf.export.fail"
  | "image.upload"
  | "image.upload.fail"
  | "audit.view"
  | "http.error";

export interface AuditRequestContext {
  method?: string;
  path?: string;
  status?: number;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export interface AuditEvent {
  id: string;
  ts: string;
  level: AuditLevel;
  action: AuditAction;
  message: string;
  /** Full anonymous session id (when present). */
  sessionId?: string;
  req?: AuditRequestContext;
  meta?: Record<string, unknown>;
}

export interface AuditQuery {
  limit?: number;
  level?: AuditLevel;
  action?: string;
  q?: string;
}

export interface AuditListResult {
  events: AuditEvent[];
  total: number;
  capacity: number;
  counts: { info: number; warn: number; error: number; all: number };
}

const MAX_EVENTS = Number(process.env.AUDIT_LOG_CAPACITY) || 500;
const buffer: AuditEvent[] = [];

export function shortSessionId(sessionId: string | undefined): string | undefined {
  if (!sessionId) return undefined;
  return sessionId.length > 8 ? `${sessionId.slice(0, 8)}…` : sessionId;
}

/** Pull useful request fields for the audit UI. */
export function requestContext(req: Request, status?: number): AuditRequestContext {
  const rawId = (req as Request & { id?: string | number }).id;
  const ua = req.get("user-agent");
  return {
    method: req.method,
    path: (req.originalUrl ?? req.url ?? req.path).split("?")[0],
    status,
    ip: req.ip || req.socket?.remoteAddress || undefined,
    userAgent: ua ? ua.slice(0, 180) : undefined,
    requestId: rawId != null ? String(rawId) : undefined,
  };
}

/** Record an audit event (ring buffer) and emit via Pino. */
export function audit(
  level: AuditLevel,
  action: AuditAction,
  message: string,
  opts: {
    sessionId?: string;
    req?: AuditRequestContext;
    meta?: Record<string, unknown>;
  } = {},
): AuditEvent {
  const event: AuditEvent = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    level,
    action,
    message,
    sessionId: opts.sessionId,
    req: opts.req,
    meta: opts.meta,
  };

  buffer.push(event);
  if (buffer.length > MAX_EVENTS) buffer.shift();

  const payload = {
    audit: true,
    action,
    sessionId: shortSessionId(event.sessionId),
    ...(event.req ?? {}),
    ...(opts.meta ?? {}),
  };

  if (level === "error") logger.error(payload, message);
  else if (level === "warn") logger.warn(payload, message);
  else logger.info(payload, message);

  return event;
}

function countLevels(events: AuditEvent[]): AuditListResult["counts"] {
  const counts = { info: 0, warn: 0, error: 0, all: events.length };
  for (const e of events) counts[e.level] += 1;
  return counts;
}

export function listAuditEvents(query: AuditQuery = {}): AuditListResult {
  const limit = Math.min(Math.max(query.limit ?? 100, 1), MAX_EVENTS);
  const q = query.q?.trim().toLowerCase();

  let filtered = buffer.slice();
  if (query.level) filtered = filtered.filter((e) => e.level === query.level);
  if (query.action) {
    const action = query.action.toLowerCase();
    filtered = filtered.filter((e) => e.action.toLowerCase().includes(action));
  }
  if (q) {
    filtered = filtered.filter((e) => {
      const hay = [
        e.message,
        e.action,
        e.sessionId,
        e.req?.method,
        e.req?.path,
        e.req?.ip,
        e.req?.userAgent,
        e.req?.requestId,
        e.meta ? JSON.stringify(e.meta) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  const newestFirst = filtered.reverse();
  return {
    events: newestFirst.slice(0, limit),
    total: filtered.length,
    capacity: MAX_EVENTS,
    counts: countLevels(buffer),
  };
}

/** Test helper — clears the in-memory buffer. */
export function clearAuditEvents(): void {
  buffer.length = 0;
}
