/** @type {import('tailwindcss').Config} */
export default {
  content: ["./views/**/*.hbs", "./src/client/**/*.ts", "./public/**/*.js"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        fg: "rgb(var(--color-fg) / <alpha-value>)",
        rail: "rgb(var(--color-rail) / <alpha-value>)",
        slate: {
          panel: "rgb(var(--color-panel) / <alpha-value>)",
          muted: "rgb(var(--color-muted) / <alpha-value>)",
          line: "rgb(var(--color-line) / <alpha-value>)",
          hover: "rgb(var(--color-hover) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          soft: "rgb(var(--color-accent-soft) / <alpha-value>)",
          dim: "rgb(var(--color-accent-dim) / <alpha-value>)",
        },
        warn: "rgb(var(--color-warn) / <alpha-value>)",
      },
      fontFamily: {
        display: ['"Bodoni Moda"', '"Bodoni MT"', "Didot", "Georgia", "serif"],
        sans: ['"Newsreader"', '"Source Serif 4"', "Georgia", "serif"],
        mono: ['"Courier Prime"', '"Courier New"', "monospace"],
      },
      boxShadow: {
        page: "var(--shadow-page)",
      },
    },
  },
  plugins: [],
};
