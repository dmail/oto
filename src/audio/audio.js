/*
 * TODO: lorsqu'on met en pause la musique ne fond ne repdrends pas correctement
 * je comprends pas bien ce qu'il se passe
 *
 * a priori je peux m'en sortir avec un truc fait différement
 *
 *
 */

import { effect } from "@preact/signals";
import { animateNumber, EASING } from "animation";
import { audioPausedSignal, mutedSignal } from "./audio_signals.js";

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
  muted,
  fading,
  fadingDuration = 500,
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

  const pausedReasonSet = new Set();
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
    if (!fading) {
      audio.play();
      return;
    }
    audio.volume = 0;
    audio.play();
    const volumeFadein = fadeInVolume(audio, volume, {
      duration: fadingDuration,
    });
    await volumeFadein.finished;
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
    if (!fading) {
      audio.pause();
      return;
    }
    const volumeFadeout = fadeOutVolume(audio, {
      onfinish: () => {
        audio.pause();
      },
      duration: fadingDuration,
    });
    await volumeFadeout.finished;
  };
  if (autoplay) {
    audio.autoplay = true;
  } else {
    pause();
  }

  effect(() => {
    const muted = mutedSignal.value;
    if (muted) {
      mute(REASON_GLOBALLY_REQUESTED);
    } else {
      unmute(REASON_GLOBALLY_REQUESTED);
    }
  });

  effect(() => {
    const paused = audioPausedSignal.value;
    if (paused) {
      pause(REASON_GLOBALLY_REQUESTED);
    } else {
      play(REASON_GLOBALLY_REQUESTED);
    }
  });

  Object.assign(media, {
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
    ...props,
  });
  return sound;
};

const REASON_OTHER_MUSIC_PLAYING = {
  id: "other_music_playing",
  // if there only reason not to play is REASON_OTHER_MUSIC_PLAYING
  // then we'll again stop the other to favor this one
  isWeak: true,
};
let currentMusic = null;
let musicPausedByOther = null;
export const music = ({ volume = 1, loop = true, fading = true, ...props }) => {
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
    fading,
    onPlay: () => {
      if (currentMusic && currentMusic !== music) {
        replaceCurrentMusic();
      }
      if (debug) {
        console.log(`play ${music.name}`);
      }
      currentMusic = music;
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
      if (music === currentMusic && musicPausedByOther) {
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

  return music;
};

// const pauseMusicUrl = import.meta.resolve("./pause.mp3");
// music(
//   {
//     url: pauseMusicUrl,
//     volume: 0.2,
//     restartOnPlay: true,
//   },
//   {
//     playWhilePaused: true,
//   },
// );
