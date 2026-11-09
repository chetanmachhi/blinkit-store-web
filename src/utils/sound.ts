let audioCtx: AudioContext | null = null;

export const playNewOrderBeep = (isMuted: boolean = false): void => {
  if (isMuted || typeof window === "undefined") return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.setValueAtTime(880, now + 0.1);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.setValueAtTime(1174.66, now + 0.1);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  } catch (e) {
    console.error("Audio beep playback prevented or failed", e);
  }
};
