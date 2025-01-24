import { computed, signal } from "@preact/signals";
import { gamePausedSignal } from "/game_pause/game_pause.js";

export const visualAnimationsPlaybackPreventedByApiSignal = signal(false);
export const visualAnimationsPlaybackPreventedSignal = computed(() => {
  const gamePaused = gamePausedSignal.value;
  const visualAnimationsPlaybackPreventedByApi =
    visualAnimationsPlaybackPreventedByApiSignal.value;
  if (gamePaused) {
    return true;
  }
  if (visualAnimationsPlaybackPreventedByApi) {
    return true;
  }
  return false;
});

export const useVisualAnimationsPlaybackIsPrevented = () => {
  return visualAnimationsPlaybackPreventedSignal.value;
};
export const preventVisualAnimationsPlayback = () => {
  visualAnimationsPlaybackPreventedByApiSignal.value = true;
};
export const allowVisualAnimationsPlayback = () => {
  visualAnimationsPlaybackPreventedByApiSignal.value = false;
};
