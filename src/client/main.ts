import Alpine from "alpinejs";
import {
  PAGE_SIZES,
  type DocComment,
  type ExportSettings,
  type GuideLine,
  type PdfDocument,
  type PdfElement,
  type PdfPage,
  type TextElement,
  type RectElement,
  type EllipseElement,
  type StickyElement,
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
  createRect,
  createText,
  defaultDoc,
  elementLabel,
  escapeHtml,
  uid,
} from "./factories.js";
import { allFontOptions, fontCssFamily } from "./fonts.js";
import { HistoryStack } from "./history.js";
import { iconSvg } from "./icons.js";
import {
  LIBRARY_CATEGORIES,
  LIBRARY_ITEMS,
  createFromLibrary,
  matchesLibraryQuery,
  type LibraryCategory,
  type LibraryItem,
} from "./library.js";
import { apiFetch, getSessionId, storeGet, storeSet } from "./session.js";
import { computeSmartGuides, type SmartGuide } from "./smartGuides.js";
import { TEMPLATE_LIST, buildTemplate } from "./templates.js";

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

type Tool = "select" | "text" | "rect" | "ellipse" | "line" | "place" | "comment";

type DragState =
  | {
      mode: "move";
      ids: string[];
      startX: number;
      startY: number;
      origins: { id: string; x: number; y: number }[];
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
  if (el.type !== "text") return el;
  const t = el as TextElement;
  return {
    ...t,
    fontStyle: t.fontStyle ?? "normal",
    underline: t.underline ?? false,
    lineHeight: t.lineHeight ?? 1.25,
    letterSpacing: t.letterSpacing ?? 0,
    listStyle: t.listStyle ?? "none",
  };
}

