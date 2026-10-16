/** Persist imported PDF bytes across refresh (IndexedDB + session-scoped localStorage). */

import { storeGet, storeRemove, storeSet } from "./session.js";

const DB_NAME = "pdf-studio";
const STORE = "importedPdfs";
const DB_VERSION = 1;

/** Session-scoped localStorage keys (via storeGet/storeSet). */
const LS_PDF = "importedPdfBytes";
const LS_DOC = "importedPdfDocId";
/** Keep under typical localStorage limits (~5MB). */
const MAX_LS_BYTES = 4_500_000;

function canUseIdb(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

async function valueToUint8(value: unknown): Promise<Uint8Array | null> {
  if (!value) return null;
  if (value instanceof Uint8Array) return value.byteLength ? value : null;
  if (value instanceof ArrayBuffer) {
    return value.byteLength ? new Uint8Array(value) : null;
  }
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    if (!value.size) return null;
    return new Uint8Array(await value.arrayBuffer());
  }
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    if (!view.byteLength) return null;
    return new Uint8Array(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength));
  }
  return null;
}

export async function idbPutImportedPdf(docId: string, bytes: Uint8Array): Promise<void> {
  if (!canUseIdb() || !docId || !bytes.byteLength) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const copy = bytes.slice();
      const ab = copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength);
      const payload =
        typeof Blob !== "undefined"
          ? new Blob([ab as ArrayBuffer], { type: "application/pdf" })
          : copy;
      tx.objectStore(STORE).put(payload, docId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB put failed"));
    });
  } finally {
    db.close();
  }
}

export async function idbGetImportedPdf(docId: string): Promise<Uint8Array | null> {
  if (!canUseIdb() || !docId) return null;
  const db = await openDb();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(docId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("IndexedDB get failed"));
    });
    return valueToUint8(value);
  } catch {
    return null;
  } finally {
    db.close();
  }
}

export async function idbDeleteImportedPdf(docId: string): Promise<void> {
  if (!canUseIdb() || !docId) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(docId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed"));
    });
  } finally {
    db.close();
  }
}

export function lsPutImportedPdf(docId: string, bytes: Uint8Array, toBase64: (b: Uint8Array) => string): void {
  if (!docId || !bytes.byteLength) return;
  if (bytes.byteLength > MAX_LS_BYTES) {
    lsClearImportedPdf();
    return;
  }
  storeSet(LS_PDF, toBase64(bytes));
  storeSet(LS_DOC, docId);
}

export function lsGetImportedPdf(
  docId: string,
  fromBase64: (s: string) => Uint8Array,
): Uint8Array | null {
  if (!docId) return null;
  const storedDoc = storeGet(LS_DOC);
  const b64 = storeGet(LS_PDF);
  if (!b64 || storedDoc !== docId) return null;
  try {
    const bytes = fromBase64(b64);
    return bytes.byteLength ? bytes : null;
  } catch {
    return null;
  }
}

export function lsClearImportedPdf(): void {
  storeRemove(LS_PDF);
  storeRemove(LS_DOC);
}
