/** Browser stub for Node fs used when bundling export for the client. */
export async function readFile(_path: string): Promise<Buffer> {
  throw new Error("fs.readFile is not available in the browser");
}

export default {
  readFile,
  promises: { readFile },
  existsSync: () => false,
  mkdirSync: () => undefined,
  readdirSync: () => [],
  statSync: () => ({ isDirectory: () => false, mtimeMs: 0 }),
  rmSync: () => undefined,
};
