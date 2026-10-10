/** Shared Node built-in stubs for browser export worker bundling. */

export const fsStub = {
  readFile: async () => {
    throw new Error("fs unavailable");
  },
  promises: {
    readFile: async () => {
      throw new Error("fs unavailable");
    },
  },
  existsSync: () => false,
  mkdirSync: () => undefined,
  readdirSync: () => [] as string[],
  statSync: () => ({ isDirectory: () => false, mtimeMs: 0 }),
  rmSync: () => undefined,
  writeFile: async () => undefined,
};

export const pathStub = {
  join: (...parts: string[]) => parts.filter(Boolean).join("/").replace(/\/+/g, "/"),
  resolve: (...parts: string[]) => parts.filter(Boolean).join("/"),
  dirname: (p: string) => {
    const i = p.lastIndexOf("/");
    return i <= 0 ? "." : p.slice(0, i);
  },
  extname: (p: string) => {
    const base = p.split("/").pop() || "";
    const i = base.lastIndexOf(".");
    return i >= 0 ? base.slice(i) : "";
  },
  sep: "/",
};

export const osStub = {
  tmpdir: () => "/tmp",
};

export function createRequire() {
  return (_id: string) => {
    throw new Error("require unavailable in browser");
  };
}

export function fileURLToPath(_url: string) {
  return "/";
}

export function randomUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}
