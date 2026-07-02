// Web Audio synth for SFX + HTML5 lobby track (client/public/audio/lobby-music.m4a).

const STORE_KEY = "alkheelank.audio";
const LOBBY_MUSIC_SRC = "/audio/lobby-music.m4a";

/** Real-time lofi treatment on the lobby track (no re-encode needed). */
const LOFI = {
  playbackRate: 0.935,
  lowpassHz: 3000,
  warmthHz: 240,
  warmthDb: 2.4,
  wobbleRateHz: 0.11,
  wobbleDepthHz: 200,
  vinylGain: 0.016,
};

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
let lobbyMusicDesired = false;
let lobbyAudio = null;
let lobbyDucked = false;
let musicTension = 0;
let lobbySource = null;
let lobbyGainNode = null;
let lofiFilter = null;
let lofiWobble = null;
let lofiVinyl = null;

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
  musicGain.gain.setTargetAtTime(store.music && !store.muted ? 1 : 0, t, 0.02);
  sfxGain.gain.setTargetAtTime(store.sfx && !store.muted ? 1 : 0, t, 0.02);
  applyLobbyVolume();
}

function lobbyVolume() {
  if (store.muted || !store.music) return 0;
  return Math.max(0, Math.min(1, store.master * 0.82));
}

function ensureLobbyAudio() {
  if (typeof window === "undefined") return null;
  if (!lobbyAudio) {
    lobbyAudio = new Audio(LOBBY_MUSIC_SRC);
    lobbyAudio.loop = true;
    lobbyAudio.preload = "auto";
    lobbyAudio.playbackRate = LOFI.playbackRate;
    lobbyAudio.volume = 1;
  }
  return lobbyAudio;
}

function lofiPlaybackRate() {
  return LOFI.playbackRate + musicTension * 0.05;
}

function makeNoiseBuffer(c, seconds = 2) {
  const n = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i += 1) data[i] = Math.random() * 2 - 1;
  return buf;
}

function ensureLobbyGraph() {
  const c = ac();
  const el = ensureLobbyAudio();
  if (!c || !el || lobbySource) return;

  lobbySource = c.createMediaElementSource(el);

  lofiFilter = c.createBiquadFilter();
  lofiFilter.type = "lowpass";
  lofiFilter.frequency.value = LOFI.lowpassHz;
  lofiFilter.Q.value = 0.65;

  const warmth = c.createBiquadFilter();
  warmth.type = "lowshelf";
  warmth.frequency.value = LOFI.warmthHz;
  warmth.gain.value = LOFI.warmthDb;

  lobbyGainNode = c.createGain();
  lobbyGainNode.gain.value = lobbyVolume();

  lobbySource.connect(lofiFilter).connect(warmth).connect(lobbyGainNode).connect(masterGain);

  const lfo = c.createOscillator();
  const lfoDepth = c.createGain();
  lfo.type = "sine";
  lfo.frequency.value = LOFI.wobbleRateHz;
  lfoDepth.gain.value = LOFI.wobbleDepthHz;
  lfo.connect(lfoDepth).connect(lofiFilter.frequency);
  lfo.start();
  lofiWobble = lfo;

  const noise = c.createBufferSource();
  noise.buffer = makeNoiseBuffer(c);
  noise.loop = true;
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 2800;
  noiseFilter.Q.value = 0.35;
  const noiseGain = c.createGain();
  noiseGain.gain.value = LOFI.vinylGain;
  noise.connect(noiseFilter).connect(noiseGain).connect(lobbyGainNode);
  noise.start();
  lofiVinyl = noise;
}

function applyLobbyVolume() {
  if (!lobbyGainNode || lobbyDucked || !ctx) return;
  lobbyGainNode.gain.setTargetAtTime(lobbyVolume(), ctx.currentTime, 0.03);
}

function syncLobbyMusic() {
  const shouldPlay = lobbyMusicDesired && store.music && !store.muted;
  if (shouldPlay) music.start();
  else music.stop();
}

/** Host lobby calls this when entering/leaving the waiting room. */
export function setLobbyMusicActive(active) {
  lobbyMusicDesired = !!active;
  syncLobbyMusic();
}

