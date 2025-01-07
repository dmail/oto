import { setMusicGlobalVolume } from "./music/music.js";

const localStorageItem = localStorage.getItem("volume_prefs");
const volumePreferences =
  localStorageItem === null
    ? {
        music: 1,
        sound: 1,
      }
    : JSON.parse(localStorageItem);
let musicVolumeBase = volumePreferences.music;
// let soundVolumeBase = volumePreferences.sound;

export const setVolumePreferences = ({ music, sound }) => {
  musicVolumeBase = music;
  // soundVolumeBase = sound;
  localStorage.setItem("volume_prefs", JSON.stringify({ music, sound }));
};

let gameIsPaused = false;
const updateMusicGlobalVolume = () => {
  setMusicGlobalVolume(getMusicGlobalVolume());
};
const getMusicGlobalVolume = () => {
  if (gameIsPaused) {
    return musicVolumeBase * 0.2;
  }
  return musicVolumeBase;
};
updateMusicGlobalVolume();
export const applyGamePausedEffectOnAudio = () => {
  gameIsPaused = true;
  updateMusicGlobalVolume();
};

export const applyGamePlayingEffectOnAudio = () => {
  gameIsPaused = false;
  updateMusicGlobalVolume();
};
