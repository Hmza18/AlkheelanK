// Web Audio synth — family-friendly, optional, with music/SFX ducking.

const STORE_KEY = "alkheelank.audio";

const defaults = { master: 0.7, music: true, sfx: true, muted: false };

function loadStore() {
  if (typeof localStorage === "undefined") return { ...defaults };
  try {
    return { ...defaults, ...(JSON.parse(localStorage.getItem(STORE_KEY)) || {}) };
  } catch {
    return { ...defaults };
  }
}

let store = loadStore();
const listeners = new Set();

let ctx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let duckTimer = null;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    musicGain = ctx.createGain();
    sfxGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    musicGain.connect(masterGain);
    sfxGain.connect(masterGain);
    applyGains();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function applyGains() {
  if (!masterGain) return;
  const t = ctx ? ctx.currentTime : 0;
  const master = store.muted ? 0 : store.master;
  masterGain.gain.setTargetAtTime(master, t, 0.02);
  musicGain.gain.setTargetAtTime(store.music ? 1 : 0, t, 0.02);
  sfxGain.gain.setTargetAtTime(store.sfx ? 1 : 0, t, 0.02);
}

/** Briefly lower music when important SFX play so reveals never fight the groove. */
function duckMusic(ms = 420, depth = 0.35) {
  if (!musicGain || !store.music || store.muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  musicGain.gain.cancelScheduledValues(t);
  musicGain.gain.setTargetAtTime(depth, t, 0.04);
  if (duckTimer) clearTimeout(duckTimer);
  duckTimer = setTimeout(() => {
    if (musicGain && ctx) {
      const t2 = ctx.currentTime;
      musicGain.gain.setTargetAtTime(1, t2, 0.08);
    }
  }, ms);
}

function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function getAudioSettings() {
  return { ...store };
}

export function setAudioSettings(patch) {
  store = { ...store, ...patch };
  persist();
  ac();
  applyGains();
  if ((!store.music || store.muted) && music.playing) music.stop();
  listeners.forEach((fn) => fn(getAudioSettings()));
}

export function subscribeAudio(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setSound(on) {
  setAudioSettings({ muted: !on });
}

export function isSoundOn() {
  return !store.muted;
}

function tone({
  freq = 440,
  dur = 0.12,
  type = "sine",
  gain = 0.12,
  when = 0,
  slideTo,
  channel = "sfx",
  duck = false,
}) {
  const c = ac();
  if (!c) return;
  if (duck && channel === "sfx") duckMusic();
  const dest = channel === "music" ? musicGain : sfxGain;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

let musicTimer = null;
let musicTension = 0;

export const music = {
  start() {
    const c = ac();
    if (!c || musicTimer || !store.music) return;
    const chords = [
      [262, 330, 392],
      [294, 370, 440],
      [330, 415, 494],
      [247, 311, 392],
    ];
    let i = 0;
    const play = () => {
      const ch = chords[i % chords.length];
      i += 1;
      const lift = 1 + musicTension * 0.18;
      ch.forEach((f, k) =>
        tone({
          freq: Math.round(f * lift),
          dur: 1.5 - musicTension * 0.35,
          type: "sine",
          gain: 0.045 + musicTension * 0.018,
          when: k * 0.04,
          channel: "music",
        })
      );
      tone({
        freq: (ch[0] / 2) * lift,
        dur: 1.5 - musicTension * 0.35,
        type: "triangle",
        gain: 0.05 + musicTension * 0.018,
        channel: "music",
      });
    };
    play();
    const base = 1700;
    musicTimer = setInterval(play, Math.max(950, Math.round(base - musicTension * 500)));
  },
  stop() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  },
  get playing() {
    return !!musicTimer;
  },
  setTension(level = 0) {
    musicTension = Math.max(0, Math.min(1, Number(level) || 0));
    if (!music.playing) return;
    music.stop();
    music.start();
  },
};

export const sfx = {
  tap: () => tone({ freq: 520, dur: 0.08, type: "triangle", gain: 0.08 }),
  confirm: () => {
    duckMusic(300, 0.4);
    tone({ freq: 587, dur: 0.1, type: "sine", gain: 0.1 });
    tone({ freq: 740, dur: 0.12, type: "sine", gain: 0.09, when: 0.06 });
  },
  lock: () => tone({ freq: 660, slideTo: 880, dur: 0.14, type: "sine", gain: 0.1 }),
  join: () => {
    tone({ freq: 523, dur: 0.09, type: "sine", gain: 0.09 });
    tone({ freq: 784, dur: 0.12, type: "sine", gain: 0.09, when: 0.07 });
  },
  tick: () => tone({ freq: 300, dur: 0.04, type: "triangle", gain: 0.04 }),
  reveal: () => {
    duckMusic(520, 0.25);
    tone({ freq: 196, slideTo: 130, dur: 0.35, type: "sine", gain: 0.07, duck: false });
    tone({ freq: 392, dur: 0.2, type: "triangle", gain: 0.06, when: 0.12 });
  },
  moment: () => {
    duckMusic(400, 0.3);
    tone({ freq: 659, dur: 0.14, type: "sine", gain: 0.1 });
    tone({ freq: 988, dur: 0.16, type: "sine", gain: 0.08, when: 0.1 });
  },
  transition: () => tone({ freq: 440, slideTo: 550, dur: 0.12, type: "sine", gain: 0.07 }),
  correct: () => {
    duckMusic(480, 0.3);
    [523, 659, 784].forEach((f, i) =>
      tone({ freq: f, dur: 0.14, type: "sine", gain: 0.1, when: i * 0.08 })
    );
  },
  wrong: () => {
    duckMusic(350, 0.4);
    tone({ freq: 220, slideTo: 160, dur: 0.28, type: "sine", gain: 0.09 });
  },
  podium: () => {
    duckMusic(600, 0.2);
    [392, 523, 659, 784].forEach((f, i) =>
      tone({ freq: f, dur: 0.2, type: "triangle", gain: 0.1, when: i * 0.11 })
    );
  },
};
