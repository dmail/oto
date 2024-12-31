import { useSignalEffect } from "@preact/signals";
import { useAudio } from "hooks/use_audio.js";
import { mutedSignal } from "./sound_signals.js";

export const useSound = (props) => {
  const [playSound, pauseSound] = useAudio(props);
  return [playSound, pauseSound];
};

export const useBackgroundMusic = (props) => {
  const [playMusic, pauseMusic] = useAudio(props);

  useSignalEffect(() => {
    const muted = mutedSignal.value;
    if (muted) {
      pauseMusic();
    } else {
      playMusic();
    }
  });

  return [playMusic, pauseMusic];
};
