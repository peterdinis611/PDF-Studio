import type { IconKind } from "../shared/types.js";

/** Simple SVG path snippets in 24×24 viewBox for canvas preview */
export const ICON_PATHS: Record<IconKind, string> = {
  star: "M12 2l2.9 6.9L22 10l-5 4.5L18.2 22 12 18.2 5.8 22 7 14.5 2 10l7.1-1.1L12 2z",
  heart:
    "M12 21s-7-4.4-9.5-8.2C.4 9.5 2.2 5.5 6 5.5c2 0 3.4 1.1 4 2.2.6-1.1 2-2.2 4-2.2 3.8 0 5.6 4 3.5 7.3C19 16.6 12 21 12 21z",
  check: "M5 13l4 4L19 7",
  x: "M6 6l12 12M18 6L6 18",
  warning: "M12 3l10 18H2L12 3zm0 6v5m0 3h.01",
  info: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 8v5m0-8h.01",
  mail: "M3 6h18v12H3V6zm0 0l9 7 9-7",
  phone:
    "M6.5 3h3l1.5 4-2 1.5a12 12 0 005.5 5.5L16 12.5l4 1.5v3A2 2 0 0118 19 14 14 0 015 6a2 2 0 011.5-3z",
  pin: "M12 22s7-5.2 7-12a7 7 0 10-14 0c0 6.8 7 12 7 12zm0-9a3 3 0 110-6 3 3 0 010 6z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14z",
  calendar:
    "M7 3v2M17 3v2M4 8h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
  link: "M10 13a5 5 0 007.07 0l2.12-2.12a5 5 0 00-7.07-7.07L10.5 5.5M14 11a5 5 0 00-7.07 0L4.8 13.12a5 5 0 007.07 7.07L13.5 18.5",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18",
  file: "M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zm7 0v5h5",
  clock: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 4v5l3.5 2",
  image: "M4 5h16v14H4V5zm2 10l3.5-4.5L14 15l2-2.5L20 15M9 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3z",
};

export function iconSvg(icon: IconKind, color: string, size = 24): string {
  const d = ICON_PATHS[icon] ?? ICON_PATHS.star;
  const strokeIcons: IconKind[] = [
    "check",
    "x",
    "warning",
    "info",
    "mail",
    "calendar",
    "link",
    "globe",
    "file",
    "clock",
    "image",
  ];
  if (strokeIcons.includes(icon)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="${d}"/></svg>`;
}
