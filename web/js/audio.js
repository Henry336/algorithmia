const AUDIO_ASSETS = {
  commandSelect: { src: "assets/audio/ui-command-select.wav", volume: 0.55 },
  hitHurt: { src: "assets/audio/hit-hurt.wav", volume: 0.72 },
  slimeBossPhase12: { src: "assets/audio/music/slime-boss-phase-1-2.wav", volume: 0.36, loop: true },
  slimeBossPhase3: { src: "assets/audio/music/slime-boss-phase-3.wav", volume: 0.38, loop: true },
};

const audioCache = new Map();
let currentMusicKey = null;
let lastMusicOptions = {};
let waitingForGesture = false;

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
    if (currentMusicKey) playMusic(currentMusicKey, lastMusicOptions);
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

export function playSound(key, options = {}) {
  const audio = getAudio(key);
  audio.volume = options.volume ?? AUDIO_ASSETS[key].volume;
  audio.currentTime = 0;
  safelyPlay(audio);
}

export function playMusic(key, options = {}) {
  const nextAudio = getAudio(key);
  lastMusicOptions = options;
  if (currentMusicKey && currentMusicKey !== key) {
    const oldAudio = getAudio(currentMusicKey);
    oldAudio.pause();
    oldAudio.currentTime = 0;
  }
  currentMusicKey = key;
  nextAudio.loop = options.loop ?? Boolean(AUDIO_ASSETS[key].loop);
  nextAudio.volume = options.volume ?? AUDIO_ASSETS[key].volume;
  if (nextAudio.paused || options.restart) {
    if (options.restart) nextAudio.currentTime = 0;
    safelyPlay(nextAudio);
  }
}

export function stopMusic(key = currentMusicKey) {
  if (!key) return;
  const audio = getAudio(key);
  audio.pause();
  audio.currentTime = 0;
  if (currentMusicKey === key) currentMusicKey = null;
}

export function stopAllAudio() {
  audioCache.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  currentMusicKey = null;
}
