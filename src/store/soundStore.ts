import { create } from "zustand";

interface SoundState {
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
}

const getInitialMute = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("store_sound_muted") === "true";
};

export const useSoundStore = create<SoundState>((set) => ({
  isMuted: getInitialMute(),
  toggleMute: () =>
    set((state) => {
      const next = !state.isMuted;
      if (typeof window !== "undefined") {
        localStorage.setItem("store_sound_muted", String(next));
      }
      return { isMuted: next };
    }),
  setMuted: (muted: boolean) =>
    set(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("store_sound_muted", String(muted));
      }
      return { isMuted: muted };
    }),
}));
