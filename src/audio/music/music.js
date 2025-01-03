import { animateNumber, EASING } from "animation";
import { userActivationFacade } from "../user_activation.js";

let debug = true;

const musicSet = new Set();
const globalReasonToBeMutedSet = new Set();
const globalReasonToBePausedSet = new Set();
const REASON_USER_INACTIVE = "user_inactive";
const REASON_METHOD_CALL = "method_call";
const REASON_GLOBAL_CALL = "global_call";
const REASON_OTHER_MUSIC_PLAYING = "other_music_playing";
let musicGlobalVolume = 1;
const musicGlobalVolumeChangeCallbackSet = new Set();

export const addGlobalReasonToBeMuted = (reason) => {
  globalReasonToBeMutedSet.add(reason);
  for (const music of musicSet) {
    music.addReasonToBeMuted(reason);
  }
};
export const removeGlobalReasonToBeMuted = (reason) => {
  globalReasonToBeMutedSet.delete(reason);
  for (const music of musicSet) {
    music.removeReasonToBeMuted(reason);
  }
};
export const setMusicGlobalVolume = (value) => {
  if (value === musicGlobalVolume) {
    return;
  }
  if (debug) {
    console.log("set global volume to", value);
  }
  musicGlobalVolume = value;
  for (const musicGlobalVolumeChangeCallback of musicGlobalVolumeChangeCallbackSet) {
    musicGlobalVolumeChangeCallback();
  }
};

export const addGlobalReasonToBePaused = (reason) => {
  globalReasonToBePausedSet.add(reason);
  for (const music of musicSet) {
    music.addReasonToBePaused(reason);
  }
};
export const removeGlobalReasonToBePaused = (reason) => {
  globalReasonToBePausedSet.delete(reason);
  for (const music of musicSet) {
    // console.log(`remove global reason to be paused from ${music.name}`);
    music.removeReasonToBePaused(reason);
  }
};

if (!userActivationFacade.ok) {
  addGlobalReasonToBePaused(REASON_USER_INACTIVE);
  userActivationFacade.addChangeCallback(() => {
    removeGlobalReasonToBePaused(REASON_USER_INACTIVE);
  });
}

