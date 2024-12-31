import { useSignalEffect } from "@preact/signals";
import { EASING } from "animation";
import { useAudio } from "hooks/use_audio.js";
import { useCallback, useEffect } from "preact/hooks";
import { animateNumber } from "../../packages/animation/src/animate_number.js";
import { mutedSignal } from "./sound_signals.js";
import { pausedSignal } from "/signals.js";

export const useSound = (props) => {
  const { play, pause, mute, unmute } = useAudio({
    ...props,
    muted: mutedSignal.value,
  });

  useSignalEffect(() => {
    const muted = mutedSignal.value;
    if (muted) {
      mute();
    } else {
      unmute();
    }
  });

  return [play, pause];
};

export const useBackgroundMusic = (
  { volume = 1, ...props },
  { canPlayWhilePaused } = {},
) => {
  const { play, pause, mute, unmute, audio } = useAudio({
    loop: true,
    autoplay: true,
    muted: mutedSignal.value,
    volume,
    ...props,
  });

  const fadeIn = useCallback(() => {
    audio.volume = volume;
    play();
    const volumeFadein = fadeInVolume(audio, volume);
    return () => {
      volumeFadein.cancel();
    };
  }, [volume, audio]);

  const fadeOut = useCallback(() => {
    const volumeFadeout = fadeOutVolume(audio, {
      onfinish: () => {
        pause();
      },
    });
    return () => {
      volumeFadeout.cancel();
    };
  }, [audio]);

  const gamePaused = pausedSignal.value;
  useEffect(() => {
    if (canPlayWhilePaused) {
      return null;
    }
    if (gamePaused) {
      return fadeOut();
    }
    return fadeIn();
  }, [canPlayWhilePaused, gamePaused, audio]);

  useSignalEffect(() => {
    const muted = mutedSignal.value;
    if (muted) {
      mute();
      return null;
    }
    unmute();
    return fadeIn();
  });

  return [fadeIn, fadeOut];
};

const fadeOutVolume = (audio, props) => {
  return animateNumber({
    from: audio.volume,
    to: 0,
    duration: 500,
    easing: EASING.EASE_OUT_EXPO,
    onprogress: (volume) => {
      // console.log("fadeout volume to ", volume);
      audio.volume = volume;
    },
    ...props,
  });
};

const fadeInVolume = (audio, volume, props) => {
  return animateNumber({
    from: audio.volume,
    to: volume,
    duration: 500,
    easing: EASING.EASE_OUT_EXPO,
    onprogress: (volume) => {
      // console.log("fadein volume to ", volume);
      audio.volume = volume;
    },
    ...props,
  });
};