/** Briefly lower lobby track when important SFX play. */
function duckMusic(ms = 420, depth = 0.35) {
  if (!store.music || store.muted) return;
  if (lobbyGainNode && lobbyAudio && !lobbyAudio.paused && ctx) {
    lobbyDucked = true;
    const target = lobbyVolume() * depth;
    lobbyGainNode.gain.setTargetAtTime(target, ctx.currentTime, 0.04);
    if (duckTimer) clearTimeout(duckTimer);
    duckTimer = setTimeout(() => {
      lobbyDucked = false;
      applyLobbyVolume();
    }, ms);
    return;
  }
  if (!musicGain) return;
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
  syncLobbyMusic();
  listeners.forEach((fn) => fn(getAudioSettings()));
}

export function subscribeAudio(fn) {
  listeners.add(fn);
  fn(getAudioSettings());
  return () => listeners.delete(fn);
}

export function setSound(on) {
  setAudioSettings({ muted: !on });
}

export function isSoundOn() {
  return !store.muted;
}

function canPlayChannel(channel) {
  if (store.muted) return false;
  if (channel === "music") return store.music;
  return store.sfx;
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
  if (!canPlayChannel(channel)) return;
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

export const music = {
  start() {
    if (!store.music || store.muted) return;
    ensureLobbyGraph();
    const el = ensureLobbyAudio();
    if (!el) return;
    el.playbackRate = lofiPlaybackRate();
    applyLobbyVolume();
    const playAttempt = el.play();
    if (playAttempt?.catch) {
      playAttempt.catch(() => {
        /* blocked until primeAudio() / user gesture */
      });
    }
  },
  stop() {
    if (lobbyAudio) {
      lobbyAudio.pause();
      lobbyAudio.currentTime = 0;
      lobbyDucked = false;
      applyLobbyVolume();
    }
  },
  get playing() {
    return !!(lobbyAudio && !lobbyAudio.paused);
  },
  setTension(level = 0) {
    musicTension = Math.max(0, Math.min(1, Number(level) || 0));
    if (lobbyAudio && music.playing) {
      lobbyAudio.playbackRate = lofiPlaybackRate();
    }
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
      tone({ freq: f, dur: 0.14, type: "sine", gain: 0.1, when: i * 0.08 }),
    );
  },
  wrong: () => {
    duckMusic(350, 0.4);
    tone({ freq: 220, slideTo: 160, dur: 0.28, type: "sine", gain: 0.09 });
  },
  podium: () => {
    duckMusic(600, 0.2);
    [392, 523, 659, 784].forEach((f, i) =>
      tone({ freq: f, dur: 0.2, type: "triangle", gain: 0.1, when: i * 0.11 }),
    );
  },
  /** Accelerating tom roll — returns { stop } for cleanup on unmount. */
  drumRoll({ durationMs = 1400, intense = false } = {}) {
    const c = ac();
    if (!c || !canPlayChannel("sfx")) return { stop: () => {} };

    duckMusic(durationMs + 280, intense ? 0.12 : 0.18);

    const hits = [];
    let acc = 0;
    let gapMs = intense ? 165 : 195;
    const minGapMs = intense ? 32 : 48;
    while (acc < durationMs * 0.93) {
      hits.push(acc / 1000);
      acc += gapMs;
      gapMs = Math.max(minGapMs, gapMs * (intense ? 0.87 : 0.89));
    }

    hits.forEach((when, i) => {
      const p = hits.length <= 1 ? 1 : i / (hits.length - 1);
      const gain = 0.032 + p * (intense ? 0.1 : 0.065);
      tone({
        freq: 88 + p * 55,
        dur: 0.06 + p * 0.025,
        type: "sine",
        gain,
        when,
        duck: i === 0,
      });
      if (i % 2 === 1 || p > 0.55) {
        tone({
          freq: 170 + p * 140,
          dur: 0.022,
          type: "triangle",
          gain: gain * 0.5,
          when: when + 0.006,
        });
      }
      if (intense && p > 0.7 && i % 2 === 0) {
        tone({
          freq: 420 + p * 180,
          dur: 0.018,
          type: "square",
          gain: gain * 0.28,
          when,
        });
      }
    });

    return { stop: () => {} };
  },
};

/** Unlock the audio engine on first user gesture (browser autoplay policy). */
export function primeAudio() {
  ac();
  ensureLobbyGraph();
  const el = ensureLobbyAudio();
  if (el && lobbyMusicDesired && store.music && !store.muted && el.paused) {
    syncLobbyMusic();
  }
}
