import type { Config } from "tailwindcss";

/**
 * Все цвета идут через CSS custom properties (см. src/styles/tokens.css).
 * Смена режима перезаписывает только --accent / --accent-text / --accent-soft.
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      screen: "var(--screen-bg)",
      surface: {
        DEFAULT: "var(--surface)",
        2: "var(--surface-2)",
        3: "var(--surface-3)",
      },
      border: {
        DEFAULT: "var(--border)",
        soft: "var(--border-soft)",
      },
      text: {
        DEFAULT: "var(--text)",
        dim: "var(--text-dim)",
        faint: "var(--text-faint)",
      },
      accent: {
        DEFAULT: "var(--accent)",
        text: "var(--accent-text)",
        soft: "var(--accent-soft)",
      },
      danger: "var(--danger)",
      ok: "#5FBF8F",
      warn: "#E7B45A",
    },
    fontFamily: {
      display: ["'Space Grotesk'", "system-ui", "sans-serif"],
      sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
    },
    extend: {
      borderRadius: {
        card: "18px",
        sheet: "24px",
        chip: "14px",
      },
      keyframes: {
        sheetIn: {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        sheetIn: "sheetIn 240ms cubic-bezier(0.22, 1, 0.36, 1)",
        fadeIn: "fadeIn 160ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
