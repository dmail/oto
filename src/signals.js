import { effect, signal } from "@preact/signals";
import {
  applyGamePausedEffectOnAudio,
  applyGamePlayingEffectOnAudio,
} from "/audio/audio.js";

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
    applyGamePausedEffectOnAudio();
  } else {
    applyGamePlayingEffectOnAudio();
  }
});
