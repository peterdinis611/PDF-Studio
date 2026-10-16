import {
  PAGE_SIZES,
  GOOGLE_FONTS,
  type DocComment,
  type ExportSettings,
  type GuideLine,
  type DocBookmark,
  type PdfDocument,
  type PdfElement,
  type PdfPage,
  type TextElement,
  type RectElement,
  type EllipseElement,
  type StickyElement,
  type TableElement,
  type ImageElement,
} from "../shared/types.js";
import {
  blankPage,
  cloneElement,
  createEllipse,
  createFormCheck,
  createFormSelect,
  createFormText,
  createImage,
  createSignature,
  createLine,
  createMarkup,
  createRect,
  createText,
  defaultDoc,
  elementLabel,
  escapeHtml,
  uid,
} from "./factories.js";
import { scheduleEditorTour, startEditorTour } from "./tour.js";
import { markdownToHtml } from "../shared/markdown.js";
import {
  allFontOptions,
  ensureCustomFontFace,
  ensureGoogleFontStylesheet,
  fontCssFamily,
  googleFamilyCssName,
} from "./fonts.js";
import { HistoryStack } from "./history.js";
import { iconSvg } from "./icons.js";
import { loremIpsum, type LoremSize } from "./lorem.js";
import {
  LIBRARY_CATEGORIES,
  LIBRARY_ITEMS,
  createFromLibrary,
  searchLibraryItems,
  type LibraryCategory,
  type LibraryItem,
} from "./library.js";
import { apiFetch, getSessionId, storeGet, storeSet } from "./session.js";
import {
  bytesToBase64,
  clearPersistedImportedPdf,
  clearSessionImportedPdf,
  getSessionImportedPdfBytes,
  importPdfInBrowser,
  persistSessionImportedPdf,
  restoreSessionImportedPdf,
} from "./pdfImport.js";
import { docNeedsPdfReattach, reattachPdfSession } from "./pdfReattach.js";
import {
  getCachedPdfPagePreview,
  invalidatePdfPreviewCache,
  prefetchPdfPagePreviews,
  recommendedCanvasUnderlayScale,
  recommendedThumbScale,
  renderPdfPagePreview,
  renderPdfThumbsProgressive,
} from "./pdfPagePreview.js";
import {
  buildPortableStudioFile,
  hydratePortableStudioFile,
  persistErrorMessage,
} from "./studioJson.js";
import { computeSmartGuides, type SmartGuide } from "./smartGuides.js";
import { TEMPLATE_LIST, buildTemplate } from "./templates.js";
import {
  applyMailMerge,
  applyMailMergePerRow,
  appendToken,
  parseMergeFile,
  type MailMergeRow,
  type MergeCondition,
  type MergeOutputMode,
} from "./mailMerge.js";
import { auditMergeFields } from "./fieldAudit.js";
import { exportPngProofZip } from "./pngProof.js";
import { runPreflight } from "./preflight.js";
import {
  createESignPackage,
  exportTrailText,
  loadESignPackage,
  markSignerSigned,
  type ESignPackage,
} from "./eSign.js";
import { createLocalShare, loadShare } from "./shareLink.js";
import {
  deleteUserTemplate,
  listUserTemplates,
  loadUserTemplate,
  renameUserTemplate,
  saveUserTemplate,
  type UserTemplateMeta,
} from "./userTemplates.js";
import {
  extractPagesToDoc,
  extractPagesToPdfBytes,
  mergePdfFileIntoDoc,
  rotatePageInDoc,
  splitDocToPdfParts,
  syncSessionPdfToStudioPages,
} from "./pdfPageUtils.js";
import { exportPdfBytes } from "./clientExport.js";
import { initHomePreview } from "./homePreview.js";
import JSZip from "jszip";
import {
  MARGIN_PRESETS,
  SHORTCUT_GROUPS,
  deleteTableCol,
  deleteTableRow,
  distributeElements,
  insertTableCol,
  insertTableRow,
  marginGuideLines,
  resizeTable,
  type MarginPreset,
} from "./editorExtras.js";

const STORAGE_KEY = "doc";
const DOCS_INDEX_KEY = "docs";
const THEME_KEY = "pdf-studio-theme";
const SETTINGS_KEY = "settings";
const FAV_KEY = "favorites";
const RECENT_KEY = "recent";
const BRAND_KEY = "brand";
const EXPORT_KEY = "export";
const AUTHOR_KEY = "author";
const docKey = (id: string) => `doc:${id}`;

type Tool =
  | "select"
  | "text"
  | "rect"
  | "ellipse"
  | "line"
  | "place"
  | "comment"
  | "highlight"
  | "underline"
  | "strike";

type DragState =
  | {
      mode: "move";
      ids: string[];
      startX: number;
      startY: number;
      origins: { id: string; x: number; y: number }[];
      elMap: Map<string, PdfElement>;
    }
  | {
      mode: "resize";
      id: string;
      startX: number;
      startY: number;
      origW: number;
      origH: number;
    }
  | {
      mode: "pan";
      startX: number;
      startY: number;
      origPanX: number;
      origPanY: number;
    }
  | {
      mode: "marquee";
      startX: number;
      startY: number;
      x: number;
      y: number;
      w: number;
      h: number;
    }
  | {
      mode: "guide";
      axis: "x" | "y";
      id: string;
    };

interface BrandKit {
  colors: string[];
  logoUrl: string;
  logoName: string;
  defaultFont: string;
  name: string;
}

interface DocIndexEntry {
  id: string;
  name: string;
  updatedAt: string;
}

function normalizeTextElement(el: PdfElement): PdfElement {
  const withVisible = { ...el, visible: el.visible !== false };
  if (withVisible.type !== "text") {
    if (withVisible.type === "image" && !withVisible.objectFit) {
      return { ...withVisible, objectFit: "contain" };
    }
    return withVisible;
  }
  const t = withVisible as TextElement;
  return {
    ...t,
    fontFamily: t.fontFamily || "Helvetica",
    fontStyle: t.fontStyle ?? "normal",
    underline: t.underline ?? false,
    lineHeight: t.lineHeight ?? 1.25,
    letterSpacing: t.letterSpacing ?? 0,
    listStyle: t.listStyle ?? "none",
  };
}

function normalizeDoc(doc: PdfDocument): PdfDocument {
  const normalized: PdfDocument = {
    ...doc,
    pageBackground: doc.pageBackground || "#fcfaf5",
    marginGuide: typeof doc.marginGuide === "number" ? doc.marginGuide : 40,
    guides: doc.guides || [],
    comments: doc.comments || [],
    bookmarks: doc.bookmarks || [],
    customFonts: doc.customFonts || [],
    master: doc.master || { header: [], footer: [] },
    watermark: doc.watermark ?? null,
    pages: doc.pages.map((p) => ({
      ...p,
      applyMaster: p.applyMaster !== false,
      elements: p.elements.map(normalizeTextElement),
    })),
  };

  if (normalized.master) {
    normalized.master = {
      header: (normalized.master.header || []).map(normalizeTextElement),
      footer: (normalized.master.footer || []).map(normalizeTextElement),
    };
  }

  // Editable imports keep mode metadata: text is already in elements, no underlay needed.
  // Overlay imports keep metadata so IndexedDB restore / re-attach can reconnect the PDF.
  if (
    normalized.importedPdf?.ephemeral &&
    normalized.importedPdf.mode === "editable" &&
    !getSessionImportedPdfBytes()
  ) {
    normalized.importedPdf = {
      ...normalized.importedPdf,
      ephemeral: false,
    };
  }

  return normalized;
}

/** Crop transparent padding from a signature canvas (device pixels). */
function trimSignatureCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext("2d");
  if (!ctx) return source;
  const { width, height } = source;
  const { data } = ctx.getImageData(0, 0, width, height);
  let top = height;
  let left = width;
  let right = 0;
  let bottom = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < left || bottom < top) return source;
  const pad = Math.round(Math.min(width, height) * 0.04);
  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  right = Math.min(width - 1, right + pad);
  bottom = Math.min(height - 1, bottom + pad);
  const w = right - left + 1;
  const h = bottom - top + 1;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const outCtx = out.getContext("2d");
  if (!outCtx) return source;
  outCtx.drawImage(source, left, top, w, h, 0, 0, w, h);
  return out;
}

