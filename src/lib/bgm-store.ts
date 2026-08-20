type Listener = (playing: boolean) => void;

let playing = false;
let audio: HTMLAudioElement | null = null;
const listeners = new Set<Listener>();

export const BGM_SRC = '/bgm/ambient.wav';

export function getBgmAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(BGM_SRC);
    audio.loop = true;
    audio.preload = 'metadata';
    audio.volume = 0.35;
  }
  return audio;
}

export function setBgmPlaying(value: boolean) {
  if (playing === value) return;
  playing = value;
  for (const listener of listeners) listener(value);
}

export function toggleBgm(): boolean {
  const a = getBgmAudio();
  if (playing) {
    a.pause();
    setBgmPlaying(false);
    return false;
  }
  a.play().then(
    () => setBgmPlaying(true),
    () => setBgmPlaying(false)
  );
  return !playing;
}

export function isBgmPlaying() {
  return playing;
}

export function onBgmChange(listener: Listener) {
  listeners.add(listener);
  listener(playing);
  return () => {
    listeners.delete(listener);
  };
}