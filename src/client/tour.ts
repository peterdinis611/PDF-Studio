import { driver, type DriveStep, type Driver } from "driver.js";

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

let activeTour: Driver | null = null;
let schedulePending = false;
let scheduleTimer: ReturnType<typeof setTimeout> | null = null;

/** Test-only: clear singleton tour / schedule state. */
export function resetTourStateForTests(): void {
  if (scheduleTimer) clearTimeout(scheduleTimer);
  scheduleTimer = null;
  schedulePending = false;
  if (activeTour) {
    try {
      if (activeTour.isActive()) activeTour.destroy();
    } catch {
      /* ignore */
    }
  }
  activeTour = null;
}

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

function destroyActiveTour(): void {
  if (!activeTour) return;
  const current = activeTour;
  activeTour = null;
  try {
    if (current.isActive()) current.destroy();
  } catch {
    /* ignore */
  }
}

/** Remove leftover driver DOM if a previous instance leaked. */
function scrubDriverDom(): void {
  document.querySelectorAll(".driver-overlay, .driver-popover, .driver-active-element").forEach((el) => {
    el.remove();
  });
  document.body.classList.remove("driver-active", "driver-fade", "driver-simple");
  document.documentElement.classList.remove("driver-active", "driver-fade", "driver-simple");
}

export function startEditorTour(): void {
  destroyActiveTour();
  scrubDriverDom();

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
      if (!tour.isActive()) return;
      markTourSeen();
      activeTour = null;
      tour.destroy();
    },
    onDestroyed: () => {
      markTourSeen();
      if (activeTour === tour) activeTour = null;
      scrubDriverDom();
    },
  });

  activeTour = tour;
  tour.drive();
}

function clearSchedule(): void {
  schedulePending = false;
  if (scheduleTimer) {
    clearTimeout(scheduleTimer);
    scheduleTimer = null;
  }
}

/** Start tour after preload fades, once per browser unless forced. */
export function scheduleEditorTour(options?: { force?: boolean }): void {
  const force =
    options?.force ||
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("tour"));
  if (!force && hasSeenEditorTour()) return;
  if (schedulePending || (activeTour?.isActive() ?? false)) return;

  schedulePending = true;

  const runOnce = () => {
    if (!schedulePending) return;
    clearSchedule();
    if (!force && hasSeenEditorTour()) return;
    if (activeTour?.isActive()) return;
    startEditorTour();
  };

  const preload = document.getElementById("preload");
  if (!preload || preload.classList.contains("is-done") || !document.body.contains(preload)) {
    scheduleTimer = setTimeout(runOnce, force ? 450 : 1000);
    return;
  }

  const observer = new MutationObserver(() => {
    if (document.getElementById("preload")) return;
    observer.disconnect();
    scheduleTimer = setTimeout(runOnce, 250);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Single fallback — does not stack a second tour if observer already ran
  scheduleTimer = setTimeout(() => {
    observer.disconnect();
    runOnce();
  }, 4500);
}
