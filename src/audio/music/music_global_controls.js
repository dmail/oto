import { computed, effect, signal } from "@preact/signals";
import { musicVolumePreferenceSignal } from "../audio_preferences.js";
import { animateNumber } from "/animations/number/animate_number.js";
import { EASING } from "/animations/utils/easing.js";
import { gamePausedSignal } from "/game_pause/game_pause.js";

const NO_OP = () => {};

// global volume
const musicGlobalVolumeSignal = signal(1);
const musicGlobalVolumeAnimatedSignal = signal();
export const musicGlobalCurrentVolumeSignal = computed(() => {
  const musicGlobalVolumeAnimated = musicGlobalVolumeAnimatedSignal.value;
  const musicGlobalVolume = musicGlobalVolumeSignal.value;
  const musicGlobalCurrentVolume =
    musicGlobalVolumeAnimated === undefined
      ? musicGlobalVolume
      : musicGlobalVolumeAnimated;
  return musicGlobalCurrentVolume;
});
export const useMusicGlobalVolume = () => {
  return musicGlobalVolumeSignal.value;
};
export const setMusicGlobalVolume = (
  value,
  { animate = true, duration = 2000 } = {},
) => {
  removeGlobalVolumeAnimation();
  if (!animate) {
    musicGlobalVolumeSignal.value = value;
    return;
  }
  const from = musicGlobalCurrentVolumeSignal.peek();
  const to = value;
  musicGlobalVolumeSignal.value = value;
  animateMusicGlobalVolume(from, to, {
    duration,
    easing: EASING.EASE_OUT_EXPO,
  });
};
let removeGlobalVolumeAnimation = NO_OP;
const animateMusicGlobalVolume = (from, to, props) => {
  removeGlobalVolumeAnimation();
  const globalVolumeAnimation = animateNumber(from, to, {
    ...props,
    // when doc is hidden the browser won't let the animation run
    // and onfinish() won't be called -> audio won't pause
    isAudio: true,
    effect: (volumeValue) => {
      musicGlobalVolumeAnimatedSignal.value = volumeValue;
    },
    onremove: () => {
      musicGlobalVolumeAnimatedSignal.value = undefined;
      removeGlobalVolumeAnimation = NO_OP;
    },
    onfinish: () => {
      musicGlobalVolumeAnimatedSignal.value = undefined;
      removeGlobalVolumeAnimation = NO_OP;
      props.onfinish?.();
    },
  });
  removeGlobalVolumeAnimation = () => {
    globalVolumeAnimation.remove();
  };
  return globalVolumeAnimation;
};
effect(() => {
  const musicVolumeBase = musicVolumePreferenceSignal.value;
  const gamePaused = gamePausedSignal.value;
  if (gamePaused) {
    setMusicGlobalVolume(musicVolumeBase * 0.2, { duration: 3000 });
  } else {
    setMusicGlobalVolume(musicVolumeBase, { duration: 3000 });
  }
});

// mute all musics
export const musicsAllMutedSignal = signal(false);
export const useMusicsAllMuted = () => {
  return musicsAllMutedSignal.value;
};
export const muteAllMusics = () => {
  musicsAllMutedSignal.value = true;
};
export const unmuteAllMusics = () => {
  musicsAllMutedSignal.value = false;
};

// pause all musics
export const musicsAllPausedSignal = signal(false);
export const useMusicsAllPaused = () => {
  return musicsAllPausedSignal.value;
};
export const pauseAllMusics = () => {
  musicsAllPausedSignal.value = true;
};
export const playAllMusics = () => {
  musicsAllPausedSignal.value = false;
};

// single playback
export const playOneAtATimeSignal = signal(true);
export const useMultipleMusicPlaybackIsPrevented = () => {
  return playOneAtATimeSignal.value;
};
export const preventMultipleMusicPlayback = () => {
  playOneAtATimeSignal.value = true;
};
export const allowMultipleMusicPlayback = () => {
  playOneAtATimeSignal.value = false;
};
