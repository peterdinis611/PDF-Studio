import { driver, type DriveStep } from "driver.js";

export const TOUR_SEEN_KEY = "pdf-studio-tour-seen";

const steps: DriveStep[] = [
  {
    element: "[data-tour='toolbar']",
    popover: {
      title: "Toolbar",
      description:
        "Rename your document, undo/redo, open File (import PDF, library), Templates, and page size. Everything autosaves in this browser.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour='insert']",
    popover: {
      title: "Insert library",
      description:
        "Search (/) or browse categories for text, shapes, tables, form fields, stamps, and more. Click an item, then click the page to place it.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='pages']",
    popover: {
      title: "Pages",
      description:
        "Switch to the Pages tab to add, duplicate, reorder, or delete pages. Multi-page docs export as one PDF.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='canvas']",
    popover: {
      title: "Canvas",
      description:
        "Your page lives here. Drag to move, resize from the corner, Space+drag to pan, ⌘/Ctrl+scroll to zoom. Rulers create guides.",
      side: "left",
      align: "center",
    },
  },
  {
    element: "[data-tour='dock']",
    popover: {
      title: "Tool dock",
      description:
        "Quick tools: Select (V), Text (T), shapes, image, signature. Group, align, and distribute when multiple items are selected.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "[data-tour='inspector']",
    popover: {
      title: "Properties",
      description:
        "Edit the selected element — typography, colors, table rows, image fit/crop, layers (drag to reorder, hide, lock).",
      side: "left",
      align: "start",
    },
  },
  {
    element: "[data-tour='export']",
    popover: {
      title: "Export PDF",
      description:
        "Download a real PDF (⌘E). Choose Screen or Print presets, image quality, and PDF/A-friendly metadata. Fonts embed via Google Fonts when needed.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "[data-tour='help']",
    popover: {
      title: "Shortcuts & this tour",
      description:
        "Press ? for the keyboard cheat sheet anytime. Replay this tour from the ? button in the toolbar, File → Product tour, or the status bar.",
      side: "bottom",
      align: "end",
    },
  },
];

function markTourSeen(): void {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasSeenEditorTour(): boolean {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function startEditorTour(): void {
  const tour = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayOpacity: 0.62,
    stagePadding: 8,
    stageRadius: 10,
    popoverClass: "pdf-studio-tour",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    progressText: "{{current}} / {{total}}",
    steps,
    onDestroyStarted: () => {
      markTourSeen();
      tour.destroy();
    },
    onDestroyed: () => {
      markTourSeen();
    },
  });
  tour.drive();
}

/** Start tour after preload fades, once per browser unless forced. */
export function scheduleEditorTour(options?: { force?: boolean }): void {
  const force =
    options?.force ||
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("tour"));
  if (!force && hasSeenEditorTour()) return;

  const run = () => {
    // Ensure Insert tab is visible for early steps
    window.setTimeout(() => startEditorTour(), 200);
  };

  const preload = document.getElementById("preload");
  if (!preload || preload.classList.contains("is-done")) {
    window.setTimeout(run, force ? 400 : 900);
    return;
  }

  const observer = new MutationObserver(() => {
    if (!document.getElementById("preload")) {
      observer.disconnect();
      run();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  // Fallback if preload never removes
  window.setTimeout(() => {
    observer.disconnect();
    if (force || !hasSeenEditorTour()) run();
  }, 4000);
}
