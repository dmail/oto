import { computed, signal } from "@preact/signals";
import { gamePausedSignal } from "/game_pause/game_pause.js";

const animationsPlayGloballyPreventedSignal = signal(false);
export const animationsCanPlaySignal = computed(() => {
  const gamePaused = gamePausedSignal.value;
  const animationsPlayGloballyPrevented =
    animationsPlayGloballyPreventedSignal.value;
  if (gamePaused) {
    return false;
  }
  if (animationsPlayGloballyPrevented) {
    return false;
  }
  return true;
});
