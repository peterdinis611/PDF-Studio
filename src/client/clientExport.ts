import type { ExportPayload } from "../shared/types.js";
import type { ExportWorkerRequest, ExportWorkerResponse } from "./exportWorker.js";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

let worker: Worker | null = null;
let workerFailed = false;
let nextId = 1;

function getWorker(): Worker | null {
  if (workerFailed || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker("/js/export-worker.js", { type: "module" });
    return worker;
  } catch {
    workerFailed = true;
    return null;
  }
}

function exportViaWorker(payload: ExportPayload): Promise<Uint8Array> {
  const w = getWorker();
  if (!w) return Promise.reject(new Error("Worker unavailable"));

  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Worker export timed out"));
    }, 120_000);

    const onMessage = (event: MessageEvent<ExportWorkerResponse>) => {
      if (event.data?.id !== id) return;
      cleanup();
      if (event.data.ok) resolve(new Uint8Array(event.data.bytes));
      else reject(new Error(event.data.error || "Worker export failed"));
    };
    const onError = () => {
      cleanup();
      workerFailed = true;
      worker = null;
      reject(new Error("Worker crashed"));
    };
    const cleanup = () => {
      clearTimeout(timer);
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
    };

    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    const req: ExportWorkerRequest = { id, payload };
    w.postMessage(req);
  });
}

async function exportViaApi(payload: ExportPayload, apiFetch: FetchLike): Promise<Uint8Array> {
  const res = await apiFetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Export failed");
  }
  return new Uint8Array(await res.arrayBuffer());
}

/** Prefer local Worker export; fall back to POST /api/export. */
export async function exportPdfBytes(
  payload: ExportPayload,
  apiFetch: FetchLike,
): Promise<Uint8Array> {
  try {
    return await exportViaWorker(payload);
  } catch {
    return exportViaApi(payload, apiFetch);
  }
}
