const AUDIO_ASSETS = {
  commandSelect: { src: "assets/audio/ui-command-select.wav", volume: 0.55 },
  hitHurt: { src: "assets/audio/hit-hurt.wav", volume: 0.72 },
  slimeBossPhase12: { src: "assets/audio/music/slime-boss-phase-1-2.wav", volume: 0.36, loop: true },
  slimeBossPhase3: { src: "assets/audio/music/slime-boss-phase-3.wav", volume: 0.38, loop: true },
};

const AUDIO_PREFERENCES_KEY = "algorithmia-audio-v1";
const audioPreferences = loadAudioPreferences();

const audioCache = new Map();
const musicBufferCache = new Map();
let currentMusicKey = null;
let lastMusicOptions = {};
let waitingForGesture = false;
let audioContext = null;
let musicSource = null;
let musicGain = null;
let musicRequestId = 0;

function loadAudioPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIO_PREFERENCES_KEY) || "{}");
    return {
      musicMuted: Boolean(saved.musicMuted),
      soundMuted: Boolean(saved.soundMuted),
    };
  } catch {
    return { musicMuted: false, soundMuted: false };
  }
}

function saveAudioPreferences() {
  try {
    localStorage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify(audioPreferences));
  } catch {
    // Audio still works when browser storage is unavailable.
  }
}

function getAudio(key) {
  const config = AUDIO_ASSETS[key];
  if (!config) throw new Error(`Unknown audio asset: ${key}`);
  if (!audioCache.has(key)) {
    const audio = new Audio(config.src);
    audio.preload = config.loop ? "auto" : "metadata";
    audio.loop = Boolean(config.loop);
    audio.volume = config.volume;
    audioCache.set(key, audio);
  }
  return audioCache.get(key);
}

function armGestureRetry() {
  if (waitingForGesture) return;
  waitingForGesture = true;
  const retry = () => {
    waitingForGesture = false;
    if (audioContext?.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
    if (currentMusicKey && !musicSource) playMusic(currentMusicKey, lastMusicOptions);
    window.removeEventListener("pointerdown", retry);
    window.removeEventListener("keydown", retry);
  };
  window.addEventListener("pointerdown", retry, { once: true });
  window.addEventListener("keydown", retry, { once: true });
}

function safelyPlay(audio) {
  const playAttempt = audio.play();
  if (playAttempt?.catch) {
    playAttempt.catch(() => {
      // Browsers can block sound before the first click or key press.
      armGestureRetry();
    });
  }
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

async function getMusicBuffer(key) {
  if (musicBufferCache.has(key)) return musicBufferCache.get(key);
  const config = AUDIO_ASSETS[key];
  const context = getAudioContext();
  if (!context) return null;
  const response = await fetch(config.src);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await context.decodeAudioData(arrayBuffer);
  musicBufferCache.set(key, audioBuffer);
  return audioBuffer;
}

function stopCurrentMusicSource({ resetKey = true } = {}) {
  if (musicSource) {
    try {
      musicSource.stop();
    } catch {
      // The source may already have ended or been stopped by the browser.
    }
    musicSource.disconnect();
    musicSource = null;
  }
  if (musicGain) {
    musicGain.disconnect();
    musicGain = null;
  }
  if (resetKey) currentMusicKey = null;
}

export function playSound(key, options = {}) {
  if (audioPreferences.soundMuted) return;
  const audio = getAudio(key);
  audio.volume = options.volume ?? AUDIO_ASSETS[key].volume;
  audio.currentTime = 0;
  safelyPlay(audio);
}

export function playMusic(key, options = {}) {
  lastMusicOptions = options;
  if (audioPreferences.musicMuted) {
    musicRequestId += 1;
    stopCurrentMusicSource({ resetKey: false });
    currentMusicKey = key;
    return;
  }
  if (currentMusicKey === key && musicSource && !options.restart) return;

  const context = getAudioContext();
  if (!context) {
    const fallbackAudio = getAudio(key);
    fallbackAudio.loop = options.loop ?? Boolean(AUDIO_ASSETS[key].loop);
    fallbackAudio.volume = options.volume ?? AUDIO_ASSETS[key].volume;
    if (fallbackAudio.paused || options.restart) {
      if (options.restart) fallbackAudio.currentTime = 0;
      safelyPlay(fallbackAudio);
    }
    currentMusicKey = key;
    return;
  }

  const requestId = (musicRequestId += 1);
  stopCurrentMusicSource({ resetKey: false });
  currentMusicKey = key;
  getMusicBuffer(key).then((buffer) => {
    if (!buffer || requestId !== musicRequestId || currentMusicKey !== key) return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = options.loop ?? Boolean(AUDIO_ASSETS[key].loop);
    gain.gain.value = options.volume ?? AUDIO_ASSETS[key].volume;
    source.connect(gain);
    gain.connect(context.destination);
    musicSource = source;
    musicGain = gain;
    source.start(0);
    if (context.state === "suspended") {
      context.resume().catch(() => armGestureRetry());
      armGestureRetry();
    }
  }).catch(() => {
    armGestureRetry();
  });
}

export function stopMusic(key = currentMusicKey) {
  if (!key) return;
  stopCurrentMusicSource({ resetKey: currentMusicKey === key });
  if (audioCache.has(key)) {
    const audio = getAudio(key);
    audio.pause();
    audio.currentTime = 0;
  }
  if (currentMusicKey === key) currentMusicKey = null;
}

export function stopAllAudio() {
  musicRequestId += 1;
  stopCurrentMusicSource();
  audioCache.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  currentMusicKey = null;
}

export function getAudioPreferences() {
  return { ...audioPreferences };
}

export function setMusicMuted(muted) {
  audioPreferences.musicMuted = Boolean(muted);
  saveAudioPreferences();
  if (audioPreferences.musicMuted) {
    musicRequestId += 1;
    stopCurrentMusicSource({ resetKey: false });
    audioCache.forEach((audio, key) => {
      if (!AUDIO_ASSETS[key]?.loop) return;
      audio.pause();
    });
    return;
  }
  if (currentMusicKey) playMusic(currentMusicKey, { ...lastMusicOptions, restart: true });
}

export function setSoundMuted(muted) {
  audioPreferences.soundMuted = Boolean(muted);
  saveAudioPreferences();
  if (!audioPreferences.soundMuted) return;
  audioCache.forEach((audio, key) => {
    if (AUDIO_ASSETS[key]?.loop) return;
    audio.pause();
    audio.currentTime = 0;
  });
}
