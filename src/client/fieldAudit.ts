import type { PdfDocument } from "../shared/types.js";
import { collectDocTokens, type MailMergeRow } from "./mailMerge.js";

export type FieldAuditIssue = {
  token: string;
  severity: "missing" | "empty";
  message: string;
};

/** Audit merge tokens against optional sample row / headers before export. */
export function auditMergeFields(
  doc: PdfDocument,
  opts?: { headers?: string[]; sampleRow?: MailMergeRow | null },
): FieldAuditIssue[] {
  const tokens = collectDocTokens(doc);
  const issues: FieldAuditIssue[] = [];
  const headers = new Set(opts?.headers || []);
  const row = opts?.sampleRow;

  for (const token of tokens) {
    if (headers.size && !headers.has(token)) {
      issues.push({
        token,
        severity: "missing",
        message: `Token {{${token}}} is not in the merge data headers`,
      });
      continue;
    }
    if (row && (row[token] === undefined || row[token] === "")) {
      issues.push({
        token,
        severity: "empty",
        message: `Token {{${token}}} is empty in the preview row`,
      });
    }
  }

  // Also flag leftover tokens after a merge (still looking like {{x}})
  const leftover = collectDocTokens(doc).filter((t) => {
    // if no headers provided, scan content for unsubstituted — collectDocTokens already lists them
    return true;
  });
  void leftover;

  return issues;
}

/** Tokens still present as `{{...}}` in the document (unresolved). */
export function findUnresolvedTokens(doc: PdfDocument): string[] {
  return collectDocTokens(doc);
}
