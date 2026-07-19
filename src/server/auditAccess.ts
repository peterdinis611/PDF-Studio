import type { Request, Response, NextFunction } from "express";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function auditTokenConfigured(): boolean {
  return Boolean(process.env.AUDIT_LOGS_TOKEN?.trim());
}

export function extractAuditToken(req: Request): string | undefined {
  const header = req.get("x-audit-token")?.trim();
  if (header) return header;

  const auth = req.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  const query = req.query.token;
  if (typeof query === "string" && query.trim()) return query.trim();

  return undefined;
}

function isApiRequest(req: Request): boolean {
  return req.baseUrl.startsWith("/api") || req.originalUrl.startsWith("/api");
}

/**
 * Protects audit UI + API.
 * - If AUDIT_LOGS_TOKEN is set → require matching token.
 * - If unset in production → 404 (hidden).
 * - If unset in development → open access.
 */
export function requireAuditAccess(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.AUDIT_LOGS_TOKEN?.trim();

  if (!expected) {
    if (isProduction()) {
      if (isApiRequest(req)) {
        res.status(404).json({ error: "Not found" });
      } else {
        res.status(404).render("not-found", { title: "Page not found — PDF Studio" });
      }
      return;
    }
    next();
    return;
  }

  if (extractAuditToken(req) === expected) {
    next();
    return;
  }

  if (isApiRequest(req)) {
    res.status(401).json({ error: "Audit token required", code: "AUDIT_TOKEN_REQUIRED" });
    return;
  }

  res.status(401).render("audit-logs", {
    title: "Audit logs — PDF Studio",
    locked: true,
    tokenRequired: true,
  });
}
