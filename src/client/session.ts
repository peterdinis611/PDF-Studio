import { SESSION_COOKIE, SESSION_HEADER, isValidSessionId } from "../shared/session.js";

const SESSION_STORAGE_KEY = "pdf-studio-session-id";

/** Tab-scoped anonymous session — new tab / closed browser = new workspace. */
export function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!isValidSessionId(id)) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  // Best-effort cookie sync for this tab (server also reads the header).
  document.cookie = `${SESSION_COOKIE}=${id}; path=/; SameSite=Lax`;
  return id;
}

export function sessionStorageKey(base: string): string {
  return `pdf-studio:${getSessionId()}:${base}`;
}

export function storeGet(base: string): string | null {
  return localStorage.getItem(sessionStorageKey(base));
}

export function storeSet(base: string, value: string): void {
  localStorage.setItem(sessionStorageKey(base), value);
}

export function storeRemove(base: string): void {
  localStorage.removeItem(sessionStorageKey(base));
}

/** fetch() that attaches the anonymous session header. */
export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set(SESSION_HEADER, getSessionId());
  return fetch(input, { ...init, headers, credentials: "same-origin" });
}
