// Web Audio API Synthesizer for game sound effects without external audio assets

let audioCtx: AudioContext | null = null;
let isSoundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const soundManager = {
  get isMuted(): boolean {
    return !isSoundEnabled;
  },
  toggleMute(): boolean {
    isSoundEnabled = !isSoundEnabled;
    return isSoundEnabled;
  },
  setMute(mute: boolean) {
    isSoundEnabled = !mute;
  },

  // Suara saat kartu memori diklik/dibalik
  playCardFlip() {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // ignore
    }
  },

  // Suara saat pasangan BENAR (Harmonis C-E-G chord)
  playMatchSuccess() {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + idx * 0.06 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 0.3);
      });
    } catch {
      // ignore
    }
  },

  // Suara saat pasangan SALAH (Dua nada rendah getar)
  playErrorBuzz() {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.setValueAtTime(120, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // ignore
    }
  },

  // Suara saat Level Tuntas
  playLevelComplete() {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const melody = [
        { freq: 440, duration: 0.1 },  // A4
        { freq: 554.37, duration: 0.1 }, // C#5
        { freq: 659.25, duration: 0.12 }, // E5
        { freq: 880, duration: 0.35 },  // A5
      ];

      let startTime = ctx.currentTime;
      melody.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.duration);

        startTime += note.duration + 0.04;
      });
    } catch {
      // ignore
    }
  },

  // Fanfare Selebrasi Kelulusan & Sertifikat
  playGraduationFanfare() {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const chords = [
        { notes: [523.25, 659.25, 783.99], time: 0, dur: 0.25 }, // C
        { notes: [587.33, 739.99, 880.00], time: 0.3, dur: 0.25 }, // D
        { notes: [659.25, 830.61, 987.77], time: 0.6, dur: 0.25 }, // E
        { notes: [783.99, 987.77, 1174.66, 1567.98], time: 0.9, dur: 0.8 }, // G majestic
      ];

      chords.forEach((chord) => {
        chord.notes.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + chord.time);

          gain.gain.setValueAtTime(0, ctx.currentTime + chord.time);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + chord.time + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + chord.time + chord.dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + chord.time);
          osc.stop(ctx.currentTime + chord.time + chord.dur);
        });
      });
    } catch {
      // ignore
    }
  },
};