let currentMusic = null;
let musicPausedByOther = null;
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
  fadeInDuration = 600,
  fadeOutDuration = 800,
}) => {
  const musicObject = {};

  const audio = new Audio(url);
  audio.loop = loop;
  if (startTime) {
    audio.currentTime = startTime;
  }

  const reasonToBeMutedSet = new Set(globalReasonToBeMutedSet);
  const addReasonToBeMuted = (reason) => {
    reasonToBeMutedSet.add(reason);
    if (musicObject.onReasonToBeMutedChange) {
      musicObject.onReasonToBeMutedChange();
    }
    if (audio.muted) {
      return;
    }
    audio.muted = true;
  };
  const removeReasonToBeMuted = (reason) => {
    reasonToBeMutedSet.delete(reason);
    if (musicObject.onReasonToBeMutedChange) {
      musicObject.onReasonToBeMutedChange();
    }
    if (reasonToBeMutedSet.size > 0) {
      return;
    }
    if (!audio.muted) {
      return;
    }
    audio.muted = false;
  };
  const mute = () => {
    addReasonToBeMuted(REASON_METHOD_CALL);
    audio.muted = true;
  };
  const unmute = () => {
    removeReasonToBeMuted(REASON_METHOD_CALL);
  };
  if (reasonToBeMutedSet.size > 0) {
    audio.muted = true;
  }
  if (muted) {
    mute();
  }

  let volumeAnimated;
  let volumeAbsolute = volume * musicGlobalVolume;
  const updateVolume = () => {
    volumeAbsolute =
      volumeAnimated === undefined ? volumeAbsolute : volumeAnimated;
    audio.volume = volumeAbsolute;
  };
  const setAnimatedVolume = (value) => {
    volumeAnimated = value;
    updateVolume();
  };
  const setVolume = (value, { persistent = true } = {}) => {
    const fromVolume = volumeAbsolute;
    const toVolume = value * musicGlobalVolume;

    if (persistent) {
      volume = value;
    }
    if (!volumeAnimation) {
      volumeAbsolute = toVolume;
      updateVolume();
      return;
    }
    animateVolume({
      persistent,
      from: fromVolume,
      to: toVolume,
      easing:
        toVolume > fromVolume ? EASING.EASE_IN_EXPO : EASING.EASE_OUT_EXPO,
      duration: 500,
    });
  };
  let cancelVolumeAnimation = () => {};
  const animateVolume = ({
    from,
    to,
    easing = EASING.EASE_IN_EXPO,
    duration = 500,
    ...props
  }) => {
    cancelVolumeAnimation();
    const volumeAnimation = animateNumber({
      // when doc is hidden the browser won't let the animation run
      // and onfinish() won't be called -> audio won't pause
      canPlayWhenDocumentIsHidden: true,
      from,
      to,
      duration,
      easing,
      effect: (volumeValue) => {
        setAnimatedVolume(volumeValue);
      },
      ...props,
    });
    cancelVolumeAnimation = () => {
      volumeAnimated = undefined;
      volumeAnimation.cancel();
    };
    volumeAnimation.finished.then(() => {
      volumeAnimated = undefined;
      cancelVolumeAnimation = () => {};
    });
    return volumeAnimation;
  };
  updateVolume();
  musicGlobalVolumeChangeCallbackSet.add(() => {
    setVolume(volume, { persistent: false });
  });

  const reasonToBePausedSet = new Set(globalReasonToBePausedSet);
  const addReasonToBePaused = (reason) => {
    reasonToBePausedSet.add(reason);
    if (musicObject.onReasonToBePausedChange) {
      musicObject.onReasonToBePausedChange();
    }
    if (audio.paused) {
      return;
    }
    if (
      currentMusic === musicObject &&
      musicPausedByOther &&
      reason === REASON_METHOD_CALL
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
      from: volume * musicGlobalVolume,
      to: 0,
      duration: fadeOutDuration,
      easing: EASING.EASE_IN_EXPO,
      onfinish: () => {
        audio.pause();
      },
    });
  };
  const removeReasonToBePaused = (reason) => {
    reasonToBePausedSet.delete(reason);
    if (reason === REASON_METHOD_CALL) {
      reasonToBePausedSet.delete(REASON_OTHER_MUSIC_PLAYING);
    }
    if (musicObject.onReasonToBePausedChange) {
      musicObject.onReasonToBePausedChange();
    }
    if (reasonToBePausedSet.size > 0) {
      return;
    }
    if (restartOnPlay) {
      audio.currentTime = startTime;
    }
    if (reason === REASON_METHOD_CALL) {
      if (currentMusic) {
        const musicStopped = currentMusic;
        currentMusic.addReasonToBePaused(REASON_OTHER_MUSIC_PLAYING);
        musicPausedByOther = musicStopped;
      }
    }
    currentMusic = musicObject;
    if (!fadeIn) {
      audio.play();
      return;
    }
    setAnimatedVolume(0);
    audio.play();
    animateVolume({
      from: 0,
      to: volume * musicGlobalVolume,
      duration: fadeInDuration,
      easing: EASING.EASE_OUT_EXPO,
    });
  };
  const pause = () => {
    addReasonToBePaused(REASON_METHOD_CALL);
  };
  const play = () => {
    removeReasonToBePaused(REASON_METHOD_CALL);
  };
  if (autoplay) {
    if (reasonToBePausedSet.size === 0) {
      play();
    }
  } else {
    pause();
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

    reasonToBeMutedSet,
    addReasonToBeMuted,
    removeReasonToBeMuted,

    play,
    pause,
    reasonToBePausedSet,
    addReasonToBePaused,
    removeReasonToBePaused,
  });
  musicSet.add(musicObject);
  return musicObject;
};

export const muteMusic = () => {
  addGlobalReasonToBeMuted(REASON_GLOBAL_CALL);
};
export const unmuteMusic = () => {
  removeGlobalReasonToBeMuted(REASON_GLOBAL_CALL);
};
export const pauseMusic = () => {
  for (const music of musicSet) {
    if (music.canPlayWhilePaused) {
      continue;
    }
    music.addReasonToBePaused(REASON_GLOBAL_CALL);
  }
};
export const playMusic = () => {
  for (const music of musicSet) {
    music.removeReasonToBePaused(REASON_GLOBAL_CALL);
  }
};

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
