import { computed, effect, signal } from "@preact/signals";
import { animateNumber, EASING } from "animation";
import { addToSetSignal, deleteFromSetSignal } from "/utils/signal_and_set.js";
import { userActivationFacade } from "/utils/user_activation.js";

const musicSet = new Set();

// muted/unmuted
const globalReasonToBeMutedSetSignal = signal(new Set());
export const useGlobalReasonToBeMutedSet = () => {
  return globalReasonToBeMutedSetSignal.value;
};
export const addGlobalReasonToBeMuted = (reason) => {
  addToSetSignal(globalReasonToBeMutedSetSignal, reason);
};
export const removeGlobalReasonToBeMuted = (reason) => {
  deleteFromSetSignal(globalReasonToBeMutedSetSignal, reason);
};
const REASON_MUSICS_ALL_MUTED = "all_musics_paused";
const musicsAllMutedSignal = computed(() => {
  const globalReasonToBeMutedSet = globalReasonToBeMutedSetSignal.value;
  return globalReasonToBeMutedSet.has(REASON_MUSICS_ALL_MUTED);
});
export const useMusicsAllMuted = () => {
  return musicsAllMutedSignal.value;
};
export const muteAllMusics = () => {
  addGlobalReasonToBeMuted(REASON_MUSICS_ALL_MUTED);
};
export const unmuteAllMusics = () => {
  removeGlobalReasonToBeMuted(REASON_MUSICS_ALL_MUTED);
};

// playing/paused
const globalReasonToBePausedSetSignal = signal(new Set());
export const useGlobalReasonToBePausedSet = () => {
  return globalReasonToBePausedSetSignal.value;
};
export const addGlobalReasonToBePaused = (reason) => {
  addToSetSignal(globalReasonToBePausedSetSignal, reason);
};
export const removeGlobalReasonToBePaused = (reason) => {
  deleteFromSetSignal(globalReasonToBePausedSetSignal, reason);
};
const REASON_ALL_MUSICS_PAUSED = "all_musics_paused";
const musicsAllPausedSignal = computed(() => {
  const globalReasonToBePausedSet = globalReasonToBePausedSetSignal.value;
  return globalReasonToBePausedSet.has(REASON_ALL_MUSICS_PAUSED);
});
export const useMusicsAllPaused = () => {
  return musicsAllPausedSignal.value;
};
export const pauseAllMusics = () => {
  addGlobalReasonToBePaused(REASON_ALL_MUSICS_PAUSED);
};
export const playAllMusics = () => {
  removeGlobalReasonToBePaused(REASON_ALL_MUSICS_PAUSED);
};

// global volume
const musicGlobalVolumeSignal = signal(1);
export const useMusicGlobalVolume = () => {
  return musicGlobalVolumeSignal.value;
};
export const setMusicGlobalVolume = (value) => {
  musicGlobalVolumeSignal.value = value;
};
// TODO: export a way to animate music global volume
// so that the music follows

const REASON_OTHER_MUSIC_PLAYING = "other_music_playing";

let currentMusic = null;
let musicPausedByOther = null;

