import { createTimeline, onScroll, splitText, stagger, utils } from "animejs";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatAmount(n: number): string {
  return Math.round(n).toLocaleString("fr-FR").replace(/\u202f/g, "\u202f");
}

function setActivePanel(panels: HTMLElement[], index: number): void {
  panels.forEach((panel, i) => {
    panel.classList.toggle("is-active", i === index);
  });
}

function showSheetContent(sheet: HTMLElement): void {
  utils.set(sheet.querySelectorAll("[data-sheet-el]"), {
    opacity: 1,
    y: 0,
    scale: 1,
    scaleX: 1,
  });
}

function initPageParallax(page: HTMLElement): void {
  const vibe = document.querySelector<HTMLElement>("[data-parallax-vibe]");
  const orbA = document.querySelector<HTMLElement>('[data-parallax-orb="a"]');
  const orbB = document.querySelector<HTMLElement>('[data-parallax-orb="b"]');
  const orbC = document.querySelector<HTMLElement>('[data-parallax-orb="c"]');
  const depths = [...document.querySelectorAll<HTMLElement>("[data-parallax-depth]")];

  const onScrollPage = () => {
    const max = page.scrollHeight - page.clientHeight;
    const p = max > 0 ? page.scrollTop / max : 0;
    if (vibe) vibe.style.transform = `translate3d(0, ${p * -6}%, 0) scale(${1 + p * 0.04})`;
    if (orbA) orbA.style.transform = `translate3d(${p * -12}%, ${p * 22}%, 0)`;
    if (orbB) orbB.style.transform = `translate3d(${p * 14}%, ${p * -18}%, 0)`;
    if (orbC) orbC.style.transform = `translate3d(${p * -6}%, ${p * 10}%, 0)`;
    for (const el of depths) {
      const depth = Number(el.dataset.parallaxDepth || 0.1);
      el.style.transform = `translate3d(0, ${-(p * depth * 120)}px, 0)`;
    }
  };

  page.addEventListener("scroll", onScrollPage, { passive: true });
  onScrollPage();
}

function initChapterReveals(page: HTMLElement): void {
  const items = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
  if (!items.length) return;

  // Always visible by default — animation is enhancement only
  for (const el of items) {
    el.classList.add("is-reveal-pending");
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.remove("is-reveal-pending");
        el.classList.add("is-revealed");
        io.unobserve(el);
      }
    },
    { root: page, rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );

  for (const el of items) io.observe(el);
}

