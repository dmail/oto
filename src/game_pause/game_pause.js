import { computed, effect, signal } from "@preact/signals";
import {
  applyGamePausedEffectOnAudio,
  applyGamePlayingEffectOnAudio,
} from "/audio/audio.js";
import { documentHiddenSignal } from "/utils/document_visibility.js";

const gamePauseRequestedSignal = signal(true);
export const pauseGame = () => {
  gamePauseRequestedSignal.value = true;
};
export const playGame = () => {
  gamePauseRequestedSignal.value = false;
};
export const gamePausedSignal = computed(() => {
  const documentHidden = documentHiddenSignal.value;
  const gamePauseRequested = gamePauseRequestedSignal.value;
  return documentHidden || gamePauseRequested;
});
export const useGamePaused = () => gamePausedSignal.value;
effect(() => {
  const gamePaused = gamePausedSignal.value;
  if (gamePaused) {
    applyGamePausedEffectOnAudio();
  } else {
    applyGamePlayingEffectOnAudio();
  }
});