function normalizeDoc(doc: PdfDocument): PdfDocument {
  return {
    ...doc,
    pageBackground: doc.pageBackground || "#faf9f6",
    guides: doc.guides || [],
    comments: doc.comments || [],
    customFonts: doc.customFonts || [],
    master: doc.master || { header: [], footer: [] },
    watermark: doc.watermark ?? null,
    pages: doc.pages.map((p) => ({
      ...p,
      applyMaster: p.applyMaster !== false,
      elements: p.elements.map(normalizeTextElement),
    })),
  };
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
    leftRail: "insert" as "insert" | "pages",
    showExportModal: false,
    showSignatureModal: false,
    showFindReplace: false,
    showBrandKit: false,
    showDocLibrary: false,
    showComments: false,
    editingMaster: false,
    reviewMode: false,
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
    signatureInk: "#1a1a1a",
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
    fontOptions: allFontOptions(),
    findQuery: "",
    replaceQuery: "",
    findMatches: [] as { pageIndex: number; elId: string; field: string }[],
    findIndex: -1,
    brand: {
      colors: ["#0d9488", "#0f766e", "#1a1a1a", "#faf9f6"],
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
      }));
    },

    get pageComments(): DocComment[] {
      return (this.doc.comments || []).filter((c) => c.pageId === this.activePage.id);
    },

    get filteredLibrary() {
      let items = this.libraryItems;
      if (this.libraryCategory === "favorites") {
        items = items.filter((i) => this.favorites.includes(i.id));
      } else if (this.libraryCategory === "recent") {
        items = this.recentIds
          .map((id) => this.libraryItems.find((i) => i.id === id))
          .filter(Boolean) as LibraryItem[];
      } else if (this.libraryCategory !== "all") {
        items = items.filter((i) => i.category === this.libraryCategory);
      }
      return items.filter((i) => matchesLibraryQuery(i, this.libraryQuery));
    },

    get pageStyle() {
      const { width, height } = this.pageSize;
      return {
        width: `${width * this.zoom}px`,
        height: `${height * this.zoom}px`,
        backgroundColor: this.doc.pageBackground || "#faf9f6",
        transform: `translate(${this.panX}px, ${this.panY}px)`,
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

    get workingElements(): PdfElement[] {
      if (this.editingMaster) {
        return this.doc.master?.header || [];
      }
      return this.activePage.elements;
    },

    get displayElements(): PdfElement[] {
      return this.workingElements;
    },

    get masterPreviewElements(): PdfElement[] {
      if (this.editingMaster) return [];
      if (this.activePage.applyMaster === false) return [];
      return [...(this.doc.master?.header || []), ...(this.doc.master?.footer || [])];
    },

    init() {
      getSessionId();
      const params = new URLSearchParams(window.location.search);
      const templateId = params.get("template");
      const fresh = params.get("new") === "1";
      const openId = params.get("doc");

      const savedTheme = localStorage.getItem(THEME_KEY);
      this.theme =
        savedTheme === "light" || savedTheme === "dark"
          ? savedTheme
          : ((document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark");
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
            this.doc = normalizeDoc(JSON.parse(saved) as PdfDocument);
          } catch {
            this.doc = normalizeDoc(defaultDoc());
          }
        }
      } else {
        const saved = storeGet(STORAGE_KEY);
        if (saved) {
          try {
            this.doc = normalizeDoc(JSON.parse(saved) as PdfDocument);
          } catch {
            this.doc = normalizeDoc(defaultDoc());
          }
        } else {
          this.doc = normalizeDoc(defaultDoc());
        }
      }

      if (typeof this.doc.showGrid === "boolean") this.showGrid = this.doc.showGrid;
      this.fontOptions = allFontOptions(this.doc.customFonts);
      this.injectCustomFontFaces();

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
        const viewport = (this as unknown as { $el: HTMLElement }).$el?.querySelector(".canvas-workspace");
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
    },

    injectCustomFontFaces() {
      const id = "pdf-studio-custom-fonts";
      let style = document.getElementById(id) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement("style");
        style.id = id;
        document.head.appendChild(style);
      }
      style.textContent = (this.doc.customFonts || [])
        .map(
          (f) =>
            `@font-face{font-family:"${f.name}";src:url("${f.url}");font-display:swap;}`,
        )
        .join("\n");
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
        history.push(this.doc);
        this.syncHistoryFlags();
      }
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        try {
          storeSet(STORAGE_KEY, JSON.stringify(this.doc));
          storeSet(docKey(this.doc.id), JSON.stringify(this.doc));
          this.upsertDocLibrary();
        } catch (err) {
          console.warn("Could not persist document", err);
        }
      }, 180);
    },

    persist() {
      this.commit(true);
    },

    persistSoft() {
      this.commit(false);
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        storeSet(STORAGE_KEY, JSON.stringify(this.doc));
        storeSet(docKey(this.doc.id), JSON.stringify(this.doc));
        this.upsertDocLibrary();
      }, 120);
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

    openDocFromLibrary(id: string) {
      const raw = storeGet(docKey(id));
      if (!raw) return;
      try {
        this.doc = normalizeDoc(JSON.parse(raw) as PdfDocument);
        this.activePageIndex = 0;
        this.selectedIds = [];
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.showDocLibrary = false;
        this.fontOptions = allFontOptions(this.doc.customFonts);
        this.injectCustomFontFaces();
        storeSet(STORAGE_KEY, JSON.stringify(this.doc));
      } catch {
        alert("Could not open document.");
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

    downloadStudioJson() {
      const blob = new Blob([JSON.stringify(this.doc, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${this.doc.name.replace(/[^\w.-]+/g, "_") || "document"}.pdfstudio.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    async onStudioJsonSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        this.doc = normalizeDoc(JSON.parse(text) as PdfDocument);
        this.activePageIndex = 0;
        this.selectedIds = [];
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.fontOptions = allFontOptions(this.doc.customFonts);
        this.injectCustomFontFaces();
        this.commit(false);
      } catch {
        alert("Invalid .pdfstudio.json file");
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
      this.doc = normalizeDoc(defaultDoc());
      this.activePageIndex = 0;
      this.selectedIds = [];
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
    },

    applyTemplate(id: string) {
      this.doc = normalizeDoc(buildTemplate(id));
      this.activePageIndex = 0;
      this.selectedIds = [];
      this.showTemplates = false;
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
    },

    setActivePage(index: number) {
      this.activePageIndex = index;
      this.selectedIds = [];
      this.editingTextId = null;
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

    movePage(index: number, dir: -1 | 1) {
      const next = index + dir;
      if (next < 0 || next >= this.doc.pages.length) return;
      const pages = this.doc.pages;
      [pages[index], pages[next]] = [pages[next], pages[index]];
      this.activePageIndex = next;
      this.commit();
    },

    removePage(index: number) {
      if (this.doc.pages.length <= 1) return;
      this.doc.pages.splice(index, 1);
      this.activePageIndex = Math.min(this.activePageIndex, this.doc.pages.length - 1);
      this.selectedIds = [];
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
      this.zoom = Math.min(1.5, Math.max(0.3, Math.round((avail / this.pageSize.width) * 100) / 100));
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
    },

    onCanvasBackground(event: MouseEvent) {
      if (event.target === event.currentTarget) {
        if (spaceDown || event.button === 1) return;
        this.selectedIds = [];
        this.editingTextId = null;
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
      if (this.tool === "text") el = createText(sx, sy, { fontFamily: this.brand.defaultFont || "Helvetica" });
      else if (this.tool === "rect") el = createRect(sx, sy);
      else if (this.tool === "ellipse") el = createEllipse(sx, sy);
      else el = createLine(sx, sy);

      this.pushElement(el);
    },

    pushElement(el: PdfElement) {
      if (this.editingMaster) {
        if (!this.doc.master) this.doc.master = { header: [], footer: [] };
        this.doc.master.header.push(el);
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
      const ids = this.selectedIds.filter((id) => {
        const e = this.workingElements.find((x) => x.id === id);
        return e && !e.locked;
      });
      this.drag = {
        mode: "move",
        ids,
        startX: event.clientX,
        startY: event.clientY,
        origins: ids.map((id) => {
          const e = this.workingElements.find((x) => x.id === id)!;
          return { id, x: e.x, y: e.y };
        }),
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
        this.drag = { ...this.drag, x: x0, y: y0, w, h };
        this.marquee = { x: x0, y: y0, w, h };
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
        const dx = (event.clientX - this.drag.startX) / this.zoom;
        const dy = (event.clientY - this.drag.startY) / this.zoom;
        const exclude = new Set(this.drag.ids);
        const primary = this.drag.origins[0];
        if (!primary) return;
        const primaryEl = this.workingElements.find((e) => e.id === primary.id);
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
        for (const origin of this.drag.origins) {
          const el = this.workingElements.find((e) => e.id === origin.id);
          if (!el || el.locked) continue;
          el.x = origin.x + odx;
          el.y = origin.y + ody;
        }
      }
    },

    onMouseUp() {
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
      return {
        left: `${el.x * this.zoom}px`,
        top: `${el.y * this.zoom}px`,
        width: `${Math.max(el.width, 1) * this.zoom}px`,
        height: `${Math.max(el.height, el.type === "line" || el.type === "divider" || el.type === "arrow" ? 8 : 1) * this.zoom}px`,
        opacity: String(el.opacity),
        transform: rotating || undefined,
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
        el.type === "ellipse"
          ? "50%"
          : `${((el as RectElement).cornerRadius || 0) * this.zoom}px`;
      return {
        backgroundColor: el.fill,
        border: el.strokeWidth > 0 ? `${el.strokeWidth * this.zoom}px solid ${el.stroke}` : "none",
        boxSizing: "border-box" as const,
        borderRadius: radius,
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
        return `<span style="font-size:10px;border:1px solid #94a3b8;padding:2px">${escapeHtml(el.name)}</span>`;
      }
      if (el.type === "icon") {
        return iconSvg(el.icon, el.color, 16);
      }
      if (el.type === "table") {
        return `<div style="width:100%;height:100%;background:#e2e8f0;border:1px solid #94a3b8"></div>`;
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
        void navigator.clipboard.writeText(JSON.stringify({ type: "pdf-studio-elements", elements: clipboard }));
      } catch {
        /* ignore */
      }
    },

    cutSelected() {
      this.copySelected();
      this.deleteSelected();
    },

    pasteClipboard() {
      if (!clipboard.length) return;
      const copies = clipboard.map((el) => cloneElement(el, 20));
      for (const c of copies) {
        c.groupId = undefined;
        if (this.editingMaster) {
          if (!this.doc.master) this.doc.master = { header: [], footer: [] };
          this.doc.master.header.push(c);
        } else {
          this.activePage.elements.push(c);
        }
      }
      this.selectedIds = copies.map((c) => c.id);
      this.commit();
    },

    duplicateSelected() {
      const els = this.selectedElements;
      if (!els.length) return;
      const copies = els.map((el) => cloneElement(el));
      for (const c of copies) {
        if (this.editingMaster) {
          if (!this.doc.master) this.doc.master = { header: [], footer: [] };
          this.doc.master.header.push(c);
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
      if (els.length === 1) {
        const el = els[0];
        if (edge === "left") el.x = 40;
        if (edge === "center") el.x = Math.round((width - el.width) / 2);
        if (edge === "right") el.x = Math.round(width - el.width - 40);
        if (edge === "top") el.y = 40;
        if (edge === "middle") el.y = Math.round((height - el.height) / 2);
        if (edge === "bottom") el.y = Math.round(height - el.height - 40);
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
    },

    addMasterPageNumber() {
      if (!this.doc.master) this.doc.master = { header: [], footer: [] };
      const el = createText(this.pageSize.width / 2 - 40, this.pageSize.height - 48, {
        content: "Page {{page}} / {{pages}}",
        fontSize: 10,
        color: "#64748b",
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
        color: "#94a3b8",
      };
      this.commit();
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
      } else if (el.type === "badge" || el.type === "stamp" || el.type === "checkbox" || el.type === "formCheck") {
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
          else if (el.type === "badge" || el.type === "stamp" || el.type === "checkbox" || el.type === "formCheck") {
            el.label = el.label.split(q).join(r);
          } else if (el.type === "table") el.cells = el.cells.map((c) => c.split(q).join(r));
        }
      }
      this.commit();
      this.runFind();
    },

    addCommentAt(x: number, y: number) {
      const body = this.commentDraft.trim() || prompt("Comment") || "";
      if (!body.trim()) return;
      if (!this.doc.comments) this.doc.comments = [];
      this.doc.comments.push({
        id: uid(),
        pageId: this.activePage.id,
        x,
        y,
        body: body.trim(),
        author: this.authorName || "Reviewer",
        resolved: false,
        createdAt: new Date().toISOString(),
      });
      this.commentDraft = "";
      this.tool = "select";
      this.commit();
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
        alert(err instanceof Error ? err.message : "Logo upload failed");
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

    async onFontSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (ext !== ".ttf" && ext !== ".otf") {
        alert("Please upload a .ttf or .otf font file.");
        input.value = "";
        return;
      }

      const form = new FormData();
      form.append("font", file);
      try {
        const res = await apiFetch("/api/fonts", { method: "POST", body: form });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || "Font upload failed");

        if (!this.doc.customFonts) this.doc.customFonts = [];
        const entry = {
          id: payload.id as string,
          name: (payload.name as string) || file.name.replace(/\.(ttf|otf)$/i, ""),
          url: payload.url as string,
        };
        this.doc.customFonts.push(entry);
        this.fontOptions = allFontOptions(this.doc.customFonts);
        this.injectCustomFontFaces();

        const fontId = `custom:${entry.id}`;
        if (this.selected?.type === "text") {
          this.selected.fontFamily = fontId;
        } else if (this.brand) {
          this.brand.defaultFont = fontId;
          this.saveBrand();
        }

        this.commit();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Font upload failed");
      } finally {
        input.value = "";
      }
    },

    removeCustomFont(id: string) {
      const fontKey = `custom:${id}`;
      this.doc.customFonts = (this.doc.customFonts || []).filter((f) => f.id !== id);
      for (const page of this.doc.pages) {
        for (const el of page.elements) {
          if (el.type === "text" && el.fontFamily === fontKey) {
            el.fontFamily = "Helvetica";
          }
        }
      }
      if (this.brand?.defaultFont === fontKey) {
        this.brand.defaultFont = "Helvetica";
        this.saveBrand();
      }
      this.fontOptions = allFontOptions(this.doc.customFonts);
      this.injectCustomFontFaces();
      this.commit();
    },

    async onPdfImportSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("pdf", file);
      try {
        const res = await apiFetch("/api/import", { method: "POST", body: form });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Import failed");
        this.doc = normalizeDoc(payload.document as PdfDocument);
        this.activePageIndex = 0;
        this.selectedIds = [];
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.commit(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not import PDF");
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
      if (tag === "INPUT" || tag === "TEXTAREA" || (event.target as HTMLElement)?.isContentEditable) {
        return;
      }

      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        this.undo();
        return;
      }
      if ((mod && event.key.toLowerCase() === "y") || (mod && event.shiftKey && event.key.toLowerCase() === "z")) {
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
        this.pasteClipboard();
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
        storeSet(STORAGE_KEY, JSON.stringify(this.doc));
        return;
      }
      if (mod && event.key.toLowerCase() === "e") {
        event.preventDefault();
        this.openExportModal();
        return;
      }

      if (event.key === "Escape") {
        this.selectedIds = [];
        this.editingTextId = null;
        this.tool = "select";
        this.pendingLibraryKind = null;
        this.placeHint = false;
        this.libraryKeepPlacing = false;
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

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.nudge(-1, 0, event.shiftKey);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
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
      };
      const tool = map[event.key.toLowerCase()];
      if (tool) this.tool = tool;
    },

    async onImageSelected(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      const form = new FormData();
      form.append("image", file);

      try {
        const res = await apiFetch("/api/upload", { method: "POST", body: form });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || "Upload failed");

        const imageEl = createImage(80, 80, {
          src: payload.url as string,
          name: payload.name as string,
          width: payload.width as number,
          height: payload.height as number,
        });
        this.pushElement(imageEl);
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Could not upload image.");
      } finally {
        input.value = "";
      }
    },

    openSignatureModal(x: number | null = null, y: number | null = null, replaceId: string | null = null) {
      this.signaturePlace =
        x != null && y != null ? { x, y } : null;
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
      return (this as unknown as { $refs: { signaturePad?: HTMLCanvasElement } }).$refs.signaturePad ?? null;
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

    async placeSignatureFromPayload(payload: { url: string; name: string; width: number; height: number }) {
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
          (this as unknown as { $refs: { signatureFileInput: HTMLInputElement } }).$refs.signatureFileInput.click();
          return;
        }
        const canvas = this.signaturePad();
        if (!canvas || !this.signatureHasInk) {
          alert("Draw or type a signature first.");
          return;
        }
        const trimmed = trimSignatureCanvas(canvas);
        const blob = await new Promise<Blob | null>((resolve) => trimmed.toBlob(resolve, "image/png"));
        if (!blob) throw new Error("Could not capture signature");
        const payload = await this.uploadSignatureBlob(blob, "signature.png");
        await this.placeSignatureFromPayload({
          ...payload,
          name: this.signatureTyped.trim() || "Signature",
        });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not add signature");
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
        alert(err instanceof Error ? err.message : "Could not upload signature");
      } finally {
        this.signatureBusy = false;
        input.value = "";
      }
    },

    async exportPdf() {
      this.saveExportSettings();
      this.exporting = true;
      this.showExportModal = false;
      try {
        const res = await apiFetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: this.doc.name,
            pageSize: this.doc.pageSize,
            pageBackground: this.doc.pageBackground,
            pages: this.doc.pages,
            master: this.doc.master,
            watermark: this.doc.watermark,
            importedPdf: this.doc.importedPdf,
            customFonts: this.doc.customFonts,
            exportSettings: this.exportSettings,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Export failed");
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.doc.name.replace(/[^\w.-]+/g, "_") || "document"}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Could not export PDF.");
      } finally {
        this.exporting = false;
      }
    },
  };
}

Alpine.data("pdfEditor", pdfEditor);

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

Alpine.start();
