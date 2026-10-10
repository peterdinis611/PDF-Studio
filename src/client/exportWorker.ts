/// <reference lib="webworker" />
import type { ExportPayload } from "../shared/types.js";

export type ExportWorkerRequest = {
  id: number;
  payload: ExportPayload;
};

export type ExportWorkerResponse =
  | { id: number; ok: true; bytes: ArrayBuffer }
  | { id: number; ok: false; error: string };

self.onmessage = async (event: MessageEvent<ExportWorkerRequest>) => {
  const { id, payload } = event.data;
  try {
    const { exportPdf } = await import("../server/services/pdfExport.js");
    const bytes = await exportPdf(payload);
    const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const response: ExportWorkerResponse = { id, ok: true, bytes: copy as ArrayBuffer };
    (self as DedicatedWorkerGlobalScope).postMessage(response, [response.bytes]);
  } catch (err) {
    const response: ExportWorkerResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : "Worker export failed",
    };
    (self as DedicatedWorkerGlobalScope).postMessage(response);
  }
};
