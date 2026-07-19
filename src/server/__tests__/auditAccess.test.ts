import { jest } from "@jest/globals";
import type { Request, Response } from "express";
import { extractAuditToken, requireAuditAccess } from "../auditAccess.js";

function mockReq(partial: Partial<Request> & { headers?: Record<string, string> }): Request {
  const headers = partial.headers ?? {};
  return {
    ...partial,
    get: (name: string) => headers[name.toLowerCase()] ?? headers[name],
    query: partial.query ?? {},
    baseUrl: partial.baseUrl ?? "",
    originalUrl: partial.originalUrl ?? "/",
    path: partial.path ?? "/",
  } as unknown as Request;
}

describe("extractAuditToken", () => {
  describe("positive", () => {
    it("reads header, bearer, and query token", () => {
      expect(
        extractAuditToken(mockReq({ headers: { "x-audit-token": "abc" } })),
      ).toBe("abc");
      expect(
        extractAuditToken(mockReq({ headers: { authorization: "Bearer secret" } })),
      ).toBe("secret");
      expect(extractAuditToken(mockReq({ query: { token: "q" } }))).toBe("q");
    });
  });

  describe("negative", () => {
    it("returns undefined when absent", () => {
      expect(extractAuditToken(mockReq({}))).toBeUndefined();
    });
  });
});

describe("requireAuditAccess", () => {
  const prevEnv = process.env.NODE_ENV;
  const prevToken = process.env.AUDIT_LOGS_TOKEN;

  afterEach(() => {
    process.env.NODE_ENV = prevEnv;
    if (prevToken === undefined) delete process.env.AUDIT_LOGS_TOKEN;
    else process.env.AUDIT_LOGS_TOKEN = prevToken;
  });

  describe("positive", () => {
    it("allows access in development without a token", () => {
      process.env.NODE_ENV = "development";
      delete process.env.AUDIT_LOGS_TOKEN;
      const next = jest.fn();
      requireAuditAccess(mockReq({}), {} as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it("allows access when the token matches", () => {
      process.env.AUDIT_LOGS_TOKEN = "secret";
      const next = jest.fn();
      requireAuditAccess(
        mockReq({ headers: { "x-audit-token": "secret" }, baseUrl: "/api" }),
        {} as Response,
        next,
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe("negative", () => {
    it("returns 401 JSON for API when token is wrong", () => {
      process.env.AUDIT_LOGS_TOKEN = "secret";
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        render: jest.fn(),
      };
      const next = jest.fn();
      requireAuditAccess(
        mockReq({
          headers: { "x-audit-token": "nope" },
          baseUrl: "/api",
          originalUrl: "/api/audit-logs",
        }),
        res as unknown as Response,
        next,
      );
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
    });

    it("hides the page in production when no token is configured", () => {
      process.env.NODE_ENV = "production";
      delete process.env.AUDIT_LOGS_TOKEN;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        render: jest.fn(),
      };
      const next = jest.fn();
      requireAuditAccess(
        mockReq({ originalUrl: "/audit-logs", path: "/audit-logs" }),
        res as unknown as Response,
        next,
      );
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
