import { effect, signal } from "@preact/signals";
import { muteMusic, unmuteMusic } from "./music/music.js";
import { muteSounds, unmuteSounds } from "./sound/sound.js";

const localStorageItem = localStorage.getItem("muted");
const mutedFromLocalStorage =
  localStorageItem === undefined ? false : JSON.parse(localStorageItem);
export const mutedSignal = signal(mutedFromLocalStorage || false);
export const mute = () => {
  mutedSignal.value = true;
};
export const unmute = () => {
  mutedSignal.value = false;
};
effect(() => {
  const muted = mutedSignal.value;
  if (muted) {
    muteMusic();
    muteSounds();
  } else {
    unmuteMusic();
    unmuteSounds();
  }
  localStorage.setItem("muted", JSON.stringify(muted));
});
