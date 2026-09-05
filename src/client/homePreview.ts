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

function setActiveSteps(steps: HTMLElement[], index: number): void {
  steps.forEach((step, i) => {
    step.classList.toggle("is-active", i === index);
    step.classList.toggle("is-done", i < index);
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

function initNavScroll(page: HTMLElement): void {
  const nav = document.querySelector<HTMLElement>("[data-site-nav]");
  if (!nav) return;
  const onScrollPage = () => {
    nav.classList.toggle("is-scrolled", page.scrollTop > 12);
  };
  page.addEventListener("scroll", onScrollPage, { passive: true });
  onScrollPage();
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
    if (vibe) vibe.style.transform = `translate3d(0, ${p * -4}%, 0) scale(${1 + p * 0.03})`;
    if (orbA) orbA.style.transform = `translate3d(${p * -8}%, ${p * 16}%, 0)`;
    if (orbB) orbB.style.transform = `translate3d(${p * 10}%, ${p * -12}%, 0)`;
    if (orbC) orbC.style.transform = `translate3d(${p * -4}%, ${p * 8}%, 0)`;
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
    { root: page, rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
  );

  for (const el of items) io.observe(el);
}

function initTemplateRack(): void {
  const rack = document.querySelector<HTMLElement>("[data-tpl-rack]");
  if (!rack) return;

  const prev = document.querySelector<HTMLButtonElement>("[data-rack-prev]");
  const next = document.querySelector<HTMLButtonElement>("[data-rack-next]");
  const step = () => Math.min(280, rack.clientWidth * 0.7);

  const updateArrows = () => {
    const max = rack.scrollWidth - rack.clientWidth;
    if (prev) prev.disabled = rack.scrollLeft <= 4;
    if (next) next.disabled = rack.scrollLeft >= max - 4;
  };

  prev?.addEventListener("click", () => {
    rack.scrollBy({ left: -step(), behavior: "smooth" });
  });
  next?.addEventListener("click", () => {
    rack.scrollBy({ left: step(), behavior: "smooth" });
  });
  rack.addEventListener("scroll", updateArrows, { passive: true });
  updateArrows();

  let pointerId: number | null = null;
  let startX = 0;
  let startScroll = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let momentumId = 0;

  const stopMomentum = () => {
    if (momentumId) cancelAnimationFrame(momentumId);
    momentumId = 0;
  };

  const momentum = () => {
    if (Math.abs(velocity) < 0.15) {
      rack.classList.remove("is-dragging");
      updateArrows();
      return;
    }
    rack.scrollLeft -= velocity;
    velocity *= 0.95;
    momentumId = requestAnimationFrame(momentum);
  };

  rack.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    stopMomentum();
    pointerId = e.pointerId;
    startX = e.clientX;
    lastX = e.clientX;
    lastT = performance.now();
    startScroll = rack.scrollLeft;
    velocity = 0;
    rack.classList.add("is-dragging");
    rack.setPointerCapture(e.pointerId);
  });

  rack.addEventListener("pointermove", (e) => {
    if (pointerId !== e.pointerId) return;
    const dx = e.clientX - startX;
    rack.scrollLeft = startScroll - dx;
    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    velocity = ((e.clientX - lastX) / dt) * 16;
    lastX = e.clientX;
    lastT = now;
  });

  const endDrag = (e: PointerEvent) => {
    if (pointerId !== e.pointerId) return;
    pointerId = null;
    rack.releasePointerCapture(e.pointerId);
    velocity = -velocity;
    momentumId = requestAnimationFrame(momentum);
  };

  rack.addEventListener("pointerup", endDrag);
  rack.addEventListener("pointercancel", endDrag);
}

function initPdfScrollBuild(page: HTMLElement, pin: HTMLElement, sheet: HTMLElement): void {
  const panels = [...document.querySelectorAll<HTMLElement>("[data-stage-panel]")];
  const progressBar = document.querySelector<HTMLElement>("[data-pin-progress]");
  const steps = [...document.querySelectorAll<HTMLElement>("[data-pin-steps] [data-step]")];
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
      setActiveSteps(steps, panelIndex);
      if (board) {
        board.style.setProperty("--board-glow", String(0.22 + p * 0.5));
        board.style.transform = `translate3d(0, ${(0.5 - p) * 10}px, 0)`;
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

  tl.add(sheet, {
    y: { to: 0, duration: 900 },
    scale: { to: 1, duration: 900 },
    rotate: { to: "-1.25deg", duration: 900 },
    ease: "outCubic",
  });

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
  const steps = [...document.querySelectorAll<HTMLElement>("[data-pin-steps] [data-step]")];

  initNavScroll(page);
  initTemplateRack();

  if (prefersReducedMotion()) {
    showSheetContent(sheet);
    setActivePanel(panels, panels.length - 1);
    setActiveSteps(steps, steps.length - 1);
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
