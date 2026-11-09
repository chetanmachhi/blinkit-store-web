import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

const getInitialTheme = (): boolean => {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem("store_theme");
  if (saved) return saved === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark;
      if (typeof window !== "undefined") {
        localStorage.setItem("store_theme", next ? "dark" : "light");
        if (next) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return { isDark: next };
    }),
  setTheme: (dark: boolean) =>
    set(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("store_theme", dark ? "dark" : "light");
        if (dark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return { isDark: dark };
    }),
}));
