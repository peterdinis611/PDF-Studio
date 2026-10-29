/**
 * Broadsheet landing motion — driven by data-* hooks in the HTML:
 *
 *   data-home-scroll     scroll root (page shell)
 *   data-np-nav          sticky utility bar → .is-scrolled
 *   data-np-navlink      section links → .is-current
 *   data-parallax        background wash; optional data-parallax="4" = % travel
 *   data-press / data-ink / data-plate   masthead press-start (CSS + .is-printed)
 *   data-reveal          scroll reveal; value = fade | up | left | right | scale
 *   data-stagger         parent: auto --reveal-delay on child [data-reveal]
 *   data-stagger-step    ms between children (default 90)
 *
 * Prefer attributes over class soup so CSS owns look and JS owns wiring.
 */

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** One passive scroll listener → rAF-batched callbacks. */
function onScrollRaf(root: HTMLElement, fn: (scrollTop: number) => void): void {
  let ticking = false;
  const run = () => {
    ticking = false;
    fn(root.scrollTop);
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(run);
  };
  root.addEventListener("scroll", onScroll, { passive: true });
  fn(root.scrollTop);
}

function initNavScroll(page: HTMLElement): void {
  const nav = page.querySelector<HTMLElement>("[data-np-nav]");
  if (!nav) return;
  onScrollRaf(page, (top) => {
    nav.classList.toggle("is-scrolled", top > 12);
  });
}

function initPageParallax(page: HTMLElement): void {
  const wash = page.querySelector<HTMLElement>("[data-parallax]");
  if (!wash) return;
  const travel = Number(wash.dataset.parallax) || 4;

  onScrollRaf(page, (top) => {
    const max = page.scrollHeight - page.clientHeight;
    const p = max > 0 ? top / max : 0;
    wash.style.transform = `translate3d(0, ${p * -travel}%, 0)`;
  });
}

/** Auto-assign staggered delays for children of [data-stagger]. */
function applyStagger(page: HTMLElement): void {
  for (const group of page.querySelectorAll<HTMLElement>("[data-stagger]")) {
    const step = Number(group.dataset.staggerStep) || Number(group.dataset.stagger) || 90;
    const kids = [...group.querySelectorAll<HTMLElement>(":scope > [data-reveal], :scope [data-reveal]")].filter(
      (el) => el.closest("[data-stagger]") === group,
    );
    kids.forEach((el, i) => {
      if (!el.style.getPropertyValue("--reveal-delay")) {
        el.style.setProperty("--reveal-delay", `${i * step}ms`);
      }
    });
  }
}

function initChapterReveals(page: HTMLElement): void {
  applyStagger(page);

  const items = [...page.querySelectorAll<HTMLElement>("[data-reveal]")];
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
    { root: page, rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );

  for (const el of items) io.observe(el);
}

function initSectionTracking(page: HTMLElement): void {
  const links = [...page.querySelectorAll<HTMLAnchorElement>("[data-np-navlink]")];
  if (!links.length) return;

  const sections = new Map<Element, HTMLAnchorElement>();
  for (const link of links) {
    const id = link.getAttribute("href")?.slice(1);
    const section = id ? document.getElementById(id) : null;
    if (section) sections.set(section, link);
  }
  if (!sections.size) return;

  const ratios = new Map<Element, number>();

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
      }

      let best: Element | null = null;
      let bestRatio = 0;
      for (const [section, ratio] of ratios) {
        if (ratio > bestRatio) {
          best = section;
          bestRatio = ratio;
        }
      }

      for (const [section, link] of sections) {
        link.classList.toggle("is-current", section === best);
      }
    },
    { root: page, threshold: [0, 0.15, 0.4, 0.75] },
  );

  for (const section of sections.keys()) io.observe(section);
}

function markPrinted(page: HTMLElement): void {
  page.classList.add("is-printed");
}

/** Broadsheet / notice pages: press-start, reveals, section tracking. */
export function initHomePreview(): void {
  const page = document.querySelector<HTMLElement>("[data-home-scroll]");
  if (!page) return;

  initNavScroll(page);

  if (prefersReducedMotion()) {
    for (const el of page.querySelectorAll("[data-reveal]")) {
      el.classList.add("is-revealed");
      el.classList.remove("is-reveal-pending");
    }
    markPrinted(page);
    initSectionTracking(page);
    return;
  }

  requestAnimationFrame(() => markPrinted(page));
  window.setTimeout(() => markPrinted(page), 900);

  initPageParallax(page);
  initChapterReveals(page);
  initSectionTracking(page);
}
