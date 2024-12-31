import { effect } from "@preact/signals";
import { EASING } from "animation";
import { useEffect } from "preact/hooks";
import { animateNumber } from "../../packages/animation/src/animate_number.js";
import { mutedSignal } from "./sound_signals.js";
import { pausedSignal } from "/signals.js";

let debug = true;
let debugFade = false;
const { userActivation } = window.navigator;

const createAudio = ({
  url,
  startTime = 0,
  volume = 1,
  loop,
  autoplay,
  restartOnPlay = !loop,
  muted = mutedSignal.value,
  fading,
}) => {
  const audio = new Audio(url);
  audio.volume = volume;
  audio.loop = loop;
  audio.autoplay = autoplay;
  audio.muted = muted;
  if (startTime) {
    audio.currentTime = startTime;
  }

  let playing = false;
  audio.addEventListener("ended", () => {
    playing = false;
  });
  audio.addEventListener("abort", () => {});

  const destroy = () => {
    audio.removeEventListener("ended", () => {
      playing = false;
    });
    audio.pause();
  };

  let playRequested = false;
  const play = () => {
    const canPlaySound =
      userActivation.hasBeenActive || userActivation.isActive;
    playRequested = true;
    if (!canPlaySound) {
      return () => {};
    }
    if (restartOnPlay) {
      audio.currentTime = startTime;
    }
    if (fading) {
      audio.volume = 0;
      audio.play();
      const volumeFadein = fadeInVolume(audio, volume);
      return () => {
        audio.volume = volume;
        volumeFadein.cancel();
      };
    }
    audio.play();
    return () => {};
  };
  const pause = () => {
    if (!playRequested) {
      return () => {};
    }
    playRequested = false;
    if (fading) {
      const volumeFadeout = fadeOutVolume(audio, {
        onfinish: () => {
          audio.pause();
        },
      });
      return () => {
        audio.volume = volume;
        audio.pause();
        volumeFadeout.cancel();
      };
    }
    audio.pause();
    return () => {};
  };

  const mute = () => {
    audio.muted = true;
  };
  const unmute = () => {
    audio.muted = false;
  };

  effect(() => {
    const muted = mutedSignal.value;
    if (muted) {
      mute();
    } else {
      unmute();
      if (playRequested) {
        play();
      }
    }
  });

  return {
    media: audio,
    getPlayRequested: () => playRequested,
    play,
    pause,
    playing,
    mute,
    unmute,
    destroy,
  };
};
const fadeInVolume = (audio, volume, props) => {
  return animateNumber({
    from: 0,
    to: volume,
    duration: 500,
    easing: EASING.EASE_OUT_EXPO,
    onprogress: (volume) => {
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
    onprogress: (volume) => {
      if (debugFade) {
        console.log(`fadeout ${audio.src} volume to ${volume}`);
      }
      audio.volume = volume;
    },
    ...props,
  });
};

export const createSound = (props) => {
  const sound = createAudio(props);
  return sound;
};

let currentMusic = null;
let previousMusic = null;
const PAUSED_BY_GAME = {};
const PAUSED_BY_OTHER = {};

export const createBackgroundMusic = (
  { volume = 1, loop = true, fading = true, ...props },
  { playWhilePaused } = {},
) => {
  const audio = createAudio({ volume, loop, fading, ...props });

  let playRequested = false;

  const music = {
    ...audio,
    src: audio.media.src,
    play: () => {
      playRequested = true;
      if (currentMusic) {
        if (debug) {
          console.log(
            "play",
            music.src,
            `-> pause ${currentMusic.src} and store as music to resume`,
          );
        }
        previousMusic = currentMusic;
        currentMusic.pause(PAUSED_BY_OTHER);
      }
      if (debug) {
        console.log("set current music to", music.src);
      }
      currentMusic = music;
      return audio.play();
    },
    pause: (reason) => {
      if (reason !== PAUSED_BY_GAME && reason !== PAUSED_BY_OTHER) {
        playRequested = false;
      }
      if (music === currentMusic && previousMusic !== currentMusic) {
        if (debug) {
          console.log("pausing", music.src, "replay", previousMusic.src);
        }
        previousMusic.play();
        previousMusic = null;
      }
      currentMusic = null;
      return audio.pause();
    },
  };

  effect(() => {
    const gamePaused = pausedSignal.value;
    if (playWhilePaused) {
      if (gamePaused) {
        music.play();
      } else {
        music.pause();
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (gamePaused) {
        music.pause(PAUSED_BY_GAME);
      } else if (playRequested) {
        music.play();
      }
    }
  });

  return music;
};

export const useAudio = (audio) => {
  const { play, pause } = audio;

  useEffect(() => {
    return () => {
      audio.pause();
    };
  }, []);

  return [play, pause];
};