function pdfEditor() {
  const history = new HistoryStack();
  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  let moveRaf = 0;
  let pendingMove: MouseEvent | null = null;
  let skipHistory = false;
  let clipboard: PdfElement[] = [];
  let spaceDown = false;

  return {
    doc: defaultDoc() as PdfDocument,
    activePageIndex: 0,
    selectedIds: [] as string[],
    tool: "select" as Tool,
    zoom: 0.85,
    panX: 0,
    panY: 0,
    exporting: false,
    editingTextId: null as string | null,
    drag: null as DragState | null,
    smartGuides: [] as SmartGuide[],
    marquee: null as { x: number; y: number; w: number; h: number } | null,
    showTemplates: false,
    showLibrary: true,
    leftRail: "insert" as "insert" | "pages" | "bookmarks",
    isCompact: false,
    showLeftPanel: true,
    showInspectorPanel: true,
    showExportModal: false,
    showPdfImportModal: false,
    showSignatureModal: false,
    showFindReplace: false,
    showBrandKit: false,
    showDocLibrary: false,
    showMailMerge: false,
    showPreflight: false,
    showESign: false,
    showComments: false,
    showWatermarkModal: false,
    bookmarkDraft: "",
    batesPrefix: "",
    batesStart: 1,
    batesPad: 4,
    pageCropDraft: { top: 0, right: 0, bottom: 0, left: 0 },
    mailMergeHeaders: [] as string[],
    mailMergeRows: [] as MailMergeRow[],
    mailMergePreview: null as MailMergeRow | null,
    mailMergeFileName: "",
    mailMergeMode: "single" as MergeOutputMode,
    mailMergeSkipWhen: null as MergeCondition | null,
    mailMergeSeqStart: 1,
    fieldAuditIssues: [] as { token: string; severity: string; message: string }[],
    preflightIssues: [] as { level: string; code: string; message: string }[],
    eSignPkg: null as ESignPackage | null,
    eSignNames: "",
    userTemplates: [] as UserTemplateMeta[],
    exportPassword: "",
    librarySelectedIds: [] as string[],
    pdfImportChoice: "overlay" as "overlay" | "editable",
    pdfImportOcr: false,
    pdfImportFile: null as File | null,
    pdfImportFileName: "",
    pdfImportBusy: false,
    pdfImportDragOver: false,
    editingMaster: false,
    reviewMode: false,
    formPreviewMode: false,
    formPreviewValues: {} as Record<string, string | boolean>,
    pdfUnderlaySrc: null as string | null,
    pageThumbUnderlays: {} as Record<number, string | null>,
    pageJumpDraft: "1",
    thumbsLoading: false,
    _thumbGen: 0,
    _underlayGen: 0,
    canvasUnderlayScale: recommendedCanvasUnderlayScale(0.85),
    thumbUnderlayScale: recommendedThumbScale(),
    pdfImportMode: "overlay" as "overlay" | "editable" | "reattach",
    commentPlacement: null as { x: number; y: number } | null,
    watermarkDraft: {
      type: "text" as "text" | "image",
      text: "DRAFT",
      opacity: 0.12,
      rotation: -30,
      fontSize: 56,
      color: "#a39a8e",
      src: "",
    },
    libraryCategory: "all" as LibraryCategory,
    libraryItems: LIBRARY_ITEMS,
    libraryCategories: LIBRARY_CATEGORIES,
    libraryQuery: "",
    libraryView: "list" as "list" | "grid",
    libraryKeepPlacing: false,
    favorites: [] as string[],
    recentIds: [] as string[],
    pendingLibraryKind: null as LibraryItem["kind"] | null,
    placeHint: false,
    signatureTab: "draw" as "draw" | "type" | "upload",
    signatureInk: "#1a1815",
    signatureTyped: "",
    signatureBusy: false,
    signatureHasInk: false,
    signaturePlace: null as { x: number; y: number } | null,
    signatureReplaceId: null as string | null,
    templates: TEMPLATE_LIST,
    snapEnabled: true,
    canUndo: false,
    canRedo: false,
    justInsertedId: null as string | null,
    theme: "dark" as "dark" | "light",
    showSettings: false,
    showFileMenu: false,
    showGuides: false,
    showGrid: false,
    showRulers: true,
    showShortcuts: false,
    saveState: "idle" as "idle" | "saving" | "saved",
    toast: "" as string,
    toastTimer: 0 as number,
    masterZone: "header" as "header" | "footer",
    findHighlightId: null as string | null,
    replaceImageId: null as string | null,
    layerDragId: null as string | null,
    shortcutGroups: SHORTCUT_GROUPS,
    marginPresets: MARGIN_PRESETS,
    fontOptions: allFontOptions(),
    googleFontQuery: "",
    googleFontResults: [] as { id: string; label: string; googleFamily: string }[],
    googleFontsBusy: false,
    googleFontsFromApi: false,
    findQuery: "",
    replaceQuery: "",
    findMatches: [] as { pageIndex: number; elId: string; field: string }[],
    findIndex: -1,
    brand: {
      colors: ["#b0281b", "#e2523a", "#1a1815", "#f3efe7"],
      logoUrl: "",
      logoName: "",
      defaultFont: "Helvetica",
      name: "My Brand",
    } as BrandKit,
    exportSettings: {
      margin: 0,
      imageQuality: 0.85,
      flatten: false,
      pdfaLite: false,
      intent: "screen",
      compressImages: true,
      includeComments: false,
      includeWatermark: true,
    } as ExportSettings,
    authorName: "Reviewer",
    docLibrary: [] as DocIndexEntry[],
    commentDraft: "",

    get selectedId(): string | null {
      return this.selectedIds[0] ?? null;
    },

    set selectedId(id: string | null) {
      this.selectedIds = id ? [id] : [];
    },

    get pageSize() {
      return PAGE_SIZES[this.doc.pageSize] ?? PAGE_SIZES.a4;
    },

    hasSessionPdf() {
      return Boolean(getSessionImportedPdfBytes());
    },

    /** Overlay-import page with a PDF backdrop (even before hi-res underlay finishes). */
    get pageHasPdfBackdrop(): boolean {
      if (this.editingMaster) return false;
      if (this.doc.importedPdf?.mode === "editable") return false;
      const page = this.doc.pages[this.activePageIndex];
      if (typeof page?.sourcePageIndex !== "number") return false;
      return this.hasSessionPdf() || Boolean(this.pdfUnderlaySrc);
    },

    /** True when page references an imported PDF (backdrop present or waiting for re-attach). */
    get pageExpectsPdfBackdrop(): boolean {
      if (this.editingMaster) return false;
      if (this.doc.importedPdf?.mode === "editable") return false;
      const page = this.doc.pages[this.activePageIndex];
      return typeof page?.sourcePageIndex === "number";
    },

    pdfNeedsReattach() {
      if (this.doc.importedPdf?.mode === "editable") return false;
      return docNeedsPdfReattach(this.doc.pages) && !this.hasSessionPdf();
    },

    openPdfImportModal(mode: "overlay" | "editable" = "overlay") {
      this.pdfImportChoice = mode;
      this.pdfImportFile = null;
      this.pdfImportFileName = "";
      this.pdfImportBusy = false;
      this.pdfImportDragOver = false;
      this.showPdfImportModal = true;
    },

    closePdfImportModal() {
      if (this.pdfImportBusy) return;
      this.showPdfImportModal = false;
      this.pdfImportFile = null;
      this.pdfImportFileName = "";
      this.pdfImportDragOver = false;
    },

    setPdfImportFile(file: File | null) {
      if (!file) {
        this.pdfImportFile = null;
        this.pdfImportFileName = "";
        return;
      }
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        this.showToast("Please choose a PDF file.", 3200);
        return;
      }
      this.pdfImportFile = file;
      this.pdfImportFileName = file.name;
    },

    onPdfImportDialogFile(event: Event) {
      const input = event.target as HTMLInputElement;
      this.setPdfImportFile(input.files?.[0] ?? null);
      input.value = "";
    },

    onPdfImportDrop(event: DragEvent) {
      this.pdfImportDragOver = false;
      const file = event.dataTransfer?.files?.[0] ?? null;
      this.setPdfImportFile(file);
    },

    async confirmPdfImport() {
      const file = this.pdfImportFile;
      if (!file || this.pdfImportBusy) return;
      this.pdfImportBusy = true;
      try {
        await this.runPdfImport(file, this.pdfImportChoice);
        this.showPdfImportModal = false;
        this.pdfImportFile = null;
        this.pdfImportFileName = "";
      } finally {
        this.pdfImportBusy = false;
      }
    },

    requestPdfReattach() {
      this.pdfImportMode = "reattach";
      (this as unknown as { $refs: { pdfInput?: HTMLInputElement } }).$refs.pdfInput?.click();
    },

    get activePage(): PdfPage {
      return this.doc.pages[this.activePageIndex] ?? this.doc.pages[0];
    },

    get selected(): PdfElement | null {
      if (!this.selectedIds.length) return null;
      return this.workingElements.find((e) => e.id === this.selectedIds[0]) ?? null;
    },

    get selectedElements(): PdfElement[] {
      return this.workingElements.filter((e) => this.selectedIds.includes(e.id));
    },

    get selectedIndex(): number {
      if (!this.selectedIds.length) return -1;
      return this.workingElements.findIndex((e) => e.id === this.selectedIds[0]);
    },

    get layers() {
      return [...this.workingElements].reverse().map((el) => ({
        id: el.id,
        label: elementLabel(el),
        type: el.type,
        locked: el.locked,
        groupId: el.groupId,
        visible: el.visible !== false,
      }));
    },

    get pageComments(): DocComment[] {
      return (this.doc.comments || []).filter((c) => c.pageId === this.activePage.id);
    },

    get filteredLibrary() {
      let items = this.libraryItems;
      if (this.libraryCategory === "favorites") {
        const fav = new Set(this.favorites);
        items = items.filter((i) => fav.has(i.id));
      } else if (this.libraryCategory === "recent") {
        const byId = new Map(this.libraryItems.map((i) => [i.id, i]));
        items = this.recentIds.map((id) => byId.get(id)).filter(Boolean) as LibraryItem[];
      } else if (this.libraryCategory !== "all") {
        items = items.filter((i) => i.category === this.libraryCategory);
      }
      if (!this.libraryQuery.trim()) return items;
      return searchLibraryItems(items, this.libraryQuery);
    },

    get filteredLibraryCount() {
      return this.filteredLibrary.length;
    },

    get pageStyle() {
      const { width, height } = this.pageSize;
      const rot = this.activePage?.rotation || 0;
      return {
        width: `${width * this.zoom}px`,
        height: `${height * this.zoom}px`,
        backgroundColor: this.doc.pageBackground || "#fcfaf5",
        transform: `translate(${this.panX}px, ${this.panY}px) rotate(${rot}deg)`,
      };
    },

    get viewportStyle() {
      return {
        cursor: spaceDown || this.drag?.mode === "pan" ? "grab" : undefined,
      };
    },

    get pageThumbStyle() {
      const { width, height } = this.pageSize;
      return { aspectRatio: `${width} / ${height}` };
    },

    /** Skip per-element thumb HTML on large docs (Acrobat-style raster thumbs only). */
    get thumbShowElements(): boolean {
      const pages = this.doc.pages.length;
      if (pages > 24) return false;
      let els = 0;
      for (const p of this.doc.pages) els += p.elements?.length || 0;
      return els <= 180;
    },

    get pageLabel(): string {
      return `${this.activePageIndex + 1} / ${this.doc.pages.length}`;
    },

    get workingElements(): PdfElement[] {
      if (this.editingMaster) {
        if (!this.doc.master) this.doc.master = { header: [], footer: [] };
        return this.masterZone === "footer" ? this.doc.master.footer : this.doc.master.header;
      }
      return this.activePage.elements;
    },

    get displayElements(): PdfElement[] {
      return this.workingElements;
    },

    get marginGuidePt(): number {
      return typeof this.doc.marginGuide === "number" ? this.doc.marginGuide : 40;
    },

    showToast(message: string, ms = 2800) {
      this.toast = message;
      if (this.toastTimer) window.clearTimeout(this.toastTimer);
      this.toastTimer = window.setTimeout(() => {
        this.toast = "";
        this.toastTimer = 0;
      }, ms) as unknown as number;
    },

    get masterPreviewElements(): PdfElement[] {
      if (this.editingMaster) return [];
      if (this.activePage.applyMaster === false) return [];
      return [...(this.doc.master?.header || []), ...(this.doc.master?.footer || [])];
    },

    async init() {
      getSessionId();
      this.canvasUnderlayScale = recommendedCanvasUnderlayScale(this.zoom || 0.85);
      this.thumbUnderlayScale = recommendedThumbScale();
      const params = new URLSearchParams(window.location.search);
      const templateId = params.get("template");
      const fresh = params.get("new") === "1";
      const openId = params.get("doc");

      const savedTheme = localStorage.getItem(THEME_KEY);
      this.theme =
        savedTheme === "light" || savedTheme === "dark"
          ? savedTheme
          : (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark";
      this.applyTheme(this.theme);

      try {
        const settings = JSON.parse(storeGet(SETTINGS_KEY) || "{}") as {
          showGuides?: boolean;
          showGrid?: boolean;
          snapEnabled?: boolean;
          showRulers?: boolean;
        };
        if (typeof settings.showGuides === "boolean") this.showGuides = settings.showGuides;
        if (typeof settings.showGrid === "boolean") this.showGrid = settings.showGrid;
        if (typeof settings.snapEnabled === "boolean") this.snapEnabled = settings.snapEnabled;
        if (typeof settings.showRulers === "boolean") this.showRulers = settings.showRulers;
      } catch {
        /* ignore */
      }

      try {
        this.favorites = JSON.parse(storeGet(FAV_KEY) || "[]") as string[];
        this.recentIds = JSON.parse(storeGet(RECENT_KEY) || "[]") as string[];
      } catch {
        this.favorites = [];
        this.recentIds = [];
      }

      try {
        const brand = JSON.parse(storeGet(BRAND_KEY) || "null");
        if (brand) this.brand = { ...this.brand, ...brand };
      } catch {
        /* ignore */
      }

      try {
        const exp = JSON.parse(storeGet(EXPORT_KEY) || "null");
        if (exp) this.exportSettings = { ...this.exportSettings, ...exp };
      } catch {
        /* ignore */
      }

      this.authorName = storeGet(AUTHOR_KEY) || "Reviewer";
      this.refreshDocLibrary();
      this.refreshUserTemplates();

      const shareId = new URLSearchParams(window.location.search).get("share");
      if (shareId) {
        const rec = loadShare(shareId);
        if (rec) {
          try {
            const raw = JSON.parse(rec.payload) as unknown;
            void hydratePortableStudioFile(raw, {
              apiFetch: (url, init) => apiFetch(url, init),
              normalizeDoc,
            }).then(async (doc) => {
              this.doc = doc;
              this.activePageIndex = 0;
              this.selectedIds = [];
              history.reset(this.doc);
              this.syncHistoryFlags();
              this.syncDocumentFonts();
              this.commit(false);
              await this.persistImportedPdfForDoc();
              await this.refreshPdfUnderlay();
              void this.refreshPageThumbUnderlays();
              this.showToast(`Opened shared “${rec.name}”`);
            });
          } catch {
            this.showToast("Could not open share link", 4000);
          }
        }
      }

      if (templateId) {
        this.doc = normalizeDoc(buildTemplate(templateId));
        this.commit(true);
      } else if (fresh) {
        this.doc = normalizeDoc(defaultDoc());
        this.commit(true);
      } else if (openId) {
        const saved = storeGet(docKey(openId));
        if (saved) {
          try {
            const raw = JSON.parse(saved) as PdfDocument;
            await this.restoreImportedPdfIfNeeded(raw);
            this.doc = normalizeDoc(raw);
            queueMicrotask(() => this.showToast("Document restored"));
          } catch {
            this.doc = normalizeDoc(defaultDoc());
          }
        }
      } else {
        const saved = storeGet(STORAGE_KEY);
        if (saved) {
          try {
            const raw = JSON.parse(saved) as PdfDocument;
            await this.restoreImportedPdfIfNeeded(raw);
            this.doc = normalizeDoc(raw);
            queueMicrotask(() => this.showToast("Document restored"));
          } catch {
            this.doc = normalizeDoc(defaultDoc());
          }
        } else {
          this.doc = normalizeDoc(defaultDoc());
        }
      }

      if (typeof this.doc.showGrid === "boolean") this.showGrid = this.doc.showGrid;
      this.syncDocumentFonts();

      history.reset(this.doc);
      this.syncHistoryFlags();

      window.addEventListener("mousemove", (e) => this.onMouseMove(e));
      window.addEventListener("mouseup", () => this.onMouseUp());
      window.addEventListener("keydown", (e) => {
        if (e.code === "Space" && !(e.target as HTMLElement)?.isContentEditable) {
          spaceDown = true;
        }
      });
      window.addEventListener("keyup", (e) => {
        if (e.code === "Space") spaceDown = false;
      });
      queueMicrotask(() => {
        const viewport = (this as unknown as { $el: HTMLElement }).$el?.querySelector(
          ".canvas-workspace",
        );
        viewport?.addEventListener(
          "wheel",
          (e) => {
            const ev = e as WheelEvent;
            if (ev.metaKey || ev.ctrlKey) {
              ev.preventDefault();
              this.onViewportWheel(ev);
            }
          },
          { passive: false },
        );
      });

      this.bindLayoutMedia();
      scheduleEditorTour({
        onBeforeStart: () => {
          this.leftRail = "insert";
          this.showLeftPanel = true;
          this.showFileMenu = false;
          this.showTemplates = false;
          this.showSettings = false;
          this.showShortcuts = false;
        },
      });
      // Alpine injects $watch at runtime
      (this as unknown as { $watch: (key: string, cb: () => void) => void }).$watch(
        "activePageIndex",
        () => {
          this.pageJumpDraft = String(this.activePageIndex + 1);
          void this.refreshPdfUnderlay();
          void this.ensureActiveThumb();
          this.scrollActiveThumbIntoView();
        },
      );
      // Persist any in-memory PDF (current tab) so the next refresh keeps it
      await this.persistImportedPdfForDoc();
      this.loadPageCropDraft();
      void this.refreshPdfUnderlay();
      void this.refreshPageThumbUnderlays();
    },

    async restoreImportedPdfIfNeeded(doc: PdfDocument) {
      if (!doc?.id) return false;
      if (getSessionImportedPdfBytes()) return true;
      if (!docNeedsPdfReattach(doc.pages)) return false;
      return restoreSessionImportedPdf(doc.id);
    },

    async persistImportedPdfForDoc() {
      const bytes = getSessionImportedPdfBytes();
      if (!bytes || !this.doc?.id) return;
      await persistSessionImportedPdf(this.doc.id);
    },

    async refreshPdfUnderlay() {
      const gen = ++this._underlayGen;
      if (this.doc.importedPdf?.mode === "editable") {
        this.pdfUnderlaySrc = null;
        return;
      }
      const bytes = getSessionImportedPdfBytes();
      const page = this.doc.pages[this.activePageIndex];
      if (!bytes || typeof page?.sourcePageIndex !== "number") {
        this.pdfUnderlaySrc = null;
        return;
      }
      const sourceIdx = page.sourcePageIndex;
      this.canvasUnderlayScale = recommendedCanvasUnderlayScale(this.zoom || 0.85);
      const scale = this.canvasUnderlayScale;

      // Instant paint: hi-res cache, else thumb placeholder (avoid showing previous page)
      const cached = getCachedPdfPagePreview(bytes, sourceIdx, scale, "canvas");
      if (cached) {
        this.pdfUnderlaySrc = cached;
      } else {
        const thumb = this.pageThumbUnderlays[this.activePageIndex];
        this.pdfUnderlaySrc = thumb || null;
      }

      const url = await renderPdfPagePreview(bytes, sourceIdx, scale, "canvas");
      if (gen !== this._underlayGen) return;
      if (url) this.pdfUnderlaySrc = url;

      // Warm neighbors for snappy next/prev
      const neighbors: number[] = [];
      for (const delta of [-1, 1, 2, -2]) {
        const i = this.activePageIndex + delta;
        const p = this.doc.pages[i];
        if (typeof p?.sourcePageIndex === "number") neighbors.push(p.sourcePageIndex);
      }
      prefetchPdfPagePreviews(bytes, neighbors, scale);
    },

    async ensureActiveThumb() {
      if (this.doc.importedPdf?.mode === "editable") return;
      const bytes = getSessionImportedPdfBytes();
      const page = this.doc.pages[this.activePageIndex];
      if (!bytes || typeof page?.sourcePageIndex !== "number") return;
      if (this.pageThumbUnderlays[this.activePageIndex]) return;
      const thumbScale = this.thumbUnderlayScale || recommendedThumbScale();
      const url = await renderPdfPagePreview(bytes, page.sourcePageIndex, thumbScale, "thumb");
      if (!url) return;
      // Still on this page / same doc generation
      if (this.doc.pages[this.activePageIndex]?.sourcePageIndex !== page.sourcePageIndex) return;
      this.pageThumbUnderlays = {
        ...this.pageThumbUnderlays,
        [this.activePageIndex]: url,
      };
    },

    async refreshPageThumbUnderlays() {
      const gen = ++this._thumbGen;
      if (this.doc.importedPdf?.mode === "editable") {
        this.pageThumbUnderlays = {};
        this.thumbsLoading = false;
        return;
      }
      const bytes = getSessionImportedPdfBytes();
      if (!bytes) {
        this.pageThumbUnderlays = {};
        this.thumbsLoading = false;
        return;
      }

      const studioIndices: number[] = [];
      this.doc.pages.forEach((page: PdfPage, index: number) => {
        if (typeof page.sourcePageIndex === "number") studioIndices.push(index);
      });
      if (!studioIndices.length) {
        this.pageThumbUnderlays = {};
        this.thumbsLoading = false;
        return;
      }

      this.thumbsLoading = true;
      // Drop stale soft thumbs so new high-DPI PNG scale always wins
      this.pageThumbUnderlays = {};
      this.thumbUnderlayScale = recommendedThumbScale();
      const thumbScale = this.thumbUnderlayScale;
      // Prioritize active page + neighbors first (Acrobat-like responsiveness)
      const active = this.activePageIndex;
      const order = [...studioIndices].sort(
        (a, b) => Math.abs(a - active) - Math.abs(b - active),
      );
      const sourceOrder = order.map(
        (studioIdx) => this.doc.pages[studioIdx].sourcePageIndex as number,
      );

      const signal = { cancelled: false };
      await renderPdfThumbsProgressive(
        bytes,
        sourceOrder,
        thumbScale,
        (sourcePageIndex, dataUrl) => {
          if (gen !== this._thumbGen) {
            signal.cancelled = true;
            return;
          }
          const next = { ...this.pageThumbUnderlays };
          order.forEach((studioIndex) => {
            if (this.doc.pages[studioIndex].sourcePageIndex === sourcePageIndex) {
              next[studioIndex] = dataUrl;
            }
          });
          this.pageThumbUnderlays = next;
        },
        { chunkSize: studioIndices.length > 40 ? 2 : 4, signal },
      );

      if (gen === this._thumbGen) this.thumbsLoading = false;
    },

    scrollActiveThumbIntoView() {
      queueMicrotask(() => {
        const el = document.querySelector(
          `[data-page-thumb="${this.activePageIndex}"]`,
        ) as HTMLElement | null;
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    },

    goToPage(index: number) {
      if (!this.doc.pages.length) return;
      const next = Math.max(0, Math.min(this.doc.pages.length - 1, Math.floor(index)));
      if (next === this.activePageIndex) return;
      this.setActivePage(next);
    },

    prevPage() {
      this.goToPage(this.activePageIndex - 1);
    },

    nextPage() {
      this.goToPage(this.activePageIndex + 1);
    },

    jumpToPageDraft() {
      const n = Number.parseInt(String(this.pageJumpDraft), 10);
      if (!Number.isFinite(n)) {
        this.pageJumpDraft = String(this.activePageIndex + 1);
        return;
      }
      this.goToPage(n - 1);
      this.pageJumpDraft = String(this.activePageIndex + 1);
    },

    bindLayoutMedia() {
      const mq = window.matchMedia("(max-width: 1099px)");
      const apply = () => {
        const compact = mq.matches;
        const wasCompact = this.isCompact;
        this.isCompact = compact;
        if (compact && !wasCompact) {
          this.showLeftPanel = false;
          this.showInspectorPanel = false;
        } else if (!compact) {
          this.showLeftPanel = true;
          this.showInspectorPanel = true;
        }
      };
      apply();
      mq.addEventListener("change", apply);
    },

    toggleLeftPanel() {
      this.showLeftPanel = !this.showLeftPanel;
      if (this.isCompact && this.showLeftPanel) this.showInspectorPanel = false;
    },

    toggleInspectorPanel() {
      this.showInspectorPanel = !this.showInspectorPanel;
      if (this.isCompact && this.showInspectorPanel) this.showLeftPanel = false;
    },

    closeOverlayPanels() {
      if (!this.isCompact) return;
      this.showLeftPanel = false;
      this.showInspectorPanel = false;
    },

    startTour() {
      this.leftRail = "insert";
      this.showLeftPanel = true;
      this.showFileMenu = false;
      this.showTemplates = false;
      this.showSettings = false;
      this.showShortcuts = false;
      queueMicrotask(() => startEditorTour());
    },

    applyTheme(theme: "dark" | "light") {
      this.theme = theme;
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
    },

    toggleTheme() {
      this.applyTheme(this.theme === "dark" ? "light" : "dark");
    },

    saveSettings() {
      storeSet(
        SETTINGS_KEY,
        JSON.stringify({
          showGuides: this.showGuides,
          showGrid: this.showGrid,
          snapEnabled: this.snapEnabled,
          showRulers: this.showRulers,
        }),
      );
      this.doc.showGrid = this.showGrid;
      this.commit(false);
    },

    syncHistoryFlags() {
      this.canUndo = history.canUndo;
      this.canRedo = history.canRedo;
    },

    commit(recordHistory = true) {
      this.doc.updatedAt = new Date().toISOString();
      if (recordHistory && !skipHistory) {
        history.push(this.doc, JSON.stringify(this.doc));
        this.syncHistoryFlags();
      }
      this.saveState = "saving";
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        try {
          const snapshot = JSON.stringify(this.doc);
          storeSet(STORAGE_KEY, snapshot);
          storeSet(docKey(this.doc.id), snapshot);
          this.upsertDocLibrary();
          this.saveState = "saved";
          window.setTimeout(() => {
            if (this.saveState === "saved") this.saveState = "idle";
          }, 1600);
        } catch (err) {
          console.warn("Could not persist document", err);
          this.saveState = "idle";
          this.showToast(persistErrorMessage(err), 4500);
        }
      }, 220);
    },

    persist() {
      this.commit(true);
    },

    persistSoft() {
      this.doc.updatedAt = new Date().toISOString();
      this.saveState = "saving";
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        try {
          const snapshot = JSON.stringify(this.doc);
          storeSet(STORAGE_KEY, snapshot);
          storeSet(docKey(this.doc.id), snapshot);
          this.upsertDocLibrary();
          this.saveState = "saved";
          window.setTimeout(() => {
            if (this.saveState === "saved") this.saveState = "idle";
          }, 1600);
        } catch (err) {
          console.warn("Could not persist document", err);
          this.saveState = "idle";
          this.showToast(persistErrorMessage(err), 4500);
        }
      }, 160);
    },

    refreshDocLibrary() {
      try {
        this.docLibrary = JSON.parse(storeGet(DOCS_INDEX_KEY) || "[]") as DocIndexEntry[];
      } catch {
        this.docLibrary = [];
      }
    },

    upsertDocLibrary() {
      const entry: DocIndexEntry = {
        id: this.doc.id,
        name: this.doc.name,
        updatedAt: this.doc.updatedAt,
      };
      const list = this.docLibrary.filter((d) => d.id !== this.doc.id);
      list.unshift(entry);
      this.docLibrary = list.slice(0, 40);
      storeSet(DOCS_INDEX_KEY, JSON.stringify(this.docLibrary));
    },

    async openDocFromLibrary(id: string) {
      const raw = storeGet(docKey(id));
      if (!raw) return;
      try {
        clearSessionImportedPdf();
        invalidatePdfPreviewCache();
        const parsed = JSON.parse(raw) as PdfDocument;
        await this.restoreImportedPdfIfNeeded(parsed);
        this.doc = normalizeDoc(parsed);
        this.activePageIndex = 0;
        this.selectedIds = [];
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.showDocLibrary = false;
        this.syncDocumentFonts();
        storeSet(STORAGE_KEY, JSON.stringify(this.doc));
        await this.refreshPdfUnderlay();
        void this.refreshPageThumbUnderlays();
      } catch {
        this.showToast("Could not open document.", 4000);
      }
    },

    duplicateDocInLibrary() {
      const copy = structuredClone(this.doc) as PdfDocument;
      copy.id = uid();
      copy.name = `${this.doc.name} copy`;
      copy.updatedAt = new Date().toISOString();
      this.doc = normalizeDoc(copy);
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
    },

    async downloadStudioJson() {
      try {
        this.showToast("Preparing portable JSON…", 1800);
        const portable = await buildPortableStudioFile(this.doc, (url, init) => apiFetch(url, init));
        const blob = new Blob([JSON.stringify(portable, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.doc.name.replace(/[^\w.-]+/g, "_") || "document"}.pdfstudio.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast("JSON downloaded (assets inlined)");
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Could not export JSON", 4000);
      }
    },

    async onStudioJsonSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const raw = JSON.parse(text) as unknown;
        const kind =
          raw && typeof raw === "object" && "kind" in raw
            ? (raw as { kind?: string }).kind
            : undefined;

        if (kind === "template") {
          const hydrated = await hydratePortableStudioFile(raw, {
            apiFetch: (url, init) => apiFetch(url, init),
            normalizeDoc,
          });
          const meta = saveUserTemplate(hydrated, hydrated.name);
          this.refreshUserTemplates();
          this.showToast(`Template “${meta.name}” saved to My templates`);
          return;
        }

        clearSessionImportedPdf();
        invalidatePdfPreviewCache();
        this.doc = await hydratePortableStudioFile(raw, {
          apiFetch: (url, init) => apiFetch(url, init),
          normalizeDoc,
        });
        this.activePageIndex = 0;
        this.selectedIds = [];
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.syncDocumentFonts();
        this.commit(false);
        await this.persistImportedPdfForDoc();
        await this.refreshPdfUnderlay();
        await this.refreshPageThumbUnderlays();
        this.showToast("Document imported");
      } catch {
        this.showToast("Invalid .pdfstudio.json file", 4000);
      } finally {
        input.value = "";
      }
    },

    undo() {
      const prev = history.undo(this.doc);
      if (!prev) return;
      skipHistory = true;
      this.doc = normalizeDoc(prev);
      this.selectedIds = [];
      this.syncHistoryFlags();
      storeSet(STORAGE_KEY, JSON.stringify(this.doc));
      skipHistory = false;
    },

    redo() {
      const next = history.redo(this.doc);
      if (!next) return;
      skipHistory = true;
      this.doc = normalizeDoc(next);
      this.selectedIds = [];
      this.syncHistoryFlags();
      storeSet(STORAGE_KEY, JSON.stringify(this.doc));
      skipHistory = false;
    },

    newDocument() {
      if (!confirm("Start a blank document? Unsaved changes stay in browser history only.")) return;
      const prevId = this.doc?.id;
      clearSessionImportedPdf();
      void clearPersistedImportedPdf(prevId);
      invalidatePdfPreviewCache();
      this.pdfUnderlaySrc = null;
      this.pageThumbUnderlays = {};
      this.doc = normalizeDoc(defaultDoc());
      this.activePageIndex = 0;
      this.selectedIds = [];
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
    },

    applyTemplate(id: string) {
      const prevId = this.doc?.id;
      clearSessionImportedPdf();
      void clearPersistedImportedPdf(prevId);
      invalidatePdfPreviewCache();
      this.pdfUnderlaySrc = null;
      this.pageThumbUnderlays = {};
      this.doc = normalizeDoc(buildTemplate(id));
      this.activePageIndex = 0;
      this.selectedIds = [];
      this.showTemplates = false;
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
    },

    refreshUserTemplates() {
      this.userTemplates = listUserTemplates();
    },

    saveAsUserTemplate() {
      const name = prompt("Template name", this.doc.name || "My template");
      if (name === null) return;
      const meta = saveUserTemplate(this.doc, name);
      this.refreshUserTemplates();
      this.showToast(`Saved template “${meta.name}”`);
    },

    applyUserTemplate(id: string) {
      const tpl = loadUserTemplate(id);
      if (!tpl) {
        this.showToast("Template not found", 4000);
        return;
      }
      clearSessionImportedPdf();
      const doc = structuredClone(tpl) as PdfDocument;
      doc.id = uid();
      doc.updatedAt = new Date().toISOString();
      this.doc = normalizeDoc(doc);
      this.activePageIndex = 0;
      this.selectedIds = [];
      this.showTemplates = false;
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.syncDocumentFonts();
      this.commit(false);
      this.showToast(`Opened template “${tpl.name}”`);
    },

    removeUserTemplate(id: string) {
      if (!confirm("Delete this template?")) return;
      deleteUserTemplate(id);
      this.refreshUserTemplates();
    },

    renameUserTemplatePrompt(id: string) {
      const current = this.userTemplates.find((t: UserTemplateMeta) => t.id === id);
      const name = prompt("Rename template", current?.name || "");
      if (name === null || !name.trim()) return;
      renameUserTemplate(id, name);
      this.refreshUserTemplates();
    },

    async downloadAsTemplatePack() {
      try {
        const portable = await buildPortableStudioFile(this.doc, (url, init) => apiFetch(url, init));
        portable.kind = "template";
        portable.doc.importedPdf = null;
        portable.importedPdfBase64 = undefined;
        const blob = new Blob([JSON.stringify(portable, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.doc.name.replace(/[^\w.-]+/g, "_") || "template"}.pdfstudio.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast("Template pack downloaded");
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Could not export template", 4000);
      }
    },

    openMailMergeModal() {
      this.refreshFieldAudit();
      this.showMailMerge = true;
    },

    async onMailMergeFileSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      try {
        const { headers, rows } = await parseMergeFile(file);
        this.mailMergeHeaders = headers;
        this.mailMergeRows = rows;
        this.mailMergePreview = rows[0] || null;
        this.mailMergeFileName = file.name;
        this.refreshFieldAudit();
        if (!rows.length) this.showToast("File has no data rows", 4000);
        else this.showToast(`Loaded ${rows.length} row(s)`);
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Could not parse merge file", 4000);
      }
      input.value = "";
    },

    refreshFieldAudit() {
      this.fieldAuditIssues = auditMergeFields(this.doc, {
        headers: this.mailMergeHeaders,
        sampleRow: this.mailMergePreview,
      });
    },

    insertMergeToken(field: string) {
      const el = this.selected;
      if (!el || el.type !== "text" || el.locked) {
        this.showToast("Select a text element first");
        return;
      }
      el.content = appendToken(el.content || "", field);
      this.commit();
      this.refreshFieldAudit();
    },

    insertSeqToken() {
      this.insertMergeToken("seq");
    },

    async runMailMerge() {
      if (!this.mailMergeRows.length) {
        this.showToast("Upload CSV / XLSX / JSON first", 4000);
        return;
      }
      const opts = {
        skipRowWhen: this.mailMergeSkipWhen,
        expandTables: true,
        seqStart: this.mailMergeSeqStart || 1,
      };

      if (this.mailMergeMode === "zip") {
        this.showToast("Building ZIP…", 2000);
        try {
          const packages = applyMailMergePerRow(this.doc, this.mailMergeRows, opts);
          const zip = new JSZip();
          for (const { doc: merged } of packages) {
            const payload = {
              name: merged.name,
              pageSize: merged.pageSize,
              pageBackground: merged.pageBackground,
              pages: merged.pages,
              master: merged.master,
              watermark: merged.watermark,
              comments: [],
              customFonts: merged.customFonts || [],
              exportSettings: { ...this.exportSettings, includeComments: false },
            };
            const bytes = await exportPdfBytes(payload, (url, init) => apiFetch(url, init));
            zip.file(`${merged.name}.pdf`, bytes);
          }
          const blob = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${(this.doc.name || "merge").replace(/[^\w.-]+/g, "_")}-merge.zip`;
          a.click();
          URL.revokeObjectURL(url);
          this.showMailMerge = false;
          this.showToast(`ZIP with ${packages.length} PDF(s)`);
        } catch (err) {
          this.showToast(err instanceof Error ? err.message : "ZIP merge failed", 4000);
        }
        return;
      }

      const merged = applyMailMerge(this.doc, this.mailMergeRows, opts);
      this.doc = normalizeDoc(merged);
      this.activePageIndex = 0;
      this.selectedIds = [];
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
      this.showMailMerge = false;
      this.showToast(`Merged → ${this.doc.pages.length} pages`);
    },

    openPreflight() {
      this.preflightIssues = runPreflight(this.doc);
      this.showPreflight = true;
    },

    async exportPngProof() {
      try {
        this.showToast("Rendering PNG proof…", 2000);
        const blob = await exportPngProofZip(this.doc, (url, init) => apiFetch(url, init), this.exportSettings);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(this.doc.name || "proof").replace(/[^\w.-]+/g, "_")}-pages.zip`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast("PNG proof ZIP downloaded");
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "PNG export failed", 4000);
      }
    },

    toggleRedactOnSelected() {
      const el = this.selected;
      if (!el || el.type !== "rect" || el.locked) {
        this.showToast("Select a rectangle to mark as redaction");
        return;
      }
      el.redact = !el.redact;
      if (el.redact) {
        el.fill = "#000000";
        el.stroke = "#000000";
        el.opacity = 1;
      }
      this.commit();
      this.showToast(el.redact ? "Redaction on" : "Redaction off");
    },

    setMergeHideWhenOnSelected() {
      const el = this.selected;
      if (!el || el.locked) return;
      const field = prompt("Hide when field name equals… (field)", this.mailMergeHeaders[0] || "");
      if (field === null) return;
      const value = prompt("Value (leave empty + use op empty/notEmpty via cancel next)", "");
      if (value === null) {
        el.mergeHideWhen = { field, op: "empty" };
      } else {
        el.mergeHideWhen = { field, op: "equals", value };
      }
      this.commit();
      this.showToast("Merge hide condition set");
    },

    openESign() {
      this.eSignPkg = loadESignPackage(this.doc.id);
      this.showESign = true;
    },

    startESign() {
      const names = (this.eSignNames || "")
        .split(/[,\n]/)
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (!names.length) {
        this.showToast("Enter signer names (comma-separated)");
        return;
      }
      this.eSignPkg = createESignPackage(this.doc.id, names);
      this.showToast("E-sign package created (local)");
    },

    signAs(signerId: string) {
      if (!this.eSignPkg) return;
      try {
        this.eSignPkg = markSignerSigned(this.eSignPkg, signerId);
        this.showToast("Signed");
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Cannot sign yet", 4000);
      }
    },

    downloadESignTrail() {
      if (!this.eSignPkg) return;
      const text = exportTrailText(this.eSignPkg);
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `esign-trail-${this.doc.id.slice(0, 8)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    },

    async createShareLink() {
      try {
        const { url } = await createLocalShare(this.doc, (u, init) => apiFetch(u, init));
        await navigator.clipboard?.writeText(url);
        this.showToast("Local review link copied (same browser profile)");
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Share failed", 4000);
      }
    },

    setActivePage(index: number) {
      if (index < 0 || index >= this.doc.pages.length) return;
      this.activePageIndex = index;
      this.pageJumpDraft = String(index + 1);
      this.selectedIds = [];
      this.editingTextId = null;
      this.scrollActiveThumbIntoView();
    },

    addPage() {
      this.doc.pages.push(blankPage());
      this.activePageIndex = this.doc.pages.length - 1;
      this.selectedIds = [];
      this.commit();
    },

    duplicatePage(index: number) {
      const source = this.doc.pages[index];
      if (!source) return;
      const copy: PdfPage = {
        id: uid(),
        applyMaster: source.applyMaster,
        sourcePageIndex: source.sourcePageIndex,
        rotation: source.rotation,
        mergeFields: source.mergeFields ? { ...source.mergeFields } : undefined,
        elements: source.elements.map((el) => {
          const c = structuredClone(el) as PdfElement;
          c.id = uid();
          return c;
        }),
      };
      this.doc.pages.splice(index + 1, 0, copy);
      this.activePageIndex = index + 1;
      this.selectedIds = [];
      this.commit();
    },

    async rotateActivePage(delta: 90 | -90 | 180 = 90) {
      this.doc = rotatePageInDoc(this.doc, this.activePageIndex, delta);
      this.doc = await syncSessionPdfToStudioPages(this.doc);
      this.commit();
      await this.persistImportedPdfForDoc();
      await this.refreshPdfUnderlay();
      void this.refreshPageThumbUnderlays();
    },

    async mergePdfSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      try {
        const buf = await file.arrayBuffer();
        const { PDFDocument } = await import("pdf-lib");
        const src = await PDFDocument.load(buf, { ignoreEncryption: true });
        const count = src.getPageCount();
        const range = prompt(
          `Pages to merge from “${file.name}” (1–${count}), e.g. 1-3 or leave blank for all`,
          `1-${count}`,
        );
        let fromIndex = 0;
        let toIndex = count - 1;
        if (range?.trim()) {
          const m = range.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
          if (!m) throw new Error("Invalid page range");
          fromIndex = Number(m[1]) - 1;
          toIndex = m[2] ? Number(m[2]) - 1 : fromIndex;
        }
        // Re-wrap file because arrayBuffer consumed — recreate File
        const again = new File([buf], file.name, { type: file.type || "application/pdf" });
        this.doc = normalizeDoc(await mergePdfFileIntoDoc(this.doc, again, { fromIndex, toIndex }));
        this.activePageIndex = this.doc.pages.length - 1;
        this.selectedIds = [];
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.commit(false);
        await this.persistImportedPdfForDoc();
        await this.refreshPdfUnderlay();
        await this.refreshPageThumbUnderlays();
        this.showToast(`Merged pages ${fromIndex + 1}–${toIndex + 1} from “${file.name}”`);
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Could not merge PDF", 4000);
      } finally {
        input.value = "";
      }
    },

    extractPageRange() {
      const raw = prompt(
        `Extract pages (1–${this.doc.pages.length}), e.g. 1-2 or 3`,
        `1-${this.doc.pages.length}`,
      );
      if (!raw) return;
      const m = raw.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
      if (!m) {
        this.showToast("Invalid range", 4000);
        return;
      }
      const from = Number(m[1]) - 1;
      const to = m[2] ? Number(m[2]) - 1 : from;
      if (from < 0 || to >= this.doc.pages.length) {
        this.showToast("Range out of bounds", 4000);
        return;
      }
      clearSessionImportedPdf();
      this.doc = normalizeDoc(extractPagesToDoc(this.doc, from, to));
      this.activePageIndex = 0;
      this.selectedIds = [];
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
      this.showToast("Extracted pages into a new document");
    },

    async downloadExtractedPdf() {
      const raw = prompt(
        `Download PDF for pages (1–${this.doc.pages.length})`,
        String(this.activePageIndex + 1),
      );
      if (!raw) return;
      const m = raw.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
      if (!m) {
        this.showToast("Invalid range", 4000);
        return;
      }
      const from = Number(m[1]) - 1;
      const to = m[2] ? Number(m[2]) - 1 : from;
      const indices: number[] = [];
      for (let i = Math.min(from, to); i <= Math.max(from, to); i++) indices.push(i);
      try {
        const bytes = await extractPagesToPdfBytes(this.doc, indices);
        const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
          type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.doc.name.replace(/[^\w.-]+/g, "_") || "pages"}-extract.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Extract failed", 4000);
      }
    },

    async movePage(index: number, dir: -1 | 1) {
      const next = index + dir;
      if (next < 0 || next >= this.doc.pages.length) return;
      const pages = this.doc.pages;
      [pages[index], pages[next]] = [pages[next], pages[index]];
      this.activePageIndex = next;
      // Keep bookmark page indices in sync with reordered pages
      if (this.doc.bookmarks?.length) {
        this.doc.bookmarks = this.doc.bookmarks.map((b) => {
          if (b.pageIndex === index) return { ...b, pageIndex: next };
          if (b.pageIndex === next) return { ...b, pageIndex: index };
          return b;
        });
      }
      this.doc = await syncSessionPdfToStudioPages(this.doc);
      this.commit();
      await this.persistImportedPdfForDoc();
      await this.refreshPdfUnderlay();
      void this.refreshPageThumbUnderlays();
    },

    async removePage(index: number) {
      if (this.doc.pages.length <= 1) return;
      this.doc.pages.splice(index, 1);
      this.activePageIndex = Math.min(this.activePageIndex, this.doc.pages.length - 1);
      this.selectedIds = [];
      if (this.doc.bookmarks?.length) {
        this.doc.bookmarks = this.doc.bookmarks
          .filter((b) => b.pageIndex !== index)
          .map((b) => (b.pageIndex > index ? { ...b, pageIndex: b.pageIndex - 1 } : b));
      }
      this.doc = await syncSessionPdfToStudioPages(this.doc);
      this.commit();
      await this.persistImportedPdfForDoc();
      await this.refreshPdfUnderlay();
      void this.refreshPageThumbUnderlays();
    },

    async splitPdfDocument() {
      const raw = prompt(
        `Split into files of N pages each (1 = one PDF per page). Document has ${this.doc.pages.length} pages.`,
        "1",
      );
      if (!raw) return;
      const n = Number.parseInt(raw, 10);
      if (!Number.isFinite(n) || n < 1) {
        this.showToast("Enter a positive number", 3000);
        return;
      }
      try {
        this.showToast("Splitting…", 1800);
        const parts = await splitDocToPdfParts(this.doc, n);
        if (parts.length === 1) {
          const blob = new Blob(
            [parts[0].bytes.buffer.slice(parts[0].bytes.byteOffset, parts[0].bytes.byteOffset + parts[0].bytes.byteLength) as ArrayBuffer],
            { type: "application/pdf" },
          );
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = parts[0].name;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          const zip = new JSZip();
          for (const part of parts) {
            zip.file(part.name, part.bytes);
          }
          const blob = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${(this.doc.name || "document").replace(/[^\w.-]+/g, "_")}-split.zip`;
          a.click();
          URL.revokeObjectURL(url);
        }
        this.showToast(`Split into ${parts.length} file(s)`);
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Split failed", 4000);
      }
    },

    addBookmarkForActivePage() {
      const title =
        (this.bookmarkDraft || "").trim() ||
        prompt("Bookmark title", `Page ${this.activePageIndex + 1}`) ||
        "";
      if (!title.trim()) return;
      const entry: DocBookmark = {
        id: uid(),
        title: title.trim(),
        pageIndex: this.activePageIndex,
        level: 0,
      };
      this.doc.bookmarks = [...(this.doc.bookmarks || []), entry];
      this.bookmarkDraft = "";
      this.commit();
      this.showToast("Bookmark added");
    },

    removeBookmark(id: string) {
      this.doc.bookmarks = (this.doc.bookmarks || []).filter((b) => b.id !== id);
      this.commit();
    },

    goToBookmark(b: DocBookmark) {
      this.goToPage(b.pageIndex);
      this.leftRail = "bookmarks";
    },

    autoBookmarksFromPages() {
      this.doc.bookmarks = this.doc.pages.map((p, i) => ({
        id: uid(),
        title: `Page ${i + 1}`,
        pageIndex: i,
        level: 0,
      }));
      this.commit();
      this.showToast(`Created ${this.doc.bookmarks.length} bookmarks`);
    },

    applyBatesNumbering() {
      const prefix = prompt("Bates prefix (optional)", this.batesPrefix || "") ?? "";
      if (prefix === null) return;
      const startRaw = prompt("Starting number", String(this.batesStart || 1));
      if (startRaw === null) return;
      const start = Number.parseInt(startRaw, 10);
      if (!Number.isFinite(start) || start < 0) {
        this.showToast("Invalid start number", 3000);
        return;
      }
      const pad = Math.max(2, Math.min(8, this.batesPad || 4));
      this.batesPrefix = prefix;
      this.batesStart = start;
      if (!this.doc.master) this.doc.master = { header: [], footer: [] };
      const token = prefix
        ? `{{bates|${prefix}${String(0).padStart(pad, "0")}}}`
        : `{{bates|${String(0).padStart(pad, "0")}}}`;
      this.mailMergeSeqStart = start;
      const existing = this.doc.master.footer.find(
        (el) => el.type === "text" && (el as TextElement).content.includes("{{bates"),
      ) as TextElement | undefined;
      if (existing) {
        existing.content = token;
        existing.fontSize = 9;
        existing.align = "center";
      } else {
        const { width, height } = this.pageSize;
        this.doc.master.footer.push(
          createText(width / 2 - 80, height - 28, {
            content: token,
            fontSize: 9,
            width: 160,
            height: 16,
            align: "center",
            color: "#544d45",
          }),
        );
      }
      this.doc.pages.forEach((page, i) => {
        page.applyMaster = true;
        page.mergeFields = { ...(page.mergeFields || {}), seq: String(start + i) };
      });
      this.commit();
      this.showToast("Bates numbering applied to master footer");
    },

    loadPageCropDraft() {
      const c = this.activePage?.cropBox;
      this.pageCropDraft = {
        top: c?.top ?? 0,
        right: c?.right ?? 0,
        bottom: c?.bottom ?? 0,
        left: c?.left ?? 0,
      };
    },

    applyPageCrop() {
      const page = this.activePage;
      if (!page) return;
      const clamp = (n: number) => Math.min(40, Math.max(0, Number(n) || 0));
      const crop = {
        top: clamp(this.pageCropDraft.top),
        right: clamp(this.pageCropDraft.right),
        bottom: clamp(this.pageCropDraft.bottom),
        left: clamp(this.pageCropDraft.left),
      };
      if (crop.top + crop.right + crop.bottom + crop.left <= 0) {
        delete page.cropBox;
      } else {
        page.cropBox = crop;
      }
      this.commit();
      this.showToast("Page crop updated (applied on export)");
    },

    clearPageCrop() {
      if (!this.activePage) return;
      delete this.activePage.cropBox;
      this.pageCropDraft = { top: 0, right: 0, bottom: 0, left: 0 };
      this.commit();
    },

    zoomIn() {
      this.zoom = Math.min(2.5, Math.round((this.zoom + 0.1) * 10) / 10);
    },

    zoomOut() {
      this.zoom = Math.max(0.25, Math.round((this.zoom - 0.1) * 10) / 10);
    },

    fitWidth() {
      const pad = 160;
      const avail = Math.max(280, window.innerWidth - 420 - pad);
      this.zoom = Math.min(
        1.5,
        Math.max(0.3, Math.round((avail / this.pageSize.width) * 100) / 100),
      );
      this.panX = 0;
      this.panY = 0;
    },

    fitPage() {
      const padX = 160;
      const padY = 180;
      const availW = Math.max(280, window.innerWidth - 420 - padX);
      const availH = Math.max(280, window.innerHeight - padY);
      const zx = availW / this.pageSize.width;
      const zy = availH / this.pageSize.height;
      this.zoom = Math.min(1.5, Math.max(0.3, Math.round(Math.min(zx, zy) * 100) / 100));
      this.panX = 0;
      this.panY = 0;
    },

    fitZoom() {
      this.fitWidth();
    },

    onViewportWheel(event: WheelEvent) {
      if (!(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      this.zoom = Math.min(2.5, Math.max(0.25, Math.round((this.zoom + delta) * 100) / 100));
    },

    pageCoords(event: MouseEvent) {
      const page = (this as unknown as { $refs: { page: HTMLElement } }).$refs.page;
      const rect = page.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / this.zoom,
        y: (event.clientY - rect.top) / this.zoom,
      };
    },

    snap(value: number) {
      if (!this.snapEnabled) return Math.round(value);
      const guides = this.doc.guides || [];
      for (const g of guides) {
        if (Math.abs(g.position - value) <= 4) return g.position;
      }
      return Math.round(value / 8) * 8;
    },

    isSelected(id: string) {
      return this.selectedIds.includes(id);
    },

    selectElement(el: PdfElement, additive = false) {
      const groupMembers = el.groupId
        ? this.workingElements.filter((e) => e.groupId === el.groupId).map((e) => e.id)
        : [el.id];
      if (additive) {
        const set = new Set(this.selectedIds);
        for (const id of groupMembers) {
          if (set.has(id)) set.delete(id);
          else set.add(id);
        }
        this.selectedIds = [...set];
      } else {
        this.selectedIds = groupMembers;
      }
      if (this.isCompact && this.selectedIds.length) {
        this.showInspectorPanel = true;
        this.showLeftPanel = false;
      }
    },

    onCanvasBackground(event: MouseEvent) {
      if (event.target === event.currentTarget) {
        if (spaceDown || event.button === 1) return;
        this.selectedIds = [];
        this.editingTextId = null;
        this.closeOverlayPanels();
      }
    },

    onViewportMouseDown(event: MouseEvent) {
      if (event.button === 1 || (event.button === 0 && spaceDown)) {
        event.preventDefault();
        this.drag = {
          mode: "pan",
          startX: event.clientX,
          startY: event.clientY,
          origPanX: this.panX,
          origPanY: this.panY,
        };
      }
    },

    onPageMouseDown(event: MouseEvent) {
      if (event.button !== 0 || spaceDown) return;
      const { x, y } = this.pageCoords(event);
      const sx = this.snap(x);
      const sy = this.snap(y);

      if (this.tool === "comment" || this.reviewMode) {
        this.addCommentAt(sx, sy);
        return;
      }

      if (this.tool === "place" && this.pendingLibraryKind) {
        this.insertLibraryAt(this.pendingLibraryKind, sx, sy);
        return;
      }

      if (this.tool === "select") {
        this.drag = {
          mode: "marquee",
          startX: x,
          startY: y,
          x,
          y,
          w: 0,
          h: 0,
        };
        if (!event.shiftKey) {
          this.selectedIds = [];
          this.editingTextId = null;
        }
        return;
      }

      let el: PdfElement;
      if (this.tool === "text")
        el = createText(sx, sy, { fontFamily: this.brand.defaultFont || "Helvetica" });
      else if (this.tool === "rect") el = createRect(sx, sy);
      else if (this.tool === "ellipse") el = createEllipse(sx, sy);
      else if (this.tool === "highlight") el = createMarkup("highlight", sx, sy);
      else if (this.tool === "underline") el = createMarkup("underline", sx, sy);
      else if (this.tool === "strike") el = createMarkup("strike", sx, sy);
      else el = createLine(sx, sy);

      this.pushElement(el);
    },

    pushElement(el: PdfElement) {
      if (this.editingMaster) {
        if (!this.doc.master) this.doc.master = { header: [], footer: [] };
        const zone = this.masterZone === "footer" ? this.doc.master.footer : this.doc.master.header;
        zone.push(el);
      } else {
        this.activePage.elements.push(el);
      }
      this.selectedIds = [el.id];
      this.justInsertedId = el.id;
      if (!this.libraryKeepPlacing) {
        this.tool = "select";
        this.pendingLibraryKind = null;
        this.placeHint = false;
      }
      if (this.isCompact) {
        this.showLeftPanel = false;
        this.showInspectorPanel = true;
      }
      this.commit();
      setTimeout(() => {
        if (this.justInsertedId === el.id) this.justInsertedId = null;
      }, 480);

      if (!this.libraryKeepPlacing && (el.type === "text" || el.type === "sticky")) {
        queueMicrotask(() => this.startTextEdit(el as TextElement | StickyElement));
      }
    },

    rememberLibraryUse(item: LibraryItem) {
      this.recentIds = [item.id, ...this.recentIds.filter((id) => id !== item.id)].slice(0, 16);
      storeSet(RECENT_KEY, JSON.stringify(this.recentIds));
    },

    isFavorite(id: string) {
      return this.favorites.includes(id);
    },

    toggleFavorite(id: string) {
      if (this.favorites.includes(id)) {
        this.favorites = this.favorites.filter((f) => f !== id);
      } else {
        this.favorites = [id, ...this.favorites].slice(0, 40);
      }
      storeSet(FAV_KEY, JSON.stringify(this.favorites));
    },

    pickLibraryItem(item: LibraryItem) {
      this.rememberLibraryUse(item);
      if (item.kind === "image") {
        (this as unknown as { $refs: { imageInput: HTMLInputElement } }).$refs.imageInput.click();
        return;
      }
      if (item.kind === "signature") {
        this.openSignatureModal();
        return;
      }
      this.pendingLibraryKind = item.kind;
      this.tool = "place";
      this.placeHint = true;
      this.selectedIds = [];
    },

    insertLibraryQuick(item: LibraryItem) {
      this.rememberLibraryUse(item);
      if (item.kind === "image") {
        (this as unknown as { $refs: { imageInput: HTMLInputElement } }).$refs.imageInput.click();
        return;
      }
      if (item.kind === "signature") {
        this.openSignatureModal();
        return;
      }
      const { width, height } = this.pageSize;
      const el = createFromLibrary(item.kind, width / 2 - 80, height / 2 - 40);
      if (el === "image" || el === "signature") return;
      el.x = this.snap(Math.max(24, width / 2 - el.width / 2));
      el.y = this.snap(Math.max(24, height / 2 - el.height / 2));
      this.pushElement(el);
    },

    insertLibraryAt(kind: LibraryItem["kind"], x: number, y: number) {
      const el = createFromLibrary(kind, x, y);
      if (el === "image") {
        (this as unknown as { $refs: { imageInput: HTMLInputElement } }).$refs.imageInput.click();
        return;
      }
      if (el === "signature") {
        this.openSignatureModal(x, y);
        return;
      }
      this.pushElement(el);
    },

    insertFormField(kind: "formText" | "formCheck" | "formSelect") {
      const { width, height } = this.pageSize;
      const x = this.snap(width / 2 - 90);
      const y = this.snap(height / 2 - 20);
      const el =
        kind === "formText"
          ? createFormText(x, y)
          : kind === "formCheck"
            ? createFormCheck(x, y)
            : createFormSelect(x, y);
      this.pushElement(el);
    },

    onElementMouseDown(event: MouseEvent, el: PdfElement) {
      if (event.button !== 0 || spaceDown) return;
      if (this.editingMaster) {
        /* allow select master els */
      }
      this.selectElement(el, event.shiftKey);
      if (el.locked) return;
      const elMap = new Map(this.workingElements.map((e) => [e.id, e]));
      const ids = this.selectedIds.filter((id) => {
        const e = elMap.get(id);
        return e && !e.locked;
      });
      this.drag = {
        mode: "move",
        ids,
        startX: event.clientX,
        startY: event.clientY,
        origins: ids.map((id) => {
          const e = elMap.get(id)!;
          return { id, x: e.x, y: e.y };
        }),
        elMap,
      };
    },

    startResize(event: MouseEvent, el: PdfElement) {
      if (el.locked) return;
      this.drag = {
        mode: "resize",
        id: el.id,
        startX: event.clientX,
        startY: event.clientY,
        origW: el.width,
        origH: el.height,
      };
    },

    onMouseMove(event: MouseEvent) {
      if (!this.drag) return;
      pendingMove = event;
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(() => {
        moveRaf = 0;
        const e = pendingMove;
        pendingMove = null;
        if (!e || !this.drag) return;
        this.applyPointerDrag(e);
      });
    },

    applyPointerDrag(event: MouseEvent) {
      if (!this.drag) return;

      if (this.drag.mode === "pan") {
        this.panX = this.drag.origPanX + (event.clientX - this.drag.startX);
        this.panY = this.drag.origPanY + (event.clientY - this.drag.startY);
        return;
      }

      if (this.drag.mode === "marquee") {
        const { x, y } = this.pageCoords(event);
        const x0 = Math.min(this.drag.startX, x);
        const y0 = Math.min(this.drag.startY, y);
        const w = Math.abs(x - this.drag.startX);
        const h = Math.abs(y - this.drag.startY);
        this.drag.x = x0;
        this.drag.y = y0;
        this.drag.w = w;
        this.drag.h = h;
        if (this.marquee) {
          this.marquee.x = x0;
          this.marquee.y = y0;
          this.marquee.w = w;
          this.marquee.h = h;
        } else {
          this.marquee = { x: x0, y: y0, w, h };
        }
        return;
      }

      if (this.drag.mode === "guide") {
        const guideDrag = this.drag;
        const { x, y } = this.pageCoords(event);
        const g = (this.doc.guides || []).find((g) => g.id === guideDrag.id);
        if (g) {
          g.position = guideDrag.axis === "x" ? this.snap(x) : this.snap(y);
        }
        return;
      }

      if (this.drag.mode === "resize") {
        const resizeDrag = this.drag;
        const el = this.workingElements.find((e) => e.id === resizeDrag.id);
        if (!el) return;
        const dx = (event.clientX - resizeDrag.startX) / this.zoom;
        const dy = (event.clientY - resizeDrag.startY) / this.zoom;
        el.width = Math.max(20, this.snap(resizeDrag.origW + dx));
        el.height = Math.max(el.type === "line" ? 0 : 20, this.snap(resizeDrag.origH + dy));
        return;
      }

      if (this.drag.mode === "move") {
        const moveDrag = this.drag;
        const dx = (event.clientX - moveDrag.startX) / this.zoom;
        const dy = (event.clientY - moveDrag.startY) / this.zoom;
        const exclude = new Set(moveDrag.ids);
        const primary = moveDrag.origins[0];
        if (!primary) return;
        const primaryEl = moveDrag.elMap.get(primary.id);
        if (!primaryEl) return;

        let nx = this.snap(primary.x + dx);
        let ny = this.snap(primary.y + dy);

        if (this.snapEnabled) {
          const result = computeSmartGuides(
            { x: nx, y: ny, width: primaryEl.width, height: primaryEl.height },
            this.workingElements,
            this.pageSize.width,
            this.pageSize.height,
            exclude,
          );
          nx = result.x;
          ny = result.y;
          this.smartGuides = result.guides;
        } else {
          this.smartGuides = [];
        }

        const odx = nx - primary.x;
        const ody = ny - primary.y;
        for (const origin of moveDrag.origins) {
          const el = moveDrag.elMap.get(origin.id);
          if (!el || el.locked) continue;
          el.x = origin.x + odx;
          el.y = origin.y + ody;
        }
      }
    },

    onMouseUp() {
      if (moveRaf) {
        cancelAnimationFrame(moveRaf);
        moveRaf = 0;
      }
      if (pendingMove && this.drag) {
        this.applyPointerDrag(pendingMove);
      }
      pendingMove = null;

      if (!this.drag) return;

      if (this.drag.mode === "marquee") {
        const box = this.marquee;
        if (box && box.w > 4 && box.h > 4) {
          const hits = this.workingElements
            .filter(
              (el) =>
                el.x < box.x + box.w &&
                el.x + el.width > box.x &&
                el.y < box.y + box.h &&
                el.y + el.height > box.y,
            )
            .map((el) => el.id);
          this.selectedIds = [...new Set([...this.selectedIds, ...hits])];
        }
        this.marquee = null;
        this.drag = null;
        return;
      }

      if (this.drag.mode === "move" || this.drag.mode === "resize" || this.drag.mode === "guide") {
        this.drag = null;
        this.smartGuides = [];
        this.commit();
        return;
      }

      this.drag = null;
      this.smartGuides = [];
    },

    elementStyle(el: PdfElement) {
      const rotating = el.rotation ? `rotate(${el.rotation}deg)` : "";
      const hidden = el.visible === false;
      return {
        left: `${el.x * this.zoom}px`,
        top: `${el.y * this.zoom}px`,
        width: `${Math.max(el.width, 1) * this.zoom}px`,
        height: `${Math.max(el.height, el.type === "line" || el.type === "divider" || el.type === "arrow" ? 8 : 1) * this.zoom}px`,
        opacity: hidden ? "0.28" : String(el.opacity),
        transform: rotating || undefined,
        outline: this.findHighlightId === el.id ? "2px solid rgb(var(--color-accent))" : undefined,
        outlineOffset: this.findHighlightId === el.id ? "2px" : undefined,
        filter: hidden ? "grayscale(0.4)" : undefined,
        cursor: el.locked ? "not-allowed" : this.tool === "place" ? "crosshair" : "move",
      };
    },

    iconHtml(el: PdfElement) {
      if (el.type !== "icon") return "";
      return iconSvg(el.icon, el.color, Math.min(el.width, el.height) * this.zoom);
    },

    previewText(content: string) {
      return content
        .replace(/\{\{page\}\}/g, String(this.activePageIndex + 1))
        .replace(/\{\{pages\}\}/g, String(this.doc.pages.length));
    },

    displayTextContent(el: TextElement) {
      let content = this.previewText(el.content || "");
      if (el.listStyle === "bullet") {
        content = content
          .split("\n")
          .map((l) => (l.trim() ? `• ${l}` : l))
          .join("\n");
      } else if (el.listStyle === "number") {
        let n = 1;
        content = content
          .split("\n")
          .map((l) => (l.trim() ? `${n++}. ${l}` : l))
          .join("\n");
      }
      return content;
    },

    textInnerStyle(el: TextElement) {
      return {
        fontSize: `${el.fontSize * this.zoom}px`,
        fontFamily: fontCssFamily(el.fontFamily, this.doc.customFonts),
        fontWeight: el.fontWeight,
        fontStyle: el.fontStyle || "normal",
        textDecoration: el.underline ? "underline" : "none",
        letterSpacing: `${(el.letterSpacing || 0) * this.zoom}px`,
        lineHeight: String(el.lineHeight || 1.25),
        color: el.color,
        textAlign: el.align,
      };
    },

    shapeStyle(el: RectElement | EllipseElement) {
      const radius =
        el.type === "ellipse" ? "50%" : `${((el as RectElement).cornerRadius || 0) * this.zoom}px`;
      const rect = el.type === "rect" ? (el as RectElement) : null;
      const mix =
        rect?.markup === "highlight" ? "multiply" : undefined;
      return {
        backgroundColor: el.fill,
        border: el.strokeWidth > 0 ? `${el.strokeWidth * this.zoom}px solid ${el.stroke}` : "none",
        boxSizing: "border-box" as const,
        borderRadius: radius,
        mixBlendMode: mix as "multiply" | undefined,
      };
    },

    thumbElementStyle(el: PdfElement) {
      return `left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${Math.max(el.height, 2)}px;opacity:${el.opacity};`;
    },

    thumbPreview(el: PdfElement) {
      if (el.type === "text" || el.type === "sticky") {
        return `<span style="font-size:${el.fontSize}px;color:${el.color};background:${el.type === "sticky" ? el.fill : "transparent"}">${escapeHtml(el.content.slice(0, 28))}</span>`;
      }
      if (el.type === "image" || el.type === "signature") {
        return `<img src="${el.src}" style="width:100%;height:100%;object-fit:contain" />`;
      }
      if (el.type === "line" || el.type === "divider" || el.type === "arrow") {
        return `<svg width="100%" height="100%" style="overflow:visible"><line x1="0" y1="50%" x2="100%" y2="50%" stroke="${"stroke" in el ? el.stroke : "#333"}" stroke-width="2"/></svg>`;
      }
      if (el.type === "badge" || el.type === "stamp") {
        return `<span style="color:${el.color};font-size:10px;font-weight:bold">${escapeHtml(el.label)}</span>`;
      }
      if (el.type === "checkbox" || el.type === "formCheck") {
        return `<span style="font-size:10px">${"checked" in el && el.checked ? "☑" : "☐"} ${escapeHtml(("label" in el ? el.label : "").slice(0, 16))}</span>`;
      }
      if (el.type === "formText" || el.type === "formSelect") {
        return `<span style="font-size:10px;border:1px solid #a39a8e;padding:2px">${escapeHtml(el.name)}</span>`;
      }
      if (el.type === "icon") {
        return iconSvg(el.icon, el.color, 16);
      }
      if (el.type === "table") {
        return `<div style="width:100%;height:100%;background:#e4ddd1;border:1px solid #a39a8e"></div>`;
      }
      if (el.type === "rect" || el.type === "ellipse") {
        const radius = el.type === "ellipse" ? "50%" : `${el.cornerRadius || 0}px`;
        return `<div style="width:100%;height:100%;background:${el.fill};border-radius:${radius}"></div>`;
      }
      return "";
    },

    startTextEdit(el: TextElement | StickyElement) {
      this.editingTextId = el.id;
      this.selectedIds = [el.id];
      queueMicrotask(() => {
        const node = document.querySelector<HTMLElement>(`[data-edit-id="${el.id}"]`);
        if (!node) return;
        node.innerText = el.content;
        node.focus();
      });
    },

    finishTextEdit(event: FocusEvent, el: TextElement | StickyElement) {
      const target = event.target as HTMLElement;
      el.content = target.innerText;
      this.editingTextId = null;
      this.commit();
    },

    updateTableCell(row: number, col: number, value: string) {
      const el = this.selected;
      if (!el || el.type !== "table") return;
      const idx = row * el.cols + col;
      el.cells[idx] = value;
      this.persistSoft();
    },

    copySelected() {
      const els = this.selectedElements;
      if (!els.length) return;
      clipboard = els.map((el) => structuredClone(el) as PdfElement);
      try {
        void navigator.clipboard.writeText(
          JSON.stringify({ type: "pdf-studio-elements", elements: clipboard }),
        );
      } catch {
        /* ignore */
      }
    },

    cutSelected() {
      this.copySelected();
      this.deleteSelected();
    },

    pasteClipboard(offset = 20) {
      if (!clipboard.length) return;
      const copies = clipboard.map((el) => cloneElement(el, offset));
      for (const c of copies) {
        c.groupId = undefined;
        if (this.editingMaster) {
          if (!this.doc.master) this.doc.master = { header: [], footer: [] };
          const zone = this.masterZone === "footer" ? this.doc.master.footer : this.doc.master.header;
          zone.push(c);
        } else {
          this.activePage.elements.push(c);
        }
      }
      this.selectedIds = copies.map((c) => c.id);
      this.commit();
    },

    pasteInPlace() {
      this.pasteClipboard(0);
    },

    duplicateSelected() {
      const els = this.selectedElements;
      if (!els.length) return;
      const copies = els.map((el) => cloneElement(el));
      for (const c of copies) {
        if (this.editingMaster) {
          if (!this.doc.master) this.doc.master = { header: [], footer: [] };
          const zone = this.masterZone === "footer" ? this.doc.master.footer : this.doc.master.header;
          zone.push(c);
        } else {
          this.activePage.elements.push(c);
        }
      }
      this.selectedIds = copies.map((c) => c.id);
      this.commit();
    },

    deleteSelected() {
      if (!this.selectedIds.length) return;
      const locked = this.selectedElements.some((e) => e.locked);
      if (locked && this.selectedElements.every((e) => e.locked)) return;
      const remove = new Set(
        this.selectedIds.filter((id) => {
          const el = this.workingElements.find((e) => e.id === id);
          return el && !el.locked;
        }),
      );
      if (this.editingMaster && this.doc.master) {
        this.doc.master.header = this.doc.master.header.filter((e) => !remove.has(e.id));
        this.doc.master.footer = this.doc.master.footer.filter((e) => !remove.has(e.id));
      } else {
        this.activePage.elements = this.activePage.elements.filter((e) => !remove.has(e.id));
      }
      this.selectedIds = [];
      this.commit();
    },

    groupSelected() {
      if (this.selectedIds.length < 2) return;
      const gid = uid();
      for (const el of this.selectedElements) {
        if (!el.locked) el.groupId = gid;
      }
      this.commit();
    },

    ungroupSelected() {
      for (const el of this.selectedElements) {
        el.groupId = undefined;
      }
      this.commit();
    },

    toggleLock() {
      if (!this.selected) return;
      const next = !this.selected.locked;
      for (const el of this.selectedElements) el.locked = next;
      this.commit();
    },

    bringForward() {
      const i = this.selectedIndex;
      const arr = this.workingElements;
      if (i < 0 || i >= arr.length - 1) return;
      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      this.commit();
    },

    sendBackward() {
      const i = this.selectedIndex;
      const arr = this.workingElements;
      if (i <= 0) return;
      [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
      this.commit();
    },

    bringToFront() {
      const i = this.selectedIndex;
      const arr = this.workingElements;
      if (i < 0 || i >= arr.length - 1) return;
      const [el] = arr.splice(i, 1);
      arr.push(el);
      this.commit();
    },

    sendToBack() {
      const i = this.selectedIndex;
      const arr = this.workingElements;
      if (i <= 0) return;
      const [el] = arr.splice(i, 1);
      arr.unshift(el);
      this.commit();
    },

    alignSelected(edge: "left" | "center" | "right" | "top" | "middle" | "bottom") {
      const els = this.selectedElements.filter((e) => !e.locked);
      if (!els.length) return;
      const { width, height } = this.pageSize;
      const margin = this.marginGuidePt;
      if (els.length === 1) {
        const el = els[0];
        if (edge === "left") el.x = margin;
        if (edge === "center") el.x = Math.round((width - el.width) / 2);
        if (edge === "right") el.x = Math.round(width - el.width - margin);
        if (edge === "top") el.y = margin;
        if (edge === "middle") el.y = Math.round((height - el.height) / 2);
        if (edge === "bottom") el.y = Math.round(height - el.height - margin);
      } else {
        const minX = Math.min(...els.map((e) => e.x));
        const maxX = Math.max(...els.map((e) => e.x + e.width));
        const minY = Math.min(...els.map((e) => e.y));
        const maxY = Math.max(...els.map((e) => e.y + e.height));
        for (const el of els) {
          if (edge === "left") el.x = minX;
          if (edge === "right") el.x = maxX - el.width;
          if (edge === "center") el.x = Math.round((minX + maxX - el.width) / 2);
          if (edge === "top") el.y = minY;
          if (edge === "bottom") el.y = maxY - el.height;
          if (edge === "middle") el.y = Math.round((minY + maxY - el.height) / 2);
        }
      }
      this.commit();
    },

    distributeSelected(axis: "horizontal" | "vertical") {
      const els = this.selectedElements.filter((e) => !e.locked);
      if (els.length < 3) {
        this.showToast("Select 3+ elements to distribute");
        return;
      }
      distributeElements(els, axis);
      this.commit();
    },

    toggleVisibility(id?: string) {
      const targets = id
        ? this.workingElements.filter((e) => e.id === id)
        : this.selectedElements;
      if (!targets.length) return;
      const next = targets[0].visible === false;
      for (const el of targets) el.visible = next;
      this.commit();
    },

    isVisible(el: PdfElement) {
      return el.visible !== false;
    },

    reorderLayer(fromId: string, toId: string) {
      if (fromId === toId) return;
      const arr = this.workingElements;
      const from = arr.findIndex((e) => e.id === fromId);
      const to = arr.findIndex((e) => e.id === toId);
      if (from < 0 || to < 0) return;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      this.commit();
    },

    onLayerDragStart(id: string) {
      this.layerDragId = id;
    },

    onLayerDrop(toId: string) {
      if (!this.layerDragId) return;
      this.reorderLayer(this.layerDragId, toId);
      this.layerDragId = null;
    },

    nudge(dx: number, dy: number, fine: boolean) {
      const step = fine ? 1 : this.snapEnabled ? 8 : 4;
      for (const el of this.selectedElements) {
        if (el.locked) continue;
        el.x += dx * step;
        el.y += dy * step;
      }
      this.commit();
    },

    addGuideFromRuler(axis: "x" | "y", event: MouseEvent) {
      const { x, y } = this.pageCoords(event);
      const guide: GuideLine = {
        id: uid(),
        axis,
        position: axis === "x" ? this.snap(x) : this.snap(y),
      };
      if (!this.doc.guides) this.doc.guides = [];
      this.doc.guides.push(guide);
      this.drag = { mode: "guide", axis, id: guide.id };
      this.commit(false);
    },

    removeGuide(id: string) {
      this.doc.guides = (this.doc.guides || []).filter((g) => g.id !== id);
      this.commit();
    },

    toggleEditMaster() {
      this.editingMaster = !this.editingMaster;
      this.selectedIds = [];
      if (this.editingMaster && !this.doc.master) {
        this.doc.master = { header: [], footer: [] };
      }
      if (!this.editingMaster) this.masterZone = "header";
    },

    setMasterZone(zone: "header" | "footer") {
      this.masterZone = zone;
      this.selectedIds = [];
      if (!this.editingMaster) this.toggleEditMaster();
    },

    togglePageApplyMaster() {
      this.activePage.applyMaster = !(this.activePage.applyMaster !== false);
      this.commit();
    },

    applyMarginPreset(preset: MarginPreset) {
      const pt = MARGIN_PRESETS[preset];
      this.doc.marginGuide = pt;
      this.showGuides = pt > 0;
      this.saveSettings();
      this.commit(false);
      this.showToast(pt ? `Margin ${preset} (${pt}pt)` : "Margins off");
    },

    applyMarginGuidesAsNamed() {
      const m = this.marginGuidePt;
      if (m <= 0) {
        this.showToast("Set a margin preset first");
        return;
      }
      const { width, height } = this.pageSize;
      if (!this.doc.guides) this.doc.guides = [];
      this.doc.guides = this.doc.guides.filter((g) => !g.name?.startsWith("Margin "));
      this.doc.guides.push(...marginGuideLines(width, height, m));
      this.commit();
      this.showToast("Named margin guides added");
    },

    renameGuide(id: string, name: string) {
      const g = (this.doc.guides || []).find((x) => x.id === id);
      if (!g) return;
      g.name = name.trim() || undefined;
      this.persistSoft();
    },

    addNamedGuide(axis: "x" | "y", position: number, name: string) {
      if (!this.doc.guides) this.doc.guides = [];
      this.doc.guides.push({
        id: uid(),
        axis,
        position: this.snap(position),
        name: name.trim() || undefined,
      });
      this.commit();
    },

    setExportPreset(intent: "screen" | "print") {
      if (intent === "screen") {
        this.exportSettings = {
          ...this.exportSettings,
          intent: "screen",
          margin: 0,
          imageQuality: 0.72,
          compressImages: true,
          pdfaLite: false,
        };
      } else {
        this.exportSettings = {
          ...this.exportSettings,
          intent: "print",
          margin: Math.max(this.exportSettings.margin, 36),
          imageQuality: 0.95,
          compressImages: false,
          pdfaLite: true,
        };
      }
      this.saveExportSettings();
    },

    resizeSelectedTable(rows: number, cols: number) {
      const el = this.selected;
      if (!el || el.type !== "table") return;
      resizeTable(el, rows, cols);
      this.commit();
    },

    tableInsertRow() {
      const el = this.selected;
      if (!el || el.type !== "table") return;
      insertTableRow(el, el.rows - 1);
      this.commit();
    },

    tableInsertCol() {
      const el = this.selected;
      if (!el || el.type !== "table") return;
      insertTableCol(el, el.cols - 1);
      this.commit();
    },

    tableDeleteRow() {
      const el = this.selected;
      if (!el || el.type !== "table") return;
      deleteTableRow(el, el.rows - 1);
      this.commit();
    },

    tableDeleteCol() {
      const el = this.selected;
      if (!el || el.type !== "table") return;
      deleteTableCol(el, el.cols - 1);
      this.commit();
    },

    setImageObjectFit(fit: "contain" | "cover" | "fill") {
      const el = this.selected;
      if (!el || el.type !== "image") return;
      el.objectFit = fit;
      this.commit();
    },

    collectDocFontExtras(): { id: string; label: string }[] {
      const extras: { id: string; label: string }[] = [];
      const seen = new Set<string>();
      const visit = (family: string | undefined) => {
        if (!family || seen.has(family)) return;
        if (!family.startsWith("google:")) return;
        seen.add(family);
        const name = family.slice("google:".length).trim();
        if (name) extras.push({ id: family, label: name });
      };
      for (const page of this.doc.pages) {
        for (const el of page.elements) {
          if (el.type === "text") visit(el.fontFamily);
        }
      }
      for (const el of [...(this.doc.master?.header || []), ...(this.doc.master?.footer || [])]) {
        if (el.type === "text") visit(el.fontFamily);
      }
      return extras;
    },

    syncDocumentFonts() {
      const customExtras = (this.doc.customFonts || []).map((f: { id: string; name: string }) => ({
        id: `custom:${f.id}`,
        label: f.name || f.id,
      }));
      const extras = [...this.collectDocFontExtras(), ...customExtras];
      this.fontOptions = allFontOptions(extras);
      for (const f of GOOGLE_FONTS) ensureGoogleFontStylesheet(f.googleFamily);
      for (const extra of extras) {
        const name = googleFamilyCssName(extra.id);
        if (name) ensureGoogleFontStylesheet(name);
      }
      for (const font of this.doc.customFonts || []) {
        ensureCustomFontFace(font);
      }
    },

    onFontFamilyChange() {
      const el = this.selected;
      if (el?.type === "text") {
        const name = googleFamilyCssName(el.fontFamily);
        if (name) ensureGoogleFontStylesheet(name);
        if (typeof el.fontFamily === "string" && el.fontFamily.startsWith("custom:")) {
          const id = el.fontFamily.slice("custom:".length);
          const font = (this.doc.customFonts || []).find((f: { id: string }) => f.id === id);
          if (font) ensureCustomFontFace(font);
        }
      }
      this.persist();
    },

    async uploadCustomFont(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("font", file);
      try {
        const res = await apiFetch("/api/upload/font", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Font upload failed");
        if (!this.doc.customFonts) this.doc.customFonts = [];
        const entry = { id: data.id as string, name: data.name as string, url: data.url as string };
        const idx = this.doc.customFonts.findIndex((f: { id: string }) => f.id === entry.id);
        if (idx >= 0) this.doc.customFonts[idx] = entry;
        else this.doc.customFonts.push(entry);
        ensureCustomFontFace(entry);
        this.syncDocumentFonts();
        if (this.selected?.type === "text") {
          this.selected.fontFamily = `custom:${entry.id}`;
        }
        this.commit();
        this.showToast(`Font “${entry.name}” added`);
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Font upload failed", 4000);
      } finally {
        input.value = "";
      }
    },

    removeCustomFont(id: string) {
      if (!this.doc.customFonts?.length) return;
      this.doc.customFonts = this.doc.customFonts.filter((f: { id: string }) => f.id !== id);
      const fontId = `custom:${id}`;
      const reassign = (els: PdfElement[]) => {
        for (const el of els) {
          if (el.type === "text" && el.fontFamily === fontId) el.fontFamily = "Helvetica";
        }
      };
      for (const page of this.doc.pages) reassign(page.elements);
      reassign(this.doc.master?.header || []);
      reassign(this.doc.master?.footer || []);
      this.syncDocumentFonts();
      this.commit();
    },

    fillLoremIpsum(size: LoremSize = "medium") {
      const el = this.selected;
      if (!el || el.type !== "text" || el.locked) return;
      el.content = loremIpsum(size);
      el.markdown = false;
      if (size === "long") {
        el.width = Math.max(el.width, 360);
        el.height = Math.max(el.height, 160);
      } else if (size === "medium") {
        el.width = Math.max(el.width, 320);
        el.height = Math.max(el.height, 100);
      }
      this.commit();
      this.showToast("Lorem ipsum filled");
    },

    renderMarkdownHtml(source: string) {
      return markdownToHtml(source || "");
    },

    toggleMarkdown(enabled: boolean) {
      const el = this.selected;
      if (!el || el.type !== "text" || el.locked) return;
      el.markdown = Boolean(enabled);
      if (el.markdown) {
        el.width = Math.max(el.width, 280);
        el.height = Math.max(el.height, 120);
      }
      this.commit();
      this.showToast(el.markdown ? "Markdown on" : "Markdown off");
    },

    async searchGoogleFonts() {
      this.googleFontsBusy = true;
      try {
        const q = encodeURIComponent(this.googleFontQuery.trim());
        const res = await apiFetch(`/api/fonts/google${q ? `?q=${q}` : ""}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Font search failed");
        this.googleFontResults = (data.items || []) as {
          id: string;
          label: string;
          googleFamily: string;
        }[];
        this.googleFontsFromApi = Boolean(data.fromApi);
        for (const item of this.googleFontResults.slice(0, 12)) {
          ensureGoogleFontStylesheet(item.googleFamily);
        }
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Font search failed");
        this.googleFontResults = [];
      } finally {
        this.googleFontsBusy = false;
      }
    },

    addGoogleFont(item: { id: string; label: string; googleFamily: string }) {
      ensureGoogleFontStylesheet(item.googleFamily);
      const fontId = item.id.startsWith("google:") ? item.id : `google:${item.googleFamily}`;
      const label = item.label || item.googleFamily;
      if (!this.fontOptions.some((f: { id: string }) => f.id === fontId)) {
        this.fontOptions = [...this.fontOptions, { id: fontId, label }];
      }
      if (this.selected?.type === "text") {
        this.selected.fontFamily = fontId;
        this.persist();
      }
      this.showToast(`Added ${label}`);
    },

    setImageCrop(edge: "top" | "right" | "bottom" | "left", value: number) {
      const el = this.selected;
      if (!el || el.type !== "image") return;
      const v = Math.min(40, Math.max(0, Math.round(value) || 0));
      el.crop = {
        top: el.crop?.top ?? 0,
        right: el.crop?.right ?? 0,
        bottom: el.crop?.bottom ?? 0,
        left: el.crop?.left ?? 0,
        [edge]: v,
      };
      this.commit();
    },

    resetImageCrop() {
      const el = this.selected;
      if (!el || el.type !== "image") return;
      el.crop = undefined;
      this.commit();
    },

    startReplaceImage() {
      if (this.selected?.type !== "image") return;
      this.replaceImageId = this.selected.id;
      const input = (this as unknown as { $refs: { imageInput: HTMLInputElement } }).$refs.imageInput;
      input?.click();
    },

    addMasterPageNumber() {
      if (!this.doc.master) this.doc.master = { header: [], footer: [] };
      const el = createText(this.pageSize.width / 2 - 40, this.pageSize.height - 48, {
        content: "Page {{page}} / {{pages}}",
        fontSize: 10,
        color: "#746c62",
        width: 80,
        height: 20,
        align: "center",
      });
      this.doc.master.footer.push(el);
      this.commit();
    },

    setWatermarkText(text: string) {
      this.doc.watermark = {
        type: "text",
        text,
        opacity: 0.12,
        rotation: -30,
        fontSize: 56,
        color: "#a39a8e",
      };
      this.commit();
    },

    openWatermarkModal() {
      const w = this.doc.watermark;
      this.watermarkDraft = {
        type: w?.type === "image" ? "image" : "text",
        text: w?.text || "DRAFT",
        opacity: w?.opacity ?? 0.12,
        rotation: w?.rotation ?? -30,
        fontSize: w?.fontSize ?? 56,
        color: w?.color || "#a39a8e",
        src: w?.src || "",
      };
      this.showWatermarkModal = true;
    },

    applyWatermarkDraft() {
      const d = this.watermarkDraft;
      if (d.type === "image") {
        if (!d.src) {
          this.showToast("Upload a watermark image first.", 3200);
          return;
        }
        this.doc.watermark = {
          type: "image",
          src: d.src,
          opacity: d.opacity,
          rotation: d.rotation,
        };
      } else {
        this.doc.watermark = {
          type: "text",
          text: (d.text || "DRAFT").trim() || "DRAFT",
          opacity: d.opacity,
          rotation: d.rotation,
          fontSize: d.fontSize,
          color: d.color,
        };
      }
      this.showWatermarkModal = false;
      this.commit();
    },

    async onWatermarkImageSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      try {
        const form = new FormData();
        form.append("image", file);
        const res = await apiFetch("/api/upload", { method: "POST", body: form });
        if (!res.ok) throw new Error("Upload failed");
        const data = (await res.json()) as { url: string };
        this.watermarkDraft.type = "image";
        this.watermarkDraft.src = data.url;
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Could not upload image", 4000);
      } finally {
        input.value = "";
      }
    },

    formPreviewValue(name: string, fallback: string | boolean = "") {
      if (Object.prototype.hasOwnProperty.call(this.formPreviewValues, name)) {
        return this.formPreviewValues[name];
      }
      return fallback;
    },

    setFormPreviewValue(name: string, value: string | boolean) {
      this.formPreviewValues = { ...this.formPreviewValues, [name]: value };
    },

    clearWatermark() {
      this.doc.watermark = null;
      this.commit();
    },

    runFind() {
      const q = this.findQuery.trim().toLowerCase();
      this.findMatches = [];
      if (!q) return;
      this.doc.pages.forEach((page, pageIndex) => {
        for (const el of page.elements) {
          if (el.type === "text" || el.type === "sticky") {
            if (el.content.toLowerCase().includes(q)) {
              this.findMatches.push({ pageIndex, elId: el.id, field: "content" });
            }
          } else if (el.type === "badge" || el.type === "stamp") {
            if (el.label.toLowerCase().includes(q)) {
              this.findMatches.push({ pageIndex, elId: el.id, field: "label" });
            }
          } else if (el.type === "table") {
            if (el.cells.some((c) => c.toLowerCase().includes(q))) {
              this.findMatches.push({ pageIndex, elId: el.id, field: "cells" });
            }
          } else if (el.type === "checkbox" || el.type === "formCheck") {
            if (el.label.toLowerCase().includes(q)) {
              this.findMatches.push({ pageIndex, elId: el.id, field: "label" });
            }
          }
        }
      });
      this.findIndex = this.findMatches.length ? 0 : -1;
      this.jumpToFindMatch();
    },

    jumpToFindMatch() {
      const m = this.findMatches[this.findIndex];
      if (!m) return;
      this.activePageIndex = m.pageIndex;
      this.selectedIds = [m.elId];
      this.findHighlightId = m.elId;
    },

    findNext() {
      if (!this.findMatches.length) return;
      this.findIndex = (this.findIndex + 1) % this.findMatches.length;
      this.jumpToFindMatch();
    },

    replaceCurrent() {
      const m = this.findMatches[this.findIndex];
      if (!m) return;
      const page = this.doc.pages[m.pageIndex];
      const el = page?.elements.find((e) => e.id === m.elId);
      if (!el) return;
      const q = this.findQuery;
      const r = this.replaceQuery;
      if (el.type === "text" || el.type === "sticky") {
        el.content = el.content.split(q).join(r);
      } else if (
        el.type === "badge" ||
        el.type === "stamp" ||
        el.type === "checkbox" ||
        el.type === "formCheck"
      ) {
        el.label = el.label.split(q).join(r);
      } else if (el.type === "table") {
        el.cells = el.cells.map((c) => c.split(q).join(r));
      }
      this.commit();
      this.runFind();
    },

    replaceAll() {
      const q = this.findQuery;
      if (!q) return;
      const r = this.replaceQuery;
      for (const page of this.doc.pages) {
        for (const el of page.elements) {
          if (el.type === "text" || el.type === "sticky") el.content = el.content.split(q).join(r);
          else if (
            el.type === "badge" ||
            el.type === "stamp" ||
            el.type === "checkbox" ||
            el.type === "formCheck"
          ) {
            el.label = el.label.split(q).join(r);
          } else if (el.type === "table") el.cells = el.cells.map((c) => c.split(q).join(r));
        }
      }
      this.commit();
      this.runFind();
    },

    addCommentAt(x: number, y: number) {
      this.commentPlacement = { x, y };
      this.commentDraft = "";
    },

    submitCommentDraft() {
      const body = this.commentDraft.trim();
      const place = this.commentPlacement;
      if (!body || !place) return;
      if (!this.doc.comments) this.doc.comments = [];
      this.doc.comments.push({
        id: uid(),
        pageId: this.activePage.id,
        x: place.x,
        y: place.y,
        body,
        author: this.authorName || "Reviewer",
        resolved: false,
        createdAt: new Date().toISOString(),
      });
      this.commentDraft = "";
      this.commentPlacement = null;
      this.tool = "select";
      this.commit();
    },

    cancelCommentDraft() {
      this.commentPlacement = null;
      this.commentDraft = "";
    },

    toggleCommentResolved(id: string) {
      const c = (this.doc.comments || []).find((c) => c.id === id);
      if (!c) return;
      c.resolved = !c.resolved;
      this.commit();
    },

    deleteComment(id: string) {
      this.doc.comments = (this.doc.comments || []).filter((c) => c.id !== id);
      this.commit();
    },

    saveBrand() {
      storeSet(BRAND_KEY, JSON.stringify(this.brand));
    },

    saveAuthorName() {
      storeSet(AUTHOR_KEY, this.authorName || "Reviewer");
    },

    applyBrandToSelection() {
      for (const el of this.selectedElements) {
        if (el.type === "text") {
          el.fontFamily = this.brand.defaultFont || el.fontFamily;
          if (this.brand.colors[2]) el.color = this.brand.colors[2];
        }
        if (el.type === "rect" && this.brand.colors[0]) el.fill = this.brand.colors[0];
      }
      this.commit();
      this.saveBrand();
    },

    async onBrandLogoSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("image", file);
      try {
        const res = await apiFetch("/api/upload", { method: "POST", body: form });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Upload failed");
        this.brand.logoUrl = payload.url;
        this.brand.logoName = payload.name;
        this.saveBrand();
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Logo upload failed", 4000);
      } finally {
        input.value = "";
      }
    },

    insertBrandLogo() {
      if (!this.brand.logoUrl) return;
      const el = createImage(40, 40, {
        src: this.brand.logoUrl,
        name: this.brand.logoName || "Logo",
        width: 120,
        height: 60,
      });
      this.pushElement(el);
    },

    async runPdfImport(file: File, importMode: "overlay" | "editable") {
      try {
        const document = await importPdfInBrowser(file, {
          mode: importMode,
          ocr: importMode === "editable" && this.pdfImportOcr,
        });
        this.doc = normalizeDoc(document);
        this.activePageIndex = 0;
        this.pageJumpDraft = "1";
        this.selectedIds = [];
        this.leftRail = "pages";
        this.showLeftPanel = true;
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.commit(false);
        await this.persistImportedPdfForDoc();
        await this.refreshPdfUnderlay();
        // Progressive thumbs — do not block the UI on large PDFs
        void this.refreshPageThumbUnderlays();
        const textCount = document.pages.reduce((n, p) => n + p.elements.length, 0);
        this.showToast(
          importMode === "editable"
            ? `PDF imported as editable (${textCount} element${textCount === 1 ? "" : "s"}) · use Pages panel or bottom bar`
            : `PDF imported (${document.pages.length} pages) · switch pages in the Pages panel or bottom bar`,
          3600,
        );
      } catch (err) {
        clearSessionImportedPdf();
        invalidatePdfPreviewCache();
        this.pdfUnderlaySrc = null;
        this.pageThumbUnderlays = {};
        this.showToast(err instanceof Error ? err.message : "Could not import PDF", 4000);
        throw err;
      }
    },

    async onPdfImportSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        this.showToast("Please choose a PDF file.", 3200);
        input.value = "";
        this.pdfImportMode = "overlay";
        return;
      }
      const mode = this.pdfImportMode;
      this.pdfImportMode = "overlay";
      try {
        if (mode === "reattach") {
          const { pageCount, name } = await reattachPdfSession(file, this.doc.pages.length);
          this.doc.importedPdf = {
            pageCount,
            name,
            ephemeral: true,
            mode: this.doc.importedPdf?.mode ?? "overlay",
          };
          invalidatePdfPreviewCache();
          this.commit(false);
          await this.persistImportedPdfForDoc();
          await this.refreshPdfUnderlay();
          await this.refreshPageThumbUnderlays();
          this.showToast("PDF re-attached — underlay restored");
          return;
        }
        await this.runPdfImport(file, mode === "editable" ? "editable" : "overlay");
      } catch {
        /* toast already shown in runPdfImport / reattach path */
      } finally {
        input.value = "";
      }
    },

    openExportModal() {
      this.showExportModal = true;
    },

    saveExportSettings() {
      storeSet(EXPORT_KEY, JSON.stringify(this.exportSettings));
    },

    onKeydown(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (event.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        this.undo();
        return;
      }
      if (
        (mod && event.key.toLowerCase() === "y") ||
        (mod && event.shiftKey && event.key.toLowerCase() === "z")
      ) {
        event.preventDefault();
        this.redo();
        return;
      }
      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        this.duplicateSelected();
        return;
      }
      if (mod && event.key.toLowerCase() === "c") {
        event.preventDefault();
        this.copySelected();
        return;
      }
      if (mod && event.key.toLowerCase() === "x") {
        event.preventDefault();
        this.cutSelected();
        return;
      }
      if (mod && event.key.toLowerCase() === "v") {
        event.preventDefault();
        if (event.shiftKey) this.pasteInPlace();
        else this.pasteClipboard();
        return;
      }
      if (mod && event.key.toLowerCase() === "g" && !event.shiftKey) {
        event.preventDefault();
        this.groupSelected();
        return;
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === "g") {
        event.preventDefault();
        this.ungroupSelected();
        return;
      }
      if (mod && event.key.toLowerCase() === "f") {
        event.preventDefault();
        this.showFindReplace = true;
        return;
      }
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        this.commit(false);
        this.saveState = "saving";
        try {
          const snapshot = JSON.stringify(this.doc);
          storeSet(STORAGE_KEY, snapshot);
          storeSet(docKey(this.doc.id), snapshot);
          this.saveState = "saved";
          this.showToast("Saved");
        } catch (err) {
          this.saveState = "idle";
          this.showToast(persistErrorMessage(err), 4500);
        }
        return;
      }
      if (mod && event.key.toLowerCase() === "e") {
        event.preventDefault();
        this.openExportModal();
        return;
      }

      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        this.showShortcuts = !this.showShortcuts;
        return;
      }

      if (event.key === "Escape") {
        if (this.commentPlacement) {
          this.cancelCommentDraft();
          return;
        }
        if (this.showShortcuts) {
          this.showShortcuts = false;
          return;
        }
        if (this.isCompact && (this.showLeftPanel || this.showInspectorPanel)) {
          this.closeOverlayPanels();
          return;
        }
        if (this.editingMaster) {
          this.editingMaster = false;
          this.masterZone = "header";
          this.selectedIds = [];
          return;
        }
        this.selectedIds = [];
        this.editingTextId = null;
        this.tool = "select";
        this.pendingLibraryKind = null;
        this.placeHint = false;
        this.libraryKeepPlacing = false;
        this.findHighlightId = null;
        this.showExportModal = false;
        this.showSignatureModal = false;
        this.showFindReplace = false;
        this.showFileMenu = false;
        this.showTemplates = false;
        return;
      }

      if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        this.leftRail = "insert";
        this.showLibrary = true;
        this.showLeftPanel = true;
        if (this.isCompact) this.showInspectorPanel = false;
        queueMicrotask(() => {
          const input = (this as unknown as { $refs: { librarySearch?: HTMLInputElement } }).$refs
            .librarySearch;
          input?.focus();
        });
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        this.deleteSelected();
        return;
      }

      // Acrobat-like page navigation (always available)
      if (event.key === "PageDown" || (event.key === "ArrowDown" && event.altKey)) {
        event.preventDefault();
        this.nextPage();
        return;
      }
      if (event.key === "PageUp" || (event.key === "ArrowUp" && event.altKey)) {
        event.preventDefault();
        this.prevPage();
        return;
      }
      if (event.key === "Home" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        this.goToPage(0);
        return;
      }
      if (event.key === "End" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        this.goToPage(this.doc.pages.length - 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (!this.selectedIds.length) {
          this.prevPage();
          return;
        }
        this.nudge(-1, 0, event.shiftKey);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (!this.selectedIds.length) {
          this.nextPage();
          return;
        }
        this.nudge(1, 0, event.shiftKey);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        this.nudge(0, -1, event.shiftKey);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.nudge(0, 1, event.shiftKey);
        return;
      }

      const map: Record<string, Tool> = {
        v: "select",
        t: "text",
        r: "rect",
        o: "ellipse",
        l: "line",
        h: "highlight",
        u: "underline",
        k: "strike",
      };
      const tool = map[event.key.toLowerCase()];
      if (tool) {
        this.tool = tool;
        this.pendingLibraryKind = null;
        this.placeHint = false;
      }
    },

    async onImageSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      const form = new FormData();
      form.append("image", file);
      const replaceId = this.replaceImageId;

      try {
        const res = await apiFetch("/api/upload", { method: "POST", body: form });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || "Upload failed");

        if (replaceId) {
          const existing = this.workingElements.find((e) => e.id === replaceId);
          if (existing && existing.type === "image") {
            existing.src = payload.url as string;
            existing.name = payload.name as string;
            const nw = payload.width as number;
            const nh = payload.height as number;
            if (nw && nh) {
              const scale = Math.min(existing.width / nw, existing.height / nh, 1);
              existing.width = Math.round(nw * scale);
              existing.height = Math.round(nh * scale);
            }
            this.commit();
            this.showToast("Image replaced");
          }
        } else {
          const imageEl = createImage(80, 80, {
            src: payload.url as string,
            name: payload.name as string,
            width: payload.width as number,
            height: payload.height as number,
          });
          this.pushElement(imageEl);
        }
      } catch (err) {
        console.error(err);
        this.showToast(err instanceof Error ? err.message : "Could not upload image.", 4000);
      } finally {
        this.replaceImageId = null;
        input.value = "";
      }
    },

    openSignatureModal(
      x: number | null = null,
      y: number | null = null,
      replaceId: string | null = null,
    ) {
      this.signaturePlace = x != null && y != null ? { x, y } : null;
      this.signatureReplaceId = replaceId;
      this.signatureTab = "draw";
      this.signatureTyped = "";
      this.signatureHasInk = false;
      this.signatureBusy = false;
      this.showSignatureModal = true;
      this.tool = "select";
      this.pendingLibraryKind = null;
      this.placeHint = false;
      setTimeout(() => this.resetSignaturePad(), 40);
    },

    closeSignatureModal() {
      this.showSignatureModal = false;
      this.signaturePlace = null;
      this.signatureReplaceId = null;
      this.signatureHasInk = false;
    },

    signaturePad(): HTMLCanvasElement | null {
      return (
        (this as unknown as { $refs: { signaturePad?: HTMLCanvasElement } }).$refs.signaturePad ??
        null
      );
    },

    resetSignaturePad() {
      const canvas = this.signaturePad();
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || 520;
      const cssH = canvas.clientHeight || 180;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      this.signatureHasInk = false;
    },

    clearSignaturePad() {
      this.resetSignaturePad();
      this.signatureTyped = "";
    },

    signaturePointerPos(event: PointerEvent) {
      const canvas = this.signaturePad();
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    },

    onSignaturePointerDown(event: PointerEvent) {
      if (this.signatureTab !== "draw") return;
      const canvas = this.signaturePad();
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      canvas.setPointerCapture(event.pointerId);
      const { x, y } = this.signaturePointerPos(event);
      ctx.strokeStyle = this.signatureInk;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      this.signatureHasInk = true;
      (this as unknown as { _sigDrawing: boolean })._sigDrawing = true;
    },

    onSignaturePointerMove(event: PointerEvent) {
      if (!(this as unknown as { _sigDrawing?: boolean })._sigDrawing) return;
      const canvas = this.signaturePad();
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;
      const { x, y } = this.signaturePointerPos(event);
      ctx.lineTo(x, y);
      ctx.stroke();
    },

    onSignaturePointerUp(event: PointerEvent) {
      const canvas = this.signaturePad();
      canvas?.releasePointerCapture(event.pointerId);
      (this as unknown as { _sigDrawing: boolean })._sigDrawing = false;
    },

    renderTypedSignature() {
      const text = this.signatureTyped.trim();
      if (!text) {
        this.resetSignaturePad();
        return;
      }
      const canvas = this.signaturePad();
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const cssW = canvas.clientWidth || 520;
      const cssH = canvas.clientHeight || 180;
      this.resetSignaturePad();
      const again = this.signaturePad()?.getContext("2d");
      if (!again) return;
      again.fillStyle = this.signatureInk;
      again.textAlign = "center";
      again.textBaseline = "middle";
      let size = 64;
      again.font = `${size}px "Caveat", "Segoe Script", "Comic Sans MS", cursive`;
      while (size > 28 && again.measureText(text).width > cssW - 40) {
        size -= 2;
        again.font = `${size}px "Caveat", "Segoe Script", "Comic Sans MS", cursive`;
      }
      again.fillText(text, cssW / 2, cssH / 2);
      this.signatureHasInk = true;
    },

    async uploadSignatureBlob(blob: Blob, name: string) {
      const form = new FormData();
      form.append("image", blob, name);
      const res = await apiFetch("/api/upload", { method: "POST", body: form });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Signature upload failed");
      return payload as { url: string; name: string; width: number; height: number };
    },

    async placeSignatureFromPayload(payload: {
      url: string;
      name: string;
      width: number;
      height: number;
    }) {
      const maxW = 280;
      const scale = Math.min(1, maxW / Math.max(payload.width, 1));
      const width = Math.max(120, Math.round(payload.width * scale));
      const height = Math.max(48, Math.round(payload.height * scale));
      const page = this.pageSize;
      const x = this.snap(this.signaturePlace?.x ?? page.width / 2 - width / 2);
      const y = this.snap(this.signaturePlace?.y ?? page.height - height - 72);

      if (this.signatureReplaceId) {
        const existing = this.workingElements.find((e) => e.id === this.signatureReplaceId);
        if (existing && existing.type === "signature") {
          existing.src = payload.url;
          existing.name = payload.name || "Signature";
          existing.width = width;
          existing.height = height;
          this.commit();
          this.closeSignatureModal();
          return;
        }
      }

      const el = createSignature(x, y, {
        src: payload.url,
        name: payload.name || "Signature",
        width,
        height,
      });
      this.pushElement(el);
      this.closeSignatureModal();
    },

    async confirmSignature() {
      if (this.signatureBusy) return;
      try {
        this.signatureBusy = true;
        if (this.signatureTab === "type") {
          this.renderTypedSignature();
        }
        if (this.signatureTab === "upload") {
          (
            this as unknown as { $refs: { signatureFileInput: HTMLInputElement } }
          ).$refs.signatureFileInput.click();
          return;
        }
        const canvas = this.signaturePad();
        if (!canvas || !this.signatureHasInk) {
          this.showToast("Draw or type a signature first.", 3200);
          return;
        }
        const trimmed = trimSignatureCanvas(canvas);
        const blob = await new Promise<Blob | null>((resolve) =>
          trimmed.toBlob(resolve, "image/png"),
        );
        if (!blob) throw new Error("Could not capture signature");
        const payload = await this.uploadSignatureBlob(blob, "signature.png");
        await this.placeSignatureFromPayload({
          ...payload,
          name: this.signatureTyped.trim() || "Signature",
        });
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Could not add signature", 4000);
      } finally {
        this.signatureBusy = false;
      }
    },

    async onSignatureFileSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      try {
        this.signatureBusy = true;
        const payload = await this.uploadSignatureBlob(file, file.name);
        await this.placeSignatureFromPayload(payload);
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "Could not upload signature", 4000);
      } finally {
        this.signatureBusy = false;
        input.value = "";
      }
    },

    buildExportPayload() {
      const sessionBytes = getSessionImportedPdfBytes();
      const editableImport = this.doc.importedPdf?.mode === "editable";
      if (
        this.doc.importedPdf &&
        !editableImport &&
        !sessionBytes &&
        !this.doc.importedPdf.url
      ) {
        throw new Error(
          "Imported PDF bytes are missing. Re-import the PDF (or use Re-attach PDF), then export.",
        );
      }
      return {
        name: this.doc.name,
        pageSize: this.doc.pageSize,
        pageBackground: this.doc.pageBackground,
        pages: this.doc.pages,
        master: this.doc.master,
        watermark: this.doc.watermark,
        comments: this.doc.comments || [],
        bookmarks: this.doc.bookmarks || [],
        importedPdf: this.doc.importedPdf,
        importedPdfData:
          !editableImport && sessionBytes ? bytesToBase64(sessionBytes) : undefined,
        customFonts: this.doc.customFonts || [],
        exportSettings: this.exportSettings,
        userPassword: this.exportPassword?.trim() || undefined,
      };
    },

    async exportPdf() {
      this.saveExportSettings();
      this.exporting = true;
      this.showExportModal = false;
      try {
        const payload = this.buildExportPayload();
        this.exportPassword = "";
        const bytes = await exportPdfBytes(payload, (url, init) => apiFetch(url, init));
        const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
          type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.doc.name.replace(/[^\w.-]+/g, "_") || "document"}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
        this.showToast(err instanceof Error ? err.message : "Could not export PDF.", 4000);
      } finally {
        this.exporting = false;
      }
    },

    toggleLibrarySelect(id: string) {
      const set = new Set(this.librarySelectedIds as string[]);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      this.librarySelectedIds = [...set];
    },

    async batchExportLibraryZip() {
      const ids = this.librarySelectedIds as string[];
      if (!ids.length) {
        this.showToast("Select documents first");
        return;
      }
      this.showToast("Building ZIP…", 2000);
      try {
        const zip = new JSZip();
        const currentId = this.doc.id;
        for (const id of ids) {
          const raw = storeGet(docKey(id));
          if (!raw) continue;
          let doc: PdfDocument;
          try {
            doc = normalizeDoc(JSON.parse(raw) as PdfDocument);
          } catch {
            continue;
          }
          const payload = {
            name: doc.name,
            pageSize: doc.pageSize,
            pageBackground: doc.pageBackground,
            pages: doc.pages,
            master: doc.master,
            watermark: doc.watermark,
            comments: doc.comments || [],
            importedPdf: doc.importedPdf,
            customFonts: doc.customFonts || [],
            exportSettings: this.exportSettings,
          };
          // Library docs without session PDF bytes export elements only
          const bytes = await exportPdfBytes(payload, (url, init) => apiFetch(url, init));
          const filename = `${(doc.name || id).replace(/[^\w.-]+/g, "_")}.pdf`;
          zip.file(filename, bytes);
        }
        void currentId;
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "pdf-studio-docs.zip";
        a.click();
        URL.revokeObjectURL(url);
        this.showToast(`Exported ${ids.length} PDF(s) as ZIP`);
      } catch (err) {
        this.showToast(err instanceof Error ? err.message : "ZIP export failed", 4000);
      }
    },
  };
}

const AUDIT_TOKEN_KEY = "pdf-studio-audit-token";

type AuditLogRow = {
  id: string;
  ts: string;
  level: string;
  action: string;
  message: string;
  sessionId?: string;
  req?: {
    method?: string;
    path?: string;
    status?: number;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
  meta?: Record<string, unknown>;
};

function auditLogsPage(opts: { locked: boolean; tokenRequired: boolean }) {
  return {
    theme: (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark",
    locked: opts.locked,
    tokenRequired: opts.tokenRequired,
    token: "",
    q: "",
    level: "",
    action: "",
    events: [] as AuditLogRow[],
    total: 0,
    capacity: 0,
    counts: { info: 0, warn: 0, error: 0, all: 0 },
    loading: false,
    error: "",
    autoRefresh: true,
    selectedId: "" as string,
    showRaw: false,
    copied: "",
    _timer: 0 as number | ReturnType<typeof setInterval>,
    _copyTimer: 0 as number | ReturnType<typeof setTimeout>,

    get selected(): AuditLogRow | null {
      return this.events.find((e) => e.id === this.selectedId) ?? null;
    },

    init() {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "light" || savedTheme === "dark") {
        this.theme = savedTheme;
        document.documentElement.setAttribute("data-theme", savedTheme);
      }
      this.token = sessionStorage.getItem(AUDIT_TOKEN_KEY) || "";
      if (!this.locked) {
        void this.load();
        this.startAutoRefresh();
      } else if (this.token) {
        void this.unlock();
      }
    },

    toggleTheme() {
      this.theme = this.theme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", this.theme);
      localStorage.setItem(THEME_KEY, this.theme);
    },

    startAutoRefresh() {
      this.stopAutoRefresh();
      this._timer = setInterval(() => {
        if (this.autoRefresh && !this.locked) void this.load(true);
      }, 4000);
    },

    stopAutoRefresh() {
      if (this._timer) clearInterval(this._timer);
    },

    headers(): HeadersInit {
      const headers: Record<string, string> = {};
      if (this.token) headers["X-Audit-Token"] = this.token;
      return headers;
    },

    select(id: string) {
      this.selectedId = this.selectedId === id ? "" : id;
      this.showRaw = false;
    },

    setLevel(next: string) {
      this.level = this.level === next ? "" : next;
      void this.load();
    },

    onKey(e: KeyboardEvent) {
      if (this.locked) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!this.events.length) return;

      const idx = this.events.findIndex((ev) => ev.id === this.selectedId);
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const next = Math.min(this.events.length - 1, Math.max(0, idx + 1));
        this.selectedId = this.events[next].id;
        this.showRaw = false;
        this.scrollSelectedIntoView();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const next = Math.max(0, (idx < 0 ? 0 : idx) - 1);
        this.selectedId = this.events[next].id;
        this.showRaw = false;
        this.scrollSelectedIntoView();
      } else if (e.key === "Escape") {
        this.selectedId = "";
      }
    },

    scrollSelectedIntoView() {
      queueMicrotask(() => {
        document
          .querySelector<HTMLElement>(`#audit-stream .audit-row.is-selected`)
          ?.scrollIntoView({ block: "nearest" });
      });
    },

    async unlock() {
      this.error = "";
      if (this.tokenRequired && !this.token.trim()) {
        this.error = "Enter the audit token.";
        return;
      }
      sessionStorage.setItem(AUDIT_TOKEN_KEY, this.token.trim());
      this.token = this.token.trim();
      const ok = await this.load();
      if (ok) {
        this.locked = false;
        this.startAutoRefresh();
        if (new URLSearchParams(location.search).has("token")) {
          history.replaceState({}, "", "/audit-logs");
        }
      }
    },

    async load(silent = false): Promise<boolean> {
      if (!silent) this.loading = true;
      this.error = "";
      try {
        const params = new URLSearchParams();
        if (this.q.trim()) params.set("q", this.q.trim());
        if (this.level) params.set("level", this.level);
        if (this.action) params.set("action", this.action);
        params.set("limit", "150");

        const res = await fetch(`/api/audit-logs?${params}`, {
          headers: this.headers(),
          credentials: "same-origin",
        });
        if (res.status === 401) {
          this.locked = true;
          this.error = "Invalid or missing audit token.";
          return false;
        }
        if (!res.ok) {
          this.error = "Failed to load audit logs.";
          return false;
        }
        const data = (await res.json()) as {
          events: AuditLogRow[];
          total: number;
          capacity: number;
          counts?: { info: number; warn: number; error: number; all: number };
        };
        this.events = data.events;
        this.total = data.total;
        this.capacity = data.capacity;
        this.counts = data.counts ?? { info: 0, warn: 0, error: 0, all: data.total };
        if (this.selectedId && !this.events.some((e) => e.id === this.selectedId)) {
          this.selectedId = "";
        }
        if (
          !silent &&
          !this.selectedId &&
          this.events.length &&
          window.matchMedia("(min-width: 1024px)").matches
        ) {
          this.selectedId = this.events[0].id;
        }
        return true;
      } catch {
        this.error = "Network error loading audit logs.";
        return false;
      } finally {
        this.loading = false;
      }
    },

    formatTs(ts: string) {
      try {
        return new Date(ts).toLocaleString(undefined, {
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } catch {
        return ts;
      }
    },

    relativeTs(ts: string) {
      try {
        const diff = Date.now() - new Date(ts).getTime();
        const sec = Math.max(0, Math.floor(diff / 1000));
        if (sec < 60) return `${sec}s`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min}m`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}h`;
        return `${Math.floor(hr / 24)}d`;
      } catch {
        return ts;
      }
    },

    shortSession(sessionId: string | undefined) {
      if (!sessionId) return "—";
      return sessionId.length > 8 ? `${sessionId.slice(0, 8)}…` : sessionId;
    },

    reqLine(event: AuditLogRow) {
      const r = event.req;
      if (!r?.method) return "";
      const status = r.status != null ? ` ${r.status}` : "";
      const path = r.path ? ` ${r.path}` : "";
      return `${r.method}${status}${path}`;
    },

    highlightMeta(event: AuditLogRow) {
      const m = event.meta;
      if (!m || !Object.keys(m).length) return "";
      const keys = ["pages", "elements", "bytes", "pageSize", "filename", "name", "error", "env", "port"];
      const parts: string[] = [];
      for (const k of keys) {
        if (m[k] != null && m[k] !== "") parts.push(`${k}=${String(m[k])}`);
      }
      return parts.slice(0, 3).join(" · ");
    },

    metaEntries(event: AuditLogRow): [string, string][] {
      const m = event.meta;
      if (!m) return [];
      return Object.entries(m).map(([k, v]) => [
        k,
        typeof v === "object" ? JSON.stringify(v) : String(v),
      ]);
    },

    prettyJson(event: AuditLogRow) {
      return JSON.stringify(
        {
          id: event.id,
          ts: event.ts,
          level: event.level,
          action: event.action,
          message: event.message,
          sessionId: event.sessionId ?? null,
          req: event.req ?? null,
          meta: event.meta ?? null,
        },
        null,
        2,
      );
    },

    async copyEvent(event: AuditLogRow) {
      try {
        await navigator.clipboard.writeText(this.prettyJson(event));
        this.copied = "Copied";
        if (this._copyTimer) clearTimeout(this._copyTimer);
        this._copyTimer = setTimeout(() => {
          this.copied = "";
        }, 2000);
      } catch {
        this.copied = "Copy failed";
      }
    },
  };
}

document.addEventListener("alpine:init", () => {
  const Alpine = window.Alpine;
  Alpine.data("pdfEditor", pdfEditor);
  Alpine.data("auditLogsPage", auditLogsPage);
  Alpine.data("themeToggle", () => ({
    theme: (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark",
    init() {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") {
        this.theme = saved;
        document.documentElement.setAttribute("data-theme", saved);
      }
    },
    toggleTheme() {
      this.theme = this.theme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", this.theme);
      localStorage.setItem(THEME_KEY, this.theme);
    },
  }));
});

initHomePreview();
