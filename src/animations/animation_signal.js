import { computed, signal } from "@preact/signals";
import { gamePausedSignal } from "/game_pause/game_pause.js";

const animationsAllPausedRequestedSignal = signal(false);
export const animationsAllPausedSignal = computed(() => {
  const gamePaused = gamePausedSignal.value;
  const animationsAllPausedRequested = animationsAllPausedRequestedSignal.value;
  return gamePaused || animationsAllPausedRequested;
});
export const useAnimationsAllPaused = () => {
  return animationsAllPausedSignal.value;
};
export const pauseAllAnimations = () => {
  animationsAllPausedRequestedSignal.value = true;
};
export const playAllAnimations = () => {
  animationsAllPausedRequestedSignal.value = false;
};
