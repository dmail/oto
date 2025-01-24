import { effect, signal } from "@preact/signals";
import {
  muteAllMusics,
  setMusicGlobalVolume,
  unmuteAllMusics,
} from "./music/music.js";
import { muteAllSounds, unmuteAllSounds } from "./sound/sound.js";
import { gamePausedSignal } from "/game_pause/game_pause.js";

const mutedLocalStorageItem = localStorage.getItem("muted");
const mutedFromLocalStorage =
  mutedLocalStorageItem === undefined
    ? false
    : JSON.parse(mutedLocalStorageItem);
export const mutedSignal = signal(mutedFromLocalStorage || false);
export const useMuted = () => {
  return mutedSignal.value;
};
export const mute = () => {
  mutedSignal.value = true;
};
export const unmute = () => {
  mutedSignal.value = false;
};
effect(() => {
  const muted = mutedSignal.value;
  if (muted) {
    muteAllMusics();
    muteAllSounds();
  } else {
    unmuteAllMusics();
    unmuteAllSounds();
  }
  localStorage.setItem("muted", JSON.stringify(muted));
});

const volumePrefsLocalStorageItem = localStorage.getItem("volume_prefs");
const volumePreferences =
  volumePrefsLocalStorageItem === null
    ? {
        music: 1,
        sound: 1,
      }
    : JSON.parse(volumePrefsLocalStorageItem);
let musicVolumeBase = volumePreferences.music;
// let soundVolumeBase = volumePreferences.sound;

export const setVolumePreferences = ({ music, sound }) => {
  musicVolumeBase = music;
  // soundVolumeBase = sound;
  localStorage.setItem("volume_prefs", JSON.stringify({ music, sound }));
};

effect(() => {
  const gamePaused = gamePausedSignal.value;
  if (gamePaused) {
    setMusicGlobalVolume(musicVolumeBase * 0.2, { duration: 3000 });
  } else {
    setMusicGlobalVolume(musicVolumeBase, { duration: 3000 });
  }
});
