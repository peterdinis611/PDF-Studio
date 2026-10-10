export function join(...parts: string[]) {
  return parts.filter(Boolean).join("/").replace(/\/+/g, "/");
}

export function resolve(...parts: string[]) {
  return join(...parts);
}

export function dirname(p: string) {
  const i = p.lastIndexOf("/");
  return i <= 0 ? "." : p.slice(0, i);
}

export function extname(p: string) {
  const base = p.split("/").pop() || "";
  const i = base.lastIndexOf(".");
  return i >= 0 ? base.slice(i) : "";
}

export default { join, resolve, dirname, extname };
