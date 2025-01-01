/*
 * NICE TO HAVE
 *
 * - decrease/increase volume of all sounds / musics
 * (we would do it relatively to the current sound of the sound/music)
 */

import { animateNumber, EASING } from "animation";
import { userActivationFacade } from "./user_activation.js";

const globalReasonToBePausedSet = new Set();
const addGlobalReasonToBePaused = (reason) => {
  globalReasonToBePausedSet.add(reason);
  for (const music of musicSet) {
    music.addReasonToBePaused(reason);
  }
};
const removeGlobalReasonToBePaused = (reason) => {
  globalReasonToBePausedSet.delete(reason);
  for (const music of musicSet) {
    music.removeReasonToBePaused(reason);
  }
};

const REASON_USER_INACTIVE = "user_inactive";
if (!userActivationFacade.ok) {
  addGlobalReasonToBePaused(REASON_USER_INACTIVE);
  userActivationFacade.addChangeCallback(() => {
    removeGlobalReasonToBePaused(REASON_USER_INACTIVE);
  });
}

export const applyGamePausedEffectOnAudio = () => {
  decreaseVolume();
};
export const applyGamePlayingEffectOnAudio = () => {
  restoreVolume();
};

let debug = true;
let debugFade = false;
const { userActivation } = window.navigator;

const REASON_GLOBALLY_REQUESTED = {
  id: "globally_requested",
};
const REASON_EXPLICITELY_REQUESTED_BY_METHOD_CALL = {
  id: "explicitely_requested_by_method_call",
};

const createAudio = ({
  name,
  url,
  startTime = 0,
  volume = 1,
  loop,
  autoplay,
  restartOnPlay,
  canPlayWhilePaused,
  muted,
  fadeIn,
  fadeOut,
  fadeInDuration = 600,
  fadeOutDuration = 800,
  onPlay = () => {},
  onPause = () => {},
}) => {
  const media = {};

  const audio = new Audio(url);
  audio.volume = volume;
  audio.loop = loop;
  if (startTime) {
    audio.currentTime = startTime;
  }

  const mutedReasonSet = new Set();
  const mute = (reason = REASON_EXPLICITELY_REQUESTED_BY_METHOD_CALL) => {
    mutedReasonSet.add(reason);
    audio.muted = true;
  };
  const unmute = (reason = REASON_EXPLICITELY_REQUESTED_BY_METHOD_CALL) => {
    mutedReasonSet.delete(reason);
    if (mutedReasonSet.size > 0) {
      return;
    }
    audio.muted = false;
  };
  if (muted) {
    mute();
  }

  let cancelFadeIn = () => {};
  let cancelFadeOut = () => {};

  const reasonToBePausedSet = new Set();
  const addReasonToBePaused = (reason) => {
    reasonToBePausedSet.add(reason);
    if (reasonToBePausedSet.size === 1) {
      pause(reason);
    }
  };

  const play = async (reason = REASON_EXPLICITELY_REQUESTED_BY_METHOD_CALL) => {
    pausedReasonSet.delete(reason);
    for (const reason of pausedReasonSet) {
      if (reason.isWeak) {
        pausedReasonSet.delete(reason);
      }
    }
    if (media.onPausedReasonSetChange) {
      media.onPausedReasonSetChange();
    }
    if (pausedReasonSet.size > 0) {
      return;
    }
    const canPlaySound =
      userActivation.hasBeenActive || userActivation.isActive;
    if (!canPlaySound) {
      return;
    }
    if (restartOnPlay) {
      audio.currentTime = startTime;
    }
    onPlay();
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
    await volumeFadein.finished;
    cancelFadeIn = () => {};
  };
  const pause = async (
    reason = REASON_EXPLICITELY_REQUESTED_BY_METHOD_CALL,
  ) => {
    pausedReasonSet.add(reason);
    if (media.onPausedReasonSetChange) {
      media.onPausedReasonSetChange();
    }
    if (audio.paused) {
      return;
    }
    onPause();
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
    await volumeFadeout.finished;
    cancelFadeOut = () => {};
  };
  if (autoplay) {
    audio.autoplay = true;
  } else {
    pause();
  }

  Object.assign(media, {
    volumeAtStart: volume,
    canPlayWhilePaused,
    name,
    url,
    audio,
    play,
    pause,
    mute,
    unmute,
    mutedReasonSet,
    pausedReasonSet,
  });
  return media;
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

export const sound = (props) => {
  const sound = createAudio({
    restartOnPlay: true,
    canPlayWhilePaused: true,
    ...props,
  });
  return sound;
};

const musicSet = new Set();
const REASON_OTHER_MUSIC_PLAYING = {
  id: "other_music_playing",
  // if there only reason not to play is REASON_OTHER_MUSIC_PLAYING
  // then we'll again stop the other to favor this one
  isWeak: true,
};
let currentMusic = null;
let musicPausedByOther = null;
export const music = ({
  volume = 1,
  loop = true,
  fadeIn = true,
  fadeOut = true,
  ...props
}) => {
  const replaceCurrentMusic = () => {
    if (debug) {
      console.log(
        "about to play",
        music.name,
        `-> stop current music (${currentMusic.name})`,
      );
    }
    const musicStopped = currentMusic;
    currentMusic.pause(REASON_OTHER_MUSIC_PLAYING);
    musicPausedByOther = musicStopped;
  };

  const music = createAudio({
    volume,
    loop,
    fadeIn,
    fadeOut,
    onPlay: () => {
      if (currentMusic && currentMusic !== music) {
        replaceCurrentMusic();
      }
      if (debug) {
        console.log(`play ${music.name}`);
      }
      currentMusic = music;
      window.currentMusic = music;
    },
    onPause: () => {
      if (debug) {
        console.log(`pause ${music.name}`);
        console.log({
          music: music.name,
          currentMusic: currentMusic?.name,
          musicPausedByOther: musicPausedByOther?.name,
        });
      }
      const pausedOnlyByGlobal =
        music.pausedReasonSet.size === 1 &&
        music.pausedReasonSet.has(REASON_GLOBALLY_REQUESTED);
      if (music === currentMusic && musicPausedByOther && !pausedOnlyByGlobal) {
        currentMusic = null;
        if (debug) {
          console.log(
            `(${music.url}) has stopped -> resume ${musicPausedByOther.name}`,
          );
        }
        const toPlay = musicPausedByOther;
        musicPausedByOther = null;
        toPlay.play(REASON_OTHER_MUSIC_PLAYING);
      } else {
        currentMusic = null;
      }
    },
    ...props,
  });

  musicSet.add(music);

  return music;
};

export const muteMusic = () => {
  for (const music of musicSet) {
    music.mute(REASON_GLOBALLY_REQUESTED);
  }
};
export const unmuteMusic = () => {
  for (const music of musicSet) {
    music.unmute(REASON_GLOBALLY_REQUESTED);
  }
};
export const pauseMusic = () => {
  for (const music of musicSet) {
    if (music.canPlayWhilePaused) {
      continue;
    }
    music.pause(REASON_GLOBALLY_REQUESTED);
  }
};
export const playMusic = () => {
  for (const music of musicSet) {
    music.play(REASON_GLOBALLY_REQUESTED);
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
