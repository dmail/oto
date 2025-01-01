import { animateNumber, EASING } from "animation";
import { userActivationFacade } from "../user_activation.js";

// let debug = true;
let debugFade = false;

const musicSet = new Set();
const globalReasonToBeMutedSet = new Set();
const globalReasonToBePausedSet = new Set();
const REASON_USER_INACTIVE = "user_inactive";
const REASON_METHOD_CALL = "method_call";
const REASON_GLOBAL_CALL = "global_call";
const REASON_OTHER_MUSIC_PLAYING = "other_music_playing";

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
  fadeIn = true,
  fadeOut = true,
  fadeInDuration = 600,
  fadeOutDuration = 800,
}) => {
  const musicObject = {};

  const audio = new Audio(url);
  audio.volume = volume;
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
    if (reasonToBeMutedSet.size > 1) {
      audio.muted = true;
    }
  };
  const removeReasonToBeMuted = (reason) => {
    reasonToBeMutedSet.delete(reason);
    if (musicObject.onReasonToBeMutedChange) {
      musicObject.onReasonToBeMutedChange();
    }
    if (reasonToBeMutedSet.size === 0) {
      audio.muted = false;
    }
  };
  const mute = () => {
    addReasonToBeMuted(REASON_METHOD_CALL);
    audio.muted = true;
  };
  const unmute = () => {
    removeReasonToBeMuted(REASON_METHOD_CALL);
  };
  if (muted) {
    mute();
  }

  const reasonToBePausedSet = new Set(globalReasonToBePausedSet);
  let cancelFadeIn = () => {};
  let cancelFadeOut = () => {};
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
    cancelFadeIn();
    cancelFadeOut();
    const volumeFadeout = fadeOutVolume(audio, {
      onfinish: () => {
        audio.pause();
      },
      duration: fadeOutDuration,
    });
    cancelFadeOut = () => {
      volumeFadeout.cancel();
    };
    volumeFadeout.finished.then(() => {
      cancelFadeOut = () => {};
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
    cancelFadeIn();
    cancelFadeOut();
    audio.volume = 0;
    audio.play();
    const volumeFadein = fadeInVolume(audio, volume, {
      duration: fadeInDuration,
    });
    cancelFadeIn = () => {
      volumeFadein.cancel();
    };
    volumeFadein.finished.then(() => {
      cancelFadeIn = () => {};
    });
  };
  const pause = () => {
    addReasonToBePaused(REASON_METHOD_CALL);
  };
  const play = () => {
    removeReasonToBePaused(REASON_METHOD_CALL);
  };
  if (autoplay) {
    play();
  } else {
    pause();
  }

  Object.assign(musicObject, {
    audio,
    canPlayWhilePaused,
    name,
    url,

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

const fadeInVolume = (audio, volume, props) => {
  return animateNumber({
    from: 0,
    to: volume,
    duration: 500,
    easing: EASING.EASE_IN_EXPO,
    effect: (volume) => {
      if (debugFade) {
        console.log(`fadein ${audio.src} volume to ${volume}`);
      }
      audio.volume = volume;
    },
    ...props,
  });
};
const fadeOutVolume = (audio, props) => {
  return animateNumber({
    from: audio.volume,
    to: 0,
    duration: 500,
    easing: EASING.EASE_OUT_EXPO,
    effect: (volume) => {
      if (debugFade) {
        console.log(`fadeout ${audio.src} volume to ${volume}`);
      }
      audio.volume = volume;
    },
    ...props,
  });
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
export const decreaseVolume = () => {
  for (const music of musicSet) {
    music.audio.volume = music.audio.volume * 0.2;
  }
};
export const restoreVolume = () => {
  for (const music of musicSet) {
    music.audio.volume = music.volumeAtStart;
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
