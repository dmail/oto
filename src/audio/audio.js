import { decreaseVolume, restoreVolume } from "./music/music.js";

export const applyGamePausedEffectOnAudio = () => {
  decreaseVolume();
};

export const applyGamePlayingEffectOnAudio = () => {
  restoreVolume();
};
