/** Cookie + header name for anonymous workspace sessions (no auth). */
export const SESSION_COOKIE = "pdf-studio-sid";
export const SESSION_HEADER = "X-Pdf-Studio-Session";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidSessionId(id: unknown): id is string {
  return typeof id === "string" && UUID_RE.test(id);
}
