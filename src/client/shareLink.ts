import type { PdfDocument } from "../shared/types.js";
import { buildPortableStudioFile } from "./studioJson.js";
import { storeGet, storeSet } from "./session.js";
import { uid } from "./factories.js";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type ShareRecord = {
  id: string;
  createdAt: string;
  name: string;
  /** Portable studio JSON string (local-only share). */
  payload: string;
};

const INDEX_KEY = "shares";

function shareKey(id: string) {
  return `share:${id}`;
}

export function listShares(): { id: string; name: string; createdAt: string }[] {
  try {
    return JSON.parse(storeGet(INDEX_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Create a local review share — opens via `#share=<id>` in the same browser profile. */
export async function createLocalShare(
  doc: PdfDocument,
  apiFetch: FetchLike,
): Promise<{ id: string; url: string }> {
  const portable = await buildPortableStudioFile(doc, apiFetch);
  const id = uid().slice(0, 12);
  const rec: ShareRecord = {
    id,
    createdAt: new Date().toISOString(),
    name: doc.name || "Shared document",
    payload: JSON.stringify(portable),
  };
  storeSet(shareKey(id), JSON.stringify(rec));
  const index = listShares().filter((s) => s.id !== id);
  index.unshift({ id, name: rec.name, createdAt: rec.createdAt });
  storeSet(INDEX_KEY, JSON.stringify(index.slice(0, 40)));
  const url = `${location.origin}${location.pathname}?share=${id}`;
  return { id, url };
}

export function loadShare(id: string): ShareRecord | null {
  try {
    const raw = storeGet(shareKey(id));
    return raw ? (JSON.parse(raw) as ShareRecord) : null;
  } catch {
    return null;
  }
}
