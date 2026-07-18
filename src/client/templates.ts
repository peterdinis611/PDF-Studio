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
  {
    id: "cv",
    name: "CV / Resume",
    description: "Professional resume with sidebar",
  },
  {
    id: "report",
    name: "Report",
    description: "One-page report with sections",
  },
  {
    id: "certificate",
    name: "Certificate",
    description: "Award certificate with border",
  },
  {
    id: "menu",
    name: "Menu",
    description: "Restaurant menu with courses",
  },
  {
    id: "proposal",
    name: "Proposal",
    description: "Project proposal overview",
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

function cvTemplate(): PdfDocument {
  const doc = base("CV / Resume");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 200, height: 842, fill: "#0f766e", strokeWidth: 0 }),
    createText(28, 48, {
      content: "Alex Morgan",
      fontSize: 22,
      fontWeight: "bold",
      color: "#ffffff",
      width: 150,
      height: 56,
    }),
    createText(28, 110, {
      content: "Product Designer",
      fontSize: 12,
      color: "#ccfbf1",
      width: 150,
      height: 24,
    }),
    createText(28, 160, {
      content: "CONTACT",
      fontSize: 11,
      fontWeight: "bold",
      color: "#99f6e4",
      width: 150,
      height: 20,
    }),
    createText(28, 185, {
      content: "alex@email.com\n+49 170 000000\nBerlin, DE\nlinkedin.com/in/alex",
      fontSize: 11,
      color: "#ecfdf5",
      width: 150,
      height: 90,
    }),
    createText(28, 300, {
      content: "SKILLS",
      fontSize: 11,
      fontWeight: "bold",
      color: "#99f6e4",
      width: 150,
      height: 20,
    }),
    createText(28, 325, {
      content: "UI / UX design\nFigma & prototyping\nDesign systems\nUser research\nHTML / CSS",
      fontSize: 11,
      color: "#ecfdf5",
      width: 150,
      height: 110,
    }),
    createText(28, 460, {
      content: "LANGUAGES",
      fontSize: 11,
      fontWeight: "bold",
      color: "#99f6e4",
      width: 150,
      height: 20,
    }),
    createText(28, 485, {
      content: "English — Fluent\nGerman — Intermediate",
      fontSize: 11,
      color: "#ecfdf5",
      width: 150,
      height: 50,
    }),
    createText(230, 48, {
      content: "Profile",
      fontSize: 16,
      fontWeight: "bold",
      color: "#0f766e",
      width: 320,
      height: 28,
    }),
    createLine(230, 78, { width: 320, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(230, 95, {
      content:
        "Product designer with 6+ years crafting clear interfaces and print-ready layouts. Focused on systems thinking and collaboration.",
      fontSize: 12,
      color: "#334155",
      width: 320,
      height: 70,
    }),
    createText(230, 180, {
      content: "Experience",
      fontSize: 16,
      fontWeight: "bold",
      color: "#0f766e",
      width: 320,
      height: 28,
    }),
    createLine(230, 210, { width: 320, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(230, 225, {
      content: "Senior Designer — Studio North",
      fontSize: 13,
      fontWeight: "bold",
      width: 320,
      height: 22,
    }),
    createText(230, 248, {
      content: "2021 — Present",
      fontSize: 11,
      color: "#64748b",
      width: 320,
      height: 18,
    }),
    createText(230, 270, {
      content: "Led redesign of client portals and established a shared component library used across three products.",
      fontSize: 12,
      color: "#334155",
      width: 320,
      height: 55,
    }),
    createText(230, 340, {
      content: "Designer — Bright Labs",
      fontSize: 13,
      fontWeight: "bold",
      width: 320,
      height: 22,
    }),
    createText(230, 363, {
      content: "2018 — 2021",
      fontSize: 11,
      color: "#64748b",
      width: 320,
      height: 18,
    }),
    createText(230, 385, {
      content: "Designed marketing sites and onboarding flows. Partnered with engineers on accessible UI patterns.",
      fontSize: 12,
      color: "#334155",
      width: 320,
      height: 55,
    }),
    createText(230, 460, {
      content: "Education",
      fontSize: 16,
      fontWeight: "bold",
      color: "#0f766e",
      width: 320,
      height: 28,
    }),
    createLine(230, 490, { width: 320, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(230, 505, {
      content: "B.A. Visual Communication\nBerlin University of the Arts — 2018",
      fontSize: 12,
      width: 320,
      height: 45,
    }),
  );
  return doc;
}

function reportTemplate(): PdfDocument {
  const doc = base("Report");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 72, fill: "#0f766e", strokeWidth: 0 }),
    createText(40, 24, {
      content: "Quarterly Report",
      fontSize: 22,
      fontWeight: "bold",
      color: "#ffffff",
      width: 320,
      height: 32,
    }),
    createText(380, 28, {
      content: "Q2 2026",
      fontSize: 14,
      color: "#ccfbf1",
      width: 170,
      height: 24,
      align: "right",
    }),
    createText(40, 100, {
      content: "Executive summary",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24,
    }),
    createText(40, 130, {
      content:
        "Revenue grew 12% quarter over quarter. Retention improved after the onboarding redesign. Key risks remain around capacity and vendor costs.",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 55,
    }),
    createRect(40, 200, {
      width: 155,
      height: 90,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8,
    }),
    createText(50, 215, {
      content: "Revenue\n€248k\n+12% QoQ",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 135,
      height: 65,
    }),
    createRect(220, 200, {
      width: 155,
      height: 90,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8,
    }),
    createText(230, 215, {
      content: "Customers\n1,420\n+8% QoQ",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 135,
      height: 65,
    }),
    createRect(400, 200, {
      width: 155,
      height: 90,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8,
    }),
    createText(410, 215, {
      content: "NPS\n52\n+4 pts",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 135,
      height: 65,
    }),
    createText(40, 320, {
      content: "Highlights",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24,
    }),
    createLine(40, 348, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(40, 365, {
      content:
        "• Launched self-serve billing and reduced support tickets by 18%\n• Expanded team with two designers and one engineer\n• Pilot program with three enterprise accounts closed",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 70,
    }),
    createText(40, 460, {
      content: "Next steps",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24,
    }),
    createLine(40, 488, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(40, 505, {
      content:
        "1. Ship analytics dashboard for customer success\n2. Finalize Q3 hiring plan and budget\n3. Review vendor contracts before renewal",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 70,
    }),
    createText(40, 780, {
      content: "Confidential — Internal use only",
      fontSize: 10,
      color: "#64748b",
      width: 515,
      height: 18,
    }),
  );
  return doc;
}

function certificateTemplate(): PdfDocument {
  const doc = base("Certificate");
  const els = doc.pages[0].elements;
  els.push(
    createRect(28, 28, {
      width: 539,
      height: 786,
      fill: "#faf9f6",
      stroke: "#0f766e",
      strokeWidth: 3,
    }),
    createRect(40, 40, {
      width: 515,
      height: 762,
      fill: "#faf9f6",
      stroke: "#0d9488",
      strokeWidth: 1,
    }),
    createText(80, 120, {
      content: "CERTIFICATE OF COMPLETION",
      fontSize: 14,
      fontWeight: "bold",
      color: "#0f766e",
      width: 435,
      height: 28,
      align: "center",
      letterSpacing: 2,
    }),
    createLine(180, 160, { width: 235, height: 0, stroke: "#0d9488", strokeWidth: 2 }),
    createText(80, 200, {
      content: "This is to certify that",
      fontSize: 14,
      color: "#64748b",
      width: 435,
      height: 24,
      align: "center",
    }),
    createText(80, 250, {
      content: "Jordan Lee",
      fontSize: 36,
      fontWeight: "bold",
      color: "#1a1a1a",
      width: 435,
      height: 48,
      align: "center",
    }),
    createText(80, 320, {
      content:
        "has successfully completed the program\nPDF Design Fundamentals",
      fontSize: 15,
      color: "#334155",
      width: 435,
      height: 50,
      align: "center",
    }),
    createRect(200, 400, {
      width: 195,
      height: 8,
      fill: "#0d9488",
      strokeWidth: 0,
      cornerRadius: 4,
    }),
    createText(80, 440, {
      content: "Awarded on 18 July 2026",
      fontSize: 13,
      color: "#475569",
      width: 435,
      height: 24,
      align: "center",
    }),
    createLine(90, 620, { width: 160, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(90, 635, {
      content: "Director\nAlex Morgan",
      fontSize: 12,
      color: "#475569",
      width: 160,
      height: 40,
      align: "center",
    }),
    createLine(345, 620, { width: 160, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(345, 635, {
      content: "Instructor\nSam Rivera",
      fontSize: 12,
      color: "#475569",
      width: 160,
      height: 40,
      align: "center",
    }),
    createText(80, 720, {
      content: "PDF Studio Academy",
      fontSize: 12,
      fontWeight: "bold",
      color: "#0f766e",
      width: 435,
      height: 24,
      align: "center",
    }),
  );
  return doc;
}

function menuTemplate(): PdfDocument {
  const doc = base("Menu");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 100, fill: "#0f766e", strokeWidth: 0 }),
    createText(40, 28, {
      content: "The Garden Table",
      fontSize: 26,
      fontWeight: "bold",
      color: "#ffffff",
      width: 400,
      height: 36,
    }),
    createText(40, 68, {
      content: "Seasonal menu · Dinner",
      fontSize: 13,
      color: "#ccfbf1",
      width: 400,
      height: 22,
    }),
    createText(40, 130, {
      content: "Starters",
      fontSize: 18,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 28,
    }),
    createLine(40, 160, { width: 515, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(40, 180, {
      content: "Heirloom tomato salad",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22,
    }),
    createText(430, 180, {
      content: "€12",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right",
    }),
    createText(40, 202, {
      content: "Basil oil, aged balsamic, grilled sourdough",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20,
    }),
    createText(40, 240, {
      content: "Soup of the day",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22,
    }),
    createText(430, 240, {
      content: "€9",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right",
    }),
    createText(40, 262, {
      content: "Ask your server for today's potage",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20,
    }),
    createText(40, 320, {
      content: "Mains",
      fontSize: 18,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 28,
    }),
    createLine(40, 350, { width: 515, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(40, 370, {
      content: "Herb-roasted chicken",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22,
    }),
    createText(430, 370, {
      content: "€24",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right",
    }),
    createText(40, 392, {
      content: "Lemon thyme jus, roasted roots, greens",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20,
    }),
    createText(40, 430, {
      content: "Grilled sea bass",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22,
    }),
    createText(430, 430, {
      content: "€28",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right",
    }),
    createText(40, 452, {
      content: "Fennel salad, citrus beurre blanc",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20,
    }),
    createText(40, 490, {
      content: "Mushroom risotto",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22,
    }),
    createText(430, 490, {
      content: "€21",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right",
    }),
    createText(40, 512, {
      content: "Porcini, parmesan, chives  ·  vegetarian",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20,
    }),
    createText(40, 570, {
      content: "Desserts",
      fontSize: 18,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 28,
    }),
    createLine(40, 600, { width: 515, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(40, 620, {
      content: "Dark chocolate tart",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22,
    }),
    createText(430, 620, {
      content: "€11",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right",
    }),
    createText(40, 642, {
      content: "Sea salt caramel, whipped cream",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20,
    }),
    createText(40, 680, {
      content: "Seasonal fruit plate",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22,
    }),
    createText(430, 680, {
      content: "€9",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right",
    }),
    createText(40, 780, {
      content: "Please inform us of any allergies.",
      fontSize: 11,
      color: "#64748b",
      width: 515,
      height: 20,
    }),
  );
  return doc;
}

function proposalTemplate(): PdfDocument {
  const doc = base("Proposal");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 110, fill: "#0f766e", strokeWidth: 0 }),
    createText(40, 30, {
      content: "Project Proposal",
      fontSize: 26,
      fontWeight: "bold",
      color: "#ffffff",
      width: 400,
      height: 36,
    }),
    createText(40, 72, {
      content: "Website redesign for Acme Corp",
      fontSize: 14,
      color: "#ccfbf1",
      width: 400,
      height: 24,
    }),
    createText(40, 140, {
      content: "Prepared for",
      fontSize: 11,
      fontWeight: "bold",
      color: "#0f766e",
      width: 240,
      height: 18,
    }),
    createText(40, 160, {
      content: "Acme Corp\nJordan Lee, Marketing Lead",
      fontSize: 12,
      width: 240,
      height: 40,
    }),
    createText(320, 140, {
      content: "Prepared by",
      fontSize: 11,
      fontWeight: "bold",
      color: "#0f766e",
      width: 230,
      height: 18,
    }),
    createText(320, 160, {
      content: "PDF Studio\nAlex Morgan\n18 July 2026",
      fontSize: 12,
      width: 230,
      height: 55,
    }),
    createLine(40, 230, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(40, 255, {
      content: "Overview",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24,
    }),
    createText(40, 285, {
      content:
        "We propose a redesign of the marketing site to improve clarity, conversion, and brand consistency. Work includes discovery, wireframes, visual design, and handoff.",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 60,
    }),
    createText(40, 360, {
      content: "Scope",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24,
    }),
    createText(40, 390, {
      content:
        "• Home, product, pricing, and about pages\n• Responsive layouts for desktop and mobile\n• Component library for future pages\n• Two rounds of revisions included",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 80,
    }),
    createText(40, 490, {
      content: "Timeline & investment",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24,
    }),
    createRect(40, 525, {
      width: 250,
      height: 100,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8,
    }),
    createText(55, 545, {
      content: "Timeline\n6 weeks\nKickoff → launch",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 220,
      height: 70,
    }),
    createRect(305, 525, {
      width: 250,
      height: 100,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8,
    }),
    createText(320, 545, {
      content: "Investment\n€8,400\nFixed project fee",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 220,
      height: 70,
    }),
    createText(40, 660, {
      content: "Next step",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24,
    }),
    createText(40, 690, {
      content: "Approve this proposal and we will schedule a kickoff within five business days.",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 40,
    }),
    createText(40, 780, {
      content: "Valid for 30 days from the date above.",
      fontSize: 10,
      color: "#64748b",
      width: 515,
      height: 18,
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
    case "cv":
      return cvTemplate();
    case "report":
      return reportTemplate();
    case "certificate":
      return certificateTemplate();
    case "menu":
      return menuTemplate();
    case "proposal":
      return proposalTemplate();
    default:
      return base("Untitled document");
  }
}