function initPdfScrollBuild(page: HTMLElement, pin: HTMLElement, sheet: HTMLElement): void {
  const panels = [...document.querySelectorAll<HTMLElement>("[data-stage-panel]")];
  const progressBar = document.querySelector<HTMLElement>("[data-pin-progress]");
  const board = document.querySelector<HTMLElement>("[data-home-board]");

  const logo = sheet.querySelector<HTMLElement>('[data-sheet-el="logo"]');
  const meta = sheet.querySelector<HTMLElement>('[data-sheet-el="meta"]');
  const rule = sheet.querySelector<HTMLElement>('[data-sheet-el="rule"]');
  const toEl = sheet.querySelector<HTMLElement>('[data-sheet-el="to"]');
  const muted = sheet.querySelector<HTMLElement>('[data-sheet-el="muted"]');
  const lines = [...sheet.querySelectorAll<HTMLElement>('[data-sheet-el="line"]')];
  const total = sheet.querySelector<HTMLElement>('[data-sheet-el="total"]');
  const totalStrong = total?.querySelector("strong");

  if (!logo || !meta || !rule || !toEl || !muted || !total || !totalStrong) return;

  // Sheet paper always visible — only ink layers animate
  utils.set(sheet, { opacity: 1, y: 18, rotate: "-2deg", scale: 0.96 });
  utils.set([logo, meta, muted, total, ...lines], { opacity: 0 });
  utils.set(logo, { scale: 0.7 });
  utils.set(meta, { y: -6 });
  utils.set(muted, { y: 8 });
  utils.set(lines, { y: 12 });
  utils.set(total, { y: 10 });
  utils.set(rule, { scaleX: 0, transformOrigin: "left center", opacity: 1 });

  const toSplit = splitText(toEl, { chars: true });
  utils.set(toSplit.chars, { opacity: 0 });

  const lineSplits = lines.map((li) => {
    const label = li.querySelector("span:first-child");
    return label ? splitText(label, { chars: true }) : null;
  });
  for (const split of lineSplits) {
    if (split) utils.set(split.chars, { opacity: 0 });
  }

  const amounts = lines
    .map((li) => li.querySelector<HTMLElement>("span:last-child"))
    .filter((el): el is HTMLElement => Boolean(el));
  utils.set(amounts, { opacity: 0 });

  const finalTotal = totalStrong.textContent?.trim() ?? "1 840";
  const totalTarget = Number(finalTotal.replace(/\s/g, "")) || 1840;
  totalStrong.textContent = "0";
  const counter = { value: 0 };

  const scrollObserver = onScroll({
    target: pin,
    container: page,
    axis: "y",
    sync: 0.1,
    enter: "top top",
    leave: "bottom bottom",
    onUpdate: (self) => {
      const p = self.progress;
      if (progressBar) progressBar.style.width = `${Math.round(p * 100)}%`;
      const panelIndex = Math.min(panels.length - 1, Math.floor(p * panels.length));
      setActivePanel(panels, panelIndex);
      if (board) {
        board.style.setProperty("--board-glow", String(0.2 + p * 0.45));
        board.style.transform = `translate3d(0, ${(0.5 - p) * 12}px, 0)`;
      }
    },
    onSyncComplete: () => {
      totalStrong.textContent = finalTotal;
      sheet.classList.add("is-preview-ready");
    },
  });

  const tl = createTimeline({
    autoplay: scrollObserver,
    defaults: { ease: "linear" },
  });

  // Panel 0–1: sheet settles into frame (already visible)
  tl.add(sheet, {
    y: { to: 0, duration: 900 },
    scale: { to: 1, duration: 900 },
    rotate: { to: "-1.25deg", duration: 900 },
    ease: "outCubic",
  });

  // Panel 2: brand
  tl.add(
    logo,
    {
      opacity: { to: 1, duration: 480 },
      scale: { to: 1, duration: 560 },
      ease: "outBack",
    },
    "+=280",
  ).add(
    meta,
    {
      opacity: { to: 1, duration: 480 },
      y: { to: 0, duration: 480 },
    },
    "-=360",
  );

  // Panel 3: type-on
  tl.add(rule, { scaleX: { to: 1, duration: 520 }, ease: "outQuad" }, "+=220")
    .add(
      toSplit.chars,
      {
        opacity: { to: 1, duration: 1 },
        delay: stagger(22),
        ease: "linear",
      },
      "-=60",
    )
    .add(
      muted,
      {
        opacity: { to: 1, duration: 400 },
        y: { to: 0, duration: 400 },
      },
      "-=40",
    );

  // Panel 4: lines
  lines.forEach((li, i) => {
    const split = lineSplits[i];
    const amount = amounts[i];
    tl.add(
      li,
      {
        opacity: { to: 1, duration: 340 },
        y: { to: 0, duration: 400 },
      },
      i === 0 ? "+=180" : "+=100",
    );
    if (split) {
      tl.add(
        split.chars,
        {
          opacity: { to: 1, duration: 1 },
          delay: stagger(15),
          ease: "linear",
        },
        "-=260",
      );
    }
    if (amount) tl.add(amount, { opacity: { to: 1, duration: 260 } }, "-=70");
  });

  // Panel 5: total
  tl.add(
    total,
    {
      opacity: { to: 1, duration: 420 },
      y: { to: 0, duration: 420 },
    },
    "+=140",
  ).add(
    counter,
    {
      value: totalTarget,
      duration: 860,
      ease: "outExpo",
      modifier: utils.round(0),
      onUpdate: () => {
        totalStrong.textContent = formatAmount(counter.value);
      },
      onComplete: () => {
        totalStrong.textContent = finalTotal;
      },
    },
    "-=300",
  );
}

/** Full-page static parallax scroll landing. */
export function initHomePreview(): void {
  const page = document.querySelector<HTMLElement>("[data-home-scroll]");
  const pin = document.querySelector<HTMLElement>("[data-home-pin]");
  const sheet = document.querySelector<HTMLElement>("[data-home-preview]");
  if (!page || !pin || !sheet) return;

  const panels = [...document.querySelectorAll<HTMLElement>("[data-stage-panel]")];

  if (prefersReducedMotion()) {
    showSheetContent(sheet);
    setActivePanel(panels, panels.length - 1);
    const progressBar = document.querySelector<HTMLElement>("[data-pin-progress]");
    if (progressBar) progressBar.style.width = "100%";
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      el.classList.add("is-revealed");
      el.classList.remove("is-reveal-pending");
    });
    return;
  }

  initPageParallax(page);
  initPdfScrollBuild(page, pin, sheet);
  initChapterReveals(page);
}
