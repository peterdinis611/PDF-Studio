import { storeGet, storeSet } from "./session.js";
import { uid } from "./factories.js";

export type ESignSigner = {
  id: string;
  name: string;
  email?: string;
  order: number;
  status: "pending" | "signed" | "declined";
  signedAt?: string;
};

export type ESignTrailEvent = {
  id: string;
  ts: string;
  action: string;
  actor: string;
  detail?: string;
};

export type ESignPackage = {
  docId: string;
  signers: ESignSigner[];
  trail: ESignTrailEvent[];
  updatedAt: string;
};

const key = (docId: string) => `esign:${docId}`;

export function loadESignPackage(docId: string): ESignPackage | null {
  try {
    const raw = storeGet(key(docId));
    return raw ? (JSON.parse(raw) as ESignPackage) : null;
  } catch {
    return null;
  }
}

export function saveESignPackage(pkg: ESignPackage): void {
  pkg.updatedAt = new Date().toISOString();
  storeSet(key(pkg.docId), JSON.stringify(pkg));
}

export function createESignPackage(docId: string, names: string[]): ESignPackage {
  const signers: ESignSigner[] = names
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name, i) => ({
      id: uid(),
      name,
      order: i + 1,
      status: "pending" as const,
    }));
  const pkg: ESignPackage = {
    docId,
    signers,
    trail: [
      {
        id: uid(),
        ts: new Date().toISOString(),
        action: "package.created",
        actor: "local",
        detail: `${signers.length} signer(s)`,
      },
    ],
    updatedAt: new Date().toISOString(),
  };
  saveESignPackage(pkg);
  return pkg;
}

export function markSignerSigned(pkg: ESignPackage, signerId: string): ESignPackage {
  const next = structuredClone(pkg);
  const signer = next.signers.find((s) => s.id === signerId);
  if (!signer) return pkg;
  // Enforce order: previous must be signed
  const prior = next.signers.filter((s) => s.order < signer.order);
  if (prior.some((s) => s.status !== "signed")) {
    throw new Error("Previous signers must sign first");
  }
  signer.status = "signed";
  signer.signedAt = new Date().toISOString();
  next.trail.push({
    id: uid(),
    ts: signer.signedAt,
    action: "signer.signed",
    actor: signer.name,
  });
  saveESignPackage(next);
  return next;
}

export function exportTrailText(pkg: ESignPackage): string {
  return pkg.trail
    .map((e) => `${e.ts} · ${e.action} · ${e.actor}${e.detail ? ` · ${e.detail}` : ""}`)
    .join("\n");
}
