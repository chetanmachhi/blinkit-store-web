/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          soft: "var(--color-primary-soft)",
        },
        accent: {
          amber: "#FFD84D",
          violet: "#6D4AFF",
        },
        status: {
          success: "#12B76A",
          warning: "#F59E0B",
          danger: "#E5484D",
        },
        bg: {
          main: "var(--color-bg)",
          card: "var(--color-card)",
          muted: "var(--color-bg-muted)",
        },
        border: "var(--color-border)",
        text: {
          primary: "var(--color-text)",
          muted: "var(--color-text-muted)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
