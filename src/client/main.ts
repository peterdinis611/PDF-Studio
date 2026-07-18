import Alpine from "alpinejs";
import {
  PAGE_SIZES,
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
  createImage,
  createLine,
  createRect,
  createText,
  defaultDoc,
  elementLabel,
  escapeHtml,
  uid,
} from "./factories.js";
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
import { TEMPLATE_LIST, buildTemplate } from "./templates.js";

const STORAGE_KEY = "pdf-studio-doc";
const THEME_KEY = "pdf-studio-theme";
const SETTINGS_KEY = "pdf-studio-settings";
const FAV_KEY = "pdf-studio-favorites";
const RECENT_KEY = "pdf-studio-recent";

type Tool = "select" | "text" | "rect" | "ellipse" | "line" | "place";

type DragState =
  | {
      mode: "move";
      id: string;
      startX: number;
      startY: number;
      origX: number;
      origY: number;
    }
  | {
      mode: "resize";
      id: string;
      startX: number;
      startY: number;
      origW: number;
      origH: number;
    };

function pdfEditor() {
  const history = new HistoryStack();
  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  let skipHistory = false;

  return {
    doc: defaultDoc() as PdfDocument,
    activePageIndex: 0,
    selectedId: null as string | null,
    tool: "select" as Tool,
    zoom: 0.85,
    exporting: false,
    editingTextId: null as string | null,
    drag: null as DragState | null,
    showTemplates: false,
    showLibrary: true,
    libraryCategory: "basics" as LibraryCategory,
    libraryItems: LIBRARY_ITEMS,
    libraryCategories: LIBRARY_CATEGORIES,
    libraryQuery: "",
    libraryView: "list" as "list" | "grid",
    libraryKeepPlacing: false,
    favorites: [] as string[],
    recentIds: [] as string[],
    pendingLibraryKind: null as LibraryItem["kind"] | null,
    placeHint: false,
    templates: TEMPLATE_LIST,
    snapEnabled: true,
    canUndo: false,
    canRedo: false,
    justInsertedId: null as string | null,
    theme: "dark" as "dark" | "light",
    showSettings: false,
    showGuides: false,
    showGrid: false,

    get pageSize() {
      return PAGE_SIZES[this.doc.pageSize] ?? PAGE_SIZES.a4;
    },

    get activePage(): PdfPage {
      return this.doc.pages[this.activePageIndex] ?? this.doc.pages[0];
    },

    get selected(): PdfElement | null {
      if (!this.selectedId) return null;
      return this.activePage.elements.find((e) => e.id === this.selectedId) ?? null;
    },

    get selectedIndex(): number {
      if (!this.selectedId) return -1;
      return this.activePage.elements.findIndex((e) => e.id === this.selectedId);
    },

    get layers() {
      return [...this.activePage.elements].reverse().map((el) => ({
        id: el.id,
        label: elementLabel(el),
        type: el.type,
        locked: el.locked,
      }));
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
      };
    },

    get pageThumbStyle() {
      const { width, height } = this.pageSize;
      return { aspectRatio: `${width} / ${height}` };
    },

    init() {
      const params = new URLSearchParams(window.location.search);
      const templateId = params.get("template");
      const fresh = params.get("new") === "1";

      const savedTheme = localStorage.getItem(THEME_KEY);
      this.theme =
        savedTheme === "light" || savedTheme === "dark"
          ? savedTheme
          : ((document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark");
      this.applyTheme(this.theme);

      try {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") as {
          showGuides?: boolean;
          showGrid?: boolean;
          snapEnabled?: boolean;
        };
        if (typeof settings.showGuides === "boolean") this.showGuides = settings.showGuides;
        if (typeof settings.showGrid === "boolean") this.showGrid = settings.showGrid;
        if (typeof settings.snapEnabled === "boolean") this.snapEnabled = settings.snapEnabled;
      } catch {
        /* ignore */
      }

      try {
        this.favorites = JSON.parse(localStorage.getItem(FAV_KEY) || "[]") as string[];
        this.recentIds = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
      } catch {
        this.favorites = [];
        this.recentIds = [];
      }

      if (templateId) {
        this.doc = buildTemplate(templateId);
        this.commit(true);
      } else if (fresh) {
        this.doc = defaultDoc();
        this.commit(true);
      } else {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            this.doc = JSON.parse(saved) as PdfDocument;
            if (!this.doc.pageBackground) this.doc.pageBackground = "#faf9f6";
          } catch {
            this.doc = defaultDoc();
          }
        }
      }

      if (typeof this.doc.showGrid === "boolean") this.showGrid = this.doc.showGrid;

      history.reset(this.doc);
      this.syncHistoryFlags();

      window.addEventListener("mousemove", (e) => this.onMouseMove(e));
      window.addEventListener("mouseup", () => this.onMouseUp());
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
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          showGuides: this.showGuides,
          showGrid: this.showGrid,
          snapEnabled: this.snapEnabled,
        }),
      );
      this.doc.showGrid = this.showGrid;
      this.commit(false);
    },

    syncHistoryFlags() {
      this.canUndo = history.canUndo;
      this.canRedo = history.canRedo;
    },

    /** Save to localStorage; optionally push undo snapshot */
    commit(recordHistory = true) {
      this.doc.updatedAt = new Date().toISOString();
      if (recordHistory && !skipHistory) {
        history.push(this.doc);
        this.syncHistoryFlags();
      }
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.doc));
        } catch (err) {
          console.warn("Could not persist document", err);
        }
      }, 180);
    },

    /** Debounced live updates (sliders) — no history spam */
    persist() {
      this.commit(true);
    },

    persistSoft() {
      this.commit(false);
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.doc));
      }, 120);
    },

    undo() {
      const prev = history.undo(this.doc);
      if (!prev) return;
      skipHistory = true;
      this.doc = prev;
      this.selectedId = null;
      this.syncHistoryFlags();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.doc));
      skipHistory = false;
    },

    redo() {
      const next = history.redo(this.doc);
      if (!next) return;
      skipHistory = true;
      this.doc = next;
      this.selectedId = null;
      this.syncHistoryFlags();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.doc));
      skipHistory = false;
    },

    newDocument() {
      if (!confirm("Start a blank document? Unsaved changes stay in browser history only.")) return;
      this.doc = defaultDoc();
      this.activePageIndex = 0;
      this.selectedId = null;
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.doc));
    },

    applyTemplate(id: string) {
      this.doc = buildTemplate(id);
      this.activePageIndex = 0;
      this.selectedId = null;
      this.showTemplates = false;
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.doc));
    },

    setActivePage(index: number) {
      this.activePageIndex = index;
      this.selectedId = null;
      this.editingTextId = null;
    },

    addPage() {
      this.doc.pages.push(blankPage());
      this.activePageIndex = this.doc.pages.length - 1;
      this.selectedId = null;
      this.commit();
    },

    duplicatePage(index: number) {
      const source = this.doc.pages[index];
      if (!source) return;
      const copy: PdfPage = {
        id: uid(),
        elements: source.elements.map((el) => {
          const c = structuredClone(el) as PdfElement;
          c.id = uid();
          return c;
        }),
      };
      this.doc.pages.splice(index + 1, 0, copy);
      this.activePageIndex = index + 1;
      this.selectedId = null;
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
      this.selectedId = null;
      this.commit();
    },

    zoomIn() {
      this.zoom = Math.min(1.75, Math.round((this.zoom + 0.1) * 10) / 10);
    },

    zoomOut() {
      this.zoom = Math.max(0.4, Math.round((this.zoom - 0.1) * 10) / 10);
    },

    fitZoom() {
      const pad = 120;
      const avail = Math.max(320, window.innerWidth - 420 - pad);
      this.zoom = Math.min(1.2, Math.max(0.45, Math.round((avail / this.pageSize.width) * 100) / 100));
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
      return Math.round(value / 8) * 8;
    },

    onCanvasBackground(event: MouseEvent) {
      if (event.target === event.currentTarget) {
        this.selectedId = null;
        this.editingTextId = null;
      }
    },

    onPageMouseDown(event: MouseEvent) {
      if (event.button !== 0) return;
      const { x, y } = this.pageCoords(event);
      const sx = this.snap(x);
      const sy = this.snap(y);

      if (this.tool === "place" && this.pendingLibraryKind) {
        this.insertLibraryAt(this.pendingLibraryKind, sx, sy);
        return;
      }

      if (this.tool === "select") {
        this.selectedId = null;
        this.editingTextId = null;
        return;
      }

      let el: PdfElement;
      if (this.tool === "text") el = createText(sx, sy);
      else if (this.tool === "rect") el = createRect(sx, sy);
      else if (this.tool === "ellipse") el = createEllipse(sx, sy);
      else el = createLine(sx, sy);

      this.pushElement(el);
    },

    pushElement(el: PdfElement) {
      this.activePage.elements.push(el);
      this.selectedId = el.id;
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
      localStorage.setItem(RECENT_KEY, JSON.stringify(this.recentIds));
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
      localStorage.setItem(FAV_KEY, JSON.stringify(this.favorites));
    },

    pickLibraryItem(item: LibraryItem) {
      this.rememberLibraryUse(item);
      if (item.kind === "image") {
        (this as unknown as { $refs: { imageInput: HTMLInputElement } }).$refs.imageInput.click();
        return;
      }
      this.pendingLibraryKind = item.kind;
      this.tool = "place";
      this.placeHint = true;
      this.selectedId = null;
    },

    insertLibraryQuick(item: LibraryItem) {
      this.rememberLibraryUse(item);
      if (item.kind === "image") {
        (this as unknown as { $refs: { imageInput: HTMLInputElement } }).$refs.imageInput.click();
        return;
      }
      const { width, height } = this.pageSize;
      const el = createFromLibrary(item.kind, width / 2 - 80, height / 2 - 40);
      if (el === "image") return;
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
      this.pushElement(el);
    },

    onElementMouseDown(event: MouseEvent, el: PdfElement) {
      if (event.button !== 0) return;
      this.selectedId = el.id;
      if (el.locked) return;
      this.drag = {
        mode: "move",
        id: el.id,
        startX: event.clientX,
        startY: event.clientY,
        origX: el.x,
        origY: el.y,
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
      const el = this.activePage.elements.find((e) => e.id === this.drag!.id);
      if (!el) return;

      const dx = (event.clientX - this.drag.startX) / this.zoom;
      const dy = (event.clientY - this.drag.startY) / this.zoom;

      if (this.drag.mode === "move") {
        el.x = this.snap(this.drag.origX + dx);
        el.y = this.snap(this.drag.origY + dy);
      } else {
        el.width = Math.max(20, this.snap(this.drag.origW + dx));
        el.height = Math.max(el.type === "line" ? 0 : 20, this.snap(this.drag.origH + dy));
      }
    },

    onMouseUp() {
      if (this.drag) {
        this.drag = null;
        this.commit();
      }
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

    textInnerStyle(el: TextElement) {
      const fontMap: Record<string, string> = {
        Helvetica: "Helvetica, Arial, sans-serif",
        "Times-Roman": '"Times New Roman", Times, serif',
        Courier: '"Courier New", Courier, monospace',
      };
      return {
        fontSize: `${el.fontSize * this.zoom}px`,
        fontFamily: fontMap[el.fontFamily] ?? fontMap.Helvetica,
        fontWeight: el.fontWeight,
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

    lineStyle(el: PdfElement & { type: "line" }) {
      return {
        x1: 0,
        y1: 0,
        x2: el.width * this.zoom,
        y2: el.height * this.zoom,
        stroke: el.stroke,
        strokeWidth: el.strokeWidth * this.zoom,
      };
    },

    thumbElementStyle(el: PdfElement) {
      return `left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${Math.max(el.height, 2)}px;opacity:${el.opacity};`;
    },

    thumbPreview(el: PdfElement) {
      if (el.type === "text" || el.type === "sticky") {
        return `<span style="font-size:${el.fontSize}px;color:${el.type === "sticky" ? el.color : el.color};background:${el.type === "sticky" ? el.fill : "transparent"}">${escapeHtml(el.content.slice(0, 28))}</span>`;
      }
      if (el.type === "image") {
        return `<img src="${el.src}" style="width:100%;height:100%;object-fit:contain" />`;
      }
      if (el.type === "line" || el.type === "divider" || el.type === "arrow") {
        return `<svg width="100%" height="100%" style="overflow:visible"><line x1="0" y1="50%" x2="100%" y2="50%" stroke="${"stroke" in el ? el.stroke : "#333"}" stroke-width="2"/></svg>`;
      }
      if (el.type === "badge" || el.type === "stamp") {
        return `<span style="color:${el.color};font-size:10px;font-weight:bold">${escapeHtml(el.label)}</span>`;
      }
      if (el.type === "checkbox") {
        return `<span style="font-size:10px">${el.checked ? "☑" : "☐"} ${escapeHtml(el.label.slice(0, 16))}</span>`;
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
      this.selectedId = el.id;
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

    duplicateSelected() {
      const el = this.selected;
      if (!el) return;
      const copy = cloneElement(el);
      this.activePage.elements.push(copy);
      this.selectedId = copy.id;
      this.commit();
    },

    deleteSelected() {
      if (!this.selectedId) return;
      const el = this.selected;
      if (el?.locked) return;
      this.activePage.elements = this.activePage.elements.filter((e) => e.id !== this.selectedId);
      this.selectedId = null;
      this.commit();
    },

    toggleLock() {
      if (!this.selected) return;
      this.selected.locked = !this.selected.locked;
      this.commit();
    },

    bringForward() {
      const i = this.selectedIndex;
      if (i < 0 || i >= this.activePage.elements.length - 1) return;
      const arr = this.activePage.elements;
      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      this.commit();
    },

    sendBackward() {
      const i = this.selectedIndex;
      if (i <= 0) return;
      const arr = this.activePage.elements;
      [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
      this.commit();
    },

    bringToFront() {
      const i = this.selectedIndex;
      if (i < 0 || i >= this.activePage.elements.length - 1) return;
      const [el] = this.activePage.elements.splice(i, 1);
      this.activePage.elements.push(el);
      this.commit();
    },

    sendToBack() {
      const i = this.selectedIndex;
      if (i <= 0) return;
      const [el] = this.activePage.elements.splice(i, 1);
      this.activePage.elements.unshift(el);
      this.commit();
    },

    alignSelected(edge: "left" | "center" | "right" | "top" | "middle" | "bottom") {
      const el = this.selected;
      if (!el || el.locked) return;
      const { width, height } = this.pageSize;
      if (edge === "left") el.x = 40;
      if (edge === "center") el.x = Math.round((width - el.width) / 2);
      if (edge === "right") el.x = Math.round(width - el.width - 40);
      if (edge === "top") el.y = 40;
      if (edge === "middle") el.y = Math.round((height - el.height) / 2);
      if (edge === "bottom") el.y = Math.round(height - el.height - 40);
      this.commit();
    },

    nudge(dx: number, dy: number, fine: boolean) {
      const el = this.selected;
      if (!el || el.locked) return;
      const step = fine ? 1 : this.snapEnabled ? 8 : 4;
      el.x += dx * step;
      el.y += dy * step;
      this.commit();
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
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        this.commit(false);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.doc));
        return;
      }
      if (mod && event.key.toLowerCase() === "e") {
        event.preventDefault();
        void this.exportPdf();
        return;
      }

      if (event.key === "Escape") {
        this.selectedId = null;
        this.editingTextId = null;
        this.tool = "select";
        this.pendingLibraryKind = null;
        this.placeHint = false;
        this.libraryKeepPlacing = false;
        return;
      }

      if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
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
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || "Upload failed");

        const imageEl = createImage(80, 80, {
          src: payload.url as string,
          name: payload.name as string,
          width: payload.width as number,
          height: payload.height as number,
        });
        this.pushElement(imageEl);      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Could not upload image.");
      } finally {
        input.value = "";
      }
    },

    async exportPdf() {
      this.exporting = true;
      try {
        const res = await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: this.doc.name,
            pageSize: this.doc.pageSize,
            pageBackground: this.doc.pageBackground,
            pages: this.doc.pages,
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
