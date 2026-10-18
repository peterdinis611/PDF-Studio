import type { PdfDocument } from "../shared/types.js";

const DB_NAME = "pdf-studio-versions";
const STORE = "versions";
const MAX_PER_DOC = 12;

export type DocVersionMeta = {
  id: string;
  docId: string;
  name: string;
  label: string;
  at: number;
};

type DocVersionRecord = DocVersionMeta & { snapshot: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("docId", "docId", { unique: false });
        store.createIndex("at", "at", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDocVersion(
  doc: PdfDocument,
  label = "Autosave",
): Promise<DocVersionMeta> {
  const db = await openDb();
  const record: DocVersionRecord = {
    id: crypto.randomUUID(),
    docId: doc.id,
    name: doc.name || "Untitled",
    label,
    at: Date.now(),
    snapshot: JSON.stringify(doc),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await pruneVersions(doc.id);
  db.close();
  return {
    id: record.id,
    docId: record.docId,
    name: record.name,
    label: record.label,
    at: record.at,
  };
}

export async function listDocVersions(docId: string): Promise<DocVersionMeta[]> {
  const db = await openDb();
  const rows = await new Promise<DocVersionRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const idx = tx.objectStore(STORE).index("docId");
    const req = idx.getAll(docId);
    req.onsuccess = () => resolve((req.result as DocVersionRecord[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows
    .map(({ id, docId: d, name, label, at }) => ({ id, docId: d, name, label, at }))
    .sort((a, b) => b.at - a.at);
}

export async function loadDocVersion(id: string): Promise<PdfDocument | null> {
  const db = await openDb();
  const row = await new Promise<DocVersionRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as DocVersionRecord | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!row?.snapshot) return null;
  try {
    return JSON.parse(row.snapshot) as PdfDocument;
  } catch {
    return null;
  }
}

async function pruneVersions(docId: string) {
  const list = await listDocVersions(docId);
  if (list.length <= MAX_PER_DOC) return;
  const db = await openDb();
  const drop = list.slice(MAX_PER_DOC);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const v of drop) store.delete(v.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
