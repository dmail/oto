import { effect, signal } from "@preact/signals";
import {
  applyGamePausedEffectOnAudio,
  applyGamePlayingEffectOnAudio,
} from "/audio/audio.js";

const reasonsToBePausedSet = new Set();
const REASON_DOCUMENT_HIDDEN = "document_hidden";
const REASON_EXPLICIT = "explicitely_requested";

export const pausedSignal = signal(true);
export const useGamePaused = () => pausedSignal.value;
export const pause = () => {
  addReasonToBePaused(REASON_EXPLICIT);
};
export const play = () => {
  removeReasonToBePaused(REASON_EXPLICIT);
  removeReasonToBePaused(REASON_DOCUMENT_HIDDEN);
};
effect(() => {
  const gamePaused = pausedSignal.value;
  if (gamePaused) {
    applyGamePausedEffectOnAudio();
  } else {
    applyGamePlayingEffectOnAudio();
  }
});

const addReasonToBePaused = (reason) => {
  reasonsToBePausedSet.add(reason);
  pausedSignal.value = true;
};
const removeReasonToBePaused = (reason) => {
  reasonsToBePausedSet.delete(reason);
  if (reasonsToBePausedSet.size === 0) {
    pausedSignal.value = false;
  }
};
const pauseWhenDocumentIsHidden = () => {
  if (document.hidden) {
    addReasonToBePaused(REASON_DOCUMENT_HIDDEN);
  }
};
pauseWhenDocumentIsHidden();
document.addEventListener("visibilitychange", () => {
  pauseWhenDocumentIsHidden();
});
