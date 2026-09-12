function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initNavScroll(page: HTMLElement): void {
  const nav = document.querySelector<HTMLElement>("[data-np-nav]");
  if (!nav) return;
  const onScrollPage = () => {
    nav.classList.toggle("is-scrolled", page.scrollTop > 12);
  };
  page.addEventListener("scroll", onScrollPage, { passive: true });
  onScrollPage();
}

function initPageParallax(page: HTMLElement): void {
  const wash = document.querySelector<HTMLElement>("[data-parallax-vibe]");
  if (!wash) return;

  const onScrollPage = () => {
    const max = page.scrollHeight - page.clientHeight;
    const p = max > 0 ? page.scrollTop / max : 0;
    wash.style.transform = `translate3d(0, ${p * -4}%, 0)`;
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
    { root: page, rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
  );

  for (const el of items) io.observe(el);
}

/**
 * Marks which section the reader is currently in, like the page indicator
 * on a newspaper section front.
 */
function initSectionTracking(page: HTMLElement): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-np-navlink]")];
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

/** Broadsheet landing page: masthead press-start, reveals, section tracking. */
export function initHomePreview(): void {
  const page = document.querySelector<HTMLElement>("[data-home-scroll]");
  if (!page) return;

  initNavScroll(page);

  if (prefersReducedMotion()) {
    for (const el of document.querySelectorAll("[data-reveal]")) {
      el.classList.add("is-revealed");
      el.classList.remove("is-reveal-pending");
    }
    page.classList.add("is-printed");
    initSectionTracking(page);
    return;
  }

  // Run the press on the next frame, with a safety net so the masthead can
  // never be left blank if the frame callback is starved.
  requestAnimationFrame(() => page.classList.add("is-printed"));
  window.setTimeout(() => page.classList.add("is-printed"), 900);

  initPageParallax(page);
  initChapterReveals(page);
  initSectionTracking(page);
}
