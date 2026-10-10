import type { PdfDocument } from "../shared/types.js";
import { storeGet, storeRemove, storeSet } from "./session.js";
import { uid } from "./factories.js";

const INDEX_KEY = "userTemplates";

export type UserTemplateMeta = {
  id: string;
  name: string;
  updatedAt: string;
};

function templateKey(id: string) {
  return `userTemplate:${id}`;
}

export function listUserTemplates(): UserTemplateMeta[] {
  try {
    return JSON.parse(storeGet(INDEX_KEY) || "[]") as UserTemplateMeta[];
  } catch {
    return [];
  }
}

function saveIndex(list: UserTemplateMeta[]) {
  storeSet(INDEX_KEY, JSON.stringify(list.slice(0, 60)));
}

/** Save current doc as a reusable local template (strips ephemeral import refs). */
export function saveUserTemplate(doc: PdfDocument, name?: string): UserTemplateMeta {
  const clone = structuredClone(doc) as PdfDocument;
  clone.id = uid();
  clone.name = (name || doc.name || "My template").trim() || "My template";
  clone.updatedAt = new Date().toISOString();
  clone.comments = [];
  clone.importedPdf = null;
  for (const page of clone.pages) {
    delete page.sourcePageIndex;
    delete page.mergeFields;
  }

  const meta: UserTemplateMeta = {
    id: clone.id,
    name: clone.name,
    updatedAt: clone.updatedAt,
  };

  storeSet(templateKey(clone.id), JSON.stringify(clone));
  const list = listUserTemplates().filter((t) => t.id !== meta.id);
  list.unshift(meta);
  saveIndex(list);
  return meta;
}

export function loadUserTemplate(id: string): PdfDocument | null {
  const raw = storeGet(templateKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PdfDocument;
  } catch {
    return null;
  }
}

export function deleteUserTemplate(id: string): void {
  storeRemove(templateKey(id));
  saveIndex(listUserTemplates().filter((t) => t.id !== id));
}

export function renameUserTemplate(id: string, name: string): void {
  const doc = loadUserTemplate(id);
  if (!doc) return;
  doc.name = name.trim() || doc.name;
  doc.updatedAt = new Date().toISOString();
  storeSet(templateKey(id), JSON.stringify(doc));
  const list = listUserTemplates().map((t) =>
    t.id === id ? { ...t, name: doc.name, updatedAt: doc.updatedAt } : t,
  );
  saveIndex(list);
}