const fadeInDefaults = {
  duration: 600,
  easing: EASING.EASE_IN_EXPO,
};
const fadeOutDefaults = {
  duration: 800,
  easing: EASING.EASE_OUT_EXPO,
};
export const music = ({
  name,
  url,
  startTime = 0,
  volume = 1,
  loop = true,
  autoplay,
  restartOnPlay,
  canPlayWhilePaused,
  muted,
  volumeAnimation = true,
  fadeIn = true,
  fadeOut = true,
}) => {
  if (fadeIn === true) {
    fadeIn = {};
  }
  if (fadeOut === true) {
    fadeOut = {};
  }
  const musicObject = {};

  const audio = new Audio(url);
  audio.loop = loop;
  if (startTime) {
    audio.currentTime = startTime;
  }

  const volumeAnimatedSignal = signal();
  const volumeSignal = signal(volume);
  const volumeCurrentSignal = computed(() => {
    const volumeGlobal = musicGlobalVolumeSignal.value;
    const volumeAnimated = volumeAnimatedSignal.value;
    const volume = volumeSignal.value;
    const volumeToSet = volumeAnimated === undefined ? volume : volumeAnimated;
    const volumeToSetResolved = volumeToSet * volumeGlobal;
    return volumeToSetResolved;
  });
  effect(() => {
    audio.volume = volumeCurrentSignal.value;
  });
  const setVolume = (
    value,
    { animated = volumeAnimation, duration = 500 } = {},
  ) => {
    if (!animated) {
      volumeSignal.value = value;
      volumeAnimatedSignal.value = undefined;
      return;
    }
    const from = volumeCurrentSignal.value;
    const to = value;
    animateVolume({
      from,
      to,
      duration,
      easing: to > from ? EASING.EASE_IN_EXPO : EASING.EASE_OUT_EXPO,
    });
  };
  let cancelVolumeAnimation = () => {};
  const animateVolume = (props) => {
    cancelVolumeAnimation();
    const volumeAnimation = animateNumber({
      // when doc is hidden the browser won't let the animation run
      // and onfinish() won't be called -> audio won't pause
      canPlayWhenDocumentIsHidden: true,
      effect: (volumeValue) => {
        volumeAnimatedSignal.value = volumeValue;
      },
      ...props,
    });
    cancelVolumeAnimation = () => {
      volumeAnimatedSignal.value = undefined;
      volumeAnimation.cancel();
      cancelVolumeAnimation = () => {};
    };
    volumeAnimation.finished.then(() => {
      volumeAnimatedSignal.value = undefined;
      cancelVolumeAnimation = () => {};
    });
    return volumeAnimation;
  };

  const reasonToBeMutedSetSignal = signal(new Set());
  effect(() => {
    const globalReasonToBeMutedSet = globalReasonToBeMutedSetSignal.value;
    const reasonToBeMutedSet = reasonToBeMutedSetSignal.value;
    if (globalReasonToBeMutedSet.size > 0 || reasonToBeMutedSet.size > 0) {
      audio.muted = true;
    } else {
      audio.muted = false;
    }
  });
  const addReasonToBeMuted = (reason) => {
    addToSetSignal(reasonToBeMutedSetSignal, reason);
  };
  const removeReasonToBeMuted = (reason) => {
    deleteFromSetSignal(reasonToBeMutedSetSignal, reason);
  };
  const REASON_MUTED_VIA_METHOD = "muted_via_method";
  const mute = () => {
    addReasonToBeMuted(REASON_MUTED_VIA_METHOD);
  };
  const unmute = () => {
    removeReasonToBeMuted(REASON_MUTED_VIA_METHOD);
  };
  if (muted) {
    mute();
  }

  const reasonToBePausedSetSignal = signal(new Set());
  const doPause = (reasonSet) => {
    if (
      currentMusic === musicObject &&
      musicPausedByOther &&
      reasonSet.size === 1 &&
      reasonSet.has(REASON_PAUSED_VIA_METHOD)
    ) {
      currentMusic = null;
      const toPlay = musicPausedByOther;
      musicPausedByOther = null;
      toPlay.removeReasonToBePaused(REASON_OTHER_MUSIC_PLAYING);
    } else {
      currentMusic = null;
    }
    if (!fadeOut) {
      audio.pause();
      return;
    }
    animateVolume({
      ...fadeOutDefaults,
      ...fadeOut,
      from: volume,
      to: 0,
      onfinish: () => {
        audio.pause();
      },
    });
  };
  const doPlay = () => {
    if (restartOnPlay) {
      audio.currentTime = startTime;
    }
    if (currentMusic) {
      const musicStopped = currentMusic;
      currentMusic.addReasonToBePaused(REASON_OTHER_MUSIC_PLAYING);
      musicPausedByOther = musicStopped;
    }
    currentMusic = musicObject;
    if (!fadeIn) {
      audio.play();
      return;
    }
    animateVolume({
      ...fadeInDefaults,
      ...fadeIn,
      from: 0,
      to: volume * musicGlobalVolumeSignal.value,
      onstart: () => {
        audio.play();
      },
    });
  };
  effect(() => {
    const globalReasonToBePausedSet = globalReasonToBePausedSetSignal.value;
    const reasonToBePausedSet = reasonToBePausedSetSignal.value;
    if (globalReasonToBePausedSet.size > 0 || reasonToBePausedSet.size > 0) {
      if (audio.paused) {
        return;
      }
      const reasonUnionSet = new Set([
        ...globalReasonToBePausedSet,
        ...reasonToBePausedSet,
      ]);
      doPause(reasonUnionSet);
      return;
    }
    if (!audio.paused) {
      return;
    }
    doPlay();
  });
  const addReasonToBePaused = (reason) => {
    addToSetSignal(reasonToBePausedSetSignal, reason);
  };
  const removeReasonToBePaused = (reason) => {
    deleteFromSetSignal(reasonToBePausedSetSignal, reason);
  };
  const REASON_PAUSED_VIA_METHOD = "paused_via_method";
  const pause = () => {
    addReasonToBePaused(REASON_PAUSED_VIA_METHOD);
  };
  const play = () => {
    removeReasonToBePaused(REASON_PAUSED_VIA_METHOD);
    removeReasonToBePaused(REASON_OTHER_MUSIC_PLAYING);
  };
  pause();
  if (autoplay) {
    play();
  }

  Object.assign(musicObject, {
    audio,
    canPlayWhilePaused,
    name,
    url,

    setVolume,
    volumeAtStart: volume,
    mute,
    unmute,

    reasonToBeMutedSetSignal,
    addReasonToBeMuted,
    removeReasonToBeMuted,

    play,
    pause,
    reasonToBePausedSetSignal,
    addReasonToBePaused,
    removeReasonToBePaused,
  });
  musicSet.add(musicObject);
  return musicObject;
};

export const useReasonsToBeMuted = (music) => {
  return Array.from(music.reasonToBeMutedSetSignal.value.values());
};
export const useReasonsToBePaused = (music) => {
  return Array.from(music.reasonToBePausedSetSignal.value.values());
};

const REASON_USER_INACTIVE = "user_inactive";
if (!userActivationFacade.ok) {
  addGlobalReasonToBePaused(REASON_USER_INACTIVE);
  userActivationFacade.addChangeCallback(() => {
    removeGlobalReasonToBePaused(REASON_USER_INACTIVE);
  });
}

// const pauseMusicUrl = import.meta.resolve("./pause.mp3");
// const pauseMusic = music({
//   name: "pause",
//   url: pauseMusicUrl,
//   volume: 0.2,
//   restartOnPlay: true,
//   canPlayWhilePaused: true,
// });
// pauseMusic.play();
// effect(() => {
//   if (audioPausedSignal.value) {
//     pauseMusic.play();
//   } else {
//     pauseMusic.pause();
//   }
// });
