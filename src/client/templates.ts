import type { PdfDocument } from "../shared/types.js";
import { blankPage, createLine, createRect, createText, uid } from "./factories.js";

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
}

export const TEMPLATE_LIST: TemplateMeta[] = [
  {
    id: "blank",
    name: "Blank A4",
    description: "Empty page to start from scratch",
  },
  {
    id: "invoice",
    name: "Invoice",
    description: "Simple invoice with header and totals",
  },
  {
    id: "letter",
    name: "Letter",
    description: "Formal letter with sender and body",
  },
  {
    id: "flyer",
    name: "Flyer",
    description: "Bold promo flyer with accent block",
  },
];

function base(name: string, pageSize: PdfDocument["pageSize"] = "a4"): PdfDocument {
  return {
    id: uid(),
    name,
    pageSize,
    pageBackground: "#faf9f6",
    showGrid: false,
    pages: [blankPage()],
    updatedAt: new Date().toISOString(),
  };
}

function invoiceTemplate(): PdfDocument {
  const doc = base("Invoice");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 90, fill: "#0f766e", strokeWidth: 0 }),
    createText(40, 28, {
      content: "INVOICE",
      fontSize: 28,
      fontWeight: "bold",
      color: "#ffffff",
      width: 200,
      height: 36,
    }),
    createText(360, 32, {
      content: "No. 00123\nDue: 30 days",
      fontSize: 12,
      color: "#ecfdf5",
      width: 180,
      height: 40,
      align: "right",
    }),
    createText(40, 120, {
      content: "Bill to\nAcme Corp\n123 Market Street\nBerlin",
      fontSize: 12,
      width: 220,
      height: 80,
    }),
    createText(40, 230, {
      content: "Description                          Qty    Price",
      fontSize: 11,
      fontWeight: "bold",
      width: 500,
      height: 20,
    }),
    createLine(40, 255, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(40, 270, {
      content: "Design services                       1    €1,200\nHosting (annual)                      1      €240",
      fontSize: 12,
      width: 515,
      height: 50,
    }),
    createLine(40, 340, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(340, 360, {
      content: "Subtotal          €1,440\nTax (19%)           €274\nTotal             €1,714",
      fontSize: 13,
      fontWeight: "bold",
      width: 215,
      height: 70,
      align: "right",
    }),
    createText(40, 760, {
      content: "Thank you for your business.",
      fontSize: 11,
      color: "#64748b",
      width: 300,
      height: 20,
    }),
  );
  return doc;
}

function letterTemplate(): PdfDocument {
  const doc = base("Letter");
  const els = doc.pages[0].elements;
  els.push(
    createText(60, 60, {
      content: "Your Name\nyour@email.com\n+49 000 000000",
      fontSize: 11,
      color: "#475569",
      width: 220,
      height: 60,
    }),
    createText(60, 160, {
      content: "Recipient Name\nCompany\nAddress line",
      fontSize: 12,
      width: 260,
      height: 60,
    }),
    createText(60, 250, {
      content: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      fontSize: 12,
      width: 260,
      height: 24,
    }),
    createText(60, 300, {
      content: "Dear Recipient,",
      fontSize: 14,
      width: 400,
      height: 24,
    }),
    createText(60, 340, {
      content:
        "I am writing to follow up on our recent conversation. Please find the details below and let me know if you have any questions.\n\nI look forward to hearing from you.",
      fontSize: 13,
      width: 475,
      height: 140,
    }),
    createText(60, 520, {
      content: "Kind regards,\nYour Name",
      fontSize: 13,
      width: 260,
      height: 50,
    }),
  );
  return doc;
}

function flyerTemplate(): PdfDocument {
  const doc = base("Flyer");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 842, fill: "#faf9f6", strokeWidth: 0 }),
    createRect(40, 40, {
      width: 515,
      height: 280,
      fill: "#0d9488",
      strokeWidth: 0,
      cornerRadius: 12,
    }),
    createText(70, 100, {
      content: "Summer\nWorkshop",
      fontSize: 42,
      fontWeight: "bold",
      color: "#ffffff",
      width: 400,
      height: 110,
    }),
    createText(70, 230, {
      content: "Design systems · Live demos · Networking",
      fontSize: 14,
      color: "#ccfbf1",
      width: 420,
      height: 28,
    }),
    createText(70, 380, {
      content: "Saturday 10:00 · Studio Hall",
      fontSize: 20,
      fontWeight: "bold",
      width: 420,
      height: 32,
    }),
    createText(70, 430, {
      content:
        "Join us for a hands-on session on building polished PDFs and print layouts. Beginners welcome.",
      fontSize: 14,
      color: "#334155",
      width: 450,
      height: 70,
    }),
    createRect(70, 540, {
      width: 180,
      height: 48,
      fill: "#1a1a1a",
      strokeWidth: 0,
      cornerRadius: 8,
    }),
    createText(70, 552, {
      content: "Reserve a seat",
      fontSize: 16,
      fontWeight: "bold",
      color: "#ffffff",
      width: 180,
      height: 28,
      align: "center",
    }),
  );
  return doc;
}

export function buildTemplate(id: string): PdfDocument {
  switch (id) {
    case "invoice":
      return invoiceTemplate();
    case "letter":
      return letterTemplate();
    case "flyer":
      return flyerTemplate();
    default:
      return base("Untitled document");
  }
}
