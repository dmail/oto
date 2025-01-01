import { effect, signal } from "@preact/signals";
import { audioPausedSignal } from "/audio/audio_signals.js";

export const pausedSignal = signal(true);
export const pause = () => {
  pausedSignal.value = true;
};
export const play = () => {
  pausedSignal.value = false;
};

effect(() => {
  const gamePaused = pausedSignal.value;
  if (gamePaused) {
    audioPausedSignal.value = true;
  } else {
    audioPausedSignal.value = false;
  }
});
